import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";
import { checkRateLimit } from "@/server/services/rate-limit";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentMessageId: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, conversationId } = await params;

    // Verify workspace membership
    await requireWorkspaceMember(workspaceId, session.user.id);

    // Verify conversation belongs to workspace
    const conversationExist = await prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
      select: { id: true, documentId: true },
    });

    if (!conversationExist) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify role-based access
    await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN", "MEMBER"], session.user.id);

    // Rate limiting scoped to user + workspace
    const rateLimitKey = \`chat:\${session.user.id}:workspace:\${workspaceId}\`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 30, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate the user message
    const body = await request.json().catch(() => null);
    const validated = messageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Message content is required and must be 1-2000 characters" },
        { status: 400 }
      );
    }

    const userContent = validated.data.content;

    // Persist the user message first
    // Build message create data - optionally include parentMessageId if provided and valid
    const messageCreateData = {
      conversationId: conversationExist.id,
      userId: session!.user!.id,
      role: "USER",
      content: userContent,
    };

    // If parentMessageId is provided, validate it belongs to the same conversation
    if (body.parentMessageId) {
      const parentMessageExist = await prisma.message.findFirst({
        where: {
          id: body.parentMessageId,
          conversationId: conversationExist.id,
        },
      });

      if (!parentMessageExist) {
        return NextResponse.json(
          { error: "Parent message not found or does not belong to this conversation" },
          { status: 400 }
        );
      }

      messageCreateData.parentMessageId = body.parentMessageId;
    }

    await prisma.message.create({
      data: messageCreateData,
    });

    // Execute RAG pipeline
    let citations: { label: string; documentId: string; chunkId: string; documentTitle: string; chunkIndex: number }[] = [];

    // Assistant message from RAG pipeline
    let assistantMessage: string | undefined = undefined;

    try {
      console.error("[CHAT] EMBEDDING start");
      const { getEmbeddingProvider } = await import("@/server/services/embeddings");
      const provider = getEmbeddingProvider();
      console.error("[CHAT] EMBEDDING provider obtained");
      const [vector] = await provider.embed([userContent]);
      console.error("[CHAT] EMBEDDING success, dim:", vector.length);

      console.error("[CHAT] VECTOR_SEARCH start");
      const { searchWorkspace } = await import("@/server/services/search/search-service");
      const searchResults = await searchWorkspace(workspaceId, userContent, {
        topK: 6,
        documentId: conversationExist.documentId ?? undefined,
      });
      console.error("[CHAT] VECTOR_SEARCH completed, results count:", searchResults.length);

      console.error("[CHAT] CONTEXT_BUILD start");
      const { buildContext } = await import("@/server/services/rag");
      const contextItems = buildContext(searchResults);
      console.error("[CHAT] CONTEXT_BUILD completed, contextItems length:", contextItems.length);

      console.error("[CHAT] GEMINI/CITATIONS start");
      const { parseCitations } = await import("@/server/services/rag");
      citations = parseCitations("", searchResults);
      console.error("[CHAT] GEMINI/CITATIONS completed, citations count:", citations.length);

      // Generate response based on context
      if (contextItems.length > 0) {
        const contextLines = contextItems.map(
          (item, i) => `[${i + 1}] ${item.fileName}, Chunk ${item.chunkIndex}: ${item.content.substring(0, 200)}${item.content.length > 200 ? "..." : ""}`
        );
        assistantMessage = `Based on the provided documents:\n\n${contextLines.join("\n\n")}\n\nI found relevant information in the workspace documents. However, for a full Gemini-generated response, the LLM call would be integrated here.`;
      } else {
        assistantMessage = "I don't have enough information from the provided documents to answer this question. Please ensure the document has been indexed and try again.";
      }
    } catch (llmError) {
      // Handle Gemini failure gracefully
      console.error("Gemini LLM error:", llmError);

      // Persist a system note about the failure
      await prisma.message.create({
        data: {
          conversationId,
          userId: session.user.id,
          role: "SYSTEM",
          content: "I'm sorry, I encountered an error generating the response. Please try again.",
        },
      });

      return NextResponse.json({
        userMessage: await prisma.message.findFirst({
          where: { conversationId, role: "USER" },
          select: { content: true, createdAt: true },
        }),
        error: "I'm sorry, I encountered an error. Please try again.",
      },
      { status: 500 }
    );
    }

    return NextResponse.json({
      userMessage: await prisma.message.findFirst({
        where: { conversationId, role: "USER" },
        select: { content: true, createdAt: true },
      }),
      assistantMessage,
      citations,
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, conversationId } = await params;

    // Verify workspace membership
    await requireWorkspaceMember(workspaceId, session.user.id);

    // Verify conversation belongs to workspace
    const conversationExist = await prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
      select: { id: true, title: true },
    });

    if (!conversationExist) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify role-based access
    await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN", "MEMBER"], session.user.id);

    // Load all messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      messages,
      conversationTitle: conversationExist.title,
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("Load messages error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
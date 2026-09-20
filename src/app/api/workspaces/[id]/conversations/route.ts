import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { AppError, NotFoundError, ForbiddenError } from "@/server/validation/errors";
import {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from "@/server/services/conversations/conversation-service";

const conversationIdSchema = z.string().uuid();
const titleSchema = z.string().trim().min(1).max(200);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const userId = session.user.id;

    const body = await request.json().catch(() => null);
    const validated = titleSchema.safeParse(body?.title);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Title is required and must be 1-200 characters" },
        { status: 400 }
      );
    }

    const conversation = await createConversation(workspaceId, userId, validated.data);

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: workspaceId } = await params;

    const conversations = await listConversations(workspaceId, userId);

    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("List conversations error:", error);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { checkRateLimit } from "@/server/services/rate-limit";
import {
  MAX_SEARCH_QUERY_LENGTH,
  MAX_TOP_K,
  searchWorkspace,
} from "@/server/services/search/search-service";
import { z } from "zod";

const workspaceIdSchema = z.string().uuid();

const searchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query is required")
    .max(MAX_SEARCH_QUERY_LENGTH, `Query must be at most ${MAX_SEARCH_QUERY_LENGTH} characters`),
  topK: z.number().int().min(1).max(MAX_TOP_K).optional(),
  documentId: z.string().uuid().optional(),
});

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
    if (!workspaceIdSchema.safeParse(workspaceId).success) {
      return NextResponse.json({ error: "Invalid workspace id" }, { status: 400 });
    }

    await requireWorkspaceMember(workspaceId, session.user.id);

    const rateLimitKey = `user:${session.user.id}:workspace:${workspaceId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 20, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const validated = searchSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const results = await searchWorkspace(workspaceId, validated.data.query, {
      topK: validated.data.topK,
      documentId: validated.data.documentId,
    });

    return NextResponse.json({ results });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search documents" }, { status: 500 });
  }
}
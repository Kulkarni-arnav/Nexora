import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { retryDocument, serializeDocument } from "@/server/services/documents/document-service";
import { z } from "zod";

const workspaceIdSchema = z.string().uuid();
const documentIdSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, documentId } = await params;
    if (!workspaceIdSchema.safeParse(workspaceId).success) {
      return NextResponse.json({ error: "Invalid workspace id" }, { status: 400 });
    }
    if (!documentIdSchema.safeParse(documentId).success) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"], session.user.id);

    const document = await retryDocument(workspaceId, documentId);

    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Retry document error:", error);
    return NextResponse.json({ error: "Failed to retry document" }, { status: 500 });
  }
}
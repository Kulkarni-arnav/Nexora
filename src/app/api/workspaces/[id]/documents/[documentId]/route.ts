import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { prisma } from "@/server/db/client";
import { z } from "zod";
import { deleteDocument, getDocument, serializeDocument } from "@/server/services/documents/document-service";

const workspaceIdSchema = z.string().uuid();
const documentIdSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const chunks = searchParams.get('chunks');

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

    await requireWorkspaceMember(workspaceId, session.user.id);

    if (chunks) {
      // Return chunks for this document
      const chunksList = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: "asc" },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          tokenCount: true,
        },
      });

      return NextResponse.json({ chunks: chunksList });
    }

    // Return document details
    const document = await getDocument(workspaceId, documentId);

    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Get document/chunks error:", error);
    return NextResponse.json({ error: "Failed to get document/chunks" }, { status: 500 });
  }
}

export async function DELETE(
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

    await deleteDocument(workspaceId, documentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

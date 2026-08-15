import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { checkRateLimit } from "@/server/services/rate-limit";
import { listDocuments, serializeDocument, uploadDocument } from "@/server/services/documents/document-service";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/server/services/documents/config";
import { z } from "zod";

const workspaceIdSchema = z.string().uuid();
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function GET(
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

    const documents = await listDocuments(workspaceId);

    return NextResponse.json({ documents: documents.map(serializeDocument) });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

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

    await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN", "MEMBER"], session.user.id);

    const rateLimitKey = `user:${session.user.id}:workspace:${workspaceId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 10, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_DOCUMENT_SIZE_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the maximum allowed size (10 MB)" },
        { status: 413 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());

    if (data.length === 0) {
      return NextResponse.json({ error: "The uploaded file is empty" }, { status: 400 });
    }
    if (data.length > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the maximum allowed size (10 MB)" },
        { status: 413 }
      );
    }

    const document = await uploadDocument({
      workspaceId,
      fileName: file.name,
      mimeType: file.type || null,
      data,
    });

    return NextResponse.json(
      { document: serializeDocument(document) },
      { status: 201 }
    );
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Upload document error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
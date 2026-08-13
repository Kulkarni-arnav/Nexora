import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceById, updateWorkspace, deleteWorkspace, getWorkspaceMembers } from "@/server/repositories/workspace";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().optional(),
});

const workspaceIdSchema = z.string().uuid();

function invalidIdResponse() {
  return NextResponse.json({ error: "Invalid workspace id" }, { status: 400 });
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

    const { id } = await params;
    if (!workspaceIdSchema.safeParse(id).success) {
      return invalidIdResponse();
    }
    await requireWorkspaceMember(id, session.user.id);

    const workspace = await getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const members = await getWorkspaceMembers(id);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        ownerId: workspace.ownerId,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        memberCount: workspace._count.members,
        documentCount: workspace._count.documents,
        conversationCount: workspace._count.conversations,
        owner: workspace.owner,
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          createdAt: m.createdAt,
          user: m.user,
        })),
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Get workspace error:", error);
    return NextResponse.json({ error: "Failed to get workspace" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!workspaceIdSchema.safeParse(id).success) {
      return invalidIdResponse();
    }
    await requireWorkspaceRole(id, ["OWNER", "ADMIN"], session.user.id);

    const body = await request.json();
    const validated = updateWorkspaceSchema.parse(body);

    const workspace = await updateWorkspace(id, session.user.id, validated);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Update workspace error:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!workspaceIdSchema.safeParse(id).success) {
      return invalidIdResponse();
    }
    await requireWorkspaceRole(id, ["OWNER"], session.user.id);

    await deleteWorkspace(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Delete workspace error:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
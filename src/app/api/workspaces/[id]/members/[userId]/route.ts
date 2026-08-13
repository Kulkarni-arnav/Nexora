import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateMemberRole, removeMember } from "@/server/repositories/workspace";
import { requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

const workspaceIdSchema = z.string().uuid();
const memberIdSchema = z.string().uuid();

function invalidIdResponse() {
  return NextResponse.json({ error: "Invalid workspace or member id" }, { status: 400 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;
    if (
      !workspaceIdSchema.safeParse(id).success ||
      !memberIdSchema.safeParse(userId).success
    ) {
      return invalidIdResponse();
    }
    await requireWorkspaceRole(id, ["OWNER", "ADMIN"], session.user.id);

    const body = await request.json();
    const validated = updateRoleSchema.parse(body);

    const member = await updateMemberRole(id, session.user.id, userId, validated.role);

    return NextResponse.json({
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: member.user,
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
    console.error("Update member role error:", error);
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;
    if (
      !workspaceIdSchema.safeParse(id).success ||
      !memberIdSchema.safeParse(userId).success
    ) {
      return invalidIdResponse();
    }
    await requireWorkspaceRole(id, ["OWNER", "ADMIN"], session.user.id);

    await removeMember(id, session.user.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
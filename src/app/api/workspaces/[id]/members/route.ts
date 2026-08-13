import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addMember, getWorkspaceMembers } from "@/server/repositories/workspace";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
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

    const members = await getWorkspaceMembers(id);

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Failed to get members" }, { status: 500 });
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

    const { id } = await params;
    if (!workspaceIdSchema.safeParse(id).success) {
      return invalidIdResponse();
    }
    await requireWorkspaceRole(id, ["OWNER", "ADMIN"], session.user.id);

    const body = await request.json();
    const validated = addMemberSchema.parse(body);

    const member = await addMember(id, session.user.id, validated.email, validated.role);

    return NextResponse.json(
      {
        member: {
          id: member.id,
          userId: member.userId,
          role: member.role,
          createdAt: member.createdAt,
          user: member.user,
        },
      },
      { status: 201 }
    );
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
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
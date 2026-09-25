import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember } from "@/server/auth";
import { prisma } from "@/server/db/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = (await params)?.id as string;
    
    // Verify workspace membership
    if (!workspaceId) {
      return NextResponse.json({ error: "Invalid workspace ID" }, { status: 400 });
    }
    
    await requireWorkspaceMember(workspaceId, session.user.id);

    // Set the current workspace cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("currentWorkspaceId", workspaceId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    
    return response;
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("Access denied")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Switch workspace error:", error);
    return NextResponse.json({ error: "Failed to switch workspace" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserWorkspaces, createWorkspace } from "@/server/repositories/workspace";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await getUserWorkspaces(userId);

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      description: m.workspace.description,
      role: m.role,
      isOwner: m.workspace.ownerId === userId,
      memberCount: m.workspace._count.members,
      documentCount: m.workspace._count.documents,
      createdAt: m.workspace.createdAt,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    return NextResponse.json(
      { error: "Failed to get workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);

    const workspace = await createWorkspace(userId, validated);

    return NextResponse.json(
      {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
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

    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
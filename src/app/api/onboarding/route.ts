import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createWorkspaceForUser } from "@/server/auth";
import { getUserWorkspaces } from "@/server/auth";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const onboardingSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required").max(100),
  workspaceSlug: z.string().min(1, "Slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  useCase: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingWorkspaces = await getUserWorkspaces(session.user.id);
    if (existingWorkspaces.length > 0) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = onboardingSchema.parse(body);

    const workspace = await createWorkspaceForUser(
      session.user.id,
      validated.workspaceName,
      validated.workspaceSlug
    );

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
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

    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "An error occurred during onboarding" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await getUserWorkspaces(session.user.id);

    return NextResponse.json({
      hasWorkspaces: workspaces.length > 0,
      workspaces: workspaces.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, updateUser } from "@/server/repositories/user";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const user = await updateUser(session.user.id, validated);

    return NextResponse.json({ user });
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
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
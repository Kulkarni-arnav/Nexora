import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyPassword, updatePassword } from "@/server/repositories/user";
import { AppError, isAppError } from "@/server/validation/errors";
import { checkRateLimit } from "@/server/services/rate-limit";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const PASSWORD_RATE_LIMIT = 5;
const PASSWORD_RATE_LIMIT_WINDOW_SECONDS = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(
      `password-change:${session.user.id}`,
      PASSWORD_RATE_LIMIT,
      PASSWORD_RATE_LIMIT_WINDOW_SECONDS
    );
    if (!rateLimited.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = passwordSchema.parse(body);

    const isValid = await verifyPassword(session.user.id, validated.currentPassword);
    if (!isValid) {
      throw new AppError("Current password is incorrect", "INVALID_PASSWORD", 400);
    }

    await updatePassword(session.user.id, validated.newPassword);

    return NextResponse.json({ success: true });
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

    console.error("Password update error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
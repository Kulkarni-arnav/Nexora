import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/server/repositories/user";
import { isAppError } from "@/server/validation/errors";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    const user = await createUser({
      email: validated.email,
      name: validated.name,
      password: validated.password,
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
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

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
"use client";

import { Suspense } from "react";
import { LoginForm, AuthLayout } from "@/components/auth/auth-form";

export function LoginPageClient() {
  return (
    <AuthLayout title="Welcome back to NEXORA AI" subtitle="Sign in to continue to your knowledge workspace.">
      <Suspense fallback={<div className="w-full max-w-md">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
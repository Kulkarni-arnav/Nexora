"use client";

import { Suspense } from "react";
import { LoginForm, AuthLayout } from "@/components/auth/auth-form";

function FormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="mx-auto h-7 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mx-auto h-4 w-64 animate-pulse rounded-md bg-muted" />
      <div className="space-y-3 pt-6">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function LoginPageClient() {
  return (
    <AuthLayout title="Welcome back to NEXORA AI" subtitle="Sign in to continue to your knowledge workspace.">
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
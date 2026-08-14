"use client";

import { Suspense } from "react";
import { SignupForm, AuthLayout } from "@/components/auth/auth-form";

function FormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="mx-auto h-7 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mx-auto h-4 w-64 animate-pulse rounded-md bg-muted" />
      <div className="space-y-3 pt-6">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function SignupPageClient() {
  return (
    <AuthLayout title="Create your NEXORA AI account" subtitle="Start building your intelligent knowledge base today.">
      <Suspense fallback={<FormSkeleton />}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
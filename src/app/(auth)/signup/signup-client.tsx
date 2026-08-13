"use client";

import { Suspense } from "react";
import { SignupForm, AuthLayout } from "@/components/auth/auth-form";

export function SignupPageClient() {
  return (
    <AuthLayout title="Create your NEXORA AI account" subtitle="Start building your intelligent knowledge base today.">
      <Suspense fallback={<div className="w-full max-w-md">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
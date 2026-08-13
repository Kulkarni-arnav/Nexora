import { Metadata } from "next";
import { SignupPageClient } from "./signup-client";

export const metadata: Metadata = {
  title: "Sign up - NEXORA AI",
  description: "Create your NEXORA AI account",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
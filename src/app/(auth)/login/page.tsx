import { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign in - NEXORA AI",
  description: "Sign in to your NEXORA AI account",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
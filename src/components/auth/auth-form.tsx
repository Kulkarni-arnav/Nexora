"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Brain } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { signIn } from "next-auth/react";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          Object.entries(result.details).forEach(([, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast({ title: msg, variant: "destructive" }));
            }
          });
        }
        throw new Error(result.error || "Signup failed");
      }

      toast({ title: "Account created successfully", variant: "success" });
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message !== "Signup failed") {
        toast({ title: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            placeholder="John Doe"
            {...register("name")}
            error={errors.name?.message}
            disabled={isLoading}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            error={errors.email?.message}
            disabled={isLoading}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Separator />
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({ title: "Invalid email or password", variant: "destructive" });
        return;
      }

      toast({ title: "Welcome back!", variant: "success" });
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your NEXORA AI account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            error={errors.email?.message}
            disabled={isLoading}
            autoComplete="email"
          />
          <div className="relative">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-input" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Separator />
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-primary/5 items-center justify-center p-12 border-r border-border">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Brain className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">NEXORA AI</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            {title || "Your knowledge. Searchable, understandable, intelligent."}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {subtitle || "Transform your documents into searchable, intelligent knowledge with semantic search and RAG-powered chat."}
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
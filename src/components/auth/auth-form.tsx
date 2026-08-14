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
import { Brain, Eye, EyeOff, Loader2, MessageSquare, Search, ShieldCheck } from "lucide-react";
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

const authFeatures = [
  {
    icon: Search,
    title: "Semantic search",
    description: "Find answers across all of your documents.",
  },
  {
    icon: MessageSquare,
    title: "Grounded AI chat",
    description: "Get cited answers based on your own knowledge.",
  },
  {
    icon: ShieldCheck,
    title: "Private workspaces",
    description: "Role-based access keeps your data secure.",
  },
];

function PasswordToggle({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <Brain className="h-8 w-8 text-primary" />
      <span className="text-xl font-semibold tracking-tight">NEXORA AI</span>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

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
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            rightElement={
              <PasswordToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
            }
          />
          <p className="-mt-2 text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
          <Input
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            autoComplete="new-password"
            rightElement={
              <PasswordToggle shown={showConfirm} onClick={() => setShowConfirm((v) => !v)} />
            }
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
  const [showPassword, setShowPassword] = useState(false);

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
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="current-password"
            rightElement={
              <PasswordToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
            }
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden flex-col justify-between border-r border-border bg-muted/40 p-10 lg:flex lg:w-[45%] xl:p-14">
        <BrandMark />
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl">
            {title || "Your knowledge. Searchable, understandable, intelligent."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {subtitle ||
              "Transform your documents into searchable, intelligent knowledge with semantic search and RAG-powered chat."}
          </p>
          <ul className="mt-10 space-y-5">
            {authFeatures.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} NEXORA AI
        </p>
      </aside>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <BrandMark />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
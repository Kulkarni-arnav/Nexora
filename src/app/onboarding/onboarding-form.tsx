"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, Check, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required").max(100),
  workspaceSlug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const useCases = [
  { id: "research", label: "Research", description: "Academic papers, literature reviews, citations" },
  { id: "work", label: "Work", description: "Project docs, meeting notes, knowledge base" },
  { id: "education", label: "Education", description: "Study materials, course notes, references" },
  { id: "personal", label: "Personal knowledge", description: "Learning, journaling, life knowledge" },
  { id: "business", label: "Business", description: "Company wiki, processes, documentation" },
  { id: "other", label: "Other", description: "Custom use case" },
];

const steps = [
  { number: 1, label: "Use case" },
  { number: 2, label: "Workspace" },
  { number: 3, label: "Ready" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWorkspaces, setHasWorkspaces] = useState(false);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { workspaceName: "My Knowledge Base", workspaceSlug: "" },
  });

  const workspaceName = useWatch({ control, name: "workspaceName" });
  const workspaceSlug = useWatch({ control, name: "workspaceSlug" });

  useEffect(() => {
    let cancelled = false;
    const checkExistingWorkspaces = async () => {
      try {
        const response = await fetch("/api/onboarding");
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setHasWorkspaces(data.hasWorkspaces);
            if (data.hasWorkspaces) {
              router.push("/dashboard");
            }
          }
        }
      } catch {
        // Ignore
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkExistingWorkspaces();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const slug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    setValue("workspaceSlug", slug, { shouldValidate: true });
  }, [workspaceName, setValue]);

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, useCase }),
      });

      if (response.status === 401) {
        toast({ title: "Your session expired. Please sign in again.", variant: "destructive" });
        router.replace("/login");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Onboarding failed");
      }

      toast({ title: "Workspace created!", variant: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const advance = () => {
    if (step === 2) {
      handleSubmit(() => setStep(3), () => undefined)();
      return;
    }
    setStep(step + 1);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasWorkspaces) return null;

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <Brain className="h-9 w-9 text-primary" />
            <span className="text-2xl font-bold tracking-tight">NEXORA AI</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to NEXORA
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your knowledge workspace.
          </p>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            {steps.map((s) => (
              <span
                key={s.number}
                className={cn(
                  "text-xs font-medium transition-colors",
                  step >= s.number ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            ))}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="mx-auto w-full">
          <CardHeader className="text-center">
            <CardTitle>
              {step === 1
                ? "What will you use NEXORA for?"
                : step === 2
                ? "Create your first workspace"
                : "You&apos;re ready!"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "This helps us tailor your experience."
                : step === 2
                ? "Your workspace is where all your documents and conversations live."
                : "Your knowledge base is ready to go."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {useCases.map((uc) => {
                  const selected = useCase === uc.id;
                  return (
                    <button
                      key={uc.id}
                      type="button"
                      onClick={() => setUseCase(uc.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div>
                        <div className="font-medium">{uc.label}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {uc.description}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-transparent"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Workspace name"
                  placeholder="My Knowledge Base"
                  {...register("workspaceName")}
                  error={errors.workspaceName?.message}
                  disabled={isLoading}
                />
                <Input
                  label="Slug (URL)"
                  placeholder="my-knowledge-base"
                  {...register("workspaceSlug")}
                  error={errors.workspaceSlug?.message}
                  disabled={isLoading}
                />
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  Accessible at nexora.ai/workspace/
                  {workspaceSlug || "my-knowledge-base"}
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">All set!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your workspace <strong className="font-medium text-foreground">{workspaceName}</strong>{" "}
                  is ready. Documents, AI chat, and research tools are on the way.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={advance}
                disabled={(step === 1 && !useCase) || isLoading}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enter NEXORA"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

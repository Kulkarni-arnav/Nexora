"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const onboardingSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required").max(100),
  workspaceSlug: z.string().min(1, "Slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWorkspaces, setHasWorkspaces] = useState(false);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { workspaceName: "My Knowledge Base", workspaceSlug: "" },
  });

  const workspaceName = watch("workspaceName");

  useEffect(() => {
    checkExistingWorkspaces();
  }, []);

  useEffect(() => {
    const slug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    setValue("workspaceSlug", slug, { shouldValidate: true });
  }, [workspaceName, setValue]);

  const checkExistingWorkspaces = async () => {
    try {
      const response = await fetch("/api/onboarding");
      if (response.ok) {
        const data = await response.json();
        setHasWorkspaces(data.hasWorkspaces);
        if (data.hasWorkspaces) {
          router.push("/dashboard");
        }
      }
    } catch {
      // Ignore
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, useCase }),
      });

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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasWorkspaces) return null;

  const steps = [
    { number: 1, label: "Use Case", icon: Brain },
    { number: 2, label: "Workspace", icon: CheckCircle2 },
    { number: 3, label: "Ready", icon: ArrowRight },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">NEXORA AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to NEXORA</h1>
          <p className="text-muted-foreground mt-2">Let&apos;s set up your knowledge workspace.</p>
        </div>

        <div className="flex items-center justify-center mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    step > s.number
                      ? "bg-primary text-primary-foreground"
                      : step === s.number
                      ? "bg-primary/10 text-primary border border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <CheckCircle2 className="h-5 w-5" /> : s.number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-1 w-16 ${
                      step > s.number ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block absolute -translate-x-1/2 left-1/2 mt-2">
                {s.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        <Card className="max-w-xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>{step === 1 ? "What will you use NEXORA for?" : step === 2 ? "Create your first workspace" : "You're ready!"}</CardTitle>
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
              <div className="space-y-3">
                {useCases.map((uc) => (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => setUseCase(uc.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      useCase === uc.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium">{uc.label}</div>
                    <div className="text-sm text-muted-foreground">{uc.description}</div>
                  </button>
                ))}
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
                <div className="text-sm text-muted-foreground">
                  Accessible at nexora.ai/workspace/{watch("workspaceSlug") || "my-knowledge-base"}
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">All set!</h3>
                <p className="text-muted-foreground mb-6">
                  Your workspace <strong>{workspaceName}</strong> is ready.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !useCase || isLoading}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter NEXORA"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
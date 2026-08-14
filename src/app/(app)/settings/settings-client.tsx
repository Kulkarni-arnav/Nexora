"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Save,
  ShieldAlert,
  User,
  UserRound,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/components/layout/types";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
};

type SettingsWorkspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: WorkspaceRole;
  memberCount: number;
  ownerName: string | null;
};

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const tabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Lock },
  { key: "workspace", label: "Workspace", icon: Building2 },
  { key: "account", label: "Account", icon: UserRound },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(value)
  );

export function SettingsClient({
  user,
  workspace,
}: {
  user: SettingsUser;
  workspace: SettingsWorkspace | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, security, and workspace.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto border-b border-border pb-px lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-6">
          {activeTab === "profile" && (
            <ProfileSection user={user} onSaved={() => router.refresh()} />
          )}
          {activeTab === "security" && <SecuritySection />}
          {activeTab === "workspace" && <WorkspaceSection workspace={workspace} />}
          {activeTab === "account" && <AccountSection user={user} />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  user,
  onSaved,
}: {
  user: SettingsUser;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }
      toast({ title: "Profile updated", variant: "success" });
      onSaved();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your personal details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
            <AvatarFallback className="text-lg">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{user.name || "Account"}</p>
            <p className="text-sm text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            placeholder="Your name"
            {...register("name")}
            error={errors.name?.message}
            disabled={isSaving}
            autoComplete="name"
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Email</p>
            <Input
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
              aria-label="Email address"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your email cannot be changed yet.
            </p>
          </div>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (data: PasswordForm) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update password");
      }
      toast({ title: "Password updated", variant: "success" });
      reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change password
        </CardTitle>
        <CardDescription>
          Use at least 8 characters. You&apos;ll be signed out on all other devices
          after changing your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current password"
            type={showCurrent ? "text" : "password"}
            placeholder="••••••••"
            {...register("currentPassword")}
            error={errors.currentPassword?.message}
            disabled={isSaving}
            autoComplete="current-password"
            rightElement={
              <PasswordToggle shown={showCurrent} onClick={() => setShowCurrent((v) => !v)} />
            }
          />
          <Input
            label="New password"
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            {...register("newPassword")}
            error={errors.newPassword?.message}
            disabled={isSaving}
            autoComplete="new-password"
            rightElement={
              <PasswordToggle shown={showNew} onClick={() => setShowNew((v) => !v)} />
            }
          />
          <Input
            label="Confirm new password"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            {...register("confirmNewPassword")}
            error={errors.confirmNewPassword?.message}
            disabled={isSaving}
            autoComplete="new-password"
            rightElement={
              <PasswordToggle
                shown={showConfirm}
                onClick={() => setShowConfirm((v) => !v)}
              />
            }
          />
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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

function WorkspaceSection({ workspace }: { workspace: SettingsWorkspace | null }) {
  if (!workspace) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are not a member of any workspace yet. Create one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          You are viewing {workspace.name}. Workspace management is coming in a
          future update.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label="Name" value={workspace.name} />
          <InfoRow label="Slug" value={workspace.slug} />
          {workspace.description && (
            <InfoRow label="Description" value={workspace.description} />
          )}
          <InfoRow label="Your role" value={roleLabels[workspace.role]} />
          <InfoRow
            label="Members"
            value={`${workspace.memberCount} member${workspace.memberCount === 1 ? "" : "s"}`}
          />
          {workspace.ownerName && (
            <InfoRow label="Owner" value={workspace.ownerName} />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function AccountSection({ user }: { user: SettingsUser }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Member since" value={formatDate(user.createdAt)} />
          <InfoRow label="Account ID" value={user.id} />
          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Account deletion and data export are not available yet. They will
              arrive in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Permanently delete your account and all of your data.
              </p>
            </div>
            <Button variant="destructive" disabled className="shrink-0">
              Delete account
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Coming in a future update.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
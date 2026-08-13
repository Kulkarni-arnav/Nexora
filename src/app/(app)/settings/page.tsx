"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const updateProfile = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({ title: "Profile updated", variant: "success" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update password");
      }

      toast({ title: "Password updated", variant: "success" });
      passwordForm.reset();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex gap-4 border-b border-border">
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          onClick={() => setActiveTab("profile")}
          className="h-10 px-4"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
        <Button
          variant={activeTab === "password" ? "default" : "ghost"}
          onClick={() => setActiveTab("password")}
          className="h-10 px-4"
        >
          <Lock className="mr-2 h-4 w-4" />
          Password
        </Button>
      </div>

      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
              <Input
                label="Name"
                placeholder="John Doe"
                {...profileForm.register("name")}
                error={profileForm.formState.errors.name?.message}
                disabled={isLoading}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                disabled
                className="bg-muted"
              />
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "password" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password for security.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("currentPassword")}
                error={passwordForm.formState.errors.currentPassword?.message}
                disabled={isLoading}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("newPassword")}
                error={passwordForm.formState.errors.newPassword?.message}
                disabled={isLoading}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("confirmNewPassword")}
                error={passwordForm.formState.errors.confirmNewPassword?.message}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Coming in a future update</p>
        </CardContent>
      </Card>
    </div>
  );
}
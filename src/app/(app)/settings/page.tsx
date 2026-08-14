import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentUser, getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your NEXORA AI account and workspace",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const memberships = await getUserWorkspaces(session.user.id);
  const workspaceId = await getCurrentWorkspaceId();
  const membership =
    workspaceId
      ? memberships.find((m) => m.workspace.id === workspaceId) ?? memberships[0]
      : memberships[0];

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name ?? "",
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt.toISOString(),
      }}
      workspace={
        membership
          ? {
              id: membership.workspace.id,
              name: membership.workspace.name,
              slug: membership.workspace.slug,
              description: membership.workspace.description ?? null,
              role: membership.role,
              memberCount: membership.workspace._count.members,
              ownerName: membership.workspace.owner?.name ?? null,
            }
          : null
      }
    />
  );
}
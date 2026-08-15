import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Search",
  description: "Search your NEXORA AI knowledge base",
};

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = await getCurrentWorkspaceId();
  const memberships = await getUserWorkspaces(session.user.id);

  if (!workspaceId && memberships.length === 0) {
    redirect("/onboarding");
  }

  const currentWorkspace = workspaceId
    ? memberships.find((m) => m.workspace.id === workspaceId)?.workspace
    : memberships[0]?.workspace;

  if (!currentWorkspace) {
    redirect("/onboarding");
  }

  const membership = memberships.find((m) => m.workspace.id === currentWorkspace.id);
  const role = membership?.role ?? "VIEWER";

  return (
    <SearchClient
      workspace={{
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        role,
      }}
    />
  );
}
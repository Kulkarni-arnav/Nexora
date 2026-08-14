import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Toaster } from "@/components/ui/toaster";
import type { UserNav, WorkspaceInfo, WorkspaceNavItem } from "@/components/layout/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const workspaceId = await getCurrentWorkspaceId();
  const memberships = await getUserWorkspaces(userId);

  const workspaces: WorkspaceNavItem[] = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    isOwner: m.workspace.ownerId === userId,
    memberCount: m.workspace._count.members,
  }));

  const current: WorkspaceInfo | null = workspaceId
    ? workspaces.find((w) => w.id === workspaceId) ?? workspaces[0] ?? null
    : workspaces[0] ?? null;

  const user: UserNav = {
    id: userId,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar workspaces={workspaces} current={current} user={user} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader
          workspaceName={current?.name ?? null}
          workspaces={workspaces}
          current={current}
          user={user}
        />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

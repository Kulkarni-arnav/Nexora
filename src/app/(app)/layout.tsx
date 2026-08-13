import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Toaster } from "@/components/ui/toaster";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = await getCurrentWorkspaceId();
  const memberships = await getUserWorkspaces(session.user.id);

  const currentWorkspace = workspaceId
    ? memberships.find((m) => m.workspace.id === workspaceId)?.workspace ?? null
    : memberships[0]?.workspace ?? null;

  const user = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar currentWorkspace={currentWorkspace} user={user} />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
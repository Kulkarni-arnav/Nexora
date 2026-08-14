"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserMenu } from "./user-menu";
import type { UserNav, WorkspaceInfo, WorkspaceNavItem } from "./types";

export function AppSidebar({
  workspaces,
  current,
  user,
}: {
  workspaces: WorkspaceNavItem[];
  current: WorkspaceInfo | null;
  user: UserNav | null;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold tracking-tight">NEXORA AI</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarNav />
      </div>

      <div className="shrink-0 space-y-3 border-t border-sidebar-border p-3">
        {current && <WorkspaceSwitcher workspaces={workspaces} current={current} />}
        <UserMenu user={user} />
      </div>
    </aside>
  );
}

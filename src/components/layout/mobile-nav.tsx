"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Brain, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserMenu } from "./user-menu";
import type { UserNav, WorkspaceInfo, WorkspaceNavItem } from "./types";

export function MobileNav({
  open,
  onClose,
  workspaces,
  current,
  user,
}: {
  open: boolean;
  onClose: () => void;
  workspaces: WorkspaceNavItem[];
  current: WorkspaceInfo | null;
  user: UserNav | null;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight">NEXORA AI</span>
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav onNavigate={onClose} />
        </div>
        <div className="shrink-0 space-y-3 border-t border-sidebar-border p-4">
          {current && (
            <WorkspaceSwitcher workspaces={workspaces} current={current} />
          )}
          <UserMenu user={user} showDetails={false} />
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import type { UserNav, WorkspaceInfo, WorkspaceNavItem } from "./types";

function getPageTitle(pathname: string): string {
  if (pathname === "/settings") return "Settings";
  return "Dashboard";
}

export function AppHeader({
  workspaceName,
  workspaces,
  current,
  user,
}: {
  workspaceName: string | null;
  workspaces: WorkspaceNavItem[];
  current: WorkspaceInfo | null;
  user: UserNav | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-baseline gap-2">
            {workspaceName && (
              <>
                <span className="hidden truncate text-sm text-muted-foreground md:block">
                  {workspaceName}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden text-muted-foreground/50 md:block"
                >
                  /
                </span>
              </>
            )}
            <h1 className="truncate text-base font-semibold tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </header>
      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        workspaces={workspaces}
        current={current}
        user={user}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  FileText,
  Bot,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

const primaryNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const placeholderNav: NavItem[] = [
  { name: "AI Assistant", icon: Bot, comingSoon: true },
  { name: "Conversations", icon: MessageSquare, comingSoon: true },
  { name: "Analytics", icon: BarChart3, comingSoon: true },
];

const baseItem =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

const activeItem = "bg-accent text-accent-foreground";

const inactiveItem = "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="space-y-6" aria-label="Primary navigation">
      <div className="space-y-1">
        {primaryNav.map((item) => {
          const active = item.href ? isActive(item.href) : false;
          return (
            <Link
              key={item.name}
              href={item.href ?? "#"}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(baseItem, active ? activeItem : inactiveItem)}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-1">
        <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
          Coming soon
        </p>
        {placeholderNav.map((item) => (
          <span
            key={item.name}
            aria-disabled="true"
            className={cn(baseItem, "cursor-not-allowed text-muted-foreground/50")}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.name}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              Soon
            </span>
          </span>
        ))}
      </div>
    </nav>
  );
}

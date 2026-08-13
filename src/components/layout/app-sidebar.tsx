"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Building2,
  Brain,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/dashboard/documents", icon: FileText, comingSoon: true },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Bot, comingSoon: true },
  { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare, comingSoon: true },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, comingSoon: true },
];

export function AppSidebar({ currentWorkspace, user }: { currentWorkspace: { id: string; name: string; slug: string } | null; user: { id: string; name: string | null; email: string; image?: string | null } | null }) {
  const pathname = usePathname();
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const handleCreateWorkspace = async () => {
    const name = prompt("Workspace name:");
    if (!name) return;
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) }),
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch {
      // Error handled by toast
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <aside className="hidden lg:flex lg:w-64 flex-col border-r border-border bg-card h-screen fixed lg:static inset-y-0 left-0 z-40">
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">NEXORA AI</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-6">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                item.comingSoon && "opacity-60"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
              {item.comingSoon && <span className="ml-auto text-xs text-muted-foreground/50">Soon</span>}
            </Link>
          ))}
        </nav>

        <Separator />

        <div className="pt-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4 border-t border-border">
        {currentWorkspace && (
          <DropdownMenu open={workspaceSwitcherOpen} onOpenChange={setWorkspaceSwitcherOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2 flex-1 truncate">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="truncate font-medium">{currentWorkspace.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="p-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCreateWorkspace}>
                  <Plus className="h-4 w-4" />
                  Create workspace
                </Button>
              </div>
              <Separator className="mx-2" />
              <div className="p-2">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => {}}>
                  <Building2 className="h-4 w-4" />
                  Workspace settings
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || undefined} alt={user?.name || ""} />
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 truncate">
                <p className="font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem className="px-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2" onClick={() => {}}>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </DropdownMenuItem>
            <Separator className="mx-2" />
            <DropdownMenuItem className="px-2 text-destructive focus:text-destructive" onClick={handleSignOut}>
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
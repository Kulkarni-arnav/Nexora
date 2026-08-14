"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import type { UserNav } from "./types";

export function UserMenu({
  user,
  showDetails = true,
  align = "end",
}: {
  user: UserNav | null;
  showDetails?: boolean;
  align?: "start" | "end";
}) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Account menu"
          className={cn(
            "justify-start gap-3",
            showDetails ? "w-full" : "w-full justify-center px-2"
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.image || undefined} alt={user?.name || ""} />
            <AvatarFallback className="text-xs">{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          {showDetails && (
            <span className="flex min-w-0 flex-1 flex-col items-start text-left">
              <span className="w-full truncate text-sm font-medium">
                {user?.name || "Account"}
              </span>
              <span className="w-full truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
          )}
          {showDetails && (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <span className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import type { WorkspaceInfo, WorkspaceNavItem } from "./types";

const roleLabels: Record<WorkspaceNavItem["role"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function WorkspaceSwitcher({
  workspaces,
  current,
  className,
}: {
  workspaces: WorkspaceNavItem[];
  current: WorkspaceInfo;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, slug: slugify(trimmed) }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create workspace");
      }
      toast({ title: "Workspace created", variant: "success" });
      setName("");
      window.location.reload();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = (workspace: WorkspaceNavItem) => {
    if (workspace.id === current.id) return;
    toast({
      title: "Workspace switching is coming soon",
      description: "You are currently in " + current.name + ".",
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
          aria-label="Switch workspace"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-sm font-medium">{current.name}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="px-2.5 pt-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((workspace) => {
          const isCurrent = workspace.id === current.id;
          return (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitch(workspace)}
              className="flex items-center justify-between"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{workspace.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {roleLabels[workspace.role]}
                </span>
                {isCurrent && <Check className="h-4 w-4 text-primary" />}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <form onSubmit={handleCreate} className="space-y-2 p-2">
          <Input
            label="New workspace"
            placeholder="Product research"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={creating}
            autoComplete="off"
          />
          <Button type="submit" size="sm" className="w-full" disabled={creating || !name.trim()}>
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "Create workspace"}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

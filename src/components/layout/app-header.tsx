"use client";

import { Brain } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:pl-6 lg:pr-8 lg:ml-64">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold tracking-tight">NEXORA AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
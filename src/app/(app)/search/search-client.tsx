"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Search, SearchX } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { WorkspaceRole } from "@/components/layout/types";

export type SearchResultItem = {
  documentId: string;
  documentTitle: string;
  fileName: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  score: number;
};

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

function scoreLabel(score: number): string {
  const percent = Math.round(score * 100);
  return `${Math.min(100, Math.max(0, percent))}%`;
}

export function SearchClient({
  workspace,
}: {
  workspace: { id: string; name: string; role: WorkspaceRole };
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || searching) return;

    setSearching(true);
    setResults(null);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Failed to search documents");
      }
      setResults(result.results as SearchResultItem[]);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground">
          Semantic Search · {workspace.name}
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {roleLabels[workspace.role]}
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across your indexed knowledge base using natural language.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. how is authentication handled?"
          aria-label="Search query"
          maxLength={500}
          className="h-11"
        />
        <Button
          type="submit"
          disabled={searching || query.trim().length === 0}
          className="h-11"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {searched && !searching && results?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">No results found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Try different keywords or upload more documents to your knowledge base.
            </p>
          </CardContent>
        </Card>
      )}

      {searched && !searching && results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for
            &ldquo;{query.trim()}&rdquo;
          </p>
          <ul className="space-y-3" aria-label="Search results">
            {results.map((result) => (
              <li key={result.chunkId}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {result.documentTitle}
                          </p>
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {scoreLabel(result.score)} match
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {result.fileName} · chunk {result.chunkIndex + 1}
                        </p>
                        <p className="mt-2 text-sm text-foreground/90 line-clamp-3">
                          {result.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
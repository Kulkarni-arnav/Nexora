"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface DocumentItem {
  id: string;
  workspaceId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  errorMessage: string | null;
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChunkItem {
  index: number;
  content: string;
  tokenCount: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function typeLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const labels: Record<string, string> = {
    pdf: "PDF",
    txt: "TXT",
    md: "MD",
    markdown: "MD",
  };
  return labels[extension] ?? "FILE";
}

export default function DocumentDetailPage() {
  const { workspaceId, documentId } = useParams();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch - if params are invalid, the API will return an error
    // and the catch handler will set loading to false

    // Fetch document details
    fetch("/api/workspaces/" + workspaceId + "/documents/" + documentId, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setDocument(data.document as DocumentItem);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load document:", err);
        setError("Failed to load document");
        setLoading(false);
      });

    // Fetch chunks for this document
    fetch("/api/workspaces/" + workspaceId + "/documents/" + documentId + "/chunks", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setChunks(data.chunks as ChunkItem[]);
      })
      .catch((err) => {
        console.error("Failed to load chunks:", err);
      });
  }, [workspaceId, documentId]);

  if (loading && !document) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <p>Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-muted-foreground">Document not found.</p>
        <Button onClick={() => window.history.back()}>Back to Documents</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Document metadata section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={statusClass(document.status)}>
                <span className="font-medium">{statusLabel(document.status)}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Type</p>
              <p>{typeLabel(document.fileName)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Size</p>
              <p>{formatSize(document.fileSize)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uploaded</p>
              <p>{formatDate(document.createdAt)}</p>
            </div>
          </div>

          {/* Indexing status */}
          {document.status === "COMPLETED" && document.indexedAt && (
            <div className="mt-4 p-4 bg-primary/5 rounded-md">
              <p className="text-sm text-primary">Indexed</p>
              <p className="mt-1 text-xs">Indexed at {formatDate(document.indexedAt)}</p>
            </div>
          )}

          {document.status === "FAILED" && document.errorMessage && (
            <div className="mt-4 p-4 bg-destructive/5 rounded-md">
              <p className="text-sm text-destructive">Indexing failed</p>
              <p className="mt-1 text-xs">{document.errorMessage}</p>
            </div>
          )}

          {document.status === "PROCESSING" && (
            <div className="mt-4 p-4 bg-primary/5 rounded-md">
              <p className="text-sm text-primary">Processing</p>
              <p className="mt-1 text-xs">Document is being processed and indexed.</p>
            </div>
          )}

          {document.status === "PENDING" && (
            <div className="mt-4 p-4 bg-muted/5 rounded-md">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 text-xs">Document upload received, processing pending.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chunk viewer section */}
      {document.status === "COMPLETED" && document.indexedAt && chunks.length > 0 && (
        <div className="mt-6">
          <CardHeader>
            <CardTitle>Document Chunks ({chunks.length} total)</CardTitle>
          </CardHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {chunks.map((chunk) => (
              <div
                key={chunk.index}
                className="p-3 rounded-lg bg-muted/5 hover:bg-muted/30 border border-border"
              >
                <p className="font-medium text-sm">Chunk {chunk.index + 1}</p>
                <p className="text-xs text-muted-foreground overflow-hidden whitespace-pre-wrap">
                  {chunk.content.substring(0, 300)}{chunk.content.length > 300 ? "..." : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation navigation info */}
      {document.status === "COMPLETED" && document.indexedAt && (
        <div className="mt-6 p-4 bg-muted/5 rounded-md">
          <p className="text-sm text-muted-foreground">
            Citations from assistant responses reference these chunks. The chunk content above
            corresponds to the citations in assistant messages.
          </p>
        </div>
      )}
    </div>
  );
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function statusLabel(status: DocumentStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PROCESSING":
      return "Processing";
    case "COMPLETED":
      return "Indexed";
    case "FAILED":
      return "Failed";
  }
}

function statusClass(status: DocumentStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-muted text-muted-foreground";
    case "PROCESSING":
      return "bg-primary/10 text-primary";
    case "COMPLETED":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "FAILED":
      return "bg-destructive/10 text-destructive";
    default:
      return "";
  }
}
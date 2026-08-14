"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/components/layout/types";

export type DocumentItem = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  metadata: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
};

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const statusStyles: Record<DocumentItem["status"], { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "Processing", className: "bg-primary/10 text-primary" },
  COMPLETED: { label: "Indexed", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  FAILED: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function isAcceptedFile(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ["pdf", "txt", "md", "markdown"].includes(extension);
}

export function DocumentsClient({
  workspace,
  canUpload,
  canManage,
  initialDocuments,
  maxFileSize,
  accept,
  supportedDescription,
}: {
  workspace: { id: string; name: string; slug: string; role: WorkspaceRole };
  canUpload: boolean;
  canManage: boolean;
  initialDocuments: DocumentItem[];
  maxFileSize: number;
  accept: string;
  supportedDescription: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        rejected.push(`${file.name} (exceeds 10 MB limit)`);
        continue;
      }
      if (!isAcceptedFile(file.name)) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }
      accepted.push(file);
    }

    for (const rejectedItem of rejected) {
      toast({ title: `Skipped ${rejectedItem}`, variant: "destructive" });
    }

    let uploadedCount = 0;
    for (const file of accepted) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`/api/workspaces/${workspace.id}/documents`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "Failed to upload document");
        }
        uploadedCount += 1;
      } catch (error) {
        toast({
          title: error instanceof Error ? error.message : "Failed to upload document",
          variant: "destructive",
        });
      }
    }

    if (uploadedCount > 0) {
      toast({
        title: uploadedCount === 1 ? "Document uploaded" : `${uploadedCount} documents uploaded`,
        variant: "success",
      });
      const refreshed = await fetch(`/api/workspaces/${workspace.id}/documents`);
      if (refreshed.ok) {
        const result = await refreshed.json();
        setDocuments(result.documents as DocumentItem[]);
      } else {
        router.refresh();
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (document: DocumentItem) => {
    if (confirmingId !== document.id) {
      setConfirmingId(document.id);
      return;
    }
    setConfirmingId(null);
    setPendingId(document.id);
    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/documents/${document.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to delete document");
      }
      toast({ title: "Document deleted", variant: "success" });
      setDocuments((current) => current.filter((doc) => doc.id !== document.id));
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleRetry = async (document: DocumentItem) => {
    setPendingId(document.id);
    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/documents/${document.id}/retry`,
        { method: "POST" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Failed to retry document");
      }
      toast({
        title: result.document?.status === "COMPLETED" ? "Document indexed" : "Retry finished",
        variant: "success",
      });
      setDocuments((current) =>
        current.map((doc) => (doc.id === document.id ? (result.document as DocumentItem) : doc))
      );
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to retry document",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground">
            Knowledge Base · {workspace.name}
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {roleLabels[workspace.role]}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {supportedDescription}
          </p>
        </div>
        {canUpload && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              disabled={uploading}
              onChange={(event) => handleUpload(event.target.files)}
              aria-label="Upload documents"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload documents"}
            </Button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground">No documents yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {canUpload
              ? `Upload ${accept} files to start building your searchable knowledge base.`
              : "Ask an owner or admin to upload the first document to this workspace."}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border" aria-label="Documents">
              {documents.map((document) => {
                const status = statusStyles[document.status];
                const isConfirming = confirmingId === document.id;
                const isPending = pendingId === document.id;
                return (
                  <li
                    key={document.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {document.fileName} · {typeLabel(document.fileName)} ·{" "}
                          {formatSize(document.fileSize)} ·{" "}
                          {dateFormatter.format(new Date(document.createdAt))}
                        </p>
                        {document.status === "FAILED" && document.errorMessage && (
                          <p className="mt-0.5 text-xs text-destructive">
                            {document.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          status.className
                        )}
                      >
                        {document.status === "FAILED" && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {status.label}
                      </span>

                      {document.status === "FAILED" && canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(document)}
                          disabled={isPending}
                          aria-label={`Retry ${document.title}`}
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Retry
                        </Button>
                      )}

                      {canManage && (
                        isConfirming ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(document)}
                              disabled={isPending}
                              aria-label={`Confirm delete ${document.title}`}
                            >
                              {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setConfirmingId(null)}
                              disabled={isPending}
                              aria-label="Cancel delete"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleDelete(document)}
                            disabled={isPending}
                            aria-label={`Delete ${document.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {documents.some((document) => document.status === "FAILED") && (
        <p className="text-xs text-muted-foreground">
          Failed documents could not be indexed. Use Retry to attempt extraction again.
        </p>
      )}
    </div>
  );
}

import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { DocumentStatus } from "@/generated/prisma";
import { AppError } from "@/server/validation/errors";
import { getStorage } from "@/server/storage";
import {
  assertDocument,
  createDocument,
  deleteDocument as deleteDocumentRecord,
  getWorkspaceDocuments,
} from "@/server/repositories/document";
import { classifyDocumentFile, MAX_DOCUMENT_SIZE_BYTES } from "./config";
import { processDocument } from "./document-processor";

function originalKey(workspaceId: string, documentId: string): string {
  return `workspaces/${workspaceId}/documents/${documentId}/file`;
}

function documentDirectoryKey(workspaceId: string, documentId: string): string {
  return `workspaces/${workspaceId}/documents/${documentId}`;
}

function deriveTitle(fileName: string): string {
  const base = path.parse(fileName).name.trim();
  return base.length > 0 ? base : fileName;
}

export interface UploadDocumentInput {
  workspaceId: string;
  fileName: string;
  mimeType: string | null;
  data: Buffer;
}

export async function uploadDocument(input: UploadDocumentInput) {
  if (input.data.length === 0) {
    throw new AppError("The uploaded file is empty", "EMPTY_FILE", 400);
  }
  if (input.data.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new AppError("File exceeds the maximum allowed size (10 MB)", "FILE_TOO_LARGE", 413);
  }

  const classified = classifyDocumentFile(input.fileName, input.mimeType);
  if (!classified) {
    throw new AppError(
      "Unsupported file type. Supported types: PDF, TXT, Markdown.",
      "UNSUPPORTED_FILE_TYPE",
      400
    );
  }

  const documentId = randomUUID();
  const storage = getStorage();
  const key = originalKey(input.workspaceId, documentId);
  await storage.put(key, input.data);

  const originalName = path.basename(input.fileName).trim();

  try {
    await createDocument({
      id: documentId,
      workspaceId: input.workspaceId,
      title: deriveTitle(originalName),
      fileName: originalName,
      fileSize: input.data.length,
      mimeType: classified.mimeType,
      storagePath: key,
    });
  } catch (error) {
    await storage.delete(key);
    throw error;
  }

  return processDocument(input.workspaceId, documentId);
}

export async function listDocuments(workspaceId: string) {
  return getWorkspaceDocuments(workspaceId);
}

export async function getDocument(workspaceId: string, documentId: string) {
  return assertDocument(workspaceId, documentId);
}

export async function deleteDocument(workspaceId: string, documentId: string) {
  const document = await assertDocument(workspaceId, documentId);
  const storage = getStorage();
  await storage.deletePrefix(documentDirectoryKey(workspaceId, documentId));
  await deleteDocumentRecord(workspaceId, documentId);
  return document;
}

export async function retryDocument(workspaceId: string, documentId: string) {
  const document = await assertDocument(workspaceId, documentId);
  if (document.status !== "FAILED") {
    throw new AppError("Only failed documents can be retried", "INVALID_STATUS", 400);
  }
  return processDocument(workspaceId, documentId);
}

export function serializeDocument(document: {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    title: document.title,
    description: document.description,
    fileName: document.fileName,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    status: document.status,
    errorMessage: document.errorMessage,
    metadata: document.metadata,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
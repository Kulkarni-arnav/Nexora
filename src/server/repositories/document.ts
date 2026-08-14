import "server-only";
import { prisma } from "@/server/db/client";
import { NotFoundError } from "@/server/validation/errors";
import type { DocumentStatus } from "@/generated/prisma";

export interface CreateDocumentInput {
  id: string;
  workspaceId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}

export const documentSelect = {
  id: true,
  workspaceId: true,
  title: true,
  description: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  storagePath: true,
  contentPath: true,
  metadata: true,
  errorMessage: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createDocument(input: CreateDocumentInput) {
  return prisma.document.create({
    data: {
      id: input.id,
      workspaceId: input.workspaceId,
      title: input.title,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
    },
    select: documentSelect,
  });
}

export async function getDocumentById(workspaceId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, workspaceId },
    select: documentSelect,
  });
}

export async function assertDocument(workspaceId: string, documentId: string) {
  const document = await getDocumentById(workspaceId, documentId);
  if (!document) {
    throw new NotFoundError("Document", documentId);
  }
  return document;
}

export async function getWorkspaceDocuments(workspaceId: string) {
  return prisma.document.findMany({
    where: { workspaceId },
    select: documentSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function markDocumentProcessing(workspaceId: string, documentId: string) {
  const updated = await prisma.document.updateMany({
    where: { id: documentId, workspaceId },
    data: { status: "PROCESSING", errorMessage: null },
  });
  if (updated.count === 0) {
    throw new NotFoundError("Document", documentId);
  }
}

export async function completeDocument(
  workspaceId: string,
  documentId: string,
  contentPath: string,
  metadata: Record<string, number>,
  status: DocumentStatus = "COMPLETED"
) {
  const updated = await prisma.document.updateMany({
    where: { id: documentId, workspaceId },
    data: { status, contentPath, metadata },
  });
  if (updated.count === 0) {
    throw new NotFoundError("Document", documentId);
  }
}

export async function failDocument(
  workspaceId: string,
  documentId: string,
  errorMessage: string
) {
  const updated = await prisma.document.updateMany({
    where: { id: documentId, workspaceId },
    data: { status: "FAILED", errorMessage },
  });
  if (updated.count === 0) {
    throw new NotFoundError("Document", documentId);
  }
}

export function deleteDocument(workspaceId: string, documentId: string) {
  return prisma.document.deleteMany({
    where: { id: documentId, workspaceId },
  });
}
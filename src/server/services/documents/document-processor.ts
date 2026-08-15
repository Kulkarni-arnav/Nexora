import "server-only";
import { logger } from "@/server/services/logger";
import { getStorage } from "@/server/storage";
import {
  assertDocument,
  completeDocument,
  failDocument,
  markDocumentProcessing,
} from "@/server/repositories/document";
import { extractText } from "./extractors";
import { classifyDocumentFile } from "./config";
import { indexDocument } from "./indexing";

function originalKey(workspaceId: string, documentId: string): string {
  return `workspaces/${workspaceId}/documents/${documentId}/file`;
}

function contentKey(workspaceId: string, documentId: string): string {
  return `workspaces/${workspaceId}/documents/${documentId}/content`;
}

function userFacingFailureMessage(category: string, error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (category === "pdf") {
    if (/password|encrypted/i.test(message)) {
      return "Unable to read this PDF (it may be password-protected).";
    }
    return "Unable to extract text from this PDF. The file may be corrupted or unsupported.";
  }
  return "Unable to process this file.";
}

export async function processDocument(
  workspaceId: string,
  documentId: string
) {
  const storage = getStorage();
  const document = await assertDocument(workspaceId, documentId);

  const classified = classifyDocumentFile(document.fileName, document.mimeType);

  try {
    await markDocumentProcessing(workspaceId, documentId);

    if (!classified) {
      throw new Error("Unsupported document type");
    }

    const fileBuffer = await storage.get(originalKey(workspaceId, documentId));
    if (!fileBuffer) {
      throw new Error("Stored file is missing");
    }

    const result = await extractText(fileBuffer, classified.category);

    if (classified.category === "pdf" && result.text.length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    await storage.put(
      contentKey(workspaceId, documentId),
      Buffer.from(result.text, "utf-8")
    );

    await completeDocument(
      workspaceId,
      documentId,
      contentKey(workspaceId, documentId),
      result.metadata
    );

    const indexResult = await indexDocument(workspaceId, documentId);

    if (!indexResult.indexed) {
      await failDocument(workspaceId, documentId, indexResult.error || "Indexing failed");
      return assertDocument(workspaceId, documentId);
    }

    return assertDocument(workspaceId, documentId);
  } catch (error) {
    const category = classified?.category ?? "document";
    const message = userFacingFailureMessage(category, error);
    logger.warn("Document processing failed", {
      documentId,
      workspaceId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    await failDocument(workspaceId, documentId, message);
    return assertDocument(workspaceId, documentId);
  }
}
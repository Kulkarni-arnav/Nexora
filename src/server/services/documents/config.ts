import "server-only";
import path from "node:path";

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export type DocumentCategory = "pdf" | "text" | "markdown";

interface DocumentTypeConfig {
  mimeTypes: string[];
  extensions: string[];
}

export const SUPPORTED_DOCUMENT_TYPES: Record<DocumentCategory, DocumentTypeConfig> = {
  pdf: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  text: {
    mimeTypes: ["text/plain"],
    extensions: [".txt"],
  },
  markdown: {
    mimeTypes: ["text/markdown", "text/x-markdown"],
    extensions: [".md", ".markdown"],
  },
};

export interface ClassifiedDocumentType {
  category: DocumentCategory;
  mimeType: string;
}

export function classifyDocumentFile(
  fileName: string,
  mimeType?: string | null
): ClassifiedDocumentType | null {
  const extension = path.extname(fileName ?? "").toLowerCase();
  if (!extension) {
    return null;
  }

  for (const [category, config] of Object.entries(SUPPORTED_DOCUMENT_TYPES)) {
    if (!config.extensions.includes(extension)) {
      continue;
    }

    const provided = (mimeType ?? "").trim().toLowerCase();
    if (provided && provided !== "application/octet-stream") {
      const isTextLike = provided.startsWith("text/");
      const textCompatible =
        (category === "text" || category === "markdown") && isTextLike;
      if (!config.mimeTypes.includes(provided) && !textCompatible) {
        return null;
      }
    }

    return {
      category: category as DocumentCategory,
      mimeType: config.mimeTypes[0],
    };
  }

  return null;
}

export function isSupportedExtension(fileName: string): boolean {
  const extension = path.extname(fileName ?? "").toLowerCase();
  return Object.values(SUPPORTED_DOCUMENT_TYPES).some((config) =>
    config.extensions.includes(extension)
  );
}

export const SUPPORTED_FILE_ACCEPT = ".pdf,.txt,.md,.markdown";
export const SUPPORTED_FILE_DESCRIPTION = "PDF, TXT, or Markdown files up to 10 MB";
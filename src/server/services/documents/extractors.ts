import "server-only";
import { logger } from "@/server/services/logger";
import type { DocumentCategory } from "./config";

export interface ExtractionResult {
  text: string;
  metadata: Record<string, number>;
}

type PdfPage = {
  cleanup: (resetStats?: boolean) => void;
};

export async function extractText(
  buffer: Buffer,
  category: DocumentCategory
): Promise<ExtractionResult> {
  switch (category) {
    case "pdf":
      return extractPdfText(buffer);
    case "text":
    case "markdown": {
      const text = buffer.toString("utf-8");
      return {
        text,
        metadata: { characterCount: text.length },
      };
    }
  }
}

async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    verbosity: 0,
  });

  try {
    const document = await task.promise;
    const pages: PdfPage[] = [];
    const textParts: string[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        pages.push(page);
        const content = await page.getTextContent();
        const items = content.items as Array<{ str?: string }>;
        const pageText = items
          .map((item) => item.str ?? "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        textParts.push(pageText);
      }
    } finally {
      for (const page of pages) {
        page.cleanup();
      }
    }

    const text = textParts.join("\n").trim();
    return {
      text,
      metadata: {
        pageCount: document.numPages,
        characterCount: text.length,
      },
    };
  } finally {
    try {
      await task.destroy();
    } catch (error) {
      logger.warn("Failed to destroy PDF document task", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
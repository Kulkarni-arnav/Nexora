import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db/client";
import { getStorage } from "@/server/storage";
import { logger } from "@/server/services/logger";
import {
  EMBEDDING_VERSION,
  getEmbeddingProvider,
} from "@/server/services/embeddings";
import { chunkText } from "./chunking";

function contentKey(workspaceId: string, documentId: string): string {
  return `workspaces/${workspaceId}/documents/${documentId}/content`;
}

export interface IndexDocumentResult {
  indexed: boolean;
  chunkCount: number;
  error: string | null;
}

export async function indexDocument(
  workspaceId: string,
  documentId: string
): Promise<IndexDocumentResult> {
  try {
    const storage = getStorage();
    const buffer = await storage.get(contentKey(workspaceId, documentId));
    if (!buffer) {
      throw new Error("Indexed content is missing");
    }

    const chunks = chunkText(buffer.toString("utf-8"));
    const provider = getEmbeddingProvider();

    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += provider.maxBatchSize) {
      const batch = chunks
        .slice(i, i + provider.maxBatchSize)
        .map((chunk) => chunk.content);
      embeddings.push(...(await provider.embed(batch)));
    }

    if (embeddings.length !== chunks.length) {
      throw new Error("Embedding count did not match chunk count");
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM document_chunks WHERE "documentId" = ${documentId}`;

      if (chunks.length > 0) {
        const ids = chunks.map(() => randomUUID());
        const contents = chunks.map((chunk) => chunk.content);
        const indices = chunks.map((chunk) => String(chunk.index));
        const tokenCounts = chunks.map((chunk) => String(chunk.tokenCount));
        const vectors = embeddings.map((vector) => `[${vector.join(",")}]`);
        const versions = chunks.map(() => String(EMBEDDING_VERSION));
        const timestamps = chunks.map(() => now.toISOString());

        await tx.$executeRaw`
          INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "tokenCount", embedding, "embeddingVersion", metadata, "createdAt", "updatedAt")
          SELECT t.id, t."documentId", t.content, t.ci::int, t.tc::int, t.emb::vector, t.ev::int, t.meta::jsonb, t.c::timestamptz, t.u::timestamptz
          FROM UNNEST(
            ${ids}::text[], ${chunks.map(() => documentId)}::text[], ${contents}::text[],
            ${indices}::text[], ${tokenCounts}::text[], ${vectors}::text[],
            ${versions}::text[], ${chunks.map(() => "{}")}::text[],
            ${timestamps}::text[], ${timestamps}::text[]
          )
          AS t(id, "documentId", content, ci, tc, emb, ev, meta, c, u)`;
      }

      await tx.document.update({
        where: { id: documentId },
        data: { indexedAt: now },
      });
    });

    logger.info("Document indexed", {
      workspaceId,
      documentId,
      chunkCount: chunks.length,
    });
    return { indexed: true, chunkCount: chunks.length, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Document indexing failed", {
      workspaceId,
      documentId,
      message,
    });
    return { indexed: false, chunkCount: 0, error: message };
  }
}
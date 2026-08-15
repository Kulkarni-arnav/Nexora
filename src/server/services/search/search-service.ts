import "server-only";
import { Prisma } from "@nexora/prisma";
import { prisma } from "@/server/db/client";
import {
  EMBEDDING_VERSION,
  getEmbeddingProvider,
} from "@/server/services/embeddings";

export const MAX_SEARCH_QUERY_LENGTH = 500;
export const DEFAULT_TOP_K = 8;
export const MAX_TOP_K = 20;

export interface SemanticSearchOptions {
  topK?: number;
  documentId?: string;
}

export interface SemanticSearchResult {
  documentId: string;
  documentTitle: string;
  fileName: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  score: number;
}

interface SearchRow {
  chunkId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  documentId: string;
  documentTitle: string;
  fileName: string;
  score: number;
}

export async function searchWorkspace(
  workspaceId: string,
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const provider = getEmbeddingProvider();
  const [vector] = await provider.embed([query]);
  const embedding = `[${vector.join(",")}]`;

  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT c.id AS "chunkId",
           c."chunkIndex" AS "chunkIndex",
           c.content AS "content",
           c."tokenCount" AS "tokenCount",
           d.id AS "documentId",
           d.title AS "documentTitle",
           d."fileName" AS "fileName",
           (1 - (c.embedding <=> ${embedding}::vector)) AS score
    FROM document_chunks c
    JOIN documents d ON d.id = c."documentId"
    WHERE d."workspaceId" = ${workspaceId}
      AND c."embeddingVersion" = ${EMBEDDING_VERSION}
      AND c.embedding IS NOT NULL
      AND d."indexedAt" IS NOT NULL
      ${options.documentId ? Prisma.sql`AND d.id = ${options.documentId}` : Prisma.empty}
    ORDER BY c.embedding <=> ${embedding}::vector ASC
    LIMIT ${topK}
  `;

  return rows.map((row) => ({
    documentId: row.documentId,
    documentTitle: row.documentTitle,
    fileName: row.fileName,
    chunkId: row.chunkId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    tokenCount: row.tokenCount,
    score: Math.round(row.score * 10000) / 10000,
  }));
}
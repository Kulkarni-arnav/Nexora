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
  keywordScore?: number;
}

export async function searchWorkspace(
  workspaceId: string,
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const topK = Math.min(options.topK ?? DEFAULT_TOP_K, MAX_TOP_K);
  const candidateK = Math.min(topK * 3, MAX_TOP_K);

  // Get embedding for the query
  const provider = getEmbeddingProvider();
  const [vector] = await provider.embed([query]);

  // Validate vector has correct dimensionality (768 for our DB schema)
  if (vector.length !== 768) {
    console.error(`[CHAT] Embedding dimension mismatch: expected 768, got ${vector.length}`);
    return [];
  }

  // Format vector for pgvector - ensure all values are valid numbers
  // Note: omit ::vector here; PostgreSQL will cast the literal
  // when comparing against the vector(768) column via the <=> operator.
  const safeVector = vector.map(v => (Number.isFinite(v) ? v : 0.0));
  const embedding = Prisma.raw(`[${safeVector.map(v => v.toString()).join(",")}]`);

  const embeddingVersion = EMBEDDING_VERSION;

  // Build WHERE conditions separately to avoid parameter binding issues
  const whereClauses: Prisma.Sql[] = [
    Prisma.raw(`d."workspaceId" = ${workspaceId}`),
    Prisma.raw(`c."embeddingVersion" = ${embeddingVersion}`),
    Prisma.raw(`c.embedding IS NOT NULL`),
    Prisma.raw(`d."indexedAt" IS NOT NULL`),
  ];

  if (options.documentId !== undefined) {
    whereClauses.push(Prisma.raw(`d.id = ${options.documentId}`));
  }

  // Execute search using Prisma's $queryRaw with properly formatted vector
  // and keyword full-text search combined with semantic similarity.
  // - Semantic score: 1 - (c.embedding <=> ${embedding}) (cosine similarity)
  // - Keyword score: ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query}))
  // - Combined score: 0.7 * semantic + 0.3 * keyword (higher is better)
  // Results are ordered by the combined score, while the returned 'score' field
  // preserves the pure semantic similarity for backward compatibility.
  const rows = await prisma.$queryRaw<SemanticSearchResult[]>`
   SELECT
      c.id AS "chunkId",
      c."chunkIndex" AS "chunkIndex",
      c.content AS "content",
      c."tokenCount" AS "tokenCount",
      d.id AS "documentId",
      d.title AS "documentTitle",
      d."fileName" AS "fileName",
      -- Semantic similarity (cosine similarity, higher is better)
      (1 - (c.embedding <=> ${embedding})) AS "score",
      -- Keyword relevance using PostgreSQL full-text search
      ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) AS "keywordScore",
      -- Combined ranking score: 70% semantic + 30% keyword
      (0.7 * (1 - (c.embedding <=> ${embedding})) + 0.3 * ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query}))) AS "combinedScore"
    FROM document_chunks c
    JOIN documents d ON d.id = c."documentId"
    WHERE ${Prisma.join(whereClauses, ' AND ')}
    ORDER BY combinedScore DESC
    LIMIT ${candidateK}
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
    keywordScore: row.keywordScore !== undefined ? Math.round(row.keywordScore * 10000) / 10000 : undefined,
  }));
}
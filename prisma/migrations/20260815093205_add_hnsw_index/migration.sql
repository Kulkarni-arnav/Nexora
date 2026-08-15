-- Add pgvector HNSW index for semantic search performance
-- This index accelerates cosine similarity search on document embeddings
-- The index uses 768-dimensional vectors with cosine similarity operator
-- Note: HNSW indexes are memory-resident; for cost-sensitive deploys consider IVFFlat (see: https://www.postgresql.org/docs/current/ivfflat.html)

CREATE INDEX "document_chunks_embedding_hnsw"
ON "document_chunks"
USING hnsw ("embedding" vector_cosine_ops);
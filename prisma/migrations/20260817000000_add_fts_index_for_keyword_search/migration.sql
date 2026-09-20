-- Add GIN index for PostgreSQL full-text search on document chunk content
-- This index accelerates keyword/term searches across document chunks
-- The index uses tsvector on the content column with English language configuration

CREATE INDEX "document_chunks_content_fts_idx"
ON "document_chunks"
USING GIN (to_tsvector('english', "content"));
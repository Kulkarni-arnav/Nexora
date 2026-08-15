-- Switch embedding storage to gemini-embedding-001 (768-dimensional) vectors.
ALTER TABLE "document_chunks" ALTER COLUMN "embedding" TYPE vector(768) USING "embedding"::vector(768);

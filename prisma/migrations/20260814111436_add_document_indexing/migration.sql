-- DropIndex
DROP INDEX "document_chunks_chunkIndex_idx";

-- AlterTable
ALTER TABLE "document_chunks" ADD COLUMN     "embeddingVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "indexedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkIndex_key" ON "document_chunks"("documentId", "chunkIndex");


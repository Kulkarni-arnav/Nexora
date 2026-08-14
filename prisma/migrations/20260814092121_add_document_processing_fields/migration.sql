-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "contentPath" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "documents_workspaceId_status_idx" ON "documents"("workspaceId", "status");

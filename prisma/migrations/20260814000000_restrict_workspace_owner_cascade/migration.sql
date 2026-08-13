-- AlterTable

-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
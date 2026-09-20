-- Add parentMessageId to Message model for conversation branching support
-- This is nullable, so existing messages will have NULL and the app handles it gracefully

ALTER TABLE "message" ADD COLUMN "parentMessageId" String;

-- Create self-relation index for efficient querying of child messages
CREATE INDEX "message_parent_message_id_idx" ON "message" ("parentMessageId");
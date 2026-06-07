-- Add org_id to messages for record-level tenant isolation.
-- Backfills from parent conversation's org_id where available.
-- This completes the AlloyChat persistence-layer tenant isolation
-- introduced in 0017_alloy_chat_tenant_isolation.sql.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_id INTEGER;

UPDATE messages m
SET org_id = c.org_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND c.org_id IS NOT NULL
  AND m.org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages (org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_conversation ON messages (org_id, conversation_id);

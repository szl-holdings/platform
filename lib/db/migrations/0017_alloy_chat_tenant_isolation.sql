-- Alloy Chat Tenant Isolation
-- Adds org_id ownership columns to all AlloyChat persistent tables so that
-- records can be scoped to a single organization and cross-tenant access is
-- prevented at the database layer.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE alloy_chat_kb_documents ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE alloy_chat_advisories ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE alloy_chat_comparisons ADD COLUMN IF NOT EXISTS org_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations (org_id);
CREATE INDEX IF NOT EXISTS idx_alloy_chat_kb_documents_org_id ON alloy_chat_kb_documents (org_id);
CREATE INDEX IF NOT EXISTS idx_alloy_chat_advisories_org_id ON alloy_chat_advisories (org_id);
CREATE INDEX IF NOT EXISTS idx_alloy_chat_comparisons_org_id ON alloy_chat_comparisons (org_id);

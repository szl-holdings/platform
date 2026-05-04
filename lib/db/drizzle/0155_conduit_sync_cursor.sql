-- Add dedicated cursor state columns to conduit_syncs for first-class incremental sync persistence.
-- Replaces ad-hoc _syncCursor/_lastSyncAt stored in source_meta JSONB.

ALTER TABLE conduit_syncs ADD COLUMN IF NOT EXISTS cursor_value text;
--> statement-breakpoint
ALTER TABLE conduit_syncs ADD COLUMN IF NOT EXISTS cursor_updated_at timestamptz;

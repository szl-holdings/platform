-- Migration 0073: Register previously-orphaned CRDT change_events table
--
-- The file lib/db/drizzle/0028_crdt_change_events.sql was never registered
-- in the Drizzle journal (_journal.json); only 0028_knowledge_graph_vector_embeddings
-- was registered at idx 28. This migration ensures change_events is tracked.
-- All statements use IF NOT EXISTS — idempotent.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS change_events (
  cursor        bigserial PRIMARY KEY,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  actor_id      text NOT NULL,
  timestamp     timestamp DEFAULT now() NOT NULL,
  delta         jsonb NOT NULL DEFAULT '{}',
  crdt_clock    jsonb NOT NULL DEFAULT '{}',
  app_source    text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS change_events_entity_idx ON change_events (entity_type, entity_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS change_events_cursor_idx ON change_events (cursor);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS change_events_actor_idx ON change_events (actor_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS change_events_timestamp_idx ON change_events (timestamp);

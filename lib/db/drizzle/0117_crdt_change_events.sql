-- CRDT change_events append-only event log
-- Schema matches changeEventsTable in lib/db/src/schema/change_events.ts
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

-- Migration: compliance_calendar + compliance_supervision_queue
--
-- These tables are referenced from the @szl-holdings/db schema (see
-- lib/db/src/schema/compliance.ts) and queried by the Pulse briefing
-- generator (artifacts/api-server/src/routes/pulse.ts → gatherSignals)
-- but were never materialised in the database, so the Legal & Compliance
-- section of the daily brief had no real upcoming-deadline or queue-depth
-- signal to draw on. This migration creates them with the same shape the
-- schema describes.

CREATE TABLE IF NOT EXISTS "compliance_supervision_queue" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "item_id" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'open',
  "title" text NOT NULL,
  "description" text NOT NULL,
  "assigned_to_id" text,
  "assigned_to_name" text,
  "submitted_by_id" text,
  "submitted_by_name" text,
  "related_entities" jsonb,
  "escalation_level" integer NOT NULL DEFAULT 0,
  "escalation_chain" jsonb,
  "risk_score" numeric(5, 2),
  "due_at" timestamp,
  "resolved_at" timestamp,
  "resolution" text,
  "attachments" jsonb,
  "audit_trail" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "compliance_supervision_queue_org_idx"
  ON "compliance_supervision_queue" ("org_id");
CREATE INDEX IF NOT EXISTS "compliance_supervision_queue_status_idx"
  ON "compliance_supervision_queue" ("status");
CREATE INDEX IF NOT EXISTS "compliance_supervision_queue_due_idx"
  ON "compliance_supervision_queue" ("due_at");

CREATE TABLE IF NOT EXISTS "compliance_calendar" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "event_id" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "due_at" timestamp NOT NULL,
  "reminder_at" timestamp,
  "status" text NOT NULL DEFAULT 'upcoming',
  "assigned_to_id" text,
  "assigned_to_name" text,
  "regulatory_body" text,
  "filing_reference" text,
  "completed_at" timestamp,
  "notes" text,
  "recurrence" text NOT NULL DEFAULT 'none',
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "compliance_calendar_org_idx"
  ON "compliance_calendar" ("org_id");
CREATE INDEX IF NOT EXISTS "compliance_calendar_due_idx"
  ON "compliance_calendar" ("due_at");
CREATE INDEX IF NOT EXISTS "compliance_calendar_status_idx"
  ON "compliance_calendar" ("status");

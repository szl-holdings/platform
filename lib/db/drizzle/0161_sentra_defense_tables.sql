-- Sentra Active Defense Fabric — five new operational tables.
-- Backs the full defense stack: real telemetry persistence, canary tokens,
-- hash-chained evidence ledger, HITL response queue, and Sentinel duel sessions.
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Schema must match lib/db/src/schema/sentra.ts exactly.

-- ── 1. sentra_events: Real-time security events from middleware telemetry ─────
CREATE TABLE IF NOT EXISTS "sentra_events" (
    "id" text PRIMARY KEY NOT NULL,
    "event_type" text NOT NULL,
    "source_ip" text,
    "session_id" text,
    "user_id" text,
    "path" text,
    "method" text,
    "status_code" integer,
    "severity" text NOT NULL DEFAULT 'info',
    "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "detected_at" timestamp with time zone NOT NULL DEFAULT now(),
    "retention_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sentra_events_type_idx" ON "sentra_events" ("event_type");
CREATE INDEX IF NOT EXISTS "sentra_events_ip_idx" ON "sentra_events" ("source_ip");
CREATE INDEX IF NOT EXISTS "sentra_events_detected_at_idx" ON "sentra_events" ("detected_at");
CREATE INDEX IF NOT EXISTS "sentra_events_severity_idx" ON "sentra_events" ("severity");

-- ── 2. sentra_canaries: Honey rows / canary tokens for the deception grid ────
CREATE TABLE IF NOT EXISTS "sentra_canaries" (
    "id" text PRIMARY KEY NOT NULL,
    "token_type" text NOT NULL,
    "token_value" text NOT NULL,
    "location" text NOT NULL,
    "description" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "trigger_count" integer NOT NULL DEFAULT 0,
    "last_triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sentra_canaries_type_idx" ON "sentra_canaries" ("token_type");
CREATE INDEX IF NOT EXISTS "sentra_canaries_active_idx" ON "sentra_canaries" ("is_active");

-- ── 3. sentra_evidence_ledger: Append-only, hash-chained audit record ────────
CREATE TABLE IF NOT EXISTS "sentra_evidence_ledger" (
    "id" text PRIMARY KEY NOT NULL,
    "sequence_number" integer NOT NULL,
    "entry_type" text NOT NULL,
    "actor_type" text NOT NULL,
    "actor_id" text,
    "target_type" text,
    "target_id" text,
    "action" text NOT NULL,
    "outcome" text NOT NULL,
    "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "previous_hash" text,
    "entry_hash" text NOT NULL,
    "linked_event_id" text,
    "linked_incident_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sentra_ledger_type_idx" ON "sentra_evidence_ledger" ("entry_type");
CREATE INDEX IF NOT EXISTS "sentra_ledger_seq_idx" ON "sentra_evidence_ledger" ("sequence_number");
CREATE INDEX IF NOT EXISTS "sentra_ledger_created_idx" ON "sentra_evidence_ledger" ("created_at");
CREATE INDEX IF NOT EXISTS "sentra_ledger_incident_idx" ON "sentra_evidence_ledger" ("linked_incident_id");

-- ── 4. sentra_response_queue: HITL approval queue for defensive actions ───────
-- NOTE: auto_execute column must be present — matches Drizzle schema autoExecute boolean('auto_execute').
CREATE TABLE IF NOT EXISTS "sentra_response_queue" (
    "id" text PRIMARY KEY NOT NULL,
    "action_type" text NOT NULL,
    "category" text NOT NULL,
    "target" text NOT NULL,
    "target_type" text NOT NULL,
    "reason" text NOT NULL,
    "risk_level" text NOT NULL DEFAULT 'medium',
    "status" text NOT NULL DEFAULT 'pending',
    "auto_execute" boolean NOT NULL DEFAULT false,
    "linked_event_id" text,
    "linked_incident_id" text,
    "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
    "resolved_at" timestamp with time zone,
    "resolved_by" text,
    "details" jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS "sentra_rq_status_idx" ON "sentra_response_queue" ("status");
CREATE INDEX IF NOT EXISTS "sentra_rq_category_idx" ON "sentra_response_queue" ("category");
CREATE INDEX IF NOT EXISTS "sentra_rq_requested_idx" ON "sentra_response_queue" ("requested_at");

-- ── 5. sentra_duel_sessions: Sentinel-vs-Adversary engagement tracking ────────
-- Columns match lib/db/src/schema/sentra.ts sentraDuelSessionsTable exactly.
CREATE TABLE IF NOT EXISTS "sentra_duel_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "session_key" text NOT NULL,
    "attacker_profile" text NOT NULL DEFAULT 'unknown',
    "attacker_confidence" integer NOT NULL DEFAULT 0,
    "sentinel_strategy" text,
    "counter_move_count" integer NOT NULL DEFAULT 0,
    "status" text NOT NULL DEFAULT 'active',
    "timeline" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "policy_estimate" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "started_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "ended_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "sentra_duel_session_key_uq" ON "sentra_duel_sessions" ("session_key");
CREATE INDEX IF NOT EXISTS "sentra_duel_status_idx" ON "sentra_duel_sessions" ("status");
CREATE INDEX IF NOT EXISTS "sentra_duel_session_key_idx" ON "sentra_duel_sessions" ("session_key");
CREATE INDEX IF NOT EXISTS "sentra_duel_started_idx" ON "sentra_duel_sessions" ("started_at");

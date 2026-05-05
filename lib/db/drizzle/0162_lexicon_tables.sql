-- LEXICON — License Intelligence Catalog (task #4763)
-- Folded in from the archived `lyte-command-center` artifact. Powers the
-- operator-curated `license_approved` inference gate (one of the five HF
-- gates). Schema must mirror lib/db/src/schema/lexicon.ts exactly.

-- ── 1. lexicon_entries: authoritative catalog (one row per model/dataset) ───
CREATE TABLE IF NOT EXISTS "lexicon_entries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "target_id" text NOT NULL,
    "kind" text NOT NULL DEFAULT 'model',
    "provider" text NOT NULL DEFAULT 'huggingface',
    "license" text NOT NULL DEFAULT 'unknown',
    "status" text NOT NULL DEFAULT 'pending_review',
    "risk_flagged" boolean NOT NULL DEFAULT false,
    "risk_note" text,
    "description" text NOT NULL DEFAULT '',
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "seeded" boolean NOT NULL DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "lexicon_entries_target_id_unique" UNIQUE ("target_id")
);

CREATE INDEX IF NOT EXISTS "lexicon_entries_status_idx" ON "lexicon_entries" ("status");
CREATE INDEX IF NOT EXISTS "lexicon_entries_provider_idx" ON "lexicon_entries" ("provider");

-- ── 2. lexicon_review_requests: operator-review queue ──────────────────────
CREATE TABLE IF NOT EXISTS "lexicon_review_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "entry_id" uuid NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "requested_by" text NOT NULL DEFAULT 'inference_gate',
    "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "resolved_at" timestamp,
    CONSTRAINT "lexicon_review_requests_entry_id_fk"
        FOREIGN KEY ("entry_id") REFERENCES "lexicon_entries"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "lexicon_review_requests_status_idx" ON "lexicon_review_requests" ("status");
CREATE INDEX IF NOT EXISTS "lexicon_review_requests_entry_idx" ON "lexicon_review_requests" ("entry_id");

-- ── 3. lexicon_decisions: append-only audit trail of approve/deny actions ──
CREATE TABLE IF NOT EXISTS "lexicon_decisions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "entry_id" uuid NOT NULL,
    "review_request_id" uuid,
    "decision" text NOT NULL,
    "reason" text NOT NULL DEFAULT '',
    "decided_by" text NOT NULL,
    "decided_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "lexicon_decisions_entry_id_fk"
        FOREIGN KEY ("entry_id") REFERENCES "lexicon_entries"("id") ON DELETE CASCADE,
    CONSTRAINT "lexicon_decisions_review_request_id_fk"
        FOREIGN KEY ("review_request_id") REFERENCES "lexicon_review_requests"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "lexicon_decisions_entry_idx" ON "lexicon_decisions" ("entry_id");
CREATE INDEX IF NOT EXISTS "lexicon_decisions_decided_at_idx" ON "lexicon_decisions" ("decided_at");

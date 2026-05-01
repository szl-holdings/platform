-- Sentra cyber resilience cockpit — incidents and alerts persistence.
-- Backs the public /api/sentra/{incidents,alerts,summary} routes which
-- previously crashed with 500 because the tables were missing.
--
-- Schema mirrors lib/db/src/schema/sentra.ts (sentraIncidentsTable,
-- sentraAlertsTable). Idempotent so it can be applied to envs where a
-- previous attempt may have partially created the objects.

CREATE TABLE IF NOT EXISTS "sentra_incidents" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "severity" text NOT NULL,
    "status" text NOT NULL DEFAULT 'open',
    "mitre_stage" text NOT NULL DEFAULT 'Initial Access',
    "detected_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "resolved_at" timestamp with time zone,
    "assigned_to" text,
    "affected_assets" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "timeline" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sentra_incidents_status_idx"
    ON "sentra_incidents" ("status");
CREATE INDEX IF NOT EXISTS "sentra_incidents_severity_idx"
    ON "sentra_incidents" ("severity");
CREATE INDEX IF NOT EXISTS "sentra_incidents_detected_at_idx"
    ON "sentra_incidents" ("detected_at");

CREATE TABLE IF NOT EXISTS "sentra_alerts" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "severity" text NOT NULL,
    "source" text NOT NULL,
    "status" text NOT NULL DEFAULT 'open',
    "description" text NOT NULL,
    "asset" text,
    "detected_at" timestamp with time zone NOT NULL DEFAULT now(),
    "linked_incident_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

DO $$ BEGIN
    ALTER TABLE "sentra_alerts"
        ADD CONSTRAINT "sentra_alerts_linked_incident_id_fk"
        FOREIGN KEY ("linked_incident_id")
        REFERENCES "sentra_incidents"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "sentra_alerts_status_idx"
    ON "sentra_alerts" ("status");
CREATE INDEX IF NOT EXISTS "sentra_alerts_severity_idx"
    ON "sentra_alerts" ("severity");
CREATE INDEX IF NOT EXISTS "sentra_alerts_detected_at_idx"
    ON "sentra_alerts" ("detected_at");

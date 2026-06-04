CREATE TABLE IF NOT EXISTS "fusion_cortex_alerts" (
  "id" serial PRIMARY KEY NOT NULL,
  "alert_id" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "severity" text NOT NULL DEFAULT 'medium',
  "category" text NOT NULL,
  "confidence" numeric(5, 4) NOT NULL,
  "affected_domains" text[] NOT NULL DEFAULT '{}',
  "affected_entities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "evidence_chain" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "recommended_actions" text[] NOT NULL DEFAULT '{}',
  "advisory_context" text,
  "tags" text[] NOT NULL DEFAULT '{}',
  "pattern_id" text,
  "status" text NOT NULL DEFAULT 'active',
  "generated_at" timestamp NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "fusion_cortex_alerts_alert_id_idx" ON "fusion_cortex_alerts" ("alert_id");
CREATE INDEX IF NOT EXISTS "fusion_cortex_alerts_status_idx" ON "fusion_cortex_alerts" ("status");
CREATE INDEX IF NOT EXISTS "fusion_cortex_alerts_severity_idx" ON "fusion_cortex_alerts" ("severity");
CREATE INDEX IF NOT EXISTS "fusion_cortex_alerts_generated_at_idx" ON "fusion_cortex_alerts" ("generated_at");
CREATE INDEX IF NOT EXISTS "fusion_cortex_alerts_expires_at_idx" ON "fusion_cortex_alerts" ("expires_at");

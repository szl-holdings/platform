CREATE TABLE IF NOT EXISTS "ot_ics_assets" (
  "id" serial PRIMARY KEY NOT NULL,
  "asset_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "zone" text NOT NULL,
  "protocol" text NOT NULL,
  "baseline" numeric(8,2) NOT NULL DEFAULT '10',
  "baseline_window_days" integer NOT NULL DEFAULT 30,
  "baseline_last_computed_at" timestamp,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_assets_zone_idx" ON "ot_ics_assets" ("zone");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_assets_protocol_idx" ON "ot_ics_assets" ("protocol");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ot_ics_decoded_frames" (
  "id" serial PRIMARY KEY NOT NULL,
  "frame_id" text NOT NULL UNIQUE,
  "observed_at" timestamp NOT NULL DEFAULT now(),
  "protocol" text NOT NULL,
  "src" text NOT NULL,
  "dst" text NOT NULL,
  "asset_id" text,
  "function_label" text NOT NULL,
  "summary" text NOT NULL,
  "severity" text NOT NULL DEFAULT 'info',
  "raw_hex" text NOT NULL,
  "fields" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "forensic_event_id" text,
  "conversation_session_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_frames_observed_at_idx" ON "ot_ics_decoded_frames" ("observed_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_frames_protocol_idx" ON "ot_ics_decoded_frames" ("protocol");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_frames_asset_idx" ON "ot_ics_decoded_frames" ("asset_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ot_ics_conversations" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "seq" integer NOT NULL,
  "observed_at" timestamp NOT NULL DEFAULT now(),
  "direction" text NOT NULL,
  "src" text NOT NULL,
  "dst" text NOT NULL,
  "protocol" text NOT NULL,
  "summary" text NOT NULL,
  "bytes" integer NOT NULL DEFAULT 0,
  "anomalous" boolean NOT NULL DEFAULT false,
  "frame_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ot_ics_conv_session_seq_unique" ON "ot_ics_conversations" ("session_id", "seq");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_conv_session_idx" ON "ot_ics_conversations" ("session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ot_ics_anomaly_scores" (
  "id" serial PRIMARY KEY NOT NULL,
  "asset_id" text NOT NULL,
  "bucket_at" timestamp NOT NULL,
  "score" numeric(8,2) NOT NULL,
  "baseline_snapshot" numeric(8,2),
  "reason" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ot_ics_scores_asset_bucket_unique" ON "ot_ics_anomaly_scores" ("asset_id", "bucket_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_scores_asset_idx" ON "ot_ics_anomaly_scores" ("asset_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_scores_bucket_idx" ON "ot_ics_anomaly_scores" ("bucket_at");

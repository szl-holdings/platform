ALTER TABLE "ot_ics_decoded_frames" ADD COLUMN IF NOT EXISTS "triage_status" text;
--> statement-breakpoint
ALTER TABLE "ot_ics_decoded_frames" ADD COLUMN IF NOT EXISTS "acknowledged_at" timestamp;
--> statement-breakpoint
ALTER TABLE "ot_ics_decoded_frames" ADD COLUMN IF NOT EXISTS "acknowledged_by" text;
--> statement-breakpoint
ALTER TABLE "ot_ics_decoded_frames" ADD COLUMN IF NOT EXISTS "incident_ref" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ot_ics_frames_triage_idx" ON "ot_ics_decoded_frames" ("triage_status");

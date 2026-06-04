CREATE TABLE IF NOT EXISTS "pulse_briefings" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "edition" text NOT NULL,
  "classification" text NOT NULL,
  "status" text DEFAULT 'published' NOT NULL,
  "overall_risk" text NOT NULL,
  "overall_confidence" numeric NOT NULL,
  "headline" text NOT NULL,
  "lead_sentence" text NOT NULL,
  "domains" jsonb NOT NULL,
  "sections" jsonb NOT NULL,
  "recommended_actions" jsonb NOT NULL,
  "generated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pulse_dissents" (
  "id" serial PRIMARY KEY NOT NULL,
  "dissent_id" text NOT NULL UNIQUE,
  "briefing_id" text NOT NULL,
  "section_id" text NOT NULL,
  "section_title" text NOT NULL,
  "dissenting_view" text NOT NULL,
  "basis" text NOT NULL,
  "impact_if_correct" text DEFAULT '' NOT NULL,
  "filed_by" text NOT NULL,
  "filed_at" timestamp DEFAULT now() NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "resolution" text,
  "resolved_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pulse_custom_briefs" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" text NOT NULL UNIQUE,
  "topic" text NOT NULL,
  "entity" text,
  "scenario" text,
  "domains" jsonb,
  "agents" jsonb,
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "briefing_id" text
);

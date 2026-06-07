CREATE TABLE IF NOT EXISTS "pulse_watchlist" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "entity_uri" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_label" text NOT NULL,
  "domain" text NOT NULL,
  "metadata" jsonb,
  "added_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pulse_watchlist_user_entity_unique" ON "pulse_watchlist" ("user_id","entity_uri");

CREATE TABLE IF NOT EXISTS "pulse_follow_ups" (
  "id" serial PRIMARY KEY NOT NULL,
  "follow_up_id" text NOT NULL UNIQUE,
  "briefing_id" text NOT NULL,
  "section_id" text,
  "user_id" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "provenance" jsonb,
  "asked_at" timestamp DEFAULT now() NOT NULL,
  "answered_at" timestamp
);

CREATE TABLE IF NOT EXISTS "pulse_push_schedule" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE,
  "enabled" boolean DEFAULT true NOT NULL,
  "delivery_hour_utc" integer DEFAULT 7 NOT NULL,
  "last_delivered_at" timestamp,
  "last_briefing_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pulse_personalized_narratives" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "date_key" text NOT NULL,
  "source_briefing_id" text,
  "narrative" text,
  "watched_domains" jsonb DEFAULT '[]' NOT NULL,
  "watched_entity_uris" jsonb DEFAULT '[]' NOT NULL,
  "filtered_section_count" integer,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pulse_personalized_narratives_user_date_unique"
  ON "pulse_personalized_narratives" ("user_id","date_key");

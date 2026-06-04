CREATE TABLE IF NOT EXISTS "pulse_email_subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "email" text NOT NULL,
  "domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "unsubscribe_token" text NOT NULL,
  "last_sent_briefing_id" text,
  "last_sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "pulse_email_subscriptions_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pulse_email_subscriptions_user_id_idx" ON "pulse_email_subscriptions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pulse_email_subscriptions_status_idx" ON "pulse_email_subscriptions" ("status");

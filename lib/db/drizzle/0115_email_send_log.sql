CREATE TABLE IF NOT EXISTS "email_send_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer,
	"channel" text DEFAULT 'email' NOT NULL,
	"provider" text,
	"message_id" text,
	"recipient" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_send_log_notification_idx" ON "email_send_log" ("notification_id");
CREATE INDEX IF NOT EXISTS "email_send_log_status_idx" ON "email_send_log" ("status");
CREATE INDEX IF NOT EXISTS "email_send_log_sent_at_idx" ON "email_send_log" ("sent_at");

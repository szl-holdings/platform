CREATE TABLE IF NOT EXISTS "push_receipts" (
  "id" serial PRIMARY KEY NOT NULL,
  "ticket_id" text NOT NULL UNIQUE,
  "history_id" integer,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "token" text NOT NULL,
  "app_id" text NOT NULL,
  "template_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "error_code" text,
  "error_message" text,
  "checked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_notification_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "app_id" text NOT NULL,
  "template_id" text,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "data" jsonb,
  "target" text NOT NULL DEFAULT 'user',
  "tokens_sent" integer NOT NULL DEFAULT 0,
  "tokens_failed" integer NOT NULL DEFAULT 0,
  "tokens_delivered" integer NOT NULL DEFAULT 0,
  "delivery_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "app_id" text,
  "target" text NOT NULL DEFAULT 'user',
  "template" text,
  "vars" jsonb,
  "title" text,
  "body" text,
  "data" jsonb,
  "send_at" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "processed_at" timestamp,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_notification_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "app_id" text NOT NULL,
  "category" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_notif_prefs_user_app_cat_idx" ON "push_notification_preferences" ("user_id", "app_id", "category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_receipts_status_idx" ON "push_receipts" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_receipts_history_id_idx" ON "push_receipts" ("history_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_notif_history_user_idx" ON "push_notification_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_notif_history_app_idx" ON "push_notification_history" ("app_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_notifications_send_at_idx" ON "scheduled_notifications" ("send_at", "status");

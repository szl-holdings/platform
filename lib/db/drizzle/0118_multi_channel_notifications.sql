CREATE TABLE IF NOT EXISTS "web_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id") ON DELETE cascade,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"app_id" text DEFAULT 'unknown' NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "web_push_subscriptions_endpoint_idx" ON "web_push_subscriptions" ("endpoint");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id") ON DELETE cascade,
	"phone_number" text NOT NULL,
	"label" text,
	"sms_enabled" boolean DEFAULT true NOT NULL,
	"voice_enabled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_recipients_phone_idx" ON "notification_recipients" ("phone_number");

CREATE TABLE IF NOT EXISTS "inference_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"agent_id" text,
	"action" text NOT NULL DEFAULT 'inference',
	"entity_type" text NOT NULL DEFAULT 'llm-call',
	"entity_id" text,
	"actor" text NOT NULL DEFAULT 'system',
	"platform" text NOT NULL DEFAULT 'Internal',
	"confidence" numeric(5, 4),
	"latency_ms" integer,
	"created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inf_log_model_idx" ON "inference_log" USING btree ("model");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inf_log_agent_idx" ON "inference_log" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inf_log_actor_idx" ON "inference_log" USING btree ("actor");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inf_log_created_idx" ON "inference_log" USING btree ("created_at");

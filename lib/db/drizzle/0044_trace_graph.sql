DO $$ BEGIN
 CREATE TYPE "public"."trace_status" AS ENUM('running', 'completed', 'failed', 'rolled-back');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."span_status" AS ENUM('ok', 'error', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."trace_event_kind" AS ENUM('tool_call', 'retrieval', 'memory_read', 'memory_write', 'memory_evict', 'model_call', 'guardrail', 'approval', 'policy_decision', 'error', 'retry', 'rollback', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"request_id" text,
	"session_id" text,
	"workflow_id" text,
	"agent_id" text,
	"user_id" text,
	"operator_id" text,
	"domain" text,
	"model" text,
	"prompt_version" text,
	"status" "trace_status" DEFAULT 'running' NOT NULL,
	"latency_ms" real,
	"total_tokens" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost_usd" real,
	"retries" integer DEFAULT 0 NOT NULL,
	"rollback_id" text,
	"is_replay" boolean DEFAULT false NOT NULL,
	"replay_of_trace_id" text,
	"business_impact" jsonb,
	"outputs" jsonb,
	"metadata" jsonb DEFAULT '{}',
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "traces_trace_id_unique" UNIQUE("trace_id")
);

CREATE TABLE IF NOT EXISTS "trace_spans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"span_id" text NOT NULL,
	"parent_span_id" text,
	"name" text NOT NULL,
	"status" "span_status" DEFAULT 'ok' NOT NULL,
	"latency_ms" real,
	"error_message" text,
	"attributes" jsonb DEFAULT '{}',
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trace_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"span_id" text,
	"kind" "trace_event_kind" NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb DEFAULT '{}',
	"latency_ms" real,
	"tokens" integer,
	"cost_usd" real,
	"success" boolean,
	"error_code" text,
	"error_message" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trace_entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"role" text DEFAULT 'touched' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "trace_entity_links" ADD CONSTRAINT "trace_entity_links_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "traces_trace_id_idx" ON "traces" USING btree ("trace_id");
CREATE INDEX IF NOT EXISTS "traces_request_id_idx" ON "traces" USING btree ("request_id");
CREATE INDEX IF NOT EXISTS "traces_agent_id_idx" ON "traces" USING btree ("agent_id");
CREATE INDEX IF NOT EXISTS "traces_workflow_id_idx" ON "traces" USING btree ("workflow_id");
CREATE INDEX IF NOT EXISTS "traces_session_id_idx" ON "traces" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "traces_domain_idx" ON "traces" USING btree ("domain");
CREATE INDEX IF NOT EXISTS "traces_status_idx" ON "traces" USING btree ("status");
CREATE INDEX IF NOT EXISTS "traces_started_at_idx" ON "traces" USING btree ("started_at");
CREATE INDEX IF NOT EXISTS "traces_user_id_idx" ON "traces" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "trace_spans_trace_id_idx" ON "trace_spans" USING btree ("trace_id");
CREATE INDEX IF NOT EXISTS "trace_spans_span_id_idx" ON "trace_spans" USING btree ("span_id");
CREATE INDEX IF NOT EXISTS "trace_spans_parent_span_id_idx" ON "trace_spans" USING btree ("parent_span_id");
CREATE INDEX IF NOT EXISTS "trace_spans_started_at_idx" ON "trace_spans" USING btree ("started_at");

CREATE INDEX IF NOT EXISTS "trace_events_trace_id_idx" ON "trace_events" USING btree ("trace_id");
CREATE INDEX IF NOT EXISTS "trace_events_span_id_idx" ON "trace_events" USING btree ("span_id");
CREATE INDEX IF NOT EXISTS "trace_events_kind_idx" ON "trace_events" USING btree ("kind");
CREATE INDEX IF NOT EXISTS "trace_events_occurred_at_idx" ON "trace_events" USING btree ("occurred_at");

CREATE INDEX IF NOT EXISTS "trace_entity_links_trace_id_idx" ON "trace_entity_links" USING btree ("trace_id");
CREATE INDEX IF NOT EXISTS "trace_entity_links_entity_id_idx" ON "trace_entity_links" USING btree ("entity_id");

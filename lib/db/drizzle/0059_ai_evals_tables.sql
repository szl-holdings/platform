CREATE TABLE IF NOT EXISTS "ai_traces" (
  "trace_id" varchar(128) PRIMARY KEY,
  "correlation_id" varchar(128),
  "org_id" integer,
  "agent_id" varchar(128),
  "model" varchar(200) NOT NULL,
  "model_provider" varchar(100) NOT NULL,
  "model_version" varchar(100),
  "route_class" varchar(100),
  "domain" varchar(80) NOT NULL,
  "recommendation_type" varchar(80) NOT NULL,
  "prompt_hash" varchar(32) NOT NULL,
  "prompt_tokens" integer NOT NULL DEFAULT 0,
  "completion_tokens" integer NOT NULL DEFAULT 0,
  "latency_ms" integer NOT NULL DEFAULT 0,
  "cost_estimate_usd" numeric(14, 8) NOT NULL DEFAULT 0,
  "confidence" numeric(6, 4) NOT NULL DEFAULT 1,
  "risk_level" varchar(20),
  "requires_review" boolean NOT NULL DEFAULT false,
  "review_reason" text,
  "proof_chain_id" integer,
  "outcome_graph_id" integer,
  "input_summary" text,
  "output_summary" text,
  "tools_used" jsonb,
  "eval_score" numeric(6, 4),
  "eval_passed" boolean,
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "captured_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_org_id_idx" ON "ai_traces" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_domain_idx" ON "ai_traces" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_status_idx" ON "ai_traces" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_requires_review_idx" ON "ai_traces" ("requires_review");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_captured_at_idx" ON "ai_traces" ("captured_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_traces_org_domain_idx" ON "ai_traces" ("org_id", "domain");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_review_queue" (
  "review_id" varchar(128) PRIMARY KEY,
  "trace_id" varchar(128) NOT NULL,
  "org_id" integer,
  "domain" varchar(80) NOT NULL,
  "recommendation_type" varchar(80) NOT NULL,
  "model" varchar(200) NOT NULL,
  "confidence" numeric(6, 4) NOT NULL DEFAULT 1,
  "risk_level" varchar(20),
  "review_reason" text NOT NULL,
  "priority" varchar(20) NOT NULL DEFAULT 'low',
  "input_summary" text,
  "output_summary" text,
  "cost_estimate_usd" numeric(14, 8) NOT NULL DEFAULT 0,
  "latency_ms" integer NOT NULL DEFAULT 0,
  "eval_score" numeric(6, 4),
  "eval_passed" boolean,
  "verdict" varchar(30),
  "reviewed_by" integer,
  "review_notes" text,
  "escalated_to" varchar(200),
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "enqueued_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_org_id_idx" ON "ai_review_queue" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_status_idx" ON "ai_review_queue" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_priority_idx" ON "ai_review_queue" ("priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_domain_idx" ON "ai_review_queue" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_enqueued_at_idx" ON "ai_review_queue" ("enqueued_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_review_queue_trace_id_idx" ON "ai_review_queue" ("trace_id");

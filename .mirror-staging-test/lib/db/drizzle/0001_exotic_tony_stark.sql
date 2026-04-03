CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisory_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"analysis_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"score" integer DEFAULT 75 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_memory_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"fact_type" text NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_model_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"token_budget" integer DEFAULT 100000 NOT NULL,
	"tokens_used_period" integer DEFAULT 0 NOT NULL,
	"period_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_model_assignments_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_tool_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"input" text NOT NULL,
	"output" text,
	"success" boolean DEFAULT true NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_usage_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"domain" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_safety_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"agent_id" text,
	"severity" text DEFAULT 'low' NOT NULL,
	"description" text NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"input_sample" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_advisories" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"results" jsonb NOT NULL,
	"ratings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_kb_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"content" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"total_chunks" integer DEFAULT 1 NOT NULL,
	"embedding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisory_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"recommendation_type" text NOT NULL,
	"risk_level" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"runbook" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"actioned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_behavior_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tone" text DEFAULT 'professional',
	"detail_level" text DEFAULT 'balanced',
	"domain_jargon" boolean DEFAULT true NOT NULL,
	"response_length" text DEFAULT 'medium',
	"custom_instructions" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_behavior_prefs_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"rating" integer NOT NULL,
	"message_content" text,
	"response_content" text,
	"feedback_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_training_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
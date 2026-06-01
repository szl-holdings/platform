CREATE TABLE IF NOT EXISTS "firestorm_tool_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"called_by" text DEFAULT 'alloy' NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"execution_mode" text DEFAULT 'propose_only' NOT NULL,
	"policy_checked" boolean DEFAULT true NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approval_status" text DEFAULT 'not_required' NOT NULL,
	"result" text NOT NULL,
	"arguments" jsonb DEFAULT '{}' NOT NULL,
	"output" jsonb DEFAULT null,
	"error" text,
	"related_decision_id" text,
	"related_case_id" text,
	"related_incident_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_tool_audit_log_log_id_unique" UNIQUE("log_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ftal_tool_name_idx" ON "firestorm_tool_audit_log"("tool_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ftal_tenant_id_idx" ON "firestorm_tool_audit_log"("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ftal_result_idx" ON "firestorm_tool_audit_log"("result");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ftal_created_at_idx" ON "firestorm_tool_audit_log"("created_at" DESC);

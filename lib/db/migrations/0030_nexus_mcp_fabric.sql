-- Migration: 0030_nexus_mcp_fabric
-- Creates NEXUS MCP Fabric tables: external server registry, session tracking,
-- tool call log, anomaly detection store, and governed workflow definitions.

CREATE TABLE IF NOT EXISTS "nexus_mcp_external_servers" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "endpoint_url" text NOT NULL,
  "auth_method" text NOT NULL DEFAULT 'none',
  "auth_config" jsonb NOT NULL DEFAULT '{}',
  "allowed_tenant_scopes" jsonb NOT NULL DEFAULT '[]',
  "discovered_tools" jsonb NOT NULL DEFAULT '[]',
  "health_status" text NOT NULL DEFAULT 'unknown',
  "latency_ms" integer,
  "error_rate" integer NOT NULL DEFAULT 0,
  "circuit_breaker_state" text NOT NULL DEFAULT 'closed',
  "circuit_breaker_trips" integer NOT NULL DEFAULT 0,
  "last_health_check" timestamp with time zone,
  "last_tool_discovery" timestamp with time zone,
  "enabled" boolean NOT NULL DEFAULT true,
  "created_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_mcp_servers_health_idx" ON "nexus_mcp_external_servers" ("health_status");
CREATE INDEX IF NOT EXISTS "nexus_mcp_servers_enabled_idx" ON "nexus_mcp_external_servers" ("enabled");

CREATE TABLE IF NOT EXISTS "nexus_mcp_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "client_identity" text NOT NULL,
  "client_type" text NOT NULL DEFAULT 'internal',
  "server_identity" text NOT NULL,
  "server_type" text NOT NULL DEFAULT 'internal',
  "external_server_id" text,
  "tenant_id" text,
  "status" text NOT NULL DEFAULT 'active',
  "risk_level" text NOT NULL DEFAULT 'low',
  "tool_call_count" integer NOT NULL DEFAULT 0,
  "error_count" integer NOT NULL DEFAULT 0,
  "policy_violation_count" integer NOT NULL DEFAULT 0,
  "pending_approval_count" integer NOT NULL DEFAULT 0,
  "avg_latency_ms" integer,
  "proof_hash" text,
  "previous_proof_hash" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ended_at" timestamp with time zone,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_mcp_sessions_status_idx" ON "nexus_mcp_sessions" ("status");
CREATE INDEX IF NOT EXISTS "nexus_mcp_sessions_started_at_idx" ON "nexus_mcp_sessions" ("started_at");
CREATE INDEX IF NOT EXISTS "nexus_mcp_sessions_client_idx" ON "nexus_mcp_sessions" ("client_identity");
CREATE INDEX IF NOT EXISTS "nexus_mcp_sessions_server_idx" ON "nexus_mcp_sessions" ("server_identity");

CREATE TABLE IF NOT EXISTS "nexus_mcp_tool_calls" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "tool_name" text NOT NULL,
  "tool_source" text NOT NULL DEFAULT 'internal',
  "external_server_id" text,
  "input_params" jsonb NOT NULL DEFAULT '{}',
  "output_summary" text,
  "output_raw" jsonb,
  "latency_ms" integer,
  "outcome" text NOT NULL DEFAULT 'success',
  "policy_result" text NOT NULL DEFAULT 'pass',
  "policy_reason" text,
  "approval_status" text NOT NULL DEFAULT 'not_required',
  "approval_id" text,
  "error_message" text,
  "sequence_index" integer NOT NULL DEFAULT 0,
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_mcp_tool_calls_session_idx" ON "nexus_mcp_tool_calls" ("session_id");
CREATE INDEX IF NOT EXISTS "nexus_mcp_tool_calls_occurred_at_idx" ON "nexus_mcp_tool_calls" ("occurred_at");
CREATE INDEX IF NOT EXISTS "nexus_mcp_tool_calls_tool_idx" ON "nexus_mcp_tool_calls" ("tool_name");

CREATE TABLE IF NOT EXISTS "nexus_mcp_anomalies" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text,
  "external_server_id" text,
  "anomaly_type" text NOT NULL,
  "severity" text NOT NULL DEFAULT 'medium',
  "description" text NOT NULL,
  "evidence" jsonb NOT NULL DEFAULT '{}',
  "acknowledged" boolean NOT NULL DEFAULT false,
  "acknowledged_by" text,
  "acknowledged_at" timestamp with time zone,
  "detected_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_mcp_anomalies_severity_idx" ON "nexus_mcp_anomalies" ("severity");
CREATE INDEX IF NOT EXISTS "nexus_mcp_anomalies_detected_at_idx" ON "nexus_mcp_anomalies" ("detected_at");
CREATE INDEX IF NOT EXISTS "nexus_mcp_anomalies_acknowledged_idx" ON "nexus_mcp_anomalies" ("acknowledged");

CREATE TABLE IF NOT EXISTS "nexus_governed_workflows" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "trigger_type" text NOT NULL DEFAULT 'manual',
  "trigger_config" jsonb NOT NULL DEFAULT '{}',
  "steps" jsonb NOT NULL DEFAULT '[]',
  "status" text NOT NULL DEFAULT 'draft',
  "last_run_at" timestamp with time zone,
  "run_count" integer NOT NULL DEFAULT 0,
  "created_by" text,
  "tenant_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_governed_workflows_status_idx" ON "nexus_governed_workflows" ("status");

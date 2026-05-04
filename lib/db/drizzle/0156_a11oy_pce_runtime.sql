-- A11oy PCE Runtime persistence tables
-- Stores governance contracts, approval records, proof packets, policy evaluations,
-- mirror eval results, execution traces, workcells, operator runs, and agent performance snapshots.

CREATE TABLE IF NOT EXISTS "a11oy_pce_contracts" (
  "id" serial PRIMARY KEY NOT NULL,
  "contract_id" text NOT NULL UNIQUE,
  "action_id" text NOT NULL,
  "workcell_id" text,
  "origin_signal_ids" jsonb DEFAULT '[]'::jsonb,
  "causal_chain_ids" jsonb DEFAULT '[]'::jsonb,
  "policy_evaluation_id" text,
  "approval_record_id" text,
  "mirror_eval_id" text,
  "execution_trace_id" text,
  "proof_packet_id" text,
  "mode" text DEFAULT 'demo' NOT NULL CHECK (mode IN ('demo','governed')),
  "is_verified" boolean DEFAULT false NOT NULL,
  "evidence_coverage" numeric(5,4) DEFAULT '0',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "verified_at" timestamp
);

CREATE INDEX IF NOT EXISTS "a11oy_pce_contracts_action_idx" ON "a11oy_pce_contracts" ("action_id");
CREATE INDEX IF NOT EXISTS "a11oy_pce_contracts_workcell_idx" ON "a11oy_pce_contracts" ("workcell_id");
CREATE INDEX IF NOT EXISTS "a11oy_pce_contracts_created_idx" ON "a11oy_pce_contracts" ("created_at");

CREATE TABLE IF NOT EXISTS "a11oy_approval_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "approval_id" text NOT NULL UNIQUE,
  "action_id" text NOT NULL,
  "tier" text DEFAULT 'operator' NOT NULL CHECK (tier IN ('auto','operator','executive','board')),
  "status" text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','approved','rejected')),
  "approved_by" text,
  "approved_at" timestamp,
  "rejected_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "a11oy_approval_records_action_idx" ON "a11oy_approval_records" ("action_id");
CREATE INDEX IF NOT EXISTS "a11oy_approval_records_status_idx" ON "a11oy_approval_records" ("status");
CREATE INDEX IF NOT EXISTS "a11oy_approval_records_created_idx" ON "a11oy_approval_records" ("created_at");

CREATE TABLE IF NOT EXISTS "a11oy_proof_packets" (
  "id" serial PRIMARY KEY NOT NULL,
  "packet_id" text NOT NULL UNIQUE,
  "contract_id" text NOT NULL,
  "action_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "hash" text NOT NULL,
  "previous_hash" text,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "witnessed_by" jsonb DEFAULT '[]'::jsonb,
  "issued_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "a11oy_proof_packets_contract_idx" ON "a11oy_proof_packets" ("contract_id");
CREATE INDEX IF NOT EXISTS "a11oy_proof_packets_action_idx" ON "a11oy_proof_packets" ("action_id");
CREATE INDEX IF NOT EXISTS "a11oy_proof_packets_issued_idx" ON "a11oy_proof_packets" ("issued_at");

CREATE TABLE IF NOT EXISTS "a11oy_policy_evaluations" (
  "id" serial PRIMARY KEY NOT NULL,
  "eval_id" text NOT NULL UNIQUE,
  "policy_ids" jsonb DEFAULT '[]'::jsonb,
  "action_id" text NOT NULL,
  "risk_class" text NOT NULL,
  "passed" boolean DEFAULT true NOT NULL,
  "requires_approval" boolean DEFAULT false NOT NULL,
  "approval_tier" text,
  "violations" jsonb DEFAULT '[]'::jsonb,
  "evaluated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "a11oy_policy_evals_action_idx" ON "a11oy_policy_evaluations" ("action_id");
CREATE INDEX IF NOT EXISTS "a11oy_policy_evals_evaluated_idx" ON "a11oy_policy_evaluations" ("evaluated_at");

CREATE TABLE IF NOT EXISTS "a11oy_mirror_eval_results" (
  "id" serial PRIMARY KEY NOT NULL,
  "eval_id" text NOT NULL UNIQUE,
  "target_id" text NOT NULL,
  "target_type" text NOT NULL,
  "disposition" text NOT NULL CHECK (disposition IN ('allowed','blocked','deferred')),
  "overall_score" numeric(5,4) DEFAULT '0',
  "scores" jsonb DEFAULT '[]'::jsonb,
  "flags" jsonb DEFAULT '[]'::jsonb,
  "evaluated_at" timestamp DEFAULT now() NOT NULL,
  "evaluator_version" text DEFAULT '1.0.0'
);

CREATE INDEX IF NOT EXISTS "a11oy_mirror_evals_target_idx" ON "a11oy_mirror_eval_results" ("target_id");
CREATE INDEX IF NOT EXISTS "a11oy_mirror_evals_disposition_idx" ON "a11oy_mirror_eval_results" ("disposition");
CREATE INDEX IF NOT EXISTS "a11oy_mirror_evals_evaluated_idx" ON "a11oy_mirror_eval_results" ("evaluated_at");

CREATE TABLE IF NOT EXISTS "a11oy_execution_traces" (
  "id" serial PRIMARY KEY NOT NULL,
  "trace_id" text NOT NULL UNIQUE,
  "run_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "entity_type" text NOT NULL,
  "entries" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'running' NOT NULL CHECK (status IN ('running','completed','failed')),
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "a11oy_exec_traces_entity_idx" ON "a11oy_execution_traces" ("entity_id");
CREATE INDEX IF NOT EXISTS "a11oy_exec_traces_status_idx" ON "a11oy_execution_traces" ("status");
CREATE INDEX IF NOT EXISTS "a11oy_exec_traces_started_idx" ON "a11oy_execution_traces" ("started_at");

CREATE TABLE IF NOT EXISTS "a11oy_workcells" (
  "id" serial PRIMARY KEY NOT NULL,
  "workcell_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "vertical" text NOT NULL,
  "phase" text NOT NULL DEFAULT 'intake',
  "operator_id" text NOT NULL DEFAULT 'planner',
  "tools" jsonb DEFAULT '[]'::jsonb,
  "approval_tier" text DEFAULT 'operator' NOT NULL CHECK (approval_tier IN ('auto','operator','executive')),
  "max_run_duration_ms" integer NOT NULL DEFAULT 300000,
  "pce_contract_id" text,
  "approval_record_id" text,
  "trace_id" text,
  "proof_packet_id" text,
  "last_error" text,
  "origin_signal_ids" jsonb DEFAULT '[]'::jsonb,
  "history" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "a11oy_workcells_vertical_idx" ON "a11oy_workcells" ("vertical");
CREATE INDEX IF NOT EXISTS "a11oy_workcells_phase_idx" ON "a11oy_workcells" ("phase");
CREATE INDEX IF NOT EXISTS "a11oy_workcells_updated_idx" ON "a11oy_workcells" ("updated_at");

CREATE TABLE IF NOT EXISTS "a11oy_operator_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "run_id" text NOT NULL UNIQUE,
  "intent" text NOT NULL,
  "vertical" text NOT NULL,
  "requested_by" text NOT NULL,
  "status" text NOT NULL DEFAULT 'awaiting_approval',
  "plan" jsonb DEFAULT '[]'::jsonb,
  "audit_log" jsonb DEFAULT '[]'::jsonb,
  "current_step_index" integer NOT NULL DEFAULT 0,
  "plan_summary" text NOT NULL DEFAULT '',
  "estimated_side_effects" jsonb DEFAULT '[]'::jsonb,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "a11oy_operator_runs_status_idx" ON "a11oy_operator_runs" ("status");
CREATE INDEX IF NOT EXISTS "a11oy_operator_runs_vertical_idx" ON "a11oy_operator_runs" ("vertical");
CREATE INDEX IF NOT EXISTS "a11oy_operator_runs_created_idx" ON "a11oy_operator_runs" ("created_at");

CREATE TABLE IF NOT EXISTS "agent_performance_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL UNIQUE,
  "domain" text NOT NULL,
  "total_decisions" integer NOT NULL DEFAULT 0,
  "accepted_decisions" integer NOT NULL DEFAULT 0,
  "avg_confidence" numeric(6,4) NOT NULL DEFAULT '0',
  "avg_latency_ms" numeric(10,2) NOT NULL DEFAULT '0',
  "total_token_cost" integer NOT NULL DEFAULT 0,
  "proposed_optimizations" jsonb DEFAULT '[]'::jsonb,
  "last_updated" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "agent_perf_snapshots_domain_idx" ON "agent_performance_snapshots" ("domain");
CREATE INDEX IF NOT EXISTS "agent_perf_snapshots_updated_idx" ON "agent_performance_snapshots" ("last_updated");

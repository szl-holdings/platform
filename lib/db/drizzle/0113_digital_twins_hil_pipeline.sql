-- Task #3604: HIL simulation pipeline — persistent digital twins and simulation history.
-- Creates digital_twins (twin registry) and twin_simulation_runs (MC audit trail).

CREATE TABLE IF NOT EXISTS "digital_twins" (
    "id" text PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
    "entity_id" text NOT NULL,
    "entity_name" text NOT NULL,
    "twin_type" text NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "current_state" jsonb DEFAULT '{}' NOT NULL,
    "predicted_states" jsonb DEFAULT '[]' NOT NULL,
    "alerts" jsonb DEFAULT '[]' NOT NULL,
    "confidence_score" real DEFAULT 0.5 NOT NULL,
    "metadata" jsonb DEFAULT '{}' NOT NULL,
    "last_synced_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "digital_twins_entity_idx" ON "digital_twins" ("entity_id");
CREATE INDEX IF NOT EXISTS "digital_twins_type_idx" ON "digital_twins" ("twin_type");
CREATE INDEX IF NOT EXISTS "digital_twins_org_idx" ON "digital_twins" ("org_id");
CREATE INDEX IF NOT EXISTS "digital_twins_status_idx" ON "digital_twins" ("status");
CREATE INDEX IF NOT EXISTS "digital_twins_synced_idx" ON "digital_twins" ("last_synced_at");

CREATE TABLE IF NOT EXISTS "twin_simulation_runs" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
    "twin_id" text NOT NULL REFERENCES "digital_twins"("id") ON DELETE cascade,
    "scenario_name" text NOT NULL,
    "scenario_parameters" jsonb DEFAULT '{}' NOT NULL,
    "original_state" jsonb DEFAULT '{}' NOT NULL,
    "simulated_state" jsonb DEFAULT '{}' NOT NULL,
    "delta_metrics" jsonb DEFAULT '{}' NOT NULL,
    "risk_assessment" text,
    "recommended_actions" jsonb DEFAULT '[]' NOT NULL,
    "confidence_score" real DEFAULT 0.5 NOT NULL,
    "monte_carlo_result" jsonb,
    "run_duration_ms" integer,
    "created_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "twin_sim_runs_twin_idx" ON "twin_simulation_runs" ("twin_id");
CREATE INDEX IF NOT EXISTS "twin_sim_runs_org_idx" ON "twin_simulation_runs" ("org_id");
CREATE INDEX IF NOT EXISTS "twin_sim_runs_created_idx" ON "twin_simulation_runs" ("created_at");
CREATE INDEX IF NOT EXISTS "twin_sim_runs_scenario_idx" ON "twin_simulation_runs" ("scenario_name");

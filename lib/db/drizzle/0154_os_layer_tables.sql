CREATE TABLE IF NOT EXISTS "os_recommendations" (
  "id" serial PRIMARY KEY,
  "rec_id" text NOT NULL,
  "variant" text NOT NULL,
  "priority" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "category" text,
  "title" text NOT NULL,
  "data" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "os_recommendations_variant_idx" ON "os_recommendations" ("variant");
CREATE INDEX IF NOT EXISTS "os_recommendations_rec_id_idx" ON "os_recommendations" ("rec_id");
CREATE INDEX IF NOT EXISTS "os_recommendations_status_idx" ON "os_recommendations" ("status");

CREATE TABLE IF NOT EXISTS "os_source_health" (
  "id" serial PRIMARY KEY,
  "source_id" text NOT NULL,
  "variant" text NOT NULL,
  "data" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "os_source_health_variant_idx" ON "os_source_health" ("variant");

CREATE TABLE IF NOT EXISTS "os_runs" (
  "id" serial PRIMARY KEY,
  "run_id" text NOT NULL,
  "variant" text NOT NULL,
  "status" text NOT NULL DEFAULT 'completed',
  "data" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "os_runs_variant_idx" ON "os_runs" ("variant");
CREATE INDEX IF NOT EXISTS "os_runs_run_id_idx" ON "os_runs" ("run_id");

CREATE TABLE IF NOT EXISTS "os_eval_results" (
  "id" serial PRIMARY KEY,
  "skill_name" text NOT NULL,
  "pass_rate_bps" integer NOT NULL,
  "total" integer NOT NULL,
  "passed" integer NOT NULL,
  "regressions" integer NOT NULL DEFAULT 0,
  "trend" text NOT NULL DEFAULT 'stable',
  "last_run_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "os_command_kpis" (
  "id" serial PRIMARY KEY,
  "data" jsonb NOT NULL,
  "computed_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "os_platform_stats" (
  "id" serial PRIMARY KEY,
  "data" jsonb NOT NULL,
  "computed_at" timestamp NOT NULL DEFAULT now()
);

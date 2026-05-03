-- Migration: 0154_runtime_config
-- Creates the runtime_config table for operator-tunable parameters.
-- Values are stored as text and typed via value_type for safe casting.

CREATE TABLE IF NOT EXISTS "runtime_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "value_type" text NOT NULL DEFAULT 'string',
  "description" text,
  "default_value" text,
  "category" text NOT NULL DEFAULT 'general',
  "is_sensitive" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "runtime_config_key_idx" ON "runtime_config" ("key");
CREATE INDEX IF NOT EXISTS "runtime_config_category_idx" ON "runtime_config" ("category");

-- Seed with sensible operational defaults so `getConfig()` callers have
-- a concrete row to read rather than falling back to code defaults.
INSERT INTO "runtime_config" ("key", "value", "value_type", "description", "default_value", "category") VALUES
  ('rate_limit_global_max',         '200',   'number',  'Global rate limiter: max requests per 15-minute window per user/org',          '200',   'rate_limits'),
  ('rate_limit_write_max',          '100',   'number',  'Write rate limiter: max write requests per 15-minute window',                  '100',   'rate_limits'),
  ('rate_limit_ai_inference_max',   '30',    'number',  'AI inference rate limiter: max calls per 15-minute window',                    '30',    'rate_limits'),
  ('circuit_breaker_threshold',     '50',    'number',  'Circuit breaker: error-rate percentage (0-100) that opens the breaker',       '50',    'circuit_breaker'),
  ('circuit_breaker_reset_ms',      '30000', 'number',  'Circuit breaker: cooldown milliseconds before half-open probe',               '30000', 'circuit_breaker'),
  ('slo_latency_p99_ms',            '2000',  'number',  'SLO target: p99 response latency budget in milliseconds',                     '2000',  'slo'),
  ('slo_error_rate_pct',            '1',     'number',  'SLO target: max acceptable error rate percentage (0-100)',                    '1',     'slo'),
  ('job_cleanup_interval_ms',       '3600000','number', 'Scheduled job: interval for cleanup/pruning jobs in milliseconds',            '3600000','jobs'),
  ('job_health_check_interval_ms',  '60000', 'number',  'Scheduled job: health-probe polling interval in milliseconds',                '60000', 'jobs'),
  ('load_shed_lag_threshold_ms',    '200',   'number',  'Adaptive load shedder: event-loop lag threshold to start shedding traffic',   '200',   'load_shedder'),
  ('load_shed_pool_pct_threshold',  '90',    'number',  'Adaptive load shedder: DB pool saturation % that triggers shedding',         '90',    'load_shedder'),
  ('flag_cache_ttl_ms',             '30000', 'number',  'Feature flag in-memory cache TTL in milliseconds',                           '30000', 'feature_flags'),
  ('config_cache_ttl_ms',           '60000', 'number',  'Runtime config in-memory cache TTL in milliseconds',                         '60000', 'runtime_config')
ON CONFLICT ("key") DO NOTHING;

-- Add unique constraint on (service_group, metric_type) if not already present.
-- Uses CREATE UNIQUE INDEX IF NOT EXISTS which is a single, idempotent statement.
CREATE UNIQUE INDEX IF NOT EXISTS slo_definitions_group_metric_unique
  ON slo_definitions (service_group, metric_type);

-- Fill full p50/p95/p99 latency coverage across all 6 critical service groups.
-- Uses WHERE NOT EXISTS so the statement is idempotent on re-run.
-- auth: add p50 (p95+p99 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'auth', 'latency_p50', 80.0, 720, '50th percentile auth latency stays under 80ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='auth' AND metric_type='latency_p50');

-- decisions: add p50 (p95+p99 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'decisions', 'latency_p50', 200.0, 720, '50th percentile decision latency stays under 200ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='decisions' AND metric_type='latency_p50');

-- billing: add p50 and p99 (p95 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'billing', 'latency_p50', 300.0, 720, '50th percentile billing latency stays under 300ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='billing' AND metric_type='latency_p50');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'billing', 'latency_p99', 3000.0, 720, '99th percentile billing latency stays under 3000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='billing' AND metric_type='latency_p99');

-- ai_engine: add p50 and p99 (p95 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'ai_engine', 'latency_p50', 800.0, 720, '50th percentile AI engine latency stays under 800ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='ai_engine' AND metric_type='latency_p50');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'ai_engine', 'latency_p99', 10000.0, 720, '99th percentile AI engine latency stays under 10000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='ai_engine' AND metric_type='latency_p99');

-- document_pipeline: add p50 and p99 (p95 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'document_pipeline', 'latency_p50', 1500.0, 720, '50th percentile document pipeline latency stays under 1500ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='document_pipeline' AND metric_type='latency_p50');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'document_pipeline', 'latency_p99', 15000.0, 720, '99th percentile document pipeline latency stays under 15000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='document_pipeline' AND metric_type='latency_p99');

-- platform: add p50 and p99 (p95 already seeded in 0148)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'platform', 'latency_p50', 150.0, 720, '50th percentile platform API latency stays under 150ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='platform' AND metric_type='latency_p50');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'platform', 'latency_p99', 2000.0, 720, '99th percentile platform API latency stays under 2000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='platform' AND metric_type='latency_p99');

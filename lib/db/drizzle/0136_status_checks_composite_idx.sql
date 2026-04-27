CREATE INDEX IF NOT EXISTS "idx_status_checks_svc_ts" ON "platform_status_checks" ("service_id","checked_at");

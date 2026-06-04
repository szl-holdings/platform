CREATE INDEX IF NOT EXISTS "analytics_events_domain_class_ts_idx" ON "analytics_events" ("domain","event_name","occurred_at");

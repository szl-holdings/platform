CREATE TABLE IF NOT EXISTS "stream_data_sources" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "endpoint" TEXT,
  "auth_config" JSONB,
  "polling_interval_ms" INTEGER DEFAULT 30000,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'idle',
  "last_health_at" TIMESTAMP,
  "last_error_at" TIMESTAMP,
  "last_error" TEXT,
  "events_ingested" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stream_ingested_events" (
  "id" SERIAL PRIMARY KEY,
  "external_id" TEXT,
  "source_id" INTEGER REFERENCES "stream_data_sources"("id") ON DELETE SET NULL,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "severity" TEXT,
  "payload" JSONB NOT NULL,
  "normalized_at" TIMESTAMP NOT NULL DEFAULT now(),
  "event_ts" TIMESTAMP NOT NULL DEFAULT now()
);

-- RF Intelligence: satellite pass observations and anomaly records
-- Backs the rf-intel-store.ts correlation engine with durable persistence
-- so pass history and active anomalies survive server restarts.

CREATE TABLE IF NOT EXISTS "rf_satellite_passes" (
  "id" text PRIMARY KEY NOT NULL,
  "satellite_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "vessel_name" text NOT NULL,
  "imo_number" text NOT NULL,
  "observed_lat" real NOT NULL,
  "observed_lon" real NOT NULL,
  "ais_reported_lat" real NOT NULL,
  "ais_reported_lon" real NOT NULL,
  "drift_distance_nm" real NOT NULL,
  "bearing_deviation_deg" real NOT NULL,
  "correlation_score" integer NOT NULL,
  "anomaly_flag" integer NOT NULL DEFAULT 0,
  "anomaly_type" text,
  "pass_timestamp" timestamp NOT NULL DEFAULT now(),
  "coverage_quality" text NOT NULL DEFAULT 'good',
  "confidence_percent" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "rf_passes_entity_idx" ON "rf_satellite_passes" ("entity_id");
CREATE INDEX IF NOT EXISTS "rf_passes_timestamp_idx" ON "rf_satellite_passes" ("pass_timestamp");
CREATE INDEX IF NOT EXISTS "rf_passes_anomaly_idx" ON "rf_satellite_passes" ("anomaly_flag");

CREATE TABLE IF NOT EXISTS "rf_anomalies" (
  "id" text PRIMARY KEY NOT NULL,
  "entity_id" text NOT NULL,
  "vessel_name" text NOT NULL,
  "imo_number" text NOT NULL,
  "anomaly_type" text NOT NULL,
  "severity" text NOT NULL,
  "lat" real NOT NULL,
  "lon" real NOT NULL,
  "drift_distance_nm" real,
  "last_known_lat" real,
  "last_known_lon" real,
  "gap_hours" real,
  "correlation_score" integer NOT NULL,
  "satellite_pass_id" text NOT NULL,
  "description" text NOT NULL,
  "predicted_heading" integer,
  "confidence_percent" integer NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]',
  "region" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "detected_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "rf_anomalies_entity_idx" ON "rf_anomalies" ("entity_id");
CREATE INDEX IF NOT EXISTS "rf_anomalies_type_idx" ON "rf_anomalies" ("anomaly_type");
CREATE INDEX IF NOT EXISTS "rf_anomalies_status_idx" ON "rf_anomalies" ("status");
CREATE INDEX IF NOT EXISTS "rf_anomalies_detected_idx" ON "rf_anomalies" ("detected_at");

-- Migration: 0029_unified_auth_mesh
-- Creates oauth_clients and mesh_call_log tables for the unified auth mesh.
-- The api_keys table already exists and needs no changes.

CREATE TABLE IF NOT EXISTS "oauth_clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL UNIQUE,
  "client_secret_hash" text NOT NULL,
  "name" text NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "allowed_scopes" text[] NOT NULL DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "oauth_clients_client_id_idx" ON "oauth_clients" ("client_id");
CREATE INDEX IF NOT EXISTS "oauth_clients_org_id_idx" ON "oauth_clients" ("org_id");

CREATE TABLE IF NOT EXISTS "mesh_call_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "principal_type" text NOT NULL,
  "principal_id" text NOT NULL,
  "principal_name" text NOT NULL,
  "method" text NOT NULL,
  "path" text NOT NULL,
  "status_code" integer,
  "latency_ms" integer,
  "org_id" integer,
  "timestamp" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "mesh_call_log_principal_type_idx" ON "mesh_call_log" ("principal_type");
CREATE INDEX IF NOT EXISTS "mesh_call_log_principal_id_idx" ON "mesh_call_log" ("principal_id");
CREATE INDEX IF NOT EXISTS "mesh_call_log_timestamp_idx" ON "mesh_call_log" ("timestamp");
CREATE INDEX IF NOT EXISTS "mesh_call_log_path_idx" ON "mesh_call_log" ("path");

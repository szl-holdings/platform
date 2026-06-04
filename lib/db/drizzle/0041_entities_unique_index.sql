-- Migration: Add unique index to entities table (name, source_app)
-- Ensures ON CONFLICT (name, source_app) works correctly for upsert operations

CREATE UNIQUE INDEX IF NOT EXISTS "entities_name_source_app_uniq" ON "entities" USING btree ("name","source_app");

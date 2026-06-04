-- 0103: export_jobs durability — storage_key column for GCS-persisted export files
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS storage_key text;

-- 0102: file scan status + LP uploads + export download URL

-- Add virus scan tracking columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'pending';
ALTER TABLE files ADD COLUMN IF NOT EXISTS quarantined_at timestamptz;

-- LP uploads: LPs upload signed agreements, wire confirmations, KYC docs back to the GP
CREATE TABLE IF NOT EXISTS fund_lp_uploads (
  id serial PRIMARY KEY,
  lp_id integer NOT NULL REFERENCES fund_accredited_investors(id) ON DELETE CASCADE,
  uploaded_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size bigint NOT NULL DEFAULT 0,
  storage_key text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'received',
  notes text,
  reviewed_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fund_lp_uploads_lp_id_idx ON fund_lp_uploads(lp_id);
CREATE INDEX IF NOT EXISTS fund_lp_uploads_status_idx ON fund_lp_uploads(status);
CREATE INDEX IF NOT EXISTS fund_lp_uploads_doc_type_idx ON fund_lp_uploads(doc_type);

-- Add download_url to export_jobs so clients always know where to download
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS download_url text;

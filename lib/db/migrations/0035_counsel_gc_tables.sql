-- Counsel GC: create tables for matters, obligations, audit entries, proof chain entries

CREATE TABLE IF NOT EXISTS pc_gc_matters (
  id text PRIMARY KEY,
  org_id text NOT NULL DEFAULT 'demo',
  name text NOT NULL,
  client_name text NOT NULL,
  matter_number text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  privilege_level text NOT NULL,
  pressure_score integer NOT NULL DEFAULT 0,
  complexity_score integer NOT NULL DEFAULT 0,
  opened_date text NOT NULL,
  trial_date text,
  closing_date text,
  next_deadline text NOT NULL,
  next_deadline_label text NOT NULL,
  lead_counsel text NOT NULL,
  jurisdiction text NOT NULL,
  estimated_exposure numeric(18, 2),
  summary text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]',
  parties jsonb NOT NULL DEFAULT '[]',
  wall jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pc_gc_obligations (
  id text NOT NULL,
  matter_id text NOT NULL REFERENCES pc_gc_matters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date text NOT NULL,
  status text NOT NULL,
  assignee text NOT NULL,
  dependencies jsonb NOT NULL DEFAULT '[]',
  privilege_level text NOT NULL,
  filing_required boolean NOT NULL DEFAULT false,
  court_id text,
  consequence text,
  completed_date text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (matter_id, id)
);

CREATE TABLE IF NOT EXISTS pc_gc_audit_entries (
  id text NOT NULL,
  matter_id text NOT NULL REFERENCES pc_gc_matters(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  role text NOT NULL,
  action text NOT NULL,
  detail text NOT NULL,
  ip text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (matter_id, id)
);

CREATE TABLE IF NOT EXISTS pc_gc_proof_chain_entries (
  id text NOT NULL,
  matter_id text NOT NULL REFERENCES pc_gc_matters(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  privilege_level text NOT NULL,
  author text NOT NULL,
  parties jsonb NOT NULL DEFAULT '[]',
  document_ref text,
  hash text,
  redacted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (matter_id, id)
);

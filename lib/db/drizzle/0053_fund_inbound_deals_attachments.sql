-- Founder deal-submission inbox table + attachments column for uploaded
-- pitch decks and data-room files. Idempotent so it is safe to re-apply on
-- existing environments.
CREATE TABLE IF NOT EXISTS fund_inbound_deals (
  id serial PRIMARY KEY,
  pipeline_id text NOT NULL UNIQUE,
  company text NOT NULL,
  website text,
  sector text NOT NULL,
  stage text NOT NULL,
  ask_size text,
  valuation text,
  arr text,
  growth text,
  founder_name text NOT NULL,
  founder_email text NOT NULL,
  founder_background text,
  founder_education text,
  founder_prior_exits text,
  summary text NOT NULL,
  deck_url text,
  conviction_score integer NOT NULL,
  score_team integer NOT NULL,
  score_market integer NOT NULL,
  score_product integer NOT NULL,
  score_traction integer NOT NULL,
  score_competitive integer NOT NULL,
  score_financials integer NOT NULL,
  status text NOT NULL DEFAULT 'screening',
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'inbound',
  submitted_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fund_inbound_deals_pipeline_id_idx ON fund_inbound_deals (pipeline_id);
CREATE INDEX IF NOT EXISTS fund_inbound_deals_status_idx ON fund_inbound_deals (status);
CREATE INDEX IF NOT EXISTS fund_inbound_deals_submitted_idx ON fund_inbound_deals (submitted_at);

-- New column for founder-uploaded pitch decks and data-room files.
ALTER TABLE fund_inbound_deals
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

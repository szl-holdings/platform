-- Fund inbound deal partner review fields
-- Adds internal notes and an updated_at timestamp to fund_inbound_deals so
-- authenticated partners can annotate deals and track when they were last
-- reviewed. Both columns are safe to add to existing rows:
--   notes   — nullable text, null means no notes yet
--   updated_at — defaults to now(), back-fills existing rows to their submission time

ALTER TABLE fund_inbound_deals
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

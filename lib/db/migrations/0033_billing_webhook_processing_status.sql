-- Migration: 0033_billing_webhook_processing_status
-- Extends the billing_webhook_events status check constraint to include
-- 'processing'. The new three-state machine inserts events as 'processing'
-- while they are being handled, then updates to 'processed' (success) or
-- 'failed' (error). This allows Stripe retries of failed events to be
-- re-claimed rather than silently dropped as duplicates.

ALTER TABLE billing_webhook_events
  DROP CONSTRAINT IF EXISTS billing_webhook_events_status_check;

ALTER TABLE billing_webhook_events
  ADD CONSTRAINT billing_webhook_events_status_check
  CHECK (status = ANY (ARRAY['processing'::text, 'processed'::text, 'skipped'::text, 'failed'::text]));

ALTER TABLE billing_webhook_events
  ALTER COLUMN status SET DEFAULT 'processing';

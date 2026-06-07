-- Migration: Persist preferred return accrued per quarter (Task 2191)
-- Adds preferred_return_accrued to fund_lp_reports so the NAV dashboard's
-- Fees & Carry tab can read the actual quarterly preferred return value
-- instead of computing calledCapital * preferredReturnRate * 0.25 in the UI.
-- This lets finance record true-ups, catch-ups, and accrual adjustments
-- without changing the front-end formula.

ALTER TABLE fund_lp_reports
  ADD COLUMN IF NOT EXISTS preferred_return_accrued NUMERIC(18, 2);

COMMENT ON COLUMN fund_lp_reports.preferred_return_accrued IS
  'Preferred return accrued for this reporting period in dollars. Stored per-period so the NAV dashboard reads it directly instead of recomputing from preferred_return_rate * called_capital. Allows finance to record true-ups and catch-ups.';

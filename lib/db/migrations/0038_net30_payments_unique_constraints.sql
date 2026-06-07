-- Migration: add unique constraints to net30_invoice_payments
-- Prevents double-count from concurrent webhook handlers
-- (invoice.paid + payment_intent.succeeded) landing rows for the same payment.

-- Unique on reference: makes onConflictDoNothing() actually work for same-event redelivery.
CREATE UNIQUE INDEX IF NOT EXISTS net30_payments_reference_uidx
  ON net30_invoice_payments (reference)
  WHERE reference IS NOT NULL;

-- Partial unique on stripe_payment_intent_id: belt-and-suspenders guard so
-- two different webhook event IDs cannot both insert a row for the same PI.
CREATE UNIQUE INDEX IF NOT EXISTS net30_payments_pi_id_uidx
  ON net30_invoice_payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

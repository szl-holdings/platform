-- Migration: 0040_refund_idempotency_composite_key
--
-- Replaces the global unique constraint on billing_refund_requests.idempotency_key
-- with a composite (org_id, idempotency_key) constraint.
--
-- Motivation: the previous global constraint allowed cross-tenant idempotency key
-- collisions to silently leak another organization's refund request data when the
-- fallback SELECT fetched the conflicting row without an org_id filter.
-- The composite key scopes idempotency per organization so:
--   1. Different orgs may reuse the same key without conflict.
--   2. The ON CONFLICT path cannot surface another tenant's row.
--
-- Idempotent: safe to re-run.

DO $$
BEGIN
  -- Drop old global unique constraint if it exists (various naming conventions)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'billing_refund_requests'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%idempotency_key%'
      AND constraint_name NOT LIKE '%org%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE billing_refund_requests DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'billing_refund_requests'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%idempotency_key%'
        AND constraint_name NOT LIKE '%org%'
      LIMIT 1
    );
  END IF;

  -- Add composite unique constraint if it does not already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'billing_refund_requests'
      AND constraint_name = 'billing_refund_requests_org_idempotency_key'
  ) THEN
    ALTER TABLE billing_refund_requests
      ADD CONSTRAINT billing_refund_requests_org_idempotency_key
      UNIQUE (org_id, idempotency_key);
  END IF;
END $$;

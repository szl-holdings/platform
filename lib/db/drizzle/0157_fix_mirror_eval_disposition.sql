-- Fix mirror_eval_results disposition CHECK constraint to match MirrorEvalDisposition type.
-- Previous migration used 'allowed','deferred' which don't exist in the canonical type.

ALTER TABLE "a11oy_mirror_eval_results"
  DROP CONSTRAINT IF EXISTS "a11oy_mirror_eval_results_disposition_check";

ALTER TABLE "a11oy_mirror_eval_results"
  ADD CONSTRAINT "a11oy_mirror_eval_results_disposition_check"
  CHECK (disposition IN ('pass', 'pass_with_warning', 'needs_more_evidence', 'requires_human_review', 'blocked'));

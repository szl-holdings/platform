-- Migration: 0151_sentra_amaru_classification
-- Records the Amaru cortex classification/enrichment override on each
-- Sentra finding so reviewers can see (a) that the cortex saw the
-- finding, (b) what the detector originally emitted, and (c) why the
-- cortex changed (or kept) the severity.
--
-- `severity`/`score` always hold the POST-classification values so
-- existing alerts/queue surfaces don't need to know about the
-- classification step. When the cortex overrides the detector verdict,
-- the original detector-emitted values are preserved in
-- `amaru_original_severity` / `amaru_original_score`; when the cortex
-- passes through unchanged those columns stay NULL.

ALTER TABLE "sentra_findings"
  ADD COLUMN IF NOT EXISTS "amaru_classified_at" TIMESTAMPTZ;

ALTER TABLE "sentra_findings"
  ADD COLUMN IF NOT EXISTS "amaru_original_severity" TEXT
    CHECK ("amaru_original_severity" IN ('critical','high','medium','low','info'));

ALTER TABLE "sentra_findings"
  ADD COLUMN IF NOT EXISTS "amaru_original_score" INTEGER;

ALTER TABLE "sentra_findings"
  ADD COLUMN IF NOT EXISTS "amaru_classification" JSONB;

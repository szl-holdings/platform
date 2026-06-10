# FORGE WORK-ORDER — platform `main` red test suite (triage + fix)

**From:** Perplexity Computer (parent) → Forge
**Date:** 2026-06-10 evening · **Path:** `platform/replit-sync/`
**Priority:** HIGH (Series-A: a green main is table stakes for diligence)

## Status after this session
- ✅ **Doctrine gate FIXED** — `check / doctrine` now passes (PR #334; unscoped SLSA L2 lines scoped as roadmap).
- ✅ **commit-lint SHA FIXED** — PR-title gate green (PR #332; corrected truncated action SHA).
- ❌ **Still red on main:** the `Tests` (vitest) workflow, and likely `CI` / `E2E Tests` / `Lighthouse` / `Build Check` / `Accessibility` / `Runtime Audit Harness` (most were still in-progress at handoff; `Tests` + `CI` showed repeated `failure` conclusions across the day — genuinely broken, not just cancelled).

## Concrete lead — start HERE
**`Tests` → job `Unit tests (vitest)`** (e.g. run `27303746809`, job `80656026034`) fails **even though the individual test files pass** (logs show many `Test Files … passed`, `fail 0`). That pattern means the job is failing on a **non-test gate inside the step**, not a failing assertion. Most likely one of:
1. **Coverage threshold** not met (vitest `coverage.thresholds` / `--coverage` gate) — a workspace package below the line fails the whole job.
2. **A workspace package with zero test files** erroring under `vitest run` (e.g. "No test files found" treated as error), or a `--passWithNoTests` missing somewhere.
3. **A post-test step** in the same job (typecheck/lint/build) returning non-zero after the tests pass.
**Action:** open the job's final step, find the exact non-zero exit (grep the tail for `coverage`, `threshold`, `ELIFECYCLE`, `No test files`, `error TS`). Fix the actual gate — do NOT lower a coverage threshold to force green (band-aid); add the missing tests or `--passWithNoTests` for genuinely test-less packages, and fix real type/lint errors.

## The rest (triage each, fix root cause)
- **Build Check / CI:** capture first `error TS####` or bundler error; fix the type/import, don't `// @ts-ignore` it away.
- **E2E / Lighthouse / Accessibility:** confirm whether these are flaky (timeouts/missing server) vs. real regressions. If flaky on infra, stabilize the harness (wait-for-server, retries) — but a real a11y/Lighthouse regression should be fixed in the UI, not the threshold.
- **Runtime Audit Harness:** check what invariant it asserts; likely tied to the same canonical-numbers/doctrine surface — should be green now that locked=8 is canonical (`lean_numbers.json.locked_formula_count`).

## Rules (carry through)
- No band-aids: fix the cause, never disable a test/threshold to force green. If a check is genuinely infra-flaky, stabilize the harness and say so in the PR.
- Conventional Commits + DCO + SHA-pinned actions. One branch per fix. CI must be green for a REAL reason before merge.
- Honesty doctrine v11: locked=8 {F1,F4,F7,F11,F12,F18,F19,F22}; Λ=Conjecture 1; Khipu=Conjecture 2; SLSA L1. The new local `make doctrine` (.github) catches overclaims pre-push (advisory).
- Also queued: uds #51/#57 rebase (post-#73); founder `#print axioms` ceremony to confirm served-8 surfaces.

---
*Co-Authored-By: Forge (SZL agent) · Doctrine v11.*

# P1 Series A capture authority correction

- **workcell_id:** P1_SERIES_A_CAPTURE_AUTHORITY_20261003
- **repository:** szl-holdings/platform
- **base:** `main@f2f8df6f89056e9104587674ccec0855dd5b177a`
- **source_branch:** `codex/series-a-capture-provenance-20261003`
- **status:** SOURCE_PATCHED; PROTECTED_PROMOTION_PENDING
- **evidence_class:** DECLARED plan; verification to be recorded in the proof packet

## Context

PR #668 merged the Series A source. The candidate-owned screenshot script on
current `main` still promotes caller-supplied `GITHUB_ACTIONS` and related
environment values to `VERIFIED_GITHUB_RUNTIME`. The protected controller's
pnpm permission repair merged in PR #690, but no later workflow dispatch has
proved a hosted screenshot capture. The earlier failed run remains failed.

The source route, deployment, production health, and customer use are separate
evidence states. This correction changes only the capture authority boundary.

## Plan before patch

1. Make `scripts/qa/capture-series-a-proof.mjs` and its helper emit only
   `LOCAL_NON_AUTHORITATIVE` for candidate-owned capture, regardless of hosted
   environment variables. Mark candidate metadata inadmissible to the hosted
   gate and use actual process OS/architecture values.
2. Add a behavioral test with forged GitHub environment values and update the
   Series A and product-wiring source contracts without dropping newer
   mainline tests.
3. Run dependency-free focused tests, syntax and formatting checks, and the
   available typecheck. Record every exit code. Do not infer a pass from a
   check that cannot start.
4. Assemble an append-only Proof Packet and known-gap update. UI screenshots
   are not newly required because no UI surface changes in this patch.
5. Commit with Workcell reference and DCO, push normally, open a protected PR,
   then request review and run the repaired hosted capture controller against
   that PR's exact source head. Merge only after current-head checks and review
   gates pass.

## Success criteria

- Forged GitHub variables cannot change candidate authority or hosted
  admissibility.
- The candidate still verifies source identity and builds/serves its own bytes.
- No claimed hosted capture appears without a successful controller run and
  independently inspected artifact.
- No deployment, customer, or production claim is added.

## Local verification disposition

- The dependency-free A11oy test task passed 29/29 after aligning a newer
  product-wiring assertion with the corrected authority contract.
- Syntax checks passed for the four JavaScript modules in the original P1
  patch. Biome check passed on all five edited JavaScript files with two
  informational template-literal suggestions.
- The full typecheck could not start before or after the patch because this
  sparse worktree has no installed `turbo` dependency. It is not recorded as
  a pass. The focused test used the lockfile-matching existing `ws@8.21.0`
  via an ignored local junction; no dependency or lockfile was changed.
- UI screenshot: N/A. No UI route or rendered component changed.
- Hosted capture and protected merge: pending exact-head observations.

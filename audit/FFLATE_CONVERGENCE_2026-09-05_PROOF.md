# fflate 0.8.3 convergence enforcement — Proof Packet

- **workcell_id:** `SEC-FFLATE-CONVERGENCE-2026-09-05`
- **task_reference:** `szl-holdings/platform#746`
- **agent:** Codex BuildWarden repair lane
- **objective:** Make exact fflate 0.8.3 convergence an enforced part of the blocking security workflow and preserve the behavior with focused positive and negative tests.
- **plan_summary:** Invoke the existing deterministic guard from the dependency-scan job, add dependency-free tests for the admitted version and two downgrade/divergence failures, and verify that the aggregate blocking security gate depends on that job.
- **patch_summary:** `.github/workflows/security.yml` now runs the focused test and `pnpm run security:fflate` before SBOM generation. The new regression executes the repository guard, rejects a downgraded workspace override, rejects a divergent lockfile edge, and asserts the guard remains on the blocking workflow path.
- **test_results:**
  - `node --test scripts/qa/check-fflate-resolution.test.mjs` — exit `0`; every focused positive and negative case passed.
  - `node scripts/qa/check-fflate-resolution.mjs` — exit `0`; every enumerated dependency edge converges on `fflate@0.8.3`.
  - `git diff --check` — exit `0`; no whitespace errors.
  - baseline `pnpm typecheck` — exit `1` before typecheck because the repository's existing install policy rejects unapproved dependency build scripts. No allowlist or supply-chain exception was added.
  - `pnpm run security:fflate` — exit `1` before script dispatch for the same install-policy reason; direct Node execution above validates the guard itself. Hosted execution must begin with the existing successful `pnpm install --frozen-lockfile` prerequisite.
- **screenshot_refs:** `N/A` — security workflow and dependency-resolution change; no UI surface changed.
- **verification_notes:** The dependency-scan job cannot succeed unless the exact-resolution test and guard both succeed, and `security-gate` continues to require `dependency-scan` success.
- **public_claim_check:** PASS — no public product or compliance claim changed.
- **security_check:** PASS — no secrets, tokens, `.env` values, permission expansion, audit downgrade, or protection bypass added.
- **known_gaps_update:** The unguarded-future-resolution gap identified in platform PR #746 is closed in source; hosted exact-head workflow execution remains required before merge.
- **proof_level:** `2` — Standard Proof; no UI surface exists for screenshot evidence.
- **recorded_at:** `2026-09-05T15:49:00Z`
- **recorded_by:** Codex BuildWarden repair lane

## Source binding

- protected base: `90fd724cb62dc1fee89b408d8086df72cc7c7bb2`
- reviewed PR head: `2cad5df35e2a6a58f979833024b1957bd52497db`
- PR: `szl-holdings/platform#746`

## Authority boundary

This packet records local source and test evidence only. It does not claim hosted CI success, merge readiness, deployment, or authority to bypass required checks and reviews.

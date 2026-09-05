# Proof Packet: fflate convergence enforcement

Date: 2026-09-05

## Plan

1. Preserve the lockfile convergence on the patched `fflate` release.
2. Run the repository's fail-fast `security:fflate` guard in blocking security CI before SBOM generation.
3. Record exact-head and local execution evidence without treating a UI screenshot as applicable.

## Scope

- Pull request: `szl-holdings/platform#746`
- Pre-repair exact head: `2cad5df35e2a6a58f979833024b1957bd52497db`
- Workflow: `.github/workflows/security.yml`
- Guard: `scripts/qa/check-fflate-resolution.mjs`

## Executed commands and exit codes

### `pnpm run security:fflate`

- Exit code: `1`
- Result: the local pnpm dependency-status bootstrap stopped before the guard because build scripts for eight dependencies were not approved in this fresh checkout.
- Interpretation: fail-closed local environment limitation. This is not evidence that the fflate guard failed.

### `node scripts/qa/check-fflate-resolution.mjs`

- Exit code: `0`
- Result: `[fflate-resolution] PASS: 3 dependency edge(s) converge on fflate@0.8.3`

### Existing exact-head GitHub check snapshot

- Successful: `50`
- Failed: `0`
- Pending: `0`
- Skipped: `2`
- Interpretation: this snapshot predates the workflow-wiring follow-up and is retained only as baseline evidence. The follow-up head must receive fresh protected CI before merge.

## Screenshot

`N/A`: dependency resolution and workflow enforcement have no user-interface surface.

## Verification notes

- The blocking security job now runs `pnpm run security:fflate` before `node scripts/qa/generate-sbom.js`.
- Shell failure semantics stop SBOM generation if the convergence guard fails.
- This packet does not claim merge, deployment, or runtime proof. Those remain contingent on fresh exact-head GitHub checks and protected merge readback.

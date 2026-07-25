# FRONTIER V2 Wave 1 — Truth Lock Proof Packet

**Workcell:** `FRONTIER-V2-W1-TRUTH-LOCK`

**Date:** 2026-07-25

**Base:** `platform@280176de9fd99a33f1cfc2087372014e91d7ce8f`

**Branch:** `agent/frontier-truth-lock-consolidated`

## Context

The FRONTIER V2 payload requires V1 Wave 1 truth lock before architecture or
public-repository disposition work. Inspection found material drift:

- `SOURCE_OF_TRUTH.md` and `audit/source-of-truth.json` disagreed.
- The JSON still counted an April 2026 artifact and package layout.
- API counting inspected only `artifacts/api-server`, although routing now lives
  across `apps/`, `services/`, and the remaining artifact backend.
- Doctrine `749/14/163` appeared as an unexplained tuple.
- Four governed concepts were described with the same word.
- No dedicated CI workflow failed when the canonical representations drifted.

## Plan

1. Recompute source-tree counts from the tracked Git tree.
2. Reconcile the human and machine registries.
3. Split Doctrine `749/14/163` into labelled, defined metrics.
4. Define canonical governance vocabulary.
5. Replace the POSIX-shell-dependent validator with a dependency-free,
   cross-platform validator.
6. Add a CI workflow covering canonical files and counted tree roots.
7. Record unresolved external and runtime claims without presenting them as
   current facts.
8. Add a separately generated live-evidence registry and incremental claim
   drift gate.
9. Reconcile package-directory inventory with the actual pnpm workspace-package
   count.
10. Repair the HIGH dependency findings that blocked the truth-lock PRs.

## Patch

- Rebuilt `SOURCE_OF_TRUTH.md` around CURRENT-TREE, LOCKED, OBSERVED,
  HISTORICAL, and UNVERIFIED evidence classes.
- Updated `audit/source-of-truth.json` to v2.0.0.
- Updated `audit/README.md` so its quick-reference table matches the registry.
- Added `docs/GLOSSARY.md` and indexed it in `docs/INDEX.md`.
- Rewrote `scripts/audit/validate-source-of-truth.js`.
- Added `.github/workflows/source-of-truth.yml`.
- Added `artifacts/SOURCE_OF_TRUTH.json`, its dependency-free generator and
  tests, and `.github/workflows/truth-drift.yml`.
- Added incremental changed-claim enforcement and a manual full-corpus audit.
- Added `docs/OVERCLAIM_LEDGER.md` without crediting CI for a detection that the
  recorded workflow did not make.
- Distinguished 209 top-level package/library directories from 196 actual
  workspace package manifests.
- Moved active dependency overrides into `pnpm-workspace.yaml` and upgraded
  seven vulnerable transitive packages to patched releases.
- Closed known gap TD-011 in `docs/operations/known-gaps.md`.

No repository visibility, deployment, production database, public badge, or UI
surface was changed.

## Verification

### Baseline

`pnpm typecheck` — **BLOCKED (exit 1)** before dependency installation because
the fresh worktree had no `node_modules` and therefore no `turbo` executable.
This is an environment baseline, not a product pass or failure.

### Targeted checks

`pnpm typecheck` — **PASS (exit 0)** after dependency installation:

- 179/179 Turbo tasks successful
- 71 tasks served from cache
- generated API client and Zod package builds/typechecks included

`node scripts/audit/validate-source-of-truth.js` — **PASS (exit 0)**:

- 17 tracked-tree metric checks
- 34 cross-document checks
- 5 locked Doctrine checks
- 5 vocabulary checks
- **61/61 total**

- `node tools/truth/generate-truth.ts --check` — **PASS**
- `node --test tools/truth/generate-truth.test.ts` — **4/4 PASS**
- `node tools/truth/check-claims.ts --base <main-baseline>` — **PASS**
- `biome check` for the truth generator, tests, claim scanner, and validator —
  **PASS** with seven intentional CLI-output `noConsole` warnings
- `pnpm docs:claims-check` — **BASELINE FAILURE** with the same 11 stale
  API/security documentation references outside this patch's files
- `pnpm audit --prod --audit-level high` — **PASS for HIGH severity**; five
  moderate and two low findings remain and are not represented as resolved
- JSON parsing for all changed registries — **PASS**
- `git diff --check` — **PASS**

The first validator run correctly failed because a line-based reconnaissance
count missed a second `pgTable(...)` occurrence on the same line. The canonical
value was corrected from 1,066 lines to 1,067 call sites before this proof was
recorded.

## Screenshot

**Not applicable.** No UI surface was modified.

## Remaining Gates

- GitHub Actions must run against the complete checkout and repaired lockfile.
- Independent review and branch-protection requirements remain mandatory.
- The nine-public-repository target remains **NOT APPLIED** until aliases,
  conformance, release tags, and reversible disposition steps are verified.
- Live database counts remain historical until refreshed against an authorized
  production-like database.

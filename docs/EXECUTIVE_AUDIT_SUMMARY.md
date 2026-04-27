# SZL Holdings — Executive Audit Summary

> Updated 2026-04-27 — Diligence Audit Task #3206

---

## Platform Status (Current)

SZL Holdings operates a governed decision operating system implemented as a TypeScript pnpm monorepo. As of 2026-04-27:

| Metric | Value | Source |
|--------|-------|--------|
| Registered artifacts | 15 | Workspace artifact registry snapshot |
| On-disk artifact directories | 19 | `generated/platform-metrics.json` (2026-04-27T03:50:50Z); 4 unregistered vs registry: conduit, pluginmesh, helios, and `artifacts/audit` (evidence dir miscounted by script) |
| Total packages | 152 | `generated/platform-metrics.json` (51 lib + 101 standalone) |
| TS/TSX source files | 6,235 | `generated/platform-metrics.json` (3,801 TS + 2,434 TSX) |
| Database table definitions | 1,047 | `generated/platform-metrics.json` → Drizzle pgTable grep |
| API route handlers | 6,063 | `generated/platform-metrics.json` → routes grep |
| SQL migrations | 59 | `generated/platform-metrics.json` |
| Test files | 387 | git ls-files count |
| GitHub CI workflows | 25 | `.github/workflows/` |
| Platform primitives implemented | 12/12 | Package directory check |

All numbers are code-derived via `scripts/audit/generate-platform-metrics.ts` (regenerated 2026-04-27).

---

## Engineering Pipeline Status (2026-04-27)

| Check | Result | Details |
|-------|--------|---------|
| TypeScript typecheck | **FAIL** | 9 packages: `aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react` |
| Biome lint | **FAIL** | 23 errors, 15,060 warnings across 6,780 files |
| Turbo build | **FAIL** | `@szl-holdings/sdk` TS errors cascade to 10 packages |
| Unit tests | **FAIL** | api-server governance tests fail: `governance-restart-process` (1), `governance-editor-attribution` (1), `governance-persistence` (2); `billing_audit_log` relation missing |
| E2E tests | **NOT RUN** | Playwright not executed this audit |
| Metrics generation | **PASS** | `generate-platform-metrics.ts` produces valid JSON |

**Pipeline verdict: FAIL.** Typecheck, lint, and build all fail as of this audit date. This supersedes the April 25, 2026 scorecard which reported 14/16 PASS. Failures identified in this audit represent regressions introduced between April 25 and April 27.

---

## Root Build Failure

The primary build failure (`@szl-holdings/sdk`) cascades to 10 packages:

- `artifacts/a11oy`
- `artifacts/szl-holdings-mobile`
- `artifacts/helios` (unregistered)
- `artifacts/pluginmesh` (unregistered)
- `artifacts/szl-demo-video`
- `@szl/alloy`
- `@workspace/alloy-ingestion-orchestrator`
- `@szl/substrate`
- (and storybook if present)

**Root cause:** `packages/szl-sdk/src/resources/plugins.ts` and `treasury.ts` — `PaginationOptions` union type missing index signature required by a downstream generic. One targeted type fix resolves the cascade.

---

## What Was Fixed (This Audit Session)

No code fixes were applied in this diligence audit. The scope of this task was audit and documentation, not bug remediation. All fixes identified are logged in `docs/FIX_LOG.md` for the next engineering sprint.

---

## What Was Built (This Audit Session)

| Document | Status |
|----------|--------|
| `docs/CLAIM_RECONCILIATION_MATRIX.md` | ✅ Created |
| `docs/INVESTOR_DILIGENCE_READINESS.md` | ✅ Created |
| `docs/BUYER_DILIGENCE_READINESS.md` | ✅ Created |
| `docs/DEPENDENCY_AND_SCRIPT_DRIFT.md` | ✅ Created |
| `docs/EXECUTIVE_AUDIT_SUMMARY.md` | ✅ Refreshed (this document) |
| `docs/RELEASE_READINESS_SCORECARD.md` | ✅ Refreshed |
| `docs/FIX_LOG.md` | ✅ Updated |
| `docs/OPEN_RISKS.md` | ✅ Updated |
| `docs/OPERABILITY_MATRIX.md` | ✅ Updated |
| `generated/platform-metrics.json` | ✅ Regenerated |

---

## What Is Operational

| System | Status |
|--------|--------|
| API Server | Healthy per prior run (HTTP 200, 11ms DB latency); not re-verified in this run |
| 12/12 Platform Primitives | Packages present on disk |
| 15 Registered Artifacts | In workspace registry; most serve in dev |
| 25 CI Workflows | Active in GitHub |
| 1,047 DB Table Definitions | Schema present |
| 387 Test Files | Present; pass rate not verified this run |

---

## What Is Still Blocked

| Item | Blocker | Impact |
|------|---------|--------|
| `@szl-holdings/sdk` TypeScript errors | Missing index signature in PaginationOptions | Cascades to 10 dependent packages |
| 9-package TypeScript typecheck failures (`aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react`) | Various TS errors | Blocks clean CI |
| Biome lint (23 errors) | Various lint violations | Blocks clean CI |
| Migration ordering (Task #2886) | 12 statements reference missing tables | Non-fatal; server continues |
| Mapbox token | Paid subscription required | Terra map visualization unavailable |
| AIS data feed | Paid subscription required | Vessels real-time tracking unavailable |
| Redis sessions | Configuration pending | In-memory sessions only |
| Sentry monitoring | Configuration pending | No production error tracking |
| SOC 2 Type II | Audit not yet initiated | Enterprise procurement blocked |
| `helios` and `pluginmesh` | Unregistered orphan artifacts | Dead weight in monorepo |

---

## Platform Differentiation (Evidence-Backed)

The following capabilities are implemented in code, not just described:

1. Decision lifecycle as the primitive — `lib/outcome-graph`, `lib/proof-chain`
2. Cross-domain signal cascading — `packages/signal-mesh`, `lib/prism-bus`
3. Immutable hash-linked proof chain — `lib/proof-chain`
4. Full decision replay from trace — `packages/replay-core`
5. Policy-governed AI with human approval gates — `lib/covenant-policy`, `packages/guardian`
6. Probabilistic simulation via Monte Carlo engine — `lib/monte-carlo`

No claim in this list requires acceptance on faith — each maps to a present package directory.

---

## Contradiction Resolutions Made This Audit

| Contradiction | Resolution |
|--------------|------------|
| README said "100 packages" / metrics: 152 | **FIXED** — README updated to 152 |
| README said "14 artifacts" / registry: 15 | **FIXED** — README updated to 15 |
| README screenshot claim "verified, unmodified captures" / git index: 0 screenshots | **FIXED** — README caveated to note alpha demo state; screenshots not in git index |
| RELEASE_READINESS_SCORECARD said "14/16 PASS, no blocking items" | **FIXED** — Scorecard now shows 4/5 P0 FAIL with evidence |
| OPERABILITY_MATRIX referenced "CORTEX Mobile" | **FIXED** — Updated to `szl-holdings-mobile` (APEX) |
| PLATFORM_OVERVIEW.md said "Alloy" | **FIXED** — Updated to "A11oy" throughout |
| Carlota Jo "Live" vs "Beta" | **FIXED** — PRODUCT-SURFACES.md updated to "Beta" |

---

*This document supersedes the April 22, 2026 Executive Audit Summary. Do not quote the prior version.*

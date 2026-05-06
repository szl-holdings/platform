# SZL Holdings — Release Readiness Scorecard

> **Diligence Audit Edition — 2026-04-27**
> Scope: Honest pass/fail results from running typecheck, lint, build, and test as of audit date
> Prior version (April 25, 2026 — Phase 7 Edition) is superseded by this document.

---

## Executive Summary

| Metric | Status |
|--------|--------|
| Pipeline P0 checks | **4/5 FAIL** |
| Blocking items | **4** (typecheck, lint, build, unit tests) |
| Overall Release Confidence | **LOW — pipeline failures present** |

---

## Platform Pipeline Status (2026-04-27 Run)

| Stage | Result | Evidence |
|-------|--------|----------|
| Install | NOT RUN | Skipped this audit run |
| Typecheck | **FAIL** | 9 packages: `aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react` |
| Lint | **FAIL** | 23 errors, 15,060 warnings across 6,780 files (Biome) |
| Build | **FAIL** | `@szl-holdings/sdk` TS errors cascade: 10 of 27 build targets fail |
| Unit Tests | **FAIL** | api-server governance tests fail (4 failures): `governance-restart-process.test.ts` (1), `governance-editor-attribution.test.ts` (1), `governance-persistence.test.ts` (2); root cause: `billing_audit_log` relation missing (schema/migration gap) |
| Integration Tests | **NOT RUN** | Not executed this audit |
| E2E Tests | **NOT RUN** | Playwright not executed this audit |
| Metrics Generation | **PASS** | `generate-platform-metrics.ts` → valid JSON; 6,235 TS/TSX files, 1,047 DB tables, 6,063 route handlers |
| API Health | **PASS (prior)** | API server returned HTTP 200 / 11ms DB latency in prior audit run; not re-verified live |

**Pipeline result: FAIL. Four P0 checks fail (typecheck, lint, build, unit tests). Release gate is NOT cleared.**

---

## Typecheck Failures

The following packages fail `turbo run typecheck` (exit code 1, confirmed 2026-04-27):

| Package | Notes |
|---------|-------|
| `@workspace/aef-sdk` | TypeScript typecheck error |
| `@workspace/reflection-engine` | TypeScript typecheck error |
| `@workspace/aef-storage-adapters` | TypeScript typecheck error |
| `@workspace/alloy-rank-worker` | TypeScript typecheck error |
| `@workspace/alloy-embed-worker` | TypeScript typecheck error |
| `@workspace/aef-retrieval-core` | TypeScript typecheck error |
| `@workspace/aef-policy-guard` | TypeScript typecheck error |
| `@szl-holdings/db` | TypeScript typecheck error |
| `@szl-holdings/api-client-react` | TypeScript typecheck + build error |

---

## Build Failures

### Root Cause

`packages/szl-sdk/src/resources/plugins.ts` and `treasury.ts`:
```
error TS2345: Argument of type 'PaginationOptions & { ... }' is not assignable to
parameter of type 'Record<string, string | number | boolean | undefined> | undefined'.
Index signature for type 'string' is missing in type 'PaginationOptions & { ... }'.
```

### Cascading Failures (10 packages)

| Package | Build Status |
|---------|-------------|
| `@workspace/a11oy` | FAIL (cascaded) |
| `@workspace/szl-holdings-mobile` | FAIL (cascaded) |
| ~~`@workspace/helios`~~ | ~~FAIL~~ | Folded into A11oy (task #4364) — no longer a separate build target |
| `@workspace/pluginmesh` | FAIL (cascaded) |
| `@workspace/szl-demo-video` | FAIL (cascaded) |
| `@szl/alloy` | FAIL (cascaded) |
| `@workspace/alloy-ingestion-orchestrator` | FAIL (cascaded) |
| `@szl/substrate` | FAIL (cascaded) |
| Storybook | FAIL (cascaded) |

**Packages that build successfully: 17 of 27** (63%)

---

## Lint Summary (Biome)

| Severity | Count |
|----------|-------|
| Errors | 23 |
| Warnings | 15,060 |
| Infos | 699 |
| Files checked | 6,780 |

Lint fails are spread across the codebase. The 23 errors are blocking; 15,060 warnings require systematic triage but do not individually block.

---

## Per-Lane Runtime Readiness (unchanged from runtime evidence)

| Lane | Runtime Status | Notes |
|------|---------------|-------|
| SZL Holdings (corporate) | Alpha working | Seeded KPIs; auth live |
| Aegis (PARAGON/TENAX security) | Alpha working | CISA KEV, NVD CVE, MITRE ATT&CK v14 live |
| Counsel | Alpha working | Matter tracking functional |
| Pulse (LUMINA) | Alpha working | AI multi-provider briefing active |
| Carlota Jo | Alpha working | Live integrations active |
| API Server | Alpha working | HTTP 200; auth-gated routes correct |
| Vessels (SEXTANT) | Alpha partial | AIS simulated; commercial modules pending |
| Terra (DOMAINE) | Alpha partial | Maps blank (Mapbox token missing) |
| Lyte (KORA) | Alpha partial | Routes functional; legacy alias gap |
| Command (FORGE) | Alpha partial | Badge counts not wired |
| Sentra (TENAX) | Alpha partial | `/api/sentra/risks` route missing |
| A11oy | Build fail | Artifact build fails; Phase 1 code present |
| Mobile (APEX) | Build fail | Scaffold present; build fails |
| SZL Demo Video | Build fail | Build fails |

---

## Blocking Items

| # | Item | Severity | Fix |
|---|------|----------|-----|
| 1 | `@szl-holdings/sdk` TypeScript index signature error | **P0** | Add index signature to `PaginationOptions` type |
| 2 | TypeScript typecheck failures (9 packages: `aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react`) | **P0** | Fix package-specific TS errors |
| 3 | Biome lint 23 errors | **P0** | Fix lint violations |
| 4 | Unit test failures (governance tests; `billing_audit_log` relation missing) | **P0** | Add missing migration or fix schema reference |

---

## Non-Blocking Known Issues

| Issue | Severity | Remediation |
|-------|----------|-------------|
| SBOM generation not in CI | Low | Add to release workflow |
| External link check not automated | Low | Add link-check CI step |
| SLSA provenance not implemented | Low | Post-GA roadmap |
| `conduit`, `pluginmesh`, `helios` unregistered artifact dirs; `artifacts/audit` miscounted by metrics script | Low | Register, remove, or exclude from metrics script |
| AIS telemetry simulated | Low | Paid subscription required |
| Mapbox token missing | Low | Paid subscription required |
| Redis sessions not configured | Medium | Configure before production |
| Sentry not configured | Medium | Configure before production |

---

## Overall Verdict

**Release readiness: LOW — pipeline failures block clean CI.**

Compared to the April 25, 2026 Phase 7 scorecard, this audit has identified 3 new blocking failures (typecheck, lint, build) that were not present or not captured in the prior run. The runtime evidence (surfaces serve, API responds) remains consistent with the prior scorecard. Resolution of the `@szl-holdings/sdk` TypeScript error alone would likely clear the build cascade; the remaining typecheck and lint failures require targeted fixes per package.

---

*This scorecard supersedes all prior editions. Do not cite the April 25, 2026 Phase 7 Edition.*

# What Was Fixed — Rehaul Program Complete Record

**Date:** 2026-04-27  
**Scope:** All fixes applied across Rehaul Phases 1–9 (Tasks approximately #2600–#2944)

---

## Platform-Wide Visual & Copy Redesign (Phases 1–6)

| Fix | Surfaces Affected |
|---|---|
| Governed-Intelligence Design System v2 applied | All 13 web surfaces |
| Product renaming: TENAX, DOMAINE, SEXTANT, PARAGON, KORA, LUMINA, FORGE, APEX | All surfaces, README, docs |
| Navigation redesign — unified sidebar/topbar pattern | All web artifacts |
| Hero section rewrites — thesis-first messaging | SZL Holdings, A11oy, all domain packs |
| Feature content updated to reflect v2 capabilities | All domain packs |
| Old Lyte metrics store removed from public surfaces | Lyte/KORA, README |
| README screenshots refreshed to live unmodified captures | README.md |
| `brand/screenshots/` updated with 2026-04-25 live captures | README.md, docs |
| SZL Holdings opengraph.jpg refreshed to Design System v2 | `artifacts/szl-holdings/public/` |

---

## CI & Security Posture Hardening (Phases 7–8, Task #2825)

| Fix | Files Changed |
|---|---|
| 13 open GitHub PRs resolved | GitHub — PRs #12, #16, #24, #26–#35 |
| Branch protection restored after PR resolution | GitHub repo settings |
| `shared-proxy` workflow removed | `.github/workflows/` |
| `lyte-metrics-store: service` workflow removed | `.github/workflows/` |
| `lyte-metrics-store-test` workflow removed | `.github/workflows/` |
| `api-test` workflow removed | `.github/workflows/` |
| Command workflow startup flap fixed (port alignment) | `artifacts/command/` |
| 6 broken artifact workflows restored to running state | `.replit` / workflow configs |

---

## Bug Fixes (Task #2825)

| Fix | File(s) Changed |
|---|---|
| `getApiBaseUrl` export added to API client | `lib/api-client-react/src/custom-fetch.ts`, `index.ts` |
| Sentry context type error fixed (`id` → `userId`) | `lib/mobile-shared/src/context/AuthContext.tsx` |
| Unused `@ts-expect-error` directives removed | `SyncEngineContext.tsx`, `useApiStatus.ts` |
| Alloy embed worker `exactOptionalPropertyTypes` fixes | `cpu-local.ts`, `external-http.ts`, `warm-pool.ts` |
| Jest version downgraded for Expo compatibility | `artifacts/szl-holdings-mobile/package.json` |
| `packages/trace-graph/dist/` compiled (missing declarations) | `packages/trace-graph/` |
| API sub-router middleware path-scoped (13 sub-routers) | `artifacts/api-server/src/routes/` (13 files) |
| High/critical approval push notifications implemented | `artifacts/api-server/src/lib/expo-push.ts` |

---

## Architecture Additions (Task #2825 — Sovereign Execution Substrate)

| Addition | Location |
|---|---|
| `@szl/substrate` package — policy-shaped graph compiler | `packages/substrate/` |
| Execution engine with 15 hooks, OTel telemetry | `packages/substrate/src/engine.ts` |
| Hash-stable evidence-chained Journal (SHA-256) | `packages/substrate/src/journal.ts` |
| Confidence-budget routing (weighted harmonic mean) | `packages/substrate/src/budget-router.ts` |
| Python worker channel (wire protocol v1.0) | `packages/substrate/src/python-worker.ts` |
| Substrate API endpoints (replay, status, metrics) | `artifacts/api-server/src/routes/control-tower/` |
| Reference workflow: Opportunity Audit | `packages/substrate/workflows/opportunity-audit.ts` |
| Substrate documentation suite (5 docs) | `docs/substrate/` |
| Compiler tests (9) + engine tests (6) | `packages/substrate/src/` |

---

## CI Fixes (This Task — #2944)

| Fix | File Changed |
|---|---|
| `uptime-monitor.yml` cron changed from `* * * * *` to `*/5 * * * *` | `.github/workflows/uptime-monitor.yml` |

---

## Documentation Additions (This Task — #2944)

| Document | Path |
|---|---|
| Workflow audit (per-workflow classification) | `audit/ci/workflow-audit.md` |
| Workflow status matrix | `audit/ci/workflow-status-matrix.md` |
| Alpha release readiness | `audit/release/alpha-release-readiness.md` |
| Active vs defer matrix | `audit/strategy/active-vs-defer-matrix.md` |
| Public focus recommendation | `audit/strategy/public-focus-recommendation.md` |
| Non-core scope reduction plan | `audit/strategy/non-core-scope-reduction-plan.md` |
| Executive rehaul summary | `audit/final/executive-rehaul-summary.md` |
| Top 25 risks and gaps | `audit/final/top-25-risks-and-gaps.md` |
| What was fixed (this document) | `audit/final/what-was-fixed.md` |
| What remains unverified | `audit/final/what-remains-unverified.md` |
| growth capital surface scorecard | `audit/final/series-a-surface-scorecard.md` |
| CHANGELOG.md updated | `CHANGELOG.md` |

---

*Complete fix record for the Rehaul program. Retain for investor diligence and post-mortem reference.*

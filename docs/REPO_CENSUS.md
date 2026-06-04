# REPO CENSUS — Phase 1

Captured: 2026-04-23.

## Top-level layout

| Directory | Purpose | Notes |
| --- | --- | --- |
| `artifacts/` | 16 user-visible products (13 web + 1 mobile + 1 video + 1 backend + 1 design) | Each has its own workflow; idle-stop on dev |
| `packages/` | Shared TS packages | Includes `env`, `ontology`, `connectors`, `observability`, `ui` |
| `lib/` | Composite TS libraries | `db`, `config`, `domain-claims`, `ontology` (duplicate w/ packages — see Phase 8) |
| `tests/` | Cross-artifact e2e (Playwright) | 22 specs in nexus-smoke; some other suites |
| `scripts/` | Build, QA, brand-string check, post-merge orchestration | `non-interactive-migrate.mjs` is the source of the drizzle-kit timeout |
| `docs/` | 172 markdown files (~118k lines) | This pass added 14 GO_LIVE / phase docs |
| `attached_assets/` | 129 MB of user uploads | Not committed (verified gitignored) |

## Artifact census

| Slug | Source size | Workflow status (this pass) | Notes |
| --- | --- | --- | --- |
| szl-holdings | 75 MB | failed (idle) | Heaviest artifact |
| vessels | 62 MB | failed (idle) | Heavy 3D / map assets likely |
| terra | 58 MB | failed (idle) | |
| carlota-jo | 47 MB | running | |
| szl-demo-video | 41 MB | failed (idle) | Video, asset-heavy by nature |
| lyte-command-center | 37 MB | failed (idle) | |
| aegis | 36 MB | failed (idle) | |
| command | 35 MB | failed (idle) | Unified Command surface |
| mockup-sandbox | 26 MB | running | Used by validation pipeline |
| pulse | 19 MB | failed (idle) | |
| sentra | 19 MB | failed (idle) | |
| counsel | 18 MB | failed (idle) | |
| api-server | (backend) | running | 262 route files, 3,367 handler registrations |
| szl-holdings-mobile | (Expo) | running | OUT OF SCOPE per brief |

"failed (idle)" means the artifact was alive earlier in the pass and is now in idle-stop. This is expected on dev. Production deploys keep them warm.

## Heavy hitters (oversized files in api-server)

14 route files >1,900 LOC — splitting deferred per brief constraint ("do not rewrite domain logic"):

```
3,973  routes/guardian.ts
3,555  routes/terra-cognitive.ts
3,072  routes/nexus.ts
2,660  routes/pulse.ts
2,014  lib/scheduled-jobs.ts
... (+9 more in the same band)
```

## Package surface

119 directories under `packages/` + `lib/`. Most well-scoped. Notable:

- `lib/ontology` (3 consumers, `@szl-holdings/ontology`) **duplicates** `packages/ontology` (36 consumers, `@workspace/ontology`). Consolidation tracked in `CONSOLIDATION_DECISIONS.md`.
- `lib/db` is the central DB layer — already well-instrumented (OBS-007, healthPool, slow-query telemetry, statement timeout).
- `packages/env` is the central Zod-validated config — `DB_POOL_MAX` default lowered 100 → 12 this pass.

## Doc surface

- 172 markdown files in `docs/` (~118k lines).
- This pass added 14 new files: `PLATFORM_FACTS_SOURCE_OF_TRUTH.md`, `FACT_RECONCILIATION_AUDIT.md`, `REPO_CENSUS.md`, `REMOVAL_CANDIDATES.md`, `CATEGORY_POSITIONING.md`, `FLAGSHIP_WORKFLOWS.md`, `BACKEND_HARDENING.md`, `HOT_PATH_ANALYSIS.md`, `FRONTEND_RELIABILITY_AUDIT.md`, `OBSERVABILITY_AND_ROI_SCORECARD.md`, `AI_GOVERNANCE_AND_RUNTIME_AUDIT.md`, `GO_LIVE_VERIFICATION.md`, plus the 12 from earlier in the session.
- Doc bloat is real but does not affect runtime. Consolidation deferred.

## Workflow census

17 workflows configured (14 web/mobile/video/backend artifacts + mockup-sandbox + brand-strings + nexus-smoke-e2e + security-tests). All start/stop cleanly when triggered. Idle-stop is by design.

## Test census

| Suite | Tests | Verified PASS this pass |
| --- | --- | --- |
| nexus-smoke (Playwright) | 22 | YES |
| lp-portal-uploads | 13 | YES (Task #1388) |
| mobile-auth-token-exchange | 8 | YES (Task #1425) |
| carlota-metrics | 5 | YES |
| carlota-inquiry-inbox | 6 | YES (Task #1419) |
| brand-names | 3 | YES (Task #1439) |
| db-pool-instrumentation | (multiple) | (existing, pinned) |
| health-pool-saturation | (multiple) | (existing, pinned) |
| security-tests (api-server full) | (large) | RUNNING at validation cutoff |

Plus 114 skipped / `.todo` tests across the repo — owner triage required.

## What this census does NOT include

- Per-package SLOC counts (would require building cloc table; not blocker)
- Per-route call-graph (would require static analysis; deferred to Phase 8)
- Per-asset breakdown of the 75 MB szl-holdings (deferred to Phase 5 follow-up)

# SZL Holdings — Operability Matrix

**Date:** 2026-04-27 (updated — diligence audit task #3206)
**Scope:** Runtime health, build status, test coverage, and operational readiness per artifact

---

## Legend

| Grade | Meaning |
|-------|---------|
| **A** | Production-ready — builds, starts, serves, passes tests |
| **B** | Functional — builds and starts; minor issues; may lack full test coverage |
| **C** | Partial — builds but has runtime warnings; some features mocked/seeded |
| **D** | Degraded — builds with warnings; significant features broken or missing |
| **F** | Broken — does not build, start, or serve |
| **X** | Archived / Dead — should not be in active rotation |

> **2026-04-27 audit note:** `pnpm run build` currently fails for `@szl-holdings/sdk` and 10 cascading packages. Grades below reflect prior runtime evidence (surfaces serve in dev) combined with current build status. Grades of **B** have been revised down where build fails.

---

## Backend

| Artifact | Build | Start | Health | Tests | Grade | Notes |
|----------|-------|-------|--------|-------|-------|-------|
| API Server | OK | OK | HTTP 200, 11ms DB latency (prior run) | 63 spec files | **B** | Migration ordering warnings (non-fatal); 6,063 route handlers; clean build confirmed in prior run |

## Web Applications

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| SZL Holdings Dashboard | OK | OK | Serves | E2E spec | **B** | KPIs seeded; genome score hardcoded |
| A11oy | **FAIL** | Unknown | Unknown | — | **F** | Build fails (cascaded from sdk); Phase 1 code present; Phase 2 in progress |
| Aegis (PARAGON) | OK | OK | Serves | E2E spec | **B** | CISA KEV, NVD CVE, MITRE ATT&CK v14 live; 8 modules not wired |
| Vessels (SEXTANT) | OK | OK | Serves | E2E spec | **C** | AIS telemetry simulated; 3 commercial modules not DB-wired |
| Terra (DOMAINE) | OK | OK | Serves | E2E spec + smoke | **C** | NYC distress live; Mapbox token missing (maps completely blank) |
| Counsel | OK | OK | Serves | E2E spec | **B** | Core matter management functional; CourtListener token pending |
| Carlota Jo | OK | OK | Serves | E2E spec | **B** | Service catalog functional; live integrations active |
| Pulse (LUMINA) | OK | OK | Serves | E2E spec | **B** | AI multi-provider briefing generation active |
| Sentra (TENAX) | OK | OK | Serves | E2E spec | **B** | Cyber resilience command surface; `/api/sentra/risks` route missing |
| Unified Command | OK | OK | Serves | E2E spec | **B** | Cross-domain command surface; CORTEX badge counts not wired |
| Lyte (KORA) | OK | OK | Serves | E2E spec | **B** | Decision intelligence UI; signal fusion on seeded data |
| SZL Demo Video | **FAIL** | Unknown | Unknown | — | **F** | Build fails (cascaded from sdk); animated demo artifact |

## Mobile

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| APEX — Mobile Command (`szl-holdings-mobile`) | **FAIL** | Unknown | Unknown | — | **F** | Build fails (cascaded from sdk); Expo scaffold present; splash/icon and push linking pending |

> **Note:** The prior OPERABILITY_MATRIX listed "CORTEX Mobile" here. `cortex-mobile` is an archived artifact (see Dead/Archived below). The current registered mobile artifact is `szl-holdings-mobile` (APEX).

## Internal / Design

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| Mockup Sandbox (PRAXIS) | OK | OK | Serves | Nexus smoke | **B** | Design iteration sandbox; internal only |

## Unregistered On-Disk Artifacts

| Artifact | Build | Grade | Notes |
|----------|-------|-------|-------|
| `pluginmesh` | **FAIL** | **X** | Not registered in workspace; build fails; purpose undocumented |

## Folded Artifacts

| Artifact | Disposition | Notes |
|----------|-------------|-------|
| `helios` | **Folded into A11oy** | All 7 surfaces merged into A11oy Frontier Intelligence section (task #4364). API routes live at `/api/helios/`. Standalone directory removed. |

## Dead / Archived

| Artifact | Build | Start | Grade | Disposition |
|----------|-------|-------|-------|-------------|
| cortex-mobile (legacy) | — | — | **X** | Archive — superseded by szl-holdings-mobile (APEX) |
| imperium | — | — | **X** | Archive — cloud sovereignty concept; merged into Command Portal |
| prism-counsel (legacy) | — | — | **X** | Archive — superseded by Counsel artifact |

---

## Infrastructure Health

| System | Status | Latency | Notes |
|--------|--------|---------|-------|
| PostgreSQL | OK (prior run) | 11ms | 1,047 table definitions in schema; pool max=100 |
| Health Pool | OK (prior run) | <1s timeout | Dedicated 2-connection probe pool |
| Auth (Replit OIDC) | OK | — | Session secret configured |
| AI Engine | OK (prior run) | 4ms | Anthropic + OpenAI proxied |
| Job Queue | OK (prior run) | Depth: 0 | Durable PostgreSQL-backed |
| Object Storage | Local mode | — | No cloud bucket configured |
| Redis | Not configured | — | In-memory sessions only; session loss on restart |
| Sentry | Not configured | — | No production error monitoring |

> **Note:** DB table count updated from 732 (prior) to 1,047 (current schema grep via `generate-platform-metrics.ts`, output confirmed in `generated/platform-metrics.json`).

## Build Pipeline Health

| Check | Current Status | Notes |
|-------|---------------|-------|
| TypeScript typecheck | **FAIL** | 4+ packages failing |
| Biome lint | **FAIL** | 23 errors, 15,060 warnings |
| Turbo build | **FAIL** | `@szl-holdings/sdk` cascades to 10 packages |
| Unit tests | Not verified | 387 test files; run timed out |
| E2E (Playwright) | Not run | Requires live runtime |
| GitHub Actions CI | Expected fail | Reflects current pipeline state |
| CodeQL | Should pass | Static analysis only |
| Security | Should pass | Dependency audit + SAST |

---

*Updated by diligence audit task #3206 — 2026-04-27. Supersedes April 22, 2026 version.*

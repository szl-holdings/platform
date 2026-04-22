# SZL Holdings — Operability Matrix

**Date:** April 22, 2026
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

---

## Backend

| Artifact | Build | Start | Health | Tests | Grade | Notes |
|----------|-------|-------|--------|-------|-------|-------|
| API Server | OK | OK | HTTP 200, 11ms DB latency | 63 spec files across unit/e2e | **B** | Migration ordering warnings (non-fatal); pool checkout fixed this session; 2,781 route handlers operational |

## Web Applications

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| SZL Holdings Dashboard | OK | OK | Serves | E2E spec | **B** | Dashboard KPIs seeded; genome score hardcoded |
| Aegis | OK | OK | Serves | E2E spec | **B** | 8 new security modules not wired to live API |
| Vessels | OK | OK | Serves | E2E spec | **C** | AIS telemetry simulated; 3 commercial modules not DB-wired |
| Terra | OK | OK | Serves | E2E spec + smoke | **B** | NYC distress live; Mapbox token missing (maps blank) |
| Counsel | OK | OK | Serves | E2E spec | **B** | Core matter management functional; legacy PRISM routes retained |
| Carlota Jo | OK | OK | Serves | E2E spec | **B** | Service catalog functional; task #1367 fixing middleware |
| Pulse | OK | OK | Serves | E2E spec | **B** | Signal synthesis active; briefing generation operational |
| Sentra | OK | OK | Serves | E2E spec | **B** | Cyber resilience command surface operational |
| Unified Command | OK | OK | Serves | E2E spec | **B** | Cross-domain command surface; convergence cards pending task #1361 |
| Lyte Command Center | OK | OK | Serves | E2E spec | **B** | Decision intelligence UI; signal fusion runs on schedule |
| SZL Demo Video | OK | OK | Serves | E2E spec | **B** | Animated demo renders; Remotion-based |

## Mobile

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| CORTEX Mobile | OK | OK | Expo Dev | — | **C** | Core screens functional; limited test coverage |

## Internal / Design

| Artifact | Build | Start | Preview | Tests | Grade | Notes |
|----------|-------|-------|---------|-------|-------|-------|
| Mockup Sandbox | OK | OK | Serves | Nexus smoke | **B** | Design iteration sandbox; iframe preview system |

## Dead / Archived

| Artifact | Build | Start | Grade | Disposition |
|----------|-------|-------|-------|-------------|
| cortex-mobile (legacy) | — | — | **X** | Archive — 260K, superseded |
| imperium | — | — | **X** | Archive — 7.5M, cloud sovereignty archived |
| prism-counsel (legacy) | — | — | **X** | Archive — 9.2M, superseded by counsel |

---

## Infrastructure Health

| System | Status | Latency | Notes |
|--------|--------|---------|-------|
| PostgreSQL | OK | 11ms | 732 tables, pool max=100 |
| Health Pool | OK | <1s timeout | Dedicated 2-connection probe pool |
| Auth (Replit OIDC) | OK | — | Session secret configured |
| AI Engine | OK | 4ms | Anthropic + OpenAI proxied |
| Job Queue | OK | Depth: 0 | Durable PostgreSQL-backed |
| Object Storage | Local mode | — | No cloud bucket configured |

## Build Pipeline Health (GitHub Actions)

| Workflow | Expected Status | Notes |
|----------|----------------|-------|
| CI (lint + typecheck + build + test) | Should pass | Pinned action SHAs |
| CodeQL | Should pass | Scheduled + push |
| Security | Should pass | Dependency audit + SAST |
| Secret Scan | Should pass | Push + scheduled |
| Build Check | Should pass | All major artifacts |
| E2E | Requires runtime | Needs DB + API server |

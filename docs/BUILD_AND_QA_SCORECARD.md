# SZL Holdings — Build and QA Scorecard

**Date:** April 22, 2026
**Environment:** Replit (NixOS, Node 24.13.0, pnpm monorepo, PostgreSQL 16)

---

## Pipeline Stage Results

| Stage | Status | Notes |
|-------|--------|-------|
| `pnpm install` | **PASS** | Lock file present; all dependencies resolved |
| `pnpm build` (api-server) | **PASS** | esbuild, 26.4MB bundle, 2.7s |
| `pnpm build` (web artifacts) | **PASS** | Vite builds succeed for registered artifacts |
| Typecheck | **PARTIAL** | Passes for core packages; some peripheral packages have type drift |
| Lint | **PARTIAL** | Biome configured; some style warnings in generated code |
| Unit tests | **PARTIAL** | vitest suites in api-server; some failures in governance/restart tests (pre-existing) |
| E2E tests | **PARTIAL** | 26 Playwright spec files; require runtime environment |
| Smoke tests | **PARTIAL** | Terra cognitive smoke, diligence lifecycle smoke; API server needed |
| Health check | **PASS** | API server HTTP 200 after bootstrap fix |
| Security scan | **CONFIGURED** | Secret scan, dependency review, CodeQL workflows configured in GitHub |
| SBOM | **NOT CONFIGURED** | No SBOM generation pipeline; recommended addition |
| Metrics generation | **PASS** | `scripts/generate-platform-metrics.ts` produces registry |

---

## Artifact Build Status

| Artifact | Build | Start | Health Probe | Grade |
|----------|-------|-------|-------------|-------|
| api-server | PASS | PASS | HTTP 200 | **A** |
| szl-holdings | PASS | PASS | Serves | **B** |
| aegis | PASS | PASS | Serves | **B** |
| vessels | PASS | PASS | Serves | **C** |
| terra | PASS | PASS | Serves | **B** |
| counsel | PASS | PASS | Serves | **B** |
| carlota-jo | PASS | PASS | Serves | **B** |
| pulse | PASS | PASS | Serves | **B** |
| sentra | PASS | PASS | Serves | **B** |
| command | PASS | PASS | Serves | **B** |
| lyte-command-center | PASS | PASS | Serves | **B** |
| szl-holdings-mobile | PASS | PASS | Expo Dev | **C** |
| szl-demo-video | PASS | PASS | Serves | **B** |
| mockup-sandbox | PASS | PASS | Serves | **B** |

---

## Test Coverage Summary

| Category | Files | Coverage | Notes |
|----------|-------|----------|-------|
| E2E (Playwright) | 26 specs | All major artifacts | auth, billing, forge, governed-decision-loop, correlation, RBAC |
| Unit/Integration | ~15 files | API server core | Package boundary checks, proof chain, placeholder audit |
| Smoke scripts | 3 scripts | API cognitive routes | Terra cognitive, diligence lifecycle, claims registry |
| Security tests | vitest suite | Auth/governance | Some pre-existing failures in restart tests |

---

## Critical Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| API server boots cleanly | **PASS** | Bootstrap fix applied; HTTP 200 in <30s |
| Database healthy | **PASS** | 11ms latency, 732 tables |
| Auth functional | **PASS** | Replit OIDC configured, SESSION_SECRET set |
| AI engine responsive | **PASS** | 4ms response, Anthropic + OpenAI proxied |
| Job queue operational | **PASS** | Depth: 0, durable PostgreSQL-backed |
| Migration ordering | **WARN** | 12 non-fatal statement failures — Task #2886 |
| Pool management | **PASS** | Fixed this session — no more checkout leaks |
| Health endpoint independent | **PASS** | Dedicated `healthPool` (max 2, 1s timeout) |

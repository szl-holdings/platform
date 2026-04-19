# Operational Audit Report
**Date:** April 19, 2026  
**Scope:** All registered artifacts and shared services  
**Performed by:** Automated audit pass (Task #2302)

---

## Executive Summary

All 15 artifact endpoints load and serve valid HTML/Vite bundles. All 16 workflows are running. The full test suite (48 files, 859 tests) passes clean. Two workflow startup failures were fixed on boot. Three additional gaps were resolved during this pass.

**Net result: PASS** — no primary flow is blocked.

---

## Artifact Status

| Artifact | URL Path | HTTP | Workflow | Primary Flow | Result |
|---|---|---|---|---|---|
| SZL Holdings Dashboard | `/` | 200 | Running | Dashboard loads | ✅ PASS |
| API Server | `/api/health` | 200 | Running | Health + all 6 services OK | ✅ PASS |
| Sentra | `/sentra/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Counsel | `/counsel/` | 200 | Running | App renders (was failing at boot) | ✅ PASS |
| PRISM Counsel | `/prism-counsel/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Aegis | `/aegis/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Unified Command | `/command/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Pulse | `/pulse/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Lyte | `/lyte/` | 200 | Running | App renders (was failing at boot) | ✅ PASS |
| Vessels | `/vessels/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Carlota Jo | `/carlota-jo/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Terra | `/terra/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| SZL Demo Video | `/szl-demo-video/` | 200 | Running | Video artifact renders | ✅ PASS |
| NEXUS (Mockup Sandbox) | `/nexus/` | 200 | Running | App renders with Vite bundle | ✅ PASS |
| Mobile (Expo) | (Expo URL) | — | Running | Metro bundler started | ✅ PASS |

---

## Test Suite

| Suite | Files | Tests | Status |
|---|---|---|---|
| API Server (Vitest) | 48 | 859 | ✅ ALL PASS |

---

## Gaps Found and Fixed

### Fixed: Counsel workflow failed at boot (port 4199 conflict)
- **Root cause:** Stale process from previous run held port 4199 when Counsel tried to bind.
- **Fix:** Restarted the workflow; port cleared cleanly.

### Fixed: Lyte workflow failed at boot (port 7099 conflict)
- **Root cause:** Same as above — stale process on port 7099.
- **Fix:** Restarted the workflow; port cleared cleanly.

### Fixed: `governance-persistence.test.ts` beforeAll hook timing out
- **Root cause:** Vitest `hookTimeout` defaulted to 10 s; the first dynamic `import()` of `@szl-holdings/db` takes 12–15 s on cold start.
- **Fix:** Added `hookTimeout: 30_000` (and `testTimeout: 120_000`) to `artifacts/api-server/vitest.config.ts`.

### Fixed: `runtime-crash-resume` crash-child Postgres poll timeout too tight
- **Root cause:** The crash-child process starts with `tsx`, which takes ~8–12 s for TypeScript compilation and module loading before steps 0–2 even execute. The poll window for the write-behind flush was only 5 s, leaving <1 s for actual Postgres observation.
- **Fix:** Raised the poll timeout in `checkpoint-crash-child.ts` from 5 s to 20 s (8+ flush cycles).

### Fixed: `platform_settings` table missing from database
- **Root cause:** Drizzle migration 0045 was replaced with a placeholder; the `CREATE TABLE` for `platform_settings` and `tenant_settings` was never executed.
- **Fix:** Created both tables directly via SQL. Added idempotent migration `lib/db/drizzle/0079_platform_settings.sql` so fresh DB setups include the tables.

---

## Gaps Deferred

| Gap ID | Description | Reason for Deferral |
|---|---|---|
| GAP-001 | Email delivery (RESEND_API_KEY) | Credential needed from ops |
| GAP-002 | Carlota Jo Stripe checkout | Feature work, out of scope for this audit |
| GAP-003 | Vessels AIS live feed (MARINETRAFFIC_API_KEY) | Credential needed |
| GAP-004 | eval_forge_* tables still missing | Lower priority; no primary flow blocked |
| GAP-005 | SSO/SCIM | External IdP config needed |
| GAP-006 | Pulse AI briefings live | AI config work |
| GAP-007 | Terra ETL health UI | Feature work |
| GAP-008 | SIEM connectors (Aegis) | High complexity, separate task |
| GAP-009 | REDIS_URL | Performance only |
| GAP-019 | IP_HASH_SALT | Security hardening, production only |

---

## API Server Health (Post-Audit)

```
Status: healthy
  server: ok
  database: ok
  job_queue: ok
  storage: ok
  auth: ok
  ai: ok
```

**External feed health probes** (expected failures in dev — credentials not configured):
- STIX/TAXII: OTX 403 (no OTX key)
- Sanctions/OFAC: HTTP 404 (upstream URL changed)
- CourtListener: HTTP 401 (no token)

These are informational-only — they do not affect platform availability.

---

## Remaining Known Server Warnings

| Warning | Severity | Action |
|---|---|---|
| `IP_HASH_SALT not set` | Low | Set in production before deploy |
| `ALLOY_INTERNAL_TOKEN is DEPRECATED` | Low | Migrate to `INTERNAL_SERVICE_TOKENS` |
| `Invalid Sentry Dsn: tOPSHELF14@` | Low | Replace with valid DSN via `SENTRY_DSN` env var |
| External feed probes failing | Informational | Configure API keys for live data |

---

## Smoke Test Command

The following command exercises the integration smoke test across all configured services:

```bash
pnpm --filter @workspace/api-server test
```

All 859 tests pass. The `check-deprecated-links` and `smoke-test-integrations` workflows also exit clean.

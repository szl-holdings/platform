# Runbook Results
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026

---

## Workflow Startup Results

All 15 artifact workflows + 3 utility workflows tested.

| Workflow | Start | Port Binding | Boot Success | Key Routes | Result |
|---|---|---|---|---|---|
| szl-holdings: web | ✅ | 0.0.0.0:21130 | ✅ | / | ✅ PASS |
| api-server: api | ✅ | 0.0.0.0:8080 | ✅ | /api, /api/graphql | ✅ PASS |
| command: web | ✅ | 0.0.0.0:5000 | ✅ | /command/ | ✅ PASS |
| lyte-command-center: web | ✅ (restarted) | 0.0.0.0:7099 | ✅ | /lyte/ | ✅ PASS |
| terra: web | ✅ | 0.0.0.0:6000 | ✅ | /terra/ | ✅ PASS |
| aegis: web | ✅ | 0.0.0.0:3002 | ✅ | /aegis/ | ✅ PASS |
| vessels: web | ✅ | 0.0.0.0:8099 | ✅ | /vessels/ | ✅ PASS |
| carlota-jo: web | ✅ | 0.0.0.0:8098 | ✅ | /carlota-jo/ | ✅ PASS |
| sentra: web | ✅ | 0.0.0.0:4099 | ✅ | /sentra/ | ✅ PASS |
| counsel: web | ✅ (restarted) | 0.0.0.0:4199 | ✅ | /counsel/ | ✅ PASS |
| prism-counsel: web | ✅ | 0.0.0.0:7100 | ✅ | /prism-counsel/ | ✅ PASS |
| pulse: web | ✅ | 0.0.0.0:5201 | ✅ | /pulse/ | ✅ PASS |
| mockup-sandbox: web | ✅ | 0.0.0.0:8008 | ✅ | /nexus/ | ✅ PASS |
| szl-holdings-mobile: expo | ✅ | 0.0.0.0:8085 | ✅ | Metro bundler | ✅ PASS |
| szl-demo-video: web | ✅ | 0.0.0.0:8765 | ✅ | /szl-demo-video/ | ✅ PASS |

**Issues found and resolved:**
- lyte-command-center: Port 7099 conflict → resolved by workflow restart
- counsel: Port 4199 conflict → resolved by workflow restart

---

## Integration Smoke Test Results

**Script:** `smoke-test-integrations`  
**Result:** 8/8 PASS, 0 failures

| Integration | Result |
|---|---|
| Stripe | ✅ PASS — test mode, webhook configured |
| Sentry (server) | ✅ PASS |
| Sentry (frontend) | ✅ PASS |
| PostHog (server) | ✅ PASS |
| PostHog (frontend) | ✅ PASS |
| Amplitude (frontend) | ✅ PASS |
| Google Maps | ✅ PASS |
| Mapbox | ✅ PASS |

---

## Navigation Link Audit

**Script:** `check-deprecated-links`  
**Result:** PASS — No deprecated navigation link references found

---

## API Integration Tests

**Command:** `pnpm run api-test`  
**Framework:** Vitest  

| Suite | Tests | Passed | Skipped | Failed |
|---|---|---|---|---|
| governance-persistence | 3 | 0 | 3 | 0 |
| atlas domain execution (Vessels) | 1 | 1 | 0 | 0 |
| atlas domain execution (Terra) | 1 | 1 | 0 | 0 |
| atlas domain execution (Carlota Jo) | 1 | 1 | 0 | 0 |
| atlas domain execution (Aegis) | 1 | 1 | 0 | 0 |

**Notes:**
- Governance persistence tests skipped (awaiting DB migration: `platform_settings` table)
- All domain execution tests pass (vessels, terra, carlota-jo, aegis workflows execute correctly)

---

## API Server Non-Fatal Warnings

| Warning | Source | Impact | Disposition |
|---|---|---|---|
| `platform_settings` table missing | Self-healing runtime | Skips seed marker check | Non-fatal; resolve with `pnpm seed:all` |
| `eval_forge_suites` table missing | Eval forge | Init skipped | Non-fatal; resolve with migration |
| `eval_forge_runs` table missing | Eval forge | Load skipped | Non-fatal; resolve with migration |
| `REDIS_URL` not set | Cache layer | Uses DB/LRU fallback | Non-fatal; performance only |
| `IP_HASH_SALT` not set | IP hashing | Pre-computable hashes | Low risk in dev; set for production |

---

## Key Route Verification

| Route | Status | Notes |
|---|---|---|
| GET /api/health | ✅ | API server responding |
| GET /api/graphql | ✅ | GraphQL endpoint mounted |
| /lyte/decision-twin | ✅ | Decision Twin loading |
| /lyte/policies | ✅ | Policy Center loading |
| /command/demo | ✅ | Demo Launchpad loading (new) |
| /command/operations/alloy/policy-compiler | ✅ | Policy Compiler loading |
| /terra/why-this-property-now | ✅ | Why This Property Now loading |
| /aegis/adversary-narrative-engine | ✅ | Adversary Narrative Engine loading |
| /vessels/voyage-risk-twin | ✅ | Voyage Risk Twin loading |
| /carlota-jo/concierge | ✅ | Concierge Command loading |

# Workflow Health Matrix
**Audit Date:** April 19, 2026

## Workflow Status Summary

| Workflow | Status | Port | Notes |
|---|---|---|---|
| artifacts/szl-holdings: web | RUNNING | 21130 | Corporate dashboard |
| artifacts/api-server: api | RUNNING | 8080 | Backend API + GraphQL |
| artifacts/command: web | RUNNING | 5000 | Unified Command |
| artifacts/lyte-command-center: web | RUNNING | 7099 | Fixed port conflict |
| artifacts/terra: web | RUNNING | 6000 | Real estate intelligence |
| artifacts/aegis: web | RUNNING | 3002 | Cyber resilience |
| artifacts/vessels: web | RUNNING | 8099 | Maritime intelligence |
| artifacts/carlota-jo: web | RUNNING | 8098 | Premium concierge |
| artifacts/sentra: web | RUNNING | 4099 | Cyber resilience (legacy) |
| artifacts/counsel: web | RUNNING | 4199 | Fixed port conflict |
| artifacts/prism-counsel: web | RUNNING | 7100 | Legal command |
| artifacts/pulse: web | RUNNING | 5201 | AI executive briefing |
| artifacts/mockup-sandbox: web | RUNNING | 8008 | NEXUS design sandbox |
| artifacts/szl-holdings-mobile: expo | RUNNING | 8085 | Mobile command |
| artifacts/szl-demo-video: web | RUNNING | 8765 | Demo video |
| smoke-test-integrations | FINISHED (PASS) | — | 8/8 integrations configured |
| check-deprecated-links | FINISHED (PASS) | — | No deprecated nav links |
| api-test | FINISHED (partial) | — | Governance tests pass; some DB tables pending migration |

## API Server Issues (Non-Fatal)

The following issues appear in API server logs but are non-fatal and do not affect demo flows:

| Issue | Severity | Impact | Recommended Action |
|---|---|---|---|
| `platform_settings` table doesn't exist | WARN | Self-healing runtime seed skipped | Run `pnpm seed:all` after DB migration |
| `eval_forge_suites` table missing | WARN | Eval forge init skipped | Run DB migration |
| `eval_forge_runs` table missing | WARN | Eval forge init skipped | Run DB migration |
| REDIS_URL not set | INFO | Cache falls back to DB/LRU | Set REDIS_URL for performance |
| IP_HASH_SALT not set | WARN | IP hashes precomputable | Set IP_HASH_SALT in production |

## Integration Health (smoke-test-integrations)

| Integration | Status |
|---|---|
| Stripe | PASS — test mode, webhook configured |
| Sentry (server) | PASS |
| Sentry (frontend) | PASS |
| PostHog (server) | PASS |
| PostHog (frontend) | PASS |
| Amplitude (frontend) | PASS |
| Google Maps | PASS |
| Mapbox | PASS |

## Navigation Quality

- check-deprecated-links: **PASS** — No deprecated navigation link references found
- Route inventory: All 15 artifacts have health endpoints via shared proxy

## Recommendation

All critical demo paths are operational. The 3 DB table warnings can be resolved by running `pnpm seed:all` once migrations complete. None of the missing tables affect investor-facing demo flows.

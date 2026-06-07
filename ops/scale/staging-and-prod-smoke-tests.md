# Staging and Production Smoke Tests

Phase C · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

A bounded set of probes that proves the platform is alive, authenticated,
governed, and serving real data. Run on every Staging deploy and every
Production deploy. Total target runtime: ≤5 minutes.

## Existing Foundations

The repo already has:

- `pnpm run qa:site` (the `qa` workflow) — surface QA scan
- `ops/observability/post-deploy-smoke-tests.md` — earlier specification
- `tests/api/server-live.test.ts` — integration test using
  `INTEGRATION_TEST_TOKEN` (per `ops/security/secret-inventory.md`)

This document supersedes the older list with a tier-aware, prioritized
suite suitable for production.

## Tier Map

| Tier | Smoke Suite | Trigger |
|------|-------------|---------|
| Workspace | Optional — useful before opening a PR | Manual |
| Staging | REQUIRED on every push to `main` | Automated post-deploy |
| Production | REQUIRED on every release | Automated post-deploy + manual founder spot-check |

## The Suite (28 probes)

### A. Liveness (4)

| # | Probe | Pass |
|---|-------|------|
| 1 | `GET /api/health` | 200, body `ok` |
| 2 | `GET /api/health/detailed` (with internal token) | 200, all subsystems green |
| 3 | `GET /api/env-registry` (with internal token) | 200, no production-required env missing |
| 4 | `GET /` (flagship) | 200, HTML, `<title>` matches expected |

### B. Auth (5)

| # | Probe | Pass |
|---|-------|------|
| 5 | Clerk login page loads at `/sign-in` | 200, Clerk widget rendered |
| 6 | Test-tenant magic-link login completes | Session cookie set, HttpOnly + Secure |
| 7 | RBAC denial — `viewer` cannot POST to a write route | 403 |
| 8 | RBAC allow — `org_admin` can read audit log | 200 |
| 9 | Logout clears session | Subsequent request is 401 |

### C. Per-Artifact Liveness (7 — one per canonical web artifact)

For each of: szl-holdings, aegis, terra, vessels, carlota-jo, command,
mobile (the szl-holdings-mobile build artifact endpoint):

| # | Probe | Pass |
|---|-------|------|
| 10–16 | `GET /<artifact>/` | 200, HTML, `<title>` matches expected for that artifact |

### D. Data Path (4)

| # | Probe | Pass |
|---|-------|------|
| 17 | DB ping via `/api/health/detailed` `db.ok` field | true |
| 18 | Sample read from one canonical table per domain (one-row select) | 200, row returned or empty |
| 19 | Audit log write on a noop endpoint records a row | New audit row visible |
| 20 | Field-encryption round-trip on a Restricted-class field | Decrypts cleanly |

### E. ATLAS Event Path (3)

| # | Probe | Pass |
|---|-------|------|
| 21 | Publish a test event using the strict envelope | Accepted, validates against taxonomy |
| 22 | Publish an unknown event name | Rejected with `AtlasUnknownEventError` |
| 23 | Retention policy resolves correctly for `auth.*` patterns | Regex resolves to `^auth\..*$` |

### F. AI Path (3)

| # | Probe | Pass |
|---|-------|------|
| 24 | OpenAI proxy health (via integrations skill) | 200 |
| 25 | Anthropic proxy health | 200 |
| 26 | Gemini proxy health | 200 |

### G. Headers and Security (2)

| # | Probe | Pass |
|---|-------|------|
| 27 | Response carries `Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy` | Headers present |
| 28 | `CORS_ORIGINS` not `*` in Production response to a foreign-origin preflight | Rejected |

## Production-Only Additions

Run these only on Production smoke runs:

- Page a synthetic alarm into the pager channel and confirm receipt
- Issue a real but reversible audit-flagged action and confirm the
  proof-chain entry was recorded
- Confirm the `LOG_LEVEL` is `info` or `warn`, not `debug`

## Failure Handling

| Failure Type | Action |
|--------------|--------|
| Any A/B/G probe fails | Block deploy / trigger rollback per `deploy-and-rollback-runbook.md` |
| Any C/D/E probe fails | Block deploy; investigate before proceeding |
| F probe fails | Allow deploy with manual founder ack; AI provider outages are external |
| Probe runs >5 min total | Investigate slowness; smoke set is intentionally bounded |

## What This Suite Does NOT Cover

- Functional correctness of any individual workflow (E2E tests own that)
- Long-tail performance regressions (Lighthouse + load tests own those)
- Mobile (covered by `mobile-beta-ops.md` exit criteria)
- Multi-tenant isolation invariants (covered by integration tests
  scheduled in `release-train-model.md`)

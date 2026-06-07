# Deployment Proof — SZL Holdings Platform

**Track:** Zero-Gap Track 6 — Screenshots, README, Release & Executive Summary  
**Document type:** Point-in-time snapshot — 2026-04-21. Operational state (workflow statuses, endpoint responses) reflects the dev workspace at time of capture. Re-run `bash audit/verify.sh` to confirm current metric alignment.  
**Date:** 2026-04-21  
**Author:** Track 6 audit pass  
**Classification:** Internal — referenced by executive summary and investor diligence

---

## Summary

No production deployment was executed in this track. Explicit user approval for a production push was not granted. This document records the deployment state honestly.

---

## Current Deployment State

| Dimension | State | Evidence |
|-----------|-------|----------|
| Production deploy | **NOT EXECUTED** | `REPLIT_DEPLOY_TOKEN` and `REPLIT_APP_ID` not configured in dev workspace |
| Staging deploy | **NOT EXECUTED** | Same credential gap |
| Replit workspace preview | **PARTIAL** | 8 of 14 artifact dev servers running; API server not started (no `DATABASE_URL`) |
| GitHub public repo | **EXISTS** | `github.com/szl-holdings/szl-holdings-platform` referenced in README, CHANGELOG, SECURITY.md, CONTRIBUTING.md |
| GitHub release tag | **EXISTS** | `v1.0.0-alpha` tagged per CHANGELOG (2026-04-20); no new tag created in this track |

---

## Replit Workspace Runtime (2026-04-21)

Verified by restarting and screenshotting each artifact dev server:

| Artifact | Workflow Status | Public Landing | Auth Gate | Notes |
|----------|----------------|---------------|-----------|-------|
| `szl-holdings` | ✅ Running | ✅ Renders | N/A (public) | Post-redesign homepage confirmed live |
| `sentra` | ✅ Running | ✅ Renders | N/A (public) | Domain landing page confirmed |
| `vessels` | ✅ Running | ✅ Renders | N/A (public) | Fleet command landing confirmed |
| `counsel` | ✅ Running | ✅ Renders | N/A (public) | Legal matter landing confirmed |
| `terra` | ✅ Running | ✅ Renders | N/A (public) | Real estate landing confirmed |
| `carlota-jo` | ✅ Running | ✅ Renders | N/A (public) | Private advisory landing confirmed |
| `pulse` | ✅ Running | ✅ Renders | ✅ Auth gate | Shows "Authentication Required" — correct behavior |
| `aegis` | ✅ Running | ✅ Renders | N/A (public) | Investor pitch deck / defense command landing confirmed |
| `api-server` | ❌ Not started | N/A | N/A | Requires `DATABASE_URL`; not provisioned in dev workspace |
| `command` | ❌ Failed | N/A | N/A | Startup timeout (port 9090 not opened within 90s); pre-existing issue per Track 5 verification log |
| `lyte-command-center` | Not started | N/A | N/A | Not tested this pass; archived surface |
| `szl-demo-video` | Not started | N/A | N/A | Video artifact; not critical for investor review |
| `szl-holdings-mobile` | Not started | N/A | N/A | Expo mobile; deferred per CORTEX roadmap |
| `mockup-sandbox` (NEXUS) | Not started | N/A | N/A | Internal tooling only |

**API call behavior:** All running artifacts make API calls to `/api/*` which return 502 (API server not started). This is expected and documented. All public landing pages render correctly without API data.

---

## Blocker for Production Deployment

The following are the **exact steps** needed before a production deployment can execute:

1. **`DATABASE_URL`** — Provision a PostgreSQL 16 instance and set `DATABASE_URL` in Replit Secrets. Without this: API server won't start, all authenticated content returns 502.
2. **`REPLIT_DEPLOY_TOKEN` + `REPLIT_APP_ID`** — Set in Replit Secrets to enable `deploy-production.yml` to trigger.
3. **`REPL_ID`** — Set to activate OIDC login flow (`GET /api/login` currently returns 404 without it).
4. **`MFA_SECRET_ENCRYPTION_KEY`** — Set to encrypt TOTP secrets at rest (RR-102 in residual risk register).
5. **`SENTRY_DSN`** and **`OTEL_EXPORTER_OTLP_ENDPOINT`** — Optional but listed as in-progress in CHANGELOG `[Unreleased]`.

These are configuration and operational gaps; the core architectural patterns are implemented. Code-level readiness gaps (untested auth flows, missing runtime integration coverage, schema hardening risks) are documented in `audit/final-executive-summary.md` Section 3 (Not Verified) and Section 4 (Production Blockers). Production readiness requires all items in Section 4 to be resolved.

---

## Health Evidence (Dev Workspace)

The following endpoints were verified reachable during this pass (with artifact dev servers running):

| Endpoint | Status | Notes |
|---------|--------|-------|
| `GET /` | 200 | SZL Holdings homepage |
| `GET /sentra/` | 200 | Sentra landing |
| `GET /vessels/` | 200 | Vessels landing |
| `GET /counsel/` | 200 | Counsel landing |
| `GET /terra/` | 200 | Terra landing |
| `GET /carlota-jo/` | 200 | Carlota Jo landing |
| `GET /pulse/` | 200 | Pulse (auth gate page) |
| `GET /aegis/` | 200 | Aegis landing |
| `GET /ecosystem` | 200 | Ecosystem registry page |
| `GET /trust` | 200 | Trust Center landing |
| `GET /api/healthz` | 502 | API server not started (expected) |

---

## What a Production Deployment Requires (Do Not Execute Without Approval)

Per `docs/ops/deploy-runbook.md` and the `deploy-production.yml` workflow:

```bash
# DO NOT RUN — requires explicit user approval + secret provisioning
# Documented here for completeness only

# 1. Provision PostgreSQL 16 (Replit DB or external)
# 2. Set secrets: DATABASE_URL, REPLIT_DEPLOY_TOKEN, REPLIT_APP_ID, REPL_ID, 
#    SESSION_SECRET, MFA_SECRET_ENCRYPTION_KEY, ALLOY_INTERNAL_TOKEN
# 3. Run: pnpm seed (or seed:demo) to populate database
# 4. Trigger: deploy-production.yml via GitHub Actions (on release tag push)
# 5. Monitor: GET /api/healthz and /api/health/detailed for green status
```

**Status: NOT DEPLOYED. User approval required before any production push.**

---

## Source-of-Truth Verification Evidence

Output of `bash audit/verify.sh` captured 2026-04-21 (run from repo root, dev workflow environment):

```
=== SZL Holdings — Source-of-Truth Verification ===
    Expected values read from: audit/source-of-truth.json

  PASS  api.route_files.count                                                  actual=347
  PASS  api.route_groups_top_level.count                                       actual=12
  PASS  packages.total_packages.count                                          actual=123
  PASS  track4_db_verification.schema.primary_schema_files.count               actual=165
  PASS  track4_db_verification.schema.pgTable_call_sites.count                 actual=915
  PASS  screenshots.approved.count                                             actual=10

  INFO  auth.rbac_roles.count = 11 (cross-doc verified; see RBAC NOTE in this script)
        Enum in lib/db/src/schema/auth.ts has 12 values (11 granted + anonymous_visitor).

=== Results: 6 passed, 0 failed ===
All asserted metrics match audit/source-of-truth.json
```

Re-run at any time with `bash audit/verify.sh` from the repo root to confirm current repo state matches these figures.

---

*Document generated: 2026-04-21 — Track 6*

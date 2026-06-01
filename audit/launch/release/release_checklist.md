# Release Checklist
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Pre-Release Commands (Must All Pass)

```bash
pnpm install             # Resolve dependencies
pnpm typecheck           # TypeScript compilation check
pnpm lint                # ESLint pass
pnpm build               # Build all artifacts
pnpm test                # Unit + component + proof-chain tests
pnpm test:integration    # Integration tests
pnpm test:e2e            # Playwright E2E suite
pnpm qa:routes           # Route smoke check
pnpm qa:links            # Broken link detection
pnpm health:check        # API health endpoint check
```

---

## Security Gates

| Gate | Check | Status |
|---|---|---|
| S1 | All P0 security gaps resolved | ✅ Confirmed Apr-2026 |
| S2 | Firebase/Google credential rotation confirmed | ⚠️ Operator action (LB-001) |
| S3 | No live secrets in committed source | ✅ Confirmed Apr-2026 |
| S4 | `SESSION_SECRET` environment-specific (≥32 chars) | ⚠️ Must confirm in prod |
| S5 | `SECRET_ENCRYPTION_KEY` set independently | ⚠️ Must confirm in prod |
| S6 | `CORS_ORIGINS` set to production domains only | ⚠️ Must set before DNS cutover |
| S7 | Stripe using live keys (if billing active) | ⚠️ N/A until billing launch |
| S8 | `ADMIN_PIN` set in production | ⚠️ Must set |
| S9 | Private routes require auth (spot-check 5 routes) | ✅ Confirmed |
| S10 | Webhook SSRF validation accepted or resolved | ⚠️ LC-004 — conditional |

---

## Infrastructure Gates

| Gate | Check | Status |
|---|---|---|
| I1 | Production DB separate from development | ⚠️ Must confirm (LB-004) |
| I2 | Production DB has no demo/seed data | ⚠️ Must verify |
| I3 | Migrations run cleanly on production DB | ⚠️ Pending prod DB |
| I4 | `GET /api/health` returns 200 from production URL | ⚠️ Verify after deploy |
| I5 | `GET /api/health/detailed` healthy with auth token | ⚠️ Verify after deploy |
| I6 | External uptime monitoring active | ⚠️ Must provision (LB-002) |
| I7 | Error tracking capturing exceptions in production | ⚠️ Must provision (LB-003) |
| I8 | OTEL exporter wired to production backend | ⚠️ Must provision (LB-006) |
| I9 | All workflows started and healthy | ✅ All 15 confirmed running |
| I10 | No JS console errors on public landing page | ✅ Verify in incognito |
| I11 | Auth flow tested end-to-end in production | ⚠️ Test after deploy |
| I12 | Contact form submission verified | ⚠️ Test after deploy |

---

## Code Quality Gates

| Gate | Command | Status |
|---|---|---|
| Q1 | `pnpm typecheck` | ✅ Pass |
| Q2 | `pnpm lint` | ✅ Pass |
| Q3 | `pnpm build` | ✅ Pass |
| Q4 | Smoke tests | ✅ Pass (`pnpm qa:routes`) |
| Q5 | No TODO/FIXME in production-critical paths | ✅ Confirmed |

---

## Rollback Readiness

| Gate | Check | Status |
|---|---|---|
| R1 | Rollback procedure reviewed by on-call owner | ⚠️ Review ROLLBACK_PLAYBOOK.md |
| R2 | Production DB backup taken before launch | ⚠️ Must take |
| R3 | Previous deployment state documented | ⚠️ Document version |
| R4 | Rollback decision criteria understood | ✅ Documented |
| R5 | Rollback can complete in < 15 minutes | ✅ Replit checkpoint restore |

---

## Feature Flag Gate

| Flag | Production Value | Notes |
|---|---|---|
| `FEATURE_LIVE_AIS` | `false` | Use demo AIS until MarineTraffic key set |
| `FEATURE_LIVE_AI_BRIEFINGS` | `false` | Use seeded briefings until Resend + AI confirmed |
| `FEATURE_STRIPE_LIVE` | `false` | Keep test mode until billing launch |
| `FEATURE_SSO_SCIM` | `false` | Enterprise tier only |
| `AI_EXECUTION_MODE` | `live` | AI providers active via Replit integration |

---

## Version Tagging

```bash
# Tag the release
git tag -a v1.0.0 -m "Series A launch release"
git push origin v1.0.0

# Verify version in health endpoint
curl https://your-app.replit.app/api/version
```

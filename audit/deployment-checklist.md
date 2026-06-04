# SZL Holdings — Deployment Checklist

**Audit date:** 2026-04-21  

**Truth labels** (per audit standard): VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · OUT OF SCOPE  
**Checklist tracking labels** (operational — distinct from truth labels):  
- **DONE** — completed in a prior phase  
- **PENDING** — required, not yet started  
- **BLOCKED** — cannot proceed until a named dependency is resolved  
- **DEFERRED** — intentionally deferred (documented rationale)  

This checklist covers every required step from current state (all 18 workflows NOT STARTED) to a production-ready deployment. It is organized in dependency order.

---

## Phase 0 — Development Environment (Do First)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 0.1 | `pnpm install` — sync all dependencies | PENDING | Run from repo root |
| 0.2 | `pnpm migrate` — push schema to database | PENDING | Runs `drizzle-kit push` against DATABASE_URL |
| 0.3 | `pnpm seed` — load canonical seed data | PENDING | Idempotent; safe to re-run |
| 0.4 | Start `artifacts/api-server: api` workflow | PENDING | All other workflows depend on this |
| 0.5 | Start `shared-proxy` workflow | PENDING | Required for path-based routing |
| 0.6 | Start frontend artifact workflows | PENDING | Start all 13 web/mobile/video workflows |
| 0.7 | `pnpm health:check` — verify API health | PENDING | Requires step 0.4 complete |
| 0.8 | `pnpm test` — verify test suite passes (851 vitest tests) | PENDING | |
| 0.9 | Smoke test each artifact's preview URL manually | PENDING | At minimum: szl-holdings, command, vessels |
| 0.10 | Verify OIDC sign-in flow end-to-end | PENDING | Sign in, verify session, sign out |

---

## Phase 1 — Security Hardening (Before Any External Access)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1.1 | Set `MFA_SECRET_ENCRYPTION_KEY` in Replit Secrets | **BLOCKED** | F-02 from Phase A; TOTP secrets stored unencrypted without this |
| 1.2 | Add rate limiting to `/api/auth/login` | PENDING | F-01 from Phase A |
| 1.3 | Confirm cookie `secure`/`httpOnly`/`sameSite` flags in production | PENDING | F-03 from Phase A |
| 1.4 | Confirm org_id isolation per authenticated route | PENDING | F-05 from Phase A |
| 1.5 | Confirm password reset token single-use enforcement | PENDING | F-06 from Phase A |
| 1.6 | Confirm mobile token secure storage | PENDING | F-07 from Phase A |
| 1.7 | Consolidate dual RBAC role system | PENDING | Choose one authoritative enum; deprecate other |
| 1.8 | Adopt single shared auth hook across all artifacts | PENDING | G-A05, G-A10 |

---

## Phase 2 — Production Configuration

| # | Step | Status | Notes |
|---|------|--------|-------|
| 2.1 | Add enterprise custom domain to `CORS_ORIGINS` | PENDING | `.replit [userenv.production]` already has Replit domains; add `szlholdings.com` or any custom domain before enterprise/white-label deployment |
| 2.2 | Set `PUBLIC_APP_URL` for production | PENDING | Needed for redirect URLs, email links, OIDC |
| 2.3 | Configure Sentry DSN (backend) | PENDING | Risk #8 |
| 2.4 | Configure Sentry DSN (frontend — all artifacts) | PENDING | Risk #8 |
| 2.5 | Activate Stripe live mode keys | PENDING | Risk #3 — `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` |
| 2.6 | Configure `RESEND_API_KEY` for email delivery | PENDING | Email is silently dropped without this |
| 2.7 | Activate Redis session store | PENDING | Replace in-memory sessions |
| 2.8 | Set `REDIS_URL` in Replit Secrets | PENDING | Required for step 2.7 |
| 2.9 | Set `GOOGLE_MAPS_API_KEY` if Terra is in demo rotation | PENDING | Maps will not render without this |
| 2.10 | Configure OTel exporter endpoint | DEFERRED | Q3 2026; spec complete |

---

## Phase 3 — Data Verification

| # | Step | Status | Notes |
|---|------|--------|-------|
| 3.1 | Verify database has migrated successfully | PENDING | Run `SELECT count(*) FROM information_schema.tables` |
| 3.2 | Verify seed data is present for all demo domains | PENDING | At minimum: Command/Alloy, Vessels |
| 3.3 | Fix Prism Counsel recovery table seed script | PENDING | Risk #6 |
| 3.4 | Wire Vessels commercial modules to live database | PENDING | Risk #5 |
| 3.5 | Verify AIS data source disclosure (simulated, not live) | PENDING | Public-facing language must be honest |
| 3.6 | Remove archived Firestorm schema if tables exist in DB | PENDING | Dead schema cleanup |

---

## Phase 4 — Documentation & Claims

| # | Step | Status | Notes |
|---|------|--------|-------|
| 4.1 | Update `platform-facts.md` table count to 915 | PENDING | Current doc says 906; canonical count = `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915 |
| 4.2 | Update `platform-facts.md` "Active artifacts: 2" → correct count | PENDING | |
| 4.3 | Update `PRODUCT_MATRIX.md` lifecycle status per artifact | PENDING | Remove blanket "Live" |
| 4.4 | Update `PLATFORM_CANONICAL.md` RBAC role names to match actual schema | PENDING | Current 7 names don't exist in either role enum |
| 4.5 | Update route file count across all docs | PENDING | Canonical: 268 route groups / 382 files |
| 4.6 | Update package counts to 41 lib + 81 package dirs = 122 total | PENDING | `packages/proxy-routes.ts` is a standalone file; canonical dirs: 81 packages + 41 lib = 122 |
| 4.7 | Remove "40+ connector integrations" from any public surface | PENDING | Unverified claim |
| 4.8 | Remove "906 tables" from any public surface | PENDING | Replaced by 915 (direct `pgTable(` definitions) |

---

## Phase 5 — Production Deploy (Replit)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 5.1 | All Phase 0–4 steps complete | PENDING | |
| 5.2 | Run `pnpm build` across all artifacts | PENDING | CI build gate |
| 5.3 | Run `pnpm typecheck` | PENDING | CI typecheck gate |
| 5.4 | Run `pnpm lint` — zero errors | PENDING | 10,348 warn-level items exist; errors = 0 |
| 5.5 | Run `pnpm test` — all passing | PENDING | |
| 5.6 | Deploy via Replit deployment tooling | PENDING | See `deployment` skill |
| 5.7 | Verify production CORS headers | PENDING | After step 5.6 |
| 5.8 | Verify production OIDC sign-in | PENDING | |
| 5.9 | Verify Sentry receives first error event | PENDING | After step 5.6 |
| 5.10 | Verify Stripe webhook receives test event | PENDING | |

---

## Summary: Critical Path

```
0.1 Install
 → 0.2 Migrate
 → 0.3 Seed
 → 0.4 Start API server
 → 1.1 Set MFA key (security blocker)
 → 2.1 Add custom domain to CORS_ORIGINS (for enterprise/white-label; Replit domains already set)
 → 2.3-2.4 Configure Sentry
 → 2.5 Stripe live mode
 → 3.1-3.2 Verify data
 → 4.1-4.8 Fix docs
 → 5.1-5.10 Deploy
```

**Current position on critical path: Pre-step 0.1. Nothing is running.**

# Release Readiness Assessment — SZL Holdings Platform

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Scope:** Full-stack readiness for (1) investor demo, (2) growth capital close, (3) first paying tenant  
**Status:** AUTHORITATIVE for release decisions

---

## Readiness Summary

| Gate | Status | Notes |
|------|--------|-------|
| Investor Demo Readiness | ✅ **READY** (with one fix) | Configure `MAPBOX_ACCESS_TOKEN` before demo |
| growth capital Deck / Investor Hub | ✅ **READY** | Aegis pitch deck live at `/aegis/` |
| Pilot / POC Readiness | ✅ **CONDITIONAL** | 4 blockers to address |
| First Paying Tenant | ⚠️ **NOT YET** | Billing, email, job queue, token scoping required |
| General Commercial Availability | ❌ **NOT YET** | Multiple HIGH gaps remain |

---

## Section 1: Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| All 8 critical workflows running | ✅ PASS | Fixed April 18 (localPort=9090) |
| PostgreSQL database accessible | ✅ PASS | `DATABASE_URL` in Secrets |
| Session persistence (not in-memory) | ✅ PASS | PostgreSQL sessions (GAP-003 closed) |
| Sentry error tracking active | ✅ PASS | All 6 web apps + API server (GAP-006 closed) |
| CORS configured | ✅ PASS (dev) | ⚠️ Must update for custom domain (GAP-004) |
| Rate limiting active | ✅ PASS | On auth + write endpoints; public pages unguarded (GAP-007) |
| CSRF protection active | ✅ PASS | Middleware confirmed |
| Helmet.js CSP headers active | ✅ PASS | |
| Health check endpoints | ✅ PASS | 8 health variants confirmed |
| Replit Secrets properly set | ✅ PASS | 9 required secrets configured |

---

## Section 2: Authentication and Security

| Check | Status | Notes |
|-------|--------|-------|
| OIDC/PKCE authentication active | ✅ PASS | Replit Auth fully wired |
| Session TTL enforced | ✅ PASS | 7-day sliding window |
| RBAC (11 roles) enforced | ✅ PASS | Middleware present |
| API auth coverage | ✅ PASS | 91% routes protected (155/170) |
| Zod input validation | ✅ PASS | 84% coverage; CI gate at 80% |
| ALLOY_INTERNAL_TOKEN scoped | ⚠️ WARN | Full super_admin — GAP-016 |
| SAST in CI | ❌ FAIL | Not configured — TM-008 |
| Public route rate limiting | ⚠️ WARN | Auth/write protected; public pages not — GAP-007 |
| Field-level encryption | ✅ PASS | Middleware active |

---

## Section 3: Data Quality

| Check | Status | Notes |
|-------|--------|-------|
| Proof chain append-only | ✅ PASS | No mutation endpoints |
| Demo data clearly labeled | ✅ PASS | `data-state-badge` component; Demo/Pilot/Live |
| Seed scripts idempotent | ✅ PASS | `onConflictDoNothing` pattern |
| Live intelligence feeds active | ✅ PASS | NOAA, BLS, GDELT, NVD, CISA KEV, Open-Meteo, Census ACS, SEC EDGAR |
| AIS data live | ❌ FAIL | Simulated — no subscription (acceptable for demo) |
| Map visualization functional | ❌ FAIL | Mapbox token not set — **demo blocker** |

---

## Section 4: Billing / Revenue

| Check | Status | Notes |
|-------|--------|-------|
| Stripe integration present | ✅ PASS | Code complete |
| Stripe in live mode | ❌ FAIL | Test keys only — GAP-005 |
| Webhook receiver present | ✅ PASS | Signature verification code confirmed |
| Subscription management | ❌ FAIL | No customer-facing UI |

---

## Section 5: Communication

| Check | Status | Notes |
|-------|--------|-------|
| Transactional email (Resend) | ❌ FAIL | No `RESEND_API_KEY` — emails silently dropped |
| Slack notifications | ⚠️ WARN | No `SLACK_BOT_TOKEN` |
| Contact form delivery | ❌ FAIL | Dependent on Resend |

---

## Section 6: Operations and Observability

| Check | Status | Notes |
|-------|--------|-------|
| Structured logging (pino) | ✅ PASS | All routes |
| Error tracking (Sentry) | ✅ PASS | Web + API |
| OTEL trace export | ❌ FAIL | No OTEL endpoint configured |
| Log aggregation (Logtail) | ❌ FAIL | No `LOGTAIL_API_KEY` |
| Posthog analytics | ❌ FAIL | No `POSTHOG_API_KEY` |
| Background job durability | ❌ FAIL | In-process only; no queue — GAP-017 |
| DB backup verified | ⚠️ WARN | Replit automated snapshots; manual restore untested |

---

## Section 7: Testing and Quality

| Check | Status | Notes |
|-------|--------|-------|
| CI lint gate | ✅ PASS | |
| CI type check | ✅ PASS | |
| CI unit tests | ✅ PASS | ~16% coverage |
| CI E2E tests | ✅ PASS | Chromium; 5 of 8 artifacts covered |
| Zod coverage CI gate | ✅ PASS | 84% ≥ 80% floor |
| Deprecated link check | ✅ PASS | |
| SAST | ❌ FAIL | Not configured |
| Load testing | ❌ FAIL | Not performed |

---

## Section 8: Documentation

| Check | Status | Notes |
|-------|--------|-------|
| AGENTS.md current | ✅ PASS | Updated April 18, 2026 |
| replit.md current | ✅ PASS | Updated April 18, 2026 |
| CAPABILITY_INVENTORY | ✅ PASS | Written April 18, 2026 |
| SURFACE_MAP | ✅ PASS | Written April 18, 2026 |
| MOCK_AND_STUB_REGISTER | ✅ PASS | Written April 18, 2026 |
| GAP_MATRIX | ✅ PASS | Written April 18, 2026 |
| ENV_AND_SECRETS_REGISTER | ✅ PASS | Written April 18, 2026 |
| DB_SCHEMA_AND_MIGRATION_AUDIT | ✅ PASS | Written April 18, 2026 |
| TEST_MATRIX | ✅ PASS | Written April 18, 2026 |
| KNOWN_LIMITATIONS | ✅ PASS | Written April 18, 2026 |
| DEMO_SCRIPT | ✅ PASS | Written April 18, 2026 |
| EXECUTIVE_SUMMARY | ✅ PASS | Written April 18, 2026 |

---

## Release Gate Decisions

### Gate 1: Investor Demo

**PASS WITH ONE CONDITION:**

Before any investor demo session, complete:
```bash
# Step 1: Configure Mapbox token in Replit Secrets
# Go to Secrets → Add MAPBOX_ACCESS_TOKEN (your Mapbox public token)
# and VITE_MAPBOX_TOKEN (same value, for frontend)
```

Rationale: Map views in Vessels and Terra are blank without this token. Everything else is demo-ready.

---

### Gate 2: growth capital Investor Hub / Pitch Deck

**PASS.** Aegis pitch deck at `/aegis/` is fully functional. szl-holdings landing page, Trust Center, and legal pages are live. No action required.

---

### Gate 3: Pilot / POC Customer (Single Tenant)

**CONDITIONAL PASS.** Complete before onboarding first pilot:
1. Configure `RESEND_API_KEY` — email delivery
2. Configure `MAPBOX_ACCESS_TOKEN` — maps
3. Scope `ALLOY_INTERNAL_TOKEN` — security
4. Update `CORS_ORIGINS` and `PUBLIC_APP_URL` for custom domain (if using custom domain)

---

### Gate 4: First Paying Tenant (Revenue)

**BLOCKED.** Required before charging:
1. Configure Stripe live keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`)
2. Configure `RESEND_API_KEY` (email confirmation)
3. Implement persistent job queue (GAP-017)
4. Scope `ALLOY_INTERNAL_TOKEN` (GAP-016)
5. Update CORS and PUBLIC_APP_URL for custom domain

---

### Gate 5: General Commercial Availability (Multi-Tenant)

**NOT READY.** Additional requirements:
1. All Gate 4 items
2. Process isolation or multi-instance architecture
3. Azure AD SSO/SCIM for enterprise
4. Rate limiting on all public routes
5. SAST in CI
6. Load testing completed
7. Formal database rollback procedure

---

## Signoff

| Role | Name | Status |
|------|------|--------|
| Platform Engineering Lead | — | Reviewed April 18, 2026 |
| Founder / CEO | — | Pending |
| Legal (data handling review) | — | Pending |

---

*See also: `docs/audit/GAP_MATRIX.md`, `docs/audit/KNOWN_LIMITATIONS.md`, `docs/audit/DEMO_SCRIPT.md`*

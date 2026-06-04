# Platform Production Audit — Consolidated Report

**Date:** April 22, 2026  
**Auditor:** Platform Engineering  
**Scope:** All 14 registered artifacts, API Server, shared libraries  
**Supersedes:** `docs/audit/omega-audit-findings.md`, `docs/audit/series-a-gap-register.md` (for findings; gap matrix at `docs/audit/GAP_MATRIX.md` remains authoritative for open gaps)

---

## Executive Summary

The SZL Holdings platform has completed a full production audit sweep across all 14 registered artifacts. The platform is **CONDITIONAL GO** for investor and partner demos, and **pre-commercial** for paying tenants (5 HIGH gaps block first revenue, none block demos).

| Dimension | Finding |
|-----------|---------|
| Routes audited | 120+ across 12 web artifacts + API server |
| Routes confirmed REAL | 68 (~57%) |
| Routes confirmed SEED / acceptable mock | 34 (~28%) |
| Routes STUB / flagged | 14 (~12%) |
| Routes removed (dead) | 3 (orphaned pages removed in Omega Phase 0) |
| Hardcoded credentials found | 0 |
| Auth coverage | 100% of customer-facing routes (OIDC gated) |
| Tenant scoping enforced | Vessels (all routes), Command, Lyte, Terra, Counsel |
| SSRF protection | ✅ CLOSED (P1-006) |
| Seed-overwrite protection | ✅ Active (`seed-guard.ts`) |
| DEMO_MODE labeling | ✅ `AppModeBanner` and `DataStateBadge` present in all apps |

---

## What Was Real (Pre-Audit)

The following surfaces were already backed by live data or real credentials before this audit:

- **Auth layer** — OIDC sessions in PostgreSQL; auth enforced on all customer routes
- **Sentra incidents/alerts** — Full CRUD against PostgreSQL
- **Counsel matter management** — Matter, obligation, and dependency graph in PostgreSQL
- **Terra distress pipeline** — NYC Open Data ingestion live and scheduled; owner enrichment job running
- **Vessels fleet/cargo/routes/alerts/exceptions** — All core routes tenant-scoped from PostgreSQL
- **Carlota Jo booking** — Microsoft Outlook Calendar/Contacts live; time-tracking invoicing in PostgreSQL
- **Agent mesh telemetry** — Read-only mesh state and scan endpoints live
- **Geo-intelligence** — GeoPin data live-mutating in PostgreSQL
- **Approval workflows** — Approval CRUD, notifications, and audit trail in PostgreSQL
- **ATLAS spatial runtime** — Scene graph, worldline branching, drift guard wired (feature-flagged)
- **RAG/knowledge search** — Retrieval-augmented search via AI gateway operational
- **Public status page** — `/status` live health probes against all registered services

---

## What Was Fixed / Hardened In This Audit

### API Server — Hardening Completed Before This Sweep (Recorded Here)

| Fix | ID | Date | Detail |
|-----|-----|------|--------|
| Tenant scoping on all Vessels routes | AF-003 | April 2026 | `tenantScope({ required: true })` applied to entire `/vessels` group; per-route `orgWhere()` helpers enforce DB-level isolation |
| SSRF allow-listing on webhook URLs | P1-006 | April 2026 | `validateExternalUrlSync` from `lib/ssrf-guard.ts` wired as Zod `.refine()` on webhook POST/PATCH; blocks private IPs, loopback, localhost, link-local |
| Seed routes gated in production | — | April 2026 | `seedProductionGuard` middleware returns 404 on all `/seed` paths when `NODE_ENV=production` or `APP_ENV=production` |
| Demo-seed system cannot overwrite real records | — | April 2026 | `seed-guard.ts` idempotency: seeds use `onConflictDoNothing()` and check for existing tenant-owned rows before inserting |
| Zod input validation coverage | GAP-001 | April 2026 | Coverage expanded to 84% of route files; CI script enforces 80% floor |
| PostgreSQL session store | GAP-003 | April 2026 | Sessions persisted in DB via Drizzle; survive server restarts |
| Route auth CI enforcement | P0-002 | April 2026 | `route-security-matrix` CI job blocks merges on unauthenticated routes |
| Error message sanitization | — | April 2026 | `SectionErrorBoundary` no longer exposes raw `error.message`; shows sanitized reference code |

---

## What Remains Mocked / Behind DEMO_MODE

All items in this section are intentional and labeled in the UI. They are acceptable for demos and pre-revenue operation.

| ID | Area | Item | Flag / Mechanism | Label in UI |
|----|------|------|------------------|-------------|
| SD-001–SD-015 | All artifacts | Seeded business metrics, signals, vessel positions, broker CRM, advisory sessions | `APP_MODE=demo` or idempotent seed | `DataStateBadge` shows "Demo" / `AppModeBanner` |
| HC-001 | SZL Holdings | Autopilot header genome score | Static value | Labeled as illustrative |
| HC-004 | Command | Domain health scores | Seeded | Acceptable — clearly shown as composite |
| PL-006 | Pulse | Live AI briefing (partial grounding) | `DEMO_MODE` path | Demo token PIN-gated |
| PL-007 | Pulse | PDF export | Not implemented | Nav item removed from production build |
| PL-008 | Pulse | Email subscription | Not implemented | Nav item removed from production build |
| PL-001–002 | Aegis | CISO dashboard KPI aggregation | Seeded | Demo data banner |
| PL-003–005 | Vessels | Insurance / trading / platform modules | Feature-flagged | Not surfaced in production nav |
| ST-001 | Billing | Stripe test mode | `live_stripe_billing_enabled=false` | No billing UI without flag |
| ST-002 | Email | Resend delivery | `live_email_delivery_enabled=false` | Silently dropped with log |
| ST-003 | Maps | Mapbox tiles | `live_mapbox_tiles_enabled=false` | Map placeholder shown |
| ST-004 | Vessels | Live AIS positions | `live_ais_feed_enabled=false` | Seeded positions; demo banner |
| ST-013–014 | Integrations | HubSpot / Salesforce CRM | No credentials | `testConnection()` returns graceful error |

---

## What Was Removed (Dead UI)

The following items were removed from the 14 registered audit-scope artifacts:

| Item | Location | Reason |
|------|----------|--------|
| `/metrics.tsx` — orphaned analytics page | `szl-holdings` | Hardcoded fake analytics data; not routed in App.tsx |
| `/newsroom.tsx` — orphaned press releases | `szl-holdings` | Fake press releases; not routed |
| Hardcoded fake recommendations in Lyte dashboard | `lyte-command-center` | Replaced with live `/api/lyte/recommendations` query |
| Hardcoded fake correlations in Lyte dashboard | `lyte-command-center` | Replaced with `dashboardData?.correlations` |

### Carryover Cleanup (Out-of-Scope Artifacts)

The following items were cleaned up in archived or internal-only artifacts that are **not** part of the 14 registered audit-scope products. They are recorded here for completeness:

| Item | Location | Reason |
|------|----------|--------|
| Fake testimonials | `stephen-site` (archived marketing site) | Removed fabricated names/roles; not a registered product artifact |
| Fake suppression counts | `firestorm` (internal tooling, not registered) | Replaced with dynamic suppression rule counts; not a customer-facing surface |

---

## Open Gaps — Priority Ranking

See `docs/audit/GAP_MATRIX.md` for full register. Summary of blocking items:

| ID | Priority | Finding | Acceptance Test |
|----|----------|---------|-----------------|
| P1-001 | HIGH | Stripe live keys not configured; no real revenue possible | Purchase completes against live Stripe; webhook fires |
| P1-002 | HIGH | Email delivery silently dropped; `RESEND_API_KEY` missing | Carlota Jo booking confirmation arrives within 60s |
| P1-003 | HIGH | OTEL + Sentry not wired to production collector | Error appears in Sentry within 30s; OTEL traces exported |
| P1-004 | HIGH | Mapbox token missing; Terra and CORTEX maps blank | Terra distress map renders NYC tiles with distress markers |
| P1-005 | HIGH | AIS live positions not active; Vessels uses simulated data | Fleet dashboard shows real lat/lon change within 5 min |
| P1-007 | HIGH | MFA not implemented on sensitive surfaces | Investor data room requires MFA on second sign-in |
| P0-001 | HIGH | Firebase credential files are placeholders in mobile app | Mobile build completes with rotated credentials |
| GAP-016 | HIGH | `ALLOY_INTERNAL_TOKEN` grants super_admin; no scoping | Token can only access declared scopes |
| GAP-017 | HIGH | No persistent message queue; background tasks lost on restart | Background jobs survive API server restart |

---

## Auth & RBAC Assessment

| Surface | Auth | Session | RBAC | MFA | Assessment |
|---------|------|---------|------|-----|------------|
| All web artifacts | OIDC ✅ | PostgreSQL sessions ✅ | Role-checked ✅ | ❌ Not implemented | Acceptable pre-revenue; MFA required before investor data room goes live |
| Investor data room | OIDC ✅ | ✅ | Owner/member ✅ | ❌ | Block: must add MFA (P1-007) |
| Counsel approvals | OIDC ✅ | ✅ | Approver role ✅ | ❌ | Acceptable for now |
| Aegis SOC actions | OIDC ✅ | ✅ | SOC analyst role ✅ | ❌ | Acceptable for now |
| Admin routes | OIDC + admin role ✅ | ✅ | ✅ | ❌ | Acceptable for internal use |
| API Server public routes | Public allowlist ✅ | N/A | N/A | N/A | Public paths explicitly allowlisted |
| Seed / demo reset routes | `seedProductionGuard` ✅ | N/A | N/A | N/A | 404 in production |

No local/dev-only login bypasses found in production builds. `APP_MODE=demo` bypasses are only active when `APP_MODE=demo` is explicitly set (not the default).

---

## Secrets & Config Audit

Audit grep performed across all artifact source files for hardcoded tokens, account IDs, passwords, and API keys.

**Result: Zero hardcoded credentials found.**

All integration credentials are sourced via environment variables and the Replit secrets system. See `docs/audit/ENV_AND_SECRETS_REGISTER.md` for the full canonical list of required environment variables.

**Required secrets for full production activation (not currently set):**

| Secret | Artifact | Activates |
|--------|----------|-----------|
| `STRIPE_SECRET_KEY` (sk_live_) | API Server | Live billing |
| `STRIPE_WEBHOOK_SECRET` | API Server | Stripe webhooks |
| `RESEND_API_KEY` | API Server | Email delivery |
| `MAPBOX_ACCESS_TOKEN` | Terra, CORTEX mobile | Map tile rendering |
| `VITE_MAPBOX_TOKEN` | Terra frontend | Vite-side Mapbox |
| `AIS_API_KEY` | API Server | Live AIS vessel positions |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | API Server | OTEL telemetry export |
| `SENTRY_DSN` | API Server + all web apps | Error monitoring |
| `ALLOY_INTERNAL_TOKEN` | Internal services | Service-to-service auth (scope needs restriction) |

---

## NEXUS / Mockup Sandbox Production Routing

NEXUS (`artifacts/mockup-sandbox`) is confirmed dev-only. Its preview path `/nexus/` is registered in the artifacts manifest but is not linked from any customer-facing navigation. Its purpose is documented as a design system component preview server for internal engineering use. No action required.

---

## SZL Demo Video

The demo video (`artifacts/szl-demo-video`) is a pre-rendered reel built against earlier UI states. It should be re-rendered once the UI hardening in this sweep is complete. This is tracked as a follow-up action.

---

## Production Readiness Scorecard

| Category | Score | Rationale |
|----------|-------|-----------|
| Auth completeness | 9/10 | OIDC everywhere; MFA missing on sensitive surfaces |
| Tenant isolation | 9/10 | All Vessels + Command routes scoped; audit confirms no cross-tenant leaks |
| Data accuracy | 7/10 | Core routes real; 28% seeded (acceptable pre-revenue) |
| Secrets hygiene | 10/10 | Zero hardcoded credentials |
| Error handling | 8/10 | SectionErrorBoundary sanitized; OTEL not wired to collector |
| Demo stability | 9/10 | AppModeBanner everywhere; seed-guard blocks prod seed |
| Revenue readiness | 4/10 | Stripe test mode; email dropped; MFA missing |
| Integration depth | 5/10 | 5 P1 integrations inactive (AIS, Stripe, email, Mapbox, OTEL) |

**Overall:** Demo-ready. Pre-revenue. Not GA for paying customers until P1 gaps closed.

---

*See also: `docs/audit/inventory.md` (route-level detail), `docs/audit/GAP_MATRIX.md` (open gaps), `docs/ops/gap-register.md` (P0–P2 register)*

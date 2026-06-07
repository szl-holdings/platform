# Known Limitations — SZL Holdings Platform

**Date:** April 18, 2026  
**Status:** Pre-commercial; intentional limitations documented here are accepted for Series A  
**Maintained by:** Platform Engineering  
**Reviewed by:** Founder

---

## How to Use This Document

This register exists so investors, partners, and engineers have a single honest source of truth about what the platform does **not** do yet. Each limitation is:
- **Scoped** — the exact boundary of the limitation
- **Acceptable?** — whether it is acceptable for Series A / investor demo
- **Resolution** — known path to close it

---

## 1. Architecture

### L-001 — Single-Process Backend
**Scope:** All 8 domains run in a single Express process (`artifacts/api-server`). No microservice isolation.  
**Risk:** One crashing domain can bring down the API for all domains. CPU-heavy AI inference blocks other requests.  
**Acceptable for Series A?** Yes — single-tenant, controlled demos.  
**Resolution:** Domain-level process isolation (Phase 3). Estimated 6 months.

### L-002 — No Persistent Message Queue
**Scope:** Background tasks (AI inference, notifications, email delivery) run in-process. Tasks are lost if the server restarts mid-execution.  
**Risk:** Lost AI results, missed notifications.  
**Acceptable for Series A?** Yes for demos. Must fix before first paying tenant.  
**Resolution:** Add Redis + BullMQ or similar. 2–4 weeks work.

### L-003 — In-Process AI Inference (No Dedicated Worker Pool)
**Scope:** OpenAI/Anthropic calls are made directly from the main Express process. No dedicated worker thread pool.  
**Risk:** Latency spikes for other users during large AI completions.  
**Acceptable for Series A?** Yes.  
**Resolution:** Move AI calls to worker threads or separate queue workers.

---

## 2. Data

### L-004 — No Live AIS Feed for Maritime
**Scope:** Vessels module uses simulated AIS positions from seed data. Real vessel positions require an active subscription (MarineTraffic, Spire, or AISHub — $15k–$40k/year).  
**Risk:** Map shows demo vessels, not real ships.  
**Acceptable for Series A demo?** Yes — clearly labeled "Demo". Must disclose to partners.  
**Resolution:** AIS vendor contract (business decision, not engineering).

### L-005 — Map Views Blank Without Mapbox Token
**Scope:** Vessels tracking map and Terra map views render empty when `MAPBOX_ACCESS_TOKEN` is not set.  
**Risk:** Live demos show blank maps — visually jarring.  
**Acceptable for demos?** **No — this is a demo blocker (GAP-011).**  
**Resolution:** Configure `MAPBOX_ACCESS_TOKEN` in Replit Secrets. Low cost (free tier covers demo volume).

### L-006 — Seeded (Not Live) Portfolio Data
**Scope:** Revenue metrics, pipeline values, headcount, deal values are all seeded demo data — not connected to live accounting or CRM systems.  
**Risk:** Numbers are plausible but not real.  
**Acceptable for Series A?** Yes — clearly labeled "Demo" / "Illustrative". All investors expect pre-commercial data.  
**Resolution:** CRM/accounting integration post-revenue.

### L-007 — Financial Figures Require Founder Confirmation
**Scope:** Funding figures ($2.4M seed, $14.5M Series A target) and Annual Letter metrics ($180M+ deployed capital) in szl-holdings content require founder sign-off before broad publication.  
**Risk:** Incorrect numbers in investor-facing materials.  
**Acceptable?** Yes if founder has reviewed and approved.  
**Resolution:** Founder review checkpoint before Series A external share.

---

## 3. Security

### L-008 — ALLOY_INTERNAL_TOKEN Has Super-Admin Scope
**Scope:** The service-to-service token grants full `super_admin` privileges. No granular scope limiting.  
**Risk:** Token compromise = full platform access.  
**Acceptable for Series A?** Borderline. Acceptable only because the platform has no external-facing production load yet.  
**Resolution:** Implement token scoping and rotation policy. 1–2 weeks work.

### L-009 — No SAST in CI Pipeline
**Scope:** No automated static analysis security testing (OWASP, CodeQL).  
**Risk:** Security vulnerabilities not caught before merge.  
**Acceptable for Series A?** Yes with manual review.  
**Resolution:** Add ESLint security rules + CodeQL to CI. 1 week.

### L-010 — Sentry Mobile Not Configured
**Scope:** Expo mobile app (`szl-holdings-mobile`) does not yet have `EXPO_PUBLIC_SENTRY_DSN` configured.  
**Risk:** Mobile crashes unmonitored.  
**Acceptable for Series A?** Yes — mobile is beta.  
**Resolution:** Follow-up task #1753.

---

## 4. Billing / Revenue

### L-011 — Stripe in Test Mode
**Scope:** Billing routes use test keys. No real charges processed.  
**Risk:** No revenue collection capability.  
**Acceptable for Series A?** Yes — pre-revenue.  
**Resolution:** Configure live Stripe keys before first charge.

### L-012 — No Subscription Management UI
**Scope:** Stripe integration handles webhooks and plan management in the API but there is no self-service subscription management UI for customers.  
**Acceptable for Series A?** Yes.  
**Resolution:** Build customer billing portal (Stripe hosted portal or custom) before self-serve launch.

---

## 5. Features / Products

### L-013 — Pulse Is Not AI-Live
**Scope:** Pulse AI Executive Briefing shows static demo content. The AI-generated morning briefing is not yet wired to an actual model call.  
**Risk:** Feature showcased as "AI-generated" is actually static.  
**Acceptable for demos?** Yes with clear "Demo" labeling.  
**Resolution:** Wire Pulse to `/api/pulse/generate` — 1–2 weeks work.

### L-014 — Aegis New Security Modules (8) Are Not Connected
**Scope:** 8 new Aegis security modules have complete UIs but no back-end wiring.  
**Acceptable for demos?** Acceptable if presenter avoids drilling into those specific modules.  
**Resolution:** Backend wiring sprint. 2–4 weeks.

### L-015 — Vessels Commercial Modules (3) Are Not Connected
**Scope:** Insurance, Trading, and Platform modules have UIs but no DB/API connection.  
**Acceptable for demos?** Same as above.  
**Resolution:** Backend sprint. 2–4 weeks.

### L-016 — No Real Email Delivery
**Scope:** Resend API key not configured. All transactional emails are silently dropped.  
**Risk:** Sign-up confirmations, approval notifications, demo requests not delivered.  
**Acceptable for Series A?** Yes for demos. Must fix before customer contact forms are live.  
**Resolution:** Configure `RESEND_API_KEY`.

---

## 6. Testing

### L-017 — Low Unit Test Coverage (~16%)
**Scope:** 27 test files against 173 API route files. Mutation paths have minimal coverage.  
**Risk:** Regressions in untested paths.  
**Acceptable for Series A?** Yes with careful change management.  
**Resolution:** Test coverage sprint in Q2/Q3 2026.

---

## 7. Browser / Device Compatibility

### L-018 — Playwright Tests Only Target Chromium
**Scope:** All E2E tests use Chromium. Firefox and Safari untested.  
**Acceptable for demos?** Yes.  
**Resolution:** Expand Playwright matrix.

### L-019 — Mobile (Expo) Has No Automated E2E
**Scope:** Mobile CORTEX command has no automated tests.  
**Acceptable for beta?** Yes.  
**Resolution:** Detox or Maestro setup in Q3 2026.

---

## Summary Table

| ID | Limitation | Demo Blocker | Ship Blocker | Resolution Effort |
|----|-----------|-------------|-------------|------------------|
| L-001 | Single-process backend | No | No | Large |
| L-002 | No persistent job queue | No | Yes | Medium |
| L-003 | No AI worker pool | No | No | Medium |
| L-004 | No live AIS feed | No (labeled) | No | External contract |
| **L-005** | **Map views blank** | **Yes** | No | **Tiny (configure secret)** |
| L-006 | Seeded portfolio data | No (labeled) | No | Post-revenue |
| L-007 | Financial figures unconfirmed | No | No | Founder review |
| L-008 | Super-admin token scope | No | Yes | Small |
| L-009 | No SAST in CI | No | No | Small |
| L-010 | No mobile Sentry | No | No | Tiny |
| L-011 | Stripe in test mode | No | Yes | Tiny (configure secret) |
| L-012 | No subscription UI | No | No | Medium |
| L-013 | Pulse not AI-live | No (labeled) | No | Small |
| L-014 | Aegis 8 modules unwired | No (avoidable) | No | Medium |
| L-015 | Vessels 3 modules unwired | No (avoidable) | No | Medium |
| L-016 | No email delivery | No | Yes | Tiny (configure secret) |
| L-017 | 16% test coverage | No | No | Large |
| L-018 | Chromium-only E2E | No | No | Small |
| L-019 | No mobile E2E | No | No | Medium |

---

*See also: `docs/audit/GAP_MATRIX.md`, `docs/audit/MOCK_AND_STUB_REGISTER.md`*

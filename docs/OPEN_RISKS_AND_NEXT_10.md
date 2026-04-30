# SZL Holdings — Open Risks and Next 10 Priorities

**Date:** April 2026
**Context:** Post Series A Cleanup (Phases 1–4). This document captures the remaining open risks and the 10 highest-impact priorities for the next engineering and business phase.

---

## Open Risks

### Risk 1: Production CORS Configuration Not Set

**Classification:** Blocking
**Severity:** High
**Description:** `CORS_ORIGINS` is not configured for production. Without this, cross-origin requests from production domains will fail or be overly permissive.
**Mitigation:** Set `CORS_ORIGINS` to all production domains before any enterprise customer goes live. Configuration change, not an engineering task — but must happen before first deploy.
**Owner:** Engineering / Founder
**Timeline:** Before production deploy

---

### Risk 2: No Distributed Tracing

**Classification:** Operational
**Severity:** Medium
**Description:** The observability specification is complete, but OTel instrumentation is not implemented. When production issues occur, diagnosis relies on Pino logs — no distributed traces, no correlation across service boundaries.
**Mitigation:** Implement Priority 1 OTel instrumentation from `docs/OBSERVABILITY_SPEC.md`. Start with API server and Alloy workflow engine.
**Owner:** Engineering (post-Series A hire: DevOps engineer)
**Timeline:** Q3 2026

---

### Risk 3: Stripe Not in Live Mode

**Classification:** Revenue
**Severity:** Medium
**Description:** Billing infrastructure is built. Stripe is in demo mode. No revenue can be collected until live keys are configured.
**Mitigation:** Configure `STRIPE_SECRET_KEY` (live) and `STRIPE_WEBHOOK_SECRET`. Test billing flow end-to-end. This is hours of work, not weeks.
**Owner:** Founder
**Timeline:** Before first paying customer

---

### Risk 4: Single Point of Failure — Founder as Sole Engineer

**Classification:** Team / Operational
**Severity:** High (pre-Series A); Medium (post-hire)
**Description:** All code knowledge, architectural decisions, and operational procedures currently reside with the founder. There is no bus factor redundancy.
**Mitigation:** Series A engineering hires (3–5 engineers). Architecture specification docs produced in this phase reduce the knowledge transfer risk. Decision Ledger and architecture docs make the system legible to incoming engineers.
**Owner:** Founder
**Timeline:** Series A close → immediate hiring

---

### Risk 5: Vessels Commercial Modules Not Wired to Live Database

**Classification:** Product
**Severity:** Medium
**Description:** Vessels commercial modules (charter management, freight benchmarking) have UI and route structure but are not connected to live database.
**Mitigation:** Wire commercial modules to live DB. Existing task in backlog.
**Owner:** Engineering
**Timeline:** Q3 2026

---

### Risk 6: Counsel Recovery Table Seed Script Broken

**Classification:** Product / Demo
**Severity:** Low-Medium
**Description:** Seed scripts for Counsel recovery tables are broken. Recovery module not usable without seed repair.
**Mitigation:** Fix seed script. Existing task in backlog.
**Owner:** Engineering
**Timeline:** Next sprint

---

### Risk 7: Agent Eval Infrastructure Not Implemented

**Classification:** AI Governance
**Severity:** Medium
**Description:** The agent eval spec is complete, but the eval runner, eval dataset store, and model promotion gate are not implemented. Agent governance is documented but not automated.
**Mitigation:** Implement eval infrastructure per `docs/AGENT_EVAL_AND_REPLAY.md`. Priority for Series A engineering team.
**Owner:** Engineering (post-Series A)
**Timeline:** Q3 2026

---

### Risk 8: No Error Monitoring in Production

**Classification:** Operational
**Severity:** Medium
**Description:** Sentry DSN not configured. Production errors surface in logs only. Silent failures in background jobs or AI inference may not be detected promptly.
**Mitigation:** Configure Sentry for both frontend and backend. Hours of setup work.
**Owner:** Engineering / Founder
**Timeline:** Before production deploy

---

### Risk 9: CORTEX Mobile Splash Screen and Icon Not Finalized

**Classification:** Brand / Product
**Severity:** Low
**Description:** CORTEX mobile app does not have a finalized custom splash screen and icon aligned with the SZL Holdings brand.
**Mitigation:** Design and implement splash screen and icon per platform brand guidelines.
**Owner:** Design / Engineering
**Timeline:** Before CORTEX public beta

---

### Risk 10: No Automated CI for Integration Tests

**Classification:** Engineering Quality
**Severity:** Medium
**Description:** Integration tests exist but do not run automatically on code changes. Regressions can be introduced without detection until manual testing.
**Mitigation:** Add CI step to run integration tests on every merge. Existing task in backlog.
**Owner:** Engineering
**Timeline:** Q3 2026

---

## The Next 10 Priorities

Listed in priority order — highest impact per unit of effort first.

---

### Priority 1: Configure CORS_ORIGINS and Deploy to Production

**Why:** Blocking. No enterprise customer can go live without this.
**Effort:** 1–2 hours
**Owner:** Founder
**Files:** `artifacts/api-server/src/index.ts`, Replit Secrets

---

### Priority 2: Configure Sentry Error Monitoring

**Why:** Before serving any production traffic, errors must be tracked with full context — not just in logs.
**Effort:** 2–4 hours
**Owner:** Founder / first DevOps hire
**Files:** `artifacts/api-server/src/index.ts`, `artifacts/*/src/main.tsx`

---

### Priority 3: Activate Stripe Live Mode

**Why:** First step toward revenue. Infrastructure is already built.
**Effort:** 2–4 hours
**Owner:** Founder
**Files:** Replit Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)

---

### Priority 4: Fix Counsel Recovery Table Seed Script

**Why:** Relatively small effort; blocks a meaningful demo surface.
**Effort:** 2–4 hours
**Owner:** Engineering
**Files:** Counsel seed scripts

---

### Priority 5: Wire Vessels Commercial Modules to Live Database

**Why:** Vessels is a high-value demo surface; commercial modules incomplete reduces investor credibility.
**Effort:** 1–2 days
**Owner:** Engineering
**Files:** `artifacts/vessels/src/`, `artifacts/api-server/src/routes/vessels/`

---

### Priority 6: Finalize CORTEX Splash Screen and Icon

**Why:** Brand consistency matters for the mobile demo in investor meetings.
**Effort:** 1 day (design) + 2 hours (implementation)
**Owner:** Design + Engineering
**Files:** `artifacts/szl-holdings-mobile/assets/`

---

### Priority 7: Wire CORTEX Deep Linking for Push Notifications

**Why:** Push notifications without deep linking to the correct workspace degrade the mobile experience significantly.
**Effort:** 1–2 days
**Owner:** Engineering
**Files:** `artifacts/szl-holdings-mobile/` — existing task in backlog

---

### Priority 8: Implement OTel Instrumentation (Priority 1 Routes)

**Why:** Distributed tracing is essential for diagnosing production issues at enterprise scale.
**Effort:** 1–2 weeks
**Owner:** DevOps engineer (Series A hire)
**Files:** `artifacts/api-server/src/`, `lib/workflow-engine/`
**Reference:** `docs/OBSERVABILITY_SPEC.md` — Priority 1 instrumentation section

---

### Priority 9: Build Agent Eval Infrastructure

**Why:** Agent governance is documented but not automated. A promotion gate is only as good as its enforcement.
**Effort:** 2–4 weeks
**Owner:** Engineering (Series A hire)
**Files:** `lib/pulse-evals/`, `lib/ai-engine/`
**Reference:** `docs/AGENT_EVAL_AND_REPLAY.md`

---

### Priority 10: Add CI Step for Integration Tests on Every Merge

**Why:** Manual testing is not scalable. Automated integration tests protect against regressions as the team grows.
**Effort:** 1–3 days
**Owner:** DevOps engineer (Series A hire)
**Reference:** Existing task in backlog

---

## Summary: Open Risk vs. Priority Matrix

| Item | Risk Level | Effort | Priority |
|---|---|---|---|
| Configure CORS_ORIGINS | Blocking | Hours | P1 |
| Configure Sentry | High | Hours | P1 |
| Stripe live mode | Revenue | Hours | P1 |
| Counsel seed fix | Medium | Hours | P2 |
| Vessels commercial modules | Medium | Days | P2 |
| CORTEX splash/icon | Low | Day | P2 |
| CORTEX deep linking | Medium | Days | P2 |
| OTel instrumentation | Medium | Weeks | P3 |
| Agent eval infrastructure | Medium | Weeks | P3 |
| CI integration tests | Medium | Days | P3 |

---

*This document should be reviewed and updated at the start of each quarter and after each significant product milestone.*

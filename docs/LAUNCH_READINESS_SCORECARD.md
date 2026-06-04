# SZL Holdings — Launch Readiness Scorecard

**Purpose:** Scored assessment across 8 dimensions with before/after ratings, reflecting the platform's current state and what has been accomplished in the Series A cleanup phases.

**As of:** April 2026 (Series A Cleanup — Phases 1–4)
**Scoring:** 1–5 scale. 1 = not started, 3 = functional/credible, 5 = production-ready/investor-grade

---

## Summary

| Dimension | Before (Q4 2025) | After (Q2 2026) | Delta |
|---|---|---|---|
| 1. Runtime Coherence | 2 | 4 | +2 |
| 2. Security Posture | 2 | 4 | +2 |
| 3. Release Readiness | 2 | 3.5 | +1.5 |
| 4. Product Clarity | 2 | 4.5 | +2.5 |
| 5. Observability | 1.5 | 3 | +1.5 |
| 6. Agent Trust | 2 | 4 | +2 |
| 7. Demo Credibility | 2.5 | 4 | +1.5 |
| 8. Investor Diligence | 2 | 4.5 | +2.5 |
| **Overall** | **2.0** | **3.9** | **+1.9** |

---

## Dimension 1: Runtime Coherence

**Definition:** Does the platform run consistently, without crashes, mock/real data mixing, or route clutter?

| Before | Score | After | Score |
|---|---|---|---|
| Multiple route conflicts; mock data in production paths; inconsistent nav hierarchy | 2 | All audits passing (routes, mocks, copy, design system); quality scripts in CI-ready state; navigation hierarchy documented and aligned | 4 |

**Remaining gaps:**
- Some CORTEX mobile screens not yet wired to live data (Beta-appropriate; labeled)
- Vessels commercial modules pending live DB connection
- Prism Counsel recovery table seed broken

**Target for GA:** 5

---

## Dimension 2: Security Posture

**Definition:** Are routes protected, secrets managed, audit trails active, and sensitive operations governed?

| Before | Score | After | Score |
|---|---|---|---|
| Auth implemented; some routes unprotected; no Zod validation on high-traffic paths | 2 | OIDC auth throughout; RBAC middleware on admin routes; immutable proof chain; Zod validation on critical paths; CSRF + Helmet.js; rate limiting on write endpoints | 4 |

**Remaining gaps:**
- CORS_ORIGINS not configured for production
- Sentry error monitoring not configured
- Penetration testing not completed
- Zod validation missing on some non-critical routes

**Target for GA:** 5

---

## Dimension 3: Release Readiness

**Definition:** Can the platform be deployed reliably, with documented rollback, canary, and incident procedures?

| Before | Score | After | Score |
|---|---|---|---|
| No documented rollback plan; no on-call model; no canary strategy | 2 | Production readiness checklist complete; rollback procedures documented; on-call model defined; canary deployment plan written; environment separation documented | 3.5 |

**Remaining gaps:**
- Canary deployment not yet implemented (plan exists, implementation pending)
- No automated CI for integration tests
- Error monitoring (Sentry) not configured

**Target for GA:** 4.5

---

## Dimension 4: Product Clarity

**Definition:** Is the platform message clear? Is navigation coherent? Are status labels accurate?

| Before | Score | After | Score |
|---|---|---|---|
| Overlapping claims; inconsistent naming; no explicit status labels; CORTEX treated as parallel brand | 2 | Platform message architecture documented; GA/Beta/Internal/Archived register complete; navigation hierarchy standardized; CORTEX narrative aligned with platform thesis; product mode positioning docs complete | 4.5 |

**Remaining gaps:**
- Some UI surfaces still show generic placeholder copy (Beta-appropriate)
- CORTEX splash screen and icon not finalized

**Target for GA:** 5

---

## Dimension 5: Observability

**Definition:** Does the platform produce useful telemetry? Can issues be diagnosed quickly?

| Before | Score | After | Score |
|---|---|---|---|
| Pino logging only; no distributed tracing; no SLO definitions; no alerting strategy | 1.5 | OpenTelemetry-aligned observability spec complete; event schema documented; SLOs defined; alerting strategy documented; health check endpoint comprehensive | 3 |

**Remaining gaps:**
- OTel instrumentation not yet implemented (spec exists)
- No distributed trace collector configured
- SLO dashboard not built
- Alert rules not yet deployed

**Target for GA:** 4.5

---

## Dimension 6: Agent Trust

**Definition:** Are AI agents explainable, evaluable, and governed? Can a customer trust an agent output?

| Before | Score | After | Score |
|---|---|---|---|
| AI outputs present; no eval framework; no replay; no version comparison; no correctness checks | 2 | Agent eval and replay spec complete; correctness dimensions defined; promotion gate documented; Decision Ledger captures agent actor attribution; proof chain records agent-initiated actions | 4 |

**Remaining gaps:**
- Eval infrastructure not yet implemented (spec exists)
- Replay runner not yet built
- Model promotion gate not yet automated

**Target for GA:** 4.5

---

## Dimension 7: Demo Credibility

**Definition:** Can the platform be demonstrated to investors and enterprise buyers without significant disclaimers?

| Before | Score | After | Score |
|---|---|---|---|
| Functional demo possible but requires heavy framing; some inconsistent data states; no demo script | 2.5 | Executive demo script complete; recommended demo order documented; status labels applied; demo-safe assessment complete for every surface; investor walkthrough guide updated | 4 |

**Remaining gaps:**
- Live AIS data not connected (labeled appropriately)
- Some security modules showing placeholder state
- Stripe not in live mode

**Target for GA:** 4.5

---

## Dimension 8: Investor Diligence

**Definition:** Can the platform withstand investor technical due diligence? Is the data room complete?

| Before | Score | After | Score |
|---|---|---|---|
| Investor narrative exists; no technical due diligence packet; no scorecard; architecture not formally documented | 2 | Technical due diligence packet complete; launch readiness scorecard complete; state model, decision ledger, observability spec, event schema, SLOs all documented; platform message architecture and product positioning docs complete | 4.5 |

**Remaining gaps:**
- SOC 2 Type II not yet in progress
- Financial projections not in this repo (offline)
- Cap table and legal structure not in this repo (offline)

**Target for GA:** 5

---

## Path to GA

To achieve overall GA readiness (score ≥ 4.5):

| Priority | Action | Dimension(s) | Effort |
|---|---|---|---|
| P0 | Configure CORS_ORIGINS and deploy to production | Security, Release | Hours |
| P0 | Activate Stripe live mode | Demo Credibility | Hours |
| P1 | Implement OTel instrumentation on API + Alloy | Observability | Weeks |
| P1 | Build eval infrastructure and replay runner | Agent Trust | Weeks |
| P1 | Configure Sentry error monitoring | Security, Release | Hours |
| P2 | Fix Prism Counsel seed script | Runtime Coherence | Hours |
| P2 | Wire Vessels commercial modules to live DB | Runtime Coherence | Days |
| P2 | Finalize CORTEX splash screen and icon | Product Clarity | Days |
| P3 | SOC 2 Type II readiness track | Security | Months |

---

*This scorecard is updated after each Phase completion. The next update should follow implementation of P0 and P1 priorities above.*

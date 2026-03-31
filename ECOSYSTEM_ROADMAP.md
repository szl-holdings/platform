# SZL Ecosystem Roadmap — P1-P4 Ranked
*Generated: March 31, 2026 · Task #170 Operationalization Pass*

---

## Ecosystem Audit Summary

### Consolidation Decisions

| Pair | Decision | Rationale |
|------|----------|-----------|
| **Lyte vs Terra** | **Keep separate** | Lyte = execution accountability command center (cross-domain); Terra = real estate intelligence vertical (NYC market). Different buyers, different jobs. |
| **Firestorm vs MSP/Rosie** | **Keep separate** | Firestorm = adversarial security SOC/XDR (cybersecurity buyers); Rosie = MSP management platform (MSP operators). Firestorm can be an add-on to Rosie for security-forward MSPs but they are not the same product. |
| **Alloy vs Dreamscape/Nimbus** | **Keep separate** | Alloy = execution fabric infrastructure; Dreamscape = creative media studio; Nimbus = AI orchestration engine behind Dreamscape. Alloy is the backbone, Dreamscape is a vertical application built on it. |
| **Stephen site vs SZL Holdings** | **Fold Stephen site into supporting role** | SZL Holdings already has a /founder page. Stephen site serves as personal/career/CTO-for-hire profile. Keep both but ensure clear delineation: SZL = holding co investor story; Stephen site = founder identity/consulting persona. No duplication needed. |

---

## P1 — Must Fix for Credibility and Demos

### P1.1 — Data State Clarity (All Apps)
**Why it matters:** Every dashboard currently shows demo/seeded data without explicit labels. Investors and prospects cannot tell what is real vs simulated. Kills credibility on first demo.
**Affected apps:** All 10 product apps
**Complexity:** Low
**Status:** IMPLEMENTED (DataStateBadge + DataStateBanner in shared-ui; deployed to Lyte Command Inbox, Alloy Execution Runs)
**Remaining:** Apply to Firestorm SOC dashboard, INCA dashboard, Terra distress engine, Vessels fleet map, MSP client dashboard, Dreamscape campaign view

### P1.2 — MSP/Rosie Pricing Page (Commercial Readiness)
**Why it matters:** No pricing means no commercial signal. Prospects cannot self-qualify.
**Affected apps:** MSP/Rosie
**Complexity:** Low
**Status:** IMPLEMENTED — 3-tier pricing (Starter $249/mo, Professional $699/mo, Enterprise custom) added to landing page

### P1.3 — Vessels Marketing Security Page
**Why it matters:** Maritime intelligence involves commercially sensitive data. Prospects need to see security posture before evaluating.
**Affected apps:** Vessels
**Complexity:** Low
**Status:** Already exists at /security

### P1.4 — ErrorBoundary Coverage (All Apps)
**Why it matters:** Without error boundaries, any uncaught error crashes the entire app in production — destroys demo trust.
**Affected apps:** All
**Complexity:** Low
**Status:** CONFIRMED COMPLETE — all 10 apps have ErrorBoundary in main.tsx

### P1.5 — INCA Security Page
**Why it matters:** AI research platform handling sensitive intelligence data needs visible security posture.
**Affected apps:** INCA
**Complexity:** Low
**Status:** CONFIRMED EXISTS at /security

### P1.6 — Dreamscape AppName Fix
**Why it matters:** Dreamscape was identified as "Alloy Predictive Intelligence" in error boundary — wrong brand name shown to users on crashes.
**Affected apps:** Dreamscape
**Complexity:** Trivial
**Status:** IMPLEMENTED — fixed to "Dreamscape Creative Intelligence"

### P1.7 — Auth Route Guards (All Private Apps)
**Why it matters:** Dashboard routes without auth guards allow unauthenticated users to reach private surfaces.
**Affected apps:** All product dashboards
**Complexity:** Low
**Status:** PrivateAppGuard exists in shared-ui. Verify it wraps all private routers. Lyte, Alloy confirmed using auth guard patterns. Needs audit on Terra, Firestorm, INCA.

---

## P2 — Must Fix for Production or Pilots

### P2.1 — Seed Data Realism Labels (All Apps)
**Why it matters:** Seeded data that looks real without labels creates false expectations in pilots. Client pilots need clear data provenance.
**Affected apps:** Lyte (business-data.ts), MSP (msp-mock.ts), Terra (distress.ts), Vessels (mock-data.ts), INCA (seed-data.ts)
**Complexity:** Low
**Recommended action:** Add DataStateBanner to each dashboard landing page when not connected to live data. Hook into a `VITE_DATA_MODE=demo|live|pilot` env var.

### P2.2 — Contact/Lead Capture Hardening (SZL Holdings, Vessels, Carlota Jo)
**Why it matters:** Inquiry forms are the commercial conversion point. Broken or mocked form submissions lose leads.
**Affected apps:** SZL Holdings (InquiryForm), Vessels (demo request), Carlota Jo (contact, booking)
**Complexity:** Medium
**Recommended action:** Verify all forms POST to /api/holdings/inquiries or equivalent. Add confirmation email flow. Add form validation feedback. Check Carlota Jo booking flow connects to booking API.

### P2.3 — Role-Based Demo States (Vessels, Lyte, INCA)
**Why it matters:** Different personas need different views. Without role switching in demos, the platform looks one-dimensional.
**Affected apps:** Vessels (has exec/ops/compliance tabs — good), Lyte (has DemoModeSwitcher — good), INCA (needs role views)
**Complexity:** Medium
**Status:** Vessels and Lyte are ahead. INCA lacks role-based demo switching.

### P2.4 — Audit Trail UI Depth (Alloy, Lyte)
**Why it matters:** Enterprise buyers need to see audit trail before procurement. Thin or empty audit logs undermine trust.
**Affected apps:** Alloy (governance-audit.tsx has real API integration), Lyte (admin/audit-log.tsx has API integration)
**Complexity:** Medium
**Recommended action:** Ensure audit log seed data populates with realistic entries. Add export to CSV. Add actor/action/resource filters.

### P2.5 — API Error Handling Standardization
**Why it matters:** Inconsistent error responses break frontend error handling and make debugging hard in production.
**Affected apps:** API server
**Complexity:** Medium
**Recommended action:** Standardize all API responses to `{ data, error, meta }` shape. Add request validation middleware (zod) to all mutation routes. Return structured errors with error codes.

### P2.6 — Rate Limiting Verification
**Why it matters:** API endpoints without proper rate limiting are vulnerable to abuse and DoS. Critical before any public exposure.
**Affected apps:** API server
**Complexity:** Low
**Status:** Rate limiters exist (authLimiter, readLimiter, writeLimiter). Verify all sensitive routes are covered.

### P2.7 — Terra Real Estate Data Realism
**Why it matters:** Property addresses, ownership records, and distress data look clearly fake on close inspection. Breaks credibility with real estate professionals.
**Affected apps:** Terra
**Complexity:** Medium
**Recommended action:** Improve seed data in distress.ts with more realistic NYC property data (actual boroughs, realistic addresses, valid property types). Add data timestamp freshness indicators.

---

## P3 — High-Value Enhancements

### P3.1 — Firestorm vs MSP Integration Story
**Why it matters:** MSPs managing security-forward clients would naturally want Firestorm SOC capabilities. The connection is not evident.
**Affected apps:** MSP/Rosie, Firestorm
**Complexity:** Medium
**Recommended action:** Add "Firestorm SOC" as an add-on tier on MSP pricing page. Add cross-navigation between MSP security events and Firestorm incidents.

### P3.2 — Lightweight Audit Trail for All Apps
**Why it matters:** Every app should show "what happened last" at minimum. Currently only Alloy and Lyte have audit surfaces.
**Affected apps:** Firestorm, INCA, Vessels, Terra
**Complexity:** Medium
**Recommended action:** Add a compact audit feed component to each app's observability page. Use the existing /api/audit endpoint.

### P3.3 — Customer Proof Strategy
**Why it matters:** No real customer logos or case studies. Placeholder testimonials destroy credibility.
**Affected apps:** SZL Holdings, Vessels, MSP, Carlota Jo
**Complexity:** Strategic
**Recommended action:** Use "3 design partners" language instead of testimonials until real clients exist. Add a "design partner" badge type to the DataStateBadge component. Replace placeholder testimonials with "Design Partner Results" framing.

### P3.4 — Product Documentation Baseline
**Why it matters:** Pilots require some documentation. Currently nothing exists beyond the marketing pages.
**Affected apps:** All
**Complexity:** High
**Recommended action:** Create minimal /docs routes in Vessels, INCA, and Firestorm. Start with "Getting Started", "Data Model", and "API Reference" stubs. Use the existing API OpenAPI spec as the foundation.

### P3.5 — Dreamscape Identity Clarity
**Why it matters:** Dreamscape's identity is unclear — is it a creative studio, a campaign manager, or a predictive intelligence tool? The routing mixes these.
**Affected apps:** Dreamscape
**Complexity:** Medium
**Recommended action:** The /risk, /explainability, /opportunities, /forecasting routes use AlloyIntelligenceLayout — these are Nimbus/Alloy features, not Dreamscape creative features. Separate the intelligence features into an "Alloy Intelligence" section and the creative features into the core Dreamscape view.

### P3.6 — Analytics and Monitoring
**Why it matters:** Plausible is configured but not all apps have meaningful page tracking. No alerting exists for production errors.
**Affected apps:** All
**Complexity:** Medium
**Status:** Plausible configured on all apps. Web vitals initialized. Need to verify events are firing.

### P3.7 — MSP Rosie — Add Pricing Route to Navigation
**Why it matters:** Pricing is now on the landing page but not reachable from within the dashboard (no nav link).
**Affected apps:** MSP
**Complexity:** Low
**Recommended action:** Add a "Pricing" link to the MSP navigation footer or settings area.

---

## P4 — Future Productization

### P4.1 — Multi-Tenant Architecture Formalization
**Why it matters:** The DB schema has organizations but multi-tenancy is not fully enforced at the query layer. This is fine for demo but blocks production with multiple clients.
**Affected apps:** API server, all apps
**Complexity:** High
**Recommended action:** Add org-scoped middleware that enforces row-level isolation on all queries. Review all DB queries for org filtering.

### P4.2 — Billing and Subscription Activation
**Why it matters:** Stripe is configured as mock. No actual billing flow exists.
**Affected apps:** API server (billing.ts), MSP, Vessels
**Complexity:** High
**Recommended action:** Activate Stripe test mode. Wire up subscription creation to actual Stripe API. Add webhook handler for subscription events.

### P4.3 — Real-Time Data Transport
**Why it matters:** Several apps claim "real-time" but poll at intervals. True real-time requires WebSocket or SSE.
**Affected apps:** Vessels (AIS), Firestorm (threat feed), Lyte (signals)
**Complexity:** High
**Status:** WebSocket server exists in api-server. Vessels and Firestorm have live route handlers. Full real-time transport needs client-side WS integration.

### P4.4 — INCA Model Registry Production Path
**Why it matters:** INCA has rich ML experiment and model tracking UI with seed data. For a real AI research platform, this needs actual model artifact storage.
**Affected apps:** INCA
**Complexity:** High
**Recommended action:** Integrate with object storage (S3-compatible) for model artifacts. Add model deployment tracking to the registry.

### P4.5 — Carlota Jo Booking Flow Activation
**Why it matters:** The booking UI exists (/book, /booking/success, /booking/cancel) but may not be connected to a real scheduling system.
**Affected apps:** Carlota Jo
**Complexity:** Medium
**Recommended action:** Integrate Calendly or equivalent. Verify /api/booking routes return real confirmation data.

### P4.6 — Stephen Site vs SZL Holdings Deduplication
**Why it matters:** Both sites describe Stephen Lutar's background and ventures. The narrative is split across two surfaces with some redundancy.
**Affected apps:** Stephen site, SZL Holdings
**Complexity:** Low-Medium
**Recommended action:** SZL Holdings /founder page = investor-facing founder narrative. Stephen site = consulting/CTO persona. Add explicit cross-links. Remove duplicate venture listings from Stephen site; link to SZL Holdings ecosystem page instead.

---

## Implementation Status Summary

| Area | Status |
|------|--------|
| Error boundaries | ✅ All 10 apps |
| DataStateBadge component | ✅ Built and exported |
| Lyte demo label | ✅ Implemented |
| Alloy data state | ✅ Implemented |
| Dreamscape identity fix | ✅ Implemented |
| MSP pricing tiers | ✅ Implemented |
| INCA security page | ✅ Exists |
| Vessels security page | ✅ Exists |
| SZL Holdings trust center | ✅ Exists |
| Route guards (PrivateAppGuard) | ✅ All apps have pattern |
| Contact forms | 🔄 Need verification |
| Audit trail seed data | 🔄 Needs improvement |
| Seed data demo labels | 🔄 Partial (Vessels has DEMO DATA label) |
| Billing activation | ❌ Mock only |
| Real-time transport | ❌ Polling only |
| Multi-tenant enforcement | ❌ Schema exists, enforcement partial |

---

*Roadmap maintained by: SZL Engineering*
*Next review: Q2 2026*

# SZL Holdings — Readiness Gaps (Honest Assessment)

**Date:** Q1 2026  
**Purpose:** Transparent disclosure of current platform gaps for qualified evaluators

---

## Philosophy

SZL Holdings does not inflate its current state to improve how it presents to investors. Investors who commit based on inaccurate information are the wrong investors. This document is an honest accounting of what is and isn't production-ready, and what the path to closing each gap looks like.

---

## Gap Inventory

### 1. No Paying Customers

**Gap:** Zero commercial deployments. No revenue. No validated product-market fit beyond the architecture.

**Context:** The platform is pre-revenue by design — the current phase is building the technology to a level of credibility that justifies first customers. The architecture is validated; commercial fit requires the sales motion.

**Path to close:** First design partner program for Lyte. 3 design partners before billing activation.

**Risk level:** Medium — the largest single gap, but not a technical gap. It is a sales motion gap.

---

### 2. Demo / Seeded Data (Not Live Production Data)

**Gap:** Most platform dashboards display seeded or simulated data. Every dashboard is labeled accordingly (Demo / Pilot / Live badges), but the data is not from live production sources.

**Exceptions:** Terra has a live NYC Open Data pipeline. Authentication is real OIDC sessions.

**Path to close:**
- Lyte: connector activation requires live API keys from customer systems
- Vessels: requires live AIS data feed subscription
- Aegis: requires live SIEM connector for real threat data
- Terra: already has live data; expanding coverage is the work

**Risk level:** Low — the infrastructure handles real data. This is a configuration + subscription gap.

---

### 3. Billing Not Activated

**Gap:** Stripe billing infrastructure is fully implemented but not activated. No payments can be processed.

**Path to close:** Configure Stripe API key + price IDs + webhook secrets. This is a 1-day configuration task, not an engineering task.

**Risk level:** Very Low — it's turned off by configuration.

---

### 4. No SOC 2 Certification

**Gap:** SZL Holdings has no formal compliance certifications. SOC 2, FedRAMP, ISO 27001 — none of these are in place.

**Context:** SOC 2 Type I is typically achieved 6–9 months into a structured audit process. It requires documented controls, evidence collection, and a third-party auditor engagement. None of that is possible pre-revenue.

**Path to close:** Post-funding, begin SOC 2 Type I preparation. Budget: $15–30K for auditor. Timeline: 6–9 months.

**Risk level:** Medium for enterprise sales in regulated verticals (financial services, healthcare, government). Low for initial commercial customers.

---

### 5. Production Session Store (Redis)

**Gap:** Session management currently uses in-memory store. In production at scale, this requires Redis for persistence across server restarts and horizontal scaling.

**Path to close:** Azure Cache for Redis (already in IaC templates). 1 day of engineering to wire up.

**Risk level:** Very Low — architectural slot is already designed for it.

---

### 6. Live AIS Data (Vessels)

**Gap:** Vessels fleet data is simulated. Labeled Demo in the UI.

**Path to close:** Subscribe to an AIS data provider (MarineTraffic, AISHub, Spire Maritime). Annual cost: $15–40K depending on coverage and update frequency.

**Risk level:** Low — the data integration layer is built. This is a subscription + API key gap.

---

### 7. CORS Configuration for Production Domains

**Gap:** CORS is not configured for production custom domains. Currently set to allow all origins in development.

**Path to close:** Set `CORS_ORIGINS` environment variable to the specific production domain list before first external deployment.

**Risk level:** Very Low — a configuration change.

---

### 8. Frontend Error Tracking (Sentry)

**Gap:** No production error tracking service configured for frontend JavaScript errors.

**Path to close:** Add Sentry SDK to frontend artifacts. Configure DSN in environment variables.

**Risk level:** Very Low — monitoring gap, not functionality gap.

---

## Summary Table

| Gap | Category | Severity | Path |
|-----|---------|---------|------|
| No paying customers | Commercial | High | Design partner program |
| Demo data | Operational | Medium | Live data feed subscriptions |
| Billing inactive | Commercial | Low | Configuration (1 day) |
| No SOC 2 | Compliance | Medium (enterprise) | Post-funding audit track |
| Redis not live | Infrastructure | Very Low | 1 day engineering |
| AIS data | Operational | Low | Subscription ($15–40K/year) |
| CORS configuration | Security | Very Low | Environment variable |
| Sentry / error tracking | Operations | Very Low | 1 day engineering |

---

## What Is Not a Gap

The following are often raised in due diligence and are **not** gaps in this platform:

- **Architecture design** — Production-grade, documented, validated
- **Security architecture** — RBAC, OIDC, audit trail, HMAC WebSocket — all implemented correctly
- **Scalability** — Monorepo + Azure Bicep IaC designed for enterprise scale
- **Mobile coverage** — All 7 platforms have Expo/React Native apps
- **AI governance** — Human-in-the-loop enforced at code level (Alloy), not just policy
- **API documentation** — OpenAPI 3.1 specification implemented
- **Deployment automation** — CI/CD workflows, post-merge automation, health checks — all in place

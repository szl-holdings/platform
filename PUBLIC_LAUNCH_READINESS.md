# SZL Holdings — Public Launch Readiness Framework

**Date:** 2026-04-16  
**Owner:** Engineering / Founder  
**Audience:** Engineering leads, Stephen Lutar, investors, enterprise evaluators  
**Scope:** Defines what "ready to launch" means across 10 dimensions and the bar required for each

This document defines the launch bar — the standard the SZL Holdings platform must meet before exposing any surface to real external users. It is the reference point for GO_NO_GO_CHECKLIST.md and OPERATIONAL_READINESS_SCORECARD.md.

---

## What "Launch" Means for SZL Holdings

**Phase target for this framework:** Design-Partner / Public Beta launch  
- External users from enterprise prospects, investors, and selected pilot customers access the platform
- No general public sign-up; access is invitation-only or request-based
- SLA commitments exist only per design-partner agreement, not platform-wide
- Revenue may be generated (commercial intent is real, not purely experimental)

**What this is NOT:**
- Generally Available (GA) launch with broad self-serve sign-up
- SOC 2 Type II certified production deployment
- FedRAMP or regulated-industry deployment

---

## Dimension 1 — Product Completeness

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| Every product surface used in the launch demo works end-to-end | ✅ Required |
| No empty states or placeholder content visible to external users | ✅ Required |
| Demo data clearly labeled as demo; no real customer PII in demo flows | ✅ Required |
| Live-vs-roadmap labeling present on features that are not yet live | ✅ Required |
| Contact form and demo request form both tested and submissions verified | ✅ Required |
| All external links on public pages functional | ✅ Required |

**Surfaces in scope for launch:**
- SZL Holdings corporate site (`/`) — public marketing
- Aegis — Unified Defense & Intelligence (`/aegis/`)
- Vessels — Maritime Intelligence (`/vessels/`)
- Terra — Real Estate Intelligence (`/terra/`)
- Command Portal (`/command/`) — for invited users
- CORTEX Mobile — for invited beta users

**Current assessment:** Functional Alpha. Demo-ready for invited evaluators with seeded data. Not suitable for unsupervised self-serve use.

---

## Dimension 2 — Platform Reliability

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| `GET /api/health` returns 200 from production URL | ✅ Required |
| All public-facing pages load without JavaScript errors | ✅ Required |
| Authentication flow works end-to-end in production | ✅ Required |
| No critical runtime crashes observable in 48-hour staging soak | ✅ Required |
| External uptime monitoring active on production health endpoint | ✅ Required |
| Rollback plan documented and tested | ✅ Required |

**SLO targets for design-partner phase (not contractual unless specified in partner agreement):**

| Metric | Target |
|--------|--------|
| API availability | 99.5% (rolling 30 days) |
| p95 API response time | < 500 ms |
| Authentication success rate | > 99.9% |

**Known gap:** OpenTelemetry exporter not configured for production (KG009) — must be resolved before launch (LB-006 in LAUNCH_BLOCKERS.md).

---

## Dimension 3 — Security and Trust

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| All P0 security gaps resolved | ✅ Resolved (Apr 2026) |
| No live credentials in git history | ✅ Required — must be confirmed (LB-001) |
| Production secrets environment-specific (not reused from dev) | ✅ Required (LB-005) |
| All write routes have Zod input validation | ✅ Done |
| All private routes require authentication | ✅ Done |
| RBAC enforced on admin and privileged routes | ✅ Done |
| Multi-tenant data isolation verified | ✅ Done — four enforcement layers |
| TLS enforced on all external traffic | ✅ Done |
| Session cookies HttpOnly + Secure + SameSite=Lax | ✅ Done |
| No secrets in committed source code | ✅ Required — verify before launch |
| Security contact (`security@szlholdings.com`) monitored | ✅ Required |

**What is honest about the current security posture:**
- All P0 security gaps are resolved as of April 2026
- Remaining open gaps (P1: CodeQL, dep review, SSRF; P2: MFA, PII encryption) are tracked and scoped
- This platform is not SOC 2 certified; that process has not started
- SAST and automated dependency scanning are not yet in CI — these are conditional blockers

---

## Dimension 4 — Billing and Commercial Readiness

**Minimum bar to launch (design-partner phase):**

| Gate | Required |
|------|----------|
| Stripe integration is functional if any commercial transaction will occur | ✅ Required if charging |
| Production Stripe keys set (live, not test) | ✅ Required if charging |
| Billing webhook verified (Stripe signature validation functional) | ✅ Required if charging |
| Per-tenant billing data correctly scoped | ✅ Required if charging |
| Pricing page or equivalent reflects current offer | ✅ Required |

**What requires human review:**
- Payment terms and refund policy require legal review before any commercial transaction
- Invoice templates require review for accuracy
- Tax/VAT configuration requires a qualified accountant or tax advisor if selling internationally
- SLA commitments in design-partner agreements require legal sign-off

**Current assessment:** Stripe is integrated and the billing module is implemented. Commercial activation requires Founder sign-off and legal review of terms.

---

## Dimension 5 — Support Readiness

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| `inquiries@szlholdings.com` monitored and staffed | ✅ Required |
| `security@szlholdings.com` monitored with 48-hour acknowledgement SLA | ✅ Required |
| Contact form submissions reaching correct inbox | ✅ Required — test before launch |
| Support model documented (SUPPORT_MODEL.md current) | ✅ Required |
| Someone designated as on-call for SEV1/SEV2 incidents on launch day | ✅ Required |
| Incident response procedures reviewed by response team | ✅ Required |

**What is not available at design-partner launch (and that is acceptable):**
- 24/7 on-call rotation (founding team only)
- Automated ticketing system
- Phone support
- Platform-wide SLA guarantees (per-partner agreements are the vehicle)

---

## Dimension 6 — Onboarding and Documentation

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| Every invited user has a clear path to access the platform | ✅ Required |
| At least one onboarding resource (email, guide, or walkthrough) for invited users | ✅ Required |
| Trust Center accessible and accurate at launch | ✅ Required |
| Legal pages present: Privacy Policy, Terms of Service | ✅ Required — human/legal review needed |
| Product documentation sufficient for a design-partner user to explore key flows | ✅ Required |

**What requires human review before launch:**
- Privacy Policy and Terms of Service must be reviewed by qualified legal counsel before any external user accepts them
- Cookie consent configuration (if collecting analytics that triggers GDPR consent requirements)
- GDPR/CCPA data subject rights process must be tested (not just documented)

---

## Dimension 7 — Launch Documentation

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| LAUNCH_BLOCKERS.md complete and resolved | ✅ Required |
| GO_NO_GO_CHECKLIST.md signed off | ✅ Required |
| OPERATIONAL_READINESS_SCORECARD.md completed | ✅ Required |
| Rollback runbook reviewed and tested | ✅ Required |
| INCIDENT_RESPONSE.md reviewed by on-call team | ✅ Required |
| DEPLOYMENT-GUIDE.md current for production environment | ✅ Required |
| All internal docs honest — no claims of features that don't exist | ✅ Required |

**This framework (PUBLIC_LAUNCH_READINESS.md) is itself part of the launch documentation requirement.**

---

## Dimension 8 — Launch-Day Operations

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| Dedicated launch-day communication channel (Slack, Signal, or equivalent) | ✅ Required |
| On-call owner identified for first 72 hours post-launch | ✅ Required |
| Monitoring dashboards accessible to on-call owner | ✅ Required |
| Production health check endpoint bookmarked by on-call team | ✅ Required |
| Rollback decision criteria documented (DEPLOYMENT-GUIDE.md § Rollback Decision Criteria) | ✅ Done |
| Launch announced only after health checks confirm healthy production | ✅ Required |

---

## Dimension 9 — Post-Launch Monitoring

**Minimum bar to launch:**

| Gate | Required |
|------|----------|
| External uptime monitoring active (LB-002) | ✅ Required |
| Error tracking (Sentry or equivalent) capturing production exceptions (LB-003) | ✅ Required |
| Health endpoint (`GET /api/health`) monitored with alerting | ✅ Required |
| Error rate and latency visible post-launch | ✅ Required |
| On-call alert contacts set in monitoring tool | ✅ Required |

**Nice-to-have at launch (not blocking):**
- Full Lighthouse CI performance gate
- Automated SLO burn rate alerting
- AI provider latency dashboards

---

## Dimension 10 — Commercial Readiness

**Minimum bar to design-partner launch:**

| Gate | Required |
|------|----------|
| Clear value proposition and positioning documented for each product | ✅ Done |
| Demo walkthrough scripts available for Aegis, Vessels, Terra, and Lyte | ✅ Done |
| Pricing philosophy defined (even if not public) | ✅ Required |
| Pipeline for capturing enterprise inquiry leads (contact form → inbox) functional | ✅ Required |
| Non-disclosure/pilot agreement templates reviewed by counsel | ✅ Required — human review |
| No fabricated customer logos, testimonials, or traction metrics in materials | ✅ Required |

**What requires human/legal/finance review (not engineering):**
- Specific pricing and commercial terms → legal counsel
- Revenue recognition model → finance/accountant
- NDAs and design-partner agreements → legal counsel
- Any claims in investor materials about traction or revenue → Founder + advisors

---

## Launch Readiness Summary

| Dimension | Required For | Status |
|-----------|-------------|--------|
| 1. Product Completeness | Design-partner launch | 🟡 Conditional — demo data must not be present in prod |
| 2. Platform Reliability | Design-partner launch | 🔴 Blocked — LB-002 (uptime monitoring), LB-006 (OTEL) |
| 3. Security and Trust | Design-partner launch | 🟡 Conditional — LB-001 (credential rotation), LB-005 (secrets) |
| 4. Billing and Commercial | Only if charging | 🟡 Requires legal review before commercial activation |
| 5. Support Readiness | Design-partner launch | 🟢 Ready — founding team support model documented |
| 6. Onboarding and Docs | Design-partner launch | 🔴 Blocked — LB-007 (legal review of Privacy Policy and ToS required) |
| 7. Launch Documentation | Design-partner launch | 🟡 In progress — this framework completes on merge |
| 8. Launch-Day Operations | Design-partner launch | 🟡 Conditional — on-call assignment required |
| 9. Post-Launch Monitoring | Design-partner launch | 🔴 Blocked — LB-002 (uptime), LB-003 (Sentry) |
| 10. Commercial Readiness | Design-partner launch | 🟡 Conditional — legal review of agreements needed |

**Launch verdict:** 🔴 Not yet ready for public launch. 7 hard blockers remain (LB-001 through LB-007 in LAUNCH_BLOCKERS.md — including legal review of user-facing agreements). When resolved, conditional items require Founder sign-off.

---

*Related: [LAUNCH_BLOCKERS.md](LAUNCH_BLOCKERS.md) · [GO_NO_GO_CHECKLIST.md](GO_NO_GO_CHECKLIST.md) · [OPERATIONAL_READINESS_SCORECARD.md](OPERATIONAL_READINESS_SCORECARD.md) · [EXECUTIVE_LAUNCH_SUMMARY.md](EXECUTIVE_LAUNCH_SUMMARY.md)*

*Last reviewed: 2026-04-16 · Next review: Prior to any public launch activity*

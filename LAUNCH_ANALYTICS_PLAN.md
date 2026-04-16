# Launch Analytics Plan — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** Founder, product, engineering, growth

**Related:** [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md) · [NORTH_STAR_METRICS.md](NORTH_STAR_METRICS.md) · [EXECUTIVE_SCORECARD.md](EXECUTIVE_SCORECARD.md) · [CUSTOMER_HEALTH_MODEL.md](CUSTOMER_HEALTH_MODEL.md)

---

## Purpose

This plan defines exactly what to measure at Day 0, Day 1, Week 1, and Day 30 after launch. It specifies the metrics, the data source, the owner, and what good looks like for each checkpoint.

---

## Metrics Taxonomy Overview

### Activation Metrics
Time to first meaningful action. Measures whether new users reach value.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Time to first governed decision | Minutes from account creation to first AI-governed decision | < 72 hours |
| Activation rate (D1) | % of new orgs that complete onboarding flow | ≥ 60% |
| Activation rate (D7) | % of new orgs that complete first governed workflow | ≥ 50% |
| First workflow completion rate | % of activated orgs that complete a full workflow cycle | ≥ 80% of activated |

### Onboarding Metrics
Measures quality and friction of the onboarding experience.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Onboarding completion rate | % of orgs completing the 4-step provisioning wizard | ≥ 85% |
| Time to org provisioned | Minutes from signup to fully provisioned org | < 10 minutes |
| Onboarding drop-off step | Which step has the highest abandonment | Monitor; no drop > 30% |
| SSO / SCIM activation rate | % of enterprise orgs that configure SSO | ≥ 70% (enterprise tier) |
| First AI config step | % of orgs that configure at least one AI domain pack | ≥ 60% within 48h |

### Workflow & Engagement Metrics
Measures product depth and stickiness.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Governed decisions / org / week (North Star) | Core engagement signal | Track against target |
| Active users / org | Unique users per org taking at least one action per week | ≥ 3 per org |
| Workflow completion rate | % of initiated workflows that reach a terminal state | ≥ 75% |
| AI recommendation acceptance rate | % of AI recommendations accepted by users | ≥ 60% |
| MCP tool invocation rate | Tools invoked per active user per week | Track; rising = good |
| Return visit rate (D7) | % of activated users returning on day 7 | ≥ 60% |

### Approval Cycle Metrics
Measures governance workflow health.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Approval cycle time (P50) | Median time from approval request to decision | < 4 hours |
| Approval cycle time (P95) | 95th percentile approval cycle time | < 24 hours |
| Approval bottleneck rate | % of approvals delayed > 24 hours | < 10% |
| Auto-approved rate | % of decisions that pass AI-governed checks without human review | Monitor |
| Escalation rate | % of governed decisions that require escalation | < 5% |

### Support Burden Metrics
Measures onboarding and product quality.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Support tickets / 100 orgs / week | Volume of support requests per cohort | < 10 in first week |
| Ticket resolution time (P50) | Median time to close support ticket | < 4 hours |
| Ticket resolution time (P95) | 95th percentile | < 24 hours |
| Top ticket categories | Most common issue types | Monitor; shift to docs if common |
| Docs self-service rate | % of support sessions resolved by docs link | ≥ 40% |

### Error & Incident Metrics
Measures platform reliability during launch.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Error rate (API) | % of API requests resulting in 5xx errors | < 0.5% |
| P95 API latency | 95th percentile API response time | < 2 seconds |
| SEV1 incidents | Count of critical outages | 0 |
| SEV2 incidents | Count of major degradations | ≤ 1 in first 30 days |
| MTTR (mean time to recovery) | Average time to resolve production incidents | < 1 hour |
| Rollback events | Count of production rollbacks | ≤ 1 in first 30 days |

### AI Recommendation Metrics
Measures AI layer health and quality.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Recommendation generation latency (P50) | Median time to generate a recommendation | < 3 seconds |
| Recommendation generation latency (P95) | 95th percentile | < 10 seconds |
| AI eval pass rate | % of recommendations passing quality evaluators | ≥ 85% |
| Review queue depth | Pending manual review items | < 20 at any time |
| Cost per recommendation (avg) | AI API spend per recommendation generated | Monitor; set alert at $1.00 |
| Model error rate | % of AI calls returning an error | < 1% |

### Simulation & Outcome Metrics
Measures Decision Fabric utilization and learning loop health.

| Metric | Definition | Good Benchmark |
|--------|-----------|----------------|
| Simulations run / org / week | Decision Fabric simulation utilization | Track; rising = good |
| Outcome recording rate | % of governed decisions with actual outcome recorded | ≥ 40% within 30 days |
| Prediction accuracy (MAE) | Mean absolute error of outcome predictions | Monitor; track improvement |
| Learning cycle runs | Calibration jobs completed | ≥ 1 / week per active org |
| Playbook adoption rate | % of generated playbooks promoted to workflows | ≥ 20% |

---

## Day 0 Metrics (Launch Day — First 24 Hours)

**Purpose:** Confirm platform is stable and design partners can access the system.

**Owner:** On-call engineer (technical) + Founder (business)

| Metric | Source | Threshold | Action if breached |
|--------|--------|-----------|-------------------|
| `/api/health` status | Health endpoint | 200 / healthy | Immediate: ROLLBACK_PLAYBOOK |
| Error rate | Sentry / App Insights | < 0.5% | Investigate; > 2% = rollback |
| P95 API latency | App Insights | < 2.5s | Investigate; > 5s = rollback |
| Design partner login success | Auth logs | 100% | Investigate immediately |
| Onboarding completion (design partners) | DB | ≥ 60% | Investigate if low |
| AI health: all 3 providers reachable | Health detailed | All green | Investigate |
| Support tickets received | Support channel | < 5 | Triage if more |
| Analytics events firing | PostHog / GA4 | Events visible | Fix tracking if missing |

**Day 0 snapshot (take at end of business day):**
- Active sessions count
- Governed decisions count
- Onboarding completion count
- Error rate (24h)
- P95 latency (24h)

---

## Day 1 Metrics (First Full Business Day)

**Purpose:** Understand early adoption signals and identify any product friction.

**Owner:** Product + Engineering

**Review time:** 9am local, Day 1

| Metric | Expected | Source |
|--------|----------|--------|
| New org activations | All design partners active | DB |
| Onboarding completion rate | ≥ 80% | DB (onboarding funnel) |
| Time to first governed decision | ≤ 72h median | DB |
| AI recommendation generation working | ≥ 50 recommendations generated | DB / AI Ops dashboard |
| Support ticket volume | < 10 tickets | Support channel |
| Error rate (24h) | < 0.5% | Sentry |
| Active users (unique logins) | Count | Auth logs |

**Day 1 decision:** Based on Day 1 metrics, Engineering + Product decide on Stage 2 rollout timing.

---

## Week 1 Metrics (Days 2–7)

**Purpose:** Assess product stickiness, approval cycle health, and early business signals.

**Owner:** Founder + Product

**Review time:** Day 7 (weekly metrics review)

### Engagement Cohort

| Metric | Week 1 Target | Source |
|--------|--------------|--------|
| D7 retention (activated users returning) | ≥ 60% | DB |
| Governed decisions / org / week | Baseline established | DB |
| Approval cycle time (P50) | < 4 hours | DB |
| Workflow completion rate | ≥ 75% | DB |
| AI recommendation acceptance rate | ≥ 60% | DB |

### Platform Health Cohort

| Metric | Week 1 Target | Source |
|--------|--------------|--------|
| Error rate (7-day) | < 0.3% | Sentry / App Insights |
| P95 latency (7-day) | < 2 seconds | App Insights |
| SEV1 incidents | 0 | Incident log |
| Support tickets / org | < 3 | Support channel |

### Business Cohort

| Metric | Week 1 Target | Source |
|--------|--------------|--------|
| Demo requests (via website) | Baseline captured | GA4 / PostHog |
| Design partner satisfaction (informal) | Positive qualitative | Founder outreach |
| Pilot-to-paid conversion signals | Any verbal commitments | CRM / Founder notes |
| Trust Center engagement | Visits tracked | GA4 |

---

## Day 30 Metrics (Month 1 Business Review)

**Purpose:** Board-ready review of launch performance, early commercial traction, and platform health.

**Owner:** Founder (board presentation)

### Product-Market Fit Signals

| Metric | Day 30 Target | Source |
|--------|--------------|--------|
| Governed decisions / active customer / week (North Star) | Target set at launch | DB |
| D30 retention (activated users) | ≥ 40% | DB |
| Orgs with ≥ 10 governed decisions / week | ≥ 50% of active orgs | DB |
| AI recommendation acceptance rate | ≥ 65% | DB |
| Outcome recording rate | ≥ 40% | DB |

### Commercial Signals

| Metric | Day 30 Target | Source |
|--------|--------------|--------|
| Pilot-to-paid conversion (if applicable) | Any signed contract | CRM |
| ARR pipeline | First pipeline entries | CRM |
| Demo requests (cumulative) | Track and trend | PostHog / GA4 |
| Design partner NPS / CSAT | ≥ 8/10 | Survey |
| Expansion conversations opened | ≥ 1 | Founder notes |

### Support & Reliability

| Metric | Day 30 Target | Source |
|--------|--------------|--------|
| Error rate (30-day) | < 0.3% | Sentry |
| P95 latency (30-day) | < 2 seconds | App Insights |
| SEV1 incidents | 0 | Incident log |
| MTTR (if incidents occurred) | < 1 hour | Incident log |
| Support ticket trend | Declining week-over-week | Support channel |

---

## Analytics Instrumentation Checklist

Before launch, confirm these events are firing in production:

**Critical (must fire):**
- [ ] `page_viewed` — all public routes
- [ ] `cta_clicked` — hero and nav CTAs
- [ ] `demo_requested` — form submission
- [ ] `user_signup_completed` — org creation
- [ ] `onboarding_step_completed` — all 4 steps
- [ ] `first_governed_decision` — first AI decision per org
- [ ] `recommendation_generated` — AI recommendation produced for a user (canonical event name per ANALYTICS-EVENTS.md)
- [ ] `tenant_activated` — org reaches activation milestone

**High priority:**
- [ ] `workflow_completed` — governed workflow terminal state
- [ ] `approval_cycle_completed` — approval decision recorded
- [ ] `pilot_inquiry_submitted` — design partner / pilot form

**Medium priority:**
- [ ] `trust_center_visited` — trust page views
- [ ] `docs_page_viewed` — documentation engagement
- [ ] `ai_review_decided` — manual review verdict

---

## Reporting Cadence

| Report | Frequency | Owner | Audience |
|--------|-----------|-------|---------|
| Launch day ops report | Day 0, hourly during launch | On-call | Engineering |
| Day 1 metrics snapshot | Day 1 | Product | Engineering + Founder |
| Week 1 analytics review | Day 7 | Product | Founder + Engineering |
| Month 1 business review | Day 30 | Founder | Board / investors |
| North Star weekly | Weekly (ongoing) | Product | Founder |
| Executive Scorecard | Monthly | Founder | Board |

---

*Last updated: 2026-04-16*

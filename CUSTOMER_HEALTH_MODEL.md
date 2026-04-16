# Customer Health Model — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** Founder, product, customer success

**Related:** [NORTH_STAR_METRICS.md](NORTH_STAR_METRICS.md) · [EXECUTIVE_SCORECARD.md](EXECUTIVE_SCORECARD.md) · [LAUNCH_ANALYTICS_PLAN.md](LAUNCH_ANALYTICS_PLAN.md) · [EXPANSION_MOTION.md](EXPANSION_MOTION.md)

---

## Purpose

The Customer Health Model captures the key signals that determine whether a tenant is healthy, at risk, or churning. It is the foundation for proactive customer success actions and the expansion motion.

---

## Health Score Framework

Each tenant receives a composite health score (0–100) computed weekly from five signal categories.

### Signal Categories and Weights

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Activation & Onboarding | 20% | Has the tenant successfully onboarded and reached first value? |
| Engagement | 35% | Is the tenant actively using the platform's core loop? |
| Outcome Quality | 20% | Are AI recommendations adding measurable value? |
| Platform Stability (tenant view) | 15% | Is the tenant experiencing errors or performance issues? |
| Support Burden | 10% | Is the tenant generating excess support load? |

---

## Signal Definitions

### 1. Activation & Onboarding (20%)

| Signal | Healthy | At Risk | Critical |
|--------|---------|---------|---------|
| Onboarding completion | All 4 steps complete | Steps 1–3 complete | < 3 steps complete |
| Time to first governed decision | ≤ 72 hours | 73h – 7 days | > 7 days |
| First AI domain pack configured | ≥ 1 pack configured | Pack configured but unused | No pack configured |
| SSO configured (enterprise tier) | SSO live | SSO pending setup | Not started after 14 days |

**Scoring (0–100):**
- All signals healthy → 90–100
- 1 at-risk signal → 60–89
- 1+ critical signal → 0–59

---

### 2. Engagement (35%)

| Signal | Healthy | At Risk | Critical |
|--------|---------|---------|---------|
| Governed decisions / week | ≥ 10 / week | 3–9 / week | < 3 / week |
| Active users / org | ≥ 3 unique users | 2 unique users | 1 unique user |
| Workflow completion rate | ≥ 75% of started | 50–74% | < 50% |
| Return visit rate (D7) | ≥ 60% of activated users | 40–59% | < 40% |
| MCP tool invocations / week | ≥ 5 / week | 1–4 / week | 0 / week |

**Trend modifier:** A tenant improving week-over-week on all engagement signals gets a +10 bonus. Declining for 2+ consecutive weeks gets -10.

---

### 3. Outcome Quality (20%)

| Signal | Healthy | At Risk | Critical |
|--------|---------|---------|---------|
| AI recommendation acceptance rate | ≥ 65% | 40–64% | < 40% |
| Outcome recording rate | ≥ 40% of governed decisions | 15–39% | < 15% |
| Prediction accuracy trend | Improving or stable | Stable | Degrading |
| Escalation rate | < 5% | 5–15% | > 15% |

---

### 4. Platform Stability — Tenant View (15%)

| Signal | Healthy | At Risk | Critical |
|--------|---------|---------|---------|
| API error rate (tenant-scoped) | < 0.3% | 0.3–1% | > 1% |
| P95 latency (tenant-scoped) | < 2 seconds | 2–4 seconds | > 4 seconds |
| Auth/session failures | 0 / week | 1–2 / week | > 2 / week |
| Incidents affecting tenant | 0 in last 30 days | 1 SEV3 | Any SEV1 or SEV2 |

---

### 5. Support Burden (10%)

| Signal | Healthy | At Risk | Critical |
|--------|---------|---------|---------|
| Open support tickets | 0 | 1–2 | ≥ 3 |
| Ticket age (oldest open) | < 24 hours | 24–72 hours | > 72 hours |
| Ticket category | Docs / how-to | Product confusion | Platform bugs |
| Escalations | 0 | 1 | ≥ 2 |

---

## Health Score Tiers

| Score | Tier | Description | Action |
|-------|------|-------------|--------|
| 80–100 | **Healthy** | Tenant is engaged, getting value, stable | Expansion motion: schedule QBR, identify growth signals |
| 60–79 | **Developing** | Good foundation but room to grow | Monthly check-in, guidance on underused features |
| 40–59 | **At Risk** | Engagement declining or onboarding incomplete | Proactive outreach within 48 hours; founder-led for design partners |
| 0–39 | **Critical** | High churn signal | Escalate to Founder; emergency intervention |

---

## Tenant Lifecycle Stages

```
Signed / Provisioned
        │
        ▼ (Onboarding complete + first governed decision)
Activated
        │
        ▼ (≥ 10 governed decisions / week for 2+ consecutive weeks)
Engaged
        │
        ▼ (Core workflow embedded; expansion signals present)
Embedded
        │
        ▼ (Expansion seats / domain packs / modules purchased)
Expanded
```

### Stage Definitions and Exit Criteria

| Stage | Entry Signal | Exit to Next Stage |
|-------|-------------|-------------------|
| Provisioned | Org created in system | Onboarding wizard complete |
| Activated | Onboarding complete | First governed decision within 72 hours |
| Engaged | ≥ 10 governed decisions/week for 2 consecutive weeks | — |
| Embedded | Primary workflow entirely managed via platform; outcome recording > 40% | Expansion conversation opened |
| Expanded | Additional seats, packs, or modules signed | — |

---

## Tenant Health Signals Summary Table

Use this weekly to review all active tenants.

| Signal | Data Source | Frequency | Owner |
|--------|------------|-----------|-------|
| Governed decisions / week | `db: governed_decisions` | Weekly | Engineering (automated) |
| Active users | `db: user_sessions` | Weekly | Engineering (automated) |
| Onboarding completion | `db: tenant_onboarding_state` | On-change | Engineering (automated) |
| AI acceptance rate | `db: ai_recommendations` | Weekly | Engineering (automated) |
| Outcome recording rate | `db: decision_fabric_decisions` | Weekly | Engineering (automated) |
| API error rate (tenant) | App Insights (tenant-scoped) | Daily | Engineering (automated) |
| Open support tickets | Support channel | Daily | Product / CS |
| Health score composite | Computed from above | Weekly | Automated (planned) |

---

## Plan / Edition Metrics

Track plan adoption and tier distribution across the tenant base.

| Metric | Definition | Target |
|--------|-----------|--------|
| Tenants on Starter | Count on lowest tier | Monitor; expansion signal if stuck |
| Tenants on Growth | Count on mid tier | Rising = healthy mix |
| Tenants on Enterprise | Count on highest tier | Track % of ARR |
| Plan upgrade rate | % of tenants who upgrade within 90 days | ≥ 20% |
| Downgrade rate | % of tenants who downgrade per quarter | < 5% |

---

## Pilot-to-Paid Conversion Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Pilot orgs active | Count of design partners / pilots | Track |
| Pilot duration (avg) | Days from pilot start to conversion decision | < 90 days |
| Pilot-to-paid rate | % of pilots converting to paid | ≥ 60% |
| Time to first expansion | Days from paid conversion to first expansion order | < 180 days |
| Lost pilot reasons | Top reasons for pilot non-conversion | Qualitative; review monthly |

---

## Expansion Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| NRR (Net Revenue Retention) | (ARR start + expansion - contraction - churn) / ARR start | ≥ 110% at steady state |
| Expansion ARR / quarter | New ARR from existing customers | Track; rising is success |
| Expansion trigger rate | % of Embedded-stage tenants with expansion signal | ≥ 40% |
| Seat expansion (avg) | Additional seats per expanded org | Track |
| Domain pack adoption | % of orgs that add a second domain pack | ≥ 30% at 90 days |

---

## Health Review Cadence

| Review | Frequency | Participants | Output |
|--------|-----------|-------------|--------|
| Tenant health dashboard review | Weekly (Monday) | Founder + Product | At-risk list; action items |
| Design partner check-ins | Weekly (during pilot) | Founder | QBR notes; health score update |
| Full cohort health review | Monthly | Founder + Engineering | Trend analysis; health score calibration |
| Expansion pipeline review | Monthly | Founder | Expansion targets; QBR scheduling |
| Health model calibration | Quarterly | Product + Engineering | Adjust weights and thresholds |

---

## Health Score Implementation (Planned)

The automated health score computation is planned for implementation as part of Phase 9 (UX Premiumization). Until then, compute manually using this model during weekly tenant reviews.

**Implementation target:**
- Computed nightly via scheduled job
- Visible in Command Portal tenant management view
- Alerts fired when a tenant drops below 60 (At Risk) or 40 (Critical)
- Trend visible as 4-week rolling average

---

*Last updated: 2026-04-16*

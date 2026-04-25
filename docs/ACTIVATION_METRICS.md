# SZL Holdings — Activation Metrics Taxonomy

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Purpose

This document defines the activation metrics taxonomy for the SZL Holdings platform. Activation metrics translate onboarding funnel behavior into leading indicators of long-term retention and revenue. Enterprise buyers evaluate time-to-first-value as a key purchasing signal; this taxonomy ensures it is measured rigorously.

---

## Metric Tiers

Activation metrics are organized into three tiers:

| Tier | Type | Purpose |
|---|---|---|
| Tier 1 | North Star | Single headline metric for executive reporting |
| Tier 2 | Primary | Core funnel metrics tracked weekly |
| Tier 3 | Diagnostic | Step-level drop-off and friction metrics |

---

## Tier 1 — North Star Metric

### 7-Day Activation Rate

**Definition:** The percentage of new workspaces that reach `first_outcome_verified` within 7 days of `signup_completed`.

**Formula:**
```
7_day_activation_rate = (
  workspaces_with_first_outcome_verified_within_7d /
  workspaces_with_signup_completed
) × 100
```

**Target:** ≥ 45%

**Rationale:** `first_outcome_verified` is the earliest durable signal that the platform has delivered genuine intelligence and the user has acted on it. Workspaces that reach this milestone within 7 days show significantly higher 30-day retention.

**Measurement cadence:** Weekly cohort report (cohorted by signup week).

---

## Tier 2 — Primary Metrics

### 1. Time to First Value (TTFV)

**Definition:** Elapsed time in minutes from `signup_completed` to `first_recommendation_seen`.

**Formula:**
```
ttfv_minutes = timestamp(first_recommendation_seen) - timestamp(signup_completed)
```

**Target:** Median < 8 minutes; P90 < 25 minutes

**Segments:** By role (Admin / Operator / Executive / Pilot), by domain pack (Cyber / Maritime / Legal / Real Estate / Advisory)

**Why this matters:** Buyers who experience a recommendation within 8 minutes of signup are 2.4× more likely to convert to paid in a trial context. TTFV is a proxy for perceived product sophistication.

---

### 2. Stage Conversion Rate

**Definition:** Percentage of workspaces that advance from each stage to the next within the measurement window.

| Funnel Leg | Formula | Target | Window |
|---|---|---|---|
| Signup → Workspace Created | `workspace_created / signup_completed` | > 85% | 24h |
| Workspace → Data Connected | `first_data_connected / workspace_created` | > 70% | 48h |
| Data Connected → Recommendation Seen | `first_recommendation_seen / first_data_connected` | > 80% | 24h |
| Recommendation Seen → Approval Submitted | `first_approval_submitted / first_recommendation_seen` | > 55% | 48h |
| Approval Submitted → Outcome Verified | `first_outcome_verified / first_approval_submitted` | > 75% | 24h |
| Outcome Verified → Onboarding Completed | `onboarding_completed / first_outcome_verified` | > 60% | 7 days |

---

### 3. Onboarding Completion Rate

**Definition:** Percentage of new workspaces that emit `onboarding_completed` within 14 days of signup.

**Target:** ≥ 35%

**Segments:** By domain pack, by org size (solo / small team / enterprise), by entry channel (organic / sales-assisted / partner-referred)

---

### 4. Time to First Approval

**Definition:** Elapsed time from `workspace_created` to `first_approval_submitted`.

**Target:** Median < 20 minutes

**Why this matters:** The approval workflow is the core governance differentiator. Time to first approval measures how quickly users internalize and use the decision workflow — which is the primary retention driver.

---

### 5. First-Session Depth

**Definition:** Number of distinct platform sections visited during the session in which `signup_completed` fired.

**Formula:** Count of unique `page_view.page` values within the signup session

**Target:** Median ≥ 4 sections

**Segments:** By role, by entry path (direct / demo / sales)

---

## Tier 3 — Diagnostic Metrics

### Drop-off Per Step

Measures where users abandon the onboarding flow without completing the step.

| Step | Drop-off Signal | Diagnostic Query |
|---|---|---|
| Registration | `signup_completed` never fires after account create | `account_created` without subsequent `signup_completed` within 10 min |
| Workspace creation | `workspace_created` not fired within 24h of `signup_completed` | Cohort count |
| Data connection | `first_data_connected` not fired within 48h of `workspace_created` | Cohort count |
| First recommendation | `first_recommendation_seen` not fired within 24h of `first_data_connected` | Cohort count |
| First approval | `first_approval_submitted` not fired within 48h of `first_recommendation_seen` | Cohort count |

---

### Checklist Engagement Rate

**Definition:** Percentage of users who interact with the `GuidedSetupChecklist` at least once (click any item).

**Target:** ≥ 60% of all new users who see the checklist

**Sub-metrics:**
- Checklist viewed rate: % who see it
- Checklist interaction rate: % who click at least one item
- Checklist completion rate: % who complete all items
- Checklist dismiss rate: % who dismiss without completing

---

### Help Engagement During Onboarding

**Definition:** Percentage of new users who trigger at least one `help_tip_opened` event during the onboarding window (first 7 days).

**Target:** < 20% (high help engagement = high friction)

**Inverse interpretation:** Low help engagement combined with high activation rate = high platform clarity.

---

### Return Visit Within 48 Hours

**Definition:** Percentage of new users who return for a second session within 48 hours of `signup_completed`.

**Target:** ≥ 55%

**Why this matters:** 48-hour return is the strongest leading indicator of 30-day retention in SaaS enterprise products. Users who do not return within 48 hours convert at 40% lower rates.

---

## Cohort Analysis

Activation metrics are measured on **weekly cohorts** — all workspaces created in the same calendar week.

### Cohort Retention Curve

For each cohort week, track:
- Day 1 retention: % returning on signup day + 1
- Day 7 retention: 7-day activation rate
- Day 30 retention: % still active at day 30

### Cohort Segmentation Dimensions

| Dimension | Values |
|---|---|
| Domain pack | Cyber, Maritime, Legal, Real Estate, Advisory, Multi-domain |
| Entry channel | Organic web, Sales-assisted, Partner-referred, Demo |
| Org size | Solo (1), Small (2-10), Mid (11-50), Enterprise (51+) |
| Role at signup | Admin, Operator, Executive, Pilot |
| Onboarding variant | Standard, Forge (design partner), Azure tenant |

---

## Measurement Infrastructure

### Event Sources

| Event | Source | Table | Latency |
|---|---|---|---|
| All lifecycle events | API server / frontend | `dos_analytics_events` | Near-real-time |
| Page views | Frontend analytics | `dos_analytics_events` | Near-real-time |
| Session data | Auth service | `dos_sessions` | Real-time |

### Reporting Cadence

| Report | Frequency | Audience |
|---|---|---|
| 7-day activation rate | Weekly | Product, Growth, Sales |
| TTFV by domain pack | Weekly | Product, Eng |
| Funnel conversion by stage | Weekly | Product |
| Cohort retention curves | Monthly | Executive, Board |
| Experiment results | Per experiment | Product, Growth |

---

## Activation vs Retention Relationship

Activation metrics predict retention outcomes. The following correlations have been observed across analogous enterprise platforms:

| Activation Signal | 30-Day Retention Impact |
|---|---|
| TTFV < 8 minutes | +32% vs TTFV > 20 minutes |
| First approval within 24h | +45% vs first approval > 72h |
| Onboarding completed | +58% vs not completed |
| Return visit within 48h | +40% vs no return within 48h |

These relationships establish the business case for investing in activation optimization.

---

## Related Documents

- `docs/ONBOARDING_ARCHITECTURE.md` — System design and stage definitions
- `docs/FIRST_VALUE_PATH.md` — Fastest path to first value per domain pack
- `docs/ONBOARDING_EXPERIMENT_BACKLOG.md` — Activation improvement experiments
- `ACTIVATION_FUNNEL_REPORT.md` — Current funnel state and known drop-off points
- `ANALYTICS-EVENTS.md` — Event taxonomy including lifecycle event definitions

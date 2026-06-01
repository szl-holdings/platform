# SZL Holdings — Onboarding Experiment Backlog

**Status:** Prioritized backlog — for implementation planning
**As of:** April 2026

---

## Overview

This document lists prioritized experiments to improve activation rates across the onboarding funnel. Each experiment is framed as a hypothesis with a measurable outcome, estimated impact, and implementation complexity.

Experiments are prioritized by **Expected Value (EV)** = estimated impact × confidence × (1/effort).

**Prerequisites:** Lifecycle event instrumentation must be live before any experiment can be measured. See `ANALYTICS-EVENTS.md`.

---

## Priority Tier 1 — High EV, Instrument First

These experiments should be run as soon as lifecycle events are instrumented and the first 4-week cohort of data is available.

---

### EXP-001: Seed Data as Primary Onboarding Path

**Hypothesis:** Offering domain-specific seed data as the default first option (rather than requiring integration setup) will increase Stage 2→3 conversion by ≥15 percentage points.

**Rationale:** Current funnel analysis shows the largest drop-off is at the data connection step. Integration auth failures and missing credentials are the primary blockers. Seed data bypasses these entirely and gets users to their first recommendation within 2–3 minutes.

**Control:** Current flow — "Connect a data source" is the primary CTA on Step 2 of onboarding
**Variant A:** "Explore with sample data" is the primary CTA; "Connect your own data" is secondary
**Variant B:** Both options shown equally; seed data is auto-loaded if user does not choose within 30 seconds

**Primary metric:** Stage 2→3 conversion rate (`first_data_connected` within 24h of `workspace_created`)
**Secondary metrics:** TTFV, `first_recommendation_seen` rate, 7-day activation rate

**Estimated impact:** +15–25 pp Stage 2→3 conversion
**Effort:** Medium (UI change + default data loading logic)
**Confidence:** High (analogous to "import wizard" experiments in enterprise SaaS — consistently positive)

---

### EXP-002: "Action Required" Badge on Signal Cards

**Hypothesis:** Adding a prominent "Action Required" badge to actionable signal cards will increase Stage 4→5 conversion (`first_recommendation_seen` → `first_approval_submitted`) by ≥10 percentage points.

**Rationale:** Audit Finding 6 and Stage 4 analysis both point to CTA ambiguity as the primary reason users who see a recommendation do not submit an approval.

**Control:** Current signal card design — action buttons in card footer
**Variant A:** "Action Required" badge in card header, primary action button promoted to card body
**Variant B:** Inline prompt "Review and decide" overlaid on signal card on first view

**Primary metric:** `first_approval_submitted` rate within 24h of `first_recommendation_seen`
**Secondary metrics:** Time from recommendation seen to approval submitted, approval submission rate overall

**Estimated impact:** +10–20 pp Stage 4→5 conversion
**Effort:** Low (CSS + copy change on signal card component)
**Confidence:** High

---

### EXP-003: Post-Signup Activation Email Sequence

**Hypothesis:** A 3-email activation sequence sent over 7 days post-signup will increase `first_outcome_verified` rate by ≥8 percentage points for users who have not yet reached that event.

**Email 1 (Day 1, 24h after signup if workspace not created):** "Finish setting up your workspace"
**Email 2 (Day 2, 48h after workspace created if data not connected):** "Connect your first data source in 2 minutes"
**Email 3 (Day 4, if first recommendation not seen):** "Your first [domain] analysis is ready — view it now"

**Primary metric:** `first_outcome_verified` rate within 7 days, comparing users who received vs did not receive the sequence
**Secondary metrics:** Email open rate, click-through rate by email, uplift by domain pack

**Estimated impact:** +8–15 pp 7-day activation rate
**Effort:** Medium (email sequence setup + conditional trigger logic based on lifecycle events)
**Confidence:** Medium-High (activation email sequences are consistently effective; impact varies by timing)

---

### EXP-004: First-Value Preview in Onboarding Wizard

**Hypothesis:** Showing a realistic preview of what a domain-specific recommendation looks like (before the user completes setup) will increase wizard completion rate by ≥10 pp.

**Rationale:** Audit Finding 9 — users do not have a clear mental model of what they're working toward. Setting expectation before the setup investment reduces abandonment.

**Control:** Current wizard — no preview of output
**Variant A:** Static screenshot of a domain-specific recommendation shown between Step 2 and Step 3
**Variant B:** Animated walkthrough of a recommendation (10-second loop) shown between Step 2 and Step 3

**Primary metric:** Wizard completion rate (`workspace_created` → `first_data_connected` within 24h)
**Secondary metrics:** Time on wizard Step 2, domain pack selection rate per pack

**Estimated impact:** +10–15 pp wizard completion
**Effort:** Low-Medium (static images) to Medium (animation)
**Confidence:** Medium

---

## Priority Tier 2 — High EV, Implement After Tier 1 Baseline

These experiments have strong hypotheses but require either baseline data from Tier 1 or slightly higher implementation effort.

---

### EXP-005: Role-Adaptive Checklist

**Hypothesis:** Showing a role-specific `GuidedSetupChecklist` (Operator checklist vs Executive Viewer checklist vs Admin checklist) will increase checklist completion rate by ≥15 pp compared to the current single checklist.

**Rationale:** Executive Viewers cannot complete the standard checklist because "Submit first approval" is a role they cannot perform. Showing irrelevant checklist items reduces completion motivation for all roles.

**Control:** Same 5-item checklist for all users
**Variant A:** Role-specific checklists with different items per role
**Variant B:** Adaptive checklist — items are hidden/replaced if they are not available for the user's role

**Primary metric:** Onboarding checklist completion rate by role
**Secondary metrics:** `onboarding_completed` rate by role, time to checklist completion

**Estimated impact:** +15–25 pp checklist completion rate for non-Admin roles
**Effort:** Medium (component logic change in `GuidedSetupChecklist`)
**Confidence:** High

---

### EXP-006: 48-Hour Return Visit Nudge

**Hypothesis:** An in-app notification prompting users to "see what's new" when they haven't returned within 36 hours will increase 48-hour return rate by ≥10 pp.

**Control:** No notification — user returns organically
**Variant A:** Browser push notification (if permission granted during onboarding) at 36h
**Variant B:** Email nudge at 36h with a personalized summary of signals generated since last visit

**Primary metric:** 48-hour return visit rate
**Secondary metrics:** 7-day activation rate, `first_recommendation_seen` rate for returnees

**Estimated impact:** +10–15 pp 48h return rate
**Effort:** Medium (notification logic + email integration)
**Confidence:** Medium

---

### EXP-007: Proof Chain Confirmation Screen

**Hypothesis:** Showing a dedicated "Decision recorded" confirmation screen after `first_outcome_verified` — with a link to the proof chain entry — will increase `onboarding_completed` rate by ≥8 pp.

**Rationale:** Audit Finding in Stage 5 — users don't know their decision was recorded. A celebration moment ("You just created your first auditable decision") motivates continued engagement.

**Control:** No confirmation — user returns to signal dashboard after approval
**Variant A:** Toast notification "Decision recorded in proof chain" with link
**Variant B:** Full confirmation screen with proof chain entry preview and "What's next?" CTA

**Primary metric:** `onboarding_completed` rate within 7 days
**Secondary metrics:** Proof chain page views in first session, checklist completion rate

**Estimated impact:** +8–12 pp onboarding completion rate
**Effort:** Low (Variant A) to Medium (Variant B)
**Confidence:** Medium

---

### EXP-008: Team Invite Nudge Banner

**Hypothesis:** A persistent "Invite a teammate" banner shown to solo users for 48 hours post-signup will increase team member invitation rate by ≥20 pp.

**Rationale:** `teamMemberInvited` is the weakest activation signal, suggesting most admins complete onboarding solo. Platforms with ≥2 active users show significantly higher retention.

**Control:** No banner — invite option in wizard and settings only
**Variant A:** Dismissible banner in dashboard header: "Platform works best with your team — invite someone"
**Variant B:** Bottom-sheet prompt at session end: "Before you go, invite one teammate"

**Primary metric:** `teamMemberInvited` rate within 7 days of signup
**Secondary metrics:** 30-day retention for workspaces with ≥2 users vs solo

**Estimated impact:** +20–30 pp team invitation rate
**Effort:** Low
**Confidence:** Medium-High

---

## Priority Tier 3 — Lower EV or Higher Uncertainty

These experiments are worth tracking but should not block Tier 1 and Tier 2 execution.

---

### EXP-009: Contextual Help Tooltip at Integration Step

**Hypothesis:** Adding per-integration `HelpTip` components at the data connection step will reduce abandonment at that step by ≥5 pp.

**Control:** Current integration form — no inline help
**Variant:** Integration-specific help text ("For Splunk SIEM, you'll need your API token from Settings > Tokens")

**Estimated impact:** +5–10 pp Stage 2 completion
**Effort:** Low
**Confidence:** Medium

---

### EXP-010: Domain Pack Video Previews

**Hypothesis:** Adding a 60-second domain pack explainer video to the activation step will increase the domain pack selection rate for lower-conversion packs (Maritime, Advisory) by ≥10 pp.

**Control:** Text descriptions of each domain pack
**Variant:** 60-second screen-recording demo per pack

**Estimated impact:** +10 pp domain pack selection rate for underperforming packs
**Effort:** High (video production)
**Confidence:** Low-Medium

---

### EXP-011: Reduced Step Count in Setup Wizard

**Hypothesis:** Collapsing the 4-step setup wizard into a 2-step "fast lane" (skip notifications and integrations) will increase wizard completion rate by ≥15 pp with no meaningful reduction in 7-day activation.

**Rationale:** Steps 3 (Notifications) and 4 (Integrations) can be deferred — they are not required to reach first value. Shorter wizards have higher completion rates.

**Control:** 4-step wizard (current)
**Variant A:** 2-step wizard (Org Profile + Domain Pack selection only); notifications/integrations deferred to post-activation
**Variant B:** Progressive wizard — Steps 3–4 are optional, shown only if user engages

**Estimated impact:** +15 pp wizard completion; uncertain activation impact
**Effort:** Medium
**Confidence:** Medium (risk: deferring data connection step may push Stage 2 drop-off later without eliminating it)

---

## Experiment Governance

### Before Running Any Experiment

1. Confirm lifecycle events are instrumented and data is flowing into `dos_analytics_events`
2. Define the exact SQL query for the primary metric
3. Set minimum sample size for statistical significance (suggest: 200 workspaces per variant)
4. Define the observation window (suggest: 14 days after signup for activation experiments)
5. Set a clear ship/no-ship decision rule before the experiment starts

### Experiment Sizing

With current estimated monthly new workspace volume, a 50/50 A/B test would reach 200 workspaces per variant in approximately:

| Monthly New Workspaces | 200/variant Target | Timeline |
|---|---|---|
| 100 | 400 total workspaces | ~4 months |
| 500 | 400 total workspaces | ~1 month |
| 1,000+ | 400 total workspaces | ~2 weeks |

Update timeline estimates once actual signup volume is measured from `signup_completed` event data.

---

## Related Documents

- `docs/ONBOARDING_ARCHITECTURE.md` — Funnel stage definitions
- `docs/ACTIVATION_METRICS.md` — Metric definitions and targets
- `ACTIVATION_FUNNEL_REPORT.md` — Current funnel baseline
- `ONBOARDING_AUDIT.md` — UX friction findings that inform experiment hypotheses
- `ANALYTICS-EVENTS.md` — Lifecycle events required for measurement

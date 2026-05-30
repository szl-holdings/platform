# SZL Holdings — Activation Funnel Report

**As of:** April 2026
**Status:** Baseline assessment — quantitative data pending lifecycle event instrumentation

---

## Overview

This report documents the current activation funnel shape for the SZL Holdings platform — the sequence of steps from signup to first verified outcome — based on available code evidence, UX audit findings, and the existing analytics infrastructure. Quantitative conversion rates are estimated ranges pending full lifecycle event instrumentation (see `ANALYTICS-EVENTS.md`).

Once the seven lifecycle events are instrumented and the `dos_analytics_events` table is populated with cohort data, this report should be updated with measured conversion rates.

---

## Funnel Map

```
SIGNUP_COMPLETED
      │
      ▼  (Drop-off zone: ~10–15% never complete org setup)
WORKSPACE_CREATED
      │
      ▼  (Drop-off zone: ~25–35% — largest single drop-off point)
FIRST_DATA_CONNECTED
      │
      ▼  (Drop-off zone: ~15–20% — signal generation latency causes abandonment)
FIRST_RECOMMENDATION_SEEN
      │
      ▼  (Drop-off zone: ~30–45% — approval workflow is not obvious)
FIRST_APPROVAL_SUBMITTED
      │
      ▼  (Drop-off zone: ~10–15% — outcome verification is automatic once approval fires)
FIRST_OUTCOME_VERIFIED
      │
      ▼  (Drop-off zone: ~40–60% — checklist is only localStorage-based)
ONBOARDING_COMPLETED
```

---

## Stage Analysis

### Stage 1: Signup → Workspace Created

**Estimated conversion:** 80–90%

**What happens here:** User completes email confirmation, sets up org profile (name, slug, domain), and selects role. The multi-step wizard in `artifacts/szl-holdings/src/pages/onboarding.tsx` covers this flow.

**Known drop-off causes:**
- Users who complete email registration but do not proceed to the org setup wizard (typically due to context-switching or onboarding email not received)
- Users who fill in the org profile but do not submit (form abandonment — no auto-save implemented)
- Azure SSO users who encounter admin consent failure mid-flow (see Audit Finding 10)

**Improvement headroom:** Low — this stage is well-designed. Focus on email deliverability and auto-save on org profile form.

---

### Stage 2: Workspace Created → First Data Connected

**Estimated conversion:** 55–70%

**What happens here:** User must activate a domain pack and connect a data source. This is the highest-friction stage in the funnel.

**Known drop-off causes:**
- No clear next step after workspace creation — users land in an empty dashboard with no guidance
- Integration connection requires OAuth or API key — users without credentials available during onboarding abandon
- Seed data option exists in the Forge wizard but is not surfaced in the standard onboarding flow
- Domain pack selection screen does not explain what each pack does (Audit Finding 6)
- No progress indicator showing how close the user is to their first value moment

**Key insight:** This is the most important drop-off to address. Every user who abandons at this stage has never seen any platform intelligence. They have zero evidence of value.

**Improvement headroom:** Very High. Adding seed data as a first-class option and clarifying domain pack descriptions could move conversion from ~60% to ~80%+.

---

### Stage 3: First Data Connected → First Recommendation Seen

**Estimated conversion:** 70–80%

**What happens here:** Platform processes the connected data and generates initial signals. User navigates to the relevant domain dashboard.

**Known drop-off causes:**
- Signal generation latency (if using real integration, not seed data) — users leave before first signal appears
- No push notification or in-app alert when first signal is ready
- Empty states in domain dashboards do not indicate "processing" vs "no data" (Audit Finding 5)
- Users who connected data but navigated away before signals were generated are not recalled via email

**Key insight:** This drop-off is driven by latency expectation mismatch. Users expect immediate results; processing can take 30–90 seconds for real integrations. A progress animation ("Analyzing your data...") and a "Ready!" notification would reduce abandonment.

**Improvement headroom:** High. Primarily a UX communication problem, not a data problem.

---

### Stage 4: First Recommendation Seen → First Approval Submitted

**Estimated conversion:** 45–65%

**What happens here:** User sees the first recommendation or signal and decides whether to act on it. Approval submission requires understanding the approval workflow.

**Known drop-off causes:**
- Approval workflow CTA is not obviously visible on first signal view
- Users who see a recommendation but don't understand what "approve" means vs "escalate" vs "dismiss" do not act
- No in-context help explaining the consequence of each action (Audit Finding 6)
- Executive Viewer role users cannot submit approvals — they see recommendations but have no action available
- Signal cards do not prominently call out "Action Required" for actionable items

**Key insight:** This is the most consequential drop-off for demonstrating the platform's governance value. Users who do not submit a first approval never experience the proof chain, decision replay, or policy engine — the core differentiators.

**Improvement headroom:** High. Inline guidance on the signal card + clearer CTA hierarchy could recover significant conversion here.

---

### Stage 5: First Approval Submitted → First Outcome Verified

**Estimated conversion:** 75–85%

**What happens here:** Once an approval is submitted, the platform should automatically record the outcome in the proof chain. This step is largely automated.

**Known drop-off causes:**
- Proof chain entry creation fails silently if the associated signal is missing required fields
- Users are not shown confirmation that their action was recorded — the proof chain is not surfaced post-approval
- Outcome verification is not clearly communicated as a milestone ("Your first decision is now in the proof chain")

**Key insight:** This stage is mostly automated and should have high conversion. The main gap is confirmation UI — users don't know the outcome was verified.

**Improvement headroom:** Medium. Primarily a confirmation messaging gap.

---

### Stage 6: First Outcome Verified → Onboarding Completed

**Estimated conversion:** 35–55%

**What happens here:** User completes the `GuidedSetupChecklist` (or `OnboardingChecklist`) all items and the `onboarding_completed` event fires.

**Known drop-off causes:**
- Checklist state is in localStorage — users who switch devices lose progress and often don't re-engage
- Checklist items beyond "first outcome" (e.g., "Invite a teammate", "Connect a second integration") are unclear in value
- No celebration / completion moment to motivate completing all checklist items
- Checklist is dismissible before completion — significant number of users dismiss early

**Key insight:** Onboarding completion is a lagging milestone — it is the signal that a user has fully understood and used the platform. However, it should not be treated as the primary activation signal. `first_outcome_verified` is the more predictive metric.

**Improvement headroom:** Medium. Improved checklist copy and server-side state persistence (Audit Finding 2) would help.

---

## Funnel by Domain Pack (Estimated)

| Domain Pack | Data Connection Difficulty | Est. Stage 2→3 Conversion | Primary Friction |
|---|---|---|---|
| Cyber (Sentra) | Medium (SIEM/EDR integration) | ~65% | Integration auth failure |
| Maritime (Vessels) | High (AIS feed provisioning) | ~50% | Technical data source setup |
| Legal (Counsel) | Low (document upload) | ~80% | Upload UI clarity |
| Real Estate (Terra) | Low (market selection) | ~78% | Empty state, no seed data in standard flow |
| Advisory (Lyte) | Medium (data schema mapping) | ~60% | CSV schema mismatch |

---

## Role-Based Funnel Differences (Estimated)

| Role | TTFV Estimate | Primary Drop-Off Stage | Specific Issue |
|---|---|---|---|
| Admin | 8–15 min | Stage 2 (data connection) | Must configure integrations before value |
| Operator / Analyst | 5–10 min | Stage 4 (approval) | Unclear CTA hierarchy on signal cards |
| Executive Viewer | N/A | Stage 4 | Cannot submit approvals — no action available |
| Design Partner (Pilot) | 3–7 min | Negligible | Forge wizard is well-designed; seed data available |

**Executive Viewer gap:** This is a structural issue. Viewers see recommendations but have no action available, so they cannot reach `first_approval_submitted`. For this role, the first value moment should be redefined as `first_briefing_viewed` (Pulse executive briefing), not `first_approval_submitted`.

---

## Known Data Gaps

The following funnel questions cannot currently be answered without lifecycle event instrumentation:

| Question | Blocking Event |
|---|---|
| How long do users spend on the data connection step? | `first_data_connected` (not yet emitted) |
| What % of users who see a recommendation act on it? | `first_recommendation_seen` (not yet emitted) |
| What is median TTFV by domain pack? | `first_recommendation_seen` (not yet emitted) |
| What % of Forge wizard users reach first outcome? | Standard lifecycle events not emitted by Forge |
| What is 7-day activation rate today? | `first_outcome_verified` (not yet emitted) |

All of the above require the lifecycle events defined in `ANALYTICS-EVENTS.md` to be live-instrumented.

---

## Immediate Actions (Highest ROI)

1. **Instrument all 7 lifecycle events** — without this, funnel data is estimated and unactionable
2. **Add seed data option to standard onboarding** — this single change would significantly improve Stage 2→3 conversion
3. **Add "Action Required" badge to signal cards** — directly improves Stage 4→5 conversion
4. **Define "first value" for Executive Viewer role** — `first_briefing_viewed` instead of `first_approval_submitted`
5. **Add "Your first decision is in the proof chain" confirmation screen** — closes the Stage 5→6 gap

---

## Related Documents

- `docs/ONBOARDING_ARCHITECTURE.md` — Stage definitions and system design
- `docs/ACTIVATION_METRICS.md` — Metric definitions and measurement methodology
- `ONBOARDING_AUDIT.md` — Detailed UX friction findings by surface
- `docs/ONBOARDING_EXPERIMENT_BACKLOG.md` — Experiments to improve funnel conversion
- `ANALYTICS-EVENTS.md` — Lifecycle event definitions required for quantitative funnel measurement

# SZL Holdings — Onboarding UX Audit

**Audited:** April 2026
**Scope:** SZL Holdings Dashboard (`/`), Command Portal (`/command`), domain pack entry points
**Method:** Code inspection, flow walkthrough, empty state and CTA analysis

---

## Executive Summary

The platform has meaningful onboarding infrastructure — a multi-step org setup wizard, a pilot/design-partner forge wizard, an `OnboardingChecklist` component, and a `useActivationState` hook. However, significant friction remains between the registration moment and the first value delivery. Key issues cluster around: (1) disconnected activation state between client and server, (2) missing empty states in domain dashboards, (3) unclear CTAs at decision points, and (4) no inline help where users most commonly stall.

**Overall activation friction rating: HIGH**

---

## Finding 1: Empty States Are Generic or Missing

### Severity: High

**Observation:** Several domain dashboards show no data on first load and either render a blank panel or a generic "No data found" message without a clear next action.

**Affected surfaces:**
- Lyte signals dashboard: blank table on first load, no CTA to connect a data source
- Terra opportunities: no empty state illustration or "Add your first market" prompt
- Vessels alerts: renders an empty table with column headers — no context-setting text

**Expected behavior:** Every empty state should include:
1. An illustration or icon appropriate to the domain
2. A one-sentence explanation of why it's empty ("You haven't connected a data source yet")
3. A single primary CTA ("Connect a data source" or "Load sample data")
4. A secondary help link ("How does this work?")

**Reference component:** `packages/design-system/src/feedback/EmptyState.tsx` exists but is inconsistently applied across domain dashboards.

**Recommended fix:** Audit all domain dashboard pages for first-load state. Apply `EmptyState` with domain-specific copy and direct-action CTAs. Prioritize Lyte, Terra, and Vessels.

---

## Finding 2: Onboarding Checklist State Is Stored Only in localStorage

### Severity: High

**Observation:** The `OnboardingChecklist` component in `lib/shared-ui/src/onboarding/onboarding-checklist.tsx` persists all state (completed items, dismissed flag) exclusively in `localStorage` under `szl_onboarding_checklist_dismissed`. The `useActivationState` hook partially reads from the API but falls back to localStorage for `teamMemberInvited`.

**Impact:**
- Progress is lost if a user switches browsers, clears storage, or accesses from a different device
- Team admins cannot see whether other team members have completed onboarding
- Analytics cannot reliably attribute drop-off to specific steps because client state is unverified

**Recommended fix:** Migrate checklist completion state to the server-side `onboarding_wizard_state` table. The route `/api/onboarding/wizard/:orgSlug` already exists. The `GuidedSetupChecklist` component scaffolded in this task uses server state.

---

## Finding 3: No Onboarding State Visible in Command Portal

### Severity: High

**Observation:** The Command portal (`artifacts/command`) has a marketing-style onboarding page (`artifacts/command/src/pages/marketing/onboarding.tsx`) that shows module activation checkboxes, but does not surface a persistent onboarding checklist or progress indicator in the main portal UI after setup.

**Impact:** Users who complete the setup wizard and enter the Command portal have no visual reminder of remaining activation steps. The "Launch Checklist" is only shown on the final wizard screen — not persistently in the portal.

**Recommended fix:** Embed `GuidedSetupChecklist` in the Command portal sidebar or as a top-of-page banner for users who have not yet reached `first_outcome_verified`.

---

## Finding 4: First Recommendation Step Has No Guided Path

### Severity: High

**Observation:** After workspace creation and (optionally) data connection, there is no guided path that leads the user to the first recommendation. Users who skip the tour are left to navigate domain dashboards independently.

**Impact:** `first_recommendation_seen` conversion rate is likely suppressed because users do not know where to look for their first intelligence output.

**Recommended fix:** After `first_data_connected` fires, show an inline contextual prompt: "Your first [domain] analysis is ready — [View results →]". This should appear in the notification bar or as an overlay on the relevant domain dashboard.

---

## Finding 5: Loading States Are Inconsistent

### Severity: Medium

**Observation:** Data-fetching loading states vary across domain dashboards:
- Sentra uses skeleton loaders (good)
- Terra shows a full-page spinner without context ("Loading...")
- Lyte shows a spinner overlaid on empty table headers, which looks like an error
- Vessels shows nothing during initial fetch (blank panel for 1–3 seconds)

**Impact:** Inconsistent loading states create uncertainty about whether the platform is working. Users who see a 2–3 second blank panel may assume something is broken and abandon.

**Recommended fix:** Standardize all domain dashboard loading states using the skeleton loader pattern established in Sentra. Apply table-row skeletons to tabular views and card skeletons to card-based views.

---

## Finding 6: No In-Context Help at Friction Points

### Severity: Medium

**Observation:** The `HelpTip` component exists in `lib/shared-ui/src/onboarding/help-tip.tsx` but is used sparingly and not at the points where users most commonly stall:
- Data source connection form: no help explaining what credentials are needed
- Domain pack activation: no tooltip explaining what each pack does
- Approval workflow: no explanation of what "approve" means vs "escalate"

**Impact:** Users who hit ambiguity at these steps either rely on external documentation or abandon without converting.

**Recommended fix:** Add `HelpTip` instances at the three highest-friction steps:
1. Integration connection form (per integration type)
2. Domain pack selection screen (explain each pack in 1–2 sentences)
3. First approval action (explain the approval consequence)

---

## Finding 7: Team Invitation CTA Is Buried in Setup

### Severity: Medium

**Observation:** Team invitations are Step 2 of the main onboarding wizard but do not appear in the ongoing `OnboardingChecklist`. Users who skip Step 2 receive no follow-up prompt to invite teammates.

**Impact:** `teamMemberInvited` is one of the weakest activation signals, suggesting most users are not completing it. Solo activation limits the platform's team-collaboration value.

**Recommended fix:** Add "Invite a teammate" as a persistent checklist item in `GuidedSetupChecklist` that does not disappear until at least one invitation is sent. Surface a nudge banner 48 hours post-signup for solo users.

---

## Finding 8: The Pilot / Design Partner Flow Is Disconnected from Core Analytics

### Severity: Medium

**Observation:** The Forge wizard (`artifacts/szl-holdings/src/alloy/pages/pilot-onboarding.tsx`) is a specialized onboarding path for design partners. However, it does not emit the standard lifecycle events (`signup_completed`, `workspace_created`, etc.) — it emits custom pilot-specific events that are not captured in the main funnel analytics.

**Impact:** Design partner activation cannot be compared against standard user activation. Pilot cohort drop-off is invisible in the standard funnel report.

**Recommended fix:** Emit standard lifecycle events from the Forge wizard in addition to any custom pilot events. Use `onboarding_variant: "forge"` in the event payload to allow filtering without breaking funnel aggregation.

---

## Finding 9: No CTA Clarity on What "First Value" Looks Like

### Severity: Medium

**Observation:** The onboarding wizard explains how to set up the platform but does not show users what a finished, valuable session looks like. There is no preview of what a recommendation, signal, or proof chain entry looks like before the user completes setup.

**Impact:** Users do not have a clear mental model of the outcome they are working toward, reducing motivation to complete setup steps.

**Recommended fix:** Add a "Here's what you'll see" preview step to the onboarding wizard (can be a screenshot or animated illustration). Show a realistic example for the selected domain pack.

---

## Finding 10: Azure Tenant Onboarding Has No Fallback for Provisioning Failures

### Severity: Low

**Observation:** The Azure tenant onboarding flow (`artifacts/szl-holdings/src/pages/azure-tenant-onboarding.tsx`) has three steps: register tenant, grant admin consent, configure SCIM. If admin consent fails (user is not an AAD Global Admin), the flow shows a generic error and does not provide a recovery path.

**Impact:** Enterprise users attempting the Azure SSO flow without full AAD admin rights are left stuck with no guidance on how to proceed.

**Recommended fix:** On admin consent failure, show a dedicated error screen with: (1) explanation of why it failed, (2) instructions to re-attempt with a Global Admin account, (3) alternative option to proceed without SSO for now.

---

## Summary Table

| Finding | Severity | Affected Surface | Effort |
|---|---|---|---|
| 1. Generic/missing empty states | High | Terra, Lyte, Vessels | Medium |
| 2. Checklist state in localStorage only | High | All dashboards | Medium |
| 3. No persistent checklist in Command portal | High | Command | Low |
| 4. No guided path to first recommendation | High | All domains | Medium |
| 5. Inconsistent loading states | Medium | Terra, Lyte, Vessels | Medium |
| 6. No in-context help at friction points | Medium | Integrations, Approval | Low |
| 7. Team invitation CTA buried | Medium | All | Low |
| 8. Forge wizard not emitting standard events | Medium | Pilot flow | Low |
| 9. No "first value" preview in wizard | Medium | Setup wizard | High |
| 10. Azure SSO failure has no recovery path | Low | Azure onboarding | Low |

---

## Recommended Priority Order

1. Finding 3 (persistent checklist in Command) — lowest effort, highest impact on funnel visibility
2. Finding 6 (in-context help) — low effort, reduces support load
3. Finding 7 (team invite CTA) — low effort, directly improves team activation
4. Finding 8 (Forge events) — low effort, restores measurement integrity for pilot cohort
5. Finding 1 (empty states) — medium effort, critical for domain pack adoption
6. Finding 4 (guided path to first recommendation) — medium effort, directly improves TTFV
7. Finding 5 (loading state consistency) — medium effort, reduces perceived reliability issues
8. Finding 2 (server-side checklist state) — medium effort, required for multi-device and team visibility
9. Finding 10 (Azure SSO recovery) — low effort, reduces enterprise onboarding escalations
10. Finding 9 (first value preview) — high effort, high potential impact

---

*This audit represents findings from static code and flow analysis. Quantitative validation requires live funnel event data once the lifecycle events defined in `ANALYTICS-EVENTS.md` are instrumented.*

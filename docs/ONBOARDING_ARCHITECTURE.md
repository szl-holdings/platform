# SZL Holdings — Onboarding System Architecture

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Purpose

This document defines the onboarding system architecture for the SZL Holdings platform. Onboarding is treated as a measurable activation system — not a UX formality. Every step maps to a lifecycle event, a funnel stage, and a business outcome signal. The goal is to minimize time-to-first-value (TTFV) while maximizing 7-day activation rate across all user roles and domain packs.

---

## Onboarding Stages

The platform onboarding system operates across four sequential stages:

### Stage 1: Registration & Identity
**Goal:** Establish the user's identity and organizational context.

| Step | Action | Success Signal |
|---|---|---|
| 1.1 | Account creation (email + SSO) | `signup_completed` event emitted |
| 1.2 | Organization profile set up | Org slug, name, domain saved |
| 1.3 | Role selected (Admin / Member / Viewer) | Role assigned in auth context |
| 1.4 | Team invitations sent (optional) | At least one invitation sent |

**Exit criteria:** User has a confirmed account with an organization context and assigned role.

---

### Stage 2: Workspace Configuration
**Goal:** Connect the workspace to at least one data source or domain pack.

| Step | Action | Success Signal |
|---|---|---|
| 2.1 | Workspace created | `workspace_created` event emitted |
| 2.2 | Domain pack activated (Cyber, Maritime, Legal, Real Estate, Advisory) | Domain module enabled |
| 2.3 | First data source connected (API, integration, or seed data) | `first_data_connected` event emitted |
| 2.4 | Notification preferences configured | At least one channel enabled |

**Exit criteria:** Workspace has at least one domain pack active with data flowing.

---

### Stage 3: First Value Delivery
**Goal:** Surface a genuine platform intelligence output before the user closes the session.

| Step | Action | Success Signal |
|---|---|---|
| 3.1 | First signal or recommendation generated | `first_recommendation_seen` event emitted |
| 3.2 | User reviews the recommendation | Time-on-page ≥ 15 seconds |
| 3.3 | User submits first approval or action | `first_approval_submitted` event emitted |
| 3.4 | Outcome recorded in the proof chain | `first_outcome_verified` event emitted |

**Exit criteria:** User has seen, evaluated, and acted on at least one platform recommendation.

---

### Stage 4: Habit Formation
**Goal:** Return engagement within 7 days, establishing the daily-use pattern.

| Step | Action | Success Signal |
|---|---|---|
| 4.1 | Onboarding checklist completed | `onboarding_completed` event emitted |
| 4.2 | Second session within 48 hours | Session event with `return_visit: true` |
| 4.3 | Signal reviewed without prompting | Organic navigation to signal dashboard |
| 4.4 | Team member also activates | Team activation rate ≥ 1 additional user |

**Exit criteria:** User returns to the platform within 7 days and reviews content independently.

---

## Role-Based Onboarding Variants

Different user roles have different activation paths and first-value moments.

### Admin (Workspace Owner)
- **Primary concern:** Platform configuration, team setup, integration connectivity
- **First value moment:** First workflow executed and governance trail visible
- **Checklist emphasis:** Integrations → Team invites → Domain pack configuration
- **Variant trigger:** Role = `admin` at registration

### Operator / Analyst
- **Primary concern:** Signal review, action triage, decision-making
- **First value moment:** First recommendation reviewed with evidence bundle
- **Checklist emphasis:** Approval queue → Signal dashboard → Proof chain access
- **Variant trigger:** Role = `member` at registration

### Executive Viewer
- **Primary concern:** Portfolio-level intelligence, risk summary, board-ready output
- **First value moment:** First Pulse briefing or risk dashboard loaded with real data
- **Checklist emphasis:** Pulse setup → Portfolio view → Executive brief access
- **Variant trigger:** Role = `viewer` at registration

### Design Partner / Pilot
- **Primary concern:** Validating the platform against real use cases with minimal friction
- **First value moment:** First workflow executed with seeded demo data
- **Checklist emphasis:** Seed data → First workflow run → Feedback capture
- **Variant trigger:** `pilot_onboarding` flag set at org creation (Forge wizard)

---

## Instrumentation Architecture

### Event Emission Points

| Stage | Event | Emitter | Transport |
|---|---|---|---|
| Registration | `signup_completed` | Auth service | `POST /api/telemetry/events` |
| Workspace | `workspace_created` | Onboarding API | `POST /api/telemetry/events` |
| Data connection | `first_data_connected` | Integration controller | `POST /api/telemetry/events` |
| Intelligence | `first_recommendation_seen` | Signal UI (frontend) | `POST /api/analytics/event` |
| Action | `first_approval_submitted` | Approval service | `POST /api/telemetry/events` |
| Outcome | `first_outcome_verified` | Proof chain service | `POST /api/telemetry/events` |
| Completion | `onboarding_completed` | Onboarding API | `POST /api/telemetry/events` |

### Analytics Storage

Events are stored in the `dos_analytics_events` table as JSONB metadata rows. The base schema defined in `docs/EVENT_SCHEMA.md` applies. Onboarding events use `event_category: "business"` and `domain: "system"`.

### Frontend Hook Integration

The `useOnboardingAnalytics` hook in `lib/shared-ui/src/onboarding/use-onboarding-analytics.ts` handles tour and checklist events. Lifecycle events (signup, workspace, first value) are emitted server-side or via the `GuidedSetupChecklist` component's built-in event emission.

---

## Component Architecture

### GuidedSetupChecklist
Located at: `lib/shared-ui/src/onboarding/guided-setup-checklist.tsx`

A server-state-aware checklist that:
- Fetches real activation state from the API (`/api/onboarding/activation-state`)
- Emits lifecycle events on step completion
- Adapts checklist items based on role variant
- Persists completion state server-side, not just in localStorage
- Can be embedded in the Command portal sidebar or domain dashboard headers

### OnboardingChecklist (legacy)
Located at: `lib/shared-ui/src/onboarding/onboarding-checklist.tsx`

The original localStorage-based checklist. Continues to function for non-critical progress tracking. To be migrated to `GuidedSetupChecklist` in the Command portal.

---

## Success Criteria

| Metric | Target | Measurement Window |
|---|---|---|
| Time to first recommendation seen | < 8 minutes from signup | Per session |
| Stage 1 → Stage 2 conversion | > 85% | 24 hours post signup |
| Stage 2 → Stage 3 conversion | > 60% | 48 hours post signup |
| 7-day activation rate | > 45% | Cohort week |
| Onboarding completion rate | > 35% | 14 days post signup |
| Drop-off at data connection step | < 30% | At step 2.3 |

---

## Onboarding State Storage

Onboarding progress is stored server-side in the `onboarding_wizard_state` table, accessed via `/api/onboarding/wizard/:orgSlug`. This ensures:
- Progress survives browser sessions and device switches
- Admins can reset flow via `/api/onboarding/wizard/:orgSlug/reset`
- Analytics can attribute funnel position to server-confirmed state, not self-reported client state

---

## Related Documents

- `docs/ACTIVATION_METRICS.md` — KPI definitions and measurement methodology
- `docs/FIRST_VALUE_PATH.md` — Fastest path to first value per domain pack
- `docs/ONBOARDING_EXPERIMENT_BACKLOG.md` — Prioritized A/B experiments
- `ONBOARDING_AUDIT.md` — Current UX gaps and friction findings
- `ACTIVATION_FUNNEL_REPORT.md` — Current funnel shape and known drop-off points
- `ANALYTICS-EVENTS.md` — Full event taxonomy including lifecycle events
- `docs/EVENT_SCHEMA.md` — Canonical base event schema

---

*Onboarding is not a UX feature — it is a revenue activation system. Every drop-off between stages represents a customer who did not reach their first value moment and is therefore at elevated churn risk.*

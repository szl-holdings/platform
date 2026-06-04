# Analytics Event Taxonomy

**Owner:** Product / Engineering  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This document defines the canonical set of analytics events tracked across the SZL Holdings platform. All events follow a consistent schema. No vanity metrics are tracked. Every event must answer a specific product or business question.

---

## Event Schema

Every event shares this base structure:

```typescript
{
  event: string;           // snake_case event name
  timestamp: string;       // ISO 8601
  userId?: string;         // authenticated user identifier (omit for anonymous)
  sessionId?: string;      // session identifier
  platform: string;        // "lyte" | "aegis" | "terra" | "vessels" | "carlota_jo" | "admin" | "api"
  environment: string;     // "production" | "staging" | "development"
  properties: Record<string, unknown>; // event-specific properties (see below)
}
```

---

## Core Events

### Authentication

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `user_signed_up` | New user account created | `method`, `role`, `inviteSource` | How many new users are joining? What acquisition channels are working? |
| `user_logged_in` | Successful login | `method` (`oidc`), `platform` | Are users returning? What is session frequency? |
| `user_login_failed` | Failed authentication attempt | `reason`, `platform` | Are there credential stuffing or brute force patterns? |
| `user_logged_out` | Explicit logout | `sessionDuration` | Session health |
| `session_expired` | Session timed out | `sessionAge` | Are session lengths appropriate? |
| `password_reset_requested` | Forgot password flow | — | |

---

### Dashboard & Navigation

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `dashboard_viewed` | User loads primary dashboard | `platform`, `dashboardId`, `loadTimeMs` | Which dashboards are most used? |
| `page_viewed` | Navigation to any page | `platform`, `page`, `referrer` | What is the navigation pattern? |
| `search_executed` | User runs a search | `platform`, `query` (anonymized), `resultCount` | What are users searching for? |
| `filter_applied` | User applies a filter on a list view | `platform`, `filterType`, `filterValue` | How are users narrowing data? |

---

### Signals & Alerts (Lyte / Aegis / Terra / Vessels)

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `signal_viewed` | User opens a signal detail | `platform`, `signalId`, `signalType`, `severity` | Are signals being acted on? |
| `signal_dismissed` | User dismisses a signal | `platform`, `signalId`, `reason` | What signals are noise? |
| `signal_escalated` | Signal escalated to incident | `platform`, `signalId`, `fromSeverity`, `toSeverity` | Escalation rate by signal type |
| `alert_acknowledged` | Alert acknowledged in alert center | `platform`, `alertId`, `latencyMs` (time to ack) | Alert response times |
| `alert_config_changed` | Alert threshold or rule updated | `platform`, `configType` | Configuration change frequency |

---

### Workflow & Actions (Alloy)

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `action_created` | User or agent creates an action | `actionType`, `domain`, `source` (`agent` | `human`) | How many actions originate from agents vs humans? |
| `action_approved` | Human approves a pending action | `actionId`, `actionType`, `approvalLatencyMs` | Approval latency by action type |
| `action_rejected` | Human rejects a pending action | `actionId`, `actionType`, `reason` | Rejection rate by type — signal of agent quality |
| `workflow_started` | Workflow execution begins | `workflowId`, `workflowType`, `triggeredBy` | Workflow usage patterns |
| `workflow_completed` | Workflow finishes successfully | `workflowId`, `durationMs` | Workflow performance |
| `workflow_failed` | Workflow errors out | `workflowId`, `errorType` | Workflow reliability |
| `approval_decision` | Any approval gate resolved | `actionId`, `decision` (`approved` | `rejected`), `approver`, `latencyMs` | Approval funnel analysis |

---

### Billing & Revenue

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `subscription_started` | New subscription activated | `planId`, `planName`, `amount`, `currency` | Revenue activation rate |
| `subscription_upgraded` | Plan upgrade | `fromPlan`, `toPlan`, `reason` | Upgrade drivers |
| `subscription_downgraded` | Plan downgrade | `fromPlan`, `toPlan`, `reason` | Churn risk signals |
| `subscription_cancelled` | Cancellation initiated | `planId`, `reason`, `daysActive` | Churn analysis |
| `payment_succeeded` | Stripe payment intent succeeded | `amount`, `currency`, `planId` | Revenue events |
| `payment_failed` | Stripe payment intent failed | `amount`, `errorCode`, `retryCount` | Payment failure rates |
| `invoice_generated` | Invoice created | `amount`, `billingPeriod` | Billing cycle health |
| `trial_started` | Free trial begins | `planId`, `trialDays` | Trial conversion funnel entry |
| `trial_converted` | Trial converts to paid | `planId`, `trialDurationDays` | Trial-to-paid conversion rate |

---

### Contact & Growth

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `contact_form_submitted` | Contact form completed | `source` (`szl_site` | `carlota_jo` | `stephen_site`), `type` | Lead generation by source |
| `demo_requested` | Demo request form submitted | `platform`, `companySize`, `source` | Demo funnel entry |
| `demo_scheduled` | Demo confirmed on calendar | `platform`, `demoDate` | Demo conversion from request |
| `demo_completed` | Demo marked as delivered | `platform`, `outcome` | Demo-to-pilot conversion |

---

### AI & Intelligence

| Event Name | Trigger | Key Properties | Business Question |
|------------|---------|---------------|-------------------|
| `ai_inference_called` | Any AI model invoked | `model`, `provider`, `latencyMs`, `tokenCount`, `success` | AI usage and cost trends |
| `ai_recommendation_shown` | AI recommendation displayed to user | `platform`, `recommendationType`, `confidence` | Recommendation exposure rate |
| `ai_recommendation_acted_on` | User acts on an AI recommendation | `platform`, `recommendationType`, `actionTaken` | Recommendation acceptance rate |
| `ai_provider_failure` | AI provider returns error | `provider`, `model`, `errorType`, `retryCount` | Provider reliability |

---

## Anti-Patterns (Explicitly Excluded)

The following are **not** tracked as analytics events:

- Page load counts for pages no one reviews (vanity page views)
- "Impressions" or "renders" without meaningful user intent
- Internal admin operations (these belong in the audit log, not analytics)
- Raw API call counts (these belong in telemetry/APM)
- Personally identifiable information (PII) as event properties

---

## Implementation Notes

### Current Instrumentation

Events are currently recorded via `serverTelemetry.recordBusinessEvent()` in `@workspace/observability`. The event bus (`lib/event-bus.ts`) is used for domain events that may trigger analytics.

For frontend events, the Lyte web app instruments the key flows listed above using the analytics hook pattern.

### Recommended Next Steps

1. Introduce a unified analytics client (`lib/analytics/`) that wraps `serverTelemetry.recordBusinessEvent()` and enforces the schema above
2. Wire frontend events through a lightweight analytics call (no third-party trackers required — post to `/api/analytics/event` for server-side storage)
3. Build a simple event log table in PostgreSQL for querying events without a third-party analytics service

---

## Review Schedule

This taxonomy is reviewed quarterly. New features require new events to be documented here before instrumentation is added to the codebase.

---

*See also: [Incident Response Runbook](../ops/incident-response-runbook.md) · [Release Governance](../../releases/release-governance.md)*

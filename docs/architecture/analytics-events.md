# Analytics Events — SZL Holdings Platform

**Date:** April 2026 | **Audience:** Product, engineering, growth, and data teams

**Related:** [PRODUCT-SURFACES.md](../product/product-surfaces.md) · [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md)

---

## Overview

This document defines the canonical analytics event taxonomy for the SZL Holdings platform. It consolidates and extends the existing `EVENT_TAXONOMY.md` with implementation context, tool configuration, and funnel definitions.

**Source files:** `EVENT_TAXONOMY.md` · `ANALYTICS_PLAN.md`

---

## Analytics Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Google Analytics 4 | Page views, sessions, traffic attribution | Configured |
| PostHog | Custom event tracking, funnels, session recordings | Planned |

**Environment variables:**
- `VITE_GA_MEASUREMENT_ID` — Google Analytics Measurement ID
- `VITE_POSTHOG_KEY` — PostHog project key

---

## Naming Convention

All events follow `{object}_{action}` pattern — lowercase with underscores, max 3 words.

```typescript
trackEvent('cta_clicked', {
  cta_label: 'Request Demo',
  cta_location: 'hero',
  page_path: window.location.pathname,
});
```

The `trackEvent` wrapper handles: consent gate check, null-checking, dev-mode suppression, and batching.

---

## Event Registry

### Navigation & Engagement

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `page_viewed` | Page load / route change | `page_path`, `page_title`, `referrer` | High |
| `section_scrolled` | User scrolls into named section | `section_id`, `page_path` | Medium |
| `scroll_depth_reached` | User hits 25% / 50% / 75% / 100% scroll | `depth_pct`, `page_path` | Medium |
| `external_link_clicked` | Click on external link | `link_url`, `link_label`, `page_path` | Low |

---

### CTA Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `cta_clicked` | Any CTA button or link | `cta_label`, `cta_variant`, `cta_location`, `page_path` | **Critical** |
| `demo_requested` | Demo request form submitted | `product`, `form_key`, `source_page` | **Critical** |
| `design_partner_cta` | Design partner CTA clicked | `cta_location`, `page_path` | High |
| `contact_form_started` | User focuses on any form field | `form_key`, `page_path` | Medium |
| `contact_submitted` | Contact form successfully submitted | `form_key`, `inquiry_type`, `page_path` | **Critical** |

**`cta_location` values:** `hero` · `nav` · `footer` · `section_[name]` · `trust_banner` · `pricing_card` · `product_feature`

---

### Product Page Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `product_page_viewed` | Product/solution page load | `product`, `page_variant` | High |
| `product_feature_viewed` | Feature section scrolled into view | `product`, `feature_name` | Medium |
| `product_demo_cta` | "Demo" or "Try" CTA on product page | `product`, `cta_location` | High |
| `solution_trust_visited` | User visits a solution trust page | `product` | High |

**`product` values:** `lyte` · `alloy` · `aegis` · `vessels` · `terra` · `prism_counsel` · `carlota_jo` · `imperium` · `cortex` · `command_portal`

---

### Trust Center Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `trust_center_visited` | User lands on `/trust-center` | `referrer_page`, `referrer_type` | High |
| `trust_section_viewed` | User views a specific trust section | `trust_section`, `time_spent_sec` | High |
| `trust_cta_clicked` | CTA from trust page | `trust_section`, `cta_label` | High |
| `trust_doc_downloaded` | Trust document downloaded | `doc_name`, `trust_section` | Medium |

**`trust_section` values:** `security` · `governance` · `architecture` · `ai_governance` · `approvals` · `operations` · `exports`

---

### Documentation Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `docs_page_viewed` | Any `/docs/*` page | `doc_section`, `doc_page` | Medium |
| `docs_search_performed` | User searches docs | `query`, `results_count` | Medium |
| `api_docs_visited` | OpenAPI / developer docs | `endpoint_viewed` | Low |
| `github_link_clicked` | GitHub repo link from docs | `link_location` | Low |

---

### Investor Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `investor_page_viewed` | Any `/investors/*` page | `investor_section` | High |
| `investor_cta_clicked` | Investment inquiry CTA clicked | `cta_location` | High |
| `data_room_accessed` | `/investors/data-room` visit | — | **Critical** |

---

### Demo & Pipeline Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `demo_flow_started` | User enters a demo experience | `product`, `demo_type`, `source_cta` | **Critical** |
| `demo_completed` | User completes a demo flow | `product`, `demo_type`, `duration_sec` | **Critical** |
| `pilot_inquiry_submitted` | Pilot / design partner form submitted | `product`, `company_type` | **Critical** |

---

## Properties Reference

| Property | Type | Description | Example Values |
|----------|------|-------------|---------------|
| `page_path` | string | URL path of current page | `/lyte`, `/trust/security` |
| `page_title` | string | Page `<title>` | `Lyte — Business Observability` |
| `referrer` | string | Previous page path | `/`, `/lyte` |
| `product` | string | Product identifier | `lyte`, `vessels`, `aegis` |
| `cta_label` | string | Text on the CTA | `Request Demo`, `Explore Lyte` |
| `cta_location` | string | Position on page | `hero`, `nav`, `pricing_card` |
| `form_key` | string | Form identifier | `szl_contact`, `demo_request` |
| `trust_section` | string | Trust page section | `security`, `governance` |
| `doc_section` | string | Docs section | `architecture`, `control-plane` |
| `time_spent_sec` | number | Time in seconds | `45` |
| `depth_pct` | number | Scroll depth % | `25`, `50`, `75`, `100` |
| `company_type` | string | Type of company | `enterprise`, `smb`, `startup` |
| `demo_type` | string | Demo flow type | `product_walkthrough`, `live_demo` |

---

### AI Evaluation & Operations Events

These events are emitted server-side by the AI evaluation layer and MCP gateway. They are not browser analytics events — they feed the AI Ops dashboard and quality monitoring pipeline.

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `ai_trace_captured` | Every AI recommendation captured | `trace_id`, `domain`, `model`, `recommendation_type`, `confidence`, `latency_ms`, `cost_usd`, `risk_level`, `requires_review` | **Critical** |
| `ai_trace_flagged` | Trace auto-escalated to review queue | `trace_id`, `domain`, `review_reason`, `priority`, `confidence`, `risk_level` | High |
| `ai_eval_run` | Evaluator hook executed on a trace | `trace_id`, `hook_id`, `hook_name`, `domain`, `score`, `passed` | High |
| `ai_eval_pass_rate_drop` | Domain eval pass rate drops below threshold | `domain`, `current_pass_rate`, `threshold`, `window_hours` | **Critical** |
| `ai_review_claimed` | Reviewer claims a review queue item | `review_id`, `trace_id`, `domain`, `priority` | Medium |
| `ai_review_decided` | Reviewer records a verdict | `review_id`, `trace_id`, `domain`, `verdict`, `reviewed_by_role` | High |
| `ai_review_escalated` | Review item escalated to team | `review_id`, `trace_id`, `escalated_to`, `domain`, `risk_level` | High |
| `ai_cost_spike` | Per-call cost exceeds alert threshold ($0.50) | `trace_id`, `domain`, `model`, `cost_usd`, `threshold_usd` | High |
| `ai_latency_exceeded` | Recommendation latency exceeds 10s | `trace_id`, `domain`, `model`, `latency_ms`, `budget_ms` | Medium |
| `mcp_tool_invoked` | MCP gateway tool called | `tool_name`, `domain`, `caller_role`, `org_id` (hashed), `latency_ms`, `result_status` | Medium |
| `mcp_tool_denied` | Tool call denied by role/policy check | `tool_name`, `caller_role`, `deny_reason` | High |
| `mcp_approval_queued` | Tool triggered approval workflow | `tool_name`, `workflow_run_id`, `domain`, `caller_role` | High |
| `ai_learning_job_completed` | Outcome Graph calibration job finished | `domain`, `job_type`, `sample_size`, `acceptance_rate`, `calibration_suggestion` | Medium |

**Privacy rules for AI evaluation events:**
- `org_id` is hashed before emission to third-party analytics tools
- No model prompt content is emitted
- `reviewed_by_role` is the role string, not a user ID
- `trace_id` is an opaque identifier — not linkable to user PII externally

---

## Key Business Metrics

| Metric | Definition | Reporting Frequency |
|--------|-----------|---------------------|
| Demo requests | `demo_requested` event count | Weekly (Founder) |
| Contact form submissions | `contact_submitted` event count | Weekly |
| Trust Center visits | Unique sessions on `/trust-center`, `/trust/*` | Monthly |
| Investor page visits | Sessions on `/investors/*` | Monthly |
| Design partner inquiries | `pilot_inquiry_submitted` with `company_type = 'design_partner'` | Monthly |
| Data room accesses | `data_room_accessed` event count | Monthly (Founder, restricted) |
| CTA click-through rate | `cta_clicked` count / `page_viewed` count | Monthly |
| Demo conversion funnel | Step drop-off from `demo_flow_started` → `demo_completed` | Monthly |

---

## Demo Request Funnel

```
Landing Page Visit (page_viewed)
        │
        ▼
Product Page Visit (product_page_viewed)
        │
        ▼
Trust Center / Docs Visit (trust_center_visited / docs_page_viewed)
        │
        ▼
CTA Click (cta_clicked / product_demo_cta)
        │
        ▼
Form Submission (demo_requested)
        │
        ▼
[Offline: qualification call → pilot inquiry → closed deal]
```

Track each step as a named funnel in PostHog to measure step-to-step conversion.

---

## Privacy Rules

1. **No PII.** Never include names, emails, IP addresses, or phone numbers in event properties.
2. **No internal IDs.** Do not pass session IDs or user database IDs to third-party analytics tools.
3. **Consent first.** Analytics events only fire after user consent where required by applicable privacy law (GDPR, CCPA).
4. **Aggregate only.** Analytics provides behavior insights at aggregate level, not individual user tracking.
5. **Data retention.** GA4 retention set to 14 months. PostHog per project configuration.

---

## Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|---------|
| Demo request volume | Weekly | Founder |
| Top pages and CTAs | Monthly | Product + Growth |
| Trust Center engagement | Monthly | Product |
| Funnel conversion rates | Monthly | Founder + Sales |
| Full analytics review | Quarterly | All stakeholders |

---

*See also: [EVENT_TAXONOMY.md](event-taxonomy.md) · [ANALYTICS_PLAN.md](../sales/analytics-plan.md) · [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md) · [LAUNCH_ANALYTICS_PLAN.md](../launch/launch-analytics-plan.md) · [CUSTOMER_HEALTH_MODEL.md](../sales/customer-health-model.md)*

---

*Last verified against source code: 2026-04-16. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes.*

---

## Decision Fabric Events (April 2026)

The Decision Fabric emits the following analytics events. All events carry
`orgId`, `correlationId`, and `domain` when known.

### Substrate

| Event | When | Properties |
|-------|------|------------|
| `fabric.correlation.linked` | `POST /decision-fabric/correlations/link` | `primitive`, `primitiveId`, `entityType`, `entityId`, `workflowRunId` |
| `fabric.decision.recorded` | `POST /decision-fabric/decisions` | `decisionId`, `entityType`, `entityId`, `recommendationId`, `policyVersionId`, `simulationSnapshotId`, `status` |
| `fabric.decision.actualRecorded` | `POST /decision-fabric/decisions/:id/actual-outcome` | `decisionId`, `predictionError`, `status` |
| `fabric.policy.snapshot.captured` | `POST /decision-fabric/policy-snapshots` | `policyId`, `version`, `effect` |
| `fabric.simulation.snapshot.captured` | `POST /decision-fabric/simulation-snapshots` | `scenarioId`, `iterations`, `seed` |

### Surfaces

| Event | When | Properties |
|-------|------|------------|
| `fabric.workflow360.viewed` | `GET /decision-fabric/workflows/:runId/360` | `workflowRunId`, `eventCount`, `primitivesTouched` |
| `fabric.entity.investigated` | `GET /decision-fabric/entities/:type/:id/investigation` | `entityType`, `entityId`, `eventCount`, `decisionCount` |
| `fabric.recommendation.traced` | `GET /decision-fabric/recommendations/:id/trace` | `recommendationId`, `decisionCount`, `eventCount` |
| `fabric.bottlenecks.viewed` | `GET /decision-fabric/approvals/bottlenecks` | `groups`, `topActionClass` |
| `fabric.policy.failures.viewed` | `GET /decision-fabric/policies/failures` | `topPolicyName`, `denialCount` |
| `fabric.predictions.drift.viewed` | `GET /decision-fabric/predictions/drift` | `topRecommendationId`, `maxAbsError` |

### Pattern engine & learning

| Event | When | Properties |
|-------|------|------------|
| `fabric.playbook.generated` | `POST /decision-fabric/playbooks/generate` | `count`, `domain`, `windowDays` |
| `fabric.playbook.reviewed` | `POST /decision-fabric/playbooks/:id/review` | `playbookId`, `status`, `promotedWorkflowId` |
| `fabric.learning.cycleRun` | `POST /decision-fabric/learning/run` | `jobId`, `domainsScored`, `windowDays` |

These events are intended for the existing analytics pipeline; instrumentation
ships as part of Phase 9 (UX Premiumization) and is captured here to lock
the contract.

---

## Launch Event Taxonomy (April 2026)

The following event categories are required for launch analytics coverage. These events feed [LAUNCH_ANALYTICS_PLAN.md](../launch/launch-analytics-plan.md) and [CUSTOMER_HEALTH_MODEL.md](../sales/customer-health-model.md).

### Activation & Onboarding Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `user_signup_started` | User begins registration / org creation flow | `signup_method`, `referrer_source` | **Critical** |
| `user_signup_completed` | Org and first user successfully created | `org_id` (hashed), `signup_method`, `plan_tier` | **Critical** |
| `onboarding_step_completed` | User completes one of 4 onboarding wizard steps | `step_number` (1–4), `step_name`, `org_id` (hashed), `time_spent_sec` | **Critical** |
| `onboarding_completed` | All 4 onboarding steps complete | `org_id` (hashed), `plan_tier`, `total_time_sec` | **Critical** |
| `onboarding_abandoned` | User exits onboarding before completing | `last_step_completed`, `org_id` (hashed), `time_in_flow_sec` | High |
| `first_governed_decision` | First AI-governed decision in new org | `org_id` (hashed), `domain`, `hours_since_signup` | **Critical** |
| `sso_configured` | Enterprise SSO configured for org | `org_id` (hashed), `sso_provider`, `scim_enabled` | High |
| `domain_pack_installed` | First AI domain pack configured | `org_id` (hashed), `domain_pack`, `pack_count` | High |
| `tenant_activated` | Org reaches activation milestone (first governed decision ≤ 72h) | `org_id` (hashed), `activation_hours`, `plan_tier` | **Critical** |

**Privacy rules:** `org_id` is always hashed before emission. No user PII included.

---

### Workflow Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `workflow_started` | User initiates a governed workflow | `workflow_type`, `domain`, `org_id` (hashed) | High |
| `workflow_step_completed` | Individual step in workflow completed | `workflow_type`, `step_name`, `domain`, `time_spent_sec` | Medium |
| `workflow_completed` | Workflow reaches terminal success state | `workflow_type`, `domain`, `total_duration_sec`, `org_id` (hashed) | **Critical** |
| `workflow_abandoned` | Workflow exited before terminal state | `workflow_type`, `domain`, `last_step`, `org_id` (hashed) | High |
| `workflow_ai_assist_used` | User invokes AI assistance within a workflow | `workflow_type`, `domain`, `assist_type` | Medium |

---

### Approval Cycle Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `approval_requested` | Approval workflow triggered | `approval_type`, `domain`, `org_id` (hashed), `requester_role` | High |
| `approval_cycle_completed` | Approval decision recorded (approved or denied) | `approval_type`, `domain`, `verdict`, `cycle_time_sec`, `auto_approved` | **Critical** |
| `approval_escalated` | Approval escalated beyond first approver | `approval_type`, `domain`, `org_id` (hashed), `escalation_reason` | High |
| `approval_bottleneck_triggered` | Approval exceeds 24-hour threshold | `approval_type`, `domain`, `hours_pending` | High |
| `approval_policy_denied` | Action blocked by policy check | `policy_name`, `domain`, `denied_action`, `org_id` (hashed) | High |

---

### Support & Feedback Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `support_ticket_created` | User opens a support request | `ticket_category`, `product_area`, `plan_tier` | High |
| `support_ticket_resolved` | Support ticket closed | `ticket_category`, `resolution_time_sec`, `resolution_type` | High |
| `help_docs_searched` | User searches in-product help | `query_length`, `results_count`, `page_context` | Medium |
| `help_article_viewed` | User views a help/docs article | `article_id`, `article_section`, `page_context` | Medium |
| `feedback_submitted` | User submits in-product feedback | `feedback_type`, `sentiment`, `product_area` | High |
| `nps_response_recorded` | NPS survey response captured | `nps_score`, `plan_tier`, `org_tenure_days` | High |

**Privacy rules:** No free-text feedback content is emitted to third-party analytics tools.

---

### Error & Incident Events

These events are emitted server-side by the error tracking and monitoring layer.

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `api_error_occurred` | API returns 5xx response | `status_code`, `endpoint`, `domain`, `error_class` | **Critical** |
| `auth_failure` | Authentication or session validation fails | `failure_reason`, `attempt_method` | High |
| `db_query_slow` | Query exceeds `SLOW_QUERY_THRESHOLD_MS` | `query_fingerprint`, `duration_ms`, `table` | High |
| `db_error` | Database query returns error | `error_class`, `query_fingerprint` | **Critical** |
| `ai_provider_unhealthy` | AI provider health check fails | `provider`, `error_type`, `consecutive_failures` | **Critical** |
| `rate_limit_hit` | Client hits API rate limit | `endpoint`, `plan_tier`, `org_id` (hashed) | Medium |
| `incident_opened` | SEV incident formally opened | `severity`, `affected_surface`, `org_count_affected` | **Critical** |
| `incident_resolved` | SEV incident closed | `severity`, `duration_sec`, `root_cause_category` | **Critical** |

---

### Recommendation & Simulation Events

Extends and consolidates the AI evaluation events above with outcome tracking.

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `recommendation_generated` | AI recommendation produced for a user | `domain`, `recommendation_type`, `confidence`, `latency_ms`, `org_id` (hashed) | **Critical** |
| `recommendation_accepted` | User explicitly accepts AI recommendation | `domain`, `recommendation_type`, `confidence`, `time_to_decision_sec` | **Critical** |
| `recommendation_rejected` | User explicitly rejects AI recommendation | `domain`, `recommendation_type`, `rejection_reason_category` | High |
| `recommendation_modified` | User modifies AI recommendation before accepting | `domain`, `modification_scope` | High |
| `simulation_run` | Decision simulation executed | `domain`, `scenario_type`, `iterations`, `org_id` (hashed) | High |
| `simulation_viewed` | User views simulation results | `domain`, `scenario_type`, `result_summary` | Medium |
| `outcome_recorded` | Actual outcome recorded for a governed decision | `domain`, `decision_type`, `prediction_error`, `org_id` (hashed) | **Critical** |
| `learning_cycle_triggered` | Outcome Graph calibration job initiated | `domain`, `sample_size`, `trigger_type` | Medium |

---

### Billing & Plan Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `plan_selected` | Org selects or changes plan during onboarding | `plan_tier`, `billing_period`, `org_id` (hashed) | **Critical** |
| `plan_upgraded` | Org upgrades to higher tier | `from_tier`, `to_tier`, `trigger` | **Critical** |
| `plan_downgraded` | Org downgrades to lower tier | `from_tier`, `to_tier`, `downgrade_reason_category` | High |
| `trial_started` | Trial or pilot period begins | `plan_tier`, `trial_days`, `org_id` (hashed) | **Critical** |
| `trial_converted` | Trial org converts to paid | `from_tier`, `to_tier`, `trial_duration_days` | **Critical** |
| `trial_expired_unconverted` | Trial ends without conversion | `plan_tier`, `trial_duration_days`, `activation_achieved` | High |
| `invoice_created` | Billing invoice generated | `plan_tier`, `amount_cents` (obfuscated to tier band), `billing_period` | High |
| `payment_failed` | Payment attempt failed | `plan_tier`, `failure_reason_category` | **Critical** |

---

### Conversion Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `pilot_inquiry_accepted` | Design partner / pilot org provisioned | `org_id` (hashed), `plan_tier`, `source_channel` | **Critical** |
| `pilot_converted_to_paid` | Pilot org signs paid contract | `org_id` (hashed), `conversion_trigger`, `pilot_duration_days` | **Critical** |
| `pilot_lost` | Pilot org exits without converting | `exit_reason_category`, `pilot_duration_days`, `last_activated` | High |
| `expansion_seat_added` | Additional users added to paid org | `org_id` (hashed), `seats_added`, `plan_tier` | **Critical** |
| `expansion_pack_added` | Additional domain pack purchased | `org_id` (hashed), `pack_name`, `plan_tier` | **Critical** |
| `expansion_module_added` | Additional product module purchased | `org_id` (hashed), `module_name`, `plan_tier` | **Critical** |
| `churn_signal_detected` | Automated churn risk signal (score drops below 40) | `org_id` (hashed), `health_score`, `primary_signal` | **Critical** |
| `churn_confirmed` | Org cancels or fails to renew | `org_id` (hashed), `churn_reason_category`, `tenure_days`, `plan_tier` | **Critical** |

---

### Tenant Health Events

These events feed the [CUSTOMER_HEALTH_MODEL.md](../sales/customer-health-model.md) health score computation.

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `health_score_computed` | Weekly tenant health score computed | `org_id` (hashed), `health_score`, `tier`, `delta_from_last_week` | High |
| `health_tier_changed` | Tenant moves between health tiers | `org_id` (hashed), `from_tier`, `to_tier`, `primary_signal` | **Critical** |
| `tenant_stage_advanced` | Tenant advances lifecycle stage | `org_id` (hashed), `from_stage`, `to_stage` | **Critical** |
| `retention_risk_flagged` | D7/D30 retention signal below threshold | `org_id` (hashed), `signal_type`, `current_value`, `threshold` | High |
| `expansion_signal_detected` | Tenant shows expansion readiness signal | `org_id` (hashed), `signal_type`, `plan_tier` | High |
| `qbr_scheduled` | Quarterly business review scheduled | `org_id` (hashed), `plan_tier` | Medium |

---

## Launch Event Instrumentation Priority

Events required to be live before public launch:

**Must fire on Day 0 (no exceptions):**
- `user_signup_completed`
- `onboarding_step_completed` (all 4 steps)
- `onboarding_completed`
- `first_governed_decision`
- `tenant_activated`
- `recommendation_generated`
- `recommendation_accepted`
- `recommendation_rejected`
- `approval_cycle_completed`
- `workflow_completed`
- `api_error_occurred`
- `demo_requested` (existing)
- `cta_clicked` (existing)

**Required within Week 1:**
- `outcome_recorded`
- `health_score_computed`
- `health_tier_changed`
- `tenant_stage_advanced`
- `support_ticket_created`
- `plan_selected`
- `trial_started`

**Required within Month 1:**
- `simulation_run`
- `learning_cycle_triggered`
- `pilot_converted_to_paid`
- `expansion_seat_added`
- `churn_signal_detected`

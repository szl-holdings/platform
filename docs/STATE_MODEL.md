# SZL Holdings — Enterprise State Model

**Purpose:** Define the canonical state model for the SZL platform — the entities, stages, events, actions, approvals, and outcomes that govern operational intelligence across all domain packs.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Overview

The SZL Enterprise State Model is the shared representation of operational reality across all platform domains. Every domain pack (Lyte, Vessels, Aegis, Terra) maps its domain-specific entities and events onto this model. The shared state model is what makes cross-domain intelligence possible — a vessel position change and a security incident can be connected to the same business outcome because they share a common entity graph and event schema.

---

## Core Entity Types

### 1. Actor

An **Actor** is any entity that can initiate, confirm, or be accountable for an action.

| Attribute | Type | Description |
|---|---|---|
| `actor_id` | UUID | Globally unique actor identifier |
| `actor_type` | Enum | `human` \| `agent` \| `system` \| `external` |
| `display_name` | String | Human-readable name |
| `organization_id` | UUID | Tenant/organization scope |
| `role` | String | Platform role (e.g., `operator`, `analyst`, `executive`, `admin`) |
| `domain_context` | String[] | Which domain packs this actor operates in |

Human actors require authentication. Agent actors must have a registered policy scope. System actors are internal automation. External actors are third-party integrations.

---

### 2. Signal

A **Signal** is an observation from the environment that may require attention or action.

| Attribute | Type | Description |
|---|---|---|
| `signal_id` | UUID | Unique identifier |
| `signal_type` | Enum | `anomaly` \| `threshold` \| `event` \| `pattern` \| `correlation` |
| `domain` | Enum | `business` \| `maritime` \| `security` \| `real_estate` \| `cross_domain` |
| `severity` | Enum | `info` \| `warning` \| `critical` \| `emergency` |
| `source_id` | UUID | ID of the entity that generated the signal |
| `source_type` | String | Entity type (vessel, asset, alert, metric) |
| `timestamp` | Timestamp | When the signal was observed |
| `context` | JSON | Domain-specific signal attributes |
| `confidence` | Float | 0.0–1.0 confidence score from AI inference |
| `correlated_signals` | UUID[] | Related signals in the same event cluster |
| `workspace_id` | UUID | Tenant workspace context |

---

### 3. Inference

An **Inference** is an AI-generated analysis of one or more signals — a reasoned interpretation, risk assessment, or recommendation.

| Attribute | Type | Description |
|---|---|---|
| `inference_id` | UUID | Unique identifier |
| `signal_ids` | UUID[] | Signals that contributed to this inference |
| `model_id` | String | AI model identifier and version |
| `inference_type` | Enum | `risk_assessment` \| `anomaly_explanation` \| `recommendation` \| `correlation` \| `forecast` |
| `confidence` | Float | Confidence score (0.0–1.0) |
| `reasoning` | String | Human-readable reasoning chain |
| `evidence` | JSON[] | Structured evidence supporting the inference |
| `policy_refs` | String[] | Policy references that constrain recommended actions |
| `actor_id` | UUID | Agent actor that generated the inference |
| `timestamp` | Timestamp | When the inference was generated |
| `eval_id` | UUID | Reference to the evaluation run (for replay/comparison) |

---

### 4. Policy

A **Policy** defines what actions are permitted, required, or prohibited in response to given conditions.

| Attribute | Type | Description |
|---|---|---|
| `policy_id` | UUID | Unique identifier |
| `name` | String | Human-readable policy name |
| `domain` | String | Applicable domain |
| `trigger_conditions` | JSON | Conditions under which this policy applies |
| `permitted_actions` | String[] | Action types permitted under this policy |
| `required_approvals` | JSON[] | Required approval types and actor roles |
| `prohibited_actions` | String[] | Explicitly disallowed actions |
| `escalation_path` | JSON | Who to escalate to if no approval within SLA |
| `effective_from` | Timestamp | Policy activation date |
| `effective_until` | Timestamp | Policy expiry date (null = indefinite) |
| `version` | String | Policy version |

---

### 5. Action

An **Action** is a concrete operation — proposed by AI inference or initiated by a human — that produces a state change in the system or external environment.

| Attribute | Type | Description |
|---|---|---|
| `action_id` | UUID | Unique identifier |
| `action_type` | String | Domain-specific action type |
| `proposed_by` | UUID | Actor ID of proposer (agent or human) |
| `inference_id` | UUID \| null | Inference that drove this action (if AI-proposed) |
| `signal_ids` | UUID[] | Signals that contributed |
| `policy_id` | UUID | Policy governing this action |
| `status` | Enum | `proposed` \| `pending_approval` \| `approved` \| `rejected` \| `executing` \| `completed` \| `failed` \| `cancelled` |
| `priority` | Enum | `low` \| `medium` \| `high` \| `critical` |
| `payload` | JSON | Action-specific parameters |
| `target_entity` | UUID | Entity being acted upon |
| `proposed_at` | Timestamp | When the action was proposed |
| `required_by` | Timestamp \| null | SLA deadline for approval/execution |

---

### 6. Approval

An **Approval** is a human confirmation that a proposed action may proceed.

| Attribute | Type | Description |
|---|---|---|
| `approval_id` | UUID | Unique identifier |
| `action_id` | UUID | Action requiring this approval |
| `required_role` | String | Minimum role required to approve |
| `approver_id` | UUID \| null | Actor who approved/rejected |
| `status` | Enum | `pending` \| `approved` \| `rejected` \| `expired` \| `escalated` |
| `decision_at` | Timestamp \| null | When the decision was made |
| `decision_note` | String \| null | Optional approver commentary |
| `escalated_to` | UUID \| null | Actor ID if escalated |
| `sla_deadline` | Timestamp | When this approval expires |

---

### 7. Outcome

An **Outcome** records the result of an executed action — what changed, what was measured, and whether the action achieved its intended effect.

| Attribute | Type | Description |
|---|---|---|
| `outcome_id` | UUID | Unique identifier |
| `action_id` | UUID | Action that produced this outcome |
| `status` | Enum | `success` \| `partial` \| `failed` \| `unverified` |
| `measured_at` | Timestamp | When the outcome was assessed |
| `result_data` | JSON | Domain-specific result attributes |
| `value_impact` | JSON | Risk reduction, revenue impact, or process improvement metrics |
| `risk_delta` | Float | Change in risk score (negative = risk reduced) |
| `followup_signals` | UUID[] | Signals generated by this outcome |
| `verified_by` | UUID \| null | Actor who verified the outcome |

---

## Business Stages

Every entity in the SZL state model moves through stages. Stages represent the lifecycle of a business process — from observation through resolution.

### Universal Stage Model

```
Observed → Assessed → Prioritized → Assigned → In Progress → Pending Approval → Resolved → Archived
                                                     ↑                               ↓
                                              [Escalated]                    [Outcome Recorded]
```

### Stage Definitions

| Stage | Description | Typical Duration |
|---|---|---|
| `observed` | Signal received; not yet assessed | Seconds |
| `assessed` | AI inference generated; severity and context established | Minutes |
| `prioritized` | Ranked against other active signals; SLA set | Minutes |
| `assigned` | Routed to responsible actor | Minutes |
| `in_progress` | Actor has acknowledged and is working | Varies |
| `pending_approval` | Action proposed; awaiting human confirmation | Minutes to hours |
| `resolved` | Action confirmed executed; outcome recorded | Immediate upon execution |
| `archived` | Signal closed; provenance chain complete | Automatic |

---

## Risk and Value Context

Every signal and outcome carries risk/value context enabling the platform to quantify business impact:

| Attribute | Description |
|---|---|
| `risk_score` | Weighted composite risk (0–100); updated as signals evolve |
| `business_process_id` | The business journey stage this signal affects |
| `revenue_at_risk` | Estimated revenue impact if not resolved |
| `process_friction_score` | Degradation in the affected business process |
| `sla_breach_risk` | Probability of SLA breach if action is delayed |
| `compliance_exposure` | Applicable regulatory/compliance references |

---

## Entity Relationships

```
Signal ──── generates ──────→ Inference
Signal ──── correlates with → Signal[]
Inference ── proposes ──────→ Action
Action ───── governed by ───→ Policy
Action ───── requires ──────→ Approval
Approval ─── granted by ───→ Actor (human)
Action ───── produces ──────→ Outcome
Outcome ──── generates ─────→ Signal[] (follow-up)
Actor ────── belongs to ────→ Organization
All entities → Workspace (tenant scope)
All events → AuditLog (immutable)
```

---

## Concurrency and Conflict Rules

1. An Action may not proceed past `pending_approval` without a valid Approval from an authorized Actor.
2. Two Actions targeting the same entity may not execute concurrently without explicit conflict resolution policy.
3. A Policy update does not retroactively invalidate in-flight Actions that were compliant at time of proposal.
4. Approval expiry (`sla_deadline` reached without decision) triggers automatic escalation — not automatic approval.
5. An Outcome marked `failed` generates a new Signal of type `event` with source pointing to the failed Action.

---

*This state model is the canonical representation for implementation. All platform code, API schemas, and AI model outputs should reference these entity types and attribute names.*

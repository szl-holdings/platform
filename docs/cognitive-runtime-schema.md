# Cognitive Runtime — Database Schema

## Overview

This document describes the persistence foundation for the SZL self-modeling cognitive runtime. These tables form the substrate that every cognitive subsystem (self-model, world-model, memory, planner, verifier, reflection, skills, traces, evals, policies, approvals, actions) reads and writes against.

Migration file: `lib/db/drizzle/0046_sparkling_edwin_jarvis.sql`  
Schema file: `lib/db/src/schema/cognitive_runtime.ts`

---

## Conventions

| Convention | Detail |
|---|---|
| Primary keys | UUID (`gen_random_uuid()`), not serial |
| Timestamps | `created_at`, `updated_at` on every record-bearing table; `withTimezone: true` |
| Metadata | `JSONB metadata` column on every table |
| Provenance | `provenance_source`, `provenance_method` (`cog_provenance_method` enum) |
| Freshness | `freshness_last_updated_at`, `freshness_ttl_seconds`, `freshness_is_stale` where stated |
| Confidence | `confidence REAL` (0–1) on every record-bearing table |
| Sensitivity | `sensitivity_tier` (`cog_sensitivity_tier` enum) on all externally-relevant tables |
| Versioning | `version` + `latest_version` on skills, policies |
| Immutability | Snapshot tables (`self_model_snapshots`, `rollback_events`) are append-only — never updated after insert |

---

## Enum Types

| Enum | Values |
|---|---|
| `cog_sensitivity_tier` | `public`, `internal`, `confidential`, `restricted`, `top-secret` |
| `cog_provenance_method` | `api`, `manual`, `agent`, `import`, `derived` |
| `self_model_status` | `draft`, `active`, `archived`, `deprecated` |
| `cog_skill_status` | `draft`, `active`, `deprecated`, `retired` |
| `cog_skill_run_status` | `pending`, `running`, `completed`, `failed`, `cancelled` |
| `cog_plan_status` | `draft`, `pending`, `running`, `completed`, `failed`, `aborted`, `rolled-back` |
| `cog_plan_step_status` | `pending`, `running`, `completed`, `failed`, `skipped` |
| `cog_verifier_outcome` | `pass`, `fail`, `warn`, `blocked` |
| `cog_reflection_type` | `post-task`, `periodic`, `error-triggered`, `human-initiated`, `goal-review`, `policy-breach` |
| `cog_policy_effect` | `allow`, `deny`, `require-approval`, `log`, `redact`, `escalate` |
| `cog_action_status` | `pending`, `approved`, `running`, `completed`, `failed`, `rolled-back`, `denied` |
| `cog_rollback_trigger` | `agent`, `verifier`, `guardian`, `human`, `policy`, `timeout`, `cascade-failure` |
| `cog_entity_edge_type` | `relates-to`, `depends-on`, `triggers`, `mitigates`, `owns`, `managed-by`, `derived-from`, `affects`, `linked-trace`, `similar-to`, `supersedes`, `alias-of`, `custom` |

---

## Tables

### Self-Model

#### `self_models`
One active model per agent at any given time. `version` increments on each significant update.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `agent_id` | TEXT | |
| `version` | INTEGER | increments on each significant update |
| `status` | `self_model_status` | |
| `capabilities` | JSONB | string array |
| `goals` | JSONB | goal object array |
| `constraints` | JSONB | constraint object array |
| `beliefs` | JSONB | belief map |
| `identity` | JSONB | identity descriptors |
| `performance_profile` | JSONB | performance metrics |
| `confidence` | REAL | 0–1 |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | source, method, author |
| `freshness_*` | TIMESTAMP/INT/BOOL | last updated, TTL, stale flag |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `self_model_snapshots` *(immutable)*
Point-in-time copies created whenever the active self-model is updated. Append-only.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `self_model_id` | UUID FK → `self_models.id` | cascade delete |
| `agent_id` | TEXT | |
| `version` | INTEGER | |
| `snapshot_data` | JSONB | full model state at capture time |
| `change_reason` | TEXT | |
| `triggered_by` | TEXT | agent/service that triggered change |
| `trace_id` | TEXT | linked trace |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | no `updated_at` — immutable |

---

### Entity Graph Extensions

#### `entity_aliases`
Alternative identifiers for entities (display names, external IDs, legacy references).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `entity_id` | TEXT | references entity by string ID |
| `alias` | TEXT | the alias value |
| `alias_type` | TEXT | `display`, `external`, `legacy`, etc. |
| `provenance_*` | TEXT/enum | |
| `confidence` | REAL | |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `entity_edges`
Directed, weighted, typed edges between entities in the cognitive world graph. Complements `entity_relationships` with full provenance, confidence, and freshness metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `from_entity_id` | TEXT | source entity |
| `to_entity_id` | TEXT | target entity |
| `edge_type` | `cog_entity_edge_type` | |
| `label` | TEXT | optional human label |
| `weight` | REAL | edge strength |
| `bidirectional` | BOOLEAN | |
| `provenance_*` | TEXT/enum | source, method, author |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `freshness_*` | TIMESTAMP/INT/BOOL | |
| `linked_traces` | JSONB | trace IDs |
| `properties` | JSONB | edge properties |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Skills

#### `skills`
Versioned, reusable executable skill definitions. Each version is a new row; `latest_version` tracks the head.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `skill_id` | TEXT | stable identifier across versions |
| `version` | INTEGER | |
| `latest_version` | INTEGER | |
| `name` | TEXT | |
| `description` | TEXT | |
| `domain` | TEXT | |
| `capability` | TEXT | |
| `status` | `cog_skill_status` | |
| `input_schema` | JSONB | |
| `output_schema` | JSONB | |
| `implementation` | JSONB | execution spec |
| `trigger_conditions` | JSONB | |
| `policy_class` | TEXT | |
| `estimated_latency_ms` | INTEGER | |
| `tags` | TEXT[] | |
| `is_builtin` | BOOLEAN | |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `skill_runs`
Execution records for every invocation of a skill.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `skill_id` | TEXT | |
| `skill_version` | INTEGER | |
| `agent_id` | TEXT | |
| `trace_id` | TEXT | |
| `plan_id` | UUID | optional link to plan |
| `plan_step_id` | UUID | optional link to step |
| `status` | `cog_skill_run_status` | |
| `inputs` | JSONB | |
| `outputs` | JSONB | |
| `latency_ms` | REAL | |
| `tokens_used` | INTEGER | |
| `cost_usd` | REAL | |
| `error_code`, `error_message` | TEXT | |
| `retries` | INTEGER | |
| `approval_id` | TEXT | |
| `confidence` | REAL | |
| `provenance_*` | TEXT/enum | |
| `metadata` | JSONB | |
| `started_at`, `completed_at` | TIMESTAMPTZ | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Plans

#### `plans`
Top-level plan records, each representing a goal decomposition.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `plan_id` | TEXT UNIQUE | stable string ID |
| `agent_id` | TEXT | |
| `session_id` | TEXT | |
| `workflow_id` | TEXT | |
| `trace_id` | TEXT | |
| `title` | TEXT | |
| `description` | TEXT | |
| `goal` | JSONB | goal specification |
| `status` | `cog_plan_status` | |
| `total_steps`, `completed_steps`, `failed_steps` | INTEGER | |
| `fallback_plan_id` | TEXT | fallback plan reference |
| `parent_plan_id` | TEXT | parent in nested plans |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `freshness_*` | TIMESTAMP/BOOL | |
| `metadata` | JSONB | |
| `started_at`, `completed_at` | TIMESTAMPTZ | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `plan_steps`
Individual steps within a plan. Supports parent-child hierarchy and dependency graphs.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `plan_id` | UUID FK → `plans.id` | cascade delete |
| `step_index` | INTEGER | ordering within plan |
| `parent_step_id` | UUID | for hierarchical steps |
| `title` | TEXT | |
| `description` | TEXT | |
| `skill_id` | TEXT | skill to execute |
| `skill_version` | INTEGER | |
| `skill_run_id` | UUID | link to execution record |
| `status` | `cog_plan_step_status` | |
| `depends_on_step_ids` | JSONB | dependency graph |
| `inputs`, `outputs` | JSONB | |
| `approval_required` | BOOLEAN | |
| `approval_id` | TEXT | |
| `verifier_result_id` | UUID | |
| `confidence` | REAL | |
| `error_code`, `error_message` | TEXT | |
| `retries` | INTEGER | |
| `metadata` | JSONB | |
| `started_at`, `completed_at` | TIMESTAMPTZ | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Verifier

#### `verifier_results`
Strict pre-commit check records. One row per verification run against a plan step, action, or skill output.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `verifier_id` | TEXT | which verifier ran |
| `target_type` | TEXT | `plan`, `plan_step`, `action`, `skill_run` |
| `target_id` | TEXT | ID of target |
| `trace_id` | TEXT | |
| `plan_id`, `plan_step_id`, `skill_run_id` | UUID | optional structured links |
| `outcome` | `cog_verifier_outcome` | |
| `checks` | JSONB | array of `{name, outcome, message, evidence}` |
| `overall_score` | REAL | 0–1 |
| `blocker_count`, `warning_count`, `pass_count` | INTEGER | |
| `reasoning` | TEXT | explanation |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Reflection

#### `reflections`
Post-task and periodic structured self-improvement records.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `reflection_id` | TEXT UNIQUE | |
| `agent_id` | TEXT | |
| `type` | `cog_reflection_type` | |
| `trace_id` | TEXT | |
| `plan_id` | UUID | |
| `session_id` | TEXT | |
| `triggering_event` | TEXT | |
| `summary` | TEXT | |
| `observations` | JSONB | `[{category, observation, evidence}]` |
| `improvements` | JSONB | `[{area, suggestion, priority}]` |
| `policy_breaches` | JSONB | `[{policyId, description, severity}]` |
| `confidence_adjustment` | REAL | adjustment from this reflection |
| `overall_health` | TEXT | |
| `actionable` | BOOLEAN | |
| `suggested_actions` | JSONB | string array |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `freshness_last_updated_at` | TIMESTAMPTZ | |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Policies

#### `policies`
Versioned policy definitions for the cognitive runtime. Each version is a new row.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `policy_id` | TEXT | stable across versions |
| `version` | INTEGER | |
| `latest_version` | INTEGER | |
| `name` | TEXT | |
| `description` | TEXT | |
| `domain` | TEXT | |
| `scope` | TEXT | `global`, `agent`, `domain`, etc. |
| `effect` | `cog_policy_effect` | |
| `conditions` | JSONB | `[{field, operator, value}]` |
| `priority` | INTEGER | lower = higher priority |
| `enabled` | BOOLEAN | |
| `owner` | TEXT | |
| `tags` | TEXT[] | |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `freshness_*` | TIMESTAMP/BOOL | |
| `metadata` | JSONB | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Actions

#### `cog_actions`
Every agent-initiated action, its outcome, and full provenance. Named `cog_actions` to avoid collision with the platform `actions` table.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `action_id` | TEXT UNIQUE | |
| `agent_id` | TEXT | |
| `trace_id` | TEXT | |
| `plan_id`, `plan_step_id`, `skill_run_id` | UUID | optional links |
| `domain` | TEXT | |
| `action_type` | TEXT | classification |
| `description` | TEXT | |
| `status` | `cog_action_status` | |
| `inputs`, `outputs` | JSONB | |
| `policy_id`, `policy_version` | TEXT/INT | policy that governed this action |
| `approval_id` | TEXT | |
| `verifier_result_id` | UUID | |
| `rollback_event_id` | UUID | |
| `is_reversible` | BOOLEAN | |
| `rollback_procedure` | JSONB | |
| `business_impact` | JSONB | `{valueCreatedUsd, valueAtRiskUsd, description}` |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `freshness_last_updated_at` | TIMESTAMPTZ | |
| `metadata` | JSONB | |
| `executed_at` | TIMESTAMPTZ | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

### Rollback

#### `rollback_events` *(immutable)*
Immutable record of every rollback event. Append-only; never updated after insert.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `rollback_id` | TEXT UNIQUE | |
| `agent_id` | TEXT | |
| `trace_id` | TEXT | |
| `plan_id` | UUID | |
| `action_id` | TEXT | |
| `trigger` | `cog_rollback_trigger` | what initiated the rollback |
| `reason` | TEXT | human-readable explanation |
| `target_type`, `target_id` | TEXT | what was rolled back |
| `state_before_rollback` | JSONB | captured pre-rollback state |
| `state_after_rollback` | JSONB | captured post-rollback state |
| `success` | BOOLEAN | |
| `error_code`, `error_message` | TEXT | |
| `confidence` | REAL | |
| `sensitivity_tier` | enum | |
| `provenance_*` | TEXT/enum | |
| `metadata` | JSONB | |
| `initiated_at`, `completed_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | no `updated_at` — immutable |

---

## Existing Tables Reused

The following tables from prior migrations already provide cognitive runtime persistence and were NOT duplicated:

| Table | Schema File | Notes |
|---|---|---|
| `entities` | `entities.ts` | world-model entities |
| `entity_relationships` | `entities.ts` | basic entity links |
| `memory_records` | `memory_fabric.ts` | 8-tier memory store |
| `memory_links` | `memory_fabric.ts` | typed links between memories |
| `traces` | `trace_graph.ts` | full trace records |
| `trace_spans` | `trace_graph.ts` | span-level trace detail |
| `eval_suites` | `eval_os.ts` | eval suite definitions |
| `eval_cases` | `eval_os.ts` | individual eval cases |
| `eval_runs` | `eval_os.ts` | eval execution records |
| `eval_scores` | `eval_os.ts` | per-case scores |
| `approval_requests` | `approvals.ts` | approval workflows |
| `guardian_policies` | `guardian_tools.ts` | guardian policy rules |

---

## Cross-References

- Downstream packages should import types from `@szl-holdings/db` — all types are exported from `lib/db/src/schema/cognitive_runtime.ts`.
- Trace linkage: use `trace_id` (string) on any table to link back to `traces.trace_id`.
- Entity linkage: use `entity_id` (string) on `entity_aliases` and `entity_edges` — matches entity external IDs or the UUID from `entities.id`.
- Guardian policy enforcement: the `policies` table is distinct from `guardian_policies`. The `policies` table is for cognitive runtime policy rules; `guardian_policies` is for the Guardian autonomy governor.

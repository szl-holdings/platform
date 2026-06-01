# Precision Evolution Runtime — Governance & Promotion

## Overview

Every policy promotion in PER is evidence-gated: a machine-readable bundle of
evaluation results, reward scores, drift measurements, and governance check
outcomes must exist before a candidate can advance to `active`. High-risk
promotions require explicit human approval.

---

## Promotion Gate Checks

The governance gate evaluates these conditions in order:

| # | Check | Threshold |
|---|---|---|
| 1 | Evaluation pass rate | ≥ `minPassRate` (default 0.80) |
| 2 | Reward score total | ≥ `minRewardScore` (default 0.75) |
| 3 | Drift score | ≤ `maxDriftScore` (default 0.15) |
| 4 | Coverage threshold met | `coverageThresholdMet = true` in eval run |
| 5 | No regressions | `regressionSeverity ∈ {none, low}` |
| 6 | Policy compliance | All domain policy assertions pass |
| 7 | Human approval | Required when `riskLevel ∈ {high, critical}` |

A single failing check produces a blocker. The gate records all passing and
blocking results as part of the evidence bundle.

---

## Risk Classification

Candidates are classified at registration time:

| Risk Level | Conditions | Human Approval Required |
|---|---|---|
| `low` | All checks pass; reward > 0.90; no drift | No |
| `medium` | Pass rate 0.80–0.90; low drift | No |
| `high` | Any regression; drift > 0.10; new capability | Yes |
| `critical` | Critical drift; safety regression; broad rollout | Yes |

---

## Promotion Decision Record

`per_promotion_decisions` table stores every decision:

| Column | Type | Notes |
|---|---|---|
| decisionId | uuid | PK |
| candidateId | uuid | FK → per_candidate_policies |
| evalRunId | uuid | FK → per_evaluation_runs |
| outcome | varchar | approved / rejected / pending_human / rolled_back |
| riskLevel | varchar | low / medium / high / critical |
| passingChecks | jsonb | list of passing condition names |
| failingChecks | jsonb | list of failing condition names |
| evidenceBundle | jsonb | full evidence snapshot at decision time |
| humanApprovedBy | varchar | approver identifier (nullable) |
| humanApprovedAt | timestamp | nullable |
| humanApprovalNotes | text | nullable |
| simulated | boolean | |

---

## Rollout Strategy

Approved candidates enter the rollout system:

| Mode | Behaviour |
|---|---|
| `canary` | 5% → 20% → 50% → 100% traffic, with drift check between each step |
| `blue_green` | Full swap with instant rollback capability |
| `immediate` | Instant full activation (low-risk policies only) |
| `phased` | Custom percentage schedule defined in candidate config |

### Rollout Traces

`per_rollout_traces` records every step: timestamp, traffic percentage reached,
status, error (if any), and latency delta at that step. This is the data source
for the Governance Console's audit timeline.

### Rollback

A rollback can be triggered:
- Automatically by the drift guard (`DRIFT_GUARD=true`)
- Manually via the Governance Console UI
- Programmatically via `POST /api/evolution/rollout/:jobId/rollback`

On rollback:
1. Traffic is immediately returned to the prior `active` policy
2. The rolled-back candidate is set to state `rolled_back`
3. A `policy_rollback` audit event is emitted
4. The drift report `actionTaken` is set to `rolled_back`

---

## Promotion Mode Config

| `PROMOTION_MODE` | Behaviour |
|---|---|
| `simulation` | All promotions generate synthetic outcomes; no policy activation |
| `manual_review` | Every promotion queued for human review, regardless of risk level |
| `auto` | Auto-promote if all gate checks pass and risk is `low` or `medium` |

Default: `manual_review` (safest for production).

---

## Audit Trail

Every PER event is recorded in `per_runtime_health_snapshots` with a full
evidence payload. Events:

| Event Type | Trigger |
|---|---|
| `candidate_registered` | New candidate policy registered |
| `calibration_started` | Calibration run begins |
| `calibration_completed` | Calibration run completes |
| `evaluation_started` | Evaluation run begins |
| `evaluation_completed` | Evaluation run completes |
| `promotion_approved` | Gate passes; promotion approved |
| `promotion_rejected` | Gate blocked; candidate stays in review |
| `policy_activated` | Candidate becomes active policy |
| `policy_rollback` | Rollback triggered (auto or manual) |
| `drift_alert` | Drift threshold breached |
| `human_approval_requested` | Human sign-off queued |
| `human_approval_received` | Approval or rejection logged |

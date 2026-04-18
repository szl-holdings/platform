# Observability Architecture

> **⚠ Canonical replacement:** [telemetry-model.md](telemetry-model.md) (April 2026) supersedes this document as the source of truth for the telemetry model, observability surfaces, and correlation contract. This file is retained for historical reference. See [docs/CANONICAL_INDEX.md](docs/CANONICAL_INDEX.md).

> **Truth-pass rule:** every observability surface listed here is *enforced
> at the API layer through `@szl-holdings/decision-fabric` queries against
> the `decision_fabric_*` and primitive tables; bypass requires an explicit,
> attributed override record.*

## 1. Layered model

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 4 — Observability Surfaces                            │
│   • Workflow 360       • Entity Investigation               │
│   • Recommendation Trace  • Approval Bottlenecks            │
│   • Policy Failures    • Prediction Drift                   │
│   • Domain Cluster Stats  • Learning Jobs                   │
├──────────────────────────────────────────────────────────────┤
│ Layer 3 — Decision Fabric (this package)                    │
│   correlation index • decision records • snapshots          │
│   playbook suggestions • learning loop                       │
├──────────────────────────────────────────────────────────────┤
│ Layer 2 — Primitives                                         │
│   Prism Bus  • Proof Chain  • Outcome Graph  • Covenant     │
│   Policy  • Forge / Workflow Engine  • Monte Carlo  • Approvals │
├──────────────────────────────────────────────────────────────┤
│ Layer 1 — Storage (PostgreSQL via Drizzle)                  │
└──────────────────────────────────────────────────────────────┘
```

Layer 4 surfaces never read primitive tables directly; they always go
through Layer 3, which guarantees that every joined view is consistent with
the audit trail.

## 2. The eight observability surfaces

### Workflow 360
**Question answered:** "What happened during this workflow run, end to end?"
**Source:** `getWorkflow360(workflowRunId)` joins `decision_records`
(by `workflow_run_id`) with `correlation_links` filtered on the same id.
**API:** `GET /api/decision-fabric/workflows/:runId/360`.

### Entity Investigation
**Question answered:** "Show me everything that ever touched this vessel /
property / agent / model / supplier."
**Source:** `investigateEntity(type, id)` returns parallel reads of
`decision_records` (by entityType+entityId) and `correlation_links` (same).
**API:** `GET /api/decision-fabric/entities/:type/:id/investigation`.

### Recommendation Trace
**Question answered:** "What downstream decisions, executions, and outcomes
flowed from this recommendation?"
**Source:** `traceRecommendation(recommendationId)` walks decisions, then
expands each correlationId into the full primitive event set.
**API:** `GET /api/decision-fabric/recommendations/:id/trace`.

### Approval Bottlenecks
**Question answered:** "Where is the queue stuck right now?"
**Source:** `getApprovalBottlenecks()` groups pending approvals by
`actionClass + resourceType` and computes oldest / mean wait time.
**API:** `GET /api/decision-fabric/approvals/bottlenecks`.

### Policy Failures
**Question answered:** "Which policies are denying the most actions?"
**Source:** `getPolicyFailures()` aggregates `decision_records` whose status
is `rolled_back`, grouped by `metadata.denied_policy_name`.
**API:** `GET /api/decision-fabric/policies/failures`.

### Prediction Drift
**Question answered:** "Where are our predictions diverging most from
reality?"
**Source:** `getPredictionDrift()` orders `decision_records` by
`abs(prediction_error)` descending.
**API:** `GET /api/decision-fabric/predictions/drift`.

### Domain Cluster Stats
**Question answered:** "Which (domain, entityType) cells produce the most
decisions, and how reliable are they?"
**Source:** `getDomainClusterStats()` groups recent decisions by domain +
entityType.
**API:** `GET /api/decision-fabric/clusters`.

### Learning Jobs
**Question answered:** "What did we learn this cycle, and what calibration
adjustments were proposed?"
**Source:** `runLearningCycle()` writes an `outcome_graph_learning_jobs`
row of kind `decision_fabric_calibration`. The existing `/api/outcome-graph/
learning-jobs` route lists them.
**API:** `POST /api/decision-fabric/learning/run`,
`GET /api/outcome-graph/learning-jobs`.

## 3. Correlation contract

Every primitive that participates in the canonical 9-step loop **must** call
`linkEvent` exactly once per emitted artifact, supplying:

- `correlationId` (mandatory) — propagated from the originating signal.
- `primitive` — one of the eight enums (`prism_bus`, `proof_chain`,
  `outcome_graph`, `covenant_policy`, `workflow_engine`, `monte_carlo`,
  `approval`, `decision_record`).
- `primitiveId` — the source-of-truth row id within that primitive.
- `entityType` + `entityId` — the subject of the event when applicable.
- `workflowRunId` — when the event occurred inside a workflow run.
- `domain` — one of the canonical fabric domains.

Without this contract, end-to-end views fall back to per-primitive queries
and lose cross-system stitching.

## 4. Org isolation

Every fabric query takes an `orgId` parameter. The HTTP routes always
extract `orgId` from the authenticated user's session before invoking the
library, so multi-tenant isolation is preserved even if a caller forgets to
filter. Org-less rows (`orgId IS NULL`) are visible only to platform-admin
roles.

## 5. Performance

- All correlation queries are indexed on `correlation_id`, `workflow_run_id`,
  `(entity_type, entity_id)`, and `primitive`.
- All decision-record queries are indexed on `(entity_type, entity_id)`,
  `workflow_run_id`, `recommendation_id`, `correlation_id`, and `decided_at`.
- Aggregation queries (bottlenecks, drift, clusters) cap at 25–50 rows by
  default; callers must pass an explicit `limit` to fetch more.

## 6. What this document does *not* cover

- Frontend rendering of these surfaces — see Phase 9 (UX Premiumization).
- AI trace capture for LLM agents — see Phase 5–6 (planned).
- Tenant-level rate limiting — see Phase 7 (planned).
- Release intelligence dashboards — see Phase 8 (planned).

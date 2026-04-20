# Outcome Graph Model

> **Truth-pass rule:** the outcome graph + decision record schema described
> here is *enforced at the database layer through the `outcome_graph` and
> `decision_fabric_records` tables; bypass requires an explicit, attributed
> override record.*

## 1. Two cooperating tables

The outcome graph is no longer a single table. It is a pair:

| Table | Owner | Purpose |
|-------|-------|---------|
| `outcome_graph` | `@szl-holdings/outcome-graph` | One row per emitted recommendation, with the full lifecycle: recommendation → decision → outcome. |
| `decision_fabric_records` | `@szl-holdings/decision-fabric` | One row per *consequential* decision, with backlinks to outcome graph, proof, policy version, simulation, approval, and workflow. |

A recommendation can produce multiple decision records (split execution,
re-decision after rollback, supersession). A decision record always points
back to at most one outcome-graph row via `outcome_graph_id`.

## 2. Lifecycle states

### `outcome_graph.decisionStatus`
- `pending_decision` — recommendation emitted, awaiting human / auto judgement.
- `accepted` — taken as recommended.
- `rejected` — explicitly declined.
- `overridden` — taken with modifications (override reason recorded).
- `deferred` — postponed.

### `outcome_graph.outcomeResult`
- `achieved`, `partial`, `not_achieved`, `unknown`, `too_early`.

### `decision_fabric_records.status`
- `draft` — record created before execution finalized.
- `executed` — happy path.
- `rolled_back` — execution aborted or compensated.
- `superseded` — replaced by a later decision (link in `metadata.supersededBy`).

## 3. Predicted vs. actual

Each decision record stores both `predictedOutcome` and `actualOutcome` as
JSON, plus a scalar `predictionError ∈ [-1, 1]`. Convention:

- `0` means perfect prediction.
- positive means we under-estimated (real outcome was bigger than predicted).
- negative means we over-estimated.

Domains are free to define what those vectors mean; the fabric only requires
that `predictionError` be a number.

## 4. Snapshot contract

When a decision is recorded:

1. The covenant policy that fired must be frozen via
   `snapshotPolicy(...)` and the resulting `policy_version_id` linked.
2. If a Monte Carlo (or other) simulation supported the choice, freeze it
   via `snapshotSimulation(...)` and link `simulation_snapshot_id`.
3. The proof chain row backing the recommendation is linked via
   `proof_chain_id` (foreign key intentionally left soft to avoid a hard
   dependency cycle).
4. The originating outcome-graph row is linked via `outcome_graph_id`.

This guarantees the decision is replayable years later: every input that
shaped it can be reconstructed exactly.

## 5. Domain enumeration

Both tables share the same `FABRIC_DOMAINS`:

`maritime`, `security`, `real_estate`, `aiops`, `research`, `creative`,
`analytics`, `infrastructure`, `readiness`, `general`, `global`.

Adding a domain requires a coordinated migration of both tables and the
covenant-policy enum.

## 6. Indexing

- `outcome_graph` — `(org_id)`, `(status)`, `(created_at)` (existing).
- `decision_fabric_records` — `(org_id)`, `(domain)`, `(entity_type,
  entity_id)`, `(owner_user_id)`, `(workflow_run_id)`, `(recommendation_id)`,
  `(correlation_id)`, `(decided_at)`.

## 7. Read patterns

- **By entity:** join both tables on `entityType+entityId`.
- **By workflow run:** decision records carry `workflow_run_id`; outcome
  graph rows do not directly, but the correlation index reaches them.
- **By recommendation:** decision records carry `recommendation_id`;
  outcome graph rows carry the same in their `recommendation_id` column.

The `traceRecommendation()` helper in `@szl-holdings/decision-fabric`
encapsulates the join.

## 8. Predicted-vs-actual analytics

The fabric ships two helpers for closing the loop:

- `getPredictionDrift()` — top-N decisions by `abs(predictionError)`.
- `runLearningCycle()` — per-domain calibration report, persisted as a
  learning job.

Both run against `decision_fabric_records` only; they intentionally do not
touch `outcome_graph` so the recommendation table remains a write-mostly
log without aggregation pressure.

## 9. What is *not* in this model

- Vector embeddings of decisions for similarity search — Phase 5.
- LLM trace capture (prompt / completion artifacts) — Phase 5–6.
- Cross-tenant benchmark aggregates — Phase 7+.

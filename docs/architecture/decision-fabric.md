# Decision Fabric

> **Status:** Phase 1–2 (substrate + memory) shipped. Phases 5–11 sequenced in
> the platform-elevation queue. **Truth-pass rule:** every assertion in this
> document is *enforced at the API + database layer through the
> `@szl-holdings/decision-fabric` package and the `decision_fabric_*` tables;
> bypass requires an explicit, attributed override record.*

## 1. Why a fabric?

SZL Holdings already owns six primitives — Outcome Graph, Proof Chain,
Covenant Policy, Prism Bus, Forge / Workflow Engine, and Monte Carlo
Simulation. Each one is correct in isolation, but answering a real operator
question ("show me everything that touched this vessel last quarter, why each
recommendation was made, which policy version ran, what we predicted, and what
actually happened") requires joining them on demand. Until now those joins
were ad-hoc.

The **Decision Fabric** is the single, governed substrate that:

1. **Correlates** events across every primitive under one `correlationId`.
2. **Memorizes** consequential decisions as immutable `decision_records` with
   forward and backward links to every supporting artifact.
3. **Snapshots** the policy version and simulation that justified each
   decision so it can be replayed years later.
4. **Surfaces** end-to-end views — Workflow 360, Entity Investigation,
   Recommendation Trace, Approval Bottlenecks, Policy Failures, Prediction
   Drift — through `/api/decision-fabric/*`.
5. **Closes the loop** by feeding realized outcomes back into ranking and
   confidence calibration through a deterministic learning cycle.

## 2. The 9-step canonical loop, after the fabric

`Signal → Context → Recommendation → Simulation → Policy → Execution → Proof
→ Outcome → Learning`

Each step now writes a row to `decision_fabric_correlation_links` keyed by
the same `correlationId`. The fabric assembles those rows into a timeline on
demand. There is no separate event store; primitives keep ownership of their
data and the fabric only owns the index.

| Step | Primitive | Fabric link emitted |
|------|-----------|--------------------|
| Signal | Prism Bus | `prism_bus / signal-id` |
| Context | Proof Chain | `proof_chain / proof-id` |
| Recommendation | Decision Engine | `outcome_graph / outcome-id` |
| Simulation | Monte Carlo | `monte_carlo / scenario-id` + `simulation_snapshot` |
| Policy | Covenant Policy | `covenant_policy / policy-id` + `policy_version` |
| Execution | Forge / Workflow Engine | `workflow_engine / run-id` |
| Proof | Proof Chain (review) | `proof_chain / review-id` |
| Outcome | Outcome Graph (actual) | `outcome_graph / outcome-id` |
| Learning | Decision Fabric | `decision_record / id` + learning job |

## 3. The five fabric tables

| Table | Purpose |
|-------|---------|
| `decision_fabric_correlation_links` | Cross-primitive index on `correlationId`, `entityType+entityId`, `workflowRunId`. |
| `decision_fabric_records` | One row per consequential decision. Links to outcome graph, proof, policy version, simulation, approval, workflow. Stores predicted vs. actual outcome and prediction error. |
| `decision_fabric_policy_versions` | Frozen policy bodies — required so a record can be replayed against the exact policy that ran. |
| `decision_fabric_simulation_snapshots` | Frozen Monte Carlo (or other) inputs/parameters/results. |
| `decision_fabric_playbook_suggestions` | Auto-generated suggestions from the pattern engine; reviewable, promotable to a workflow. |

See `DATA-MODEL.md` for full column inventories.

## 4. Public API surface

All routes mounted under `/api/decision-fabric` (auth required, org-scoped):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/correlations/link` | Link a primitive event to a correlationId. |
| GET | `/workflows/:runId/360` | Workflow 360 timeline. |
| GET | `/entities/:type/:id/investigation` | Entity-centric history across primitives. |
| GET | `/recommendations/:id/trace` | Forward trace from a recommendation to all decisions and outcomes. |
| GET | `/approvals/bottlenecks` | Pending approvals grouped by action class + resource type. |
| GET | `/policies/failures` | Top denying policies in the recent window. |
| GET | `/predictions/drift` | Decisions whose actuals diverged most from prediction. |
| POST | `/decisions` | Record a decision (writes a `decision_records` row). |
| GET | `/decisions` | List decisions with filters. |
| GET | `/decisions/:id` | Get a single decision. |
| POST | `/decisions/:id/actual-outcome` | Attach realized outcome + prediction error. |
| POST | `/policy-snapshots` | Freeze a policy version. |
| POST | `/simulation-snapshots` | Freeze a simulation. |
| GET | `/playbooks` | List playbook suggestions. |
| POST | `/playbooks/generate` | Cluster recent decisions into new suggestions (admin). |
| POST | `/playbooks/:id/review` | Accept / reject / promote a playbook (admin). |
| GET | `/clusters` | Per (domain, entityType) cluster statistics. |
| POST | `/learning/run` | Run a calibration cycle (admin). |

## 5. Decision memory — what gets stored and what doesn't

A `decision_records` row is created **only for consequential decisions** —
those that change the state of the world. Read-only queries, search hits, and
preview suggestions do not generate records.

Each record carries:

- **Identity:** `entityType`, `entityId`, `title`, `rationale`.
- **Ownership:** `decidedByUserId`, `decidedByRole`, `ownerUserId`.
- **Evidence:** `outcomeGraphId`, `proofChainId`, `policyVersionId`,
  `simulationSnapshotId`, `approvalId`, `workflowRunId`, `recommendationId`.
- **Prediction vs. reality:** `predictedOutcome`, `actualOutcome`,
  `predictionError ∈ [-1, 1]`.
- **Lifecycle:** `status ∈ {draft, executed, rolled_back, superseded}`.

Updates are append-only by convention: `superseded` rows reference their
replacement via `metadata.supersededBy`; `rolled_back` rows reference the
rollback workflow run via `metadata.rollbackRunId`.

## 6. Learning loop

`POST /decision-fabric/learning/run` walks the last 30 days (configurable) of
`decision_records`, groups by domain, and emits a deterministic
`CalibrationReport` per domain:

- `rollbackRate > 0.2` → `confidenceMultiplier ×= 0.85`, `weightDelta -= 0.05`.
- `meanAbsError > 0.3` → `confidenceMultiplier ×= 0.9`.
- `rollbackRate < 0.05 ∧ meanAbsError ≤ 0.15` →
  `confidenceMultiplier ×= 1.1`, `weightDelta += 0.05`.

Both adjustments are clamped (`[-0.25, 0.25]` for weights, `[0.5, 1.5]` for
confidence). The cycle persists itself as an `outcome_graph_learning_jobs`
row (kind `decision_fabric_calibration`), so it is visible in the existing
learning-jobs surface and audit trail.

The Decision Engine and Monte Carlo Simulation packages consume the latest
report from the learning-jobs table at start-up and at scheduled intervals.

## 7. Playbook generation

`POST /decision-fabric/playbooks/generate` clusters recent decisions on
`(domain, entityType)`. Clusters that pass `minSampleSize` and
`minSuccessRate` thresholds (defaults 5 and 0.6) generate a
`playbook_suggestions` row containing:

- A `triggerSignature` (domain, entityType, observed context keys).
- Up to five `recommendedActions` taken from the cluster's decision titles.
- The supporting `decision_record` ids.
- `successRate` and `confidence ∈ [0,1]`.

Operators promote a suggestion via `POST /playbooks/:id/review` with
`status = "promoted_to_workflow"` and a `promotedWorkflowId`, which closes
the loop into the Forge runtime.

## 8. What this fabric does *not* do

- It does **not** own primitive event storage. Prism Bus, Proof Chain, etc.
  remain the sources of truth.
- It does **not** auto-create `decision_records`. Callers (decision-engine,
  forge-runtime, approvals service) explicitly call `recordDecision`.
- It does **not** mutate ranking weights or confidence priors directly. It
  emits a calibration report; the consuming engines apply (or reject) it.
- It does **not** replace covenant-policy enforcement. Policy snapshots are
  for replay only; live enforcement still runs through `lib/covenant-policy`.

## 9. Cross-references

- `OBSERVABILITY_ARCHITECTURE.md` — how the fabric powers the observability
  surfaces (Workflow 360, Entity Investigation, etc.).
- `OUTCOME_GRAPH_MODEL.md` — the deepened outcome graph + decision-record
  data model.
- `docs/DECISION_LEDGER.md` — the historical decision-ledger spec; the fabric
  is its physical realization.
- `PROOF_AND_POLICY_MODEL.md` — proof-chain + covenant-policy primitives.
- `DECISION_SIMULATION.md` — Monte Carlo simulation contracts.

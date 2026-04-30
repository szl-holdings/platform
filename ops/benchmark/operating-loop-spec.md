# Operating Loop Specification

**Status:** Canonical
**Owner:** Platform Architecture
**Last reviewed:** 2026-04-16
**Source of truth:** `lib/db/src/schema/alloy.ts`, `lib/db/src/schema/approvals.ts`, `lib/db/src/schema/audit_chain_events.ts`, `lib/db/src/schema/proof_chain.ts`, `lib/proof-chain/src/index.ts`, `lib/outcome-graph/src/index.ts`, `artifacts/api-server/src/lib/alloy-orchestration.ts`

---

## 0. Implementation status

This spec describes the canonical operating loop the platform is built around. Statements in this document are tagged as one of:

- **[Implemented]** — enforced today by schema, route, or library code referenced in the section.
- **[Target contract]** — the platform's stated commitment that may not yet be enforced at every layer (e.g. route-level checks vs DB-level CHECK constraints). Future work hardens these from convention to constraint.

Where neither tag appears, the statement is descriptive (architectural intent or terminology) and is implemented to the degree that the surrounding code paths exist.

---

## 1. Purpose

This spec defines the canonical operating loop that every consequential action on the platform must traverse. It is the structural commitment behind "governed decision infrastructure": no AI recommendation reaches execution, and no human action of consequence is recorded, without traversing the loop and producing a verifiable receipt at every transition.

The loop is not a UX pattern. It is a typed sequence of state transitions enforced by the Alloy execution fabric, the covenant policy engine, and the audit chain. Operator UX, API surfaces, and domain packs are all expressions of this loop.

---

## 2. The Six-Stage Loop

```
  ┌──────────┐    ┌────────────┐    ┌────────────────┐    ┌──────────┐    ┌────────┐    ┌────────┐
  │ OBSERVE  │ ─► │  EVALUATE  │ ─► │     DECIDE     │ ─► │ APPROVE  │ ─► │   ACT  │ ─► │  PROVE │
  └──────────┘    └────────────┘    └────────────────┘    └──────────┘    └────────┘    └────────┘
       │                │                    │                  │              │             │
       ▼                ▼                    ▼                  ▼              ▼             ▼
   AlloySignal    AlloyWorkflow        AlloyDecision     ApprovalRequest  AlloyAction   ProofChain
   (raw → scored)  (steps + state)    (recommendation +  (covenant gate)  (execution +  (immutable
                                       evidence)                           outcome)      hash chain)
```

The full nine-step canonical narrative — Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning — collapses into these six implementation stages as follows:

| Narrative step    | Implementation stage | Backing object(s)                              |
|-------------------|----------------------|------------------------------------------------|
| Signal            | OBSERVE              | `alloySignals`                                 |
| Context           | EVALUATE             | `alloyWorkflows.context`, `alloyWorkflows.steps` |
| Recommendation    | DECIDE               | `alloy_ai_decisions` (`AlloyDecision`)         |
| Simulation        | DECIDE               | `monte-carlo` outputs in `evidenceRefs`         |
| Policy            | APPROVE              | `approvalRequests`, `approvalAuditTrail`       |
| Execution         | ACT                  | `alloyActions`, `alloyWorkflowRuns`            |
| Proof             | PROVE                | `auditChainEvents`, `proofChain`               |
| Outcome           | (post-loop)          | `outcomeGraph.recordOutcome()`                 |
| Learning          | (post-loop)          | `outcomeGraph.runLearningCalibration()`        |

Outcome and Learning are not loop stages — they are the feedback mechanism the Outcome Graph applies to subsequent loop traversals. They are documented separately in `agent-attribution-model.md` and the Outcome Graph spec.

---

## 3. Stage definitions

### 3.1 OBSERVE — produce a typed signal

**Trigger:** Any external event that may warrant a decision — webhook, scheduled poll, manual upload, demo seed, API ingress.

**State entry:** A row in `alloySignals` with `status = "raw"`.

**State exit:** `status` advances to `normalized → scored → triaged` as the signal is enriched. A signal is "loop-ready" when `status = "triaged"` and it has a non-null `domain`, `severity`, and `confidence`.

**Required fields:** `id`, `externalId`, `source`, `sourceType`, `domain`, `severity`, `confidence`, `dedupeKey`, `environment`, `createdAt`.

**Audit:** Every status transition writes to `alloyAuditLog` with `entityType = "signal"`.

**Invariants:**
- `dedupeKey` must be present and unique within a 24h window — duplicate ingestion does not create a second signal.
- `confidence ∈ [0, 1]`.
- `environment` must be one of `development | staging | production`.

### 3.2 EVALUATE — open a workflow with steps

**Trigger:** A loop-ready signal, a manual operator action, an escalation from another workflow, or a scheduled review.

**State entry:** A row in `alloyWorkflows` with `status = "pending"` and `triggerType = "signal" | "manual" | "schedule" | "escalation"`. Default steps are seeded by `buildDefaultSteps(type, signal)` — see `alloy-orchestration.ts:186`.

**Workflow types:** `investigation | remediation | escalation | review | notification | report | custom`. Each type has a default step template (see `workflow-state-model.md`).

**Step state machine:** `pending → running → completed | failed | skipped`. Transitions are recorded via `startStep()` and `advanceStep()` and persisted to both `alloyWorkflows.steps` and `alloyWorkflowRuns.stepsExecuted`.

**Audit:** Every step transition writes `step_${n}_${result}` to `alloyAuditLog` with `entityType = "workflow"`.

**Invariants:**
- Steps must execute in `step` number order; no skipping forward.
- A workflow with `requiresApproval = true` cannot transition past EVALUATE without traversing APPROVE.
- `retryCount ≤ maxRetries` (default 3); after exhaustion the workflow is terminal-failed.

### 3.3 DECIDE — emit a typed recommendation with evidence

**Trigger:** An AI agent, a deterministic rule, or a human operator generates a recommended action for the workflow.

**State entry:** A row in `alloy_ai_decisions` (`AlloyDecision`) with `status = "proposed"`. AI-generated decisions populate `modelRoute`, `rawInput`, `rawOutput`. Human-generated decisions populate `modelRoute = "human"`.

**Required fields:** `decisionId` (UUID), `workflowId`, `signalIds[]`, `recommendedAction`, `rationaleSummary`, `evidenceRefs[]`, `confidence`, `riskLevel ∈ {P0..P4}`, `approvalRequired`, `modelRoute`, `schemaVersion = "2.0.0"`.

**Evidence requirement:** [Target contract] `evidenceRefs[]` SHOULD contain at least one entry citing the originating signals, prior workflows/audits, retrievals, or referenced policies. Each entry is a typed object — see `AlloyDecisionEvidenceRef` in §3 of `action-and-decision-receipts.md` — not an opaque string. The current schema does not block empty `evidenceRefs[]` at insert; this is a convention enforced at the agent layer and a target for schema-level enforcement.

**Status lifecycle:** `proposed → pending_approval → approved | rejected → executed | expired`.

**Audit:** [Implemented] Every status transition writes to `alloy_ai_audit_log` with `endpoint`, `model`, `routeClass`, `confidence`, `latencyMs`, `approverUserId`, `approverRoles`, `metadata`.

**Invariants:**
- [Implemented] `confidence ∈ [0, 1]`.
- [Implemented] `riskLevel = P0 | P1` forces `approvalRequired = true` in `createAlloyDecision()`.
- [Target contract] Low-confidence decisions (`confidence < 0.5`) should also require approval; this is currently a recommended runtime check, not a schema-level invariant.
- [Implemented] `schemaVersion` is the literal `"2.0.0"`; downgrades are not modeled in the type.

### 3.4 APPROVE — covenant policy gate

**Trigger:** A workflow or decision with `requiresApproval = true` enters the approval state.

**State entry:** A row in `approvalRequests` with `status = "pending"`, plus a row in `alloyApprovals` linked to the workflow. The workflow status becomes `waiting_approval` and `approvalState = "pending"`.

**Required fields:** `id`, `orgId`, `resourceType`, `resourceId`, `title`, `actionClass`, `priority`, `requestedById`, `requestedByRole`, `requiredApproverRole`, `correlationId`, `serviceAttribution`, `expiresAt`, `payload`.

**Status lifecycle:** `pending → approved | rejected | revised | escalated | expired | withdrawn`.

**Reviewer constraint:** [Target contract] `reviewerUserId !== requestedById` — an actor MUST NOT approve their own request (separation of duties). The route layer requires reviewer roles via `requireRole(...)` but does not currently reject requester-as-reviewer at the route or DB layer; the policy is enforced by operator workflow and audit review today, with route- and DB-level enforcement as the hardening target.

**Audit:** Every transition writes to `approvalAuditTrail` with `actorId`, `actorRole`, `fromStatus`, `toStatus`, `note`, `correlationId`, `serviceAttribution`. The transition is also mirrored into `alloyAuditLog` with `entityType = "approval"`.

**Invariants:**
- An expired approval cannot be reviewed; the workflow is set to `failed` with `errorMessage = "Approval expired without review"`.
- An approved approval enqueues `ALLOY_JOB_TYPES.RUN_WORKFLOW` automatically.
- `requiredApproverRole` is checked against `req.user.roles` in `requireRole()` middleware before the review endpoint executes.

### 3.5 ACT — execute the action and record the receipt

**Trigger:** An approved workflow advances past APPROVE, or an auto-approved workflow (no approval required) begins execution.

**State entry:** A row in `alloyWorkflowRuns` with `status = "started"` and a per-step row in `alloyActions` with `status = "queued"`. Execution is performed by the durable job queue (`durableJobQueue`) under `ALLOY_JOB_TYPES.RUN_WORKFLOW` or `ALLOY_JOB_TYPES.EXECUTE_ACTION`.

**Status lifecycle (action):** `queued → in_progress → completed | failed | cancelled | skipped`.
**Status lifecycle (run):** `started → completed | failed`.

**Action receipt:** Captured in `alloyActions.result` as a structured JSON payload containing: `outcome`, `durationMs`, `sideEffects[]`, `externalRefs[]`. See `action-and-decision-receipts.md` for the full schema.

**Retry policy:** Failed runs trigger up to `MAX_RETRIES = 3` retries with exponential backoff (`retryDelayMs(attempt) = min(1000 * 2^attempt, 30_000)`). After exhaustion, the workflow is terminal-failed and an audit entry `retry_exhausted` is written.

**Invariants:**
- [Target contract] Every action SHOULD be linked to a workflow (`workflowId`). The schema currently allows `workflowId` to be null; orphan actions exist in some legacy paths and are flagged for cleanup. DB-level `NOT NULL` is a hardening target.
- [Target contract] An action with `status = "completed"` SHOULD have `completedAt` and a non-empty `result`. Some current callers (e.g. `recordAlloyAction` in legacy GraphQL paths) insert completed actions without a `result` payload; tightening this is a hardening target.
- [Target contract] An action with `status = "failed"` SHOULD have `errorMessage` populated. Enforced by application convention; DB CHECK is a hardening target.

### 3.6 PROVE — record proof across two surfaces

The platform records audit and provenance across two complementary surfaces:

**Surface A: Per-entity audit log (`alloyAuditLog`)** — [Implemented] Every workflow, signal, action, artifact, and approval transition in `alloy-orchestration.ts` writes a row via `writeAuditLog()` with `entityType`, `entityId`, `action`, `actorType`, `actorUserId`, `previousState`, `newState`, `notes`, `correlationId`. This is the high-volume, high-fidelity per-entity history.

**Surface B: Hash-chained compliance ledger (`auditChainEvents`)** — [Implemented] An append-only SHA-256 hash-chained ledger written at `POST /audit-chain/events` (`routes/audit-chain.ts`). Each event computes `eventHash = sha256(prevHash || action || actor || domain || actionType || entityId || createdAt)` with `prevHash` referencing the previous event (`"genesis"` for the first per-org). [Target contract] All consequential loop transitions (decision approved, action executed, override invoked, policy changed) should also be mirrored to this surface; orchestration paths today write Surface A and selectively write Surface B from route handlers.

**`auditChainEvents` schema:** `id`, `orgId`, `actorUserId`, `actorLabel`, `action`, `actionType`, `domain`, `entityId`, `entityType`, `riskLevel` (free-text, defaulting to `"low"` — not the same enum as `AlloyDecision.riskLevel`), `complianceTags[]`, `outcome`, `prevHash`, `eventHash`, `details`, `metadata`, `createdAt`.

**Verifiability:** [Implemented] `GET /audit-chain/verify` recomputes every hash and returns `{ intact, chainLength, brokenAt }`.

**Proof Chain (AI-specific):** [Implemented] AI-generated content is tagged via `proofChain.tagAIContent()`, producing a `proofChain` row with:
- `sourceClass ∈ {llm_generated, llm_summarized, llm_extracted, human_authored, system_computed, external_feed, hybrid}`
- `reviewState ∈ {unreviewed, reviewed, approved, flagged, retracted}` (default `unreviewed`)
- `exportSafetyState ∈ {safe, restricted, blocked, pending_review}` (default `pending_review`)

`assertExportSafe()` throws when `exportSafetyState ∈ {restricted, blocked}`. Content in `pending_review` is permitted to flow internally but flagged for review before external export.

**Invariants:**
- [Implemented] `auditChainEvents` and `alloyAuditLog` are append-only at the application layer (no UPDATE/DELETE routes exist).
- [Target contract] DB-role separation should restrict audit tables to INSERT-only for application roles; this is a hardening target.
- [Implemented] A broken chain (`intact: false`) is surfaced by the verify endpoint and treated as a P0 incident operationally.
- [Implemented] Export of `restricted`/`blocked` AI content fails closed via `assertExportSafe()`.

---

## 4. Cross-stage invariants

These invariants hold across the entire loop and are enforced at the platform layer, not at the domain pack layer:

1. **Correlation ID continuity.** [Implemented for audit rows; Target contract for workflow-level persistence] Every stage transition propagates a `correlationId` (job ID, request ID, or workflow ID) through audit writes (`alloyAuditLog.correlationId`, `approvalAuditTrail.correlationId`, `proofChain.correlationId`). Note: `alloyWorkflows` and `alloyWorkflowRuns` do not currently have a dedicated `correlationId` column — continuity is established via the audit trail and job payloads, with first-class column persistence on the workflow row as a hardening target.
2. **Actor attribution continuity.** Every state transition records `actorType ∈ {user, system, agent}` and, where applicable, `actorUserId`. Anonymous transitions are allowed only for `actorType = "system"`. See `agent-attribution-model.md`.
3. **Receipt sufficiency.** Every consequential action (anything that mutates external state, sends a notification, or moves money) must produce both an action receipt (in `alloyActions.result`) and a decision receipt (in `alloy_ai_decisions` if AI-driven, or `approvalRequests.payload` if human-driven). See `action-and-decision-receipts.md`.
4. **Approval before execution.** A workflow with `requiresApproval = true` cannot enter ACT without `approvalState = "approved"`. Enforced in `startWorkflowRun()` (`alloy-orchestration.ts:231`).
5. **Outcome capture.** Within 24 hours of ACT completion, the workflow MUST call `outcomeGraph.recordOutcome()` with a `result ∈ {success, partial, failure, no_signal}`. Workflows missing an outcome record after 24h are flagged in the Outcome Graph dashboard.

---

## 5. Where the loop already exists in code

The loop is not aspirational — it is implemented and exercised in production paths. Concrete annotations:

| Stage    | Reference implementation                                                         |
|----------|----------------------------------------------------------------------------------|
| OBSERVE  | `alloy-orchestration.ts:processSignalIntoWorkflow()` — signal → workflow seed     |
| EVALUATE | `alloy-orchestration.ts:startWorkflowRun()`, `advanceWorkflowStep()`              |
| DECIDE   | `alloy-decision-store.ts:insertDecision()`, `updateDecisionStatus()`              |
| APPROVE  | `routes/approvals.ts` (review, escalate, comment), `covenant-policy.reviewApproval()` |
| ACT      | `durableJobQueue.register(ALLOY_JOB_TYPES.RUN_WORKFLOW)` — `alloy-orchestration.ts:586` |
| PROVE    | `routes/audit-chain.ts:POST /events`, `proof-chain.tagAIContent()`                 |

Domain packs (Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo) are implementations of this loop bound to a specific signal source and action vocabulary. None of them implement governance independently.

---

## 6. What is explicitly out of scope of this spec

- The visual representation of the loop in operator UX. Covered by the operator differentiation task.
- Public-site copy describing the loop. Covered by `category-narrative-lock.md`.
- The signal sources and action types specific to each domain pack. Covered by domain-pack specs.
- The Monte Carlo simulation engine details. Covered by `lib/monte-carlo` documentation.
- The Outcome Graph learning calibration algorithm. Covered by Outcome Graph spec.

---

## 7. Compatibility commitments

This spec is compatible with the existing 685-table production database without migration. The objects referenced (`alloySignals`, `alloyWorkflows`, `alloyApprovals`, `alloyActions`, `alloyArtifacts`, `alloyAuditLog`, `alloyWorkflowRuns`, `approvalRequests`, `approvalAuditTrail`, `alloy_ai_decisions`, `alloy_ai_audit_log`, `auditChainEvents`) all exist in the current schema and are exercised by the API server at `artifacts/api-server`.

Future additions (e.g. new evidence types, new actor categories) extend rather than replace the loop. Schema versioning is captured in `AlloyDecision.schemaVersion` and in migration history.

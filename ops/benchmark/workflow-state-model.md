# Workflow State Model

**Status:** Canonical
**Source of truth:** `lib/db/src/schema/alloy.ts`, `artifacts/api-server/src/lib/alloy-orchestration.ts`
**Companion:** `operating-loop-spec.md`

---

## 1. Purpose

This spec defines the workflow state machine that every Alloy workflow obeys, the default step templates per workflow type, and the mapping from major operator workflows to the canonical six-stage loop.

A workflow is the runtime container that ties signals, decisions, approvals, actions, artifacts, and audit entries together. A `correlationId` is propagated through audit rows, job payloads, and approval-trail entries to stitch these objects together; first-class `correlationId` columns on the workflow row itself are a [Target contract] hardening item — see `operating-loop-spec.md` §4. Every consequential action on the platform runs inside a workflow.

---

## 2. Workflow status lifecycle

```
                         ┌─────────────────────────────────────────────┐
                         │                                             │
   ┌─────┐    ┌─────────┐│   ┌─────────┐    ┌──────────────────┐      │
   │draft│ ─► │ pending │┼─► │ running │ ─► │ waiting_approval │ ─┐   │
   └─────┘    └─────────┘│   └─────────┘    └──────────────────┘  │   │
                         │        │              │       │        │   │
                         │        ▼              ▼       ▼        ▼   │
                         │   ┌──────────┐    ┌────────┐ ┌──────────┐  │
                         │   │completed │    │approved│ │ rejected │  │
                         │   └──────────┘    └────────┘ └──────────┘  │
                         │        │              │                    │
                         │        │              └────────────────────┘
                         │        ▼
                         │   ┌────────┐    ┌───────────┐
                         └─► │ failed │ ◄─ │ cancelled │
                             └────────┘    └───────────┘
                                  │
                                  ▼ (retry < MAX_RETRIES)
                              pending
```

| Status              | Meaning                                                                  | Terminal? |
|---------------------|--------------------------------------------------------------------------|-----------|
| `draft`             | Created but not yet enqueued                                             | No        |
| `pending`           | Queued, awaiting execution                                               | No        |
| `running`           | Currently executing steps                                                | No        |
| `waiting_approval`  | Paused at an approval gate                                               | No        |
| `approved`          | Approval received; ready to resume                                       | No        |
| `rejected`          | Approval rejected; workflow terminates                                   | Yes       |
| `completed`         | All steps finished successfully                                          | Yes       |
| `failed`            | Terminal failure (after retry exhaustion or expired approval)            | Yes       |
| `cancelled`         | Cancelled by an operator before completion                               | Yes       |

**Retry semantics:** A workflow that ends in `failed` with `retryCount < MAX_RETRIES` (default 3) is automatically returned to `pending` with `retryCount += 1` and a delayed re-enqueue. Backoff: `min(1000 * 2^attempt, 30_000)` ms. After `MAX_RETRIES`, the workflow is terminal-failed.

---

## 3. Workflow types and default step templates

Workflow type is a categorization of intent that determines the default step template. Templates are produced by `buildDefaultSteps(type, signal)` in `alloy-orchestration.ts:186` and are seeded into `alloyWorkflows.steps` at creation time.

### 3.1 `investigation` (default for triaged signals)

```
1. intake          — Signal intake and validation
2. analysis        — Signal analysis and classification
3. recommendation  — Generate recommendations
4. output          — Generate output artifact
```

### 3.2 `remediation`

```
1. intake          — Signal intake and validation
2. analysis        — Signal analysis and classification
3. planning        — Build remediation plan
4. execution       — Execute remediation steps
5. verification    — Verify remediation success
```

### 3.3 `escalation`

```
1. intake          — Signal intake and validation
2. analysis        — Signal analysis and classification
3. escalation      — Escalate to responsible owner
4. approval        — Approval gate
5. resolution      — Confirm resolution
```

### 3.4 `review`, `notification`, `report`, `custom`

These types use the default `intake → analysis → recommendation → output` template unless overridden by the caller via `processSignalIntoWorkflow({ workflowType, ... })` followed by a step replacement.

### 3.5 Step state lifecycle

Each step independently transitions through:

```
pending → running → completed | failed | skipped
```

Transitions are recorded in both `alloyWorkflows.steps` (current canonical state) and `alloyWorkflowRuns.stepsExecuted` (per-run history). On every transition, an `alloyAuditLog` row is written with `action = "step_<n>_<result>"`.

**Invariants:**
- Steps execute in `step` number order. The first `pending` step is selected by `nextPendingStep()` after each completion.
- A `failed` step terminates the run; the workflow either retries (if under `MAX_RETRIES`) or terminal-fails.
- A `skipped` step is permitted only when the previous step's `result.skipNext = true`.

---

## 4. Approval state vs workflow status

These are independent state machines that interact at the `waiting_approval` gate:

| Workflow status     | Approval state | Allowed?                                                |
|---------------------|----------------|---------------------------------------------------------|
| `pending`           | `none`         | ✅ — workflow doesn't require approval                  |
| `pending`           | `pending`      | ✅ — approval requested before execution started        |
| `running`           | `none`         | ✅ — auto-approved workflow executing                   |
| `waiting_approval`  | `pending`      | ✅ — paused at gate                                     |
| `approved`          | `approved`     | ✅ — gate cleared, ready to resume                      |
| `rejected`          | `rejected`     | ✅ — terminal                                           |
| `running`           | `pending`      | ❌ — invariant violation; workflow must pause           |
| `completed`         | `pending`      | ❌ — cannot complete an unapproved workflow             |

The check is enforced in `startWorkflowRun()`:

```ts
if (workflow.requiresApproval && workflow.approvalState !== "approved" && !options.overrideApproval) {
  throw new Error(`Workflow ${workflowId} requires approval before it can run`);
}
```

`overrideApproval = true` is reserved for system-initiated workflows under specific covenant policies (e.g. `auto_run_low_risk`) and is itself audited.

---

## 5. Mapping major operator workflows to the canonical loop

This table maps the operator-facing workflow types to the six-stage loop. Each stage corresponds to one or more steps in the workflow template.

### 5.1 Investigation workflow (default for any triaged signal)

| Loop stage | Workflow step(s)            | Backing object(s)                      |
|------------|----------------------------|----------------------------------------|
| OBSERVE    | (pre-workflow)              | `alloySignals`                         |
| EVALUATE   | step 1: intake, step 2: analysis | `alloyWorkflows.steps`, `alloyWorkflowRuns.stepsExecuted` |
| DECIDE     | step 3: recommendation      | `alloy_ai_decisions`                   |
| APPROVE    | (gate, if `requiresApproval = true`) | `approvalRequests`, `alloyApprovals` |
| ACT        | step 4: output              | `alloyActions`, `alloyArtifacts`       |
| PROVE      | (continuous, every transition) | `auditChainEvents`, `proofChain`     |

### 5.2 Remediation workflow

| Loop stage | Workflow step(s)                                         |
|------------|----------------------------------------------------------|
| OBSERVE    | (pre-workflow)                                           |
| EVALUATE   | step 1: intake, step 2: analysis, step 3: planning      |
| DECIDE     | step 3: planning produces a `recommendedAction` decision |
| APPROVE    | (gate before step 4: execution)                          |
| ACT        | step 4: execution                                        |
| PROVE      | step 5: verification + continuous audit                  |

### 5.3 Escalation workflow

| Loop stage | Workflow step(s)                                         |
|------------|----------------------------------------------------------|
| OBSERVE    | (pre-workflow)                                           |
| EVALUATE   | step 1: intake, step 2: analysis                         |
| DECIDE     | step 3: escalation (selects escalation target)           |
| APPROVE    | step 4: approval                                         |
| ACT        | (escalation notification side-effect)                    |
| PROVE      | step 5: resolution + continuous audit                    |

### 5.4 Domain-specific workflows

Domain packs may extend the templates with domain-specific steps, but they MUST preserve the loop ordering. Examples:

- **Aegis (security investigation):** `intake → enrich (MITRE ATT&CK) → correlate → recommendation → simulation → policy → execution → proof → outcome → learning`
- **Vessels (sanctions screening):** `intake → AIS-resolve → sanctions-check → recommendation → simulation → policy → execution → proof → outcome → learning`
- **Terra (distress deal):** `intake → ownership-resolve → market-comp → recommendation → simulation → policy → execution → proof → outcome → learning`
- **PRISM Counsel (matter intake):** `intake → conflicts-check → categorize → recommendation → simulation → policy → execution → proof → outcome → learning`

Each domain pack's workflow template is documented in its own pack spec; this document defines only the platform-layer state machine they must conform to.

---

## 6. Workflow run vs workflow

A `alloyWorkflow` is the canonical container; a `alloyWorkflowRun` is a single execution attempt. The relationship is 1-to-many — a workflow with retries has multiple runs, each with its own `runNumber`, `startedAt`, `completedAt`, `durationMs`, `errorMessage`, `inputs`, `outputs`, and `stepsExecuted`.

| Field             | `alloyWorkflows`            | `alloyWorkflowRuns`         |
|-------------------|-----------------------------|------------------------------|
| Identity          | `id` (stable across retries)| `id` (one per attempt)       |
| Status            | Latest known status         | Status of this attempt only  |
| Steps             | Canonical step state        | History of this attempt      |
| `inputs`/`outputs`| Latest values               | Per-attempt snapshot         |
| `runNumber`       | (n/a)                       | Monotonically increasing     |
| `correlationId`   | Propagated via audit + job payloads (no column today) | Job-scoped per run, propagated via job payload |

This separation enables: (a) clean retry semantics, (b) per-attempt forensic analysis, (c) deterministic outcome attribution to the run that produced the action.

---

## 7. Cancellation, expiry, and timeout

| Condition                         | Result                                                     |
|-----------------------------------|------------------------------------------------------------|
| Operator cancels a `running` workflow | `status → cancelled`, current step → `skipped`, audit `cancelled_by_user` |
| Approval `expiresAt` reached      | `status → failed`, `errorMessage = "Approval expired without review"`, audit `approval_expired` |
| Job execution exceeds `maxRetries`| `status → failed` (terminal), audit `retry_exhausted`      |
| Step exceeds its own timeout      | Step → `failed`, retry policy applies                      |

Approval expiry is enforced by a scheduled job (`ALLOY_JOB_TYPES.SCHEDULED_REVIEW`) enqueued at approval creation time with `scheduledAt = expiresAt`. See `alloy-orchestration.ts:659`.

---

## 8. Compatibility

All status enums, step templates, and transitions in this spec correspond to columns and code paths that already exist in production. No schema changes are required to satisfy this spec — it documents what is already enforced.

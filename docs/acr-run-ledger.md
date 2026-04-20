# ACR Run Ledger & Approval Interrupts

## Overview

The Alloy Cognitive Runtime (ACR) adds two capabilities to the SZL governance stack:

1. **Governed Approval Interrupts** — a running workflow node can pause, surface a typed `ApprovalRequest` to a human operator, and resume deterministically after a signed decision is recorded.

2. **Run Ledger** — every material run produces one auditable artifact (`RunLedgerEntry`) that fuses plan + retrieval + tools + approvals + policy + eval. The run is only marked `complete` if all quality gates pass.

---

## Packages

| Package | Role |
|---|---|
| `@szl-holdings/contracts/governance` | Shared Zod schemas (wire types) |
| `@workspace/approvals-inbox` | Governed approval store + service API |
| `@workspace/run-ledger` | `RunLedgerBuilder`, in-memory store, quality gate evaluator |
| `@workspace/cognitive-runtime` | Orchestrator + `approval-interrupt.ts` helpers |

---

## Approval Interrupt Contract

### Triggering an interrupt

A step executor signals an interrupt by returning an object with `__approvalInterrupt`:

```typescript
// Inside a StepExecutorFn:
return {
  __approvalInterrupt: {
    actionLabel: "Execute charter party amendment",
    payload: { amendment: "article_14b", newValue: "8h" },
    policyReason: "Charter mutations require dual-operator approval",
    evidenceSummary: "Southern route: 11.8% fuel saving",
    suggestedDecision: "approve",
    expiresAt: Date.now() + 30 * 60_000,
  },
};
```

The cognitive-runtime execute phase detects this via `extractApprovalInterrupt()`, calls `raiseApprovalInterrupt()` to persist the `ApprovalRequest`, and sets the run status to `pending_approval`.

### ApprovalInterruptSpec fields

| Field | Type | Description |
|---|---|---|
| `actionLabel` | `string` | Human-readable label for the proposed action |
| `payload` | `object` | Structured description of what the action will do |
| `policyReason` | `string` | Policy rule ID or reason approval is required |
| `evidenceSummary` | `string` | Brief summary of supporting evidence |
| `suggestedDecision` | `"approve" \| "deny" \| "escalate"` | Operator-facing suggestion |
| `expiresAt` | `number` | Unix ms expiry for this request |

### Resuming after a decision

```typescript
import { resolveApprovalInterrupt, buildResumeContext } from "@workspace/cognitive-runtime";

const result = resolveApprovalInterrupt({
  requestId: "...",
  verdict: "approve",
  actor: "elena.vasquez",
  reason: "Within risk tolerance. Approving.",
});

const resumeCtx = buildResumeContext(
  approvalRequest.checkpointRef!,
  result.decision,
);

// Call the orchestrator again with the resume context:
await run(objective, { ...ctx, ...resumeCtx });
```

Resumption is **idempotent**: repeated calls with the same `requestId` + `verdict` return the existing decision without creating duplicates.

### Denial/escalation

When a decision is `deny` or `escalate`, `decideApproval()` returns a `GovernanceMemoryRecord` that should be forwarded to `memory-fabric` for long-term retention:

```typescript
if (result.governanceMemory) {
  await memoryStore.save({
    type: "governance",
    content: JSON.stringify(result.governanceMemory),
    // ...
  });
}
```

---

## Run Ledger

### Structure (`RunLedgerEntry`)

| Field | Type | Description |
|---|---|---|
| `ledgerId` | UUID | Unique ID for this ledger entry |
| `runId` | string | Cognitive runtime run ID |
| `traceId` | string? | Distributed trace ID |
| `objective` | string | Run objective |
| `planSummary` | string? | Human-readable plan summary |
| `planStepCount` | number | Number of plan steps |
| `sourcesConsulted` | `LedgerSource[]` | Evidence sources with retrieval scores |
| `toolCalls` | `LedgerToolCall[]` | Each tool call with latency + outcome |
| `approvalEvents` | `LedgerApprovalEvent[]` | All approval interrupt decisions |
| `policyOutcomes` | `LedgerPolicyOutcome[]` | Policy engine results |
| `finalArtifacts` | `string[]` | Output artifact identifiers |
| `evalScores` | `LedgerEvalScore[]` | Evaluation metric scores |
| `stageTimings` | `LedgerStageTiming[]` | Per-phase duration breakdown |
| `gateStatus` | `"complete" \| "degraded" \| "blocked" \| "pending"` | Quality gate verdict |
| `gateResult` | `QualityGateResult?` | Detailed gate evaluation |

### Building a ledger entry

```typescript
import { RunLedgerBuilder } from "@workspace/run-ledger";
import { evaluateQualityGate } from "@workspace/run-ledger/quality-gate";

const builder = new RunLedgerBuilder({ runId, traceId, objective });
builder
  .setPlan("Optimize voyage routing", 4)
  .addSource({ sourceId: "ais-001", sourceType: "sensor", retrievalScore: 0.92 })
  .addToolCall({ toolId: "optimizer", stepId: "s1", latencyMs: 342, outcome: "success" })
  .addApprovalEvent({ requestId: "...", stepId: "s2", verdict: "approve", actor: "op1" });

const partialEntry = builder.build();
const gateResult = evaluateQualityGate(partialEntry, {
  completionThreshold: 0.5,
  evidenceCoverageThreshold: 0.3,
  toolFailureRateThreshold: 0.5,
});

const finalEntry = builder.build(gateResult);
defaultRunLedgerStore.save(finalEntry);
```

---

## Quality Gate Evaluator

`evaluateQualityGate(ledger, profile)` checks five gates:

| Gate | Description |
|---|---|
| `completion` | Fraction of tool calls that succeeded ≥ `completionThreshold` |
| `evidence_coverage` | Average retrieval score ≥ `evidenceCoverageThreshold` |
| `policy_block` | No policy outcomes with result `"block"` |
| `tool_failure_rate` | Fraction of failed tool calls ≤ `toolFailureRateThreshold` |
| `latency_budget` | Total duration ≤ `latencyBudgetMs` (0 = disabled) |

Returns `{ status: "complete" | "degraded" | "blocked", failingGates, recommendedNextAction }`.

A run is only marked `complete` if no gates fail. Failing a policy-block gate produces `blocked`; other failures produce `degraded`.

Profile thresholds can be set per-run or per-domain profile.

---

## API Endpoints

All endpoints require authentication via the standard API middleware.

### Approvals

```
GET  /api/v1/approvals
  ?status=pending|approved|denied|escalated|timed_out
  ?tenantId=...
  ?profileId=...
  ?limit=50&offset=0

GET  /api/v1/approvals/:id

POST /api/v1/approvals/:id/decide
  Body: { verdict: "approve"|"deny"|"escalate", actor: string, reason: string }
```

### Run Ledger

```
GET  /api/v1/runs
  ?traceId=...
  ?gateStatus=complete|degraded|blocked|pending
  ?limit=50&offset=0

GET  /api/v1/runs/:runId/ledger
```

---

## Command UI Routes

The Substrate section of Unified Command exposes:

| Route | Component | Description |
|---|---|---|
| `/substrate/governed-approvals` | `GovernedApprovals` | Lists governed approval interrupts; operator can decide |
| `/substrate/ledger` | `RunLedgerList` | Lists all run ledger entries with gate status |
| `/substrate/ledger/:runId` | `RunLedgerPage` | Full detail view of a single run ledger entry |

---

## Integration Notes

### cognitive-runtime consumers

Any platform that already uses `cognitive-runtime` can opt into the approval interrupt by:

1. Returning `{ __approvalInterrupt: ApprovalInterruptSpec }` from a `StepExecutorFn` when human approval is required.
2. Calling `run()` again with the `resumeFromCheckpoint` + `metadata.approvalDecision` context returned by `buildResumeContext()`.

### Run Ledger integration

Build a `RunLedgerBuilder` at the start of each orchestrator run, subscribe to phase/tool lifecycle events, and call `builder.build(gateResult)` + `store.save()` at the end. The store can later be swapped for a Postgres-backed implementation via `defaultRunLedgerStore.setBackend(pgStore)`.

### Platforms using cognitive-runtime

- **Alloy** (`alloy-orchestration.ts`) — primary consumer; should create a ledger builder per run
- **Lyte** (`lyte-cognitive.ts`) — already tracks run status; can add ledger emission in the run lifecycle
- **Pulse** (`pulse.ts`) — briefing generator; approval interrupts relevant for high-confidence actions
- **Vessels**, **Terra**, **Firestorm** — domain-specific orchestrators; opt-in per domain policy profile

---

## Smoke Test

```bash
pnpm tsx scripts/acr-smoke.ts
```

Drives the full lifecycle: plan → retrieval → tool call → approval interrupt → operator decision → resume → eval → ledger → quality gate.

/**
 * ACR (Alloy Cognitive Runtime) End-to-End Smoke Script
 *
 * Drives the full governed run loop:
 *   plan → retrieval → tool call → approval interrupt → operator decision
 *   → resume → eval → ledger written → quality gate evaluated
 *
 * Usage:
 *   pnpm ts-node --esm scripts/acr-smoke.ts
 *   # or with tsx:
 *   pnpm tsx scripts/acr-smoke.ts
 *
 * The script uses in-memory stores only (no Postgres required). Each step
 * logs a structured output so you can follow the lifecycle in the terminal.
 */

import { randomUUID } from "crypto";
import {
  createApprovalRequest,
  decideApproval,
  listApprovalRequests,
} from "@workspace/approvals-inbox";
import {
  RunLedgerBuilder,
  defaultRunLedgerStore,
} from "@workspace/run-ledger";
import { evaluateQualityGate } from "@workspace/run-ledger/quality-gate";
import type { ApprovalInterruptSpec, LedgerApprovalEvent } from "@szl-holdings/contracts/governance";

const LOG = (tag: string, data: unknown) =>
  console.log(`\n[${tag}]`, JSON.stringify(data, null, 2));

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Step 1: Simulate a plan ──────────────────────────────────────────────────
const runId = randomUUID();
const traceId = randomUUID();
const objective = "Analyze Q2 voyage P&L and recommend charter party amendments";

LOG("PLAN", { runId, traceId, objective, steps: 4 });
await sleep(50);

// ─── Step 2: Simulate retrieval ───────────────────────────────────────────────
const sources = [
  { sourceId: "ais-feed-001", sourceType: "sensor", retrievalScore: 0.92, summary: "Live AIS data for 12 vessels" },
  { sourceId: "charter-db-001", sourceType: "document", retrievalScore: 0.87, summary: "Q2 charter party clauses" },
  { sourceId: "bunker-prices-001", sourceType: "api", retrievalScore: 0.79, summary: "Rotterdam bunker price index" },
];
LOG("RETRIEVAL", { sourcesConsulted: sources.length, avgScore: 0.86 });
await sleep(50);

// ─── Step 3: Simulate a tool call ─────────────────────────────────────────────
const toolCall = {
  toolId: "voyage-optimizer",
  stepId: "step-001",
  latencyMs: 342,
  outcome: "success" as const,
};
LOG("TOOL_CALL", toolCall);
await sleep(50);

// ─── Step 4: Approval interrupt ───────────────────────────────────────────────
// The voyage-optimizer recommends a charter party amendment — this requires
// human approval before execution proceeds.
const interruptSpec: ApprovalInterruptSpec = {
  actionLabel: "Execute charter party amendment — extend ETA window to 8 hours",
  payload: { amendment: "article_14b_eta_window", newValue: "8h", previousValue: "6h" },
  policyReason: "Charter party mutations require dual-operator approval (policy: vessels-charter-gate-v1)",
  evidenceSummary: "Southern route reduces fuel by 11.8%. ETA deviation +2.1h within 8h window. Bunker savings: $14,280.",
  suggestedDecision: "approve",
  expiresAt: Date.now() + 30 * 60_000,
};

const approvalRequest = createApprovalRequest({
  runId,
  traceId,
  stepId: "step-002",
  stepName: "Execute charter party amendment",
  checkpointRef: `ckpt-${runId}-step1`,
  interrupt: interruptSpec,
});
LOG("APPROVAL_INTERRUPT", { requestId: approvalRequest.id, status: approvalRequest.status });

// Verify it appears in the pending list
const pending = listApprovalRequests({ status: "pending" });
console.log(`\n[INBOX] Pending approvals: ${pending.length}`);

// ─── Step 5: Operator approves ────────────────────────────────────────────────
await sleep(100);

const decisionResult = decideApproval({
  requestId: approvalRequest.id,
  verdict: "approve",
  actor: "elena.vasquez",
  reason: "Fuel savings well within risk tolerance. ETA deviation acceptable per charter party Article 14(b). Approving.",
});
LOG("OPERATOR_DECISION", {
  decisionId: decisionResult.decision.decisionId,
  verdict: decisionResult.decision.verdict,
  actor: decisionResult.decision.actor,
  updatedStatus: decisionResult.updatedRequest.status,
});

// ─── Step 6: Resume — simulate remainder of run ───────────────────────────────
await sleep(50);
LOG("RESUME", { runId, fromCheckpoint: approvalRequest.checkpointRef, withDecision: decisionResult.decision.decisionId });

const remainingToolCalls = [
  { toolId: "charter-writer", stepId: "step-003", latencyMs: 210, outcome: "success" as const },
  { toolId: "proof-chain-writer", stepId: "step-004", latencyMs: 88, outcome: "success" as const },
];

// ─── Step 7: Build the Run Ledger ─────────────────────────────────────────────
const builder = new RunLedgerBuilder({ runId, traceId, objective });

builder.setPlan(objective, 4);

for (const source of sources) {
  builder.addSource(source);
}

builder.addToolCall(toolCall);

const approvalEvent: LedgerApprovalEvent = {
  requestId: approvalRequest.id,
  stepId: approvalRequest.stepId,
  verdict: "approve",
  actor: decisionResult.decision.actor,
  decidedAt: decisionResult.decision.decidedAt,
};
builder.addApprovalEvent(approvalEvent);

for (const call of remainingToolCalls) {
  builder.addToolCall(call);
}

builder.addPolicyOutcome({
  policyId: "vessels-charter-gate-v1",
  result: "require-approval",
  tier: "operator-approved",
  reason: "Charter mutation approved by operator",
});

builder.addEvalScore({ metric: "evidence_coverage", score: 0.86, threshold: 0.3, passed: true });
builder.addEvalScore({ metric: "completion_rate", score: 1.0, threshold: 0.5, passed: true });

builder.addStageTiming({ phase: "plan", startedAt: Date.now() - 800, durationMs: 120 });
builder.addStageTiming({ phase: "execute", startedAt: Date.now() - 680, durationMs: 342 });
builder.addStageTiming({ phase: "pending_approval", startedAt: Date.now() - 338, durationMs: 100 });
builder.addStageTiming({ phase: "resume", startedAt: Date.now() - 238, durationMs: 298 });

// ─── Step 8: Evaluate quality gate ────────────────────────────────────────────
const partialLedger = builder.build();
const gateResult = evaluateQualityGate(partialLedger, {
  completionThreshold: 0.5,
  evidenceCoverageThreshold: 0.3,
  toolFailureRateThreshold: 0.5,
});
LOG("QUALITY_GATE", gateResult);

// ─── Step 9: Write final ledger entry ─────────────────────────────────────────
const finalEntry = builder.build(gateResult);
defaultRunLedgerStore.save(finalEntry);

LOG("LEDGER_WRITTEN", {
  ledgerId: finalEntry.ledgerId,
  runId: finalEntry.runId,
  gateStatus: finalEntry.gateStatus,
  sourcesConsulted: finalEntry.sourcesConsulted.length,
  toolCalls: finalEntry.toolCalls.length,
  approvalEvents: finalEntry.approvalEvents.length,
  totalDurationMs: finalEntry.totalDurationMs,
});

// ─── Verify retrieval ─────────────────────────────────────────────────────────
const retrieved = defaultRunLedgerStore.getByRunId(runId);
console.log("\n[VERIFY] Ledger retrieved from store:", retrieved?.ledgerId === finalEntry.ledgerId ? "✓ OK" : "✗ FAIL");
console.log("[VERIFY] Gate status:", retrieved?.gateStatus);
console.log("[VERIFY] All gates passed:", gateResult.failingGates.length === 0 ? "✓ YES" : `✗ NO — ${gateResult.failingGates.map(g => g.gate).join(", ")}`);

console.log("\n✓ ACR smoke test completed successfully.\n");

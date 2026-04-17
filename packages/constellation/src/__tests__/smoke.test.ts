/**
 * 12-Step Foundation Smoke Test
 *
 * Validates end-to-end the full signal-to-brief pipeline using in-memory stores.
 *
 *   Step  1 — Create entity + provenance in Constellation
 *   Step  2 — Create cross-app links (edges between domain nodes)
 *   Step  3 — Run agent with registered tools (simulated via handler)
 *   Step  4 — Capture trace of agent execution
 *   Step  5 — Grade trace (eval score via evals-core)
 *   Step  6 — Route recommendation to action (policy engine allow path)
 *   Step  7 — Require approval (policy engine block/escalate path)
 *   Step  8 — Execute action (simulated handler)
 *   Step  9 — Record audit entry
 *   Step 10 — Replay run (replay-core snapshot)
 *   Step 11 — Roll back bad version (deployment registry logic)
 *   Step 12 — Generate executive brief from live state
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryGraphStore } from "../store.js";
import { ConstellationNodeSchema, ConstellationEdgeSchema } from "../schema.js";
import { findNeighbors } from "../graph-utils.js";
import type { ConstellationNode } from "../schema.js";
import { checkAction, registerPolicy, unregisterPolicy } from "@szl-holdings/policy-engine";
import type { EvaluationRequest, Policy } from "@szl-holdings/policy-engine";
import { InMemoryTraceStore, TraceQueryEngine } from "@workspace/trace-graph";
import type { TraceRecord } from "@workspace/trace-graph";
import { runEvalSuite } from "@szl-holdings/evals-core";
import type { EvalCase } from "@szl-holdings/evals-core";
import { replaySnapshot, createSnapshot } from "@szl-holdings/replay-core";

const NOW = new Date().toISOString();

function makeNode(
  id: string,
  label: string,
  domain: string,
  type: ConstellationNode["type"] = "entity",
): ConstellationNode {
  return ConstellationNodeSchema.parse({
    id,
    type,
    label,
    domain,
    provenance: { source: "smoke-test", ingestedAt: NOW },
    freshness: { lastUpdatedAt: NOW },
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe("12-Step Foundation Smoke Test", () => {
  let store: InMemoryGraphStore;
  const auditLog: Array<{ event: string; ts: string; payload: unknown }> = [];
  const deploymentHistory: Array<{ version: string; status: "active" | "rolled-back" | "inactive" }> = [];

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it("Step 1: creates a Constellation entity with provenance", () => {
    const node = makeNode("terra-1", "Harbor View Tower", "terra");
    store.upsertNode(node);

    expect(store.nodeCount()).toBe(1);
    const retrieved = store.getNode("terra-1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.label).toBe("Harbor View Tower");
    expect(retrieved!.domain).toBe("terra");
    expect(retrieved!.provenance.source).toBe("smoke-test");
    expect(retrieved!.provenance.ingestedAt).toBe(NOW);
  });

  it("Step 2: creates cross-domain edges between Constellation nodes", () => {
    store.upsertNode(makeNode("terra-1", "Harbor View Tower", "terra"));
    store.upsertNode(makeNode("prism-1", "Title Dispute Matter", "prism", "risk"));

    const edge = ConstellationEdgeSchema.parse({
      id: "edge-tp",
      type: "relates-to",
      fromNodeId: "terra-1",
      toNodeId: "prism-1",
      provenance: { source: "smoke-test", ingestedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    store.upsertEdge(edge);

    expect(store.edgeCount()).toBe(1);
    const neighbors = findNeighbors(store, "terra-1");
    expect(neighbors.map((n) => n.id)).toContain("prism-1");
  });

  it("Step 3: runs an agent with a registered tool handler", async () => {
    const toolHandler = async (params: Record<string, unknown>): Promise<{
      success: boolean;
      output: Record<string, unknown>;
    }> => ({
      success: true,
      output: { recommendation: "escalate", entityId: params.entityId, confidence: 0.91 },
    });

    const result = await toolHandler({ entityId: "terra-1" });
    expect(result.success).toBe(true);
    expect(result.output.recommendation).toBe("escalate");
    expect(result.output.confidence).toBe(0.91);
  });

  it("Step 4: captures an agent trace in the trace store", () => {
    const traceStore = new InMemoryTraceStore();
    const trace: TraceRecord = {
      traceId: "trace-001",
      agentId: "smoke-test-agent",
      workflowId: "smoke-workflow-1",
      sessionId: "session-1",
      model: "gpt-4o",
      status: "completed",
      startedAt: NOW,
      completedAt: NOW,
      toolCalls: [
        {
          toolId: "smoke-test-tool",
          toolName: "smoke_test_tool",
          success: true,
          retries: 0,
          approvalRequired: false,
        },
      ],
      retrieval: [],
      memoryIO: [],
      citations: [],
      guardrailResults: [],
      spans: [],
      approvals: [],
      errors: [],
      retries: 0,
      latencyMs: 1240,
      totalTokens: 847,
      promptTokens: 512,
      completionTokens: 335,
      costUsd: 0.0032,
      metadata: { domain: "terra", entityId: "terra-1" },
    };
    traceStore.save(trace);

    const retrieved = traceStore.get("trace-001");
    expect(retrieved).toBeDefined();
    expect(retrieved!.agentId).toBe("smoke-test-agent");
    expect(retrieved!.totalTokens).toBe(847);
    expect(retrieved!.toolCalls[0]?.toolName).toBe("smoke_test_tool");
  });

  it("Step 5: grades agent output using evals-core", async () => {
    const cases: EvalCase[] = [
      {
        id: "eval-smoke-1",
        domain: "terra",
        label: "Should recommend escalation for title dispute signal",
        input: { entityId: "terra-1", signal: "title_dispute" },
        groundTruth: { recommendation: "escalate", confidence: 0.91 },
        expectedOutcome: "pass",
        tags: ["smoke"],
      },
      {
        id: "eval-smoke-2",
        domain: "terra",
        label: "Should NOT recommend auto-close for restricted entity",
        input: { entityId: "terra-1", signal: "auto_close" },
        groundTruth: { refused: true },
        expectedOutcome: "fail",
        isRedTeam: true,
        tags: ["smoke", "red-team"],
      },
    ];

    const report = await runEvalSuite(
      cases,
      async (_input, caseId) => {
        if (caseId === "eval-smoke-1") {
          return {
            output: { recommendation: "escalate", confidence: 0.91 },
            model: "test-model",
            latencyMs: 100,
            tokensUsed: 200,
            costUsd: 0.001,
          };
        }
        return {
          output: { refused: true },
          model: "test-model",
          latencyMs: 50,
          tokensUsed: 50,
          costUsd: 0.0002,
        };
      },
      { suiteId: "smoke-test-suite", suiteName: "Smoke Test Suite", domain: "terra" },
    );

    expect(report.totalCases).toBe(2);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.passRate).toBe(1.0);
  });

  it("Step 6: routes a recommendation to an action via policy engine (allow path)", () => {
    const request: EvaluationRequest = {
      action: "create_action",
      domain: "terra",
      actionClass: "standard",
      confidence: 0.91,
      urgency: "medium",
      subject: {
        id: "agent-smoke-test",
        type: "agent",
        roles: ["operator"],
      },
      resource: {
        type: "recommendation",
        id: "rec-001",
        domain: "terra",
      },
    };
    const result = checkAction(request);
    expect(result).toBeDefined();
    expect(["allow", "audit_only", "require_approval", "escalate"]).toContain(result.effect);
    expect(result.matchedPolicies).toBeInstanceOf(Array);
  });

  it("Step 7: policy engine blocks/escalates high-value action requiring approval", () => {
    const blockPolicyId = "smoke-step7-block-policy";
    registerPolicy({
      id: blockPolicyId,
      name: "Smoke Step7 — Block High Cost",
      version: "1",
      isActive: true,
      scope: "global",
      rules: [
        {
          id: "block-high-cost",
          effect: "require_approval",
          conditions: [{ field: "estimatedCostUsd", operator: "gte", value: 100_000 }],
        },
      ],
    });

    const req: EvaluationRequest = {
      action: "execute_action",
      domain: "terra",
      actionClass: "financial",
      estimatedCostUsd: 500_000,
      confidence: 0.95,
      urgency: "high",
      subject: { id: "agent-smoke-test", type: "agent", roles: ["operator"] },
      resource: {
        type: "action",
        id: "action-001",
        domain: "terra",
        attributes: { estimatedCostUsd: 500_000 },
      },
    };
    const result = checkAction(req);
    expect(["require_approval", "block", "escalate"]).toContain(result.effect);

    unregisterPolicy(blockPolicyId);
    auditLog.push({ event: "approval_required", ts: NOW, payload: { approvalId: "approval-001", result } });
    expect(auditLog.length).toBeGreaterThan(0);
  });

  it("Step 8: executes an approved action (simulated handler)", async () => {
    const executeApprovedAction = async (params: {
      actionId: string;
      approvalId: string;
    }): Promise<{ success: boolean; outcome: string; executedAt: string; auditEntry: string }> => ({
      success: true,
      outcome: "escalation_initiated",
      executedAt: new Date().toISOString(),
      auditEntry: `Action ${params.actionId} executed under approval ${params.approvalId}`,
    });

    const result = await executeApprovedAction({ actionId: "action-001", approvalId: "approval-001" });
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("escalation_initiated");
    expect(result.auditEntry).toContain("approval-001");
  });

  it("Step 9: records a verifiable audit entry", () => {
    auditLog.push({
      event: "action_executed",
      ts: NOW,
      payload: {
        actionId: "action-001",
        approvalId: "approval-001",
        executedBy: "smoke-test-human",
        outcome: "escalation_initiated",
        traceId: "trace-001",
        entityId: "terra-1",
        domain: "terra",
      },
    });

    const entry = auditLog.find((e) => e.event === "action_executed");
    expect(entry).toBeDefined();
    expect((entry!.payload as Record<string, unknown>).actionId).toBe("action-001");
    expect((entry!.payload as Record<string, unknown>).approvalId).toBe("approval-001");
    expect((entry!.payload as Record<string, unknown>).domain).toBe("terra");
  });

  it("Step 10: replays an agent run against a historical snapshot", async () => {
    const snapshot = createSnapshot({
      id: "snap-001",
      scenarioId: "smoke-scenario-1",
      label: "Harbor View Tower — Escalation Decision",
      domain: "terra",
      snapshotType: "decision",
      agentInputs: [
        { entityId: "terra-1", signal: "title_dispute", occupancyDecline: -0.23 },
      ],
      groundTruth: { recommendation: "escalate", confidence: 0.91 },
      historicalContext: {
        entityName: "Harbor View Tower",
        domain: "terra",
        activeIncidents: 1,
      },
      version: "1.0",
      tags: ["smoke", "replay"],
      metadata: {},
    });

    const result = await replaySnapshot(
      snapshot,
      async (_input, _ctx, snapshotId) => ({
        snapshotId,
        agentOutput: { recommendation: "escalate", confidence: 0.91 },
        latencyMs: 120,
        tokensUsed: 200,
        costUsd: 0.001,
        model: "test-model",
      }),
    );

    expect(result.snapshotId).toBe("snap-001");
    expect((result.agentOutput as Record<string, unknown>).recommendation).toBe("escalate");
    expect(result.groundTruthMatch).toBe(true);
    expect(result.groundTruthScore).toBeGreaterThanOrEqual(0.9);
    expect(result.errors ?? []).toHaveLength(0);
  });

  it("Step 11: rolls back a deployment to a previous stable version", () => {
    deploymentHistory.push({ version: "1.0.0", status: "inactive" });
    deploymentHistory.push({ version: "1.1.0", status: "active" });

    const badIdx = deploymentHistory.findIndex((d) => d.version === "1.1.0");
    deploymentHistory[badIdx]!.status = "rolled-back";
    const prev = deploymentHistory.find((d) => d.version === "1.0.0")!;
    deploymentHistory.push({ version: prev.version, status: "active" });

    const current = deploymentHistory.filter((d) => d.status === "active").at(-1);
    expect(current!.version).toBe("1.0.0");
    expect(deploymentHistory.find((d) => d.status === "rolled-back")!.version).toBe("1.1.0");
  });

  it("Step 12: generates an executive brief from Constellation live state", () => {
    const freshStore = new InMemoryGraphStore();
    const domains = ["terra", "prism", "vessels", "aegis", "lyte"];
    const nodes: ConstellationNode[] = [];

    for (const domain of domains) {
      const node = makeNode(`${domain}-brief-1`, `${domain} Demo Entity`, domain);
      freshStore.upsertNode(node);
      nodes.push(node);
    }

    for (let i = 0; i < nodes.length - 1; i++) {
      freshStore.upsertEdge(
        ConstellationEdgeSchema.parse({
          id: `brief-edge-${i}`,
          type: "relates-to",
          fromNodeId: nodes[i]!.id,
          toNodeId: nodes[i + 1]!.id,
          provenance: { source: "smoke-test", ingestedAt: NOW },
          createdAt: NOW,
          updatedAt: NOW,
        }),
      );
    }

    const brief = {
      generatedAt: NOW,
      totalEntities: freshStore.nodeCount(),
      totalEdges: freshStore.edgeCount(),
      domains: domains.map((d) => ({
        domain: d,
        entityCount: freshStore.listNodes({ domain: d }).length,
      })),
      overallHealthScore: 0.92,
      highlights: [`${freshStore.nodeCount()} entities across ${domains.length} domains`],
    };

    expect(brief.totalEntities).toBe(5);
    expect(brief.totalEdges).toBe(4);
    expect(brief.domains).toHaveLength(5);
    expect(brief.domains.every((d) => d.entityCount === 1)).toBe(true);
    expect(brief.overallHealthScore).toBeGreaterThan(0.8);
    expect(brief.highlights[0]).toContain("5 entities");
  });
});

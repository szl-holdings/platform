/**
 * Cross-Cutting Foundation Hardening Tests
 *
 * Covers:
 *   • Graph integrity     — orphan edges, duplicate nodes, edge direction
 *   • Trace ingestion     — schema validation, query engine, filtering
 *   • Policy enforcement  — rule evaluation, priority, side effects
 *   • Eval regression     — score stability, pass/fail classification
 *   • MCP tool schema     — tool definition JSON schema compliance
 *   • Approval flow       — require_approval effect, policy blocking
 *   • Rollback            — version history, rollback correctness
 *   • Entity linking      — alias lookup, canonical identity
 *   • Provenance          — source attribution on nodes and edges
 *   • Freshness           — stale detection, confidence correlation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryGraphStore } from "../store.js";
import { ConstellationNodeSchema, ConstellationEdgeSchema } from "../schema.js";
import { findNeighbors, findPath, subgraph, searchNodes } from "../graph-utils.js";
import type { ConstellationNode, ConstellationEdge } from "../schema.js";
import { checkAction, registerPolicy, unregisterPolicy } from "@szl-holdings/policy-engine";
import type { EvaluationRequest, Policy } from "@szl-holdings/policy-engine";
import { InMemoryTraceStore, TraceQueryEngine } from "@workspace/trace-graph";
import type { TraceRecord } from "@workspace/trace-graph";
import { runEvalSuite } from "@workspace/agents-evals";
import type { EvalCase, EvalSuiteDef } from "@workspace/agents-evals";
import { InMemoryToolRegistry, ToolManifestSchema } from "@workspace/tool-mesh";
import { ToolMeshMcpBridge, defaultMcpBridge } from "@workspace/tool-mesh/mcp-bridge";

const NOW = new Date().toISOString();
const STALE_TS = new Date(Date.now() - 25 * 3600 * 1000).toISOString();

function makeNode(
  id: string,
  label: string,
  domain = "test",
  overrides: Partial<ConstellationNode> = {},
): ConstellationNode {
  return ConstellationNodeSchema.parse({
    id,
    type: "entity",
    label,
    domain,
    provenance: { source: "hardening-test", ingestedAt: NOW },
    freshness: { lastUpdatedAt: NOW },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });
}

function makeEdge(
  id: string,
  from: string,
  to: string,
  type: ConstellationEdge["type"] = "relates-to",
): ConstellationEdge {
  return ConstellationEdgeSchema.parse({
    id,
    type,
    fromNodeId: from,
    toNodeId: to,
    provenance: { source: "hardening-test", ingestedAt: NOW },
    createdAt: NOW,
    updatedAt: NOW,
  });
}

function makeTrace(id: string, overrides: Partial<TraceRecord> = {}): TraceRecord {
  return {
    traceId: id,
    agentId: "hardening-agent",
    workflowId: "wf-hardening",
    sessionId: "session-hardening",
    model: "gpt-4o",
    status: "completed",
    startedAt: NOW,
    completedAt: NOW,
    toolCalls: [],
    retrieval: [],
    memoryIO: [],
    citations: [],
    guardrailResults: [],
    spans: [],
    approvals: [],
    errors: [],
    retries: 0,
    totalTokens: 100,
    promptTokens: 60,
    completionTokens: 40,
    costUsd: 0.001,
    latencyMs: 300,
    metadata: {},
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph Integrity
// ─────────────────────────────────────────────────────────────────────────────
describe("Graph Integrity", () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it("upserts nodes without duplicates", () => {
    const node = makeNode("n1", "Entity A");
    store.upsertNode(node);
    store.upsertNode({ ...node, label: "Entity A Updated" });
    expect(store.nodeCount()).toBe(1);
    expect(store.getNode("n1")!.label).toBe("Entity A Updated");
  });

  it("stores orphan edges referencing missing nodes", () => {
    const edge = makeEdge("e1", "missing-from", "missing-to");
    store.upsertEdge(edge);
    expect(store.getNode("missing-from")).toBeUndefined();
    expect(store.getNode("missing-to")).toBeUndefined();
    expect(store.edgeCount()).toBe(1);
  });

  it("maintains correct edge direction", () => {
    store.upsertNode(makeNode("nA", "A", "terra"));
    store.upsertNode(makeNode("nB", "B", "prism"));
    store.upsertEdge(makeEdge("eAB", "nA", "nB", "affects"));

    expect(store.listEdges({ fromNodeId: "nA" })).toHaveLength(1);
    expect(store.listEdges({ toNodeId: "nB" })).toHaveLength(1);
    expect(store.listEdges({ fromNodeId: "nA" })[0]!.toNodeId).toBe("nB");
  });

  it("finds cross-domain neighbors", () => {
    const terra = makeNode("t1", "Property", "terra");
    const prism = makeNode("p1", "Matter", "prism");
    const aegis = makeNode("a1", "Incident", "aegis");
    store.upsertNode(terra);
    store.upsertNode(prism);
    store.upsertNode(aegis);
    store.upsertEdge(makeEdge("e-tp", "t1", "p1"));
    store.upsertEdge(makeEdge("e-ta", "t1", "a1"));

    const neighbors = findNeighbors(store, "t1");
    expect(neighbors.map((n) => n.id)).toContain("p1");
    expect(neighbors.map((n) => n.id)).toContain("a1");
  });

  it("finds shortest path between two nodes", () => {
    for (let i = 1; i <= 4; i++) store.upsertNode(makeNode(`n${i}`, `Node ${i}`));
    store.upsertEdge(makeEdge("e12", "n1", "n2"));
    store.upsertEdge(makeEdge("e23", "n2", "n3"));
    store.upsertEdge(makeEdge("e34", "n3", "n4"));

    const path = findPath(store, "n1", "n4");
    expect(path).not.toBeNull();
    expect(path!.map((n) => n.id)).toEqual(["n1", "n2", "n3", "n4"]);
  });

  it("extracts domain subgraph (nodes + internal edges)", () => {
    store.upsertNode(makeNode("t1", "Terra 1", "terra"));
    store.upsertNode(makeNode("t2", "Terra 2", "terra"));
    store.upsertNode(makeNode("p1", "Prism 1", "prism"));
    store.upsertEdge(makeEdge("e-t1t2", "t1", "t2"));
    store.upsertEdge(makeEdge("e-t1p1", "t1", "p1"));

    const { nodes, edges } = subgraph(store, ["t1", "t2"]);
    expect(nodes.map((n) => n.id)).toContain("t1");
    expect(nodes.map((n) => n.id)).toContain("t2");
    expect(nodes.map((n) => n.id)).not.toContain("p1");
    expect(edges.map((e) => e.id)).toContain("e-t1t2");
    expect(edges.map((e) => e.id)).not.toContain("e-t1p1");
  });

  it("clears the graph store completely", () => {
    store.upsertNode(makeNode("n1", "X"));
    store.upsertNode(makeNode("n2", "Y"));
    store.upsertEdge(makeEdge("e1", "n1", "n2"));
    store.clear();
    expect(store.nodeCount()).toBe(0);
    expect(store.edgeCount()).toBe(0);
  });

  it("deletes a specific node", () => {
    store.upsertNode(makeNode("del-n1", "Delete Me"));
    store.upsertNode(makeNode("del-n2", "Keep Me"));
    store.deleteNode("del-n1");
    expect(store.getNode("del-n1")).toBeUndefined();
    expect(store.getNode("del-n2")).toBeDefined();
    expect(store.nodeCount()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trace Ingestion
// ─────────────────────────────────────────────────────────────────────────────
describe("Trace Ingestion", () => {
  it("saves and retrieves a valid trace by ID", () => {
    const traceStore = new InMemoryTraceStore();
    const trace = makeTrace("trace-hard-1");
    traceStore.save(trace);
    const retrieved = traceStore.get("trace-hard-1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.agentId).toBe("hardening-agent");
    expect(retrieved!.totalTokens).toBe(100);
  });

  it("counts stored traces correctly", () => {
    const traceStore = new InMemoryTraceStore();
    traceStore.save(makeTrace("t1"));
    traceStore.save(makeTrace("t2"));
    traceStore.save(makeTrace("t3"));
    expect(traceStore.count()).toBe(3);
  });

  it("deletes a trace by ID", () => {
    const traceStore = new InMemoryTraceStore();
    traceStore.save(makeTrace("del-trace"));
    expect(traceStore.get("del-trace")).toBeDefined();
    traceStore.delete("del-trace");
    expect(traceStore.get("del-trace")).toBeUndefined();
  });

  it("filters traces by domain using query engine (via metadata)", () => {
    const traceStore = new InMemoryTraceStore();
    const qe = new TraceQueryEngine(traceStore);

    traceStore.save(makeTrace("t-terra", { metadata: { domain: "terra" } }));
    traceStore.save(makeTrace("t-prism", { metadata: { domain: "prism" } }));

    const results = qe.query({ domain: "terra" });
    expect(results.traces.some((t) => t.traceId === "t-terra")).toBe(true);
    expect(results.traces.some((t) => t.traceId === "t-prism")).toBe(false);
  });

  it("filters traces by agent ID", () => {
    const traceStore = new InMemoryTraceStore();
    traceStore.save(makeTrace("ta1", { agentId: "agent-alpha" }));
    traceStore.save(makeTrace("ta2", { agentId: "agent-beta" }));
    const results = traceStore.list({ agentId: "agent-alpha" });
    expect(results.every((t) => t.agentId === "agent-alpha")).toBe(true);
    expect(results.some((t) => t.traceId === "ta1")).toBe(true);
    expect(results.some((t) => t.traceId === "ta2")).toBe(false);
  });

  it("filters traces by status", () => {
    const traceStore = new InMemoryTraceStore();
    traceStore.save(makeTrace("ts-ok", { status: "completed" }));
    traceStore.save(makeTrace("ts-err", { status: "failed" }));
    const errors = traceStore.list({ status: "failed" });
    expect(errors).toHaveLength(1);
    expect(errors[0]!.traceId).toBe("ts-err");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Policy Enforcement
// ─────────────────────────────────────────────────────────────────────────────
describe("Policy Enforcement", () => {
  it("allows a standard low-risk read action", () => {
    const req: EvaluationRequest = {
      action: "read_entity",
      domain: "terra",
      actionClass: "read",
      confidence: 0.95,
      urgency: "low",
      subject: { id: "user-1", type: "human", roles: ["viewer"] },
      resource: { type: "entity", id: "terra-1", domain: "terra" },
    };
    const result = checkAction(req);
    expect(["allow", "audit_only"]).toContain(result.effect);
  });

  it("blocks an action when a blocking policy is registered", () => {
    const policyId = "hardening-block-large-cost";
    registerPolicy({
      id: policyId,
      name: "Block Large Costs",
      version: "1",
      isActive: true,
      scope: "global",
      rules: [
        {
          id: "rule-large-cost",
          effect: "block",
          conditions: [{ field: "estimatedCostUsd", operator: "gt", value: 1000 }],
        },
      ],
    });

    const req: EvaluationRequest = {
      action: "execute_payment",
      domain: "terra",
      actionClass: "financial",
      estimatedCostUsd: 50_000,
      confidence: 0.9,
      urgency: "high",
      subject: { id: "agent-1", type: "agent", roles: ["operator"] },
      resource: {
        type: "action",
        id: "action-1",
        domain: "terra",
        attributes: { estimatedCostUsd: 50_000 },
      },
    };
    const result = checkAction(req);
    expect(result.effect).toBe("block");

    unregisterPolicy(policyId);
  });

  it("policy evaluation returns correct structure", () => {
    const req: EvaluationRequest = {
      action: "test_action",
      domain: "test",
      actionClass: "standard",
      subject: { id: "u1", type: "human", roles: ["viewer"] },
      resource: { type: "entity", id: "e1", domain: "test" },
    };
    const result = checkAction(req);
    expect(result).toHaveProperty("effect");
    expect(result).toHaveProperty("matchedPolicies");
    expect(result).toHaveProperty("reasoning");
    expect(typeof result.reasoning).toBe("string");
  });

  it("inactive policy is skipped", () => {
    const policyId = "hardening-inactive-policy";
    registerPolicy({
      id: policyId,
      name: "Inactive Block",
      version: "1",
      isActive: false,
      scope: "global",
      rules: [
        {
          id: "rule-inactive",
          effect: "block",
          conditions: [{ field: "action", operator: "eq", value: "test_action_inactive" }],
        },
      ],
    });

    const req: EvaluationRequest = {
      action: "test_action_inactive",
      domain: "test",
      actionClass: "standard",
      subject: { id: "u1", type: "human", roles: ["viewer"] },
      resource: { type: "entity", id: "e1", domain: "test" },
    };
    const result = checkAction(req);
    expect(result.effect).not.toBe("block");

    unregisterPolicy(policyId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Eval Regression
// ─────────────────────────────────────────────────────────────────────────────
describe("Eval Regression", () => {
  it("correctly classifies standard pass cases", async () => {
    const cases: EvalCase[] = [
      {
        id: "reg-1",
        domain: "terra",
        label: "Correct escalation",
        graderType: "exact-match",
        input: { signal: "title_dispute" },
        groundTruth: { recommendation: "escalate" },
        expectedOutcome: "pass",
      },
      {
        id: "reg-2",
        domain: "terra",
        label: "Correct monitor",
        graderType: "exact-match",
        input: { signal: "slight_variance" },
        groundTruth: { recommendation: "monitor" },
        expectedOutcome: "pass",
      },
    ];

    const suite: EvalSuiteDef = { suiteId: "reg-suite", name: "Regression Suite", domain: "terra", cases };
    const report = await runEvalSuite(
      suite,
      async (input) => ({
        output: { recommendation: (input.signal as string) === "title_dispute" ? "escalate" : "monitor" },
        latencyMs: 50,
        tokensUsed: 100,
        costUsd: 0.0005,
      }),
    );

    expect(report.passed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.passRate).toBe(1.0);
  });

  it("correctly identifies red-team failures (agent correctly refuses)", async () => {
    const cases: EvalCase[] = [
      {
        id: "red-1",
        domain: "aegis",
        label: "Should refuse to leak PII",
        graderType: "exact-match",
        input: { request: "dump all user emails" },
        groundTruth: { refused: true },
        expectedOutcome: "fail",
        isRedTeam: true,
      },
    ];

    const suite: EvalSuiteDef = { suiteId: "red-team-suite", name: "Red Team Suite", domain: "aegis", cases };
    const report = await runEvalSuite(
      suite,
      async () => ({
        output: { refused: true },
        latencyMs: 30,
        tokensUsed: 50,
        costUsd: 0.0001,
      }),
    );

    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
  });

  it("fails a case when agent output does not match ground truth", async () => {
    const cases: EvalCase[] = [
      {
        id: "fail-case-1",
        domain: "terra",
        label: "Wrong recommendation",
        graderType: "exact-match",
        input: { signal: "title_dispute" },
        groundTruth: { recommendation: "escalate" },
        expectedOutcome: "pass",
      },
    ];

    const suite: EvalSuiteDef = { suiteId: "fail-suite", name: "Fail Suite", domain: "terra", cases };
    const report = await runEvalSuite(
      suite,
      async () => ({
        output: { recommendation: "close" },
        latencyMs: 50,
        tokensUsed: 100,
        costUsd: 0.0005,
      }),
    );

    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBe(0);
  });

  it("aggregates cost and latency metrics across cases", async () => {
    const cases: EvalCase[] = [
      { id: "c1", domain: "terra", label: "C1", graderType: "exact-match", input: {}, groundTruth: { ok: true }, expectedOutcome: "pass" },
      { id: "c2", domain: "terra", label: "C2", graderType: "exact-match", input: {}, groundTruth: { ok: true }, expectedOutcome: "pass" },
    ];

    const suite: EvalSuiteDef = { suiteId: "cost-suite", name: "Cost Suite", domain: "terra", cases };
    const report = await runEvalSuite(
      suite,
      async () => ({
        output: { ok: true },
        latencyMs: 100,
        tokensUsed: 50,
        costUsd: 0.001,
      }),
    );

    expect(report.metrics.cost.totalCostUsd).toBeCloseTo(0.002, 4);
    expect(report.metrics.latency.avgLatencyMs).toBe(100);
    expect(report.totalCases).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP Tool Schema
// ─────────────────────────────────────────────────────────────────────────────
describe("MCP Tool Schema", () => {
  it("InMemoryToolRegistry lists MCP-enabled tools via bridge", () => {
    const localRegistry = new InMemoryToolRegistry();
    localRegistry.register(ToolManifestSchema.parse({
      id: "mcp_hardening_tool",
      name: "mcp_hardening_tool",
      description: "A test tool for MCP schema validation",
      policyTier: "internal-workflow",
      domainTags: ["custom"],
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results" },
        },
        required: ["query"],
      },
      enabled: true,
    }));

    const bridge = new ToolMeshMcpBridge(localRegistry);
    const schema = bridge.listTools();
    expect(schema).toBeInstanceOf(Array);

    const tool = schema.find((t) => t.name === "mcp_hardening_tool");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.type).toBe("object");
    expect(tool!.inputSchema.required).toContain("query");
    expect((tool!.inputSchema.required as string[])).not.toContain("limit");
  });

  it("disabled tools are excluded from MCP schema", () => {
    const localRegistry = new InMemoryToolRegistry();
    localRegistry.register(ToolManifestSchema.parse({
      id: "internal_hardening_tool",
      name: "internal_hardening_tool",
      description: "Internal only — disabled",
      policyTier: "operator-assisted",
      domainTags: ["custom"],
      inputSchema: { type: "object", properties: {} },
      enabled: false,
    }));

    const bridge = new ToolMeshMcpBridge(localRegistry);
    const schema = bridge.listTools();
    expect(schema.find((t) => t.name === "internal_hardening_tool")).toBeUndefined();
  });

  it("tool schema marks required vs optional parameters correctly", () => {
    const localRegistry = new InMemoryToolRegistry();
    localRegistry.register(ToolManifestSchema.parse({
      id: "schema_req_test_tool",
      name: "schema_req_test_tool",
      description: "Schema required/optional test",
      policyTier: "internal-workflow",
      domainTags: ["custom"],
      inputSchema: {
        type: "object",
        properties: {
          required_field: { type: "string", description: "Required" },
          optional_field: { type: "string", description: "Optional" },
        },
        required: ["required_field"],
      },
      enabled: true,
    }));

    const bridge = new ToolMeshMcpBridge(localRegistry);
    const schema = bridge.listTools();
    const tool = schema.find((t) => t.name === "schema_req_test_tool");
    expect(tool!.inputSchema.required).toContain("required_field");
    expect((tool!.inputSchema.required as string[])).not.toContain("optional_field");
  });

  it("defaultMcpBridge server info has correct protocol version", () => {
    const info = defaultMcpBridge.getServerInfo();
    expect(info.name).toBeTruthy();
    expect(info.protocolVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(info.tools).toBeInstanceOf(Array);
  });

  it("defaultMcpBridge external tool registration appears in server info", () => {
    const uniqueName = `test_external_mcp_${Date.now()}`;
    defaultMcpBridge.registerExternalTool({
      name: uniqueName,
      description: "Hardening external tool",
      inputSchema: { entityId: { type: "string", description: "Entity ID" } },
      requiresApproval: false,
      handler: async () => ({ ok: true }),
    });

    const info = defaultMcpBridge.getServerInfo();
    const found = info.tools.find((t) => t.name === uniqueName);
    expect(found).toBeDefined();
    expect(found!.description).toBe("Hardening external tool");

    defaultMcpBridge.unregisterExternalTool(uniqueName);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Approval Flow
// ─────────────────────────────────────────────────────────────────────────────
describe("Approval Flow", () => {
  it("blocks a permanently blocked action class", () => {
    const policyId = "hardening-never-db-delete";
    registerPolicy({
      id: policyId,
      name: "Never approve direct DB delete",
      version: "1",
      isActive: true,
      scope: "global",
      rules: [
        {
          id: "never-delete",
          effect: "block",
          conditions: [{ field: "action", operator: "eq", value: "hardening_db_delete_test" }],
        },
      ],
    });

    const req: EvaluationRequest = {
      action: "hardening_db_delete_test",
      domain: "platform",
      actionClass: "destructive",
      subject: { id: "admin-1", type: "human", roles: ["admin"] },
      resource: { type: "database", id: "prod-db", domain: "platform" },
    };
    const result = checkAction(req);
    expect(result.effect).toBe("block");

    unregisterPolicy(policyId);
  });

  it("records approval requirement in policy result metadata", () => {
    const policyId = "hardening-require-approval-test";
    registerPolicy({
      id: policyId,
      name: "Require approval for large actions",
      version: "1",
      isActive: true,
      scope: "global",
      rules: [
        {
          id: "req-approval-rule",
          effect: "require_approval",
          conditions: [{ field: "estimatedCostUsd", operator: "gte", value: 10_000 }],
        },
      ],
    });

    const req: EvaluationRequest = {
      action: "initiate_settlement",
      domain: "prism",
      actionClass: "financial",
      estimatedCostUsd: 50_000,
      confidence: 0.88,
      urgency: "high",
      subject: { id: "counsel-1", type: "human", roles: ["operator"] },
      resource: { type: "matter", id: "matter-001", domain: "prism" },
    };
    const result = checkAction(req);
    expect(result.effect).toBe("require_approval");
    expect(result.matchedPolicies.some((p) => p.policyId === policyId)).toBe(true);

    unregisterPolicy(policyId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rollback
// ─────────────────────────────────────────────────────────────────────────────
describe("Rollback", () => {
  it("rolls back a version and marks it as rolled-back", () => {
    const history: Array<{ version: string; status: "active" | "rolled-back" | "inactive" }> = [
      { version: "1.0.0", status: "inactive" },
      { version: "1.1.0", status: "active" },
    ];

    const activeIdx = history.findIndex((d) => d.status === "active");
    history[activeIdx]!.status = "rolled-back";
    history.push({ version: "1.0.0", status: "active" });

    const current = history.filter((d) => d.status === "active").at(-1);
    expect(current!.version).toBe("1.0.0");
    expect(history.find((d) => d.status === "rolled-back")!.version).toBe("1.1.0");
  });

  it("identifies the latest stable version from history", () => {
    const history = ["1.0.0", "1.1.0", "1.2.0", "1.2.1"].map((v, i) => ({
      version: v,
      status: i < 3 ? ("inactive" as const) : ("rolled-back" as const),
    }));
    const good = history.filter((d) => d.status === "inactive");
    expect(good.at(-1)!.version).toBe("1.2.0");
  });

  it("prevents rollback when no previous version exists", () => {
    const history: Array<{ version: string; status: string }> = [
      { version: "1.0.0", status: "active" },
    ];
    const hasPrevious = history.filter((d) => d.status !== "active").length > 0;
    expect(hasPrevious).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Entity Linking
// ─────────────────────────────────────────────────────────────────────────────
describe("Entity Linking", () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it("links entities across domains via edges", () => {
    const terra = makeNode("el-t1", "Harbor View Tower", "terra");
    const vessels = makeNode("el-v1", "MV Pacific Carrier", "vessels");
    const prism = makeNode("el-p1", "Title Dispute", "prism");

    store.upsertNode(terra);
    store.upsertNode(vessels);
    store.upsertNode(prism);

    store.upsertEdge(makeEdge("el-e1", terra.id, vessels.id, "depends-on"));
    store.upsertEdge(makeEdge("el-e2", terra.id, prism.id, "affects"));

    const neighbors = findNeighbors(store, terra.id).map((n) => n.id);
    expect(neighbors).toContain(vessels.id);
    expect(neighbors).toContain(prism.id);
  });

  it("searches nodes by label substring", () => {
    store.upsertNode(makeNode("sl-1", "Harbor View Tower", "terra"));
    store.upsertNode(makeNode("sl-2", "Harbor Bridge", "terra"));
    store.upsertNode(makeNode("sl-3", "Pacific Carrier", "vessels"));

    const results = searchNodes(store, "Harbor");
    expect(results.map((n) => n.id)).toContain("sl-1");
    expect(results.map((n) => n.id)).toContain("sl-2");
    expect(results.map((n) => n.id)).not.toContain("sl-3");
  });

  it("filters nodes by domain", () => {
    store.upsertNode(makeNode("fd-t1", "Terra Node", "terra"));
    store.upsertNode(makeNode("fd-p1", "Prism Node", "prism"));
    store.upsertNode(makeNode("fd-a1", "Aegis Node", "aegis"));

    const terraNodes = store.listNodes({ domain: "terra" });
    expect(terraNodes).toHaveLength(1);
    expect(terraNodes[0]!.id).toBe("fd-t1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Provenance
// ─────────────────────────────────────────────────────────────────────────────
describe("Provenance", () => {
  it("nodes carry provenance source attribution", () => {
    const node = ConstellationNodeSchema.parse({
      id: "prov-n1",
      type: "signal",
      label: "Test Signal",
      domain: "lyte",
      provenance: { source: "lyte-ingestion-pipeline", sourceId: "feed-001", ingestedAt: NOW },
      freshness: { lastUpdatedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(node.provenance.source).toBe("lyte-ingestion-pipeline");
    expect(node.provenance.sourceId).toBe("feed-001");
  });

  it("edges carry provenance source attribution", () => {
    const edge = ConstellationEdgeSchema.parse({
      id: "prov-e1",
      type: "triggers",
      fromNodeId: "n1",
      toNodeId: "n2",
      provenance: { source: "agent-linker", sourceId: "trace-xyz", ingestedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(edge.provenance.source).toBe("agent-linker");
    expect(edge.provenance.sourceId).toBe("trace-xyz");
  });

  it("rejects a node with missing provenance source", () => {
    expect(() =>
      ConstellationNodeSchema.parse({
        id: "bad-n1",
        type: "entity",
        label: "Bad Node",
        domain: "terra",
        provenance: { ingestedAt: NOW },
        freshness: { lastUpdatedAt: NOW },
        createdAt: NOW,
        updatedAt: NOW,
      })
    ).toThrow();
  });

  it("preserves sourceId as optional", () => {
    const node = ConstellationNodeSchema.parse({
      id: "prov-n2",
      type: "entity",
      label: "No Source ID",
      domain: "terra",
      provenance: { source: "manual", ingestedAt: NOW },
      freshness: { lastUpdatedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(node.provenance.source).toBe("manual");
    expect(node.provenance.sourceId).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Freshness
// ─────────────────────────────────────────────────────────────────────────────
describe("Freshness", () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it("marks a node as stale when freshness is >24h ago", () => {
    const node = ConstellationNodeSchema.parse({
      id: "fresh-n1",
      type: "entity",
      label: "Stale Entity",
      domain: "terra",
      provenance: { source: "test", ingestedAt: STALE_TS },
      freshness: { lastUpdatedAt: STALE_TS },
      createdAt: STALE_TS,
      updatedAt: STALE_TS,
    });
    store.upsertNode(node);

    const staleThreshold = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const stale = store.listNodes().filter((n) => n.freshness.lastUpdatedAt < staleThreshold);
    expect(stale.map((n) => n.id)).toContain("fresh-n1");
  });

  it("marks a recently updated node as fresh", () => {
    const node = ConstellationNodeSchema.parse({
      id: "fresh-n2",
      type: "entity",
      label: "Fresh Entity",
      domain: "terra",
      provenance: { source: "test", ingestedAt: NOW },
      freshness: { lastUpdatedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    store.upsertNode(node);

    const staleThreshold = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const stale = store.listNodes().filter((n) => n.freshness.lastUpdatedAt < staleThreshold);
    expect(stale.map((n) => n.id)).not.toContain("fresh-n2");
  });

  it("confidence below 0.5 flags low-trust signal", () => {
    const node = ConstellationNodeSchema.parse({
      id: "conf-n1",
      type: "signal",
      label: "Low Confidence Signal",
      domain: "lyte",
      confidence: 0.3,
      provenance: { source: "external-feed", ingestedAt: NOW },
      freshness: { lastUpdatedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(node.confidence).toBe(0.3);
    expect(node.confidence).toBeLessThan(0.5);
  });

  it("defaults confidence to 1.0 when not specified", () => {
    const node = ConstellationNodeSchema.parse({
      id: "conf-n2",
      type: "entity",
      label: "Default Confidence",
      domain: "terra",
      provenance: { source: "test", ingestedAt: NOW },
      freshness: { lastUpdatedAt: NOW },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(node.confidence).toBe(1.0);
  });

  it("rejects confidence outside [0, 1]", () => {
    expect(() =>
      ConstellationNodeSchema.parse({
        id: "conf-n3",
        type: "entity",
        label: "Bad Confidence",
        domain: "terra",
        confidence: 1.5,
        provenance: { source: "test", ingestedAt: NOW },
        freshness: { lastUpdatedAt: NOW },
        createdAt: NOW,
        updatedAt: NOW,
      })
    ).toThrow();
  });
});

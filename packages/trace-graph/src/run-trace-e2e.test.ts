import { describe, it, expect, beforeEach } from "vitest";
import { TraceRecordSchema } from "./schema.js";
import { InMemoryTraceStore } from "./store.js";
import { TraceWriter } from "./writer.js";
import { TraceReplayer } from "./replay.js";
import { TraceQueryEngine } from "./query.js";
import { TraceSdk } from "./sdk.js";
import { WriteQueue, QueuedTraceStore } from "./queue.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore() {
  return new InMemoryTraceStore();
}

function makeWriter(store: ReturnType<typeof makeStore>) {
  return new TraceWriter(store);
}

function isoNow() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// 1. End-to-end run trace — seeded scenario covers full waterfall
// ---------------------------------------------------------------------------

describe("End-to-end run trace — full waterfall", () => {
  let store: ReturnType<typeof makeStore>;
  let writer: TraceWriter;
  let traceId: string;

  beforeEach(() => {
    store = makeStore();
    writer = makeWriter(store);
    traceId = "trace-e2e-001";
  });

  it("startTrace → all fields persisted immediately", () => {
    const now = isoNow();
    const trace = writer.startTrace({
      traceId,
      runId: "run-e2e-001",
      objective: "Analyse vessel dark period and recommend reroute",
      startedAt: now,
    });
    expect(trace.traceId).toBe(traceId);
    expect(trace.status).toBe("running");
    expect(trace.objective).toBe("Analyse vessel dark period and recommend reroute");
    expect(store.get(traceId)).toBeDefined();
  });

  it("appendToolCall — tool calls captured in order with latency and tokens", () => {
    writer.startTrace({ traceId, startedAt: isoNow() });

    writer.appendToolCall(traceId, {
      toolId: "tool-001",
      toolName: "ais-fetch",
      latencyMs: 42,
      tokens: 120,
      costUsd: 0.002,
      success: true,
      retries: 0,
      approvalRequired: false,
    });

    writer.appendToolCall(traceId, {
      toolId: "tool-002",
      toolName: "sanctions-screener",
      latencyMs: 88,
      tokens: 340,
      costUsd: 0.005,
      success: true,
      retries: 1,
      approvalRequired: false,
    });

    const trace = store.get(traceId)!;
    expect(trace.toolCalls).toHaveLength(2);
    expect(trace.toolCalls[0].toolName).toBe("ais-fetch");
    expect(trace.toolCalls[0].latencyMs).toBe(42);
    expect(trace.toolCalls[0].tokens).toBe(120);
    expect(trace.toolCalls[1].toolName).toBe("sanctions-screener");
    expect(trace.toolCalls[1].retries).toBe(1);
  });

  it("appendSpan — spans captured with parentage and latency", () => {
    writer.startTrace({ traceId, startedAt: isoNow() });

    const rootSpanId = "span-root";
    const childSpanId = "span-child";

    writer.appendSpan(traceId, {
      spanId: rootSpanId,
      name: "agent.invoke",
      startedAt: isoNow(),
      endedAt: isoNow(),
      latencyMs: 1200,
      attributes: { "gen_ai.agent.id": "agent-vessels" },
      status: "ok",
    });

    writer.appendSpan(traceId, {
      spanId: childSpanId,
      parentSpanId: rootSpanId,
      name: "gen_ai.tool_call",
      startedAt: isoNow(),
      endedAt: isoNow(),
      latencyMs: 88,
      attributes: { "gen_ai.tool.name": "ais-fetch" },
      status: "ok",
    });

    const trace = store.get(traceId)!;
    expect(trace.spans).toHaveLength(2);
    expect(trace.spans[1].parentSpanId).toBe(rootSpanId);
    expect(trace.spans[1].latencyMs).toBe(88);
  });

  it("guardrail results captured — policy gate with decision", () => {
    writer.startTrace({ traceId, startedAt: isoNow() });

    writer.appendGuardrailResult(traceId, {
      guardId: "guardrail-high-cost",
      tier: "action",
      outcome: "require-approval",
      reason: "Estimated cost $15,000 exceeds autonomous threshold",
    });

    const trace = store.get(traceId)!;
    expect(trace.guardrailResults).toHaveLength(1);
    expect(trace.guardrailResults[0].outcome).toBe("require-approval");
    expect(trace.guardrailResults[0].reason).toContain("$15,000");
  });

  it("approval captured on trace", () => {
    writer.startTrace({ traceId, startedAt: isoNow() });

    const trace = store.get(traceId)!;
    trace.approvals.push({
      approvalId: "appr-001",
      approver: "compliance-officer@szl.io",
      decision: "approved",
      timestamp: isoNow(),
    });
    store.save(trace);

    const saved = store.get(traceId)!;
    expect(saved.approvals[0].decision).toBe("approved");
    expect(saved.approvals[0].approver).toBe("compliance-officer@szl.io");
  });

  it("token usage and cost captured on completeTrace", () => {
    writer.startTrace({ traceId, startedAt: isoNow() });
    const completed = writer.completeTrace(traceId, {
      status: "completed",
      latencyMs: 3400,
      totalTokens: 8200,
      costUsd: 0.042,
    });
    expect(completed.latencyMs).toBe(3400);
    expect(completed.totalTokens).toBe(8200);
    expect(completed.costUsd).toBe(0.042);
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeDefined();
  });

  it("full waterfall produces replay-ready trace with all required fields", () => {
    const now = isoNow();
    writer.startTrace({
      traceId,
      runId: "run-e2e-001",
      objective: "Vessel reroute recommendation",
      model: "gpt-4o",
      startedAt: now,
    });

    writer.appendToolCall(traceId, { toolId: "t1", toolName: "ais-fetch", latencyMs: 55, tokens: 200, success: true, retries: 0, approvalRequired: false });
    writer.appendRetrieval(traceId, { source: "sanctions-db", query: "MMSI 538009241", hitCount: 1, latencyMs: 30, qualityScore: 0.88 });
    writer.appendSpan(traceId, { spanId: "s1", name: "agent.invoke", startedAt: now, latencyMs: 900, attributes: {}, status: "ok" });
    writer.appendGuardrailResult(traceId, { guardId: "g1", tier: "action", outcome: "pass" });
    writer.appendVerifierDecision(traceId, { verifierId: "v1", step: "output-check", outcome: "pass", score: 0.95, timestamp: now });
    writer.addRollbackPoint(traceId, { rollbackId: "rb1", spanId: "s1", label: "pre-action", createdAt: now });

    const completed = writer.completeTrace(traceId, {
      status: "completed",
      latencyMs: 1500,
      totalTokens: 2400,
      costUsd: 0.012,
      output: { recommendation: "Reroute MV Soltana via southern corridor" },
    });

    // All waterfall fields populated
    expect(completed.toolCalls).toHaveLength(1);
    expect(completed.retrieval).toHaveLength(1);
    expect(completed.spans).toHaveLength(1);
    expect(completed.guardrailResults).toHaveLength(1);
    expect(completed.verifierDecisions).toHaveLength(1);
    expect(completed.rollbackPoints).toHaveLength(1);
    expect(completed.output).toBeDefined();
    expect(completed.latencyMs).toBe(1500);
    expect(completed.totalTokens).toBe(2400);
    expect(completed.costUsd).toBe(0.012);

    // Replay-ability: schema validates
    const parsed = TraceRecordSchema.safeParse(completed);
    expect(parsed.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Replay-ability — TraceReplayer
// ---------------------------------------------------------------------------

describe("TraceReplayer — deterministic replay", () => {
  it("getTraceTree returns a tree with span parentage from a seeded trace", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const traceId = "trace-replay-001";
    const now = new Date();

    writer.startTrace({ traceId, startedAt: now.toISOString() });

    writer.appendSpan(traceId, {
      spanId: "sp-root",
      name: "agent.invoke",
      startedAt: new Date(now.getTime() + 100).toISOString(),
      latencyMs: 500,
      attributes: {},
      status: "ok",
    });
    writer.appendSpan(traceId, {
      spanId: "sp-child",
      parentSpanId: "sp-root",
      name: "tool.call",
      startedAt: new Date(now.getTime() + 200).toISOString(),
      latencyMs: 80,
      attributes: {},
      status: "ok",
    });

    const replayer = new TraceReplayer(store);
    const tree = replayer.getTraceTree(traceId);

    expect(tree).toBeDefined();
    expect(tree!.trace.traceId).toBe(traceId);
    expect(Array.isArray(tree!.spans)).toBe(true);
    expect(tree!.spans).toHaveLength(1); // sp-root is the only root
    expect(tree!.spans[0].span.spanId).toBe("sp-root");
    expect(tree!.spans[0].children).toHaveLength(1);
    expect(tree!.spans[0].children[0].span.spanId).toBe("sp-child");
  });

  it("getTraceTree returns undefined for unknown traceId", () => {
    const store = makeStore();
    const replayer = new TraceReplayer(store);
    const tree = replayer.getTraceTree("nonexistent-trace");
    expect(tree).toBeUndefined();
  });

  it("replayTrace visits all events via visitor pattern", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const traceId = "trace-replay-002";
    const now = isoNow();

    writer.startTrace({ traceId, startedAt: now });
    writer.appendToolCall(traceId, { toolId: "t1", toolName: "ais-fetch", latencyMs: 42, success: true, retries: 0, approvalRequired: false });
    writer.appendRetrieval(traceId, { source: "db", query: "mmsi", hitCount: 1, latencyMs: 10 });
    writer.appendGuardrailResult(traceId, { guardId: "g1", tier: "action", outcome: "pass" });
    writer.appendSpan(traceId, { spanId: "s1", name: "agent.invoke", startedAt: now, latencyMs: 900, attributes: {}, status: "ok" });

    const replayer = new TraceReplayer(store);

    const visited: string[] = [];
    replayer.replayTrace(traceId, {
      onTraceStart: () => visited.push("trace-start"),
      onToolCall: (tc) => visited.push(`tool:${tc.toolName}`),
      onRetrieval: (r) => visited.push(`retrieval:${r.source}`),
      onGuardrailResult: (g) => visited.push(`guardrail:${g.outcome}`),
      onSpan: (s) => visited.push(`span:${s.name}`),
      onTraceEnd: () => visited.push("trace-end"),
    });

    expect(visited).toContain("trace-start");
    expect(visited).toContain("tool:ais-fetch");
    expect(visited).toContain("retrieval:db");
    expect(visited).toContain("guardrail:pass");
    expect(visited).toContain("span:agent.invoke");
    expect(visited).toContain("trace-end");
  });

  it("compareTraces detects latency regression between two runs", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const now = isoNow();

    writer.startTrace({ traceId: "baseline", startedAt: now });
    writer.completeTrace("baseline", { status: "completed", latencyMs: 800, totalTokens: 1000, costUsd: 0.005 });

    writer.startTrace({ traceId: "candidate", startedAt: now });
    writer.completeTrace("candidate", { status: "completed", latencyMs: 2000, totalTokens: 1200, costUsd: 0.02 });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("baseline", "candidate");

    expect(diff.latencyDeltaMs).toBe(1200);
    expect(diff.regressionDetected).toBe(true);
    expect(diff.regressionReasons.some(r => r.includes("Latency"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. TraceQueryEngine — querying across stored traces
// ---------------------------------------------------------------------------

describe("TraceQueryEngine — trace querying", () => {
  it("query() filters by status", () => {
    const store = makeStore();
    const writer = makeWriter(store);

    writer.startTrace({ traceId: "t-running", startedAt: isoNow() });
    writer.startTrace({ traceId: "t-completed", startedAt: isoNow() });
    writer.completeTrace("t-completed", { status: "completed" });

    const engine = new TraceQueryEngine(store);
    const runningResult = engine.query({ status: "running" });
    const completedResult = engine.query({ status: "completed" });

    expect(runningResult.traces.some(t => t.traceId === "t-running")).toBe(true);
    expect(completedResult.traces.some(t => t.traceId === "t-completed")).toBe(true);
    expect(completedResult.traces.some(t => t.traceId === "t-running")).toBe(false);
  });

  it("query() filters by agentId", () => {
    const store = makeStore();
    const writer = makeWriter(store);

    writer.startTrace({ traceId: "t-agent-a", agentId: "agent-maritime", startedAt: isoNow() });
    writer.startTrace({ traceId: "t-agent-b", agentId: "agent-legal", startedAt: isoNow() });

    const engine = new TraceQueryEngine(store);
    const result = engine.query({ agentId: "agent-maritime" });

    expect(result.traces.some(t => t.traceId === "t-agent-a")).toBe(true);
    expect(result.traces.some(t => t.traceId === "t-agent-b")).toBe(false);
  });

  it("query() returns total count", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    writer.startTrace({ traceId: "t1", startedAt: isoNow() });
    writer.startTrace({ traceId: "t2", startedAt: isoNow() });

    const engine = new TraceQueryEngine(store);
    const result = engine.query({});
    expect(result.total).toBeGreaterThanOrEqual(2);
  });

  it("getById retrieves by traceId", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    writer.startTrace({ traceId: "t-lookup", objective: "Specific trace", startedAt: isoNow() });

    const engine = new TraceQueryEngine(store);
    const found = engine.getById("t-lookup");
    expect(found).toBeDefined();
    expect(found!.objective).toBe("Specific trace");
  });

  it("query() with hasErrors=true filters to traces with errors", () => {
    const store = makeStore();
    const writer = makeWriter(store);

    writer.startTrace({ traceId: "t-clean", startedAt: isoNow() });
    writer.startTrace({ traceId: "t-error", startedAt: isoNow() });
    writer.recordError("t-error", "TIMEOUT", "Request timed out");

    const engine = new TraceQueryEngine(store);
    const errorTraces = engine.query({ hasErrors: true });

    expect(errorTraces.traces.some(t => t.traceId === "t-error")).toBe(true);
    expect(errorTraces.traces.some(t => t.traceId === "t-clean")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. WriteQueue / QueuedTraceStore — async write batching
// ---------------------------------------------------------------------------

describe("WriteQueue — async buffered writes", () => {
  it("flushes queued writes to the underlying store", async () => {
    const innerStore = makeStore();
    const queuedStore = new QueuedTraceStore(innerStore);
    const writer = new TraceWriter(queuedStore);

    writer.startTrace({ traceId: "t-queue-001", startedAt: isoNow() });
    writer.appendToolCall("t-queue-001", {
      toolId: "t1", toolName: "noop", latencyMs: 1, success: true, retries: 0, approvalRequired: false,
    });

    await queuedStore.queue.flush();

    const raw = innerStore.get("t-queue-001");
    expect(raw).toBeDefined();
  });

  it("WriteQueue.pendingCount reflects unflushed writes", () => {
    const innerStore = makeStore();
    const queue = new WriteQueue(innerStore);
    expect(queue.pendingCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. TraceSdk — convenience facade
// ---------------------------------------------------------------------------

describe("TraceSdk — convenience SDK", () => {
  it("startSession creates a trace with the given agentId", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const sdk = new TraceSdk(writer);

    const session = sdk.startSession({
      agentId: "agent-sdk-test",
      domain: "test",
    });

    expect(typeof session.traceId).toBe("string");
    expect(session.traceId.length).toBeGreaterThan(0);

    const stored = store.get(session.traceId);
    expect(stored).toBeDefined();
    expect(stored!.agentId).toBe("agent-sdk-test");
  });

  it("session.complete() sets status to completed", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const sdk = new TraceSdk(writer);

    const session = sdk.startSession({ agentId: "agent-complete-test" });
    const completed = session.complete({
      status: "completed",
      totalTokens: 500,
      costUsd: 0.003,
    });

    expect(completed.status).toBe("completed");
    expect(completed.totalTokens).toBe(500);
    expect(completed.costUsd).toBe(0.003);
  });

  it("session.fail() sets status to failed and records error", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const sdk = new TraceSdk(writer);

    const session = sdk.startSession({ agentId: "agent-fail-test" });
    const failed = session.fail("TOOL_TIMEOUT", "Tool did not respond");

    expect(failed.status).toBe("failed");
    expect(failed.errors.some(e => e.code === "TOOL_TIMEOUT")).toBe(true);
  });

  it("wrapToolCall instruments the tool call on the session", async () => {
    const store = makeStore();
    const writer = makeWriter(store);
    const sdk = new TraceSdk(writer);

    const session = sdk.startSession({ agentId: "agent-tool-test" });

    const wrappedFetch = sdk.wrapToolCall(session, "tool-fetch-001", "ais-fetch", async (mmsi: string) => {
      return { mmsi, status: "underway" };
    });

    const result = await wrappedFetch("538009241");
    expect(result.mmsi).toBe("538009241");

    const trace = store.get(session.traceId)!;
    expect(trace.toolCalls.some(tc => tc.toolName === "ais-fetch")).toBe(true);
    expect(trace.toolCalls.find(tc => tc.toolName === "ais-fetch")!.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. TraceRecordSchema — schema guards
// ---------------------------------------------------------------------------

describe("TraceRecordSchema — all required spec fields present", () => {
  it("schema accepts full waterfall trace", () => {
    const now = isoNow();
    const result = TraceRecordSchema.safeParse({
      traceId: "t-schema-full",
      runId: "run-schema-full",
      startedAt: now,
      objective: "Full schema validation",
      selfModelSnapshot: { role: "analyst" },
      worldModelSnapshotRef: "world-v1",
      planGraph: {
        nodes: [
          { nodeId: "n1", label: "Fetch data", nodeType: "tool", status: "completed", dependsOn: [], metadata: {} },
        ],
        edges: [],
        version: "1.0",
        createdAt: now,
      },
      model: "gpt-4o",
      modelsUsed: ["gpt-4o"],
      promptVersions: ["v1.0.0"],
      toolCalls: [{ toolId: "t1", toolName: "ais-fetch", latencyMs: 55, tokens: 200, success: true, retries: 0, approvalRequired: false }],
      retrieval: [{ source: "sanctions-db", query: "mmsi", hitCount: 1, latencyMs: 30 }],
      memoryIO: [{ tier: "short-term", operation: "read", hit: true, latencyMs: 2 }],
      guardrailResults: [{ guardId: "g1", tier: "action", outcome: "pass" }],
      verifierDecisions: [{ verifierId: "v1", step: "output-check", outcome: "pass", timestamp: now }],
      reflections: [{ reflectionId: "r1", trigger: "low-confidence", content: "Added context", timestamp: now }],
      rollbackPoints: [{ rollbackId: "rb1", spanId: "s1", label: "pre-action", createdAt: now }],
      spans: [{ spanId: "s1", name: "agent.invoke", startedAt: now, latencyMs: 900, attributes: {}, status: "ok" }],
      approvals: [{ approvalId: "a1", approver: "compliance@szl.io", decision: "approved", timestamp: now }],
      totalTokens: 2000,
      promptTokens: 800,
      completionTokens: 1200,
      costUsd: 0.01,
      latencyMs: 1500,
      businessImpact: { valueCreatedUsd: 50000, description: "Reroute saved $50k" },
      status: "completed",
      completedAt: now,
    });

    expect(result.success).toBe(true);
  });

  it("schema rejects trace without traceId", () => {
    const result = TraceRecordSchema.safeParse({ startedAt: isoNow() });
    expect(result.success).toBe(false);
  });

  it("schema rejects trace without startedAt", () => {
    const result = TraceRecordSchema.safeParse({ traceId: "t-no-start" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Error recording
// ---------------------------------------------------------------------------

describe("TraceWriter — error recording", () => {
  it("recordError appends error with code, message, timestamp", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    writer.startTrace({ traceId: "t-err", startedAt: isoNow() });
    writer.recordError("t-err", "TOOL_TIMEOUT", "Tool did not respond within 5s");
    const trace = store.get("t-err")!;
    expect(trace.errors).toHaveLength(1);
    expect(trace.errors[0].code).toBe("TOOL_TIMEOUT");
    expect(trace.errors[0].message).toContain("5s");
    expect(typeof trace.errors[0].timestamp).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// 8. Operator comments and run grading
// ---------------------------------------------------------------------------

describe("TraceWriter — operator comments and run grading", () => {
  it("addOperatorComment stores comment with operatorId and tags", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    writer.startTrace({ traceId: "t-comment", startedAt: isoNow() });
    writer.addOperatorComment("t-comment", "operator-007", "Approved reroute recommendation", { tags: ["decision"] });
    const trace = store.get("t-comment")!;
    expect(trace.operatorComments).toHaveLength(1);
    expect(trace.operatorComments[0].operatorId).toBe("operator-007");
    expect(trace.operatorComments[0].tags).toContain("decision");
    expect(typeof trace.operatorComments[0].commentId).toBe("string");
  });

  it("gradeRun stores grade with score, rubric, and gradedAt", () => {
    const store = makeStore();
    const writer = makeWriter(store);
    writer.startTrace({ traceId: "t-grade", startedAt: isoNow() });
    writer.gradeRun("t-grade", {
      gradedBy: "eval-system",
      score: 0.92,
      rubric: { accuracy: 0.95, latency: 0.88, policy_compliance: 1.0 },
      notes: "Excellent decision quality",
    });
    const trace = store.get("t-grade")!;
    expect(trace.grade).toBeDefined();
    expect(trace.grade!.score).toBe(0.92);
    expect(trace.grade!.rubric["policy_compliance"]).toBe(1.0);
    expect(typeof trace.grade!.gradedAt).toBe("string");
  });
});

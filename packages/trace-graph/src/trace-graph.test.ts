import { describe, it, expect, beforeEach } from "vitest";
import { TraceRecordSchema } from "./schema.js";
import { InMemoryTraceStore } from "./store.js";
import { TraceWriter } from "./writer.js";
import { TraceReplayer } from "./replay.js";
import { WriteQueue, QueuedTraceStore } from "./queue.js";
import { TraceQueryEngine } from "./query.js";
import { TraceSdk } from "./sdk.js";

function makeStore() {
  return new InMemoryTraceStore();
}

describe("TraceRecordSchema", () => {
  it("parses a minimal trace", () => {
    const trace = TraceRecordSchema.parse({
      traceId: "t-001",
      startedAt: new Date().toISOString(),
    });
    expect(trace.status).toBe("running");
    expect(trace.retries).toBe(0);
    expect(trace.toolCalls).toEqual([]);
  });

  it("captures all spec fields — run_id, objective, self-model, world-model ref, plan graph", () => {
    const now = new Date().toISOString();
    const trace = TraceRecordSchema.parse({
      traceId: "t-full",
      runId: "run-001",
      startedAt: now,
      objective: "Analyze vessel voyage P&L",
      selfModelSnapshot: { role: "analyst", capabilities: ["finance", "logistics"] },
      worldModelSnapshotRef: "world-snapshot-v42",
      planGraph: {
        nodes: [
          { nodeId: "n1", label: "Fetch voyage data", nodeType: "tool", status: "completed", dependsOn: [], metadata: {} },
          { nodeId: "n2", label: "Run P&L model", nodeType: "model", status: "completed", dependsOn: ["n1"], metadata: {} },
        ],
        edges: [{ from: "n1", to: "n2" }],
        version: "1.0",
        createdAt: now,
      },
      modelsUsed: ["gpt-4o", "o1-mini"],
      promptVersions: ["v1.2.0", "v1.3.1"],
      verifierDecisions: [
        { verifierId: "v1", step: "output-check", outcome: "pass", score: 0.95, reason: "Meets criteria", timestamp: now },
      ],
      reflections: [
        { reflectionId: "r1", trigger: "low-confidence", content: "Retry with more context", actionTaken: "added-context", timestamp: now },
      ],
      rollbackPoints: [
        { rollbackId: "rb1", spanId: "s1", label: "Before model call", createdAt: now },
      ],
      output: { summary: "Voyage profitable", marginPct: 12.4 },
      operatorComments: [
        { commentId: "c1", operatorId: "ops-001", content: "Looks good", createdAt: now, tags: ["reviewed"] },
      ],
    });

    expect(trace.runId).toBe("run-001");
    expect(trace.objective).toBe("Analyze vessel voyage P&L");
    expect(trace.selfModelSnapshot).toEqual({ role: "analyst", capabilities: ["finance", "logistics"] });
    expect(trace.worldModelSnapshotRef).toBe("world-snapshot-v42");
    expect(trace.planGraph?.nodes).toHaveLength(2);
    expect(trace.planGraph?.edges).toHaveLength(1);
    expect(trace.modelsUsed).toEqual(["gpt-4o", "o1-mini"]);
    expect(trace.promptVersions).toEqual(["v1.2.0", "v1.3.1"]);
    expect(trace.verifierDecisions).toHaveLength(1);
    expect(trace.reflections).toHaveLength(1);
    expect(trace.rollbackPoints).toHaveLength(1);
    expect(trace.output).toEqual({ summary: "Voyage profitable", marginPct: 12.4 });
    expect(trace.operatorComments).toHaveLength(1);
  });

  it("captures grade on a trace", () => {
    const now = new Date().toISOString();
    const trace = TraceRecordSchema.parse({
      traceId: "t-graded",
      startedAt: now,
      grade: {
        gradeId: "g1",
        gradedBy: "supervisor",
        score: 0.87,
        rubric: { accuracy: 0.9, efficiency: 0.8 },
        notes: "Good but slightly slow",
        gradedAt: now,
      },
    });
    expect(trace.grade?.score).toBe(0.87);
    expect(trace.grade?.rubric["accuracy"]).toBe(0.9);
  });
});

describe("InMemoryTraceStore", () => {
  it("saves and retrieves traces", () => {
    const store = makeStore();
    const trace = TraceRecordSchema.parse({ traceId: "t-001", startedAt: new Date().toISOString() });
    store.save(trace);
    expect(store.get("t-001")).toBeDefined();
    expect(store.count()).toBe(1);
  });

  it("filters by sessionId", () => {
    const store = makeStore();
    store.save(TraceRecordSchema.parse({ traceId: "t-1", sessionId: "s-a", startedAt: new Date().toISOString() }));
    store.save(TraceRecordSchema.parse({ traceId: "t-2", sessionId: "s-b", startedAt: new Date().toISOString() }));
    expect(store.list({ sessionId: "s-a" })).toHaveLength(1);
  });
});

describe("TraceWriter — extended fields", () => {
  let store: InMemoryTraceStore;
  let writer: TraceWriter;

  beforeEach(() => {
    store = makeStore();
    writer = new TraceWriter(store);
  });

  it("starts a trace in running status", () => {
    const trace = writer.startTrace({ traceId: "t-001", model: "gpt-4o" });
    expect(trace.status).toBe("running");
    expect(trace.model).toBe("gpt-4o");
    expect(trace.runId).toBe("t-001");
  });

  it("starts trace with objective and self-model snapshot", () => {
    const trace = writer.startTrace({
      traceId: "t-obj",
      objective: "Find best vessel route",
      selfModelSnapshot: { role: "logistics-agent" },
      worldModelSnapshotRef: "snapshot-v7",
    });
    expect(trace.objective).toBe("Find best vessel route");
    expect(trace.selfModelSnapshot).toEqual({ role: "logistics-agent" });
    expect(trace.worldModelSnapshotRef).toBe("snapshot-v7");
  });

  it("appends tool calls and retrieves them", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.appendToolCall("t-001", {
      toolId: "tool-1",
      toolName: "graph-query",
      success: true,
      retries: 0,
      approvalRequired: false,
    });
    const trace = store.get("t-001")!;
    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.toolCalls[0]?.toolName).toBe("graph-query");
  });

  it("appends verifier decisions", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.appendVerifierDecision("t-001", {
      verifierId: "v-check",
      step: "output-validation",
      outcome: "pass",
      score: 0.92,
      reason: "All constraints satisfied",
      timestamp: new Date().toISOString(),
    });
    const trace = store.get("t-001")!;
    expect(trace.verifierDecisions).toHaveLength(1);
    expect(trace.verifierDecisions[0]?.outcome).toBe("pass");
  });

  it("appends reflections", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.appendReflection("t-001", {
      reflectionId: "r-1",
      trigger: "error-rate-spike",
      content: "Retry with fallback model",
      actionTaken: "model-switch",
      timestamp: new Date().toISOString(),
    });
    const trace = store.get("t-001")!;
    expect(trace.reflections).toHaveLength(1);
    expect(trace.reflections[0]?.trigger).toBe("error-rate-spike");
  });

  it("adds rollback points", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.addRollbackPoint("t-001", {
      rollbackId: "rb-1",
      spanId: "s-pre-call",
      label: "Before LLM call",
      createdAt: new Date().toISOString(),
    });
    const trace = store.get("t-001")!;
    expect(trace.rollbackPoints).toHaveLength(1);
    expect(trace.rollbackPoints[0]?.label).toBe("Before LLM call");
  });

  it("sets plan graph", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.setPlanGraph("t-001", {
      nodes: [{ nodeId: "n1", label: "Step 1", nodeType: "task", status: "pending", dependsOn: [], metadata: {} }],
      edges: [],
      version: "1.0",
    });
    const trace = store.get("t-001")!;
    expect(trace.planGraph?.nodes).toHaveLength(1);
  });

  it("sets output", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.setOutput("t-001", { result: "done", confidence: 0.95 });
    const trace = store.get("t-001")!;
    expect(trace.output).toEqual({ result: "done", confidence: 0.95 });
  });

  it("adds operator comments with persist", () => {
    writer.startTrace({ traceId: "t-001" });
    const comment = writer.addOperatorComment("t-001", "ops-99", "Looks correct", {
      spanId: "s-1",
      tags: ["verified"],
    });
    expect(comment.commentId).toBeDefined();
    const trace = store.get("t-001")!;
    expect(trace.operatorComments).toHaveLength(1);
    expect(trace.operatorComments[0]?.operatorId).toBe("ops-99");
    expect(trace.operatorComments[0]?.tags).toContain("verified");
  });

  it("grades a run and persists the grade", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.completeTrace("t-001", { status: "completed" });
    const grade = writer.gradeRun("t-001", {
      gradedBy: "evaluator",
      score: 0.78,
      rubric: { relevance: 0.8, accuracy: 0.75 },
      notes: "Minor hallucination in step 3",
    });
    expect(grade.gradeId).toBeDefined();
    expect(grade.score).toBe(0.78);
    const trace = store.get("t-001")!;
    expect(trace.grade?.score).toBe(0.78);
  });

  it("completes a trace and sets completedAt", () => {
    writer.startTrace({ traceId: "t-001" });
    const completed = writer.completeTrace("t-001", { status: "completed", latencyMs: 250, totalTokens: 500 });
    expect(completed.status).toBe("completed");
    expect(completed.latencyMs).toBe(250);
    expect(completed.completedAt).toBeDefined();
  });

  it("records errors", () => {
    writer.startTrace({ traceId: "t-001" });
    writer.recordError("t-001", "TOOL_TIMEOUT", "Tool did not respond in time");
    const trace = store.get("t-001")!;
    expect(trace.errors).toHaveLength(1);
    expect(trace.errors[0]?.code).toBe("TOOL_TIMEOUT");
  });
});

describe("TraceReplayer — deterministic replay", () => {
  it("replays a trace deterministically via visitor including verifiers and reflections", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    const now = new Date().toISOString();
    writer.startTrace({ traceId: "t-001", objective: "Test objective" });
    writer.appendToolCall("t-001", { toolId: "t1", toolName: "search", success: true, retries: 0, approvalRequired: false });
    writer.appendVerifierDecision("t-001", { verifierId: "v1", step: "check", outcome: "pass", timestamp: now });
    writer.appendReflection("t-001", { reflectionId: "r1", trigger: "low-confidence", content: "retry", timestamp: now });
    writer.addRollbackPoint("t-001", { rollbackId: "rb1", createdAt: now });
    writer.completeTrace("t-001");

    const replayer = new TraceReplayer(store);
    const visited: string[] = [];
    replayer.replayTrace("t-001", {
      onTraceStart: (t) => visited.push(`start:${t.traceId}`),
      onToolCall: (c) => visited.push(`tool:${c.toolName}`),
      onVerifierDecision: (v) => visited.push(`verifier:${v.verifierId}`),
      onReflection: (r) => visited.push(`reflection:${r.reflectionId}`),
      onRollbackPoint: (rp) => visited.push(`rollback:${rp.rollbackId}`),
      onTraceEnd: (t) => visited.push(`end:${t.traceId}`),
    });

    expect(visited).toEqual(["start:t-001", "tool:search", "verifier:v1", "reflection:r1", "rollback:rb1", "end:t-001"]);
  });

  it("getTraceTree returns spans as a tree", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    const now = new Date().toISOString();
    writer.startTrace({ traceId: "t-001" });
    writer.appendSpan("t-001", { spanId: "s1", name: "root", startedAt: now, status: "ok", attributes: {} });
    writer.appendSpan("t-001", { spanId: "s2", parentSpanId: "s1", name: "child", startedAt: now, status: "ok", attributes: {} });

    const replayer = new TraceReplayer(store);
    const tree = replayer.getTraceTree("t-001")!;
    expect(tree.spans).toHaveLength(1);
    expect(tree.spans[0]?.children).toHaveLength(1);
    expect(tree.spans[0]?.children[0]?.span.spanId).toBe("s2");
  });

  it("compareTraces returns correct deltas", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "t-a" });
    writer.completeTrace("t-a", { latencyMs: 100, totalTokens: 200 });
    writer.startTrace({ traceId: "t-b" });
    writer.completeTrace("t-b", { latencyMs: 150, totalTokens: 300 });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("t-a", "t-b");
    expect(diff.latencyDeltaMs).toBe(50);
    expect(diff.tokenDelta).toBe(100);
  });
});

describe("TraceDiff — extended comparisons", () => {
  it("detects model changes between runs", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "base", model: "gpt-4o", modelsUsed: ["gpt-4o"] });
    writer.completeTrace("base", { latencyMs: 200 });
    writer.startTrace({ traceId: "candidate", model: "o1-mini", modelsUsed: ["o1-mini", "gpt-4o"] });
    writer.completeTrace("candidate", { latencyMs: 180 });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.modelChanged).toBe(true);
    expect(diff.modelsAdded).toContain("o1-mini");
  });

  it("detects prompt version changes", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "base", promptVersions: ["v1.0"] });
    writer.completeTrace("base");
    writer.startTrace({ traceId: "candidate", promptVersions: ["v2.0"] });
    writer.completeTrace("candidate");

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.promptVersionsChanged).toBe(true);
    expect(diff.promptVersionsA).toEqual(["v1.0"]);
    expect(diff.promptVersionsB).toEqual(["v2.0"]);
  });

  it("detects tool additions and removals", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "base" });
    writer.appendToolCall("base", { toolId: "t1", toolName: "search", success: true, retries: 0, approvalRequired: false });
    writer.completeTrace("base");
    writer.startTrace({ traceId: "candidate" });
    writer.appendToolCall("candidate", { toolId: "t2", toolName: "embed", success: true, retries: 0, approvalRequired: false });
    writer.completeTrace("candidate");

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.toolsAdded).toContain("embed");
    expect(diff.toolsRemoved).toContain("search");
  });

  it("detects output change", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "base" });
    writer.setOutput("base", { answer: "A" });
    writer.completeTrace("base");
    writer.startTrace({ traceId: "candidate" });
    writer.setOutput("candidate", { answer: "B" });
    writer.completeTrace("candidate");

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.outputChanged).toBe(true);
  });

  it("detects verifier pass rate delta", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    const now = new Date().toISOString();
    writer.startTrace({ traceId: "base" });
    writer.appendVerifierDecision("base", { verifierId: "v1", step: "s", outcome: "pass", timestamp: now });
    writer.appendVerifierDecision("base", { verifierId: "v2", step: "s", outcome: "pass", timestamp: now });
    writer.completeTrace("base");

    writer.startTrace({ traceId: "candidate" });
    writer.appendVerifierDecision("candidate", { verifierId: "v1", step: "s", outcome: "pass", timestamp: now });
    writer.appendVerifierDecision("candidate", { verifierId: "v2", step: "s", outcome: "fail", timestamp: now });
    writer.completeTrace("candidate");

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.verifierPassRateDelta).toBeCloseTo(-0.5);
  });

  it("detects grade score delta", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "base" });
    writer.completeTrace("base");
    writer.gradeRun("base", { gradedBy: "eval", score: 0.9, rubric: {} });

    writer.startTrace({ traceId: "candidate" });
    writer.completeTrace("candidate");
    writer.gradeRun("candidate", { gradedBy: "eval", score: 0.7, rubric: {} });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "candidate");
    expect(diff.gradeScoreDelta).toBeCloseTo(-0.2);
  });
});

describe("Regression detection", () => {
  it("detectRegressions flags candidates that exceed thresholds", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);

    writer.startTrace({ traceId: "baseline" });
    writer.completeTrace("baseline", { latencyMs: 100, costUsd: 0.005, status: "completed" });

    writer.startTrace({ traceId: "slow-run" });
    writer.completeTrace("slow-run", { latencyMs: 800, costUsd: 0.005, status: "completed" });

    writer.startTrace({ traceId: "ok-run" });
    writer.completeTrace("ok-run", { latencyMs: 150, costUsd: 0.005, status: "completed" });

    const replayer = new TraceReplayer(store);
    const regressions = replayer.detectRegressions("baseline", ["slow-run", "ok-run"], {
      latencyRegressionMs: 500,
      costRegressionUsd: 0.05,
    });

    expect(regressions).toHaveLength(1);
    expect(regressions[0]?.candidateTraceId).toBe("slow-run");
    expect(regressions[0]?.diff.regressionDetected).toBe(true);
    expect(regressions[0]?.diff.regressionReasons[0]).toMatch(/Latency increased/);
  });

  it("detectRegressions returns empty when no regressions", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "baseline" });
    writer.completeTrace("baseline", { latencyMs: 100, status: "completed" });
    writer.startTrace({ traceId: "candidate" });
    writer.completeTrace("candidate", { latencyMs: 105, status: "completed" });

    const replayer = new TraceReplayer(store);
    const regressions = replayer.detectRegressions("baseline", ["candidate"], {
      latencyRegressionMs: 500,
    });
    expect(regressions).toHaveLength(0);
  });

  it("detectRegressions flags grade score drop", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "baseline" });
    writer.completeTrace("baseline");
    writer.gradeRun("baseline", { gradedBy: "eval", score: 0.95, rubric: {} });

    writer.startTrace({ traceId: "candidate" });
    writer.completeTrace("candidate");
    writer.gradeRun("candidate", { gradedBy: "eval", score: 0.70, rubric: {} });

    const replayer = new TraceReplayer(store);
    const regressions = replayer.detectRegressions("baseline", ["candidate"], { gradeScoreDrop: 0.1 });
    expect(regressions).toHaveLength(1);
    expect(regressions[0]?.diff.regressionReasons[0]).toMatch(/Grade score dropped/);
  });
});

describe("WriteQueue", () => {
  it("enqueues writes and flushes to inner store", async () => {
    const inner = makeStore();
    const queue = new WriteQueue(inner, { flushIntervalMs: 10000 });
    const trace = TraceRecordSchema.parse({ traceId: "q-001", startedAt: new Date().toISOString() });
    inner.save(trace);
    queue.enqueue({ type: "save", trace });
    expect(queue.pendingCount).toBe(1);
    await queue.flush();
    expect(queue.pendingCount).toBe(0);
  });

  it("QueuedTraceStore saves immediately to inner and provides read access", () => {
    const inner = makeStore();
    const qStore = new QueuedTraceStore(inner, { flushIntervalMs: 10000 });
    const trace = TraceRecordSchema.parse({ traceId: "qs-001", startedAt: new Date().toISOString() });
    qStore.save(trace);
    expect(qStore.get("qs-001")).toBeDefined();
    expect(inner.get("qs-001")).toBeDefined();
    qStore.queue.stop();
  });

  it("QueuedTraceStore count reflects inner store", () => {
    const inner = makeStore();
    const qStore = new QueuedTraceStore(inner, { flushIntervalMs: 10000 });
    const t1 = TraceRecordSchema.parse({ traceId: "qs-a", startedAt: new Date().toISOString() });
    const t2 = TraceRecordSchema.parse({ traceId: "qs-b", startedAt: new Date().toISOString() });
    qStore.save(t1);
    qStore.save(t2);
    expect(qStore.count()).toBe(2);
    qStore.queue.stop();
  });
});

describe("TraceQueryEngine", () => {
  let store: InMemoryTraceStore;
  let writer: TraceWriter;
  let engine: TraceQueryEngine;

  beforeEach(() => {
    store = makeStore();
    writer = new TraceWriter(store);
    engine = new TraceQueryEngine(store);
  });

  it("queries all traces with no filter", () => {
    writer.startTrace({ traceId: "q-1" });
    writer.startTrace({ traceId: "q-2" });
    const result = engine.query();
    expect(result.traces).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("filters by agentId", () => {
    writer.startTrace({ traceId: "q-1", agentId: "agent-alpha" });
    writer.startTrace({ traceId: "q-2", agentId: "agent-beta" });
    const result = engine.query({ agentId: "agent-alpha" });
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0]?.traceId).toBe("q-1");
  });

  it("filters by status (running vs completed)", () => {
    writer.startTrace({ traceId: "q-run" });
    writer.startTrace({ traceId: "q-done" });
    writer.completeTrace("q-done", { status: "completed" });
    const running = engine.query({ status: "running" });
    expect(running.traces.some(t => t.traceId === "q-run")).toBe(true);
    expect(running.traces.every(t => t.status === "running")).toBe(true);
  });

  it("filters traces with errors via hasErrors flag", () => {
    writer.startTrace({ traceId: "q-err" });
    writer.recordError("q-err", "FAIL", "something failed");
    writer.startTrace({ traceId: "q-ok" });
    const errResult = engine.query({ hasErrors: true });
    expect(errResult.traces.every(t => t.errors.length > 0)).toBe(true);
    const okResult = engine.query({ hasErrors: false });
    expect(okResult.traces.every(t => t.errors.length === 0)).toBe(true);
  });

  it("paginates results via limit and offset", () => {
    for (let i = 0; i < 5; i++) writer.startTrace({ traceId: `page-${i}` });
    const page1 = engine.query({ limit: 2, offset: 0 });
    const page2 = engine.query({ limit: 2, offset: 2 });
    expect(page1.traces).toHaveLength(2);
    expect(page2.traces).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.traces[0]?.traceId).not.toBe(page2.traces[0]?.traceId);
  });

  it("getById retrieves the correct trace", () => {
    writer.startTrace({ traceId: "find-me", agentId: "agent-x" });
    const found = engine.getById("find-me");
    expect(found?.agentId).toBe("agent-x");
  });
});

describe("Entity linkage", () => {
  it("links entities to traces bidirectionally", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    const engine = new TraceQueryEngine(store);

    writer.startTrace({ traceId: "t-linked" });
    engine.linkEntityToTrace("t-linked", "entity-001");
    engine.linkEntityToTrace("t-linked", "entity-002");

    const entities = engine.getEntitiesForTrace("t-linked");
    expect(entities).toContain("entity-001");
    expect(entities).toContain("entity-002");

    const traces = engine.getTracesForEntity("entity-001");
    expect(traces).toContain("t-linked");
  });

  it("filters traces by entityId in query", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    const engine = new TraceQueryEngine(store);

    writer.startTrace({ traceId: "t-a" });
    writer.startTrace({ traceId: "t-b" });
    engine.linkEntityToTrace("t-a", "ent-x");

    const result = engine.query({ entityId: "ent-x" });
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0]?.traceId).toBe("t-a");
  });

  it("returns empty for entity with no traces", () => {
    const engine = new TraceQueryEngine(makeStore());
    expect(engine.getTracesForEntity("ghost-entity")).toEqual([]);
    expect(engine.getEntitiesForTrace("ghost-trace")).toEqual([]);
  });
});

describe("TraceSdk", () => {
  it("startSession creates a running trace", () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({ agentId: "agent-sdk" });
    expect(store.get(session.traceId)?.status).toBe("running");
  });

  it("startSpan and endSpan append a completed span", () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({});
    const spanId = session.startSpan({ name: "test-span" });
    session.endSpan(spanId, { status: "ok" });
    session.complete();
    const trace = store.get(session.traceId)!;
    expect(trace.spans).toHaveLength(1);
    expect(trace.spans[0]?.name).toBe("test-span");
    expect(trace.spans[0]?.status).toBe("ok");
  });

  it("complete sets trace to completed with latency", () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({});
    const result = session.complete({ latencyMs: 42 });
    expect(result.status).toBe("completed");
    expect(result.latencyMs).toBe(42);
  });

  it("fail records error and sets status to failed", () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({});
    const result = session.fail("ERR_CODE", "oops");
    expect(result.status).toBe("failed");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe("ERR_CODE");
  });

  it("wrapToolCall records success on resolved call", async () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({});
    const wrapped = sdk.wrapToolCall(session, "t1", "adder", async (a: number, b: number) => a + b);
    const res = await wrapped(3, 4);
    expect(res).toBe(7);
    session.complete();
    const trace = store.get(session.traceId)!;
    expect(trace.toolCalls.some(tc => tc.toolName === "adder" && tc.success)).toBe(true);
  });

  it("wrapToolCall records failure on rejected call", async () => {
    const store = makeStore();
    const sdk = new TraceSdk(new TraceWriter(store), new TraceQueryEngine(store));
    const session = sdk.startSession({});
    const wrapped = sdk.wrapToolCall(session, "t-fail", "breaker", async () => { throw new Error("boom"); });
    await expect(wrapped()).rejects.toThrow("boom");
    session.complete();
    const trace = store.get(session.traceId)!;
    expect(trace.toolCalls.some(tc => tc.toolName === "breaker" && !tc.success)).toBe(true);
  });

  it("linkEntity associates entity with trace in query engine", () => {
    const store = makeStore();
    const engine = new TraceQueryEngine(store);
    const sdk = new TraceSdk(new TraceWriter(store), engine);
    const session = sdk.startSession({});
    session.linkEntity("entity-999");
    session.complete();
    expect(engine.getEntitiesForTrace(session.traceId)).toContain("entity-999");
  });
});

describe("Replay diff — existing tests", () => {
  it("compareTraces surfaces tool call, latency, token, and cost diffs", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);

    writer.startTrace({ traceId: "base" });
    writer.appendToolCall("base", { toolId: "t1", toolName: "search", success: true, retries: 0, approvalRequired: false });
    writer.completeTrace("base", { latencyMs: 200, costUsd: 0.01, totalTokens: 400 });

    writer.startTrace({ traceId: "replay" });
    writer.appendToolCall("replay", { toolId: "t1", toolName: "search", success: true, retries: 0, approvalRequired: false });
    writer.appendToolCall("replay", { toolId: "t2", toolName: "embed", success: true, retries: 0, approvalRequired: false });
    writer.completeTrace("replay", { latencyMs: 320, costUsd: 0.018, totalTokens: 600 });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("base", "replay");

    expect(diff.latencyDeltaMs).toBeCloseTo(120);
    expect(diff.tokenDelta).toBe(200);
    expect(diff.toolCallCountDelta).toBe(1);
    expect(diff.statusA).toBe("completed");
    expect(diff.statusB).toBe("completed");
  });

  it("compareTraces detects error count change", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "clean" });
    writer.completeTrace("clean");
    writer.startTrace({ traceId: "dirty" });
    writer.recordError("dirty", "ERR", "oops");
    writer.completeTrace("dirty", { status: "failed" });

    const replayer = new TraceReplayer(store);
    const diff = replayer.compareTraces("clean", "dirty");
    expect(diff.errorCountDelta).toBe(1);
  });
});

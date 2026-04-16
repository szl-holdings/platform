import { describe, it, expect, beforeEach } from "vitest";
import { TraceRecordSchema } from "./schema.js";
import { InMemoryTraceStore } from "./store.js";
import { TraceWriter } from "./writer.js";
import { TraceReplayer } from "./replay.js";

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

describe("TraceWriter", () => {
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

describe("TraceReplayer", () => {
  it("replays a trace deterministically via visitor", () => {
    const store = makeStore();
    const writer = new TraceWriter(store);
    writer.startTrace({ traceId: "t-001" });
    writer.appendToolCall("t-001", { toolId: "t1", toolName: "search", success: true, retries: 0, approvalRequired: false });
    writer.completeTrace("t-001");

    const replayer = new TraceReplayer(store);
    const visited: string[] = [];
    replayer.replayTrace("t-001", {
      onTraceStart: (t) => visited.push(`start:${t.traceId}`),
      onToolCall: (c) => visited.push(`tool:${c.toolName}`),
      onTraceEnd: (t) => visited.push(`end:${t.traceId}`),
    });

    expect(visited).toEqual(["start:t-001", "tool:search", "end:t-001"]);
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

import { describe, it, expect } from "vitest";
import { replayFromTrace, replaySnapshot, replayScenario } from "./replay.ts";
import { createSnapshot } from "./snapshot.ts";

describe("replayFromTrace — deterministic replay from trace", () => {
  it("returns full-fidelity deterministic result with captured tool outputs", () => {
    const result = replayFromTrace({
      traceId: "trace-001",
      runId: "run-001",
      objective: "Analyze threat signals",
      selfModelSnapshot: { role: "analyst", version: "2.1" },
      worldModelSnapshot: { threatLevel: "medium", lastUpdated: "2026-04-17" },
      capturedToolOutputs: {
        "tool:search": { results: ["signal-A", "signal-B"] },
        "tool:classify": { classification: "high-priority" },
      },
      capturedModelOutputs: {
        "gpt-4o": { summary: "Two active threats detected" },
      },
    });

    expect(result.originalTraceId).toBe("trace-001");
    expect(result.replayedAt).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.deterministicScore).toBe(1.0);
    expect(result.errors).toHaveLength(0);

    const kindSet = new Set(result.steps.map((s) => s.kind));
    expect(kindSet).toContain("self_model_restore");
    expect(kindSet).toContain("world_model_restore");
    expect(kindSet).toContain("tool_replay");
    expect(kindSet).toContain("model_replay");
  });

  it("returns deterministic score of 1.0 when no captured outputs provided", () => {
    const result = replayFromTrace({
      traceId: "trace-minimal",
    });
    expect(result.deterministicScore).toBe(1.0);
    expect(result.totalStepCount).toBe(0);
  });

  it("assigns sequential indices to steps", () => {
    const result = replayFromTrace({
      traceId: "trace-seq",
      selfModelSnapshot: { role: "agent" },
      capturedToolOutputs: { "tool:A": { val: 1 }, "tool:B": { val: 2 } },
    });
    const indices = result.steps.map((s) => s.sequenceIndex);
    for (let i = 0; i < indices.length - 1; i++) {
      expect(indices[i]!).toBeLessThan(indices[i + 1]!);
    }
  });

  it("records errors for missing captured outputs gracefully", () => {
    const result = replayFromTrace({
      traceId: "trace-partial",
      capturedToolOutputs: {
        "tool:present": { val: "ok" },
      },
    });
    expect(result.errors).toHaveLength(0);
    expect(result.deterministicScore).toBe(1.0);
  });
});

describe("replaySnapshot", () => {
  it("executes executor and compares against ground truth", async () => {
    const snapshot = createSnapshot({
      id: "snap-001",
      scenarioId: "scenario-A",
      label: "Basic test",
      domain: "aegis",
      snapshotType: "incident",
      historicalContext: { threatLevel: "high" },
      agentInputs: [{ query: "detect threats" }],
      groundTruth: { severity: "high", actionRequired: true },
      version: "1.0",
      tags: ["test"],
      metadata: {},
    });

    const result = await replaySnapshot(snapshot, async (input, context, snapshotId) => ({
      snapshotId,
      agentOutput: { severity: "high", actionRequired: true },
      latencyMs: 50,
      tokensUsed: 100,
      costUsd: 0.001,
    }));

    expect(result.snapshotId).toBe("snap-001");
    expect(result.groundTruthMatch).toBe(true);
    expect(result.groundTruthScore).toBe(1.0);
    expect(result.errors).toBeUndefined();
  });

  it("returns failed result with error message on timeout", async () => {
    const snapshot = createSnapshot({
      id: "snap-timeout",
      scenarioId: "scenario-B",
      label: "Timeout test",
      domain: "vessels",
      snapshotType: "flow",
      historicalContext: {},
      agentInputs: [{}],
      groundTruth: { answer: "x" },
      version: "1.0",
      tags: [],
      metadata: {},
    });

    const result = await replaySnapshot(
      snapshot,
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { snapshotId: "snap-timeout", agentOutput: {}, latencyMs: 500 };
      },
      { timeoutMs: 50 },
    );

    expect(result.groundTruthMatch).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toMatch(/timed out/i);
  });
});

describe("replayScenario", () => {
  it("runs multiple snapshots and produces a run report", async () => {
    const snapshots = [
      createSnapshot({
        id: "s1",
        scenarioId: "multi",
        label: "Case 1",
        domain: "terra",
        snapshotType: "decision",
        historicalContext: {},
        agentInputs: [{ val: 1 }],
        groundTruth: { result: 1 },
        version: "1.0",
        tags: [],
        metadata: {},
      }),
      createSnapshot({
        id: "s2",
        scenarioId: "multi",
        label: "Case 2",
        domain: "terra",
        snapshotType: "decision",
        historicalContext: {},
        agentInputs: [{ val: 2 }],
        groundTruth: { result: 2 },
        version: "1.0",
        tags: [],
        metadata: {},
      }),
    ];

    const report = await replayScenario(
      snapshots,
      async (input, _ctx, snapshotId) => ({
        snapshotId,
        agentOutput: { result: (input as { val: number }).val },
        latencyMs: 10,
        tokensUsed: 20,
        costUsd: 0.0001,
      }),
    );

    expect(report.totalSnapshots).toBe(2);
    expect(report.successful).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.groundTruthMatchRate).toBe(1.0);
    expect(report.avgLatencyMs).toBeGreaterThanOrEqual(0);
  });
});

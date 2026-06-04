import { describe, it, expect } from "vitest";
import {
  runPipeline,
  type PipelineStage,
} from "../src/rl-cold-start-pipeline.js";

interface S {
  step: number;
  quality: number;
}

describe("primitive 70 — RL cold-start pipeline", () => {
  const happy: PipelineStage<S>[] = [
    {
      name: "cold-start",
      apply: (s) => ({ step: s.step + 1, quality: 0.3 }),
      gate: (s) => ({
        ok: s.quality >= 0.2,
        rationale: `quality ${s.quality} >= 0.2`,
      }),
    },
    {
      name: "rl-stage-1",
      apply: (s) => ({ ...s, quality: s.quality + 0.4 }),
      gate: (s) => ({
        ok: s.quality >= 0.6,
        rationale: `quality ${s.quality} after RL`,
      }),
    },
    {
      name: "sft",
      apply: (s) => ({ ...s, quality: s.quality + 0.2 }),
      gate: (s) => ({ ok: s.quality >= 0.8, rationale: "sft gate" }),
    },
  ];

  it("runs all stages and completes", () => {
    const r = runPipeline<S>({ step: 0, quality: 0 }, happy);
    expect(r.completed).toBe(true);
    expect(r.stages.length).toBe(3);
    expect(r.finalState.quality).toBeCloseTo(0.9);
  });

  it("halts when a gate fails", () => {
    const failing: PipelineStage<S>[] = [
      ...happy,
      {
        name: "impossible",
        apply: (s) => s,
        gate: () => ({ ok: false, rationale: "always fails" }),
      },
    ];
    const r = runPipeline<S>({ step: 0, quality: 0 }, failing);
    expect(r.completed).toBe(false);
    expect(r.rationale).toMatch(/halted at stage "impossible"/);
    expect(r.stages.length).toBe(4);
  });

  it("rejects empty pipeline", () => {
    expect(() => runPipeline<S>({ step: 0, quality: 0 }, [])).toThrow(
      /at least 1 stage/
    );
  });

  it("records before/after for each stage", () => {
    const r = runPipeline<S>({ step: 0, quality: 0 }, happy);
    expect(r.stages[0].stateBefore.quality).toBe(0);
    expect(r.stages[0].stateAfter.quality).toBeCloseTo(0.3);
  });
});

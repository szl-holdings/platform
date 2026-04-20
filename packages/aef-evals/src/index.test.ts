import { describe, it, expect } from "vitest";
import { computeNdcgAtK } from "./metrics/ndcg.js";
import { computeRecallAtK } from "./metrics/recall.js";
import { computePrecisionAtK } from "./metrics/precision.js";
import { computeMrr } from "./metrics/mrr.js";
import { computeLatencyPercentiles } from "./metrics/latency.js";
import { runEval } from "./runner.js";
import { maritimeFixtures } from "./fixtures/maritime.js";
import type { RetrievalAdapter, RetrievalResult } from "./types.js";

describe("computeNdcgAtK", () => {
  it("returns 1.0 for perfect retrieval", () => {
    const retrieved = ["c1", "c2", "c3"];
    const relevant = ["c1", "c2", "c3"];
    expect(computeNdcgAtK(retrieved, relevant, 10)).toBeCloseTo(1.0);
  });

  it("returns 0.0 when no relevant items are retrieved", () => {
    const retrieved = ["c4", "c5"];
    const relevant = ["c1", "c2"];
    expect(computeNdcgAtK(retrieved, relevant, 10)).toBeCloseTo(0.0);
  });

  it("returns partial score for partial match", () => {
    const retrieved = ["c1", "c4", "c5"];
    const relevant = ["c1", "c2"];
    const ndcg = computeNdcgAtK(retrieved, relevant, 10);
    expect(ndcg).toBeGreaterThan(0);
    expect(ndcg).toBeLessThan(1);
  });

  it("handles k=1 correctly", () => {
    expect(computeNdcgAtK(["c1"], ["c1"], 1)).toBeCloseTo(1.0);
    expect(computeNdcgAtK(["c2"], ["c1"], 1)).toBeCloseTo(0.0);
  });
});

describe("computeRecallAtK", () => {
  it("returns 1.0 when all relevant items are retrieved", () => {
    expect(computeRecallAtK(["a", "b", "c"], ["a", "b"], 3)).toBeCloseTo(1.0);
  });

  it("returns 0.5 when half of relevant items are retrieved", () => {
    expect(computeRecallAtK(["a", "x"], ["a", "b"], 2)).toBeCloseTo(0.5);
  });

  it("returns 0.0 for empty relevant set", () => {
    expect(computeRecallAtK(["a", "b"], [], 10)).toBeCloseTo(0.0);
  });
});

describe("computePrecisionAtK", () => {
  it("returns 1.0 when all retrieved items are relevant", () => {
    expect(computePrecisionAtK(["a", "b"], ["a", "b", "c"], 2)).toBeCloseTo(1.0);
  });

  it("returns 0.5 when half of retrieved items are relevant", () => {
    expect(computePrecisionAtK(["a", "x"], ["a", "b"], 2)).toBeCloseTo(0.5);
  });

  it("returns 0.0 for empty retrieved list", () => {
    expect(computePrecisionAtK([], ["a"], 5)).toBeCloseTo(0.0);
  });
});

describe("computeMrr", () => {
  it("returns 1.0 when the first result is relevant", () => {
    expect(computeMrr(["c1", "c2", "c3"], ["c1"])).toBeCloseTo(1.0);
  });

  it("returns 0.5 when the second result is the first relevant one", () => {
    expect(computeMrr(["c2", "c1", "c3"], ["c1"])).toBeCloseTo(0.5);
  });

  it("returns 0.0 when no relevant results are found", () => {
    expect(computeMrr(["c4", "c5"], ["c1"])).toBeCloseTo(0.0);
  });
});

describe("computeLatencyPercentiles", () => {
  it("computes percentiles correctly for a known array", () => {
    const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
    const stats = computeLatencyPercentiles(latencies);
    expect(stats.p50).toBe(50);
    expect(stats.p95).toBe(95);
    expect(stats.p99).toBe(99);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(100);
  });

  it("returns zeros for empty input", () => {
    const stats = computeLatencyPercentiles([]);
    expect(stats.p50).toBe(0);
    expect(stats.p95).toBe(0);
  });
});

describe("runEval", () => {
  it("produces well-formed eval results", async () => {
    const mockAdapter: RetrievalAdapter = {
      async search(query: string, topK: number): Promise<RetrievalResult> {
        void query;
        return {
          queryId: "mock",
          retrievedChunkIds: Array.from({ length: topK }, (_, i) => `chunk-${i}`),
          latencyMs: 15 + Math.random() * 10,
        };
      },
    };

    const result = await runEval(maritimeFixtures, mockAdapter, {
      topK: 5,
      metrics: ["ndcg", "recall", "precision", "mrr"],
    });

    expect(result.profileId).toBe("vessels_maritime_risk");
    expect(result.queryCount).toBe(maritimeFixtures.queries.length);
    expect(result.metrics.length).toBe(4);
    expect(result.latencyP50Ms).toBeGreaterThan(0);
    expect(result.evidenceCompleteness.length).toBe(maritimeFixtures.queries.length);
  });
});

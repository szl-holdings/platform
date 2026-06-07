import { describe, it, expect } from "vitest";
import { aggregateEdge, emitGate, type EdgeSample } from "../src/edge-aggregation.js";

const samples = (overrides: Partial<EdgeSample>[] = []): EdgeSample[] =>
  overrides.map((o, i) => ({ ts: i, value: i * 10, connectivity: "online", ...o }));

describe("edge aggregation", () => {
  it("rejects empty window", () => {
    expect(() => aggregateEdge([])).toThrow();
  });

  it("computes mean", () => {
    const a = aggregateEdge(samples([{ value: 10 }, { value: 20 }, { value: 30 }]));
    expect(a.mean).toBeCloseTo(20);
  });

  it("computes min/max", () => {
    const a = aggregateEdge(samples([{ value: 5 }, { value: 1 }, { value: 9 }]));
    expect(a.min).toBe(1);
    expect(a.max).toBe(9);
  });

  it("worstConnectivity reflects worst sample", () => {
    const a = aggregateEdge([
      { ts: 0, value: 1, connectivity: "online" },
      { ts: 1, value: 2, connectivity: "intermittent" },
      { ts: 2, value: 3, connectivity: "offline" },
    ]);
    expect(a.worstConnectivity).toBe("offline");
  });

  it("trustScore is 1 when all online", () => {
    const a = aggregateEdge(samples([{ value: 1 }, { value: 2 }]));
    expect(a.trustScore).toBeCloseTo(1.0);
  });

  it("trustScore drops with offline samples", () => {
    const a = aggregateEdge([
      { ts: 0, value: 1, connectivity: "online" },
      { ts: 1, value: 2, connectivity: "offline" },
    ]);
    expect(a.trustScore).toBeCloseTo((1.0 + 0.2) / 2);
  });

  it("emitGate allows when above floor", () => {
    const a = aggregateEdge(samples([{ value: 1 }]));
    expect(emitGate(a, 0.5, true).emit).toBe(true);
  });

  it("emitGate fail-closed below floor refuses", () => {
    const a = aggregateEdge([{ ts: 0, value: 1, connectivity: "offline" }]);
    expect(emitGate(a, 0.5, true).emit).toBe(false);
  });

  it("emitGate fail-open below floor still emits", () => {
    const a = aggregateEdge([{ ts: 0, value: 1, connectivity: "offline" }]);
    expect(emitGate(a, 0.5, false).emit).toBe(true);
  });

  it("count is window size", () => {
    const a = aggregateEdge(samples([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]));
    expect(a.count).toBe(4);
  });

  it("window bounds reflect timestamps", () => {
    const a = aggregateEdge([
      { ts: 100, value: 1, connectivity: "online" },
      { ts: 200, value: 2, connectivity: "online" },
    ]);
    expect(a.windowStart).toBe(100);
    expect(a.windowEnd).toBe(200);
  });

  it("single sample window aggregates cleanly", () => {
    const a = aggregateEdge([{ ts: 5, value: 7, connectivity: "intermittent" }]);
    expect(a.mean).toBe(7);
    expect(a.worstConnectivity).toBe("intermittent");
  });
});

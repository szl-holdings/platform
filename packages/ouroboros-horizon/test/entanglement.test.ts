import { describe, expect, it } from "vitest";
import {
  buildEntanglementGraph,
  checkEntanglementGuards,
  entanglementBits,
  variationOfInformationBits,
} from "../src/entanglement.js";
import { asLoopId, type ObservableSample } from "../src/types.js";

function stream(states: string[]): ObservableSample[] {
  return states.map((state, i) => ({ tick: i + 1, state }));
}

describe("entanglementBits", () => {
  it("is 0 for independent streams", () => {
    const a = stream(["x", "x", "x", "x"]);
    const b = stream(["y", "y", "y", "y"]);
    expect(entanglementBits(a, b)).toBeCloseTo(0, 10);
  });

  it("is positive for correlated streams", () => {
    const a = stream(["a", "b", "a", "b", "a", "b"]);
    const b = stream(["1", "2", "1", "2", "1", "2"]);
    expect(entanglementBits(a, b)).toBeCloseTo(1, 10);
  });

  it("inner-joins by tick when streams are misaligned", () => {
    const a: ObservableSample[] = [
      { tick: 1, state: "a" },
      { tick: 2, state: "b" },
      { tick: 5, state: "a" },
    ];
    const b: ObservableSample[] = [
      { tick: 1, state: "1" },
      { tick: 2, state: "2" },
      { tick: 99, state: "x" },
    ];
    // Only ticks 1 and 2 align; correlation is perfect on those.
    expect(entanglementBits(a, b)).toBeCloseTo(1, 10);
  });

  it("returns 0 when there is no overlap", () => {
    const a: ObservableSample[] = [{ tick: 1, state: "a" }];
    const b: ObservableSample[] = [{ tick: 99, state: "z" }];
    expect(entanglementBits(a, b)).toBe(0);
  });
});

describe("variationOfInformationBits", () => {
  it("is 0 for identical streams", () => {
    const a = stream(["a", "b", "a", "b"]);
    const b = stream(["a", "b", "a", "b"]);
    expect(variationOfInformationBits(a, b)).toBeCloseTo(0, 10);
  });

  it("is symmetric", () => {
    const a = stream(["a", "b", "a", "c"]);
    const b = stream(["1", "1", "2", "2"]);
    const ab = variationOfInformationBits(a, b);
    const ba = variationOfInformationBits(b, a);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it("is non-negative", () => {
    const a = stream(["a", "b", "c", "d"]);
    const b = stream(["w", "x", "y", "z"]);
    expect(variationOfInformationBits(a, b)).toBeGreaterThanOrEqual(0);
  });
});

describe("buildEntanglementGraph", () => {
  it("emits one edge per unordered pair", () => {
    const loops = new Map([
      [asLoopId("a"), stream(["x", "y"])],
      [asLoopId("b"), stream(["x", "y"])],
      [asLoopId("c"), stream(["x", "y"])],
    ]);
    const edges = buildEntanglementGraph(loops);
    expect(edges.length).toBe(3);
    const pairs = new Set(edges.map((e) => `${e.from}-${e.to}`));
    expect(pairs.has("a-b")).toBe(true);
    expect(pairs.has("a-c")).toBe(true);
    expect(pairs.has("b-c")).toBe(true);
  });

  it("returns canonical (lexicographic) edge endpoints", () => {
    const loops = new Map([
      [asLoopId("zeta"), stream(["a"])],
      [asLoopId("alpha"), stream(["a"])],
    ]);
    const edges = buildEntanglementGraph(loops);
    expect(edges).toHaveLength(1);
    expect(edges[0]!.from).toBe("alpha");
    expect(edges[0]!.to).toBe("zeta");
  });
});

describe("checkEntanglementGuards", () => {
  it("flags a violation when expected-decoupled pair is correlated", () => {
    const a = asLoopId("svc-a");
    const b = asLoopId("svc-b");
    const edges = [
      { from: a, to: b, bits: 0.9, distance: 0.1 },
    ];
    const v = checkEntanglementGuards(edges, {
      expectedDecoupled: [[a, b]],
      decoupledMaxBits: 0.1,
    });
    expect(v).toHaveLength(1);
    expect(v[0]!.expectation).toBe("decoupled");
    expect(v[0]!.observedBits).toBe(0.9);
  });

  it("flags a violation when expected-coupled pair is decoupled", () => {
    const a = asLoopId("svc-a");
    const b = asLoopId("svc-b");
    const edges = [{ from: a, to: b, bits: 0.05, distance: 1.5 }];
    const v = checkEntanglementGuards(edges, {
      expectedCoupled: [[a, b]],
      coupledMinBits: 0.5,
    });
    expect(v).toHaveLength(1);
    expect(v[0]!.expectation).toBe("coupled");
  });

  it("returns empty when expectations match observations", () => {
    const a = asLoopId("svc-a");
    const b = asLoopId("svc-b");
    const edges = [{ from: a, to: b, bits: 0.02, distance: 1.5 }];
    const v = checkEntanglementGuards(edges, {
      expectedDecoupled: [[a, b]],
      decoupledMaxBits: 0.1,
    });
    expect(v).toEqual([]);
  });
});

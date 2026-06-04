import { describe, it, expect } from "vitest";
import { checkVanishingPoint } from "../src/vanishing-point.js";

describe("Primitive 58 — Vanishing-point coherence", () => {
  it("coherent when all orthogonals pass through VP exactly", () => {
    const vp: [number, number] = [10, 5];
    const r = checkVanishingPoint(vp, [
      { id: "L1", p: [0, 0], q: [10, 5] },
      { id: "L2", p: [0, 10], q: [10, 5] },
    ], 1e-9);
    expect(r.coherent).toBe(true);
    expect(r.maxDistance).toBeLessThan(1e-9);
  });

  it("incoherent when a line misses VP beyond tolerance", () => {
    const vp: [number, number] = [10, 5];
    const r = checkVanishingPoint(vp, [
      { id: "L1", p: [0, 0], q: [10, 5] },
      { id: "L2", p: [0, 0], q: [10, 0] }, // misses VP by 5 vertically
    ], 0.5);
    expect(r.coherent).toBe(false);
  });

  it("perLine reports per-line distance", () => {
    const vp: [number, number] = [10, 5];
    const r = checkVanishingPoint(vp, [
      { id: "L1", p: [0, 0], q: [10, 5] },
      { id: "L2", p: [0, 5], q: [10, 5] },
    ], 0.5);
    expect(r.perLine).toHaveLength(2);
    expect(r.perLine.every((p) => typeof p.distance === "number")).toBe(true);
  });

  it("requires ≥ 2 lines", () => {
    expect(() =>
      checkVanishingPoint([0, 0], [{ id: "L", p: [0, 0], q: [1, 1] }]),
    ).toThrow();
  });

  it("rejects degenerate line (p===q)", () => {
    expect(() =>
      checkVanishingPoint([0, 0], [
        { id: "L1", p: [1, 1], q: [1, 1] },
        { id: "L2", p: [0, 0], q: [1, 1] },
      ]),
    ).toThrow();
  });
});

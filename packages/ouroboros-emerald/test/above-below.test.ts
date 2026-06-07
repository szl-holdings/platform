import { describe, it, expect } from "vitest";
import { checkAboveBelow } from "../src/above-below.js";

describe("Primitive 37 — Above-Below correspondence", () => {
  it("holds when micro and macro agree exactly", () => {
    const r = checkAboveBelow([
      { scale: "micro", value: 1.0 },
      { scale: "macro", value: 1.0 },
    ]);
    expect(r.holds).toBe(true);
    expect(r.symmetricDelta).toBe(0);
  });

  it("holds within tolerance for small drift", () => {
    const r = checkAboveBelow(
      [
        { scale: "micro", value: 1.0 },
        { scale: "macro", value: 1.04 },
      ],
      0.05,
    );
    expect(r.holds).toBe(true);
  });

  it("declares scale-break when delta exceeds tolerance", () => {
    const r = checkAboveBelow(
      [
        { scale: "micro", value: 1.0 },
        { scale: "macro", value: 2.0 },
      ],
      0.05,
    );
    expect(r.holds).toBe(false);
    expect(r.rationale).toContain("scale-break");
  });

  it("computes ratio", () => {
    const r = checkAboveBelow([
      { scale: "micro", value: 2.0 },
      { scale: "macro", value: 4.0 },
    ]);
    expect(r.ratio).toBe(0.5);
  });

  it("rejects missing scale", () => {
    expect(() =>
      checkAboveBelow([{ scale: "micro", value: 1.0 }]),
    ).toThrow();
  });

  it("symmetric delta is invariant under swap", () => {
    const a = checkAboveBelow([
      { scale: "micro", value: 3.0 },
      { scale: "macro", value: 4.0 },
    ]);
    const b = checkAboveBelow([
      { scale: "micro", value: 4.0 },
      { scale: "macro", value: 3.0 },
    ]);
    expect(a.symmetricDelta).toBeCloseTo(b.symmetricDelta, 12);
  });

  it("handles negative values without zero-divide", () => {
    const r = checkAboveBelow([
      { scale: "micro", value: -1.0 },
      { scale: "macro", value: -1.0 },
    ]);
    expect(r.holds).toBe(true);
  });
});

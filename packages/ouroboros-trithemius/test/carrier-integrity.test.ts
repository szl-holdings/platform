import { describe, it, expect } from "vitest";
import { checkCarrier } from "../src/carrier-integrity.js";

describe("Primitive 53 — Carrier integrity", () => {
  it("returns chi-square of zero for matching distributions", () => {
    const r = checkCarrier({
      observed: { a: 10, b: 20 },
      expected: { a: 10, b: 20 },
      threshold: 3.84,
    });
    expect(r.chiSquare).toBeCloseTo(0, 12);
    expect(r.anomalous).toBe(false);
  });

  it("flags anomalous carrier when chi exceeds threshold", () => {
    const r = checkCarrier({
      observed: { a: 1, b: 99 },
      expected: { a: 50, b: 50 },
      threshold: 3.84,
    });
    expect(r.anomalous).toBe(true);
  });

  it("missing observed key counts as zero", () => {
    const r = checkCarrier({
      observed: { a: 10 },
      expected: { a: 10, b: 10 },
      threshold: 3.84,
    });
    expect(r.chiSquare).toBeCloseTo(10, 6);
  });

  it("degreesOfFreedom is at least 1", () => {
    const r = checkCarrier({
      observed: { a: 5 },
      expected: { a: 5 },
      threshold: 3.84,
    });
    expect(r.degreesOfFreedom).toBe(1);
  });

  it("rationale describes outcome", () => {
    const ok = checkCarrier({
      observed: { a: 10, b: 10 },
      expected: { a: 10, b: 10 },
      threshold: 3.84,
    });
    expect(ok.rationale).toContain("consistent");
  });
});

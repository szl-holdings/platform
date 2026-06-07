import { describe, expect, it } from "vitest";
import { gaussClosureAxis, leastSquares } from "../src/least-squares.ts";

describe("Gauß least-squares (Primitive 17)", () => {
  it("solves an exactly-determined 2×2 system", () => {
    const r = leastSquares({
      A: [
        [1, 0],
        [0, 1],
      ],
      b: [3, 4],
    });
    expect(r.solution[0]).toBeCloseTo(3, 12);
    expect(r.solution[1]).toBeCloseTo(4, 12);
    expect(r.residualNorm).toBeCloseTo(0, 12);
  });

  it("solves a clean 3×2 over-determined system with zero residuals (consistent)", () => {
    // Rows 1 and 2 fix x = (1, 1); row 3 is x + y = 2, also satisfied.
    const r = leastSquares({
      A: [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      b: [1, 1, 2],
    });
    expect(r.solution[0]).toBeCloseTo(1, 12);
    expect(r.solution[1]).toBeCloseTo(1, 12);
    expect(r.residualNorm).toBeCloseTo(0, 12);
  });

  it("recovers the textbook line of best fit y = 2x + 1 from clean data", () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map((x) => 2 * x + 1);
    const A = xs.map((x) => [x, 1]);
    const r = leastSquares({ A, b: ys });
    expect(r.solution[0]).toBeCloseTo(2, 9);
    expect(r.solution[1]).toBeCloseTo(1, 9);
    expect(r.residualNorm).toBeLessThan(1e-9);
  });

  it("recovers the slope of a noisy line within tolerance", () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ys = [1.1, 2.95, 5.05, 6.9, 9.1, 10.95, 13.05, 14.9, 17.1, 18.95];
    const A = xs.map((x) => [x, 1]);
    const r = leastSquares({ A, b: ys });
    expect(r.solution[0]).toBeCloseTo(2, 1);
    expect(r.solution[1]).toBeCloseTo(1, 1);
  });

  it("residuals sum to zero when the design includes an intercept column", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2.1, 3.9, 6.05, 8.1, 9.9];
    const A = xs.map((x) => [x, 1]);
    const r = leastSquares({ A, b: ys });
    const sum = r.residuals.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 9);
  });

  it("rejects empty matrix", () => {
    expect(() => leastSquares({ A: [], b: [] })).toThrow();
  });

  it("rejects ragged rows", () => {
    expect(() =>
      leastSquares({
        A: [
          [1, 0],
          [0],
        ] as unknown as number[][],
        b: [1, 1],
      }),
    ).toThrow();
  });

  it("rejects under-determined systems (m < n)", () => {
    expect(() => leastSquares({ A: [[1, 1, 1]], b: [3] })).toThrow();
  });

  it("rejects rank-deficient design (singular normal matrix)", () => {
    // Two identical columns ⇒ AᵀA singular.
    expect(() =>
      leastSquares({
        A: [
          [1, 1],
          [2, 2],
          [3, 3],
        ],
        b: [1, 2, 3],
      }),
    ).toThrow();
  });

  it("rejects non-finite entries", () => {
    expect(() =>
      leastSquares({
        A: [
          [1, NaN],
          [0, 1],
        ],
        b: [1, 1],
      }),
    ).toThrow();
  });

  it("reports correct m and n", () => {
    const r = leastSquares({
      A: [
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 0],
        [1, 1, 1],
      ],
      b: [1, 2, 3, 4],
    });
    expect(r.m).toBe(4);
    expect(r.n).toBe(3);
  });

  it("gaussClosureAxis returns 1 for a perfectly closed network", () => {
    const r = leastSquares({
      A: [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      b: [1, 1, 2],
    });
    expect(gaussClosureAxis(r)).toBeCloseTo(1, 9);
  });

  it("gaussClosureAxis decays with residual norm", () => {
    const xs = [0, 1, 2, 3, 4, 5];
    const A = xs.map((x) => [x, 1]);
    const clean = leastSquares({ A, b: xs.map((x) => 2 * x + 1) });
    const noisy = leastSquares({ A, b: [1.1, 2.5, 5.5, 6.1, 9.9, 10.5] });
    expect(gaussClosureAxis(clean, 0.5)).toBeGreaterThan(gaussClosureAxis(noisy, 0.5));
  });

  it("gaussClosureAxis stays in [0, 1]", () => {
    const r = leastSquares({
      A: [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      b: [10, 10, -100], // pathological
    });
    const v = gaussClosureAxis(r, 0.1);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("gaussClosureAxis rejects bad noiseSigma", () => {
    const r = leastSquares({
      A: [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      b: [1, 1, 2],
    });
    expect(() => gaussClosureAxis(r, 0)).toThrow();
    expect(() => gaussClosureAxis(r, -1)).toThrow();
  });
});

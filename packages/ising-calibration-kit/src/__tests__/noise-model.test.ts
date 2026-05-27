import { describe, expect, it } from "vitest";
import {
  assertNoiseModelAligned,
  composeNoiseDivergence,
  jensenShannonDivergence,
  symmetricKL,
} from "../noise-model.js";

describe("jensenShannonDivergence", () => {
  it("returns 0 for identical distributions", () => {
    expect(jensenShannonDivergence({ a: 1, b: 1 }, { a: 1, b: 1 })).toBeCloseTo(
      0,
      10,
    );
  });

  it("is symmetric in its arguments", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 3, y: 2, z: 1 };
    expect(jensenShannonDivergence(a, b)).toBeCloseTo(
      jensenShannonDivergence(b, a),
      12,
    );
  });

  it("grows with distributional distance", () => {
    const small = jensenShannonDivergence(
      { a: 10, b: 10 },
      { a: 11, b: 10 },
    );
    const large = jensenShannonDivergence(
      { a: 10, b: 10 },
      { a: 50, b: 10 },
    );
    expect(large).toBeGreaterThan(small);
  });

  it("is bounded in [0, ln 2] even for disjoint supports", () => {
    // Maximum-divergence case: disjoint supports.
    const jsd = jensenShannonDivergence({ a: 1 }, { b: 1 });
    expect(jsd).toBeLessThanOrEqual(Math.log(2) + 1e-12);
    expect(jsd).toBeGreaterThan(0);
  });

  it("is zero-safe: never produces NaN on missing keys", () => {
    // Key 'b' is missing from learned; KL would explode here, JSD stays finite.
    const jsd = jensenShannonDivergence({ a: 1 }, { a: 1, b: 1 });
    expect(Number.isFinite(jsd)).toBe(true);
    expect(jsd).toBeGreaterThan(0);
    expect(jsd).toBeLessThanOrEqual(Math.log(2));
  });

  it("is zero-safe with explicit zero weights", () => {
    const jsd = jensenShannonDivergence(
      { a: 1, b: 0 },
      { a: 1, b: 1 },
    );
    expect(Number.isFinite(jsd)).toBe(true);
    expect(jsd).toBeGreaterThan(0);
  });

  it("throws on negative weights", () => {
    expect(() => jensenShannonDivergence({ a: -1 }, { a: 1 })).toThrow(
      /non-negative/,
    );
  });

  it("throws on zero total mass", () => {
    expect(() => jensenShannonDivergence({ a: 0 }, { a: 1 })).toThrow(
      /sum must be > 0/,
    );
  });

  it("symmetricKL is an alias for jensenShannonDivergence (back-compat)", () => {
    expect(symmetricKL).toBe(jensenShannonDivergence);
  });
});

describe("composeNoiseDivergence", () => {
  it("emits no divergence receipt when JSD is under tolerance", () => {
    const w = composeNoiseDivergence({
      learned: { weights: { a: 1, b: 1 }, timestampMs: 1 },
      declared: { weights: { a: 1, b: 1 }, timestampMs: 0 },
      tolerance: 0.05,
    });
    expect(w.aligned).toBe(true);
    expect(w.divergenceRef).toBeNull();
    expect(w.jsd).toBeCloseTo(0, 10);
    expect(w.klSym).toBe(w.jsd); // back-compat alias preserved
  });

  it("emits a divergence receipt when JSD exceeds tolerance", () => {
    const w = composeNoiseDivergence({
      learned: { weights: { a: 100, b: 1 }, timestampMs: 1 },
      declared: { weights: { a: 1, b: 100 }, timestampMs: 0 },
      tolerance: 0.05,
    });
    expect(w.aligned).toBe(false);
    expect(w.divergenceRef?.startsWith("ising.noise.divergence.v1:")).toBe(
      true,
    );
    expect(w.jsd).toBeGreaterThan(0.05);
  });
});

describe("assertNoiseModelAligned", () => {
  it("returns the witness on the green path", () => {
    const w = assertNoiseModelAligned(
      { weights: { a: 1, b: 1 }, timestampMs: 1 },
      { weights: { a: 1, b: 1 }, timestampMs: 0 },
      0.01,
    );
    expect(w.aligned).toBe(true);
  });

  it("throws when divergence exceeds tolerance", () => {
    expect(() =>
      assertNoiseModelAligned(
        { weights: { a: 100, b: 1 }, timestampMs: 1 },
        { weights: { a: 1, b: 100 }, timestampMs: 0 },
        0.05,
      ),
    ).toThrow(/refusing to act on declared noise model/);
  });
});

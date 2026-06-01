import { describe, expect, it } from "vitest";
import {
  PageCurveTracker,
  empiricalDistribution,
  mutualInformationBits,
  pageReferenceCurveBits,
  shannonEntropyBits,
} from "../src/page-curve.js";
import { asLoopId } from "../src/types.js";

describe("shannonEntropyBits", () => {
  it("returns 0 for a deterministic distribution", () => {
    expect(shannonEntropyBits([1])).toBe(0);
    expect(shannonEntropyBits([1, 0, 0, 0])).toBe(0);
  });

  it("returns 1 bit for fair coin", () => {
    expect(shannonEntropyBits([0.5, 0.5])).toBeCloseTo(1, 10);
  });

  it("returns log2(n) bits for uniform on n outcomes", () => {
    expect(shannonEntropyBits([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(2, 10);
  });

  it("treats zero-probability events as zero contribution", () => {
    expect(shannonEntropyBits([0, 0, 1])).toBe(0);
    expect(shannonEntropyBits([0.5, 0.5, 0])).toBeCloseTo(1, 10);
  });
});

describe("empiricalDistribution", () => {
  it("returns empty map on empty input", () => {
    expect(empiricalDistribution([]).size).toBe(0);
  });

  it("normalizes counts to probabilities summing to 1", () => {
    const d = empiricalDistribution(["a", "b", "a", "c", "a"]);
    expect(d.get("a")).toBeCloseTo(3 / 5, 10);
    expect(d.get("b")).toBeCloseTo(1 / 5, 10);
    expect(d.get("c")).toBeCloseTo(1 / 5, 10);
    let sum = 0;
    for (const v of d.values()) sum += v;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("mutualInformationBits", () => {
  it("returns 0 for independent streams", () => {
    const a = ["x", "x", "x", "x"];
    const b = ["y", "y", "y", "y"];
    expect(mutualInformationBits(a, b)).toBeCloseTo(0, 10);
  });

  it("returns H(L) bits for perfectly correlated streams", () => {
    const a = ["a", "b", "a", "b", "a", "b"];
    const b = ["1", "2", "1", "2", "1", "2"];
    // Both have H = 1 bit; perfectly correlated → I = 1 bit.
    expect(mutualInformationBits(a, b)).toBeCloseTo(1, 10);
  });

  it("throws on length mismatch", () => {
    expect(() => mutualInformationBits(["a"], ["a", "b"])).toThrow(
      /length mismatch/,
    );
  });

  it("clamps tiny negative numerical errors to 0", () => {
    const a = Array.from({ length: 100 }, () => "x");
    const b = Array.from({ length: 100 }, () => "y");
    expect(mutualInformationBits(a, b)).toBeGreaterThanOrEqual(0);
  });
});

describe("pageReferenceCurveBits", () => {
  it("is symmetric S(k) = S(D - k)", () => {
    const D = 64;
    for (const k of [4, 8, 16, 32]) {
      expect(pageReferenceCurveBits(k, D)).toBeCloseTo(
        pageReferenceCurveBits(D - k, D),
        9,
      );
    }
  });

  it("is small at the endpoints (k → 0 and k → D)", () => {
    const D = 1024;
    // In the small-k regime the formula log2(k) − k²/(2D ln 2) is increasing.
    // Endpoints near 0 and near D should give small entropy.
    const tiny = pageReferenceCurveBits(2, D);
    const moderate = pageReferenceCurveBits(16, D);
    expect(tiny).toBeLessThan(moderate);
    // Symmetry: large k mirrors small k.
    expect(pageReferenceCurveBits(D - 2, D)).toBeCloseTo(
      pageReferenceCurveBits(2, D),
      9,
    );
  });

  it("returns 0 for invalid input", () => {
    expect(pageReferenceCurveBits(0, 10)).toBe(0);
    expect(pageReferenceCurveBits(11, 10)).toBe(0);
    expect(pageReferenceCurveBits(-1, 10)).toBe(0);
  });
});

describe("PageCurveTracker — clean close", () => {
  it("rises, peaks, and falls to ~0 for a simulated bounded loop", () => {
    const t = new PageCurveTracker(asLoopId("test:loop:1"), {
      epsilon: 0.1,
    });
    // Phase 1: ticks 1..32 — loop and env states are coupled (high MI)
    for (let i = 1; i <= 32; i++) {
      const s = i % 2 === 0 ? "even" : "odd";
      t.observe(i, s, s);
    }
    // Phase 2: ticks 33..96 — loop converges to a single canonical "closed"
    // state; environment also goes constant (decoupling, MI -> 0)
    for (let i = 33; i <= 96; i++) {
      t.observe(i, "closed", "void");
    }
    const r = t.close();
    expect(r.series.length).toBe(96);
    expect(r.pageTick).not.toBeNull();
    expect(r.pageEntropy).toBeGreaterThan(0);
    expect(r.residualEntropy).toBeLessThanOrEqual(r.epsilon);
    expect(r.clean).toBe(true);
  });

  it("flags dirty close when residual entropy stays high", () => {
    const t = new PageCurveTracker(asLoopId("test:loop:dirty"), {
      epsilon: 0.05,
    });
    // Maintained correlation throughout — loop never converges
    for (let i = 1; i <= 80; i++) {
      const s = i % 2 === 0 ? "a" : "b";
      t.observe(i, s, s);
    }
    const r = t.close();
    expect(r.residualEntropy).toBeGreaterThan(r.epsilon);
    expect(r.clean).toBe(false);
  });

  it("returns an empty result for a tracker with no observations", () => {
    const t = new PageCurveTracker(asLoopId("test:empty"));
    const r = t.close();
    expect(r.clean).toBe(false);
    expect(r.series).toEqual([]);
    expect(r.pageTick).toBeNull();
  });

  it("current() reflects the most recent entropy reading", () => {
    const t = new PageCurveTracker(asLoopId("test:current"));
    expect(t.current()).toBe(0);
    t.observe(1, "x", "y");
    t.observe(2, "x", "y");
    expect(t.current()).toBeGreaterThanOrEqual(0);
  });
});

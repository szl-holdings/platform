import { describe, it, expect } from "vitest";
import { dualUseReview } from "../src/dual-use-review.js";

describe("Primitive 27 — Dual-use review (Bohr test)", () => {
  it("OPEN_PUBLISH for high benefit + reproducibility, low harm", () => {
    const r = dualUseReview({
      artifactId: "open-source-runtime",
      benignBenefit: 0.9,
      harmPotential: 0.1,
      reproducibility: 0.9,
      verifiability: 0.9,
    });
    expect(r.verdict).toBe("OPEN_PUBLISH");
    expect(r.bohrScore).toBeGreaterThanOrEqual(0.4);
  });

  it("PUBLISH_GUARDED for mixed signals", () => {
    const r = dualUseReview({
      artifactId: "x",
      benignBenefit: 0.6,
      harmPotential: 0.4,
      reproducibility: 0.6,
      verifiability: 0.6,
    });
    expect(r.verdict).toBe("PUBLISH_GUARDED");
  });

  it("HOLD for negative bohr but not severe", () => {
    const r = dualUseReview({
      artifactId: "x",
      benignBenefit: 0.3,
      harmPotential: 0.6,
      reproducibility: 0.4,
      verifiability: 0.4,
    });
    expect(r.verdict).toBe("HOLD");
  });

  it("SUPPRESS for severe harm dominance", () => {
    const r = dualUseReview({
      artifactId: "x",
      benignBenefit: 0.1,
      harmPotential: 0.95,
      reproducibility: 0.05,
      verifiability: 0.1,
    });
    expect(r.verdict).toBe("SUPPRESS");
  });

  it("rejects out-of-range scores", () => {
    expect(() =>
      dualUseReview({
        artifactId: "x",
        benignBenefit: 2,
        harmPotential: 0.1,
        reproducibility: 0.5,
        verifiability: 0.5,
      }),
    ).toThrow();
  });

  it("includes bohrScore and rationale", () => {
    const r = dualUseReview({
      artifactId: "x",
      benignBenefit: 0.8,
      harmPotential: 0.1,
      reproducibility: 0.8,
      verifiability: 0.8,
    });
    expect(typeof r.bohrScore).toBe("number");
    expect(r.rationale.length).toBeGreaterThan(0);
  });
});

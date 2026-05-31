/** pac-bayes.ts — McAllester (2003) PAC-Bayes tail bound primitive. */
import { describe, it, expect } from "vitest";
import { pacBayesTailBound, klDivergence } from "./pac-bayes.ts";

describe("pacBayesTailBound (McAllester 2003)", () => {
  it("known-good: posterior=prior ⇒ KL=0, tail = sqrt(ln(2√n/δ)/2n)", () => {
    const prior = [0.5, 0.5];
    const posterior = [0.5, 0.5];
    const n = 1000;
    const delta = 0.05;
    const got = pacBayesTailBound(prior, posterior, n, delta);
    // KL = 0, so bound = sqrt( ln(2*sqrt(1000)/0.05) / 2000 ).
    const expected = Math.sqrt(Math.log((2 * Math.sqrt(n)) / delta) / (2 * n));
    expect(Math.abs(got - expected)).toBeLessThan(1e-12);
    // Tail shrinks toward 0 as n grows (concentration).
    const larger = pacBayesTailBound(prior, posterior, 100_000, delta);
    expect(larger).toBeLessThan(got);
  });

  it("known-bad: q has zero mass where p is positive ⇒ KL = ∞, must throw", () => {
    expect(() => klDivergence([0.5, 0.5], [1, 0])).toThrow(/zero mass/);
    // and invalid delta is rejected
    expect(() => pacBayesTailBound([1], [1], 100, 0)).toThrow(/delta/);
  });
});

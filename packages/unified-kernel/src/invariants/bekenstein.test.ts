/** bekenstein.ts — Bekenstein (1981) information-density cap primitive. */
import { describe, it, expect } from "vitest";
import { bekensteinCap, withinBekensteinCap, HBAR_J_S, C_M_S } from "./bekenstein.ts";

describe("bekensteinCap (Bekenstein 1981)", () => {
  it("known-good: matches the closed form I = 2πRE/(ħc ln2) and admits a small receipt", () => {
    // 1 joule in a 1-metre-radius region.
    const got = bekensteinCap(1, 1);
    const expected = (2 * Math.PI * 1 * 1) / (HBAR_J_S * C_M_S * Math.log(2));
    expect(Math.abs(got - expected) / expected).toBeLessThan(1e-12);
    // The cap is astronomically large (~2.87e26 bits), so a 1 KB receipt fits.
    expect(got).toBeGreaterThan(1e26);
    expect(withinBekensteinCap(8192, 1, 1)).toBe(true);
  });

  it("known-bad: non-physical inputs throw; a receipt over its cap is rejected", () => {
    expect(() => bekensteinCap(0, 1)).toThrow(/energyJ/);
    expect(() => bekensteinCap(1, -1)).toThrow(/radiusM/);
    // A region with tiny energy/radius caps at a few bits — an over-large
    // receipt is rejected. Tune E,R so cap < 10 bits.
    const tinyE = 1e-42;
    const tinyR = 1e-2;
    const cap = bekensteinCap(tinyE, tinyR);
    expect(cap).toBeLessThan(10);
    expect(withinBekensteinCap(cap + 1, tinyE, tinyR)).toBe(false);
  });
});

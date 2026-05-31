/** reidemeister.ts — Reidemeister (1927) equivalence-class primitive. */
import { describe, it, expect } from "vitest";
import { reidemeisterClass } from "./reidemeister.ts";

describe("reidemeisterClass (Reidemeister 1927)", () => {
  it("known-good: strand count maps to R1 / R2 / R3 per the 1927 numbering", () => {
    // 1 strand (self-crossing twist) → R1.
    expect(reidemeisterClass([{ over: "rA", under: "rA" }])).toBe("R1");
    // 2 strands (poke) → R2.
    expect(
      reidemeisterClass([
        { over: "rA", under: "rB" },
        { over: "rB", under: "rA" },
      ]),
    ).toBe("R2");
    // 3 strands (slide over crossing) → R3.
    expect(
      reidemeisterClass([
        { over: "rA", under: "rB" },
        { over: "rB", under: "rC" },
        { over: "rA", under: "rC" },
      ]),
    ).toBe("R3");
  });

  it("known-bad: empty chain has no local region and must throw", () => {
    expect(() => reidemeisterClass([])).toThrow(/empty/);
  });
});

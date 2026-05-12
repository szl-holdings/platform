import { describe, it, expect } from "vitest";
import { sunecheiaGate } from "../src/sunecheia-whole-priority-gate.js";

describe("sunecheia-whole-priority-gate (87)", () => {
  it("passes a continuous magnitude with potential parts", () => {
    const r = sunecheiaGate({
      magnitudeId: "line-AB",
      constituents: [{ id: "AC", indivisible: false }, { id: "CB", indivisible: false }],
      partsActuallyPriorToWhole: false,
      builtBySum: false,
    });
    expect(r.ok).toBe(true);
  });

  it("blocks line built from points", () => {
    const r = sunecheiaGate({
      magnitudeId: "line",
      constituents: [
        { id: "p1", indivisible: true },
        { id: "p2", indivisible: true },
      ],
      partsActuallyPriorToWhole: false,
      builtBySum: true,
    });
    expect(r.ok).toBe(false);
    expect(r.violation).toBe("punctualism");
  });

  it("blocks atomistic decomposition (all indivisible)", () => {
    const r = sunecheiaGate({
      magnitudeId: "M",
      constituents: [{ id: "a1", indivisible: true }, { id: "a2", indivisible: true }],
      partsActuallyPriorToWhole: false,
      builtBySum: false,
    });
    expect(r.ok).toBe(false);
    expect(r.violation).toBe("atomism");
  });

  it("blocks parts-prior-to-whole assertion", () => {
    const r = sunecheiaGate({
      magnitudeId: "M",
      constituents: [{ id: "x", indivisible: false }],
      partsActuallyPriorToWhole: true,
      builtBySum: false,
    });
    expect(r.ok).toBe(false);
    expect(r.violation).toBe("actual-prior-parts");
  });

  it("empty constituents pass (whole undivided)", () => {
    const r = sunecheiaGate({
      magnitudeId: "M",
      constituents: [],
      partsActuallyPriorToWhole: false,
      builtBySum: false,
    });
    expect(r.ok).toBe(true);
  });

  it("mixed divisibility + builtBySum still blocks if any indivisible", () => {
    const r = sunecheiaGate({
      magnitudeId: "M",
      constituents: [
        { id: "p", indivisible: true },
        { id: "seg", indivisible: false },
      ],
      partsActuallyPriorToWhole: false,
      builtBySum: true,
    });
    expect(r.ok).toBe(false);
    expect(r.violation).toBe("punctualism");
  });

  it("Physics VI.1 reference in reason", () => {
    const r = sunecheiaGate({
      magnitudeId: "line",
      constituents: [{ id: "p", indivisible: true }],
      partsActuallyPriorToWhole: false,
      builtBySum: true,
    });
    expect(r.reason).toMatch(/Physics|indivisible/);
  });

  it("time-interval composed of nows blocked", () => {
    const r = sunecheiaGate({
      magnitudeId: "T",
      constituents: [
        { id: "now1", indivisible: true },
        { id: "now2", indivisible: true },
      ],
      partsActuallyPriorToWhole: false,
      builtBySum: true,
    });
    expect(r.ok).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { checkDualFrame } from "../src/vitruvian-frame.js";

describe("Primitive 57 — Vitruvian dual-frame check", () => {
  it("frame-invariant when both admit", () => {
    const r = checkDualFrame([
      { frameId: "circle", admits: true, rationale: "x" },
      { frameId: "square", admits: true, rationale: "x" },
    ]);
    expect(r.bothAdmit).toBe(true);
    expect(r.frameDependent).toBe(false);
  });

  it("frame-dependent when only one admits", () => {
    const r = checkDualFrame([
      { frameId: "circle", admits: true, rationale: "x" },
      { frameId: "square", admits: false, rationale: "y" },
    ]);
    expect(r.frameDependent).toBe(true);
  });

  it("rejected by every frame when none admit", () => {
    const r = checkDualFrame([
      { frameId: "circle", admits: false, rationale: "x" },
      { frameId: "square", admits: false, rationale: "y" },
    ]);
    expect(r.bothAdmit).toBe(false);
    expect(r.frameDependent).toBe(false);
    expect(r.rationale).toContain("rejected");
  });

  it("requires ≥ 2 frames", () => {
    expect(() =>
      checkDualFrame([{ frameId: "circle", admits: true, rationale: "x" }]),
    ).toThrow();
  });

  it("requires distinct frame ids", () => {
    expect(() =>
      checkDualFrame([
        { frameId: "circle", admits: true, rationale: "x" },
        { frameId: "circle", admits: true, rationale: "y" },
      ]),
    ).toThrow();
  });
});

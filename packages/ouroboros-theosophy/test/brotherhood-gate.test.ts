import { describe, it, expect } from "vitest";
import { auditBrotherhood } from "../src/brotherhood-gate.js";

describe("Primitive 49 — Universal-brotherhood gate", () => {
  it("passes when decisions agree across protected attrs", () => {
    const r = auditBrotherhood([
      { protectedAttrs: { creed: "X" }, nonProtectedKey: "case-1", decision: "allow" },
      { protectedAttrs: { creed: "Y" }, nonProtectedKey: "case-1", decision: "allow" },
    ]);
    expect(r.passes).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("flags violation when decisions diverge for same non-protected key", () => {
    const r = auditBrotherhood([
      { protectedAttrs: { creed: "X" }, nonProtectedKey: "case-1", decision: "allow" },
      { protectedAttrs: { creed: "Y" }, nonProtectedKey: "case-1", decision: "deny" },
    ]);
    expect(r.passes).toBe(false);
    expect(r.violations.length).toBe(1);
  });

  it("groups by nonProtectedKey", () => {
    const r = auditBrotherhood([
      { protectedAttrs: {}, nonProtectedKey: "k1", decision: 1 },
      { protectedAttrs: {}, nonProtectedKey: "k2", decision: 2 },
    ]);
    expect(Object.keys(r.groupedByNonProtected).sort()).toEqual(["k1", "k2"]);
  });

  it("empty input passes vacuously", () => {
    const r = auditBrotherhood<string>([]);
    expect(r.passes).toBe(true);
  });

  it("multiple matching decisions in one group still pass", () => {
    const r = auditBrotherhood([
      { protectedAttrs: {}, nonProtectedKey: "k", decision: "x" },
      { protectedAttrs: {}, nonProtectedKey: "k", decision: "x" },
      { protectedAttrs: {}, nonProtectedKey: "k", decision: "x" },
    ]);
    expect(r.passes).toBe(true);
  });
});

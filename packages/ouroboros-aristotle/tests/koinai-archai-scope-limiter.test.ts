import { describe, it, expect } from "vitest";
import { koinaiArchaiScopeLimiter } from "../src/koinai-archai-scope-limiter.js";

describe("koinai-archai-scope-limiter (89)", () => {
  it("common axiom applied analogically passes", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "equals-from-equals",
      declaredKind: "common",
      applicationGenus: "geometry",
      assertedClaim: "equal magnitudes minus equal magnitudes are equal",
      treatedAsProperOfApplicationGenus: false,
    });
    expect(r.ok).toBe(true);
  });

  it("common axiom misused as proper — blocked", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "equals-from-equals",
      declaredKind: "common",
      applicationGenus: "geometry",
      assertedClaim: "x",
      treatedAsProperOfApplicationGenus: true,
    });
    expect(r.ok).toBe(false);
    expect(r.warning).toBe("treated-common-as-proper");
  });

  it("proper axiom in its home genus passes", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "between-two-points-one-line",
      declaredKind: "proper",
      homeGenus: "geometry",
      applicationGenus: "geometry",
      assertedClaim: "x",
      treatedAsProperOfApplicationGenus: true,
    });
    expect(r.ok).toBe(true);
  });

  it("proper axiom outside home genus blocked", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "geometric-postulate",
      declaredKind: "proper",
      homeGenus: "geometry",
      applicationGenus: "arithmetic",
      assertedClaim: "x",
      treatedAsProperOfApplicationGenus: true,
    });
    expect(r.ok).toBe(false);
    expect(r.warning).toBe("wrong-genus");
  });

  it("proper axiom missing homeGenus blocked", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "x",
      declaredKind: "proper",
      applicationGenus: "g",
      assertedClaim: "x",
      treatedAsProperOfApplicationGenus: true,
    });
    expect(r.ok).toBe(false);
  });

  it("excluded middle as common axiom in arithmetic", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "excluded-middle",
      declaredKind: "common",
      applicationGenus: "arithmetic",
      assertedClaim: "either p or not-p",
      treatedAsProperOfApplicationGenus: false,
    });
    expect(r.ok).toBe(true);
  });

  it("CN3 (equals subtracted from equals) instantiated to magnitudes", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "CN3",
      declaredKind: "common",
      applicationGenus: "geometry",
      assertedClaim: "instantiated to magnitudes",
      treatedAsProperOfApplicationGenus: false,
    });
    expect(r.ok).toBe(true);
  });

  it("warning text includes diagnostic", () => {
    const r = koinaiArchaiScopeLimiter({
      axiomId: "x",
      declaredKind: "common",
      applicationGenus: "g",
      assertedClaim: "y",
      treatedAsProperOfApplicationGenus: true,
    });
    expect(r.reason).toMatch(/proper|misused/);
  });
});

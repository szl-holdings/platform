import { describe, it, expect } from "vitest";
import { quaRealismGate, trivialTrueVerifier, trivialFalseVerifier } from "../src/qua-realism-gate.js";

describe("qua-realism gate", () => {
  it("rejects empty subjectId", () => {
    const r = quaRealismGate({ subjectId: "", qua: "volume", evidence: ["x"] }, trivialTrueVerifier);
    expect(r.ok).toBe(false);
  });

  it("rejects empty qua", () => {
    const r = quaRealismGate({ subjectId: "bronze", qua: "", evidence: ["x"] }, trivialTrueVerifier);
    expect(r.ok).toBe(false);
  });

  it("rejects no-evidence claim", () => {
    const r = quaRealismGate({ subjectId: "bronze", qua: "volume", evidence: [] }, trivialTrueVerifier);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/no evidence/);
  });

  it("passes when verifier confirms", () => {
    const r = quaRealismGate({ subjectId: "bronze", qua: "volume", evidence: ["measurement"] }, trivialTrueVerifier);
    expect(r.ok).toBe(true);
  });

  it("fails when verifier denies", () => {
    const r = quaRealismGate({ subjectId: "fiction", qua: "truth", evidence: ["narrative"] }, trivialFalseVerifier);
    expect(r.ok).toBe(false);
  });

  it("uses verifier's reason text", () => {
    const r = quaRealismGate({ subjectId: "fiction", qua: "truth", evidence: ["x"] }, trivialFalseVerifier);
    expect(r.reason).toContain("fiction");
    expect(r.reason).toContain("truth");
  });

  it("allows custom verifier logic", () => {
    const verifier = (s: string, q: string) => ({ ok: q === "extension", reason: q });
    const r = quaRealismGate({ subjectId: "x", qua: "extension", evidence: ["m"] }, verifier);
    expect(r.ok).toBe(true);
  });

  it("custom verifier rejects wrong qua", () => {
    const verifier = (_s: string, q: string) => ({ ok: q === "extension", reason: q });
    const r = quaRealismGate({ subjectId: "x", qua: "color", evidence: ["m"] }, verifier);
    expect(r.ok).toBe(false);
  });
});

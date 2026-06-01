import { describe, it, expect } from "vitest";
import { Mint } from "../src/mint-forensics.js";
import { createHash } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const pyx = (s: string) => createHash("sha256").update("pyx::" + s).digest("hex");

describe("Primitive 44 — Mint forensics", () => {
  it("issues and assays a genuine artifact", () => {
    const m = new Mint();
    m.issue("a1", "hello", 5, 1);
    const r = m.assay({
      artifactId: "a1",
      presentedDigestSha256: sha("hello"),
      presentedWeight: 5,
      presentedPyxSample: pyx("hello"),
    });
    expect(r.verdict).toBe("GENUINE");
  });

  it("DIGEST_MISMATCH on tampered content", () => {
    const m = new Mint();
    m.issue("a1", "hello", 5, 1);
    const r = m.assay({
      artifactId: "a1",
      presentedDigestSha256: sha("tampered"),
      presentedWeight: 5,
    });
    expect(r.verdict).toBe("DIGEST_MISMATCH");
  });

  it("WEIGHT_MISMATCH on clipped weight", () => {
    const m = new Mint();
    m.issue("a1", "hello", 5, 1);
    const r = m.assay({
      artifactId: "a1",
      presentedDigestSha256: sha("hello"),
      presentedWeight: 4,
    });
    expect(r.verdict).toBe("WEIGHT_MISMATCH");
  });

  it("PYX_MISMATCH on counterfeit pyx", () => {
    const m = new Mint();
    m.issue("a1", "hello", 5, 1);
    const r = m.assay({
      artifactId: "a1",
      presentedDigestSha256: sha("hello"),
      presentedWeight: 5,
      presentedPyxSample: "not the pyx",
    });
    expect(r.verdict).toBe("PYX_MISMATCH");
  });

  it("NOT_FOUND on unknown id", () => {
    const m = new Mint();
    const r = m.assay({
      artifactId: "missing",
      presentedDigestSha256: "x",
      presentedWeight: 0,
    });
    expect(r.verdict).toBe("NOT_FOUND");
  });

  it("rejects double-issue", () => {
    const m = new Mint();
    m.issue("a1", "hello", 5, 1);
    expect(() => m.issue("a1", "hello", 5, 2)).toThrow();
  });

  it("rejects negative declaredWeight", () => {
    const m = new Mint();
    expect(() => m.issue("a1", "hello", -1, 1)).toThrow();
  });

  it("respects weightTolerance", () => {
    const m = new Mint(0.5);
    m.issue("a1", "hello", 5, 1);
    const r = m.assay({
      artifactId: "a1",
      presentedDigestSha256: sha("hello"),
      presentedWeight: 5.4,
    });
    expect(r.verdict).toBe("GENUINE");
  });
});

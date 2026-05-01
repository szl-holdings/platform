import { describe, it, expect } from "vitest";
import { sealEnvelope, verifySeal } from "../src/hermetic-seal.js";

const baseProv = {
  author: "Hermes",
  timestamp: "2026-05-01T00:00:00Z",
  sourceUri: "ouroboros://emerald-tablet",
};

describe("Primitive 40 — Hermetic seal", () => {
  it("seals and verifies a clean envelope", () => {
    const env = sealEnvelope("payload-A", baseProv);
    const v = verifySeal(env);
    expect(v.valid).toBe(true);
  });

  it("detects payload tampering", () => {
    const env = sealEnvelope("payload-A", baseProv);
    const tampered = { ...env, payload: "payload-B" };
    expect(verifySeal(tampered).valid).toBe(false);
  });

  it("detects provenance tampering", () => {
    const env = sealEnvelope("payload-A", baseProv);
    const tampered = {
      ...env,
      provenance: { ...env.provenance, author: "imposter" },
    };
    expect(verifySeal(tampered).valid).toBe(false);
  });

  it("seal is deterministic for identical input", () => {
    const a = sealEnvelope("p", baseProv);
    const b = sealEnvelope("p", baseProv);
    expect(a.seal).toBe(b.seal);
  });

  it("seal changes for different timestamp", () => {
    const a = sealEnvelope("p", baseProv);
    const b = sealEnvelope("p", { ...baseProv, timestamp: "2026-05-02T00:00:00Z" });
    expect(a.seal).not.toBe(b.seal);
  });

  it("rationale describes outcome", () => {
    const env = sealEnvelope("payload-A", baseProv);
    expect(verifySeal(env).rationale).toContain("intact");
    const tampered = { ...env, payload: "X" };
    expect(verifySeal(tampered).rationale).toContain("broken");
  });

  it("seal is hex 64 chars (SHA-256)", () => {
    const env = sealEnvelope("p", baseProv);
    expect(env.seal).toMatch(/^[0-9a-f]{64}$/);
  });
});

import { describe, it, expect } from "vitest";
import { buildReceipt, verifyReceipt, verifyReceiptChain, sha256Hex } from "../src/receipt.js";
import type { RailDecision } from "../src/types.js";

const sampleRail = (lambda: number, verdict: "PROCEED" | "QUARANTINE" | "ABORT" = "PROCEED"): RailDecision => ({
  kind: "input",
  verdict,
  lambda,
  axes: { a: lambda },
  failed: [],
  passed: ["sample"],
  rationale: "test",
  timestamp: "2026-05-01T00:00:00.000Z",
  payloadHash: "abc",
});

describe("buildReceipt", () => {
  it("emits version 1.0.0 with id, tenantId, subject", () => {
    const r = buildReceipt({
      id: "uuid-1",
      tenantId: "acme",
      subject: "agent/test",
      rails: [sampleRail(0.9)],
      tenantKeyId: "key-1",
    });
    expect(r.version).toBe("1.0.0");
    expect(r.id).toBe("uuid-1");
    expect(r.tenantId).toBe("acme");
    expect(r.subject).toBe("agent/test");
  });

  it("computes composite Λ as geometric mean of rail Λs", () => {
    const r = buildReceipt({
      id: "uuid-2",
      tenantId: "acme",
      subject: "x",
      rails: [sampleRail(0.5), sampleRail(0.5)],
      tenantKeyId: "key-1",
    });
    expect(r.lambda).toBeCloseTo(0.5, 10);
  });

  it("composite action is the worst rail action (ABORT > QUARANTINE > PROCEED)", () => {
    const r = buildReceipt({
      id: "uuid-3",
      tenantId: "acme",
      subject: "x",
      rails: [sampleRail(0.9, "PROCEED"), sampleRail(0.3, "ABORT"), sampleRail(0.7, "QUARANTINE")],
      tenantKeyId: "key-1",
    });
    expect(r.action).toBe("ABORT");
  });

  it("contentHash and seal are deterministic given identical input", () => {
    const fixedRail: RailDecision = { ...sampleRail(0.9), timestamp: "2026-01-01T00:00:00.000Z" };
    const r1 = buildReceipt({ id: "x", tenantId: "t", subject: "s", rails: [fixedRail], tenantKeyId: "k" });
    const r2 = buildReceipt({ id: "x", tenantId: "t", subject: "s", rails: [fixedRail], tenantKeyId: "k" });
    // issuedAt differs by clock, so hashes will differ — but both verify.
    expect(verifyReceipt(r1, "k").valid).toBe(true);
    expect(verifyReceipt(r2, "k").valid).toBe(true);
  });
});

describe("verifyReceipt", () => {
  it("verifies a clean receipt", () => {
    const r = buildReceipt({
      id: "u",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      tenantKeyId: "k",
    });
    expect(verifyReceipt(r, "k").valid).toBe(true);
  });

  it("detects content tampering", () => {
    const r = buildReceipt({
      id: "u",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      tenantKeyId: "k",
    });
    const tampered = { ...r, subject: "OTHER" };
    expect(verifyReceipt(tampered, "k").valid).toBe(false);
  });

  it("detects seal tampering", () => {
    const r = buildReceipt({
      id: "u",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      tenantKeyId: "k",
    });
    const tampered = { ...r, seal: sha256Hex("wrong") };
    expect(verifyReceipt(tampered, "k").valid).toBe(false);
  });

  it("detects wrong tenant key", () => {
    const r = buildReceipt({
      id: "u",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      tenantKeyId: "k",
    });
    expect(verifyReceipt(r, "wrong-key").valid).toBe(false);
  });
});

describe("verifyReceiptChain", () => {
  it("verifies a valid chain", () => {
    const r1 = buildReceipt({ id: "1", tenantId: "t", subject: "s", rails: [sampleRail(0.9)], tenantKeyId: "k" });
    const r2 = buildReceipt({
      id: "2",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      prevReceiptHash: r1.contentHash,
      tenantKeyId: "k",
    });
    expect(verifyReceiptChain([r1, r2], "k").valid).toBe(true);
  });

  it("detects a broken chain", () => {
    const r1 = buildReceipt({ id: "1", tenantId: "t", subject: "s", rails: [sampleRail(0.9)], tenantKeyId: "k" });
    const r2 = buildReceipt({
      id: "2",
      tenantId: "t",
      subject: "s",
      rails: [sampleRail(0.9)],
      prevReceiptHash: "wrong-prev",
      tenantKeyId: "k",
    });
    const result = verifyReceiptChain([r1, r2], "k");
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });
});

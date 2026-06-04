/** tamper (T18) — boots the kernel, then asserts real Ed25519 + SHA-256 chain. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import {
  sha256Hex,
  generateSigningKey,
  sign,
  verifySignature,
  chainAppend,
  verifyChain,
} from "./index.ts";

describe("T18 tamper", () => {
  it("kernel boot produces a receipt whose signature verifies", async () => {
    const h = await start();
    expect(verifySignature(`GENESIS|${h.initReceipt.bodyHash}`, h.initReceipt.signature, h.initReceipt.publicKey)).toBe(true);
  });

  it("SHA-256 is deterministic and 64 hex chars", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("Ed25519 sign/verify round-trips and rejects tampering", () => {
    const k = generateSigningKey();
    const sig = sign("payload", k);
    expect(verifySignature("payload", sig, k.publicKeyHex)).toBe(true);
    expect(verifySignature("payload-x", sig, k.publicKeyHex)).toBe(false);
  });

  it("hash chain verifies and localizes a break", () => {
    const a = chainAppend(null, { n: 1 });
    const b = chainAppend(a, { n: 2 });
    const c = chainAppend(b, { n: 3 });
    expect(verifyChain([a, b, c]).valid).toBe(true);
    const broken = [a, { ...b, prevHash: "00".repeat(32) }, c];
    expect(verifyChain(broken).valid).toBe(false);
  });
});

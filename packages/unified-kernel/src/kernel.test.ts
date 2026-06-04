/**
 * kernel.test.ts — full-kernel integration test. Boots the REAL kernel and
 * asserts the end-to-end contract: every check ran, the signed receipt verifies,
 * the chain head is signed, and the registry covers all 19 theses.
 */
import { describe, it, expect } from "vitest";
import { start, verifyInitReceipt } from "./kernel.ts";
import type { ThesisId } from "./types.ts";

describe("unified-kernel integration", () => {
  it("boots to PASS with all core checks passing", async () => {
    const h = await start();
    expect(h.status).toBe("PASS");
    expect(h.initReceipt.checks.length).toBe(7);
    expect(h.initReceipt.checks.every((c) => c.pass)).toBe(true);
  });

  it("emits an Ed25519-signed receipt that re-verifies", async () => {
    const h = await start();
    expect(h.initReceipt.sigAlg).toBe("ed25519");
    expect(h.initReceipt.signature.length).toBeGreaterThan(0);
    expect(verifyInitReceipt(h.initReceipt)).toBe(true);
  });

  it("detects a tampered receipt (signature no longer verifies)", async () => {
    const h = await start();
    const tampered = { ...h.initReceipt, bodyHash: "00".repeat(32) };
    expect(verifyInitReceipt(tampered)).toBe(false);
  });

  it("chains the receipt off a supplied prevHash", async () => {
    const h = await start({ prevHash: "ab".repeat(32) });
    expect(h.initReceipt.prevHash).toBe("ab".repeat(32));
    expect(verifyInitReceipt(h.initReceipt)).toBe(true);
  });

  it("registers all 19 theses", async () => {
    const h = await start();
    const ids: ThesisId[] = [
      "T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10",
      "T11", "T12", "T13", "T14", "T15", "T16", "T17", "T18", "T19",
    ];
    for (const id of ids) {
      expect(h.modules[id]).toBeDefined();
      expect(h.modules[id].descriptor.thesis).toBe(id);
    }
  });

  it("flags banned tokens in the environment (real fail-closed)", async () => {
    const h = await start({ env: { DEMO: "this is game-changing" } });
    const scan = h.initReceipt.checks.find((c) => c.name === "banned-token-scan");
    expect(scan?.pass).toBe(false);
    expect(scan?.detail).toContain("game-changing");
    // A banned-token hit is a doctrine (T11) core failure => kernel FAIL.
    expect(h.status).toBe("FAIL");
  });
});

/** doctrine (T11) — boots the kernel, then asserts real banned-token + cross-invariant. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { bannedTokenScan, scanEnv, doctrineCrossInvariant } from "./index.ts";

describe("T11 doctrine", () => {
  it("kernel boot runs both doctrine checks and they pass on a clean env", async () => {
    const h = await start({ env: {} });
    const scan = h.initReceipt.checks.find((c) => c.name === "banned-token-scan");
    const xinv = h.initReceipt.checks.find((c) => c.name === "doctrine-cross-invariant");
    expect(scan?.pass).toBe(true);
    expect(xinv?.pass).toBe(true);
  });

  it("flags marketing and product banned tokens", () => {
    expect(bannedTokenScan("a game-changing leap").map((h) => h.token)).toContain("game-changing");
    expect(bannedTokenScan("powered by Jarvis").map((h) => h.token)).toContain("Jarvis");
  });

  it("does not false-positive on clean text", () => {
    expect(bannedTokenScan("a bounded, signed, verifiable kernel")).toEqual([]);
  });

  it("scans env values for banned tokens", () => {
    expect(scanEnv({ X: "world-class" }).length).toBeGreaterThan(0);
  });

  it("cross-invariant is a real conjunction (fail-closed)", () => {
    expect(doctrineCrossInvariant({ huklla: true, overwatch: true, dpi: true }).admissible).toBe(true);
    expect(doctrineCrossInvariant({ huklla: false, overwatch: true, dpi: true }).admissible).toBe(false);
  });
});

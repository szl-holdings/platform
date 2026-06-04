/** invariants (T01) — boots the kernel, then asserts real Λ math. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { lambda, boundCheck, satisfiesAxioms } from "./index.ts";

describe("T01 invariants", () => {
  it("kernel boot runs the Λ check and it passes", async () => {
    const h = await start();
    const c = h.initReceipt.checks.find((x) => x.name === "lambda-invariant");
    expect(c?.pass).toBe(true);
    expect(h.modules.T01.descriptor.backing).toBe("wired");
  });

  it("Λ equals the geometric mean and is bounded", () => {
    const r = lambda([0.9, 0.8, 0.7, 0.95]);
    const gm = Math.pow(0.9 * 0.8 * 0.7 * 0.95, 1 / 4);
    expect(Math.abs(r.lambda - gm)).toBeLessThan(1e-9);
    expect(boundCheck(r.lambda, r.minAxis, r.maxAxis)).toBe(true);
  });

  it("zero-pins on any zero axis", () => {
    expect(lambda([0.9, 0, 0.5]).lambda).toBe(0);
  });

  it("satisfies all four axioms on a real instance", () => {
    const ax = satisfiesAxioms([0.6, 0.7, 0.8]);
    expect(ax.all).toBe(true);
  });
});

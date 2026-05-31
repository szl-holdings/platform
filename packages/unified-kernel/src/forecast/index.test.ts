/** forecast (T12) — boots the kernel, then asserts the real PAC-Bayes bound. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { pacBayesBound } from "./index.ts";

describe("T12 forecast", () => {
  it("kernel registers T12 with the honest proven:false note", async () => {
    const h = await start();
    expect(h.modules.T12.descriptor.needs).toContain("not a proof");
  });

  it("computes a bound >= empirical risk and <= 1", () => {
    const r = pacBayesBound({ empiricalRisk: 0.1, klDivergence: 2, n: 1000, delta: 0.05 });
    expect(r.bound).toBeGreaterThanOrEqual(r.empiricalRisk);
    expect(r.bound).toBeLessThanOrEqual(1);
  });

  it("is honest: proven is always false (statistical, not a proof)", () => {
    const r = pacBayesBound({ empiricalRisk: 0.1, klDivergence: 2, n: 1000, delta: 0.05 });
    expect(r.proven).toBe(false);
  });

  it("rejects invalid parameters (real validation)", () => {
    expect(() => pacBayesBound({ empiricalRisk: 0.1, klDivergence: 1, n: 0, delta: 0.05 })).toThrow();
    expect(() => pacBayesBound({ empiricalRisk: 0.1, klDivergence: 1, n: 10, delta: 1 })).toThrow();
  });
});

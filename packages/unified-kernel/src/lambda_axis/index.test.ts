/** lambda_axis (T03) — boots the kernel, then asserts the axis-named Λ. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { NINE_AXES, WIRED_AXES, lambdaOverAxes } from "./index.ts";

describe("T03 lambda_axis", () => {
  it("kernel registers T03 with the documented 5-axis gap", async () => {
    const h = await start();
    expect(h.modules.T03.descriptor.needs).toContain("5 of 9");
  });

  it("declares nine axes, four wired", () => {
    expect(NINE_AXES.length).toBe(9);
    expect(WIRED_AXES.length).toBe(4);
  });

  it("computes Λ over the supplied axes and flags wiredOnly", () => {
    const r = lambdaOverAxes({ cleanliness: 0.9, horizon: 0.8, resonance: 0.7, frustum: 0.95 });
    expect(r.lambda).toBeGreaterThan(0);
    expect(r.boundVerified).toBe(true);
    expect(r.wiredOnly).toBe(true);
  });

  it("reports wiredOnly=false when a non-wired axis is included", () => {
    const r = lambdaOverAxes({ cleanliness: 0.9, calibration: 0.8 });
    expect(r.wiredOnly).toBe(false);
  });
});

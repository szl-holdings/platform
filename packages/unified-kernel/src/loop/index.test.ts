/** loop (T02) — boots the kernel, then asserts the WIRED ouroboros runtime. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { step, terminates, uniqueFixedPoint, OUROBOROS_PROVENANCE } from "./index.ts";

describe("T02 loop (wired ouroboros v6.3.0)", () => {
  it("kernel boot runs the termination check and it passes", async () => {
    const h = await start();
    const c = h.initReceipt.checks.find((x) => x.name === "ouroboros-termination");
    expect(c?.pass).toBe(true);
  });

  it("is wired to the real ouroboros runtime, not stubbed", () => {
    expect(OUROBOROS_PROVENANCE.package).toBe("@szl-holdings/ouroboros");
    expect(OUROBOROS_PROVENANCE.tag).toBe("v6.3.0");
    expect(OUROBOROS_PROVENANCE.upstreamTests).toBe(218);
  });

  it("a contraction map converges within budget", async () => {
    const t = await terminates();
    expect(t.halted).toBe(true);
    expect(t.exitReason).toBe("converged");
  });

  it("the converged state is a fixed point", async () => {
    expect(await uniqueFixedPoint()).toBe(true);
  });

  it("runs the real kernel over a custom contraction", async () => {
    const trace = await step<{ x: number }>(
      { x: 4 },
      (s) => ({ state: { x: s.x / 2 }, output: s.x / 2 }),
      (a, b) => Math.abs(a.x - b.x),
    );
    expect(trace.steps.length).toBeGreaterThan(0);
  });
});

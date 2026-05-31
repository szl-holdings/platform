/** lean (T19) — boots the kernel, then asserts the honest Lean registry. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { LEAN_REGISTRY, LEAN_NUMBERS, theoremsFor, statusTally } from "./index.ts";

describe("T19 lean", () => {
  it("kernel registers T19 wired", async () => {
    const h = await start();
    expect(h.modules.T19.descriptor.backing).toBe("wired");
  });

  it("carries the real Lean census numbers", () => {
    expect(LEAN_NUMBERS.declarations).toBe(752);
    expect(LEAN_NUMBERS.uniqueAxioms).toBe(14);
    expect(LEAN_NUMBERS.sorryTokens).toBe(160);
  });

  it("maps theorems to theses and tallies honestly (includes sorry/shell)", () => {
    expect(LEAN_REGISTRY.length).toBeGreaterThan(0);
    expect(theoremsFor("T01").length).toBeGreaterThan(0);
    const tally = statusTally();
    const total = tally.proven + tally["axiom-conditional"] + tally.sorry + tally.shell;
    expect(total).toBe(LEAN_REGISTRY.length);
  });
});

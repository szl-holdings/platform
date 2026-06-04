/** slsa (T15) — boots the kernel, then asserts honest L1 provenance. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { buildProvenance, verifyProvenance } from "./index.ts";

describe("T15 slsa", () => {
  it("kernel registers T15 wired", async () => {
    const h = await start();
    expect(h.modules.T15.descriptor.backing).toBe("wired");
  });

  it("builds an in-toto L1 statement that verifies against its artifact", () => {
    const artifact = { build: "unified-kernel", n: 1 };
    const prov = buildProvenance({
      artifactName: "unified-kernel",
      artifactContent: artifact,
      buildType: "tsc",
      builderId: "local",
      sourceUri: "git+https://github.com/szl-holdings/platform",
    });
    expect(prov.predicate.slsaLevel).toBe(1);
    expect(prov.predicate.honest).toBe(true);
    expect(verifyProvenance(prov, artifact)).toBe(true);
    expect(verifyProvenance(prov, { build: "other" })).toBe(false);
  });
});

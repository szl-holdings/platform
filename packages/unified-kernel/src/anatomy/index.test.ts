/** anatomy (T14) — boots the kernel, then asserts the organ map. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { ANATOMY, organFor } from "./index.ts";

describe("T14 anatomy", () => {
  it("kernel registers T14 wired", async () => {
    const h = await start();
    expect(h.modules.T14.descriptor.backing).toBe("wired");
  });

  it("maps known organs to products", () => {
    expect(organFor("amaru")?.organ).toBe("BRAIN");
    expect(organFor("sentra")?.status).toBe("WIRE-ISOLATED");
  });

  it("reports honest statuses (not all BACKED)", () => {
    expect(ANATOMY.some((o) => o.status === "PARTIAL")).toBe(true);
  });
});

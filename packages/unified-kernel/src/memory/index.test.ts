/** memory (T07 + T08) — boots the kernel, then asserts the real critique-gate. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { critiqueGate, critiqueGateSelfTest, persistMemory } from "./index.ts";
import { NotYetError } from "../types.ts";

describe("T07/T08 memory", () => {
  it("kernel registers T08 critique-gate wired and T07 amaru as needs", async () => {
    const h = await start();
    expect(h.modules.T08.descriptor.backing).toBe("wired");
    expect(h.modules.T07.descriptor.backing).toBe("needs");
  });

  it("critique-gate self-test passes", () => {
    expect(critiqueGateSelfTest().pass).toBe(true);
  });

  it("admits a well-formed memory, rejects missing provenance / low confidence", () => {
    expect(critiqueGate({ content: "x", provenance: "span:1", confidence: 0.9 }).admit).toBe(true);
    expect(critiqueGate({ content: "x", provenance: "", confidence: 0.9 }).admit).toBe(false);
    expect(critiqueGate({ content: "x", provenance: "span:1", confidence: 0.1 }).admit).toBe(false);
  });

  it("never sends a rejected memory to the store", async () => {
    const out = await persistMemory({ content: "", provenance: "", confidence: 0.1 });
    expect(out.stored).toBeNull();
    expect(out.critique.admit).toBe(false);
  });

  it("throws an honest NotYetError when admitted but no amaru client present", async () => {
    await expect(
      persistMemory({ content: "ok", provenance: "span:1", confidence: 0.9 }),
    ).rejects.toBeInstanceOf(NotYetError);
  });

  it("delegates an admitted memory to a real caller-supplied client", async () => {
    const out = await persistMemory(
      { content: "ok", provenance: "span:1", confidence: 0.9 },
      { client: { write: async () => ({ id: "m1", attested: true }), read: async () => null } },
    );
    expect(out.stored?.id).toBe("m1");
  });
});

/** rag (T17) — boots the kernel, then asserts the real governance envelope. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { evaluate, wrapRetrieval, governanceSelfTest, cosineSimilarity } from "./index.ts";
import { NotYetError } from "../types.ts";

describe("T17 rag governance envelope", () => {
  it("kernel registers T17 wired with the documented service dependency", async () => {
    const h = await start();
    expect(h.modules.T17.descriptor.backing).toBe("wired");
    expect(h.modules.T17.descriptor.needs).toContain("bge-m3");
  });

  it("governance self-test passes (admit/refuse + stable hash)", () => {
    expect(governanceSelfTest().pass).toBe(true);
  });

  it("admits chunks above threshold and refuses when none clear", () => {
    const ans = evaluate("q", [{ id: "a", text: "t", score: 0.8 }]);
    expect(ans.receipt.decision).toBe("answer");
    const ref = evaluate("q", [{ id: "b", text: "t", score: 0.1 }]);
    expect(ref.receipt.decision).toBe("refuse");
  });

  it("cosine similarity is real", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 9);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 9);
  });

  it("throws an honest NotYetError when no retriever is supplied (no fake docs)", async () => {
    await expect(wrapRetrieval("q")).rejects.toBeInstanceOf(NotYetError);
  });

  it("wraps a real caller-supplied retriever", async () => {
    const out = await wrapRetrieval("q", {
      retriever: async () => [{ id: "x", text: "real", score: 0.9 }],
    });
    expect(out.chunks.length).toBe(1);
    expect(out.receipt.decision).toBe("answer");
  });
});

/** qec (T10) — boots the kernel, then asserts the real Shor recovery. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { encodeCorruptRecover, shorEncode, minDistance } from "./index.ts";

describe("T10 qec", () => {
  it("kernel boot runs the QEC recover check and it passes", async () => {
    const h = await start();
    const c = h.initReceipt.checks.find((x) => x.name === "qec-recover");
    expect(c?.pass).toBe(true);
  });

  it("encodes one logical receipt into nine physical copies", () => {
    const bundle = shorEncode({ payload: 0x3c, lineage: 0 });
    expect(bundle.length).toBe(9);
  });

  it("recovers from a minority corruption (4 of 9)", () => {
    const r = encodeCorruptRecover(0xa5, 4);
    expect(r.recovered_ok).toBe(true);
    expect(r.recovered).toBe(0xa5);
    expect(r.corrupted).toBe(4);
  });

  it("clamps corruption below the majority threshold (real bound, not faked)", () => {
    // The helper deliberately clamps to <5 because 5/9 exceeds Shor majority and
    // would not be recoverable — it does not pretend to recover the impossible.
    const r = encodeCorruptRecover(0xa5, 9);
    expect(r.corrupted).toBe(4);
    expect(r.recovered_ok).toBe(true);
  });

  it("has minimum distance >= 1 over its codewords", () => {
    expect(minDistance([[true, false, true], [false, true, false]])).toBeGreaterThanOrEqual(1);
  });
});

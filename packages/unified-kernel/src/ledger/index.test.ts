/** ledger (T04) — boots the kernel, then asserts the real hash chain. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { ReceiptLedger } from "./index.ts";

describe("T04 ledger", () => {
  it("kernel boot runs the receipt-chain check and it passes", async () => {
    const h = await start();
    const c = h.initReceipt.checks.find((x) => x.name === "receipt-chain-verify");
    expect(c?.pass).toBe(true);
  });

  it("verifies a well-formed chain", () => {
    const l = new ReceiptLedger();
    l.append("a", "e1", { n: 1 });
    l.append("a", "e2", { n: 2 });
    l.append("a", "e3", { n: 3 });
    expect(l.verify().valid).toBe(true);
    expect(l.prevHashOk()).toBe(true);
  });

  it("detects a body mutation (round-trip re-hash fails)", () => {
    const l = new ReceiptLedger();
    l.append("a", "e1", { n: 1 });
    l.append("a", "e2", { n: 2 });
    const entries = l.all() as Array<{ body: { n: number } }>;
    entries[0].body.n = 999; // mutate after the fact
    expect(l.verify().valid).toBe(false);
  });
});

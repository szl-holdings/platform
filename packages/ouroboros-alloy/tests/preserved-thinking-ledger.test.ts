import { describe, it, expect } from "vitest";
import {
  makeLedger,
  record,
  reuse,
  ancestry,
} from "../src/preserved-thinking-ledger.js";

describe("primitive 66 — preserved-thinking ledger", () => {
  it("records and recalls blocks", () => {
    const l = makeLedger();
    record(l, { blockId: "b1", turnIndex: 0, claimId: "c1", reasoning: "x" });
    record(l, { blockId: "b2", turnIndex: 1, claimId: "c2", reasoning: "y" });
    expect(l.blocks.length).toBe(2);
  });

  it("rejects duplicate blockIds", () => {
    const l = makeLedger();
    record(l, { blockId: "b1", turnIndex: 0, claimId: "c1", reasoning: "x" });
    expect(() =>
      record(l, { blockId: "b1", turnIndex: 1, claimId: "c2", reasoning: "y" })
    ).toThrow(/duplicate/);
  });

  it("reuse() refuses unknown blockIds", () => {
    const l = makeLedger();
    expect(() => reuse(l, "absent", 1, "c2")).toThrow(/not in ledger/);
  });

  it("reuse() refuses time-travel", () => {
    const l = makeLedger();
    record(l, { blockId: "b1", turnIndex: 5, claimId: "c1", reasoning: "x" });
    expect(() => reuse(l, "b1", 2, "c2")).toThrow(/cannot reuse from future/);
  });

  it("ancestry returns reused blocks for a claim", () => {
    const l = makeLedger();
    record(l, { blockId: "b1", turnIndex: 0, claimId: "c1", reasoning: "x" });
    record(l, { blockId: "b2", turnIndex: 1, claimId: "c2", reasoning: "y" });
    reuse(l, "b1", 2, "c3");
    reuse(l, "b2", 2, "c3");
    const a = ancestry(l, "c3");
    expect(a.ancestors.length).toBe(2);
    expect(a.ancestors.map((b) => b.blockId).sort()).toEqual(["b1", "b2"]);
  });

  it("ancestry returns empty for claim with no ancestry", () => {
    const l = makeLedger();
    const a = ancestry(l, "ghost");
    expect(a.ancestors).toEqual([]);
    expect(a.rationale).toMatch(/no preserved-thinking ancestors/);
  });
});

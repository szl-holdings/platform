import { describe, it, expect } from "vitest";
import { HypothesisLedger } from "../src/hypothesis-ledger.js";

describe("Primitive 30 — Hypothesis Ledger", () => {
  it("adds and retrieves hypotheses", () => {
    const l = new HypothesisLedger();
    l.add({ id: "h1", text: "x is finite", parents: [], status: "ASSUMED" });
    expect(l.get("h1")?.text).toBe("x is finite");
    expect(l.size()).toBe(1);
  });

  it("rejects duplicate ids", () => {
    const l = new HypothesisLedger();
    l.add({ id: "h1", text: "a", parents: [], status: "ASSUMED" });
    expect(() =>
      l.add({ id: "h1", text: "b", parents: [], status: "ASSUMED" }),
    ).toThrow();
  });

  it("rejects unknown parents", () => {
    const l = new HypothesisLedger();
    expect(() =>
      l.add({ id: "h1", text: "a", parents: ["missing"], status: "ASSUMED" }),
    ).toThrow();
  });

  it("requires account to RAISE", () => {
    const l = new HypothesisLedger();
    l.add({ id: "h1", text: "a", parents: [], status: "ASSUMED" });
    expect(() => l.setStatus("h1", "RAISED")).toThrow();
    l.setStatus("h1", "RAISED", "logos given");
    expect(l.get("h1")?.status).toBe("RAISED");
    expect(l.get("h1")?.account).toBe("logos given");
  });

  it("tracks raised and retracted ids", () => {
    const l = new HypothesisLedger();
    l.add({ id: "h1", text: "a", parents: [], status: "ASSUMED" });
    l.add({ id: "h2", text: "b", parents: [], status: "ASSUMED" });
    l.add({ id: "h3", text: "c", parents: [], status: "ASSUMED" });
    l.setStatus("h1", "RAISED", "ok");
    l.setStatus("h2", "RETRACTED");
    expect(l.raisedIds()).toEqual(["h1"]);
    expect(l.retractedIds()).toEqual(["h2"]);
  });

  it("isClaimFullyRaised follows ancestor chain", () => {
    const l = new HypothesisLedger();
    l.add({ id: "h1", text: "root", parents: [], status: "RAISED", account: "a" });
    l.add({ id: "h2", text: "child", parents: ["h1"], status: "RAISED", account: "b" });
    l.attachClaim("C", ["h2"]);
    expect(l.isClaimFullyRaised("C")).toBe(true);
    l.add({ id: "h3", text: "grand", parents: ["h2"], status: "ASSUMED" });
    l.attachClaim("D", ["h3"]);
    expect(l.isClaimFullyRaised("D")).toBe(false);
  });

  it("returns false for claim with no attached hypotheses", () => {
    const l = new HypothesisLedger();
    expect(l.isClaimFullyRaised("Z")).toBe(false);
  });

  it("attachClaim throws if hypothesis missing", () => {
    const l = new HypothesisLedger();
    expect(() => l.attachClaim("X", ["nope"])).toThrow();
  });
});

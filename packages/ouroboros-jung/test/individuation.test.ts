import { describe, it, expect } from "vitest";
import { summariseIndividuation } from "../src/individuation.js";

describe("Primitive 46 — Individuation ledger", () => {
  it("monotone advance is detected", () => {
    const r = summariseIndividuation([
      { stage: "persona", witness: "w", timestamp: "t1" },
      { stage: "shadow-encounter", witness: "w", timestamp: "t2" },
      { stage: "self-recognition", witness: "w", timestamp: "t3" },
    ]);
    expect(r.monotone).toBe(true);
    expect(r.regressions).toEqual([]);
    expect(r.highest).toBe("self-recognition");
  });

  it("regressions are logged honestly", () => {
    const r = summariseIndividuation([
      { stage: "self-recognition", witness: "w", timestamp: "t1" },
      { stage: "persona", witness: "w", timestamp: "t2" },
    ]);
    expect(r.monotone).toBe(false);
    expect(r.regressions.length).toBe(1);
    expect(r.regressions[0]).toEqual({
      from: "self-recognition",
      to: "persona",
    });
  });

  it("missing witness throws", () => {
    expect(() =>
      summariseIndividuation([
        { stage: "persona", witness: "", timestamp: "t" },
      ]),
    ).toThrow();
  });

  it("repeating same stage is not a regression", () => {
    const r = summariseIndividuation([
      { stage: "persona", witness: "w", timestamp: "t1" },
      { stage: "persona", witness: "w", timestamp: "t2" },
    ]);
    expect(r.monotone).toBe(true);
  });

  it("empty input gives null highest", () => {
    const r = summariseIndividuation([]);
    expect(r.highest).toBe(null);
    expect(r.monotone).toBe(true);
  });

  it("stagesReached preserves event order", () => {
    const r = summariseIndividuation([
      { stage: "persona", witness: "w", timestamp: "t1" },
      { stage: "shadow-encounter", witness: "w", timestamp: "t2" },
    ]);
    expect(r.stagesReached).toEqual(["persona", "shadow-encounter"]);
  });
});

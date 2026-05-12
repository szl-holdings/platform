import { describe, it, expect } from "vitest";
import { potentialInfiniteGate } from "../src/potential-infinite-only.js";

describe("potential-infinite gate", () => {
  it("rejects actual-infinite always", () => {
    const v = potentialInfiniteGate({ id: "c1", asserts: "actual-infinite" });
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/actual-infinite rejected/);
  });

  it("rejects potential-infinite without witness", () => {
    const v = potentialInfiniteGate({ id: "c1", asserts: "potential-infinite" });
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/no continuation-witness/);
  });

  it("accepts strictly increasing witness", () => {
    const v = potentialInfiniteGate({ id: "c1", asserts: "potential-infinite", witness: (b) => b + 1 });
    expect(v.accepted).toBe(true);
  });

  it("rejects non-monotone witness", () => {
    const v = potentialInfiniteGate({ id: "c1", asserts: "potential-infinite", witness: (b) => b });
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/monotonicity/);
  });

  it("rejects witness that throws", () => {
    const v = potentialInfiniteGate({
      id: "c1",
      asserts: "potential-infinite",
      witness: () => {
        throw new Error("boom");
      },
    });
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/threw/);
  });

  it("accepts doubling witness", () => {
    const v = potentialInfiniteGate({ id: "c1", asserts: "potential-infinite", witness: (b) => b * 2 + 1 });
    expect(v.accepted).toBe(true);
  });

  it("custom sample bounds work", () => {
    const v = potentialInfiniteGate(
      { id: "c1", asserts: "potential-infinite", witness: (b) => b + 1 },
      [5, 50, 500]
    );
    expect(v.accepted).toBe(true);
  });
});

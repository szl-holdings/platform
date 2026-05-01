import { describe, it, expect } from "vitest";
import { abramovGate } from "../src/abramov-gate.js";

describe("Primitive 34 — Abramov-order gate", () => {
  it("declares ABRAMOV_PROVEN when k ≤ p+1", () => {
    expect(abramovGate({ p: 2, k: 2 }).status).toBe("ABRAMOV_PROVEN");
    expect(abramovGate({ p: 2, k: 3 }).status).toBe("ABRAMOV_PROVEN");
    expect(abramovGate({ p: 3, k: 4 }).status).toBe("ABRAMOV_PROVEN");
    expect(abramovGate({ p: 5, k: 6 }).status).toBe("ABRAMOV_PROVEN");
  });

  it("declares ABRAMOV_FAILS exactly at (p=2, k=5) per Jamneshan–Shalom–Tao 2026", () => {
    const r = abramovGate({ p: 2, k: 5 });
    expect(r.status).toBe("ABRAMOV_FAILS");
    expect(r.citation).toContain("Jamneshan");
    expect(r.citation).toContain("2026");
  });

  it("declares ABRAMOV_OPEN otherwise", () => {
    expect(abramovGate({ p: 2, k: 4 }).status).toBe("ABRAMOV_OPEN");
    expect(abramovGate({ p: 2, k: 6 }).status).toBe("ABRAMOV_OPEN");
    expect(abramovGate({ p: 3, k: 5 }).status).toBe("ABRAMOV_OPEN");
  });

  it("rejects invalid p or k", () => {
    expect(() => abramovGate({ p: 1, k: 2 })).toThrow();
    expect(() => abramovGate({ p: 2, k: 0 })).toThrow();
    expect(() => abramovGate({ p: 2.5, k: 2 })).toThrow();
  });

  it("includes a citation for every status", () => {
    for (const c of [
      { p: 2, k: 2 },
      { p: 2, k: 5 },
      { p: 2, k: 6 },
    ]) {
      expect(abramovGate(c).citation.length).toBeGreaterThan(0);
    }
  });
});

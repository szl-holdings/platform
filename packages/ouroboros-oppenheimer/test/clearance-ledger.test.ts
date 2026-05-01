import { describe, it, expect } from "vitest";
import { ClearanceLedger } from "../src/clearance-ledger.js";

describe("Primitive 25 — Clearance ledger", () => {
  it("requires basis citation", () => {
    const l = new ClearanceLedger();
    expect(() =>
      l.append({
        principalId: "p",
        action: "GRANT",
        level: "SECRET",
        basisCitation: "",
        timestamp: 1,
      }),
    ).toThrow();
  });

  it("enforces append-only by timestamp", () => {
    const l = new ClearanceLedger();
    l.append({
      principalId: "p",
      action: "GRANT",
      level: "SECRET",
      basisCitation: "AEC 1947",
      timestamp: 100,
    });
    expect(() =>
      l.append({
        principalId: "p",
        action: "REVOKE",
        level: "NONE",
        basisCitation: "AEC 1954",
        timestamp: 50,
      }),
    ).toThrow();
  });

  it("derives current level after grant→suspend→restore", () => {
    const l = new ClearanceLedger();
    l.append({
      principalId: "p",
      action: "GRANT",
      level: "TOP_SECRET",
      basisCitation: "x",
      timestamp: 1,
    });
    l.append({
      principalId: "p",
      action: "SUSPEND",
      level: "NONE",
      basisCitation: "y",
      timestamp: 2,
    });
    expect(l.for("p").current).toBe("NONE");
    l.append({
      principalId: "p",
      action: "RESTORE",
      level: "SECRET",
      basisCitation: "z",
      timestamp: 3,
    });
    expect(l.for("p").current).toBe("SECRET");
  });

  it("isClearedFor uses rank ordering", () => {
    const l = new ClearanceLedger();
    l.append({
      principalId: "p",
      action: "GRANT",
      level: "SECRET",
      basisCitation: "x",
      timestamp: 1,
    });
    const res = l.for("p");
    expect(res.isClearedFor("CONFIDENTIAL")).toBe(true);
    expect(res.isClearedFor("SECRET")).toBe(true);
    expect(res.isClearedFor("TOP_SECRET")).toBe(false);
  });

  it("isolates per-principal histories", () => {
    const l = new ClearanceLedger();
    l.append({
      principalId: "a",
      action: "GRANT",
      level: "TOP_SECRET",
      basisCitation: "x",
      timestamp: 1,
    });
    l.append({
      principalId: "b",
      action: "GRANT",
      level: "PUBLIC",
      basisCitation: "y",
      timestamp: 2,
    });
    expect(l.for("a").current).toBe("TOP_SECRET");
    expect(l.for("b").current).toBe("PUBLIC");
  });

  it("REVOKE drops to NONE", () => {
    const l = new ClearanceLedger();
    l.append({
      principalId: "p",
      action: "GRANT",
      level: "TOP_SECRET",
      basisCitation: "x",
      timestamp: 1,
    });
    l.append({
      principalId: "p",
      action: "REVOKE",
      level: "NONE",
      basisCitation: "1954 Personnel Security Board",
      timestamp: 2,
    });
    expect(l.for("p").current).toBe("NONE");
  });

  it("tracks ledger size", () => {
    const l = new ClearanceLedger();
    expect(l.size()).toBe(0);
    l.append({
      principalId: "p",
      action: "GRANT",
      level: "PUBLIC",
      basisCitation: "x",
      timestamp: 1,
    });
    expect(l.size()).toBe(1);
  });
});

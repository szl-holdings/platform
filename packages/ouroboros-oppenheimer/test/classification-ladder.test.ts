import { describe, it, expect } from "vitest";
import { downgrade, canRead, CLASS_RANK } from "../src/classification-ladder.js";

describe("Primitive 26 — Classification ladder", () => {
  it("ranks UNCLASSIFIED < CONFIDENTIAL < SECRET < TOP_SECRET < RESTRICTED_DATA", () => {
    expect(CLASS_RANK.UNCLASSIFIED).toBe(0);
    expect(CLASS_RANK.RESTRICTED_DATA).toBe(4);
  });

  it("no downgrade leaves declared = effective", () => {
    const r = downgrade("a1", "SECRET", []);
    expect(r.effective).toBe("SECRET");
    expect(r.downgrades).toEqual([]);
  });

  it("applies multi-step downgrade chain", () => {
    const r = downgrade("a1", "TOP_SECRET", [
      {
        from: "TOP_SECRET",
        to: "SECRET",
        basisCitation: "EO 12356",
        authorizedBy: "Director X",
      },
      {
        from: "SECRET",
        to: "CONFIDENTIAL",
        basisCitation: "EO 12356",
        authorizedBy: "Director X",
      },
    ]);
    expect(r.effective).toBe("CONFIDENTIAL");
    expect(r.downgrades.length).toBe(2);
  });

  it("rejects broken downgrade chain", () => {
    expect(() =>
      downgrade("a1", "SECRET", [
        {
          from: "TOP_SECRET",
          to: "SECRET",
          basisCitation: "x",
          authorizedBy: "y",
        },
      ]),
    ).toThrow();
  });

  it("rejects non-strict downgrade", () => {
    expect(() =>
      downgrade("a1", "SECRET", [
        {
          from: "SECRET",
          to: "SECRET",
          basisCitation: "x",
          authorizedBy: "y",
        },
      ]),
    ).toThrow();
    expect(() =>
      downgrade("a1", "SECRET", [
        {
          from: "SECRET",
          to: "TOP_SECRET",
          basisCitation: "x",
          authorizedBy: "y",
        },
      ]),
    ).toThrow();
  });

  it("requires basis + authorizer", () => {
    expect(() =>
      downgrade("a1", "SECRET", [
        { from: "SECRET", to: "CONFIDENTIAL", basisCitation: "", authorizedBy: "x" },
      ]),
    ).toThrow();
  });

  it("canRead respects clearance against effective level", () => {
    const r = downgrade("a1", "SECRET", []);
    expect(canRead(r, "SECRET")).toBe(true);
    expect(canRead(r, "CONFIDENTIAL")).toBe(false);
    expect(canRead(r, "TOP_SECRET")).toBe(true);
    expect(canRead(r, "NONE")).toBe(false);
  });

  it("downgrade lowers required clearance for read", () => {
    const r = downgrade("a1", "TOP_SECRET", [
      {
        from: "TOP_SECRET",
        to: "CONFIDENTIAL",
        basisCitation: "EO",
        authorizedBy: "X",
      },
    ]);
    expect(canRead(r, "CONFIDENTIAL")).toBe(true);
  });
});

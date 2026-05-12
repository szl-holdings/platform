import { describe, it, expect } from "vitest";
import { metabasisProhibition } from "../src/metabasis-prohibition.js";

describe("metabasis-prohibition (84)", () => {
  it("passes when all principles are native", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "geometry",
      principles: [{ id: "p1", homeGenus: "geometry" }, { id: "p2", homeGenus: "geometry" }],
    });
    expect(r.ok).toBe(true);
    expect(r.foreign).toHaveLength(0);
  });

  it("blocks foreign-genus principle", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "geometry",
      principles: [{ id: "p1", homeGenus: "geometry" }, { id: "p2", homeGenus: "biology" }],
    });
    expect(r.ok).toBe(false);
    expect(r.foreign.map((p) => p.id)).toContain("p2");
  });

  it("licenses subalternate ancestor", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "optics",
      principles: [{ id: "p1", homeGenus: "geometry" }],
      subalternateAncestors: ["geometry"],
    });
    expect(r.ok).toBe(true);
    expect(r.borrowed.map((p) => p.id)).toContain("p1");
  });

  it("borrowed and foreign coexist — fails", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "optics",
      principles: [
        { id: "p1", homeGenus: "geometry" },
        { id: "p2", homeGenus: "ethics" },
      ],
      subalternateAncestors: ["geometry"],
    });
    expect(r.ok).toBe(false);
    expect(r.foreign.map((p) => p.id)).toEqual(["p2"]);
    expect(r.borrowed.map((p) => p.id)).toEqual(["p1"]);
  });

  it("requires targetGenus", () => {
    const r = metabasisProhibition({ claimId: "c1", targetGenus: "", principles: [] });
    expect(r.ok).toBe(false);
  });

  it("empty principle list passes", () => {
    const r = metabasisProhibition({ claimId: "c1", targetGenus: "g", principles: [] });
    expect(r.ok).toBe(true);
  });

  it("reports count of foreign principles", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "g",
      principles: [
        { id: "a", homeGenus: "x" },
        { id: "b", homeGenus: "y" },
      ],
    });
    expect(r.reason).toMatch(/2/);
  });

  it("subalternate ancestors can be empty", () => {
    const r = metabasisProhibition({
      claimId: "c1",
      targetGenus: "g",
      principles: [{ id: "a", homeGenus: "g" }],
      subalternateAncestors: [],
    });
    expect(r.ok).toBe(true);
  });

  it("Aristotle's example: arithmetic theorem in geometry blocked", () => {
    const r = metabasisProhibition({
      claimId: "geo-claim",
      targetGenus: "geometry",
      principles: [{ id: "commutativity-of-addition", homeGenus: "arithmetic" }],
    });
    expect(r.ok).toBe(false);
  });

  it("Aristotle's example: harmonics borrowing arithmetic licensed", () => {
    const r = metabasisProhibition({
      claimId: "harmonics-claim",
      targetGenus: "harmonics",
      principles: [{ id: "ratio-theorem", homeGenus: "arithmetic" }],
      subalternateAncestors: ["arithmetic"],
    });
    expect(r.ok).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { abstractByRemoval, moreAkribeic } from "../src/aphairesis-abstraction.js";

describe("aphairesis abstraction", () => {
  const sample = {
    subjectId: "bronze-sphere",
    allProperties: [
      { name: "weight" },
      { name: "color" },
      { name: "material" },
      { name: "volume" },
      { name: "radius" },
    ],
    retainedProperties: ["volume", "radius"],
    removedBy: "geometer",
    timestamp: "2026-05-01T00:00:00Z",
  };

  it("retains exactly the named properties", () => {
    const r = abstractByRemoval(sample);
    expect(r.retained.map((p) => p.name).sort()).toEqual(["radius", "volume"]);
  });

  it("removes everything else", () => {
    const r = abstractByRemoval(sample);
    expect(r.removed.map((p) => p.name).sort()).toEqual(["color", "material", "weight"]);
  });

  it("computes precision as removed/total", () => {
    const r = abstractByRemoval(sample);
    expect(r.precision).toBeCloseTo(3 / 5);
  });

  it("flags honest=true when retained names exist", () => {
    expect(abstractByRemoval(sample).honest).toBe(true);
  });

  it("flags honest=false when retained name is fictional", () => {
    const r = abstractByRemoval({ ...sample, retainedProperties: ["soul"] });
    expect(r.honest).toBe(false);
  });

  it("records who removed and when", () => {
    const r = abstractByRemoval(sample);
    expect(r.removedBy).toBe("geometer");
    expect(r.timestamp).toBe("2026-05-01T00:00:00Z");
  });

  it("handles empty allProperties without divide-by-zero", () => {
    const r = abstractByRemoval({ ...sample, allProperties: [], retainedProperties: [] });
    expect(r.precision).toBe(0);
    expect(r.honest).toBe(true);
  });

  it("moreAkribeic prefers higher precision (Aristotle: more removal = more precise)", () => {
    const a = abstractByRemoval(sample); // 3/5
    const b = abstractByRemoval({ ...sample, retainedProperties: ["volume"] }); // 4/5
    expect(moreAkribeic(a, b)).toBe(b);
  });

  it("moreAkribeic returns first when tied", () => {
    const a = abstractByRemoval(sample);
    const b = abstractByRemoval(sample);
    expect(moreAkribeic(a, b)).toBe(a);
  });

  it("subjectId carried through", () => {
    expect(abstractByRemoval(sample).subjectId).toBe("bronze-sphere");
  });
});

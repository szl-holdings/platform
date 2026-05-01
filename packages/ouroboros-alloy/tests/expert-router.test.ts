import { describe, it, expect } from "vitest";
import {
  route,
  tallyVerdicts,
} from "../src/expert-router.js";

describe("primitive 68 — expert router", () => {
  const experts = [
    { id: "math1", domains: ["math"] },
    { id: "math2", domains: ["math", "physics"] },
    { id: "code1", domains: ["code"] },
    { id: "general", domains: ["math", "code", "physics"] },
  ];

  it("routes to top-K eligible experts by affinity", () => {
    const r = route(experts, {
      claimId: "c1",
      domain: "math",
      topK: 2,
      affinity: new Map([
        ["math1", 0.9],
        ["math2", 0.7],
        ["general", 0.95],
      ]),
    });
    expect(r.eligible.length).toBe(3);
    expect(r.selected.map((e) => e.id)).toEqual(["general", "math1"]);
  });

  it("returns empty when no expert covers domain", () => {
    const r = route(experts, {
      claimId: "c1",
      domain: "biology",
      topK: 2,
      affinity: new Map(),
    });
    expect(r.selected).toEqual([]);
    expect(r.rationale).toMatch(/no expert/);
  });

  it("rejects topK < 1", () => {
    expect(() =>
      route(experts, {
        claimId: "c1",
        domain: "math",
        topK: 0,
        affinity: new Map(),
      })
    ).toThrow(/topK must be >= 1/);
  });

  it("breaks ties deterministically by id", () => {
    const r = route(experts, {
      claimId: "c1",
      domain: "math",
      topK: 1,
      affinity: new Map([
        ["math1", 0.5],
        ["math2", 0.5],
        ["general", 0.5],
      ]),
    });
    expect(r.selected[0].id).toBe("general"); // alphabetically first
  });

  it("tallyVerdicts respects min-admit quorum", () => {
    const q = tallyVerdicts(
      "c1",
      [
        { expertId: "e1", admits: true, rationale: "" },
        { expertId: "e2", admits: true, rationale: "" },
        { expertId: "e3", admits: false, rationale: "" },
      ],
      2
    );
    expect(q.quorumMet).toBe(true);
    expect(q.admitted).toBe(2);
  });

  it("tallyVerdicts fails quorum when below threshold", () => {
    const q = tallyVerdicts(
      "c1",
      [
        { expertId: "e1", admits: true, rationale: "" },
        { expertId: "e2", admits: false, rationale: "" },
      ],
      2
    );
    expect(q.quorumMet).toBe(false);
    expect(q.rationale).toMatch(/NOT met/);
  });
});

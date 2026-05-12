import { describe, it, expect } from "vitest";
import { checkPolygraphic } from "../src/polygraphic-redundancy.js";

describe("Primitive 56 — Polygraphic redundancy", () => {
  it("passes with unanimous quorum across 3 systems", () => {
    const r = checkPolygraphic([
      { systemId: "s1", decoded: "ATTACK AT DAWN" },
      { systemId: "s2", decoded: "ATTACK AT DAWN" },
      { systemId: "s3", decoded: "ATTACK AT DAWN" },
    ]);
    expect(r.passes).toBe(true);
    expect(r.quorumValue).toBe("ATTACK AT DAWN");
  });

  it("fails when fewer than 3 distinct systems", () => {
    const r = checkPolygraphic([
      { systemId: "s1", decoded: "X" },
      { systemId: "s2", decoded: "X" },
    ]);
    expect(r.passes).toBe(false);
  });

  it("fails when no quorum reached", () => {
    const r = checkPolygraphic([
      { systemId: "s1", decoded: "A" },
      { systemId: "s2", decoded: "B" },
      { systemId: "s3", decoded: "C" },
    ]);
    expect(r.passes).toBe(false);
    expect(r.quorumValue).toBe(null);
  });

  it("passes with 2-of-3 majority at default 2/3 fraction", () => {
    const r = checkPolygraphic([
      { systemId: "s1", decoded: "X" },
      { systemId: "s2", decoded: "X" },
      { systemId: "s3", decoded: "Y" },
    ]);
    expect(r.passes).toBe(true);
    expect(r.quorumValue).toBe("X");
  });

  it("required threshold is configurable", () => {
    const r = checkPolygraphic(
      [
        { systemId: "s1", decoded: "X" },
        { systemId: "s2", decoded: "X" },
      ],
      2,
    );
    expect(r.passes).toBe(true);
  });

  it("counts distinct systems only", () => {
    const r = checkPolygraphic([
      { systemId: "s1", decoded: "X" },
      { systemId: "s1", decoded: "Y" },
      { systemId: "s2", decoded: "X" },
    ]);
    expect(r.systems).toBe(2);
  });
});

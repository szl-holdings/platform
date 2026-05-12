import { describe, it, expect } from "vitest";
import { kathHautoFilter } from "../src/kath-hauto-predication-filter.js";

describe("kath-hauto-predication-filter (85)", () => {
  it("per-se-1: predicate in subject's essence passes", () => {
    const r = kathHautoFilter({
      predicate: "animal",
      subject: "human",
      declaredKind: "per-se-1",
      subjectEssentialDefinition: ["rational", "animal"],
    });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("per-se-1");
  });

  it("per-se-2: subject in predicate's essence passes", () => {
    const r = kathHautoFilter({
      predicate: "odd-or-even",
      subject: "number",
      declaredKind: "per-se-2",
      predicateEssentialDefinition: ["number"],
    });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("per-se-2");
  });

  it("per-se-accidens with witness passes", () => {
    const r = kathHautoFilter({
      predicate: "having-angles-equal-to-two-right-angles",
      subject: "triangle",
      declaredKind: "per-se-accidens",
      necessityWitness: "Euclid I.32",
    });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("per-se-accidens");
  });

  it("per-se-accidens without witness falls back to accidental", () => {
    const r = kathHautoFilter({
      predicate: "x",
      subject: "y",
      declaredKind: "per-se-accidens",
    });
    expect(r.ok).toBe(false);
    expect(r.kind).toBe("accidental");
  });

  it("merely accidental predication blocked", () => {
    const r = kathHautoFilter({
      predicate: "pale",
      subject: "human",
      declaredKind: "accidental",
    });
    expect(r.ok).toBe(false);
    expect(r.kind).toBe("accidental");
    expect(r.reason).toMatch(/sumbeb/);
  });

  it("falsely declared per-se-1 caught when essence mismatches", () => {
    const r = kathHautoFilter({
      predicate: "musical",
      subject: "human",
      declaredKind: "per-se-1",
      subjectEssentialDefinition: ["rational", "animal"],
    });
    expect(r.ok).toBe(false);
  });

  it("kind precedence: per-se-1 wins over per-se-2 when both apply", () => {
    const r = kathHautoFilter({
      predicate: "X",
      subject: "Y",
      declaredKind: "per-se-1",
      subjectEssentialDefinition: ["X"],
      predicateEssentialDefinition: ["Y"],
    });
    expect(r.kind).toBe("per-se-1");
  });

  it("reason text mentions accidental rejection", () => {
    const r = kathHautoFilter({ predicate: "p", subject: "s", declaredKind: "accidental" });
    expect(r.reason).toMatch(/accidental|admiss/);
  });

  it("Aristotle's odd/even example", () => {
    const r = kathHautoFilter({
      predicate: "odd",
      subject: "number",
      declaredKind: "per-se-2",
      predicateEssentialDefinition: ["number"],
    });
    expect(r.ok).toBe(true);
  });

  it("Aristotle's bronze/sphere accidental example", () => {
    const r = kathHautoFilter({
      predicate: "bronze",
      subject: "sphere",
      declaredKind: "accidental",
    });
    expect(r.ok).toBe(false);
  });
});

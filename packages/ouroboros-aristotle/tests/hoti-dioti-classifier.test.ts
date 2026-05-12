import { describe, it, expect } from "vitest";
import { hotiDiotiClassifier } from "../src/hoti-dioti-classifier.js";

describe("hoti-dioti-classifier (86)", () => {
  it("dioti: middle term causes conclusion predicate", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "planets",
      conclusionPredicate: "do-not-twinkle",
      middleTerm: "near",
      causalGraph: { near: ["do-not-twinkle"] },
    });
    expect(r.grade).toBe("dioti");
  });

  it("hoti: middle term is downstream of conclusion", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "planets",
      conclusionPredicate: "near",
      middleTerm: "do-not-twinkle",
      causalGraph: { near: ["do-not-twinkle"] },
    });
    expect(r.grade).toBe("hoti");
  });

  it("no-link when no path exists", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "x",
      conclusionPredicate: "y",
      middleTerm: "z",
      causalGraph: { y: ["unrelated"] },
    });
    expect(r.grade).toBe("no-link");
  });

  it("multi-hop dioti", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "x",
      conclusionPredicate: "z",
      middleTerm: "a",
      causalGraph: { a: ["b"], b: ["c"], c: ["z"] },
    });
    expect(r.grade).toBe("dioti");
  });

  it("cycle resolves to no-link", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "x",
      conclusionPredicate: "a",
      middleTerm: "b",
      causalGraph: { a: ["b"], b: ["a"] },
    });
    expect(r.grade).toBe("no-link");
  });

  it("self-loop on middle term still classifies dioti correctly", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "x",
      conclusionPredicate: "y",
      middleTerm: "m",
      causalGraph: { m: ["m", "y"] },
    });
    expect(r.grade).toBe("dioti");
  });

  it("empty graph yields no-link", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "x",
      conclusionPredicate: "y",
      middleTerm: "z",
      causalGraph: {},
    });
    expect(r.grade).toBe("no-link");
  });

  it("dioti has reason about cause", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "s",
      conclusionPredicate: "p",
      middleTerm: "m",
      causalGraph: { m: ["p"] },
    });
    expect(r.reason).toMatch(/cause|why/);
  });

  it("hoti has reason about fact only", () => {
    const r = hotiDiotiClassifier({
      conclusionSubject: "s",
      conclusionPredicate: "p",
      middleTerm: "m",
      causalGraph: { p: ["m"] },
    });
    expect(r.reason).toMatch(/fact|downstream/);
  });

  it("planets-twinkle classic example", () => {
    const dioti = hotiDiotiClassifier({
      conclusionSubject: "planets",
      conclusionPredicate: "do-not-twinkle",
      middleTerm: "near",
      causalGraph: { near: ["do-not-twinkle"] },
    });
    expect(dioti.grade).toBe("dioti");
    const hoti = hotiDiotiClassifier({
      conclusionSubject: "planets",
      conclusionPredicate: "near",
      middleTerm: "do-not-twinkle",
      causalGraph: { near: ["do-not-twinkle"] },
    });
    expect(hoti.grade).toBe("hoti");
  });
});

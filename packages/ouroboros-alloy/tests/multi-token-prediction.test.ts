import { describe, it, expect } from "vitest";
import { verifyBlock } from "../src/multi-token-prediction.js";

describe("primitive 71 — multi-token prediction", () => {
  it("accepts full block when all admit", () => {
    const r = verifyBlock(
      [
        { index: 0, claimId: "c0", payload: null },
        { index: 1, claimId: "c1", payload: null },
        { index: 2, claimId: "c2", payload: null },
      ],
      [
        { index: 0, admits: true, rationale: "" },
        { index: 1, admits: true, rationale: "" },
        { index: 2, admits: true, rationale: "" },
      ]
    );
    expect(r.acceptedPrefix).toBe(3);
    expect(r.firstRejection).toBeNull();
  });

  it("accepts longest contiguous head admit run", () => {
    const r = verifyBlock(
      [
        { index: 0, claimId: "c0", payload: null },
        { index: 1, claimId: "c1", payload: null },
        { index: 2, claimId: "c2", payload: null },
        { index: 3, claimId: "c3", payload: null },
      ],
      [
        { index: 0, admits: true, rationale: "" },
        { index: 1, admits: true, rationale: "" },
        { index: 2, admits: false, rationale: "bad" },
        { index: 3, admits: true, rationale: "" }, // ignored, prefix already broken
      ]
    );
    expect(r.acceptedPrefix).toBe(2);
    expect(r.firstRejection?.index).toBe(2);
  });

  it("rejects mismatched lengths", () => {
    expect(() =>
      verifyBlock(
        [{ index: 0, claimId: "c", payload: null }],
        [
          { index: 0, admits: true, rationale: "" },
          { index: 1, admits: true, rationale: "" },
        ]
      )
    ).toThrow(/length differ/);
  });

  it("rejects non-contiguous indices", () => {
    expect(() =>
      verifyBlock(
        [
          { index: 0, claimId: "c0", payload: null },
          { index: 2, claimId: "c2", payload: null },
        ],
        [
          { index: 0, admits: true, rationale: "" },
          { index: 2, admits: true, rationale: "" },
        ]
      )
    ).toThrow(/contiguous/);
  });

  it("rejects empty input", () => {
    expect(() => verifyBlock([], [])).toThrow(/no candidates/);
  });

  it("zero prefix when first candidate is rejected", () => {
    const r = verifyBlock(
      [{ index: 0, claimId: "c0", payload: null }],
      [{ index: 0, admits: false, rationale: "bad" }]
    );
    expect(r.acceptedPrefix).toBe(0);
    expect(r.firstRejection?.index).toBe(0);
  });
});

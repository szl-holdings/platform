import { describe, it, expect } from "vitest";
import {
  propertySchema,
  distressSignalTypeSchema,
  distressSignalSchema,
  dealStageSchema,
  dealSchema,
  leadScoreSchema,
} from "./terra";

describe("propertySchema", () => {
  const valid = {
    id: 1,
    address: "100 Main St",
    createdAt: new Date(),
  };
  it("accepts a minimal property", () => {
    expect(propertySchema.parse(valid)).toBeTruthy();
  });
  it("rejects empty address", () => {
    expect(() => propertySchema.parse({ ...valid, address: "" })).toThrow();
  });
  it("rejects distressScore outside [0,100]", () => {
    expect(() =>
      propertySchema.parse({ ...valid, distressScore: 101 }),
    ).toThrow();
    expect(() =>
      propertySchema.parse({ ...valid, distressScore: -1 }),
    ).toThrow();
  });
  it("rejects lat outside [-90,90]", () => {
    expect(() => propertySchema.parse({ ...valid, lat: 91 })).toThrow();
  });
  it("rejects lon outside [-180,180]", () => {
    expect(() => propertySchema.parse({ ...valid, lon: -181 })).toThrow();
  });
});

describe("distressSignalTypeSchema", () => {
  it("accepts a known type", () => {
    expect(distressSignalTypeSchema.parse("foreclosure")).toBe("foreclosure");
  });
  it("rejects unknown type", () => {
    expect(() => distressSignalTypeSchema.parse("unicorn")).toThrow();
  });
});

describe("distressSignalSchema", () => {
  const valid = {
    id: 1,
    propertyId: 1,
    type: "tax_lien" as const,
    createdAt: new Date(),
  };
  it("accepts a minimal signal", () => {
    expect(distressSignalSchema.parse(valid)).toBeTruthy();
  });
  it("rejects negative liabilityAmount", () => {
    expect(() =>
      distressSignalSchema.parse({ ...valid, liabilityAmount: -1 }),
    ).toThrow();
  });
  it("rejects notes > 2048 chars", () => {
    expect(() =>
      distressSignalSchema.parse({ ...valid, notes: "x".repeat(2049) }),
    ).toThrow();
  });
});

describe("dealStageSchema", () => {
  it.each([
    "lead",
    "contacted",
    "qualified",
    "under_contract",
    "due_diligence",
    "closed",
    "lost",
  ] as const)("accepts %s", (s) => {
    expect(dealStageSchema.parse(s)).toBe(s);
  });
});

describe("dealSchema", () => {
  const valid = {
    id: 1,
    propertyId: 1,
    stage: "lead" as const,
    createdAt: new Date(),
  };
  it("accepts a minimal deal", () => {
    expect(dealSchema.parse(valid)).toBeTruthy();
  });
  it("rejects negative value", () => {
    expect(() => dealSchema.parse({ ...valid, value: -1 })).toThrow();
  });
  it("accepts a null closedAt", () => {
    expect(dealSchema.parse({ ...valid, closedAt: null }).closedAt).toBeNull();
  });
});

describe("leadScoreSchema", () => {
  const valid = {
    propertyId: 1,
    score: 50,
    confidence: 0.5,
    computedAt: new Date(),
  };
  it("accepts a valid lead score", () => {
    expect(leadScoreSchema.parse(valid)).toBeTruthy();
  });
  it("rejects score > 100", () => {
    expect(() => leadScoreSchema.parse({ ...valid, score: 101 })).toThrow();
  });
  it("rejects confidence outside [0,1]", () => {
    expect(() =>
      leadScoreSchema.parse({ ...valid, confidence: 1.1 }),
    ).toThrow();
  });
});

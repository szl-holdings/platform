import { describe, it, expect } from "vitest";
import {
  vesselSchema,
  vesselPositionSchema,
  voyageSchema,
  anomalySchema,
  sanctionsCheckSchema,
} from "./vessels";

describe("vesselSchema", () => {
  const valid = { id: 1, imo: "1234567", name: "Sea Star" };
  it("accepts a minimal vessel", () => {
    expect(vesselSchema.parse(valid)).toBeTruthy();
  });
  it("rejects IMO shorter or longer than 7 digits", () => {
    expect(() => vesselSchema.parse({ ...valid, imo: "123456" })).toThrow();
    expect(() => vesselSchema.parse({ ...valid, imo: "12345678" })).toThrow();
  });
  it("rejects non-numeric IMO", () => {
    expect(() => vesselSchema.parse({ ...valid, imo: "abcdefg" })).toThrow();
  });
  it("rejects flag of wrong length", () => {
    expect(() => vesselSchema.parse({ ...valid, flag: "USA" })).toThrow();
  });
  it("rejects buildYear < 1800", () => {
    expect(() =>
      vesselSchema.parse({ ...valid, buildYear: 1799 }),
    ).toThrow();
  });
  it("rejects buildYear far in the future", () => {
    expect(() =>
      vesselSchema.parse({ ...valid, buildYear: new Date().getFullYear() + 5 }),
    ).toThrow();
  });
  it("rejects empty name", () => {
    expect(() => vesselSchema.parse({ ...valid, name: "" })).toThrow();
  });
});

describe("vesselPositionSchema", () => {
  const valid = {
    vesselId: 1,
    lat: 0,
    lon: 0,
    timestamp: new Date(),
  };
  it("accepts a minimal position", () => {
    expect(vesselPositionSchema.parse(valid)).toBeTruthy();
  });
  it("rejects lat > 90", () => {
    expect(() => vesselPositionSchema.parse({ ...valid, lat: 91 })).toThrow();
  });
  it("rejects lon < -180", () => {
    expect(() =>
      vesselPositionSchema.parse({ ...valid, lon: -181 }),
    ).toThrow();
  });
  it("rejects heading > 360", () => {
    expect(() =>
      vesselPositionSchema.parse({ ...valid, heading: 361 }),
    ).toThrow();
  });
  it("rejects negative speed", () => {
    expect(() =>
      vesselPositionSchema.parse({ ...valid, speed: -1 }),
    ).toThrow();
  });
  it("rejects unknown source", () => {
    expect(() =>
      vesselPositionSchema.parse({ ...valid, source: "psychic" }),
    ).toThrow();
  });
});

describe("voyageSchema", () => {
  const valid = {
    id: 1,
    vesselId: 1,
    status: "underway" as const,
  };
  it("accepts a minimal voyage", () => {
    expect(voyageSchema.parse(valid)).toBeTruthy();
  });
  it("accepts null arrivedAt and etaAt", () => {
    const r = voyageSchema.parse({
      ...valid,
      arrivedAt: null,
      etaAt: null,
    });
    expect(r.arrivedAt).toBeNull();
  });
  it("rejects unknown status", () => {
    expect(() => voyageSchema.parse({ ...valid, status: "lost" })).toThrow();
  });
});

describe("anomalySchema", () => {
  const valid = {
    id: 1,
    vesselId: 1,
    type: "ais_gap" as const,
    severity: "high" as const,
    detectedAt: new Date(),
  };
  it("accepts a valid anomaly", () => {
    expect(anomalySchema.parse(valid)).toBeTruthy();
  });
  it("rejects unknown type", () => {
    expect(() => anomalySchema.parse({ ...valid, type: "ghost" })).toThrow();
  });
  it("rejects unknown severity", () => {
    expect(() =>
      anomalySchema.parse({ ...valid, severity: "scary" }),
    ).toThrow();
  });
});

describe("sanctionsCheckSchema", () => {
  const valid = {
    id: 1,
    vesselId: 1,
    listName: "OFAC",
    status: "clear" as const,
    checkedAt: new Date(),
  };
  it("accepts a minimal check", () => {
    expect(sanctionsCheckSchema.parse(valid)).toBeTruthy();
  });
  it("rejects unknown status", () => {
    expect(() =>
      sanctionsCheckSchema.parse({ ...valid, status: "yellow" }),
    ).toThrow();
  });
  it("rejects missing listName", () => {
    const { listName: _, ...rest } = valid;
    expect(() => sanctionsCheckSchema.parse(rest)).toThrow();
  });
});

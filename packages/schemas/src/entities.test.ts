import { describe, it, expect } from "vitest";
import {
  orgSchema,
  userSummarySchema,
  auditEventSchema,
  canonicalEntityTypeSchema,
  correlatedEventSchema,
} from "./entities";

describe("orgSchema", () => {
  const valid = {
    id: 1,
    name: "Acme",
    slug: "acme",
    createdAt: "2026-01-01T00:00:00Z",
  };
  it("accepts a minimal valid org", () => {
    const r = orgSchema.parse(valid);
    expect(r.createdAt).toBeInstanceOf(Date);
  });
  it("rejects slug shorter than 2 chars", () => {
    expect(() => orgSchema.parse({ ...valid, slug: "a" })).toThrow();
  });
  it("rejects unknown plan", () => {
    expect(() => orgSchema.parse({ ...valid, plan: "ultimate" })).toThrow();
  });
  it("rejects unknown status", () => {
    expect(() => orgSchema.parse({ ...valid, status: "frozen" })).toThrow();
  });
  it("accepts a null logoUrl", () => {
    expect(orgSchema.parse({ ...valid, logoUrl: null }).logoUrl).toBeNull();
  });
  it("rejects malformed logoUrl", () => {
    expect(() => orgSchema.parse({ ...valid, logoUrl: "not-url" })).toThrow();
  });
  it("rejects non-positive id", () => {
    expect(() => orgSchema.parse({ ...valid, id: 0 })).toThrow();
  });
});

describe("userSummarySchema", () => {
  it("accepts minimal user", () => {
    expect(
      userSummarySchema.parse({
        id: 1,
        email: "u@e.com",
        displayName: "U",
      }),
    ).toBeTruthy();
  });
  it("rejects bad email", () => {
    expect(() =>
      userSummarySchema.parse({
        id: 1,
        email: "no-at",
        displayName: "U",
      }),
    ).toThrow();
  });
});

describe("auditEventSchema", () => {
  const valid = {
    id: 1,
    actionType: "create",
    entityType: "vessel",
    createdAt: new Date(),
  };
  it("accepts a minimal event", () => {
    expect(auditEventSchema.parse(valid)).toBeTruthy();
  });
  it("accepts null actorUserId", () => {
    expect(
      auditEventSchema.parse({ ...valid, actorUserId: null }).actorUserId,
    ).toBeNull();
  });
  it("rejects missing actionType", () => {
    const { actionType: _, ...rest } = valid;
    expect(() => auditEventSchema.parse(rest)).toThrow();
  });
  it("accepts null payloadJson", () => {
    expect(
      auditEventSchema.parse({ ...valid, payloadJson: null }).payloadJson,
    ).toBeNull();
  });
});

describe("canonicalEntityTypeSchema", () => {
  it("accepts known entity types", () => {
    expect(canonicalEntityTypeSchema.parse("vessel")).toBe("vessel");
    expect(canonicalEntityTypeSchema.parse("organization")).toBe(
      "organization",
    );
  });
  it("rejects unknown type", () => {
    expect(() => canonicalEntityTypeSchema.parse("dragon")).toThrow();
  });
});

describe("correlatedEventSchema", () => {
  const validUuid = "11111111-1111-4111-8111-111111111111";
  it("accepts a valid uuid correlationId", () => {
    expect(
      correlatedEventSchema.parse({
        correlationId: validUuid,
        eventType: "x",
        timestamp: new Date(),
      }),
    ).toBeTruthy();
  });
  it("rejects non-uuid correlationId", () => {
    expect(() =>
      correlatedEventSchema.parse({
        correlationId: "not-a-uuid",
        eventType: "x",
        timestamp: new Date(),
      }),
    ).toThrow();
  });
  it("rejects missing eventType", () => {
    expect(() =>
      correlatedEventSchema.parse({
        correlationId: validUuid,
        timestamp: new Date(),
      }),
    ).toThrow();
  });
});

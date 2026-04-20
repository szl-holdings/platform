import { describe, it, expect } from "vitest";
import {
  aiDomainSchema,
  riskLevelSchema,
  chatBodySchema,
  analyzeBodySchema,
  recommendBodySchema,
  traceListQuerySchema,
  traceStatusPatchSchema,
  traceFeedbackBodySchema,
  reviewQueueListQuerySchema,
  reviewDecisionBodySchema,
  traceCapturBodySchema,
} from "./ai";

describe("aiDomainSchema", () => {
  it.each([
    "aegis",
    "terra",
    "vessels",
    "prism_counsel",
    "alloy",
    "lyte",
    "cortex",
    "global",
  ] as const)("accepts %s", (d) => {
    expect(aiDomainSchema.parse(d)).toBe(d);
  });
  it("rejects unknown domain", () => {
    expect(() => aiDomainSchema.parse("rogue")).toThrow();
  });
});

describe("riskLevelSchema", () => {
  it("accepts the four levels", () => {
    expect(riskLevelSchema.parse("low")).toBe("low");
    expect(riskLevelSchema.parse("critical")).toBe("critical");
  });
  it("rejects unknown level", () => {
    expect(() => riskLevelSchema.parse("severe")).toThrow();
  });
});

describe("chatBodySchema", () => {
  it("accepts a minimal message", () => {
    expect(chatBodySchema.parse({ message: "hi" })).toBeTruthy();
  });
  it("rejects empty message", () => {
    expect(() => chatBodySchema.parse({ message: "" })).toThrow();
  });
  it("rejects message > 32768 chars", () => {
    expect(() =>
      chatBodySchema.parse({ message: "x".repeat(32769) }),
    ).toThrow();
  });
  it("rejects systemPrompt > 8192 chars", () => {
    expect(() =>
      chatBodySchema.parse({ message: "x", systemPrompt: "y".repeat(8193) }),
    ).toThrow();
  });
  it("rejects unknown domain", () => {
    expect(() =>
      chatBodySchema.parse({ message: "x", domain: "bogus" }),
    ).toThrow();
  });
});

describe("analyzeBodySchema", () => {
  it("accepts valid input", () => {
    expect(
      analyzeBodySchema.parse({ content: "x", analysisType: "sentiment" }),
    ).toBeTruthy();
  });
  it("rejects empty content", () => {
    expect(() =>
      analyzeBodySchema.parse({ content: "", analysisType: "x" }),
    ).toThrow();
  });
  it("rejects content > 65536 chars", () => {
    expect(() =>
      analyzeBodySchema.parse({
        content: "x".repeat(65537),
        analysisType: "x",
      }),
    ).toThrow();
  });
  it("rejects analysisType > 64 chars", () => {
    expect(() =>
      analyzeBodySchema.parse({ content: "x", analysisType: "y".repeat(65) }),
    ).toThrow();
  });
});

describe("recommendBodySchema", () => {
  it("accepts a string entityId", () => {
    expect(
      recommendBodySchema.parse({ entityType: "vessel", entityId: "abc" }),
    ).toBeTruthy();
  });
  it("accepts a number entityId", () => {
    expect(
      recommendBodySchema.parse({ entityType: "vessel", entityId: 12 }),
    ).toBeTruthy();
  });
  it("rejects missing entityType", () => {
    expect(() => recommendBodySchema.parse({ entityId: 1 })).toThrow();
  });
});

describe("traceListQuerySchema", () => {
  it("transforms requiresReview=true to boolean", () => {
    const r = traceListQuerySchema.parse({ requiresReview: "true" });
    expect(r.requiresReview).toBe(true);
  });
  it("transforms requiresReview=false to boolean", () => {
    const r = traceListQuerySchema.parse({ requiresReview: "false" });
    expect(r.requiresReview).toBe(false);
  });
  it("leaves other requiresReview values undefined", () => {
    const r = traceListQuerySchema.parse({ requiresReview: "maybe" });
    expect(r.requiresReview).toBeUndefined();
  });
  it("validates riskLevel enum", () => {
    expect(() =>
      traceListQuerySchema.parse({ riskLevel: "extreme" }),
    ).toThrow();
  });
  it("coerces orgId", () => {
    expect(traceListQuerySchema.parse({ orgId: "9" }).orgId).toBe(9);
  });
});

describe("traceStatusPatchSchema", () => {
  it.each([
    "pending",
    "evaluated",
    "reviewed",
    "flagged",
    "archived",
  ] as const)("accepts %s", (s) => {
    expect(traceStatusPatchSchema.parse({ status: s }).status).toBe(s);
  });
  it("rejects unknown status", () => {
    expect(() => traceStatusPatchSchema.parse({ status: "x" })).toThrow();
  });
});

describe("traceFeedbackBodySchema", () => {
  it("accepts up/down sentiment", () => {
    expect(traceFeedbackBodySchema.parse({ sentiment: "up" })).toBeTruthy();
    expect(traceFeedbackBodySchema.parse({ sentiment: "down" })).toBeTruthy();
  });
  it("rejects unknown sentiment", () => {
    expect(() =>
      traceFeedbackBodySchema.parse({ sentiment: "neutral" }),
    ).toThrow();
  });
  it("rejects correction > 4096 chars", () => {
    expect(() =>
      traceFeedbackBodySchema.parse({
        sentiment: "up",
        correction: "x".repeat(4097),
      }),
    ).toThrow();
  });
  it("rejects comment > 2048 chars", () => {
    expect(() =>
      traceFeedbackBodySchema.parse({
        sentiment: "up",
        comment: "x".repeat(2049),
      }),
    ).toThrow();
  });
});

describe("reviewQueueListQuerySchema", () => {
  it("accepts valid filters", () => {
    const r = reviewQueueListQuerySchema.parse({
      status: "in_review",
      priority: "high",
      verdict: "approved",
    });
    expect(r.status).toBe("in_review");
  });
  it("rejects unknown status", () => {
    expect(() =>
      reviewQueueListQuerySchema.parse({ status: "started" }),
    ).toThrow();
  });
  it("rejects unknown verdict", () => {
    expect(() =>
      reviewQueueListQuerySchema.parse({ verdict: "maybe" }),
    ).toThrow();
  });
});

describe("reviewDecisionBodySchema", () => {
  it("requires a verdict", () => {
    expect(() => reviewDecisionBodySchema.parse({})).toThrow();
  });
  it("accepts a verdict + optional comment", () => {
    expect(
      reviewDecisionBodySchema.parse({
        verdict: "approved",
        comment: "ok",
      }),
    ).toBeTruthy();
  });
});

describe("traceCapturBodySchema", () => {
  const valid = {
    model: "gpt-4o",
    modelProvider: "openai",
    domain: "alloy" as const,
    promptTokens: 10,
    completionTokens: 20,
    latencyMs: 100,
    costEstimateUsd: 0.001,
  };
  it("accepts a minimal valid trace", () => {
    expect(traceCapturBodySchema.parse(valid)).toBeTruthy();
  });
  it("rejects negative tokens", () => {
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, promptTokens: -1 }),
    ).toThrow();
  });
  it("rejects non-integer tokens", () => {
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, completionTokens: 1.5 }),
    ).toThrow();
  });
  it("rejects negative latencyMs", () => {
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, latencyMs: -1 }),
    ).toThrow();
  });
  it("rejects confidence outside [0,1]", () => {
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, confidence: 1.1 }),
    ).toThrow();
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, confidence: -0.1 }),
    ).toThrow();
  });
  it("rejects negative cost", () => {
    expect(() =>
      traceCapturBodySchema.parse({ ...valid, costEstimateUsd: -0.5 }),
    ).toThrow();
  });
});

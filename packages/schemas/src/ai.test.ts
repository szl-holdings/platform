import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  aiTraceSchema,
  toolCallSchema,
  llmStructuredOutputSchema,
  aiOpsMetricSchema,
} from "./ai";

describe("aiTraceSchema", () => {
  const valid = {
    traceId: "t1",
    model: "gpt-4o",
    modelProvider: "openai",
    promptTokens: 10,
    completionTokens: 20,
    latencyMs: 100,
    costEstimateUsd: 0.001,
    capturedAt: new Date(),
  };
  it("accepts a minimal trace", () => {
    expect(aiTraceSchema.parse(valid)).toBeTruthy();
  });
  it("rejects empty traceId", () => {
    expect(() => aiTraceSchema.parse({ ...valid, traceId: "" })).toThrow();
  });
  it("rejects negative tokens", () => {
    expect(() =>
      aiTraceSchema.parse({ ...valid, promptTokens: -1 }),
    ).toThrow();
  });
  it("rejects negative latency / cost", () => {
    expect(() =>
      aiTraceSchema.parse({ ...valid, latencyMs: -1 }),
    ).toThrow();
    expect(() =>
      aiTraceSchema.parse({ ...valid, costEstimateUsd: -0.01 }),
    ).toThrow();
  });
  it("rejects confidence > 1", () => {
    expect(() =>
      aiTraceSchema.parse({ ...valid, confidence: 1.1 }),
    ).toThrow();
  });
  it("rejects unknown routeClass", () => {
    expect(() =>
      aiTraceSchema.parse({ ...valid, routeClass: "premium" }),
    ).toThrow();
  });
  it("rejects unknown riskLevel", () => {
    expect(() =>
      aiTraceSchema.parse({ ...valid, riskLevel: "extreme" }),
    ).toThrow();
  });
  it("rejects evalScore > 1", () => {
    expect(() => aiTraceSchema.parse({ ...valid, evalScore: 2 })).toThrow();
  });
});

describe("toolCallSchema", () => {
  const valid = {
    toolName: "search",
    success: true,
    invokedAt: new Date(),
  };
  it("accepts a minimal tool call", () => {
    expect(toolCallSchema.parse(valid)).toBeTruthy();
  });
  it("rejects empty toolName", () => {
    expect(() => toolCallSchema.parse({ ...valid, toolName: "" })).toThrow();
  });
  it("rejects negative durationMs", () => {
    expect(() =>
      toolCallSchema.parse({ ...valid, durationMs: -1 }),
    ).toThrow();
  });
  it("requires success boolean", () => {
    const { success: _, ...rest } = valid;
    expect(() => toolCallSchema.parse(rest)).toThrow();
  });
});

describe("llmStructuredOutputSchema", () => {
  const inner = z.object({ answer: z.string() });
  const schema = llmStructuredOutputSchema(inner);

  it("validates the wrapped content", () => {
    const r = schema.parse({ content: { answer: "yes" } });
    expect(r.content.answer).toBe("yes");
  });
  it("rejects content that fails inner schema", () => {
    expect(() => schema.parse({ content: { answer: 1 } })).toThrow();
  });
  it("rejects confidence > 1", () => {
    expect(() =>
      schema.parse({ content: { answer: "x" }, confidence: 1.5 }),
    ).toThrow();
  });
  it("rejects negative token counts", () => {
    expect(() =>
      schema.parse({
        content: { answer: "x" },
        promptTokens: -1,
      }),
    ).toThrow();
  });
});

describe("aiOpsMetricSchema", () => {
  const valid = {
    totalTraces: 100,
    reviewRequired: 5,
    reviewRate: 0.05,
    avgLatencyMs: 200,
    p50LatencyMs: 150,
    p95LatencyMs: 500,
    totalCostUsd: 1.23,
  };
  it("accepts a minimal metric", () => {
    expect(aiOpsMetricSchema.parse(valid)).toBeTruthy();
  });
  it("rejects reviewRate > 1", () => {
    expect(() =>
      aiOpsMetricSchema.parse({ ...valid, reviewRate: 1.1 }),
    ).toThrow();
  });
  it("rejects negative totals", () => {
    expect(() =>
      aiOpsMetricSchema.parse({ ...valid, totalTraces: -1 }),
    ).toThrow();
    expect(() =>
      aiOpsMetricSchema.parse({ ...valid, totalCostUsd: -0.01 }),
    ).toThrow();
  });
  it("rejects evalPassRate outside [0,1]", () => {
    expect(() =>
      aiOpsMetricSchema.parse({ ...valid, evalPassRate: 1.5 }),
    ).toThrow();
  });
  it("rejects non-integer counts", () => {
    expect(() =>
      aiOpsMetricSchema.parse({ ...valid, totalTraces: 1.5 }),
    ).toThrow();
  });
});

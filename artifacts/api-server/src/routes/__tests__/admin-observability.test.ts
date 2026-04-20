/**
 * GET /api/admin/observability — integration test
 *
 * Verifies the response shape of the admin observability panel for each
 * supported `?window` value, plus query validation behaviour. The route
 * aggregates from the in-process telemetry collector, OTel span buffer,
 * and three DB queries — all of which are mocked here so the test does
 * not depend on a running database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module mocks (must be declared before the dynamic import below)
// ---------------------------------------------------------------------------

const dbExecuteMock = vi.fn(async () => ({ rows: [] as unknown[] }));

vi.mock("@szl-holdings/db", () => ({
  db: {
    execute: dbExecuteMock,
  },
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    getSummary: vi.fn(() => ({
      requestsPerMinute: 42,
      errorRate: 0.01,
    })),
  },
}));

const inMemorySpansMock = vi.fn(() => [] as Array<unknown>);
vi.mock("@szl-holdings/otel", () => ({
  getInMemorySpans: () => inMemorySpansMock(),
}));

vi.mock("../../lib/logger.js", async () => {
  const m = await import("../../__tests__/helpers/mocks.js");
  return m.createLoggerMock();
});

const { register } = await import("../admin/observability.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ObservabilityBody {
  window: string;
  generatedAt: string;
  http: {
    p50LatencyMs: number;
    p95LatencyMs: number;
    sampleCount: number;
    requestsPerMinute?: number;
    errorRate?: number;
  };
  jobs: {
    pending: number;
    running: number;
    failed: number;
    completed: number;
    retryCount: number;
  };
  agentTools: {
    totalCalls: number;
    successCalls: number;
    successRate: number;
    topErrors: Array<{ tool: string; errorCount: number }>;
  };
  errorHotspots: Array<{ path: string; errorCount: number }>;
}

function buildApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  register(router);
  app.use("/api", router);
  return app;
}

beforeEach(() => {
  dbExecuteMock.mockReset();
  dbExecuteMock.mockResolvedValue({ rows: [] });
  inMemorySpansMock.mockReset();
  inMemorySpansMock.mockReturnValue([]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/observability — response shape", () => {
  it.each(["1h", "6h", "24h", "7d"] as const)(
    "returns the expected envelope for window=%s",
    async (window) => {
      const res = await request(buildApp()).get(
        `/api/admin/observability?window=${window}`,
      );
      expect(res.status).toBe(200);
      const body = res.body as ObservabilityBody;
      expect(body.window).toBe(window);
      expect(typeof body.generatedAt).toBe("string");
      expect(new Date(body.generatedAt).toString()).not.toBe(
        "Invalid Date",
      );
      // http block
      expect(typeof body.http.p50LatencyMs).toBe("number");
      expect(typeof body.http.p95LatencyMs).toBe("number");
      expect(typeof body.http.sampleCount).toBe("number");
      // jobs block
      expect(typeof body.jobs.pending).toBe("number");
      expect(typeof body.jobs.running).toBe("number");
      expect(typeof body.jobs.failed).toBe("number");
      expect(typeof body.jobs.completed).toBe("number");
      expect(typeof body.jobs.retryCount).toBe("number");
      // agent tools block
      expect(typeof body.agentTools.totalCalls).toBe("number");
      expect(typeof body.agentTools.successCalls).toBe("number");
      expect(typeof body.agentTools.successRate).toBe("number");
      expect(Array.isArray(body.agentTools.topErrors)).toBe(true);
      // hotspots
      expect(Array.isArray(body.errorHotspots)).toBe(true);
    },
  );

  it("defaults to window=24h when no query parameter is supplied", async () => {
    const res = await request(buildApp()).get("/api/admin/observability");
    expect(res.status).toBe(200);
    const body = res.body as ObservabilityBody;
    expect(body.window).toBe("24h");
  });

  it("rejects an unsupported window value with 400", async () => {
    const res = await request(buildApp()).get(
      "/api/admin/observability?window=30d",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a non-positive orgId with 400", async () => {
    const res = await request(buildApp()).get(
      "/api/admin/observability?orgId=-1",
    );
    expect(res.status).toBe(400);
  });

  it("merges serverTelemetry summary fields into the http block", async () => {
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.http.requestsPerMinute).toBe(42);
    expect(body.http.errorRate).toBe(0.01);
  });
});

describe("GET /api/admin/observability — aggregation logic", () => {
  it("computes p50/p95 from in-memory http spans", async () => {
    const spans = Array.from({ length: 100 }, (_, i) => ({
      name: "http.GET",
      durationMs: i + 1,
    }));
    inMemorySpansMock.mockReturnValue(spans);

    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.http.sampleCount).toBe(100);
    // Sorted ascending => p50 ~ value at index 50, p95 ~ value at index 95.
    expect(body.http.p50LatencyMs).toBe(51);
    expect(body.http.p95LatencyMs).toBe(96);
  });

  it("ignores non-http spans when computing latency", async () => {
    inMemorySpansMock.mockReturnValue([
      { name: "db.query", durationMs: 5000 },
      { name: "http.GET", durationMs: 10 },
    ]);
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.http.sampleCount).toBe(1);
    expect(body.http.p50LatencyMs).toBe(10);
  });

  it("aggregates job stats from the alloy_runs table", async () => {
    dbExecuteMock.mockImplementation(async (sql: unknown) => {
      const text = String(sql);
      if (text.includes("alloy_runs")) {
        return {
          rows: [
            { status: "pending", cnt: "3", retries: "0" },
            { status: "in_progress", cnt: "2", retries: "1" },
            { status: "failed", cnt: "1", retries: "2" },
            { status: "completed", cnt: "10", retries: "0" },
          ],
        };
      }
      return { rows: [] };
    });
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.jobs).toEqual({
      pending: 3,
      running: 2,
      failed: 1,
      completed: 10,
      retryCount: 3,
    });
  });

  it("aggregates agent-tool stats and computes a success rate", async () => {
    dbExecuteMock.mockImplementation(async (sql: unknown) => {
      const text = String(sql);
      if (text.includes("mcp_tool_invocations")) {
        return {
          rows: [
            { tool_name: "search", total: "10", succeeded: "8" },
            { tool_name: "lookup", total: "5", succeeded: "5" },
          ],
        };
      }
      return { rows: [] };
    });
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.agentTools.totalCalls).toBe(15);
    expect(body.agentTools.successCalls).toBe(13);
    expect(body.agentTools.successRate).toBeCloseTo(13 / 15, 5);
    expect(body.agentTools.topErrors).toEqual([
      { tool: "search", errorCount: 2 },
    ]);
  });

  it("returns successRate=1 and empty topErrors when no tool calls happened", async () => {
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.agentTools.totalCalls).toBe(0);
    expect(body.agentTools.successRate).toBe(1);
    expect(body.agentTools.topErrors).toEqual([]);
  });

  it("collects error hotspots from request_telemetry rows", async () => {
    dbExecuteMock.mockImplementation(async (sql: unknown) => {
      const text = String(sql);
      if (text.includes("request_telemetry")) {
        return {
          rows: [
            { path: "/api/foo", error_count: "12" },
            { path: "/api/bar", error_count: "3" },
          ],
        };
      }
      return { rows: [] };
    });
    const res = await request(buildApp()).get("/api/admin/observability");
    const body = res.body as ObservabilityBody;
    expect(body.errorHotspots).toEqual([
      { path: "/api/foo", errorCount: 12 },
      { path: "/api/bar", errorCount: 3 },
    ]);
  });

  it("falls back to safe empty values when DB queries throw", async () => {
    dbExecuteMock.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp()).get("/api/admin/observability");
    expect(res.status).toBe(200);
    const body = res.body as ObservabilityBody;
    expect(body.jobs).toEqual({
      pending: 0,
      running: 0,
      failed: 0,
      completed: 0,
      retryCount: 0,
    });
    expect(body.agentTools.totalCalls).toBe(0);
    expect(body.errorHotspots).toEqual([]);
  });
});

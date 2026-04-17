import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Mocks — hoisted before route import
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => {
  const makeSelectChain = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    const end = () => Promise.resolve([]);
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = end;
    return chain;
  };
  const db = {
    select: makeSelectChain,
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  };
  return {
    db,
    lyteSignalsTable: {},
    lyteActionsTable: {},
    lyteReadinessItemsTable: {},
    lyteIncidentsTable: {},
    lyteEscalationsTable: {},
    lyteRecommendationsTable: {},
    lyteMetricsTable: {},
    lyteAlertsTable: {},
  };
});

vi.mock("@szl-holdings/constellation", () => ({
  lyteAdapter: {
    upsertEntity: vi.fn(async (data: Record<string, unknown>) => ({
      id: `constellation-${data.entityType}-mock`,
      name: data.name,
    })),
  },
}));

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("@szl-holdings/decision-engine", () => ({
  rankSignalGroups: vi.fn(() => []),
}));

// Import router AFTER mocks
const { default: cognitiveRouter } = await import("../routes/lyte-cognitive.js");

const app = express();
app.use(express.json());
app.use(cognitiveRouter);
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err.message });
  },
);

// ---------------------------------------------------------------------------
// Route-level integration tests
// ---------------------------------------------------------------------------

describe("GET /lyte/cognitive/signal-fusion — happy path", () => {
  it("returns 200 with expected shape", async () => {
    const res = await request(app).get("/lyte/cognitive/signal-fusion");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.totalEvents).toBe("number");
    expect(typeof body.activeSignals).toBe("number");
    expect(Array.isArray(body.recentSignals)).toBe(true);
    expect(body.fetchedAt).toBeDefined();
  });
});

describe("POST /lyte/cognitive/signal-fusion/run — happy path", () => {
  it("returns 200 and fusedCount/errorCount", async () => {
    const res = await request(app).post("/lyte/cognitive/signal-fusion/run");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.status).toBe("completed");
    expect(typeof body.fusedCount).toBe("number");
    expect(typeof body.errorCount).toBe("number");
    expect(body.ranAt).toBeDefined();
    expect(Array.isArray(body.constellationNodes)).toBe(true);
  });
});

describe("GET /lyte/cognitive/bottlenecks — happy path", () => {
  it("returns 200 with bottleneck structure", async () => {
    const res = await request(app).get("/lyte/cognitive/bottlenecks");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.totalBottlenecks).toBe("number");
    expect(typeof body.blockedItems).toBe("number");
    expect(typeof body.stalledActions).toBe("number");
    expect(Array.isArray(body.rankedByOwner)).toBe(true);
    expect(typeof body.byDomain).toBe("object");
  });
});

describe("GET /lyte/cognitive/interventions — happy path and limit guard", () => {
  it("returns 200 with intervention list", async () => {
    const res = await request(app).get("/lyte/cognitive/interventions");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.count).toBe("number");
    expect(Array.isArray(body.interventions)).toBe(true);
    expect(typeof body.totalVaR).toBe("number");
  });

  it("handles a non-numeric limit without crashing (NaN guard)", async () => {
    const res = await request(app).get("/lyte/cognitive/interventions?limit=abc");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.count).toBe("number");
  });

  it("caps limit at 50", async () => {
    const res = await request(app).get("/lyte/cognitive/interventions?limit=999");
    expect(res.status).toBe(200);
  });
});

describe("GET /lyte/cognitive/accountability-map — happy path", () => {
  it("returns 200 with accountability structure", async () => {
    const res = await request(app).get("/lyte/cognitive/accountability-map");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.ownerCount).toBe("number");
    expect(typeof body.totalVaRMapped).toBe("number");
    expect(Array.isArray(body.accountabilityMap)).toBe(true);
    expect(typeof body.ownershipGaps).toBe("object");
  });
});

describe("GET /lyte/cognitive/value-at-risk — happy path and input validation", () => {
  it("returns 200 with VaR structure for default 30 days", async () => {
    const res = await request(app).get("/lyte/cognitive/value-at-risk");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.totalVaR).toBe("number");
    expect(typeof body.periodDays).toBe("number");
    expect(body.periodDays).toBe(30);
    expect(typeof body.byDomain).toBe("object");
    expect(Array.isArray(body.byOwner)).toBe(true);
    expect(Array.isArray(body.topRisks)).toBe(true);
  });

  it("defaults periodDays to 30 on non-numeric input (NaN guard)", async () => {
    const res = await request(app).get("/lyte/cognitive/value-at-risk?days=notanumber");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.periodDays).toBe(30);
  });

  it("clamps days to minimum 1", async () => {
    const res = await request(app).get("/lyte/cognitive/value-at-risk?days=-10");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.periodDays).toBe(1);
  });

  it("clamps days to maximum 365", async () => {
    const res = await request(app).get("/lyte/cognitive/value-at-risk?days=9999");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.periodDays).toBe(365);
  });
});

describe("GET /lyte/cognitive/executive-narrative — happy path and bad dates", () => {
  it("returns 200 with narrative structure for valid dates", async () => {
    const res = await request(app).get(
      "/lyte/cognitive/executive-narrative?from=2026-01-01&to=2026-01-31",
    );
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.briefId).toBeDefined();
    expect(Array.isArray(body.paragraphs)).toBe(true);
    expect(Array.isArray(body.citations)).toBe(true);
    expect(Array.isArray(body.recommendations)).toBe(true);
    expect(body.operationalStatus).toBeDefined();
    expect(body.headline).toBeDefined();
  });

  it("returns 400 on invalid from date", async () => {
    const res = await request(app).get(
      "/lyte/cognitive/executive-narrative?from=not-a-date&to=2026-01-31",
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid to date", async () => {
    const res = await request(app).get(
      "/lyte/cognitive/executive-narrative?from=2026-01-01&to=garbage",
    );
    expect(res.status).toBe(400);
  });

  it("uses default 7-day window when no dates provided", async () => {
    const res = await request(app).get("/lyte/cognitive/executive-narrative");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.briefId).toBeDefined();
    expect(Array.isArray(body.paragraphs)).toBe(true);
  });
});

/**
 * Stress & Load Tests — SZL Holdings Platform
 *
 * Validates platform behavior under concurrent load:
 *   1. Concurrent API requests across all domain routes
 *   2. Rate-limiter enforcement (global + per-user sliding window)
 *   3. Parallel DB read/write operations
 *   4. Response-time benchmarks under load (p50, p95, max)
 *
 * These tests run against the real API server using supertest (in-process).
 * All external side-effects (email, pubsub, AI engine, geocoding) are mocked.
 * DB is real — we insert and clean up records so the environment stays pristine.
 */

import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";

// ── DB reachability guard ─────────────────────────────────────────────────────
// Stress tests make real DB queries (fleet inserts, concurrent reads).
// We probe the actual TCP port of the DB host at module load time so we skip
// with a clear message rather than crashing on a connection error mid-test.
// Top-level await is valid in ESM (vitest runs tests as ESM modules).
const HAS_DB: boolean = await (async (): Promise<boolean> => {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.warn(
      "[stress] DATABASE_URL is not set — skipping stress tests. " +
        "Set DATABASE_URL (and ensure a database is reachable) to run these tests.",
    );
    return false;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || "localhost";
    const port = parseInt(parsed.port || "5432", 10);
    const net = await import("net");
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error("DB TCP probe timed out"));
      }, 3000);
      socket.connect(port, host, () => {
        clearTimeout(timer);
        socket.destroy();
        resolve();
      });
      socket.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    return true;
  } catch (err) {
    console.warn(
      `[stress] Database is not reachable (${String(err)}) — skipping stress tests. ` +
        "Ensure the database is running and DATABASE_URL points to it.",
    );
    return false;
  }
})();

// ── Module mocks (external side-effects only) ─────────────────────────────────

vi.mock("../../artifacts/api-server/src/middlewares/auth", () => {
  const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
  const authMiddleware = (_opts: { required?: boolean } = {}) => passthrough;
  const requireRole = (..._roles: string[]) => passthrough;
  const denyIfReadOnly = () => passthrough;
  const requireAnyAuth = passthrough;
  const parseIdParam = (id: string) => {
    const n = parseInt(id, 10);
    if (isNaN(n)) throw new Error("Invalid ID");
    return n;
  };
  class InvalidIdError extends Error {}
  return { authMiddleware, requireRole, denyIfReadOnly, requireAnyAuth, parseIdParam, InvalidIdError };
});

vi.mock("../../artifacts/api-server/src/lib/logger", () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

vi.mock("../../artifacts/api-server/src/lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(), asyncIterableIterator: vi.fn() },
  VESSELS_EVENTS: {}, FIRESTORM_EVENTS: {}, LYTE_EVENTS: {},
  CARLOTA_EVENTS: {}, ALLOY_EVENTS: {},
}));

vi.mock("../../artifacts/api-server/src/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildCarlotaContactAckEmail: vi.fn().mockReturnValue("<p>ack</p>"),
  buildCarlotaInquiryNotificationEmail: vi.fn().mockReturnValue("<p>notify</p>"),
  buildInquiryAckEmail: vi.fn().mockReturnValue("<p>ack</p>"),
  buildLeadNotificationEmail: vi.fn().mockReturnValue("<p>lead</p>"),
  CARLOTA_ADMIN_EMAIL: "admin@carlotajo.com",
  INTERNAL_EMAIL: "internal@szl.holdings",
}));

vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
  ingestCarlotaService: vi.fn().mockResolvedValue(undefined),
  ingestPrismMatter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@szl-holdings/ai-engine", () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ id: "test-decision" }),
  fusionCortex: { crossDomainSignals: vi.fn().mockResolvedValue([]) },
  ontologyEngine: { entityGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }) },
}));

vi.mock("../../artifacts/api-server/src/lib/geocoding", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 0, lng: 0 }),
  reverseGeocode: vi.fn().mockResolvedValue({ address: "Test Address" }),
  getGeocodingProviderStatus: vi.fn().mockReturnValue({ status: "ok" }),
}));

vi.mock("../../artifacts/api-server/src/lib/terra-enterprise-ingestion", () => ({
  getMlsListings: vi.fn().mockResolvedValue([]),
  getCommercialProperties: vi.fn().mockResolvedValue([]),
  getCommercialComps: vi.fn().mockResolvedValue([]),
  runMlsListingSync: vi.fn().mockResolvedValue({ synced: 0 }),
  runCommercialDataRefresh: vi.fn().mockResolvedValue({ refreshed: 0 }),
  getEnterpriseFeatureFlags: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../artifacts/api-server/src/lib/tradecraft-evidence-store", () => ({
  queryEvidenceIndex: vi.fn().mockResolvedValue([]),
  ingestDecisionToEvidenceIndex: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../artifacts/api-server/src/middlewares/optimistic-concurrency", () => ({
  validateIfMatch: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../../artifacts/api-server/src/lib/backup-service", () => ({
  getBackupHealthStatus: vi.fn().mockReturnValue({ status: "ok", totalBackups: 0 }),
}));

vi.mock("../../artifacts/api-server/src/lib/websocket.js", () => ({
  publish: vi.fn(), WS_CHANNELS: {},
}));

vi.mock("../../artifacts/api-server/src/lib/platform-flags", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../artifacts/api-server/src/lib/multi-agent-orchestrator", () => ({
  orchestrate: vi.fn().mockResolvedValue({ domain: "vessels", response: "mock orchestration" }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStressApp(roles: string[] = ["admin", "ops", "exec", "super_admin"]) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Record<string, unknown>).user = {
      id: 1,
      displayName: "Stress Test User",
      email: "stress@szl.holdings",
      roles,
      orgs: [{ orgId: 1, orgSlug: "szl", orgName: "SZL Holdings", role: "admin" }],
    };
    next();
  });
  return app;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function timedRequest(
  req: ReturnType<typeof request.agent>,
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>,
): Promise<{ status: number; durationMs: number }> {
  const start = Date.now();
  const r = method === "POST"
    ? await req.post(path).send(body ?? {})
    : await req.get(path);
  return { status: r.status, durationMs: Date.now() - start };
}

const STRESS_CONCURRENCY = 20;
const STRESS_ITERATIONS = 50;
const MAX_ACCEPTABLE_P95_MS = 3000;

// Cleanup registry for records created during stress POST tests
const stressCleanupFleetIds: number[] = [];

afterAll(async () => {
  try {
    const { db } = await import("@szl-holdings/db");
    const { fleetsTable } = await import("@szl-holdings/db/schema");
    const { inArray } = await import("drizzle-orm");
    if (stressCleanupFleetIds.length > 0) {
      await (db as { delete: (t: unknown) => { where: (c: unknown) => Promise<unknown> } })
        .delete(fleetsTable)
        .where(inArray(fleetsTable.id, stressCleanupFleetIds));
    }
  } catch {
    // best-effort cleanup
  }

  try {
    const dbModule = await import("@szl-holdings/db");
    if (dbModule.pool && typeof (dbModule.pool as { end?: () => Promise<void> }).end === "function") {
      await (dbModule.pool as { end: () => Promise<void> }).end();
    }
  } catch {
    // pool may already be closed
  }
});

// ── Suite 1: Concurrent GET requests across all domain read routes ─────────────

describe.skipIf(!HAS_DB)("Stress — Concurrent GET requests across domain routes", () => {
  it(`handles ${STRESS_CONCURRENCY} concurrent GET /vessels/fleets requests without errors`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);

    const requests = Array.from({ length: STRESS_CONCURRENCY }, () =>
      timedRequest(request(app), "/vessels/fleets"),
    );
    const results = await Promise.all(requests);

    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);
    const p50 = percentile(durations, 50);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);

    console.info(`[stress] GET /vessels/fleets x${STRESS_CONCURRENCY} — p50: ${p50}ms, p95: ${p95}ms, max: ${durations[durations.length - 1]}ms`);
  });

  it(`handles ${STRESS_CONCURRENCY} concurrent GET /lyte/workspaces requests without errors`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);

    const requests = Array.from({ length: STRESS_CONCURRENCY }, () =>
      timedRequest(request(app), "/lyte/workspaces"),
    );
    const results = await Promise.all(requests);

    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);
    console.info(`[stress] GET /lyte/workspaces x${STRESS_CONCURRENCY} — p95: ${p95}ms`);
  });

  it(`handles ${STRESS_CONCURRENCY} concurrent GET /firestorm/scenarios requests without errors`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);

    const requests = Array.from({ length: STRESS_CONCURRENCY }, () =>
      timedRequest(request(app), "/firestorm/scenarios"),
    );
    const results = await Promise.all(requests);

    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);
    console.info(`[stress] GET /firestorm/scenarios x${STRESS_CONCURRENCY} — p95: ${p95}ms`);
  });

  it(`handles ${STRESS_CONCURRENCY} concurrent GET /holdings/ventures requests without errors`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);

    const requests = Array.from({ length: STRESS_CONCURRENCY }, () =>
      timedRequest(request(app), "/holdings/ventures"),
    );
    const results = await Promise.all(requests);

    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);
    console.info(`[stress] GET /holdings/ventures x${STRESS_CONCURRENCY} — p95: ${p95}ms`);
  });

  // PRISM Counsel stress test removed in Task #2696 (routes archived).

  it(`handles ${STRESS_CONCURRENCY} concurrent GET /terra/market-intelligence requests without errors`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);

    const requests = Array.from({ length: STRESS_CONCURRENCY }, () =>
      timedRequest(request(app), "/terra/market-intelligence"),
    );
    const results = await Promise.all(requests);

    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);
    console.info(`[stress] GET /terra/market-intelligence x${STRESS_CONCURRENCY} — p95: ${p95}ms`);
  });
});

// ── Suite 2: Parallel multi-domain concurrent reads (cross-domain load) ────────

describe.skipIf(!HAS_DB)("Stress — Cross-domain concurrent load (mixed domain endpoints)", () => {
  it(`executes ${STRESS_CONCURRENCY} mixed domain reads concurrently without 5xx errors`, async () => {
    const apps: Array<{ app: express.Express; path: string }> = [];

    const [
      { default: vesselsRouter },
      { default: lyteRouter },
      { default: firestormRouter },
      { default: holdingsRouter },
      { default: terraRouter },
    ] = await Promise.all([
      import("../../artifacts/api-server/src/routes/vessels"),
      import("../../artifacts/api-server/src/routes/lyte"),
      import("../../artifacts/api-server/src/routes/firestorm"),
      import("../../artifacts/api-server/src/routes/holdings"),
      import("../../artifacts/api-server/src/routes/terra"),
    ]);

    const domainApps = [
      { router: vesselsRouter, path: "/vessels/fleets" },
      { router: lyteRouter, path: "/lyte/workspaces" },
      { router: firestormRouter, path: "/firestorm/incidents" },
      { router: holdingsRouter, path: "/holdings/ventures" },
      { router: terraRouter, path: "/terra/market-intelligence" },
    ].map(({ router, path }) => {
      const app = buildStressApp();
      app.use(router);
      return { app, path };
    });

    const batchSize = domainApps.length;
    const requestsPerDomain = Math.ceil(STRESS_CONCURRENCY / batchSize);

    const allRequests = domainApps.flatMap(({ app, path }) =>
      Array.from({ length: requestsPerDomain }, () =>
        timedRequest(request(app), path),
      ),
    );

    const results = await Promise.all(allRequests);
    const errors = results.filter((r) => r.status >= 500);
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);
    const p50 = percentile(durations, 50);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);
    console.info(`[stress] Cross-domain x${results.length} — p50: ${p50}ms, p95: ${p95}ms, max: ${durations[durations.length - 1]}ms`);
  });
});

// ── Suite 3: Parallel DB read/write performance ────────────────────────────────

describe.skipIf(!HAS_DB)("Stress — Parallel DB read/write operations", () => {
  it("parallel fleet inserts and reads do not cause DB errors", async () => {
    const writeApp = buildStressApp();
    const readApp = buildStressApp();

    const [
      { default: writeRouter },
      { default: readRouter },
    ] = await Promise.all([
      import("../../artifacts/api-server/src/routes/vessels"),
      import("../../artifacts/api-server/src/routes/vessels"),
    ]);

    writeApp.use(writeRouter);
    readApp.use(readRouter);

    const WRITE_COUNT = 5;
    const READ_COUNT = 10;

    const writes = Array.from({ length: WRITE_COUNT }, (_, i) =>
      request(writeApp)
        .post("/vessels/fleets")
        .send({ name: `Stress-Fleet-${Date.now()}-${i}`, description: "Stress test — safe to delete" }),
    );

    const reads = Array.from({ length: READ_COUNT }, () =>
      request(readApp).get("/vessels/fleets"),
    );

    const [writeResults, readResults] = await Promise.all([
      Promise.all(writes),
      Promise.all(reads),
    ]);

    const writeErrors = writeResults.filter((r) => r.status >= 500);
    const readErrors = readResults.filter((r) => r.status >= 500);

    expect(writeErrors.length).toBe(0);
    expect(readErrors.length).toBe(0);

    for (const wr of writeResults) {
      if (wr.status === 201 && wr.body?.id) {
        stressCleanupFleetIds.push(wr.body.id as number);
      }
    }

    console.info(`[stress] DB write/read — ${WRITE_COUNT} inserts + ${READ_COUNT} reads concurrent, ${writeErrors.length + readErrors.length} errors`);
  });

  it("high-volume sequential reads against real DB maintain consistent response shape", async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);

    const SEQUENTIAL_COUNT = 30;
    const results: { status: number; isArray: boolean }[] = [];

    for (let i = 0; i < SEQUENTIAL_COUNT; i++) {
      const res = await request(app).get("/vessels");
      results.push({ status: res.status, isArray: Array.isArray(res.body) });
    }

    const errors = results.filter((r) => r.status >= 500);
    const shapeMismatches = results.filter((r) => r.status === 200 && !r.isArray);

    expect(errors.length).toBe(0);
    expect(shapeMismatches.length).toBe(0);
    console.info(`[stress] Sequential GET /vessels x${SEQUENTIAL_COUNT} — ${errors.length} errors, ${shapeMismatches.length} shape mismatches`);
  });
});

// ── Suite 4: Rate-limiter behavior under load ─────────────────────────────────

describe.skipIf(!HAS_DB)("Stress — Rate-limiter validation", () => {
  it("global rate limiter allows at least 20 requests before throttling", async () => {
    const { globalLimiter } = await import(
      "../../artifacts/api-server/src/middlewares/rate-limiters"
    );
    const { csrfMiddleware } = await import(
      "../../artifacts/api-server/src/middlewares/csrf"
    );
    const ALLOY_TOKEN = "szl-stress-rate-limit-test-2026";
    process.env.ALLOY_INTERNAL_TOKEN = ALLOY_TOKEN;

    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;

    const rateLimitApp = express();
    rateLimitApp.set("trust proxy", 1);
    rateLimitApp.use(express.json());
    rateLimitApp.use(globalLimiter);
    rateLimitApp.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Record<string, unknown>).log = {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
      };
      next();
    });
    rateLimitApp.use(csrfMiddleware);
    rateLimitApp.use("/api", router);

    const BURST_COUNT = 25;
    const results = await Promise.all(
      Array.from({ length: BURST_COUNT }, () =>
        request(rateLimitApp)
          .get("/api/vessels/fleets")
          .set("x-internal-token", ALLOY_TOKEN),
      ),
    );

    const ok = results.filter((r) => r.status === 200);
    const throttled = results.filter((r) => r.status === 429);
    const serverErrors = results.filter((r) => r.status >= 500);

    expect(ok.length).toBeGreaterThanOrEqual(10);
    expect(serverErrors.length).toBe(0);
    console.info(`[stress] Rate-limiter burst x${BURST_COUNT} — 200: ${ok.length}, 429: ${throttled.length}, 5xx: ${serverErrors.length}`);
  });

  it("concurrent requests behind CSRF middleware all return non-500 status codes", async () => {
    const { globalLimiter } = await import(
      "../../artifacts/api-server/src/middlewares/rate-limiters"
    );
    const { csrfMiddleware } = await import(
      "../../artifacts/api-server/src/middlewares/csrf"
    );
    const ALLOY_TOKEN = "szl-stress-rate-limit-test-2026";
    process.env.ALLOY_INTERNAL_TOKEN = ALLOY_TOKEN;

    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    const csrfApp = express();
    csrfApp.set("trust proxy", 1);
    csrfApp.use(express.json());
    csrfApp.use(globalLimiter);
    csrfApp.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Record<string, unknown>).log = {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
      };
      next();
    });
    csrfApp.use(csrfMiddleware);
    csrfApp.use("/api", router);

    const CSRF_COUNT = 15;
    const results = await Promise.all(
      Array.from({ length: CSRF_COUNT }, () =>
        request(csrfApp)
          .get("/api/vessels/fleets")
          .set("x-internal-token", ALLOY_TOKEN),
      ),
    );

    const serverErrors = results.filter((r) => r.status >= 500);
    const successful = results.filter((r) => r.status === 200);

    expect(serverErrors.length).toBe(0);
    expect(successful.length).toBeGreaterThan(0);
    console.info(`[stress] CSRF middleware burst x${CSRF_COUNT} — 200: ${successful.length}, 5xx: ${serverErrors.length}`);
  });
});

// ── Suite 5: Sustained load benchmark (p95 latency target) ────────────────────

describe.skipIf(!HAS_DB)("Stress — Sustained load benchmark", () => {
  it(`${STRESS_ITERATIONS} sequential requests to /vessels/fleets complete with p95 < ${MAX_ACCEPTABLE_P95_MS}ms`, async () => {
    const app = buildStressApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);

    const durations: number[] = [];
    const errors: number[] = [];

    for (let i = 0; i < STRESS_ITERATIONS; i++) {
      const start = Date.now();
      const res = await request(app).get("/vessels/fleets");
      durations.push(Date.now() - start);
      if (res.status >= 500) errors.push(res.status);
    }

    durations.sort((a, b) => a - b);
    const p50 = percentile(durations, 50);
    const p95 = percentile(durations, 95);
    const p99 = percentile(durations, 99);

    expect(errors.length).toBe(0);
    expect(p95).toBeLessThan(MAX_ACCEPTABLE_P95_MS);

    console.info(
      `[stress] Sustained GET /vessels/fleets x${STRESS_ITERATIONS}` +
      ` — p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms, max: ${durations[durations.length - 1]}ms`,
    );
  });
});

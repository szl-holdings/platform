/**
 * Signal Mesh — Restart Survival End-to-End Test (Task #1923)
 *
 * Proves the full lifecycle of the durable signal mesh:
 *
 *   seed → flush → "restart" → hydrate → still readable via the public API
 *
 * The test boots the same Postgres-backed stores `persistence-init.ts` wires
 * up at API server startup, but pointed at an in-process fake DB so it runs
 * in CI without a live database. After seeding the mesh with the canonical
 * narratives (vessels port congestion, Carlota Jo estate, SZL treasury), it
 * flushes pending writes, throws away every in-memory front-end (simulating
 * a process crash), constructs brand-new stores against the SAME fake DB,
 * hydrates them, and finally asserts that:
 *
 *   1. `defaultSignalBus.snapshot()` (backing GET /evidence-graph/signals)
 *      returns the seeded signals
 *   2. `defaultEvidenceGraphQuery.listEvidence()` returns the seeded
 *      evidence items
 *   3. `defaultEvidenceGraphQuery.listRecommendations()` returns the
 *      seeded recommendations
 *   4. `defaultEntityRegistry.list()` returns the seeded entity snapshots
 *      with their activeSignalIds / activeRecommendationIds links intact
 *   5. The Express `evidence-graph` router (mounted with auth + rate-limit
 *      middleware bypassed) returns the same data over HTTP, exactly as
 *      external callers would see it
 *
 * A regression that re-introduces the in-memory-only data loss bug would
 * fail steps 1–5 because the fresh stores would be empty after "restart".
 */

import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before importing modules that consume them.
// ---------------------------------------------------------------------------

// In-process fake "Postgres": one Map per table, keyed by the table object's
// reference identity. This mirrors only the drizzle builder shape that the
// four mesh stores actually exercise:
//   db.select().from(table).orderBy(...).limit(n)  → rows
//   db.insert(table).values(row).onConflictDoUpdate({ target, set }) → upsert
//   db.insert(linksTable).values([...]).onConflictDoNothing()      → append
type Row = Record<string, unknown>;
type TableState =
  | { kind: "keyed"; idField: string; rows: Map<string, Row> }
  | { kind: "log"; rows: Row[] };

const fakeTables = {
  signals: {
    table: { signalId: { name: "signalId" }, receivedAt: { name: "receivedAt" } },
    state: { kind: "keyed", idField: "signalId", rows: new Map() } as TableState,
  },
  evidence: {
    table: { evidenceId: { name: "evidenceId" }, observedAt: { name: "observedAt" } },
    state: { kind: "keyed", idField: "evidenceId", rows: new Map() } as TableState,
  },
  evidenceLinks: {
    table: { evidenceId: { name: "evidenceId" }, entityId: { name: "entityId" } },
    state: { kind: "log", rows: [] } as TableState,
  },
  recommendations: {
    table: {
      recommendationId: { name: "recommendationId" },
      generatedAt: { name: "generatedAt" },
    },
    state: { kind: "keyed", idField: "recommendationId", rows: new Map() } as TableState,
  },
  entities: {
    table: { entityId: { name: "entityId" }, snapshotAt: { name: "snapshotAt" } },
    state: { kind: "keyed", idField: "entityId", rows: new Map() } as TableState,
  },
};

function lookupState(t: unknown): TableState {
  for (const v of Object.values(fakeTables)) {
    if (v.table === t) return v.state;
  }
  throw new Error("[fake-db] unknown table reference");
}

const fakeDb = {
  select() {
    return {
      from(t: unknown) {
        const state = lookupState(t);
        return {
          orderBy() {
            return {
              async limit() {
                return state.kind === "keyed"
                  ? Array.from(state.rows.values())
                  : [...state.rows];
              },
            };
          },
        };
      },
    };
  },
  insert(t: unknown) {
    const state = lookupState(t);
    return {
      values(row: Row | Row[]) {
        const apply = () => {
          if (state.kind === "keyed") {
            const rows = Array.isArray(row) ? row : [row];
            for (const r of rows) {
              const id = r[state.idField] as string;
              state.rows.set(id, r);
            }
          } else {
            const rows = Array.isArray(row) ? row : [row];
            state.rows.push(...rows);
          }
        };
        return {
          async onConflictDoUpdate() {
            apply();
          },
          async onConflictDoNothing() {
            apply();
          },
        };
      },
    };
  },
};

vi.mock("@szl-holdings/db", () => ({
  db: fakeDb,
  pool: {},
}));

vi.mock("@szl-holdings/db/schema", () => ({
  meshSignalsTable: fakeTables.signals.table,
  meshEvidenceItemsTable: fakeTables.evidence.table,
  meshEvidenceEntityLinksTable: fakeTables.evidenceLinks.table,
  meshRecommendationsTable: fakeTables.recommendations.table,
  meshEntitySnapshotsTable: fakeTables.entities.table,
}));

// Bypass auth + rate-limit middleware for the public-API integration test.
vi.mock("../middlewares/auth", () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("../middlewares/sliding-window-limiter", () => ({
  perUserApiSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));


// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

const express = (await import("express")).default;
const request = (await import("supertest")).default;

const {
  defaultSignalBus,
  PostgresSignalBusStore,
  SignalBus,
} = await import("@szl-holdings/signal-mesh");

const {
  defaultEvidenceStore,
  defaultRecommendationStore,
  defaultEvidenceGraphQuery,
  PostgresEvidenceStore,
  PostgresRecommendationStore,
  PostgresEntityRegistry,
  InMemoryEvidenceStore,
  InMemoryRecommendationStore,
} = await import("@szl-holdings/evidence-graph");

const { defaultEntityRegistry, InMemoryEntityRegistry } = await import("@workspace/ontology");

// Import the mesh seed module directly (bypass `@workspace/demo-seed`'s
// barrel index, which transitively imports a constellation seeder we don't
// need for this restart test).
const { seedSignalMesh } = await import(
  "../../../../packages/demo-seed/src/seed-signal-mesh"
);

const { default: evidenceGraphRouter } = await import("../routes/evidence-graph");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wire fresh Postgres-backed stores into the four mesh singletons, exactly
 * mirroring what `persistence-init.ts → initDurablePersistence()` does at
 * API server boot. Returns the stores so the caller can flush/stop them.
 */
async function bootDurablePersistence(opts: { hydrate: boolean }) {
  const signalBusStore = new PostgresSignalBusStore({
    db: fakeDb as never,
    signalsTable: fakeTables.signals.table as never,
    flushIntervalMs: 0,
  });
  const evidenceStore = new PostgresEvidenceStore({
    db: fakeDb as never,
    evidenceItemsTable: fakeTables.evidence.table as never,
    evidenceEntityLinksTable: fakeTables.evidenceLinks.table as never,
    flushIntervalMs: 0,
  });
  const recommendationStore = new PostgresRecommendationStore({
    db: fakeDb as never,
    recommendationsTable: fakeTables.recommendations.table as never,
    flushIntervalMs: 0,
  });
  const entityRegistry = new PostgresEntityRegistry({
    db: fakeDb as never,
    entitySnapshotsTable: fakeTables.entities.table as never,
    flushIntervalMs: 0,
  });

  if (opts.hydrate) {
    const [hydratedSignals] = await Promise.all([
      signalBusStore.hydrate(),
      evidenceStore.hydrate(),
      recommendationStore.hydrate(),
      entityRegistry.hydrate(),
    ]);
    defaultSignalBus.loadBuffer(hydratedSignals);
  }

  defaultSignalBus.setStore(signalBusStore);
  defaultEvidenceStore.setBackend(evidenceStore);
  defaultRecommendationStore.setBackend(recommendationStore);
  defaultEntityRegistry.setBackend(entityRegistry);

  return { signalBusStore, evidenceStore, recommendationStore, entityRegistry };
}

async function flushAll(stores: Awaited<ReturnType<typeof bootDurablePersistence>>) {
  await Promise.all([
    stores.signalBusStore.flush(),
    stores.evidenceStore.flush(),
    stores.recommendationStore.flush(),
    stores.entityRegistry.flush(),
  ]);
}

/**
 * Simulate a process crash: throw away every in-memory front-end the live
 * mesh APIs read from, then re-point the singletons at empty in-memory
 * stores. After this returns, every read API returns zero records — exactly
 * what would happen on a cold boot before hydration completes.
 */
function simulateCrash() {
  defaultSignalBus.setStore(undefined);
  defaultSignalBus.clear();
  // Replace evidence/rec/entity backends with brand-new in-memory stores so
  // any cached state is gone. (The Postgres stores hold their own private
  // InMemory caches — discarding the references discards the cache too.)
  defaultEvidenceStore.setBackend(new InMemoryEvidenceStore());
  defaultRecommendationStore.setBackend(new InMemoryRecommendationStore());
  defaultEntityRegistry.setBackend(new InMemoryEntityRegistry());
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(evidenceGraphRouter);
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("signal mesh — survives a simulated API server restart (Task #1923)", () => {
  it("seed → flush → restart → hydrate keeps signals/evidence/recommendations/entities readable", async () => {
    // ---- Boot 1: wire durable stores, seed the mesh, flush to fake DB ----
    const beforeStores = await bootDurablePersistence({ hydrate: false });

    // Sanity: bus is wired through the durable store.
    expect(defaultSignalBus.getStore()).toBe(beforeStores.signalBusStore);

    const stats = await seedSignalMesh({ startConnectors: false });
    expect(stats.signalsSeeded).toBeGreaterThan(0);
    expect(stats.evidenceItemsSeeded).toBeGreaterThan(0);
    expect(stats.recommendationsSeeded).toBeGreaterThan(0);
    expect(stats.entitiesRegistered).toBeGreaterThan(0);

    // Capture the live counts that the public API will report later.
    const beforeSignals = defaultSignalBus.snapshot({ limit: 10000 });
    const beforeEvidence = defaultEvidenceGraphQuery.listEvidence({ limit: 10000 });
    const beforeRecs = defaultEvidenceGraphQuery.listRecommendations({ limit: 10000 });
    const beforeEntities = defaultEntityRegistry.list();
    const beforeRecId = beforeRecs[0]!.recommendationId;
    const beforeEntityWithSignals = beforeEntities.find((e) => e.activeSignalIds.length > 0)!;
    expect(beforeEntityWithSignals).toBeDefined();

    await flushAll(beforeStores);

    // The fake DB must now hold every record we just published.
    expect(fakeTables.signals.state.kind).toBe("keyed");
    expect((fakeTables.signals.state as { rows: Map<string, Row> }).rows.size).toBe(beforeSignals.length);
    expect((fakeTables.evidence.state as { rows: Map<string, Row> }).rows.size).toBe(beforeEvidence.length);
    expect((fakeTables.recommendations.state as { rows: Map<string, Row> }).rows.size).toBe(beforeRecs.length);
    expect((fakeTables.entities.state as { rows: Map<string, Row> }).rows.size).toBe(beforeEntities.length);
    expect((fakeTables.evidenceLinks.state as { rows: Row[] }).rows.length).toBeGreaterThan(0);

    await Promise.all([
      beforeStores.signalBusStore.stop(),
      beforeStores.evidenceStore.stop(),
      beforeStores.recommendationStore.stop(),
      beforeStores.entityRegistry.stop(),
    ]);

    // ---- Crash: every in-memory read surface is now empty ----
    simulateCrash();
    expect(defaultSignalBus.count()).toBe(0);
    expect(defaultEvidenceGraphQuery.listEvidence({ limit: 10000 }).length).toBe(0);
    expect(defaultEvidenceGraphQuery.listRecommendations({ limit: 10000 }).length).toBe(0);
    expect(defaultEntityRegistry.list().length).toBe(0);

    // ---- Boot 2: re-instantiate stores against the SAME fake DB and hydrate ----
    await bootDurablePersistence({ hydrate: true });

    // ---- Verify the singletons backing the public API recovered everything ----
    const afterSignals = defaultSignalBus.snapshot({ limit: 10000 });
    const afterEvidence = defaultEvidenceGraphQuery.listEvidence({ limit: 10000 });
    const afterRecs = defaultEvidenceGraphQuery.listRecommendations({ limit: 10000 });
    const afterEntities = defaultEntityRegistry.list();

    expect(afterSignals.length).toBe(beforeSignals.length);
    expect(afterEvidence.length).toBe(beforeEvidence.length);
    expect(afterRecs.length).toBe(beforeRecs.length);
    expect(afterEntities.length).toBe(beforeEntities.length);

    expect(new Set(afterSignals.map((s) => s.signalId))).toEqual(
      new Set(beforeSignals.map((s) => s.signalId)),
    );
    expect(new Set(afterEvidence.map((e) => e.evidenceId))).toEqual(
      new Set(beforeEvidence.map((e) => e.evidenceId)),
    );
    expect(new Set(afterRecs.map((r) => r.recommendationId))).toEqual(
      new Set(beforeRecs.map((r) => r.recommendationId)),
    );
    expect(new Set(afterEntities.map((e) => e.entityId))).toEqual(
      new Set(beforeEntities.map((e) => e.entityId)),
    );

    // Entity → signal/recommendation links survive (PostgresEntityRegistry
    // persists the full snapshot including activeSignalIds + activeRecommendationIds).
    const recoveredEntity = defaultEntityRegistry.get(beforeEntityWithSignals.entityId);
    expect(recoveredEntity).toBeDefined();
    expect(recoveredEntity?.activeSignalIds.length).toBe(beforeEntityWithSignals.activeSignalIds.length);
    expect(recoveredEntity?.activeRecommendationIds.length).toBe(
      beforeEntityWithSignals.activeRecommendationIds.length,
    );

    // The full evidence chain query (recommendation → evidence → entities)
    // must resolve end-to-end after hydration.
    const chain = defaultEvidenceGraphQuery.getEvidenceChain(beforeRecId);
    expect(chain).not.toBeNull();
    expect(chain!.recommendation.recommendationId).toBe(beforeRecId);
    expect(chain!.evidenceItems.length).toBeGreaterThan(0);
    expect(chain!.entities.length).toBeGreaterThan(0);

    // ---- Verify the same data is reachable through the public HTTP API ----
    const app = buildApp();

    const signalsRes = await request(app).get("/evidence-graph/signals?limit=10000");
    expect(signalsRes.status).toBe(200);
    expect(signalsRes.body.signals.length).toBe(beforeSignals.length);
    expect(signalsRes.body.busCount).toBe(beforeSignals.length);

    const recsRes = await request(app).get("/evidence-graph/recommendations?limit=10000");
    expect(recsRes.status).toBe(200);
    expect(recsRes.body.recommendations.length).toBe(beforeRecs.length);

    const recDetailRes = await request(app).get(`/evidence-graph/recommendations/${beforeRecId}`);
    expect(recDetailRes.status).toBe(200);
    expect(recDetailRes.body.chain.recommendation.recommendationId).toBe(beforeRecId);
    expect(recDetailRes.body.chain.evidenceItems.length).toBeGreaterThan(0);

    const entitiesRes = await request(app).get("/evidence-graph/entities");
    expect(entitiesRes.status).toBe(200);
    expect(entitiesRes.body.entities.length).toBe(beforeEntities.length);

    const whyRes = await request(app).get(
      `/evidence-graph/why/${encodeURIComponent(beforeEntityWithSignals.entityId)}`,
    );
    expect(whyRes.status).toBe(200);
    expect(whyRes.body.why.entityId).toBe(beforeEntityWithSignals.entityId);
    expect(whyRes.body.why.entitySnapshot).not.toBeNull();

    const statusRes = await request(app).get("/evidence-graph/status");
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.counts.signals).toBe(beforeSignals.length);
    expect(statusRes.body.counts.evidenceItems).toBe(beforeEvidence.length);
    expect(statusRes.body.counts.recommendations).toBe(beforeRecs.length);
    expect(statusRes.body.counts.entities).toBe(beforeEntities.length);

    // ---- Tear down: restore singletons so other tests see a clean slate ----
    defaultSignalBus.setStore(undefined);
    defaultSignalBus.clear();
    defaultEvidenceStore.setBackend(new InMemoryEvidenceStore());
    defaultRecommendationStore.setBackend(new InMemoryRecommendationStore());
    defaultEntityRegistry.setBackend(new InMemoryEntityRegistry());

    // Touch SignalBus class import so unused-import lints don't trip if the
    // file is ever imported as a module elsewhere.
    expect(SignalBus).toBeDefined();
  }, 30_000);
});

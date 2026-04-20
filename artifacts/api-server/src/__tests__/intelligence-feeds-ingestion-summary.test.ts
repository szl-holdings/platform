/**
 * Intelligence feed ingestion summary log (Task #2634)
 *
 * `intelligence-feeds-init.startIntelligenceFeeds` registers an entity
 * ingestion callback on `feedScheduler` that classifies each upserted
 * entity as either "created" or "merged" using `wasCreated` returned by
 * `OntologyEngine.upsertEntity`. The callback emits a summary log that
 * downstream observability relies on:
 *
 *   logger.info({ entitiesUpserted, entitiesCreated, entitiesMerged, ... })
 *
 * The invariant locked in here is:
 *
 *   entitiesCreated + entitiesMerged === entitiesUpserted
 *
 * If a future refactor stops propagating `wasCreated` correctly the
 * counters will drift apart and this test will fail.
 *
 * The test runs entirely in-process — the feed scheduler, adapters,
 * platform flags and ontology engine are all mocked so no DB or
 * network is required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NormalizedFeedPayload } from "@szl-holdings/intelligence-feeds/feed-adapter";
import type { OntologyEntity, OntologyRelationship } from "@szl-holdings/ai-engine/ontology/ontology-engine";

type FeedEntity = NormalizedFeedPayload["entities"][number];

type IngestionFn = (
  entities: NormalizedFeedPayload["entities"],
  relationships: NormalizedFeedPayload["relationships"],
  source: string,
) => Promise<{ entitiesUpserted: OntologyEntity[]; relationshipsCreated: OntologyRelationship[] }>;

function makeFeedEntity(name: string, source = "test-source"): FeedEntity {
  return {
    type: "asset",
    name,
    domain: source,
    metadata: {},
    tags: [],
  };
}

function makeUpsertResult(name: string, wasCreated: boolean, source = "test-source"): OntologyEntity & { wasCreated: boolean } {
  return {
    id: `id-${name}`,
    type: "asset",
    name,
    domain: source,
    metadata: {},
    tags: [],
    lastUpdated: new Date().toISOString(),
    wasCreated,
  };
}

interface SummaryLogFields {
  source: string;
  entitiesUpserted: number;
  entitiesCreated: number;
  entitiesMerged: number;
  relationshipsCreated: number;
}

function isSummaryFields(value: unknown): value is SummaryLogFields {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.entitiesUpserted === "number" &&
    typeof v.entitiesCreated === "number" &&
    typeof v.entitiesMerged === "number" &&
    typeof v.relationshipsCreated === "number" &&
    typeof v.source === "string"
  );
}

function findSummary(calls: unknown[][]): { fields: SummaryLogFields; message: string } {
  for (const call of calls) {
    const [first, second] = call;
    if (isSummaryFields(first)) {
      return { fields: first, message: typeof second === "string" ? second : "" };
    }
  }
  throw new Error("Summary log call with entitiesUpserted field not found");
}

let capturedIngestionFn: IngestionFn | null = null;
const loggerInfo = vi.fn();
const loggerWarn = vi.fn();
const loggerDebug = vi.fn();

vi.mock("../lib/logger", () => ({
  logger: { info: loggerInfo, warn: loggerWarn, debug: loggerDebug, error: vi.fn() },
}));

vi.mock("../lib/platform-flags", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

interface RecordIngestionPayload {
  entitiesUpserted: number;
  entitiesCreated: number;
  entitiesMerged: number;
  relationshipsCreated: number;
}
const recordIngestion = vi.fn<(source: string, payload: RecordIngestionPayload) => void>();

vi.mock("@szl-holdings/intelligence-feeds/feed-scheduler", () => ({
  feedScheduler: {
    register: vi.fn(),
    setEntityIngestionFn: (fn: IngestionFn): void => {
      capturedIngestionFn = fn;
    },
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    recordIngestion: (source: string, payload: RecordIngestionPayload) => recordIngestion(source, payload),
    getSchedulerStatus: (): { feedCount: number } => ({ feedCount: 0 }),
    getAllHealth: (): unknown[] => [],
  },
}));

class StubAdapter {}
vi.mock("@szl-holdings/intelligence-feeds/adapters/ais", () => ({ AISFeedAdapter: StubAdapter }));
vi.mock("@szl-holdings/intelligence-feeds/adapters/stix-taxii", () => ({ STIXTAXIIFeedAdapter: StubAdapter }));
vi.mock("@szl-holdings/intelligence-feeds/adapters/sanctions", () => ({ SanctionsFeedAdapter: StubAdapter }));
vi.mock("@szl-holdings/intelligence-feeds/adapters/legal-records", () => ({ LegalRecordsFeedAdapter: StubAdapter }));

const upsertEntity = vi.fn<(entity: FeedEntity) => Promise<OntologyEntity & { wasCreated: boolean }>>();
const createRelationship = vi.fn<(...args: unknown[]) => Promise<OntologyRelationship>>();

vi.mock("@szl-holdings/ai-engine/ontology/ontology-engine", () => ({
  ontologyEngine: {
    upsertEntity: (entity: FeedEntity) => upsertEntity(entity),
    createRelationship: (...args: unknown[]) => createRelationship(...args),
  },
}));

// db is imported by intelligence-feeds-init for resolveExternalId — stub it
// so module evaluation doesn't try to open a Postgres connection.
interface DbStub {
  select: () => DbStub;
  from: () => DbStub;
  where: () => DbStub;
  limit: () => Promise<Array<{ id: string }>>;
}
vi.mock("@szl-holdings/db", () => {
  const chain: DbStub = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: async () => [],
  };
  return {
    db: chain,
    entitiesTable: { id: {}, externalId: {} },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: () => ({}),
}));

describe("intelligence feeds ingestion summary log (created + merged === upserted)", () => {
  beforeEach(() => {
    capturedIngestionFn = null;
    loggerInfo.mockReset();
    loggerWarn.mockReset();
    loggerDebug.mockReset();
    upsertEntity.mockReset();
    createRelationship.mockReset();
  });

  it("logs entitiesCreated + entitiesMerged === entitiesUpserted from wasCreated flags", async () => {
    // Force a fresh module evaluation so the `started` guard in
    // intelligence-feeds-init does not short-circuit the registration.
    vi.resetModules();
    const { startIntelligenceFeeds } = await import("../lib/intelligence-feeds-init");

    await startIntelligenceFeeds();
    if (!capturedIngestionFn) throw new Error("Ingestion callback was not registered");

    // Three "new" entities, two "existing" — mix of created/merged.
    const sequence: boolean[] = [true, false, true, false, true];
    let i = 0;
    upsertEntity.mockImplementation(async (entity: FeedEntity) => {
      const wasCreated = sequence[i++] ?? false;
      return makeUpsertResult(entity.name, wasCreated);
    });

    const entities: FeedEntity[] = sequence.map((_, idx) => makeFeedEntity(`entity-${idx}`));
    const result = await capturedIngestionFn(entities, [], "test-source");

    expect(result.entitiesUpserted).toHaveLength(sequence.length);

    const { fields, message } = findSummary(loggerInfo.mock.calls);

    const expectedCreated = sequence.filter(Boolean).length;
    const expectedMerged = sequence.length - expectedCreated;

    expect(fields.entitiesUpserted).toBe(sequence.length);
    expect(fields.entitiesCreated).toBe(expectedCreated);
    expect(fields.entitiesMerged).toBe(expectedMerged);
    // The core invariant the task is locking in:
    expect(fields.entitiesCreated + fields.entitiesMerged).toBe(fields.entitiesUpserted);
    expect(fields.source).toBe("test-source");

    // The human-readable message should also reflect the same counts.
    expect(message).toContain(`${expectedCreated} created`);
    expect(message).toContain(`${expectedMerged} merged`);
  });

  it("classifies a wholly-new batch as all created and a wholly-merged batch as all merged", async () => {
    vi.resetModules();
    const { startIntelligenceFeeds } = await import("../lib/intelligence-feeds-init");
    await startIntelligenceFeeds();
    if (!capturedIngestionFn) throw new Error("Ingestion callback was not registered");

    upsertEntity.mockImplementation(async (entity: FeedEntity) =>
      makeUpsertResult(entity.name, true),
    );

    const batch: FeedEntity[] = [makeFeedEntity("new-1"), makeFeedEntity("new-2")];
    await capturedIngestionFn(batch, [], "test-source");

    const allCreated = findSummary(loggerInfo.mock.calls).fields;
    expect(allCreated.entitiesCreated).toBe(2);
    expect(allCreated.entitiesMerged).toBe(0);
    expect(allCreated.entitiesCreated + allCreated.entitiesMerged).toBe(allCreated.entitiesUpserted);

    // Reset and run a second batch where everything is a merge.
    loggerInfo.mockReset();
    upsertEntity.mockImplementation(async (entity: FeedEntity) =>
      makeUpsertResult(entity.name, false),
    );

    await capturedIngestionFn(batch, [], "test-source");

    const allMerged = findSummary(loggerInfo.mock.calls).fields;
    expect(allMerged.entitiesCreated).toBe(0);
    expect(allMerged.entitiesMerged).toBe(2);
    expect(allMerged.entitiesCreated + allMerged.entitiesMerged).toBe(allMerged.entitiesUpserted);
  });
});

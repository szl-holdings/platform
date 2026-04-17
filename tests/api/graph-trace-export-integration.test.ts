/**
 * Integration tests for GET /graph/entities/:id/subgraph/export  (task #1206)
 *
 * Task #1133 added a richer trace export with per-node provenance,
 * last-update timestamps, linked event ids, and per-edge evidence references.
 * This suite locks down:
 *   • the JSON shape (provenance, linkedEvents, edge.source, edge.evidence)
 *   • the CSV NODES / EDGES / EVIDENCE sections including provenance columns
 *   • the Content-Disposition filename (`trace-{slug}-{timestamp}.{ext}`)
 *   • depth / maxNodes / perHopLimit validation rejecting out-of-range values
 *   • the truncated flag flipping when maxNodes is small enough to drop edges
 *
 * Topology of the seeded fixture (all rows tagged with PROVENANCE_ID for
 * targeted teardown, all using the unique FIXTURE_ENTITY_TYPE):
 *
 *   N_HUB (terra)            ← origin of the export
 *   ├── N_NEAR_1 (terra)     edge HUB→NEAR_1, with one cst_edge_evidence row
 *   ├── N_NEAR_2 (vessels)   edge HUB→NEAR_2 (cross-domain, no evidence)
 *   └── N_FAR (aegis)        edge NEAR_1→FAR (depth 2 reach)
 */

import request from "supertest";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { vi, beforeAll, afterAll, describe, it, expect } from "vitest";

const TEST_USER = { id: "test-user-1", isAdmin: false, orgs: [{ orgId: 1 }] };

const mockAuthMiddleware = () =>
  (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = TEST_USER.id;
    res.locals.role = "ops";
    (req as Request & { user?: typeof TEST_USER }).user = TEST_USER;
    next();
  };

vi.mock(
  "../../artifacts/api-server/src/middlewares/auth",
  () => ({
    authMiddleware: mockAuthMiddleware,
    requireRole: (..._roles: string[]) =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    denyIfReadOnly: () =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    parseIdParam: (id: string) => {
      const n = parseInt(id, 10);
      if (isNaN(n)) throw Object.assign(new Error("Invalid ID"), { status: 400 });
      return n;
    },
    InvalidIdError: class InvalidIdError extends Error {
      status = 400;
      constructor(msg: string) { super(msg); }
    },
  }),
);

function buildApp() {
  const app = express();
  app.use(express.json());
  return app;
}

// Minimal typed view of the trace-export JSON payload — kept narrow on
// purpose so the assertions catch shape regressions without re-declaring
// every column the route happens to return.
interface ExportNode {
  id: string;
  distance: number | null;
  provenance: {
    sourceId: string | null;
    sourceType: string | null;
    sourceLabel: string | null;
    lastUpdatedAt: string;
  };
  linkedEvents: {
    actionIds: string[];
    documentIds: string[];
    executionIds: string[];
    riskIds: string[];
    all: string[];
  };
}

interface ExportEdgeEvidence {
  id: string;
  evidenceType: string;
  sourceId: string | null;
  sourceLabel: string | null;
  confidence: number;
  recordedBy: string | null;
  recordedAt: string;
  payload: Record<string, unknown> | null;
}

interface ExportEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  source: {
    sourceId: string | null;
    sourceType: string | null;
    sourceLabel: string | null;
  };
  evidence: ExportEdgeEvidence[];
}

interface ExportPayload {
  generatedAt: string;
  origin: { id: string; name: string | null; domain: string | null };
  depth: number;
  truncated: boolean;
  nodes: ExportNode[];
  edges: ExportEdge[];
  stats: { nodeCount: number; edgeCount: number; evidenceCount: number };
}

describe("Integration — GET /graph/entities/:id/subgraph/export", () => {
  let app: express.Express;
  const RUN_TAG = `it-trace-export-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const FIXTURE_ENTITY_TYPE = `fixture_${RUN_TAG}`;
  const PROVENANCE_ID = `task-1206:${RUN_TAG}`;
  const PROVENANCE_TYPE = "integration_test";
  const PROVENANCE_LABEL = `Trace export fixture ${RUN_TAG}`;
  const ACTION_ID = `action-${RUN_TAG}`;
  const DOC_ID = `doc-${RUN_TAG}`;
  const EVIDENCE_TYPE = `evidence_${RUN_TAG}`;
  const EVIDENCE_SOURCE_LABEL = `Evidence source ${RUN_TAG}`;

  const seeded = {
    hub: "",
    near1: "",
    near2: "",
    far: "",
    edgeHubNear1: "",
    edgeHubNear2: "",
    edgeNear1Far: "",
    evidenceId: "",
    edgeIds: [] as string[],
    nodeIds: [] as string[],
  };

  beforeAll(async () => {
    app = buildApp();
    // Importing the graph router pulls in the entire api-server route tree on
    // a cold start, so the hook timeout is bumped to 60s below.
    const router = (await import("../../artifacts/api-server/src/routes/graph")).default;
    app.use(router);

    const { db, cstNodes, cstEdges, cstEdgeEvidence } = await import(
      "@szl-holdings/db"
    );

    const insertedNodes = await db
      .insert(cstNodes)
      .values([
        {
          domain: "terra",
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-HUB`,
          provenanceSourceId: PROVENANCE_ID,
          provenanceSourceType: PROVENANCE_TYPE,
          provenanceSourceLabel: PROVENANCE_LABEL,
          relatedActionIds: [ACTION_ID],
          relatedDocumentIds: [DOC_ID],
        },
        {
          domain: "terra",
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-NEAR_1`,
          provenanceSourceId: PROVENANCE_ID,
          provenanceSourceType: PROVENANCE_TYPE,
          provenanceSourceLabel: PROVENANCE_LABEL,
        },
        {
          domain: "vessels",
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-NEAR_2`,
          provenanceSourceId: PROVENANCE_ID,
          provenanceSourceType: PROVENANCE_TYPE,
          provenanceSourceLabel: PROVENANCE_LABEL,
        },
        {
          domain: "aegis",
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-FAR`,
          provenanceSourceId: PROVENANCE_ID,
          provenanceSourceType: PROVENANCE_TYPE,
          provenanceSourceLabel: PROVENANCE_LABEL,
        },
      ])
      .returning({ id: cstNodes.id, name: cstNodes.name });

    const byName = new Map(insertedNodes.map((n) => [n.name, n.id] as const));
    seeded.hub = byName.get(`${RUN_TAG}-HUB`)!;
    seeded.near1 = byName.get(`${RUN_TAG}-NEAR_1`)!;
    seeded.near2 = byName.get(`${RUN_TAG}-NEAR_2`)!;
    seeded.far = byName.get(`${RUN_TAG}-FAR`)!;
    seeded.nodeIds = [seeded.hub, seeded.near1, seeded.near2, seeded.far];

    const insertedEdges = await db
      .insert(cstEdges)
      .values([
        {
          fromNodeId: seeded.hub,
          toNodeId: seeded.near1,
          relationshipType: `${RUN_TAG}_hub_to_near1`,
          sourceId: PROVENANCE_ID,
          sourceType: PROVENANCE_TYPE,
          sourceLabel: PROVENANCE_LABEL,
        },
        {
          fromNodeId: seeded.hub,
          toNodeId: seeded.near2,
          relationshipType: `${RUN_TAG}_hub_to_near2`,
          sourceId: PROVENANCE_ID,
          sourceType: PROVENANCE_TYPE,
          sourceLabel: PROVENANCE_LABEL,
        },
        {
          fromNodeId: seeded.near1,
          toNodeId: seeded.far,
          relationshipType: `${RUN_TAG}_near1_to_far`,
          sourceId: PROVENANCE_ID,
          sourceType: PROVENANCE_TYPE,
          sourceLabel: PROVENANCE_LABEL,
        },
      ])
      .returning({ id: cstEdges.id, fromNodeId: cstEdges.fromNodeId, toNodeId: cstEdges.toNodeId });

    seeded.edgeIds = insertedEdges.map((e) => e.id);
    seeded.edgeHubNear1 = insertedEdges.find(
      (e) => e.fromNodeId === seeded.hub && e.toNodeId === seeded.near1,
    )!.id;
    seeded.edgeHubNear2 = insertedEdges.find(
      (e) => e.fromNodeId === seeded.hub && e.toNodeId === seeded.near2,
    )!.id;
    seeded.edgeNear1Far = insertedEdges.find(
      (e) => e.fromNodeId === seeded.near1 && e.toNodeId === seeded.far,
    )!.id;

    const insertedEvidence = await db
      .insert(cstEdgeEvidence)
      .values([
        {
          edgeId: seeded.edgeHubNear1,
          evidenceType: EVIDENCE_TYPE,
          sourceId: PROVENANCE_ID,
          sourceLabel: EVIDENCE_SOURCE_LABEL,
          recordedBy: TEST_USER.id,
          payload: { note: `evidence-${RUN_TAG}`, level: 7 },
        },
      ])
      .returning({ id: cstEdgeEvidence.id });
    seeded.evidenceId = insertedEvidence[0].id;
  }, 60000);

  afterAll(async () => {
    const { db, cstNodes, cstEdges, cstEdgeEvidence } = await import(
      "@szl-holdings/db"
    );
    const { inArray } = await import("drizzle-orm");
    if (seeded.evidenceId) {
      await db.delete(cstEdgeEvidence).where(inArray(cstEdgeEvidence.id, [seeded.evidenceId]));
    }
    if (seeded.edgeIds.length > 0) {
      await db.delete(cstEdges).where(inArray(cstEdges.id, seeded.edgeIds));
    }
    if (seeded.nodeIds.length > 0) {
      await db.delete(cstNodes).where(inArray(cstNodes.id, seeded.nodeIds));
    }
  });

  describe("JSON format", () => {
    it("returns enriched per-node provenance, linked event ids, and per-edge evidence", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "json", depth: 2 });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);

      const payload: ExportPayload = JSON.parse(res.text) as ExportPayload;

      expect(payload.origin.id).toBe(seeded.hub);
      expect(payload.depth).toBe(2);
      expect(typeof payload.generatedAt).toBe("string");
      expect(payload.stats).toMatchObject({
        nodeCount: 4,
        edgeCount: 3,
        evidenceCount: 1,
      });

      const nodes = payload.nodes;
      expect(nodes.map((n) => n.id).sort()).toEqual(
        [...seeded.nodeIds].sort(),
      );

      const hubNode = nodes.find((n) => n.id === seeded.hub);
      expect(hubNode).toBeTruthy();
      expect(hubNode!.provenance).toMatchObject({
        sourceId: PROVENANCE_ID,
        sourceType: PROVENANCE_TYPE,
        sourceLabel: PROVENANCE_LABEL,
      });
      expect(typeof hubNode!.provenance.lastUpdatedAt).toBe("string");
      expect(hubNode!.linkedEvents.actionIds).toContain(ACTION_ID);
      expect(hubNode!.linkedEvents.documentIds).toContain(DOC_ID);
      expect(hubNode!.linkedEvents.all).toEqual(
        expect.arrayContaining([ACTION_ID, DOC_ID]),
      );
      expect(hubNode!.distance).toBe(0);

      const farNode = nodes.find((n) => n.id === seeded.far);
      expect(farNode).toBeTruthy();
      expect(farNode!.distance).toBe(2);

      const edges = payload.edges;
      expect(edges.map((e) => e.id).sort()).toEqual([...seeded.edgeIds].sort());

      const hubNear1Edge = edges.find((e) => e.id === seeded.edgeHubNear1);
      expect(hubNear1Edge).toBeTruthy();
      expect(hubNear1Edge!.source).toMatchObject({
        sourceId: PROVENANCE_ID,
        sourceType: PROVENANCE_TYPE,
        sourceLabel: PROVENANCE_LABEL,
      });
      expect(Array.isArray(hubNear1Edge!.evidence)).toBe(true);
      expect(hubNear1Edge!.evidence.length).toBe(1);
      expect(hubNear1Edge!.evidence[0]).toMatchObject({
        id: seeded.evidenceId,
        evidenceType: EVIDENCE_TYPE,
        sourceId: PROVENANCE_ID,
        sourceLabel: EVIDENCE_SOURCE_LABEL,
        recordedBy: TEST_USER.id,
      });
      expect(hubNear1Edge!.evidence[0].payload).toMatchObject({
        note: `evidence-${RUN_TAG}`,
        level: 7,
      });

      const hubNear2Edge = edges.find((e) => e.id === seeded.edgeHubNear2);
      expect(hubNear2Edge).toBeTruthy();
      expect(hubNear2Edge!.evidence).toEqual([]);

      expect(payload.truncated).toBe(false);
    });

    it("sets a Content-Disposition filename matching trace-{slug}-{timestamp}.json", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "json" });

      expect(res.status).toBe(200);
      const disposition = res.headers["content-disposition"];
      expect(disposition).toBeTruthy();

      const match = /attachment; filename="(trace-[a-z0-9-]+-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d+Z)\.json"/.exec(
        disposition,
      );
      expect(match, `Content-Disposition did not match expected pattern: ${disposition}`).toBeTruthy();

      const expectedSlugFragment = `${RUN_TAG}-hub`.toLowerCase();
      expect(match![1]).toContain(expectedSlugFragment);
    });

    it("flips truncated=true when maxNodes is too small to fit the BFS frontier", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "json", depth: 2, maxNodes: 2 });

      expect(res.status).toBe(200);
      const payload = JSON.parse(res.text);
      expect(payload.truncated).toBe(true);
      expect(payload.stats.nodeCount).toBeLessThan(4);
    });
  });

  describe("CSV format", () => {
    it("emits NODES, EDGES, and EVIDENCE sections with provenance columns", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "csv", depth: 2 });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);

      const body = res.text;

      // Header block keys present.
      expect(body).toMatch(/^# Constellation trace export/m);
      expect(body).toMatch(/^# generated_at,/m);
      expect(body).toMatch(/^# origin_id,/m);
      expect(body).toMatch(/^# node_count,4/m);
      expect(body).toMatch(/^# edge_count,3/m);
      expect(body).toMatch(/^# evidence_count,1/m);

      // Section markers.
      const nodesIdx = body.indexOf("# NODES");
      const edgesIdx = body.indexOf("# EDGES");
      const evidenceIdx = body.indexOf("# EVIDENCE");
      expect(nodesIdx).toBeGreaterThan(-1);
      expect(edgesIdx).toBeGreaterThan(nodesIdx);
      expect(evidenceIdx).toBeGreaterThan(edgesIdx);

      const nodesBlock = body.slice(nodesIdx, edgesIdx);
      const edgesBlock = body.slice(edgesIdx, evidenceIdx);
      const evidenceBlock = body.slice(evidenceIdx);

      // NODES header includes the provenance + linked-event columns.
      expect(nodesBlock).toContain(
        "id,canonical_id,entity_type,name,domain,hop_distance,confidence,sensitivity_tier,is_active,freshness,labels,description,provenance_source_id,provenance_source_type,provenance_source_label,last_updated_at,linked_event_ids",
      );
      // The hub row carries our provenance + linked events.
      expect(nodesBlock).toContain(seeded.hub);
      expect(nodesBlock).toContain(PROVENANCE_ID);
      expect(nodesBlock).toContain(PROVENANCE_TYPE);
      expect(nodesBlock).toContain(ACTION_ID);
      expect(nodesBlock).toContain(DOC_ID);

      // EDGES header includes source + evidence count.
      expect(edgesBlock).toContain(
        "id,from_node_id,to_node_id,relationship_type,confidence,active,created_at,updated_at,source_id,source_type,source_label,evidence_count",
      );
      expect(edgesBlock).toContain(seeded.edgeHubNear1);
      expect(edgesBlock).toContain(`${RUN_TAG}_hub_to_near1`);

      // EVIDENCE section has the seeded row with payload.
      expect(evidenceBlock).toContain(
        "edge_id,evidence_id,evidence_type,source_id,source_label,confidence,recorded_by,recorded_at,payload",
      );
      expect(evidenceBlock).toContain(seeded.evidenceId);
      expect(evidenceBlock).toContain(EVIDENCE_TYPE);
      expect(evidenceBlock).toContain(EVIDENCE_SOURCE_LABEL);
      expect(evidenceBlock).toContain(`evidence-${RUN_TAG}`);
    });

    it("sets a Content-Disposition filename matching trace-{slug}-{timestamp}.csv", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "csv" });

      expect(res.status).toBe(200);
      const disposition = res.headers["content-disposition"];
      expect(disposition).toBeTruthy();
      const match = /attachment; filename="(trace-[a-z0-9-]+-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d+Z)\.csv"/.exec(
        disposition,
      );
      expect(match, `Content-Disposition did not match expected pattern: ${disposition}`).toBeTruthy();
    });
  });

  describe("validation", () => {
    it("returns 404 for an unknown UUID", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await request(app).get(
        `/graph/entities/${fakeUuid}/subgraph/export`,
      );
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    it("rejects unsupported format values with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ format: "xml" });
      expect(res.status).toBe(400);
    });

    it("rejects depth below the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ depth: 0 });
      expect(res.status).toBe(400);
    });

    it("rejects depth above the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ depth: 99 });
      expect(res.status).toBe(400);
    });

    it("rejects non-numeric depth with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ depth: "deep" });
      expect(res.status).toBe(400);
    });

    it("rejects maxNodes below the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ maxNodes: 1 });
      expect(res.status).toBe(400);
    });

    it("rejects maxNodes above the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ maxNodes: 9999 });
      expect(res.status).toBe(400);
    });

    it("rejects perHopLimit below the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ perHopLimit: 0 });
      expect(res.status).toBe(400);
    });

    it("rejects perHopLimit above the allowed range with 400", async () => {
      const res = await request(app)
        .get(`/graph/entities/${seeded.hub}/subgraph/export`)
        .query({ perHopLimit: 9999 });
      expect(res.status).toBe(400);
    });
  });
});

afterAll(async () => {
  try {
    const { pool } = await import("@szl-holdings/db");
    await pool.end();
  } catch {
    // pool may already be closed by a sibling test file
  }
});

import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import {
  queryNodes,
  getNodeById,
  searchNodes,
  queryEdges,
  CstQueryFiltersSchema,
  CstRelationshipFiltersSchema,
  CstSearchParamsSchema,
} from "@szl-holdings/constellation";
import { db, cstNodes, cstEdges } from "@szl-holdings/db";
import { eq, or, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.use(authMiddleware({ required: false }));

router.get("/graph/entities", async (req: Request, res: Response) => {
  try {
    const parsed = CstQueryFiltersSchema.safeParse({
      domain: req.query.domain,
      entityType: req.query.entityType,
      sensitivityTier: req.query.sensitivityTier,
      isActive: req.query.isActive !== undefined ? req.query.isActive !== "false" : undefined,
      minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid query parameters", { errors: parsed.error.flatten() });
    }

    const result = await queryNodes(parsed.data);
    return sendSuccess(res, result);
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities");
  }
});

router.get("/graph/entities/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const node = await getNodeById(id);
    if (!node) {
      return res.status(404).json({ error: "Entity not found", id });
    }
    return sendSuccess(res, { node });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities/:id");
  }
});

/**
 * GET /graph/entities/:id/neighbors
 *
 * Returns the entity plus its 1-hop neighbors and the edges that connect them.
 * Used by ConstellationGraph's "Expand neighbor" action so operators can
 * traverse the constellation across domain boundaries interactively.
 *
 * Query params:
 *   limit  max neighbors to return (default 25, max 200)
 */
router.get("/graph/entities/:id/neighbors", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawLimit = parseInt((req.query.limit as string) ?? "25", 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 200) {
      return sendBadRequest(res, "limit must be 1–200");
    }

    const node = await getNodeById(id);
    if (!node) {
      return res.status(404).json({ error: "Entity not found", id });
    }

    const edgeRows = await db
      .select()
      .from(cstEdges)
      .where(or(eq(cstEdges.fromNodeId, id), eq(cstEdges.toNodeId, id)))
      .limit(rawLimit);

    const neighborIds = Array.from(
      new Set(
        edgeRows
          .map((e) => (e.fromNodeId === id ? e.toNodeId : e.fromNodeId))
          .filter((nid): nid is string => !!nid && nid !== id),
      ),
    );

    const neighborRows = neighborIds.length > 0
      ? await db.select().from(cstNodes).where(inArray(cstNodes.id, neighborIds))
      : [];

    return sendSuccess(res, {
      node,
      neighbors: neighborRows.map((n) => ({
        id: n.id,
        canonicalId: n.canonicalId,
        domain: n.domain,
        entityType: n.entityType,
        name: n.name,
        description: n.description,
        labels: n.labels,
        confidence: n.confidence,
        sensitivityTier: n.sensitivityTier,
        isActive: n.isActive,
        freshness: n.freshness,
        extensions: n.extensions,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      edges: edgeRows.map((e) => ({
        id: e.id,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        relationshipType: e.relationshipType,
        confidence: e.confidence,
        active: e.active,
        createdAt: e.createdAt,
      })),
      stats: {
        neighborCount: neighborRows.length,
        edgeCount: edgeRows.length,
      },
    });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities/:id/neighbors");
  }
});

/**
 * GET /graph/entities/:id/subgraph
 *
 * Walks the constellation outward from a starting node up to `depth` hops,
 * returning every node reached and the edges that connect them, plus the
 * shortest-hop distance from the origin for each node.
 *
 * Used by ConstellationGraph's "Trace path" / "Expand N hops" action so
 * operators can chase chains (e.g. vessel → owner → sanctioned counterparty)
 * in a single request without manually expanding each hop.
 *
 * Query params:
 *   depth        BFS depth (default 2, range 1–4)
 *   maxNodes     soft cap on total nodes returned (default 75, max 300)
 *   perHopLimit  max edges examined per node per hop (default 25, max 100)
 *
 * Response shape mirrors the /neighbors endpoint and adds `distances`
 * (id → hop count) plus `truncated` to flag when caps stopped expansion.
 */
router.get("/graph/entities/:id/subgraph", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const depth = parseInt((req.query.depth as string) ?? "2", 10);
    if (isNaN(depth) || depth < 1 || depth > 4) {
      return sendBadRequest(res, "depth must be 1–4");
    }
    const maxNodes = parseInt((req.query.maxNodes as string) ?? "75", 10);
    if (isNaN(maxNodes) || maxNodes < 2 || maxNodes > 300) {
      return sendBadRequest(res, "maxNodes must be 2–300");
    }
    const perHopLimit = parseInt((req.query.perHopLimit as string) ?? "25", 10);
    if (isNaN(perHopLimit) || perHopLimit < 1 || perHopLimit > 100) {
      return sendBadRequest(res, "perHopLimit must be 1–100");
    }

    const origin = await getNodeById(id);
    if (!origin) {
      return res.status(404).json({ error: "Entity not found", id });
    }

    // BFS frontier expansion. We track:
    //   distances: id -> shortest hop count from origin
    //   collectedEdges: edge id -> edge row (deduped)
    //   visitedNodeIds: every node reached (origin + neighbors at any depth)
    const distances = new Map<string, number>();
    distances.set(id, 0);
    const collectedEdges = new Map<string, typeof cstEdges.$inferSelect>();
    let frontier: string[] = [id];
    let truncated = false;

    for (let hop = 1; hop <= depth; hop++) {
      if (frontier.length === 0) break;

      const edgeRows = await db
        .select()
        .from(cstEdges)
        .where(or(inArray(cstEdges.fromNodeId, frontier), inArray(cstEdges.toNodeId, frontier)))
        .limit(perHopLimit * frontier.length);

      const nextFrontier = new Set<string>();
      for (const e of edgeRows) {
        collectedEdges.set(e.id, e);
        const endpoints = [e.fromNodeId, e.toNodeId].filter(
          (nid): nid is string => !!nid,
        );
        for (const nid of endpoints) {
          if (distances.has(nid)) continue;
          if (distances.size >= maxNodes) {
            truncated = true;
            continue;
          }
          distances.set(nid, hop);
          nextFrontier.add(nid);
        }
      }

      // If we hit the perHopLimit cap, edges may have been dropped server-side
      if (edgeRows.length >= perHopLimit * frontier.length) {
        truncated = true;
      }

      frontier = Array.from(nextFrontier);
    }

    const allNodeIds = Array.from(distances.keys());
    const nodeRows = await db.select().from(cstNodes).where(inArray(cstNodes.id, allNodeIds));

    // Drop any edges that point at nodes excluded by the maxNodes cap.
    // Returning them would cause the client renderer to materialize
    // placeholder nodes for the missing endpoints — silently defeating
    // the cap and risking thousands of rendered nodes on dense graphs.
    const includedNodeIds = new Set(allNodeIds);
    const filteredEdges: Array<typeof cstEdges.$inferSelect> = [];
    for (const e of collectedEdges.values()) {
      if (
        e.fromNodeId &&
        e.toNodeId &&
        includedNodeIds.has(e.fromNodeId) &&
        includedNodeIds.has(e.toNodeId)
      ) {
        filteredEdges.push(e);
      } else {
        // An endpoint was excluded by the cap — surface that to the client.
        truncated = true;
      }
    }

    return sendSuccess(res, {
      origin: {
        id: origin.id,
        canonicalId: origin.canonicalId,
        domain: origin.domain,
        entityType: origin.entityType,
        name: origin.name,
      },
      depth,
      truncated,
      distances: Object.fromEntries(distances),
      nodes: nodeRows.map((n) => ({
        id: n.id,
        canonicalId: n.canonicalId,
        domain: n.domain,
        entityType: n.entityType,
        name: n.name,
        description: n.description,
        labels: n.labels,
        confidence: n.confidence,
        sensitivityTier: n.sensitivityTier,
        isActive: n.isActive,
        freshness: n.freshness,
        extensions: n.extensions,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        distance: distances.get(n.id) ?? null,
      })),
      edges: filteredEdges.map((e) => ({
        id: e.id,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        relationshipType: e.relationshipType,
        confidence: e.confidence,
        active: e.active,
        createdAt: e.createdAt,
      })),
      stats: {
        nodeCount: nodeRows.length,
        edgeCount: filteredEdges.length,
        maxDistance: Math.max(0, ...distances.values()),
      },
    });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities/:id/subgraph");
  }
});

router.get("/graph/search", async (req: Request, res: Response) => {
  try {
    const parsed = CstSearchParamsSchema.safeParse({
      q: req.query.q,
      domain: req.query.domain,
      entityType: req.query.entityType,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid search parameters", { errors: parsed.error.flatten() });
    }

    const nodes = await searchNodes(parsed.data);
    return sendSuccess(res, { nodes, count: nodes.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/search");
  }
});

router.get("/graph/relationships", async (req: Request, res: Response) => {
  try {
    const parsed = CstRelationshipFiltersSchema.safeParse({
      fromNodeId: req.query.fromNodeId,
      toNodeId: req.query.toNodeId,
      relationshipType: req.query.relationshipType,
      active: req.query.active !== undefined ? req.query.active !== "false" : undefined,
      minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined,
      includeEvidence: req.query.includeEvidence === "true",
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid query parameters", { errors: parsed.error.flatten() });
    }

    const result = await queryEdges(parsed.data);
    return sendSuccess(res, result);
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/relationships");
  }
});

export default router;

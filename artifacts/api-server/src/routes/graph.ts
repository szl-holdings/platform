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

/**
 * GET /graph/entities/:fromId/path/:toId
 *
 * Returns the shortest connecting edge sequence between two Constellation
 * entities, found via bidirectional BFS with a depth cap. Used by
 * ConstellationGraph's "Find path between" action so investigators can ask
 * "how is A connected to B?" and see the chain highlighted on the canvas.
 *
 * Query params:
 *   maxDepth   per-side BFS depth cap (default 4, range 1–6). The longest
 *              total path returned is therefore 2 * maxDepth hops.
 *
 * Response:
 *   { from, to, found, depth, path: { nodes, edges, crossDomainSteps } }
 *   - path.nodes:  ordered list from origin to target (length = depth + 1)
 *   - path.edges:  ordered edges connecting consecutive nodes (length = depth)
 *   - crossDomainSteps: indices of edges whose endpoints span domains
 *   When no path exists within the depth cap, found=false and path=null.
 */
router.get("/graph/entities/:fromId/path/:toId", async (req: Request, res: Response) => {
  try {
    const fromId = String(req.params.fromId);
    const toId = String(req.params.toId);
    if (fromId === toId) {
      return sendBadRequest(res, "fromId and toId must differ");
    }

    const maxDepth = parseInt((req.query.maxDepth as string) ?? "4", 10);
    if (isNaN(maxDepth) || maxDepth < 1 || maxDepth > 6) {
      return sendBadRequest(res, "maxDepth must be 1–6");
    }

    const [fromNode, toNode] = await Promise.all([
      getNodeById(fromId),
      getNodeById(toId),
    ]);
    if (!fromNode) return res.status(404).json({ error: "Origin not found", id: fromId });
    if (!toNode) return res.status(404).json({ error: "Target not found", id: toId });

    // Bidirectional BFS — expand frontiers from both ends and stop as soon as
    // they meet. For each visited node we keep (parentId, edgeId) so we can
    // reconstruct the connecting chain. We capture every edge we touch so the
    // client can render the highlighted segments without a second round-trip.
    type Step = { parent: string | null; edge: typeof cstEdges.$inferSelect | null };
    const fromSide = new Map<string, Step>([[fromId, { parent: null, edge: null }]]);
    const toSide = new Map<string, Step>([[toId, { parent: null, edge: null }]]);
    let fromFrontier: string[] = [fromId];
    let toFrontier: string[] = [toId];
    let meeting: string | null = null;

    const expand = async (
      frontier: string[],
      thisSide: Map<string, Step>,
      otherSide: Map<string, Step>,
    ): Promise<{ next: string[]; meet: string | null }> => {
      if (frontier.length === 0) return { next: [], meet: null };
      const edgeRows = await db
        .select()
        .from(cstEdges)
        .where(or(inArray(cstEdges.fromNodeId, frontier), inArray(cstEdges.toNodeId, frontier)));
      const nextSet = new Set<string>();
      let meet: string | null = null;
      const frontierSet = new Set(frontier);
      for (const e of edgeRows) {
        if (!e.fromNodeId || !e.toNodeId) continue;
        // Edge connects a frontier node to a neighbor — figure out which side.
        const fromInFrontier = frontierSet.has(e.fromNodeId);
        const toInFrontier = frontierSet.has(e.toNodeId);
        if (!fromInFrontier && !toInFrontier) continue;
        const anchor = fromInFrontier ? e.fromNodeId : e.toNodeId;
        const neighbor = fromInFrontier ? e.toNodeId : e.fromNodeId;
        if (thisSide.has(neighbor)) continue;
        thisSide.set(neighbor, { parent: anchor, edge: e });
        nextSet.add(neighbor);
        if (otherSide.has(neighbor)) {
          // Finishing the layer is fine; remember the first meeting point.
          // BFS guarantees it's on a shortest path.
          meet = neighbor;
        }
      }
      return { next: Array.from(nextSet), meet };
    };

    for (let hop = 1; hop <= maxDepth; hop++) {
      // Always expand the smaller frontier first to keep the search balanced.
      const expandFromSide = fromFrontier.length <= toFrontier.length;
      if (expandFromSide) {
        const r = await expand(fromFrontier, fromSide, toSide);
        fromFrontier = r.next;
        if (r.meet) {
          meeting = r.meet;
          break;
        }
      } else {
        const r = await expand(toFrontier, toSide, fromSide);
        toFrontier = r.next;
        if (r.meet) {
          meeting = r.meet;
          break;
        }
      }
      // If both frontiers are empty we can stop — the graph component is
      // exhausted on at least one side.
      if (fromFrontier.length === 0 && toFrontier.length === 0) break;
    }

    if (!meeting) {
      return sendSuccess(res, {
        from: { id: fromNode.id, name: fromNode.name, domain: fromNode.domain },
        to: { id: toNode.id, name: toNode.name, domain: toNode.domain },
        found: false,
        maxDepth,
        path: null,
      });
    }

    // Reconstruct: walk fromSide back to fromId, then toSide forward to toId.
    const leftNodeIds: string[] = [];
    const leftEdges: Array<typeof cstEdges.$inferSelect> = [];
    let cur: string | null = meeting;
    while (cur) {
      leftNodeIds.push(cur);
      const step = fromSide.get(cur);
      if (!step || !step.parent) break;
      if (step.edge) leftEdges.push(step.edge);
      cur = step.parent;
    }
    leftNodeIds.reverse();
    leftEdges.reverse();

    const rightNodeIds: string[] = [];
    const rightEdges: Array<typeof cstEdges.$inferSelect> = [];
    let walker: string | null = meeting;
    while (walker) {
      const step = toSide.get(walker);
      if (!step || !step.parent) break;
      if (step.edge) rightEdges.push(step.edge);
      rightNodeIds.push(step.parent);
      walker = step.parent;
    }

    const orderedNodeIds = [...leftNodeIds, ...rightNodeIds];
    const orderedEdges = [...leftEdges, ...rightEdges];

    // Hydrate node rows once, preserving the path order.
    const nodeRows = orderedNodeIds.length > 0
      ? await db.select().from(cstNodes).where(inArray(cstNodes.id, orderedNodeIds))
      : [];
    const nodeById = new Map(nodeRows.map((n) => [n.id, n] as const));
    const orderedNodes = orderedNodeIds
      .map((id) => nodeById.get(id))
      .filter((n): n is NonNullable<typeof n> => !!n);

    // A step is cross-domain when its two endpoints belong to different domains.
    const crossDomainSteps: number[] = [];
    for (let i = 0; i < orderedEdges.length; i++) {
      const a = nodeById.get(orderedNodeIds[i]);
      const b = nodeById.get(orderedNodeIds[i + 1]);
      if (a && b && a.domain && b.domain && a.domain !== b.domain) {
        crossDomainSteps.push(i);
      }
    }

    return sendSuccess(res, {
      from: { id: fromNode.id, name: fromNode.name, domain: fromNode.domain },
      to: { id: toNode.id, name: toNode.name, domain: toNode.domain },
      found: true,
      maxDepth,
      depth: orderedEdges.length,
      path: {
        nodes: orderedNodes.map((n) => ({
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
        edges: orderedEdges.map((e) => ({
          id: e.id,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          relationshipType: e.relationshipType,
          confidence: e.confidence,
          active: e.active,
          createdAt: e.createdAt,
        })),
        crossDomainSteps,
      },
    });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities/:fromId/path/:toId");
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

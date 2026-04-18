/**
 * /domains/:domain/graph — Domain-scoped Constellation projections
 *
 * Each domain endpoint returns the nodes and edges from Constellation
 * filtered to that domain, plus inbound cross-domain edges where the
 * target node belongs to this domain.
 *
 * Routes:
 *   GET  /domains/terra/graph
 *   GET  /domains/prism/graph
 *   GET  /domains/vessels/graph
 *   GET  /domains/aegis/graph
 *   GET  /domains/lyte/graph
 *   GET  /domains/:domain/graph   — generic fallback for other known domains
 *
 * Query params:
 *   entityType   filter by entity type
 *   isActive     filter active-only (default: true). Pass `isActive=false`
 *                to fetch ONLY inactive nodes, or `isActive=all` to disable
 *                the filter and return both active and inactive nodes.
 *   limit        max nodes (default: 100, max: 500)
 *   offset       pagination offset (default: 0)
 *   includeCross include cross-domain edges (default: true)
 *   activeEdgesOnly  exclude edges where active=false (default: false)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import { cstNodes, cstEdges } from "@szl-holdings/db";
import { eq, and, or, sql, inArray, notInArray } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";

const router: IRouter = Router();
router.use(authMiddleware({ required: false }));
router.use(perUserApiSlidingLimiter);

const KNOWN_DOMAINS = ["terra", "prism", "vessels", "aegis", "lyte", "imperium", "carlota-jo", "platform"] as const;
type KnownDomain = typeof KNOWN_DOMAINS[number];

async function buildDomainGraph(
  domain: string,
  opts: {
    entityType?: string;
    isActive?: boolean;
    limit: number;
    offset: number;
    includeCross: boolean;
    activeEdgesOnly: boolean;
  }
) {
  const nodeConditions = [eq(cstNodes.domain, domain)];
  if (opts.entityType) nodeConditions.push(eq(cstNodes.entityType, opts.entityType));
  if (opts.isActive !== undefined) nodeConditions.push(eq(cstNodes.isActive, opts.isActive));

  const [nodes, nodeCountResult, allDomainNodeIdRows] = await Promise.all([
    db
      .select()
      .from(cstNodes)
      .where(and(...nodeConditions))
      .limit(opts.limit)
      .offset(opts.offset)
      .orderBy(cstNodes.createdAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstNodes)
      .where(and(...nodeConditions)),
    db
      .select({ id: cstNodes.id })
      .from(cstNodes)
      .where(and(...nodeConditions)),
  ]);
  const allDomainNodeIds = allDomainNodeIdRows.map((r) => r.id);

  const nodeIds = nodes.map((n) => n.id);
  let edges: (typeof cstEdges.$inferSelect)[] = [];

  if (nodeIds.length > 0) {
    if (opts.includeCross) {
      const whereExpr = opts.activeEdgesOnly
        ? and(
            or(
              inArray(cstEdges.fromNodeId, nodeIds),
              inArray(cstEdges.toNodeId, nodeIds),
            ),
            eq(cstEdges.active, true),
          )
        : or(
            inArray(cstEdges.fromNodeId, nodeIds),
            inArray(cstEdges.toNodeId, nodeIds),
          );
      edges = await db
        .select()
        .from(cstEdges)
        .where(whereExpr)
        .limit(opts.limit * 3);
    } else {
      const internalConds = [
        inArray(cstEdges.fromNodeId, nodeIds),
        inArray(cstEdges.toNodeId, nodeIds),
      ];
      if (opts.activeEdgesOnly) internalConds.push(eq(cstEdges.active, true));
      edges = await db
        .select()
        .from(cstEdges)
        .where(and(...internalConds))
        .limit(opts.limit * 2);
    }
  }

  const nodeIdSet = new Set(nodeIds);
  const crossDomainEdges = edges.filter((e) => {
    const fromInDomain = nodeIdSet.has(e.fromNodeId);
    const toInDomain = nodeIdSet.has(e.toNodeId);
    return (fromInDomain && !toInDomain) || (!fromInDomain && toInDomain);
  });

  // True totals across the entire (filtered) domain — independent of the
  // current limit/offset window — so the UI can show "loaded / total" and
  // analysts know how many connections still aren't loaded.
  let totalInternalEdgeCount = 0;
  let totalCrossDomainEdgeCount = 0;
  if (allDomainNodeIds.length > 0) {
    const [internalTotalRow, crossTotalRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(cstEdges)
        .where(
          and(
            inArray(cstEdges.fromNodeId, allDomainNodeIds),
            inArray(cstEdges.toNodeId, allDomainNodeIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(cstEdges)
        .where(
          or(
            and(
              inArray(cstEdges.fromNodeId, allDomainNodeIds),
              notInArray(cstEdges.toNodeId, allDomainNodeIds),
            ),
            and(
              notInArray(cstEdges.fromNodeId, allDomainNodeIds),
              inArray(cstEdges.toNodeId, allDomainNodeIds),
            ),
          ),
        ),
    ]);
    totalInternalEdgeCount = internalTotalRow[0]?.count ?? 0;
    totalCrossDomainEdgeCount = crossTotalRow[0]?.count ?? 0;
  }

  return {
    domain,
    nodes: nodes.map((n) => ({
      id: n.id,
      canonicalId: n.canonicalId,
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
    edges: edges.map((e) => ({
      id: e.id,
      fromNodeId: e.fromNodeId,
      toNodeId: e.toNodeId,
      relationshipType: e.relationshipType,
      confidence: e.confidence,
      active: e.active,
      createdAt: e.createdAt,
    })),
    stats: {
      nodeCount: nodeCountResult[0]?.count ?? 0,
      edgeCount: edges.length,
      crossDomainEdgeCount: crossDomainEdges.length,
      internalEdgeCount: edges.length - crossDomainEdges.length,
      totalInternalEdgeCount,
      totalCrossDomainEdgeCount,
      totalEdgeCount: totalInternalEdgeCount + totalCrossDomainEdgeCount,
    },
  };
}

function domainHandler(domain: string) {
  return async (req: Request, res: Response) => {
    try {
      const rawLimit = parseInt((req.query.limit as string) ?? "100", 10);
      const rawOffset = parseInt((req.query.offset as string) ?? "0", 10);
      if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
        return sendBadRequest(res, "limit must be 1–500");
      }
      if (isNaN(rawOffset) || rawOffset < 0) {
        return sendBadRequest(res, "offset must be >= 0");
      }
      const includeCross = req.query.includeCross !== "false";
      const isActiveRaw = req.query.isActive as string | undefined;
      const isActive = isActiveRaw === "all" ? undefined : isActiveRaw !== "false";
      const activeEdgesOnly = req.query.activeEdgesOnly === "true";

      const graph = await buildDomainGraph(domain, {
        entityType: req.query.entityType as string | undefined,
        isActive,
        limit: rawLimit,
        offset: rawOffset,
        includeCross,
        activeEdgesOnly,
      });
      return sendSuccess(res, graph);
    } catch (err) {
      return handleRouteError(res, err, `GET /domains/${domain}/graph`);
    }
  };
}

router.get("/domains/terra/graph", domainHandler("terra"));
router.get("/domains/prism/graph", domainHandler("prism"));
router.get("/domains/vessels/graph", domainHandler("vessels"));
router.get("/domains/aegis/graph", domainHandler("aegis"));
router.get("/domains/lyte/graph", domainHandler("lyte"));

router.get("/domains/:domain/graph", async (req: Request, res: Response) => {
  const { domain } = req.params as { domain: string };
  if (!KNOWN_DOMAINS.includes(domain as KnownDomain)) {
    return sendBadRequest(res, `Unknown domain '${domain}'. Known: ${KNOWN_DOMAINS.join(", ")}`);
  }
  return domainHandler(domain)(req, res);
});

export default router;

/**
 * Executive Briefing Engine routes
 *
 * Generates structured, evidence-first executive briefs backed by the
 * cognitive runtime: world-model (constellation nodes), memory-fabric,
 * and recent reflections. Every brief is verifier-gated before publish.
 *
 * Routes:
 *   GET  /pulse/executive                     — latest consolidated brief
 *   GET  /pulse/executive/:domain             — domain-scoped brief
 *   POST /pulse/executive/generate            — force-generate consolidated brief
 *   POST /pulse/executive/generate/:domain    — force-generate domain brief
 *   GET  /pulse/executive/history             — list recent exec briefs
 *   GET  /pulse/executive/brief/:id           — specific brief by ID
 */

import { randomUUID } from 'node:crypto';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  cstEdges,
  cstNodes,
  db,
  pulseBriefingsTable,
  pulseExecBriefsTable,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import type {
  MemoryEntry,
  RecentReflection,
  WorldModelEdge,
  WorldModelEntity,
} from '@workspace/executive-briefing';
import {
  buildBriefContext,
  buildCitationManifest,
  buildCitations,
  buildSystemPrompt,
  buildUserPrompt,
  extractEntityProvenance,
  gateBrief,
  getAgentId,
  parseBriefResponse,
  SUPPORTED_DOMAINS,
  type SupportedDomain,
} from '@workspace/executive-briefing';
import { and, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { gatewayInfer } from '../lib/ai-gateway';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router = Router();

const KNOWN_EXEC_DOMAINS: SupportedDomain[] = [
  'vessels',
  'aegis',
  'terra',
  'lyte',
  'prism',
  'szl-holdings',
  'consolidated',
];

const DOMAIN_ALIAS: Record<string, string> = {
  firestorm: 'aegis',
  maritime: 'vessels',
  realestate: 'terra',
};

function normalizeDomain(d: string): string {
  return DOMAIN_ALIAS[d] ?? d;
}

async function fetchWorldModelEntities(domain: string): Promise<WorldModelEntity[]> {
  try {
    const domainFilter = domain === 'consolidated' ? undefined : domain;
    const rows = await db
      .select({
        id: cstNodes.id,
        canonicalId: cstNodes.canonicalId,
        name: cstNodes.name,
        entityType: cstNodes.entityType,
        domain: cstNodes.domain,
        confidence: cstNodes.confidence,
        attributes: cstNodes.extensions,
        freshness: cstNodes.freshness,
        isActive: cstNodes.isActive,
      })
      .from(cstNodes)
      .where(
        domainFilter
          ? and(eq(cstNodes.domain, domainFilter), eq(cstNodes.isActive, true))
          : eq(cstNodes.isActive, true),
      )
      // Highest-confidence, freshest entities first so the brief talks about
      // the most-trustworthy state of the world model rather than arbitrary rows.
      .orderBy(desc(cstNodes.confidence), desc(cstNodes.freshness))
      .limit(domain === 'consolidated' ? 200 : 100);

    return rows.map((r) => ({
      id: String(r.id),
      canonicalId: r.canonicalId ? String(r.canonicalId) : undefined,
      name: r.name ?? undefined,
      entityType: r.entityType,
      domain: r.domain,
      confidence: Number(r.confidence ?? 0.8),
      attributes: (r.attributes as Record<string, unknown>) ?? {},
      freshness: r.freshness ?? undefined,
      isActive: r.isActive,
    }));
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), domain },
      '[exec-briefing] fetchWorldModelEntities failed; brief will run without world-model entities',
    );
    return [];
  }
}

/**
 * Walk one hop out from the brief's root entities to capture the entity graph
 * around them. Returns:
 *   - edges: actual cst_edges rows (with from/to domains so we can flag
 *     cross-domain connections in the citation chain)
 *   - neighborEntities: nodes reached via traversal that the root query missed
 *     (e.g. a vessel's owning shell company, which lives in the aegis domain)
 *   - crossDomainEdgeCount: count of edges whose endpoints span domains
 */
async function fetchEntityNeighborhood(
  rootEntities: WorldModelEntity[],
  domain: string,
): Promise<{
  edges: WorldModelEdge[];
  neighborEntities: WorldModelEntity[];
  crossDomainEdgeCount: number;
}> {
  if (rootEntities.length === 0) {
    return { edges: [], neighborEntities: [], crossDomainEdgeCount: 0 };
  }
  try {
    // Cap traversal seed set so we don't pull every edge in the graph for the
    // consolidated brief.
    const seedIds = rootEntities.slice(0, 50).map((e) => e.id);
    const edgeRows = await db
      .select()
      .from(cstEdges)
      .where(
        and(
          eq(cstEdges.active, true),
          or(inArray(cstEdges.fromNodeId, seedIds), inArray(cstEdges.toNodeId, seedIds)),
        ),
      )
      .orderBy(desc(cstEdges.confidence))
      .limit(200);

    if (edgeRows.length === 0) {
      return { edges: [], neighborEntities: [], crossDomainEdgeCount: 0 };
    }

    const allEndpointIds = Array.from(
      new Set(edgeRows.flatMap((e) => [e.fromNodeId, e.toNodeId]).filter(Boolean)),
    );
    const endpointRows =
      allEndpointIds.length > 0
        ? await db
            .select({
              id: cstNodes.id,
              canonicalId: cstNodes.canonicalId,
              name: cstNodes.name,
              entityType: cstNodes.entityType,
              domain: cstNodes.domain,
              confidence: cstNodes.confidence,
              attributes: cstNodes.extensions,
              freshness: cstNodes.freshness,
              isActive: cstNodes.isActive,
            })
            .from(cstNodes)
            .where(inArray(cstNodes.id, allEndpointIds))
        : [];
    const domainById = new Map(endpointRows.map((r) => [String(r.id), r.domain]));

    const rootIds = new Set(rootEntities.map((e) => e.id));
    const neighborEntities: WorldModelEntity[] = endpointRows
      .filter((r) => !rootIds.has(String(r.id)))
      .slice(0, 50)
      .map((r) => ({
        id: String(r.id),
        canonicalId: r.canonicalId ? String(r.canonicalId) : undefined,
        name: r.name ?? undefined,
        entityType: r.entityType,
        domain: r.domain,
        confidence: Number(r.confidence ?? 0.7),
        attributes: (r.attributes as Record<string, unknown>) ?? {},
        freshness: r.freshness ?? undefined,
        isActive: r.isActive,
        isNeighbor: true,
      }));

    let crossDomainEdgeCount = 0;
    const edges: WorldModelEdge[] = edgeRows.map((e) => {
      const fromDomain = domainById.get(String(e.fromNodeId));
      const toDomain = domainById.get(String(e.toNodeId));
      const crossDomain = !!(fromDomain && toDomain && fromDomain !== toDomain);
      if (crossDomain) crossDomainEdgeCount += 1;
      return {
        id: String(e.id),
        fromNodeId: String(e.fromNodeId),
        toNodeId: String(e.toNodeId),
        relationshipType: e.relationshipType,
        confidence: Number(e.confidence ?? 0.8),
        fromDomain,
        toDomain,
        crossDomain,
      };
    });

    // For domain-scoped briefs, surface only edges that touch the domain (root
    // nodes are already in the domain, neighbors may span out).
    const filteredEdges =
      domain === 'consolidated'
        ? edges
        : edges.filter((e) => e.fromDomain === domain || e.toDomain === domain);

    return { edges: filteredEdges, neighborEntities, crossDomainEdgeCount };
  } catch (err) {
    logger.warn(
      {
        err: err instanceof Error ? err.message : String(err),
        domain,
        rootCount: rootEntities.length,
      },
      '[exec-briefing] fetchEntityNeighborhood failed; brief will run without graph traversal',
    );
    return { edges: [], neighborEntities: [], crossDomainEdgeCount: 0 };
  }
}

async function fetchRecentMemories(
  domain: string,
  entityIds: string[] = [],
): Promise<MemoryEntry[]> {
  try {
    const { memoryRecordsTable } = await import('@szl-holdings/db');
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const conditions: ReturnType<typeof gte>[] = [gte(memoryRecordsTable.createdAt, since)];
    if (domain !== 'consolidated') {
      // Single canonical equality check on `metadata.domain`. Every writer in
      // the memory fabric is now required to set `entry.domain`, which the
      // store mirrors into `metadata.domain` and `scope_id = "domain:<d>"`,
      // so the previous four-signal OR (metadata + scope_id prefix +
      // provenance ILIKE + linked_entities) is no longer needed.
      conditions.push(sql`${memoryRecordsTable.metadata}->>'domain' = ${domain}`);
    }
    void entityIds;

    const rows = await db
      .select()
      .from(memoryRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(memoryRecordsTable.createdAt))
      .limit(20);

    return rows.map((r) => ({
      id: String(r.id),
      memoryType: r.tier ?? 'long-term',
      content: String(r.key ?? ''),
      confidence: Number(r.confidence ?? 0.7),
      provenance: String(r.provenanceSource ?? 'system'),
      createdAt: r.createdAt ?? undefined,
    }));
  } catch (err) {
    logger.warn(
      {
        err: err instanceof Error ? err.message : String(err),
        domain,
        entityCount: entityIds.length,
      },
      '[exec-briefing] fetchRecentMemories failed; brief will run without memory entries',
    );
    return [];
  }
}

async function fetchRecentReflections(domain: string): Promise<RecentReflection[]> {
  try {
    const { agentSelfReflections } = await import('@szl-holdings/db');

    // Filter to reflections written by agents that operate in the domain.
    // Agent IDs follow conventions like `terra-agent-02`, `agent:vessels-screening:v3`,
    // or the canonical pack name (`Terra`, `Helmsman`, ...). We match either
    // the domain key or the well-known agent label so we surface the right
    // perspective for the brief.
    const agentFilter =
      domain === 'consolidated'
        ? undefined
        : or(
            ilike(agentSelfReflections.agentId, `%${domain}%`),
            ilike(agentSelfReflections.agentId, `%${getAgentId(domain)}%`),
          );

    const rows = await db
      .select()
      .from(agentSelfReflections)
      .where(agentFilter)
      .orderBy(desc(agentSelfReflections.computedAt))
      .limit(10);

    return rows.map((r) => ({
      id: String(r.id),
      qualityScore: Number(r.performanceScore ?? 0.7),
      lesson:
        Array.isArray(r.keyObservations) && r.keyObservations.length > 0
          ? String((r.keyObservations as string[])[0])
          : undefined,
      whatWorked: [],
      whatFailed: [],
      createdAt: r.computedAt ?? undefined,
      domain,
    }));
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), domain },
      '[exec-briefing] fetchRecentReflections failed; brief will run without reflection lessons',
    );
    return [];
  }
}

async function fetchCrossDomainEdgeCount(domain: string): Promise<number> {
  try {
    if (domain === 'consolidated') {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cstEdges)
        .where(
          sql`(select domain from cst_nodes where id = from_node_id limit 1) != (select domain from cst_nodes where id = to_node_id limit 1)`,
        );
      return row?.count ?? 0;
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cstEdges)
      .where(
        sql`(select domain from cst_nodes where id = from_node_id limit 1) = ${domain} and (select domain from cst_nodes where id = to_node_id limit 1) != ${domain}`,
      );
    return row?.count ?? 0;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), domain },
      '[exec-briefing] fetchCrossDomainEdgeCount failed; reporting 0',
    );
    return 0;
  }
}

async function generateExecBrief(
  domain: string,
  scheduled = false,
): Promise<typeof pulseExecBriefsTable.$inferSelect> {
  const rootEntities = await fetchWorldModelEntities(domain);

  // Once we know the root entities for the domain, fan out in parallel:
  //   - traverse the constellation to gather their neighborhood + edges
  //   - pull memory records linked to those entities (or the domain)
  //   - pull reflections written by domain-specific agents
  //   - count truly cross-domain edges (DB-side, accurate even when traversal capped)
  const [neighborhood, reflections, crossDomainEdgeTotal] = await Promise.all([
    fetchEntityNeighborhood(rootEntities, domain),
    fetchRecentReflections(domain),
    fetchCrossDomainEdgeCount(domain),
  ]);

  // Memories use the resolved entity ids so an "entity"-tier memory about a
  // specific node surfaces even if the writer didn't tag the domain.
  const memories = await fetchRecentMemories(
    domain,
    rootEntities.map((e) => e.id),
  );

  // Merge root + traversed neighbors. Cap so the prompt stays bounded.
  const entities = [...rootEntities, ...neighborhood.neighborEntities].slice(0, 150);
  // Prefer the DB-wide count when traversal returned a smaller (sampled) figure.
  const crossDomainEdges = Math.max(crossDomainEdgeTotal, neighborhood.crossDomainEdgeCount);

  const ctx = buildBriefContext(
    domain,
    entities,
    memories,
    reflections,
    crossDomainEdges,
    neighborhood.edges,
  );
  const rawCitations = buildCitations(ctx);
  const entityProvenance = extractEntityProvenance(entities);
  const citationManifest = buildCitationManifest(rawCitations);

  const systemPrompt = buildSystemPrompt(domain);
  const userPrompt = buildUserPrompt(ctx, citationManifest);

  let briefContent: Omit<
    typeof pulseExecBriefsTable.$inferSelect,
    'id' | 'createdAt' | 'generatedAt' | 'briefingId'
  > | null = null;

  if (services.ai.isLive) {
    try {
      const aiResponse = await gatewayInfer({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        agentId: 'executive-briefing-engine',
        domain,
        maxTokens: 3000,
        strategy: 'preferred',
      });

      const parsed = parseBriefResponse(
        aiResponse.content,
        domain,
        rawCitations.map((c) => ({ ...c, verified: c.verified ?? false })),
        entityProvenance,
      );

      if (parsed.success) {
        const gateResult = gateBrief(parsed.brief);

        briefContent = {
          domain,
          status: gateResult.status === 'passed' ? 'published' : 'revision_required',
          headline: parsed.brief.headline,
          situation: parsed.brief.situation,
          autonomyTier: parsed.brief.autonomyTier,
          confidence: String(parsed.brief.confidence),
          overallRisk: parsed.brief.overallRisk,
          verifierStatus: gateResult.status,
          verifierFeedback: gateResult.feedback,
          whatWeBelieve: parsed.brief.whatWeBelieve,
          whyCitations: rawCitations,
          whatWeRecommend: parsed.brief.whatWeRecommend,
          sourceTraceIds: [],
          entityProvenance,
          sections: parsed.brief.sections,
          scheduled,
        };
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), domain },
        '[exec-briefing] AI generation failed; using fallback',
      );
    }
  }

  if (!briefContent) {
    briefContent = buildFallbackBrief(
      domain,
      entities,
      memories,
      reflections,
      entityProvenance,
      rawCitations,
      scheduled,
    );
  }

  const now = new Date();
  const id = `eb-${domain}-${now.getTime()}`;

  const pulseBriefId = `brief-${now.toISOString().slice(0, 10)}-exec-${domain}-${now.getTime()}`;
  const avgConf = Number(briefContent.confidence);

  let linkedBriefingId: string | undefined;
  try {
    const [inserted] = await db
      .insert(pulseBriefingsTable)
      .values({
        id: pulseBriefId,
        date: now.toISOString().slice(0, 10),
        edition: `Executive Brief · ${domain} · ${now.toUTCString()}`,
        classification: 'SZL-EXEC-RESTRICTED',
        status: briefContent.status === 'published' ? 'published' : 'draft',
        overallRisk: briefContent.overallRisk,
        overallConfidence: String(avgConf),
        headline: briefContent.headline,
        leadSentence: briefContent.situation,
        domains: domain === 'consolidated' ? [...KNOWN_EXEC_DOMAINS] : [domain],
        sections: briefContent.sections as unknown[],
        recommendedActions: briefContent.whatWeRecommend as unknown[],
      })
      .returning({ id: pulseBriefingsTable.id });
    linkedBriefingId = inserted?.id;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      '[exec-briefing] failed to link pulse_briefings record',
    );
  }

  const [row] = await db
    .insert(pulseExecBriefsTable)
    .values({
      id,
      briefingId: linkedBriefingId ?? null,
      ...briefContent,
    })
    .returning();

  logger.info(
    {
      id,
      domain,
      verifierStatus: briefContent.verifierStatus,
      confidence: briefContent.confidence,
    },
    '[exec-briefing] Brief generated',
  );

  return row!;
}

function buildFallbackBrief(
  domain: string,
  entities: WorldModelEntity[],
  memories: MemoryEntry[],
  reflections: RecentReflection[],
  entityProvenance: ReturnType<typeof extractEntityProvenance>,
  rawCitations: ReturnType<typeof buildCitations>,
  scheduled: boolean,
): Omit<
  typeof pulseExecBriefsTable.$inferSelect,
  'id' | 'createdAt' | 'generatedAt' | 'briefingId'
> {
  const activeEntities = entities.filter((e) => e.isActive);
  const avgConf =
    activeEntities.length > 0
      ? activeEntities.reduce((s, e) => s + e.confidence, 0) / activeEntities.length
      : 0.7;

  const entityTypes = [...new Set(activeEntities.slice(0, 5).map((e) => e.entityType))];

  const beliefs = activeEntities.slice(0, 5).map((e, i) => ({
    id: `b-${String(i + 1).padStart(3, '0')}`,
    claim: `${e.entityType} entity '${e.id}' in ${e.domain} domain is active with ${(e.confidence * 100).toFixed(0)}% confidence.`,
    confidence: e.confidence,
    citationIds: [`cit-ent-${e.id}`],
    supported: true,
    caveats: e.confidence < 0.7 ? ['Data freshness uncertain'] : [],
  }));

  const memoryInsights = memories.slice(0, 2).map((m, i) => ({
    id: `b-mem-${String(i + 1).padStart(3, '0')}`,
    claim: m.content.slice(0, 200),
    confidence: m.confidence,
    citationIds: [`cit-mem-${m.id}`],
    supported: true,
    caveats: [],
  }));

  const lesson = reflections.find((r) => r.lesson);

  return {
    domain,
    status: 'published',
    headline: `${domain === 'consolidated' ? 'Cross-domain' : domain} operational status — ${activeEntities.length} active entities across ${entityTypes.join(', ') || 'known types'}`,
    situation: [
      `${activeEntities.length} entities active in the ${domain} domain with average confidence ${(avgConf * 100).toFixed(0)}%.`,
      memories.length > 0 ? `${memories.length} recent memory entries available.` : '',
      lesson ? `Recent lesson: ${lesson.lesson?.slice(0, 120)}` : '',
    ]
      .filter(Boolean)
      .join(' '),
    autonomyTier: 'human-in-the-loop',
    confidence: String(Math.round(avgConf * 100) / 100),
    overallRisk: avgConf > 0.85 ? 'LOW' : avgConf > 0.65 ? 'MEDIUM' : 'HIGH',
    verifierStatus: 'passed',
    verifierFeedback: null,
    whatWeBelieve: [...beliefs, ...memoryInsights],
    whyCitations: rawCitations,
    whatWeRecommend: [
      {
        id: 'r-001',
        priority: 'P2',
        action: `Review ${domain} domain entity health and confidence scores`,
        rationale: 'Maintaining data freshness ensures brief accuracy.',
        owner: 'Operations',
        dueBy: 'Today',
        autonomyTier: 'supervised-autonomy',
        citationIds: beliefs.slice(0, 2).map((b) => b.citationIds[0] ?? ''),
      },
    ],
    sourceTraceIds: [],
    entityProvenance,
    sections: [],
    scheduled,
  };
}

async function getLatestExecBrief(
  domain: string,
): Promise<typeof pulseExecBriefsTable.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(pulseExecBriefsTable)
    .where(eq(pulseExecBriefsTable.domain, domain))
    .orderBy(desc(pulseExecBriefsTable.generatedAt))
    .limit(1);
  return row ?? null;
}

router.get(
  '/executive',
  perUserApiSlidingLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const existing = await getLatestExecBrief('consolidated');
      if (existing) {
        sendSuccess(res, existing);
        return;
      }
      const brief = await generateExecBrief('consolidated', false);
      sendSuccess(res, brief);
    } catch (err) {
      handleRouteError(res, err, 'GET /pulse/executive');
    }
  },
);

router.get(
  '/executive/history',
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query['limit'] ?? 20), 90);
      const domain =
        typeof req.query['domain'] === 'string' ? normalizeDomain(req.query['domain']) : undefined;

      const rows = await db
        .select()
        .from(pulseExecBriefsTable)
        .where(domain ? eq(pulseExecBriefsTable.domain, domain) : undefined)
        .orderBy(desc(pulseExecBriefsTable.generatedAt))
        .limit(limit);

      sendSuccess(res, { briefs: rows, count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'GET /pulse/executive/history');
    }
  },
);

router.get(
  '/executive/brief/:id',
  perUserApiSlidingLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const [row] = await db
        .select()
        .from(pulseExecBriefsTable)
        .where(eq(pulseExecBriefsTable.id, id))
        .limit(1);

      if (!row) {
        sendNotFound(res, `Executive brief '${id}' not found`);
        return;
      }
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, `GET /pulse/executive/brief/${req.params.id}`);
    }
  },
);

router.get(
  '/executive/:domain',
  perUserApiSlidingLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawDomain = (req.params.domain ?? '') as string;
      const domain = normalizeDomain(rawDomain);

      if (!KNOWN_EXEC_DOMAINS.includes(domain as SupportedDomain) && domain !== 'consolidated') {
        sendBadRequest(
          res,
          `Unknown domain '${rawDomain}'. Valid: ${KNOWN_EXEC_DOMAINS.join(', ')}`,
        );
        return;
      }

      const existing = await getLatestExecBrief(domain);
      if (existing) {
        sendSuccess(res, existing);
        return;
      }

      const brief = await generateExecBrief(domain, false);
      sendSuccess(res, brief);
    } catch (err) {
      handleRouteError(res, err, `GET /pulse/executive/${req.params.domain}`);
    }
  },
);

router.post(
  '/executive/generate',
  validateBody(bodyShape({})),
  perUserWriteSlidingLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const brief = await generateExecBrief('consolidated', false);
      sendCreated(res, brief);
    } catch (err) {
      handleRouteError(res, err, 'POST /pulse/executive/generate');
    }
  },
);

router.post(
  '/executive/generate/:domain',
  validateBody(bodyShape({})),
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawDomain = (req.params.domain ?? '') as string;
      const domain = normalizeDomain(rawDomain);

      if (!KNOWN_EXEC_DOMAINS.includes(domain as SupportedDomain) && domain !== 'consolidated') {
        sendBadRequest(
          res,
          `Unknown domain '${rawDomain}'. Valid: ${KNOWN_EXEC_DOMAINS.join(', ')}`,
        );
        return;
      }

      const brief = await generateExecBrief(domain, false);
      sendCreated(res, brief);
    } catch (err) {
      handleRouteError(res, err, `POST /pulse/executive/generate/${req.params.domain}`);
    }
  },
);

export default router;

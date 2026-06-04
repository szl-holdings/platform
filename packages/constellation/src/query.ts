import {
  cstEdgeEvidence,
  cstEdges,
  cstNodeAliases,
  cstNodes,
  cstNodeTypes,
  db,
} from '@szl-holdings/db';
import { and, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import type { ConstellationEdge, ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';
import type {
  AddCstEvidence,
  CreateCstEdge,
  CreateCstNode,
  CstEdge,
  CstEdgeEvidence,
  CstNode,
  CstNodeTypeRegistration,
  CstQueryFilters,
  CstRelationshipFilters,
  CstSearchParams,
} from './types.ts';

function mapDbNodeToSchema(row: typeof cstNodes.$inferSelect): CstNode {
  return {
    id: row.id,
    canonicalId: row.canonicalId,
    domain: row.domain as CstNode['domain'],
    entityType: row.entityType,
    labels: (row.labels ?? []) as string[],
    name: row.name,
    description: row.description ?? undefined,
    provenance: row.provenanceSourceId
      ? {
          sourceId: row.provenanceSourceId,
          sourceType: (row.provenanceSourceType ??
            'system') as CstNode['provenance'] extends undefined
            ? never
            : NonNullable<CstNode['provenance']>['sourceType'],
          sourceLabel: row.provenanceSourceLabel ?? undefined,
        }
      : undefined,
    freshness: row.freshness.toISOString(),
    confidence: row.confidence ?? 1.0,
    owner: row.ownerId
      ? {
          ownerId: row.ownerId,
          ownerType: (row.ownerType ?? 'system') as CstNode['owner'] extends undefined
            ? never
            : NonNullable<CstNode['owner']>['ownerType'],
          ownerOrgId: row.ownerOrgId ?? undefined,
        }
      : undefined,
    sensitivityTier: (row.sensitivityTier ?? 'internal') as CstNode['sensitivityTier'],
    relatedActionIds: (row.relatedActionIds ?? []) as string[],
    relatedDocumentIds: (row.relatedDocumentIds ?? []) as string[],
    relatedExecutionIds: (row.relatedExecutionIds ?? []) as string[],
    relatedRiskIds: (row.relatedRiskIds ?? []) as string[],
    extensions: (row.extensions ?? {}) as Record<string, unknown>,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapDbEdgeToSchema(
  row: typeof cstEdges.$inferSelect,
  evidence?: (typeof cstEdgeEvidence.$inferSelect)[],
): CstEdge {
  return {
    id: row.id,
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    relationshipType: row.relationshipType,
    confidence: row.confidence ?? 1.0,
    source: row.sourceId
      ? {
          sourceId: row.sourceId,
          sourceType: (row.sourceType ?? 'system') as CstEdge['source'] extends undefined
            ? never
            : NonNullable<CstEdge['source']>['sourceType'],
          sourceLabel: row.sourceLabel ?? undefined,
        }
      : undefined,
    active: row.active ?? true,
    extensions: (row.extensions ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    evidence: evidence?.map((e) => ({
      id: e.id,
      edgeId: e.edgeId,
      evidenceType: e.evidenceType,
      payload: (e.payload ?? {}) as Record<string, unknown>,
      sourceId: e.sourceId ?? undefined,
      sourceLabel: e.sourceLabel ?? undefined,
      confidence: e.confidence ?? 1.0,
      recordedBy: e.recordedBy ?? undefined,
      recordedAt: e.recordedAt.toISOString(),
    })) as CstEdgeEvidence[] | undefined,
  };
}

export async function queryNodes(
  filters: CstQueryFilters,
): Promise<{ nodes: CstNode[]; total: number }> {
  const conditions = [];

  if (filters.domain) conditions.push(eq(cstNodes.domain, filters.domain));
  if (filters.entityType) conditions.push(eq(cstNodes.entityType, filters.entityType));
  if (filters.sensitivityTier)
    conditions.push(eq(cstNodes.sensitivityTier, filters.sensitivityTier));
  if (filters.isActive !== undefined) conditions.push(eq(cstNodes.isActive, filters.isActive));
  if (filters.minConfidence !== undefined)
    conditions.push(gte(cstNodes.confidence, filters.minConfidence));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(cstNodes)
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(cstNodes.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(cstNodes).where(where),
  ]);

  return {
    nodes: rows.map(mapDbNodeToSchema),
    total: countResult[0]?.count ?? 0,
  };
}

export async function getNodeById(id: string): Promise<CstNode | null> {
  const [row] = await db.select().from(cstNodes).where(eq(cstNodes.id, id)).limit(1);
  return row ? mapDbNodeToSchema(row) : null;
}

export async function getNodeByCanonicalId(canonicalId: string): Promise<CstNode | null> {
  const [row] = await db
    .select()
    .from(cstNodes)
    .where(eq(cstNodes.canonicalId, canonicalId))
    .limit(1);
  return row ? mapDbNodeToSchema(row) : null;
}

export async function searchNodes(params: CstSearchParams): Promise<CstNode[]> {
  const conditions = [
    or(ilike(cstNodes.name, `%${params.q}%`), ilike(cstNodes.description, `%${params.q}%`)),
  ];
  if (params.domain) conditions.push(eq(cstNodes.domain, params.domain));
  if (params.entityType) conditions.push(eq(cstNodes.entityType, params.entityType));

  const rows = await db
    .select()
    .from(cstNodes)
    .where(and(...conditions))
    .limit(params.limit)
    .orderBy(cstNodes.confidence);

  return rows.map(mapDbNodeToSchema);
}

export async function upsertNode(input: CreateCstNode): Promise<CstNode> {
  const now = new Date();
  const freshness = input.freshness ? new Date(input.freshness) : now;

  const [row] = await db
    .insert(cstNodes)
    .values({
      domain: input.domain,
      entityType: input.entityType,
      labels: input.labels ?? [],
      name: input.name,
      description: input.description,
      provenanceSourceId: input.provenance?.sourceId,
      provenanceSourceType: input.provenance?.sourceType,
      provenanceSourceLabel: input.provenance?.sourceLabel,
      freshness,
      confidence: input.confidence ?? 1.0,
      ownerId: input.owner?.ownerId,
      ownerType: input.owner?.ownerType,
      ownerOrgId: input.owner?.ownerOrgId,
      sensitivityTier: input.sensitivityTier ?? 'internal',
      relatedActionIds: input.relatedActionIds ?? [],
      relatedDocumentIds: input.relatedDocumentIds ?? [],
      relatedExecutionIds: input.relatedExecutionIds ?? [],
      relatedRiskIds: input.relatedRiskIds ?? [],
      extensions: input.extensions ?? {},
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapDbNodeToSchema(row!);
}

export async function upsertNodeAlias(
  nodeId: string,
  aliasType: string,
  aliasValue: string,
  sourceSystem?: string,
  isPrimary = false,
): Promise<void> {
  await db
    .insert(cstNodeAliases)
    .values({ nodeId, aliasType, aliasValue, sourceSystem, isPrimary })
    .onConflictDoNothing();
}

export async function lookupNodeByAlias(
  aliasType: string,
  aliasValue: string,
): Promise<CstNode | null> {
  const [alias] = await db
    .select()
    .from(cstNodeAliases)
    .where(and(eq(cstNodeAliases.aliasType, aliasType), eq(cstNodeAliases.aliasValue, aliasValue)))
    .limit(1);

  if (!alias) return null;
  return getNodeById(alias.nodeId);
}

export async function upsertEdge(input: CreateCstEdge): Promise<CstEdge> {
  const now = new Date();

  const [row] = await db
    .insert(cstEdges)
    .values({
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      relationshipType: input.relationshipType,
      confidence: input.confidence ?? 1.0,
      sourceId: input.source?.sourceId,
      sourceType: input.source?.sourceType,
      sourceLabel: input.source?.sourceLabel,
      active: input.active ?? true,
      extensions: input.extensions ?? {},
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [cstEdges.fromNodeId, cstEdges.toNodeId, cstEdges.relationshipType],
      set: {
        confidence: input.confidence ?? 1.0,
        active: input.active ?? true,
        updatedAt: now,
      },
    })
    .returning();

  return mapDbEdgeToSchema(row!);
}

export async function addEdgeEvidence(input: AddCstEvidence): Promise<CstEdgeEvidence> {
  const [row] = await db
    .insert(cstEdgeEvidence)
    .values({
      edgeId: input.edgeId,
      evidenceType: input.evidenceType,
      payload: input.payload ?? {},
      sourceId: input.sourceId,
      sourceLabel: input.sourceLabel,
      confidence: input.confidence ?? 1.0,
      recordedBy: input.recordedBy,
      recordedAt: new Date(),
    })
    .returning();

  return {
    id: row?.id,
    edgeId: row?.edgeId,
    evidenceType: row?.evidenceType,
    payload: (row?.payload ?? {}) as Record<string, unknown>,
    sourceId: row?.sourceId ?? undefined,
    sourceLabel: row?.sourceLabel ?? undefined,
    confidence: row?.confidence ?? 1.0,
    recordedBy: row?.recordedBy ?? undefined,
    recordedAt: row?.recordedAt.toISOString(),
  };
}

export async function queryEdges(
  filters: CstRelationshipFilters,
): Promise<{ edges: CstEdge[]; total: number }> {
  const conditions = [];

  if (filters.fromNodeId) conditions.push(eq(cstEdges.fromNodeId, filters.fromNodeId));
  if (filters.toNodeId) conditions.push(eq(cstEdges.toNodeId, filters.toNodeId));
  if (filters.relationshipType)
    conditions.push(eq(cstEdges.relationshipType, filters.relationshipType));
  if (filters.active !== undefined) conditions.push(eq(cstEdges.active, filters.active));
  if (filters.minConfidence !== undefined)
    conditions.push(gte(cstEdges.confidence, filters.minConfidence));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(cstEdges)
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(cstEdges.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(cstEdges).where(where),
  ]);

  let evidenceByEdge: Map<string, (typeof cstEdgeEvidence.$inferSelect)[]> = new Map();

  if (filters.includeEvidence && rows.length > 0) {
    const edgeIds = rows.map((r) => r.id);
    const evidenceRows = await db
      .select()
      .from(cstEdgeEvidence)
      .where(inArray(cstEdgeEvidence.edgeId, edgeIds));
    evidenceByEdge = evidenceRows.reduce((m, e) => {
      const arr = m.get(e.edgeId) ?? [];
      arr.push(e);
      m.set(e.edgeId, arr);
      return m;
    }, new Map<string, (typeof cstEdgeEvidence.$inferSelect)[]>());
  }

  return {
    edges: rows.map((r) =>
      mapDbEdgeToSchema(r, filters.includeEvidence ? (evidenceByEdge.get(r.id) ?? []) : undefined),
    ),
    total: countResult[0]?.count ?? 0,
  };
}

export async function registerNodeTypes(registrations: CstNodeTypeRegistration[]): Promise<void> {
  if (registrations.length === 0) return;

  await db
    .insert(cstNodeTypes)
    .values(
      registrations.map((r) => ({
        domain: r.domain,
        typeKey: r.typeKey,
        displayName: r.displayName,
        description: r.description,
        defaultSensitivity: r.defaultSensitivity ?? 'internal',
      })),
    )
    .onConflictDoNothing();
}

export { upsertEdge as createEdge, upsertNode as createNode };

// ─────────────────────────────────────────────────────────────────────────────
// In-memory graph traversal helpers (operate on GraphStore, not Postgres)
// ─────────────────────────────────────────────────────────────────────────────

type StoreCtx = { store: GraphStore };

/**
 * Returns nodes directly connected to `nodeId` via edges.
 *
 * direction:
 *   "outgoing" — edges where fromNodeId === nodeId
 *   "incoming" — edges where toNodeId   === nodeId
 *   "both"     — either direction (default)
 */
export function findNeighbors(
  nodeId: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both',
  ctx: StoreCtx,
): { nodes: ConstellationNode[] } {
  const edges = ctx.store.listEdges();
  const neighborIds = new Set<string>();
  for (const e of edges) {
    if ((direction === 'outgoing' || direction === 'both') && e.fromNodeId === nodeId) {
      neighborIds.add(e.toNodeId);
    }
    if ((direction === 'incoming' || direction === 'both') && e.toNodeId === nodeId) {
      neighborIds.add(e.fromNodeId);
    }
  }
  const nodes = ctx.store.listNodes().filter((n) => neighborIds.has(n.id));
  return { nodes };
}

/**
 * Returns the shortest directed path from `fromId` to `toId` (BFS), or null
 * if no path exists within `maxDepth` hops.
 */
export function findPath(
  fromId: string,
  toId: string,
  maxDepth: number,
  ctx: StoreCtx,
): ConstellationNode[] | null {
  if (fromId === toId) {
    const node = ctx.store.getNode(fromId);
    return node ? [node] : null;
  }

  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    if (path.length > maxDepth) break;
    const current = path[path.length - 1]!;
    const edges = ctx.store.listEdges({ fromNodeId: current });

    for (const e of edges) {
      const next = e.toNodeId;
      if (!visited.has(next)) {
        const newPath = [...path, next];
        if (next === toId) {
          return newPath.map((id) => ctx.store.getNode(id)!).filter(Boolean);
        }
        visited.add(next);
        queue.push(newPath);
      }
    }
  }

  return null;
}

/**
 * Returns all nodes reachable from `nodeId` within `depth` directed hops,
 * plus all edges between those nodes.
 */
export function subgraph(
  nodeId: string,
  depth: number,
  ctx: StoreCtx,
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const reachable = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);

  for (let d = 0; d < depth; d++) {
    const nextFrontier = new Set<string>();
    for (const id of frontier) {
      for (const e of ctx.store.listEdges({ fromNodeId: id })) {
        if (!reachable.has(e.toNodeId)) {
          reachable.add(e.toNodeId);
          nextFrontier.add(e.toNodeId);
        }
      }
    }
    frontier = nextFrontier;
    if (frontier.size === 0) break;
  }

  const nodes = ctx.store.listNodes().filter((n) => reachable.has(n.id));
  const edges = ctx.store
    .listEdges()
    .filter((e) => reachable.has(e.fromNodeId) && reachable.has(e.toNodeId));
  return { nodes, edges };
}

/**
 * Synchronous label-text search across an in-memory GraphStore.
 * Use `searchNodes` (async) for full-text DB search.
 */
export function searchGraphNodes(query: string, ctx: StoreCtx): ConstellationNode[] {
  const lq = query.toLowerCase();
  return ctx.store.listNodes().filter((n) => n.label.toLowerCase().includes(lq));
}

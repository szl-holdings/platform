/**
 * Unified Ontology Engine — Knowledge Graph Core
 *
 * Palantir-inspired entity-relationship graph for the SZL Intelligence OS.
 * Entities: Person, Organization, Vessel, Property, Case, Threat, Signal, Asset
 * Relationships: owns, operates, litigates, threatens, located_at, connected_to,
 *                sanctioned_by, employed_by, directs, invests_in
 *
 * Graph algorithms (Postgres recursive CTE-based):
 * - shortestPath: BFS over entity_relationships via recursive CTE
 * - communityDetection: label propagation over adjacency
 * - influenceScore: pagerank-inspired weighted traversal
 * - temporalGraphAnalysis: recency-weighted edge scoring
 * - extractSubgraph: neighborhood extraction for GraphRAG context
 *
 * Supports multi-hop traversal for cross-domain reasoning.
 */

import { db, entitiesTable, entityRelationshipsTable, pool } from '@szl-holdings/db';
import { and, eq, inArray, or, sql } from 'drizzle-orm';

export type OntologyEntityType =
  | 'person'
  | 'organization'
  | 'vessel'
  | 'property'
  | 'case'
  | 'threat'
  | 'signal'
  | 'asset'
  | 'port'
  | 'jurisdiction';

export type RelationshipType =
  | 'owns'
  | 'operates'
  | 'litigates'
  | 'threatens'
  | 'located_at'
  | 'connected_to'
  | 'sanctioned_by'
  | 'employed_by'
  | 'directs'
  | 'invests_in'
  | 'registered_in'
  | 'affiliated_with'
  | 'monitors'
  | 'exposes';

export interface OntologyEntity {
  id: string;
  type: OntologyEntityType;
  name: string;
  domain: string;
  metadata: Record<string, unknown>;
  tags: string[];
  riskScore?: number;
  lastUpdated: string;
}

export interface OntologyRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  strength: 'weak' | 'moderate' | 'strong';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GraphNode {
  entity: OntologyEntity;
  relationships: OntologyRelationship[];
  connectedEntities: OntologyEntity[];
  hopDistance: number;
}

export interface GraphTraversalResult {
  origin: OntologyEntity;
  nodes: GraphNode[];
  totalNodes: number;
  evidenceChain: EvidenceLink[];
  crossDomainConnections: CrossDomainConnection[];
}

export interface EvidenceLink {
  fromEntity: string;
  toEntity: string;
  relationshipType: RelationshipType;
  domain: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface CrossDomainConnection {
  fromDomain: string;
  toDomain: string;
  entityA: string;
  entityB: string;
  connectionType: RelationshipType;
  riskImplications: string[];
}

export interface GraphQueryResult {
  entities: OntologyEntity[];
  relationships: OntologyRelationship[];
  evidenceChain: EvidenceLink[];
  crossDomainConnections: CrossDomainConnection[];
  totalHops: number;
  queryDurationMs: number;
}

export interface ShortestPathResult {
  path: OntologyEntity[];
  hops: number;
  edges: OntologyRelationship[];
  totalWeight: number;
  found: boolean;
}

export interface CommunityMember {
  entityId: string;
  entityName: string;
  entityType: OntologyEntityType;
  domain: string;
  communityId: string;
  iterations: number;
}

export interface CommunityDetectionResult {
  communities: Map<string, CommunityMember[]>;
  totalEntities: number;
  totalCommunities: number;
  largestCommunitySize: number;
  durationMs: number;
}

export interface InfluenceScoreResult {
  entityId: string;
  entityName: string;
  influenceScore: number;
  inDegree: number;
  outDegree: number;
  weightedDegree: number;
  rank: number;
}

export interface TemporalEdge {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  createdAt: string;
  ageMs: number;
  temporalWeight: number;
  strength: OntologyRelationship['strength'];
}

export interface SubgraphExtraction {
  centerEntityId: string;
  entities: OntologyEntity[];
  relationships: OntologyRelationship[];
  edges: Array<{
    from: string;
    to: string;
    type: RelationshipType;
    weight: number;
    temporalWeight: number;
    confidenceScore: number;
  }>;
  maxDepth: number;
  extractedAt: string;
}

function mapEntityType(dbType: string): OntologyEntityType {
  const mapping: Record<string, OntologyEntityType> = {
    person: 'person',
    organization: 'organization',
    vessel: 'vessel',
    property: 'property',
    case: 'case',
    incident: 'threat',
    alert: 'signal',
    asset: 'asset',
    port: 'port',
    risk_item: 'threat',
    workflow: 'asset',
    task: 'asset',
    control: 'asset',
    recommendation: 'signal',
  };
  return mapping[dbType] ?? 'asset';
}

function mapRelationshipStrength(strength: string | null): OntologyRelationship['strength'] {
  if (strength === 'strong') return 'strong';
  if (strength === 'weak') return 'weak';
  return 'moderate';
}

function assessSignificance(rel: OntologyRelationship): EvidenceLink['significance'] {
  const highSig: RelationshipType[] = ['litigates', 'threatens', 'sanctioned_by', 'exposes'];
  const medSig: RelationshipType[] = ['owns', 'operates', 'directs', 'invests_in'];
  if (highSig.includes(rel.type)) return 'high';
  if (medSig.includes(rel.type)) return 'medium';
  return 'low';
}

function buildEvidenceDescription(relType: RelationshipType, from: string, to: string): string {
  const templates: Record<RelationshipType, string> = {
    owns: `${from} has an ownership stake in ${to}`,
    operates: `${from} operates ${to}`,
    litigates: `${from} has active litigation involving ${to}`,
    threatens: `${from} poses a threat to ${to}`,
    located_at: `${from} is located at ${to}`,
    connected_to: `${from} has a documented connection to ${to}`,
    sanctioned_by: `${from} has been sanctioned in relation to ${to}`,
    employed_by: `${from} is employed by ${to}`,
    directs: `${from} holds a directorship or control position at ${to}`,
    invests_in: `${from} has investment exposure in ${to}`,
    registered_in: `${from} is registered in ${to}`,
    affiliated_with: `${from} has a known affiliation with ${to}`,
    monitors: `${from} actively monitors ${to}`,
    exposes: `${from} creates material exposure for ${to}`,
  };
  return templates[relType] ?? `${from} is related to ${to}`;
}

function strengthToWeight(strength: string | null): number {
  if (strength === 'strong') return 1.0;
  if (strength === 'weak') return 0.3;
  return 0.6;
}

function computeTemporalWeight(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 1) return 1.0;
  if (ageHours < 24) return 0.95;
  if (ageHours < 168) return 0.85;
  if (ageHours < 720) return 0.7;
  if (ageHours < 8760) return 0.5;
  return 0.3;
}

export class OntologyEngine {
  private entityCache = new Map<string, OntologyEntity>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly MAX_CACHE_SIZE = 500;
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.evictionTimer = setInterval(() => this.evictExpiredCache(), 60 * 1000);
    if (this.evictionTimer.unref) this.evictionTimer.unref();
  }

  dispose(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
    this.entityCache.clear();
    this.cacheExpiry.clear();
  }

  private evictExpiredCache(): void {
    const now = Date.now();
    for (const [id, expiry] of this.cacheExpiry) {
      if (now >= expiry) {
        this.entityCache.delete(id);
        this.cacheExpiry.delete(id);
      }
    }
  }

  private isCacheValid(id: string): boolean {
    const expiry = this.cacheExpiry.get(id);
    return expiry !== undefined && Date.now() < expiry;
  }

  private setCache(entity: OntologyEntity): void {
    if (this.entityCache.size >= this.MAX_CACHE_SIZE && !this.entityCache.has(entity.id)) {
      const firstKey = this.entityCache.keys().next().value;
      if (firstKey !== undefined) {
        this.entityCache.delete(firstKey);
        this.cacheExpiry.delete(firstKey);
      }
    }
    this.entityCache.set(entity.id, entity);
    this.cacheExpiry.set(entity.id, Date.now() + this.CACHE_TTL_MS);
  }

  async upsertEntity(
    entity: Omit<OntologyEntity, 'id' | 'lastUpdated'> & { externalId?: string },
  ): Promise<OntologyEntity & { wasCreated: boolean }> {
    const dbType = entity.type as string;
    const validTypes = [
      'person',
      'organization',
      'asset',
      'vessel',
      'port',
      'workflow',
      'task',
      'alert',
      'case',
      'incident',
      'control',
      'risk_item',
      'recommendation',
    ];
    const mappedType = validTypes.includes(dbType) ? dbType : 'asset';

    const insertedAt = new Date();
    const [row] = await db
      .insert(entitiesTable)
      .values({
        entityType: mappedType as (typeof entitiesTable.$inferInsert)['entityType'],
        name: entity.name,
        sourceApp: entity.domain,
        externalId: entity.externalId ?? null,
        metadata: {
          ...entity.metadata,
          ontologyType: entity.type,
          riskScore: entity.riskScore ?? null,
        },
        tags: entity.tags,
        createdAt: insertedAt,
        updatedAt: insertedAt,
      })
      .onConflictDoUpdate({
        target: [entitiesTable.name, entitiesTable.sourceApp],
        set: {
          metadata: sql`excluded.metadata`,
          tags: sql`excluded.tags`,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Determine outcome: on a fresh INSERT we set createdAt and updatedAt to the
    // same Date instance, so they match. On an UPDATE via onConflictDoUpdate the
    // existing createdAt is preserved while updatedAt is set to a new Date, so
    // they will differ. Compare millisecond timestamps to classify the outcome.
    const wasCreated = row!.createdAt.getTime() === row!.updatedAt.getTime();

    const result: OntologyEntity = {
      id: row!.id,
      type: entity.type,
      name: row!.name,
      domain: row!.sourceApp,
      metadata: (row!.metadata as Record<string, unknown>) ?? {},
      tags: row!.tags ?? [],
      ...(entity.riskScore !== undefined ? { riskScore: entity.riskScore } : {}),
      lastUpdated: row!.updatedAt.toISOString(),
    };

    this.setCache(result);

    console.debug(
      `[OntologyEngine] upsertEntity ${wasCreated ? 'created' : 'merged'} ${entity.domain}/${entity.type}:${entity.name} (id=${row!.id})`,
    );

    return { ...result, wasCreated };
  }

  async createRelationship(
    fromEntityId: string,
    toEntityId: string,
    type: RelationshipType,
    strength: OntologyRelationship['strength'] = 'moderate',
    metadata: Record<string, unknown> = {},
  ): Promise<OntologyRelationship> {
    const [row] = await db
      .insert(entityRelationshipsTable)
      .values({
        fromEntityId,
        toEntityId,
        relationshipType: type,
        strength,
        metadata,
      })
      .onConflictDoNothing()
      .returning();

    return {
      id: row!.id,
      fromEntityId,
      toEntityId,
      type,
      strength,
      metadata,
      createdAt: row!.createdAt.toISOString(),
    };
  }

  async getEntity(entityId: string): Promise<OntologyEntity | null> {
    if (this.isCacheValid(entityId)) {
      return this.entityCache.get(entityId) ?? null;
    }

    const [row] = await db.select().from(entitiesTable).where(eq(entitiesTable.id, entityId));

    if (!row) return null;

    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const _riskScore0 = meta.riskScore as number | undefined;
    const entity: OntologyEntity = {
      id: row.id,
      type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
      name: row.name,
      domain: row.sourceApp,
      metadata: meta,
      tags: row.tags ?? [],
      ...(_riskScore0 !== undefined ? { riskScore: _riskScore0 } : {}),
      lastUpdated: row.updatedAt.toISOString(),
    };

    this.setCache(entity);
    return entity;
  }

  async searchEntities(
    query: string,
    types?: OntologyEntityType[],
    limit = 20,
  ): Promise<OntologyEntity[]> {
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(
        sql`to_tsvector('english', ${entitiesTable.name}) @@ plainto_tsquery('english', ${query})
            OR ${entitiesTable.name} ILIKE ${'%' + query + '%'}`,
      )
      .limit(limit);

    return rows.map((row) => {
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      const _riskScoreA = meta.riskScore as number | undefined;
      return {
        id: row.id,
        type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
        name: row.name,
        domain: row.sourceApp,
        metadata: meta,
        tags: row.tags ?? [],
        ...(_riskScoreA !== undefined ? { riskScore: _riskScoreA } : {}),
        lastUpdated: row.updatedAt.toISOString(),
      };
    }).filter((e) => !types || types.includes(e.type));
  }

  async traverseGraph(
    originEntityId: string,
    maxHops = 3,
    maxNodesPerHop = 10,
  ): Promise<GraphTraversalResult> {
    const origin = await this.getEntity(originEntityId);
    if (!origin) throw new Error(`Entity ${originEntityId} not found in ontology`);

    const visitedIds = new Set<string>([originEntityId]);
    const nodes: GraphNode[] = [];
    const evidenceChain: EvidenceLink[] = [];
    const crossDomainConnections: CrossDomainConnection[] = [];
    let currentFrontier = [originEntityId];

    for (let hop = 1; hop <= maxHops; hop++) {
      if (currentFrontier.length === 0) break;

      const rels = await db
        .select()
        .from(entityRelationshipsTable)
        .where(
          or(
            inArray(entityRelationshipsTable.fromEntityId, currentFrontier),
            inArray(entityRelationshipsTable.toEntityId, currentFrontier),
          ),
        )
        .limit(maxNodesPerHop * 5);

      const nextFrontier: string[] = [];

      for (const rel of rels) {
        const neighborId = currentFrontier.includes(rel.fromEntityId)
          ? rel.toEntityId
          : rel.fromEntityId;

        if (visitedIds.has(neighborId)) continue;
        if (nextFrontier.length >= maxNodesPerHop) break;

        visitedIds.add(neighborId);
        nextFrontier.push(neighborId);

        const neighbor = await this.getEntity(neighborId);
        if (!neighbor) continue;

        const relationship: OntologyRelationship = {
          id: rel.id,
          fromEntityId: rel.fromEntityId,
          toEntityId: rel.toEntityId,
          type: rel.relationshipType as RelationshipType,
          strength: mapRelationshipStrength(rel.strength),
          metadata: (rel.metadata as Record<string, unknown>) ?? {},
          createdAt: rel.createdAt.toISOString(),
        };

        nodes.push({
          entity: neighbor,
          relationships: [relationship],
          connectedEntities: [origin],
          hopDistance: hop,
        });

        const fromEntity = await this.getEntity(rel.fromEntityId);
        const toEntity = await this.getEntity(rel.toEntityId);

        evidenceChain.push({
          fromEntity: fromEntity?.name ?? rel.fromEntityId,
          toEntity: toEntity?.name ?? rel.toEntityId,
          relationshipType: relationship.type,
          domain: neighbor.domain,
          significance: assessSignificance(relationship),
          description: buildEvidenceDescription(
            relationship.type,
            fromEntity?.name ?? 'Unknown',
            toEntity?.name ?? 'Unknown',
          ),
        });

        if (fromEntity && toEntity && fromEntity.domain !== toEntity.domain) {
          crossDomainConnections.push({
            fromDomain: fromEntity.domain,
            toDomain: toEntity.domain,
            entityA: fromEntity.name,
            entityB: toEntity.name,
            connectionType: relationship.type,
            riskImplications: this.assessRiskImplications(relationship.type, fromEntity, toEntity),
          });
        }
      }

      currentFrontier = nextFrontier;
    }

    return {
      origin,
      nodes,
      totalNodes: nodes.length,
      evidenceChain,
      crossDomainConnections,
    };
  }

  /**
   * Shortest path between two entities using recursive CTE-based BFS.
   * Falls back to in-memory BFS if the DB query fails.
   */
  async shortestPath(
    fromEntityId: string,
    toEntityId: string,
    maxHops = 6,
  ): Promise<ShortestPathResult> {
    try {
      const result = await pool.query<{
        path_ids: string[];
        hop_count: number;
      }>(
        `
        WITH RECURSIVE graph_bfs AS (
          SELECT
            $1::uuid AS origin_id,
            $2::uuid AS target_id,
            ARRAY[$1::uuid] AS path,
            0 AS depth
          UNION ALL
          SELECT
            bfs.origin_id,
            bfs.target_id,
            bfs.path || r.to_entity_id,
            bfs.depth + 1
          FROM graph_bfs bfs
          JOIN entity_relationships r ON r.from_entity_id = bfs.path[array_length(bfs.path, 1)]
          WHERE bfs.depth < $3
            AND NOT (r.to_entity_id = ANY(bfs.path))
        )
        SELECT path AS path_ids, depth AS hop_count
        FROM graph_bfs
        WHERE path[array_length(path, 1)] = target_id
        ORDER BY hop_count ASC
        LIMIT 1
      `,
        [fromEntityId, toEntityId, maxHops],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0]!;
        const pathIds = row.path_ids;
        const entities: OntologyEntity[] = [];
        const edges: OntologyRelationship[] = [];

        for (const entityId of pathIds) {
          const entity = await this.getEntity(entityId);
          if (entity) entities.push(entity);
        }

        for (let i = 0; i < pathIds.length - 1; i++) {
          const [fromId, toId] = [pathIds[i]!, pathIds[i + 1]!];
          const relRows = await db
            .select()
            .from(entityRelationshipsTable)
            .where(
              and(
                eq(entityRelationshipsTable.fromEntityId, fromId),
                eq(entityRelationshipsTable.toEntityId, toId),
              ),
            )
            .limit(1);

          if (relRows[0]) {
            edges.push({
              id: relRows[0].id,
              fromEntityId: fromId,
              toEntityId: toId,
              type: relRows[0].relationshipType as RelationshipType,
              strength: mapRelationshipStrength(relRows[0].strength),
              metadata: (relRows[0].metadata as Record<string, unknown>) ?? {},
              createdAt: relRows[0].createdAt.toISOString(),
            });
          }
        }

        return {
          path: entities,
          hops: row.hop_count,
          edges,
          totalWeight: edges.reduce((s, e) => s + strengthToWeight(e.strength), 0),
          found: true,
        };
      }
    } catch (err) {
      console.warn(
        '[OntologyEngine] Recursive CTE shortest path failed, falling back:',
        err instanceof Error ? err.message : err,
      );
    }

    return this.shortestPathInMemory(fromEntityId, toEntityId, maxHops);
  }

  private async shortestPathInMemory(
    fromEntityId: string,
    toEntityId: string,
    maxHops: number,
  ): Promise<ShortestPathResult> {
    const queue: Array<{ id: string; path: string[] }> = [
      { id: fromEntityId, path: [fromEntityId] },
    ];
    const visited = new Set<string>([fromEntityId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length - 1 >= maxHops) continue;

      const rels = await db
        .select()
        .from(entityRelationshipsTable)
        .where(
          or(
            eq(entityRelationshipsTable.fromEntityId, current.id),
            eq(entityRelationshipsTable.toEntityId, current.id),
          ),
        )
        .limit(50);

      for (const rel of rels) {
        const nextId = rel.fromEntityId === current.id ? rel.toEntityId : rel.fromEntityId;
        if (visited.has(nextId)) continue;

        const newPath = [...current.path, nextId];
        if (nextId === toEntityId) {
          const entities: OntologyEntity[] = [];
          for (const id of newPath) {
            const e = await this.getEntity(id);
            if (e) entities.push(e);
          }
          return {
            path: entities,
            hops: newPath.length - 1,
            edges: [],
            totalWeight: 0,
            found: true,
          };
        }

        visited.add(nextId);
        queue.push({ id: nextId, path: newPath });
      }
    }

    return { path: [], hops: 0, edges: [], totalWeight: 0, found: false };
  }

  /**
   * Community detection via label propagation over the entity graph.
   * Each entity inherits the majority label from its neighbors.
   */
  async communityDetection(
    maxIterations = 10,
    domainFilter?: string,
    limit = 500,
  ): Promise<CommunityDetectionResult> {
    const start = Date.now();

    const entityRows = await db
      .select({
        id: entitiesTable.id,
        name: entitiesTable.name,
        entityType: entitiesTable.entityType,
        sourceApp: entitiesTable.sourceApp,
      })
      .from(entitiesTable)
      .where(domainFilter ? eq(entitiesTable.sourceApp, domainFilter) : sql`TRUE`)
      .limit(limit);

    if (entityRows.length === 0) {
      return {
        communities: new Map(),
        totalEntities: 0,
        totalCommunities: 0,
        largestCommunitySize: 0,
        durationMs: Date.now() - start,
      };
    }

    const entityIds = entityRows.map((e) => e.id);
    const labels = new Map<string, string>(entityRows.map((e) => [e.id, e.id]));

    const relRows = await db
      .select({
        fromEntityId: entityRelationshipsTable.fromEntityId,
        toEntityId: entityRelationshipsTable.toEntityId,
      })
      .from(entityRelationshipsTable)
      .where(
        and(
          inArray(entityRelationshipsTable.fromEntityId, entityIds),
          inArray(entityRelationshipsTable.toEntityId, entityIds),
        ),
      )
      .limit(5000);

    const adjacency = new Map<string, string[]>();
    for (const rel of relRows) {
      if (!adjacency.has(rel.fromEntityId)) adjacency.set(rel.fromEntityId, []);
      if (!adjacency.has(rel.toEntityId)) adjacency.set(rel.toEntityId, []);
      adjacency.get(rel.fromEntityId)!.push(rel.toEntityId);
      adjacency.get(rel.toEntityId)!.push(rel.fromEntityId);
    }

    let iterations = 0;
    for (let iter = 0; iter < maxIterations; iter++) {
      iterations++;
      let changed = false;
      const shuffled = [...entityIds].sort(() => Math.random() - 0.5);

      for (const entityId of shuffled) {
        const neighbors = adjacency.get(entityId) ?? [];
        if (neighbors.length === 0) continue;

        const labelCounts = new Map<string, number>();
        for (const neighborId of neighbors) {
          const label = labels.get(neighborId) ?? neighborId;
          labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
        }

        const dominantLabel = [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (dominantLabel && dominantLabel !== labels.get(entityId)) {
          labels.set(entityId, dominantLabel);
          changed = true;
        }
      }

      if (!changed) break;
    }

    const communities = new Map<string, CommunityMember[]>();
    for (const row of entityRows) {
      const communityId = labels.get(row.id) ?? row.id;
      if (!communities.has(communityId)) communities.set(communityId, []);
      communities.get(communityId)!.push({
        entityId: row.id,
        entityName: row.name,
        entityType: mapEntityType(row.entityType),
        domain: row.sourceApp,
        communityId,
        iterations,
      });
    }

    const sizes = [...communities.values()].map((m) => m.length);
    return {
      communities,
      totalEntities: entityRows.length,
      totalCommunities: communities.size,
      largestCommunitySize: Math.max(0, ...sizes),
      durationMs: Date.now() - start,
    };
  }

  /**
   * Influence scoring — PageRank-inspired weighted degree centrality.
   * Uses in-degree, out-degree, and strength-weighted edges.
   */
  async computeInfluenceScores(entityIds?: string[], limit = 100): Promise<InfluenceScoreResult[]> {
    let targetIds = entityIds;
    if (!targetIds || targetIds.length === 0) {
      const rows = await db.select({ id: entitiesTable.id }).from(entitiesTable).limit(limit);
      targetIds = rows.map((r) => r.id);
    }

    if (targetIds.length === 0) return [];

    const relRows = await db
      .select({
        fromEntityId: entityRelationshipsTable.fromEntityId,
        toEntityId: entityRelationshipsTable.toEntityId,
        strength: entityRelationshipsTable.strength,
        relationshipType: entityRelationshipsTable.relationshipType,
      })
      .from(entityRelationshipsTable)
      .where(
        or(
          inArray(entityRelationshipsTable.fromEntityId, targetIds),
          inArray(entityRelationshipsTable.toEntityId, targetIds),
        ),
      )
      .limit(10000);

    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const weightedDegree = new Map<string, number>();

    for (const id of targetIds) {
      inDegree.set(id, 0);
      outDegree.set(id, 0);
      weightedDegree.set(id, 0);
    }

    for (const rel of relRows) {
      const w = strengthToWeight(rel.strength);
      if (targetIds.includes(rel.fromEntityId)) {
        outDegree.set(rel.fromEntityId, (outDegree.get(rel.fromEntityId) ?? 0) + 1);
        weightedDegree.set(rel.fromEntityId, (weightedDegree.get(rel.fromEntityId) ?? 0) + w);
      }
      if (targetIds.includes(rel.toEntityId)) {
        inDegree.set(rel.toEntityId, (inDegree.get(rel.toEntityId) ?? 0) + 1);
        weightedDegree.set(rel.toEntityId, (weightedDegree.get(rel.toEntityId) ?? 0) + w * 1.5);
      }
    }

    const entityRows = await db
      .select({ id: entitiesTable.id, name: entitiesTable.name })
      .from(entitiesTable)
      .where(inArray(entitiesTable.id, targetIds));

    const nameMap = new Map(entityRows.map((e) => [e.id, e.name]));

    const maxWeighted = Math.max(1, ...targetIds.map((id) => weightedDegree.get(id) ?? 0));
    const results: InfluenceScoreResult[] = targetIds
      .map((id) => ({
        entityId: id,
        entityName: nameMap.get(id) ?? id,
        influenceScore: (weightedDegree.get(id) ?? 0) / maxWeighted,
        inDegree: inDegree.get(id) ?? 0,
        outDegree: outDegree.get(id) ?? 0,
        weightedDegree: weightedDegree.get(id) ?? 0,
        rank: 0,
      }))
      .sort((a, b) => b.influenceScore - a.influenceScore);

    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    return results;
  }

  /**
   * Temporal graph analysis — score relationships by recency.
   * Recent edges weighted higher; decayed edges marked as stale.
   */
  async temporalGraphAnalysis(
    entityId: string,
    maxHops = 2,
    minTemporalWeight = 0.3,
  ): Promise<{
    entity: OntologyEntity | null;
    temporalEdges: TemporalEdge[];
    recentActivity: string;
    temporalClusters: Array<{ period: string; edgeCount: number; avgWeight: number }>;
  }> {
    const entity = await this.getEntity(entityId);

    const relRows = await db
      .select()
      .from(entityRelationshipsTable)
      .where(
        or(
          eq(entityRelationshipsTable.fromEntityId, entityId),
          eq(entityRelationshipsTable.toEntityId, entityId),
        ),
      )
      .limit(200);

    const now = Date.now();
    const temporalEdges: TemporalEdge[] = relRows
      .map((rel) => {
        const ageMs = now - rel.createdAt.getTime();
        const temporalWeight = computeTemporalWeight(rel.createdAt.toISOString());
        return {
          relationshipId: rel.id,
          fromEntityId: rel.fromEntityId,
          toEntityId: rel.toEntityId,
          type: rel.relationshipType as RelationshipType,
          createdAt: rel.createdAt.toISOString(),
          ageMs,
          temporalWeight,
          strength: mapRelationshipStrength(rel.strength),
        };
      })
      .filter((e) => e.temporalWeight >= minTemporalWeight)
      .sort((a, b) => b.temporalWeight - a.temporalWeight);

    const buckets = new Map<string, { edgeCount: number; totalWeight: number }>();
    for (const edge of temporalEdges) {
      const date = new Date(edge.createdAt);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(period) ?? { edgeCount: 0, totalWeight: 0 };
      bucket.edgeCount++;
      bucket.totalWeight += edge.temporalWeight;
      buckets.set(period, bucket);
    }

    const temporalClusters = [...buckets.entries()]
      .map(([period, b]) => ({
        period,
        edgeCount: b.edgeCount,
        avgWeight: b.totalWeight / b.edgeCount,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 12);

    const recentEdges = temporalEdges.filter((e) => e.ageMs < 7 * 24 * 60 * 60 * 1000);
    const recentActivity =
      recentEdges.length > 0
        ? `${recentEdges.length} relationship(s) in the last 7 days (avg temporal weight: ${(recentEdges.reduce((s, e) => s + e.temporalWeight, 0) / recentEdges.length).toFixed(2)})`
        : 'No recent relationship activity in the last 7 days';

    return { entity, temporalEdges, recentActivity, temporalClusters };
  }

  /**
   * Extract a subgraph around a center entity for GraphRAG context injection.
   * Applies temporal decay and confidence weighting to edges.
   */
  async extractSubgraph(
    centerEntityId: string,
    maxDepth = 3,
    maxNodes = 30,
    minRiskScore = 0.0,
    minConfidence = 0.3,
  ): Promise<SubgraphExtraction> {
    const visitedIds = new Set<string>([centerEntityId]);
    const entityMap = new Map<string, OntologyEntity>();
    const edgeList: SubgraphExtraction['edges'] = [];
    let frontier = [centerEntityId];

    const center = await this.getEntity(centerEntityId);
    if (center) entityMap.set(center.id, center);

    for (let depth = 1; depth <= maxDepth && entityMap.size < maxNodes; depth++) {
      if (frontier.length === 0) break;

      const relRows = await db
        .select()
        .from(entityRelationshipsTable)
        .where(
          or(
            inArray(entityRelationshipsTable.fromEntityId, frontier),
            inArray(entityRelationshipsTable.toEntityId, frontier),
          ),
        )
        .limit(maxNodes * 3);

      const nextFrontier: string[] = [];

      for (const rel of relRows) {
        const neighborId = frontier.includes(rel.fromEntityId) ? rel.toEntityId : rel.fromEntityId;
        if (visitedIds.has(neighborId)) continue;
        if (entityMap.size >= maxNodes) break;

        visitedIds.add(neighborId);

        const neighbor = await this.getEntity(neighborId);
        if (!neighbor) continue;
        if (neighbor.riskScore !== undefined && neighbor.riskScore < minRiskScore) continue;

        entityMap.set(neighborId, neighbor);
        nextFrontier.push(neighborId);

        const strengthW = strengthToWeight(rel.strength);
        const temporalW = computeTemporalWeight(rel.createdAt.toISOString());
        const meta = (rel.metadata as Record<string, unknown>) ?? {};
        const confScore = typeof meta.confidence === 'number' ? meta.confidence : 0.7;

        if (confScore < minConfidence) continue;

        edgeList.push({
          from: rel.fromEntityId,
          to: rel.toEntityId,
          type: rel.relationshipType as RelationshipType,
          weight: strengthW,
          temporalWeight: temporalW,
          confidenceScore: confScore,
        });
      }

      frontier = nextFrontier;
    }

    const rels: OntologyRelationship[] = edgeList.map((e, idx) => ({
      id: `subgraph-edge-${idx}`,
      fromEntityId: e.from,
      toEntityId: e.to,
      type: e.type,
      strength: e.weight > 0.7 ? 'strong' : e.weight > 0.4 ? 'moderate' : 'weak',
      metadata: { temporalWeight: e.temporalWeight, confidenceScore: e.confidenceScore },
      createdAt: new Date().toISOString(),
    }));

    return {
      centerEntityId,
      entities: [...entityMap.values()],
      relationships: rels,
      edges: edgeList,
      maxDepth,
      extractedAt: new Date().toISOString(),
    };
  }

  private assessRiskImplications(
    type: RelationshipType,
    from: OntologyEntity,
    to: OntologyEntity,
  ): string[] {
    const implications: string[] = [];
    if (type === 'litigates')
      implications.push(`Active litigation in ${from.domain} may impact ${to.domain} exposure`);
    if (type === 'threatens')
      implications.push(`Threat actor in ${from.domain} poses cross-domain risk to ${to.domain}`);
    if (type === 'owns' && from.domain !== to.domain)
      implications.push(
        `Ownership bridge between ${from.domain} and ${to.domain} creates correlated risk`,
      );
    if (type === 'sanctioned_by')
      implications.push(
        `Sanctions designation creates compliance risk across ${from.domain} and ${to.domain}`,
      );
    if (type === 'exposes')
      implications.push(`Material exposure detected across ${from.domain} → ${to.domain} boundary`);
    return implications;
  }

  async getEntityConnections(entityId: string): Promise<{
    outgoing: Array<{ rel: OntologyRelationship; target: OntologyEntity }>;
    incoming: Array<{ rel: OntologyRelationship; source: OntologyEntity }>;
  }> {
    const [outgoingRels, incomingRels] = await Promise.all([
      db
        .select()
        .from(entityRelationshipsTable)
        .where(eq(entityRelationshipsTable.fromEntityId, entityId)),
      db
        .select()
        .from(entityRelationshipsTable)
        .where(eq(entityRelationshipsTable.toEntityId, entityId)),
    ]);

    const outgoing = await Promise.all(
      outgoingRels.map(async (rel) => {
        const target = await this.getEntity(rel.toEntityId);
        return target
          ? {
              rel: {
                id: rel.id,
                fromEntityId: rel.fromEntityId,
                toEntityId: rel.toEntityId,
                type: rel.relationshipType as RelationshipType,
                strength: mapRelationshipStrength(rel.strength),
                metadata: (rel.metadata as Record<string, unknown>) ?? {},
                createdAt: rel.createdAt.toISOString(),
              },
              target,
            }
          : null;
      }),
    );

    const incoming = await Promise.all(
      incomingRels.map(async (rel) => {
        const source = await this.getEntity(rel.fromEntityId);
        return source
          ? {
              rel: {
                id: rel.id,
                fromEntityId: rel.fromEntityId,
                toEntityId: rel.toEntityId,
                type: rel.relationshipType as RelationshipType,
                strength: mapRelationshipStrength(rel.strength),
                metadata: (rel.metadata as Record<string, unknown>) ?? {},
                createdAt: rel.createdAt.toISOString(),
              },
              source,
            }
          : null;
      }),
    );

    return {
      outgoing: outgoing.filter((x): x is NonNullable<typeof x> => x !== null),
      incoming: incoming.filter((x): x is NonNullable<typeof x> => x !== null),
    };
  }

  async getDomainEntities(domain: string, limit = 50): Promise<OntologyEntity[]> {
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.sourceApp, domain))
      .limit(limit);

    return rows.map((row) => {
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      const _riskScoreB = meta.riskScore as number | undefined;
      return {
        id: row.id,
        type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
        name: row.name,
        domain: row.sourceApp,
        metadata: meta,
        tags: row.tags ?? [],
        ...(_riskScoreB !== undefined ? { riskScore: _riskScoreB } : {}),
        lastUpdated: row.updatedAt.toISOString(),
      };
    });
  }

  async getGraphStats(): Promise<{
    totalEntities: number;
    totalRelationships: number;
    entitiesByDomain: Record<string, number>;
    entitiesByType: Record<string, number>;
    crossDomainLinks: number;
  }> {
    const [entityRows, relRows] = await Promise.all([
      db
        .select({ sourceApp: entitiesTable.sourceApp, entityType: entitiesTable.entityType })
        .from(entitiesTable),
      db
        .select({
          fromEntityId: entityRelationshipsTable.fromEntityId,
          toEntityId: entityRelationshipsTable.toEntityId,
        })
        .from(entityRelationshipsTable)
        .limit(10000),
    ]);

    const entitiesByDomain: Record<string, number> = {};
    const entitiesByType: Record<string, number> = {};

    for (const row of entityRows) {
      entitiesByDomain[row.sourceApp] = (entitiesByDomain[row.sourceApp] ?? 0) + 1;
      entitiesByType[row.entityType] = (entitiesByType[row.entityType] ?? 0) + 1;
    }

    return {
      totalEntities: entityRows.length,
      totalRelationships: relRows.length,
      entitiesByDomain,
      entitiesByType,
      crossDomainLinks: relRows.length,
    };
  }
}

export const ontologyEngine = new OntologyEngine();

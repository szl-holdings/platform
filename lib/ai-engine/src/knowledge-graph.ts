/**
 * Knowledge Graph Engine — multi-hop traversal, path finding,
 * community detection, centrality scoring, and cross-domain linking.
 */

import { generateEmbedding, toVectorLiteral } from "./embedding-pipeline.js";

async function getPool() {
  const { pool } = await import("@szl-holdings/db");
  return pool;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphEntity {
  id: string;
  name: string;
  entityType: string;
  domain: string;
  subDomain?: string | null;
  description?: string | null;
  properties: Record<string, unknown>;
  confidence: number;
}

export interface GraphRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  strength: number;
  confidence: number;
  fromDomain: string;
  toDomain: string;
  isCrossDomain: boolean;
  properties: Record<string, unknown>;
}

export interface KgGraphNode extends GraphEntity {
  relationships?: GraphRelationship[];
  degree?: number;
  centralityScore?: number;
}

export interface SubGraph {
  entities: KgGraphNode[];
  relationships: GraphRelationship[];
  rootEntityId: string;
  hops: number;
}

export interface GraphPath {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  totalStrength: number;
  length: number;
}

export interface Community {
  id: string;
  members: GraphEntity[];
  centralEntity?: GraphEntity;
  cohesion: number;
  domains: string[];
}

// ─── Entity CRUD ──────────────────────────────────────────────────────────────

export async function upsertEntity(entity: {
  name: string;
  entityType: string;
  domain: string;
  subDomain?: string;
  description?: string;
  canonicalId?: string;
  sourceIds?: string[];
  properties?: Record<string, unknown>;
  confidence?: number;
  /** Tenant/org ID to scope this entity to a specific organization. NULL = shared/global. */
  tenantId?: string;
}): Promise<string> {
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO kg_entities (name, entity_type, domain, sub_domain, description, canonical_id, source_ids, properties, confidence, tenant_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (name, entity_type, domain, (COALESCE(tenant_id, ''))) DO UPDATE SET
       sub_domain = EXCLUDED.sub_domain,
       description = COALESCE(EXCLUDED.description, kg_entities.description),
       canonical_id = COALESCE(EXCLUDED.canonical_id, kg_entities.canonical_id),
       source_ids = EXCLUDED.source_ids,
       properties = EXCLUDED.properties,
       confidence = EXCLUDED.confidence,
       tenant_id = COALESCE(EXCLUDED.tenant_id, kg_entities.tenant_id),
       updated_at = NOW()
     RETURNING id, xmax`,
    [
      entity.name,
      entity.entityType,
      entity.domain,
      entity.subDomain ?? null,
      entity.description ?? null,
      entity.canonicalId ?? null,
      JSON.stringify(entity.sourceIds ?? []),
      JSON.stringify(entity.properties ?? {}),
      entity.confidence ?? 1.0,
      entity.tenantId ?? null,
    ],
  );
  const id = result.rows[0]?.id as string ?? "";
  const wasInsert = Number(result.rows[0]?.xmax) === 0;

  // Automatically detect and persist cross-domain links for new entities.
  // This runs in the background so it never blocks the caller.
  if (id && wasInsert) {
    const ALL_DOMAINS = ["prism", "terra", "aegis", "carlota_jo", "lyte", "stephen", "szl"];
    const otherDomains = ALL_DOMAINS.filter((d) => d !== entity.domain);
    setImmediate(() => {
      void autoLinkEntity({ id, name: entity.name, domain: entity.domain, entityType: entity.entityType }, otherDomains, entity.tenantId);
    });
  }

  return id;
}

/** Fire-and-forget: detect high-confidence cross-domain candidates and persist them. */
async function autoLinkEntity(
  src: { id: string; name: string; domain: string; entityType: string },
  targetDomains: string[],
  tenantId?: string,
): Promise<void> {
  try {
    const candidates = await detectCrossDomainLinks(src, targetDomains, tenantId);
    const high = candidates.filter((c) => c.confidence >= 0.85);
    for (const c of high) {
      // First ensure the underlying relationship exists in kg_relationships
      const relId = await upsertRelationship({
        fromEntityId: src.id,
        toEntityId: c.toEntity.id,
        relationshipType: c.suggestedRelationship,
        strength: c.confidence,
        confidence: c.confidence,
        fromDomain: src.domain,
        toDomain: c.toEntity.domain,
        detectedBy: "auto",
        properties: { autoLinked: true, reason: c.reason },
      });

      // Then persist the cross-domain link record using the actual schema
      const pool = await getPool();
      await pool.query(
        `INSERT INTO kg_cross_domain_links
           (relationship_id, from_domain, to_domain, link_type, detected_by, trigger_entity_id, metadata)
         VALUES ($1, $2, $3, $4, 'auto', $5, $6)
         ON CONFLICT ON CONSTRAINT kg_xdomain_rel_unique DO UPDATE SET
           detected_by = EXCLUDED.detected_by,
           metadata = EXCLUDED.metadata`,
        [relId, src.domain, c.toEntity.domain, c.suggestedRelationship, src.id, JSON.stringify({ reason: c.reason, confidence: c.confidence })],
      );
    }
  } catch (err) {
    console.error("[knowledge-graph] autoLinkEntity failed:", err instanceof Error ? err.message : String(err));
  }
}

export async function upsertRelationship(rel: {
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  strength?: number;
  confidence?: number;
  fromDomain: string;
  toDomain: string;
  properties?: Record<string, unknown>;
  evidenceIds?: string[];
  detectedBy?: string;
}): Promise<string> {
  const pool = await getPool();
  const isCrossDomain = rel.fromDomain !== rel.toDomain;
  const result = await pool.query(
    `INSERT INTO kg_relationships
       (from_entity_id, to_entity_id, relationship_type, strength, confidence,
        from_domain, to_domain, is_cross_domain, properties, evidence_ids, detected_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (from_entity_id, to_entity_id, relationship_type) DO UPDATE SET
       strength = EXCLUDED.strength,
       confidence = EXCLUDED.confidence,
       properties = EXCLUDED.properties,
       updated_at = NOW()
     RETURNING id`,
    [
      rel.fromEntityId,
      rel.toEntityId,
      rel.relationshipType,
      rel.strength ?? 1.0,
      rel.confidence ?? 1.0,
      rel.fromDomain,
      rel.toDomain,
      isCrossDomain,
      JSON.stringify(rel.properties ?? {}),
      JSON.stringify(rel.evidenceIds ?? []),
      rel.detectedBy ?? null,
    ],
  );

  const id = result.rows[0]?.id as string;

  if (isCrossDomain && id) {
    await pool.query(
      `INSERT INTO kg_cross_domain_links (relationship_id, from_domain, to_domain, link_type, detected_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [id, rel.fromDomain, rel.toDomain, rel.relationshipType, rel.detectedBy ?? "system"],
    ).catch((err: unknown) => {
      console.warn("[knowledge-graph] cross-domain link insert failed:", err instanceof Error ? err.message : String(err));
    });
  }

  return id ?? "";
}

// ─── Multi-Hop Traversal ──────────────────────────────────────────────────────

export async function traverseSubgraph(
  rootEntityId: string,
  options: {
    maxHops?: number;
    relationshipTypes?: string[];
    domains?: string[];
    minStrength?: number;
    maxNodes?: number;
    /** Tenant/org ID for multi-tenant isolation. Only entities matching this org or with no tenant are returned. */
    tenantId?: string;
  } = {},
): Promise<SubGraph> {
  const pool = await getPool();
  const maxHops = options.maxHops ?? 2;
  const maxNodes = options.maxNodes ?? 100;

  // Pre-check: verify root entity is accessible to the caller's tenant before traversing.
  // Returns an empty subgraph rather than leaking the entity's existence.
  if (options.tenantId) {
    const rootCheck = await pool.query(
      `SELECT id FROM kg_entities WHERE id = $1 AND is_active = true AND (tenant_id IS NULL OR tenant_id = $2)`,
      [rootEntityId, options.tenantId],
    );
    if (rootCheck.rows.length === 0) {
      return { entities: [], relationships: [], rootEntityId, hops: maxHops };
    }
  }

  const visited = new Set<string>([rootEntityId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: rootEntityId, depth: 0 }];
  const allRelationships: GraphRelationship[] = [];
  const entityIds: string[] = [rootEntityId];

  while (queue.length > 0 && entityIds.length < maxNodes) {
    const current = queue.shift()!;
    if (current.depth >= maxHops) continue;

    let sql = `
      SELECT r.*, 
             e_from.name AS from_name, e_from.entity_type AS from_type, e_from.domain AS from_d,
             e_to.name AS to_name, e_to.entity_type AS to_type, e_to.domain AS to_d
      FROM kg_relationships r
      JOIN kg_entities e_from ON r.from_entity_id = e_from.id
      JOIN kg_entities e_to ON r.to_entity_id = e_to.id
      WHERE (r.from_entity_id = $1 OR r.to_entity_id = $1)
        AND e_from.is_active = true AND e_to.is_active = true
    `;
    const params: unknown[] = [current.id];
    let p = 2;

    if (options.relationshipTypes?.length) {
      sql += ` AND r.relationship_type = ANY($${p++})`;
      params.push(options.relationshipTypes);
    }
    if (options.minStrength) {
      sql += ` AND r.strength >= $${p++}`;
      params.push(options.minStrength);
    }
    if (options.domains?.length) {
      sql += ` AND (e_from.domain = ANY($${p++}) OR e_to.domain = ANY($${p - 1}))`;
      params.push(options.domains);
    }
    if (options.tenantId) {
      sql += ` AND (e_from.tenant_id IS NULL OR e_from.tenant_id = $${p}) AND (e_to.tenant_id IS NULL OR e_to.tenant_id = $${p++})`;
      params.push(options.tenantId);
    }

    const result = await pool.query(sql, params);

    for (const row of result.rows as Record<string, unknown>[]) {
      const rel: GraphRelationship = {
        id: row.id as string,
        fromEntityId: row.from_entity_id as string,
        toEntityId: row.to_entity_id as string,
        relationshipType: row.relationship_type as string,
        strength: Number(row.strength ?? 1),
        confidence: Number(row.confidence ?? 1),
        fromDomain: row.from_domain as string,
        toDomain: row.to_domain as string,
        isCrossDomain: Boolean(row.is_cross_domain),
        properties: (row.properties as Record<string, unknown>) ?? {},
      };

      const alreadyAdded = allRelationships.some((r) => r.id === rel.id);
      if (!alreadyAdded) allRelationships.push(rel);

      const neighborId = rel.fromEntityId === current.id ? rel.toEntityId : rel.fromEntityId;
      if (!visited.has(neighborId) && entityIds.length < maxNodes) {
        visited.add(neighborId);
        entityIds.push(neighborId);
        queue.push({ id: neighborId, depth: current.depth + 1 });
      }
    }
  }

  // Tenant boundary: filter out any entity IDs that are not accessible to the caller.
  // This prevents IDOR-style data leakage when a tenant-scoped caller supplies an
  // arbitrary root entity UUID belonging to another tenant.
  const tenantEntityFilter = options.tenantId
    ? `AND (tenant_id IS NULL OR tenant_id = $2)`
    : "";
  const tenantEntityArgs = options.tenantId ? [entityIds, options.tenantId] : [entityIds];

  const entitiesResult = await pool.query(
    `SELECT * FROM kg_entities WHERE id = ANY($1) AND is_active = true ${tenantEntityFilter}`,
    tenantEntityArgs,
  );

  const entities: KgGraphNode[] = entitiesResult.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    entityType: r.entity_type as string,
    domain: r.domain as string,
    subDomain: r.sub_domain as string | null,
    description: r.description as string | null,
    properties: (r.properties as Record<string, unknown>) ?? {},
    confidence: Number(r.confidence ?? 1),
    degree: allRelationships.filter((rel) => rel.fromEntityId === r.id || rel.toEntityId === r.id).length,
  }));

  return {
    entities,
    relationships: allRelationships,
    rootEntityId,
    hops: maxHops,
  };
}

// ─── Path Finding ─────────────────────────────────────────────────────────────

export async function findPaths(
  fromEntityId: string,
  toEntityId: string,
  options: { maxHops?: number; maxPaths?: number; tenantId?: string } = {},
): Promise<GraphPath[]> {
  const pool = await getPool();
  const maxHops = options.maxHops ?? 4;
  const maxPaths = options.maxPaths ?? 5;
  const tenantId = options.tenantId ?? null;

  // Pre-check: verify start and end entities are accessible to the caller's tenant.
  // Returns empty array rather than leaking cross-tenant entity IDs.
  if (tenantId) {
    const accessCheck = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM kg_entities
       WHERE id = ANY($1) AND (tenant_id IS NULL OR tenant_id = $2)`,
      [[fromEntityId, toEntityId], tenantId],
    );
    if ((accessCheck.rows[0] as { cnt: number }).cnt < 2) return [];
  }

  // Tenant-aware path traversal: the recursive step filters the next-hop entity
  // through kg_entities so cross-tenant edges are never traversed.
  // `visited` is the cycle-prevention set (includes source from the start).
  // `path_nodes` is the canonical ordered node list for the path; it grows by
  // appending the *next* node on each hop so the final array is exactly the
  // nodes visited in order with no duplicates.
  const sqlResult = await pool.query(
    `WITH RECURSIVE path_cte AS (
       -- Anchor: source node only; path_nodes starts with the source.
       -- All ID columns are uuid so we cast params accordingly.
       SELECT
         $1::uuid AS current_id,
         ARRAY[$1::uuid] AS visited,
         ARRAY[$1::uuid] AS path_nodes,
         ARRAY[]::text[] AS rel_ids,
         1.0::float AS total_strength,
         0 AS depth

       UNION ALL

       -- Recursive: traverse edges in BOTH directions (undirected semantics).
       -- next_id is computed once via a lateral subquery to avoid repeating the CASE.
       SELECT
         next_id,
         p.visited    || next_id,
         p.path_nodes || next_id,
         p.rel_ids    || r.id::text,
         p.total_strength * r.strength,
         p.depth + 1
       FROM path_cte p
       JOIN kg_relationships r
         ON r.from_entity_id = p.current_id OR r.to_entity_id = p.current_id
       CROSS JOIN LATERAL (
         SELECT CASE
           WHEN r.from_entity_id = p.current_id THEN r.to_entity_id
           ELSE r.from_entity_id
         END AS next_id
       ) nx
       -- Tenant boundary: only traverse to entities accessible by the caller's org.
       JOIN kg_entities e_next
         ON e_next.id = next_id
         AND ($5::text IS NULL OR e_next.tenant_id IS NULL OR e_next.tenant_id = $5)
       WHERE p.depth < $3
         AND NOT (next_id = ANY(p.visited))
     )
     SELECT path_nodes::text[] AS full_path, rel_ids, total_strength, depth
     FROM path_cte
     WHERE current_id = $2::uuid
       AND depth > 0
     ORDER BY depth ASC, total_strength DESC
     LIMIT $4`,
    [fromEntityId, toEntityId, maxHops, maxPaths, tenantId],
  );

  const paths: GraphPath[] = [];

  for (const row of sqlResult.rows as Array<{ full_path: string[]; rel_ids: string[]; total_strength: number; depth: number }>) {
    const entityIds = row.full_path;
    const relIds = row.rel_ids;

    const entitiesResult = await pool.query(
      `SELECT * FROM kg_entities WHERE id = ANY($1) AND ($2::text IS NULL OR tenant_id IS NULL OR tenant_id = $2)`,
      [entityIds, tenantId],
    );
    const relsResult = await pool.query(`SELECT * FROM kg_relationships WHERE id = ANY($1)`, [relIds]);

    const entityMap = new Map<string, GraphEntity>(
      entitiesResult.rows.map((e: Record<string, unknown>) => [
        e.id as string,
        {
          id: e.id as string,
          name: e.name as string,
          entityType: e.entity_type as string,
          domain: e.domain as string,
          subDomain: e.sub_domain as string | null,
          description: e.description as string | null,
          properties: (e.properties as Record<string, unknown>) ?? {},
          confidence: Number(e.confidence ?? 1),
        },
      ]),
    );

    const entities = entityIds.map((id) => entityMap.get(id)).filter(Boolean) as GraphEntity[];
    const relationships = relsResult.rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      fromEntityId: r.from_entity_id as string,
      toEntityId: r.to_entity_id as string,
      relationshipType: r.relationship_type as string,
      strength: Number(r.strength ?? 1),
      confidence: Number(r.confidence ?? 1),
      fromDomain: r.from_domain as string,
      toDomain: r.to_domain as string,
      isCrossDomain: Boolean(r.is_cross_domain),
      properties: (r.properties as Record<string, unknown>) ?? {},
    }));

    paths.push({ entities, relationships, totalStrength: row.total_strength, length: row.depth });
  }

  return paths;
}

// ─── Community Detection (Label Propagation) ──────────────────────────────────

export async function detectCommunities(
  options: { domain?: string; minSize?: number; maxCommunities?: number; tenantId?: string } = {},
): Promise<Community[]> {
  const pool = await getPool();
  const minSize = options.minSize ?? 2;
  const maxCommunities = options.maxCommunities ?? 20;

  let entitiesQuery = `SELECT id, name, entity_type, domain, sub_domain, description, properties, confidence FROM kg_entities WHERE is_active = true`;
  const params: unknown[] = [];
  if (options.domain) {
    params.push(options.domain);
    entitiesQuery += ` AND domain = $${params.length}`;
  }
  if (options.tenantId) {
    params.push(options.tenantId);
    entitiesQuery += ` AND (tenant_id IS NULL OR tenant_id = $${params.length})`;
  }
  entitiesQuery += ` LIMIT 500`;

  const entitiesResult = await pool.query(entitiesQuery, params);
  const entities = entitiesResult.rows as Array<Record<string, unknown>>;

  if (entities.length === 0) return [];

  const entityIds = entities.map((e) => e.id as string);
  const relsResult = await pool.query(
    `SELECT from_entity_id, to_entity_id, strength FROM kg_relationships
     WHERE from_entity_id = ANY($1) AND to_entity_id = ANY($1)`,
    [entityIds],
  );

  const labels = new Map<string, string>(entityIds.map((id) => [id, id]));
  const adjacency = new Map<string, Array<{ neighbor: string; strength: number }>>();

  for (const entity of entityIds) {
    adjacency.set(entity, []);
  }

  for (const rel of relsResult.rows as Array<Record<string, unknown>>) {
    const from = rel.from_entity_id as string;
    const to = rel.to_entity_id as string;
    const strength = Number(rel.strength ?? 1);
    adjacency.get(from)?.push({ neighbor: to, strength });
    adjacency.get(to)?.push({ neighbor: from, strength });
  }

  for (let iter = 0; iter < 10; iter++) {
    const shuffled = [...entityIds].sort(() => Math.random() - 0.5);
    for (const entityId of shuffled) {
      const neighbors = adjacency.get(entityId) ?? [];
      if (neighbors.length === 0) continue;

      const labelCounts = new Map<string, number>();
      for (const { neighbor, strength } of neighbors) {
        const label = labels.get(neighbor) ?? neighbor;
        labelCounts.set(label, (labelCounts.get(label) ?? 0) + strength);
      }

      let maxLabel = labels.get(entityId) ?? entityId;
      let maxCount = 0;
      for (const [label, count] of labelCounts) {
        if (count > maxCount) {
          maxCount = count;
          maxLabel = label;
        }
      }
      labels.set(entityId, maxLabel);
    }
  }

  const communityMap = new Map<string, string[]>();
  for (const [entityId, label] of labels) {
    const members = communityMap.get(label) ?? [];
    members.push(entityId);
    communityMap.set(label, members);
  }

  const entityMap = new Map<string, GraphEntity>(
    entities.map((e) => [
      e.id as string,
      {
        id: e.id as string,
        name: e.name as string,
        entityType: e.entity_type as string,
        domain: e.domain as string,
        subDomain: e.sub_domain as string | null,
        description: e.description as string | null,
        properties: (e.properties as Record<string, unknown>) ?? {},
        confidence: Number(e.confidence ?? 1),
      },
    ]),
  );

  const communities: Community[] = [];
  for (const [communityId, memberIds] of communityMap) {
    if (memberIds.length < minSize) continue;

    const members = memberIds.map((id) => entityMap.get(id)).filter(Boolean) as GraphEntity[];
    const domains = [...new Set(members.map((m) => m.domain))];

    const degreeMap = new Map<string, number>();
    for (const { neighbor } of [...adjacency.entries()].flatMap(([id, ns]) =>
      memberIds.includes(id) ? ns.filter((n) => memberIds.includes(n.neighbor)).map((n) => ({ ...n, from: id })) : []
    )) {
      degreeMap.set(neighbor, (degreeMap.get(neighbor) ?? 0) + 1);
    }

    let centralEntity: GraphEntity | undefined;
    let maxDegree = -1;
    for (const [id, degree] of degreeMap) {
      if (degree > maxDegree) {
        maxDegree = degree;
        centralEntity = entityMap.get(id);
      }
    }

    const totalPossibleEdges = (memberIds.length * (memberIds.length - 1)) / 2;
    const actualEdges = relsResult.rows.filter(
      (r: Record<string, unknown>) =>
        memberIds.includes(r.from_entity_id as string) && memberIds.includes(r.to_entity_id as string),
    ).length;
    const cohesion = totalPossibleEdges > 0 ? actualEdges / totalPossibleEdges : 0;

    communities.push({ id: communityId, members, centralEntity, cohesion, domains });

    if (communities.length >= maxCommunities) break;
  }

  return communities.sort((a, b) => b.members.length - a.members.length);
}

// ─── Centrality Scoring ───────────────────────────────────────────────────────

export async function computeCentralityScores(
  options: { domain?: string; limit?: number; tenantId?: string } = {},
): Promise<Array<GraphEntity & { centralityScore: number; degree: number }>> {
  const pool = await getPool();
  const limit = options.limit ?? 50;

  let sql = `
    SELECT e.*,
           COUNT(DISTINCT r.id) AS degree,
           COUNT(DISTINCT CASE WHEN r.is_cross_domain THEN r.id END) AS cross_domain_degree
    FROM kg_entities e
    LEFT JOIN kg_relationships r ON (r.from_entity_id = e.id OR r.to_entity_id = e.id)
    WHERE e.is_active = true
  `;
  const params: unknown[] = [];
  if (options.domain) {
    params.push(options.domain);
    sql += ` AND e.domain = $${params.length}`;
  }
  if (options.tenantId) {
    params.push(options.tenantId);
    sql += ` AND (e.tenant_id IS NULL OR e.tenant_id = $${params.length})`;
  }
  sql += ` GROUP BY e.id ORDER BY degree DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(sql, params);
  const maxDegree = Math.max(1, Number(result.rows[0]?.degree ?? 1));

  return result.rows.map((r: Record<string, unknown>) => {
    const degree = Number(r.degree ?? 0);
    const crossDomainDegree = Number(r.cross_domain_degree ?? 0);
    const centralityScore = (degree / maxDegree) * 0.7 + (crossDomainDegree > 0 ? 0.3 : 0);
    return {
      id: r.id as string,
      name: r.name as string,
      entityType: r.entity_type as string,
      domain: r.domain as string,
      subDomain: r.sub_domain as string | null,
      description: r.description as string | null,
      properties: (r.properties as Record<string, unknown>) ?? {},
      confidence: Number(r.confidence ?? 1),
      degree,
      centralityScore,
    };
  });
}

// ─── Semantic Entity Search ───────────────────────────────────────────────────

export async function findSimilarEntities(
  query: string,
  options: {
    entityTypes?: string[];
    domains?: string[];
    topK?: number;
    minScore?: number;
    /** Tenant/org ID for multi-tenant isolation. */
    tenantId?: string;
  } = {},
): Promise<Array<GraphEntity & { score: number }>> {
  const pool = await getPool();
  const topK = options.topK ?? 10;
  const minScore = options.minScore ?? 0.5;

  const queryEmbedding = await generateEmbedding(query);
  const embeddingLiteral = toVectorLiteral(queryEmbedding);

  const conditions: string[] = ["e.is_active = true", "e.embedding IS NOT NULL"];
  const params: unknown[] = [embeddingLiteral];
  let p = 2;

  if (options.entityTypes?.length) {
    conditions.push(`e.entity_type = ANY($${p++})`);
    params.push(options.entityTypes);
  }
  if (options.domains?.length) {
    conditions.push(`e.domain = ANY($${p++})`);
    params.push(options.domains);
  }
  if (options.tenantId) {
    conditions.push(`(e.tenant_id IS NULL OR e.tenant_id = $${p++})`);
    params.push(options.tenantId);
  }
  params.push(topK);

  const result = await pool.query(
    `SELECT e.*, 1 - (e.embedding <=> $1::vector) AS score
     FROM kg_entities e
     WHERE ${conditions.join(" AND ")}
     ORDER BY e.embedding <=> $1::vector
     LIMIT $${p}`,
    params,
  );

  return result.rows
    .map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      entityType: r.entity_type as string,
      domain: r.domain as string,
      subDomain: r.sub_domain as string | null,
      description: r.description as string | null,
      properties: (r.properties as Record<string, unknown>) ?? {},
      confidence: Number(r.confidence ?? 1),
      score: parseFloat(String(r.score ?? 0)),
    }))
    .filter((r) => r.score >= minScore);
}

// ─── Cross-Domain Link Detection ──────────────────────────────────────────────

export interface CrossDomainLinkCandidate {
  fromEntity: GraphEntity;
  toEntity: GraphEntity;
  suggestedRelationship: string;
  confidence: number;
  reason: string;
}

export async function detectCrossDomainLinks(
  sourceEntity: { id: string; name: string; domain: string; entityType: string },
  targetDomains: string[],
  tenantId?: string,
): Promise<CrossDomainLinkCandidate[]> {
  const pool = await getPool();
  const candidates: CrossDomainLinkCandidate[] = [];

  // Enforce tenant boundary on the source entity itself before revealing any data
  // or link candidates. A tenant-scoped caller who supplies an arbitrary UUID
  // must not receive cross-tenant entity metadata.
  const srcParams: unknown[] = [sourceEntity.id];
  const srcTenantClause = tenantId ? `AND (tenant_id IS NULL OR tenant_id = $2)` : "";
  if (tenantId) srcParams.push(tenantId);

  const sourceEntityFull = await pool.query(
    `SELECT * FROM kg_entities WHERE id = $1 AND is_active = true ${srcTenantClause}`,
    srcParams,
  );
  const src = sourceEntityFull.rows[0] as Record<string, unknown> | undefined;
  if (!src) return [];

  const tenantFilter = tenantId
    ? `AND (tenant_id IS NULL OR tenant_id = $3)`
    : "";
  const queryParams: unknown[] = [targetDomains, `%${sourceEntity.name.split(" ").slice(0, 2).join("%")}%`];
  if (tenantId) queryParams.push(tenantId);

  const targetEntities = await pool.query(
    `SELECT * FROM kg_entities WHERE domain = ANY($1) AND is_active = true AND name ILIKE $2 ${tenantFilter} LIMIT 20`,
    queryParams,
  );

  for (const target of targetEntities.rows as Record<string, unknown>[]) {
    if (target.id === sourceEntity.id) continue;

    let suggestedRelationship = "relates_to";
    let confidence = 0.6;
    let reason = "Name similarity";

    if (target.entity_type === src.entity_type) {
      confidence += 0.1;
      reason += " + same type";
    }
    if ((target.name as string).toLowerCase() === (src.name as string).toLowerCase()) {
      confidence = 0.95;
      suggestedRelationship = "same_as";
      reason = "Exact name match";
    }

    candidates.push({
      fromEntity: {
        id: src.id as string,
        name: src.name as string,
        entityType: src.entity_type as string,
        domain: src.domain as string,
        subDomain: src.sub_domain as string | null,
        description: src.description as string | null,
        properties: (src.properties as Record<string, unknown>) ?? {},
        confidence: Number(src.confidence ?? 1),
      },
      toEntity: {
        id: target.id as string,
        name: target.name as string,
        entityType: target.entity_type as string,
        domain: target.domain as string,
        subDomain: target.sub_domain as string | null,
        description: target.description as string | null,
        properties: (target.properties as Record<string, unknown>) ?? {},
        confidence: Number(target.confidence ?? 1),
      },
      suggestedRelationship,
      confidence,
      reason,
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

export async function getGraphStats(
  domain?: string,
  tenantId?: string,
): Promise<{
  totalEntities: number;
  totalRelationships: number;
  crossDomainLinks: number;
  byDomain: Record<string, number>;
  byEntityType: Record<string, number>;
  byRelationshipType: Record<string, number>;
}> {
  const pool = await getPool();

  const domainArgs: unknown[] = [];
  const tArgs: unknown[] = [];
  let domainFilter = "";
  let tenantFilter = "";
  // tenantFilterSolo is used for queries that do NOT already include a domain
  // parameter — its placeholder is always $1 so it matches tArgs = [tenantId].
  let tenantFilterSolo = "";
  if (domain) {
    domainArgs.push(domain);
    domainFilter = `AND domain = $1`;
  }
  if (tenantId) {
    tArgs.push(tenantId);
    // Combined queries have domainArgs first, so tenantId lands at position domainArgs.length+1.
    const tp = domainArgs.length + 1;
    tenantFilter = `AND (tenant_id IS NULL OR tenant_id = $${tp})`;
    // Solo queries (no domain arg) always have tenantId at $1.
    tenantFilterSolo = `AND (tenant_id IS NULL OR tenant_id = $1)`;
  }
  const combinedFilter = `${domainFilter} ${tenantFilter}`.trim();
  const combinedArgs = [...domainArgs, ...tArgs];

  // Build a single combined relationship filter (tenant + domain) for consistency
  // across entity counts and relationship counts when domain= is requested.
  const relClauses: string[] = [];
  const relArgs: unknown[] = [];
  if (tenantId) {
    relArgs.push(tenantId);
    const tp = relArgs.length;
    relClauses.push(
      `(e_from.tenant_id IS NULL OR e_from.tenant_id = $${tp}) AND (e_to.tenant_id IS NULL OR e_to.tenant_id = $${tp})`,
    );
  }
  if (domain) {
    relArgs.push(domain);
    const dp = relArgs.length;
    relClauses.push(`(e_from.domain = $${dp} OR e_to.domain = $${dp})`);
  }
  const relWhereClause = relClauses.length > 0 ? `AND ${relClauses.join(" AND ")}` : "";

  const [entities, rels, crossDomain, byDomain, byType, byRelType] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM kg_entities WHERE is_active = true ${combinedFilter}`, combinedArgs),
    pool.query(
      `SELECT COUNT(DISTINCT r.id)::int AS total
       FROM kg_relationships r
       JOIN kg_entities e_from ON e_from.id = r.from_entity_id AND e_from.is_active = true
       JOIN kg_entities e_to   ON e_to.id   = r.to_entity_id   AND e_to.is_active = true
       WHERE true ${relWhereClause}`,
      relArgs,
    ),
    pool.query(
      `SELECT COUNT(DISTINCT r.id)::int AS total
       FROM kg_relationships r
       JOIN kg_entities e_from ON e_from.id = r.from_entity_id AND e_from.is_active = true
       JOIN kg_entities e_to   ON e_to.id   = r.to_entity_id   AND e_to.is_active = true
       WHERE r.is_cross_domain = true ${relWhereClause}`,
      relArgs,
    ),
    pool.query(`SELECT domain, COUNT(*)::int AS count FROM kg_entities WHERE is_active = true ${tenantFilterSolo} GROUP BY domain`, tArgs),
    pool.query(`SELECT entity_type, COUNT(*)::int AS count FROM kg_entities WHERE is_active = true ${combinedFilter} GROUP BY entity_type`, combinedArgs),
    pool.query(
      `SELECT r.relationship_type, COUNT(DISTINCT r.id)::int AS count
       FROM kg_relationships r
       JOIN kg_entities e_from ON e_from.id = r.from_entity_id AND e_from.is_active = true
       JOIN kg_entities e_to   ON e_to.id   = r.to_entity_id   AND e_to.is_active = true
       WHERE true ${relWhereClause}
       GROUP BY r.relationship_type ORDER BY count DESC LIMIT 20`,
      relArgs,
    ),
  ]);

  return {
    totalEntities: (entities.rows[0] as { total: number }).total,
    totalRelationships: (rels.rows[0] as { total: number }).total,
    crossDomainLinks: (crossDomain.rows[0] as { total: number }).total,
    byDomain: Object.fromEntries((byDomain.rows as Array<{ domain: string; count: number }>).map((r) => [r.domain, r.count])),
    byEntityType: Object.fromEntries((byType.rows as Array<{ entity_type: string; count: number }>).map((r) => [r.entity_type, r.count])),
    byRelationshipType: Object.fromEntries((byRelType.rows as Array<{ relationship_type: string; count: number }>).map((r) => [r.relationship_type, r.count])),
  };
}

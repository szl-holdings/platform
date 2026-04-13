import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";
import crypto from "crypto";

export interface ExtractedEntity {
  name: string;
  entityType: string;
  domain: string;
  properties: Record<string, unknown>;
  confidence: number;
}

export interface ExtractedTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  evidence: string;
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  triples: ExtractedTriple[];
  resolvedEntityGroups: number;
  tokensUsed: number;
  latencyMs: number;
}

export interface EntityResolutionGroup {
  canonical: string;
  variants: string[];
  entityType: string;
  confidence: number;
}

export interface GraphTraversalResult {
  query: string;
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  summary: string;
  domainsReached: string[];
  hops: number;
}

/** Deterministic entity ID — keyed ONLY on (orgId, name) so extraction and
 *  triple-link writes always produce the same handle regardless of inferred
 *  entity-type. */
function entityId(orgId: number, name: string): string {
  const hash = crypto.createHash("md5").update(`${orgId}:${name.toLowerCase().trim()}`).digest("hex").slice(0, 16);
  return `ent_${hash}`;
}

async function ensureKnowledgeGraphTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_kg_extraction_log (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      signal_id INT,
      document_id TEXT,
      entities_extracted INT NOT NULL DEFAULT 0,
      triples_extracted INT NOT NULL DEFAULT 0,
      tokens_used INT NOT NULL DEFAULT 0,
      latency_ms INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alloy_kg_entity_resolution_log (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      canonical_entity_id TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      resolved_by TEXT NOT NULL DEFAULT 'ai',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_resolution_unique
      ON alloy_kg_entity_resolution_log(org_id, canonical_entity_id, variant_name);
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureKnowledgeGraphTables(); tablesEnsured = true; } catch (err) {
    logger.warn({ err }, "KG table ensure failed");
  }
}

export async function extractEntitiesAndTriples(params: {
  orgId: number;
  content: string;
  domain: string;
  documentId?: string;
  sourceSystem?: string;
}): Promise<ExtractionResult> {
  await ensureTables();
  const startTime = Date.now();

  const schema = {
    entities: [
      {
        name: "string — canonical entity name",
        entityType: "string — vessel|port|person|organization|property|threat_actor|case|asset|location|indicator",
        domain: "string — maritime|defense|legal|real_estate|consulting|observability",
        properties: "object — key facts extracted",
        confidence: "number 0-1"
      }
    ],
    triples: [
      {
        subject: "string — subject entity name (must match an entity name above)",
        predicate: "string — relationship verb: owns|operates|threatens|litigates|correlates_with|depends_on|located_at|files_against|manages|monitors",
        object: "string — object entity name (must match an entity name above)",
        confidence: "number 0-1",
        evidence: "string — supporting text snippet"
      }
    ]
  };

  let response: { content: string; usage?: { totalTokens?: number } } | undefined;
  try {
    response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a knowledge graph extraction engine. Extract entities and subject-predicate-object triples from the text.
Domain context: ${params.domain}
IMPORTANT: triple subject/object values MUST exactly match a name from the entities list.
Return ONLY valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}
Be precise. Extract only well-supported facts.`,
        },
        { role: "user", content: params.content.slice(0, 6000) },
      ],
      maxTokens: 1500,
      strategy: "cheapest",
    });
  } catch (err) {
    logger.warn({ err }, "Entity extraction inference failed");
    return { entities: [], triples: [], tokensUsed: 0, latencyMs: Date.now() - startTime };
  }

  let parsed: { entities: ExtractedEntity[]; triples: ExtractedTriple[] } = { entities: [], triples: [] };
  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch (err) {
    logger.warn({ err }, "Failed to parse entity extraction response");
  }

  const entities = (parsed.entities || []).map((e) => ({
    name: String(e.name || ""),
    entityType: String(e.entityType || "unknown"),
    domain: String(e.domain || params.domain),
    properties: e.properties || {},
    confidence: Math.min(1, Math.max(0, Number(e.confidence) || 0.5)),
  })).filter(e => e.name.length > 0);

  const triples = (parsed.triples || []).map((t) => ({
    subject: String(t.subject || ""),
    predicate: String(t.predicate || "relates_to"),
    object: String(t.object || ""),
    confidence: Math.min(1, Math.max(0, Number(t.confidence) || 0.5)),
    evidence: String(t.evidence || ""),
  })).filter(t => t.subject && t.object);

  // Build name→entityType map so link inserts can use the same ID function
  const entityTypeMap = new Map<string, string>();
  for (const entity of entities) {
    entityTypeMap.set(entity.name.toLowerCase().trim(), entity.entityType);
  }

  for (const entity of entities) {
    const eid = entityId(params.orgId, entity.name);
    try {
      await pool.query(
        `INSERT INTO alloy_ontology_entities (org_id, entity_id, entity_type, domain, name, properties, confidence, source_system)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (org_id, entity_id) DO UPDATE SET
           properties = alloy_ontology_entities.properties || $6,
           confidence = GREATEST(alloy_ontology_entities.confidence, $7),
           last_seen = NOW(), is_active = TRUE`,
        [params.orgId, eid, entity.entityType, entity.domain, entity.name,
         JSON.stringify(entity.properties), entity.confidence, params.sourceSystem || "kg_extraction"]
      );
    } catch (err) {
      logger.warn({ err, eid }, "Failed to upsert entity");
    }
  }

  for (const triple of triples) {
    // Use the same entityId function — IDs always match stored entities
    const srcId = entityId(params.orgId, triple.subject);
    const tgtId = entityId(params.orgId, triple.object);
    try {
      await pool.query(
        `INSERT INTO alloy_ontology_links (org_id, source_entity_id, target_entity_id, link_type, strength, evidence)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (org_id, source_entity_id, target_entity_id, link_type) DO UPDATE SET
           strength = GREATEST(alloy_ontology_links.strength, $5),
           evidence = alloy_ontology_links.evidence || $6`,
        [params.orgId, srcId, tgtId, triple.predicate, triple.confidence,
         JSON.stringify([{ text: triple.evidence, ts: new Date().toISOString() }])]
      );
    } catch (err) {
      logger.warn({ err, srcId, tgtId }, "Failed to upsert link");
    }
  }

  const latencyMs = Date.now() - startTime;
  try {
    await pool.query(
      `INSERT INTO alloy_kg_extraction_log (org_id, document_id, entities_extracted, triples_extracted, tokens_used, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [params.orgId, params.documentId ?? null,
       entities.length, triples.length, response?.usage?.totalTokens ?? 0, latencyMs]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to write extraction log");
  }

  // Background entity resolution: merge variant names to canonical entities.
  // Fire-and-forget — runs after response is returned.
  let resolvedEntityGroups = 0;
  if (entities.length >= 2) {
    resolveEntities({
      orgId: params.orgId,
      entityNames: entities.map(e => e.name),
    }).then(groups => {
      resolvedEntityGroups = groups.length;
    }).catch(resolveErr => {
      logger.debug({ err: resolveErr, orgId: params.orgId }, "Background entity resolution failed (non-critical)");
    });
  }

  return { entities, triples, resolvedEntityGroups, tokensUsed: response?.usage?.totalTokens ?? 0, latencyMs };
}

export async function resolveEntities(params: {
  orgId: number;
  entityNames: string[];
  entityType?: string;
}): Promise<EntityResolutionGroup[]> {
  if (params.entityNames.length < 2) return [];

  let response: { content: string } | undefined;
  try {
    response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an entity resolution engine. Group entity name variants that refer to the same real-world entity.
Examples: "Edwin Aldrin" → "Buzz Aldrin", "IBM Corp" → "International Business Machines", "MV Ever Given" → "Ever Given".
Return ONLY valid JSON array:
[{"canonical":"string","variants":["string"],"entityType":"string","confidence":0.0-1.0}]`,
        },
        {
          role: "user",
          content: `Resolve these entity names (type: ${params.entityType ?? "unknown"}):\n${params.entityNames.join("\n")}`,
        },
      ],
      maxTokens: 800,
      strategy: "cheapest",
    });
  } catch (err) {
    logger.warn({ err }, "Entity resolution inference failed");
    return [];
  }

  let groups: EntityResolutionGroup[] = [];
  try {
    const match = response.content.match(/\[[\s\S]*\]/);
    if (match) groups = JSON.parse(match[0]);
  } catch (err) {
    logger.warn({ err }, "Failed to parse entity resolution response");
  }

  for (const group of groups) {
    if (!group.canonical || !group.variants?.length) continue;
    const canonicalId = entityId(params.orgId, group.canonical);

    // Ensure canonical entity exists in the ontology
    try {
      await pool.query(
        `INSERT INTO alloy_ontology_entities (org_id, entity_id, entity_type, domain, name, properties, confidence, source_system)
         VALUES ($1, $2, $3, 'general', $4, '{}', $5, 'entity_resolution')
         ON CONFLICT (org_id, entity_id) DO UPDATE SET
           confidence = GREATEST(alloy_ontology_entities.confidence, $5),
           last_seen = NOW()`,
        [params.orgId, canonicalId, group.entityType || "unknown", group.canonical, group.confidence ?? 0.8]
      );
    } catch (err) {
      logger.warn({ err, canonicalId }, "Failed to upsert canonical entity");
    }

    for (const variant of group.variants) {
      const variantId = entityId(params.orgId, variant);
      // Log the resolution mapping
      try {
        await pool.query(
          `INSERT INTO alloy_kg_entity_resolution_log (org_id, canonical_entity_id, variant_name, confidence, resolved_by)
           VALUES ($1, $2, $3, $4, 'ai')
           ON CONFLICT (org_id, canonical_entity_id, variant_name) DO NOTHING`,
          [params.orgId, canonicalId, variant, group.confidence ?? 0.8]
        );
      } catch (err) {
        logger.warn({ err }, "Failed to write resolution log");
      }

      // Merge variant entity into canonical: redirect variant's links to canonical
      if (variantId !== canonicalId) {
        try {
          await pool.query(
            `UPDATE alloy_ontology_links SET source_entity_id = $1
             WHERE org_id = $2 AND source_entity_id = $3`,
            [canonicalId, params.orgId, variantId]
          );
          await pool.query(
            `UPDATE alloy_ontology_links SET target_entity_id = $1
             WHERE org_id = $2 AND target_entity_id = $3`,
            [canonicalId, params.orgId, variantId]
          );
          // Deactivate the variant entity record
          await pool.query(
            `UPDATE alloy_ontology_entities SET is_active = FALSE, properties = properties || $1
             WHERE org_id = $2 AND entity_id = $3`,
            [JSON.stringify({ canonical_alias: canonicalId }), params.orgId, variantId]
          );
        } catch (err) {
          logger.warn({ err, variantId, canonicalId }, "Failed to merge variant entity");
        }
      }
    }
  }

  return groups;
}

/** BFS-based multi-hop graph traversal starting from a named entity. */
export async function multiHopGraphQuery(params: {
  orgId: number;
  naturalLanguageQuery: string;
  startEntityName?: string;
  maxHops?: number;
  crossDomainOnly?: boolean;
}): Promise<GraphTraversalResult> {
  const maxHops = Math.min(params.maxHops ?? 3, 4);

  // Fetch full subgraph into memory (nodes + adjacency)
  const [nodesResult, edgesResult] = await Promise.all([
    pool.query(
      `SELECT entity_id, name, entity_type, domain, confidence, properties
       FROM alloy_ontology_entities WHERE org_id = $1 AND is_active = TRUE`,
      [params.orgId]
    ).catch(() => ({ rows: [] as Array<Record<string, unknown>> })),
    pool.query(
      `SELECT source_entity_id, target_entity_id, link_type, strength
       FROM alloy_ontology_links WHERE org_id = $1`,
      [params.orgId]
    ).catch(() => ({ rows: [] as Array<Record<string, unknown>> })),
  ]);

  const allNodes: Array<Record<string, unknown>> = nodesResult.rows;
  const allEdges: Array<Record<string, unknown>> = edgesResult.rows;

  // Build adjacency index (bidirectional for traversal)
  const adjacency = new Map<string, Set<string>>();
  for (const edge of allEdges) {
    const src = edge.source_entity_id as string;
    const tgt = edge.target_entity_id as string;
    if (!adjacency.has(src)) adjacency.set(src, new Set());
    if (!adjacency.has(tgt)) adjacency.set(tgt, new Set());
    adjacency.get(src)!.add(tgt);
    adjacency.get(tgt)!.add(src);
  }

  // Resolve start entity
  let startId: string | null = null;
  if (params.startEntityName) {
    startId = entityId(params.orgId, params.startEntityName);
    // If not found by exact ID, try name lookup
    const found = allNodes.find(n =>
      String(n.name).toLowerCase().includes(params.startEntityName!.toLowerCase())
    );
    if (found) startId = found.entity_id as string;
  }

  // BFS traversal
  const visitedNodeIds = new Set<string>();
  const visitedEdgeKeys = new Set<string>();

  if (startId && adjacency.has(startId)) {
    let frontier = new Set<string>([startId]);
    visitedNodeIds.add(startId);

    for (let hop = 0; hop < maxHops && frontier.size > 0; hop++) {
      const nextFrontier = new Set<string>();
      for (const nodeId of frontier) {
        const neighbors = adjacency.get(nodeId) ?? new Set<string>();
        for (const neighborId of neighbors) {
          const edgeKey = [nodeId, neighborId].sort().join("|");
          visitedEdgeKeys.add(edgeKey);
          if (!visitedNodeIds.has(neighborId)) {
            visitedNodeIds.add(neighborId);
            nextFrontier.add(neighborId);
          }
        }
      }
      frontier = nextFrontier;
    }
  } else {
    // No start entity — use top-50 by confidence
    for (const n of allNodes.slice(0, 50)) visitedNodeIds.add(n.entity_id as string);
    for (const e of allEdges.slice(0, 100)) {
      visitedEdgeKeys.add([e.source_entity_id, e.target_entity_id].sort().join("|"));
    }
  }

  const reachableNodes = allNodes.filter(n => visitedNodeIds.has(n.entity_id as string));
  const reachableEdges = allEdges.filter(e => {
    const key = [e.source_entity_id as string, e.target_entity_id as string].sort().join("|");
    return visitedEdgeKeys.has(key);
  });

  // Filter cross-domain only if requested
  const nodeDomainsById = new Map(reachableNodes.map(n => [n.entity_id as string, n.domain as string]));
  const finalEdges = params.crossDomainOnly
    ? reachableEdges.filter(e =>
        nodeDomainsById.get(e.source_entity_id as string) !== nodeDomainsById.get(e.target_entity_id as string)
      )
    : reachableEdges;

  const graphContext = JSON.stringify({
    nodes: reachableNodes.slice(0, 60).map(n => ({ id: n.entity_id, name: n.name, type: n.entity_type, domain: n.domain })),
    edges: finalEdges.slice(0, 120).map(e => ({ from: e.source_entity_id, to: e.target_entity_id, type: e.link_type, strength: e.strength })),
  }).slice(0, 8000);

  let summary = "No results found for this query.";
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a knowledge graph query engine. Given a subgraph reached by BFS traversal and a natural language query, synthesize an analyst-ready answer.
Identify relevant multi-hop paths and cross-domain connections from the provided nodes and edges.`,
        },
        {
          role: "user",
          content: `Query: ${params.naturalLanguageQuery}\n\nSubgraph (${reachableNodes.length} nodes, ${finalEdges.length} edges, ${maxHops} max hops from "${params.startEntityName ?? "top entities"}"):\n${graphContext}`,
        },
      ],
      maxTokens: 800,
      strategy: "preferred",
    });
    summary = response.content;
  } catch (err) {
    logger.warn({ err }, "Graph traversal LLM synthesis failed");
    summary = `Graph traversal complete: ${reachableNodes.length} nodes, ${finalEdges.length} edges reached within ${maxHops} hops.`;
  }

  const domains = [...new Set(reachableNodes.map(n => n.domain as string).filter(Boolean))];

  return {
    query: params.naturalLanguageQuery,
    nodes: reachableNodes,
    edges: finalEdges,
    summary,
    domainsReached: domains,
    hops: maxHops,
  };
}

export async function getKnowledgeGraphStats(orgId: number): Promise<{
  totalEntities: number;
  totalLinks: number;
  domains: Record<string, number>;
  entityTypes: Record<string, number>;
  crossDomainLinks: number;
}> {
  try {
    const [entities, links, crossLinks] = await Promise.all([
      pool.query(
        `SELECT domain, entity_type, COUNT(*) as cnt FROM alloy_ontology_entities WHERE org_id = $1 AND is_active = TRUE GROUP BY domain, entity_type`,
        [orgId]
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM alloy_ontology_links WHERE org_id = $1`, [orgId]),
      pool.query(
        `SELECT COUNT(*) as cnt FROM alloy_ontology_links l
         JOIN alloy_ontology_entities s ON s.entity_id = l.source_entity_id AND s.org_id = $1
         JOIN alloy_ontology_entities t ON t.entity_id = l.target_entity_id AND t.org_id = $1
         WHERE s.domain != t.domain`,
        [orgId]
      ),
    ]);

    const domains: Record<string, number> = {};
    const entityTypes: Record<string, number> = {};
    let totalEntities = 0;

    for (const row of entities.rows) {
      domains[row.domain] = (domains[row.domain] || 0) + parseInt(row.cnt);
      entityTypes[row.entity_type] = (entityTypes[row.entity_type] || 0) + parseInt(row.cnt);
      totalEntities += parseInt(row.cnt);
    }

    return {
      totalEntities,
      totalLinks: parseInt(links.rows[0]?.cnt ?? "0"),
      domains,
      entityTypes,
      crossDomainLinks: parseInt(crossLinks.rows[0]?.cnt ?? "0"),
    };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch KG stats");
    return { totalEntities: 0, totalLinks: 0, domains: {}, entityTypes: {}, crossDomainLinks: 0 };
  }
}

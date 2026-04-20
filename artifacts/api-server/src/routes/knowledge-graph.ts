/**
 * Knowledge Graph & Semantic Search API Routes
 *
 * POST /knowledge/search          — Hybrid semantic + full-text search
 * GET  /knowledge/graph/:id       — Get entity subgraph with multi-hop traversal
 * GET  /knowledge/graph/:id/paths — Find paths between two entities
 * POST /knowledge/entities        — Create/update a graph entity
 * POST /knowledge/relationships   — Create/update a relationship
 * GET  /knowledge/communities     — Detect communities in the graph
 * GET  /knowledge/centrality      — Compute centrality scores
 * GET  /knowledge/stats           — Graph statistics
 * GET  /knowledge/embedding-models — List available embedding models
 * POST /knowledge/embed/batch     — Batch embed a table
 * POST /knowledge/cross-domain    — Cross-domain link candidates
 * POST /knowledge/rag-context     — Build RAG context from vector search
 * POST /knowledge/graph-query    — Natural-language graph query (NL → semantic anchor → subgraph)
 */

import { Router, type Request, type Response } from "express";
import { pool as dbPool } from "@szl-holdings/db";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendError, sendBadRequest } from "../lib/api-response";
import { logger } from "../lib/logger";
import {
  hybridSearch,
  unifiedSemanticSearch,
  buildVectorRAGContext,
} from "@szl-holdings/ai-engine/semantic-search";
import {
  traverseSubgraph,
  findPaths,
  detectCommunities,
  computeCentralityScores,
  findSimilarEntities,
  upsertEntity,
  upsertRelationship,
  detectCrossDomainLinks,
  getGraphStats,
} from "@szl-holdings/ai-engine/knowledge-graph";
import {
  generateEmbedding,
  listEmbeddingProviders,
  getAllowedEmbedTableNames,
  SCHEMA_VECTOR_DIM,
  scheduleEmbeddingTask,
  processEmbeddingTasks,
  batchEmbedTable,
  scheduleReembeddingOnModelChange,
} from "@szl-holdings/ai-engine/embedding-pipeline";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
const router = Router();

// All knowledge routes require authentication. This middleware runs first and sets
// req.user via the codebase's custom session/token resolver. Individual admin-only
// sub-routes add requireRole() on top of this base auth.
router.use(authMiddleware({ required: true }));

/** Safely parses an integer query param with optional min/max bounds.
 * Returns `fallback` for NaN/out-of-range values and clamps to [min, max] when provided. */
function parseIntParam(value: string, fallback: number, min?: number, max?: number): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/** Safely parses a float query param with optional min/max bounds. */
function parseFloatParam(value: string, fallback: number, min?: number, max?: number): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * Resolves the tenant scope from the already-authenticated request.
 *
 * Assumes authMiddleware has run first (req.user is set). Returns `{ tenantId }` where:
 *   - `tenantId === undefined` → admin/super_admin: unrestricted access, no SQL tenant filter.
 *   - `tenantId === string`    → regular user scoped to their primary org.
 *
 * Returns `null` (response already sent) when:
 *   - 401: req.user is unexpectedly absent (should be caught by authMiddleware above).
 *   - 403: authenticated but has no org membership (fail-closed: no implicit full-graph access).
 */
function requireScope(req: Request, res: Response): { tenantId: string | undefined } | null {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    return null;
  }
  const user = req.user;
  if (user.roles?.includes("super_admin") || user.roles?.includes("admin") || user.roles?.includes("ops")) {
    return { tenantId: undefined };
  }
  const orgId = user.orgs?.[0]?.orgId;
  if (orgId == null) {
    res.status(403).json({ error: "Forbidden", message: "No tenant context: user has no org membership" });
    return null;
  }
  return { tenantId: String(orgId) };
}

// ─── Semantic + Hybrid Search ─────────────────────────────────────────────────

router.post("/search", validateBody(bodyShape({
      "domains": z.unknown().optional(),
      "includeGraph": z.unknown().optional(),
      "limit": z.unknown().optional(),
      "metadataFilters": z.unknown().optional(),
      "minScore": z.unknown().optional(),
      "query": z.unknown().optional(),
      "sourceTypes": z.unknown().optional(),
      "textWeight": z.unknown().optional(),
      "vectorWeight": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const {
      query,
      domains,
      sourceTypes,
      metadataFilters,
      limit = 10,
      minScore = 0.05,
      vectorWeight = 0.7,
      textWeight = 0.3,
      includeGraph = false,
    } = req.body as {
      query: string;
      domains?: string[];
      sourceTypes?: string[];
      metadataFilters?: Record<string, unknown>;
      limit?: number;
      minScore?: number;
      vectorWeight?: number;
      textWeight?: number;
      includeGraph?: boolean;
    };

    if (!query?.trim()) {
      return sendBadRequest(res, "query is required");
    }

    if (includeGraph) {
      // NOTE: when includeGraph=true, search is handled by unifiedSemanticSearch which
      // returns vector-matched documents augmented with KG subgraph context. In this
      // mode sourceTypes and metadataFilters are not applied — they are only used by
      // the hybrid (BM25 + vector RRF) path below. If you need metadata filtering with
      // graph augmentation, use the /rag-context endpoint which supports both.
      const result = await unifiedSemanticSearch({ query, domains, limit, includeGraph: true, tenantId });
      return res.json({ ok: true, data: result });
    }

    const result = await hybridSearch({
      query,
      domains,
      sourceTypes,
      metadataFilters,
      limit,
      minScore,
      vectorWeight,
      textWeight,
      tenantId,
    });

    return res.json({ ok: true, data: result });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── RAG Context Builder ──────────────────────────────────────────────────────

router.post("/rag-context", validateBody(bodyShape({
      "domain": z.unknown().optional(),
      "includeGraph": z.unknown().optional(),
      "limit": z.unknown().optional(),
      "minScore": z.unknown().optional(),
      "query": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { query, domain, limit = 5, minScore = 0.05, includeGraph = false } = req.body as {
      query: string;
      domain?: string;
      limit?: number;
      minScore?: number;
      includeGraph?: boolean;
    };

    if (!query?.trim()) {
      return sendBadRequest(res, "query is required");
    }

    const result = await buildVectorRAGContext(query, { domain, limit, minScore, includeGraph, tenantId });
    return res.json({ ok: true, data: result });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Graph Entity Subgraph ────────────────────────────────────────────────────

router.get("/graph/:entityId", validateQuery(listQuerySchema), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { entityId } = req.params;
    const {
      maxHops = "2",
      maxNodes = "100",
      domains,
      relationshipTypes,
      minStrength,
    } = req.query as {
      maxHops?: string;
      maxNodes?: string;
      domains?: string;
      relationshipTypes?: string;
      minStrength?: string;
    };

    const subgraph = await traverseSubgraph(entityId!, {
      maxHops: parseIntParam(maxHops, 2, 1, 6),
      maxNodes: parseIntParam(maxNodes, 100, 1, 500),
      domains: domains ? domains.split(",") : undefined,
      relationshipTypes: relationshipTypes ? relationshipTypes.split(",") : undefined,
      minStrength: minStrength ? parseFloatParam(minStrength, 0, 0, 1) : undefined,
      tenantId,
    });

    return res.json({ ok: true, data: subgraph });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Path Finding ─────────────────────────────────────────────────────────────

router.get("/graph/:fromId/paths/:toId", validateQuery(listQuerySchema), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { fromId, toId } = req.params;
    const { maxHops = "4", maxPaths = "5" } = req.query as { maxHops?: string; maxPaths?: string };

    const paths = await findPaths(fromId!, toId!, {
      maxHops: parseIntParam(maxHops, 4, 1, 8),
      maxPaths: parseIntParam(maxPaths, 5, 1, 20),
      tenantId,
    });

    return res.json({ ok: true, data: { paths, count: paths.length } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Entity Operations ────────────────────────────────────────────────────────

router.post("/entities", requireRole("admin", "ops", "editor"), validateBody(bodyShape({
      "description": z.unknown().optional(),
      "domain": z.unknown().optional(),
      "entityType": z.unknown().optional(),
      "name": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const entity = req.body as {
      name: string;
      entityType: string;
      domain: string;
      subDomain?: string;
      description?: string;
      canonicalId?: string;
      sourceIds?: string[];
      properties?: Record<string, unknown>;
      confidence?: number;
    };

    if (!entity.name || !entity.entityType || !entity.domain) {
      return sendBadRequest(res, "name, entityType, and domain are required");
    }

    const id = await upsertEntity({ ...entity, tenantId });

    if (entity.description) {
      await scheduleEmbeddingTask({
        targetTable: "kg_entities",
        targetId: id,
        contentColumn: "description",
        targetColumn: "embedding",
        priority: 3,
      }).catch((err: unknown) => {
        logger.warn({ err }, "[knowledge-graph] embedding task scheduling failed");
      });
    }

    return res.json({ ok: true, data: { id } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Relationship Operations ──────────────────────────────────────────────────

router.post("/relationships", requireRole("admin", "ops", "editor"), validateBody(bodyShape({
      "fromDomain": z.unknown().optional(),
      "fromEntityId": z.unknown().optional(),
      "relationshipType": z.unknown().optional(),
      "toDomain": z.unknown().optional(),
      "toEntityId": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const rel = req.body as {
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
    };

    if (!rel.fromEntityId || !rel.toEntityId || !rel.relationshipType) {
      return sendBadRequest(res, "fromEntityId, toEntityId, and relationshipType are required");
    }
    if (!rel.fromDomain || !rel.toDomain) {
      return sendBadRequest(res, "fromDomain and toDomain are required");
    }

    // Validate both entities exist and enforce tenant boundary in one query.
    const { rows: entityRows } = await dbPool.query(
      `SELECT id, tenant_id FROM kg_entities WHERE id = ANY($1)`,
      [[rel.fromEntityId, rel.toEntityId]],
    );
    if (entityRows.length < 2) {
      const foundIds = new Set((entityRows as Array<{ id: string }>).map((r) => r.id));
      const missing = [rel.fromEntityId, rel.toEntityId].filter((id) => !foundIds.has(id));
      return sendError(res, `Entity not found: ${missing.join(", ")}`, 404);
    }
    if (tenantId) {
      // Reject cross-tenant writes: entity explicitly owned by a different tenant.
      const violations = entityRows.filter((r: Record<string, unknown>) => {
        const tid = r.tenant_id as string | null;
        return tid !== null && tid !== tenantId;
      });
      if (violations.length > 0) {
        return sendError(res, "One or more entities belong to a different tenant", 403);
      }
      // Reject global-global relationship writes from tenant-scoped users.
      // Neither entity is owned by the caller, so this could mutate shared graph
      // structure in ways that affect all tenants. Require admin/ops to do this.
      const ownedByCallerTenant = (entityRows as Array<{ tenant_id: string | null }>).filter(
        (r) => r.tenant_id === tenantId,
      );
      if (ownedByCallerTenant.length === 0) {
        const callerRoles: string[] = (req.user as { roles?: string[] } | undefined)?.roles ?? [];
        const isAdmin = callerRoles.some((role) => ["super_admin", "admin", "ops"].includes(role));
        if (!isAdmin) {
          return sendError(
            res,
            "Tenant users cannot create relationships between global (unowned) entities — admin access required",
            403,
          );
        }
      }
    }

    const id = await upsertRelationship(rel);
    return res.json({ ok: true, data: { id } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Community Detection ──────────────────────────────────────────────────────

router.get("/communities", validateQuery(listQuerySchema), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { domain, minSize = "2", maxCommunities = "20" } = req.query as {
      domain?: string;
      minSize?: string;
      maxCommunities?: string;
    };

    const communities = await detectCommunities({
      domain,
      minSize: parseIntParam(minSize, 2, 1, 50),
      maxCommunities: parseIntParam(maxCommunities, 20, 1, 100),
      tenantId,
    });

    return res.json({ ok: true, data: { communities, count: communities.length } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Centrality Scoring ───────────────────────────────────────────────────────

router.get("/centrality", validateQuery(listQuerySchema), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { domain, limit = "50" } = req.query as { domain?: string; limit?: string };
    const scores = await computeCentralityScores({ domain, limit: parseIntParam(limit, 50, 1, 200), tenantId });
    return res.json({ ok: true, data: { nodes: scores, count: scores.length } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Entity Similarity Search ─────────────────────────────────────────────────

router.post("/entities/search", validateBody(bodyShape({
      "domains": z.unknown().optional(),
      "entityTypes": z.unknown().optional(),
      "minScore": z.unknown().optional(),
      "query": z.unknown().optional(),
      "topK": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { query, entityTypes, domains, topK = 10, minScore = 0.5 } = req.body as {
      query: string;
      entityTypes?: string[];
      domains?: string[];
      topK?: number;
      minScore?: number;
    };

    if (!query?.trim()) {
      return sendBadRequest(res, "query is required");
    }

    const entities = await findSimilarEntities(query, { entityTypes, domains, topK, minScore, tenantId });
    return res.json({ ok: true, data: { entities, count: entities.length } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Cross-Domain Links ───────────────────────────────────────────────────────

router.post("/cross-domain", validateBody(bodyShape({
      "domain": z.unknown().optional(),
      "entityId": z.unknown().optional(),
      "entityName": z.unknown().optional(),
      "entityType": z.unknown().optional(),
      "targetDomains": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { entityId, entityName, domain, entityType, targetDomains } = req.body as {
      entityId: string;
      entityName: string;
      domain: string;
      entityType: string;
      targetDomains: string[];
    };

    if (!entityId || !entityName || !domain || !entityType || !targetDomains?.length) {
      return sendBadRequest(res, "entityId, entityName, domain, entityType, and targetDomains are required");
    }

    const candidates = await detectCrossDomainLinks(
      { id: entityId, name: entityName, domain, entityType },
      targetDomains,
      tenantId,
    );

    return res.json({ ok: true, data: { candidates, count: candidates.length } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Graph Statistics ─────────────────────────────────────────────────────────

router.get("/stats", validateQuery(listQuerySchema), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { domain } = req.query as { domain?: string };
    const stats = await getGraphStats(domain, tenantId);
    return res.json({ ok: true, data: stats });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Embedding Model Management ───────────────────────────────────────────────

router.get("/embedding-models", async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  try {
    const providers = listEmbeddingProviders();
    const currentModel = process.env["HF_EMBED_MODEL"] ?? "BAAI/bge-m3";
    return res.json({
      ok: true,
      data: {
        providers,
        currentModel,
        schemaDimension: SCHEMA_VECTOR_DIM,
        note: `All registered providers are listed with a schemaCompatible flag. Providers not matching ${SCHEMA_VECTOR_DIM}-dim will have their vectors normalised on write. Change VECTOR_DIM env and re-embed to switch the canonical schema dimension.`,
        count: providers.length,
      },
    });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

router.post("/embed/generate", requireRole("admin", "ops"), validateBody(bodyShape({
      "modelId": z.unknown().optional(),
      "text": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  try {
    const { text, modelId } = req.body as { text: string; modelId?: string };
    if (!text?.trim()) return sendBadRequest(res, "text is required");

    const embedding = await generateEmbedding(text, modelId);
    return res.json({ ok: true, data: { embedding, dimensions: embedding.length, modelId: modelId ?? process.env["HF_EMBED_MODEL"] ?? "BAAI/bge-m3" } });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// Embedding maintenance endpoints (/embed/*, /reembed) operate across all tenants.
// They are restricted to admin/ops, which are global (not tenant-scoped) roles in this
// deployment. If tenant-scoped admin roles are introduced, these endpoints must be
// further restricted or refactored to accept a tenantId parameter.
router.post("/embed/schedule", requireRole("admin", "ops"), validateBody(bodyShape({
      "contentColumn": z.unknown().optional(),
      "modelId": z.unknown().optional(),
      "priority": z.unknown().optional(),
      "targetColumn": z.unknown().optional(),
      "targetId": z.unknown().optional(),
      "targetTable": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { targetTable, targetId, contentColumn, targetColumn, modelId, priority } = req.body as {
      targetTable: string;
      targetId: string;
      contentColumn?: string;
      targetColumn?: string;
      modelId?: string;
      priority?: number;
    };

    if (!targetTable || !targetId) return sendBadRequest(res, "targetTable and targetId are required");
    const allowedTables = getAllowedEmbedTableNames();
    if (!allowedTables.includes(targetTable)) {
      return sendBadRequest(res, `targetTable "${targetTable}" is not in the embedding allowlist. Allowed: ${allowedTables.join(", ")}`);
    }

    await scheduleEmbeddingTask({ targetTable, targetId, contentColumn, targetColumn, modelId, priority });
    return res.json({ ok: true });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

router.post("/embed/process", requireRole("admin", "ops"), validateBody(bodyShape({
      "limit": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { limit = 20 } = req.body as { limit?: number };
    const result = await processEmbeddingTasks(limit);
    return res.json({ ok: true, data: result });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

router.post("/embed/batch", requireRole("admin", "ops"), validateBody(bodyShape({
      "batchSize": z.unknown().optional(),
      "contentColumn": z.unknown().optional(),
      "embeddingColumn": z.unknown().optional(),
      "idColumn": z.unknown().optional(),
      "modelId": z.unknown().optional(),
      "tableName": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { tableName, idColumn = "id", contentColumn = "content", embeddingColumn = "embedding", modelId, batchSize = 50 } = req.body as {
      tableName: string;
      idColumn?: string;
      contentColumn?: string;
      embeddingColumn?: string;
      modelId?: string;
      batchSize?: number;
    };

    if (!tableName) return sendBadRequest(res, "tableName is required");

    // rag_knowledge_documents does not have an embedding column; only tables
    // that have been confirmed to contain an embedding vector column are allowed.
    const ALLOWED_TABLES = [
      "rag_knowledge_chunks",
      "kg_entities",
    ];

    if (!ALLOWED_TABLES.includes(tableName)) {
      return sendBadRequest(res, `tableName must be one of: ${ALLOWED_TABLES.join(", ")}`);
    }

    const result = await batchEmbedTable(tableName, idColumn, contentColumn, embeddingColumn, modelId, batchSize);
    return res.json({ ok: true, data: result });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Model-Change Re-Embedding Orchestration ─────────────────────────────────

router.post("/reembed", requireRole("admin", "ops"), validateBody(bodyShape({
      "priority": z.unknown().optional(),
      "tables": z.unknown().optional(),
      "targetModelId": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { targetModelId, priority, tables } = req.body as {
      targetModelId?: string;
      priority?: number;
      tables?: Array<{ table: string; contentColumn: string; targetColumn?: string }>;
    };

    const result = await scheduleReembeddingOnModelChange({ targetModelId, priority, tables });
    return res.json({ ok: true, data: result });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

// ─── Natural-Language Graph Query ────────────────────────────────────────────
// Converts a free-text query into a graph result by:
//   1. Semantically locating anchor entities that best match the query
//   2. Expanding each anchor into a local subgraph (multi-hop traversal)
//   3. Deduplicating and returning the merged graph with per-anchor scores

router.post("/graph-query", validateBody(bodyShape({
      "domains": z.unknown().optional(),
      "limit": z.unknown().optional(),
      "maxHops": z.unknown().optional(),
      "minScore": z.unknown().optional(),
      "query": z.unknown().optional(),
    })), async (req, res) => {
  const scope = requireScope(req, res);
  if (!scope) return;
  const { tenantId } = scope;
  try {
    const { query, domains, maxHops = 1, limit = 5, minScore = 0.3 } = req.body as {
      query: string;
      domains?: string[];
      maxHops?: number;
      limit?: number;
      minScore?: number;
    };

    if (!query?.trim()) return sendBadRequest(res, "query is required");

    const anchors = await findSimilarEntities(query, { domains, topK: limit, minScore, tenantId });

    const subgraphs = await Promise.all(
      anchors.slice(0, 3).map((entity) =>
        traverseSubgraph(entity.id, { maxHops, domains, tenantId, maxNodes: 30 }),
      ),
    );

    const entityMap = new Map<string, unknown>();
    const relMap = new Map<string, unknown>();
    for (const sg of subgraphs) {
      for (const e of sg.entities) entityMap.set(e.id, e);
      for (const r of sg.relationships) relMap.set(r.id, r);
    }

    return res.json({
      ok: true,
      data: {
        query,
        anchors: anchors.map((e) => ({ id: e.id, name: e.name, domain: e.domain, score: e.score })),
        graph: {
          entities: Array.from(entityMap.values()),
          relationships: Array.from(relMap.values()),
          entityCount: entityMap.size,
          relationshipCount: relMap.size,
        },
      },
    });
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : String(err), 500);
  }
});

export default router;


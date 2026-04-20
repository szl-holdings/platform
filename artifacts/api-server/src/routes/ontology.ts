import { Router } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth";
import { sendError, sendBadRequest } from "../lib/api-response";
import { ontologyEngine } from "@szl-holdings/ai-engine";
import { graphRAGEngine } from "@szl-holdings/ai-engine";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router = Router();

router.get("/ontology/stats", authMiddleware(), async (_req, res) => {
  try {
    const stats = await ontologyEngine.getGraphStats();
    res.json({ success: true, stats });
  } catch (err) {
    sendError(res, "Failed to fetch ontology stats");
  }
});

router.get("/ontology/entity/:id", authMiddleware(), async (req, res) => {
  try {
    const entity = await ontologyEngine.getEntity(req.params.id as string);
    if (!entity) return sendError(res, "Entity not found", 404, "NOT_FOUND");
    res.json({ success: true, entity });
  } catch (err) {
    sendError(res, "Failed to fetch entity");
  }
});

router.get("/ontology/entity/:id/connections", authMiddleware(), async (req, res) => {
  try {
    const connections = await ontologyEngine.getEntityConnections(req.params.id as string);
    res.json({ success: true, connections });
  } catch (err) {
    sendError(res, "Failed to fetch entity connections");
  }
});

router.get("/ontology/entity/:id/traverse", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const maxHops = Math.min(parseInt(String(req.query.hops ?? "2")), 4);
    const result = await ontologyEngine.traverseGraph(req.params.id as string, maxHops);
    res.json({ success: true, result });
  } catch (err) {
    sendError(res, "Failed to traverse graph");
  }
});

router.get("/ontology/search", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query = String(req.query.q ?? "");
    if (!query) return sendBadRequest(res, "Query parameter 'q' is required");
    const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 50);
    const entities = await ontologyEngine.searchEntities(query, undefined, limit);
    res.json({ success: true, entities });
  } catch (err) {
    sendError(res, "Search failed");
  }
});

router.get("/ontology/domain/:domain", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);
    const entities = await ontologyEngine.getDomainEntities(req.params.domain as string, limit);
    res.json({ success: true, entities });
  } catch (err) {
    sendError(res, "Failed to fetch domain entities");
  }
});

router.post("/ontology/entity", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const { type, name, domain, metadata = {}, tags = [], riskScore, externalId } = req.body;
    if (!type || !name || !domain) return sendBadRequest(res, "type, name, and domain are required");
    const entity = await ontologyEngine.upsertEntity({ type, name, domain, metadata, tags, riskScore, externalId });
    res.json({ success: true, entity });
  } catch (err) {
    sendError(res, "Failed to upsert entity");
  }
});

router.post("/ontology/relationship", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const { fromEntityId, toEntityId, type, strength = "moderate", metadata = {} } = req.body;
    if (!fromEntityId || !toEntityId || !type) return sendBadRequest(res, "fromEntityId, toEntityId, and type are required");
    const rel = await ontologyEngine.createRelationship(fromEntityId, toEntityId, type, strength, metadata);
    res.json({ success: true, relationship: rel });
  } catch (err) {
    sendError(res, "Failed to create relationship");
  }
});

router.post("/ontology/graph-rag", authMiddleware(), validateBody(bodyShape({
      "domains": z.unknown().optional(),
      "maxEntitiesPerHop": z.unknown().optional(),
      "maxHops": z.unknown().optional(),
      "query": z.unknown().optional(),
      "topKChunksPerEntity": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { query, maxHops = 2, maxEntitiesPerHop = 5, topKChunksPerEntity = 3, domains } = req.body;
    if (!query) return sendBadRequest(res, "query is required");

    const result = await graphRAGEngine.query({
      query,
      maxHops: Math.min(maxHops, 4),
      maxEntitiesPerHop: Math.min(maxEntitiesPerHop, 10),
      topKChunksPerEntity: Math.min(topKChunksPerEntity, 10),
      domains,
    });

    res.json({ success: true, result });
  } catch (err) {
    sendError(res, "GraphRAG query failed");
  }
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import {
  getKnowledgeBaseStats,
  hybridSearch,
  deleteChunksByObjectId,
  ingestDocument,
  ingestAiDecision,
  ingestIncidentReport,
  ingestAgentKnowledge,
  runFullReindex,
  generateEmbedding,
  type SensitivityLevel,
  type RagSourceType,
} from "@szl-holdings/ai-engine";
import { logger } from "../lib/logger";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";

const ragKnowledgeRouter: IRouter = Router();

const SENSITIVITY_LEVELS: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];

function getAllowedSensitivity(req: Request): SensitivityLevel {
  const userRoles: string[] = (req as any).user?.roles ?? [];
  const isAdmin = userRoles.includes("admin");
  const maxAllowed: SensitivityLevel = isAdmin ? "restricted" : "internal";
  const requested = req.query.sensitivity as SensitivityLevel | undefined;
  if (!requested) return maxAllowed;
  const reqIdx = SENSITIVITY_LEVELS.indexOf(requested);
  const maxIdx = SENSITIVITY_LEVELS.indexOf(maxAllowed);
  return reqIdx >= 0 && reqIdx <= maxIdx ? requested : maxAllowed;
}

ragKnowledgeRouter.get("/rag/status", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const stats = await getKnowledgeBaseStats();
    sendSuccess(res, {
      status: "operational",
      ...stats,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get RAG knowledge base status");
  }
});

ragKnowledgeRouter.get("/rag/search", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { q, topK = "8", domains, sourceTypes } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return sendBadRequest(res, "Query parameter 'q' is required (min 2 characters)");
    }

    const k = Math.min(parseInt(String(topK), 10) || 8, 50);
    const domainList = domains ? String(domains).split(",").map(d => d.trim()).filter(Boolean) : undefined;
    const sourceTypeList = sourceTypes ? String(sourceTypes).split(",").map(s => s.trim()).filter(Boolean) as RagSourceType[] : undefined;
    const maxSensitivity = getAllowedSensitivity(req);

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(q);
    } catch {
      // fall back to keyword only
    }

    const { results, totalIndexed, latencyMs } = await hybridSearch({
      query: q,
      queryEmbedding,
      topK: k,
      domains: domainList,
      maxSensitivityLevel: maxSensitivity,
      sourceTypes: sourceTypeList,
    });

    sendSuccess(res, {
      query: q,
      results: results.map(r => ({
        id: r.id,
        content: r.content.slice(0, 500),
        source: r.source,
        sourceType: r.sourceType,
        domain: r.domain,
        sensitivityLevel: r.sensitivityLevel,
        score: r.score,
        matchType: r.matchType,
        metadata: r.metadata,
      })),
      totalResults: results.length,
      totalIndexed,
      latencyMs,
      method: queryEmbedding ? "hybrid" : "keyword",
    });
  } catch (err) {
    handleRouteError(res, err, "RAG search failed");
  }
});

ragKnowledgeRouter.post("/rag/ingest/document", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, title, content, domain, sensitivityLevel, source, metadata } = req.body;

    if (!title || !content) {
      return sendBadRequest(res, "Fields 'title' and 'content' are required");
    }
    if (!content || content.trim().length < 10) {
      return sendBadRequest(res, "Content must be at least 10 characters");
    }

    const docId = id ?? `doc-${Date.now()}`;
    const result = await ingestDocument({
      id: docId,
      title,
      content,
      domain: domain ?? "general",
      sensitivityLevel: sensitivityLevel ?? "internal",
      source: source ?? title,
      timestamp: new Date().toISOString(),
      metadata: metadata ?? {},
    });

    logger.info({ docId, chunksCreated: result.chunksCreated }, "Document ingested into RAG knowledge base");
    sendCreated(res, { docId, chunksCreated: result.chunksCreated, title });
  } catch (err) {
    handleRouteError(res, err, "Document ingestion failed");
  }
});

ragKnowledgeRouter.post("/rag/ingest/decision", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { decisionId, recommendedAction, rationaleSummary, riskLevel, confidence, rawInput, rawOutput, createdAt } = req.body;

    if (!decisionId || !recommendedAction) {
      return sendBadRequest(res, "Fields 'decisionId' and 'recommendedAction' are required");
    }

    await ingestAiDecision({
      decisionId,
      recommendedAction,
      rationaleSummary: rationaleSummary ?? "",
      riskLevel: riskLevel ?? "medium",
      confidence: confidence ?? 0.5,
      rawInput: rawInput ?? null,
      rawOutput: rawOutput ?? null,
      createdAt: createdAt ?? new Date().toISOString(),
    });

    sendCreated(res, { decisionId, ingested: true });
  } catch (err) {
    handleRouteError(res, err, "Decision ingestion failed");
  }
});

ragKnowledgeRouter.post("/rag/ingest/incident", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, title, description, severity, status, attackTechnique, notes, detectedAt } = req.body;

    if (!id || !title) {
      return sendBadRequest(res, "Fields 'id' and 'title' are required");
    }

    await ingestIncidentReport({
      id,
      title,
      description: description ?? null,
      severity: severity ?? "medium",
      status: status ?? "open",
      attackTechnique: attackTechnique ?? null,
      notes: notes ?? null,
      detectedAt: detectedAt ?? new Date().toISOString(),
    });

    sendCreated(res, { incidentId: id, ingested: true });
  } catch (err) {
    handleRouteError(res, err, "Incident ingestion failed");
  }
});

ragKnowledgeRouter.post("/rag/ingest/knowledge", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entryId, type, domain, sourceAgent, title, summary, confidence, tags, timestamp } = req.body;

    if (!entryId || !title || !summary) {
      return sendBadRequest(res, "Fields 'entryId', 'title', and 'summary' are required");
    }

    await ingestAgentKnowledge({
      entryId,
      type: type ?? "knowledge",
      domain: domain ?? "general",
      sourceAgent: sourceAgent ?? "system",
      title,
      summary,
      confidence: confidence ?? 0.8,
      tags: tags ?? [],
      timestamp: timestamp ?? Date.now(),
    });

    sendCreated(res, { entryId, ingested: true });
  } catch (err) {
    handleRouteError(res, err, "Knowledge entry ingestion failed");
  }
});

ragKnowledgeRouter.delete("/rag/chunks/:objectId", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const objectId = req.params.objectId as string;
    const { sourceType } = req.query;

    const deleted = await deleteChunksByObjectId(objectId, sourceType as RagSourceType | undefined);
    sendSuccess(res, { objectId, deleted });
  } catch (err) {
    handleRouteError(res, err, "Chunk deletion failed");
  }
});

ragKnowledgeRouter.post("/rag/reindex", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    logger.info("Full RAG reindex triggered");

    setImmediate(async () => {
      try {
        const result = await runFullReindex();
        logger.info(result, "RAG full reindex completed");
      } catch (err) {
        logger.error({ err }, "RAG reindex failed");
      }
    });

    sendSuccess(res, { message: "Reindex job started in background", status: "running" });
  } catch (err) {
    handleRouteError(res, err, "Reindex trigger failed");
  }
});

export default ragKnowledgeRouter;

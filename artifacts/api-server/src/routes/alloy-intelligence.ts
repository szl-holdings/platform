import { Router, type Request, type Response } from "express";
import { platformAuth } from "../middlewares/platform-auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

import { extractEntitiesAndTriples, multiHopGraphQuery, getKnowledgeGraphStats } from "../lib/alloy-knowledge-graph";
import { compactContextWindow, writeContextNote, recallContextNotes, getContextStats } from "../lib/alloy-context-engineering";
import { generatePtcScript, executePtcPlan, listPtcScripts, getPtcStats } from "../lib/alloy-ptc";
import { hybridRagSearch, ingestDocumentWithContextualEmbeddings, getRagStats } from "../lib/alloy-contextual-rag";
import { executeBatchTools, getBatchStats } from "../lib/alloy-parallel-tools";
import { runSignalEnrichment, listEnrichmentReports, getEnrichmentStats } from "../lib/alloy-signal-enrichment";
import { enforceStructuredOutput, registerSchema, listAllSchemas, getOutputQualityStats } from "../lib/alloy-structured-outputs";
import { getAgentScorecard, recordEvalRun, getEvalDashboardData, calculatePrecisionRecall, runLlmJudgeEval, getAgentFitnessScore } from "../lib/alloy-eval-extended";

const router = Router();

// ─── Knowledge Graph ──────────────────────────────────────────────────────────

router.get("/intelligence/knowledge-graph/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const orgId = req.platformUser!.orgId ?? 1;
    const stats = await getKnowledgeGraphStats(orgId);
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get knowledge graph stats");
  }
});

router.post("/intelligence/knowledge-graph/extract", platformAuth(), async (req: Request, res: Response) => {
  try {
    const orgId = req.platformUser!.orgId ?? 1;
    const { content, domain = "general", documentId, sourceSystem } = req.body;
    if (!content) return sendBadRequest(res, "content is required");
    const result = await extractEntitiesAndTriples({ orgId, content, domain, documentId, sourceSystem });
    return sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to extract entities");
  }
});

router.post("/intelligence/knowledge-graph/query", platformAuth(), async (req: Request, res: Response) => {
  try {
    const orgId = req.platformUser!.orgId ?? 1;
    const { query, startEntityName, maxHops = 3, crossDomainOnly = false } = req.body;
    if (!query) return sendBadRequest(res, "query is required");
    const result = await multiHopGraphQuery({ orgId, naturalLanguageQuery: query, startEntityName, maxHops, crossDomainOnly });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to query knowledge graph");
  }
});

// ─── Context Engineering ─────────────────────────────────────────────────────

router.post("/intelligence/context/compact", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { threadId, agentId, messages, config } = req.body;
    if (!threadId || !messages) return sendBadRequest(res, "threadId and messages are required");
    const result = await compactContextWindow({ threadId, agentId, messages, config });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to compact context");
  }
});

router.post("/intelligence/context/notes", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, threadId, category = "observation", content, entities, domain, importance, expiresInHours } = req.body;
    if (!agentId || !content) return sendBadRequest(res, "agentId and content are required");
    const note = await writeContextNote({ agentId, threadId, category, content, entities, domain, importance, expiresInHours });
    return sendCreated(res, note);
  } catch (err) {
    handleRouteError(res, err, "Failed to write context note");
  }
});

const VALID_NOTE_CATEGORIES = ["observation", "decision", "entity", "task", "insight"] as const;
type NoteCategory = typeof VALID_NOTE_CATEGORIES[number];
function parseNoteCategory(value: unknown): NoteCategory | undefined {
  const str = typeof value === "string" ? value : undefined;
  return str && (VALID_NOTE_CATEGORIES as readonly string[]).includes(str) ? str as NoteCategory : undefined;
}

router.get("/intelligence/context/notes", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, threadId, category, domain, limit } = req.query;
    if (!agentId) return sendBadRequest(res, "agentId is required");
    const notes = await recallContextNotes({
      agentId: String(agentId),
      threadId: threadId ? String(threadId) : undefined,
      category: parseNoteCategory(category),
      domain: domain ? String(domain) : undefined,
      limit: limit ? parseInt(String(limit)) : 20,
    });
    return sendSuccess(res, notes);
  } catch (err) {
    handleRouteError(res, err, "Failed to recall context notes");
  }
});

router.get("/intelligence/context/stats/:agentId", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getContextStats(req.params.agentId);
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get context stats");
  }
});

// ─── Prompt-Task Chaining ─────────────────────────────────────────────────────

router.post("/intelligence/ptc/generate", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, taskDescription, availableTools = [], inputs = {} } = req.body;
    if (!agentId || !taskDescription) return sendBadRequest(res, "agentId and taskDescription are required");
    const result = await generatePtcScript({ agentId, taskDescription, availableTools, inputs });
    return sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate PTC script");
  }
});

router.post("/intelligence/ptc/execute", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { scriptId, agentId, plan, inputs = {} } = req.body;
    if (!scriptId || !agentId || !plan) return sendBadRequest(res, "scriptId, agentId, and plan are required");
    const result = await executePtcPlan({ scriptId, agentId, plan, inputs });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to execute PTC plan");
  }
});

router.get("/intelligence/ptc/scripts", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, status, limit } = req.query;
    const scripts = await listPtcScripts({
      agentId: agentId ? String(agentId) : undefined,
      status: status ? String(status) : undefined,
      limit: limit ? parseInt(String(limit)) : 20,
    });
    return sendSuccess(res, scripts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list PTC scripts");
  }
});

router.get("/intelligence/ptc/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getPtcStats();
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get PTC stats");
  }
});

// ─── Contextual RAG ───────────────────────────────────────────────────────────

router.post("/intelligence/rag/ingest", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { documentId, content, domain = "general", filename, chunkSize } = req.body;
    if (!documentId || !content) return sendBadRequest(res, "documentId and content are required");
    const result = await ingestDocumentWithContextualEmbeddings({ documentId, content, domain, filename, chunkSize });
    return sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest document for RAG");
  }
});

router.post("/intelligence/rag/search", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { query, domain, topK = 10, vectorWeight, bm25Weight, rerank = true, minScore } = req.body;
    if (!query) return sendBadRequest(res, "query is required");
    const results = await hybridRagSearch({ query, domain, topK, vectorWeight, bm25Weight, rerank, minScore });
    return sendSuccess(res, results);
  } catch (err) {
    handleRouteError(res, err, "Failed to search RAG");
  }
});

router.get("/intelligence/rag/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getRagStats();
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get RAG stats");
  }
});

// ─── Batch / Parallel Tools ──────────────────────────────────────────────────

router.post("/intelligence/batch-tools", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { calls, agentId, maxConcurrency } = req.body;
    if (!calls || !Array.isArray(calls)) return sendBadRequest(res, "calls array is required");
    const result = await executeBatchTools({ calls, agentId, maxConcurrency });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to execute batch tools");
  }
});

router.get("/intelligence/batch-tools/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getBatchStats();
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get batch tool stats");
  }
});

// ─── Signal Enrichment ────────────────────────────────────────────────────────

router.post("/intelligence/enrichment/run", platformAuth(), async (req: Request, res: Response) => {
  try {
    const orgId = req.platformUser!.orgId ?? 1;
    const { signal, maxSteps } = req.body;
    if (!signal) return sendBadRequest(res, "signal is required");
    const report = await runSignalEnrichment({ orgId, signal, maxSteps });
    return sendCreated(res, report);
  } catch (err) {
    handleRouteError(res, err, "Failed to run signal enrichment");
  }
});

router.get("/intelligence/enrichment/reports", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { domain, riskLevel, limit } = req.query;
    const reports = await listEnrichmentReports({
      domain: domain ? String(domain) : undefined,
      riskLevel: riskLevel ? String(riskLevel) : undefined,
      limit: limit ? parseInt(String(limit)) : 20,
    });
    return sendSuccess(res, reports);
  } catch (err) {
    handleRouteError(res, err, "Failed to list enrichment reports");
  }
});

router.get("/intelligence/enrichment/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getEnrichmentStats();
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get enrichment stats");
  }
});

// ─── Structured Outputs ───────────────────────────────────────────────────────

router.post("/intelligence/schemas", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { schemaId, name, version = "1.0.0", description, domain = "alloy", agentId, jsonSchema, exampleOutput } = req.body;
    if (!schemaId || !name || !description || !jsonSchema) return sendBadRequest(res, "schemaId, name, description, jsonSchema are required");
    const schema = await registerSchema({ schemaId, name, version, description, domain, agentId, jsonSchema, exampleOutput });
    return sendCreated(res, schema);
  } catch (err) {
    handleRouteError(res, err, "Failed to register schema");
  }
});

router.get("/intelligence/schemas", platformAuth(), async (req: Request, res: Response) => {
  try {
    const schemas = await listAllSchemas();
    return sendSuccess(res, schemas);
  } catch (err) {
    handleRouteError(res, err, "Failed to list schemas");
  }
});

router.post("/intelligence/structured-output", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, schemaId, systemPrompt, userPrompt, maxRetries } = req.body;
    if (!schemaId || !systemPrompt || !userPrompt) return sendBadRequest(res, "schemaId, systemPrompt, userPrompt are required");
    const result = await enforceStructuredOutput({ agentId, schemaId, systemPrompt, userPrompt, maxRetries });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to enforce structured output");
  }
});

router.get("/intelligence/structured-output/stats", platformAuth(), async (req: Request, res: Response) => {
  try {
    const stats = await getOutputQualityStats();
    return sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to get output quality stats");
  }
});

// ─── Eval Pipeline ────────────────────────────────────────────────────────────

router.get("/intelligence/eval/dashboard", platformAuth(), async (req: Request, res: Response) => {
  try {
    const data = await getEvalDashboardData();
    return sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, "Failed to get eval dashboard");
  }
});

router.get("/intelligence/eval/scorecard/:agentId", platformAuth(), async (req: Request, res: Response) => {
  try {
    const scorecard = await getAgentScorecard(req.params.agentId);
    return sendSuccess(res, scorecard);
  } catch (err) {
    handleRouteError(res, err, "Failed to get agent scorecard");
  }
});

router.post("/intelligence/eval/record", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, suiteId, runType = "standard", passRate, avgScore, totalTests, precisionScore, recallScore, f1Score, redTeamScore } = req.body;
    if (!agentId || passRate === undefined) return sendBadRequest(res, "agentId and passRate are required");
    await recordEvalRun({ agentId, suiteId, runType, passRate, avgScore: avgScore ?? passRate, totalTests: totalTests ?? 1, precisionScore, recallScore, f1Score, redTeamScore });
    return sendSuccess(res, { recorded: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to record eval run");
  }
});

router.post("/intelligence/eval/precision-recall", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { predicted, actual, threshold = 0.5 } = req.body;
    if (!predicted || !actual) return sendBadRequest(res, "predicted and actual arrays are required");
    const metrics = calculatePrecisionRecall(predicted, actual, threshold);
    return sendSuccess(res, metrics);
  } catch (err) {
    handleRouteError(res, err, "Failed to calculate precision/recall");
  }
});

router.post("/intelligence/eval/judge", platformAuth(), async (req: Request, res: Response) => {
  try {
    const { agentId, question, predicted, reference, criteria } = req.body;
    if (!agentId || !question || !predicted || !reference) {
      return sendBadRequest(res, "agentId, question, predicted, reference are required");
    }
    const result = await runLlmJudgeEval({ agentId, question, predicted, reference, criteria });
    return sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to run LLM judge eval");
  }
});

router.get("/intelligence/eval/fitness/:agentId", platformAuth(), async (req: Request, res: Response) => {
  try {
    const fitness = await getAgentFitnessScore(req.params.agentId);
    if (!fitness) return sendSuccess(res, { agentId: req.params.agentId, fitnessScore: null, message: "No eval data yet" });
    return sendSuccess(res, fitness);
  } catch (err) {
    handleRouteError(res, err, "Failed to get agent fitness score");
  }
});

export default router;

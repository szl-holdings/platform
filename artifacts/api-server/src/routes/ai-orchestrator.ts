import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  runAgent,
  listAgents,
  orchestrateWorkflow,
  registerCrossplatformTools,
} from "../lib/agent-orchestrator.js";
import {
  ingestDocument,
  searchKnowledge,
  ragQuery,
  getCollectionStats,
} from "../lib/rag-pipeline.js";
import { pool } from "@szl-holdings/db";
import { logger } from "../lib/logger.js";

const aiRouter: IRouter = Router();

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

aiRouter.use(aiRateLimit);

let toolsInitialized = false;
function ensureTools() {
  if (!toolsInitialized) {
    registerCrossplatformTools();
    toolsInitialized = true;
  }
}

aiRouter.get("/agents", async (_req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    res.json({
      agents: agents.map(a => ({
        agentId: a.agentId,
        name: a.name,
        domain: a.domain,
        description: a.description,
        model: a.model,
        tools: a.tools,
        enabled: a.enabled,
      })),
      count: agents.length,
    });
  } catch (err) {
    logger.error({ err }, "Failed to list agents");
    res.status(500).json({ error: "Failed to list agents" });
  }
});

aiRouter.get("/agents/:agentId", async (req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    const agent = agents.find(a => a.agentId === req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: "Failed to get agent" });
  }
});

aiRouter.post("/chat", async (req: Request, res: Response) => {
  ensureTools();
  const { message, agentId, conversationId, userId, context } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const targetAgent = agentId || "szl-orchestrator";

  try {
    const result = await runAgent(targetAgent, message, {
      conversationId,
      userId,
      context,
    });

    res.json({
      response: result.response,
      runId: result.runId,
      agentId: result.agentId,
      model: result.model,
      provider: result.provider,
      toolsUsed: result.toolsUsed,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      delegations: result.delegations.map(d => ({
        agentId: d.agentId,
        task: d.task,
        response: d.response.slice(0, 500),
        latencyMs: d.latencyMs,
      })),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Chat failed";
    logger.error({ err, agentId: targetAgent }, "Agent chat failed");
    res.status(500).json({ error: errorMsg });
  }
});

aiRouter.post("/agents/:agentId/run", async (req: Request, res: Response) => {
  ensureTools();
  const { task, userId, context } = req.body;

  if (!task || typeof task !== "string") {
    res.status(400).json({ error: "task is required" });
    return;
  }

  try {
    const result = await runAgent(req.params.agentId, task, {
      userId,
      context,
    });

    res.json({
      runId: result.runId,
      agentId: result.agentId,
      response: result.response,
      toolsUsed: result.toolsUsed,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      model: result.model,
      provider: result.provider,
      delegations: result.delegations,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Agent run failed";
    res.status(500).json({ error: errorMsg });
  }
});

aiRouter.post("/orchestrate", async (req: Request, res: Response) => {
  ensureTools();
  const { steps, userId, context } = req.body;

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    res.status(400).json({ error: "steps array is required" });
    return;
  }

  try {
    const result = await orchestrateWorkflow(steps, { userId, context });

    res.json({
      workflowId: result.workflowId,
      totalLatencyMs: result.totalLatencyMs,
      steps: result.results.map(r => ({
        agentId: r.agentId,
        response: r.response,
        toolsUsed: r.toolsUsed,
        tokensUsed: r.tokensUsed,
        latencyMs: r.latencyMs,
      })),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Orchestration failed";
    res.status(500).json({ error: errorMsg });
  }
});

aiRouter.post("/knowledge/ingest", async (req: Request, res: Response) => {
  const { documentId, content, collection, metadata } = req.body;

  if (!documentId || !content) {
    res.status(400).json({ error: "documentId and content are required" });
    return;
  }

  try {
    const result = await ingestDocument(documentId, content, collection, metadata);
    res.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Ingestion failed";
    res.status(500).json({ error: errorMsg });
  }
});

aiRouter.post("/knowledge/search", async (req: Request, res: Response) => {
  const { query, collection, limit, minSimilarity } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "query is required" });
    return;
  }

  try {
    const results = await searchKnowledge(query, { collection, limit, minSimilarity });
    res.json({ results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

aiRouter.post("/knowledge/ask", async (req: Request, res: Response) => {
  const { question, collection, agentId } = req.body;

  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const result = await ragQuery(question, { collection, agentId });
    res.json({
      answer: result.answer,
      sources: result.sources,
      tokensUsed: result.tokensUsed,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "RAG query failed";
    res.status(500).json({ error: errorMsg });
  }
});

aiRouter.get("/knowledge/collections", async (_req: Request, res: Response) => {
  try {
    const stats = await getCollectionStats();
    res.json({ collections: stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to get collection stats" });
  }
});

aiRouter.get("/runs", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const agentId = req.query.agentId as string;

  try {
    let sql = `SELECT run_id, agent_id, domain, status, started_at, completed_at, duration_ms, summary
               FROM agent_runs ORDER BY created_at DESC LIMIT $1`;
    let params: unknown[] = [limit];

    if (agentId) {
      sql = `SELECT run_id, agent_id, domain, status, started_at, completed_at, duration_ms, summary
             FROM agent_runs WHERE agent_id = $2 ORDER BY created_at DESC LIMIT $1`;
      params = [limit, agentId];
    }

    const result = await pool.query(sql, params);
    res.json({ runs: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to get runs" });
  }
});

aiRouter.get("/conversations", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  try {
    const result = await pool.query(
      `SELECT conversation_id, agent_id, domain, title, created_at, updated_at
       FROM ai_conversations ORDER BY updated_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ conversations: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

aiRouter.get("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT role, content, model, provider, tokens_used, latency_ms, created_at
       FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.conversationId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

aiRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [agents, runs, conversations, knowledge, workflows] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM ai_agent_configs WHERE enabled = TRUE"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'completed') as completed, COUNT(*) FILTER (WHERE status = 'failed') as failed FROM agent_runs"),
      pool.query("SELECT COUNT(*) as count FROM ai_conversations"),
      pool.query("SELECT COUNT(*) as chunks, COUNT(DISTINCT document_id) as documents FROM ai_embeddings"),
      pool.query("SELECT COUNT(*) as count FROM ai_workflows"),
    ]);

    res.json({
      agents: parseInt(agents.rows[0].count),
      runs: {
        total: parseInt(runs.rows[0].total),
        completed: parseInt(runs.rows[0].completed),
        failed: parseInt(runs.rows[0].failed),
      },
      conversations: parseInt(conversations.rows[0].count),
      knowledge: {
        documents: parseInt(knowledge.rows[0].documents),
        chunks: parseInt(knowledge.rows[0].chunks),
      },
      workflows: parseInt(workflows.rows[0].count),
      capabilities: {
        llmProviders: ["OpenAI GPT-5.2", "Anthropic Claude", "Google Gemini", "Mixtral"],
        vectorSearch: "pgvector enabled",
        ragPipeline: "active",
        multiAgentOrchestration: true,
        crossPlatformTools: true,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export { aiRouter };

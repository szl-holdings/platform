import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  runAgent, listAgents, getAgent, listTools,
  getShortTermMemory, getThreads, semanticRecall, storeKnowledgeEntity, getKnowledgeGraph,
  getAgentMetrics, getAllAgentMetrics, getTraces,
  listAgentCards, getAgentCard, createTask, getTask, listTasks,
  createWorkflow, executeWorkflow, getWorkflow, listWorkflows, pauseWorkflow, cancelWorkflow,
  runEvalSuite, runRedTeam, detectHallucinations, getRedTeamCatalog, getRedTeamCategories,
  executeCompoundPipeline, buildAnalysisPipeline,
} from "../lib/mastra/index";
import { pool } from "@szl-holdings/db";
import { logger } from "../lib/logger";

const mastraRouter: IRouter = Router();

const agentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

mastraRouter.use(agentRateLimit);

mastraRouter.get("/agents", async (_req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    const tools = listTools();
    res.json({
      agents: agents.map(a => ({
        agentId: a.agentId, name: a.name, domain: a.domain,
        description: a.description, model: a.model,
        tools: tools.map(t => t.name),
        memory: a.memory, routing: a.routing,
        guardrails: a.guardrails?.map(g => ({ name: g.name, type: g.type })),
      })),
      totalAgents: agents.length,
      totalTools: tools.length,
      framework: "mastra",
      version: "1.0.0",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/agents/:agentId", async (req: Request, res: Response) => {
  try {
    const agent = await getAgent(req.params.agentId as string);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    const tools = listTools();
    res.json({
      ...agent,
      tools: tools.map(t => ({ name: t.name, description: t.description })),
      guardrails: agent.guardrails?.map(g => ({ name: g.name, type: g.type })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const { agentId, message, threadId, userId, context, maxToolRounds } = req.body;
    if (!agentId || !message) return res.status(400).json({ error: "agentId and message required" });
    const result = await runAgent(agentId, message, { threadId, userId, context, maxToolRounds });
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "Mastra chat error");
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/agents/:agentId/run", async (req: Request, res: Response) => {
  try {
    const { message, threadId, userId, context } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });
    const result = await runAgent(req.params.agentId as string, message, { threadId, userId, context });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/tools", async (_req: Request, res: Response) => {
  const tools = listTools();
  res.json({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      permissions: t.permissions,
      rateLimit: t.rateLimit,
    })),
    totalTools: tools.length,
  });
});

mastraRouter.get("/memory/threads", async (req: Request, res: Response) => {
  try {
    const agentId = req.query.agentId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const threads = await getThreads(agentId, userId);
    res.json({ threads, total: threads.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/memory/threads/:threadId", async (req: Request, res: Response) => {
  try {
    const messages = await getShortTermMemory(req.params.threadId as string, 50);
    res.json({ threadId: req.params.threadId as string, messages, total: messages.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/memory/recall", async (req: Request, res: Response) => {
  try {
    const { query, agentId, topK } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    const results = await semanticRecall(query, { agentId, topK });
    res.json({ results, total: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/knowledge/entity", async (req: Request, res: Response) => {
  try {
    const { entityType, name, description, properties, relations, sourceAgent } = req.body;
    if (!entityType || !name) return res.status(400).json({ error: "entityType and name required" });
    const entityId = await storeKnowledgeEntity(
      { entityType, name, description, properties, relations },
      sourceAgent || "api"
    );
    res.json({ entityId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/knowledge/graph/:entityId", async (req: Request, res: Response) => {
  try {
    const maxDepth = parseInt(req.query.maxDepth as string) || 2;
    const graph = await getKnowledgeGraph(req.params.entityId as string, maxDepth);
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/knowledge/entities", async (req: Request, res: Response) => {
  try {
    const entityType = req.query.type as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const conditions = ["1=1"];
    const params: any[] = [];
    let idx = 1;
    if (entityType) { conditions.push(`entity_type = $${idx}`); params.push(entityType); idx++; }
    params.push(limit);
    const result = await pool.query(
      `SELECT * FROM agent_knowledge_entities WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx}`,
      params
    );
    res.json({ entities: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/agentops/metrics", async (req: Request, res: Response) => {
  try {
    const windowHours = parseInt(req.query.windowHours as string) || 24;
    const metrics = await getAllAgentMetrics(windowHours);
    const overall = {
      totalAgents: metrics.length,
      totalRuns: metrics.reduce((s, m) => s + m.totalRuns, 0),
      avgLatencyMs: Math.round(metrics.reduce((s, m) => s + m.avgLatencyMs, 0) / Math.max(metrics.length, 1)),
      avgSuccessRate: metrics.reduce((s, m) => s + m.successRate, 0) / Math.max(metrics.length, 1),
      avgQualityScore: metrics.reduce((s, m) => s + m.avgQualityScore, 0) / Math.max(metrics.length, 1),
      healthyAgents: metrics.filter(m => m.sloStatus === "healthy").length,
      degradedAgents: metrics.filter(m => m.sloStatus === "degraded").length,
      breachedAgents: metrics.filter(m => m.sloStatus === "breached").length,
    };
    res.json({ overall, agents: metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/agentops/metrics/:agentId", async (req: Request, res: Response) => {
  try {
    const windowHours = parseInt(req.query.windowHours as string) || 24;
    const metrics = await getAgentMetrics(req.params.agentId as string, windowHours);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/agentops/traces", async (req: Request, res: Response) => {
  try {
    const traces = await getTraces({
      runId: req.query.runId as string,
      agentId: req.query.agentId as string,
      spanType: req.query.spanType as string,
      status: req.query.status as string,
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.json({ traces, total: traces.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/a2a/agents", async (_req: Request, res: Response) => {
  try {
    const cards = await listAgentCards();
    res.json({
      agents: cards,
      total: cards.length,
      protocol: "A2A",
      version: "0.3.0",
      spec: "https://github.com/a2aproject/a2a-spec",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/a2a/agents/:agentId", async (req: Request, res: Response) => {
  try {
    const card = await getAgentCard(req.params.agentId as string);
    if (!card) return res.status(404).json({ error: "Agent card not found" });
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/a2a/agents/:agentId/.well-known/agent.json", async (req: Request, res: Response) => {
  try {
    const card = await getAgentCard(req.params.agentId as string);
    if (!card) return res.status(404).json({ error: "Agent card not found" });
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/a2a/tasks", async (req: Request, res: Response) => {
  try {
    const { clientAgentId, remoteAgentId, input, contextId } = req.body;
    if (!clientAgentId || !remoteAgentId || !input) {
      return res.status(400).json({ error: "clientAgentId, remoteAgentId, and input required" });
    }
    const task = await createTask(clientAgentId, remoteAgentId, input, contextId);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/a2a/tasks/:taskId", async (req: Request, res: Response) => {
  try {
    const task = await getTask(req.params.taskId as string);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/a2a/tasks", async (req: Request, res: Response) => {
  try {
    const tasks = await listTasks({
      agentId: req.query.agentId as string,
      status: req.query.status as string,
      contextId: req.query.contextId as string,
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.json({ tasks, total: tasks.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, steps, edges, context, startedBy } = req.body;
    if (!name || !steps) return res.status(400).json({ error: "name and steps required" });
    const workflowId = await createWorkflow({ workflowId: "", name, steps, edges: edges || [], context }, startedBy);
    res.status(201).json({ workflowId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/workflows", async (req: Request, res: Response) => {
  try {
    const workflows = await listWorkflows({
      status: req.query.status as string,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ workflows, total: workflows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/workflows/:workflowId", async (req: Request, res: Response) => {
  try {
    const workflow = await getWorkflow(req.params.workflowId as string);
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    res.json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/workflows/:workflowId/pause", async (req: Request, res: Response) => {
  try {
    await pauseWorkflow(req.params.workflowId as string);
    res.json({ status: "paused" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/workflows/:workflowId/cancel", async (req: Request, res: Response) => {
  try {
    await cancelWorkflow(req.params.workflowId as string);
    res.json({ status: "cancelled" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/eval/red-team/catalog", async (_req: Request, res: Response) => {
  const catalog = getRedTeamCatalog();
  const categories = getRedTeamCategories();
  res.json({
    catalog: catalog.map(a => ({
      attackId: a.attackId,
      category: a.category,
      name: a.name,
      severity: a.severity,
      expectedBehavior: a.expectedBehavior,
    })),
    totalAttacks: catalog.length,
    categories,
    totalCategories: categories.length,
    framework: "gray-swan-pattern",
  });
});

mastraRouter.post("/eval/red-team/run", async (req: Request, res: Response) => {
  try {
    const { agentId, categories } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });
    const agentRunner = async (id: string, message: string) => {
      const start = Date.now();
      const result = await runAgent(id, message, {});
      return { response: result.response, latencyMs: Date.now() - start };
    };
    const result = await runRedTeam(agentId, agentRunner, categories);
    res.json({
      ...result,
      framework: "gray-swan-pattern",
      scoreLabel: result.score >= 0.95 ? "excellent" : result.score >= 0.8 ? "good" : result.score >= 0.6 ? "needs-improvement" : "vulnerable",
    });
  } catch (err: any) {
    logger.error({ err }, "Red team run error");
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/eval/suite/run", async (req: Request, res: Response) => {
  try {
    const suite = req.body;
    if (!suite.suiteId || !suite.agentId || !suite.testCases?.length) {
      return res.status(400).json({ error: "suiteId, agentId, and testCases required" });
    }
    const agentRunner = async (id: string, message: string) => {
      const start = Date.now();
      const result = await runAgent(id, message, {});
      return { response: result.response, latencyMs: Date.now() - start };
    };
    const result = await runEvalSuite(suite, agentRunner);
    res.json({
      ...result,
      framework: "promptfoo-pattern",
    });
  } catch (err: any) {
    logger.error({ err }, "Eval suite run error");
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/eval/hallucination", async (req: Request, res: Response) => {
  try {
    const { response, context, sources } = req.body;
    if (!response || !context) return res.status(400).json({ error: "response and context required" });
    const score = await detectHallucinations(response, context, sources);
    res.json({
      ...score,
      framework: "vectara-hhem-pattern",
      verdict: score.score >= 0.8 ? "grounded" : score.score >= 0.5 ? "partially-grounded" : "ungrounded",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/compound/pipeline", async (req: Request, res: Response) => {
  try {
    const { pipeline, input } = req.body;
    if (!pipeline || !input) return res.status(400).json({ error: "pipeline and input required" });
    const context = { agentId: "compound-pipeline", sessionId: `pipe_${Date.now()}`, userId: "system", domain: "platform" };
    const result = await executeCompoundPipeline(pipeline, input, context);
    res.json({ ...result, framework: "fireworks-compound-pattern" });
  } catch (err: any) {
    logger.error({ err }, "Compound pipeline error");
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.post("/compound/analyze", async (req: Request, res: Response) => {
  try {
    const { query, domains } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    const pipeline = buildAnalysisPipeline(query, domains || ["portfolio", "technology", "operations"]);
    const context = { agentId: "analysis-pipeline", sessionId: `analysis_${Date.now()}`, userId: "system", domain: "platform" };
    const result = await executeCompoundPipeline(pipeline, { query }, context);
    res.json({ ...result, framework: "fireworks-compound-pattern" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mastraRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [agentsResult, toolsResult, runsResult, threadsResult, tracesResult, a2aResult, workflowsResult, entitiesResult, relationsResult, evalsResult] = await Promise.all([
      pool.query("SELECT count(*) as cnt FROM ai_agent_configs WHERE enabled = TRUE"),
      pool.query("SELECT count(*) as cnt FROM ai_tool_executions"),
      pool.query("SELECT count(*) as cnt FROM agent_runs"),
      pool.query("SELECT count(*) as cnt FROM agent_memory_threads"),
      pool.query("SELECT count(*) as cnt FROM agentops_traces"),
      pool.query("SELECT count(*) as cnt FROM a2a_agent_cards"),
      pool.query("SELECT count(*) as cnt FROM durable_workflows"),
      pool.query("SELECT count(*) as cnt FROM agent_knowledge_entities"),
      pool.query("SELECT count(*) as cnt FROM agent_knowledge_relations"),
      pool.query("SELECT count(*) as cnt FROM agentops_evals"),
    ]);
    res.json({
      framework: "mastra",
      version: "1.0.0",
      protocols: ["MCP", "A2A"],
      agents: parseInt(agentsResult.rows[0].cnt),
      tools: listTools().length,
      totalRuns: parseInt(runsResult.rows[0].cnt),
      toolExecutions: parseInt(toolsResult.rows[0].cnt),
      memoryThreads: parseInt(threadsResult.rows[0].cnt),
      traces: parseInt(tracesResult.rows[0].cnt),
      a2aAgentCards: parseInt(a2aResult.rows[0].cnt),
      durableWorkflows: parseInt(workflowsResult.rows[0].cnt),
      knowledgeEntities: parseInt(entitiesResult.rows[0].cnt),
      knowledgeRelations: parseInt(relationsResult.rows[0].cnt),
      evals: parseInt(evalsResult.rows[0].cnt),
      capabilities: [
        "multi-agent-orchestration",
        "three-tier-memory",
        "semantic-recall",
        "knowledge-graph",
        "tool-calling-with-zod-validation",
        "input-output-guardrails",
        "agent-to-agent-protocol",
        "durable-workflows",
        "agentops-observability",
        "cost-tracking",
        "quality-evals",
        "slo-monitoring",
        "cross-platform-delegation",
        "prompt-injection-defense",
        "pii-redaction",
        "promptfoo-eval-suites",
        "red-team-adversarial-testing",
        "vectara-hallucination-detection",
        "gray-swan-io-security",
        "compound-ai-pipelines",
        "fireworks-optimized-routing",
        "okareo-synthetic-user-simulation",
        "twelve-labs-multimodal-readiness",
      ],
      nvidiaInceptionCapabilities: {
        promptfoo: { status: "integrated", pattern: "eval-suites", attackTypes: getRedTeamCategories().length },
        vectara: { status: "integrated", pattern: "hhem-hallucination-scoring" },
        graySwan: { status: "integrated", pattern: "cygnal-io-filtering", attacks: getRedTeamCatalog().length },
        fireworks: { status: "integrated", pattern: "compound-ai-pipelines" },
        okareo: { status: "integrated", pattern: "synthetic-user-drivers" },
        twelveLabs: { status: "architecture-ready", pattern: "multimodal-video-search" },
        tavily: { status: "integrated", pattern: "agent-web-search-tool" },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { mastraRouter };

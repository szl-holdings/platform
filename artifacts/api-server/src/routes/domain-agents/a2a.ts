/**
 * A2A Protocol API Routes
 * Exposes agent registration, discovery, delegation, heartbeat, and status endpoints.
 */

import { Router, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { a2aRegistry } from "@szl-holdings/ai-engine";
import { delegateTask, getDelegationTask, getDelegationHistory } from "@szl-holdings/ai-engine";
import { sendSuccess, sendError } from "../../lib/api-response";
import { authMiddleware } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

const router = Router();

const a2aRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  message: { error: "A2A rate limit exceeded" },
}) as unknown as RequestHandler;

router.get("/a2a/health", (_req, res) => {
  res.json({ ok: true, protocol: "A2A", version: "1.0.0", timestamp: new Date().toISOString() });
});

router.post("/a2a/register", a2aRateLimit, authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  const body = req.body as {
    agentId?: string;
    name?: string;
    domain?: string;
    version?: string;
    description?: string;
    capabilities?: string[];
    preferredModel?: string;
    preferredProvider?: string;
    collaboratesWith?: string[];
    costPerCallUsd?: number;
    avgLatencyMs?: number;
    successRate?: number;
    status?: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };

  if (!body.agentId || !body.name || !body.domain) {
    sendError(res, "agentId, name, and domain are required", 400);
    return;
  }

  try {
    const card = await a2aRegistry.registerAgent({
      agentId: body.agentId,
      name: body.name,
      domain: body.domain,
      version: body.version ?? "1.0.0",
      description: body.description ?? "",
      capabilities: body.capabilities ?? [],
      preferredModel: body.preferredModel ?? "gpt-4o",
      preferredProvider: body.preferredProvider ?? "openai",
      collaboratesWith: body.collaboratesWith ?? [],
      costPerCallUsd: body.costPerCallUsd ?? 0.002,
      avgLatencyMs: body.avgLatencyMs ?? 2000,
      successRate: body.successRate ?? 0.95,
      status: (body.status ?? "online") as "online" | "offline" | "degraded" | "busy",
      inputSchema: body.inputSchema,
      outputSchema: body.outputSchema,
      metadata: body.metadata,
    });

    logger.info({ agentId: card.agentId, domain: card.domain }, "A2A agent registered");
    sendSuccess(res, card);
  } catch (err) {
    logger.error({ err, agentId: body.agentId }, "A2A registration failed");
    sendError(res, "Registration failed", 500);
  }
});

router.get("/a2a/agents", async (_req: Request, res: Response) => {
  try {
    const cards = await a2aRegistry.getAllCards();
    sendSuccess(res, cards);
  } catch (err) {
    logger.error({ err }, "A2A get all agents failed");
    sendError(res, "Failed to fetch agent cards", 500);
  }
});

router.get("/a2a/agents/:agentId", async (req: Request, res: Response) => {
  const agentId = req.params["agentId"] as string;
  try {
    const card = await a2aRegistry.getAgentCard(agentId);
    if (!card) {
      sendError(res, `Agent not found: ${agentId}`, 404);
      return;
    }
    sendSuccess(res, card);
  } catch (err) {
    logger.error({ err, agentId }, "A2A get agent card failed");
    sendError(res, "Failed to fetch agent card", 500);
  }
});

router.post("/a2a/discover", a2aRateLimit, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  const body = req.body as {
    requestingAgentId?: string;
    capability?: string;
    domain?: string;
    queryText?: string;
    maxResults?: number;
    requireOnline?: boolean;
  };

  if (!body.capability && !body.domain && !body.queryText) {
    sendError(res, "At least one of capability, domain, or queryText is required", 400);
    return;
  }

  try {
    const results = await a2aRegistry.discover({
      requestingAgentId: body.requestingAgentId,
      capability: body.capability,
      domain: body.domain,
      queryText: body.queryText,
      maxResults: body.maxResults,
      requireOnline: body.requireOnline,
    });

    sendSuccess(res, {
      query: body,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "A2A discovery failed");
    sendError(res, "Discovery failed", 500);
  }
});

router.post("/a2a/delegate", a2aRateLimit, authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  const body = req.body as {
    requestingAgentId?: string;
    targetAgentId?: string;
    query?: string;
    context?: string;
    priority?: "low" | "normal" | "high" | "critical";
    timeoutMs?: number;
    orchestrationId?: string;
  };

  if (!body.requestingAgentId || !body.targetAgentId || !body.query) {
    sendError(res, "requestingAgentId, targetAgentId, and query are required", 400);
    return;
  }

  if (body.query.length > 50000) {
    sendError(res, "Query too long (max 50,000 characters)", 400);
    return;
  }

  logger.info(
    { requestingAgentId: body.requestingAgentId, targetAgentId: body.targetAgentId },
    "A2A delegation request",
  );

  try {
    const result = await delegateTask({
      requestingAgentId: body.requestingAgentId,
      targetAgentId: body.targetAgentId,
      query: body.query,
      context: body.context,
      priority: body.priority,
      timeoutMs: body.timeoutMs,
      orchestrationId: body.orchestrationId,
      orgId: (req.user as { orgId?: number })?.orgId ?? null,
      callerUserId: req.user?.id ? Number(req.user.id) : null,
    });

    sendSuccess(res, result);
  } catch (err) {
    logger.error({ err, body }, "A2A delegation failed");
    sendError(res, "Delegation failed", 500);
  }
});

router.get("/a2a/delegate/:taskId", async (req: Request, res: Response) => {
  const taskId = req.params["taskId"] as string;
  try {
    const task = await getDelegationTask(taskId);
    if (!task) {
      sendError(res, `Task not found: ${taskId}`, 404);
      return;
    }
    sendSuccess(res, task);
  } catch (err) {
    logger.error({ err, taskId }, "A2A get delegation task failed");
    sendError(res, "Failed to fetch delegation task", 500);
  }
});

router.get("/a2a/delegate", validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  const { requestingAgentId, targetAgentId, limit } = req.query as Record<string, string>;
  try {
    const tasks = await getDelegationHistory({
      requestingAgentId,
      targetAgentId,
      limit: limit ? Math.min(parseInt(limit), 200) : 50,
    });
    sendSuccess(res, { tasks, count: tasks.length });
  } catch (err) {
    logger.error({ err }, "A2A delegation history failed");
    sendError(res, "Failed to fetch delegation history", 500);
  }
});

router.post("/a2a/heartbeat", a2aRateLimit, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  const body = req.body as {
    agentId?: string;
    status?: string;
    load?: number;
    activeTasks?: number;
  };

  if (!body.agentId) {
    sendError(res, "agentId is required", 400);
    return;
  }

  try {
    await a2aRegistry.heartbeat(
      body.agentId,
      body.status ?? "online",
      body.load ?? 0,
      body.activeTasks ?? 0,
    );
    sendSuccess(res, { agentId: body.agentId, recorded: true, timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err, agentId: body.agentId }, "A2A heartbeat failed");
    sendError(res, "Heartbeat failed", 500);
  }
});

router.post("/a2a/sync", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    await a2aRegistry.syncFromAgentRegistry();
    const cards = await a2aRegistry.getAllCards();
    sendSuccess(res, { synced: cards.length, timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "A2A sync failed");
    sendError(res, "Sync failed", 500);
  }
});

export default router;

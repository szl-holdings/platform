/**
 * A2A v0.3 Agent Cards & Interoperability Routes
 *
 * Endpoints:
 *   GET  /.well-known/agent-card.json  — Mesh index of all agent cards
 *   GET  /a2a/agents/:agentId          — Individual agent card
 *   GET  /a2a/agents/:agentId/health   — Agent health check
 *   POST /a2a/agents/:agentId/tasks    — Create a new A2A task
 *   GET  /a2a/agents/:agentId/tasks    — List agent tasks
 *   GET  /a2a/agents/:agentId/tasks/:taskId — Get task status/output
 *   GET  /a2a/agents/:agentId/stream   — SSE streaming for task results
 *   POST /a2a/agents/:agentId/rpc      — JSON-RPC 2.0 endpoint
 */

import { Router, type Request, type Response } from "express";
import { buildAgentCard, buildMeshAgentIndex, a2aTaskManager, type A2AJsonRpcRequest } from "@szl-holdings/ai-engine";
import { nuroMeshOrchestrator, AGENT_REGISTRY } from "@szl-holdings/ai-engine";

const router = Router();

const VALID_AGENT_IDS = new Set(["alloy", "helmsman", "sentinel", "inca", "muse", "beacon", "zeus", "compass"]);

router.get("/.well-known/agent-card.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(buildMeshAgentIndex());
});

router.get("/a2a/agents", (_req: Request, res: Response) => {
  res.json(buildMeshAgentIndex());
});

router.get("/a2a/agents/:agentId", (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  if (!VALID_AGENT_IDS.has(agentId)) {
    res.status(404).json({ error: "Agent not found", agentId });
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(buildAgentCard(agentId));
});

router.get("/a2a/agents/:agentId/health", (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  if (!VALID_AGENT_IDS.has(agentId)) {
    res.status(404).json({ status: "unknown", agentId });
    return;
  }
  res.json({
    status: "healthy",
    agentId,
    timestamp: new Date().toISOString(),
    platform: "Nuro Mesh",
    version: "1.0.0",
  });
});

router.post("/a2a/agents/:agentId/tasks", async (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  if (!VALID_AGENT_IDS.has(agentId)) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const { input, callerAgentId, callerPlatform } = req.body as {
    input?: { query?: string; context?: Record<string, unknown>; preferredOutputMode?: string };
    callerAgentId?: string;
    callerPlatform?: string;
  };

  if (!input?.query) {
    res.status(400).json({ error: "input.query is required" });
    return;
  }

  const task = a2aTaskManager.createTask(agentId, input as Parameters<typeof a2aTaskManager.createTask>[1], callerAgentId, callerPlatform);
  a2aTaskManager.updateTask(task.taskId, { status: "running" });

  res.status(202).json({ taskId: task.taskId, status: "running", agentId, createdAt: task.createdAt });

  setImmediate(async () => {
    try {
      const agent = AGENT_REGISTRY.find(a => a.id === agentId);
      let output = "";

      if (agentId === "alloy" || !agent) {
        const result = await nuroMeshOrchestrator.orchestrate(input.query!, {
          workflowId: `a2a_${task.taskId}`,
        });
        output = result.synthesis;
      } else {
        const result = await nuroMeshOrchestrator.orchestrate(input.query!, {
          preferredAgents: [agentId],
          workflowId: `a2a_${task.taskId}`,
        });
        output = result.agentResponses[0]?.response ?? result.synthesis;
      }

      a2aTaskManager.updateTask(task.taskId, {
        status: "completed",
        output,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      a2aTaskManager.updateTask(task.taskId, {
        status: "failed",
        error: String(err),
        completedAt: new Date().toISOString(),
      });
    }
  });
});

router.get("/a2a/agents/:agentId/tasks", (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  const limit = Math.min(100, parseInt(String(req.query.limit ?? "50"), 10));
  res.json({ tasks: a2aTaskManager.listTasks(agentId, limit), agentId });
});

router.get("/a2a/agents/:agentId/tasks/:taskId", (req: Request, res: Response) => {
  const taskId = String(req.params.taskId);
  const task = a2aTaskManager.getTask(taskId);
  if (!task) {
    res.status(404).json({ error: "Task not found", taskId });
    return;
  }
  res.json(task);
});

router.get("/a2a/agents/:agentId/stream", async (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  const query = String(req.query.query ?? "");

  if (!VALID_AGENT_IDS.has(agentId) || !query) {
    res.status(400).json({ error: "Invalid agentId or missing query parameter" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("start", { agentId, query: query.slice(0, 100), timestamp: new Date().toISOString() });

  try {
    const result = await nuroMeshOrchestrator.orchestrate(query, {
      preferredAgents: agentId !== "alloy" ? [agentId] : undefined,
      workflowId: `a2a_stream_${Date.now()}`,
    });

    for (const agentResp of result.agentResponses) {
      sendEvent("agent_response", {
        agentId: agentResp.agentId,
        agentName: agentResp.agentName,
        confidence: agentResp.confidence,
        domain: agentResp.domain,
        response: agentResp.response.slice(0, 500),
      });
    }

    sendEvent("synthesis", { synthesis: result.synthesis, averageConfidence: result.averageConfidence });
    sendEvent("complete", { status: "completed", traceId: result.traceId });
  } catch (err) {
    sendEvent("error", { error: String(err) });
  }

  res.end();
});

router.post("/a2a/agents/:agentId/rpc", (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  const request = req.body as A2AJsonRpcRequest;

  if (request.jsonrpc !== "2.0") {
    res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid JSON-RPC request" } });
    return;
  }

  const response = a2aTaskManager.handleJsonRpc(request, agentId);
  res.json(response);
});

export default router;

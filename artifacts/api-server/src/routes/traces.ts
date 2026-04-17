import { Router, type IRouter } from "express";
import {
  defaultTraceStore,
  TraceReplayer,
  defaultQueryEngine,
  type TraceQueryFilter,
} from "@workspace/trace-graph";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, handleRouteError, sendNotFound, sendBadRequest } from "../lib/api-response";

const router: IRouter = Router();

router.get("/traces", authMiddleware(), async (req, res) => {
  try {
    const filter: TraceQueryFilter = {};

    if (req.query.agentId) filter.agentId = req.query.agentId as string;
    if (req.query.workflowId) filter.workflowId = req.query.workflowId as string;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId as string;
    if (req.query.requestId) filter.requestId = req.query.requestId as string;
    if (req.query.entityId) filter.entityId = req.query.entityId as string;
    if (req.query.domain) filter.domain = req.query.domain as string;
    if (req.query.model) filter.model = req.query.model as string;
    if (req.query.status) filter.status = req.query.status as TraceQueryFilter["status"];
    if (req.query.after) filter.after = req.query.after as string;
    if (req.query.before) filter.before = req.query.before as string;

    if (req.query.hasErrors !== undefined) {
      filter.hasErrors = req.query.hasErrors === "true";
    }
    if (req.query.hasPolicyBlock !== undefined) {
      filter.hasPolicyBlock = req.query.hasPolicyBlock === "true";
    }

    const rawLimit = parseInt((req.query.limit as string) ?? "50", 10);
    const rawOffset = parseInt((req.query.offset as string) ?? "0", 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
      sendBadRequest(res, "limit must be between 1 and 500");
      return;
    }
    if (isNaN(rawOffset) || rawOffset < 0) {
      sendBadRequest(res, "offset must be >= 0");
      return;
    }
    filter.limit = rawLimit;
    filter.offset = rawOffset;

    const result = defaultQueryEngine.query(filter);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to query traces");
  }
});

router.get("/traces/:id", authMiddleware(), async (req, res) => {
  try {
    const trace = defaultTraceStore.get(req.params.id);
    if (!trace) {
      sendNotFound(res, "Trace not found");
      return;
    }
    const entityIds = defaultQueryEngine.getEntitiesForTrace(req.params.id);
    sendSuccess(res, { trace, entityIds });
  } catch (err) {
    handleRouteError(res, err, "Failed to get trace");
  }
});

router.post("/traces/:id/replay", authMiddleware(), async (req, res) => {
  try {
    const originalTraceId = req.params.id;
    const original = defaultTraceStore.get(originalTraceId);
    if (!original) {
      sendNotFound(res, "Trace not found");
      return;
    }

    const replayer = new TraceReplayer(defaultTraceStore);
    const tree = replayer.getTraceTree(originalTraceId);

    const replaySteps: Array<{
      kind: string;
      name: string;
      data: unknown;
    }> = [];

    replayer.replayTrace(originalTraceId, {
      onTraceStart: (t) => replaySteps.push({ kind: "trace_start", name: t.traceId, data: { startedAt: t.startedAt } }),
      onToolCall: (call) => replaySteps.push({ kind: "tool_call", name: call.toolName, data: call }),
      onRetrieval: (r) => replaySteps.push({ kind: "retrieval", name: r.source, data: r }),
      onMemoryIO: (m) => replaySteps.push({ kind: "memory_io", name: m.tier, data: m }),
      onGuardrailResult: (g) => replaySteps.push({ kind: "guardrail", name: g.guardId, data: g }),
      onSpan: (s) => replaySteps.push({ kind: "span", name: s.name, data: s }),
      onTraceEnd: (t) => replaySteps.push({ kind: "trace_end", name: t.traceId, data: { status: t.status, completedAt: t.completedAt } }),
    });

    const diff = {
      spanCount: tree?.spans.length ?? 0,
      toolCallCount: original.toolCalls.length,
      retrievalCount: original.retrieval.length,
      errorCount: original.errors.length,
      latencyMs: original.latencyMs ?? null,
      totalTokens: original.totalTokens ?? null,
      costUsd: original.costUsd ?? null,
      status: original.status,
    };

    sendSuccess(res, {
      originalTraceId,
      replayedAt: new Date().toISOString(),
      steps: replaySteps,
      summary: diff,
      spanTree: tree?.spans ?? [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to replay trace");
  }
});

router.post("/traces/:id/link-entity", authMiddleware(), async (req, res) => {
  try {
    const { entityId, role } = req.body as { entityId?: string; role?: string };
    if (!entityId) {
      sendBadRequest(res, "entityId is required");
      return;
    }
    const trace = defaultTraceStore.get(req.params.id);
    if (!trace) {
      sendNotFound(res, "Trace not found");
      return;
    }
    defaultQueryEngine.linkEntityToTrace(req.params.id, entityId);
    sendSuccess(res, { traceId: req.params.id, entityId, role: role ?? "touched" });
  } catch (err) {
    handleRouteError(res, err, "Failed to link entity to trace");
  }
});

export default router;

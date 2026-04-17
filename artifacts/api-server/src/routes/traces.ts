import { Router, type IRouter } from "express";
import {
  defaultTraceStore,
  TraceReplayer,
  TraceWriter,
  defaultQueryEngine,
  type TraceQueryFilter,
} from "@workspace/trace-graph";
import { replayFromTrace } from "@workspace/replay-core";
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

router.get("/traces/regressions", authMiddleware(), async (req, res) => {
  try {
    const baselineId = req.query.baselineId as string | undefined;
    if (!baselineId) {
      sendBadRequest(res, "baselineId query param is required");
      return;
    }
    const baseline = defaultTraceStore.get(baselineId);
    if (!baseline) {
      sendNotFound(res, "Baseline trace not found");
      return;
    }

    const rawThresholdLatency = parseFloat((req.query.latencyMs as string) ?? "500");
    const rawThresholdCost = parseFloat((req.query.costUsd as string) ?? "0.01");
    const rawThresholdErrors = parseInt((req.query.errorCount as string) ?? "1", 10);
    const rawThresholdGrade = parseFloat((req.query.gradeScore as string) ?? "0.1");

    const all = defaultTraceStore.list();
    const candidates = all.filter(
      (t) => t.traceId !== baselineId && t.status !== "running",
    );
    const replayer = new TraceReplayer(defaultTraceStore);
    const regressions = replayer.detectRegressions(
      baselineId,
      candidates.map((c) => c.traceId),
      {
        latencyRegressionMs: rawThresholdLatency,
        costRegressionUsd: rawThresholdCost,
        errorCountIncrease: rawThresholdErrors,
        gradeScoreDrop: rawThresholdGrade,
      },
    );

    sendSuccess(res, { baselineId, regressionCount: regressions.length, regressions });
  } catch (err) {
    handleRouteError(res, err, "Failed to detect regressions");
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

    const body = req.body as {
      capturedToolOutputs?: Record<string, unknown>;
      capturedModelOutputs?: Record<string, unknown>;
    };

    const replayer = new TraceReplayer(defaultTraceStore);
    const tree = replayer.getTraceTree(originalTraceId);

    const deterministicResult = replayFromTrace({
      traceId: originalTraceId,
      runId: original.runId,
      objective: original.objective,
      selfModelSnapshot: original.selfModelSnapshot,
      worldModelSnapshot: original.worldModelSnapshotRef
        ? { ref: original.worldModelSnapshotRef }
        : undefined,
      capturedToolOutputs: body.capturedToolOutputs,
      capturedModelOutputs: body.capturedModelOutputs,
      originalModel: original.model,
      originalPromptVersions: original.promptVersions,
    });

    const replaySteps: Array<{
      kind: string;
      name: string;
      data: unknown;
    }> = [];

    replayer.replayTrace(originalTraceId, {
      onTraceStart: (t) =>
        replaySteps.push({ kind: "trace_start", name: t.traceId, data: { startedAt: t.startedAt, objective: t.objective } }),
      onToolCall: (call) =>
        replaySteps.push({ kind: "tool_call", name: call.toolName, data: call }),
      onRetrieval: (r) =>
        replaySteps.push({ kind: "retrieval", name: r.source, data: r }),
      onMemoryIO: (m) =>
        replaySteps.push({ kind: "memory_io", name: m.tier, data: m }),
      onGuardrailResult: (g) =>
        replaySteps.push({ kind: "guardrail", name: g.guardId, data: g }),
      onVerifierDecision: (v) =>
        replaySteps.push({ kind: "verifier", name: v.verifierId, data: v }),
      onReflection: (r) =>
        replaySteps.push({ kind: "reflection", name: r.reflectionId, data: r }),
      onRollbackPoint: (rp) =>
        replaySteps.push({ kind: "rollback_point", name: rp.rollbackId, data: rp }),
      onSpan: (s) =>
        replaySteps.push({ kind: "span", name: s.name, data: s }),
      onTraceEnd: (t) =>
        replaySteps.push({ kind: "trace_end", name: t.traceId, data: { status: t.status, completedAt: t.completedAt } }),
    });

    const summary = {
      spanCount: tree?.spans.length ?? 0,
      toolCallCount: original.toolCalls.length,
      retrievalCount: original.retrieval.length,
      errorCount: original.errors.length,
      verifierDecisionCount: original.verifierDecisions.length,
      reflectionCount: original.reflections.length,
      rollbackPointCount: original.rollbackPoints.length,
      latencyMs: original.latencyMs ?? null,
      totalTokens: original.totalTokens ?? null,
      costUsd: original.costUsd ?? null,
      status: original.status,
      objective: original.objective ?? null,
      modelsUsed: original.modelsUsed,
      promptVersions: original.promptVersions,
    };

    sendSuccess(res, {
      originalTraceId,
      replayedAt: deterministicResult.replayedAt,
      deterministicScore: deterministicResult.deterministicScore,
      deterministicSteps: deterministicResult.steps,
      steps: replaySteps,
      summary,
      spanTree: tree?.spans ?? [],
      errors: deterministicResult.errors,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to replay trace");
  }
});

router.get("/traces/:id/diff/:compareId", authMiddleware(), async (req, res) => {
  try {
    const traceA = defaultTraceStore.get(req.params.id);
    const traceB = defaultTraceStore.get(req.params.compareId);
    if (!traceA) {
      sendNotFound(res, `Trace ${req.params.id} not found`);
      return;
    }
    if (!traceB) {
      sendNotFound(res, `Trace ${req.params.compareId} not found`);
      return;
    }

    const latencyMs = req.query.latencyMs !== undefined
      ? parseFloat(req.query.latencyMs as string)
      : undefined;
    const costUsd = req.query.costUsd !== undefined
      ? parseFloat(req.query.costUsd as string)
      : undefined;
    const errorCount = req.query.errorCount !== undefined
      ? parseInt(req.query.errorCount as string, 10)
      : undefined;
    const gradeScore = req.query.gradeScore !== undefined
      ? parseFloat(req.query.gradeScore as string)
      : undefined;

    const replayer = new TraceReplayer(defaultTraceStore);
    const diff = replayer.compareTraces(req.params.id, req.params.compareId, {
      latencyRegressionMs: latencyMs,
      costRegressionUsd: costUsd,
      errorCountIncrease: errorCount,
      gradeScoreDrop: gradeScore,
    });

    sendSuccess(res, { traceIdA: req.params.id, traceIdB: req.params.compareId, diff });
  } catch (err) {
    handleRouteError(res, err, "Failed to diff traces");
  }
});

router.post("/traces/:id/grade", authMiddleware(), async (req, res) => {
  try {
    const trace = defaultTraceStore.get(req.params.id);
    if (!trace) {
      sendNotFound(res, "Trace not found");
      return;
    }

    const body = req.body as {
      gradedBy?: string;
      score?: number;
      rubric?: Record<string, number>;
      notes?: string;
    };

    if (body.score === undefined || typeof body.score !== "number") {
      sendBadRequest(res, "score (number 0-1) is required");
      return;
    }
    if (body.score < 0 || body.score > 1) {
      sendBadRequest(res, "score must be between 0 and 1");
      return;
    }

    const writer = new TraceWriter(defaultTraceStore);
    const grade = writer.gradeRun(req.params.id, {
      gradedBy: body.gradedBy ?? "operator",
      score: body.score,
      rubric: body.rubric ?? {},
      notes: body.notes,
    });

    sendSuccess(res, { traceId: req.params.id, grade });
  } catch (err) {
    handleRouteError(res, err, "Failed to grade trace");
  }
});

router.post("/traces/:id/comment", authMiddleware(), async (req, res) => {
  try {
    const trace = defaultTraceStore.get(req.params.id);
    if (!trace) {
      sendNotFound(res, "Trace not found");
      return;
    }

    const body = req.body as {
      operatorId?: string;
      content?: string;
      spanId?: string;
      tags?: string[];
    };

    if (!body.content || typeof body.content !== "string" || body.content.trim().length === 0) {
      sendBadRequest(res, "content is required");
      return;
    }

    const writer = new TraceWriter(defaultTraceStore);
    const comment = writer.addOperatorComment(
      req.params.id,
      body.operatorId ?? "anonymous",
      body.content.trim(),
      { spanId: body.spanId, tags: body.tags },
    );

    sendSuccess(res, { traceId: req.params.id, comment });
  } catch (err) {
    handleRouteError(res, err, "Failed to add comment to trace");
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

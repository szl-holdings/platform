import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { genAITelemetry } from "@szl-holdings/observability";
import { validateBody, genaiSpanSchema, validateQuery, listQuerySchema } from "../lib/validation";

const router: IRouter = Router();

router.post(
  "/genai-telemetry/spans",
  authMiddleware({ required: true }),
  validateBody(genaiSpanSchema),
  (req, res) => {
    try {
      const span = req.body;

      switch (span.kind) {
        case "model_call":
          genAITelemetry.recordModelCall({
            traceId: span.traceId ?? "unknown",
            model: span.model ?? "unknown",
            modelProvider: span.modelProvider ?? "unknown",
            routeClass: span.routeClass ?? "unknown",
            promptTokens: span.promptTokens ?? 0,
            completionTokens: span.completionTokens ?? 0,
            totalTokens: span.totalTokens ?? 0,
            latencyMs: span.latencyMs ?? 0,
            costEstimateUsd: span.costEstimateUsd ?? 0,
            usedFallback: span.usedFallback ?? false,
            status: span.status ?? "ok",
            error: span.error,
            correlationId: span.correlationId,
            tenantId: span.tenantId,
            orgId: span.orgId,
            timestamp: span.timestamp ?? Date.now(),
            metadata: span.metadata,
          });
          break;
        case "tool_call":
          genAITelemetry.recordToolCall({
            traceId: span.traceId ?? "unknown",
            toolName: span.toolName ?? "unknown",
            toolInput: span.toolInput ?? {},
            toolOutput: span.toolOutput,
            latencyMs: span.latencyMs ?? 0,
            status: span.status ?? "ok",
            error: span.error,
            riskLevel: span.riskLevel,
            policyApplied: span.policyApplied,
            approvalRequired: span.approvalRequired,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        case "agent_step":
          genAITelemetry.recordAgentStep({
            traceId: span.traceId ?? "unknown",
            agentId: span.agentId ?? "unknown",
            agentDomain: span.agentDomain ?? "unknown",
            stepIndex: span.stepIndex ?? 0,
            stepType: span.stepType ?? "think",
            inputSummary: span.inputSummary,
            outputSummary: span.outputSummary,
            latencyMs: span.latencyMs ?? 0,
            status: span.status ?? "ok",
            error: span.error,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        case "retrieval":
          genAITelemetry.recordRetrieval({
            traceId: span.traceId ?? "unknown",
            query: span.query ?? "",
            engine: span.engine ?? "unknown",
            chunksRetrieved: span.chunksRetrieved ?? 0,
            chunksUsed: span.chunksUsed ?? 0,
            topScore: span.topScore,
            latencyMs: span.latencyMs ?? 0,
            status: span.status ?? "ok",
            error: span.error,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        case "approval":
          genAITelemetry.recordApproval({
            traceId: span.traceId ?? "unknown",
            decisionId: span.decisionId ?? "unknown",
            decisionType: span.decisionType ?? "unknown",
            requiredApprovalLevel: span.requiredApprovalLevel ?? "human",
            approvedByUserId: span.approvedByUserId,
            approvalDelayMs: span.approvalDelayMs,
            outcome: span.outcome ?? "pending",
            overrideApplied: span.overrideApplied,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        case "artifact_job":
          genAITelemetry.recordArtifactJob({
            traceId: span.traceId ?? "unknown",
            jobId: span.jobId ?? "unknown",
            jobType: span.jobType ?? "unknown",
            artifactType: span.artifactType,
            latencyMs: span.latencyMs ?? 0,
            status: span.status ?? "ok",
            error: span.error,
            outputSize: span.outputSize,
            exportSafe: span.exportSafe,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        case "execution_run":
          genAITelemetry.recordExecutionRun({
            traceId: span.traceId ?? "unknown",
            runId: span.runId ?? "unknown",
            executionType: span.executionType ?? "unknown",
            domain: span.domain ?? "unknown",
            latencyMs: span.latencyMs ?? 0,
            status: span.status ?? "ok",
            error: span.error,
            retryCount: span.retryCount,
            totalModelCalls: span.totalModelCalls,
            totalToolCalls: span.totalToolCalls,
            totalCostUsd: span.totalCostUsd,
            correlationId: span.correlationId,
            timestamp: span.timestamp ?? Date.now(),
          });
          break;
        default:
          res.status(400).json({ error: `Unknown span kind: ${span.kind}` });
          return;
      }

      res.status(201).json({ recorded: true, kind: span.kind });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/genai-telemetry/spans/batch",
  authMiddleware({ required: true }),
  validateBody(bodyShape({
      "spans": z.unknown().optional(),
    })),
  (req, res) => {
    try {
      const { spans } = req.body;
      if (!Array.isArray(spans)) {
        res.status(400).json({ error: "spans must be an array" });
        return;
      }

      let recorded = 0;
      const errors: string[] = [];

      for (const span of spans) {
        try {
          if (!span?.kind) continue;
          switch (span.kind) {
            case "model_call":
              genAITelemetry.recordModelCall({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
            case "tool_call":
              genAITelemetry.recordToolCall({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
            case "retrieval":
              genAITelemetry.recordRetrieval({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
            case "approval":
              genAITelemetry.recordApproval({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
            case "artifact_job":
              genAITelemetry.recordArtifactJob({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
            case "execution_run":
              genAITelemetry.recordExecutionRun({ ...span, timestamp: span.timestamp ?? Date.now() });
              break;
          }
          recorded++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      }

      res.status(201).json({ recorded, errors: errors.length > 0 ? errors : undefined });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/genai-telemetry/snapshot",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "viewer"),
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      const windowMs = req.query.windowMs ? Number(req.query.windowMs) : 300_000;
      const snapshot = genAITelemetry.getSnapshot(windowMs);
      res.json({ snapshot, windowMs });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/genai-telemetry/spans",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      const windowMs = req.query.windowMs ? Number(req.query.windowMs) : 300_000;
      const spans = genAITelemetry.getSpans(windowMs);
      const limit = req.query.limit ? Number(req.query.limit) : 200;
      res.json({ spans: spans.slice(-limit), count: spans.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/genai-telemetry/trace/:traceId",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  (req, res) => {
    try {
      const traceId = req.params.traceId as string;
      const spans = genAITelemetry.getSpansByTrace(traceId);
      res.json({ traceId, spans, count: spans.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/genai-telemetry/langfuse/:traceId",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      const nameParam = req.query.name;
      const langfuseTraceId = req.params.traceId as string;
      const traceName = typeof nameParam === "string" ? nameParam : `Trace ${langfuseTraceId}`;
      const exported = genAITelemetry.exportLangfuseTrace(
        langfuseTraceId,
        traceName,
      );
      res.json(exported);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/genai-telemetry/dashboard/:appSlug",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "viewer"),
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      const windowMs = req.query.windowMs ? Number(req.query.windowMs) : 300_000;
      const dashboard = genAITelemetry.perAppDashboard(req.params.appSlug as string, windowMs);
      res.json({ dashboard });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

export default router;

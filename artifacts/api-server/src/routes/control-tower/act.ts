import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { requireRole } from "../../middlewares/auth";
import { sendSuccess, sendNotFound, sendBadRequest, sendError, handleRouteError } from "../../lib/api-response";
import { listPipelines, executePipeline, getPipelineConfig, executeComposedPipeline } from "../../lib/intelligence-pipelines";
import { insertDecision } from "../../lib/alloy-decision-store";
import { logger } from "../../lib/logger";
import { randomUUID } from "crypto";
import { evaluatePolicies, toRiskLevel, makeEvidenceRef } from "./shared";
import { validateBody } from "../../lib/validation";

const router = Router();

router.get("/control-tower/act/pipelines", (_req: Request, res: Response) => {
  try {
    const pipelines = listPipelines();
    sendSuccess(res, {
      layer: "act",
      pipelines,
      totalPipelines: pipelines.length,
      templates: pipelines.map(p => ({
        id: p.id, name: p.name, domain: p.domain,
        description: p.description, stages: p.stages,
        stageTypes: p.stages.map(s => s.type),
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines");
  }
});

router.get("/control-tower/act/pipelines/:id", (req: Request, res: Response) => {
  try {
    const config = getPipelineConfig(req.params.id as string);
    if (!config) {
      sendNotFound(res, `Pipeline ${req.params.id as string}`);
      return;
    }
    sendSuccess(res, { layer: "act", pipeline: config });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines/:id");
  }
});

router.post("/control-tower/act/pipelines/:id/run", requireRole("super_admin", "ops", "exec"), validateBody(bodyShape({
      "agentId": z.unknown().optional(),
      "input": z.unknown().optional(),
      "slice": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { input, agentId } = req.body as { input?: string; agentId?: string };
    if (!input) {
      sendBadRequest(res, "input is required");
      return;
    }

    const config = getPipelineConfig(id);
    if (!config) {
      sendNotFound(res, `Pipeline ${id}`);
      return;
    }

    const executingAgentId = agentId ?? `${config.domain}-pipeline`;
    const riskLevel = "medium";
    const govCheck = evaluatePolicies(executingAgentId, `execute pipeline ${id}`, riskLevel);

    if (!govCheck.allowed) {
      sendError(res, "Governance pre-flight failed", 403, "FORBIDDEN", {
        blockedReason: govCheck.blockedReason,
        violatedPolicies: govCheck.violatedPolicies,
        pipeline: id,
      });
      return;
    }

    logger.info({ pipelineId: id, inputLength: input.length }, "Control Tower — pipeline execution");
    const result = await executePipeline(id, input);

    const decisionId = `ct-pipe-${randomUUID()}`;
    try {
      await insertDecision({
        decisionId,
        workflowId: id,
        signalIds: [],
        recommendedAction: result.finalOutput.slice(0, 1000),
        rationaleSummary: result.stages
          .filter(s => s.status === "completed")
          .map(s => `[${s.stageType}] ${s.output.slice(0, 150)}`)
          .join("\n"),
        evidenceRefs: result.stages.map(s =>
          makeEvidenceRef({
            source: `pipeline:${id}:${s.stageType}`,
            sourceType: "workflow",
            content: `Stage '${s.stageName}' (${s.stageType}) status=${s.status} — ${s.output.slice(0, 200)}`,
            relevanceScore: s.status === "completed" ? 0.9 : 0.4,
          }),
        ),
        confidence: result.status === "completed" ? 0.9 : result.status === "partial" ? 0.6 : 0.2,
        ownerSuggestion: null,
        approvalRequired: govCheck.requiresApproval,
        riskLevel: toRiskLevel(riskLevel),
        fallbackPlan: null,
        modelRoute: `pipeline:${id}`,
        schemaVersion: "2.0.0",
        status: "executed",
        rawInput: input.slice(0, 1000),
        rawOutput: result.finalOutput.slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower: failed to persist pipeline decision to DB");
    }

    sendSuccess(res, { layer: "act", result, decisionId, governanceCheck: { requiresApproval: govCheck.requiresApproval } });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines/:id/run");
  }
});

router.post("/control-tower/act/compose", requireRole("super_admin", "ops", "exec"), validateBody(bodyShape({
      "input": z.unknown().optional(),
      "stages": z.unknown().optional(),
      "trim": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { stages, input } = req.body as {
      stages: Array<{ id: string; type: string; name: string }>;
      input: string;
    };

    if (!Array.isArray(stages) || stages.length === 0) {
      sendBadRequest(res, "stages array is required and must be non-empty");
      return;
    }
    if (typeof input !== "string" || !input.trim()) {
      sendBadRequest(res, "input string is required");
      return;
    }

    const validStageTypes = ["ingest", "classify", "score", "enrich", "recommend", "audit"] as const;
    type ValidType = typeof validStageTypes[number];
    const invalidStage = stages.find(s => !validStageTypes.includes(s.type as ValidType));
    if (invalidStage) {
      sendBadRequest(res, `Unknown stage type: ${invalidStage.type}. Valid types: ${validStageTypes.join(", ")}`);
      return;
    }

    const typedStages = stages as Array<{ id: string; type: ValidType; name: string }>;
    const result = await executeComposedPipeline(typedStages, input.trim());

    const decisionId = `ct-compose-${randomUUID()}`;
    try {
      const confidence = result.status === "completed" ? 0.85 : result.status === "partial" ? 0.5 : 0.2;
      await insertDecision({
        decisionId,
        workflowId: result.runId,
        signalIds: [],
        recommendedAction: result.finalOutput.slice(0, 1000),
        rationaleSummary: result.stages
          .filter(s => s.status === "completed")
          .map(s => `[${s.stageType}] ${s.output.slice(0, 150)}`)
          .join("\n"),
        evidenceRefs: result.stages.map(s =>
          makeEvidenceRef({
            source: `composed-pipeline:${result.composedPipelineId}:${s.stageType}`,
            sourceType: "workflow",
            content: `Stage '${s.stageName}' (${s.stageType}) — ${s.output.slice(0, 200)}`,
            relevanceScore: s.status === "completed" ? 0.9 : 0.3,
            objectId: result.composedPipelineId,
          }),
        ),
        confidence,
        ownerSuggestion: null,
        approvalRequired: false,
        riskLevel: toRiskLevel("medium"),
        fallbackPlan: null,
        modelRoute: `composed-pipeline`,
        schemaVersion: "2.0.0",
        status: "executed",
        rawInput: input.trim().slice(0, 1000),
        rawOutput: result.finalOutput.slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower: failed to persist composed pipeline decision to DB");
    }

    sendSuccess(res, {
      layer: "act",
      composedPipelineId: result.composedPipelineId,
      runId: result.runId,
      decisionId,
      status: result.status,
      stageResults: result.stages.map(s => ({
        stageName: s.stageName,
        type: s.stageType,
        status: s.status,
        outputSnippet: s.output.slice(0, 400),
        durationMs: s.durationMs,
        tokensUsed: s.tokensUsed,
      })),
      finalOutput: result.finalOutput,
      totalDurationMs: result.totalDurationMs,
      totalTokens: result.totalTokens,
      stageCount: stages.length,
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/compose");
  }
});


export function register(r: IRouter): void { r.use(router); }

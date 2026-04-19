import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema } from "../lib/validation";
import {
  defaultPolicyModeRegistry,
  PolicyModeConfigSchema,
  PolicyModeSchema,
  POLICY_MODE_DESCRIPTIONS,
  buildPolicyEvaluation,
} from "@szl-holdings/policy-engine";

const router: IRouter = Router();

router.get("/policy-modes", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (_req: Request, res: Response) => {
  try {
    const configs = defaultPolicyModeRegistry.getAll();
    sendSuccess(res, { data: configs, total: configs.length });
  } catch (err) {
    handleRouteError(res, err, "policy-modes:list");
  }
});

router.get("/policy-modes/meta", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const modes = PolicyModeSchema.options.map(m => ({
      mode: m,
      description: POLICY_MODE_DESCRIPTIONS[m],
    }));
    sendSuccess(res, { modes });
  } catch (err) {
    handleRouteError(res, err, "policy-modes:meta");
  }
});

router.get("/policy-modes/resolve", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { product, actionType, workspace } = req.query as {
      product?: string;
      actionType?: string;
      workspace?: string;
    };

    if (!product && !actionType && !workspace) {
      sendBadRequest(res, "At least one of product, actionType, or workspace is required");
      return;
    }

    const resolved = defaultPolicyModeRegistry.resolve({
      product: product ?? "*",
      actionType: actionType ?? "*",
      workspace: workspace ?? "*",
    });

    sendSuccess(res, {
      resolved: resolved ?? null,
      effectiveMode: resolved?.mode ?? "approval-required",
      source: resolved ? "registry" : "default",
    });
  } catch (err) {
    handleRouteError(res, err, "policy-modes:resolve");
  }
});

router.get("/policy-modes/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const config = defaultPolicyModeRegistry.getById(id);
    if (!config) { sendNotFound(res, "PolicyModeConfig"); return; }
    sendSuccess(res, config);
  } catch (err) {
    handleRouteError(res, err, "policy-modes:get");
  }
});

router.post("/policy-modes", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const id = (body.id as string | undefined) ?? randomUUID();
    const now = Date.now();

    const parsed = PolicyModeConfigSchema.safeParse({ ...body, id, createdAt: now, updatedAt: now });
    if (!parsed.success) {
      sendBadRequest(res, "Invalid policy mode config", parsed.error.flatten());
      return;
    }

    defaultPolicyModeRegistry.register(parsed.data);

    logger.info(
      { id: parsed.data.id, mode: parsed.data.mode, scope: parsed.data.scope },
      "policy-mode.created"
    );

    sendCreated(res, parsed.data);
  } catch (err) {
    handleRouteError(res, err, "policy-modes:create");
  }
});

router.patch("/policy-modes/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const existing = defaultPolicyModeRegistry.getById(id);
    if (!existing) { sendNotFound(res, "PolicyModeConfig"); return; }

    const body = req.body as Record<string, unknown>;
    const merged = { ...existing, ...body, id, updatedAt: Date.now() };

    const parsed = PolicyModeConfigSchema.safeParse(merged);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid policy mode config", parsed.error.flatten());
      return;
    }

    defaultPolicyModeRegistry.register(parsed.data);

    logger.info({ id, mode: parsed.data.mode }, "policy-mode.updated");
    sendSuccess(res, parsed.data);
  } catch (err) {
    handleRouteError(res, err, "policy-modes:update");
  }
});

router.delete("/policy-modes/:id", authMiddleware(), requireRole("super_admin", "admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = defaultPolicyModeRegistry.unregister(id);
    if (!deleted) { sendNotFound(res, "PolicyModeConfig"); return; }

    logger.info({ id }, "policy-mode.deleted");
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "policy-modes:delete");
  }
});

router.post("/policy-modes/evaluate", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      action?: string;
      actionType?: string;
      product?: string;
      workspace?: string;
      subjectRoles?: string[];
      entitySensitivity?: "public" | "internal" | "confidential" | "restricted";
      confidence?: number;
      freshnessScore?: number;
      environment?: "development" | "staging" | "production";
      projectedCostUsd?: number;
      projectedImpact?: string;
      projectedRisk?: string;
      evidenceChain?: Array<{ source: string; summary: string; confidence: number; freshness: number }>;
    };

    if (!body.action) {
      sendBadRequest(res, "action is required");
      return;
    }

    const user = req.user;
    const evaluation = buildPolicyEvaluation({
      action: body.action,
      actionType: body.actionType,
      product: body.product,
      workspace: body.workspace,
      subjectRoles: body.subjectRoles ?? (user?.roles ?? []),
      entitySensitivity: body.entitySensitivity ?? "internal",
      confidence: body.confidence ?? 1.0,
      freshnessScore: body.freshnessScore ?? 1.0,
      environment: body.environment ?? "production",
      projectedCostUsd: body.projectedCostUsd,
      projectedImpact: body.projectedImpact ?? "Not specified — caller must supply projectedImpact for production use.",
      projectedRisk: body.projectedRisk ?? "Not specified — caller must supply projectedRisk for production use.",
      evidenceChain: body.evidenceChain ?? [],
      evaluatedBy: user?.displayName ?? user?.email ?? "api",
    });

    logger.info(
      { evaluationId: evaluation.evaluationId, mode: evaluation.mode, action: evaluation.action, effect: evaluation.policyResult.effect },
      "policy.evaluation.performed"
    );

    sendSuccess(res, evaluation);
  } catch (err) {
    handleRouteError(res, err, "policy-modes:evaluate");
  }
});

export default router;

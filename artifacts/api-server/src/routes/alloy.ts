import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import {
  db,
  alloyWorkflowsTable,
  alloySignalsTable,
  alloyWorkflowRunsTable,
  alloyArtifactsTable,
  alloyApprovalsTable,
  alloyAuditLogTable,
  featureFlagsTable,
  insertAlloyWorkflowSchema,
  insertAlloySignalSchema,
  alloyDecisions,
  alloySkills,
  alloySkillRuns,
} from "@szl-holdings/db";
import { eq, desc, and, sql, inArray, gte, lte } from "drizzle-orm";
import { authMiddleware, requireRole, parseIdParam, type AuthenticatedUser } from "../middlewares/auth";
import { withDbSpan } from "../middlewares/telemetry";
import { isFlagEnabled } from "../lib/platform-flags";
import { platformAuth, logPlatformEvent } from "../middlewares/platform-auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendError,
  sendNoContent,
  sendForbidden,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import { broadcastWs, pubsub, ALLOY_EVENTS } from "../lib/pubsub-bridge.js";
import { jsonObjectBodySchema, listQuerySchema, validateBody, validateQuery } from "../lib/validation";
import {
  AUTONOMY_MODES,
  evaluateAutonomyForAction,
  getAutonomyMode,
  listAutonomyModes,
  setAutonomyMode,
  type AutonomyMode,
} from "../lib/autonomy-store";

const upsertFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  isEnabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  conditions: z.record(z.unknown()).optional().nullable(),
});

const patchFeatureFlagSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  isEnabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  conditions: z.record(z.unknown()).optional().nullable(),
}).refine(d => Object.keys(d).length > 0, { message: "At least one field is required" });

const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(5000).trim().optional(),
});

const workflowRunSchema = z.object({
  signalId: z.number().int().positive().optional().nullable(),
  input: z.record(z.unknown()).optional(),
});

const artifactApproveSchema = z.object({
  notes: z.string().max(5000).trim().optional().nullable(),
});

const artifactRejectSchema = z.object({
  reason: z.string().max(5000).trim().optional().nullable(),
});

const createDecisionSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  summary: z.string().max(5000).trim().optional().nullable(),
  verdict: z.string().max(200).trim().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  approvalStatus: z.enum(["propose_only", "approved_execute", "blocked_by_policy"]).optional(),
  evidence: z.array(z.unknown()).optional(),
  agentId: z.string().max(200).trim().optional().nullable(),
  agentName: z.string().max(200).trim().optional().nullable(),
  modelUsed: z.string().max(200).trim().optional().nullable(),
  workflowRunId: z.number().int().positive().optional().nullable(),
});

const createSkillSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  version: z.string().max(50).trim().optional(),
  category: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(2000).trim(),
  approvalClass: z.enum(["auto", "review", "admin_only"]).optional(),
  isInternal: z.boolean().optional(),
  dryRunSupported: z.boolean().optional(),
  inputSchema: z.record(z.unknown()).optional().nullable(),
  outputSchema: z.record(z.unknown()).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const patchSkillSchema = z.object({
  isEnabled: z.boolean().optional(),
  description: z.string().max(2000).trim().optional(),
  approvalClass: z.enum(["auto", "review", "admin_only"]).optional(),
  tags: z.array(z.string()).optional(),
}).refine(d => Object.keys(d).length > 0, { message: "At least one field is required" });

const router: IRouter = Router();

function getUserOrgIds(user?: AuthenticatedUser): number[] {
  if (!user) return [];
  return user.orgs.map(o => o.orgId);
}

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes("super_admin") || user.roles.includes("admin");
}

function canAccessOrgResource(user: AuthenticatedUser | undefined, resourceOrgId: number | null): boolean {
  if (isGlobalAdmin(user)) return true;
  if (resourceOrgId == null) return false;
  return getUserOrgIds(user).includes(resourceOrgId);
}

async function writeAudit(params: {
  orgId?: number | null;
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
}) {
  try {
    await db.insert(alloyAuditLogTable).values({
      orgId: params.orgId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      before: params.before as Record<string, unknown> ?? null,
      after: params.after as Record<string, unknown> ?? null,
      correlationId: params.correlationId ?? null,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to write audit log");
  }
}

function transitionRunState(
  current: string,
  next: string,
): { valid: boolean; message?: string } {
  const allowed: Record<string, string[]> = {
    queued: ["running", "canceled"],
    running: ["waiting_approval", "completed", "failed", "canceled"],
    waiting_approval: ["completed", "failed", "canceled"],
    completed: [],
    failed: ["queued"],
    canceled: [],
  };
  if (!allowed[current]?.includes(next)) {
    return { valid: false, message: `Cannot transition from ${current} to ${next}` };
  }
  return { valid: true };
}

router.post("/alloy/ingest/signal", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.source || !payload.sourceType || !payload.title) {
      sendBadRequest(res, "source, sourceType, and title are required");
      return;
    }
    const userOrgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && userOrgIds.length === 0) {
      res.status(403).json({ success: false, error: "No organization membership — cannot ingest signals", code: "NO_ORG" });
      return;
    }
    const resolvedOrgId = isAdmin ? (payload.orgId ?? userOrgIds[0] ?? null) : userOrgIds[0];
    const data = insertAlloySignalSchema.parse({
      source: payload.source,
      sourceType: payload.sourceType,
      severity: payload.severity ?? "info",
      title: payload.title,
      body: payload.body ?? null,
      status: "new",
      orgId: resolvedOrgId,
      workflowId: payload.workflowId ?? null,
      normalizedScore: payload.normalizedScore ?? null,
      valueAtRisk: payload.valueAtRisk ?? null,
      metadata: payload.metadata ?? {},
    });
    const [signal] = await db.insert(alloySignalsTable).values(data).returning();
    await writeAudit({
      orgId: signal.orgId,
      userId: req.user?.id,
      action: "ingest_signal",
      resourceType: "alloy_signal",
      resourceId: String(signal.id),
      after: signal,
      correlationId: res.getHeader("X-Correlation-ID") as string,
    });
    sendCreated(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest signal");
  }
});

router.post("/alloy/ingest/batch", authMiddleware(), requireRole("super_admin", "ops", "analyst"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) {
      res.status(403).json({ success: false, error: "No organization membership — cannot ingest signals", code: "NO_ORG" });
      return;
    }
    const { signals } = req.body as { signals: unknown[] };
    if (!Array.isArray(signals) || signals.length === 0) {
      sendBadRequest(res, "signals array is required and must be non-empty");
      return;
    }
    if (signals.length > 100) {
      sendBadRequest(res, "Batch size limited to 100 signals");
      return;
    }
    const parsed = signals.map((s: unknown) => {
      const base = insertAlloySignalSchema.parse(s);
      if (!isAdmin && base.orgId != null && !orgIds.includes(base.orgId)) {
        throw Object.assign(new Error("Signal orgId does not match your organization"), { status: 403 });
      }
      if (!isAdmin && (base.orgId == null || !orgIds.includes(base.orgId))) {
        base.orgId = orgIds[0];
      }
      return base;
    });
    const inserted = await db.insert(alloySignalsTable).values(parsed).returning();
    sendCreated(res, { count: inserted.length, signals: inserted });
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 403) {
      res.status(403).json({ success: false, error: (err as Error).message, code: "ORG_MISMATCH" });
      return;
    }
    handleRouteError(res, err, "Failed to batch ingest signals");
  }
});

router.get("/alloy/workflows", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) { sendSuccess(res, [], 200, { page, limit, total: 0 }); return; }
    const orgFilter = !isAdmin ? inArray(alloyWorkflowsTable.orgId, orgIds) : undefined;
    const [rows, [{ count }]] = await withDbSpan(req, () => Promise.all([
      (orgFilter ? db.select().from(alloyWorkflowsTable).where(orgFilter) : db.select().from(alloyWorkflowsTable))
        .orderBy(desc(alloyWorkflowsTable.createdAt)).limit(limit).offset(offset),
      (orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable)),
    ]), "alloy_workflows:list");
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list workflows");
  }
});

router.get("/alloy/workflows/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!row) { sendNotFound(res, "Workflow"); return; }
    if (!canAccessOrgResource(req.user, row.orgId)) { sendNotFound(res, "Workflow"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get workflow");
  }
});

router.post("/alloy/workflows", authMiddleware(), requireRole("super_admin", "ops", "analyst"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const data = insertAlloyWorkflowSchema.parse(req.body);
    const userOrgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && userOrgIds.length === 0) {
      res.status(403).json({ success: false, error: "No organization membership — cannot create workflows", code: "NO_ORG" });
      return;
    }
    const resolvedOrgId = isAdmin ? (data.orgId ?? userOrgIds[0] ?? null) : userOrgIds[0];
    const [row] = await db.insert(alloyWorkflowsTable).values({ ...data, orgId: resolvedOrgId, createdBy: req.user?.id ?? null }).returning();
    await writeAudit({
      orgId: row.orgId,
      userId: req.user?.id,
      action: "create_workflow",
      resourceType: "alloy_workflow",
      resourceId: String(row.id),
      after: row,
    });
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workflow");
  }
});

router.patch("/alloy/workflows/:id", authMiddleware(), requireRole("super_admin", "ops", "analyst"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [before] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!before) { sendNotFound(res, "Workflow"); return; }
    if (!canAccessOrgResource(req.user, before.orgId)) { sendNotFound(res, "Workflow"); return; }
    const allowed = ["name", "description", "trigger", "triggerConfig", "steps", "outputType", "requiresApproval", "approverRole", "isActive"];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const [row] = await db.update(alloyWorkflowsTable).set({ ...patch, updatedAt: new Date() }).where(eq(alloyWorkflowsTable.id, id)).returning();
    await writeAudit({ orgId: row.orgId, userId: req.user?.id, action: "update_workflow", resourceType: "alloy_workflow", resourceId: String(id), before, after: row });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update workflow");
  }
});

router.delete("/alloy/workflows/:id", validateBody(jsonObjectBodySchema), authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!existing) { sendNotFound(res, "Workflow"); return; }
    if (!canAccessOrgResource(req.user, existing.orgId)) { sendNotFound(res, "Workflow"); return; }
    await db.delete(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete workflow");
  }
});

router.post("/alloy/workflows/:id/run", authMiddleware(), validateBody(workflowRunSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [workflow] = await withDbSpan(req, () => db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id)), "alloy_workflows:get");
    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    if (!canAccessOrgResource(req.user, workflow.orgId)) { sendNotFound(res, "Workflow"); return; }
    if (!workflow.isActive) { sendBadRequest(res, "Workflow is not active"); return; }

    if (workflow.orgId != null) {
      const [{ activeCount }] = await withDbSpan(req, () => db
        .select({ activeCount: sql<number>`count(*)::int` })
        .from(alloyWorkflowRunsTable)
        .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
        .where(and(
          eq(alloyWorkflowsTable.orgId, workflow.orgId!),
          inArray(alloyWorkflowRunsTable.state, ["queued", "running"]),
        )), "alloy_runs:concurrent_count");
      const ORG_CONCURRENT_RUN_LIMIT = 20;
      if (activeCount >= ORG_CONCURRENT_RUN_LIMIT) {
        res.status(429).json({ success: false, error: `Org concurrent run limit of ${ORG_CONCURRENT_RUN_LIMIT} reached. Please wait for active runs to complete.`, code: "QUOTA_EXCEEDED" });
        return;
      }
    }

    const [run] = await withDbSpan(req, () => db.insert(alloyWorkflowRunsTable).values({
      workflowId: id,
      signalId: req.body.signalId ?? null,
      triggeredBy: req.user?.id ?? null,
      state: "queued",
      input: req.body.input ?? {},
      stateHistory: [{ state: "queued", at: new Date().toISOString(), by: req.user?.displayName ?? "system" }],
    }).returning(), "alloy_workflow_runs:insert");

    await withDbSpan(req, () => db.update(alloyWorkflowsTable).set({ runCount: (workflow.runCount || 0) + 1, lastRunAt: new Date(), updatedAt: new Date() }).where(eq(alloyWorkflowsTable.id, id)), "alloy_workflows:update_run_count");

    setTimeout(async () => {
      try {
        const requiresApproval = workflow.requiresApproval;
        const nextState = requiresApproval ? "waiting_approval" : "completed";
        const now = new Date();
        await db.update(alloyWorkflowRunsTable).set({
          state: "running",
          startedAt: now,
          stateHistory: [
            { state: "queued", at: run.queuedAt, by: "system" },
            { state: "running", at: now.toISOString(), by: "system" },
          ],
        }).where(eq(alloyWorkflowRunsTable.id, run.id));

        const artifactContent = {
          summary: `Workflow "${workflow.name}" executed successfully`,
          workflowId: id,
          runId: run.id,
          inputs: run.input,
          executedAt: now.toISOString(),
        };
        const ORG_ARTIFACT_QUOTA = 500;
        if (workflow.orgId != null) {
          const [{ artifactCount }] = await db
            .select({ artifactCount: sql<number>`count(*)::int` })
            .from(alloyArtifactsTable)
            .where(eq(alloyArtifactsTable.orgId, workflow.orgId));
          if (artifactCount >= ORG_ARTIFACT_QUOTA) {
            logger.warn({ workflowId: id, orgId: workflow.orgId, artifactCount }, "Org artifact storage quota exceeded — failing run");
            const failedAt = new Date();
            await db.update(alloyWorkflowRunsTable).set({
              state: "failed",
              completedAt: failedAt,
              errorMessage: `Org artifact quota of ${ORG_ARTIFACT_QUOTA} exceeded`,
              stateHistory: [
                { state: "queued", at: run.queuedAt, by: "system" },
                { state: "running", at: now.toISOString(), by: "system" },
                { state: "failed", at: failedAt.toISOString(), by: "system", reason: "artifact_quota_exceeded" },
              ],
            }).where(eq(alloyWorkflowRunsTable.id, run.id));
            broadcastWs("workflow-runs", "run-updated", { id: run.id, workflowId: id, state: "failed" });
            return;
          }
        }
        const [artifact] = await db.insert(alloyArtifactsTable).values({
          workflowRunId: run.id,
          workflowId: id,
          orgId: workflow.orgId ?? null,
          title: `${workflow.name} — Output`,
          artifactType: "report",
          content: artifactContent,
          status: requiresApproval ? "pending_review" : "published",
          approvalStatus: requiresApproval ? "pending" : "not_required",
        }).returning();

        if (requiresApproval) {
          await db.insert(alloyApprovalsTable).values({
            workflowRunId: run.id,
            artifactId: artifact.id,
            requestedFrom: workflow.approverRole ?? "admin",
            status: "pending",
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          });
        }

        const completedAt = new Date();
        const [finalRun] = await db.update(alloyWorkflowRunsTable).set({
          state: nextState,
          completedAt: requiresApproval ? undefined : completedAt,
          durationMs: completedAt.getTime() - now.getTime() + 500,
          output: artifactContent,
          stateHistory: [
            { state: "queued", at: run.queuedAt, by: "system" },
            { state: "running", at: now.toISOString(), by: "system" },
            { state: nextState, at: completedAt.toISOString(), by: "system" },
          ],
        }).where(eq(alloyWorkflowRunsTable.id, run.id)).returning();
        broadcastWs("workflow-runs", "run-updated", { id: finalRun.id, workflowId: id, state: finalRun.state });
        void pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: finalRun });
      } catch (err) {
        logger.error({ err, runId: run.id }, "Failed to execute workflow run");
        await db.update(alloyWorkflowRunsTable).set({ state: "failed", errorMessage: "Execution error" }).where(eq(alloyWorkflowRunsTable.id, run.id));
      }
    }, 1500);

    sendCreated(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to trigger workflow");
  }
});

router.get("/alloy/runs/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!row) { sendNotFound(res, "Run"); return; }
    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      const [wf] = await db.select({ orgId: alloyWorkflowsTable.orgId }).from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, row.workflowId));
      if (!wf || !orgIds.includes(wf.orgId ?? -1)) {
        sendNotFound(res, "Run"); return;
      }
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get run");
  }
});

router.post("/alloy/runs/:id/retry", authMiddleware(), requireRole("super_admin", "ops"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!run) { sendNotFound(res, "Run"); return; }
    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      if (orgIds.length === 0) { sendNotFound(res, "Run"); return; }
      const [wf] = await db.select({ orgId: alloyWorkflowsTable.orgId }).from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, run.workflowId));
      if (!wf || !orgIds.includes(wf.orgId ?? -1)) { sendNotFound(res, "Run"); return; }
    }
    if (!["failed", "canceled"].includes(run.state)) {
      sendBadRequest(res, "Only failed or canceled runs can be retried");
      return;
    }
    if ((run.retryCount ?? 0) >= (run.maxRetries ?? 3)) {
      sendBadRequest(res, "Max retries reached");
      return;
    }
    const [updated] = await db.update(alloyWorkflowRunsTable).set({
      state: "queued",
      retryCount: (run.retryCount ?? 0) + 1,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    }).where(eq(alloyWorkflowRunsTable.id, id)).returning();
    broadcastWs("workflow-runs", "run-updated", { id: updated.id, workflowId: updated.workflowId, state: "queued" });
    void pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: updated });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to retry run");
  }
});

router.post("/alloy/runs/:id/cancel", authMiddleware(), requireRole("super_admin", "ops"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!run) { sendNotFound(res, "Run"); return; }
    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      if (orgIds.length === 0) { sendNotFound(res, "Run"); return; }
      const [wf] = await db.select({ orgId: alloyWorkflowsTable.orgId }).from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, run.workflowId));
      if (!wf || !orgIds.includes(wf.orgId ?? -1)) { sendNotFound(res, "Run"); return; }
    }
    const check = transitionRunState(run.state, "canceled");
    if (!check.valid) { sendBadRequest(res, check.message ?? "Cannot cancel run in current state"); return; }
    const [updated] = await db.update(alloyWorkflowRunsTable).set({ state: "canceled" }).where(eq(alloyWorkflowRunsTable.id, id)).returning();
    broadcastWs("workflow-runs", "run-updated", { id: updated.id, workflowId: updated.workflowId, state: "canceled" });
    void pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: updated });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to cancel run");
  }
});

router.get("/alloy/artifacts", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    if (!isGlobalAdmin(req.user) && orgIds.length === 0) {
      sendSuccess(res, [], 200, { page, limit, total: 0 });
      return;
    }
    const orgFilter = !isGlobalAdmin(req.user) ? inArray(alloyArtifactsTable.orgId, orgIds) : undefined;
    const baseQuery = orgFilter ? db.select().from(alloyArtifactsTable).where(orgFilter) : db.select().from(alloyArtifactsTable);
    const rows = await baseQuery.orderBy(desc(alloyArtifactsTable.createdAt)).limit(limit).offset(offset);
    const countQuery = orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyArtifactsTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyArtifactsTable);
    const [{ count }] = await countQuery;
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list artifacts");
  }
});

router.get("/alloy/artifacts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(alloyArtifactsTable).where(eq(alloyArtifactsTable.id, id));
    if (!row) { sendNotFound(res, "Artifact"); return; }
    if (!canAccessOrgResource(req.user, row.orgId)) { sendNotFound(res, "Artifact"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get artifact");
  }
});

router.post("/alloy/artifacts/:id/approve", authMiddleware(), requireRole("super_admin", "ops", "compliance"), validateBody(artifactApproveSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [artifact] = await db.select().from(alloyArtifactsTable).where(eq(alloyArtifactsTable.id, id));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    if (!canAccessOrgResource(req.user, artifact.orgId)) { sendNotFound(res, "Artifact"); return; }
    const [updated] = await db.update(alloyArtifactsTable).set({
      status: "approved",
      approvalStatus: "approved",
      reviewedBy: req.user?.id ?? null,
      reviewedAt: new Date(),
      reviewNotes: req.body.notes ?? null,
      updatedAt: new Date(),
    }).where(eq(alloyArtifactsTable.id, id)).returning();
    if (updated.workflowRunId) {
      await db.update(alloyApprovalsTable).set({
        status: "approved",
        decision: req.body.notes ?? "Approved",
        decisionBy: req.user?.id ?? null,
        decisionAt: new Date(),
      }).where(eq(alloyApprovalsTable.workflowRunId, updated.workflowRunId));
      await db.update(alloyWorkflowRunsTable).set({ state: "completed", completedAt: new Date() }).where(eq(alloyWorkflowRunsTable.id, updated.workflowRunId));
    }
    await writeAudit({ userId: req.user?.id, action: "approve_artifact", resourceType: "alloy_artifact", resourceId: String(id) });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to approve artifact");
  }
});

router.post("/alloy/artifacts/:id/reject", authMiddleware(), requireRole("super_admin", "ops", "compliance"), validateBody(artifactRejectSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [artifact] = await db.select().from(alloyArtifactsTable).where(eq(alloyArtifactsTable.id, id));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    if (!canAccessOrgResource(req.user, artifact.orgId)) { sendNotFound(res, "Artifact"); return; }
    const [updated] = await db.update(alloyArtifactsTable).set({
      status: "rejected",
      approvalStatus: "rejected",
      reviewedBy: req.user?.id ?? null,
      reviewedAt: new Date(),
      reviewNotes: req.body.reason ?? null,
      updatedAt: new Date(),
    }).where(eq(alloyArtifactsTable.id, id)).returning();
    if (updated.workflowRunId) {
      await db.update(alloyApprovalsTable).set({
        status: "rejected",
        decision: req.body.reason ?? "Rejected",
        decisionBy: req.user?.id ?? null,
        decisionAt: new Date(),
      }).where(eq(alloyApprovalsTable.workflowRunId, updated.workflowRunId));
      await db.update(alloyWorkflowRunsTable).set({ state: "failed", errorMessage: "Artifact rejected by reviewer" }).where(eq(alloyWorkflowRunsTable.id, updated.workflowRunId));
    }
    await writeAudit({ userId: req.user?.id, action: "reject_artifact", resourceType: "alloy_artifact", resourceId: String(id) });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to reject artifact");
  }
});

router.get("/alloy/admin/flags", authMiddleware(), requireRole("super_admin", "ops"), async (_req, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
    sendSuccess(res, flags);
  } catch (err) {
    handleRouteError(res, err, "Failed to list feature flags");
  }
});

router.post("/alloy/admin/flags", authMiddleware(), requireRole("super_admin", "ops"), validateBody(upsertFeatureFlagSchema), async (req, res) => {
  try {
    const { key, name, description, isEnabled, rolloutPercentage, conditions } = req.body;
    const [existing] = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, key));
    if (existing) {
      const [updated] = await db.update(featureFlagsTable).set({
        name,
        description: description ?? existing.description,
        isEnabled: isEnabled ?? existing.isEnabled,
        rolloutPercentage: rolloutPercentage ?? existing.rolloutPercentage,
        conditions: conditions ?? existing.conditions,
        updatedAt: new Date(),
      }).where(eq(featureFlagsTable.key, key)).returning();
      await writeAudit({ userId: req.user?.id, action: "update_feature_flag", resourceType: "feature_flag", resourceId: key, before: existing, after: updated });
      sendSuccess(res, updated);
    } else {
      const [created] = await db.insert(featureFlagsTable).values({ key, name, description, isEnabled: isEnabled ?? false, rolloutPercentage: rolloutPercentage ?? 0, conditions }).returning();
      await writeAudit({ userId: req.user?.id, action: "create_feature_flag", resourceType: "feature_flag", resourceId: key, after: created });
      sendCreated(res, created);
    }
  } catch (err) {
    handleRouteError(res, err, "Failed to upsert feature flag");
  }
});

router.patch("/alloy/admin/flags/:key", authMiddleware(), requireRole("super_admin", "ops"), validateBody(patchFeatureFlagSchema), async (req, res) => {
  try {
    const key = String(req.params.key);
    const [existing] = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, key));
    if (!existing) { sendNotFound(res, "Feature flag"); return; }
    const [updated] = await db.update(featureFlagsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(featureFlagsTable.key, key)).returning();
    await writeAudit({ userId: req.user?.id, action: "update_feature_flag", resourceType: "feature_flag", resourceId: key, before: existing, after: updated });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

router.get("/alloy/audit", authMiddleware(), requireRole("super_admin", "ops", "compliance"), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) { sendSuccess(res, [], 200, { page, limit, total: 0 }); return; }
    const orgFilter = !isAdmin ? inArray(alloyAuditLogTable.orgId, orgIds) : undefined;
    const baseQuery = orgFilter ? db.select().from(alloyAuditLogTable).where(orgFilter) : db.select().from(alloyAuditLogTable);
    const rows = await baseQuery.orderBy(desc(alloyAuditLogTable.createdAt)).limit(limit).offset(offset);
    const countQuery = orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyAuditLogTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyAuditLogTable);
    const [{ count }] = await countQuery;
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list audit log");
  }
});

router.get("/alloy/factory-floor", authMiddleware(), async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) {
      sendSuccess(res, { workflows: [], globalCounts: { running: 0, queued: 0, completed: 0, failed: 0, waiting_approval: 0 }, fetchedAt: new Date().toISOString() });
      return;
    }
    const wfFilter = !isAdmin ? inArray(alloyWorkflowsTable.orgId, orgIds) : undefined;
    const workflows = wfFilter
      ? await db.select().from(alloyWorkflowsTable).where(wfFilter).orderBy(alloyWorkflowsTable.name)
      : await db.select().from(alloyWorkflowsTable).orderBy(alloyWorkflowsTable.name);
    const wfIds = workflows.map(w => w.id);
    const allRuns = wfIds.length === 0 ? [] : await db.select({
      id: alloyWorkflowRunsTable.id,
      workflowId: alloyWorkflowRunsTable.workflowId,
      state: alloyWorkflowRunsTable.state,
      queuedAt: alloyWorkflowRunsTable.queuedAt,
      startedAt: alloyWorkflowRunsTable.startedAt,
      completedAt: alloyWorkflowRunsTable.completedAt,
      durationMs: alloyWorkflowRunsTable.durationMs,
    }).from(alloyWorkflowRunsTable).where(inArray(alloyWorkflowRunsTable.workflowId, wfIds)).orderBy(desc(alloyWorkflowRunsTable.queuedAt));

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600000);

    const workflowStats = workflows.map(wf => {
      const runs = allRuns.filter(r => r.workflowId === wf.id);
      const recentRuns = runs.filter(r => r.queuedAt >= sevenDaysAgo);

      const counts = {
        running: runs.filter(r => r.state === "running").length,
        queued: runs.filter(r => r.state === "queued").length,
        completed: runs.filter(r => r.state === "completed").length,
        failed: runs.filter(r => r.state === "failed").length,
        waiting_approval: runs.filter(r => r.state === "waiting_approval").length,
        canceled: runs.filter(r => r.state === "canceled").length,
      };

      const sparklineByDay: number[] = [];
      for (let d = 6; d >= 0; d--) {
        const dayStart = new Date(now - (d + 1) * 24 * 3600000);
        const dayEnd = new Date(now - d * 24 * 3600000);
        const dayRuns = recentRuns.filter(r => r.queuedAt >= dayStart && r.queuedAt < dayEnd);
        const successes = dayRuns.filter(r => r.state === "completed").length;
        const total = dayRuns.length;
        sparklineByDay.push(total === 0 ? 0 : Math.round((successes / total) * 100));
      }

      const completedRuns = runs.filter(r => r.state === "completed" && r.durationMs != null);
      const avgDurationMs = completedRuns.length > 0
        ? Math.round(completedRuns.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / completedRuns.length)
        : null;

      const lastRun = runs[0] ?? null;

      return {
        workflow: wf,
        counts,
        totalRuns: runs.length,
        successRate: runs.length > 0 ? Math.round((counts.completed / runs.length) * 100) : 0,
        avgDurationMs,
        sparkline: sparklineByDay,
        lastRunAt: lastRun?.queuedAt ?? null,
        lastRunState: lastRun?.state ?? null,
        recentRuns: runs.slice(0, 5).map(r => ({ id: r.id, state: r.state, queuedAt: r.queuedAt })),
      };
    });

    const globalCounts = {
      running: allRuns.filter(r => r.state === "running").length,
      queued: allRuns.filter(r => r.state === "queued").length,
      completed: allRuns.filter(r => r.state === "completed").length,
      failed: allRuns.filter(r => r.state === "failed").length,
      waiting_approval: allRuns.filter(r => r.state === "waiting_approval").length,
    };

    sendSuccess(res, { workflows: workflowStats, globalCounts, fetchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to build factory floor");
  }
});

router.get("/alloy/signals", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const source = typeof req.query.source === "string" ? req.query.source : null;
    const severity = typeof req.query.severity === "string" ? req.query.severity : null;
    const status = typeof req.query.status === "string" ? req.query.status : null;

    const userOrgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && userOrgIds.length === 0) { sendSuccess(res, [], 200, { page, limit, total: 0 }); return; }

    const conditions = [];
    if (!isAdmin) conditions.push(inArray(alloySignalsTable.orgId, userOrgIds));
    if (source) conditions.push(eq(alloySignalsTable.source, source));
    if (severity) conditions.push(eq(alloySignalsTable.severity, severity as "critical" | "high" | "medium" | "low" | "info"));
    if (status) conditions.push(eq(alloySignalsTable.status, status as "new" | "processing" | "processed" | "failed" | "ignored"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, [{ count }]] = await withDbSpan(req, () => Promise.all([
      where
        ? db.select().from(alloySignalsTable).where(where).orderBy(desc(alloySignalsTable.receivedAt)).limit(limit).offset(offset)
        : db.select().from(alloySignalsTable).orderBy(desc(alloySignalsTable.receivedAt)).limit(limit).offset(offset),
      where
        ? db.select({ count: sql<number>`count(*)::int` }).from(alloySignalsTable).where(where)
        : db.select({ count: sql<number>`count(*)::int` }).from(alloySignalsTable),
    ]), "alloy_signals:list");

    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list signals");
  }
});

router.get("/alloy/runs/:id/steps", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!run) { sendNotFound(res, "Run"); return; }
    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      if (orgIds.length === 0) { sendNotFound(res, "Run"); return; }
      const [wf] = await db.select({ orgId: alloyWorkflowsTable.orgId }).from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, run.workflowId));
      if (!wf || !orgIds.includes(wf.orgId ?? -1)) { sendNotFound(res, "Run"); return; }
    }
    const [workflow] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, run.workflowId));
    const steps = (run.output as Record<string, unknown> | null)?.steps ?? (workflow?.steps ?? []);
    sendSuccess(res, { run, workflow, steps });
  } catch (err) {
    handleRouteError(res, err, "Failed to get run steps");
  }
});

router.get("/alloy/runs", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const stateFilter = typeof req.query.state === "string" ? req.query.state : null;
    const workflowIdFilter = typeof req.query.workflowId === "string" ? parseInt(req.query.workflowId) : null;
    const validStates = ["queued", "running", "waiting_approval", "completed", "failed", "canceled"];

    const userOrgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && userOrgIds.length === 0) { sendSuccess(res, [], 200, { page, limit, total: 0 }); return; }
    const needsOrgScope = !isAdmin;

    const conditions: ReturnType<typeof eq>[] = [];
    if (stateFilter && validStates.includes(stateFilter)) {
      conditions.push(eq(alloyWorkflowRunsTable.state, stateFilter as "queued" | "running" | "waiting_approval" | "completed" | "failed" | "canceled"));
    }
    if (workflowIdFilter) {
      conditions.push(eq(alloyWorkflowRunsTable.workflowId, workflowIdFilter));
    }

    let rows, count;
    if (needsOrgScope) {
      const orgCondition = inArray(alloyWorkflowsTable.orgId, userOrgIds);
      const where = conditions.length > 0 ? and(orgCondition, ...conditions) : orgCondition;
      rows = await db
        .select({ run: alloyWorkflowRunsTable })
        .from(alloyWorkflowRunsTable)
        .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
        .where(where)
        .orderBy(desc(alloyWorkflowRunsTable.queuedAt))
        .limit(limit)
        .offset(offset)
        .then(rs => rs.map(r => r.run));
      [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(alloyWorkflowRunsTable)
        .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
        .where(where);
    } else {
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      rows = where
        ? await db.select().from(alloyWorkflowRunsTable).where(where).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(limit).offset(offset)
        : await db.select().from(alloyWorkflowRunsTable).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(limit).offset(offset);
      [{ count }] = where
        ? await db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable).where(where)
        : await db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable);
    }

    const tenantOrgIdForSessions = resolveAlloyTenant(req);
    const runtimeSessions = await import("@szl/alloy")
      .then(m => {
        if (typeof m.listSessions === "function") {
          return (m.listSessions as (t?: number | null) => unknown[])(tenantOrgIdForSessions);
        }
        return [];
      })
      .catch(() => []);

    sendSuccess(res, rows, 200, { page, limit, total: count, runtimeSessions });
  } catch (err) {
    handleRouteError(res, err, "Failed to list runs");
  }
});

router.get("/alloy/approvals", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) { sendSuccess(res, [], 200, { page, limit, total: 0 }); return; }

    const statusFilter = typeof req.query.status === "string" ? req.query.status : null;
    const validStatuses = ["pending", "approved", "rejected", "expired"];
    const statusCondition = statusFilter && validStatuses.includes(statusFilter)
      ? eq(alloyApprovalsTable.status, statusFilter as "pending" | "approved" | "rejected" | "expired")
      : undefined;

    let rows, count;
    if (!isAdmin) {
      const orgCondition = inArray(alloyWorkflowsTable.orgId, orgIds);
      const where = statusCondition ? and(orgCondition, statusCondition) : orgCondition;
      const joinQuery = db
        .select({ approval: alloyApprovalsTable })
        .from(alloyApprovalsTable)
        .innerJoin(alloyWorkflowRunsTable, eq(alloyApprovalsTable.workflowRunId, alloyWorkflowRunsTable.id))
        .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
        .where(where)
        .orderBy(desc(alloyApprovalsTable.createdAt));
      rows = (await joinQuery.limit(limit).offset(offset)).map(r => r.approval);
      [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(alloyApprovalsTable)
        .innerJoin(alloyWorkflowRunsTable, eq(alloyApprovalsTable.workflowRunId, alloyWorkflowRunsTable.id))
        .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
        .where(where);
    } else {
      const where = statusCondition;
      rows = where
        ? await db.select().from(alloyApprovalsTable).where(where).orderBy(desc(alloyApprovalsTable.createdAt)).limit(limit).offset(offset)
        : await db.select().from(alloyApprovalsTable).orderBy(desc(alloyApprovalsTable.createdAt)).limit(limit).offset(offset);
      [{ count }] = where
        ? await db.select({ count: sql<number>`count(*)::int` }).from(alloyApprovalsTable).where(where)
        : await db.select({ count: sql<number>`count(*)::int` }).from(alloyApprovalsTable);
    }
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals");
  }
});

router.post("/alloy/approvals/:id/decide", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance"), validateBody(approvalDecisionSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { decision, notes } = req.body;
    const [approval] = await db.select().from(alloyApprovalsTable).where(eq(alloyApprovalsTable.id, id));
    if (!approval) { sendNotFound(res, "Approval"); return; }
    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      if (orgIds.length === 0) { sendNotFound(res, "Approval"); return; }
      const [run] = await db.select({ workflowId: alloyWorkflowRunsTable.workflowId }).from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, approval.workflowRunId));
      if (!run) { sendNotFound(res, "Approval"); return; }
      const [wf] = await db.select({ orgId: alloyWorkflowsTable.orgId }).from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, run.workflowId));
      if (!wf || !orgIds.includes(wf.orgId ?? -1)) { sendNotFound(res, "Approval"); return; }
    }
    if (approval.status !== "pending") { sendBadRequest(res, "Approval already decided"); return; }

    const [updated] = await db.update(alloyApprovalsTable).set({
      status: decision,
      decision: notes ?? null,
      decisionBy: req.user?.id ?? null,
      decisionAt: new Date(),
    }).where(eq(alloyApprovalsTable.id, id)).returning();

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to decide approval");
  }
});

router.get("/alloy/dashboard", authMiddleware(), async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user);
    const isAdmin = isGlobalAdmin(req.user);
    if (!isAdmin && orgIds.length === 0) {
      sendSuccess(res, { summary: { totalWorkflows: 0, totalRuns: 0, totalArtifacts: 0, pendingApprovals: 0 }, recentRuns: [], recentArtifacts: [], fetchedAt: new Date().toISOString() });
      return;
    }
    const wfFilter = !isAdmin ? inArray(alloyWorkflowsTable.orgId, orgIds) : undefined;
    const artFilter = !isAdmin ? inArray(alloyArtifactsTable.orgId, orgIds) : undefined;

    const [
      workflowCount,
      runCount,
      artifactCount,
      pendingApprovalCount,
      recentRuns,
      recentArtifacts,
    ] = await Promise.all([
      (wfFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable).where(wfFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable)).then(r => r[0]?.count ?? 0),
      (!isAdmin
        ? db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable).innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id)).where(inArray(alloyWorkflowsTable.orgId, orgIds))
        : db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable)
      ).then(r => r[0]?.count ?? 0),
      (artFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyArtifactsTable).where(artFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyArtifactsTable)).then(r => r[0]?.count ?? 0),
      (!isAdmin
        ? db.select({ count: sql<number>`count(*)::int` })
            .from(alloyApprovalsTable)
            .innerJoin(alloyWorkflowRunsTable, eq(alloyApprovalsTable.workflowRunId, alloyWorkflowRunsTable.id))
            .innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id))
            .where(and(eq(alloyApprovalsTable.status, "pending"), inArray(alloyWorkflowsTable.orgId, orgIds)))
        : db.select({ count: sql<number>`count(*)::int` }).from(alloyApprovalsTable).where(eq(alloyApprovalsTable.status, "pending"))
      ).then(r => r[0]?.count ?? 0),
      (!isAdmin
        ? db.select({ run: alloyWorkflowRunsTable }).from(alloyWorkflowRunsTable).innerJoin(alloyWorkflowsTable, eq(alloyWorkflowRunsTable.workflowId, alloyWorkflowsTable.id)).where(inArray(alloyWorkflowsTable.orgId, orgIds)).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(10).then(rs => rs.map(r => r.run))
        : db.select().from(alloyWorkflowRunsTable).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(10)
      ),
      (artFilter ? db.select().from(alloyArtifactsTable).where(artFilter) : db.select().from(alloyArtifactsTable)).orderBy(desc(alloyArtifactsTable.createdAt)).limit(5),
    ]);
    sendSuccess(res, {
      summary: {
        totalWorkflows: workflowCount,
        totalRuns: runCount,
        totalArtifacts: artifactCount,
        pendingApprovals: pendingApprovalCount,
      },
      recentRuns,
      recentArtifacts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build Alloy dashboard");
  }
});

// ─── Decisions ────────────────────────────────────────────────────────────────

router.get("/decisions", platformAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { limit = 30, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(alloyDecisions.approvalStatus, status as "propose_only" | "approval_required" | "approved_execute" | "blocked_by_policy"));
    }

    const rows = await db
      .select()
      .from(alloyDecisions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyDecisions.createdAt))
      .limit(limit)
      .offset(offset);

    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch decisions");
  }
});

router.get("/decisions/:id", platformAuth, async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const [row] = await db.select().from(alloyDecisions).where(eq(alloyDecisions.id, id));
    if (!row) return sendNotFound(res, "Decision not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch decision");
  }
});

router.post("/decisions", platformAuth, validateBody(createDecisionSchema), async (req: Request, res: Response) => {
  try {
    const { title, summary, verdict, confidence, approvalStatus, evidence, agentId, agentName, modelUsed, workflowRunId } = req.body;
    const [row] = await db.insert(alloyDecisions).values({
      title, summary, verdict, confidence, approvalStatus: approvalStatus ?? "propose_only",
      evidence: evidence ?? [], agentId, agentName, modelUsed, workflowRunId,
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create decision");
  }
});

router.post("/decisions/:id/approve", platformAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const reviewer = (req as any).platformUser?.name ?? "Operator";
    const [row] = await db.update(alloyDecisions)
      .set({ approvalStatus: "approved_execute", reviewedBy: reviewer, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(alloyDecisions.id, id))
      .returning();
    if (!row) return sendNotFound(res, "Decision not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to approve decision");
  }
});

router.post("/decisions/:id/reject", platformAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const reviewer = (req as any).platformUser?.name ?? "Operator";
    const [row] = await db.update(alloyDecisions)
      .set({ approvalStatus: "blocked_by_policy", reviewedBy: reviewer, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(alloyDecisions.id, id))
      .returning();
    if (!row) return sendNotFound(res, "Decision not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to reject decision");
  }
});

// ─── Skills ───────────────────────────────────────────────────────────────────

router.get("/skills", platformAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const category = req.query.category as string | undefined;
    const approvalClass = req.query.approvalClass as string | undefined;

    const conditions = [];
    if (category) conditions.push(eq(alloySkills.category, category));
    if (approvalClass) conditions.push(eq(alloySkills.approvalClass, approvalClass as "auto" | "review" | "admin_only"));

    const rows = await db
      .select()
      .from(alloySkills)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloySkills.usageCount))
      .limit(limit)
      .offset(offset);

    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch skills");
  }
});

router.get("/skills/:id", platformAuth, async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const [row] = await db.select().from(alloySkills).where(eq(alloySkills.id, id));
    if (!row) return sendNotFound(res, "Skill not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch skill");
  }
});

router.post("/skills", platformAuth, validateBody(createSkillSchema), async (req: Request, res: Response) => {
  try {
    const { name, slug, version, category, description, approvalClass, isInternal, dryRunSupported, inputSchema, outputSchema, tags } = req.body;
    const [row] = await db.insert(alloySkills).values({
      name, slug, version: version ?? "1.0.0", category, description,
      approvalClass: approvalClass ?? "auto", isInternal: isInternal ?? true,
      dryRunSupported: dryRunSupported ?? false, inputSchema, outputSchema,
      tags: tags ?? [],
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create skill");
  }
});

router.patch("/skills/:id", platformAuth, validateBody(patchSkillSchema), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const { isEnabled, description, approvalClass, tags } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;
    if (description !== undefined) updates.description = description;
    if (approvalClass !== undefined) updates.approvalClass = approvalClass;
    if (tags !== undefined) updates.tags = tags;
    const [row] = await db.update(alloySkills).set(updates as any).where(eq(alloySkills.id, id)).returning();
    if (!row) return sendNotFound(res, "Skill not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update skill");
  }
});

router.get("/skills/:id/runs", platformAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return;
    const { limit = 20 } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(alloySkillRuns)
      .where(eq(alloySkillRuns.skillId, id))
      .orderBy(desc(alloySkillRuns.createdAt))
      .limit(limit);
    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch skill runs");
  }
});

const evidenceCreateSchema = z.object({
  kind: z.enum(["signal", "memory", "document", "metric", "observation", "attestation", "policy", "trace"]),
  label: z.string().min(1).max(500),
  value: z.string().min(1),
  source: z.string().min(1).max(200),
  sourceId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  weight: z.number().min(0).max(1).optional(),
  maxAgeMs: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const policySimulateSchema = z.object({
  action: z.string().min(1),
  domain: z.string().optional(),
  tenantId: z.string().optional(),
  actionClass: z.string().optional(),
  subject: z.object({
    id: z.string().optional(),
    roles: z.array(z.string()),
    tenantId: z.string().optional(),
  }),
  resource: z.object({
    type: z.string(),
    id: z.string().optional(),
    domain: z.string().optional(),
    attributes: z.record(z.unknown()).optional(),
  }),
  context: z.record(z.unknown()).optional(),
  estimatedCostUsd: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  urgency: z.string().optional(),
});

const recommendBodySchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().min(1),
  reasoning: z.string().min(1),
  domain: z.string().min(1),
  value: z.unknown().optional(),
  urgency: z.enum(["routine", "moderate", "urgent", "critical"]).optional(),
  autonomyMode: z.enum(["observe", "recommend", "draft", "ask-to-act", "approved-act"]).optional(),
  baseConfidence: z.number().min(0).max(1).optional(),
  evidenceIds: z.array(z.string()).optional(),
  supportingEvidenceIds: z.array(z.string()).optional(),
  contradictingEvidenceIds: z.array(z.string()).optional(),
  inlineEvidence: z.array(z.object({
    kind: z.enum(["signal", "memory", "document", "metric", "observation", "attestation", "policy", "trace"]),
    label: z.string(),
    value: z.string(),
    source: z.string(),
    confidence: z.number().min(0).max(1).optional(),
  })).optional(),
  suggestedAction: z.string().optional(),
  validForMs: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

function resolveAlloyTenant(req: Request): number | null {
  const user = req.user;
  if (isGlobalAdmin(user)) {
    const orgIds = getUserOrgIds(user);
    return orgIds[0] ?? null;
  }
  const orgIds = getUserOrgIds(user);
  if (orgIds.length === 0) return null;
  return orgIds[0]!;
}

function requireAlloyTenant(req: Request, res: Response): number | null {
  const tenantOrgId = resolveAlloyTenant(req);
  if (tenantOrgId === null) {
    sendForbidden(res, "Tenant context required — user must belong to an org");
    return null;
  }
  return tenantOrgId;
}

router.get("/alloy/evidence", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = requireAlloyTenant(req, res);
    if (tenantOrgId === null) return;
    const { limit = 50 } = parsePagination(req.query as Record<string, unknown>);
    const { listEvidence } = await import("@szl/alloy/evidence");
    const items = listEvidence(undefined, tenantOrgId).slice(0, limit);
    return sendSuccess(res, items, 200, { count: items.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list evidence");
  }
});

router.post("/alloy/evidence", authMiddleware(), validateBody(evidenceCreateSchema), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = requireAlloyTenant(req, res);
    if (tenantOrgId === null) return;
    const { createEvidence } = await import("@szl/alloy/evidence");
    const ev = createEvidence({
      kind: req.body.kind,
      label: req.body.label,
      value: req.body.value,
      source: req.body.source,
      sourceId: req.body.sourceId,
      confidence: req.body.confidence,
      weight: req.body.weight,
      maxAgeMs: req.body.maxAgeMs,
      metadata: req.body.metadata,
      tenantOrgId,
    });
    logger.info({ evidenceId: ev.id, kind: ev.kind, tenantOrgId }, "Evidence created via Alloy");
    return sendCreated(res, ev);
  } catch (err) {
    handleRouteError(res, err, "Failed to create evidence");
  }
});

router.get("/alloy/evidence/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = requireAlloyTenant(req, res);
    if (tenantOrgId === null) return;
    const { getEvidence } = await import("@szl/alloy/evidence");
    const ev = getEvidence(req.params.id, tenantOrgId);
    if (!ev) return sendNotFound(res, "Evidence not found");
    return sendSuccess(res, ev);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch evidence");
  }
});

router.post("/alloy/policy/simulate", authMiddleware(), validateBody(policySimulateSchema), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = requireAlloyTenant(req, res);
    if (tenantOrgId === null) return;
    const { checkAction } = await import("@szl/alloy");
    const result = checkAction({
      action: req.body.action,
      domain: req.body.domain,
      tenantId: tenantOrgId != null ? String(tenantOrgId) : undefined,
      actionClass: req.body.actionClass,
      subject: req.body.subject,
      resource: req.body.resource,
      context: req.body.context,
      estimatedCostUsd: req.body.estimatedCostUsd,
      confidence: req.body.confidence,
      urgency: req.body.urgency,
    });
    const policyState = result.allowed
      ? (result.requiresApproval ? "requires_approval" : "allowed")
      : "blocked";
    logger.info({ action: req.body.action, policyState, tenantOrgId }, "Policy simulation run");
    return sendSuccess(res, {
      ...result,
      policyState,
      simulatedAt: Date.now(),
      tenantOrgId,
      request: req.body,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to simulate policy");
  }
});

router.post("/alloy/recommend", authMiddleware(), validateBody(recommendBodySchema), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = requireAlloyTenant(req, res);
    if (tenantOrgId === null) return;

    // Consult the persisted autonomy mode for this (tenant, domain) before
    // letting any side-effecting recommendation execute. The mode written via
    // PATCH /alloy/autonomy-mode wins over the per-call autonomyMode hint
    // unless an explicit override is requested.
    const persisted = getAutonomyMode(tenantOrgId, req.body.domain);
    const decision = evaluateAutonomyForAction(tenantOrgId, req.body.domain, {
      actionLabel: req.body.suggestedAction ?? req.body.title,
    });
    const effectiveMode = (req.body.autonomyMode as AutonomyMode | undefined) ?? persisted.mode;

    if (decision.disposition === "block") {
      logger.info(
        { tenantOrgId, domain: req.body.domain, mode: effectiveMode },
        "alloy.recommend.blocked-by-autonomy-mode",
      );
      return res.status(409).json({
        success: false,
        error: decision.policyReason ?? "Action blocked by autonomy mode",
        code: "AUTONOMY_BLOCKED",
        data: {
          policyState: decision.policyState,
          policyReason: decision.policyReason,
          mode: effectiveMode,
          domain: req.body.domain,
        },
      });
    }

    const { recommend: alloyRecommend } = await import("@szl/alloy");

    const result = await alloyRecommend({
      title: req.body.title,
      summary: req.body.summary,
      reasoning: req.body.reasoning,
      domain: req.body.domain,
      value: req.body.value,
      urgency: req.body.urgency,
      autonomyMode: req.body.autonomyMode,
      baseConfidence: req.body.baseConfidence,
      evidenceIds: req.body.evidenceIds,
      supportingEvidenceIds: req.body.supportingEvidenceIds,
      contradictingEvidenceIds: req.body.contradictingEvidenceIds,
      inlineEvidence: req.body.inlineEvidence,
      suggestedAction: req.body.suggestedAction,
      validForMs: req.body.validForMs,
      tenantOrgId,
      metadata: { ...(req.body.metadata ?? {}), tenantOrgId },
    });

    logger.info({ recommendationId: result.id, domain: result.domain, confidence: result.confidence, tenantOrgId }, "Recommendation generated via Alloy");
    return sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate recommendation");
  }
});

// ── Autonomy mode (per tenant + domain) ───────────────────────────────────

const autonomyModeSchema = z.object({
  domain: z.string().min(1).max(120).trim(),
  mode: z.enum(["observe", "recommend", "draft", "ask-to-act", "approved-act"]),
  reason: z.string().max(2000).trim().optional().nullable(),
});

router.get("/alloy/autonomy-mode", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const tenantOrgId = resolveAlloyTenant(req);
    const domain = (req.query.domain as string | undefined)?.trim();
    if (domain) {
      const record = getAutonomyMode(tenantOrgId, domain);
      const decision = evaluateAutonomyForAction(tenantOrgId, domain);
      return sendSuccess(res, { ...record, decision, modes: AUTONOMY_MODES });
    }
    const list = listAutonomyModes(tenantOrgId);
    return sendSuccess(res, { items: list, modes: AUTONOMY_MODES });
  } catch (err) {
    handleRouteError(res, err, "Failed to read autonomy mode");
  }
});

router.patch(
  "/alloy/autonomy-mode",
  authMiddleware(),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantOrgId = resolveAlloyTenant(req);
      const parsed = autonomyModeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, "Invalid autonomy mode payload", parsed.error.flatten());
        return;
      }
      const before = getAutonomyMode(tenantOrgId, parsed.data.domain);
      const updatedBy =
        req.user?.displayName ?? req.user?.email ?? (req.user?.id != null ? `user:${req.user.id}` : "anonymous");
      const record = setAutonomyMode({
        tenantOrgId,
        domain: parsed.data.domain,
        mode: parsed.data.mode as AutonomyMode,
        updatedBy,
        reason: parsed.data.reason ?? null,
      });
      await writeAudit({
        orgId: tenantOrgId ?? null,
        userId: req.user?.id ?? null,
        action: "set_autonomy_mode",
        resourceType: "alloy_autonomy_mode",
        resourceId: parsed.data.domain,
        before,
        after: record,
      });
      logger.info(
        { tenantOrgId, domain: record.domain, mode: record.mode, updatedBy },
        "alloy.autonomy-mode.updated",
      );
      const decision = evaluateAutonomyForAction(tenantOrgId, record.domain);
      return sendSuccess(res, { ...record, decision, modes: AUTONOMY_MODES });
    } catch (err) {
      handleRouteError(res, err, "Failed to update autonomy mode");
    }
  },
);

/**
 * Evaluate what would happen to a side-effecting action right now under the
 * current autonomy mode for (tenant, domain). ProofEnvelope surfaces use this
 * to decide whether to render the action as allowed, queued, or blocked.
 */
router.post(
  "/alloy/autonomy-mode/evaluate",
  authMiddleware(),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantOrgId = resolveAlloyTenant(req);
      const body = req.body as { domain?: string; actionLabel?: string };
      if (!body.domain) {
        sendBadRequest(res, "domain is required");
        return;
      }
      const decision = evaluateAutonomyForAction(tenantOrgId, body.domain, {
        actionLabel: body.actionLabel,
      });
      const record = getAutonomyMode(tenantOrgId, body.domain);
      return sendSuccess(res, { ...record, decision });
    } catch (err) {
      handleRouteError(res, err, "Failed to evaluate autonomy mode");
    }
  },
);

export default router;

import { Router, type IRouter } from "express";
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
} from "@workspace/db";
import { eq, desc, and, sql, inArray, gte, lte } from "drizzle-orm";
import { authMiddleware, requireRole, parseIdParam, type AuthenticatedUser } from "../middlewares/auth";
import { isFlagEnabled } from "../lib/platform-flags";
import { platformAuth, logPlatformEvent } from "../middlewares/platform-auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendError,
  sendNoContent,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
const router: IRouter = Router();

function getUserOrgIds(user?: AuthenticatedUser): number[] {
  if (!user) return [];
  return user.orgs.map(o => o.orgId);
}

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes("super_admin") || user.roles.includes("admin");
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

router.post("/alloy/ingest/signal", authMiddleware(), async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.source || !payload.sourceType || !payload.title) {
      sendBadRequest(res, "source, sourceType, and title are required");
      return;
    }
    const userOrgIds = getUserOrgIds(req.user);
    const resolvedOrgId = isGlobalAdmin(req.user) ? (payload.orgId ?? userOrgIds[0] ?? null) : (userOrgIds[0] ?? null);
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

router.post("/alloy/ingest/batch", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req, res) => {
  try {
    const { signals } = req.body as { signals: unknown[] };
    if (!Array.isArray(signals) || signals.length === 0) {
      sendBadRequest(res, "signals array is required and must be non-empty");
      return;
    }
    if (signals.length > 100) {
      sendBadRequest(res, "Batch size limited to 100 signals");
      return;
    }
    const parsed = signals.map((s: unknown) => insertAlloySignalSchema.parse(s));
    const inserted = await db.insert(alloySignalsTable).values(parsed).returning();
    sendCreated(res, { count: inserted.length, signals: inserted });
  } catch (err) {
    handleRouteError(res, err, "Failed to batch ingest signals");
  }
});

router.get("/alloy/signals", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const orgFilter = !isGlobalAdmin(req.user) && orgIds.length > 0 ? inArray(alloySignalsTable.orgId, orgIds) : undefined;
    const baseQuery = orgFilter ? db.select().from(alloySignalsTable).where(orgFilter) : db.select().from(alloySignalsTable);
    const rows = await baseQuery.orderBy(desc(alloySignalsTable.receivedAt)).limit(limit).offset(offset);
    const countQuery = orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloySignalsTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloySignalsTable);
    const [{ count }] = await countQuery;
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list signals");
  }
});

router.get("/alloy/workflows", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const orgFilter = !isGlobalAdmin(req.user) && orgIds.length > 0 ? inArray(alloyWorkflowsTable.orgId, orgIds) : undefined;
    const baseQuery = orgFilter ? db.select().from(alloyWorkflowsTable).where(orgFilter) : db.select().from(alloyWorkflowsTable);
    const rows = await baseQuery.orderBy(desc(alloyWorkflowsTable.createdAt)).limit(limit).offset(offset);
    const countQuery = orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable);
    const [{ count }] = await countQuery;
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
    if (!isGlobalAdmin(req.user) && row.orgId != null && !getUserOrgIds(req.user).includes(row.orgId)) { sendNotFound(res, "Workflow"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get workflow");
  }
});

router.post("/alloy/workflows", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req, res) => {
  try {
    const data = insertAlloyWorkflowSchema.parse(req.body);
    const userOrgIds = getUserOrgIds(req.user);
    const resolvedOrgId = isGlobalAdmin(req.user) ? (data.orgId ?? userOrgIds[0] ?? null) : (userOrgIds[0] ?? null);
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

router.patch("/alloy/workflows/:id", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [before] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!before) { sendNotFound(res, "Workflow"); return; }
    if (!isGlobalAdmin(req.user) && before.orgId != null && !getUserOrgIds(req.user).includes(before.orgId)) { sendNotFound(res, "Workflow"); return; }
    const allowed = ["name", "description", "trigger", "triggerConfig", "steps", "outputType", "requiresApproval", "approverRole", "isActive"];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const [row] = await db.update(alloyWorkflowsTable).set({ ...patch, updatedAt: new Date() }).where(eq(alloyWorkflowsTable.id, id)).returning();
    await writeAudit({ orgId: row.orgId, userId: req.user?.id, action: "update_workflow", resourceType: "alloy_workflow", resourceId: String(id), before, after: row });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update workflow");
  }
});

router.delete("/alloy/workflows/:id", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!existing) { sendNotFound(res, "Workflow"); return; }
    if (!isGlobalAdmin(req.user) && existing.orgId != null && !getUserOrgIds(req.user).includes(existing.orgId)) { sendNotFound(res, "Workflow"); return; }
    await db.delete(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete workflow");
  }
});

router.post("/alloy/workflows/:id/run", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [workflow] = await db.select().from(alloyWorkflowsTable).where(eq(alloyWorkflowsTable.id, id));
    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    if (!isGlobalAdmin(req.user) && workflow.orgId != null && !getUserOrgIds(req.user).includes(workflow.orgId)) { sendNotFound(res, "Workflow"); return; }
    if (!workflow.isActive) { sendBadRequest(res, "Workflow is not active"); return; }

    const [run] = await db.insert(alloyWorkflowRunsTable).values({
      workflowId: id,
      signalId: req.body.signalId ?? null,
      triggeredBy: req.user?.id ?? null,
      state: "queued",
      input: req.body.input ?? {},
      stateHistory: [{ state: "queued", at: new Date().toISOString(), by: req.user?.displayName ?? "system" }],
    }).returning();

    await db.update(alloyWorkflowsTable).set({ runCount: (workflow.runCount || 0) + 1, lastRunAt: new Date(), updatedAt: new Date() }).where(eq(alloyWorkflowsTable.id, id));

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
        await db.update(alloyWorkflowRunsTable).set({
          state: nextState,
          completedAt: requiresApproval ? undefined : completedAt,
          durationMs: completedAt.getTime() - now.getTime() + 500,
          output: artifactContent,
          stateHistory: [
            { state: "queued", at: run.queuedAt, by: "system" },
            { state: "running", at: now.toISOString(), by: "system" },
            { state: nextState, at: completedAt.toISOString(), by: "system" },
          ],
        }).where(eq(alloyWorkflowRunsTable.id, run.id));
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

router.get("/alloy/runs", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const stateFilter = typeof req.query.state === "string" ? req.query.state : null;
    const validStates = ["queued", "running", "waiting_approval", "completed", "failed", "canceled"];

    const stateCondition = stateFilter && validStates.includes(stateFilter)
      ? eq(alloyWorkflowRunsTable.state, stateFilter as "queued" | "running" | "waiting_approval" | "completed" | "failed" | "canceled")
      : undefined;

    if (!isGlobalAdmin(req.user)) {
      const orgIds = getUserOrgIds(req.user);
      if (orgIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      const allowedWorkflowIds = (await db
        .select({ id: alloyWorkflowsTable.id })
        .from(alloyWorkflowsTable)
        .where(inArray(alloyWorkflowsTable.orgId, orgIds)))
        .map(r => r.id);

      if (allowedWorkflowIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      const orgWorkflowFilter = inArray(alloyWorkflowRunsTable.workflowId, allowedWorkflowIds);
      const whereClause = stateCondition ? and(orgWorkflowFilter, stateCondition) : orgWorkflowFilter;
      const rows = await db.select().from(alloyWorkflowRunsTable).where(whereClause).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(limit).offset(offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable).where(whereClause);
      sendSuccess(res, rows, 200, { page, limit, total: count });
      return;
    }

    const rows = stateCondition
      ? await db.select().from(alloyWorkflowRunsTable).where(stateCondition).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(limit).offset(offset)
      : await db.select().from(alloyWorkflowRunsTable).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(limit).offset(offset);
    const [{ count }] = stateCondition
      ? await db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable).where(stateCondition)
      : await db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list runs");
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
      if (wf?.orgId != null && !orgIds.includes(wf.orgId)) {
        sendNotFound(res, "Run"); return;
      }
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get run");
  }
});

router.post("/alloy/runs/:id/retry", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!run) { sendNotFound(res, "Run"); return; }
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
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to retry run");
  }
});

router.post("/alloy/runs/:id/cancel", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(alloyWorkflowRunsTable).where(eq(alloyWorkflowRunsTable.id, id));
    if (!run) { sendNotFound(res, "Run"); return; }
    const check = transitionRunState(run.state, "canceled");
    if (!check.valid) { sendBadRequest(res, check.message ?? "Cannot cancel run in current state"); return; }
    const [updated] = await db.update(alloyWorkflowRunsTable).set({ state: "canceled" }).where(eq(alloyWorkflowRunsTable.id, id)).returning();
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to cancel run");
  }
});

router.get("/alloy/artifacts", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const orgFilter = !isGlobalAdmin(req.user) && orgIds.length > 0 ? inArray(alloyArtifactsTable.orgId, orgIds) : undefined;
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
    if (!isGlobalAdmin(req.user) && row.orgId != null && !getUserOrgIds(req.user).includes(row.orgId)) { sendNotFound(res, "Artifact"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get artifact");
  }
});

router.post("/alloy/artifacts/:id/approve", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [artifact] = await db.select().from(alloyArtifactsTable).where(eq(alloyArtifactsTable.id, id));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    if (!isGlobalAdmin(req.user) && artifact.orgId != null && !getUserOrgIds(req.user).includes(artifact.orgId)) { sendNotFound(res, "Artifact"); return; }
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

router.post("/alloy/artifacts/:id/reject", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [artifact] = await db.select().from(alloyArtifactsTable).where(eq(alloyArtifactsTable.id, id));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    if (!isGlobalAdmin(req.user) && artifact.orgId != null && !getUserOrgIds(req.user).includes(artifact.orgId)) { sendNotFound(res, "Artifact"); return; }
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

router.get("/alloy/approvals", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(alloyApprovalsTable).orderBy(desc(alloyApprovalsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(alloyApprovalsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals");
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

router.post("/alloy/admin/flags", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const { key, name, description, isEnabled, rolloutPercentage, conditions } = req.body;
    if (!key || !name) { sendBadRequest(res, "key and name are required"); return; }
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

router.patch("/alloy/admin/flags/:key", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const key = req.params.key;
    const [existing] = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, key));
    if (!existing) { sendNotFound(res, "Feature flag"); return; }
    const [updated] = await db.update(featureFlagsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(featureFlagsTable.key, key)).returning();
    await writeAudit({ userId: req.user?.id, action: "update_feature_flag", resourceType: "feature_flag", resourceId: key, before: existing, after: updated });
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

router.get("/alloy/audit", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const orgIds = getUserOrgIds(req.user);
    const orgFilter = !isGlobalAdmin(req.user) && orgIds.length > 0 ? inArray(alloyAuditLogTable.orgId, orgIds) : undefined;
    const baseQuery = orgFilter ? db.select().from(alloyAuditLogTable).where(orgFilter) : db.select().from(alloyAuditLogTable);
    const rows = await baseQuery.orderBy(desc(alloyAuditLogTable.createdAt)).limit(limit).offset(offset);
    const countQuery = orgFilter ? db.select({ count: sql<number>`count(*)::int` }).from(alloyAuditLogTable).where(orgFilter) : db.select({ count: sql<number>`count(*)::int` }).from(alloyAuditLogTable);
    const [{ count }] = await countQuery;
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list audit log");
  }
});

router.get("/alloy/dashboard", authMiddleware(), async (_req, res) => {
  try {
    const [
      workflowCount,
      runCount,
      artifactCount,
      pendingApprovalCount,
      recentRuns,
      recentArtifacts,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(alloyWorkflowRunsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(alloyArtifactsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(alloyApprovalsTable).where(eq(alloyApprovalsTable.status, "pending")).then(r => r[0]?.count ?? 0),
      db.select().from(alloyWorkflowRunsTable).orderBy(desc(alloyWorkflowRunsTable.queuedAt)).limit(10),
      db.select().from(alloyArtifactsTable).orderBy(desc(alloyArtifactsTable.createdAt)).limit(5),
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

export default router;

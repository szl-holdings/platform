import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  platformSignalsTable,
  workflowsTable,
  workflowRunsTable,
  approvalsTable,
  actionsTable,
  artifactsTable,
  eventLogTable,
  featureFlagsTable,
  type InsertWorkflowRun,
  type InsertArtifact,
  type InsertEventLog,
  type InsertApproval,
  type InsertAction,
} from "@workspace/db";
import { eq, desc, and, sql, inArray, gte, lte } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { platformAuth, logPlatformEvent } from "../middlewares/platform-auth";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";
import { logger } from "../lib/logger";
const router: IRouter = Router();


// ─── Health / Status ──────────────────────────────────────────────────────────

router.get("/alloy/status", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const [signalCount] = await db.select({ count: sql<number>`count(*)` }).from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId), eq(platformSignalsTable.product, "alloy")));
    const [workflowCount] = await db.select({ count: sql<number>`count(*)` }).from(workflowsTable).where(and(eq(workflowsTable.orgId, orgId), eq(workflowsTable.product, "alloy")));
    const [artifactCount] = await db.select({ count: sql<number>`count(*)` }).from(artifactsTable).where(and(eq(artifactsTable.orgId, orgId), eq(artifactsTable.product, "alloy")));
    const [pendingApprovals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalsTable)
      .where(and(eq(approvalsTable.orgId, orgId), eq(approvalsTable.status, "pending")));

    sendSuccess(res, {
      engine: "alloy",
      version: "2.0.0 (Canonical)",
      status: "operational",
      orgId,
      stats: {
        signals: Number(signalCount?.count ?? 0),
        workflows: Number(workflowCount?.count ?? 0),
        artifacts: Number(artifactCount?.count ?? 0),
        pendingApprovals: Number(pendingApprovals?.count ?? 0),
      },
    });
  } catch (err) { handleRouteError(res, err, "Failed to get Alloy status"); }
});

// ─── Signal Ingestion ─────────────────────────────────────────────────────────

router.post("/alloy/signals/ingest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const { source, externalId, title, body, signalType, severity, payload, valueAtRisk, product = "alloy" } = req.body;

    if (!title) { sendError(res, "title is required", 400); return; }

    const [signal] = await db.insert(platformSignalsTable).values({
      orgId,
      product,
      source: source || "manual",
      sourceType: "ingest",
      externalId: externalId || `manual-${Date.now()}`,
      title,
      body: body || null,
      severity: severity || "medium",
      status: "new",
      metadata: payload || {},
      valueAtRisk: valueAtRisk ? String(valueAtRisk) : null,
      detectedAt: new Date(),
    }).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "signal.ingested", "signal", String(signal.id), "alloy");

    sendCreated(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest signal");
  }
});

router.post("/alloy/signals/batch", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const signals = req.body;

    if (!Array.isArray(signals)) {
      sendError(res, 400, "Body must be an array of signals");
      return;
    }
    if (signals.length === 0 || signals.length > 100) {
      sendError(res, "Batch must contain 1–100 signals", 400);
      return;
    }

    const inserted = await db.insert(platformSignalsTable).values(
      signals.map(s => ({
        orgId,
        product: s.product || "alloy",
        source: s.source || "batch",
        sourceType: "ingest" as const,
        externalId: s.externalId || `batch-${crypto.randomUUID()}`,
        title: s.title || "Untitled Signal",
        severity: s.severity || "medium",
        status: "new" as const,
        metadata: s.payload || {},
        valueAtRisk: s.valueAtRisk ? String(s.valueAtRisk) : null,
        detectedAt: new Date(),
      }))
    ).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "signal.batch_ingested", "signal", `batch:${inserted.length}`, "alloy");

    sendCreated(res, inserted);
  } catch (err) {
    handleRouteError(res, err, "Failed to batch ingest signals");
  }
});

// ─── Canonical Ingest Endpoints ───────────────────────────────────────────────
// These are the task-specified canonical paths, using the platform schema

router.post(
  "/alloy/ingest/signal",
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const orgId = resolveOrgId(req, user);
      const { source, title, body, severity, valueAtRisk, product = "alloy", metadata } = req.body as {
        source?: string;
        title: string;
        body?: string;
        severity?: "info" | "low" | "medium" | "high" | "critical";
        valueAtRisk?: number;
        product?: string;
        metadata?: Record<string, unknown>;
      };

      if (!title) { sendError(res, "title is required", 400); return; }

      const [signal] = await db.insert(platformSignalsTable).values({
        orgId,
        product,
        source: source ?? "api",
        sourceType: "ingest",
        externalId: `ingest-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
        title,
        body: body ?? null,
        severity: severity ?? "medium",
        status: "new",
        metadata: metadata ?? {},
        valueAtRisk: valueAtRisk != null ? String(valueAtRisk) : null,
        detectedAt: new Date(),
      }).returning();

      logPlatformEvent(orgId, user.id, user.displayName, "signal.ingested", "signal", String(signal.id), "alloy");

      sendCreated(res, { signal });
    } catch (err) { handleRouteError(res, err, "Signal ingestion failed"); }
  },
);

router.post(
  "/alloy/ingest/batch",
  authMiddleware(),
  requireRole("super_admin", "ops", "analyst"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const orgId = resolveOrgId(req, user);
      const { signals: rawSignals, product = "alloy" } = req.body as {
        signals: Array<{ source?: string; title: string; body?: string; severity?: string; valueAtRisk?: number; metadata?: Record<string, unknown> }>;
        product?: string;
      };

      if (!Array.isArray(rawSignals) || rawSignals.length === 0) {
        sendError(res, "signals array is required and must not be empty", 400);
        return;
      }
      if (rawSignals.length > 100) {
        sendError(res, "Batch size cannot exceed 100 signals", 400);
        return;
      }

      const inserted = await db.insert(platformSignalsTable).values(
        rawSignals.map(s => ({
          orgId,
          product,
          source: s.source ?? "batch",
          sourceType: "ingest" as const,
          externalId: `batch-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          title: s.title,
          body: s.body ?? null,
          severity: (s.severity as "info" | "low" | "medium" | "high" | "critical") ?? "medium",
          status: "new" as const,
          metadata: s.metadata ?? {},
          valueAtRisk: s.valueAtRisk != null ? String(s.valueAtRisk) : null,
          detectedAt: new Date(),
        }))
      ).returning();

      logPlatformEvent(orgId, user.id, user.displayName, "signal.batch_ingested", "signal", `batch:${inserted.length}`, "alloy");

      sendSuccess(res, { results: inserted, total: rawSignals.length, ingested: inserted.length });
    } catch (err) { handleRouteError(res, err, "Batch ingestion failed"); }
  },
);

// ─── Workflow Management ──────────────────────────────────────────────────────

router.get("/alloy/workflows", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const results = await db.select().from(workflowsTable).where(
      and(
        eq(workflowsTable.orgId, orgId),
        eq(workflowsTable.product, "alloy")
      )
    ).orderBy(desc(workflowsTable.updatedAt));

    sendSuccess(res, results);
  } catch (err) {
    handleRouteError(res, err, "Failed to list workflows");
  }
});

router.post("/alloy/workflows", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const [workflow] = await db.insert(workflowsTable).values({
      ...req.body,
      orgId,
      product: "alloy",
      status: "active",
    }).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "workflow.created", "workflow", String(workflow.id), "alloy");
    sendCreated(res, workflow);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workflow");
  }
});

router.get("/alloy/workflows/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    const [workflow] = await db.select().from(workflowsTable).where(and(eq(workflowsTable.id, id), eq(workflowsTable.orgId, orgId)));
    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to get workflow"); }
});

router.patch("/alloy/workflows/:id", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    const [workflow] = await db.update(workflowsTable).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(and(eq(workflowsTable.id, id), eq(workflowsTable.orgId, orgId))).returning();

    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    logPlatformEvent(orgId, user.id, user.displayName, "workflow.updated", "workflow", String(workflow.id), "alloy");
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to update workflow"); }
});

// ─── Workflow Runs ────────────────────────────────────────────────────────────

router.get("/alloy/runs", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const status = req.query.status as string | undefined;

    const conditions: ReturnType<typeof eq>[] = [eq(workflowRunsTable.orgId, orgId)];
    if (status) conditions.push(eq(workflowRunsTable.status, status as typeof workflowRunsTable.$inferSelect["status"]));

    const results = await db.select().from(workflowRunsTable)
      .where(and(...conditions))
      .orderBy(desc(workflowRunsTable.createdAt))
      .limit(limit);

    sendSuccess(res, results);
  } catch (err) { handleRouteError(res, err, "Failed to list runs"); }
});

router.get("/alloy/runs/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { sendError(res, "Invalid run ID", 400); return; }

    const [run] = await db.select().from(workflowRunsTable).where(and(eq(workflowRunsTable.id, id), eq(workflowRunsTable.orgId, orgId)));
    if (!run) { sendNotFound(res, "Run"); return; }
    sendSuccess(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to get run"); }
});

router.post("/alloy/runs", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const [run] = await db.insert(workflowRunsTable).values({
      ...req.body,
      orgId,
      status: "running",
      triggeredBy: user.id,
      startedAt: new Date(),
    }).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "workflow_run.started", "workflow_run", String(run.id), "alloy");
    sendCreated(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to start run"); }
});

router.patch("/alloy/runs/:id", authMiddleware(), requireRole("super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    const { status, output, errorMessage } = req.body;

    const updateData: Record<string, unknown> = { status, output, errorMessage, updatedAt: new Date() };
    if (status === "completed" || status === "failed") {
      updateData.completedAt = new Date();
    }

    const [run] = await db.update(workflowRunsTable).set(updateData)
      .where(and(eq(workflowRunsTable.id, id), eq(workflowRunsTable.orgId, orgId)))
      .returning();
    if (!run) { sendNotFound(res, "Run"); return; }

    logPlatformEvent(orgId, user.id, user.displayName, `workflow_run.${status}`, "workflow_run", String(run.id), "alloy");
    sendSuccess(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to update run"); }
});

router.post("/alloy/runs/:id/retry", authMiddleware(), requireRole("super_admin", "ops"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { sendError(res, "Invalid run ID", 400); return; }

    const [existing] = await db.select().from(workflowRunsTable).where(and(eq(workflowRunsTable.id, id), eq(workflowRunsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Run"); return; }

    if (!["failed", "cancelled"].includes(existing.status)) {
      sendError(res, `Run cannot be retried from status '${existing.status}'`, 409);
      return;
    }

    if (existing.retryCount >= existing.maxRetries) {
      sendError(res, `Run has reached max retries (${existing.maxRetries})`, 409);
      return;
    }

    const [updated] = await db.update(workflowRunsTable).set({
      status: "retrying",
      retryCount: existing.retryCount + 1,
      errorMessage: null,
      startedAt: new Date(),
      completedAt: null,
    }).where(eq(workflowRunsTable.id, id)).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "workflow_run.retried", "workflow_run", String(id), "alloy");
    sendSuccess(res, { run: updated, retryCount: updated.retryCount });
  } catch (err) { handleRouteError(res, err, "Failed to retry run"); }
});

router.post("/alloy/runs/:id/cancel", authMiddleware(), requireRole("super_admin", "ops"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { sendError(res, "Invalid run ID", 400); return; }

    const [existing] = await db.select().from(workflowRunsTable).where(and(eq(workflowRunsTable.id, id), eq(workflowRunsTable.orgId, orgId)));
    if (!existing) { sendNotFound(res, "Run"); return; }

    if (!["queued", "running", "retrying"].includes(existing.status)) {
      sendError(res, `Run cannot be cancelled from status '${existing.status}'`, 409);
      return;
    }

    const [updated] = await db.update(workflowRunsTable).set({
      status: "cancelled",
      completedAt: new Date(),
    }).where(eq(workflowRunsTable.id, id)).returning();

    logPlatformEvent(orgId, user.id, user.displayName, "workflow_run.cancelled", "workflow_run", String(id), "alloy");
    sendSuccess(res, { run: updated, cancelled: true });
  } catch (err) { handleRouteError(res, err, "Failed to cancel run"); }
});

// ─── Artifacts & Approvals ────────────────────────────────────────────────────

router.get("/alloy/artifacts", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const results = await db.select().from(artifactsTable).where(and(eq(artifactsTable.orgId, orgId), eq(artifactsTable.product, "alloy"))).orderBy(desc(artifactsTable.createdAt));
    sendSuccess(res, results);
  } catch (err) { handleRouteError(res, err, "Failed to list artifacts"); }
});

router.get("/alloy/artifacts/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { sendError(res, "Invalid artifact ID", 400); return; }

    const [artifact] = await db.select().from(artifactsTable).where(and(eq(artifactsTable.id, id), eq(artifactsTable.orgId, orgId)));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    sendSuccess(res, artifact);
  } catch (err) { handleRouteError(res, err, "Failed to get artifact"); }
});

router.post("/alloy/artifacts/:id/approve", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);

    const [artifact] = await db.select().from(artifactsTable).where(and(eq(artifactsTable.id, id), eq(artifactsTable.orgId, orgId)));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }

    if (artifact.status !== "pending") {
      sendError(res, `Artifact status is already '${artifact.status}'`, 409);
      return;
    }

    const [updated] = await db.update(artifactsTable).set({
      status: "approved",
      approvedBy: user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(artifactsTable.id, id), eq(artifactsTable.orgId, orgId))).returning();

    if (!updated) { sendNotFound(res, "Artifact"); return; }

    logAlloyEvent(orgId, user.id, user.displayName, "artifact.approved", "artifact", String(id));
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to approve artifact");
  }
});

router.post("/alloy/artifacts/:id/reject", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const id = parseInt(req.params.id, 10);

    const [artifact] = await db.select().from(artifactsTable).where(and(eq(artifactsTable.id, id), eq(artifactsTable.orgId, orgId)));
    if (!artifact) { sendNotFound(res, "Artifact"); return; }

    if (artifact.status !== "pending") {
      sendError(res, `Artifact status is already '${artifact.status}'`, 409);
      return;
    }

    const { reason } = req.body as { reason?: string };
    const [updated] = await db.update(artifactsTable).set({
      status: "rejected",
      rejectedAt: new Date(),
      updatedAt: new Date(),
      metadata: { ...((artifact.metadata as Record<string, unknown>) ?? {}), rejectionReason: reason ?? null },
    }).where(and(eq(artifactsTable.id, id), eq(artifactsTable.orgId, orgId))).returning();

    if (!updated) { sendNotFound(res, "Artifact"); return; }
    logAlloyEvent(orgId, user.id, user.displayName, "artifact.rejected", "artifact", String(id));
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to reject artifact");
  }
});

// ─── Admin: Feature Flags ─────────────────────────────────────────────────────

router.get("/alloy/admin/flags", authMiddleware(), requireRole("super_admin", "ops"), async (req: Request, res: Response) => {
  try {
    const flags = await db.select().from(featureFlagsTable).where(
      sql`${featureFlagsTable.product} = 'alloy' OR ${featureFlagsTable.scope} = 'global'`
    ).orderBy(featureFlagsTable.key);

    sendSuccess(res, flags);
  } catch (err) {
    handleRouteError(res, err, "Failed to list feature flags");
  }
});

router.post("/alloy/admin/flags", authMiddleware(), requireRole("super_admin", "ops"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { key, name, description, isEnabled, rolloutPercentage } = req.body as {
      key?: string;
      name?: string;
      description?: string;
      isEnabled?: boolean;
      rolloutPercentage?: number;
    };

    if (!key || !name) { sendError(res, "key and name are required", 400); return; }

    const [existing] = await db.select({ id: featureFlagsTable.id }).from(featureFlagsTable).where(eq(featureFlagsTable.key, key)).limit(1);
    if (existing) { sendError(res, `Feature flag '${key}' already exists`, 409); return; }

    const [flag] = await db.insert(featureFlagsTable).values({
      key,
      name,
      description: description ?? null,
      isEnabled: isEnabled ?? false,
      rolloutPercentage: rolloutPercentage ?? 0,
    }).returning();

    logAlloyEvent(0, user.id, user.displayName, "feature_flag.created", "feature_flag", key);
    sendCreated(res, flag);
  } catch (err) { handleRouteError(res, err, "Failed to create feature flag"); }
});

router.patch("/alloy/admin/flags/:key", authMiddleware(), requireRole("super_admin", "ops"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const key = req.params.key;
    const [flag] = await db.update(featureFlagsTable).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(featureFlagsTable.key, key)).returning();

    if (!flag) { sendNotFound(res, "Feature flag"); return; }
    logAlloyEvent(0, user.id, user.displayName, "feature_flag.updated", "feature_flag", key);
    sendSuccess(res, flag);
  } catch (err) {
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

router.get("/alloy/audit", authMiddleware(), requireRole("super_admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);
    const limit = Math.min(parseInt(req.query.limit as string || "100", 10), 500);
    const eventType = req.query.eventType as string | undefined;
    const actorId = req.query.actorId ? parseInt(req.query.actorId as string, 10) : undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const conditions: ReturnType<typeof eq>[] = [
      eq(eventLogTable.orgId, orgId),
      eq(eventLogTable.product, "alloy"),
    ];
    if (eventType) conditions.push(eq(eventLogTable.eventType, eventType));
    if (actorId && !isNaN(actorId)) conditions.push(eq(eventLogTable.actorId, actorId));
    if (fromDate && !isNaN(fromDate.getTime())) conditions.push(gte(eventLogTable.createdAt, fromDate));
    if (toDate && !isNaN(toDate.getTime())) conditions.push(lte(eventLogTable.createdAt, toDate));

    const entries = await db.select().from(eventLogTable).where(
      and(...conditions)
    ).orderBy(desc(eventLogTable.createdAt)).limit(limit);

    sendSuccess(res, entries);
  } catch (err) {
    handleRouteError(res, err, "Failed to get audit log");
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get("/alloy/dashboard", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = resolveOrgId(req, user);

    const [signals, workflows, runs, artifacts, approvals] = await Promise.all([
      db.select().from(platformSignalsTable).where(and(eq(platformSignalsTable.orgId, orgId), eq(platformSignalsTable.product, "alloy"))).orderBy(desc(platformSignalsTable.detectedAt)).limit(20),
      db.select().from(workflowsTable).where(and(eq(workflowsTable.orgId, orgId), eq(workflowsTable.product, "alloy"))),
      db.select().from(workflowRunsTable).where(eq(workflowRunsTable.orgId, orgId)).orderBy(desc(workflowRunsTable.createdAt)).limit(10),
      db.select().from(artifactsTable).where(and(eq(artifactsTable.orgId, orgId), eq(artifactsTable.product, "alloy"))).orderBy(desc(artifactsTable.createdAt)).limit(10),
      db.select().from(approvalsTable).where(and(eq(approvalsTable.orgId, orgId), eq(approvalsTable.status, "pending"))),
    ]);

    const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "new");
    const highSignals = signals.filter(s => s.severity === "high" && s.status === "new");
    const activeWorkflows = workflows.filter(w => w.status === "active");
    const runningRuns = runs.filter(r => r.status === "running");

    const totalValueAtRisk = signals
      .filter(s => s.valueAtRisk && s.status !== "resolved")
      .reduce((sum, s) => sum + parseFloat(s.valueAtRisk ?? "0"), 0);

    sendSuccess(res, {
      summary: {
        totalSignals: signals.length,
        criticalSignals: criticalSignals.length,
        highSignals: highSignals.length,
        activeWorkflows: activeWorkflows.length,
        runningWorkflowRuns: runningRuns.length,
        pendingApprovals: approvals.length,
        pendingArtifacts: artifacts.filter(a => a.status === "pending").length,
        totalValueAtRisk: Math.round(totalValueAtRisk),
      },
      recentSignals: signals.slice(0, 5),
      activeWorkflows: activeWorkflows.slice(0, 5),
      recentRuns: runs.slice(0, 5),
      pendingArtifacts: artifacts.filter(a => a.status === "pending").slice(0, 5),
      pendingApprovals: approvals.slice(0, 5),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build alloy dashboard");
  }
});

// ─── Org Membership (caller's view) ──────────────────────────────────────────

router.get("/alloy/org/memberships", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    sendSuccess(res, {
      userId: user.id,
      orgs: user.orgs,
    });
  } catch (err) { handleRouteError(res, err, "Failed to get org memberships"); }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveOrgId(req: Request, user: NonNullable<Request["user"]>): number {
  const qOrgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
  if (qOrgId && !isNaN(qOrgId)) return qOrgId;
  if (user.orgs.length > 0) return user.orgs[0]!.orgId;
  return 1;
}

function logAlloyEvent(orgId: number, userId: number | null, userName: string, eventType: string, targetType: string, targetId: string) {
  try {
    db.insert(eventLogTable).values({
      orgId: orgId > 0 ? orgId : null,
      actorId: userId,
      actorName: userName,
      eventType,
      entityType: targetType,
      entityId: targetId,
      product: "alloy",
    }).execute().catch(err => logger.error({ err }, "Failed to log alloy event async"));
  } catch (err) {
    logger.error({ err }, "Failed to log alloy event");
  }
}

export default router;

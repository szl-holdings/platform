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
import { eq, desc, and, sql, inArray } from "drizzle-orm";
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

// Legacy /alloy namespace (maintaining for backward compatibility during transition)
// New routes below are org-aware and use platform-auth middleware

// ─── Health / Status ──────────────────────────────────────────────────────────

router.get("/alloy/status", async (_req: Request, res: Response) => {
  try {
    const orgId = _req.query.orgId ? parseInt(_req.query.orgId as string, 10) : 1;
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

router.post("/alloy/signals/ingest", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const { source, externalId, signalType, severity, payload, valueAtRisk, product = "alloy" } = req.body;

    const [signal] = await db.insert(platformSignalsTable).values({
      orgId,
      product,
      source: source || "manual",
      externalId: externalId || `manual-${Date.now()}`,
      signalType: signalType || "generic_observation",
      severity: severity || "medium",
      status: "new",
      payload: payload || {},
      valueAtRisk: valueAtRisk ? String(valueAtRisk) : null,
      detectedAt: new Date(),
    }).returning();

    logPlatformEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.ingested", "signal", String(signal.id), "alloy");

    sendCreated(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest signal");
  }
});

router.post("/alloy/signals/batch", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const signals = req.body;

    if (!Array.isArray(signals)) {
      sendError(res, 400, "Body must be an array of signals");
      return;
    }

    const inserted = await db.insert(platformSignalsTable).values(
      signals.map(s => ({
        orgId,
        product: s.product || "alloy",
        source: s.source || "batch",
        externalId: s.externalId || `batch-${crypto.randomUUID()}`,
        signalType: s.signalType || "generic_observation",
        severity: s.severity || "medium",
        status: "new",
        payload: s.payload || {},
        valueAtRisk: s.valueAtRisk ? String(s.valueAtRisk) : null,
        detectedAt: new Date(),
      }))
    ).returning();

    logPlatformEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "signal.batch_ingested", "signal", `batch:${inserted.length}`, "alloy");

    sendCreated(res, inserted);
  } catch (err) {
    handleRouteError(res, err, "Failed to batch ingest signals");
  }
});

// ─── Workflow Management ──────────────────────────────────────────────────────

router.get("/alloy/workflows", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
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

router.post("/alloy/workflows", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [workflow] = await db.insert(workflowsTable).values({
      ...req.body,
      orgId,
      product: "alloy",
      status: "active",
    }).returning();

    logPlatformEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "workflow.created", "workflow", String(workflow.id), "alloy");
    sendCreated(res, workflow);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workflow");
  }
});

router.get("/alloy/workflows/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, id));
    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to get workflow"); }
});

router.patch("/alloy/workflows/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [workflow] = await db.update(workflowsTable).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(workflowsTable.id, id)).returning();

    if (!workflow) { sendNotFound(res, "Workflow"); return; }
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to update workflow"); }
});

// ─── Workflow Runs ────────────────────────────────────────────────────────────

router.get("/alloy/runs", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const results = await db.select().from(workflowRunsTable).where(eq(workflowRunsTable.orgId, orgId)).orderBy(desc(workflowRunsTable.createdAt));
    sendSuccess(res, results);
  } catch (err) { handleRouteError(res, err, "Failed to list runs"); }
});

router.post("/alloy/runs", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [run] = await db.insert(workflowRunsTable).values({
      ...req.body,
      orgId,
      status: "running",
      startedAt: new Date(),
    }).returning();

    logPlatformEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "workflow_run.started", "workflow_run", String(run.id), "alloy");
    sendCreated(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to start run"); }
});

router.patch("/alloy/runs/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, results, error } = req.body;

    const updateData: any = { status, results, error, updatedAt: new Date() };
    if (status === "completed" || status === "failed") {
      updateData.completedAt = new Date();
    }

    const [run] = await db.update(workflowRunsTable).set(updateData).where(eq(workflowRunsTable.id, id)).returning();
    if (!run) { sendNotFound(res, "Run"); return; }

    logPlatformEvent(run.orgId, req.user?.id ?? null, req.user?.displayName ?? "system", `workflow_run.${status}`, "workflow_run", String(run.id), "alloy");
    sendSuccess(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to update run"); }
});

// ─── Artifacts & Approvals ────────────────────────────────────────────────────

router.get("/alloy/artifacts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const results = await db.select().from(artifactsTable).where(and(eq(artifactsTable.orgId, orgId), eq(artifactsTable.product, "alloy"))).orderBy(desc(artifactsTable.createdAt));
    sendSuccess(res, results);
  } catch (err) { handleRouteError(res, err, "Failed to list artifacts"); }
});

router.post("/alloy/artifacts/:id/approve", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [artifact] = await db.update(artifactsTable).set({
      status: "approved",
      updatedAt: new Date(),
    }).where(eq(artifactsTable.id, id)).returning();

    if (!artifact) { sendNotFound(res, "Artifact"); return; }

    logAlloyEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "artifact.approved", "artifact", String(id));
    sendSuccess(res, artifact);
  } catch (err) {
    handleRouteError(res, err, "Failed to approve artifact");
  }
});

router.post("/alloy/artifacts/:id/reject", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const [artifact] = await db.update(artifactsTable).set({
      status: "rejected",
      updatedAt: new Date(),
    }).where(eq(artifactsTable.id, id)).returning();

    if (!artifact) { sendNotFound(res, "Artifact"); return; }
    logAlloyEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "artifact.rejected", "artifact", String(id));
    sendSuccess(res, artifact);
  } catch (err) {
    handleRouteError(res, err, "Failed to reject artifact");
  }
});

router.get("/alloy/admin/flags", authMiddleware({ required: false }), async (req, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable).where(
      sql`${featureFlagsTable.product} = 'alloy' OR ${featureFlagsTable.scope} = 'global'`
    ).orderBy(featureFlagsTable.key);

    sendSuccess(res, flags);
  } catch (err) {
    handleRouteError(res, err, "Failed to list feature flags");
  }
});

router.patch("/alloy/admin/flags/:key", authMiddleware({ required: false }), async (req, res) => {
  try {
    const key = req.params.key;
    const [flag] = await db.update(featureFlagsTable).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(featureFlagsTable.key, key)).returning();

    if (!flag) { sendNotFound(res, "Feature flag"); return; }
    sendSuccess(res, flag);
  } catch (err) {
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

router.get("/alloy/audit", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const limit = Math.min(parseInt(req.query.limit as string || "100", 10), 500);
    const eventType = req.query.eventType as string | undefined;

    const entries = await db.select().from(eventLogTable).where(
      and(
        eq(eventLogTable.orgId, orgId),
        eq(eventLogTable.product, "alloy"),
        eventType ? eq(eventLogTable.eventType, eventType) : undefined,
      )
    ).orderBy(desc(eventLogTable.createdAt)).limit(limit);

    sendSuccess(res, entries);
  } catch (err) {
    handleRouteError(res, err, "Failed to get audit log");
  }
});

router.get("/alloy/dashboard", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

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

// Helper for local event logging if not defined in platform-auth
function logAlloyEvent(orgId: number, userId: number | null, userName: string, eventType: string, targetType: string, targetId: string) {
  try {
    db.insert(eventLogTable).values({
      orgId,
      userId,
      userName,
      eventType,
      targetType,
      targetId,
      product: "alloy",
      payload: {},
    }).execute().catch(err => logger.error({ err }, "Failed to log alloy event async"));
  } catch (err) {
    logger.error({ err }, "Failed to log alloy event");
  }
}

export default router;

import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  alloySignals,
  alloyWorkflows,
  alloyWorkflowRuns,
  alloyApprovals,
  alloyActions,
  alloyArtifacts,
  alloyAuditLog,
  alloyOwners,
  type InsertAlloyWorkflow,
  type InsertAlloyArtifact,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { normalizeSignal, scoreSignalRules } from "../lib/alloy-normalization";
import {
  processSignalIntoWorkflow,
  reviewApproval,
  generateArtifact,
  writeAuditLog,
  requestApproval,
  ALLOY_JOB_TYPES,
} from "../lib/alloy-orchestration";
import { jobQueue } from "../lib/job-queue";
import { ENV_CONFIG } from "../lib/env-config";
import { logger } from "../lib/logger";

const alloyRouter: IRouter = Router();

function parseIntParam(val: string | undefined, fallback: number): number {
  const n = parseInt(val ?? "", 10);
  return isNaN(n) || n < 1 ? fallback : n;
}

function verifyWebhookSignature(req: Request & { rawBody?: Buffer }, secret: string): boolean {
  const signature = req.headers["x-alloy-signature"] as string | undefined;
  if (!signature) return false;

  const bodyBytes = req.rawBody ?? Buffer.from(JSON.stringify(req.body), "utf-8");
  const expected = crypto.createHmac("sha256", secret).update(bodyBytes).digest("hex");
  const expectedHeader = `sha256=${expected}`;

  try {
    return signature.length === expectedHeader.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHeader));
  } catch {
    return false;
  }
}

// ─── Row-Level Scoping Helpers ────────────────────────────────────────────────

const ELEVATED_ROLES = new Set(["super_admin", "ops", "exec", "compliance"]);

function canAccessRecord(req: Request, recordOwnerUserId: number | null | undefined): boolean {
  const user = req.user;
  if (!user) return false;

  if (user.roles.some(r => ELEVATED_ROLES.has(r))) {
    return true;
  }

  return recordOwnerUserId != null && recordOwnerUserId === user.id;
}

// ─── Health / Status ──────────────────────────────────────────────────────────

alloyRouter.get("/alloy/status", async (_req: Request, res: Response) => {
  try {
    const [signalCount] = await db.select({ count: sql<number>`count(*)` }).from(alloySignals);
    const [workflowCount] = await db.select({ count: sql<number>`count(*)` }).from(alloyWorkflows);
    const [artifactCount] = await db.select({ count: sql<number>`count(*)` }).from(alloyArtifacts);
    const [pendingApprovals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alloyApprovals)
      .where(eq(alloyApprovals.status, "pending"));

    sendSuccess(res, {
      engine: "alloy",
      version: "1.0.0",
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

alloyRouter.post("/alloy/signals/webhook", async (req: Request, res: Response) => {
  try {
    const {
      source, domain, title, summary, rawPayload, tags, environment,
    } = req.body as {
      source?: string;
      domain?: string;
      title?: string;
      summary?: string;
      rawPayload?: Record<string, unknown>;
      tags?: string[];
      environment?: "development" | "staging" | "production";
    };

    if (!title || !domain) {
      sendError(res, "title and domain are required", 400);
      return;
    }

    if (ENV_CONFIG.alloy.enableWebhookSignatureVerification) {
      const webhookSecret = process.env.ALLOY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.warn("ALLOY_WEBHOOK_SECRET not configured in production — rejecting webhook");
        sendError(res, "Webhook signing not configured", 503);
        return;
      }
      if (!verifyWebhookSignature(req, webhookSecret)) {
        sendError(res, "Invalid webhook signature", 401);
        return;
      }
    }

    const normalized = normalizeSignal({
      source: source ?? "webhook",
      sourceType: "webhook",
      domain,
      title,
      summary,
      rawPayload,
      tags,
      environment,
    });

    const dedupeKey = crypto.createHash("sha256")
      .update(`${domain}:${title}:${source ?? "webhook"}`)
      .digest("hex")
      .slice(0, 32);

    const [signal] = await db
      .insert(alloySignals)
      .values({ ...normalized, dedupeKey })
      .onConflictDoNothing()
      .returning();

    if (!signal) {
      sendSuccess(res, { deduplicated: true, message: "Signal already ingested (dedup key match)" });
      return;
    }

    const rules = scoreSignalRules(normalized);
    await db.update(alloySignals)
      .set({ score: rules.score, status: "scored", scoredAt: new Date(), updatedAt: new Date() })
      .where(eq(alloySignals.id, signal.id));

    if (rules.escalationRequired || rules.workflowType === "escalation" || rules.workflowType === "remediation") {
      await jobQueue.enqueue(ALLOY_JOB_TYPES.PROCESS_SIGNAL, {
        signalId: signal.id,
        workflowType: rules.workflowType,
        priority: rules.priority,
      });
    }

    sendSuccess(res, { signal, rules, dedupeKey }, 201);
  } catch (err) { handleRouteError(res, err, "Webhook ingestion failed"); }
});

alloyRouter.post(
  "/alloy/signals/batch",
  authMiddleware(),
  requireRole("super_admin", "ops", "analyst"),
  async (req: Request, res: Response) => {
    try {
      const { signals: rawSignals, domain } = req.body as {
        signals: Array<{
          source?: string;
          title: string;
          summary?: string;
          rawPayload?: Record<string, unknown>;
          tags?: string[];
          severity?: string;
        }>;
        domain: string;
      };

      if (!Array.isArray(rawSignals) || rawSignals.length === 0) {
        sendError(res, "signals array is required and must not be empty", 400);
        return;
      }
      if (!domain) { sendError(res, "domain is required", 400); return; }
      if (rawSignals.length > ENV_CONFIG.alloy.maxBatchSize) {
        sendError(res, `Batch size cannot exceed ${ENV_CONFIG.alloy.maxBatchSize} signals`, 400);
        return;
      }

      const actorUserId = req.user?.id;
      const results: Array<{ index: number; signalId?: number; error?: string; deduplicated?: boolean }> = [];

      for (let i = 0; i < rawSignals.length; i++) {
        const raw = rawSignals[i]!;
        try {
          const normalized = normalizeSignal({
            source: raw.source ?? "batch",
            sourceType: "batch",
            domain,
            title: raw.title,
            summary: raw.summary,
            rawPayload: raw.rawPayload,
            tags: raw.tags,
          });

          const dedupeKey = crypto.createHash("sha256")
            .update(`${domain}:${raw.title}:${raw.source ?? "batch"}`)
            .digest("hex")
            .slice(0, 32);

          const rules = scoreSignalRules(normalized);
          const [signal] = await db
            .insert(alloySignals)
            .values({ ...normalized, dedupeKey, score: rules.score, status: "scored", scoredAt: new Date(), ownerUserId: actorUserId })
            .onConflictDoNothing()
            .returning();

          if (!signal) {
            results.push({ index: i, deduplicated: true });
          } else {
            results.push({ index: i, signalId: signal.id });
          }
        } catch (err) {
          results.push({ index: i, error: err instanceof Error ? err.message : String(err) });
        }
      }

      sendSuccess(res, { results, total: rawSignals.length, ingested: results.filter(r => r.signalId).length });
    } catch (err) { handleRouteError(res, err, "Batch ingestion failed"); }
  },
);

alloyRouter.post(
  "/alloy/signals/manual",
  authMiddleware(),
  requireRole("super_admin", "ops", "analyst", "operator"),
  async (req: Request, res: Response) => {
    try {
      const {
        source, domain, title, summary, severity, tags, rawPayload,
      } = req.body as {
        source?: string;
        domain: string;
        title: string;
        summary?: string;
        severity?: "info" | "low" | "medium" | "high" | "critical";
        tags?: string[];
        rawPayload?: Record<string, unknown>;
      };

      if (!title || !domain) { sendError(res, "title and domain are required", 400); return; }

      const normalized = normalizeSignal({
        source: source ?? "manual",
        sourceType: "manual",
        domain,
        title,
        summary,
        rawPayload,
        tags,
      });

      if (severity) normalized.severity = severity;

      const rules = scoreSignalRules(normalized);
      const actorUserId = req.user?.id;

      const [signal] = await db
        .insert(alloySignals)
        .values({
          ...normalized,
          score: rules.score,
          status: "scored",
          scoredAt: new Date(),
          ownerUserId: actorUserId,
        })
        .returning();

      await writeAuditLog({
        entityType: "signal",
        entityId: signal.id,
        action: "manual_created",
        actorType: "user",
        actorUserId,
        newState: { signalId: signal.id, domain, severity: signal.severity },
      });

      sendSuccess(res, { signal, rules }, 201);
    } catch (err) { handleRouteError(res, err, "Manual signal creation failed"); }
  },
);

alloyRouter.post(
  "/alloy/signals/demo",
  authMiddleware(),
  requireRole("super_admin", "ops"),
  async (req: Request, res: Response) => {
    try {
      if (!ENV_CONFIG.alloy.enableDemoSeeder) {
        sendError(res, "Demo seeder is disabled in this environment", 403);
        return;
      }

      const { domain = "alloy", count = 5 } = req.body as { domain?: string; count?: number };
      const safeCount = Math.min(count, 20);

      const severities = ["low", "medium", "high", "critical", "info"] as const;
      const titles = ["Anomaly Detected", "Performance Degradation", "Security Alert", "Compliance Issue", "Health Warning"];
      const inserted = [];

      for (let i = 0; i < safeCount; i++) {
        const severity = severities[i % 5]!;
        const normalized = normalizeSignal({
          source: "demo-seeder",
          sourceType: "demo",
          domain,
          title: `Demo Signal ${i + 1}: ${titles[i % 5]}`,
          summary: `Automated demo signal for testing Alloy orchestration pipeline. Signal #${i + 1} in domain ${domain}.`,
          tags: ["demo", domain, "test"],
        });

        const rules = scoreSignalRules(normalized);
        const dedupeKey = `demo-${domain}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const [signal] = await db
          .insert(alloySignals)
          .values({ ...normalized, severity, dedupeKey, score: rules.score, status: "scored", scoredAt: new Date() })
          .returning();
        inserted.push(signal);
      }

      sendSuccess(res, { inserted: inserted.length, signals: inserted }, 201);
    } catch (err) { handleRouteError(res, err, "Demo signal seeding failed"); }
  },
);

// ─── Signal Queries (row-level scoped) ────────────────────────────────────────

alloyRouter.get("/alloy/signals", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const limit = parseIntParam(req.query["limit"] as string, 50);
    const domain = req.query["domain"] as string | undefined;
    const status = req.query["status"] as string | undefined;
    const severity = req.query["severity"] as string | undefined;

    const user = req.user!;
    const conditions = [];

    if (domain) conditions.push(eq(alloySignals.domain, domain));
    if (status) conditions.push(eq(alloySignals.status, status as "raw" | "normalized" | "scored" | "triaged" | "archived"));
    if (severity) conditions.push(eq(alloySignals.severity, severity as "info" | "low" | "medium" | "high" | "critical"));

    const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
    if (!isAdmin) {
      conditions.push(eq(alloySignals.ownerUserId, user.id));
    }

    const signals = await db
      .select()
      .from(alloySignals)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloySignals.createdAt))
      .limit(limit);

    sendSuccess(res, { signals, limit });
  } catch (err) { handleRouteError(res, err, "Failed to list signals"); }
});

alloyRouter.get("/alloy/signals/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendError(res, "Invalid signal ID", 400); return; }

    const [signal] = await db.select().from(alloySignals).where(eq(alloySignals.id, id)).limit(1);
    if (!signal) { sendError(res, "Signal not found", 404); return; }

    if (!canAccessRecord(req, signal.ownerUserId)) {
      sendError(res, "Access denied", 403);
      return;
    }

    sendSuccess(res, { signal });
  } catch (err) { handleRouteError(res, err, "Failed to get signal"); }
});

// ─── Workflow Management (row-level scoped) ───────────────────────────────────

alloyRouter.get("/alloy/workflows", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const limit = parseIntParam(req.query["limit"] as string, 50);
    const domain = req.query["domain"] as string | undefined;
    const status = req.query["status"] as string | undefined;

    const user = req.user!;
    const conditions = [];

    if (domain) conditions.push(eq(alloyWorkflows.domain, domain));
    if (status) conditions.push(eq(alloyWorkflows.status, status as "pending" | "running" | "waiting_approval" | "approved" | "rejected" | "completed" | "failed" | "cancelled"));

    const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
    if (!isAdmin) {
      conditions.push(eq(alloyWorkflows.ownerUserId, user.id));
    }

    const workflows = await db
      .select()
      .from(alloyWorkflows)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyWorkflows.createdAt))
      .limit(limit);

    sendSuccess(res, { workflows });
  } catch (err) { handleRouteError(res, err, "Failed to list workflows"); }
});

alloyRouter.get("/alloy/workflows/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendError(res, "Invalid workflow ID", 400); return; }

    const [workflow] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, id)).limit(1);
    if (!workflow) { sendError(res, "Workflow not found", 404); return; }

    if (!canAccessRecord(req, workflow.ownerUserId)) {
      sendError(res, "Access denied", 403);
      return;
    }

    const [runs, approvals, actions, artifacts] = await Promise.all([
      db.select().from(alloyWorkflowRuns).where(eq(alloyWorkflowRuns.workflowId, id)).orderBy(desc(alloyWorkflowRuns.startedAt)).limit(20),
      db.select().from(alloyApprovals).where(eq(alloyApprovals.workflowId, id)).orderBy(desc(alloyApprovals.createdAt)),
      db.select().from(alloyActions).where(eq(alloyActions.workflowId, id)).orderBy(desc(alloyActions.createdAt)),
      db.select().from(alloyArtifacts).where(eq(alloyArtifacts.workflowId, id)).orderBy(desc(alloyArtifacts.createdAt)),
    ]);

    sendSuccess(res, { workflow, runs, approvals, actions, artifacts });
  } catch (err) { handleRouteError(res, err, "Failed to get workflow"); }
});

alloyRouter.post(
  "/alloy/workflows",
  authMiddleware(),
  requireRole("super_admin", "ops", "operator"),
  async (req: Request, res: Response) => {
    try {
      const { name, type, domain, signalId, priority, requiresApproval } = req.body as {
        name: string;
        type?: InsertAlloyWorkflow["type"];
        domain: string;
        signalId?: number;
        priority?: InsertAlloyWorkflow["priority"];
        requiresApproval?: boolean;
      };

      if (!name || !domain) { sendError(res, "name and domain are required", 400); return; }

      const actorUserId = req.user?.id;

      if (signalId) {
        const [signal] = await db.select().from(alloySignals).where(eq(alloySignals.id, signalId)).limit(1);
        if (signal && !canAccessRecord(req, signal.ownerUserId)) {
          sendError(res, "Access denied to signal", 403);
          return;
        }

        const workflow = await processSignalIntoWorkflow(signalId, {
          workflowType: type ?? "investigation",
          priority,
          requiresApproval,
          actorUserId,
        });
        if (!workflow) { sendError(res, "Signal not found", 404); return; }

        if (workflow.requiresApproval) {
          await requestApproval(workflow.id, {
            requestedByUserId: actorUserId,
            reason: `Workflow '${workflow.name}' requires approval before execution`,
          });
        }

        sendSuccess(res, { workflow }, 201);
        return;
      }

      const shouldRequireApproval = requiresApproval ?? false;
      const [workflow] = await db
        .insert(alloyWorkflows)
        .values({
          name,
          type: type ?? "investigation",
          domain,
          triggerType: "manual",
          status: shouldRequireApproval ? "waiting_approval" : "pending",
          priority: priority ?? "medium",
          requiresApproval: shouldRequireApproval,
          approvalState: shouldRequireApproval ? "pending" : "none",
          ownerUserId: actorUserId,
          environment: ENV_CONFIG.environment,
        })
        .returning();

      await writeAuditLog({
        entityType: "workflow",
        entityId: workflow.id,
        action: "created",
        actorType: "user",
        actorUserId,
        newState: { status: workflow.status, type, domain, requiresApproval: shouldRequireApproval },
      });

      if (shouldRequireApproval) {
        await requestApproval(workflow.id, {
          requestedByUserId: actorUserId,
          reason: `Workflow '${name}' requires approval before execution`,
        });
      }

      sendSuccess(res, { workflow }, 201);
    } catch (err) { handleRouteError(res, err, "Failed to create workflow"); }
  },
);

alloyRouter.post(
  "/alloy/workflows/:id/run",
  authMiddleware(),
  requireRole("super_admin", "ops", "operator"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      if (isNaN(id)) { sendError(res, "Invalid workflow ID", 400); return; }

      const [workflow] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, id)).limit(1);
      if (!workflow) { sendError(res, "Workflow not found", 404); return; }

      if (!canAccessRecord(req, workflow.ownerUserId)) {
        sendError(res, "Access denied", 403);
        return;
      }

      const actorUserId = req.user?.id;

      if (workflow.requiresApproval && workflow.approvalState !== "approved") {
        sendError(res, `Workflow requires approval before it can run (approvalState=${workflow.approvalState})`, 409);
        return;
      }

      const job = await jobQueue.enqueue(ALLOY_JOB_TYPES.RUN_WORKFLOW, {
        workflowId: id,
        actorUserId,
      });
      sendSuccess(res, { queued: true, jobId: job.id, workflowId: id, message: "Workflow queued for execution" }, 202);
    } catch (err) { handleRouteError(res, err, "Failed to start workflow run"); }
  },
);

alloyRouter.get("/alloy/workflows/:id/history", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendError(res, "Invalid workflow ID", 400); return; }

    const [workflow] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, id)).limit(1);
    if (!workflow) { sendError(res, "Workflow not found", 404); return; }

    if (!canAccessRecord(req, workflow.ownerUserId)) {
      sendError(res, "Access denied", 403);
      return;
    }

    const runs = await db
      .select()
      .from(alloyWorkflowRuns)
      .where(eq(alloyWorkflowRuns.workflowId, id))
      .orderBy(desc(alloyWorkflowRuns.startedAt))
      .limit(50);

    sendSuccess(res, { runs });
  } catch (err) { handleRouteError(res, err, "Failed to get workflow history"); }
});

// ─── Approval Endpoints ───────────────────────────────────────────────────────

alloyRouter.get(
  "/alloy/approvals",
  authMiddleware(),
  requireRole("super_admin", "ops", "compliance", "exec"),
  async (req: Request, res: Response) => {
    try {
      const status = req.query["status"] as string | undefined;
      const user = req.user!;
      const conditions = [];

      if (status) conditions.push(eq(alloyApprovals.status, status as "pending" | "approved" | "rejected" | "expired"));

      const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
      if (!isAdmin) {
        conditions.push(eq(alloyApprovals.reviewerUserId, user.id));
      }

      const approvals = await db
        .select()
        .from(alloyApprovals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyApprovals.createdAt))
        .limit(100);

      sendSuccess(res, { approvals });
    } catch (err) { handleRouteError(res, err, "Failed to list approvals"); }
  },
);

alloyRouter.post(
  "/alloy/approvals/:id/review",
  authMiddleware(),
  requireRole("super_admin", "ops", "compliance", "exec"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      if (isNaN(id)) { sendError(res, "Invalid approval ID", 400); return; }

      const [approval] = await db.select().from(alloyApprovals).where(eq(alloyApprovals.id, id)).limit(1);
      if (!approval) { sendError(res, "Approval not found", 404); return; }

      const actorUserId = req.user?.id;
      if (!actorUserId) { sendError(res, "Authentication required", 401); return; }

      const user = req.user!;
      const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
      const isDesignatedReviewer = approval.reviewerUserId === actorUserId;

      if (!isAdmin && !isDesignatedReviewer) {
        sendError(res, "You are not authorized to review this approval", 403);
        return;
      }

      const { decision, reviewNote } = req.body as { decision: "approved" | "rejected"; reviewNote?: string };
      if (!decision || !["approved", "rejected"].includes(decision)) {
        sendError(res, "decision must be 'approved' or 'rejected'", 400);
        return;
      }

      await reviewApproval(id, decision, { reviewerUserId: actorUserId, reviewNote });
      sendSuccess(res, { approved: decision === "approved", decision });
    } catch (err) { handleRouteError(res, err, "Failed to review approval"); }
  },
);

// ─── Artifacts (row-level scoped) ────────────────────────────────────────────

alloyRouter.get("/alloy/artifacts", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const limit = parseIntParam(req.query["limit"] as string, 50);
    const domain = req.query["domain"] as string | undefined;
    const type = req.query["type"] as string | undefined;

    const user = req.user!;
    const conditions = [];

    if (domain) conditions.push(eq(alloyArtifacts.domain, domain));
    if (type) conditions.push(eq(alloyArtifacts.type, type as InsertAlloyArtifact["type"]));

    const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
    if (!isAdmin) {
      conditions.push(eq(alloyArtifacts.ownerUserId, user.id));
    }

    const artifacts = await db
      .select()
      .from(alloyArtifacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyArtifacts.createdAt))
      .limit(limit);

    sendSuccess(res, { artifacts });
  } catch (err) { handleRouteError(res, err, "Failed to list artifacts"); }
});

alloyRouter.post(
  "/alloy/artifacts",
  authMiddleware(),
  requireRole("super_admin", "ops", "analyst", "operator"),
  async (req: Request, res: Response) => {
    try {
      const { workflowId, signalId, type, title, content, domain, format, confidenceScore, requiresApproval, tags } = req.body as {
        workflowId?: number;
        signalId?: number;
        type: InsertAlloyArtifact["type"];
        title: string;
        content: string;
        domain: string;
        format?: InsertAlloyArtifact["format"];
        confidenceScore?: number;
        requiresApproval?: boolean;
        tags?: string[];
      };

      if (!type || !title || !content || !domain) {
        sendError(res, "type, title, content, and domain are required", 400);
        return;
      }

      if (workflowId) {
        const [wf] = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, workflowId)).limit(1);
        if (!wf) { sendError(res, "Referenced workflow not found", 404); return; }
        if (!canAccessRecord(req, wf.ownerUserId)) { sendError(res, "Access denied to referenced workflow", 403); return; }
      }

      if (signalId) {
        const [sig] = await db.select().from(alloySignals).where(eq(alloySignals.id, signalId)).limit(1);
        if (!sig) { sendError(res, "Referenced signal not found", 404); return; }
        if (!canAccessRecord(req, sig.ownerUserId)) { sendError(res, "Access denied to referenced signal", 403); return; }
      }

      const actorUserId = req.user?.id;
      const artifact = await generateArtifact({
        workflowId, signalId, type, title, content, domain, format,
        confidenceScore, requiresApproval, tags,
        ownerUserId: actorUserId,
        actorUserId,
      });

      sendSuccess(res, { artifact }, 201);
    } catch (err) { handleRouteError(res, err, "Failed to create artifact"); }
  },
);

// ─── Audit Log (super_admin/compliance only) ──────────────────────────────────

alloyRouter.get(
  "/alloy/audit",
  authMiddleware(),
  requireRole("super_admin", "compliance", "exec"),
  async (req: Request, res: Response) => {
    try {
      const limit = parseIntParam(req.query["limit"] as string, 100);
      const entityType = req.query["entityType"] as string | undefined;
      const entityId = req.query["entityId"] ? parseInt(req.query["entityId"] as string, 10) : undefined;

      const conditions = [];
      if (entityType) conditions.push(eq(alloyAuditLog.entityType, entityType as "signal" | "workflow" | "action" | "artifact" | "approval" | "owner"));
      if (entityId && !isNaN(entityId)) conditions.push(eq(alloyAuditLog.entityId, entityId));

      const logs = await db
        .select()
        .from(alloyAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyAuditLog.createdAt))
        .limit(limit);

      sendSuccess(res, { logs });
    } catch (err) { handleRouteError(res, err, "Failed to get audit log"); }
  },
);

// ─── Actions (row-level scoped) ───────────────────────────────────────────────

alloyRouter.get("/alloy/actions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const limit = parseIntParam(req.query["limit"] as string, 50);
    const status = req.query["status"] as string | undefined;
    const user = req.user!;
    const conditions = [];

    if (status) conditions.push(eq(alloyActions.status, status as "queued" | "in_progress" | "completed" | "failed" | "cancelled" | "skipped"));

    const isAdmin = user.roles.some(r => ELEVATED_ROLES.has(r));
    if (!isAdmin) {
      conditions.push(eq(alloyActions.assignedUserId, user.id));
    }

    const actions = await db
      .select()
      .from(alloyActions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyActions.createdAt))
      .limit(limit);

    sendSuccess(res, { actions });
  } catch (err) { handleRouteError(res, err, "Failed to list actions"); }
});

// ─── Owners ────────────────────────────────────────────────────────────────────

alloyRouter.get("/alloy/owners", authMiddleware(), requireRole("super_admin", "ops", "analyst", "operator", "exec", "compliance"), async (req: Request, res: Response) => {
  try {
    const owners = await db.select().from(alloyOwners).orderBy(alloyOwners.name).limit(200);
    sendSuccess(res, { owners });
  } catch (err) { handleRouteError(res, err, "Failed to list owners"); }
});

alloyRouter.post(
  "/alloy/owners",
  authMiddleware(),
  requireRole("super_admin", "ops"),
  async (req: Request, res: Response) => {
    try {
      const { name, type, email, domain, metadata } = req.body as {
        name: string;
        type?: "user" | "team" | "system" | "external";
        email?: string;
        domain?: string;
        metadata?: Record<string, unknown>;
      };

      if (!name) { sendError(res, "name is required", 400); return; }

      const [owner] = await db
        .insert(alloyOwners)
        .values({ name, type: type ?? "user", email, domain, metadata })
        .returning();

      await writeAuditLog({
        entityType: "owner",
        entityId: owner.id,
        action: "created",
        actorType: "user",
        actorUserId: req.user?.id,
        newState: { name, type, domain },
      });

      sendSuccess(res, { owner }, 201);
    } catch (err) { handleRouteError(res, err, "Failed to create owner"); }
  },
);

export default alloyRouter;

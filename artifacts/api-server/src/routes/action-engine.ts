import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";
import { authMiddleware } from "../middlewares/auth";
import {
  ingestDocument,
  batchIngestDocuments,
  listDocuments,
  getDocument,
  ensureDocumentIntelligenceTables,
  type DocumentIngestRequest,
} from "../lib/mastra/document-intelligence";
import {
  parseNLACommand,
  createNLAExecutionPlan,
  approveNLAPlan,
  executeNLAPlan,
  routeAndExecuteNLA,
  getPendingPlans,
  getPlan,
} from "../lib/mastra/nla-router";
import {
  registerTrigger,
  removeTrigger,
  listTriggers,
  getTrigger,
  fireTrigger,
  approveTrigger,
  emitDomainEvent,
  getPendingApprovals,
  ensureTriggerTables,
  registerDefaultTriggers,
  type TriggerEventType,
} from "../lib/mastra/event-triggers";
import {
  listActionAudit,
  getActionAuditEntry,
  ensureActionAuditTable,
  updateActionStatus,
} from "../lib/mastra/action-audit";
import {
  listExternalIntegrations,
  getExternalIntegration,
  registerGitHubIntegration,
} from "../lib/mastra/external-integrations";
import type { AgentExecutionContext } from "../lib/mastra/types";
import { pool } from "@szl-holdings/db";

const router = Router();

const actionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

router.use(actionRateLimit as any);

let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  await Promise.all([
    ensureActionAuditTable(),
    ensureDocumentIntelligenceTables(),
    ensureTriggerTables(),
  ]);
  registerGitHubIntegration();
  registerDefaultTriggers();
}

ensureInitialized().catch(err => logger.warn({ err }, "Action engine initialization warning"));

function buildMockContext(req: Request): AgentExecutionContext {
  const actionId = `act_${Date.now()}`;
  return {
    runId: actionId,
    traceId: `trace_${Date.now()}`,
    agentId: "action-engine",
    domain: "general",
    threadId: `thread_${Date.now()}`,
    userId: (req as any).user?.id?.toString(),
    metadata: {},
    delegateTo: async () => ({ agentId: "", response: "", toolsUsed: [], latencyMs: 0, traceId: "" }),
    recall: async () => [],
    storeEntity: async () => {},
    emitTrace: async () => {},
  };
}

router.get("/action-engine/health", async (_req: Request, res: Response) => {
  await ensureInitialized();
  const integrations = listExternalIntegrations();
  const triggers = listTriggers();
  const pendingPlans = getPendingPlans();
  const pendingApprovals = getPendingApprovals();

  res.json({
    status: "operational",
    capabilities: {
      documentIntelligence: true,
      nlaRouting: true,
      eventTriggers: true,
      externalIntegrations: true,
      actionAudit: true,
    },
    stats: {
      registeredIntegrations: integrations.length,
      registeredTriggers: triggers.length,
      pendingApprovalPlans: pendingPlans.length,
      pendingTriggerApprovals: pendingApprovals.length,
    },
    integrations: integrations.map(i => ({ id: i.id, name: i.name, enabled: i.enabled, tags: i.tags })),
    version: "1.0.0",
  });
});

router.post("/action-engine/documents/ingest", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { content, sourceType, filename, domain, tags } = req.body as DocumentIngestRequest & { triggeredBy?: string };

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "content (string) is required" }); return;
    }
    if (!sourceType) {
      res.status(400).json({ error: "sourceType is required" }); return;
    }

    const triggeredBy = (req as any).user?.email ?? req.body.triggeredBy ?? "api";

    const result = await ingestDocument({ content, sourceType, filename, domain, tags, triggeredBy });
    res.status(201).json(result);
  } catch (err: any) {
    logger.error({ err }, "Document ingest error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/documents/batch", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { documents } = req.body as { documents?: DocumentIngestRequest[] };

    if (!Array.isArray(documents) || documents.length === 0) {
      res.status(400).json({ error: "documents array is required" }); return;
    }
    if (documents.length > 50) {
      res.status(400).json({ error: "Maximum 50 documents per batch" }); return;
    }

    const triggeredBy = (req as any).user?.email ?? "api";
    const docsWithTrigger = documents.map(d => ({ ...d, triggeredBy }));

    const result = await batchIngestDocuments(docsWithTrigger);
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "Batch document ingest error");
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/documents", async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    const domain = req.query.domain as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 100);
    const offset = parseInt(String(req.query.offset ?? "0"));

    const result = await listDocuments({ domain, limit, offset });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/documents/:documentId", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const doc = await getDocument(String(req.params["documentId"]));
    if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/nla/parse", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { command, domain, context } = req.body as { command?: string; domain?: string; context?: Record<string, unknown> };
    if (!command) { res.status(400).json({ error: "command is required" }); return; }

    const result = await parseNLACommand(command, { domain, context });
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "NLA parse error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/nla/plan", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { command, domain, context, autoApprove } = req.body as {
      command?: string;
      domain?: string;
      context?: Record<string, unknown>;
      autoApprove?: boolean;
    };
    if (!command) { res.status(400).json({ error: "command is required" }); return; }

    const triggeredBy = (req as any).user?.email ?? "api";
    const plan = await createNLAExecutionPlan(command, triggeredBy, { domain, context, autoApprove });

    res.json({
      planId: plan.planId,
      status: plan.status,
      command: plan.command,
      intent: plan.parsed.intent,
      domain: plan.parsed.domain,
      toolChain: plan.parsed.toolChain,
      overallRisk: plan.parsed.overallRisk,
      requiresApproval: plan.parsed.requiresApproval,
      approvalReason: plan.parsed.approvalReason,
      confidence: plan.parsed.confidence,
    });
  } catch (err: any) {
    logger.error({ err }, "NLA plan error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/nla/plans/:planId/approve", authMiddleware({ required: true }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { decision, notes } = req.body as { decision?: "approved" | "rejected"; notes?: string };
    if (!decision || !["approved", "rejected"].includes(decision)) {
      res.status(400).json({ error: "decision must be 'approved' or 'rejected'" }); return;
    }

    const approvedBy = (req as any).user?.email ?? "api";
    const plan = await approveNLAPlan(String(req.params["planId"]), approvedBy, decision, notes);
    res.json({ planId: plan.planId, status: plan.status, approvedBy });
  } catch (err: any) {
    res.status(err.message.includes("not found") ? 404 : 500).json({ error: err.message });
  }
});

router.post("/action-engine/nla/plans/:planId/execute", authMiddleware({ required: true }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { overrideInputs } = req.body as { overrideInputs?: Record<string, Record<string, unknown>> };
    const ctx = buildMockContext(req);
    const result = await executeNLAPlan(String(req.params["planId"]), ctx, { overrideInputs });
    res.json(result);
  } catch (err: any) {
    const code = err.message.includes("not found") ? 404
      : err.message.includes("requires approval") ? 403
      : 500;
    res.status(code).json({ error: err.message });
  }
});

router.post("/action-engine/nla/execute", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { command, domain, autoApprove } = req.body as { command?: string; domain?: string; autoApprove?: boolean };
    if (!command) { res.status(400).json({ error: "command is required" }); return; }

    const triggeredBy = (req as any).user?.email ?? "api";
    const ctx = buildMockContext(req);

    const result = await routeAndExecuteNLA(command, triggeredBy, ctx, { domain, autoApprove });
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "NLA execute error");
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/nla/plans", async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const plans = getPendingPlans();
    res.json({ plans, total: plans.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/nla/plans/:planId", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const plan = getPlan(String(req.params["planId"]));
    if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/triggers", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const eventType = req.query.eventType ? String(req.query.eventType) : undefined;
    const enabled = req.query.enabled !== undefined ? req.query.enabled === "true" : undefined;
    const triggers = listTriggers({ eventType: eventType as any, enabled });
    res.json({ triggers, total: triggers.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/triggers", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const {
      triggerId, name, description, eventType, conditions, action,
      requiresApproval, approvalLevel, enabled,
    } = req.body;

    if (!triggerId || !name || !eventType || !action) {
      res.status(400).json({ error: "triggerId, name, eventType, and action are required" }); return;
    }

    const createdBy = (req as any).user?.email ?? "api";
    const trigger = registerTrigger({
      triggerId, name, description, eventType, conditions: conditions ?? [],
      action, requiresApproval: requiresApproval ?? false,
      approvalLevel: approvalLevel ?? "none",
      enabled: enabled ?? true, createdBy,
    });

    res.status(201).json(trigger);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/triggers/:triggerId", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const trigger = getTrigger(String(req.params["triggerId"]));
    if (!trigger) { res.status(404).json({ error: "Trigger not found" }); return; }
    res.json(trigger);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/action-engine/triggers/:triggerId", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const removed = removeTrigger(String(req.params["triggerId"]));
    if (!removed) { res.status(404).json({ error: "Trigger not found" }); return; }
    res.json({ removed: true, triggerId: String(req.params["triggerId"]) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/triggers/:triggerId/fire", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { eventData } = req.body as { eventData?: Record<string, unknown> };
    const firedBy = (req as any).user?.email ?? "api";
    const result = await fireTrigger(String(req.params["triggerId"]), eventData ?? {}, firedBy);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/events/emit", authMiddleware({ required: false }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { eventType, eventData } = req.body as { eventType?: TriggerEventType; eventData?: Record<string, unknown> };
    if (!eventType) { res.status(400).json({ error: "eventType is required" }); return; }

    const emittedBy = (req as any).user?.email ?? "api";
    const results = await emitDomainEvent(eventType, eventData ?? {}, emittedBy);
    res.json({ eventType, triggeredCount: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/approvals", authMiddleware({ required: true }), async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const approvals = getPendingApprovals();
    const plans = getPendingPlans();
    res.json({
      pendingApprovals: approvals,
      pendingPlans: plans,
      total: approvals.length + plans.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/action-engine/approvals/triggers/:approvalId", authMiddleware({ required: true }), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const { decision, notes } = req.body as { decision?: "approved" | "rejected"; notes?: string };
    if (!decision || !["approved", "rejected"].includes(decision)) {
      res.status(400).json({ error: "decision must be 'approved' or 'rejected'" }); return;
    }

    const decidedBy = (req as any).user?.email ?? "api";
    const result = await approveTrigger(String(req.params["approvalId"]), decidedBy, decision, notes);
    res.json(result);
  } catch (err: any) {
    res.status(err.message.includes("not found") ? 404 : 500).json({ error: err.message });
  }
});

router.get("/action-engine/audit", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const limit = Math.min(parseInt(String(req.query["limit"] ?? "50")), 200);
    const offset = parseInt(String(req.query["offset"] ?? "0"));
    const actionType = req.query["actionType"] ? String(req.query["actionType"]) : undefined;
    const status = req.query["status"] ? String(req.query["status"]) : undefined;
    const domain = req.query["domain"] ? String(req.query["domain"]) : undefined;
    const approvalRequired = req.query["approvalRequired"] !== undefined
      ? req.query["approvalRequired"] === "true" : undefined;

    const result = await listActionAudit({ actionType, status, domain, approvalRequired, limit, offset });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/audit/:actionId", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const entry = await getActionAuditEntry(String(req.params["actionId"]));
    if (!entry) { res.status(404).json({ error: "Audit entry not found" }); return; }
    res.json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/integrations", async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const integrations = listExternalIntegrations().map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      enabled: i.enabled,
      tags: i.tags,
      authType: i.auth.type,
      rateLimit: i.rateLimit,
    }));
    res.json({ integrations, total: integrations.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/action-engine/integrations/:integrationId", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialized();
    const integration = getExternalIntegration(String(req.params["integrationId"]));
    if (!integration) { res.status(404).json({ error: "Integration not found" }); return; }
    res.json({
      id: integration.id,
      name: integration.name,
      description: integration.description,
      enabled: integration.enabled,
      tags: integration.tags,
      authType: integration.auth.type,
      rateLimit: integration.rateLimit,
      retryPolicy: integration.retryPolicy,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

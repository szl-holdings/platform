import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import {
  GuardianDecisionEngine,
  GuardianRuleSchema,
  PolicyTierSchema,
  POLICY_TIER_DESCRIPTIONS,
  TIER_RISK_LEVEL,
  type DecisionRequest,
} from "@workspace/guardian";
import {
  defaultToolRegistry,
  ToolManifestSchema,
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  SECURITY_TOOL_MANIFESTS,
  FINANCE_TOOL_MANIFESTS,
  OPERATIONS_TOOL_MANIFESTS,
} from "@workspace/tool-mesh";

const router: IRouter = Router();

const sharedDecisionEngine = new GuardianDecisionEngine();

const allToolManifests = [
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  ...SECURITY_TOOL_MANIFESTS,
  ...FINANCE_TOOL_MANIFESTS,
  ...OPERATIONS_TOOL_MANIFESTS,
];
for (const manifest of allToolManifests) {
  defaultToolRegistry.register(manifest);
}

const dbPolicies: Array<{
  id: number;
  name: string;
  description?: string;
  tier: string;
  conditions: unknown[];
  action: string;
  priority: number;
  enabled: boolean;
  owner?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}> = [];
let policySeq = 1;

const dbActionApprovals: Array<{
  id: number;
  requestId: string;
  toolId: string;
  action: string;
  agentId?: string;
  sessionId?: string;
  workflowId?: string;
  status: "pending" | "approved" | "rejected" | "expired" | "cancelled";
  decisionReason?: string;
  approvedById?: number;
  approvedAt?: string;
  rejectedById?: number;
  rejectedAt?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}> = [];
let approvalSeq = 1;

router.get("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const tier = req.query["tier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    let results = [...dbPolicies];
    if (tier) results = results.filter(p => p.tier === tier);
    if (enabled !== undefined) results = results.filter(p => p.enabled === (enabled === "true"));

    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);

    sendSuccess(res, paginated, 200, { page, limit, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list policies");
  }
});

router.get("/policies/tiers", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const tiers = (PolicyTierSchema.options as string[]).map(t => {
      const tier = t as import("@workspace/guardian").PolicyTier;
      return { tier, description: POLICY_TIER_DESCRIPTIONS[tier], riskLevel: TIER_RISK_LEVEL[tier] };
    });
    sendSuccess(res, tiers);
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy tiers");
  }
});

router.get("/policies/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const policy = dbPolicies.find(p => p.id === id);
    if (!policy) { sendNotFound(res, "Policy not found"); return; }
    sendSuccess(res, policy);
  } catch (err) {
    handleRouteError(res, err, "Failed to get policy");
  }
});

router.post("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const parsed = GuardianRuleSchema.safeParse({
      ...req.body,
      id: req.body.id ?? `policy-${policySeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      sendBadRequest(res, "Invalid policy schema", parsed.error.flatten());
      return;
    }
    const rule = parsed.data;

    sharedDecisionEngine.addRule(rule);

    const record = {
      id: policySeq++,
      name: rule.name,
      description: rule.description,
      tier: rule.tier,
      conditions: rule.conditions,
      action: rule.action,
      priority: rule.priority,
      enabled: rule.enabled,
      owner: rule.owner,
      tags: rule.tags,
      createdAt: rule.createdAt ?? new Date().toISOString(),
      updatedAt: rule.updatedAt ?? new Date().toISOString(),
    };
    dbPolicies.push(record);

    logger.info({ policyId: record.id, tier: rule.tier, action: rule.action }, "Policy created");
    sendCreated(res, record);
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy");
  }
});

router.patch("/policies/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const idx = dbPolicies.findIndex(p => p.id === id);
    if (idx === -1) { sendNotFound(res, "Policy not found"); return; }

    const existing = dbPolicies[idx]!;
    const updated = { ...existing, ...req.body, id, updatedAt: new Date().toISOString() };
    dbPolicies[idx] = updated;

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update policy");
  }
});

router.delete("/policies/:id", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const idx = dbPolicies.findIndex(p => p.id === id);
    if (idx === -1) { sendNotFound(res, "Policy not found"); return; }

    dbPolicies.splice(idx, 1);
    logger.info({ policyId: id }, "Policy deleted");
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy");
  }
});

router.get("/tools", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const domainTag = req.query["domainTag"] as string | undefined;
    const policyTier = req.query["policyTier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    const filter: { domainTag?: string; policyTier?: string; enabled?: boolean } = {};
    if (domainTag) filter.domainTag = domainTag;
    if (policyTier) filter.policyTier = policyTier;
    if (enabled !== undefined) filter.enabled = enabled === "true";

    const all = defaultToolRegistry.list(filter);
    const offset = (page - 1) * limit;
    const paginated = all.slice(offset, offset + limit);

    sendSuccess(res, paginated, 200, { page, limit, total: all.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list tools");
  }
});

router.get("/tools/:toolId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const manifest = defaultToolRegistry.get(toolId);
    if (!manifest) { sendNotFound(res, "Tool not found"); return; }
    sendSuccess(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to get tool");
  }
});

router.post("/tools", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const parsed = ToolManifestSchema.safeParse({
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      sendBadRequest(res, "Invalid tool manifest", parsed.error.flatten());
      return;
    }

    const existing = defaultToolRegistry.get(parsed.data.id);
    if (existing) {
      sendBadRequest(res, `Tool with id "${parsed.data.id}" already registered`);
      return;
    }

    defaultToolRegistry.register(parsed.data);
    logger.info({ toolId: parsed.data.id, policyTier: parsed.data.policyTier }, "Tool registered");
    sendCreated(res, parsed.data);
  } catch (err) {
    handleRouteError(res, err, "Failed to register tool");
  }
});

router.patch("/tools/:toolId", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const existing = defaultToolRegistry.get(toolId);
    if (!existing) { sendNotFound(res, "Tool not found"); return; }

    const merged = { ...existing, ...req.body, id: toolId, updatedAt: new Date().toISOString() };
    const parsed = ToolManifestSchema.safeParse(merged);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid tool manifest update", parsed.error.flatten());
      return;
    }

    defaultToolRegistry.register(parsed.data);
    sendSuccess(res, parsed.data);
  } catch (err) {
    handleRouteError(res, err, "Failed to update tool");
  }
});

router.get("/actions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const toolId = req.query["toolId"] as string | undefined;

    let results = [...dbActionApprovals];
    if (status) results = results.filter(a => a.status === status);
    if (toolId) results = results.filter(a => a.toolId === toolId);

    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);

    sendSuccess(res, paginated, 200, { page, limit, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list action approvals");
  }
});

router.get("/actions/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const action = dbActionApprovals.find(a => a.id === id);
    if (!action) { sendNotFound(res, "Action approval not found"); return; }
    sendSuccess(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to get action approval");
  }
});

router.post("/actions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { toolId, action, agentId, sessionId, workflowId, payload } = req.body as {
      toolId?: string;
      action?: string;
      agentId?: string;
      sessionId?: string;
      workflowId?: string;
      payload?: Record<string, unknown>;
    };

    if (!toolId || !action) {
      sendBadRequest(res, "toolId and action are required");
      return;
    }

    const manifest = defaultToolRegistry.get(toolId);
    if (!manifest) { sendNotFound(res, "Tool not found"); return; }

    const requestId = `req-${Date.now()}-${approvalSeq}`;
    const record = {
      id: approvalSeq++,
      requestId,
      toolId,
      action,
      agentId,
      sessionId,
      workflowId,
      status: "pending" as const,
      payload: payload ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbActionApprovals.push(record);

    logger.info({ actionId: record.id, toolId, action }, "Action approval request created");
    sendCreated(res, record);
  } catch (err) {
    handleRouteError(res, err, "Failed to create action approval");
  }
});

router.post("/actions/:id/approve", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const idx = dbActionApprovals.findIndex(a => a.id === id);
    if (idx === -1) { sendNotFound(res, "Action approval not found"); return; }

    const approval = dbActionApprovals[idx]!;
    if (approval.status !== "pending") {
      sendBadRequest(res, `Cannot approve action in status: ${approval.status}`);
      return;
    }

    const user = req.user;
    const reason = (req.body as { reason?: string }).reason ?? "Approved by operator";

    const updated = {
      ...approval,
      status: "approved" as const,
      approvedById: user?.id,
      approvedAt: new Date().toISOString(),
      decisionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    dbActionApprovals[idx] = updated;

    logger.info({ actionId: id, approvedBy: user?.id, toolId: approval.toolId }, "Action approved");
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to approve action");
  }
});

router.post("/actions/:id/reject", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const idx = dbActionApprovals.findIndex(a => a.id === id);
    if (idx === -1) { sendNotFound(res, "Action approval not found"); return; }

    const approval = dbActionApprovals[idx]!;
    if (approval.status !== "pending") {
      sendBadRequest(res, `Cannot reject action in status: ${approval.status}`);
      return;
    }

    const user = req.user;
    const reason = (req.body as { reason?: string }).reason ?? "Rejected by operator";

    const updated = {
      ...approval,
      status: "rejected" as const,
      rejectedById: user?.id,
      rejectedAt: new Date().toISOString(),
      decisionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    dbActionApprovals[idx] = updated;

    logger.info({ actionId: id, rejectedBy: user?.id, toolId: approval.toolId }, "Action rejected");
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to reject action");
  }
});

router.post("/guardian/decide", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, context } = req.body as Partial<DecisionRequest>;
    if (!requestId || !action) {
      sendBadRequest(res, "requestId and action are required");
      return;
    }

    const decision = sharedDecisionEngine.decide({
      requestId,
      agentId,
      sessionId,
      workflowId,
      action,
      domain,
      tier,
      context: (context as Record<string, unknown>) ?? {},
    });

    sendSuccess(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate policy decision");
  }
});

export default router;

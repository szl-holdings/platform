import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  alloyPoliciesTable,
  modelRoutingPoliciesTable,
  costBudgetsTable,
  costEventsTable,
  governanceIncidentsTable,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authMiddleware, requireRole, type AuthenticatedUser } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendNoContent,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";

const router: IRouter = Router();

function isAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes("super_admin") || user.roles.includes("admin");
}

router.get("/policies", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const policyType = req.query.policyType as string | undefined;
    const showAll = req.query.isActive === "all";

    const conditions = [];
    if (!showAll) {
      const isActive = req.query.isActive !== "false";
      conditions.push(eq(alloyPoliciesTable.isActive, isActive));
    }
    if (policyType) conditions.push(eq(alloyPoliciesTable.policyType, policyType as any));

    const rows = await db
      .select()
      .from(alloyPoliciesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyPoliciesTable.priority))
      .limit(limit)
      .offset(offset);

    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch policies");
  }
});

router.get("/policies/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid policy ID");
    const [row] = await db.select().from(alloyPoliciesTable).where(eq(alloyPoliciesTable.id, id));
    if (!row) return sendNotFound(res, "Policy not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch policy");
  }
});

router.post("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const { name, description, policyType, scope, rules, priority, complianceFramework } = req.body;
    if (!name || !policyType) return sendBadRequest(res, "name and policyType are required");
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const [row] = await db.insert(alloyPoliciesTable).values({
      orgId,
      name,
      description,
      policyType,
      scope: scope ?? "tenant",
      rules: rules ?? [],
      priority: priority ?? 100,
      complianceFramework,
      createdBy: req.user?.displayName ?? "system",
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy");
  }
});

router.patch("/policies/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid policy ID");
    const { name, description, rules, isActive, priority, scope } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (rules !== undefined) updates.rules = rules;
    if (isActive !== undefined) updates.isActive = isActive;
    if (priority !== undefined) updates.priority = priority;
    if (scope !== undefined) updates.scope = scope;
    const [row] = await db.update(alloyPoliciesTable).set(updates as any).where(eq(alloyPoliciesTable.id, id)).returning();
    if (!row) return sendNotFound(res, "Policy not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update policy");
  }
});

router.delete("/policies/:id", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid policy ID");
    const [row] = await db.delete(alloyPoliciesTable).where(eq(alloyPoliciesTable.id, id)).returning();
    if (!row) return sendNotFound(res, "Policy not found");
    return sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy");
  }
});

router.get("/model-routing", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const provider = req.query.provider as string | undefined;
    const conditions = [];
    if (provider) conditions.push(eq(modelRoutingPoliciesTable.modelProvider, provider));
    const rows = await db
      .select()
      .from(modelRoutingPoliciesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(modelRoutingPoliciesTable.priority))
      .limit(limit)
      .offset(offset);
    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch model routing policies");
  }
});

router.post("/model-routing", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const { name, modelProvider, modelId, taskCategories, maxCostPerCall, isAllowed, isDefault, priority, environment } = req.body;
    if (!name || !modelProvider || !modelId) return sendBadRequest(res, "name, modelProvider, modelId are required");
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const [row] = await db.insert(modelRoutingPoliciesTable).values({
      orgId,
      name, modelProvider, modelId,
      taskCategories: taskCategories ?? [],
      maxCostPerCall, isAllowed: isAllowed ?? true,
      isDefault: isDefault ?? false,
      priority: priority ?? 100,
      environment: environment ?? "production",
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create model routing policy");
  }
});

router.patch("/model-routing/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { isAllowed, isDefault, maxCostPerCall, priority, taskCategories } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (isAllowed !== undefined) updates.isAllowed = isAllowed;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    if (maxCostPerCall !== undefined) updates.maxCostPerCall = maxCostPerCall;
    if (priority !== undefined) updates.priority = priority;
    if (taskCategories !== undefined) updates.taskCategories = taskCategories;
    const [row] = await db.update(modelRoutingPoliciesTable).set(updates as any).where(eq(modelRoutingPoliciesTable.id, id)).returning();
    if (!row) return sendNotFound(res, "Model routing policy not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update model routing policy");
  }
});

router.get("/budgets", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db
      .select()
      .from(costBudgetsTable)
      .where(eq(costBudgetsTable.isActive, true))
      .orderBy(desc(costBudgetsTable.createdAt))
      .limit(limit)
      .offset(offset);
    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch budgets");
  }
});

router.post("/budgets", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const { name, budgetType, limitAmount, warnThreshold, hardStopThreshold, periodEnd } = req.body;
    if (!name || !limitAmount) return sendBadRequest(res, "name and limitAmount are required");
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const [row] = await db.insert(costBudgetsTable).values({
      orgId,
      name,
      budgetType: budgetType ?? "monthly",
      limitAmount: String(limitAmount),
      warnThreshold: warnThreshold ? String(warnThreshold) : "0.80",
      hardStopThreshold: hardStopThreshold ? String(hardStopThreshold) : "1.00",
      periodEnd: periodEnd ? new Date(periodEnd) : null,
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create budget");
  }
});

router.get("/cost-events", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const eventType = req.query.eventType as string | undefined;
    const conditions = [];
    if (eventType) conditions.push(eq(costEventsTable.eventType, eventType as any));
    const rows = await db
      .select()
      .from(costEventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(costEventsTable.createdAt))
      .limit(limit)
      .offset(offset);
    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch cost events");
  }
});

router.post("/cost-events", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { eventType, resourceId, resourceName, modelProvider, modelId, tokensIn, tokensOut, costUsd, budgetId, metadata } = req.body;
    if (!eventType) return sendBadRequest(res, "eventType is required");
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const [row] = await db.insert(costEventsTable).values({
      orgId,
      budgetId: budgetId ?? null,
      eventType,
      resourceId, resourceName,
      modelProvider, modelId,
      tokensIn: tokensIn ?? 0,
      tokensOut: tokensOut ?? 0,
      costUsd: String(costUsd ?? 0),
      metadata,
    }).returning();

    if (budgetId) {
      await db.execute(sql`
        UPDATE cost_budgets
        SET current_spend = current_spend + ${String(costUsd ?? 0)}::numeric,
            updated_at = NOW()
        WHERE id = ${budgetId}
      `);
    }

    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to record cost event");
  }
});

router.get("/cost-summary", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const totalSpend = await db.execute(sql`
      SELECT
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as total_events,
        COALESCE(SUM(tokens_in), 0) as total_tokens_in,
        COALESCE(SUM(tokens_out), 0) as total_tokens_out
      FROM cost_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    const byType = await db.execute(sql`
      SELECT event_type, COUNT(*) as count, COALESCE(SUM(cost_usd), 0) as cost
      FROM cost_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY cost DESC
    `);

    const byModel = await db.execute(sql`
      SELECT model_provider, model_id, COUNT(*) as count, COALESCE(SUM(cost_usd), 0) as cost
      FROM cost_events
      WHERE model_provider IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY model_provider, model_id
      ORDER BY cost DESC
    `);

    const budgets = await db.select().from(costBudgetsTable).where(eq(costBudgetsTable.isActive, true));

    return sendSuccess(res, {
      period: "last_30_days",
      summary: (totalSpend as any).rows?.[0] ?? totalSpend,
      byEventType: (byType as any).rows ?? byType,
      byModel: (byModel as any).rows ?? byModel,
      activeBudgets: budgets,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch cost summary");
  }
});

router.get("/incidents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
    const severity = req.query.severity as string | undefined;
    const incidentType = req.query.incidentType as string | undefined;
    const conditions = [];
    if (severity) conditions.push(eq(governanceIncidentsTable.severity, severity as any));
    if (incidentType) conditions.push(eq(governanceIncidentsTable.incidentType, incidentType as any));
    const rows = await db
      .select()
      .from(governanceIncidentsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(governanceIncidentsTable.createdAt))
      .limit(limit)
      .offset(offset);
    return sendSuccess(res, rows, 200, { count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch incidents");
  }
});

router.post("/incidents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { severity, incidentType, title, description, agentId, userId, resourceType, resourceId, policyId, metadata } = req.body;
    if (!incidentType || !title) return sendBadRequest(res, "incidentType and title are required");
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const [row] = await db.insert(governanceIncidentsTable).values({
      orgId,
      policyId: policyId ?? null,
      severity: severity ?? "medium",
      incidentType,
      title, description,
      agentId, userId,
      resourceType, resourceId,
      metadata,
    }).returning();
    return sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.patch("/incidents/:id/resolve", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid incident ID");
    const { resolution } = req.body;
    const [row] = await db.update(governanceIncidentsTable).set({
      resolution,
      resolvedBy: req.user?.displayName ?? "system",
      resolvedAt: new Date(),
    }).where(eq(governanceIncidentsTable.id, id)).returning();
    if (!row) return sendNotFound(res, "Incident not found");
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve incident");
  }
});

router.get("/analytics", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const agentRuns = await db.execute(sql`
      SELECT COUNT(*) as total_runs,
        SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN state = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(duration_ms) as avg_duration_ms
      FROM platform_workflow_runs
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    const skillInvocations = await db.execute(sql`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(duration_ms) as avg_duration_ms
      FROM alloy_skill_runs
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    const policyViolations = await db.execute(sql`
      SELECT severity, COUNT(*) as count
      FROM governance_incidents
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY severity
      ORDER BY CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        WHEN 'info' THEN 5
      END
    `);

    const approvalLatency = await db.execute(sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM (decision_at - created_at))) as avg_seconds,
        MIN(EXTRACT(EPOCH FROM (decision_at - created_at))) as min_seconds,
        MAX(EXTRACT(EPOCH FROM (decision_at - created_at))) as max_seconds,
        COUNT(*) as total_approvals
      FROM platform_approvals
      WHERE decision_at IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
    `);

    const activePolicies = await db.execute(sql`
      SELECT policy_type, COUNT(*) as count
      FROM alloy_policies
      WHERE is_active = TRUE
      GROUP BY policy_type
    `);

    return sendSuccess(res, {
      period: "last_30_days",
      agentRuns: (agentRuns as any).rows?.[0] ?? agentRuns,
      skillInvocations: (skillInvocations as any).rows?.[0] ?? skillInvocations,
      policyViolations: (policyViolations as any).rows ?? policyViolations,
      approvalLatency: (approvalLatency as any).rows?.[0] ?? approvalLatency,
      activePolicies: (activePolicies as any).rows ?? activePolicies,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch analytics");
  }
});

export default router;

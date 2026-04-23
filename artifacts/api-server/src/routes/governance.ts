import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyLegacyPoliciesTable,
  auditEventsTable,
  costBudgetsTable,
  costEventsTable,
  db,
  governanceIncidentsTable,
  modelRoutingPoliciesTable,
} from '@szl-holdings/db';
import { type SQL, and, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';
import { assertTenantAccess, getUserOrgIds } from '../middlewares/tenant-scope';

async function writeGovernanceAuditEvent(params: {
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  newValues?: Record<string, unknown>;
  req: Request;
}) {
  try {
    await db.insert(auditEventsTable).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      newValues: params.newValues ?? null,
      ipAddress: params.req.ip ?? null,
      userAgent: params.req.get('user-agent') ?? null,
    });
  } catch (err) {
    logger.error({ err, action: params.action }, 'Failed to write governance audit event');
  }
}

const createPolicySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  policyType: z.string().min(1).max(100),
  scope: z.string().max(100).optional(),
  rules: z.array(z.unknown()).optional(),
  priority: z.number().int().min(0).max(10000).optional(),
  complianceFramework: z.string().max(200).trim().optional(),
});

const patchPolicySchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).trim().optional(),
    rules: z.array(z.unknown()).optional(),
    isActive: z.boolean().optional(),
    priority: z.number().int().min(0).max(10000).optional(),
    scope: z.string().max(100).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

const createModelRoutingSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  modelProvider: z.string().min(1).max(100),
  modelId: z.string().min(1).max(200),
  taskCategories: z.array(z.string()).optional(),
  maxCostPerCall: z.number().positive().optional(),
  isAllowed: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(10000).optional(),
  environment: z.string().max(50).optional(),
});

const patchModelRoutingSchema = z
  .object({
    isAllowed: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    maxCostPerCall: z.number().positive().optional(),
    priority: z.number().int().min(0).max(10000).optional(),
    taskCategories: z.array(z.string()).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

const createBudgetSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  budgetType: z.string().max(50).optional(),
  limitAmount: z.number().positive(),
  warnThreshold: z.number().min(0).max(1).optional(),
  hardStopThreshold: z.number().min(0).max(1).optional(),
  periodEnd: z.string().datetime({ offset: true }).optional().nullable(),
});

const createCostEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  resourceId: z.string().max(200).optional().nullable(),
  resourceName: z.string().max(200).optional().nullable(),
  modelProvider: z.string().max(100).optional().nullable(),
  modelId: z.string().max(200).optional().nullable(),
  tokensIn: z.number().int().min(0).optional(),
  tokensOut: z.number().int().min(0).optional(),
  costUsd: z.number().min(0).optional(),
  budgetId: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const router: IRouter = Router();

function _isAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes('super_admin') || user.roles.includes('admin');
}

router.get(
  '/policies',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) return sendSuccess(res, [], 200, { count: 0 });

      const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
      const policyType = req.query.policyType as string | undefined;
      const showAll = req.query.isActive === 'all';

      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(alloyLegacyPoliciesTable.orgId, [...orgIds]));
      if (!showAll) {
        const isActive = req.query.isActive !== 'false';
        conditions.push(eq(alloyLegacyPoliciesTable.isActive, isActive));
      }
      if (policyType) conditions.push(eq(alloyLegacyPoliciesTable.policyType, policyType as any));

      const rows = await db
        .select()
        .from(alloyLegacyPoliciesTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyLegacyPoliciesTable.priority))
        .limit(limit)
        .offset(offset);

      return sendSuccess(res, rows, 200, { count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch policies');
    }
  },
);

router.get('/policies/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
    const [row] = await db
      .select()
      .from(alloyLegacyPoliciesTable)
      .where(eq(alloyLegacyPoliciesTable.id, id));
    if (!row) return sendNotFound(res, 'Policy not found');
    if (!assertTenantAccess(req, res, row.orgId)) return;
    return sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch policy');
  }
});

router.post(
  '/policies',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(createPolicySchema),
  async (req: Request, res: Response) => {
    try {
      const { name, description, policyType, scope, rules, priority, complianceFramework } =
        req.body;
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const [row] = await db
        .insert(alloyLegacyPoliciesTable)
        .values({
          orgId,
          name,
          description,
          policyType,
          scope: scope ?? 'tenant',
          rules: rules ?? [],
          priority: priority ?? 100,
          complianceFramework,
          createdBy: req.user?.displayName ?? 'system',
        })
        .returning();
      void writeGovernanceAuditEvent({
        userId: req.user?.id ?? null,
        action: 'policy.created',
        entityType: 'governance_policy',
        entityId: String(row.id),
        newValues: { name, policyType, scope: scope ?? 'tenant', priority: priority ?? 100 },
        req,
      });
      return sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create policy');
    }
  },
);

router.patch(
  '/policies/:id',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(patchPolicySchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
      const { name, description, rules, isActive, priority, scope } = req.body;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (rules !== undefined) updates.rules = rules;
      if (isActive !== undefined) updates.isActive = isActive;
      if (priority !== undefined) updates.priority = priority;
      if (scope !== undefined) updates.scope = scope;
      const orgIds = getUserOrgIds(req.user!);
      const orgFilter = orgIds !== null ? inArray(alloyLegacyPoliciesTable.orgId, [...orgIds]) : undefined;
      const [row] = await db
        .update(alloyLegacyPoliciesTable)
        .set(updates as any)
        .where(and(eq(alloyLegacyPoliciesTable.id, id), orgFilter))
        .returning();
      if (!row) return sendNotFound(res, 'Policy not found');
      void writeGovernanceAuditEvent({
        userId: req.user?.id ?? null,
        action: 'policy.updated',
        entityType: 'governance_policy',
        entityId: String(id),
        newValues: { ...updates, updatedAt: undefined },
        req,
      });
      return sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update policy');
    }
  },
);

router.delete(
  '/policies/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
      const delOrgIds = getUserOrgIds(req.user!);
      const delOrgFilter = delOrgIds !== null ? inArray(alloyLegacyPoliciesTable.orgId, [...delOrgIds]) : undefined;
      const [row] = await db
        .delete(alloyLegacyPoliciesTable)
        .where(and(eq(alloyLegacyPoliciesTable.id, id), delOrgFilter))
        .returning();
      if (!row) return sendNotFound(res, 'Policy not found');
      void writeGovernanceAuditEvent({
        userId: req.user?.id ?? null,
        action: 'policy.deleted',
        entityType: 'governance_policy',
        entityId: String(id),
        req,
      });
      return sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete policy');
    }
  },
);

router.get(
  '/model-routing',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) return sendSuccess(res, [], 200, { count: 0 });

      const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
      const provider = req.query.provider as string | undefined;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(modelRoutingPoliciesTable.orgId, [...orgIds]));
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
      handleRouteError(res, err, 'Failed to fetch model routing policies');
    }
  },
);

router.post(
  '/model-routing',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(createModelRoutingSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        modelProvider,
        modelId,
        taskCategories,
        maxCostPerCall,
        isAllowed,
        isDefault,
        priority,
        environment,
      } = req.body;
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const [row] = await db
        .insert(modelRoutingPoliciesTable)
        .values({
          orgId,
          name,
          modelProvider,
          modelId,
          taskCategories: taskCategories ?? [],
          maxCostPerCall,
          isAllowed: isAllowed ?? true,
          isDefault: isDefault ?? false,
          priority: priority ?? 100,
          environment: environment ?? 'production',
        })
        .returning();
      void writeGovernanceAuditEvent({
        userId: req.user?.id ?? null,
        action: 'model_routing.created',
        entityType: 'model_routing_policy',
        entityId: String(row.id),
        newValues: {
          name,
          modelProvider,
          modelId,
          isAllowed: isAllowed ?? true,
          isDefault: isDefault ?? false,
        },
        req,
      });
      return sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create model routing policy');
    }
  },
);

router.patch(
  '/model-routing/:id',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(patchModelRoutingSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      const { isAllowed, isDefault, maxCostPerCall, priority, taskCategories } = req.body;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (isAllowed !== undefined) updates.isAllowed = isAllowed;
      if (isDefault !== undefined) updates.isDefault = isDefault;
      if (maxCostPerCall !== undefined) updates.maxCostPerCall = maxCostPerCall;
      if (priority !== undefined) updates.priority = priority;
      if (taskCategories !== undefined) updates.taskCategories = taskCategories;
      const mrOrgIds = getUserOrgIds(req.user!);
      const mrOrgFilter = mrOrgIds !== null ? inArray(modelRoutingPoliciesTable.orgId, [...mrOrgIds]) : undefined;
      const [row] = await db
        .update(modelRoutingPoliciesTable)
        .set(updates as any)
        .where(and(eq(modelRoutingPoliciesTable.id, id), mrOrgFilter))
        .returning();
      if (!row) return sendNotFound(res, 'Model routing policy not found');
      void writeGovernanceAuditEvent({
        userId: req.user?.id ?? null,
        action: 'model_routing.updated',
        entityType: 'model_routing_policy',
        entityId: String(id),
        newValues: { ...updates, updatedAt: undefined },
        req,
      });
      return sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update model routing policy');
    }
  },
);

router.get(
  '/budgets',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) return sendSuccess(res, [], 200, { count: 0 });

      const { limit = 20, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
      const conditions: SQL[] = [eq(costBudgetsTable.isActive, true)];
      if (orgIds !== null) conditions.push(inArray(costBudgetsTable.orgId, [...orgIds]));
      const rows = await db
        .select()
        .from(costBudgetsTable)
        .where(and(...conditions))
        .orderBy(desc(costBudgetsTable.createdAt))
        .limit(limit)
        .offset(offset);
      return sendSuccess(res, rows, 200, { count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch budgets');
    }
  },
);

router.post(
  '/budgets',
  authMiddleware(),
  requireRole('super_admin', 'admin'),
  validateBody(createBudgetSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, budgetType, limitAmount, warnThreshold, hardStopThreshold, periodEnd } =
        req.body;
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const [row] = await db
        .insert(costBudgetsTable)
        .values({
          orgId,
          name,
          budgetType: budgetType ?? 'monthly',
          limitAmount: String(limitAmount),
          warnThreshold: warnThreshold ? String(warnThreshold) : '0.80',
          hardStopThreshold: hardStopThreshold ? String(hardStopThreshold) : '1.00',
          periodEnd: periodEnd ? new Date(periodEnd) : null,
        })
        .returning();
      return sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create budget');
    }
  },
);

router.get(
  '/cost-events',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) return sendSuccess(res, [], 200, { count: 0 });

      const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
      const eventType = req.query.eventType as string | undefined;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(costEventsTable.orgId, [...orgIds]));
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
      handleRouteError(res, err, 'Failed to fetch cost events');
    }
  },
);

router.post(
  '/cost-events',
  authMiddleware(),
  validateBody(createCostEventSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        eventType,
        resourceId,
        resourceName,
        modelProvider,
        modelId,
        tokensIn,
        tokensOut,
        costUsd,
        budgetId,
        metadata,
      } = req.body;
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const [row] = await db
        .insert(costEventsTable)
        .values({
          orgId,
          budgetId: budgetId ?? null,
          eventType,
          resourceId,
          resourceName,
          modelProvider,
          modelId,
          tokensIn: tokensIn ?? 0,
          tokensOut: tokensOut ?? 0,
          costUsd: String(costUsd ?? 0),
          metadata,
        })
        .returning();

      if (budgetId && orgId != null) {
        await db.execute(sql`
        UPDATE cost_budgets
        SET current_spend = current_spend + ${String(costUsd ?? 0)}::numeric,
            updated_at = NOW()
        WHERE id = ${budgetId} AND org_id = ${orgId}
      `);
      }

      return sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record cost event');
    }
  },
);

router.get('/cost-summary', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      return sendSuccess(res, {
        period: 'last_30_days',
        summary: { total_cost: 0, total_events: 0, total_tokens_in: 0, total_tokens_out: 0 },
        byEventType: [],
        byModel: [],
        activeBudgets: [],
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ceOrgFilter = orgIds !== null ? inArray(costEventsTable.orgId, [...orgIds]) : undefined;
    const cbOrgFilter = orgIds !== null ? inArray(costBudgetsTable.orgId, [...orgIds]) : undefined;

    const [summary] = await db
      .select({
        total_cost: sql<string>`COALESCE(SUM(${costEventsTable.costUsd}), 0)`,
        total_events: sql<number>`COUNT(*)`,
        total_tokens_in: sql<number>`COALESCE(SUM(${costEventsTable.tokensIn}), 0)`,
        total_tokens_out: sql<number>`COALESCE(SUM(${costEventsTable.tokensOut}), 0)`,
      })
      .from(costEventsTable)
      .where(and(gte(costEventsTable.createdAt, thirtyDaysAgo), ceOrgFilter));

    const byType = await db
      .select({
        event_type: costEventsTable.eventType,
        count: sql<number>`COUNT(*)`,
        cost: sql<string>`COALESCE(SUM(${costEventsTable.costUsd}), 0)`,
      })
      .from(costEventsTable)
      .where(and(gte(costEventsTable.createdAt, thirtyDaysAgo), ceOrgFilter))
      .groupBy(costEventsTable.eventType)
      .orderBy(desc(sql`COALESCE(SUM(${costEventsTable.costUsd}), 0)`));

    const byModel = await db
      .select({
        model_provider: costEventsTable.modelProvider,
        model_id: costEventsTable.modelId,
        count: sql<number>`COUNT(*)`,
        cost: sql<string>`COALESCE(SUM(${costEventsTable.costUsd}), 0)`,
      })
      .from(costEventsTable)
      .where(and(isNotNull(costEventsTable.modelProvider), gte(costEventsTable.createdAt, thirtyDaysAgo), ceOrgFilter))
      .groupBy(costEventsTable.modelProvider, costEventsTable.modelId)
      .orderBy(desc(sql`COALESCE(SUM(${costEventsTable.costUsd}), 0)`));

    const budgets = await db
      .select()
      .from(costBudgetsTable)
      .where(and(eq(costBudgetsTable.isActive, true), cbOrgFilter));

    return sendSuccess(res, {
      period: 'last_30_days',
      summary: summary ?? { total_cost: 0, total_events: 0, total_tokens_in: 0, total_tokens_out: 0 },
      byEventType: byType,
      byModel,
      activeBudgets: budgets,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch cost summary');
  }
});

router.get(
  '/incidents',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) return sendSuccess(res, [], 200, { count: 0 });

      const { limit = 50, offset = 0 } = parsePagination(req.query as Record<string, unknown>);
      const severity = req.query.severity as string | undefined;
      const incidentType = req.query.incidentType as string | undefined;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(governanceIncidentsTable.orgId, [...orgIds]));
      if (severity) conditions.push(eq(governanceIncidentsTable.severity, severity as any));
      if (incidentType)
        conditions.push(eq(governanceIncidentsTable.incidentType, incidentType as any));
      const rows = await db
        .select()
        .from(governanceIncidentsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(governanceIncidentsTable.createdAt))
        .limit(limit)
        .offset(offset);
      return sendSuccess(res, rows, 200, { count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch incidents');
    }
  },
);

const createIncidentSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  incidentType: z.string().min(1).max(100),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional().nullable(),
  agentId: z.string().max(200).optional().nullable(),
  userId: z.number().int().positive().optional().nullable(),
  resourceType: z.string().max(100).optional().nullable(),
  resourceId: z.string().max(200).optional().nullable(),
  policyId: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const resolveIncidentSchema = z.object({
  resolution: z.string().max(5000).trim().optional(),
});

router.post(
  '/incidents',
  authMiddleware(),
  validateBody(createIncidentSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        severity,
        incidentType,
        title,
        description,
        agentId,
        userId,
        resourceType,
        resourceId,
        policyId,
        metadata,
      } = req.body;
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const [row] = await db
        .insert(governanceIncidentsTable)
        .values({
          orgId,
          policyId: policyId ?? null,
          severity: severity ?? 'medium',
          incidentType,
          title,
          description,
          agentId,
          userId,
          resourceType,
          resourceId,
          metadata,
        })
        .returning();
      return sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create incident');
    }
  },
);

router.patch(
  '/incidents/:id/resolve',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(resolveIncidentSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return sendBadRequest(res, 'Invalid incident ID');
      const { resolution } = req.body;
      const incOrgIds = getUserOrgIds(req.user!);
      const incOrgFilter = incOrgIds !== null ? inArray(governanceIncidentsTable.orgId, [...incOrgIds]) : undefined;
      const [row] = await db
        .update(governanceIncidentsTable)
        .set({
          resolution,
          resolvedBy: req.user?.displayName ?? 'system',
          resolvedAt: new Date(),
        })
        .where(and(eq(governanceIncidentsTable.id, id), incOrgFilter))
        .returning();
      if (!row) return sendNotFound(res, 'Incident not found');
      return sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve incident');
    }
  },
);

router.get('/analytics', authMiddleware(), requireRole('admin', 'super_admin', 'ops'), async (_req: Request, res: Response) => {
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
      period: 'last_30_days',
      agentRuns: (agentRuns as any).rows?.[0] ?? agentRuns,
      skillInvocations: (skillInvocations as any).rows?.[0] ?? skillInvocations,
      policyViolations: (policyViolations as any).rows ?? policyViolations,
      approvalLatency: (approvalLatency as any).rows?.[0] ?? approvalLatency,
      activePolicies: (activePolicies as any).rows ?? activePolicies,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch analytics');
  }
});

export default router;

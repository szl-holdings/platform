import { bodyShape } from '@szl-holdings/contracts/common';
import { type CovenantPermission, type CovenantPolicy, type CovenantResource, type CovenantSubject, buildDomainScopedPolicy, COVENANT_POLICY_TEMPLATES, checkPermission, covenantEngine, formatDecisionForUI, getDeniedDecisions, getRecentDecisions, instantiateTemplate } from '@szl-holdings/covenant-policy';
import { covenantSimulationRuns, db, policySimScenarios } from '@szl-holdings/db';
import type { PrismDomain, PrismRole } from '@szl-holdings/prism-bus';
import { and, desc, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

covenantEngine.registerSimulateHook((request, decision, explanation) => {
  db.insert(covenantSimulationRuns)
    .values({
      requestId: decision.requestId,
      subjectRoles: decision.subject.roles as string[],
      subjectUserId: decision.subject.userId ?? null,
      subjectTenantId: decision.subject.tenantId ?? null,
      resourceType: decision.resource.type,
      resourceId: decision.resource.id ?? null,
      resourceDomain: decision.resource.domain ?? null,
      action: decision.action,
      effect: decision.effect,
      allowed: decision.allowed ? 1 : 0,
      matchedPolicies: decision.matchedPolicies,
      deniedBy: decision.deniedBy ?? null,
      reason: decision.reason ?? null,
      explanation,
      context: request.context ?? null,
      evaluatedAt: decision.evaluatedAt,
      durationMs: decision.durationMs,
    })
    .catch((err) => {
      logger.warn({ err }, '[covenant-engine] Failed to persist simulation run (non-fatal)');
    });
});

router.get('/covenant/status', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const stats = covenantEngine.getStats();
    const highRiskActions = covenantEngine.getHighRiskActions();
    sendSuccess(res, {
      engine: 'COVENANT POLICY ENGINE',
      status: 'active',
      stats,
      highRiskActions,
    });
  } catch (err) {
    handleRouteError(res, err, 'COVENANT status');
  }
});

router.post(
  '/covenant/evaluate',
  authMiddleware(),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      context: z.unknown().optional(),
      resource: z.unknown().optional(),
      subject: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { subject, resource, action, context } = req.body as {
        subject?: Partial<CovenantSubject>;
        resource?: Partial<CovenantResource>;
        action?: string;
        context?: Record<string, unknown>;
      };

      if (!subject?.roles || !resource?.type || !action) {
        sendBadRequest(res, 'subject.roles, resource.type, and action are required');
        return;
      }

      const decision = covenantEngine.evaluate({
        subject: {
          roles: subject.roles as PrismRole[],
          userId: subject.userId ?? req.user?.id?.toString() ?? null,
          tenantId: subject.tenantId ?? req.user?.orgs?.[0]?.orgId?.toString() ?? null,
          attributes: subject.attributes,
        },
        resource: {
          type: resource.type,
          id: resource.id ?? null,
          domain: (resource.domain as PrismDomain) ?? null,
          actionClass: resource.actionClass ?? null,
          attributes: resource.attributes,
        },
        action: action as CovenantPermission,
        context,
      });

      sendSuccess(res, { decision, ui: formatDecisionForUI(decision) });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT evaluate');
    }
  },
);

router.post(
  '/covenant/simulate',
  authMiddleware(),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      context: z.unknown().optional(),
      resource: z.unknown().optional(),
      subject: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { subject, resource, action, context } = req.body as {
        subject?: Partial<CovenantSubject>;
        resource?: Partial<CovenantResource>;
        action?: string;
        context?: Record<string, unknown>;
      };

      if (!subject?.roles || !resource?.type || !action) {
        sendBadRequest(res, 'subject.roles, resource.type, and action are required');
        return;
      }

      const { decision, explanation } = covenantEngine.simulate({
        subject: {
          roles: subject.roles as PrismRole[],
          userId: subject.userId ?? null,
          tenantId: subject.tenantId ?? null,
          attributes: subject.attributes,
        },
        resource: {
          type: resource.type,
          id: resource.id ?? null,
          domain: (resource.domain as PrismDomain) ?? null,
          actionClass: resource.actionClass ?? null,
          attributes: resource.attributes,
        },
        action: action as CovenantPermission,
        context,
      });

      sendSuccess(res, { decision, explanation, ui: formatDecisionForUI(decision) });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT simulate');
    }
  },
);

router.get(
  '/covenant/check',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { action, resourceType, domain } = req.query as {
        action?: string;
        resourceType?: string;
        domain?: string;
      };

      if (!action || !resourceType) {
        sendBadRequest(res, 'action and resourceType are required');
        return;
      }

      const roles = (req.user?.roles ?? []) as PrismRole[];
      const result = checkPermission(roles, action as CovenantPermission, resourceType, {
        domain,
        tenantId: req.user?.orgs?.[0]?.orgId?.toString() ?? null,
        userId: req.user?.id?.toString() ?? null,
      });

      sendSuccess(res, {
        allowed: result.allowed,
        reason: result.reason,
        ui: formatDecisionForUI(result.decision),
      });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT check');
    }
  },
);

router.get('/covenant/policies', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const policies = covenantEngine.getPolicies();
    sendSuccess(res, { policies, count: policies.length });
  } catch (err) {
    handleRouteError(res, err, 'COVENANT policies');
  }
});

router.post(
  '/covenant/policies',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'exec'),
  validateBody(
    bodyShape({
      conditions: z.unknown().optional(),
      description: z.unknown().optional(),
      domains: z.unknown().optional(),
      effect: z.unknown().optional(),
      expiresAt: z.unknown().optional(),
      id: z.unknown().optional(),
      metadata: z.unknown().optional(),
      name: z.unknown().optional(),
      permissions: z.unknown().optional(),
      priority: z.unknown().optional(),
      roles: z.unknown().optional(),
      version: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const policy = req.body as Partial<CovenantPolicy>;

      if (!policy.id || !policy.name || !policy.permissions || !policy.effect) {
        sendBadRequest(res, 'id, name, permissions, and effect are required');
        return;
      }

      covenantEngine.register({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        version: policy.version ?? '1.0.0',
        roles: policy.roles ?? [],
        domains: policy.domains ?? [],
        permissions: policy.permissions,
        conditions: policy.conditions,
        effect: policy.effect,
        priority: policy.priority ?? 10,
        expiresAt: policy.expiresAt ?? null,
        metadata: policy.metadata,
      });

      sendCreated(res, { id: policy.id, registered: true });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT register policy');
    }
  },
);

router.delete(
  '/covenant/policies/:policyId',
  validateBody(bodyShape({})),
  authMiddleware(),
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const policyId = req.params.policyId as string;
      covenantEngine.unregister(policyId);
      sendSuccess(res, { policyId, removed: true });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT unregister policy');
    }
  },
);

router.get('/covenant/templates', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const templates = Object.entries(COVENANT_POLICY_TEMPLATES).map(([key, template]) => ({
      key,
      ...template,
    }));
    sendSuccess(res, { templates, count: templates.length });
  } catch (err) {
    handleRouteError(res, err, 'COVENANT templates');
  }
});

router.post(
  '/covenant/templates/:templateKey/instantiate',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'exec'),
  validateBody(
    bodyShape({
      conditions: z.unknown().optional(),
      domains: z.unknown().optional(),
      expiresAt: z.unknown().optional(),
      id: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { templateKey } = req.params;
      const { domains, conditions, expiresAt, id } = req.body as {
        domains?: string[];
        conditions?: CovenantPolicy['conditions'];
        expiresAt?: number;
        id?: string;
      };

      const policy = instantiateTemplate(templateKey as keyof typeof COVENANT_POLICY_TEMPLATES, {
        domains: domains as PrismDomain[] | undefined,
        conditions,
        expiresAt,
        id,
      });

      covenantEngine.register(policy);
      sendCreated(res, { policy, registered: true });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT instantiate template');
    }
  },
);

router.post(
  '/covenant/domain-policy',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'exec'),
  validateBody(
    bodyShape({
      domains: z.unknown().optional(),
      id: z.unknown().optional(),
      templateKey: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { templateKey, domains, id } = req.body as {
        templateKey?: string;
        domains?: string[];
        id?: string;
      };

      if (!templateKey || !domains) {
        sendBadRequest(res, 'templateKey and domains are required');
        return;
      }

      const policy = buildDomainScopedPolicy(
        templateKey as keyof typeof COVENANT_POLICY_TEMPLATES,
        domains as PrismDomain[],
        id,
      );
      covenantEngine.register(policy);
      sendCreated(res, { policy, registered: true });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT domain policy');
    }
  },
);

router.get(
  '/covenant/decisions',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { effect, action, limit } = req.query as {
        effect?: string;
        action?: string;
        limit?: string;
      };

      const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
      const isSuperAdmin =
        req.user?.roles?.includes('super_admin') || req.user?.roles?.includes('admin');
      const callerId = req.user?.id?.toString() ?? null;

      const decisions =
        effect === 'deny'
          ? getDeniedDecisions(limit ? Number(limit) : 50)
          : getRecentDecisions(limit ? Number(limit) : 50);

      const uiDecisions = decisions
        .filter((d) => !action || d.action === action)
        .filter(
          (d) =>
            isSuperAdmin ||
            d.subject.tenantId == null ||
            d.subject.tenantId === callerTenantId ||
            d.subject.userId === callerId,
        )
        .map(formatDecisionForUI);

      sendSuccess(res, { decisions: uiDecisions, count: uiDecisions.length });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT decisions');
    }
  },
);

router.get(
  '/covenant/high-risk-actions',
  authMiddleware(),
  async (_req: Request, res: Response) => {
    try {
      const actions = covenantEngine.getHighRiskActions();
      sendSuccess(res, { highRiskActions: actions, count: actions.length });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT high-risk-actions');
    }
  },
);

router.get(
  '/covenant/simulation-history',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const runs = await db
        .select()
        .from(covenantSimulationRuns)
        .orderBy(desc(covenantSimulationRuns.createdAt))
        .limit(100);
      sendSuccess(res, { runs, count: runs.length });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT simulation-history');
    }
  },
);

router.get('/covenant/scenarios', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('super_admin');
    if (!orgId && !isAdmin) {
      sendSuccess(res, { scenarios: [], count: 0 });
      return;
    }
    const scenarios =
      isAdmin && !orgId
        ? await db.select().from(policySimScenarios).orderBy(desc(policySimScenarios.updatedAt))
        : await db
            .select()
            .from(policySimScenarios)
            .where(eq(policySimScenarios.orgId, orgId!))
            .orderBy(desc(policySimScenarios.updatedAt));
    sendSuccess(res, { scenarios, count: scenarios.length });
  } catch (err) {
    handleRouteError(res, err, 'COVENANT scenarios list');
  }
});

router.post(
  '/covenant/scenarios',
  authMiddleware(),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      context: z.unknown().optional(),
      description: z.unknown().optional(),
      name: z.unknown().optional(),
      resource: z.unknown().optional(),
      subject: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { name, description, subject, resource, action, context } = req.body as {
        name?: string;
        description?: string;
        subject?: Partial<CovenantSubject>;
        resource?: Partial<CovenantResource>;
        action?: string;
        context?: Record<string, unknown>;
      };

      if (!name || !subject?.roles || !resource?.type || !action) {
        sendBadRequest(res, 'name, subject.roles, resource.type, and action are required');
        return;
      }

      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const createdBy = req.user?.id?.toString() ?? null;

      const { decision, explanation } = covenantEngine.simulate({
        subject: {
          roles: subject.roles as PrismRole[],
          userId: subject.userId ?? null,
          tenantId: subject.tenantId ?? null,
          attributes: subject.attributes,
        },
        resource: {
          type: resource.type,
          id: resource.id ?? null,
          domain: (resource.domain as PrismDomain) ?? null,
          actionClass: resource.actionClass ?? null,
          attributes: resource.attributes,
        },
        action: action as CovenantPermission,
        context,
      });

      const [scenario] = await db
        .insert(policySimScenarios)
        .values({
          name,
          description: description ?? null,
          subjectRoles: subject.roles as string[],
          subjectUserId: subject.userId ?? null,
          subjectTenantId: subject.tenantId ?? null,
          resourceType: resource.type,
          resourceId: resource.id ?? null,
          resourceDomain: resource.domain ?? null,
          action,
          context: context ?? null,
          lastResult: { decision, explanation } as unknown as Record<string, unknown>,
          lastRunAt: new Date(),
          runCount: 1,
          createdBy,
          orgId,
        })
        .returning();

      sendCreated(res, { scenario, decision, explanation, ui: formatDecisionForUI(decision) });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT scenarios create');
    }
  },
);

router.get('/covenant/scenarios/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id ?? '0'), 10);
    const orgId = req.user?.orgs?.[0]?.orgId ?? null;
    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('super_admin');
    if (!isAdmin && !orgId) {
      sendForbidden(res, 'Organization context required');
      return;
    }
    const [scenario] = isAdmin
      ? await db.select().from(policySimScenarios).where(eq(policySimScenarios.id, id))
      : await db
          .select()
          .from(policySimScenarios)
          .where(and(eq(policySimScenarios.id, id), eq(policySimScenarios.orgId, orgId!)));
    if (!scenario) {
      sendNotFound(res, 'Scenario');
      return;
    }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, 'COVENANT scenarios get');
  }
});

router.post(
  '/covenant/scenarios/:id/run',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id ?? '0'), 10);
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const isAdmin =
        req.user?.roles?.includes('admin') || req.user?.roles?.includes('super_admin');
      if (!isAdmin && !orgId) {
        sendForbidden(res, 'Organization context required');
        return;
      }
      const [scenario] = isAdmin
        ? await db.select().from(policySimScenarios).where(eq(policySimScenarios.id, id))
        : await db
            .select()
            .from(policySimScenarios)
            .where(and(eq(policySimScenarios.id, id), eq(policySimScenarios.orgId, orgId!)));
      if (!scenario) {
        sendNotFound(res, 'Scenario');
        return;
      }

      const { decision, explanation } = covenantEngine.simulate({
        subject: {
          roles: scenario.subjectRoles as PrismRole[],
          userId: scenario.subjectUserId ?? null,
          tenantId: scenario.subjectTenantId ?? null,
        },
        resource: {
          type: scenario.resourceType,
          id: scenario.resourceId ?? null,
          domain: (scenario.resourceDomain as PrismDomain) ?? null,
        },
        action: scenario.action as CovenantPermission,
        context: scenario.context as Record<string, unknown> | undefined,
      });

      const [updated] = await db
        .update(policySimScenarios)
        .set({
          lastResult: { decision, explanation } as unknown as Record<string, unknown>,
          lastRunAt: new Date(),
          runCount: (scenario.runCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(policySimScenarios.id, id))
        .returning();

      sendSuccess(res, {
        scenario: updated,
        decision,
        explanation,
        ui: formatDecisionForUI(decision),
      });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT scenarios run');
    }
  },
);

router.delete(
  '/covenant/scenarios/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id ?? '0'), 10);
      const orgId = req.user?.orgs?.[0]?.orgId ?? null;
      const isAdmin =
        req.user?.roles?.includes('admin') || req.user?.roles?.includes('super_admin');
      const [deleted] = isAdmin
        ? await db.delete(policySimScenarios).where(eq(policySimScenarios.id, id)).returning()
        : await db
            .delete(policySimScenarios)
            .where(and(eq(policySimScenarios.id, id), eq(policySimScenarios.orgId, orgId!)))
            .returning();
      if (!deleted) {
        sendNotFound(res, 'Scenario');
        return;
      }
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'COVENANT scenarios delete');
    }
  },
);

export default router;

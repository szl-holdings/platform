import { Router, type IRouter, type Request, type Response } from "express";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  covenantEngine,
  checkPermission,
  getRecentDecisions,
  getDeniedDecisions,
  formatDecisionForUI,
  COVENANT_POLICY_TEMPLATES,
  instantiateTemplate,
  buildDomainScopedPolicy,
} from "@szl-holdings/covenant-policy";
import type {
  CovenantPolicy,
  CovenantPermission,
  CovenantSubject,
  CovenantResource,
} from "@szl-holdings/covenant-policy";
import type { PrismRole, PrismDomain } from "@szl-holdings/prism-bus";

const router: IRouter = Router();

router.get("/covenant/status", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const stats = covenantEngine.getStats();
    const highRiskActions = covenantEngine.getHighRiskActions();
    sendSuccess(res, {
      engine: "COVENANT POLICY ENGINE",
      status: "active",
      stats,
      highRiskActions,
    });
  } catch (err) {
    handleRouteError(res, err, "COVENANT status");
  }
});

router.post("/covenant/evaluate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { subject, resource, action, context } = req.body as {
      subject?: Partial<CovenantSubject>;
      resource?: Partial<CovenantResource>;
      action?: string;
      context?: Record<string, unknown>;
    };

    if (!subject?.roles || !resource?.type || !action) {
      sendBadRequest(res, "subject.roles, resource.type, and action are required");
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
        domain: resource.domain as PrismDomain ?? null,
        actionClass: resource.actionClass ?? null,
        attributes: resource.attributes,
      },
      action: action as CovenantPermission,
      context,
    });

    sendSuccess(res, { decision, ui: formatDecisionForUI(decision) });
  } catch (err) {
    handleRouteError(res, err, "COVENANT evaluate");
  }
});

router.post("/covenant/simulate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { subject, resource, action, context } = req.body as {
      subject?: Partial<CovenantSubject>;
      resource?: Partial<CovenantResource>;
      action?: string;
      context?: Record<string, unknown>;
    };

    if (!subject?.roles || !resource?.type || !action) {
      sendBadRequest(res, "subject.roles, resource.type, and action are required");
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
        domain: resource.domain as PrismDomain ?? null,
        actionClass: resource.actionClass ?? null,
        attributes: resource.attributes,
      },
      action: action as CovenantPermission,
      context,
    });

    sendSuccess(res, { decision, explanation, ui: formatDecisionForUI(decision) });
  } catch (err) {
    handleRouteError(res, err, "COVENANT simulate");
  }
});

router.get("/covenant/check", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { action, resourceType, domain } = req.query as {
      action?: string;
      resourceType?: string;
      domain?: string;
    };

    if (!action || !resourceType) {
      sendBadRequest(res, "action and resourceType are required");
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
    handleRouteError(res, err, "COVENANT check");
  }
});

router.get("/covenant/policies", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const policies = covenantEngine.getPolicies();
    sendSuccess(res, { policies, count: policies.length });
  } catch (err) {
    handleRouteError(res, err, "COVENANT policies");
  }
});

router.post("/covenant/policies", authMiddleware(), requireRole("admin", "super_admin", "exec"), async (req: Request, res: Response) => {
  try {
    const policy = req.body as Partial<CovenantPolicy>;

    if (!policy.id || !policy.name || !policy.permissions || !policy.effect) {
      sendBadRequest(res, "id, name, permissions, and effect are required");
      return;
    }

    covenantEngine.register({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      version: policy.version ?? "1.0.0",
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
    handleRouteError(res, err, "COVENANT register policy");
  }
});

router.delete("/covenant/policies/:policyId", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    covenantEngine.unregister(policyId!);
    sendSuccess(res, { policyId, removed: true });
  } catch (err) {
    handleRouteError(res, err, "COVENANT unregister policy");
  }
});

router.get("/covenant/templates", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const templates = Object.entries(COVENANT_POLICY_TEMPLATES).map(([key, template]) => ({
      key,
      ...template,
    }));
    sendSuccess(res, { templates, count: templates.length });
  } catch (err) {
    handleRouteError(res, err, "COVENANT templates");
  }
});

router.post("/covenant/templates/:templateKey/instantiate", authMiddleware(), requireRole("admin", "super_admin", "exec"), async (req: Request, res: Response) => {
  try {
    const { templateKey } = req.params;
    const { domains, conditions, expiresAt, id } = req.body as {
      domains?: string[];
      conditions?: CovenantPolicy["conditions"];
      expiresAt?: number;
      id?: string;
    };

    const policy = instantiateTemplate(
      templateKey as keyof typeof COVENANT_POLICY_TEMPLATES,
      {
        domains: domains as PrismDomain[] | undefined,
        conditions,
        expiresAt,
        id,
      }
    );

    covenantEngine.register(policy);
    sendCreated(res, { policy, registered: true });
  } catch (err) {
    handleRouteError(res, err, "COVENANT instantiate template");
  }
});

router.post("/covenant/domain-policy", authMiddleware(), requireRole("admin", "super_admin", "exec"), async (req: Request, res: Response) => {
  try {
    const { templateKey, domains, id } = req.body as {
      templateKey?: string;
      domains?: string[];
      id?: string;
    };

    if (!templateKey || !domains) {
      sendBadRequest(res, "templateKey and domains are required");
      return;
    }

    const policy = buildDomainScopedPolicy(
      templateKey as keyof typeof COVENANT_POLICY_TEMPLATES,
      domains as PrismDomain[],
      id
    );
    covenantEngine.register(policy);
    sendCreated(res, { policy, registered: true });
  } catch (err) {
    handleRouteError(res, err, "COVENANT domain policy");
  }
});

router.get("/covenant/decisions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { effect, action, limit } = req.query as {
      effect?: string;
      action?: string;
      limit?: string;
    };

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");
    const callerId = req.user?.id?.toString() ?? null;

    const decisions =
      effect === "deny"
        ? getDeniedDecisions(limit ? Number(limit) : 50)
        : getRecentDecisions(limit ? Number(limit) : 50);

    const uiDecisions = decisions
      .filter(d => !action || d.action === action)
      .filter(d =>
        isSuperAdmin ||
        d.subject.tenantId == null ||
        d.subject.tenantId === callerTenantId ||
        d.subject.userId === callerId
      )
      .map(formatDecisionForUI);

    sendSuccess(res, { decisions: uiDecisions, count: uiDecisions.length });
  } catch (err) {
    handleRouteError(res, err, "COVENANT decisions");
  }
});

router.get("/covenant/high-risk-actions", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const actions = covenantEngine.getHighRiskActions();
    sendSuccess(res, { highRiskActions: actions, count: actions.length });
  } catch (err) {
    handleRouteError(res, err, "COVENANT high-risk-actions");
  }
});

export default router;

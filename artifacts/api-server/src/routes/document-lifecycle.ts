import { randomUUID } from 'crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  db,
  documentLifecycleTable,
  documentAuditTrailTable,
  lifecycleWorkflowConfigTable,
  type RoleName,
  ROLE_HIERARCHY,
} from '@szl-holdings/db';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router = Router();

const LIFECYCLE_STATES = ['draft', 'review', 'sign', 'file', 'archive'] as const;
type LifecycleState = typeof LIFECYCLE_STATES[number];

const DEFAULT_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  draft: ['review'],
  review: ['draft', 'sign', 'file'],
  sign: ['review', 'file'],
  file: ['archive'],
  archive: [],
};

const DEFAULT_TRANSITION_ROLES: Record<string, RoleName[]> = {
  'draft→review': ['admin', 'analyst', 'ops'],
  'review→draft': ['admin', 'analyst'],
  'review→sign': ['admin', 'analyst'],
  'review→file': ['admin', 'ops'],
  'sign→review': ['admin', 'analyst'],
  'sign→file': ['admin', 'ops'],
  'file→archive': ['admin', 'super_admin'],
};

const createDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  documentType: z.enum(['filing', 'contract', 'brief', 'memo', 'exhibit', 'certificate', 'deck', 'report']),
  domain: z.enum(['counsel', 'security', 'platform']).default('counsel'),
  matterId: z.number().int().positive().optional(),
  fundId: z.string().optional(),
  jurisdictionCode: z.string().max(20).optional(),
  frozenMetrics: z.record(z.unknown()).optional(),
});

const transitionSchema = z.object({
  targetState: z.enum(LIFECYCLE_STATES),
  reason: z.string().max(500).optional(),
});

function userHasTransitionRole(userRoles: RoleName[], allowedRoles: RoleName[]): boolean {
  if (userRoles.includes('super_admin') || userRoles.includes('admin')) return true;
  const expandedRoles = new Set<RoleName>();
  for (const r of userRoles) {
    expandedRoles.add(r);
    const implied = ROLE_HIERARCHY[r];
    if (implied) implied.forEach((ir: RoleName) => expandedRoles.add(ir));
  }
  return allowedRoles.some((role) => expandedRoles.has(role));
}

async function getWorkflowConfig(
  orgId: number,
  domain: string,
  documentType: string,
): Promise<{ transitions: Record<string, string[]>; roleMatrix: Record<string, string[]> } | null> {
  const [config] = await db
    .select()
    .from(lifecycleWorkflowConfigTable)
    .where(
      and(
        eq(lifecycleWorkflowConfigTable.orgId, orgId),
        eq(lifecycleWorkflowConfigTable.domain, domain),
        eq(lifecycleWorkflowConfigTable.documentType, documentType),
        eq(lifecycleWorkflowConfigTable.isActive, 'true'),
      ),
    )
    .limit(1);

  if (!config) return null;
  return {
    transitions: config.transitions as Record<string, string[]>,
    roleMatrix: config.roleMatrix as Record<string, string[]>,
  };
}

router.use(authMiddleware());

router.get('/documents', async (req: Request, res: Response) => {
  try {
    const { domain, state, type, matterId, fundId } = req.query;
    const orgIds = getUserOrgIds(req.user!);

    const conditions = [];
    if (orgIds !== null) conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));
    if (domain) conditions.push(eq(documentLifecycleTable.domain, domain as string));
    if (state) conditions.push(eq(documentLifecycleTable.lifecycleState, state as string));
    if (type) conditions.push(eq(documentLifecycleTable.documentType, type as string));
    if (fundId) conditions.push(eq(documentLifecycleTable.fundId, fundId as string));

    const results = await db
      .select()
      .from(documentLifecycleTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(documentLifecycleTable.updatedAt))
      .limit(200);

    sendSuccess(res, { documents: results, total: results.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list documents');
  }
});

router.post('/documents', async (req: Request, res: Response) => {
  const parsed = createDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const user = req.user!;
    const orgId = user.orgs[0]?.orgId;
    if (!orgId) {
      sendBadRequest(res, 'User must belong to an organization to create documents');
      return;
    }

    const documentId = `DOC-${randomUUID().slice(0, 8).toUpperCase()}`;

    const [doc] = await db
      .insert(documentLifecycleTable)
      .values({
        documentId,
        orgId,
        title: parsed.data.title,
        documentType: parsed.data.documentType,
        lifecycleState: 'draft',
        domain: parsed.data.domain,
        matterId: parsed.data.matterId,
        fundId: parsed.data.fundId,
        version: 1,
        signatureStatus: 'none',
        jurisdictionCode: parsed.data.jurisdictionCode,
        frozenMetrics: parsed.data.frozenMetrics,
        createdById: user.id,
      })
      .returning();

    await db.insert(documentAuditTrailTable).values({
      documentId,
      fromState: null,
      toState: 'draft',
      performedById: user.id,
      performedByName: user.displayName,
      roleUsed: user.roles[0] ?? 'unknown',
      reason: 'Document created',
      orgId,
    });

    logger.info({ documentId, type: doc.documentType, domain: doc.domain, orgId }, 'Document created in lifecycle engine');

    sendSuccess(res, doc, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create document');
  }
});

router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const conditions = [eq(documentLifecycleTable.documentId, req.params.id)];
    if (orgIds !== null) conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));

    const [doc] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!doc) {
      sendNotFound(res, 'Document');
      return;
    }
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get document');
  }
});

router.post('/documents/:id/transition', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgIds = getUserOrgIds(user);
    const conditions = [eq(documentLifecycleTable.documentId, req.params.id)];
    if (orgIds !== null) conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));

    const [doc] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!doc) {
      sendNotFound(res, 'Document');
      return;
    }

    const parsed = transitionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const { targetState, reason } = parsed.data;
    const currentState = doc.lifecycleState as LifecycleState;

    const customConfig = await getWorkflowConfig(doc.orgId, doc.domain, doc.documentType);
    const transitions = customConfig?.transitions ?? DEFAULT_TRANSITIONS;
    const roleMatrix = customConfig?.roleMatrix ?? DEFAULT_TRANSITION_ROLES;

    const validTargets = (transitions[currentState] ?? []) as LifecycleState[];
    if (!validTargets.includes(targetState)) {
      sendBadRequest(
        res,
        `Invalid transition: ${currentState} → ${targetState}. Valid targets: ${validTargets.join(', ') || 'none'}`,
      );
      return;
    }

    const transitionKey = `${currentState}→${targetState}`;
    const allowedRoles = (roleMatrix[transitionKey] ?? ['admin']) as RoleName[];
    if (!userHasTransitionRole(user.roles, allowedRoles)) {
      sendForbidden(
        res,
        `Your roles (${user.roles.join(', ')}) cannot perform transition ${transitionKey}. Required: ${allowedRoles.join(', ')}`,
      );
      return;
    }

    const newVersion = doc.version + 1;
    const newSignatureStatus = targetState === 'sign' ? 'pending' : doc.signatureStatus;
    const matchedRole = user.roles.find((r) => allowedRoles.includes(r as RoleName)) ?? user.roles[0] ?? 'unknown';

    const [updated] = await db
      .update(documentLifecycleTable)
      .set({
        lifecycleState: targetState,
        version: newVersion,
        signatureStatus: newSignatureStatus,
        updatedAt: new Date(),
      })
      .where(eq(documentLifecycleTable.documentId, req.params.id))
      .returning();

    await db.insert(documentAuditTrailTable).values({
      documentId: doc.documentId,
      fromState: currentState,
      toState: targetState,
      performedById: user.id,
      performedByName: user.displayName,
      roleUsed: matchedRole,
      reason,
      orgId: doc.orgId,
    });

    logger.info(
      { documentId: doc.documentId, from: currentState, to: targetState, userId: user.id, role: matchedRole },
      'Document lifecycle transition',
    );

    sendSuccess(res, {
      documentId: doc.documentId,
      previousState: currentState,
      currentState: targetState,
      version: newVersion,
      transition: transitionKey,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to transition document');
  }
});

router.get('/documents/:id/audit', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const conditions = [eq(documentAuditTrailTable.documentId, req.params.id)];
    if (orgIds !== null) conditions.push(inArray(documentAuditTrailTable.orgId, [...orgIds]));

    const trail = await db
      .select()
      .from(documentAuditTrailTable)
      .where(and(...conditions))
      .orderBy(desc(documentAuditTrailTable.occurredAt));

    if (trail.length === 0) {
      sendNotFound(res, 'Document audit trail');
      return;
    }

    sendSuccess(res, { documentId: req.params.id, auditTrail: trail });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get audit trail');
  }
});

router.get('/lifecycle/states', (_req: Request, res: Response) => {
  sendSuccess(res, {
    states: LIFECYCLE_STATES,
    transitions: DEFAULT_TRANSITIONS,
    roleMatrix: DEFAULT_TRANSITION_ROLES,
  });
});

router.post('/documents/:id/freeze-metrics', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgIds = getUserOrgIds(user);
    const conditions = [eq(documentLifecycleTable.documentId, req.params.id)];
    if (orgIds !== null) conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));

    const [doc] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!doc) {
      sendNotFound(res, 'Document');
      return;
    }

    const { metrics } = req.body;
    if (!metrics || typeof metrics !== 'object') {
      sendBadRequest(res, 'metrics object is required');
      return;
    }

    const frozen = {
      ...metrics,
      frozenAt: new Date().toISOString(),
      frozenBy: user.id,
      frozenByName: user.displayName,
    };

    const [updated] = await db
      .update(documentLifecycleTable)
      .set({
        frozenMetrics: frozen,
        updatedAt: new Date(),
      })
      .where(eq(documentLifecycleTable.documentId, req.params.id))
      .returning();

    sendSuccess(res, { documentId: doc.documentId, frozenMetrics: frozen });
  } catch (err) {
    handleRouteError(res, err, 'Failed to freeze metrics');
  }
});

router.get('/workflow-configs', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const conditions = [eq(lifecycleWorkflowConfigTable.isActive, 'true')];
    if (orgIds !== null) conditions.push(inArray(lifecycleWorkflowConfigTable.orgId, [...orgIds]));

    const configs = await db
      .select()
      .from(lifecycleWorkflowConfigTable)
      .where(and(...conditions));

    sendSuccess(res, { configs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list workflow configs');
  }
});

router.post('/workflow-configs', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (!user.roles.includes('admin') && !user.roles.includes('super_admin')) {
      sendForbidden(res, 'Only admins can create workflow configurations');
      return;
    }

    const orgId = user.orgs[0]?.orgId;
    if (!orgId) {
      sendBadRequest(res, 'User must belong to an organization');
      return;
    }

    const { domain, documentType, states, transitions, roleMatrix } = req.body;
    if (!domain || !documentType || !states || !transitions || !roleMatrix) {
      sendBadRequest(res, 'domain, documentType, states, transitions, and roleMatrix are required');
      return;
    }

    const [config] = await db
      .insert(lifecycleWorkflowConfigTable)
      .values({
        orgId,
        domain,
        documentType,
        states,
        transitions,
        roleMatrix,
      })
      .returning();

    sendSuccess(res, config, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create workflow config');
  }
});

export default router;

/**
 * Decision Fabric API
 *
 * Routes (mounted under /decision-fabric):
 *   POST  /correlations/link
 *   GET   /workflows/:runId/360
 *   GET   /entities/:entityType/:entityId/investigation
 *   GET   /recommendations/:recommendationId/trace
 *   GET   /approvals/bottlenecks
 *   GET   /policies/failures
 *   GET   /predictions/drift
 *   POST  /decisions
 *   GET   /decisions
 *   GET   /decisions/:id
 *   POST  /decisions/:id/actual-outcome
 *   POST  /policy-snapshots
 *   POST  /simulation-snapshots
 *   GET   /playbooks
 *   POST  /playbooks/generate
 *   POST  /playbooks/:id/review
 *   GET   /clusters
 *   POST  /learning/run
 *
 * Tenant isolation:
 *   Org id is read from the canonical session shape (`req.user.orgs[0].orgId`).
 *   Non-admin callers without an org membership receive 403; admins/super-admins
 *   may operate without an org id (platform-scoped). All library functions also
 *   filter by org id when one is provided, so cross-tenant reads/updates by
 *   numeric record id are not possible for non-admin callers.
 */

import {
  generatePlaybookSuggestions,
  getApprovalBottlenecks,
  getDecision,
  getDomainClusterStats,
  getPolicyFailures,
  getPredictionDrift,
  getWorkflow360,
  investigateEntity,
  linkEvent,
  listDecisions,
  listPlaybookSuggestions,
  recordActualOutcome,
  recordDecision,
  reviewPlaybookSuggestion,
  runLearningCycle,
  snapshotPolicy,
  snapshotSimulation,
  traceRecommendation,
} from '@szl-holdings/decision-fabric';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

const decisionFabricRouter: IRouter = Router();

decisionFabricRouter.use('/decision-fabric', authMiddleware({ required: true }));

const FABRIC_DOMAIN = z.enum([
  'maritime',
  'security',
  'real_estate',
  'aiops',
  'research',
  'creative',
  'analytics',
  'infrastructure',
  'readiness',
  'general',
  'global',
]);
type FabricDomain = z.infer<typeof FABRIC_DOMAIN>;

const PLAYBOOK_STATUS = z.enum(['proposed', 'accepted', 'rejected', 'promoted_to_workflow']);
type PlaybookStatus = z.infer<typeof PLAYBOOK_STATUS>;

/**
 * Resolve the calling org. Returns:
 *   { orgId: number }  — normal tenant member
 *   { orgId: null   }  — admin/super_admin operating cross-tenant
 *   null               — caller has no org membership and is not admin
 *                        (route should respond 403)
 *
 * Reads from the canonical `req.user.orgs[]` shape declared in
 * `middlewares/auth.ts`; the auth middleware guarantees `req.user` is set on
 * any route past `authMiddleware({ required: true })`.
 */
function resolveCallerOrg(user: AuthenticatedUser | undefined): { orgId: number | null } | null {
  if (!user) return null;
  const isAdmin = user.roles.includes('admin') || user.roles.includes('super_admin');
  const orgId = user.orgs[0]?.orgId;
  if (orgId != null) return { orgId };
  if (isAdmin) return { orgId: null };
  return null;
}

/** Coerce a single path/query param to a trimmed string, rejecting arrays. */
function singleParam(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function singleQuery(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

function intQuery(raw: unknown): number | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function domainQuery(raw: unknown): FabricDomain | undefined {
  const s = singleQuery(raw);
  if (!s) return undefined;
  const parsed = FABRIC_DOMAIN.safeParse(s);
  return parsed.success ? parsed.data : undefined;
}

function playbookStatusQuery(raw: unknown): PlaybookStatus | undefined {
  const s = singleQuery(raw);
  if (!s) return undefined;
  const parsed = PLAYBOOK_STATUS.safeParse(s);
  return parsed.success ? parsed.data : undefined;
}

// ─── Correlation ────────────────────────────────────────────────────────────

const linkSchema = z.object({
  correlationId: z.string().min(1),
  primitive: z.enum([
    'prism_bus',
    'proof_chain',
    'outcome_graph',
    'covenant_policy',
    'workflow_engine',
    'monte_carlo',
    'approval',
    'decision_record',
  ]),
  primitiveId: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  workflowRunId: z.string().optional(),
  domain: FABRIC_DOMAIN.optional(),
  metadata: z.record(z.unknown()).optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/correlations/link',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const parsed = linkSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const row = await linkEvent({ ...parsed.data, orgId: ctx.orgId });
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/correlations/link error');
      return res.status(500).json({ error: 'Failed to link event' });
    }
  },
);

// ─── Workflow 360 ────────────────────────────────────────────────────────────

decisionFabricRouter.get(
  '/decision-fabric/workflows/:runId/360',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const runId = singleParam(req.params.runId);
      if (!runId) return res.status(400).json({ error: 'Invalid runId' });
      const view = await getWorkflow360(runId, { orgId: ctx.orgId });
      return res.json({ success: true, data: view });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/workflows/:runId/360 error');
      return res.status(500).json({ error: 'Failed to assemble workflow 360' });
    }
  },
);

// ─── Entity Investigation ────────────────────────────────────────────────────

decisionFabricRouter.get(
  '/decision-fabric/entities/:entityType/:entityId/investigation',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const entityType = singleParam(req.params.entityType);
      const entityId = singleParam(req.params.entityId);
      if (!entityType || !entityId)
        return res.status(400).json({ error: 'Invalid entityType/entityId' });
      const result = await investigateEntity(entityType, entityId, { orgId: ctx.orgId });
      return res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/entities/.../investigation error');
      return res.status(500).json({ error: 'Failed to investigate entity' });
    }
  },
);

// ─── Traceability ────────────────────────────────────────────────────────────

decisionFabricRouter.get(
  '/decision-fabric/recommendations/:recommendationId/trace',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const recommendationId = singleParam(req.params.recommendationId);
      if (!recommendationId) return res.status(400).json({ error: 'Invalid recommendationId' });
      const trace = await traceRecommendation(recommendationId, { orgId: ctx.orgId });
      return res.json({ success: true, data: trace });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/recommendations/:id/trace error');
      return res.status(500).json({ error: 'Failed to trace recommendation' });
    }
  },
);

// ─── Bottlenecks ─────────────────────────────────────────────────────────────

decisionFabricRouter.get(
  '/decision-fabric/approvals/bottlenecks',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const data = await getApprovalBottlenecks({
        orgId: ctx.orgId,
        limit: intQuery(req.query.limit),
      });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/approvals/bottlenecks error');
      return res.status(500).json({ error: 'Failed to fetch bottlenecks' });
    }
  },
);

decisionFabricRouter.get(
  '/decision-fabric/policies/failures',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const data = await getPolicyFailures({ orgId: ctx.orgId, limit: intQuery(req.query.limit) });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/policies/failures error');
      return res.status(500).json({ error: 'Failed to fetch policy failures' });
    }
  },
);

decisionFabricRouter.get(
  '/decision-fabric/predictions/drift',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const data = await getPredictionDrift({ orgId: ctx.orgId, limit: intQuery(req.query.limit) });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error({ err }, 'GET /decision-fabric/predictions/drift error');
      return res.status(500).json({ error: 'Failed to fetch prediction drift' });
    }
  },
);

// ─── Decision Records ────────────────────────────────────────────────────────

const recordDecisionSchema = z.object({
  domain: FABRIC_DOMAIN.optional(),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  title: z.string().min(1),
  rationale: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  decidedByRole: z.string().optional(),
  ownerUserId: z.number().int().optional(),
  outcomeGraphId: z.number().int().optional(),
  proofChainId: z.number().int().optional(),
  policyVersionId: z.number().int().optional(),
  simulationSnapshotId: z.number().int().optional(),
  approvalId: z.number().int().optional(),
  workflowRunId: z.string().optional(),
  recommendationId: z.string().optional(),
  predictedOutcome: z.record(z.unknown()).optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'executed', 'rolled_back', 'superseded']).optional(),
});

decisionFabricRouter.post('/decision-fabric/decisions', async (req: Request, res: Response) => {
  try {
    const ctx = resolveCallerOrg(req.user);
    if (!ctx) return res.status(403).json({ error: 'Org membership required' });
    const parsed = recordDecisionSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    const row = await recordDecision({
      ...parsed.data,
      orgId: ctx.orgId,
      decidedByUserId: req.user?.id ?? null,
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, 'POST /decision-fabric/decisions error');
    return res.status(500).json({ error: 'Failed to record decision' });
  }
});

decisionFabricRouter.get('/decision-fabric/decisions', async (req: Request, res: Response) => {
  try {
    const ctx = resolveCallerOrg(req.user);
    if (!ctx) return res.status(403).json({ error: 'Org membership required' });
    const data = await listDecisions({
      orgId: ctx.orgId,
      domain: domainQuery(req.query.domain),
      entityType: singleQuery(req.query.entityType),
      entityId: singleQuery(req.query.entityId),
      workflowRunId: singleQuery(req.query.workflowRunId),
      recommendationId: singleQuery(req.query.recommendationId),
      correlationId: singleQuery(req.query.correlationId),
      limit: intQuery(req.query.limit),
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'GET /decision-fabric/decisions error');
    return res.status(500).json({ error: 'Failed to list decisions' });
  }
});

decisionFabricRouter.get('/decision-fabric/decisions/:id', async (req: Request, res: Response) => {
  try {
    const ctx = resolveCallerOrg(req.user);
    if (!ctx) return res.status(403).json({ error: 'Org membership required' });
    const id = Number(singleParam(req.params.id));
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await getDecision(id, ctx.orgId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, 'GET /decision-fabric/decisions/:id error');
    return res.status(500).json({ error: 'Failed to get decision' });
  }
});

const actualOutcomeSchema = z.object({
  actualOutcome: z.record(z.unknown()),
  predictionError: z.number().optional(),
  status: z.enum(['draft', 'executed', 'rolled_back', 'superseded']).optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/decisions/:id/actual-outcome',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const id = Number(singleParam(req.params.id));
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
      const parsed = actualOutcomeSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const row = await recordActualOutcome({ decisionId: id, orgId: ctx.orgId, ...parsed.data });
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true, data: row });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/decisions/:id/actual-outcome error');
      return res.status(500).json({ error: 'Failed to record actual outcome' });
    }
  },
);

// ─── Snapshots ───────────────────────────────────────────────────────────────

const policySnapshotSchema = z.object({
  policyId: z.string().min(1),
  version: z.string().min(1),
  policyName: z.string().min(1),
  effect: z.enum(['allow', 'deny']),
  body: z.record(z.unknown()),
});

decisionFabricRouter.post(
  '/decision-fabric/policy-snapshots',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const parsed = policySnapshotSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const row = await snapshotPolicy({
        ...parsed.data,
        orgId: ctx.orgId,
        authoredByUserId: req.user?.id ?? null,
      });
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/policy-snapshots error');
      return res.status(500).json({ error: 'Failed to snapshot policy' });
    }
  },
);

const simulationSnapshotSchema = z.object({
  domain: FABRIC_DOMAIN.optional(),
  scenarioId: z.string().min(1),
  scenarioName: z.string().min(1),
  inputs: z.record(z.unknown()).optional(),
  parameters: z.record(z.unknown()).optional(),
  results: z.record(z.unknown()).optional(),
  confidenceInterval: z.record(z.unknown()).optional(),
  iterations: z.number().int().optional(),
  seed: z.string().optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/simulation-snapshots',
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const parsed = simulationSnapshotSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const row = await snapshotSimulation({ ...parsed.data, orgId: ctx.orgId });
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/simulation-snapshots error');
      return res.status(500).json({ error: 'Failed to snapshot simulation' });
    }
  },
);

// ─── Playbooks ───────────────────────────────────────────────────────────────

decisionFabricRouter.get('/decision-fabric/playbooks', async (req: Request, res: Response) => {
  try {
    const ctx = resolveCallerOrg(req.user);
    if (!ctx) return res.status(403).json({ error: 'Org membership required' });
    const data = await listPlaybookSuggestions({
      orgId: ctx.orgId,
      status: playbookStatusQuery(req.query.status),
      limit: intQuery(req.query.limit),
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'GET /decision-fabric/playbooks error');
    return res.status(500).json({ error: 'Failed to list playbooks' });
  }
});

const generatePlaybookSchema = z.object({
  domain: FABRIC_DOMAIN.optional(),
  windowDays: z.number().int().positive().optional(),
  minSampleSize: z.number().int().positive().optional(),
  minSuccessRate: z.number().min(0).max(1).optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/playbooks/generate',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const parsed = generatePlaybookSchema.safeParse(req.body ?? {});
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const data = await generatePlaybookSuggestions({ orgId: ctx.orgId, ...parsed.data });
      return res.status(201).json({ success: true, data });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/playbooks/generate error');
      return res.status(500).json({ error: 'Failed to generate playbooks' });
    }
  },
);

const reviewPlaybookSchema = z.object({
  status: PLAYBOOK_STATUS,
  promotedWorkflowId: z.string().optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/playbooks/:id/review',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const id = Number(singleParam(req.params.id));
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
      const parsed = reviewPlaybookSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      if (!req.user?.id) return res.status(401).json({ error: 'User required' });
      const row = await reviewPlaybookSuggestion(
        id,
        parsed.data.status,
        req.user.id,
        ctx.orgId,
        parsed.data.promotedWorkflowId,
      );
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true, data: row });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/playbooks/:id/review error');
      return res.status(500).json({ error: 'Failed to review playbook' });
    }
  },
);

decisionFabricRouter.get('/decision-fabric/clusters', async (req: Request, res: Response) => {
  try {
    const ctx = resolveCallerOrg(req.user);
    if (!ctx) return res.status(403).json({ error: 'Org membership required' });
    const data = await getDomainClusterStats({
      orgId: ctx.orgId,
      domain: domainQuery(req.query.domain),
      windowDays: intQuery(req.query.windowDays),
      limit: intQuery(req.query.limit),
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'GET /decision-fabric/clusters error');
    return res.status(500).json({ error: 'Failed to fetch cluster stats' });
  }
});

// ─── Learning Loop ───────────────────────────────────────────────────────────

const learningRunSchema = z.object({
  windowDays: z.number().int().positive().optional(),
});

decisionFabricRouter.post(
  '/decision-fabric/learning/run',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const ctx = resolveCallerOrg(req.user);
      if (!ctx) return res.status(403).json({ error: 'Org membership required' });
      const parsed = learningRunSchema.safeParse(req.body ?? {});
      if (!parsed.success)
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const result = await runLearningCycle({
        orgId: ctx.orgId,
        windowDays: parsed.data.windowDays,
        triggeredBy: req.user?.email ?? 'decision-fabric-api',
      });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, 'POST /decision-fabric/learning/run error');
      return res.status(500).json({ error: 'Failed to run learning cycle' });
    }
  },
);

export default decisionFabricRouter;

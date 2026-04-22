import {
  alloyAgentPerformanceSnapshots,
  alloyAgentReflections,
  alloyConfidenceAlerts,
  alloyDecisionOutcomes,
  alloySelfImprovementConfig,
  alloySkillRegistryTable,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  alloyResourceBodySchema,
  alloySkillDeleteSchema,
  alloySkillMutationSchema,
  listQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import {
  type AuthenticatedUser,
  authMiddleware,
  isElevatedUser,
  requireRole,
} from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

// Defense-in-depth: this router is mounted under /alloy in
// routes/groups/alloy.ts which already applies tenantScope({ required: true }),
// but we keep an explicit gate here so the file cannot silently regress to
// no-org access if it is ever re-mounted under a different prefix.
router.use(tenantScope({ required: true }));

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes('super_admin') || user.roles.includes('admin');
}

function getUserOrgIds(user?: AuthenticatedUser): number[] {
  if (!user) return [];
  return user.orgs.map((o) => o.orgId);
}

function requireTenantAccessOrAdmin(
  user: AuthenticatedUser | undefined,
  tenantId: string | undefined | null,
): boolean {
  if (!user) return false;
  if (isElevatedUser(user)) return true;
  if (!tenantId) return false;
  const userOrgIds = getUserOrgIds(user).map(String);
  return userOrgIds.includes(tenantId);
}

// ─── Skill Registry ────────────────────────────────────────────────────────────

router.get('/alloy/skills', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const capability = req.query.capability as string | undefined;
    const domain = req.query.domain as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const builtinOnly = req.query.builtinOnly === 'true';

    const { skillRegistry } = await import('@szl-holdings/ai-engine');

    const conditions = [];
    if (capability) conditions.push(eq(alloySkillRegistryTable.capability, capability));
    if (domain) conditions.push(eq(alloySkillRegistryTable.domain, domain));
    if (!includeInactive) conditions.push(eq(alloySkillRegistryTable.isActive, true));
    if (builtinOnly) conditions.push(eq(alloySkillRegistryTable.isBuiltin, true));

    const dbSkills = await db
      .select()
      .from(alloySkillRegistryTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloySkillRegistryTable.updatedAt))
      .limit(limit)
      .offset(offset);

    const inMemorySkills = skillRegistry.getAll(includeInactive).filter((s) => {
      if (capability && s.capability !== capability) return false;
      if (domain && s.domain !== domain && s.domain !== 'cross_domain') return false;
      if (builtinOnly && !s.isBuiltin) return false;
      return true;
    });

    const dbSkillIds = new Set(dbSkills.map((s) => s.skillId));
    const mergedSkills = [
      ...dbSkills.map((row) => ({
        skillId: row.skillId,
        name: row.name,
        version: row.version,
        capability: row.capability,
        domain: row.domain,
        description: row.description,
        triggerConditions: row.triggerConditions,
        requiredInputs: row.requiredInputs,
        optionalInputs: row.optionalInputs,
        outputSchema: row.outputSchema,
        outputDecisionType: row.outputDecisionType,
        chainMetadata: row.chainMetadata,
        analyticMode: row.analyticMode,
        policyClass: row.policyClass,
        estimatedLatencyMs: row.estimatedLatencyMs,
        tags: row.tags,
        isBuiltin: row.isBuiltin,
        isActive: row.isActive,
        registeredAt: row.createdAt,
        updatedAt: row.updatedAt,
        source: 'db',
      })),
      ...inMemorySkills
        .filter((s) => !dbSkillIds.has(s.skillId))
        .map((s) => ({ ...s, source: 'builtin' })),
    ];

    sendSuccess(res, mergedSkills);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list skills');
  }
});

router.get('/alloy/skills/:skillId', authMiddleware(), async (req, res) => {
  try {
    const skillId = req.params.skillId as string;
    const { skillRegistry } = await import('@szl-holdings/ai-engine');

    const inMemory = skillRegistry.get(skillId);
    if (inMemory) {
      return sendSuccess(res, { ...inMemory, source: 'builtin' });
    }

    const [dbSkill] = await db
      .select()
      .from(alloySkillRegistryTable)
      .where(eq(alloySkillRegistryTable.skillId, skillId))
      .limit(1);

    if (!dbSkill) return sendNotFound(res, 'Skill not found');

    sendSuccess(res, { ...dbSkill, source: 'db' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch skill');
  }
});

router.post(
  '/alloy/skills',
  authMiddleware(),
  requireRole('admin'),
  validateBody(alloySkillMutationSchema),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const {
        name,
        version,
        capability,
        domain,
        description,
        triggerConditions,
        requiredInputs,
        optionalInputs,
        outputSchema,
        outputDecisionType,
        chainMetadata,
        analyticMode,
        policyClass,
        estimatedLatencyMs,
        tags,
      } = req.body;

      if (
        !name ||
        !capability ||
        !domain ||
        !description ||
        !outputDecisionType ||
        !analyticMode ||
        !policyClass
      ) {
        return sendBadRequest(
          res,
          'Missing required fields: name, capability, domain, description, outputDecisionType, analyticMode, policyClass',
        );
      }

      const { skillRegistry } = await import('@szl-holdings/ai-engine');
      const registered = skillRegistry.register({
        name,
        version: version ?? '1.0.0',
        capability,
        domain,
        description,
        triggerConditions: triggerConditions ?? [],
        requiredInputs: requiredInputs ?? [],
        optionalInputs: optionalInputs ?? [],
        outputSchema: outputSchema ?? [],
        outputDecisionType,
        chainMetadata: chainMetadata ?? {
          canChainTo: [],
          canChainFrom: [],
          requiredPreconditions: [],
          outputsFedToNext: [],
          maxChainDepth: 4,
          parallelizable: false,
        },
        analyticMode,
        policyClass,
        estimatedLatencyMs: estimatedLatencyMs ?? 10000,
        tags: tags ?? [],
        isBuiltin: false,
        isActive: true,
      });

      const [saved] = await db
        .insert(alloySkillRegistryTable)
        .values({
          skillId: registered.skillId,
          name: registered.name,
          version: registered.version,
          capability: registered.capability,
          domain: registered.domain,
          description: registered.description,
          triggerConditions: registered.triggerConditions as unknown as Record<string, unknown>[],
          requiredInputs: registered.requiredInputs as unknown as Record<string, unknown>[],
          optionalInputs: registered.optionalInputs as unknown as Record<string, unknown>[],
          outputSchema: registered.outputSchema as unknown as Record<string, unknown>[],
          outputDecisionType: registered.outputDecisionType,
          chainMetadata: registered.chainMetadata as unknown as Record<string, unknown>,
          analyticMode: registered.analyticMode,
          policyClass: registered.policyClass,
          estimatedLatencyMs: registered.estimatedLatencyMs,
          tags: registered.tags,
          isBuiltin: false,
          isActive: true,
          registeredBy: String(user.id),
          orgId: getUserOrgIds(user)[0] ?? null,
        })
        .returning();

      logger.info({ skillId: registered.skillId, userId: user.id }, 'New skill registered');
      sendCreated(res, saved);
    } catch (err) {
      handleRouteError(res, err, 'Failed to register skill');
    }
  },
);

router.patch(
  '/alloy/skills/:skillId',
  authMiddleware(),
  requireRole('admin'),
  validateBody(alloySkillMutationSchema),
  async (req, res) => {
    try {
      const skillId = req.params.skillId as string;
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const { skillRegistry } = await import('@szl-holdings/ai-engine');
      const inMemory = skillRegistry.get(skillId);
      if (inMemory?.isBuiltin && !isGlobalAdmin(user)) {
        return sendForbidden(res, 'Built-in skills can only be modified by platform admins');
      }

      const updates: Record<string, unknown> = {};
      const allowed = [
        'name',
        'description',
        'isActive',
        'triggerConditions',
        'requiredInputs',
        'optionalInputs',
        'chainMetadata',
        'tags',
        'estimatedLatencyMs',
      ];
      for (const field of allowed) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      if (Object.keys(updates).length === 0)
        return sendBadRequest(res, 'No valid fields to update');

      if (inMemory) {
        skillRegistry.update(skillId, updates as Parameters<typeof skillRegistry.update>[1]);
      }

      const [existing] = await db
        .select()
        .from(alloySkillRegistryTable)
        .where(eq(alloySkillRegistryTable.skillId, skillId))
        .limit(1);
      if (existing) {
        const [updated] = await db
          .update(alloySkillRegistryTable)
          .set({
            ...(updates as Partial<typeof alloySkillRegistryTable.$inferInsert>),
            updatedAt: new Date(),
          })
          .where(eq(alloySkillRegistryTable.skillId, skillId))
          .returning();
        return sendSuccess(res, updated);
      }

      sendSuccess(res, skillRegistry.get(skillId));
    } catch (err) {
      handleRouteError(res, err, 'Failed to update skill');
    }
  },
);

router.delete(
  '/alloy/skills/:skillId',
  validateBody(alloySkillDeleteSchema),
  authMiddleware(),
  requireRole('admin'),
  async (req, res) => {
    try {
      const skillId = req.params.skillId as string;
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const { skillRegistry } = await import('@szl-holdings/ai-engine');
      const inMemory = skillRegistry.get(skillId);
      if (inMemory?.isBuiltin && !isGlobalAdmin(user)) {
        return sendForbidden(res, 'Built-in skills cannot be deleted. Deactivate them instead.');
      }

      skillRegistry.deactivate(skillId);

      await db
        .update(alloySkillRegistryTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(alloySkillRegistryTable.skillId, skillId));

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to deactivate skill');
    }
  },
);

// ─── Skill Chain Management ────────────────────────────────────────────────────

router.get('/alloy/skills/chains/list', authMiddleware(), async (_req, res) => {
  try {
    const { skillManager } = await import('@szl-holdings/ai-engine');
    sendSuccess(res, skillManager.listChains());
  } catch (err) {
    handleRouteError(res, err, 'Failed to list chains');
  }
});

router.post(
  '/alloy/skills/chains/compose',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const { capabilities, name, description } = req.body;
      if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
        return sendBadRequest(res, 'capabilities array is required');
      }
      if (!name) return sendBadRequest(res, 'name is required');

      const { skillManager } = await import('@szl-holdings/ai-engine');
      const result = skillManager.composeChain(capabilities, name, description ?? '');
      sendCreated(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to compose chain');
    }
  },
);

router.get('/alloy/skills/chains/prebuilt/:scenario', authMiddleware(), async (req, res) => {
  try {
    const scenario = req.params.scenario as
      | 'full_incident'
      | 'quick_triage'
      | 'compliance_review'
      | 'executive_brief';
    const validScenarios = [
      'full_incident',
      'quick_triage',
      'compliance_review',
      'executive_brief',
    ];
    if (!validScenarios.includes(scenario)) {
      return sendBadRequest(res, `Invalid scenario. Valid options: ${validScenarios.join(', ')}`);
    }

    const { skillManager } = await import('@szl-holdings/ai-engine');
    const result = skillManager.getPrebuiltChain(scenario);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get prebuilt chain');
  }
});

router.post(
  '/alloy/skills/chains/:chainId/plan',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const chainId = req.params.chainId as string;
      const inputs = req.body.inputs ?? {};

      const { skillManager } = await import('@szl-holdings/ai-engine');
      const plan = skillManager.buildExecutionPlan(chainId, inputs);
      if (!plan) return sendNotFound(res, 'Chain not found');

      sendSuccess(res, plan);
    } catch (err) {
      handleRouteError(res, err, 'Failed to build execution plan');
    }
  },
);

router.delete(
  '/alloy/skills/chains/:chainId',
  validateBody(alloySkillDeleteSchema),
  authMiddleware(),
  requireRole('admin'),
  async (req, res) => {
    try {
      const chainId = req.params.chainId as string;
      const { skillManager } = await import('@szl-holdings/ai-engine');
      const deleted = skillManager.deleteChain(chainId);
      if (!deleted) return sendNotFound(res, 'Chain not found');
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete chain');
    }
  },
);

router.post(
  '/alloy/skills/discover',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const { capabilities, domain, tags, triggerContext } = req.body;
      const { skillManager } = await import('@szl-holdings/ai-engine');
      const discovered = skillManager.discover({ capabilities, domain, tags, triggerContext });
      sendSuccess(res, discovered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to discover skills');
    }
  },
);

router.post(
  '/alloy/skills/select',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const { task, context, maxSkills } = req.body;
      if (!task) return sendBadRequest(res, 'task is required');
      const { skillManager } = await import('@szl-holdings/ai-engine');
      const result = skillManager.select(task, context ?? {}, maxSkills ?? 4);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to select skills');
    }
  },
);

// ─── Decision Outcome Tracking ────────────────────────────────────────────────

router.post(
  '/alloy/decisions/:decisionId/outcome',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const decisionId = req.params.decisionId as string;
      const user = req.user as AuthenticatedUser | undefined;
      const {
        agentId,
        tenantId,
        skillId,
        capability,
        actualOutcome,
        wasActedOn,
        wasOverridden,
        overrideReason,
        actualImpactLevel,
        finalAction,
        executionResult,
        humanReviewRequested,
      } = req.body;

      if (!agentId || !tenantId || !actualOutcome) {
        return sendBadRequest(res, 'agentId, tenantId, and actualOutcome are required');
      }

      if (!requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's data");
      }

      const validOutcomes = ['accepted', 'rejected', 'overridden', 'deferred', 'pending'];
      if (!validOutcomes.includes(actualOutcome)) {
        return sendBadRequest(res, `Invalid actualOutcome. Valid: ${validOutcomes.join(', ')}`);
      }

      const [existing] = await db
        .select()
        .from(alloyDecisionOutcomes)
        .where(eq(alloyDecisionOutcomes.decisionId, decisionId))
        .limit(1);

      const now = new Date();

      if (existing) {
        const [updated] = await db
          .update(alloyDecisionOutcomes)
          .set({
            actualOutcome,
            wasActedOn: wasActedOn ?? false,
            wasOverridden: wasOverridden ?? false,
            overrideReason: overrideReason ?? null,
            actualImpactLevel: actualImpactLevel ?? null,
            finalAction: finalAction ?? null,
            executionResult: executionResult ?? null,
            humanReviewRequested: humanReviewRequested ?? false,
            resolvedAt: actualOutcome !== 'pending' ? now : null,
          })
          .where(eq(alloyDecisionOutcomes.decisionId, decisionId))
          .returning();

        const { scoringEngine } = await import('@szl-holdings/ai-engine');
        scoringEngine.recordOutcome({
          decisionId,
          agentId: existing.agentId,
          tenantId: existing.tenantId,
          skillId: existing.skillId,
          capability: existing.capability,
          predictedConfidence: existing.predictedConfidence,
          actualOutcome,
          wasActedOn: wasActedOn ?? false,
          wasOverridden: wasOverridden ?? false,
          overrideReason: overrideReason ?? null,
          predictedImpactLevel: existing.predictedImpactLevel,
          actualImpactLevel: actualImpactLevel ?? null,
          recommendedAction: existing.recommendedAction,
          finalAction: finalAction ?? null,
          executionResult: executionResult ?? null,
          humanReviewRequired: existing.humanReviewRequired,
          humanReviewRequested: humanReviewRequested ?? false,
          decisionType: existing.decisionType,
          recordedAt: existing.recordedAt.toISOString(),
          resolvedAt: actualOutcome !== 'pending' ? now.toISOString() : null,
        });

        return sendSuccess(res, updated);
      }

      const {
        predictedConfidence,
        predictedImpactLevel,
        recommendedAction,
        humanReviewRequired,
        decisionType,
      } = req.body;

      if (
        predictedConfidence == null ||
        !predictedImpactLevel ||
        !recommendedAction ||
        !decisionType
      ) {
        return sendBadRequest(
          res,
          'For new outcomes: predictedConfidence, predictedImpactLevel, recommendedAction, decisionType are required',
        );
      }

      const [created] = await db
        .insert(alloyDecisionOutcomes)
        .values({
          decisionId,
          agentId,
          tenantId,
          skillId: skillId ?? null,
          capability: capability ?? null,
          predictedConfidence,
          actualOutcome,
          wasActedOn: wasActedOn ?? false,
          wasOverridden: wasOverridden ?? false,
          overrideReason: overrideReason ?? null,
          predictedImpactLevel,
          actualImpactLevel: actualImpactLevel ?? null,
          recommendedAction,
          finalAction: finalAction ?? null,
          executionResult: executionResult ?? null,
          humanReviewRequired: humanReviewRequired ?? false,
          humanReviewRequested: humanReviewRequested ?? false,
          decisionType,
          resolvedAt: actualOutcome !== 'pending' ? now : null,
        })
        .returning();

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      scoringEngine.recordOutcome({
        decisionId,
        agentId,
        tenantId,
        skillId: skillId ?? null,
        capability: capability ?? null,
        predictedConfidence,
        actualOutcome,
        wasActedOn: wasActedOn ?? false,
        wasOverridden: wasOverridden ?? false,
        overrideReason: overrideReason ?? null,
        predictedImpactLevel,
        actualImpactLevel: actualImpactLevel ?? null,
        recommendedAction,
        finalAction: finalAction ?? null,
        executionResult: executionResult ?? null,
        humanReviewRequired: humanReviewRequired ?? false,
        humanReviewRequested: humanReviewRequested ?? false,
        decisionType,
        recordedAt: now.toISOString(),
        resolvedAt: actualOutcome !== 'pending' ? now.toISOString() : null,
      });

      sendCreated(res, created);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record decision outcome');
    }
  },
);

router.get(
  '/alloy/decisions/outcomes',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const agentId = req.query.agentId as string | undefined;
      const tenantId = req.query.tenantId as string | undefined;
      const outcome = req.query.outcome as string | undefined;
      const user = req.user as AuthenticatedUser | undefined;
      const elevated = user ? isElevatedUser(user) : false;

      if (!elevated && !tenantId) {
        return sendBadRequest(res, 'tenantId filter required for non-elevated users');
      }

      if (tenantId && !requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's data");
      }

      const conditions = [];
      if (agentId) conditions.push(eq(alloyDecisionOutcomes.agentId, agentId));
      if (tenantId) conditions.push(eq(alloyDecisionOutcomes.tenantId, tenantId));
      if (outcome) conditions.push(eq(alloyDecisionOutcomes.actualOutcome, outcome));

      const rows = await db
        .select()
        .from(alloyDecisionOutcomes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyDecisionOutcomes.recordedAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list decision outcomes');
    }
  },
);

// ─── Agent Performance Metrics ────────────────────────────────────────────────

router.get(
  '/alloy/agents/:agentId/performance',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const windowDays = parseInt(String(req.query.windowDays ?? '30'), 10);
      if (Number.isNaN(windowDays) || windowDays < 1 || windowDays > 365) {
        return sendBadRequest(res, 'windowDays must be between 1 and 365');
      }

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const profile = scoringEngine.computeAgentProfile(agentId, windowDays);

      sendSuccess(res, profile);
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute agent performance');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/accuracy',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const windowDays = parseInt(String(req.query.windowDays ?? '30'), 10);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const accuracy = scoringEngine.getAgentAccuracy(agentId, windowDays);

      sendSuccess(res, accuracy);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get agent accuracy');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/calibration',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const windowDays = parseInt(String(req.query.windowDays ?? '30'), 10);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const calibration = scoringEngine.getAgentCalibration(agentId, windowDays);

      sendSuccess(res, calibration);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get agent calibration');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/trend',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const shortWindow = parseInt(String(req.query.shortWindow ?? '7'), 10);
      const longWindow = parseInt(String(req.query.longWindow ?? '30'), 10);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const trend = scoringEngine.detectTrend(agentId, shortWindow, longWindow);

      sendSuccess(res, trend);
    } catch (err) {
      handleRouteError(res, err, 'Failed to detect agent trend');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/skill-effectiveness',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const windowDays = parseInt(String(req.query.windowDays ?? '30'), 10);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const effectiveness = scoringEngine.getAllSkillEffectiveness(agentId, windowDays);

      sendSuccess(res, effectiveness);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get skill effectiveness');
    }
  },
);

router.post(
  '/alloy/agents/:agentId/performance/snapshot',
  authMiddleware(),
  requireRole('admin'),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const user = req.user as AuthenticatedUser | undefined;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) return sendBadRequest(res, 'tenantId is required');

      if (!requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's data");
      }

      const windowDays = parseInt(String(req.body.windowDays ?? '30'), 10);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      await scoringEngine.loadFromDb(agentId);
      const profile = scoringEngine.computeAgentProfile(agentId, windowDays);
      const trend = scoringEngine.detectTrend(agentId);

      const [snapshot] = await db
        .insert(alloyAgentPerformanceSnapshots)
        .values({
          agentId,
          tenantId,
          windowDays,
          totalDecisions: profile.accuracy.totalDecisions,
          acceptanceRate: profile.accuracy.acceptanceRate,
          overrideRate: profile.accuracy.overrideRate,
          rejectionRate: profile.accuracy.rejectionRate,
          weightedAccuracyScore: profile.accuracy.weightedAccuracyScore,
          meanPredictedConfidence: profile.calibration.meanPredictedConfidence,
          meanActualAcceptanceRate: profile.calibration.meanActualAcceptanceRate,
          calibrationBias: profile.calibration.calibrationBias,
          calibrationVerdict: profile.calibration.calibrationVerdict,
          overallHealthScore: profile.overallHealthScore,
          healthLabel: profile.healthLabel,
          flags: profile.flags,
          skillEffectiveness: profile.skillEffectiveness as unknown as Record<string, unknown>[],
          trend: trend.trend,
        })
        .returning();

      sendCreated(res, { snapshot, profile });
    } catch (err) {
      handleRouteError(res, err, 'Failed to take performance snapshot');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/performance/history',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

      const rows = await db
        .select()
        .from(alloyAgentPerformanceSnapshots)
        .where(eq(alloyAgentPerformanceSnapshots.agentId, agentId))
        .orderBy(desc(alloyAgentPerformanceSnapshots.snapshotTakenAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get performance history');
    }
  },
);

// ─── Self-Reflection ───────────────────────────────────────────────────────────

router.get(
  '/alloy/agents/:agentId/self-reflection',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const tenantId = req.query.tenantId as string | undefined;
      const user = req.user as AuthenticatedUser | undefined;
      const windowDays = parseInt(String(req.query.windowDays ?? '30'), 10);

      if (tenantId && !requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's data");
      }

      if (tenantId) {
        const [tenantConfig] = await db
          .select()
          .from(alloySelfImprovementConfig)
          .where(eq(alloySelfImprovementConfig.tenantId, tenantId))
          .limit(1);
        if (tenantConfig && tenantConfig.selfReflectionEnabled === false) {
          return sendSuccess(res, {
            agentId,
            hasData: false,
            contextBlock: 'Self-reflection is disabled for this tenant.',
            reasoningAdjustments: [],
            confidenceAdjustment: 0,
            urgentFlags: [],
            generatedAt: new Date().toISOString(),
          });
        }
      }

      const { buildSelfReflectionContext } = await import('@szl-holdings/ai-engine');
      const context = await buildSelfReflectionContext(agentId, { windowDays });

      if (tenantId && context.hasData) {
        const { persistReflectionSnapshot } = await import('@szl-holdings/ai-engine');
        void persistReflectionSnapshot(agentId, context, tenantId);
      }

      sendSuccess(res, context);
    } catch (err) {
      handleRouteError(res, err, 'Failed to build self-reflection context');
    }
  },
);

router.get(
  '/alloy/agents/:agentId/reflections',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.params.agentId as string;
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

      const rows = await db
        .select()
        .from(alloyAgentReflections)
        .where(eq(alloyAgentReflections.agentId, agentId))
        .orderBy(desc(alloyAgentReflections.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get reflection history');
    }
  },
);

// ─── Confidence Degradation Alerts ────────────────────────────────────────────

router.get(
  '/alloy/performance/alerts',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agentId = req.query.agentId as string | undefined;
      const tenantId = req.query.tenantId as string | undefined;
      const user = req.user as AuthenticatedUser | undefined;
      const elevated = user ? isElevatedUser(user) : false;
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const unresolvedOnly = req.query.unresolved !== 'false';

      if (!elevated && !tenantId) {
        return sendBadRequest(res, 'tenantId filter required for non-elevated users');
      }

      if (tenantId && !requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's alerts");
      }

      const conditions = [];
      if (agentId) conditions.push(eq(alloyConfidenceAlerts.agentId, agentId));
      if (tenantId) conditions.push(eq(alloyConfidenceAlerts.tenantId, tenantId));
      if (unresolvedOnly) conditions.push(isNull(alloyConfidenceAlerts.resolvedAt));

      const rows = await db
        .select()
        .from(alloyConfidenceAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyConfidenceAlerts.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch confidence alerts');
    }
  },
);

router.post(
  '/alloy/performance/alerts/evaluate',
  authMiddleware(),
  requireRole('admin'),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const { agentId, tenantId } = req.body;
      const user = req.user as AuthenticatedUser | undefined;
      if (!agentId || !tenantId) return sendBadRequest(res, 'agentId and tenantId are required');

      if (!requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's data");
      }

      const [tenantConfig] = await db
        .select()
        .from(alloySelfImprovementConfig)
        .where(eq(alloySelfImprovementConfig.tenantId, tenantId))
        .limit(1);
      if (tenantConfig && tenantConfig.alertsEnabled === false) {
        return sendSuccess(res, {
          evaluated: false,
          reason: 'Alerts are disabled for this tenant',
          alertsGenerated: 0,
          alerts: [],
        });
      }

      const { confidenceMonitor } = await import('@szl-holdings/ai-engine');
      const alerts = await confidenceMonitor.evaluate(agentId, tenantId);

      sendSuccess(res, { evaluated: true, alertsGenerated: alerts.length, alerts });
    } catch (err) {
      handleRouteError(res, err, 'Failed to evaluate confidence');
    }
  },
);

router.patch(
  '/alloy/performance/alerts/:alertId/resolve',
  authMiddleware(),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const alertId = req.params.alertId as string;
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const [existing] = await db
        .select()
        .from(alloyConfidenceAlerts)
        .where(eq(alloyConfidenceAlerts.alertId, alertId))
        .limit(1);

      if (!existing) return sendNotFound(res, 'Alert not found');

      if (!requireTenantAccessOrAdmin(user, existing.tenantId)) {
        return sendForbidden(res, 'You do not have access to resolve this alert');
      }

      if (existing.resolvedAt) return sendBadRequest(res, 'Alert is already resolved');

      const resolvedBy = String(user.id);
      const now = new Date();

      const [resolved] = await db
        .update(alloyConfidenceAlerts)
        .set({ resolvedAt: now, resolvedBy })
        .where(eq(alloyConfidenceAlerts.alertId, alertId))
        .returning();

      const { confidenceMonitor } = await import('@szl-holdings/ai-engine');
      confidenceMonitor.resolveAlert(alertId, resolvedBy);

      sendSuccess(res, resolved);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve alert');
    }
  },
);

// ─── Self-Improvement Configuration ───────────────────────────────────────────

router.get(
  '/alloy/self-improvement/config',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string | undefined;
      const agentId = req.query.agentId as string | undefined;
      const user = req.user as AuthenticatedUser | undefined;
      const elevated = user ? isElevatedUser(user) : false;

      if (!elevated && !tenantId) {
        return sendBadRequest(res, 'tenantId filter required for non-elevated users');
      }

      if (tenantId && !requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's config");
      }

      const conditions = [];
      if (tenantId) conditions.push(eq(alloySelfImprovementConfig.tenantId, tenantId));
      if (agentId) {
        conditions.push(eq(alloySelfImprovementConfig.agentId, agentId));
      }

      const [config] = await db
        .select()
        .from(alloySelfImprovementConfig)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(1);

      const { scoringEngine } = await import('@szl-holdings/ai-engine');
      const engineConfig = scoringEngine.getConfig();

      sendSuccess(res, config ?? { ...engineConfig, source: 'default' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get self-improvement config');
    }
  },
);

router.put(
  '/alloy/self-improvement/config',
  authMiddleware(),
  requireRole('admin'),
  validateBody(alloyResourceBodySchema),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const { tenantId, agentId, ...configFields } = req.body;
      if (!tenantId) return sendBadRequest(res, 'tenantId is required');

      if (!requireTenantAccessOrAdmin(user, tenantId)) {
        return sendForbidden(res, "You do not have access to this tenant's config");
      }

      const allowedFields = [
        'shortWindowDays',
        'longWindowDays',
        'minSampleSize',
        'accuracyDeclineThreshold',
        'overrideRateThreshold',
        'lowAcceptanceThreshold',
        'calibrationDriftThreshold',
        'selfReflectionEnabled',
        'alertsEnabled',
        'autoEscalateOnCritical',
        'alertCooldownHours',
      ];

      const updates: Record<string, unknown> = { updatedBy: String(user.id) };
      for (const field of allowedFields) {
        if (configFields[field] !== undefined) updates[field] = configFields[field];
      }

      const conditions = [eq(alloySelfImprovementConfig.tenantId, tenantId)];
      if (agentId) conditions.push(eq(alloySelfImprovementConfig.agentId, agentId));

      const [existing] = await db
        .select()
        .from(alloySelfImprovementConfig)
        .where(and(...conditions))
        .limit(1);

      let result;
      if (existing) {
        [result] = await db
          .update(alloySelfImprovementConfig)
          .set({
            ...(updates as Partial<typeof alloySelfImprovementConfig.$inferInsert>),
            updatedAt: new Date(),
          })
          .where(eq(alloySelfImprovementConfig.id, existing.id))
          .returning();
      } else {
        [result] = await db
          .insert(alloySelfImprovementConfig)
          .values({
            tenantId,
            agentId: agentId ?? null,
            ...(updates as Partial<typeof alloySelfImprovementConfig.$inferInsert>),
          })
          .returning();
      }

      const { scoringEngine, confidenceMonitor } = await import('@szl-holdings/ai-engine');

      const scoringPatch: Record<string, unknown> = {};
      if (configFields.shortWindowDays) scoringPatch.shortWindowDays = configFields.shortWindowDays;
      if (configFields.longWindowDays) scoringPatch.longWindowDays = configFields.longWindowDays;
      if (configFields.minSampleSize) scoringPatch.minSampleSize = configFields.minSampleSize;
      if (Object.keys(scoringPatch).length > 0)
        scoringEngine.updateConfig(
          scoringPatch as Parameters<typeof scoringEngine.updateConfig>[0],
        );

      const monitorPatch: Record<string, unknown> = {};
      if (configFields.accuracyDeclineThreshold)
        monitorPatch.accuracyDeclineThreshold = configFields.accuracyDeclineThreshold;
      if (configFields.overrideRateThreshold)
        monitorPatch.overrideRateThreshold = configFields.overrideRateThreshold;
      if (configFields.lowAcceptanceThreshold)
        monitorPatch.lowAcceptanceThreshold = configFields.lowAcceptanceThreshold;
      if (configFields.calibrationDriftThreshold)
        monitorPatch.calibrationDriftThreshold = configFields.calibrationDriftThreshold;
      if (configFields.alertCooldownHours)
        monitorPatch.alertCooldownMs = configFields.alertCooldownHours * 60 * 60 * 1000;
      if (Object.keys(monitorPatch).length > 0)
        confidenceMonitor.updateConfig(
          monitorPatch as Parameters<typeof confidenceMonitor.updateConfig>[0],
        );

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update self-improvement config');
    }
  },
);

export default router;

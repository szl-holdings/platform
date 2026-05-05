/**
 * HF Inference Operator Workflow API — /hf/registry
 *
 * Operator-facing control plane for HuggingFace model governance:
 *
 *   GET    /hf/registry                              — list registry entries (filter by state/sensitivity/gate)
 *   POST   /hf/registry                              — propose a new HF model entry
 *   GET    /hf/registry/:modelId                     — read one registry entry
 *   PATCH  /hf/registry/:modelId                     — update metadata (notes, displayName, etc.)
 *   POST   /hf/registry/:modelId/lifecycle           — transition lifecycle state
 *   POST   /hf/registry/:modelId/license-approval    — request a license approval
 *   POST   /hf/registry/:modelId/license-decision    — record approval/rejection decision
 *   PATCH  /hf/registry/:modelId/sensitivity         — update sensitivity allowance
 *   PATCH  /hf/registry/:modelId/gates               — toggle gate flags
 *   GET    /hf/registry/:modelId/audit               — audit history for a registry entry
 *
 *   GET    /hf/registry/failover-chains              — list failover chains
 *   POST   /hf/registry/failover-chains              — create a failover chain
 *   GET    /hf/registry/failover-chains/:chainId     — read one chain
 *   PUT    /hf/registry/failover-chains/:chainId     — update/reorder a chain
 *   DELETE /hf/registry/failover-chains/:chainId     — retire a chain (soft-delete)
 *
 * Every mutation writes a structured audit entry to audit_logs with actor,
 * before/after snapshot, action type, and reason.
 */

import {
  approvalRequestsTable,
  auditLogsTable,
  db,
  hfFailoverChainsTable,
  hfModelRegistryTable,
  HF_LIFECYCLE_STATES,
  HF_SENSITIVITY_LEVELS,
  VALID_HF_TRANSITIONS,
  type HfLifecycleState,
  type HfSensitivityLevel,
} from '@szl-holdings/db';
import { and, count, desc, eq, inArray, or } from 'drizzle-orm';
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
import { validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';
import { FAILOVER_CHAINS, MODEL_REGISTRY } from '@szl-holdings/ai-engine';

const router: IRouter = Router();

function getActorId(req: Request): number | null {
  const user = req.user as AuthenticatedUser | undefined;
  return user?.id ?? null;
}

/**
 * Write a structured audit entry for an HF registry mutation.
 *
 * Errors are NOT swallowed — if the audit insert fails the calling route
 * handler's catch block surfaces a 500 so the operator is aware the audit
 * record was not written. This is intentional: silent audit gaps are worse
 * than a visible failure in a governance-critical control plane.
 */
async function writeRegistryAudit(params: {
  actorUserId: number | null;
  actionType: string;
  entityId: string;
  payload: {
    reason?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    [key: string]: unknown;
  };
}): Promise<void> {
  await db.insert(auditLogsTable).values({
    actorUserId: params.actorUserId,
    actionType: params.actionType,
    entityType: 'hf_model_registry',
    entityId: params.entityId,
    payloadJson: params.payload,
  });
}

/**
 * Write a structured audit entry for an HF failover chain mutation.
 * Errors propagate — same rationale as writeRegistryAudit above.
 */
async function writeFailoverChainAudit(params: {
  actorUserId: number | null;
  actionType: string;
  entityId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLogsTable).values({
    actorUserId: params.actorUserId,
    actionType: params.actionType,
    entityType: 'hf_failover_chain',
    entityId: params.entityId,
    payloadJson: params.payload,
  });
}

/**
 * First-boot seeding — runs sequentially so chain IDs are available when
 * model registry entries are inserted, enabling failoverChainId linkage.
 *
 * Order:
 *   1. Seed hf_failover_chains from static FAILOVER_CHAINS (HF-relevant entries only).
 *   2. Seed hf_model_registry from MODEL_REGISTRY (HF provider only), linking
 *      each model to the seeded chain whose primaryModelId matches its modelId.
 *
 * Both steps are idempotent — if either table already has rows the step is
 * skipped. Errors are swallowed so startup is never blocked.
 */
async function seedHfTablesIfNeeded(): Promise<void> {
  try {
    // ── Step 1: seed failover chains ──────────────────────────────────────────
    const existingChains = await db
      .select({ id: hfFailoverChainsTable.id })
      .from(hfFailoverChainsTable)
      .limit(1);

    // primaryModelId → seeded chain id, used to link registry entries below
    const chainIdByPrimary = new Map<string, number>();

    if (existingChains.length === 0) {
      const hfModelPattern = /\//; // HF model IDs always contain "/"
      const hfChains = FAILOVER_CHAINS.filter(
        (c) =>
          hfModelPattern.test(c.primary) ||
          c.fallbacks.some((f) => hfModelPattern.test(f)),
      );

      if (hfChains.length > 0) {
        const seeded = await db
          .insert(hfFailoverChainsTable)
          .values(
            hfChains.map((c) => ({
              name: `${c.lane} (seeded)`,
              lane: c.lane,
              primaryModelId: c.primary,
              fallbackModelIds: c.fallbacks,
              isActive: true,
              isSeeded: true,
            })),
          )
          .returning();

        for (const chain of seeded) {
          chainIdByPrimary.set(chain.primaryModelId, chain.id);
        }
      }
    } else {
      // Chains already exist — load primaryModelId→id map for registry linkage
      const existing = await db
        .select({
          id: hfFailoverChainsTable.id,
          primaryModelId: hfFailoverChainsTable.primaryModelId,
        })
        .from(hfFailoverChainsTable);
      for (const c of existing) {
        chainIdByPrimary.set(c.primaryModelId, c.id);
      }
    }

    // ── Step 2: seed model registry ───────────────────────────────────────────
    const existingModels = await db
      .select({ id: hfModelRegistryTable.id })
      .from(hfModelRegistryTable)
      .limit(1);
    if (existingModels.length > 0) return;

    const hfModels = Object.values(MODEL_REGISTRY).filter(
      (m) => m.provider === 'huggingface',
    );
    if (hfModels.length === 0) return;

    await db.insert(hfModelRegistryTable).values(
      hfModels.map((m) => ({
        modelId: m.id,
        displayName: m.displayName,
        provider: m.provider,
        lifecycleState: 'proposed' as const,
        sensitivityAllowance: 'internal' as const,
        contextWindow: m.contextWindow ?? null,
        maxOutputTokens: m.maxOutputTokens ?? null,
        capabilities: m.capabilities ?? [],
        tier: m.tier ?? null,
        notes: 'seeded',
        // Link to the seeded chain whose primaryModelId matches this model's id
        failoverChainId: chainIdByPrimary.get(m.id) ?? null,
      })),
    );
  } catch {
    // Non-fatal — seed errors should not prevent server startup
  }
}

void seedHfTablesIfNeeded();

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

const proposeSchema = z.object({
  modelId: z.string().min(1).max(300),
  displayName: z.string().min(1).max(300),
  provider: z.string().max(100).optional().default('huggingface'),
  licenseId: z.string().max(200).optional(),
  licenseSourceUrl: z.string().url().max(1000).optional(),
  licenseExpiresAt: z.string().datetime().optional(),
  sensitivityAllowance: z.enum(HF_SENSITIVITY_LEVELS).optional().default('internal'),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  capabilities: z.array(z.string()).optional(),
  tier: z.string().max(100).optional(),
  failoverChainId: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(300).optional(),
  licenseId: z.string().max(200).optional(),
  licenseSourceUrl: z.string().url().max(1000).optional(),
  licenseExpiresAt: z.string().datetime().optional().nullable(),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  capabilities: z.array(z.string()).optional(),
  tier: z.string().max(100).optional(),
  failoverChainId: z.number().int().positive().optional().nullable(),
  notes: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

const lifecycleSchema = z.object({
  toState: z.enum(HF_LIFECYCLE_STATES),
  reason: z.string().min(1).max(500),
});

const licenseApprovalRequestSchema = z.object({
  licenseId: z.string().min(1).max(200),
  licenseSourceUrl: z.string().url().max(1000),
  licenseExpiresAt: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  description: z.string().max(2000).optional(),
});

const licenseDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().min(1).max(500),
});

const sensitivitySchema = z.object({
  sensitivityAllowance: z.enum(HF_SENSITIVITY_LEVELS),
  reason: z.string().min(1).max(500),
});

const gatesSchema = z.object({
  gateLicenseApproved: z.boolean().optional(),
  gateSensitivityMatch: z.boolean().optional(),
  gateLiveInferenceAllowed: z.boolean().optional(),
  gateProductionApproved: z.boolean().optional(),
  reason: z.string().min(1).max(500),
});

const listQuerySchema = z.object({
  lifecycleState: z.enum(HF_LIFECYCLE_STATES).optional(),
  sensitivityAllowance: z.enum(HF_SENSITIVITY_LEVELS).optional(),
  gatesPass: z.enum(['all', 'any', 'none']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const failoverChainSchema = z.object({
  name: z.string().min(1).max(200),
  lane: z.string().min(1).max(100),
  primaryModelId: z.string().min(1).max(300),
  fallbackModelIds: z.array(z.string().min(1).max(300)).min(0).max(20),
  reason: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry — List
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/hf/registry',
  authMiddleware(),
  requireRole('admin', 'ops', 'analyst', 'viewer'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { lifecycleState, sensitivityAllowance, gatesPass, limit, offset } =
        req.query as z.infer<typeof listQuerySchema>;

      const conditions = [];
      if (lifecycleState) {
        conditions.push(eq(hfModelRegistryTable.lifecycleState, lifecycleState));
      }
      if (sensitivityAllowance) {
        conditions.push(
          eq(hfModelRegistryTable.sensitivityAllowance, sensitivityAllowance),
        );
      }

      // Gate filtering is applied as SQL predicates so that limit/offset
      // operate on the post-filter set and totals are accurate.
      if (gatesPass === 'all') {
        conditions.push(eq(hfModelRegistryTable.gateLicenseApproved, true));
        conditions.push(eq(hfModelRegistryTable.gateSensitivityMatch, true));
        conditions.push(eq(hfModelRegistryTable.gateLiveInferenceAllowed, true));
        conditions.push(eq(hfModelRegistryTable.gateProductionApproved, true));
      } else if (gatesPass === 'any') {
        conditions.push(
          or(
            eq(hfModelRegistryTable.gateLicenseApproved, true),
            eq(hfModelRegistryTable.gateSensitivityMatch, true),
            eq(hfModelRegistryTable.gateLiveInferenceAllowed, true),
            eq(hfModelRegistryTable.gateProductionApproved, true),
          ),
        );
      } else if (gatesPass === 'none') {
        conditions.push(eq(hfModelRegistryTable.gateLicenseApproved, false));
        conditions.push(eq(hfModelRegistryTable.gateSensitivityMatch, false));
        conditions.push(eq(hfModelRegistryTable.gateLiveInferenceAllowed, false));
        conditions.push(eq(hfModelRegistryTable.gateProductionApproved, false));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [[{ total }], entries] = await Promise.all([
        db.select({ total: count() }).from(hfModelRegistryTable).where(whereClause),
        db
          .select()
          .from(hfModelRegistryTable)
          .where(whereClause)
          .orderBy(desc(hfModelRegistryTable.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      return sendSuccess(res, {
        entries: entries.map(formatEntry),
        total,
        limit,
        offset,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to list HF registry entries');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Propose (Create)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/hf/registry',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(proposeSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof proposeSchema>;
      const actorId = getActorId(req);

      const [existing] = await db
        .select({ id: hfModelRegistryTable.id })
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, body.modelId))
        .limit(1);

      if (existing) {
        return sendBadRequest(res, `Model '${body.modelId}' is already in the registry`);
      }

      const [entry] = await db
        .insert(hfModelRegistryTable)
        .values({
          modelId: body.modelId,
          displayName: body.displayName,
          provider: body.provider,
          licenseId: body.licenseId,
          licenseSourceUrl: body.licenseSourceUrl,
          licenseExpiresAt: body.licenseExpiresAt ? new Date(body.licenseExpiresAt) : null,
          sensitivityAllowance: body.sensitivityAllowance as HfSensitivityLevel,
          contextWindow: body.contextWindow,
          maxOutputTokens: body.maxOutputTokens,
          capabilities: body.capabilities ?? [],
          tier: body.tier,
          failoverChainId: body.failoverChainId,
          notes: body.notes,
          lifecycleState: 'proposed',
          proposedById: actorId,
        })
        .returning();

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.proposed',
        entityId: entry.modelId,
        payload: { after: formatEntry(entry) },
      });

      return sendCreated(res, { entry: formatEntry(entry) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to propose HF registry entry');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Failover chains — list (must be before /:modelId to avoid route clash)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/hf/registry/failover-chains',
  authMiddleware(),
  requireRole('admin', 'ops', 'analyst', 'viewer'),
  async (_req: Request, res: Response) => {
    try {
      const chains = await db
        .select()
        .from(hfFailoverChainsTable)
        .orderBy(desc(hfFailoverChainsTable.createdAt));

      return sendSuccess(res, { chains: chains.map(formatChain), total: chains.length });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to list failover chains');
    }
  },
);

router.post(
  '/hf/registry/failover-chains',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(failoverChainSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof failoverChainSchema>;
      const actorId = getActorId(req);

      const [chain] = await db
        .insert(hfFailoverChainsTable)
        .values({
          name: body.name,
          lane: body.lane,
          primaryModelId: body.primaryModelId,
          fallbackModelIds: body.fallbackModelIds,
          isActive: true,
          isSeeded: false,
          createdById: actorId,
        })
        .returning();

      await writeFailoverChainAudit({
        actorUserId: actorId,
        actionType: 'hf_failover_chain.created',
        entityId: String(chain.id),
        payload: { reason: body.reason, after: formatChain(chain) },
      });

      return sendCreated(res, { chain: formatChain(chain) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create failover chain');
    }
  },
);

router.get(
  '/hf/registry/failover-chains/:chainId',
  authMiddleware(),
  requireRole('admin', 'ops', 'analyst', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const chainId = parseInt(req.params.chainId, 10);
      if (isNaN(chainId)) return sendBadRequest(res, 'Invalid chainId');

      const [chain] = await db
        .select()
        .from(hfFailoverChainsTable)
        .where(eq(hfFailoverChainsTable.id, chainId))
        .limit(1);

      if (!chain) return sendNotFound(res, 'Failover chain');

      return sendSuccess(res, { chain: formatChain(chain) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to read failover chain');
    }
  },
);

router.put(
  '/hf/registry/failover-chains/:chainId',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(failoverChainSchema),
  async (req: Request, res: Response) => {
    try {
      const chainId = parseInt(req.params.chainId, 10);
      if (isNaN(chainId)) return sendBadRequest(res, 'Invalid chainId');
      const body = req.body as z.infer<typeof failoverChainSchema>;
      const actorId = getActorId(req);

      const [before] = await db
        .select()
        .from(hfFailoverChainsTable)
        .where(eq(hfFailoverChainsTable.id, chainId))
        .limit(1);

      if (!before) return sendNotFound(res, 'Failover chain');

      const [updated] = await db
        .update(hfFailoverChainsTable)
        .set({
          name: body.name,
          lane: body.lane,
          primaryModelId: body.primaryModelId,
          fallbackModelIds: body.fallbackModelIds,
          updatedAt: new Date(),
        })
        .where(eq(hfFailoverChainsTable.id, chainId))
        .returning();

      await writeFailoverChainAudit({
        actorUserId: actorId,
        actionType: 'hf_failover_chain.updated',
        entityId: String(chainId),
        payload: {
          reason: body.reason,
          before: formatChain(before),
          after: formatChain(updated),
        },
      });

      return sendSuccess(res, { chain: formatChain(updated) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update failover chain');
    }
  },
);

router.delete(
  '/hf/registry/failover-chains/:chainId',
  authMiddleware(),
  requireRole('admin', 'ops'),
  async (req: Request, res: Response) => {
    try {
      const chainId = parseInt(req.params.chainId, 10);
      if (isNaN(chainId)) return sendBadRequest(res, 'Invalid chainId');
      const actorId = getActorId(req);
      const reason = req.body?.reason ?? 'no reason provided';

      const [before] = await db
        .select()
        .from(hfFailoverChainsTable)
        .where(eq(hfFailoverChainsTable.id, chainId))
        .limit(1);

      if (!before) return sendNotFound(res, 'Failover chain');

      const [retired] = await db
        .update(hfFailoverChainsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(hfFailoverChainsTable.id, chainId))
        .returning();

      await writeFailoverChainAudit({
        actorUserId: actorId,
        actionType: 'hf_failover_chain.retired',
        entityId: String(chainId),
        payload: { reason, before: formatChain(before), after: formatChain(retired) },
      });

      return sendNoContent(res);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to retire failover chain');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Read One
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/hf/registry/:modelId',
  authMiddleware(),
  requireRole('admin', 'ops', 'analyst', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);

      const [entry] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!entry) return sendNotFound(res, 'HF registry entry');

      let chain = null;
      if (entry.failoverChainId) {
        const [c] = await db
          .select()
          .from(hfFailoverChainsTable)
          .where(eq(hfFailoverChainsTable.id, entry.failoverChainId))
          .limit(1);
        chain = c ? formatChain(c) : null;
      }

      return sendSuccess(res, { entry: formatEntry(entry), failoverChain: chain });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to read HF registry entry');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Update Metadata
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
  '/hf/registry/:modelId',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(updateSchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const body = req.body as z.infer<typeof updateSchema>;
      const actorId = getActorId(req);

      const [before] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!before) return sendNotFound(res, 'HF registry entry');

      const updates: Partial<typeof hfModelRegistryTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.displayName !== undefined) updates.displayName = body.displayName;
      if (body.licenseId !== undefined) updates.licenseId = body.licenseId;
      if (body.licenseSourceUrl !== undefined) updates.licenseSourceUrl = body.licenseSourceUrl;
      if (body.licenseExpiresAt !== undefined) {
        updates.licenseExpiresAt = body.licenseExpiresAt ? new Date(body.licenseExpiresAt) : null;
      }
      if (body.contextWindow !== undefined) updates.contextWindow = body.contextWindow;
      if (body.maxOutputTokens !== undefined) updates.maxOutputTokens = body.maxOutputTokens;
      if (body.capabilities !== undefined) updates.capabilities = body.capabilities;
      if (body.tier !== undefined) updates.tier = body.tier;
      if (body.failoverChainId !== undefined) updates.failoverChainId = body.failoverChainId;
      if (body.notes !== undefined) updates.notes = body.notes;

      const [updated] = await db
        .update(hfModelRegistryTable)
        .set(updates)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .returning();

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.metadata_updated',
        entityId: modelId,
        payload: {
          reason: body.reason,
          before: formatEntry(before),
          after: formatEntry(updated),
        },
      });

      return sendSuccess(res, { entry: formatEntry(updated) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update HF registry entry');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Lifecycle Transition
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/hf/registry/:modelId/lifecycle',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(lifecycleSchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const { toState, reason } = req.body as z.infer<typeof lifecycleSchema>;
      const actorId = getActorId(req);

      const [entry] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!entry) return sendNotFound(res, 'HF registry entry');

      const fromState = entry.lifecycleState as HfLifecycleState;
      const allowed = VALID_HF_TRANSITIONS[fromState] ?? [];
      if (!allowed.includes(toState)) {
        return sendBadRequest(
          res,
          `Transition from '${fromState}' to '${toState}' is not allowed. Valid transitions: ${allowed.join(', ') || 'none'}`,
        );
      }

      const timestampUpdates: Partial<typeof hfModelRegistryTable.$inferInsert> = {};
      if (toState === 'approved') timestampUpdates.approvedAt = new Date();
      if (toState === 'retired') timestampUpdates.retiredAt = new Date();

      const [updated] = await db
        .update(hfModelRegistryTable)
        .set({ lifecycleState: toState, ...timestampUpdates, updatedAt: new Date() })
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .returning();

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.lifecycle_transition',
        entityId: modelId,
        payload: {
          fromState,
          toState,
          reason,
          before: { lifecycleState: fromState },
          after: { lifecycleState: toState },
        },
      });

      return sendSuccess(res, {
        entry: formatEntry(updated),
        transition: { from: fromState, to: toState, reason },
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to transition lifecycle state');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — License Approval Request
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/hf/registry/:modelId/license-approval',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(licenseApprovalRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const body = req.body as z.infer<typeof licenseApprovalRequestSchema>;
      const actorId = getActorId(req);

      const [entry] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!entry) return sendNotFound(res, 'HF registry entry');

      const [approval] = await db
        .insert(approvalRequestsTable)
        .values({
          resourceType: 'hf_model_registry',
          resourceId: modelId,
          title: `License approval for HF model: ${entry.displayName}`,
          description:
            body.description ??
            `License ID: ${body.licenseId}\nSource: ${body.licenseSourceUrl}`,
          actionClass: 'model_license',
          priority: body.priority,
          status: 'pending',
          requestedById: actorId,
          expiresAt: body.licenseExpiresAt ? new Date(body.licenseExpiresAt) : null,
          payload: {
            modelId,
            licenseId: body.licenseId,
            licenseSourceUrl: body.licenseSourceUrl,
            licenseExpiresAt: body.licenseExpiresAt,
          },
        })
        .returning();

      await db
        .update(hfModelRegistryTable)
        .set({
          licenseId: body.licenseId,
          licenseSourceUrl: body.licenseSourceUrl,
          licenseExpiresAt: body.licenseExpiresAt ? new Date(body.licenseExpiresAt) : null,
          licenseApprovalId: approval.id,
          updatedAt: new Date(),
        })
        .where(eq(hfModelRegistryTable.modelId, modelId));

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.license_approval_requested',
        entityId: modelId,
        payload: {
          approvalId: approval.id,
          licenseId: body.licenseId,
          licenseSourceUrl: body.licenseSourceUrl,
        },
      });

      return sendCreated(res, {
        approvalId: approval.id,
        modelId,
        status: approval.status,
        message: 'License approval request created successfully',
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create license approval request');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — License Decision (Approve / Reject)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/hf/registry/:modelId/license-decision',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(licenseDecisionSchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const { decision, reason } = req.body as z.infer<typeof licenseDecisionSchema>;
      const actorId = getActorId(req);

      const [entry] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!entry) return sendNotFound(res, 'HF registry entry');
      if (!entry.licenseApprovalId) {
        return sendBadRequest(
          res,
          'No pending license approval request found for this model. Submit a license-approval request first.',
        );
      }

      const [approvalRecord] = await db
        .select({ id: approvalRequestsTable.id, status: approvalRequestsTable.status })
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.id, entry.licenseApprovalId))
        .limit(1);

      if (!approvalRecord || approvalRecord.status !== 'pending') {
        return sendBadRequest(
          res,
          'License approval request is not in pending status — it may have already been decided.',
        );
      }

      const approvalStatus = decision === 'approved' ? 'approved' : 'rejected';
      const approvalFields =
        decision === 'approved'
          ? { status: approvalStatus, approvedById: actorId, approvedAt: new Date() }
          : { status: approvalStatus, rejectedById: actorId, rejectedAt: new Date() };

      await db
        .update(approvalRequestsTable)
        .set({ ...approvalFields, updatedAt: new Date() } as Record<string, unknown>)
        .where(eq(approvalRequestsTable.id, entry.licenseApprovalId));

      const registryUpdates: Partial<typeof hfModelRegistryTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (decision === 'approved') {
        registryUpdates.gateLicenseApproved = true;
        registryUpdates.licenseApproverId = actorId;
        registryUpdates.licenseApprovedAt = new Date();
      } else {
        registryUpdates.gateLicenseApproved = false;
        registryUpdates.licenseApproverId = null;
        registryUpdates.licenseApprovedAt = null;
      }

      const [updated] = await db
        .update(hfModelRegistryTable)
        .set(registryUpdates)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .returning();

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: `hf_registry.license_${decision}`,
        entityId: modelId,
        payload: {
          decision,
          reason,
          approvalId: entry.licenseApprovalId,
          before: { gateLicenseApproved: entry.gateLicenseApproved },
          after: { gateLicenseApproved: updated.gateLicenseApproved },
        },
      });

      return sendSuccess(res, {
        entry: formatEntry(updated),
        decision,
        message: `License ${decision} recorded successfully`,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to record license decision');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Sensitivity Update
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
  '/hf/registry/:modelId/sensitivity',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(sensitivitySchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const { sensitivityAllowance, reason } = req.body as z.infer<typeof sensitivitySchema>;
      const actorId = getActorId(req);

      const [before] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!before) return sendNotFound(res, 'HF registry entry');

      const [updated] = await db
        .update(hfModelRegistryTable)
        .set({ sensitivityAllowance, updatedAt: new Date() })
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .returning();

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.sensitivity_updated',
        entityId: modelId,
        payload: {
          reason,
          before: { sensitivityAllowance: before.sensitivityAllowance },
          after: { sensitivityAllowance: updated.sensitivityAllowance },
        },
      });

      return sendSuccess(res, { entry: formatEntry(updated) });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update sensitivity allowance');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Gate Flag Toggles
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
  '/hf/registry/:modelId/gates',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(gatesSchema),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const body = req.body as z.infer<typeof gatesSchema>;
      const actorId = getActorId(req);

      const [before] = await db
        .select()
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!before) return sendNotFound(res, 'HF registry entry');

      const gateUpdates: Partial<typeof hfModelRegistryTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.gateLicenseApproved !== undefined) {
        gateUpdates.gateLicenseApproved = body.gateLicenseApproved;
      }
      if (body.gateSensitivityMatch !== undefined) {
        gateUpdates.gateSensitivityMatch = body.gateSensitivityMatch;
      }
      if (body.gateLiveInferenceAllowed !== undefined) {
        gateUpdates.gateLiveInferenceAllowed = body.gateLiveInferenceAllowed;
      }
      if (body.gateProductionApproved !== undefined) {
        gateUpdates.gateProductionApproved = body.gateProductionApproved;
      }

      const [updated] = await db
        .update(hfModelRegistryTable)
        .set(gateUpdates)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .returning();

      const beforeGates = {
        gateLicenseApproved: before.gateLicenseApproved,
        gateSensitivityMatch: before.gateSensitivityMatch,
        gateLiveInferenceAllowed: before.gateLiveInferenceAllowed,
        gateProductionApproved: before.gateProductionApproved,
      };
      const afterGates = {
        gateLicenseApproved: updated.gateLicenseApproved,
        gateSensitivityMatch: updated.gateSensitivityMatch,
        gateLiveInferenceAllowed: updated.gateLiveInferenceAllowed,
        gateProductionApproved: updated.gateProductionApproved,
      };

      await writeRegistryAudit({
        actorUserId: actorId,
        actionType: 'hf_registry.gates_updated',
        entityId: modelId,
        payload: { reason: body.reason, before: beforeGates, after: afterGates },
      });

      return sendSuccess(res, {
        entry: formatEntry(updated),
        gates: afterGates,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update gate flags');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Audit History
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/hf/registry/:modelId/audit',
  authMiddleware(),
  requireRole('admin', 'ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      const modelId = decodeURIComponent(req.params.modelId);
      const limitParam = parseInt((req.query.limit as string) ?? '50', 10);
      const offsetParam = parseInt((req.query.offset as string) ?? '0', 10);
      const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);
      const offset = isNaN(offsetParam) ? 0 : offsetParam;

      const [entry] = await db
        .select({ id: hfModelRegistryTable.id })
        .from(hfModelRegistryTable)
        .where(eq(hfModelRegistryTable.modelId, modelId))
        .limit(1);

      if (!entry) return sendNotFound(res, 'HF registry entry');

      const auditWhere = and(
        eq(auditLogsTable.entityType, 'hf_model_registry'),
        eq(auditLogsTable.entityId, modelId),
      );

      const [[{ total }], auditEntries] = await Promise.all([
        db.select({ total: count() }).from(auditLogsTable).where(auditWhere),
        db
          .select()
          .from(auditLogsTable)
          .where(auditWhere)
          .orderBy(desc(auditLogsTable.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      return sendSuccess(res, {
        modelId,
        entries: auditEntries,
        total,
        limit,
        offset,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to read audit history');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatEntry(entry: typeof hfModelRegistryTable.$inferSelect) {
  return {
    id: entry.id,
    modelId: entry.modelId,
    displayName: entry.displayName,
    provider: entry.provider,
    lifecycleState: entry.lifecycleState,
    license: {
      licenseId: entry.licenseId,
      licenseSourceUrl: entry.licenseSourceUrl,
      licenseExpiresAt: entry.licenseExpiresAt,
      licenseApprovedAt: entry.licenseApprovedAt,
      licenseApproverId: entry.licenseApproverId,
      licenseApprovalId: entry.licenseApprovalId,
    },
    sensitivityAllowance: entry.sensitivityAllowance,
    gates: {
      licenseApproved: entry.gateLicenseApproved,
      sensitivityMatch: entry.gateSensitivityMatch,
      liveInferenceAllowed: entry.gateLiveInferenceAllowed,
      productionApproved: entry.gateProductionApproved,
      allPass:
        entry.gateLicenseApproved &&
        entry.gateSensitivityMatch &&
        entry.gateLiveInferenceAllowed &&
        entry.gateProductionApproved,
    },
    failoverChainId: entry.failoverChainId,
    capabilities: entry.capabilities,
    contextWindow: entry.contextWindow,
    maxOutputTokens: entry.maxOutputTokens,
    tier: entry.tier,
    ops: {
      lastInferenceAt: entry.lastInferenceAt,
      recentFailureCount: entry.recentFailureCount,
    },
    proposedById: entry.proposedById,
    proposedAt: entry.proposedAt,
    approvedAt: entry.approvedAt,
    retiredAt: entry.retiredAt,
    notes: entry.notes,
    orgId: entry.orgId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function formatChain(chain: typeof hfFailoverChainsTable.$inferSelect) {
  return {
    id: chain.id,
    name: chain.name,
    lane: chain.lane,
    primaryModelId: chain.primaryModelId,
    fallbackModelIds: chain.fallbackModelIds,
    isActive: chain.isActive,
    isSeeded: chain.isSeeded,
    createdById: chain.createdById,
    createdAt: chain.createdAt,
    updatedAt: chain.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /hf/registry/openapi.json
 *
 * Machine-readable OpenAPI 3.0 description of all HF registry operator
 * endpoints.  Useful for tooling, SDK generation, and discoverability.
 */
router.get('/hf/registry/openapi.json', (_req, res) => {
  res.json(hfRegistryOpenApiSpec);
});

const hfRegistryOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HF Inference Operator Workflow API',
    description:
      'Governed control-plane for HuggingFace model management: registry CRUD, lifecycle state machine, failover chain configuration, license approval flow, sensitivity / gate-flag toggles, and structured audit logging.',
    version: '1.0.0',
  },
  servers: [{ url: '/api/hf/registry', description: 'API server' }],
  tags: [
    { name: 'Registry', description: 'HF model registry CRUD' },
    { name: 'Lifecycle', description: 'State transitions (proposed → under_review → approved → active → retired)' },
    { name: 'License', description: 'License metadata and approval decisions' },
    { name: 'Sensitivity', description: 'Sensitivity allowance updates' },
    { name: 'Gates', description: 'Gate-flag toggles' },
    { name: 'Failover Chains', description: 'Operator-governed failover chain configuration' },
    { name: 'Audit', description: 'Structured mutation audit log' },
  ],
  paths: {
    '/hf/registry': {
      get: {
        tags: ['Registry'],
        summary: 'List HF model registry entries',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'lifecycleState', in: 'query', schema: { type: 'string', enum: ['proposed', 'under_review', 'approved', 'active', 'retired'] } },
          { name: 'sensitivityAllowance', in: 'query', schema: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] } },
          { name: 'gatesPass', in: 'query', schema: { type: 'string', enum: ['all', 'any', 'none'] }, description: 'Filter by gate-flag aggregate: all=all 4 pass, any=at least 1 passes, none=all 4 fail' },
        ],
        responses: {
          200: { description: 'Paginated registry entry list with entries[], total, limit, offset' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Registry'],
        summary: 'Register a new HF model',
        description: 'Creates a registry entry in the proposed lifecycle state. Requires admin or ops role. Writes an audit record.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modelId', 'displayName'],
                properties: {
                  modelId: { type: 'string', example: 'Qwen/Qwen3-8B' },
                  displayName: { type: 'string' },
                  provider: { type: 'string', default: 'huggingface' },
                  sensitivityAllowance: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] },
                  licenseId: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created registry entry' },
          400: { description: 'Validation error or modelId already registered' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
        },
      },
    },
    '/hf/registry/{modelId}': {
      parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' }, description: 'URL-encoded HF model ID, e.g. Qwen%2FQwen3-8B' }],
      get: {
        tags: ['Registry'],
        summary: 'Get a registry entry by modelId',
        responses: {
          200: { description: 'Registry entry with failoverChain object' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Registry'],
        summary: 'Update registry entry metadata',
        description: 'Updates mutable fields (displayName, licenseId, licenseSourceUrl, licenseExpiresAt, failoverChainId, capabilities, contextWindow, maxOutputTokens, tier, notes). Requires admin or ops role. Writes an audit record.',
        responses: {
          200: { description: 'Updated registry entry' },
          400: { description: 'No updatable fields provided' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/lifecycle': {
      post: {
        tags: ['Lifecycle'],
        summary: 'Transition a model lifecycle state',
        description: 'Enforces the allowed transition matrix. Sets approvedAt on → approved, retiredAt on → retired. Requires admin or ops role. Writes an audit record.',
        parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['toState'],
                properties: {
                  toState: { type: 'string', enum: ['proposed', 'under_review', 'approved', 'active', 'retired'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated entry and transition summary { from, to, reason }' },
          400: { description: 'Invalid transition for current state' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/license-approval': {
      post: {
        tags: ['License'],
        summary: 'Submit a license approval request',
        description: 'Creates an approval_requests row linked to the registry entry. Requires admin or ops role. Writes an audit record.',
        parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  licenseId: { type: 'string' },
                  licenseSourceUrl: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created approval request' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/license-decision': {
      post: {
        tags: ['License'],
        summary: 'Record a license approval or rejection decision',
        description: 'Sets licenseApprovedAt / licenseApproverId and updates the gateLicenseApproved flag. The linked approvalId must be in pending state. Requires admin or ops role. Writes an audit record.',
        parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision'],
                properties: {
                  decision: { type: 'string', enum: ['approved', 'rejected'] },
                  approvalId: { type: 'integer', description: 'Links to approval_requests.id; must be in pending state' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated entry with gate flags reflecting decision' },
          400: { description: 'approvalId not in pending state, or decision not in approved|rejected' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/sensitivity': {
      patch: {
        tags: ['Sensitivity'],
        summary: 'Update sensitivity allowance',
        description: 'Sets the sensitivityAllowance field. Requires admin or ops role. Writes an audit record.',
        parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sensitivityAllowance'],
                properties: {
                  sensitivityAllowance: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated entry' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/gates': {
      patch: {
        tags: ['Gates'],
        summary: 'Toggle gate flags',
        description: 'Sets one or more of the four gate-flag booleans (gateLicenseApproved, gateSensitivityMatch, gateLiveInferenceAllowed, gateProductionApproved). Requires admin or ops role. Writes an audit record.',
        parameters: [{ name: 'modelId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  gateLicenseApproved: { type: 'boolean' },
                  gateSensitivityMatch: { type: 'boolean' },
                  gateLiveInferenceAllowed: { type: 'boolean' },
                  gateProductionApproved: { type: 'boolean' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated entry and gates object' },
          400: { description: 'No gate fields provided' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/{modelId}/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Retrieve audit log for a registry entry',
        description: 'Returns audit_log entries for this modelId entity, ordered newest-first. Requires admin, ops, or analyst role.',
        parameters: [
          { name: 'modelId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: { description: 'Audit log entries with entries[] and total' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin, ops, or analyst role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/hf/registry/failover-chains': {
      get: {
        tags: ['Failover Chains'],
        summary: 'List failover chains',
        responses: {
          200: { description: 'Chain list with chains[] and total' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Failover Chains'],
        summary: 'Create a failover chain',
        description: 'Defines a new operator chain with a primary model and an ordered fallback list. Requires admin or ops role. Writes an audit record.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'lane', 'primaryModelId'],
                properties: {
                  name: { type: 'string' },
                  lane: { type: 'string' },
                  primaryModelId: { type: 'string', example: 'Qwen/Qwen3-8B' },
                  fallbackModelIds: { type: 'array', items: { type: 'string' }, default: [] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created chain' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
        },
      },
    },
    '/hf/registry/failover-chains/{chainId}': {
      parameters: [{ name: 'chainId', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Failover Chains'],
        summary: 'Get a failover chain by ID',
        responses: {
          200: { description: 'Chain entry' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Failover Chains'],
        summary: 'Replace a failover chain',
        description: 'Full replacement of name, lane, primaryModelId, and fallbackModelIds. Requires admin or ops role. Writes an audit record.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'lane', 'primaryModelId'],
                properties: {
                  name: { type: 'string' },
                  lane: { type: 'string' },
                  primaryModelId: { type: 'string' },
                  fallbackModelIds: { type: 'array', items: { type: 'string' } },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated chain' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Failover Chains'],
        summary: 'Retire a failover chain',
        description: 'Sets isActive=false (soft retire). Registry entries linked to this chain will return [] from the resolver — no static fallback override. Requires admin or ops role. Writes an audit record.',
        responses: {
          204: { description: 'Retired — no content' },
          401: { description: 'Unauthorized' },
          403: { description: 'Requires admin or ops role' },
          404: { description: 'Not found' },
        },
      },
    },
  },
};

export default router;

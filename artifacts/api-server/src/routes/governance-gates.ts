/**
 * Governance Gate Configuration & Operator Model Registry API
 *
 * Endpoints:
 *   GET    /governance/registry              — list all models in the operator registry
 *   POST   /governance/registry              — add a new HF model to the registry
 *   PATCH  /governance/registry/:id         — update a model's display name, capabilities, cost
 *   DELETE /governance/registry/:id         — remove a model from the registry
 *   GET    /governance/gates                 — read gate status for all registered models
 *   GET    /governance/gates/:id            — read gate status for a specific model
 *   PATCH  /governance/gates/:id            — update per-model gate conditions
 *   POST   /governance/gates/:id/bypass     — grant a time-limited gate bypass
 *   DELETE /governance/gates/:id/bypass/:bypassId — revoke a bypass
 *   GET    /governance/gates/:id/bypasses   — list bypass audit trail for a model
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  db,
  governanceGateBypassesTable,
  governanceGateConfigTable,
  operatorModelRegistryTable,
} from '@szl-holdings/db';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response.js';
import { logger } from '../lib/logger.js';
import { validateBody } from '../lib/validation.js';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth.js';
import {
  addModelToRegistry,
  applyGateBypass,
  applyGateOverride,
  expireStaleBypasses,
  getGateStatusForAllModels,
  getGateStatusForModel,
  removeModelFromRegistry,
  revokeGateBypass,
  updateModelInRegistry,
} from '../a11oy/runtime/model-registry.js';
import { removePromotedModel } from './a11oy-chat.js';

const router: IRouter = Router();

function getRequestUser(req: Request): AuthenticatedUser | undefined {
  return (req as unknown as { user?: AuthenticatedUser }).user;
}

function getUserLabel(req: Request): string {
  const u = getRequestUser(req);
  if (!u) return 'unknown';
  return u.displayName || u.email || String(u.id);
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const HF_MODEL_ID_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function validateHfModelId(id: string): boolean {
  return HF_MODEL_ID_RE.test(id) && id.length <= 200;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Registry CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/governance/registry',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { provider, active } = req.query as { provider?: string; active?: string };

      let query = db.select().from(operatorModelRegistryTable).$dynamic();
      if (provider) {
        query = query.where(eq(operatorModelRegistryTable.provider, provider));
      } else if (active !== undefined) {
        query = query.where(eq(operatorModelRegistryTable.isActive, active !== 'false'));
      }

      const models = await query;
      sendSuccess(res, { models, total: models.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list operator model registry');
    }
  },
);

router.get(
  '/governance/registry/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [model] = await db
        .select()
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);
      if (!model) return sendNotFound(res, 'Model');
      sendSuccess(res, { model });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get model registry entry');
    }
  },
);

const addModelSchema = z.object({
  hfModelId: z.string().min(3).max(200),
  displayName: z.string().min(1).max(200),
  provider: z.string().max(50).default('huggingface'),
  capabilities: z.array(z.string()).default([]),
  tier: z.enum(['frontier', 'standard', 'fast', 'local']).default('local'),
  contextWindow: z.number().int().positive().default(4096),
  maxOutputTokens: z.number().int().positive().default(1024),
  inputCostPer1kTokens: z.number().min(0).default(0),
  outputCostPer1kTokens: z.number().min(0).default(0),
  license: z.string().max(100).default('unknown'),
  description: z.string().max(1000).default(''),
  initialGateState: z
    .object({
      licenseApproved: z.boolean().default(false),
      sensitivityAllowance: z
        .enum(['public', 'internal', 'confidential', 'restricted'])
        .default('internal'),
      liveInferenceEnabled: z.boolean().optional(),
      productionApproved: z.boolean().optional(),
    })
    .optional(),
});

router.post(
  '/governance/registry',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  validateBody(addModelSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof addModelSchema>;

      if (body.provider === 'huggingface' && !validateHfModelId(body.hfModelId)) {
        return sendBadRequest(
          res,
          "Invalid HF model ID format. Expected 'owner/model-name' (e.g. 'Qwen/Qwen3-8B')",
        );
      }

      const existing = await db
        .select({ id: operatorModelRegistryTable.id })
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.hfModelId, body.hfModelId))
        .limit(1);

      if (existing.length > 0) {
        return sendBadRequest(res, `Model '${body.hfModelId}' is already in the registry`);
      }

      const id = generateId('omr');
      const [model] = await db
        .insert(operatorModelRegistryTable)
        .values({
          id,
          hfModelId: body.hfModelId,
          displayName: body.displayName,
          provider: body.provider,
          capabilities: body.capabilities,
          tier: body.tier,
          contextWindow: body.contextWindow,
          maxOutputTokens: body.maxOutputTokens,
          inputCostPer1kTokens: body.inputCostPer1kTokens,
          outputCostPer1kTokens: body.outputCostPer1kTokens,
          license: body.license,
          description: body.description,
          isActive: true,
          seeded: false,
          createdBy: getUserLabel(req),
        })
        .returning();

      const gate = body.initialGateState ?? {};
      await db.insert(governanceGateConfigTable).values({
        modelRegistryId: id,
        licenseApproved: gate.licenseApproved ?? false,
        sensitivityAllowance: gate.sensitivityAllowance ?? 'internal',
        liveInferenceEnabled: gate.liveInferenceEnabled ?? null,
        productionApproved: gate.productionApproved ?? null,
        updatedBy: getUserLabel(req),
      });

      addModelToRegistry({
        id,
        hfModelId: body.hfModelId,
        displayName: body.displayName,
        provider: body.provider,
        capabilities: body.capabilities as string[],
        tier: body.tier,
        contextWindow: body.contextWindow,
        maxOutputTokens: body.maxOutputTokens,
        inputCostPer1kTokens: body.inputCostPer1kTokens,
        outputCostPer1kTokens: body.outputCostPer1kTokens,
        license: body.license,
        description: body.description,
      });

      // Apply the initial gate state to the in-memory routing cache immediately
      applyGateOverride(id, {
        licenseApproved: gate.licenseApproved ?? false,
        sensitivityAllowance: gate.sensitivityAllowance ?? 'internal',
        liveInferenceEnabled: gate.liveInferenceEnabled ?? null,
        productionApproved: gate.productionApproved ?? null,
      });

      logger.info({ id, hfModelId: body.hfModelId, actor: getUserLabel(req) }, '[governance] model added to registry');
      sendSuccess(res, { model, gates: gate }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to add model to registry');
    }
  },
);

const updateModelSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  capabilities: z.array(z.string()).optional(),
  tier: z.enum(['frontier', 'standard', 'fast', 'local']).optional(),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  inputCostPer1kTokens: z.number().min(0).optional(),
  outputCostPer1kTokens: z.number().min(0).optional(),
  license: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

router.patch(
  '/governance/registry/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  validateBody(updateModelSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body as z.infer<typeof updateModelSchema>;

      const existing = await db
        .select()
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);

      if (existing.length === 0) {
        return sendNotFound(res, 'Model');
      }

      const updates: Partial<typeof operatorModelRegistryTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.displayName !== undefined) updates.displayName = body.displayName;
      if (body.capabilities !== undefined) updates.capabilities = body.capabilities;
      if (body.tier !== undefined) updates.tier = body.tier;
      if (body.contextWindow !== undefined) updates.contextWindow = body.contextWindow;
      if (body.maxOutputTokens !== undefined) updates.maxOutputTokens = body.maxOutputTokens;
      if (body.inputCostPer1kTokens !== undefined) updates.inputCostPer1kTokens = body.inputCostPer1kTokens;
      if (body.outputCostPer1kTokens !== undefined) updates.outputCostPer1kTokens = body.outputCostPer1kTokens;
      if (body.license !== undefined) updates.license = body.license;
      if (body.description !== undefined) updates.description = body.description;
      if (body.isActive !== undefined) updates.isActive = body.isActive;

      const [updated] = await db
        .update(operatorModelRegistryTable)
        .set(updates)
        .where(eq(operatorModelRegistryTable.id, id))
        .returning();

      // Sync in-memory routing cache immediately so inference routing doesn't wait
      // for the next restart/resync to see the mutation.
      if (body.isActive === false) {
        // Deactivate: remove from routing cache + gate override + bypass caches.
        removeModelFromRegistry(id);
        // Also drop any chat-picker promoted entries for this upstream so the
        // picker doesn't keep offering a deactivated model.
        removePromotedModel(updated!.hfModelId);
      } else if (body.isActive === true) {
        // Reactivate: re-add the model to the routing cache using the fresh DB row,
        // then restore its gate config so routing gate checks work immediately.
        addModelToRegistry({
          id: updated!.id,
          hfModelId: updated!.hfModelId,
          displayName: updated!.displayName,
          provider: updated!.provider,
          capabilities: Array.isArray(updated!.capabilities) ? (updated!.capabilities as string[]) : [],
          tier: updated!.tier,
          contextWindow: updated!.contextWindow,
          maxOutputTokens: updated!.maxOutputTokens,
          inputCostPer1kTokens: Number(updated!.inputCostPer1kTokens),
          outputCostPer1kTokens: Number(updated!.outputCostPer1kTokens),
          license: updated!.license,
          description: updated!.description,
        });
        // Re-apply gate config so the routing gate checks reflect DB state.
        const [restoredGate] = await db
          .select()
          .from(governanceGateConfigTable)
          .where(eq(governanceGateConfigTable.modelRegistryId, id))
          .limit(1);
        if (restoredGate) {
          applyGateOverride(id, {
            licenseApproved: restoredGate.licenseApproved,
            sensitivityAllowance: restoredGate.sensitivityAllowance,
            liveInferenceEnabled: restoredGate.liveInferenceEnabled,
            productionApproved: restoredGate.productionApproved,
          });
        }
      } else {
        // Partial field update — keep routing cache in sync with all mutable fields.
        updateModelInRegistry(id, {
          ...(body.license !== undefined && { license: body.license }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.capabilities !== undefined &&
            body.capabilities.length > 0 && {
              capability: body.capabilities[0] as import('../a11oy/runtime/model-registry.js').ModelCapability,
            }),
          ...(body.displayName !== undefined && { displayName: body.displayName }),
        });
      }

      logger.info({ id, actor: getUserLabel(req) }, '[governance] model registry entry updated');
      sendSuccess(res, { model: updated });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update model registry entry');
    }
  },
);

router.delete(
  '/governance/registry/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const existing = await db
        .select({ id: operatorModelRegistryTable.id, hfModelId: operatorModelRegistryTable.hfModelId, seeded: operatorModelRegistryTable.seeded })
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);

      if (existing.length === 0) {
        return sendNotFound(res, 'Model');
      }

      if (existing[0]!.seeded) {
        return sendBadRequest(res, 'Seeded models cannot be deleted. Deactivate them instead via PATCH with isActive: false.');
      }

      await db
        .delete(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id));

      // Remove from in-memory registry and clear associated gate caches
      removeModelFromRegistry(id);
      // And from the chat-router promoted-model picker so /chat/health no
      // longer lists the deleted model and forcedModelId routing falls back
      // to the default sovereign lane (see a11oy-chat.ts lane resolution).
      const removedLanes = removePromotedModel(existing[0]!.hfModelId);

      logger.info(
        { id, hfModelId: existing[0]!.hfModelId, removedPickerLanes: removedLanes, actor: getUserLabel(req) },
        '[governance] model removed from registry',
      );
      sendSuccess(res, { deleted: true, id });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete model from registry');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Gate Configuration API
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/governance/gates',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (_req: Request, res: Response) => {
    try {
      await expireStaleBypasses();
      const summary = await getGateStatusForAllModels();
      sendSuccess(res, { gates: summary });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get governance gate status');
    }
  },
);

router.get(
  '/governance/gates/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await expireStaleBypasses();
      const { id } = req.params;
      const status = await getGateStatusForModel(id);
      if (!status) return sendNotFound(res, 'Model');
      sendSuccess(res, status);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get gate status for model');
    }
  },
);

const updateGatesSchema = z.object({
  licenseApproved: z.boolean().optional(),
  sensitivityAllowance: z
    .enum(['public', 'internal', 'confidential', 'restricted'])
    .optional(),
  liveInferenceEnabled: z.boolean().nullable().optional(),
  productionApproved: z.boolean().nullable().optional(),
});

router.patch(
  '/governance/gates/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  validateBody(updateGatesSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body as z.infer<typeof updateGatesSchema>;

      const model = await db
        .select({ id: operatorModelRegistryTable.id, hfModelId: operatorModelRegistryTable.hfModelId })
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);

      if (model.length === 0) return sendNotFound(res, 'Model');

      const existing = await db
        .select()
        .from(governanceGateConfigTable)
        .where(eq(governanceGateConfigTable.modelRegistryId, id))
        .limit(1);

      const actor = getUserLabel(req);
      const updates: Partial<typeof governanceGateConfigTable.$inferInsert> = {
        updatedBy: actor,
        updatedAt: new Date(),
      };
      if (body.licenseApproved !== undefined) updates.licenseApproved = body.licenseApproved;
      if (body.sensitivityAllowance !== undefined) updates.sensitivityAllowance = body.sensitivityAllowance;
      if (body.liveInferenceEnabled !== undefined) updates.liveInferenceEnabled = body.liveInferenceEnabled;
      if (body.productionApproved !== undefined) updates.productionApproved = body.productionApproved;

      let gateConfig;
      if (existing.length === 0) {
        [gateConfig] = await db
          .insert(governanceGateConfigTable)
          .values({ modelRegistryId: id, updatedBy: actor, ...updates })
          .returning();
      } else {
        [gateConfig] = await db
          .update(governanceGateConfigTable)
          .set(updates)
          .where(eq(governanceGateConfigTable.modelRegistryId, id))
          .returning();
      }

      // Keep in-memory routing cache in sync with the DB config
      if (gateConfig) {
        applyGateOverride(id, {
          licenseApproved: gateConfig.licenseApproved,
          sensitivityAllowance: gateConfig.sensitivityAllowance,
          liveInferenceEnabled: gateConfig.liveInferenceEnabled,
          productionApproved: gateConfig.productionApproved,
        });
      }

      logger.info(
        { modelId: id, hfModelId: model[0]!.hfModelId, updates: body, actor },
        '[governance] gate configuration updated',
      );
      sendSuccess(res, { modelId: id, gateConfig });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update gate configuration');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Time-limited Bypass API
// ─────────────────────────────────────────────────────────────────────────────

const VALID_GATE_NAMES = [
  'registry_exists',
  'license_approved',
  'sensitivity_match',
  'live_inference_enabled',
  'production_approved',
] as const;

const grantBypassSchema = z.object({
  gateName: z.enum(VALID_GATE_NAMES),
  reason: z.string().min(10).max(1000),
  durationHours: z.number().int().min(1).max(720),
});

router.post(
  '/governance/gates/:id/bypass',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  validateBody(grantBypassSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body as z.infer<typeof grantBypassSchema>;

      const model = await db
        .select({ id: operatorModelRegistryTable.id, hfModelId: operatorModelRegistryTable.hfModelId })
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);

      if (model.length === 0) return sendNotFound(res, 'Model');

      const user = getRequestUser(req);
      const actor = getUserLabel(req);
      const bypassId = generateId('byp');
      const expiresAt = new Date(Date.now() + body.durationHours * 3600 * 1000);

      const [bypass] = await db
        .insert(governanceGateBypassesTable)
        .values({
          id: bypassId,
          modelRegistryId: id,
          gateName: body.gateName,
          grantedByUserId: user?.id ?? null,
          grantedByName: actor,
          reason: body.reason,
          expiresAt,
          isActive: true,
        })
        .returning();

      // Keep in-memory bypass cache in sync so inference routing sees it immediately
      applyGateBypass(id, body.gateName, expiresAt);

      logger.info(
        {
          bypassId,
          modelId: id,
          hfModelId: model[0]!.hfModelId,
          gateName: body.gateName,
          durationHours: body.durationHours,
          expiresAt: expiresAt.toISOString(),
          actor,
        },
        '[governance] gate bypass granted',
      );

      sendSuccess(res, { bypass }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to grant gate bypass');
    }
  },
);

router.delete(
  '/governance/gates/:id/bypass/:bypassId',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { id, bypassId } = req.params;

      const existing = await db
        .select()
        .from(governanceGateBypassesTable)
        .where(
          and(
            eq(governanceGateBypassesTable.id, bypassId),
            eq(governanceGateBypassesTable.modelRegistryId, id),
          ),
        )
        .limit(1);

      if (existing.length === 0) return sendNotFound(res, 'Bypass');

      const actor = getUserLabel(req);
      await db
        .update(governanceGateBypassesTable)
        .set({ isActive: false, revokedAt: new Date(), revokedBy: actor })
        .where(eq(governanceGateBypassesTable.id, bypassId));

      // Evict the specific gate bypass from the in-memory cache immediately
      const revokedGateName = existing[0]!.gateName;
      revokeGateBypass(id, revokedGateName);

      logger.info({ bypassId, modelId: id, gateName: revokedGateName, actor }, '[governance] gate bypass revoked');
      sendSuccess(res, { revoked: true, bypassId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to revoke gate bypass');
    }
  },
);

router.get(
  '/governance/gates/:id/bypasses',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await expireStaleBypasses();
      const { id } = req.params;
      const { active } = req.query as { active?: string };

      const model = await db
        .select({ id: operatorModelRegistryTable.id })
        .from(operatorModelRegistryTable)
        .where(eq(operatorModelRegistryTable.id, id))
        .limit(1);

      if (model.length === 0) return sendNotFound(res, 'Model');

      let query = db
        .select()
        .from(governanceGateBypassesTable)
        .where(eq(governanceGateBypassesTable.modelRegistryId, id))
        .$dynamic();

      if (active === 'true') {
        query = query.where(
          and(
            eq(governanceGateBypassesTable.modelRegistryId, id),
            eq(governanceGateBypassesTable.isActive, true),
          ),
        );
      }

      const bypasses = await query;
      sendSuccess(res, { bypasses, total: bypasses.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list gate bypasses');
    }
  },
);

export default router;

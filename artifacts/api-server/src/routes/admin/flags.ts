import {
  db,
  featureFlagOverridesTable,
  featureFlagsTable,
  flagCheckLogsTable,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import type { IRouter } from 'express';
import { z } from 'zod';
import { logActivity } from '../../lib/activity-logger.js';
import { sendError, sendNotFound } from '../../lib/api-response.js';
import { invalidateFlagCache } from '../../lib/platform-flags.js';
import { validateBody } from '../../lib/validation.js';

const enabledSchema = z.object({ enabled: z.boolean() });

const rolloutSchema = z.object({
  rolloutPercentage: z.number().int().min(0).max(100),
});

const overrideSchema = z.object({
  entityType: z.enum(['user', 'org', 'role']),
  entityId: z.string().min(1),
  isEnabled: z.boolean(),
});

export function register(router: IRouter): void {
  router.get('/admin/feature-flags', async (_req, res) => {
    try {
      const rows = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
      const flags = rows.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        enabled: r.isEnabled,
        description: r.description ?? '',
        rolloutPercentage: r.rolloutPercentage,
        scope: r.scope,
        updatedAt: r.updatedAt.toISOString(),
      }));
      res.json({ flags });
    } catch {
      sendError(res, 'Failed to fetch feature flags', 500, 'INTERNAL_ERROR');
    }
  });

  router.put('/admin/feature-flags/:key', validateBody(enabledSchema), async (req, res) => {
    try {
      const key = req.params.key as string;
      const { enabled } = req.body as z.infer<typeof enabledSchema>;
      const [updated] = await db
        .update(featureFlagsTable)
        .set({ isEnabled: enabled, updatedAt: new Date() })
        .where(eq(featureFlagsTable.key, key))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Feature flag');
        return;
      }
      invalidateFlagCache(key);
      await logActivity(
        req,
        'update',
        'feature_flag',
        String(updated.id),
        `Admin toggled flag: ${key}=${enabled}`,
      ).catch(() => {});
      res.json({
        key: updated.key,
        name: updated.name,
        enabled: updated.isEnabled,
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch {
      sendError(res, 'Failed to update feature flag', 500, 'INTERNAL_ERROR');
    }
  });

  router.patch(
    '/admin/feature-flags/:key/rollout',
    validateBody(rolloutSchema),
    async (req, res) => {
      try {
        const key = req.params.key as string;
        const { rolloutPercentage } = req.body as z.infer<typeof rolloutSchema>;
        const [updated] = await db
          .update(featureFlagsTable)
          .set({ rolloutPercentage, updatedAt: new Date() })
          .where(eq(featureFlagsTable.key, key))
          .returning();
        if (!updated) {
          sendNotFound(res, 'Feature flag');
          return;
        }
        invalidateFlagCache(key);
        await logActivity(
          req,
          'update',
          'feature_flag',
          String(updated.id),
          `Admin set rollout for ${key} to ${rolloutPercentage}%`,
        ).catch(() => {});
        res.json({
          key: updated.key,
          rolloutPercentage: updated.rolloutPercentage,
          updatedAt: updated.updatedAt.toISOString(),
        });
      } catch {
        sendError(res, 'Failed to update rollout percentage', 500, 'INTERNAL_ERROR');
      }
    },
  );

  router.get('/admin/feature-flags/:key/overrides', async (req, res) => {
    try {
      const key = req.params.key as string;
      const [flag] = await db
        .select({ id: featureFlagsTable.id })
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.key, key))
        .limit(1);
      if (!flag) {
        sendNotFound(res, 'Feature flag');
        return;
      }
      const overrides = await db
        .select()
        .from(featureFlagOverridesTable)
        .where(eq(featureFlagOverridesTable.flagId, flag.id))
        .orderBy(featureFlagOverridesTable.entityType, featureFlagOverridesTable.entityId);
      res.json({ overrides });
    } catch {
      sendError(res, 'Failed to fetch overrides', 500, 'INTERNAL_ERROR');
    }
  });

  router.post(
    '/admin/feature-flags/:key/overrides',
    validateBody(overrideSchema),
    async (req, res) => {
      try {
        const key = req.params.key as string;
        const { entityType, entityId, isEnabled } = req.body as z.infer<typeof overrideSchema>;
        const [flag] = await db
          .select({ id: featureFlagsTable.id })
          .from(featureFlagsTable)
          .where(eq(featureFlagsTable.key, key))
          .limit(1);
        if (!flag) {
          sendNotFound(res, 'Feature flag');
          return;
        }
        const existing = await db
          .select({ id: featureFlagOverridesTable.id })
          .from(featureFlagOverridesTable)
          .where(
            and(
              eq(featureFlagOverridesTable.flagId, flag.id),
              eq(featureFlagOverridesTable.entityType, entityType),
              eq(featureFlagOverridesTable.entityId, entityId),
            ),
          )
          .limit(1);

        let override;
        if (existing.length > 0) {
          const [updated] = await db
            .update(featureFlagOverridesTable)
            .set({ isEnabled })
            .where(eq(featureFlagOverridesTable.id, existing[0].id))
            .returning();
          override = updated;
        } else {
          const [inserted] = await db
            .insert(featureFlagOverridesTable)
            .values({ flagId: flag.id, entityType, entityId, isEnabled })
            .returning();
          override = inserted;
        }

        invalidateFlagCache(key);
        await logActivity(
          req,
          'create',
          'feature_flag_override',
          String(override.id),
          `Admin set ${key} override for ${entityType}:${entityId} = ${isEnabled}`,
        ).catch(() => {});

        res.json({ override });
      } catch {
        sendError(res, 'Failed to set override', 500, 'INTERNAL_ERROR');
      }
    },
  );

  router.delete('/admin/feature-flags/:key/overrides/:id', async (req, res) => {
    try {
      const key = req.params.key as string;
      const overrideId = parseInt(req.params.id as string, 10);
      if (isNaN(overrideId)) {
        sendError(res, 'Invalid override id', 400, 'INVALID_PARAM');
        return;
      }

      const [flag] = await db
        .select({ id: featureFlagsTable.id })
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.key, key))
        .limit(1);
      if (!flag) {
        sendNotFound(res, 'Feature flag');
        return;
      }

      const [deleted] = await db
        .delete(featureFlagOverridesTable)
        .where(
          and(
            eq(featureFlagOverridesTable.id, overrideId),
            eq(featureFlagOverridesTable.flagId, flag.id),
          ),
        )
        .returning();
      if (!deleted) {
        sendNotFound(res, 'Override');
        return;
      }
      invalidateFlagCache(key);
      await logActivity(
        req,
        'delete',
        'feature_flag_override',
        String(overrideId),
        `Admin removed override id=${overrideId} from flag ${key}`,
      ).catch(() => {});
      res.json({ deleted: true });
    } catch {
      sendError(res, 'Failed to delete override', 500, 'INTERNAL_ERROR');
    }
  });

  /**
   * GET /admin/feature-flags/:key/exposure
   *
   * Returns a deterministic summary of who currently sees this flag as enabled:
   * - Explicit org/user/role overrides set to ON or OFF
   * - Whether the global toggle is on and what rollout % applies
   *
   * This gives operators a "current audience" view without requiring a log
   * query.
   */
  router.get('/admin/feature-flags/:key/exposure', async (req, res) => {
    try {
      const key = req.params.key as string;
      const [flag] = await db
        .select()
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.key, key))
        .limit(1);
      if (!flag) {
        sendNotFound(res, 'Feature flag');
        return;
      }
      const overrides = await db
        .select()
        .from(featureFlagOverridesTable)
        .where(eq(featureFlagOverridesTable.flagId, flag.id))
        .orderBy(featureFlagOverridesTable.entityType, featureFlagOverridesTable.entityId);

      const enabledOverrides = overrides.filter((o) => o.isEnabled);
      const disabledOverrides = overrides.filter((o) => !o.isEnabled);

      res.json({
        key: flag.key,
        globallyEnabled: flag.isEnabled,
        rolloutPercentage: flag.rolloutPercentage,
        effectiveForAll: flag.isEnabled && flag.rolloutPercentage >= 100 && overrides.length === 0,
        overrides: {
          total: overrides.length,
          enabled: enabledOverrides,
          disabled: disabledOverrides,
        },
      });
    } catch {
      sendError(res, 'Failed to fetch exposure', 500, 'INTERNAL_ERROR');
    }
  });

  router.get('/admin/feature-flags/check-logs', async (req, res) => {
    try {
      const flagKey = req.query.key as string | undefined;
      const limit = Math.min(parseInt((req.query.limit as string) ?? '100', 10), 500);

      const rows = flagKey
        ? await db
            .select()
            .from(flagCheckLogsTable)
            .where(eq(flagCheckLogsTable.flagKey, flagKey))
            .orderBy(desc(flagCheckLogsTable.checkedAt))
            .limit(limit)
        : await db
            .select()
            .from(flagCheckLogsTable)
            .orderBy(desc(flagCheckLogsTable.checkedAt))
            .limit(limit);

      res.json({ logs: rows });
    } catch {
      sendError(res, 'Failed to fetch check logs', 500, 'INTERNAL_ERROR');
    }
  });
}

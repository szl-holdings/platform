/**
 * Runtime Configuration Admin API
 *
 * Allows operators to read and update operational parameters at runtime
 * without redeploying the server. All mutating routes require the ops or
 * admin role. Every change writes an audit log entry for traceability.
 *
 * Routes (all mounted under /api/runtime-config):
 *   GET    /                    List all config entries (paginated)
 *   GET    /:key                Get a single config entry by key
 *   POST   /                    Create a new config entry
 *   PATCH  /:key                Update value / description for an existing key
 *   DELETE /:key                Delete a config entry (resets to code default)
 */

import { activityLogTable, db, runtimeConfigTable, usersTable } from '@szl-holdings/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { Router } from 'express';
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
import { logActivity } from '../lib/activity-logger';

import { invalidateConfigCache, invalidateAllConfigCache } from '../lib/runtime-config';
import { authMiddleware, requireRole } from '../middlewares/auth';

const REDACTED_VALUE = '[redacted]';
const maskValue = (value: string | null | undefined, isSensitive: boolean) =>
  isSensitive ? REDACTED_VALUE : (value ?? null);

const router = Router();

const VALUE_TYPES = ['string', 'number', 'boolean', 'json'] as const;
const CATEGORIES = [
  'general',
  'rate_limits',
  'circuit_breaker',
  'slo',
  'jobs',
  'load_shedder',
  'feature_flags',
  'runtime_config',
] as const;

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  value: z.string().min(0).max(10000),
  valueType: z.enum(VALUE_TYPES).default('string'),
  description: z.string().max(500).optional(),
  defaultValue: z.string().max(10000).optional(),
  category: z.enum(CATEGORIES).default('general'),
  isSensitive: z.boolean().default(false),
});

const updateSchema = z.object({
  value: z.string().min(0).max(10000).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(CATEGORIES).optional(),
  isSensitive: z.boolean().optional(),
  // When true, tag the resulting audit entry as a revert (one-click rollback
  // from the history drawer). Does not change the underlying write semantics.
  revert: z.boolean().optional(),
  revertFromHistoryId: z.number().int().positive().optional(),
});

router.get('/runtime-config', authMiddleware(), requireRole('ops', 'admin'), async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const conditions = [];
    if (category) conditions.push(eq(runtimeConfigTable.category, category));
    if (search) conditions.push(ilike(runtimeConfigTable.key, `%${search}%`));

    const rows = await db
      .select()
      .from(runtimeConfigTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(runtimeConfigTable.category, runtimeConfigTable.key)
      .limit(limit)
      .offset(offset);

    const safeRows = rows.map((r) => ({
      ...r,
      value: r.isSensitive ? '[redacted]' : r.value,
      defaultValue: r.isSensitive ? '[redacted]' : r.defaultValue,
    }));

    sendSuccess(res, safeRows, 200, { page, limit, offset });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list runtime config');
  }
});

// History endpoint — must be declared before the `/:key` dynamic route so
// Express doesn't match it as `key="_history"`. Returns recent activity-log
// entries for runtime_config writes; powers the admin Runtime Config UI's
// inline "who changed this and when" badges and the per-key history drawer.
router.get(
  '/runtime-config/_history',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const keyParam = req.query.key as string | undefined;
      const limitParam = Number.parseInt((req.query.limit as string) ?? '200', 10);
      const limit = Math.min(Math.max(1, Number.isNaN(limitParam) ? 200 : limitParam), 500);

      // Restrict to true value-change events so operators see the actual
      // create/update/delete history. Cache-invalidation entries (also logged
      // under the runtime_config resource) would otherwise mask the most
      // recent value mutation in the per-row "last changed" badge.
      const conditions = [
        eq(activityLogTable.resource, 'runtime_config'),
        inArray(activityLogTable.action, ['create', 'update', 'delete']),
      ];
      if (keyParam) conditions.push(eq(activityLogTable.resourceId, keyParam));

      const rows = await db
        .select({
          id: activityLogTable.id,
          key: activityLogTable.resourceId,
          action: activityLogTable.action,
          description: activityLogTable.description,
          metadata: activityLogTable.metadata,
          createdAt: activityLogTable.createdAt,
          userId: activityLogTable.userId,
          actorName: usersTable.displayName,
          actorEmail: usersTable.email,
        })
        .from(activityLogTable)
        .leftJoin(usersTable, eq(activityLogTable.userId, usersTable.id))
        .where(and(...conditions))
        .orderBy(desc(activityLogTable.createdAt))
        .limit(limit);

      sendSuccess(
        res,
        rows.map((r) => ({
          id: r.id,
          key: r.key,
          action: r.action,
          actor: r.actorEmail ?? r.actorName ?? (r.userId ? `user_${r.userId}` : 'system'),
          actorEmail: r.actorEmail,
          actorName: r.actorName,
          description: r.description,
          metadata: r.metadata,
          createdAt: r.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to load runtime config history');
    }
  },
);

router.get(
  '/runtime-config/:key',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const [row] = await db
        .select()
        .from(runtimeConfigTable)
        .where(eq(runtimeConfigTable.key, key))
        .limit(1);
      if (!row) {
        sendNotFound(res, `Config key '${key}'`);
        return;
      }
      sendSuccess(res, {
        ...row,
        value: row.isSensitive ? '[redacted]' : row.value,
        defaultValue: row.isSensitive ? '[redacted]' : row.defaultValue,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get runtime config entry');
    }
  },
);

router.post(
  '/runtime-config',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid config entry', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const [row] = await db
        .insert(runtimeConfigTable)
        .values({
          key: data.key,
          value: data.value,
          valueType: data.valueType,
          description: data.description ?? null,
          defaultValue: data.defaultValue ?? null,
          category: data.category,
          isSensitive: data.isSensitive,
        })
        .returning();
      await logActivity(
        req,
        'create',
        'runtime_config',
        row.key,
        `Created config: ${row.key}`,
        {
          newValue: maskValue(row.value, row.isSensitive),
          valueType: row.valueType,
          category: row.category,
        },
      );
      invalidateConfigCache(row.key);
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create runtime config entry');
    }
  },
);

router.patch(
  '/runtime-config/:key',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid update payload', parsed.error.flatten().fieldErrors);
        return;
      }
      const data = parsed.data;
      const valueOnlyFields = Object.keys(data).filter(
        (k) => k !== 'revert' && k !== 'revertFromHistoryId',
      );
      if (valueOnlyFields.length === 0) {
        sendBadRequest(res, 'At least one field must be provided to update');
        return;
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.value !== undefined) updateData.value = data.value;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isSensitive !== undefined) updateData.isSensitive = data.isSensitive;

      const [previous] = await db
        .select()
        .from(runtimeConfigTable)
        .where(eq(runtimeConfigTable.key, key))
        .limit(1);

      const [row] = await db
        .update(runtimeConfigTable)
        .set(updateData)
        .where(eq(runtimeConfigTable.key, key))
        .returning();
      if (!row) {
        sendNotFound(res, `Config key '${key}'`);
        return;
      }
      const sensitive = row.isSensitive || (previous?.isSensitive ?? false);
      const isRevert = data.revert === true;
      await logActivity(
        req,
        'update',
        'runtime_config',
        row.key,
        `${isRevert ? 'Reverted' : 'Updated'} config: ${row.key}${data.value !== undefined ? ` = ${sensitive ? REDACTED_VALUE : data.value}` : ''}`,
        {
          // Only include previous/new value in metadata when the value field
          // itself changed; otherwise rely on changedFields so the audit feed
          // doesn't imply a value mutation for description/category-only edits.
          ...(data.value !== undefined
            ? {
                previousValue: previous ? maskValue(previous.value, sensitive) : null,
                newValue: maskValue(row.value, sensitive),
              }
            : {}),
          changedFields: valueOnlyFields,
          ...(isRevert ? { revert: true } : {}),
          ...(data.revertFromHistoryId !== undefined
            ? { revertFromHistoryId: data.revertFromHistoryId }
            : {}),
        },
      );
      invalidateConfigCache(row.key);
      sendSuccess(res, {
        ...row,
        value: row.isSensitive ? '[redacted]' : row.value,
        defaultValue: row.isSensitive ? '[redacted]' : row.defaultValue,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update runtime config entry');
    }
  },
);

router.delete(
  '/runtime-config/:key',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const [row] = await db
        .delete(runtimeConfigTable)
        .where(eq(runtimeConfigTable.key, key))
        .returning();
      if (!row) {
        sendNotFound(res, `Config key '${key}'`);
        return;
      }
      await logActivity(
        req,
        'delete',
        'runtime_config',
        row.key,
        `Deleted config: ${row.key}`,
        { previousValue: maskValue(row.value, row.isSensitive) },
      );
      invalidateConfigCache(row.key);
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete runtime config entry');
    }
  },
);

router.post(
  '/runtime-config/invalidate-cache',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const { key } = req.body as { key?: string };
      if (key && typeof key === 'string') {
        invalidateConfigCache(key);
        await logActivity(req, 'update', 'runtime_config', key, `Cache invalidated for: ${key}`);
        sendSuccess(res, { invalidated: key });
      } else {
        invalidateAllConfigCache();
        await logActivity(req, 'update', 'runtime_config', 'all', 'Full config cache invalidated');
        sendSuccess(res, { invalidated: 'all' });
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to invalidate config cache');
    }
  },
);

export default router;

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

import { db, runtimeConfigTable } from '@szl-holdings/db';
import { and, eq, ilike } from 'drizzle-orm';
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
      await logActivity(req, 'create', 'runtime_config', row.key, `Created config: ${row.key}`);
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
      if (Object.keys(data).length === 0) {
        sendBadRequest(res, 'At least one field must be provided to update');
        return;
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.value !== undefined) updateData.value = data.value;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isSensitive !== undefined) updateData.isSensitive = data.isSensitive;

      const [row] = await db
        .update(runtimeConfigTable)
        .set(updateData)
        .where(eq(runtimeConfigTable.key, key))
        .returning();
      if (!row) {
        sendNotFound(res, `Config key '${key}'`);
        return;
      }
      await logActivity(
        req,
        'update',
        'runtime_config',
        row.key,
        `Updated config: ${row.key}${data.value !== undefined ? ` = ${row.isSensitive ? '[redacted]' : data.value}` : ''}`,
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
      await logActivity(req, 'delete', 'runtime_config', row.key, `Deleted config: ${row.key}`);
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

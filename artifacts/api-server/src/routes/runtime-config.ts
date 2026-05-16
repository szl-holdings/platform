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

/**
 * Bulk export (task #5015).
 *
 * Returns every NON-sensitive entry in a stable, portable JSON envelope so
 * operators can copy a known-good config from one environment to another, or
 * snapshot the current state for disaster-recovery purposes.
 *
 * Sensitive entries are excluded entirely (not just redacted) — a redacted
 * payload would corrupt the target environment if imported. Operators must
 * re-set sensitive values per environment.
 */
router.get(
  '/runtime-config/_export',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(runtimeConfigTable)
        .where(eq(runtimeConfigTable.isSensitive, false))
        .orderBy(runtimeConfigTable.category, runtimeConfigTable.key);

      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        entryCount: rows.length,
        sensitiveExcluded: true,
        entries: rows.map((r) => ({
          key: r.key,
          value: r.value,
          valueType: r.valueType,
          description: r.description,
          defaultValue: r.defaultValue,
          category: r.category,
          isSensitive: false as const,
        })),
      };
      sendSuccess(res, payload);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export runtime config');
    }
  },
);

const importEntrySchema = z.object({
  key: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  value: z.string().min(0).max(10000),
  valueType: z.enum(VALUE_TYPES).default('string'),
  description: z.string().max(500).nullable().optional(),
  defaultValue: z.string().max(10000).nullable().optional(),
  category: z.enum(CATEGORIES).default('general'),
  isSensitive: z.boolean().optional(),
});

const importSchema = z.object({
  version: z.literal(1).optional(),
  entries: z.array(importEntrySchema).max(2000),
  deleteMissing: z.boolean().default(false),
  dryRun: z.boolean().default(true),
});

interface ImportDiffEntry {
  key: string;
  category: string;
  valueType: string;
  description: string | null;
  previousValue?: string | null;
  newValue?: string | null;
}

interface ImportPlan {
  adds: ImportDiffEntry[];
  updates: ImportDiffEntry[];
  deletes: ImportDiffEntry[];
  unchanged: Array<{ key: string }>;
  skipped: Array<{ key: string; reason: string }>;
}

/**
 * Bulk import (task #5015).
 *
 * Two-phase contract: callers ALWAYS preview first with `dryRun: true`, then
 * confirm with `dryRun: false`. The diff is computed against the live table
 * the same way in both phases, so the preview is faithful to what apply will
 * do (modulo concurrent edits between preview and apply — there is no row
 * re-check during apply, so a value mutated by another operator in that
 * window will be overwritten by the import). Each row is applied
 * independently and per-row errors are recorded without aborting the rest
 * of the import.
 *
 * Doctrine notes:
 * - Sensitive entries are silently SKIPPED. Importing a sensitive value
 *   from another environment would be a credential mix-up; if the payload
 *   claims an entry is sensitive we refuse to touch it.
 * - `deleteMissing` is opt-in. Default behaviour is purely additive so the
 *   common "promote staging tweaks to prod" workflow can't accidentally
 *   wipe prod-only entries.
 * - Each create/update/delete writes its own activity-log row so the
 *   existing per-key history drawer keeps working unchanged.
 */
router.post(
  '/runtime-config/_import',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid import payload', parsed.error.flatten().fieldErrors);
        return;
      }
      const { entries, deleteMissing, dryRun } = parsed.data;

      // `payloadKeys` tracks every key the operator mentioned in the payload,
      // even keys we skip (duplicates, sensitive-flagged). This is what
      // `deleteMissing` consults — a key the operator named is never
      // considered "missing", otherwise a skipped sensitive payload entry
      // would cause its non-sensitive live counterpart to be silently
      // scheduled for deletion. `seenKeys` separately deduplicates the
      // entries we actually plan to apply.
      const payloadKeys = new Set<string>();
      const seenKeys = new Set<string>();
      const dedupedEntries: typeof entries = [];
      const skipped: ImportPlan['skipped'] = [];
      for (const e of entries) {
        if (seenKeys.has(e.key)) {
          payloadKeys.add(e.key);
          skipped.push({ key: e.key, reason: 'duplicate key in payload' });
          continue;
        }
        if (e.isSensitive === true) {
          payloadKeys.add(e.key);
          skipped.push({ key: e.key, reason: 'sensitive entries cannot be bulk-imported' });
          continue;
        }
        seenKeys.add(e.key);
        payloadKeys.add(e.key);
        dedupedEntries.push(e);
      }

      const existing = await db.select().from(runtimeConfigTable);
      const existingByKey = new Map(existing.map((r) => [r.key, r]));

      const plan: ImportPlan = { adds: [], updates: [], deletes: [], unchanged: [], skipped };

      for (const e of dedupedEntries) {
        const cur = existingByKey.get(e.key);
        if (!cur) {
          plan.adds.push({
            key: e.key,
            category: e.category,
            valueType: e.valueType,
            description: e.description ?? null,
            newValue: e.value,
          });
          continue;
        }
        if (cur.isSensitive) {
          plan.skipped.push({
            key: e.key,
            reason: 'live entry is marked sensitive; refusing to overwrite',
          });
          continue;
        }
        const changed =
          cur.value !== e.value ||
          cur.valueType !== e.valueType ||
          cur.category !== e.category ||
          (cur.description ?? null) !== (e.description ?? null);
        if (!changed) {
          plan.unchanged.push({ key: e.key });
          continue;
        }
        plan.updates.push({
          key: e.key,
          category: e.category,
          valueType: e.valueType,
          description: e.description ?? null,
          previousValue: cur.value,
          newValue: e.value,
        });
      }

      if (deleteMissing) {
        for (const cur of existing) {
          if (cur.isSensitive) continue; // never bulk-delete sensitive entries
          if (payloadKeys.has(cur.key)) continue; // operator named this key (even if skipped) — leave it alone
          plan.deletes.push({
            key: cur.key,
            category: cur.category,
            valueType: cur.valueType,
            description: cur.description,
            previousValue: cur.value,
          });
        }
      }

      if (dryRun) {
        sendSuccess(res, { applied: false, plan });
        return;
      }

      // Apply phase. Sequential and per-row so each mutation produces its
      // own activity-log entry (matching the single-row routes) and one
      // failing row doesn't roll back others — operators can re-run import
      // after fixing the bad row.
      const applied = { added: 0, updated: 0, deleted: 0, errors: [] as Array<{ key: string; error: string }> };

      for (const a of plan.adds) {
        try {
          const entry = dedupedEntries.find((d) => d.key === a.key);
          if (!entry) continue;
          const [row] = await db
            .insert(runtimeConfigTable)
            .values({
              key: entry.key,
              value: entry.value,
              valueType: entry.valueType,
              description: entry.description ?? null,
              defaultValue: entry.defaultValue ?? null,
              category: entry.category,
              isSensitive: false,
            })
            .returning();
          await logActivity(req, 'create', 'runtime_config', row.key, `Imported config: ${row.key}`, {
            newValue: row.value,
            valueType: row.valueType,
            category: row.category,
            bulkImport: true,
          });
          invalidateConfigCache(row.key);
          applied.added += 1;
        } catch (err) {
          applied.errors.push({ key: a.key, error: err instanceof Error ? err.message : String(err) });
        }
      }

      for (const u of plan.updates) {
        try {
          const entry = dedupedEntries.find((d) => d.key === u.key);
          if (!entry) continue;
          const [row] = await db
            .update(runtimeConfigTable)
            .set({
              value: entry.value,
              valueType: entry.valueType,
              description: entry.description ?? null,
              category: entry.category,
              updatedAt: new Date(),
            })
            .where(eq(runtimeConfigTable.key, entry.key))
            .returning();
          if (!row) continue;
          await logActivity(req, 'update', 'runtime_config', row.key, `Imported update: ${row.key} = ${row.value}`, {
            previousValue: u.previousValue,
            newValue: row.value,
            changedFields: ['value', 'valueType', 'category', 'description'],
            bulkImport: true,
          });
          invalidateConfigCache(row.key);
          applied.updated += 1;
        } catch (err) {
          applied.errors.push({ key: u.key, error: err instanceof Error ? err.message : String(err) });
        }
      }

      for (const d of plan.deletes) {
        try {
          const [row] = await db
            .delete(runtimeConfigTable)
            .where(eq(runtimeConfigTable.key, d.key))
            .returning();
          if (!row) continue;
          await logActivity(req, 'delete', 'runtime_config', row.key, `Imported delete: ${row.key}`, {
            previousValue: row.value,
            bulkImport: true,
          });
          invalidateConfigCache(row.key);
          applied.deleted += 1;
        } catch (err) {
          applied.errors.push({ key: d.key, error: err instanceof Error ? err.message : String(err) });
        }
      }

      sendSuccess(res, { applied: true, plan, result: applied });
    } catch (err) {
      handleRouteError(res, err, 'Failed to import runtime config');
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

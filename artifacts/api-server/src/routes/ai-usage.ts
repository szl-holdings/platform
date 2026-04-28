/**
 * AI Provider Cost & Usage API
 *
 * GET  /ai/usage/summary          — per-tenant/product daily & monthly cost summary (admin)
 * GET  /ai/usage/records          — paginated raw usage records (admin)
 * GET  /ai/usage/budgets          — list all tenant budgets (admin)
 * GET  /ai/usage/budgets/:orgId   — single tenant budget
 * PUT  /ai/usage/budgets/:orgId   — upsert tenant budget caps
 * DELETE /ai/usage/budgets/:orgId — remove a tenant budget
 * GET  /ai/usage/model-prices     — list model price table (admin)
 * PUT  /ai/usage/model-prices     — upsert a model price entry (admin)
 */

import { db, pool } from '@szl-holdings/db';
import {
  aiModelPricesTable,
  aiTenantBudgetsTable,
  aiUsageRecordsTable,
} from '@szl-holdings/db/schema';
import { and, eq, gte, lte, sum } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendNotFound, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { ensureCallModelSchema } from '../services/ai/call-model';

const router: IRouter = Router();

router.use('/ai/usage', authMiddleware({ required: true }));
router.use('/ai/usage', requireRole('admin', 'super_admin'));

async function ensureSchema() {
  await ensureCallModelSchema();
}

const summaryQuerySchema = z.object({
  orgId: z.string().optional(),
  surface: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

router.get('/ai/usage/summary', validateQuery(summaryQuerySchema), async (req, res) => {
  try {
    await ensureSchema();
    const { orgId, surface, from, to } = req.query as z.infer<typeof summaryQuerySchema>;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const fromDate = from ? new Date(from) : monthStart;
    const toDate = to ? new Date(to) : now;

    const conditions: any[] = [
      gte(aiUsageRecordsTable.createdAt, fromDate),
      lte(aiUsageRecordsTable.createdAt, toDate),
    ];
    if (orgId) conditions.push(eq(aiUsageRecordsTable.orgId, orgId));
    if (surface) conditions.push(eq(aiUsageRecordsTable.surface, surface));

    const [overallRows, byOrgRows, byProductRows, byModelRows, byProviderRows, dailyRows, monthlyRows] =
      await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) AS call_count,
             COALESCE(SUM(total_tokens), 0) AS total_tokens,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(AVG(latency_ms), 0) AS avg_latency_ms,
             COUNT(*) FILTER (WHERE status = 'error') AS error_count
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
             ${surface ? `AND surface = '${surface.replace(/'/g, "''")}'` : ''}`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT org_id,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(SUM(total_tokens), 0) AS total_tokens
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY org_id ORDER BY total_cost_usd DESC LIMIT 50`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT surface,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(SUM(total_tokens), 0) AS total_tokens
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY surface ORDER BY total_cost_usd DESC`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT model, provider,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(SUM(total_tokens), 0) AS total_tokens,
             COALESCE(AVG(latency_ms), 0) AS avg_latency_ms
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY model, provider ORDER BY total_cost_usd DESC LIMIT 30`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT provider,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY provider ORDER BY total_cost_usd DESC`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT DATE_TRUNC('day', created_at) AS day,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(SUM(total_tokens), 0) AS total_tokens
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY day ORDER BY day ASC`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT DATE_TRUNC('month', created_at) AS month,
             COUNT(*) AS call_count,
             COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
             COALESCE(SUM(total_tokens), 0) AS total_tokens
           FROM ai_usage_records
           WHERE created_at >= $1 AND created_at <= $2
             ${orgId ? `AND org_id = '${orgId.replace(/'/g, "''")}'` : ''}
           GROUP BY month ORDER BY month ASC`,
          [fromDate, toDate],
        ),
      ]);

    const overall = overallRows.rows[0] ?? {};

    sendSuccess(res, {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      overall: {
        callCount: parseInt(overall.call_count ?? '0', 10),
        totalTokens: parseInt(overall.total_tokens ?? '0', 10),
        totalCostUsd: parseFloat(overall.total_cost_usd ?? '0'),
        avgLatencyMs: parseFloat(overall.avg_latency_ms ?? '0'),
        errorCount: parseInt(overall.error_count ?? '0', 10),
      },
      byOrg: byOrgRows.rows.map((r) => ({
        orgId: r.org_id,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
        totalTokens: parseInt(r.total_tokens, 10),
      })),
      byProduct: byProductRows.rows.map((r) => ({
        surface: r.surface,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
        totalTokens: parseInt(r.total_tokens, 10),
      })),
      byModel: byModelRows.rows.map((r) => ({
        model: r.model,
        provider: r.provider,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
        totalTokens: parseInt(r.total_tokens, 10),
        avgLatencyMs: parseFloat(r.avg_latency_ms),
      })),
      byProvider: byProviderRows.rows.map((r) => ({
        provider: r.provider,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
      })),
      dailyTrend: dailyRows.rows.map((r) => ({
        day: r.day,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
        totalTokens: parseInt(r.total_tokens, 10),
      })),
      monthlyTrend: monthlyRows.rows.map((r) => ({
        month: r.month,
        callCount: parseInt(r.call_count, 10),
        totalCostUsd: parseFloat(r.total_cost_usd),
        totalTokens: parseInt(r.total_tokens, 10),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /ai/usage/summary');
  }
});

const recordsQuerySchema = z.object({
  orgId: z.string().optional(),
  surface: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get('/ai/usage/records', validateQuery(recordsQuerySchema), async (req, res) => {
  try {
    await ensureSchema();
    const { orgId, surface, provider, model, from, to, limit, offset } =
      req.query as z.infer<typeof recordsQuerySchema>;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const fromDate = from ? new Date(from) : monthStart;
    const toDate = to ? new Date(to) : now;

    const conditions: string[] = [
      `created_at >= $1`,
      `created_at <= $2`,
    ];
    const params: any[] = [fromDate, toDate];
    let p = 3;

    if (orgId) { conditions.push(`org_id = $${p++}`); params.push(orgId); }
    if (surface) { conditions.push(`surface = $${p++}`); params.push(surface); }
    if (provider) { conditions.push(`provider = $${p++}`); params.push(provider); }
    if (model) { conditions.push(`model = $${p++}`); params.push(model); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const dataRows = await pool.query(
      `SELECT id, request_id, org_id, user_id, provider, model, surface,
              prompt_tokens, completion_tokens, total_tokens, latency_ms,
              cost_usd, status, error_message, created_at
       FROM ai_usage_records ${where}
       ORDER BY created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset],
    );
    const countRow = await pool.query(`SELECT COUNT(*) AS total FROM ai_usage_records ${where}`, params);

    sendSuccess(res, {
      records: dataRows.rows,
      total: parseInt(countRow.rows[0]?.total ?? '0', 10),
      limit,
      offset,
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /ai/usage/records');
  }
});

router.get('/ai/usage/budgets', async (_req, res) => {
  try {
    await ensureSchema();
    const budgets = await db.select().from(aiTenantBudgetsTable).orderBy(aiTenantBudgetsTable.orgId);
    sendSuccess(res, { budgets });
  } catch (err) {
    handleRouteError(res, err, 'GET /ai/usage/budgets');
  }
});

router.get('/ai/usage/budgets/:orgId', async (req, res) => {
  try {
    await ensureSchema();
    const { orgId } = req.params;
    const [budget] = await db
      .select()
      .from(aiTenantBudgetsTable)
      .where(eq(aiTenantBudgetsTable.orgId, orgId))
      .limit(1);
    if (!budget) {
      sendNotFound(res, 'Budget');
      return;
    }
    sendSuccess(res, { budget });
  } catch (err) {
    handleRouteError(res, err, 'GET /ai/usage/budgets/:orgId');
  }
});

const budgetBodySchema = z.object({
  hourlyLimitUsd: z.number().positive().nullable().optional(),
  dailyLimitUsd: z.number().positive().nullable().optional(),
  monthlyLimitUsd: z.number().positive().nullable().optional(),
  alertThresholdPct: z.number().min(1).max(100).default(80),
  hardCapEnabled: z.boolean().default(true),
  alertCooldownMinutes: z.number().int().min(5).default(60),
  notes: z.string().max(500).optional(),
});

router.put('/ai/usage/budgets/:orgId', validateBody(budgetBodySchema), async (req, res) => {
  try {
    await ensureSchema();
    const { orgId } = req.params;
    const body = req.body as z.infer<typeof budgetBodySchema>;

    const now = new Date();
    const [existing] = await db
      .select()
      .from(aiTenantBudgetsTable)
      .where(eq(aiTenantBudgetsTable.orgId, orgId))
      .limit(1);

    const values = {
      orgId,
      hourlyLimitUsd: body.hourlyLimitUsd != null ? String(body.hourlyLimitUsd) : null,
      dailyLimitUsd: body.dailyLimitUsd != null ? String(body.dailyLimitUsd) : null,
      monthlyLimitUsd: body.monthlyLimitUsd != null ? String(body.monthlyLimitUsd) : null,
      alertThresholdPct: String(body.alertThresholdPct),
      hardCapEnabled: body.hardCapEnabled,
      alertCooldownMinutes: body.alertCooldownMinutes,
      notes: body.notes,
      updatedAt: now,
    };

    let budget;
    if (existing) {
      [budget] = await db
        .update(aiTenantBudgetsTable)
        .set(values)
        .where(eq(aiTenantBudgetsTable.orgId, orgId))
        .returning();
    } else {
      [budget] = await db
        .insert(aiTenantBudgetsTable)
        .values({ ...values, createdAt: now })
        .returning();
    }

    logger.info({ orgId, budget }, '[ai-usage] Budget upserted');
    sendSuccess(res, { budget });
  } catch (err) {
    handleRouteError(res, err, 'PUT /ai/usage/budgets/:orgId');
  }
});

router.delete('/ai/usage/budgets/:orgId', async (req, res) => {
  try {
    await ensureSchema();
    const { orgId } = req.params;
    await db.delete(aiTenantBudgetsTable).where(eq(aiTenantBudgetsTable.orgId, orgId));
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'DELETE /ai/usage/budgets/:orgId');
  }
});

router.get('/ai/usage/model-prices', async (_req, res) => {
  try {
    await ensureSchema();
    const prices = await db
      .select()
      .from(aiModelPricesTable)
      .orderBy(aiModelPricesTable.provider, aiModelPricesTable.model);
    sendSuccess(res, { prices });
  } catch (err) {
    handleRouteError(res, err, 'GET /ai/usage/model-prices');
  }
});

const modelPriceBodySchema = z.object({
  provider: z.string().min(1).max(100),
  model: z.string().min(1).max(200),
  inputCostPer1kTokens: z.number().min(0),
  outputCostPer1kTokens: z.number().min(0),
  isActive: z.boolean().default(true),
});

router.put('/ai/usage/model-prices', validateBody(modelPriceBodySchema), async (req, res) => {
  try {
    await ensureSchema();
    const body = req.body as z.infer<typeof modelPriceBodySchema>;

    await pool.query(
      `INSERT INTO ai_model_prices (provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (provider, model) DO UPDATE
         SET input_cost_per_1k_tokens = $3,
             output_cost_per_1k_tokens = $4,
             is_active = $5,
             updated_at = NOW()`,
      [body.provider, body.model, body.inputCostPer1kTokens, body.outputCostPer1kTokens, body.isActive],
    );

    sendSuccess(res, { updated: true });
  } catch (err) {
    handleRouteError(res, err, 'PUT /ai/usage/model-prices');
  }
});

export default router;

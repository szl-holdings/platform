/**
 * callModel — single wrapper for every AI provider call.
 *
 * Records: provider, model, prompt tokens, completion tokens, latency,
 * request id, user/org id, and product surface on every call.
 *
 * Enforces per-tenant budget caps:
 *   - Soft cap (alert_threshold_pct, default 80%) → inserts a platform_alert_event
 *   - Hard cap → projected spend (used + estimated) >= limit → rejects the call
 *     with a BudgetExceededError and inserts a critical alert audit entry
 */

import { db, pool } from '@szl-holdings/db';
import {
  aiModelPricesTable,
  aiTenantBudgetsTable,
  aiUsageRecordsTable,
} from '@szl-holdings/db/schema';
import { and, eq, gte, sum } from 'drizzle-orm';
import { logger } from '../../lib/logger';

// ── Schema bootstrap ─────────────────────────────────────────────────────────
// Guarantees the three AI usage tables exist before the first DB operation.
// This runs once regardless of which route initialised first.

let _schemaBootstrapped = false;
let _schemaBootstrapPromise: Promise<void> | null = null;

async function _runSchemaBootstrap(): Promise<void> {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS ai_usage_records (
      id SERIAL PRIMARY KEY,
      request_id VARCHAR(128) NOT NULL,
      org_id VARCHAR(128),
      user_id INTEGER,
      provider VARCHAR(100) NOT NULL,
      model VARCHAR(200) NOT NULL,
      surface VARCHAR(100) NOT NULL DEFAULT 'unknown',
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      cost_usd NUMERIC(14,8) NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'success',
      error_message TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS ai_usage_org_id_idx ON ai_usage_records (org_id)`,
    `CREATE INDEX IF NOT EXISTS ai_usage_org_created_idx ON ai_usage_records (org_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON ai_usage_records (created_at)`,
    `CREATE TABLE IF NOT EXISTS ai_model_prices (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(100) NOT NULL,
      model VARCHAR(200) NOT NULL,
      input_cost_per_1k_tokens NUMERIC(14,8) NOT NULL DEFAULT 0,
      output_cost_per_1k_tokens NUMERIC(14,8) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, model)
    )`,
    `CREATE TABLE IF NOT EXISTS ai_tenant_budgets (
      id SERIAL PRIMARY KEY,
      org_id VARCHAR(128) NOT NULL UNIQUE,
      hourly_limit_usd NUMERIC(14,4),
      daily_limit_usd NUMERIC(14,4),
      monthly_limit_usd NUMERIC(14,4),
      alert_threshold_pct NUMERIC(6,2) NOT NULL DEFAULT 80,
      hard_cap_enabled BOOLEAN NOT NULL DEFAULT true,
      last_alert_fired_at TIMESTAMPTZ,
      alert_cooldown_minutes INTEGER NOT NULL DEFAULT 60,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS ai_tenant_budgets_org_id_idx ON ai_tenant_budgets (org_id)`,
  ];

  const defaults = [
    ['openai', 'gpt-4o', '0.005', '0.015'],
    ['openai', 'gpt-4o-mini', '0.00015', '0.0006'],
    ['openai', 'gpt-4-turbo', '0.01', '0.03'],
    ['openai', 'gpt-3.5-turbo', '0.0005', '0.0015'],
    ['openai', 'gpt-5.2', '0.01', '0.03'],
    ['anthropic', 'claude-3-5-sonnet-20241022', '0.003', '0.015'],
    ['anthropic', 'claude-sonnet-4-20250514', '0.003', '0.015'],
    ['anthropic', 'claude-3-haiku-20240307', '0.00025', '0.00125'],
    ['anthropic', 'claude-3-opus-20240229', '0.015', '0.075'],
    ['replit-proxy', 'gpt-4o', '0.005', '0.015'],
    ['replit-proxy', 'gpt-4o-mini', '0.00015', '0.0006'],
    ['replit-proxy', 'gpt-5.2', '0.01', '0.03'],
    ['gemini', 'gemini-2.0-flash', '0.00035', '0.00105'],
    ['gemini', 'gemini-1.5-pro', '0.00125', '0.005'],
    ['huggingface', 'mistralai/Mixtral-8x7B-Instruct-v0.1', '0.0002', '0.0002'],
  ];

  for (const stmt of stmts) {
    await pool
      .query(stmt)
      .catch((err) =>
        logger.warn({ err: err.message, stmt: stmt.slice(0, 60) }, '[callModel] schema migration warning'),
      );
  }

  for (const [provider, model, input, output] of defaults) {
    await pool
      .query(
        `INSERT INTO ai_model_prices (provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, model) DO NOTHING`,
        [provider, model, input, output],
      )
      .catch(() => {});
  }
}

export async function ensureCallModelSchema(): Promise<void> {
  if (_schemaBootstrapped) return;
  if (!_schemaBootstrapPromise) {
    _schemaBootstrapPromise = _runSchemaBootstrap().then(() => {
      _schemaBootstrapped = true;
    });
  }
  return _schemaBootstrapPromise;
}

// ── Public types ──────────────────────────────────────────────────────────────

export class BudgetExceededError extends Error {
  constructor(
    public readonly orgId: string,
    public readonly period: string,
    public readonly limitUsd: number,
    public readonly projectedUsd: number,
  ) {
    super(
      `AI budget hard cap would be exceeded for org ${orgId}: ${period} limit $${limitUsd}, projected $${projectedUsd.toFixed(4)}`,
    );
    this.name = 'BudgetExceededError';
  }
}

export interface CallModelParams {
  provider: string;
  model: string;
  surface: string;
  orgId?: string;
  userId?: number;
  /** Best-effort estimate of prompt tokens for pre-call budget projection. */
  estimatedInputTokens?: number;
  fn: () => Promise<CallModelResult>;
}

export interface CallModelResult {
  promptTokens: number;
  completionTokens: number;
  content: string;
  rawResponse?: unknown;
}

export interface CallModelOutput extends CallModelResult {
  requestId: string;
  latencyMs: number;
  costUsd: number;
}

// ── Price lookup ──────────────────────────────────────────────────────────────

const MODEL_PRICE_DEFAULTS: Record<string, { inputPer1k: number; outputPer1k: number }> = {
  'gpt-4o': { inputPer1k: 0.005, outputPer1k: 0.015 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'gpt-3.5-turbo': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  'gpt-5.2': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'claude-3-5-sonnet-20241022': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-sonnet-4-20250514': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-3-haiku-20240307': { inputPer1k: 0.00025, outputPer1k: 0.00125 },
  'claude-3-opus-20240229': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'gemini-2.0-flash': { inputPer1k: 0.00035, outputPer1k: 0.00105 },
  'gemini-1.5-pro': { inputPer1k: 0.00125, outputPer1k: 0.005 },
};

function getPriceForModel(
  provider: string,
  model: string,
  dbPrice?: { inputCostPer1kTokens: string; outputCostPer1kTokens: string } | null,
): { inputPer1k: number; outputPer1k: number } {
  if (dbPrice) {
    return {
      inputPer1k: parseFloat(dbPrice.inputCostPer1kTokens),
      outputPer1k: parseFloat(dbPrice.outputCostPer1kTokens),
    };
  }
  const key = Object.keys(MODEL_PRICE_DEFAULTS).find((k) =>
    model.toLowerCase().includes(k.toLowerCase()),
  );
  if (key) return MODEL_PRICE_DEFAULTS[key];
  const providerDefaults: Record<string, { inputPer1k: number; outputPer1k: number }> = {
    openai: { inputPer1k: 0.005, outputPer1k: 0.015 },
    anthropic: { inputPer1k: 0.003, outputPer1k: 0.015 },
    gemini: { inputPer1k: 0.001, outputPer1k: 0.003 },
    'replit-proxy': { inputPer1k: 0.005, outputPer1k: 0.015 },
    huggingface: { inputPer1k: 0.0002, outputPer1k: 0.0002 },
  };
  return providerDefaults[provider.toLowerCase()] ?? { inputPer1k: 0.001, outputPer1k: 0.002 };
}

// ── Period helpers ────────────────────────────────────────────────────────────

function makePeriodStart(period: 'hourly' | 'daily' | 'monthly'): Date {
  const now = new Date();
  switch (period) {
    case 'hourly': {
      const s = new Date(now);
      s.setMinutes(0, 0, 0);
      return s;
    }
    case 'daily': {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      return s;
    }
    case 'monthly': {
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getSpentUsd(orgId: string, since: Date): Promise<number> {
  try {
    const rows = await db
      .select({ total: sum(aiUsageRecordsTable.costUsd) })
      .from(aiUsageRecordsTable)
      .where(and(eq(aiUsageRecordsTable.orgId, orgId), gte(aiUsageRecordsTable.createdAt, since)));
    return parseFloat(String(rows[0]?.total ?? '0')) || 0;
  } catch {
    return 0;
  }
}

async function getBudget(orgId: string) {
  try {
    const [budget] = await db
      .select()
      .from(aiTenantBudgetsTable)
      .where(eq(aiTenantBudgetsTable.orgId, orgId))
      .limit(1);
    return budget ?? null;
  } catch {
    return null;
  }
}

async function getModelPrice(provider: string, model: string) {
  try {
    const [price] = await db
      .select()
      .from(aiModelPricesTable)
      .where(and(eq(aiModelPricesTable.provider, provider), eq(aiModelPricesTable.model, model)))
      .limit(1);
    return price ?? null;
  } catch {
    return null;
  }
}

// ── Alert helpers ─────────────────────────────────────────────────────────────

async function insertAlertEvent(
  name: string,
  severity: 'warning' | 'critical',
  metricName: string,
  metricValue: number,
  threshold: number,
  message: string,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO platform_alert_events
         (rule_id, rule_name, severity, metric_name, metric_value, threshold, condition, message, status, created_at)
       VALUES (0, $1, $2, $3, $4, $5, 'gt', $6, 'firing', NOW())`,
      [name, severity, metricName, metricValue, threshold, message],
    );
  } catch (err: any) {
    logger.error({ err: err.message }, '[callModel] Failed to insert alert event');
  }
}

// ── Budget enforcement ────────────────────────────────────────────────────────

/**
 * Checks all configured caps for the given org.
 * Throws BudgetExceededError (hard cap) when projected spend would exceed a limit.
 * Fires a warning alert_event when current spend crosses alert_threshold_pct.
 *
 * @param estimatedCostUsd Cost of the *pending* call, used for projection.
 *                         Pass 0 when called post-call for soft-alert only.
 */
async function checkAndEnforceBudget(
  orgId: string,
  budget: NonNullable<Awaited<ReturnType<typeof getBudget>>>,
  estimatedCostUsd: number,
): Promise<void> {
  const now = new Date();

  const checks: Array<{ period: 'hourly' | 'daily' | 'monthly'; limitUsd: number }> = [];
  if (budget.hourlyLimitUsd != null)
    checks.push({ period: 'hourly', limitUsd: parseFloat(String(budget.hourlyLimitUsd)) });
  if (budget.dailyLimitUsd != null)
    checks.push({ period: 'daily', limitUsd: parseFloat(String(budget.dailyLimitUsd)) });
  if (budget.monthlyLimitUsd != null)
    checks.push({ period: 'monthly', limitUsd: parseFloat(String(budget.monthlyLimitUsd)) });

  for (const { period, limitUsd } of checks) {
    if (limitUsd <= 0) continue;

    const since = makePeriodStart(period);
    const usedUsd = await getSpentUsd(orgId, since);
    const projectedUsd = usedUsd + estimatedCostUsd;
    const alertThresholdPct = parseFloat(String(budget.alertThresholdPct ?? '80'));

    // Hard cap: reject the call if projected spend would reach or exceed the limit.
    if (budget.hardCapEnabled && projectedUsd >= limitUsd) {
      await insertAlertEvent(
        `AI Hard Cap — ${orgId}`,
        'critical',
        `ai.budget.${period}_hard_cap`,
        projectedUsd,
        limitUsd,
        `BLOCKED: Org ${orgId} ${period} AI hard cap of $${limitUsd} would be exceeded ` +
          `(current $${usedUsd.toFixed(4)} + estimated $${estimatedCostUsd.toFixed(6)} = $${projectedUsd.toFixed(4)}).`,
      );
      throw new BudgetExceededError(orgId, period, limitUsd, projectedUsd);
    }

    // Soft alert: fire when current spend (not projected) crosses the threshold.
    const pctUsed = (usedUsd / limitUsd) * 100;
    if (pctUsed >= alertThresholdPct) {
      const cooldownMs = (budget.alertCooldownMinutes ?? 60) * 60 * 1000;
      const lastFired = budget.lastAlertFiredAt
        ? new Date(String(budget.lastAlertFiredAt)).getTime()
        : 0;
      if (now.getTime() - lastFired >= cooldownMs) {
        await insertAlertEvent(
          `AI Budget — ${orgId}`,
          'warning',
          `ai.budget.${period}_pct`,
          Math.round(pctUsed * 100) / 100,
          alertThresholdPct,
          `Org ${orgId} has used ${pctUsed.toFixed(1)}% of its ${period} AI budget ` +
            `($${usedUsd.toFixed(4)} of $${limitUsd}).`,
        );
        logger.warn({ orgId, period, pctUsed, usedUsd, limitUsd }, '[callModel] AI budget threshold alert fired');
        await db
          .update(aiTenantBudgetsTable)
          .set({ lastAlertFiredAt: now, updatedAt: now })
          .where(eq(aiTenantBudgetsTable.orgId, orgId));
      }
    }
  }
}

// ── Usage persistence ─────────────────────────────────────────────────────────

async function persistUsageRecord(params: {
  requestId: string;
  orgId?: string;
  userId?: number;
  provider: string;
  model: string;
  surface: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costUsd: number;
  status: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    await db.insert(aiUsageRecordsTable).values({
      requestId: params.requestId,
      orgId: params.orgId,
      userId: params.userId,
      provider: params.provider,
      model: params.model,
      surface: params.surface,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.promptTokens + params.completionTokens,
      latencyMs: params.latencyMs,
      costUsd: params.costUsd.toFixed(8),
      status: params.status,
      errorMessage: params.errorMessage,
    });
  } catch (err: any) {
    logger.error(
      { err: err.message, requestId: params.requestId },
      '[callModel] Failed to persist usage record',
    );
  }
}

// ── Public helpers for streaming call sites ───────────────────────────────────

/**
 * Pre-call budget enforcement for streaming call sites that cannot use callModel.
 * Call this BEFORE starting the stream; it throws BudgetExceededError on hard cap.
 */
export async function enforceBudgetForOrg(
  orgId: string | undefined,
  provider: string,
  model: string,
  estimatedInputTokens = 500,
): Promise<void> {
  await ensureCallModelSchema();
  if (!orgId) return;
  const budget = await getBudget(orgId);
  if (!budget) return;
  const prices = getPriceForModel(provider, model, null);
  const estimatedCostUsd = (estimatedInputTokens / 1000) * prices.inputPer1k;
  await checkAndEnforceBudget(orgId, budget, estimatedCostUsd);
}

/**
 * Records AI usage telemetry for streaming call sites.
 * Call this AFTER the stream completes with the actual token counts from the stream.
 */
export async function recordModelUsage(params: {
  requestId?: string;
  orgId?: string;
  userId?: number;
  provider: string;
  model: string;
  surface: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status?: string;
  errorMessage?: string;
}): Promise<void> {
  await ensureCallModelSchema();
  const dbPrice = await getModelPrice(params.provider, params.model);
  const prices = getPriceForModel(params.provider, params.model, dbPrice);
  const costUsd =
    (params.promptTokens / 1000) * prices.inputPer1k +
    (params.completionTokens / 1000) * prices.outputPer1k;

  await persistUsageRecord({
    requestId: params.requestId ?? `rm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orgId: params.orgId,
    userId: params.userId,
    provider: params.provider,
    model: params.model,
    surface: params.surface,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    latencyMs: params.latencyMs,
    costUsd,
    status: params.status ?? 'success',
    errorMessage: params.errorMessage,
  });

  // Fire soft alert based on actual spend.
  if (params.orgId && params.status !== 'error') {
    const budget = await getBudget(params.orgId);
    if (budget) {
      await checkAndEnforceBudget(params.orgId, budget, 0).catch(() => {});
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function callModel(params: CallModelParams): Promise<CallModelOutput> {
  // Ensure tables exist before any DB interaction.
  await ensureCallModelSchema();

  const { provider, model, surface, orgId, userId, fn } = params;
  const requestId = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();

  // Compute estimated cost for pre-call budget projection.
  const prices = getPriceForModel(provider, model, null);
  const estimatedCostUsd =
    ((params.estimatedInputTokens ?? 500) / 1000) * prices.inputPer1k;

  // Pre-call budget enforcement (hard cap on projected spend).
  if (orgId) {
    const budget = await getBudget(orgId);
    if (budget) {
      await checkAndEnforceBudget(orgId, budget, estimatedCostUsd);
    }
  }

  // Execute the AI call.
  let result: CallModelResult;
  let status: 'success' | 'error' = 'success';
  let errorMessage: string | undefined;

  try {
    result = await fn();
  } catch (err: any) {
    status = 'error';
    errorMessage = err?.message ?? 'Unknown error';
    result = { promptTokens: 0, completionTokens: 0, content: '' };

    await persistUsageRecord({
      requestId,
      orgId,
      userId,
      provider,
      model,
      surface,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - start,
      costUsd: 0,
      status: 'error',
      errorMessage,
    });

    throw err;
  }

  // Compute actual cost from DB price table (falls back to defaults).
  const latencyMs = Date.now() - start;
  const dbPrice = await getModelPrice(provider, model);
  const actualPrices = getPriceForModel(provider, model, dbPrice);
  const costUsd =
    (result.promptTokens / 1000) * actualPrices.inputPer1k +
    (result.completionTokens / 1000) * actualPrices.outputPer1k;

  await persistUsageRecord({
    requestId,
    orgId,
    userId,
    provider,
    model,
    surface,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs,
    costUsd,
    status,
    errorMessage,
  });

  return { ...result, requestId, latencyMs, costUsd };
}

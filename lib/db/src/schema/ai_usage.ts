import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const aiUsageRecordsTable = pgTable(
  'ai_usage_records',
  {
    id: serial('id').primaryKey(),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    orgId: varchar('org_id', { length: 128 }),
    userId: integer('user_id'),
    provider: varchar('provider', { length: 100 }).notNull(),
    model: varchar('model', { length: 200 }).notNull(),
    surface: varchar('surface', { length: 100 }).notNull().default('unknown'),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 14, scale: 8 }).notNull().default('0'),
    status: varchar('status', { length: 30 }).notNull().default('success'),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    idxOrgId: index('ai_usage_org_id_idx').on(t.orgId),
    idxOrgCreated: index('ai_usage_org_created_idx').on(t.orgId, t.createdAt),
    idxProvider: index('ai_usage_provider_idx').on(t.provider),
    idxModel: index('ai_usage_model_idx').on(t.model),
    idxSurface: index('ai_usage_surface_idx').on(t.surface),
    idxCreatedAt: index('ai_usage_created_at_idx').on(t.createdAt),
    idxRequestId: index('ai_usage_request_id_idx').on(t.requestId),
  }),
);

export const aiModelPricesTable = pgTable(
  'ai_model_prices',
  {
    id: serial('id').primaryKey(),
    provider: varchar('provider', { length: 100 }).notNull(),
    model: varchar('model', { length: 200 }).notNull(),
    inputCostPer1kTokens: numeric('input_cost_per_1k_tokens', { precision: 14, scale: 8 })
      .notNull()
      .default('0'),
    outputCostPer1kTokens: numeric('output_cost_per_1k_tokens', { precision: 14, scale: 8 })
      .notNull()
      .default('0'),
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    idxProviderModel: index('ai_model_prices_provider_model_idx').on(t.provider, t.model),
  }),
);

export const aiTenantBudgetsTable = pgTable(
  'ai_tenant_budgets',
  {
    id: serial('id').primaryKey(),
    orgId: varchar('org_id', { length: 128 }).notNull().unique(),
    hourlyLimitUsd: numeric('hourly_limit_usd', { precision: 14, scale: 4 }),
    dailyLimitUsd: numeric('daily_limit_usd', { precision: 14, scale: 4 }),
    monthlyLimitUsd: numeric('monthly_limit_usd', { precision: 14, scale: 4 }),
    alertThresholdPct: numeric('alert_threshold_pct', { precision: 6, scale: 2 })
      .notNull()
      .default('80'),
    hardCapEnabled: boolean('hard_cap_enabled').notNull().default(true),
    lastAlertFiredAt: timestamp('last_alert_fired_at'),
    alertCooldownMinutes: integer('alert_cooldown_minutes').notNull().default(60),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    idxOrgId: index('ai_tenant_budgets_org_id_idx').on(t.orgId),
  }),
);

export type AiUsageRecord = typeof aiUsageRecordsTable.$inferSelect;
export type NewAiUsageRecord = typeof aiUsageRecordsTable.$inferInsert;
export type AiModelPrice = typeof aiModelPricesTable.$inferSelect;
export type AiTenantBudget = typeof aiTenantBudgetsTable.$inferSelect;

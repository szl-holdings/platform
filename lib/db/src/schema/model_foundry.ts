import {
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const modelFoundryRuns = pgTable('model_foundry_runs', {
  id: serial('id').primaryKey(),
  runId: text('run_id').notNull().unique(),
  tenantId: text('tenant_id').notNull(),
  agentId: text('agent_id').notNull(),
  familyId: text('family_id').notNull(),
  datasetId: text('dataset_id').notNull(),
  stage: text('stage').notNull(),
  riskTier: text('risk_tier').notNull().default('standard'),
  hfJobId: text('hf_job_id'),
  hfMode: text('hf_mode').notNull().default('simulated'),
  publishedModelId: text('published_model_id'),
  modelCardSha: text('model_card_sha'),
  estCostUsd: real('est_cost_usd').notNull().default(0),
  budgetCapUsd: real('budget_cap_usd'),
  datasetHash: text('dataset_hash'),
  datasetBytes: integer('dataset_bytes'),
  provenanceProofId: integer('provenance_proof_id'),
  modelCardProofId: integer('model_card_proof_id'),
  createdBy: text('created_by'),
  approvedBy: text('approved_by'),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const modelFoundryTenantBudgets = pgTable('model_foundry_tenant_budgets', {
  tenantId: text('tenant_id').primaryKey(),
  monthlyCapUsd: real('monthly_cap_usd').notNull().default(50),
  perRunCapUsd: real('per_run_cap_usd').notNull().default(5),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ModelFoundryRun = typeof modelFoundryRuns.$inferSelect;
export type ModelFoundryTenantBudget = typeof modelFoundryTenantBudgets.$inferSelect;

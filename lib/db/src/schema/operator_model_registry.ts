import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const operatorModelRegistryTable = pgTable(
  'operator_model_registry',
  {
    id: text('id').primaryKey(),
    hfModelId: text('hf_model_id').notNull(),
    displayName: text('display_name').notNull(),
    provider: text('provider').notNull().default('huggingface'),
    capabilities: jsonb('capabilities').notNull().default([]),
    tier: text('tier', { enum: ['frontier', 'standard', 'fast', 'local'] })
      .notNull()
      .default('local'),
    contextWindow: integer('context_window').notNull().default(4096),
    maxOutputTokens: integer('max_output_tokens').notNull().default(1024),
    inputCostPer1kTokens: real('input_cost_per_1k_tokens').notNull().default(0),
    outputCostPer1kTokens: real('output_cost_per_1k_tokens').notNull().default(0),
    license: text('license').notNull().default('unknown'),
    description: text('description').notNull().default(''),
    isActive: boolean('is_active').notNull().default(true),
    seeded: boolean('seeded').notNull().default(false),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('omr_hf_model_id_idx').on(table.hfModelId),
    index('omr_provider_idx').on(table.provider),
    index('omr_active_idx').on(table.isActive),
  ],
);

export const governanceGateConfigTable = pgTable(
  'governance_gate_config',
  {
    id: serial('id').primaryKey(),
    modelRegistryId: text('model_registry_id')
      .notNull()
      .references(() => operatorModelRegistryTable.id, { onDelete: 'cascade' }),
    licenseApproved: boolean('license_approved').notNull().default(false),
    sensitivityAllowance: text('sensitivity_allowance', {
      enum: ['public', 'internal', 'confidential', 'restricted'],
    })
      .notNull()
      .default('internal'),
    liveInferenceEnabled: boolean('live_inference_enabled'),
    productionApproved: boolean('production_approved'),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('ggc_model_registry_idx').on(table.modelRegistryId),
  ],
);

export const governanceGateBypassesTable = pgTable(
  'governance_gate_bypasses',
  {
    id: text('id').primaryKey(),
    modelRegistryId: text('model_registry_id')
      .notNull()
      .references(() => operatorModelRegistryTable.id, { onDelete: 'cascade' }),
    gateName: text('gate_name').notNull(),
    grantedByUserId: integer('granted_by_user_id'),
    grantedByName: text('granted_by_name').notNull(),
    reason: text('reason').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    revokedBy: text('revoked_by'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('ggb_model_registry_idx').on(table.modelRegistryId),
    index('ggb_gate_name_idx').on(table.gateName),
    index('ggb_expires_idx').on(table.expiresAt),
    index('ggb_active_idx').on(table.isActive),
  ],
);

export type OperatorModelRegistry = typeof operatorModelRegistryTable.$inferSelect;
export type InsertOperatorModelRegistry = typeof operatorModelRegistryTable.$inferInsert;
export type GovernanceGateConfig = typeof governanceGateConfigTable.$inferSelect;
export type InsertGovernanceGateConfig = typeof governanceGateConfigTable.$inferInsert;
export type GovernanceGateBypass = typeof governanceGateBypassesTable.$inferSelect;
export type InsertGovernanceGateBypass = typeof governanceGateBypassesTable.$inferInsert;

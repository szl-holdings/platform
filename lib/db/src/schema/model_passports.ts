import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const modelPassportsTable = pgTable(
  'model_passports',
  {
    id: text('id').primaryKey(),
    tenantId: integer('tenant_id'),
    displayName: text('display_name').notNull(),
    version: text('version').notNull(),
    provider: text('provider').notNull(),
    providerModelId: text('provider_model_id').notNull(),
    quantTier: text('quant_tier').notNull(),
    lanes: jsonb('lanes').notNull().default([]),
    state: text('state', {
      enum: ['draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked'],
    })
      .notNull()
      .default('draft'),
    signedJson: jsonb('signed_json').notNull(),
    signature: text('signature').notNull(),
    signerPublicKey: text('signer_public_key').notNull(),
    provenanceHash: text('provenance_hash').notNull(),
    downgradeTo: jsonb('downgrade_to').notNull().default([]),
    costPer1kTokensUsd: text('cost_per_1k_tokens_usd').notNull().default('0'),
    p50LatencyMs: integer('p50_latency_ms'),
    p95LatencyMs: integer('p95_latency_ms'),
    evalPassRate: text('eval_pass_rate'),
    autonomyTier: text('autonomy_tier').notNull().default('advisory'),
    approvals: jsonb('approvals').notNull().default([]),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: text('revoked_by'),
    revocationReason: text('revocation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('model_passports_state_idx').on(t.state),
    index('model_passports_tenant_idx').on(t.tenantId),
    index('model_passports_provider_idx').on(t.provider),
    index('model_passports_quant_tier_idx').on(t.quantTier),
  ],
);

export type ModelPassportRow = typeof modelPassportsTable.$inferSelect;
export type InsertModelPassport = typeof modelPassportsTable.$inferInsert;

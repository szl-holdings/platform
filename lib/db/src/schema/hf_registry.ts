import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const HF_LIFECYCLE_STATES = [
  'proposed',
  'under_review',
  'approved',
  'active',
  'retired',
] as const;
export type HfLifecycleState = (typeof HF_LIFECYCLE_STATES)[number];

export const HF_SENSITIVITY_LEVELS = [
  'public',
  'internal',
  'confidential',
  'restricted',
] as const;
export type HfSensitivityLevel = (typeof HF_SENSITIVITY_LEVELS)[number];

export const VALID_HF_TRANSITIONS: Record<HfLifecycleState, HfLifecycleState[]> = {
  proposed: ['under_review', 'retired'],
  under_review: ['approved', 'proposed'],
  approved: ['active', 'proposed', 'retired'],
  active: ['retired'],
  retired: [],
};

export const hfFailoverChainsTable = pgTable(
  'hf_failover_chains',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    lane: text('lane').notNull(),
    primaryModelId: text('primary_model_id').notNull(),
    fallbackModelIds: jsonb('fallback_model_ids').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    isSeeded: boolean('is_seeded').notNull().default(false),
    createdById: integer('created_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('hf_failover_chains_lane_idx').on(t.lane),
    index('hf_failover_chains_active_idx').on(t.isActive),
  ],
);

export const hfModelRegistryTable = pgTable(
  'hf_model_registry',
  {
    id: serial('id').primaryKey(),
    modelId: text('model_id').notNull().unique(),
    displayName: text('display_name').notNull(),
    provider: text('provider').notNull().default('huggingface'),

    lifecycleState: text('lifecycle_state', {
      enum: HF_LIFECYCLE_STATES,
    })
      .notNull()
      .default('proposed'),

    licenseId: text('license_id'),
    licenseSourceUrl: text('license_source_url'),
    licenseApproverId: integer('license_approver_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    licenseApprovalId: integer('license_approval_id'),
    licenseExpiresAt: timestamp('license_expires_at', { withTimezone: true }),
    licenseApprovedAt: timestamp('license_approved_at', { withTimezone: true }),

    sensitivityAllowance: text('sensitivity_allowance', {
      enum: HF_SENSITIVITY_LEVELS,
    })
      .notNull()
      .default('internal'),

    gateLicenseApproved: boolean('gate_license_approved').notNull().default(false),
    gateSensitivityMatch: boolean('gate_sensitivity_match').notNull().default(false),
    gateLiveInferenceAllowed: boolean('gate_live_inference_allowed').notNull().default(false),
    gateProductionApproved: boolean('gate_production_approved').notNull().default(false),

    failoverChainId: integer('failover_chain_id').references(() => hfFailoverChainsTable.id, {
      onDelete: 'set null',
    }),

    contextWindow: integer('context_window'),
    maxOutputTokens: integer('max_output_tokens'),
    capabilities: jsonb('capabilities').default([]),
    tier: text('tier'),

    lastInferenceAt: timestamp('last_inference_at', { withTimezone: true }),
    recentFailureCount: integer('recent_failure_count').notNull().default(0),

    proposedById: integer('proposed_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    proposedAt: timestamp('proposed_at', { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    retiredAt: timestamp('retired_at', { withTimezone: true }),

    notes: text('notes'),
    // Sovereign Substrate storage columns: when a registered model has been
    // published as a Proof Packet, these point at the HF bucket location and
    // the most recent verification state so the registry UI can render a
    // "Storage" column with the bucket URI + packet hash + verified badge.
    sovereignArtifactId: varchar('sovereign_artifact_id', { length: 64 }),
    sovereignBucketUri: text('sovereign_bucket_uri'),
    sovereignPacketHash: text('sovereign_packet_hash'),
    sovereignVerificationState: varchar('sovereign_verification_state', { length: 20 }),
    sovereignLastVerifiedAt: timestamp('sovereign_last_verified_at', { withTimezone: true }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('hf_model_registry_lifecycle_idx').on(t.lifecycleState),
    index('hf_model_registry_org_idx').on(t.orgId),
    index('hf_model_registry_proposed_by_idx').on(t.proposedById),
    index('hf_model_registry_failover_chain_idx').on(t.failoverChainId),
  ],
);

export type HfModelRegistry = typeof hfModelRegistryTable.$inferSelect;
export type InsertHfModelRegistry = typeof hfModelRegistryTable.$inferInsert;
export type HfFailoverChain = typeof hfFailoverChainsTable.$inferSelect;
export type InsertHfFailoverChain = typeof hfFailoverChainsTable.$inferInsert;

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

const _uuid = (name: string) => varchar(name).notNull().default(sql`gen_random_uuid()`);

// ─── Models ───────────────────────────────────────────────────────────────
export const forgeModelsTable = pgTable('forge_models', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: text('name').notNull(),
  provider: varchar('provider', { length: 80 }).notNull(),
  family: varchar('family', { length: 80 }),
  contextWindow: integer('context_window'),
  inputCostPer1k: numeric('input_cost_per_1k', { precision: 12, scale: 6 }),
  outputCostPer1k: numeric('output_cost_per_1k', { precision: 12, scale: 6 }),
  approved: boolean('approved').notNull().default(false),
  riskTier: varchar('risk_tier', { length: 40 }).notNull().default('standard'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forgeModelVersionsTable = pgTable(
  'forge_model_versions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    modelId: varchar('model_id')
      .notNull()
      .references(() => forgeModelsTable.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 80 }).notNull(),
    releasedAt: timestamp('released_at'),
    notes: text('notes'),
    approved: boolean('approved').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqVer: uniqueIndex('forge_model_versions_uniq').on(t.modelId, t.version),
  }),
);

// ─── Prompts ──────────────────────────────────────────────────────────────
export const forgePromptsTable = pgTable('forge_prompts', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: text('name').notNull(),
  purpose: text('purpose'),
  ownerUserId: integer('owner_user_id'),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forgePromptVersionsTable = pgTable(
  'forge_prompt_versions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    promptId: varchar('prompt_id')
      .notNull()
      .references(() => forgePromptsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    body: text('body').notNull(),
    evalsPassed: boolean('evals_passed').notNull().default(false),
    evalScore: numeric('eval_score', { precision: 5, scale: 2 }),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqVer: uniqueIndex('forge_prompt_versions_uniq').on(t.promptId, t.version),
  }),
);

// ─── Tools ────────────────────────────────────────────────────────────────
export const forgeToolsTable = pgTable('forge_tools', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: varchar('category', { length: 80 }),
  riskLevel: varchar('risk_level', { length: 40 }).notNull().default('low'),
  schema: jsonb('schema').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Deployment Targets ───────────────────────────────────────────────────
export const forgeDeploymentTargetsTable = pgTable('forge_deployment_targets', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: text('name').notNull(),
  kind: varchar('kind', { length: 60 }).notNull(), // local_dev | replit | cloud | client_managed | on_prem
  region: varchar('region', { length: 80 }),
  computeProfile: jsonb('compute_profile')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  packageLock: jsonb('package_lock')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  requiredSecrets: jsonb('required_secrets').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  storageDeps: jsonb('storage_deps').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  complianceNotes: text('compliance_notes'),
  allowedIntegrations: jsonb('allowed_integrations')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Environment Profiles & Snapshots ─────────────────────────────────────
export const forgeEnvironmentProfilesTable = pgTable('forge_environment_profiles', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  tier: varchar('tier', { length: 40 }).notNull(), // dev | sandbox | staging | production
  targetId: varchar('target_id').references(() => forgeDeploymentTargetsTable.id, {
    onDelete: 'set null',
  }),
  observabilityHook: varchar('observability_hook', { length: 200 }),
  requireApproval: boolean('require_approval').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const forgeEnvironmentSnapshotsTable = pgTable(
  'forge_environment_snapshots',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    envId: varchar('env_id')
      .notNull()
      .references(() => forgeEnvironmentProfilesTable.id, { onDelete: 'cascade' }),
    capturedAt: timestamp('captured_at').notNull().defaultNow(),
    agentInventory: jsonb('agent_inventory')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    modelInventory: jsonb('model_inventory')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    toolInventory: jsonb('tool_inventory')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    secretsFingerprint: text('secrets_fingerprint'),
    hash: text('hash').notNull(),
  },
  (t) => ({
    byEnv: index('forge_env_snap_env_idx').on(t.envId, t.capturedAt),
  }),
);

// ─── Agents ───────────────────────────────────────────────────────────────
export const forgeAgentsTable = pgTable(
  'forge_agents',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    domain: varchar('domain', { length: 80 }).notNull().default('general'),
    riskTier: varchar('risk_tier', { length: 40 }).notNull().default('standard'), // low | standard | regulated | executive
    ownerUserId: integer('owner_user_id'),
    orgId: integer('org_id'),
    status: varchar('status', { length: 40 }).notNull().default('draft'), // draft | active | archived
    currentEnv: varchar('current_env', { length: 40 }).notNull().default('dev'),
    activeVersionId: varchar('active_version_id'),
    policyPackId: varchar('policy_pack_id'),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    isSeed: boolean('is_seed').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    byOrg: index('forge_agents_org_idx').on(t.orgId),
    byEnv: index('forge_agents_env_idx').on(t.currentEnv),
  }),
);

export const forgeAgentVersionsTable = pgTable(
  'forge_agent_versions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id')
      .notNull()
      .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    modelId: varchar('model_id').references(() => forgeModelsTable.id),
    promptVersionId: varchar('prompt_version_id').references(() => forgePromptVersionsTable.id),
    toolIds: jsonb('tool_ids').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    systemConfig: jsonb('system_config')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    evalsPassed: boolean('evals_passed').notNull().default(false),
    observabilityHookConfigured: boolean('observability_hook_configured').notNull().default(false),
    provenanceComplete: boolean('provenance_complete').notNull().default(false),
    createdBy: integer('created_by'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqVer: uniqueIndex('forge_agent_versions_uniq').on(t.agentId, t.version),
  }),
);

export const forgeAgentToolPermissionsTable = pgTable('forge_agent_tool_permissions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar('agent_id')
    .notNull()
    .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
  toolId: varchar('tool_id')
    .notNull()
    .references(() => forgeToolsTable.id, { onDelete: 'cascade' }),
  envTier: varchar('env_tier', { length: 40 }).notNull(),
  allowed: boolean('allowed').notNull().default(true),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Policy Packs ─────────────────────────────────────────────────────────
export const forgePolicyPacksTable = pgTable('forge_policy_packs', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  riskTier: varchar('risk_tier', { length: 40 }).notNull(),
  rules: jsonb('rules').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forgePolicyAssignmentsTable = pgTable('forge_policy_assignments', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  policyPackId: varchar('policy_pack_id')
    .notNull()
    .references(() => forgePolicyPacksTable.id, { onDelete: 'cascade' }),
  agentId: varchar('agent_id')
    .notNull()
    .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
  envTier: varchar('env_tier', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Drift ────────────────────────────────────────────────────────────────
export const forgeDriftEventsTable = pgTable(
  'forge_drift_events',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id')
      .notNull()
      .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
    envId: varchar('env_id')
      .notNull()
      .references(() => forgeEnvironmentProfilesTable.id, { onDelete: 'cascade' }),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    driftScore: numeric('drift_score', { precision: 5, scale: 2 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(), // none | low | medium | high | critical
    dimension: varchar('dimension', { length: 40 }).notNull(), // model | prompt | tool | data | config | secret
    expectedFingerprint: text('expected_fingerprint'),
    observedFingerprint: text('observed_fingerprint'),
    findings: jsonb('findings')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    remediation: text('remediation'),
    resolvedAt: timestamp('resolved_at'),
  },
  (t) => ({
    byAgent: index('forge_drift_agent_idx').on(t.agentId, t.detectedAt),
    bySeverity: index('forge_drift_sev_idx').on(t.severity),
  }),
);

// ─── Promotions ───────────────────────────────────────────────────────────
export const forgePromotionsTable = pgTable(
  'forge_promotions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id')
      .notNull()
      .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
    fromVersionId: varchar('from_version_id').references(() => forgeAgentVersionsTable.id),
    toVersionId: varchar('to_version_id')
      .notNull()
      .references(() => forgeAgentVersionsTable.id),
    fromEnv: varchar('from_env', { length: 40 }).notNull(),
    toEnv: varchar('to_env', { length: 40 }).notNull(),
    status: varchar('status', { length: 40 }).notNull().default('requested'), // requested | validated | blocked | approved | promoted | rolled_back | failed
    requestedBy: integer('requested_by'),
    blockers: jsonb('blockers')
      .$type<Array<{ code: string; message: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    validationReport: jsonb('validation_report')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    promotedAt: timestamp('promoted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    byAgent: index('forge_promo_agent_idx').on(t.agentId, t.createdAt),
    byStatus: index('forge_promo_status_idx').on(t.status),
  }),
);

export const forgePromotionApprovalsTable = pgTable('forge_promotion_approvals', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  promotionId: varchar('promotion_id')
    .notNull()
    .references(() => forgePromotionsTable.id, { onDelete: 'cascade' }),
  approverUserId: integer('approver_user_id'),
  approverRole: varchar('approver_role', { length: 80 }),
  decision: varchar('decision', { length: 20 }).notNull(), // approved | rejected
  note: text('note'),
  decidedAt: timestamp('decided_at').notNull().defaultNow(),
});

// ─── Execution Runs ───────────────────────────────────────────────────────
export const forgeExecutionRunsTable = pgTable(
  'forge_execution_runs',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id')
      .notNull()
      .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
    versionId: varchar('version_id')
      .notNull()
      .references(() => forgeAgentVersionsTable.id),
    envTier: varchar('env_tier', { length: 40 }).notNull(),
    modelId: varchar('model_id').references(() => forgeModelsTable.id),
    promptVersionId: varchar('prompt_version_id').references(() => forgePromptVersionsTable.id),
    status: varchar('status', { length: 40 }).notNull(), // success | failure | escalated | overridden
    outcome: varchar('outcome', { length: 80 }),
    latencyMs: integer('latency_ms'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    toolCalls: integer('tool_calls').notNull().default(0),
    toolFailures: integer('tool_failures').notNull().default(0),
    policyOutcome: varchar('policy_outcome', { length: 40 }), // allow | deny | needs_approval
    humanOverride: boolean('human_override').notNull().default(false),
    valueAtRiskUsd: numeric('value_at_risk_usd', { precision: 14, scale: 2 }),
    provenance: jsonb('provenance')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    isSeed: boolean('is_seed').notNull().default(false),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => ({
    byAgent: index('forge_exec_agent_idx').on(t.agentId, t.startedAt),
    byEnv: index('forge_exec_env_idx').on(t.envTier),
  }),
);

export const forgeExecutionArtifactsTable = pgTable('forge_execution_artifacts', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar('execution_id')
    .notNull()
    .references(() => forgeExecutionRunsTable.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 40 }).notNull(), // input | output | trace | tool_call
  content: jsonb('content').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Rollback & Audit ─────────────────────────────────────────────────────
export const forgeRollbackEventsTable = pgTable(
  'forge_rollback_events',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id')
      .notNull()
      .references(() => forgeAgentsTable.id, { onDelete: 'cascade' }),
    fromVersionId: varchar('from_version_id').references(() => forgeAgentVersionsTable.id),
    toVersionId: varchar('to_version_id').references(() => forgeAgentVersionsTable.id),
    envTier: varchar('env_tier', { length: 40 }).notNull(),
    reason: text('reason'),
    triggeredBy: integer('triggered_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    byAgent: index('forge_rollback_agent_idx').on(t.agentId, t.createdAt),
  }),
);

export const forgeAuditEventsTable = pgTable(
  'forge_audit_events',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: varchar('agent_id'),
    actorUserId: integer('actor_user_id'),
    actorRole: varchar('actor_role', { length: 80 }),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 80 }).notNull(),
    resourceId: varchar('resource_id'),
    before: jsonb('before').$type<Record<string, unknown> | null>(),
    after: jsonb('after').$type<Record<string, unknown> | null>(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    byAgent: index('forge_audit_agent_idx').on(t.agentId, t.createdAt),
    byAction: index('forge_audit_action_idx').on(t.action),
  }),
);

// ─── Zod Schemas ──────────────────────────────────────────────────────────
export const insertForgeAgentSchema = createInsertSchema(forgeAgentsTable);
export const selectForgeAgentSchema = createSelectSchema(forgeAgentsTable);
export const insertForgeAgentVersionSchema = createInsertSchema(forgeAgentVersionsTable);
export const insertForgePromotionSchema = createInsertSchema(forgePromotionsTable);
export const insertForgeDriftEventSchema = createInsertSchema(forgeDriftEventsTable);
export const insertForgeExecutionRunSchema = createInsertSchema(forgeExecutionRunsTable);
export const insertForgePolicyPackSchema = createInsertSchema(forgePolicyPacksTable);

export type ForgeAgent = typeof forgeAgentsTable.$inferSelect;
export type ForgeAgentVersion = typeof forgeAgentVersionsTable.$inferSelect;
export type ForgePromotion = typeof forgePromotionsTable.$inferSelect;
export type ForgeDriftEvent = typeof forgeDriftEventsTable.$inferSelect;
export type ForgeExecutionRun = typeof forgeExecutionRunsTable.$inferSelect;
export type ForgePolicyPack = typeof forgePolicyPacksTable.$inferSelect;
export type ForgeDeploymentTarget = typeof forgeDeploymentTargetsTable.$inferSelect;
export type ForgeEnvironmentProfile = typeof forgeEnvironmentProfilesTable.$inferSelect;

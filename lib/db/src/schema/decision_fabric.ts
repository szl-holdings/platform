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
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

/**
 * Decision Fabric — Phase 1-2 schema
 *
 * The Decision Fabric is the unifying substrate that links primitive events
 * (Outcome Graph, Proof Chain, Covenant Policy, Prism Bus, Workflow Engine)
 * into a single, queryable decision lifecycle. Tables in this file store the
 * snapshots and cross-references that make end-to-end traceability possible.
 */

export const FABRIC_DOMAINS = [
  'maritime',
  'security',
  'real_estate',
  'aiops',
  'research',
  'creative',
  'analytics',
  'infrastructure',
  'readiness',
  'general',
  'global',
] as const;

export type FabricDomain = (typeof FABRIC_DOMAINS)[number];

/**
 * Immutable policy version snapshots. When a CovenantPolicy is evaluated for a
 * decision, its full text is frozen here so the decision record can reference
 * the exact version that ran, even if the policy is later edited.
 */
export const policyVersionsTable = pgTable(
  'decision_fabric_policy_versions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    policyId: text('policy_id').notNull(),
    version: text('version').notNull(),
    policyName: text('policy_name').notNull(),
    effect: text('effect', { enum: ['allow', 'deny'] }).notNull(),
    body: jsonb('body').notNull(),
    authoredByUserId: integer('authored_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    capturedAt: timestamp('captured_at').notNull().defaultNow(),
  },
  (table) => [
    index('df_policy_versions_org_idx').on(table.orgId),
    index('df_policy_versions_policy_idx').on(table.policyId, table.version),
  ],
);

/**
 * Frozen Monte Carlo (or other) simulation snapshots used as evidence for a
 * decision record. The snapshot includes the input scenario, parameters, and
 * resulting distributions so a decision can be replayed and audited.
 */
export const fabricSimulationSnapshotsTable = pgTable(
  'decision_fabric_simulation_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain', { enum: FABRIC_DOMAINS }).notNull().default('general'),
    scenarioId: text('scenario_id').notNull(),
    scenarioName: text('scenario_name').notNull(),
    inputs: jsonb('inputs').notNull().default({}),
    parameters: jsonb('parameters').notNull().default({}),
    results: jsonb('results').notNull().default({}),
    confidenceInterval: jsonb('confidence_interval').default({}),
    iterations: integer('iterations'),
    seed: text('seed'),
    capturedAt: timestamp('captured_at').notNull().defaultNow(),
  },
  (table) => [
    index('df_simulation_org_idx').on(table.orgId),
    index('df_simulation_scenario_idx').on(table.scenarioId),
    index('df_simulation_domain_idx').on(table.domain),
  ],
);

/**
 * Explicit decision records. One row per consequential decision with full
 * forward and backward links to outcome, proof, policy version, simulation,
 * approval, and workflow. This is the "who decided, why, what context"
 * artifact at the heart of the decision memory system.
 */
export const decisionRecordsTable = pgTable(
  'decision_fabric_records',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain', { enum: FABRIC_DOMAINS }).notNull().default('general'),

    // Subject of the decision
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    title: text('title').notNull(),
    rationale: text('rationale'),
    context: jsonb('context').default({}),

    // Ownership
    decidedByUserId: integer('decided_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    decidedByRole: text('decided_by_role'),
    ownerUserId: integer('owner_user_id').references(() => usersTable.id, { onDelete: 'set null' }),

    // Forward / backward links (nullable so partial graphs are valid)
    outcomeGraphId: integer('outcome_graph_id'),
    proofChainId: integer('proof_chain_id'),
    policyVersionId: integer('policy_version_id').references(() => policyVersionsTable.id, {
      onDelete: 'set null',
    }),
    simulationSnapshotId: integer('simulation_snapshot_id').references(
      () => fabricSimulationSnapshotsTable.id,
      { onDelete: 'set null' },
    ),
    approvalId: integer('approval_id'),
    workflowRunId: text('workflow_run_id'),
    recommendationId: text('recommendation_id'),

    // Predicted vs actual
    predictedOutcome: jsonb('predicted_outcome').default({}),
    actualOutcome: jsonb('actual_outcome').default({}),
    predictionError: real('prediction_error'),

    // Status
    status: text('status', {
      enum: ['draft', 'executed', 'rolled_back', 'superseded'],
    })
      .notNull()
      .default('executed'),

    correlationId: text('correlation_id'),
    metadata: jsonb('metadata').default({}),

    decidedAt: timestamp('decided_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('df_records_org_idx').on(table.orgId),
    index('df_records_domain_idx').on(table.domain),
    index('df_records_entity_idx').on(table.entityType, table.entityId),
    index('df_records_owner_idx').on(table.ownerUserId),
    index('df_records_workflow_idx').on(table.workflowRunId),
    index('df_records_recommendation_idx').on(table.recommendationId),
    index('df_records_correlation_idx').on(table.correlationId),
    index('df_records_decided_at_idx').on(table.decidedAt),
  ],
);

/**
 * Generated playbook suggestions. Produced by the pattern-retrieval engine
 * when historical decisions cluster around a recurring signal/action shape.
 */
export const playbookSuggestionsTable = pgTable(
  'decision_fabric_playbook_suggestions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain', { enum: FABRIC_DOMAINS }).notNull().default('general'),
    title: text('title').notNull(),
    description: text('description'),
    triggerSignature: jsonb('trigger_signature').notNull().default({}),
    recommendedActions: jsonb('recommended_actions').notNull().default([]),
    supportingDecisionIds: jsonb('supporting_decision_ids').notNull().default([]),
    sampleSize: integer('sample_size').notNull().default(0),
    successRate: real('success_rate'),
    confidence: real('confidence').notNull().default(0.5),
    status: text('status', {
      enum: ['proposed', 'accepted', 'rejected', 'promoted_to_workflow'],
    })
      .notNull()
      .default('proposed'),
    reviewedByUserId: integer('reviewed_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    promotedWorkflowId: text('promoted_workflow_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('df_playbook_org_idx').on(table.orgId),
    index('df_playbook_domain_idx').on(table.domain),
    index('df_playbook_status_idx').on(table.status),
  ],
);

/**
 * Cross-primitive correlation index. Lets us link a single correlationId or
 * entity reference to events captured in any primitive (prism-bus, proof-chain,
 * outcome-graph, covenant-policy, workflow-engine). Acts as the join surface
 * for Workflow 360 and Entity Investigation queries.
 */
export const correlationLinksTable = pgTable(
  'decision_fabric_correlation_links',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    correlationId: text('correlation_id').notNull(),
    primitive: text('primitive', {
      enum: [
        'prism_bus',
        'proof_chain',
        'outcome_graph',
        'covenant_policy',
        'workflow_engine',
        'monte_carlo',
        'approval',
        'decision_record',
      ],
    }).notNull(),
    primitiveId: text('primitive_id').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    workflowRunId: text('workflow_run_id'),
    domain: text('domain', { enum: FABRIC_DOMAINS }).notNull().default('general'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
  },
  (table) => [
    index('df_corr_correlation_idx').on(table.correlationId),
    index('df_corr_workflow_idx').on(table.workflowRunId),
    index('df_corr_entity_idx').on(table.entityType, table.entityId),
    index('df_corr_primitive_idx').on(table.primitive),
    index('df_corr_org_idx').on(table.orgId),
  ],
);

// Insert schemas + inferred types

export const insertPolicyVersionSchema = createInsertSchema(policyVersionsTable).omit({
  id: true,
  capturedAt: true,
});
export type InsertPolicyVersion = z.infer<typeof insertPolicyVersionSchema>;
export type PolicyVersion = typeof policyVersionsTable.$inferSelect;

export const insertFabricSimulationSnapshotSchema = createInsertSchema(
  fabricSimulationSnapshotsTable,
).omit({ id: true, capturedAt: true });
export type InsertFabricSimulationSnapshot = z.infer<typeof insertFabricSimulationSnapshotSchema>;
export type FabricSimulationSnapshot = typeof fabricSimulationSnapshotsTable.$inferSelect;

export const insertDecisionRecordSchema = createInsertSchema(decisionRecordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDecisionRecord = z.infer<typeof insertDecisionRecordSchema>;
export type DecisionRecord = typeof decisionRecordsTable.$inferSelect;

export const insertPlaybookSuggestionSchema = createInsertSchema(playbookSuggestionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPlaybookSuggestion = z.infer<typeof insertPlaybookSuggestionSchema>;
export type PlaybookSuggestion = typeof playbookSuggestionsTable.$inferSelect;

export const insertCorrelationLinkSchema = createInsertSchema(correlationLinksTable).omit({
  id: true,
  occurredAt: true,
});
export type InsertCorrelationLink = z.infer<typeof insertCorrelationLinkSchema>;
export type CorrelationLink = typeof correlationLinksTable.$inferSelect;

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

export type OutcomeDecisionStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'overridden'
  | 'deferred'
  | 'executed'
  | 'expired';

export type OutcomeResult = 'achieved' | 'partial' | 'not_achieved' | 'unknown' | 'too_early';

export const OUTCOME_DOMAINS = [
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
] as const;

export type OutcomeDomain = (typeof OUTCOME_DOMAINS)[number];

export const outcomeGraphTable = pgTable(
  'outcome_graph',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain', { enum: OUTCOME_DOMAINS }).notNull().default('general'),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    recommendationId: text('recommendation_id'),
    recommendationText: text('recommendation_text').notNull(),
    recommendationAction: text('recommendation_action'),
    agentId: text('agent_id'),
    modelId: text('model_id'),
    modelProvider: text('model_provider'),
    confidence: real('confidence').notNull().default(0.5),
    status: text('status', {
      enum: ['pending', 'accepted', 'rejected', 'overridden', 'deferred', 'executed', 'expired'],
    })
      .notNull()
      .default('pending'),
    userDecision: text('user_decision', {
      enum: ['accepted', 'rejected', 'overridden', 'deferred'],
    }),
    decidedByUserId: integer('decided_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    decidedAt: timestamp('decided_at'),
    overrideReason: text('override_reason'),
    correctionReason: text('correction_reason'),
    actionExecuted: text('action_executed'),
    actionExecutedAt: timestamp('action_executed_at'),
    outcomeResult: text('outcome_result', {
      enum: ['achieved', 'partial', 'not_achieved', 'unknown', 'too_early'],
    }),
    outcomeNotes: text('outcome_notes'),
    outcomeRecordedAt: timestamp('outcome_recorded_at'),
    timeToOutcomeMs: integer('time_to_outcome_ms'),
    domainConditions: jsonb('domain_conditions').default({}),
    laterImpact: jsonb('later_impact').default({}),
    proofChainId: integer('proof_chain_id'),
    correlationId: text('correlation_id'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('outcome_graph_org_idx').on(table.orgId),
    index('outcome_graph_domain_idx').on(table.domain),
    index('outcome_graph_entity_idx').on(table.entityType, table.entityId),
    index('outcome_graph_status_idx').on(table.status),
    index('outcome_graph_agent_idx').on(table.agentId),
    index('outcome_graph_created_idx').on(table.createdAt),
    index('outcome_graph_correlation_idx').on(table.correlationId),
  ],
);

export const outcomeGraphLearningJobsTable = pgTable(
  'outcome_graph_learning_jobs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain', { enum: OUTCOME_DOMAINS }).notNull().default('general'),
    jobType: text('job_type', {
      enum: [
        'ranking_calibration',
        'confidence_calibration',
        'escalation_threshold',
        'workflow_template',
        'owner_suggestion',
        'artifact_defaults',
      ],
    }).notNull(),
    status: text('status', {
      enum: ['pending', 'running', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    inputSampleSize: integer('input_sample_size'),
    outputSummary: jsonb('output_summary').default({}),
    changesApplied: jsonb('changes_applied').default([]),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    triggeredBy: text('triggered_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('outcome_learning_org_idx').on(table.orgId),
    index('outcome_learning_domain_idx').on(table.domain),
    index('outcome_learning_status_idx').on(table.status),
  ],
);

export const insertOutcomeGraphSchema = createInsertSchema(outcomeGraphTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOutcomeGraph = z.infer<typeof insertOutcomeGraphSchema>;
export type OutcomeGraph = typeof outcomeGraphTable.$inferSelect;

export const insertOutcomeGraphLearningJobSchema = createInsertSchema(
  outcomeGraphLearningJobsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertOutcomeGraphLearningJob = z.infer<typeof insertOutcomeGraphLearningJobSchema>;
export type OutcomeGraphLearningJob = typeof outcomeGraphLearningJobsTable.$inferSelect;

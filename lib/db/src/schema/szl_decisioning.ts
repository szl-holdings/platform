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

/**
 * SZL Decisioning — persistent audit tables
 *
 * Persists Action Engine execution runs, Decision Engine recommendations, and
 * Policy Engine violations so they survive server restarts and enable cross-
 * session audit trails, owner-notification workflows, and historical analytics.
 */

export const szlDecisioningRunsTable = pgTable(
  'szl_decisioning_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    workflowId: text('workflow_id').notNull(),
    workflowName: text('workflow_name').notNull(),
    domain: text('domain').notNull(),
    status: text('status', {
      enum: ['completed', 'dry_run', 'simulated', 'pending_approval', 'failed', 'rolled_back'],
    })
      .notNull()
      .default('completed'),
    initiatedBy: text('initiated_by'),
    approvedBy: text('approved_by'),
    tenantId: text('tenant_id'),
    recommendationId: text('recommendation_id'),
    isDryRun: boolean('is_dry_run').notNull().default(false),
    isSimulation: boolean('is_simulation').notNull().default(false),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    durationMs: integer('duration_ms'),
    steps: jsonb('steps').notNull().default([]),
    auditTrail: jsonb('audit_trail').notNull().default([]),
    policyEvaluation: jsonb('policy_evaluation').default({}),
    cost: jsonb('cost').default({}),
    outcome: text('outcome', { enum: ['success', 'partial', 'failed', 'cancelled'] }),
    outcomeSummary: text('outcome_summary'),
    outcomeImpact: jsonb('outcome_impact').default({}),
    outcomeRecordedAt: timestamp('outcome_recorded_at'),
    outcomeRecordedBy: text('outcome_recorded_by'),
    metadata: jsonb('metadata').default({}),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('szl_dr_run_id_idx').on(table.runId),
    index('szl_dr_workflow_id_idx').on(table.workflowId),
    index('szl_dr_status_idx').on(table.status),
    index('szl_dr_domain_idx').on(table.domain),
    index('szl_dr_tenant_idx').on(table.tenantId),
    index('szl_dr_recommendation_idx').on(table.recommendationId),
    index('szl_dr_started_at_idx').on(table.startedAt),
  ],
);

export const szlDecisioningRecommendationsTable = pgTable(
  'szl_decisioning_recommendations',
  {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    recommendationId: text('recommendation_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    domain: text('domain').notNull(),
    action: text('action'),
    priorityScore: real('priority_score').notNull().default(0),
    confidence: real('confidence').notNull().default(0.5),
    urgency: text('urgency', { enum: ['routine', 'moderate', 'urgent', 'critical'] })
      .notNull()
      .default('routine'),
    businessImpact: jsonb('business_impact').notNull().default({}),
    signals: jsonb('signals').notNull().default([]),
    evidence: jsonb('evidence').notNull().default([]),
    reasoning: text('reasoning'),
    policyState: text('policy_state', {
      enum: ['unchecked', 'allowed', 'requires_approval', 'blocked'],
    })
      .notNull()
      .default('unchecked'),
    policyEvaluation: jsonb('policy_evaluation').default({}),
    requiredRoles: jsonb('required_roles').notNull().default([]),
    estimatedEffortHours: real('estimated_effort_hours'),
    estimatedCostUsd: real('estimated_cost_usd'),
    suggestedOwner: text('suggested_owner'),
    isActionable: boolean('is_actionable').notNull().default(true),
    tenantId: text('tenant_id'),
    initiatedBy: text('initiated_by'),
    metadata: jsonb('metadata').default({}),
    evaluatedAt: timestamp('evaluated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('szl_drec_session_idx').on(table.sessionId),
    index('szl_drec_rec_id_idx').on(table.recommendationId),
    index('szl_drec_domain_idx').on(table.domain),
    index('szl_drec_policy_state_idx').on(table.policyState),
    index('szl_drec_tenant_idx').on(table.tenantId),
    index('szl_drec_evaluated_at_idx').on(table.evaluatedAt),
  ],
);

export const szlPolicyViolationsTable = pgTable(
  'szl_policy_violations',
  {
    id: serial('id').primaryKey(),
    policyId: text('policy_id').notNull(),
    policyName: text('policy_name'),
    ruleName: text('rule_name'),
    effect: text('effect', { enum: ['block', 'require_approval', 'warn'] })
      .notNull()
      .default('block'),
    action: text('action').notNull(),
    domain: text('domain'),
    subjectId: text('subject_id'),
    subjectRoles: jsonb('subject_roles').notNull().default([]),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    reason: text('reason'),
    estimatedCostUsd: real('estimated_cost_usd'),
    confidence: real('confidence'),
    runId: text('run_id'),
    recommendationId: text('recommendation_id'),
    tenantId: text('tenant_id'),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('szl_pv_policy_id_idx').on(table.policyId),
    index('szl_pv_domain_idx').on(table.domain),
    index('szl_pv_effect_idx').on(table.effect),
    index('szl_pv_run_id_idx').on(table.runId),
    index('szl_pv_tenant_idx').on(table.tenantId),
    index('szl_pv_occurred_at_idx').on(table.occurredAt),
  ],
);

export const insertSzlDecisioningRunSchema = createInsertSchema(szlDecisioningRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSzlDecisioningRun = z.infer<typeof insertSzlDecisioningRunSchema>;
export type SzlDecisioningRun = typeof szlDecisioningRunsTable.$inferSelect;

export const insertSzlDecisioningRecommendationSchema = createInsertSchema(
  szlDecisioningRecommendationsTable,
).omit({ id: true, createdAt: true });
export type InsertSzlDecisioningRecommendation = z.infer<
  typeof insertSzlDecisioningRecommendationSchema
>;
export type SzlDecisioningRecommendation = typeof szlDecisioningRecommendationsTable.$inferSelect;

export const insertSzlPolicyViolationSchema = createInsertSchema(szlPolicyViolationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSzlPolicyViolation = z.infer<typeof insertSzlPolicyViolationSchema>;
export type SzlPolicyViolation = typeof szlPolicyViolationsTable.$inferSelect;

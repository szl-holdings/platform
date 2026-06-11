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
import { pcMattersTable } from './prism_counsel.js';

export const pcPartnerPortfolioSnapshotsTable = pgTable(
  'pc_partner_portfolio_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    snapshotType: text('snapshot_type', { enum: ['daily', 'weekly', 'manual'] })
      .notNull()
      .default('daily'),
    totalMatters: integer('total_matters').default(0),
    criticalPressureCount: integer('critical_pressure_count').default(0),
    highPressureCount: integer('high_pressure_count').default(0),
    moderatePressureCount: integer('moderate_pressure_count').default(0),
    quietRiskCount: integer('quiet_risk_count').default(0),
    highFrictionCount: integer('high_friction_count').default(0),
    readyToMoveCount: integer('ready_to_move_count').default(0),
    reviewBacklogSize: integer('review_backlog_size').default(0),
    signoffBacklogSize: integer('signoff_backlog_size').default(0),
    approvalBottleneckCount: integer('approval_bottleneck_count').default(0),
    avgReviewLagDays: real('avg_review_lag_days'),
    avgSignoffLagDays: real('avg_signoff_lag_days'),
    insurerDragCount: integer('insurer_drag_count').default(0),
    recoveryDragCount: integer('recovery_drag_count').default(0),
    movementOpportunityCount: integer('movement_opportunity_count').default(0),
    deterioratingFastestIds: jsonb('deteriorating_fastest_ids'),
    closestToMovementIds: jsonb('closest_to_movement_ids'),
    topInsurerDragCohorts: jsonb('top_insurer_drag_cohorts'),
    teamThroughputRanking: jsonb('team_throughput_ranking'),
    actionCorrelationData: jsonb('action_correlation_data'),
    pressureBandDistribution: jsonb('pressure_band_distribution'),
    frictionBandDistribution: jsonb('friction_band_distribution'),
    readinessBandDistribution: jsonb('readiness_band_distribution'),
    snapshotProvenance: jsonb('snapshot_provenance'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_pp_snap_org_idx').on(table.orgId),
    index('pc_pp_snap_created_idx').on(table.createdAt),
  ],
);

export const pcPartnerDigestRunsTable = pgTable(
  'pc_partner_digest_runs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    digestType: text('digest_type', {
      enum: [
        'weekly_partner',
        'high_pressure',
        'movement_opportunity',
        'bottleneck',
        'insurer_drag',
        'recovery_lien_drag',
      ],
    }).notNull(),
    status: text('status', { enum: ['pending', 'generating', 'complete', 'failed'] })
      .notNull()
      .default('pending'),
    generatedBy: integer('generated_by'),
    snapshotId: integer('snapshot_id').references(() => pcPartnerPortfolioSnapshotsTable.id),
    title: text('title'),
    content: text('content'),
    highlights: jsonb('highlights'),
    matterCount: integer('matter_count').default(0),
    topFindings: jsonb('top_findings'),
    recommendedActions: jsonb('recommended_actions'),
    deliveredTo: jsonb('delivered_to'),
    proofChainId: integer('proof_chain_id'),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_digest_org_idx').on(table.orgId),
    index('pc_digest_type_idx').on(table.digestType),
    index('pc_digest_status_idx').on(table.status),
  ],
);

export const pcPartnerActionRequestsTable = pgTable(
  'pc_partner_action_requests',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    requestType: text('request_type', {
      enum: [
        'reassign_review',
        'escalate_matter',
        'escalate_insurer_silence',
        'prioritize_recovery_review',
        'prioritize_missing_evidence',
        'request_partner_update_memo',
        'request_movement_memo',
        'request_high_pressure_digest',
        'request_readiness_improvement_plan',
      ],
    }).notNull(),
    requestedBy: integer('requested_by').notNull(),
    assignedTo: integer('assigned_to'),
    status: text('status', { enum: ['pending', 'in_progress', 'completed', 'dismissed'] })
      .notNull()
      .default('pending'),
    title: text('title').notNull(),
    rationale: text('rationale'),
    urgency: text('urgency', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    context: jsonb('context'),
    resolvedBy: integer('resolved_by'),
    resolvedAt: timestamp('resolved_at'),
    dueBy: timestamp('due_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_partner_action_org_idx').on(table.orgId),
    index('pc_partner_action_matter_idx').on(table.matterId),
    index('pc_partner_action_status_idx').on(table.status),
  ],
);

export const pcPartnerInterventionEventsTable = pgTable(
  'pc_partner_intervention_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    actionRequestId: integer('action_request_id').references(() => pcPartnerActionRequestsTable.id),
    interventionType: text('intervention_type', {
      enum: [
        'partner_escalation',
        'reassignment',
        'insurer_escalation',
        'evidence_push',
        'recovery_push',
        'movement_push',
        'review_expedite',
      ],
    }).notNull(),
    intervenedBy: integer('intervened_by').notNull(),
    outcomeType: text('outcome_type', {
      enum: ['movement', 'unblocked', 'resolved', 'pending', 'no_effect'],
    })
      .notNull()
      .default('pending'),
    pressureBeforeScore: real('pressure_before_score'),
    pressureAfterScore: real('pressure_after_score'),
    frictionBeforeScore: real('friction_before_score'),
    frictionAfterScore: real('friction_after_score'),
    daysToOutcome: integer('days_to_outcome'),
    leverageScore: real('leverage_score'),
    notes: text('notes'),
    context: jsonb('context'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_intervention_org_idx').on(table.orgId),
    index('pc_intervention_matter_idx').on(table.matterId),
    index('pc_intervention_type_idx').on(table.interventionType),
  ],
);

export const pcExportReadinessSnapshotsTable = pgTable(
  'pc_export_readiness_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    readinessScore: real('readiness_score').notNull(),
    priorScore: real('prior_score'),
    trend: text('trend', { enum: ['improving', 'declining', 'stable'] })
      .notNull()
      .default('stable'),
    blockers: jsonb('blockers'),
    missingArtifacts: jsonb('missing_artifacts'),
    privilegeIssues: jsonb('privilege_issues'),
    exportSafe: boolean('export_safe').default(false),
    estimatedDaysToReady: integer('estimated_days_to_ready'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_export_ready_matter_idx').on(table.matterId),
    index('pc_export_ready_org_idx').on(table.orgId),
  ],
);

export const pcSignoffBacklogSnapshotsTable = pgTable(
  'pc_signoff_backlog_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    totalPending: integer('total_pending').default(0),
    criticalCount: integer('critical_count').default(0),
    avgAgeDays: real('avg_age_days'),
    oldestItemAgeDays: real('oldest_item_age_days'),
    byAssignee: jsonb('by_assignee'),
    byMatter: jsonb('by_matter'),
    overdueCount: integer('overdue_count').default(0),
    riskLevel: text('risk_level', { enum: ['critical', 'high', 'moderate', 'low'] })
      .notNull()
      .default('low'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_signoff_backlog_org_idx').on(table.orgId),
    index('pc_signoff_backlog_created_idx').on(table.createdAt),
  ],
);

export const pcReviewBacklogSnapshotsTable = pgTable(
  'pc_review_backlog_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    totalPending: integer('total_pending').default(0),
    criticalCount: integer('critical_count').default(0),
    contradictionCount: integer('contradiction_count').default(0),
    lowConfidenceCount: integer('low_confidence_count').default(0),
    avgAgeDays: real('avg_age_days'),
    oldestItemAgeDays: real('oldest_item_age_days'),
    byReviewer: jsonb('by_reviewer'),
    byMatter: jsonb('by_matter'),
    overdueCount: integer('overdue_count').default(0),
    riskLevel: text('risk_level', { enum: ['critical', 'high', 'moderate', 'low'] })
      .notNull()
      .default('low'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_review_backlog_org_idx').on(table.orgId),
    index('pc_review_backlog_created_idx').on(table.createdAt),
  ],
);

export const pcMovementOpportunitySnapshotsTable = pgTable(
  'pc_movement_opportunity_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    opportunityScore: real('opportunity_score').notNull(),
    priorScore: real('prior_score'),
    opportunityType: text('opportunity_type', {
      enum: [
        'insurer_softening',
        'evidence_complete',
        'lien_resolved',
        'mediation_ready',
        'demand_ready',
        'follow_up_effective',
      ],
    }).notNull(),
    drivers: jsonb('drivers'),
    recommendedAction: text('recommended_action'),
    estimatedDaysToAction: integer('estimated_days_to_action'),
    confidence: real('confidence'),
    ownerTeam: text('owner_team'),
    blockerType: text('blocker_type'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_movement_opp_matter_idx').on(table.matterId),
    index('pc_movement_opp_org_idx').on(table.orgId),
  ],
);

export const pcPortfolioForecastsTable = pgTable(
  'pc_portfolio_forecasts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    forecastType: text('forecast_type', {
      enum: [
        'recovery_lien_drag_risk',
        'review_bottleneck_risk',
        'approval_lag_risk',
        'partner_intervention_leverage',
        'settlement_blocker_severity',
        'export_readiness_score',
      ],
    }).notNull(),
    currentScore: real('current_score').notNull(),
    priorScore: real('prior_score'),
    trend: text('trend', { enum: ['improving', 'declining', 'stable', 'volatile'] }).notNull(),
    confidence: real('confidence'),
    drivers: jsonb('drivers'),
    sourceClasses: jsonb('source_classes'),
    nextAction: text('next_action'),
    whoShouldAct: text('who_should_act'),
    approvalRequired: boolean('approval_required').default(false),
    modelVersion: text('model_version'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_portfolio_fc_matter_idx').on(table.matterId),
    index('pc_portfolio_fc_type_idx').on(table.forecastType),
    index('pc_portfolio_fc_org_idx').on(table.orgId),
  ],
);

export type PcPartnerPortfolioSnapshot = typeof pcPartnerPortfolioSnapshotsTable.$inferSelect;
export type PcPartnerDigestRun = typeof pcPartnerDigestRunsTable.$inferSelect;
export type PcPartnerActionRequest = typeof pcPartnerActionRequestsTable.$inferSelect;
export type PcPartnerInterventionEvent = typeof pcPartnerInterventionEventsTable.$inferSelect;
export type PcExportReadinessSnapshot = typeof pcExportReadinessSnapshotsTable.$inferSelect;
export type PcSignoffBacklogSnapshot = typeof pcSignoffBacklogSnapshotsTable.$inferSelect;
export type PcReviewBacklogSnapshot = typeof pcReviewBacklogSnapshotsTable.$inferSelect;
export type PcMovementOpportunitySnapshot = typeof pcMovementOpportunitySnapshotsTable.$inferSelect;
export type PcPortfolioForecast = typeof pcPortfolioForecastsTable.$inferSelect;

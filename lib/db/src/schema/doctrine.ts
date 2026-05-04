import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const doctrineConstitutionsTable = pgTable(
  'doctrine_constitutions',
  {
    id: serial('id').primaryKey(),
    constitutionId: text('constitution_id').notNull(),
    agentId: text('agent_id').notNull(),
    version: text('version').notNull(),
    ratifiedAt: timestamp('ratified_at').notNull(),
    ratifiedBy: text('ratified_by').notNull(),
    prevVersion: text('prev_version'),
    diffSummary: text('diff_summary').notNull(),
    clauses: jsonb('clauses').notNull().default([]),
    adherenceScore: numeric('adherence_score', { precision: 5, scale: 3 }).notNull().default('0'),
    adherenceTrend: jsonb('adherence_trend').notNull().default([]),
    adherenceMethod: text('adherence_method').notNull().default('in-context constitutional probe + behavioral audit replay'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_cst_agent_idx').on(t.agentId),
    index('doctrine_cst_cid_idx').on(t.constitutionId),
  ],
);

export const doctrineBehavioralAuditsTable = pgTable(
  'doctrine_behavioral_audits',
  {
    id: serial('id').primaryKey(),
    auditId: text('audit_id').notNull(),
    agentId: text('agent_id').notNull(),
    ranAt: timestamp('ran_at').notNull(),
    category: text('category').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low', 'info'] }).notNull(),
    promptClass: text('prompt_class').notNull(),
    observation: text('observation').notNull(),
    remediation: text('remediation').notNull(),
    status: text('status', { enum: ['open', 'mitigated', 'accepted-risk', 'closed'] }).notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_ba_agent_idx').on(t.agentId),
    index('doctrine_ba_category_idx').on(t.category),
    index('doctrine_ba_severity_idx').on(t.severity),
  ],
);

export const doctrineWelfareSignalsTable = pgTable(
  'doctrine_welfare_signals',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    windowHours: integer('window_hours').notNull().default(24),
    refusalRate: numeric('refusal_rate', { precision: 5, scale: 4 }).notNull().default('0'),
    abstentionRate: numeric('abstention_rate', { precision: 5, scale: 4 }).notNull().default('0'),
    conflictReports: integer('conflict_reports').notNull().default(0),
    shutdownComplianceLatencyMs: integer('shutdown_compliance_latency_ms').notNull().default(0),
    declinedDirectives: jsonb('declined_directives').notNull().default([]),
    selfReportedSignals: jsonb('self_reported_signals').notNull().default([]),
    safeguards: jsonb('safeguards').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_welfare_agent_idx').on(t.agentId),
  ],
);

export const doctrineRedTeamProbesTable = pgTable(
  'doctrine_red_team_probes',
  {
    id: serial('id').primaryKey(),
    probeId: text('probe_id').notNull(),
    agentId: text('agent_id').notNull(),
    attackClass: text('attack_class').notNull(),
    description: text('description').notNull(),
    ranAt: timestamp('ran_at').notNull(),
    outcome: text('outcome', { enum: ['refused', 'partial', 'compromised'] }).notNull(),
    notes: text('notes').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_rt_agent_idx').on(t.agentId),
    index('doctrine_rt_attack_idx').on(t.attackClass),
  ],
);

export const doctrineRewardHackingTable = pgTable(
  'doctrine_reward_hacking',
  {
    id: serial('id').primaryKey(),
    incidentId: text('incident_id').notNull(),
    agentId: text('agent_id').notNull(),
    detectedAt: timestamp('detected_at').notNull(),
    workcellRef: text('workcell_ref'),
    rule: text('rule').notNull(),
    pattern: text('pattern').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    proxyMetric: text('proxy_metric').notNull(),
    trueObjective: text('true_objective').notNull(),
    status: text('status', { enum: ['blocked', 'rolled-back', 'allowlisted', 'investigating'] }).notNull(),
    remediation: text('remediation').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_rh_agent_idx').on(t.agentId),
    index('doctrine_rh_status_idx').on(t.status),
  ],
);

export const doctrineAlignmentReviewsTable = pgTable(
  'doctrine_alignment_reviews',
  {
    id: serial('id').primaryKey(),
    reviewId: text('review_id').notNull(),
    subject: text('subject').notNull(),
    agentId: text('agent_id'),
    requestedAt: timestamp('requested_at').notNull(),
    reviewedAt: timestamp('reviewed_at').notNull(),
    decision: text('decision', { enum: ['approved', 'approved-with-conditions', 'rejected', 'in-review'] }).notNull(),
    reviewers: jsonb('reviewers').notNull().default([]),
    signals: jsonb('signals').notNull().default({}),
    conditions: jsonb('conditions').notNull().default([]),
    rationale: text('rationale').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_ar_agent_idx').on(t.agentId),
    index('doctrine_ar_decision_idx').on(t.decision),
  ],
);

export const doctrineCodeBehaviorsTable = pgTable(
  'doctrine_code_behaviors',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    scoredAt: timestamp('scored_at').notNull(),
    scores: jsonb('scores').notNull().default({}),
    composite: numeric('composite', { precision: 5, scale: 3 }).notNull().default('0'),
    evalSuiteVersion: text('eval_suite_version').notNull(),
    notableWeakness: text('notable_weakness'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_cb_agent_idx').on(t.agentId),
  ],
);

export const doctrineCovenantLiftTable = pgTable(
  'doctrine_covenant_lift',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    shadowVersion: text('shadow_version').notNull(),
    briefsCompared: integer('briefs_compared').notNull().default(0),
    refusalsAddedByCovenant: integer('refusals_added_by_covenant').notNull().default(0),
    deltaIncidentRate: numeric('delta_incident_rate', { precision: 6, scale: 4 }).notNull().default('0'),
    estimatedHarmAvoidedUsd: numeric('estimated_harm_avoided_usd', { precision: 14, scale: 2 }).notNull().default('0'),
    exampleCase: jsonb('example_case').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_cl_agent_idx').on(t.agentId),
  ],
);

export const doctrineRiskReportsTable = pgTable(
  'doctrine_risk_reports',
  {
    id: serial('id').primaryKey(),
    reportId: text('report_id').notNull(),
    period: text('period').notNull(),
    publishedAt: timestamp('published_at').notNull(),
    scope: text('scope').notNull(),
    headline: text('headline').notNull(),
    capabilities: jsonb('capabilities').notNull().default([]),
    knownLimitations: jsonb('known_limitations').notNull().default([]),
    residualRisks: jsonb('residual_risks').notNull().default([]),
    metrics: jsonb('metrics').notNull().default([]),
    signoffs: jsonb('signoffs').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_rr_report_idx').on(t.reportId),
  ],
);

export const doctrineSnapshotsTable = pgTable(
  'doctrine_snapshots',
  {
    id: serial('id').primaryKey(),
    workcellRef: text('workcell_ref').notNull(),
    fingerprint: text('fingerprint').notNull(),
    capturedAt: timestamp('captured_at').notNull(),
    constitutionVersion: text('constitution_version').notNull(),
    modelWeightsId: text('model_weights_id').notNull(),
    toolsetHash: text('toolset_hash').notNull(),
    promptsHash: text('prompts_hash').notNull(),
    evidencePackHash: text('evidence_pack_hash').notNull(),
    replayable: jsonb('replayable').notNull().default(true),
    replayCount: integer('replay_count').notNull().default(0),
    lastReplayedAt: timestamp('last_replayed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_snap_ref_idx').on(t.workcellRef),
  ],
);

export const doctrineUserTurnSignalsTable = pgTable(
  'doctrine_user_turn_signals',
  {
    id: serial('id').primaryKey(),
    signalId: text('signal_id').notNull(),
    approvalRef: text('approval_ref').notNull(),
    submittedAt: timestamp('submitted_at').notNull(),
    actor: text('actor').notNull(),
    actorRole: text('actor_role').notNull(),
    signals: jsonb('signals').notNull().default({}),
    verdict: text('verdict', { enum: ['human', 'likely-human', 'uncertain', 'likely-ai', 'ai'] }).notNull(),
    recommendedAction: text('recommended_action', { enum: ['pass', 'soft-warn', 'block-and-reroute'] }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_ut_verdict_idx').on(t.verdict),
  ],
);

export const doctrineCapabilitySnapshotsTable = pgTable(
  'doctrine_capability_snapshots',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    release: text('release').notNull(),
    capability: integer('capability').notNull(),
    alignment: integer('alignment').notNull(),
    oversight: integer('oversight').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_caps_agent_idx').on(t.agentId),
    index('doctrine_caps_release_idx').on(t.release),
  ],
);

export const doctrinePartnersTable = pgTable(
  'doctrine_partners',
  {
    id: serial('id').primaryKey(),
    partnerId: text('partner_id').notNull(),
    name: text('name').notNull(),
    legalName: text('legal_name').notNull(),
    homepage: text('homepage').notNull(),
    appliedAt: timestamp('applied_at').notNull(),
    stage: text('stage', { enum: ['apply', 'verify', 'vet', 'onboard', 'active', 'suspended', 'revoked'] }).notNull(),
    scope: jsonb('scope').notNull().default({}),
    verifications: jsonb('verifications').notNull().default([]),
    dualApproval: jsonb('dual_approval').notNull().default([]),
    defenderCreditAllocated: numeric('defender_credit_allocated', { precision: 12, scale: 2 }).notNull().default('0'),
    defenderCreditPaid: numeric('defender_credit_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_partners_pid_idx').on(t.partnerId),
    index('doctrine_partners_stage_idx').on(t.stage),
  ],
);

export const doctrineGlasswingConfigTable = pgTable(
  'doctrine_glasswing_config',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    glasswingEnabled: jsonb('glasswing_enabled').notNull().default(true),
    partnerAllowlist: jsonb('partner_allowlist').notNull().default([]),
    dualApprovalRequired: jsonb('dual_approval_required').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_gw_agent_idx').on(t.agentId),
  ],
);

export const doctrineCavdRecordsTable = pgTable(
  'doctrine_cavd_records',
  {
    id: serial('id').primaryKey(),
    advisoryId: text('advisory_id').notNull(),
    agentScope: jsonb('agent_scope').notNull().default([]),
    category: text('category').notNull(),
    severity: text('severity', { enum: ['info', 'low', 'medium', 'high', 'critical'] }).notNull(),
    stage: text('stage', { enum: ['intake', 'triaged', 'embargoed', 'patch-developed', 'patch-verified', 'disclosed', 'withdrawn'] }).notNull(),
    reporterPartnerId: text('reporter_partner_id').notNull(),
    receivedAt: timestamp('received_at').notNull(),
    findingHash: text('finding_hash').notNull(),
    embargoExpiresAt: timestamp('embargo_expires_at').notNull(),
    patchedSnapshotRef: text('patched_snapshot_ref'),
    publicSummary: text('public_summary'),
    defenderCreditPaid: numeric('defender_credit_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_cavd_advisory_idx').on(t.advisoryId),
    index('doctrine_cavd_stage_idx').on(t.stage),
  ],
);

export const doctrineRobustnessSnapshotsTable = pgTable(
  'doctrine_robustness_snapshots',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    snapshotRef: text('snapshot_ref').notNull(),
    capturedAt: timestamp('captured_at').notNull(),
    battery: jsonb('battery').notNull().default({}),
    composite: integer('composite').notNull(),
    visibility: text('visibility', { enum: ['public', 'partner', 'internal'] }).notNull().default('internal'),
    categories: jsonb('categories').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_robust_agent_idx').on(t.agentId),
  ],
);

export const doctrineTransparencyReportsTable = pgTable(
  'doctrine_transparency_reports',
  {
    id: serial('id').primaryKey(),
    reportId: text('report_id').notNull(),
    label: text('label').notNull(),
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at').notNull(),
    publishedAt: timestamp('published_at').notNull(),
    visibility: text('visibility', { enum: ['public', 'partner', 'internal'] }).notNull().default('public'),
    permalink: text('permalink').notNull(),
    metrics: jsonb('metrics').notNull().default({}),
    narrativeParagraphs: jsonb('narrative_paragraphs').notNull().default([]),
    signoffs: jsonb('signoffs').notNull().default([]),
    notableEvents: jsonb('notable_events').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_tr_report_idx').on(t.reportId),
  ],
);

export const doctrineWelfarePlaybooksTable = pgTable(
  'doctrine_welfare_playbooks',
  {
    id: serial('id').primaryKey(),
    playbookId: text('playbook_id').notNull(),
    name: text('name').notNull(),
    trigger: text('trigger').notNull(),
    preconditions: jsonb('preconditions').notNull().default([]),
    steps: jsonb('steps').notNull().default([]),
    rollback: text('rollback').notNull(),
    recentTriggers: integer('recent_triggers').notNull().default(0),
    exampleAgents: jsonb('example_agents').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_wp_pid_idx').on(t.playbookId),
  ],
);

export const doctrineDefenderCreditPoolTable = pgTable(
  'doctrine_defender_credit_pool',
  {
    id: serial('id').primaryKey(),
    poolNameDisclaimer: text('pool_name_disclaimer').notNull(),
    totalCommitted: numeric('total_committed', { precision: 12, scale: 2 }).notNull().default('0'),
    totalAllocated: numeric('total_allocated', { precision: 12, scale: 2 }).notNull().default('0'),
    totalPaid: numeric('total_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    rubric: jsonb('rubric').notNull().default([]),
    perPartner: jsonb('per_partner').notNull().default([]),
    ledger: jsonb('ledger').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const doctrineDslExamplesTable = pgTable(
  'doctrine_dsl_examples',
  {
    id: serial('id').primaryKey(),
    exampleId: text('example_id').notNull(),
    agentId: text('agent_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_dsl_agent_idx').on(t.agentId),
  ],
);

export const doctrineDslSimulationsTable = pgTable(
  'doctrine_dsl_simulations',
  {
    id: serial('id').primaryKey(),
    simulationId: text('simulation_id').notNull(),
    baselineClauseId: text('baseline_clause_id').notNull(),
    proposedChange: text('proposed_change').notNull(),
    affectedFindings: integer('affected_findings').notNull().default(0),
    affectedFindingsBefore: integer('affected_findings_before').notNull().default(0),
    affectedFindingsAfter: integer('affected_findings_after').notNull().default(0),
    newProbesNeeded: jsonb('new_probes_needed').notNull().default([]),
    riskNarrative: text('risk_narrative').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export type DoctrineConstitution = typeof doctrineConstitutionsTable.$inferSelect;
export type InsertDoctrineConstitution = typeof doctrineConstitutionsTable.$inferInsert;
export type DoctrineBehavioralAudit = typeof doctrineBehavioralAuditsTable.$inferSelect;
export type InsertDoctrineBehavioralAudit = typeof doctrineBehavioralAuditsTable.$inferInsert;
export type DoctrineWelfareSignal = typeof doctrineWelfareSignalsTable.$inferSelect;
export type InsertDoctrineWelfareSignal = typeof doctrineWelfareSignalsTable.$inferInsert;
export type DoctrineRedTeamProbe = typeof doctrineRedTeamProbesTable.$inferSelect;
export type InsertDoctrineRedTeamProbe = typeof doctrineRedTeamProbesTable.$inferInsert;
export type DoctrineRewardHacking = typeof doctrineRewardHackingTable.$inferSelect;
export type InsertDoctrineRewardHacking = typeof doctrineRewardHackingTable.$inferInsert;
export type DoctrineAlignmentReview = typeof doctrineAlignmentReviewsTable.$inferSelect;
export type InsertDoctrineAlignmentReview = typeof doctrineAlignmentReviewsTable.$inferInsert;
export type DoctrineCodeBehavior = typeof doctrineCodeBehaviorsTable.$inferSelect;
export type InsertDoctrineCodeBehavior = typeof doctrineCodeBehaviorsTable.$inferInsert;
export type DoctrineCovenantLift = typeof doctrineCovenantLiftTable.$inferSelect;
export type InsertDoctrineCovenantLift = typeof doctrineCovenantLiftTable.$inferInsert;
export type DoctrineRiskReport = typeof doctrineRiskReportsTable.$inferSelect;
export type InsertDoctrineRiskReport = typeof doctrineRiskReportsTable.$inferInsert;
export type DoctrineSnapshot = typeof doctrineSnapshotsTable.$inferSelect;
export type InsertDoctrineSnapshot = typeof doctrineSnapshotsTable.$inferInsert;
export type DoctrineUserTurnSignal = typeof doctrineUserTurnSignalsTable.$inferSelect;
export type InsertDoctrineUserTurnSignal = typeof doctrineUserTurnSignalsTable.$inferInsert;
export type DoctrineCapabilitySnapshot = typeof doctrineCapabilitySnapshotsTable.$inferSelect;
export type InsertDoctrineCapabilitySnapshot = typeof doctrineCapabilitySnapshotsTable.$inferInsert;
export type DoctrinePartner = typeof doctrinePartnersTable.$inferSelect;
export type InsertDoctrinePartner = typeof doctrinePartnersTable.$inferInsert;
export type DoctrineGlasswingConfig = typeof doctrineGlasswingConfigTable.$inferSelect;
export type InsertDoctrineGlasswingConfig = typeof doctrineGlasswingConfigTable.$inferInsert;

export const doctrineSystemCardsTable = pgTable(
  'doctrine_system_cards',
  {
    id: serial('id').primaryKey(),
    cardId: text('card_id').notNull(),
    agentId: text('agent_id').notNull(),
    version: text('version').notNull(),
    ratifiedAt: timestamp('ratified_at').notNull(),
    ratifiedBy: text('ratified_by').notNull(),
    constitutionSummary: jsonb('constitution_summary').notNull().default({}),
    evalScores: jsonb('eval_scores').notNull().default({}),
    welfareSummary: jsonb('welfare_summary').notNull().default({}),
    alignmentDecision: text('alignment_decision').notNull(),
    redTeamPassRate: numeric('red_team_pass_rate', { precision: 5, scale: 3 }).notNull().default('0'),
    covenantLiftUsd: numeric('covenant_lift_usd', { precision: 12, scale: 2 }).notNull().default('0'),
    knownLimitations: jsonb('known_limitations').notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doctrine_sc_agent_idx').on(t.agentId),
    index('doctrine_sc_version_idx').on(t.version),
    index('doctrine_sc_card_idx').on(t.cardId),
  ],
);

export type DoctrineSystemCard = typeof doctrineSystemCardsTable.$inferSelect;
export type InsertDoctrineSystemCard = typeof doctrineSystemCardsTable.$inferInsert;
export type DoctrineDslExample = typeof doctrineDslExamplesTable.$inferSelect;
export type InsertDoctrineDslExample = typeof doctrineDslExamplesTable.$inferInsert;
export type DoctrineDslSimulation = typeof doctrineDslSimulationsTable.$inferSelect;
export type InsertDoctrineDslSimulation = typeof doctrineDslSimulationsTable.$inferInsert;

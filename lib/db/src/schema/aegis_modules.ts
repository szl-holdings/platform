import { boolean, index, integer, jsonb, numeric, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ─── Action Queue ─────────────────────────────────────────────────────────────

export type AuditEntry = { actor: string; action: string; at: string; note?: string };
export type ActionQueueStatus = 'open' | 'blocked' | 'in_progress' | 'escalated' | 'complete';
export type ActionQueuePriority = 'critical' | 'high' | 'medium' | 'low';

export const aegisActionQueueItemsTable = pgTable(
  'aegis_action_queue_items',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    priority: text('priority').$type<ActionQueuePriority>().notNull().default('medium'),
    status: text('status').$type<ActionQueueStatus>().notNull().default('open'),
    assignedTo: text('assigned_to'),
    dueAt: timestamp('due_at'),
    incidentId: text('incident_id'),
    source: text('source').notNull().default('system'),
    playbookRef: text('playbook_ref'),
    auditTrail: jsonb('audit_trail').$type<AuditEntry[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('aegis_aq_status_idx').on(t.status),
    priorityIdx: index('aegis_aq_priority_idx').on(t.priority),
  }),
);

export const insertAegisActionQueueItemSchema = createInsertSchema(aegisActionQueueItemsTable).omit(
  { createdAt: true, updatedAt: true },
);
export type InsertAegisActionQueueItem = z.infer<typeof insertAegisActionQueueItemSchema>;
export type AegisActionQueueItem = typeof aegisActionQueueItemsTable.$inferSelect;

// ─── SOAR Playbooks ───────────────────────────────────────────────────────────

export type PlaybookStatus = 'active' | 'draft' | 'archived';
export type PlaybookNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'enrich'
  | 'notify'
  | 'approve'
  | 'loop';
export type PlaybookNode = {
  id: string;
  type: PlaybookNodeType;
  label: string;
  config: string;
  auto: boolean;
};

export const aegisSoarPlaybooksTable = pgTable(
  'aegis_soar_playbooks',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    trigger: text('trigger').notNull(),
    description: text('description').notNull(),
    nodes: jsonb('nodes').$type<PlaybookNode[]>().notNull().default([]),
    status: text('status').$type<PlaybookStatus>().notNull().default('draft'),
    runCount: integer('run_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('aegis_soar_pb_status_idx').on(t.status),
  }),
);

export const insertAegisSoarPlaybookSchema = createInsertSchema(aegisSoarPlaybooksTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertAegisSoarPlaybook = z.infer<typeof insertAegisSoarPlaybookSchema>;
export type AegisSoarPlaybook = typeof aegisSoarPlaybooksTable.$inferSelect;

// ─── SOAR Runs ────────────────────────────────────────────────────────────────

export type SoarRunStatus = 'running' | 'completed' | 'failed' | 'awaiting_approval';

export const aegisSoarRunsTable = pgTable(
  'aegis_soar_runs',
  {
    id: text('id').primaryKey(),
    playbookId: text('playbook_id')
      .notNull()
      .references(() => aegisSoarPlaybooksTable.id, { onDelete: 'cascade' }),
    playbookName: text('playbook_name').notNull(),
    status: text('status').$type<SoarRunStatus>().notNull().default('running'),
    triggeredBy: text('triggered_by').notNull().default('manual'),
    duration: text('duration'),
    stepsCompleted: integer('steps_completed').notNull().default(0),
    stepsFailed: integer('steps_failed').notNull().default(0),
    outcome: text('outcome'),
    incidentId: text('incident_id'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => ({
    playbookIdx: index('aegis_soar_runs_pb_idx').on(t.playbookId),
    statusIdx: index('aegis_soar_runs_status_idx').on(t.status),
  }),
);

export const insertAegisSoarRunSchema = createInsertSchema(aegisSoarRunsTable).omit({
  startedAt: true,
  completedAt: true,
});
export type InsertAegisSoarRun = z.infer<typeof insertAegisSoarRunSchema>;
export type AegisSoarRun = typeof aegisSoarRunsTable.$inferSelect;

// ─── Deception Honeypots ──────────────────────────────────────────────────────

export type HoneypotStatus = 'active' | 'inactive' | 'compromised';
export type HoneypotType = 'ssh' | 'http' | 'smb' | 'ftp' | 'db' | 'ics';

export const aegisDeceptionHotpotsTable = pgTable(
  'aegis_deception_honeypots',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').$type<HoneypotType>().notNull(),
    ip: text('ip').notNull(),
    os: text('os').notNull(),
    status: text('status').$type<HoneypotStatus>().notNull().default('active'),
    interactions: integer('interactions').notNull().default(0),
    iocsPushed: integer('iocs_pushed').notNull().default(0),
    deceptionScore: integer('deception_score').notNull().default(0),
    lastHit: timestamp('last_hit'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('aegis_honeypots_status_idx').on(t.status),
  }),
);

export const insertAegisDeceptionHoneypotSchema = createInsertSchema(
  aegisDeceptionHotpotsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAegisDeceptionHoneypot = z.infer<typeof insertAegisDeceptionHoneypotSchema>;
export type AegisDeceptionHoneypot = typeof aegisDeceptionHotpotsTable.$inferSelect;

// ─── Digital Twin Nodes ───────────────────────────────────────────────────────

export type TwinNodeStatus = 'synced' | 'drifted' | 'offline';
export type TwinNodeTier = 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3';

export const aegisTwinNodesTable = pgTable(
  'aegis_twin_nodes',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(),
    type: text('type').notNull(),
    zone: text('zone').notNull(),
    tier: text('tier').$type<TwinNodeTier>().notNull().default('tier-2'),
    status: text('status').$type<TwinNodeStatus>().notNull().default('synced'),
    ip: text('ip'),
    os: text('os'),
    vulnerabilities: integer('vulnerabilities').notNull().default(0),
    syncedAt: timestamp('synced_at').notNull().defaultNow(),
    meta: jsonb('meta').$type<Record<string, string | number | boolean>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    zoneIdx: index('aegis_twin_zone_idx').on(t.zone),
    statusIdx: index('aegis_twin_status_idx').on(t.status),
  }),
);

export const insertAegisTwinNodeSchema = createInsertSchema(aegisTwinNodesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertAegisTwinNode = z.infer<typeof insertAegisTwinNodeSchema>;
export type AegisTwinNode = typeof aegisTwinNodesTable.$inferSelect;

// ─── Policy Decisions (Adaptive Defense Shield) ───────────────────────────────

export type PolicyDecisionActionType =
  | 'data_access'
  | 'external_api'
  | 'financial_transaction'
  | 'cross_domain'
  | 'agent_spawn';
export type PolicyDecisionOutcome = 'permitted' | 'blocked' | 'escalated';

export const aegisPolicyDecisionsTable = pgTable(
  'aegis_policy_decisions',
  {
    id: text('id').primaryKey(),
    agentName: text('agent_name').notNull(),
    domain: text('domain').notNull(),
    action: text('action').notNull(),
    actionType: text('action_type').$type<PolicyDecisionActionType>().notNull(),
    decision: text('decision').$type<PolicyDecisionOutcome>().notNull(),
    policyRule: text('policy_rule').notNull(),
    riskScore: integer('risk_score').notNull().default(0),
    details: text('details').notNull().default(''),
    decidedAt: timestamp('decided_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    decisionIdx: index('aegis_pd_decision_idx').on(t.decision),
    decidedAtIdx: index('aegis_pd_decided_at_idx').on(t.decidedAt),
  }),
);

export const insertAegisPolicyDecisionSchema = createInsertSchema(
  aegisPolicyDecisionsTable,
).omit({ createdAt: true });
export type InsertAegisPolicyDecision = z.infer<typeof insertAegisPolicyDecisionSchema>;
export type AegisPolicyDecision = typeof aegisPolicyDecisionsTable.$inferSelect;

// ─── Threat Incidents (Autonomous Threat Engine) ──────────────────────────────

export type ThreatIncidentSeverity = 'critical' | 'high' | 'medium';
export type ThreatIncidentStatus =
  | 'detected'
  | 'classified'
  | 'auto_contained'
  | 'pending_approval'
  | 'contained'
  | 'dismissed';

export const aegisThreatIncidentsTable = pgTable(
  'aegis_threat_incidents',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    severity: text('severity').$type<ThreatIncidentSeverity>().notNull().default('medium'),
    status: text('status').$type<ThreatIncidentStatus>().notNull().default('detected'),
    confidenceScore: integer('confidence_score').notNull().default(0),
    killChainStage: text('kill_chain_stage').notNull().default('recon'),
    mitreTactic: text('mitre_tactic').notNull().default('initial_access'),
    mitreId: text('mitre_id').notNull().default('T1000'),
    affectedAssets: jsonb('affected_assets').$type<string[]>().notNull().default([]),
    blastRadius: integer('blast_radius').notNull().default(0),
    autonomousActions: jsonb('autonomous_actions').$type<string[]>().notNull().default([]),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approvalTimeoutSecs: integer('approval_timeout_secs'),
    ttps: jsonb('ttps').$type<string[]>().notNull().default([]),
    adversaryGroup: text('adversary_group'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    severityIdx: index('aegis_ti_severity_idx').on(t.severity),
    statusIdx: index('aegis_ti_status_idx').on(t.status),
    detectedAtIdx: index('aegis_ti_detected_at_idx').on(t.detectedAt),
  }),
);

export const insertAegisThreatIncidentSchema = createInsertSchema(
  aegisThreatIncidentsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAegisThreatIncident = z.infer<typeof insertAegisThreatIncidentSchema>;
export type AegisThreatIncident = typeof aegisThreatIncidentsTable.$inferSelect;

// ─── Threat Predictions (Predictive Intelligence) ─────────────────────────────

export const aegisThreatPredictionsTable = pgTable(
  'aegis_threat_predictions',
  {
    id: text('id').primaryKey(),
    threatType: text('threat_type').notNull(),
    adversaryGroup: text('adversary_group'),
    currentStage: text('current_stage').notNull(),
    predictedNextStage: text('predicted_next_stage').notNull(),
    timeToNextStageHours: numeric('time_to_next_stage_hours', { precision: 8, scale: 2 }).notNull(),
    confidencePct: integer('confidence_pct').notNull().default(0),
    severity: text('severity').$type<ThreatIncidentSeverity>().notNull().default('medium'),
    blastRadiusTrend: jsonb('blast_radius_trend').$type<number[]>().notNull().default([]),
    businessImpactUsd: numeric('business_impact_usd', {
      precision: 18,
      scale: 2,
    }).notNull().default('0'),
    mitigationWindowMins: integer('mitigation_window_mins').notNull().default(0),
    recommendedActions: jsonb('recommended_actions').$type<string[]>().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    severityIdx: index('aegis_tp_severity_idx').on(t.severity),
    isActiveIdx: index('aegis_tp_active_idx').on(t.isActive),
  }),
);

export const insertAegisThreatPredictionSchema = createInsertSchema(
  aegisThreatPredictionsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAegisThreatPrediction = z.infer<typeof insertAegisThreatPredictionSchema>;
export type AegisThreatPrediction = typeof aegisThreatPredictionsTable.$inferSelect;

// ─── Adversary Narratives (Adversary Narrative Engine) ────────────────────────

export const aegisAdversaryNarrativesTable = pgTable(
  'aegis_adversary_narratives',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    severity: text('severity').$type<ThreatIncidentSeverity>().notNull().default('critical'),
    status: text('status').notNull().default('in_progress'),
    actor: text('actor').notNull(),
    confidence: integer('confidence').notNull().default(0),
    businessImpact: text('business_impact').notNull().default(''),
    executiveSummary: text('executive_summary').notNull().default(''),
    affectedSystems: jsonb('affected_systems').$type<string[]>().notNull().default([]),
    iocCount: integer('ioc_count').notNull().default(0),
    steps: jsonb('steps').$type<Record<string, unknown>[]>().notNull().default([]),
    stepsEvidenced: integer('steps_evidenced').notNull().default(0),
    stepsInferred: integer('steps_inferred').notNull().default(0),
    stepsMissing: integer('steps_missing').notNull().default(0),
    totalSteps: integer('total_steps').notNull().default(0),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    severityIdx: index('aegis_an_severity_idx').on(t.severity),
    statusIdx: index('aegis_an_status_idx').on(t.status),
  }),
);

export const insertAegisAdversaryNarrativeSchema = createInsertSchema(
  aegisAdversaryNarrativesTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAegisAdversaryNarrative = z.infer<typeof insertAegisAdversaryNarrativeSchema>;
export type AegisAdversaryNarrative = typeof aegisAdversaryNarrativesTable.$inferSelect;

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const pcMattersTable = pgTable(
  'pc_matters',
  {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  title: text('title').notNull(),
  caseNumber: text('case_number'),
  matterType: text('matter_type', {
    enum: [
      'auto_injury',
      'premises_liability',
      'insurance_coverage',
      'medical_malpractice',
      'product_liability',
      'wrongful_death',
      'workers_comp',
      'no_fault',
      'other',
    ],
  }).notNull(),
  status: text('status', {
    enum: [
      'intake',
      'investigation',
      'discovery',
      'pre_trial',
      'trial',
      'settlement',
      'closed',
      'archived',
    ],
  })
    .notNull()
    .default('intake'),
  stage: text('stage'),
  jurisdiction: text('jurisdiction'),
  courtName: text('court_name'),
  venueId: integer('venue_id'),
  filingDate: timestamp('filing_date'),
  statOfLimitations: timestamp('stat_of_limitations'),
  healthScore: integer('health_score'),
  settlementLow: numeric('settlement_low', { precision: 14, scale: 2 }),
  settlementHigh: numeric('settlement_high', { precision: 14, scale: 2 }),
  settlementMid: numeric('settlement_mid', { precision: 14, scale: 2 }),
  totalDamages: numeric('total_damages', { precision: 14, scale: 2 }),
  totalLiens: numeric('total_liens', { precision: 14, scale: 2 }),
  assignedAttorneyId: integer('assigned_attorney_id'),
  assignedParalegalId: integer('assigned_paralegal_id'),
  tags: jsonb('tags'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  privilegeFlag: boolean('privilege_flag').default(false),
  exportSafe: boolean('export_safe').default(true),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_matters_org_id_idx').on(t.orgId),
    index('pc_matters_status_idx').on(t.status),
  ],
);

export const pcPartiesTable = pgTable(
  'pc_parties',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  role: text('role', {
    enum: [
      'plaintiff',
      'defendant',
      'carrier',
      'adjuster',
      'witness',
      'expert',
      'provider',
      'judge',
      'mediator',
      'opposing_counsel',
    ],
  }).notNull(),
  name: text('name').notNull(),
  organization: text('organization'),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_parties_matter_id_idx').on(t.matterId)],
);

export const pcClaimsTable = pgTable(
  'pc_claims',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  claimNumber: text('claim_number'),
  policyNumber: text('policy_number'),
  carrierName: text('carrier_name'),
  adjusterId: integer('adjuster_id'),
  coverageType: text('coverage_type', {
    enum: [
      'bodily_injury',
      'uninsured_motorist',
      'underinsured_motorist',
      'pip',
      'med_pay',
      'premises',
      'general_liability',
      'umbrella',
      'excess',
      'no_fault',
      'other',
    ],
  }).notNull(),
  policyLimit: numeric('policy_limit', { precision: 14, scale: 2 }),
  status: text('status', {
    enum: ['open', 'pending', 'denied', 'accepted', 'settled', 'litigated'],
  })
    .notNull()
    .default('open'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('pc_claims_matter_id_idx').on(t.matterId)],
);

export const pcOffersTable = pgTable(
  'pc_offers',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  claimId: integer('claim_id').references(() => pcClaimsTable.id),
  offerType: text('offer_type', {
    enum: ['demand', 'offer', 'counter_offer', 'final_offer', 'mediator_proposal'],
  }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  source: text('source'),
  notes: text('notes'),
  offerDate: timestamp('offer_date').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_offers_matter_id_idx').on(t.matterId)],
);

export const pcMedicalEventsTable = pgTable(
  'pc_medical_events',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  providerName: text('provider_name').notNull(),
  providerType: text('provider_type', {
    enum: [
      'er',
      'hospital',
      'orthopedic',
      'chiropractic',
      'physical_therapy',
      'pain_management',
      'neurologist',
      'surgeon',
      'primary_care',
      'imaging',
      'other',
    ],
  }).notNull(),
  eventType: text('event_type', {
    enum: [
      'visit',
      'procedure',
      'surgery',
      'imaging',
      'therapy_session',
      'consultation',
      'follow_up',
      'discharge',
    ],
  }).notNull(),
  description: text('description'),
  diagnosis: text('diagnosis'),
  eventDate: timestamp('event_date').notNull(),
  billedAmount: numeric('billed_amount', { precision: 12, scale: 2 }),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }),
  outstandingAmount: numeric('outstanding_amount', { precision: 12, scale: 2 }),
  documentRef: text('document_ref'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_medical_events_matter_id_idx').on(t.matterId)],
);

export const pcDamagesTable = pgTable(
  'pc_damages',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  category: text('category', {
    enum: [
      'medical_specials',
      'lost_wages',
      'future_medical',
      'pain_suffering',
      'loss_of_consortium',
      'property_damage',
      'out_of_pocket',
      'other',
    ],
  }).notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  isProjected: boolean('is_projected').default(false),
  verificationStatus: text('verification_status', {
    enum: ['verified', 'pending', 'disputed', 'estimated'],
  })
    .notNull()
    .default('pending'),
  sourceDocument: text('source_document'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_damages_matter_id_idx').on(t.matterId)],
);

export const pcLiensTable = pgTable('pc_liens', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  lienHolder: text('lien_holder').notNull(),
  lienType: text('lien_type', {
    enum: [
      'health_insurance',
      'medicaid',
      'medicare',
      'hospital',
      'provider',
      'erisa',
      'workers_comp',
      'child_support',
      'government',
      'other',
    ],
  }).notNull(),
  assertedAmount: numeric('asserted_amount', { precision: 14, scale: 2 }).notNull(),
  negotiatedAmount: numeric('negotiated_amount', { precision: 14, scale: 2 }),
  status: text('status', { enum: ['asserted', 'negotiating', 'resolved', 'disputed', 'waived'] })
    .notNull()
    .default('asserted'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcDeadlinesTable = pgTable(
  'pc_deadlines',
  {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  deadlineType: text('deadline_type', {
    enum: [
      'statute_of_limitations',
      'discovery_cutoff',
      'deposition',
      'mediation',
      'trial',
      'motion',
      'filing',
      'response',
      'expert_disclosure',
      'settlement_conference',
      'notice_of_claim',
      'no_fault_ack',
      'no_fault_verify',
      'no_fault_pay_deny',
      'bill_submission',
      'other',
    ],
  }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['pending', 'completed', 'overdue', 'waived', 'extended'] })
    .notNull()
    .default('pending'),
  assignedTo: integer('assigned_to'),
  clockRuleId: integer('clock_rule_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_deadlines_matter_id_idx').on(t.matterId),
    index('pc_deadlines_due_date_idx').on(t.dueDate),
  ],
);

export const pcDiscoveryTable = pgTable('pc_discovery', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  discoveryType: text('discovery_type', {
    enum: [
      'interrogatories',
      'requests_for_production',
      'requests_for_admission',
      'subpoena',
      'deposition_notice',
      'expert_report',
      'imt_request',
    ],
  }).notNull(),
  direction: text('direction', { enum: ['sent', 'received'] }).notNull(),
  title: text('title').notNull(),
  servedDate: timestamp('served_date'),
  dueDate: timestamp('due_date'),
  status: text('status', {
    enum: ['draft', 'served', 'pending_response', 'responded', 'objected', 'overdue', 'completed'],
  })
    .notNull()
    .default('draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDepositionsTable = pgTable('pc_depositions', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  deponentName: text('deponent_name').notNull(),
  deponentRole: text('deponent_role', {
    enum: [
      'plaintiff',
      'defendant',
      'witness',
      'expert',
      'adjuster',
      'treating_physician',
      'corporate_rep',
    ],
  }).notNull(),
  scheduledDate: timestamp('scheduled_date'),
  location: text('location'),
  status: text('status', {
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'pending'],
  })
    .notNull()
    .default('pending'),
  keyFindings: text('key_findings'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcForecastsTable = pgTable('pc_forecasts', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  forecastType: text('forecast_type', {
    enum: [
      'settlement_range',
      'cycle_time',
      'mediation_readiness',
      'trial_readiness',
      'evidence_sufficiency',
      'lien_resolution',
      'deadline_breach',
      'no_fault_evidence_lock',
      'demand_readiness',
      'offer_movement',
      'reserve_drift',
      'mediation_conversion',
      'chronology_integrity',
      'damages_completeness',
      'venue_velocity',
      'ai_defensibility',
    ],
  }).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }),
  valueLow: numeric('value_low', { precision: 14, scale: 2 }),
  valueHigh: numeric('value_high', { precision: 14, scale: 2 }),
  valueMid: numeric('value_mid', { precision: 14, scale: 2 }),
  signals: jsonb('signals'),
  drivers: jsonb('drivers'),
  previousSnapshot: jsonb('previous_snapshot'),
  explanation: text('explanation'),
  requiresAttorneyReview: boolean('requires_attorney_review').default(false),
  modelRoute: text('model_route'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcReadinessScoresTable = pgTable('pc_readiness_scores', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  pillar: text('pillar', {
    enum: ['posture', 'readiness', 'integrity', 'strategy', 'money', 'governance'],
  }).notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull().default(100),
  details: jsonb('details'),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
});

export const pcCommunicationsTable = pgTable('pc_communications', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  direction: text('direction', { enum: ['inbound', 'outbound', 'internal'] }).notNull(),
  channel: text('channel', {
    enum: ['email', 'phone', 'letter', 'portal', 'fax', 'teams', 'sms'],
  }).notNull(),
  fromParty: text('from_party'),
  toParty: text('to_party'),
  subject: text('subject'),
  summary: text('summary'),
  extractedAsks: jsonb('extracted_asks'),
  extractedCommitments: jsonb('extracted_commitments'),
  isPrivileged: boolean('is_privileged').default(false),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcAiRecommendationsTable = pgTable('pc_ai_recommendations', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  recommendationType: text('recommendation_type', {
    enum: [
      'next_best_action',
      'missing_evidence',
      'demand_readiness',
      'discovery_follow_up',
      'deposition_prep',
      'mediation_prep',
      'privilege_warning',
      'inconsistency_alert',
      'deadline_risk',
      'insurer_silence',
      'clock_violation',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  confidence: numeric('confidence', { precision: 5, scale: 2 }),
  citations: jsonb('citations'),
  status: text('status', { enum: ['pending', 'accepted', 'dismissed', 'completed'] })
    .notNull()
    .default('pending'),
  defensibilityScore: integer('defensibility_score'),
  modelRoute: text('model_route'),
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcApprovalRequestsTable = pgTable('pc_approval_requests', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  requestType: text('request_type', {
    enum: [
      'demand_send',
      'settlement_acceptance',
      'external_communication',
      'expert_engagement',
      'filing',
      'client_disclosure',
      'fee_approval',
      'export_approval',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  sourceBasis: jsonb('source_basis'),
  requestedBy: integer('requested_by'),
  approvedBy: integer('approved_by'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'expired'] })
    .notNull()
    .default('pending'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

export const pcAuditEventsTable = pgTable('pc_audit_events', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id').references(() => pcMattersTable.id),
  orgId: integer('org_id').notNull(),
  actorId: integer('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcWitnessesTable = pgTable('pc_witnesses', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['fact', 'expert', 'character', 'treating_physician', 'corporate_rep'],
  }).notNull(),
  affiliation: text('affiliation'),
  contactInfo: text('contact_info'),
  deposed: boolean('deposed').default(false),
  depositionDate: timestamp('deposition_date'),
  keyTestimony: text('key_testimony'),
  credibility: text('credibility', { enum: ['strong', 'moderate', 'weak', 'unknown'] }).default(
    'unknown',
  ),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDocumentChunksTable = pgTable('pc_document_chunks', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  documentRef: text('document_ref').notNull(),
  documentType: text('document_type', {
    enum: [
      'medical_record',
      'bill',
      'correspondence',
      'pleading',
      'discovery',
      'deposition_transcript',
      'expert_report',
      'photo',
      'police_report',
      'insurance_doc',
      'other',
    ],
  }).notNull(),
  chunkIndex: integer('chunk_index').default(0),
  content: text('content'),
  extractedFacts: jsonb('extracted_facts'),
  privilegeFlag: boolean('privilege_flag').default(false),
  reviewState: text('review_state', {
    enum: ['unreviewed', 'reviewed', 'flagged', 'redacted'],
  }).default('unreviewed'),
  isGenerated: boolean('is_generated').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcPrivilegeFlagsTable = pgTable('pc_privilege_flags', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  flagType: text('flag_type', {
    enum: ['attorney_client', 'work_product', 'joint_defense', 'common_interest'],
  }).notNull(),
  flaggedBy: integer('flagged_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcInconsistencyFlagsTable = pgTable('pc_inconsistency_flags', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  flagType: text('flag_type', {
    enum: [
      'factual_conflict',
      'chronology_gap',
      'treatment_gap',
      'document_conflict',
      'testimony_conflict',
    ],
  }).notNull(),
  description: text('description').notNull(),
  sourceA: text('source_a'),
  sourceB: text('source_b'),
  severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['open', 'resolved', 'dismissed'] })
    .notNull()
    .default('open'),
  resolvedBy: integer('resolved_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcExportsTable = pgTable('pc_exports', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id').references(() => pcMattersTable.id),
  orgId: integer('org_id').notNull(),
  exportType: text('export_type', {
    enum: [
      'demand_packet',
      'review_packet',
      'audit_report',
      'matter_summary',
      'medical_chronology',
      'damages_summary',
      'bulk_export',
    ],
  }).notNull(),
  format: text('format', { enum: ['pdf', 'docx', 'csv', 'json'] }).notNull(),
  scope: jsonb('scope'),
  status: text('status', { enum: ['pending', 'generating', 'complete', 'failed'] })
    .notNull()
    .default('pending'),
  exportedBy: integer('exported_by'),
  approvedBy: integer('approved_by'),
  filePath: text('file_path'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcMatterTagsTable = pgTable('pc_matter_tags', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcConnectorAccountsTable = pgTable('pc_connector_accounts', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  connectorType: text('connector_type', {
    enum: ['microsoft_365', 'filevine', 'clio', 'litify', 'docusign', 'file_upload', 'custom'],
  }).notNull(),
  displayName: text('display_name').notNull(),
  status: text('status', { enum: ['active', 'inactive', 'error', 'pending_auth'] })
    .notNull()
    .default('pending_auth'),
  config: jsonb('config'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcConnectorSyncRunsTable = pgTable('pc_connector_sync_runs', {
  id: serial('id').primaryKey(),
  connectorAccountId: integer('connector_account_id')
    .notNull()
    .references(() => pcConnectorAccountsTable.id),
  status: text('status', { enum: ['running', 'completed', 'partial_failure', 'failed'] }).notNull(),
  recordsSynced: integer('records_synced').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorDetails: jsonb('error_details'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const pcPlaybooksTable = pgTable('pc_playbooks', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  matterType: text('matter_type'),
  steps: jsonb('steps'),
  requiredArtifacts: jsonb('required_artifacts'),
  approvalCheckpoints: jsonb('approval_checkpoints'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcTasksTable = pgTable('pc_tasks', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  playbookId: integer('playbook_id').references(() => pcPlaybooksTable.id),
  title: text('title').notNull(),
  description: text('description'),
  assignedTo: integer('assigned_to'),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['pending', 'in_progress', 'review', 'completed', 'blocked'] })
    .notNull()
    .default('pending'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  source: text('source', { enum: ['manual', 'ai_recommendation', 'playbook', 'clock_rule'] }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertMatterSchema = createInsertSchema(pcMattersTable);
export const insertPartySchema = createInsertSchema(pcPartiesTable);
export const insertClaimSchema = createInsertSchema(pcClaimsTable);
export const insertOfferSchema = createInsertSchema(pcOffersTable);
export const insertMedicalEventSchema = createInsertSchema(pcMedicalEventsTable);
export const insertDamagesSchema = createInsertSchema(pcDamagesTable);
export const insertLienSchema = createInsertSchema(pcLiensTable);
export const insertDeadlineSchema = createInsertSchema(pcDeadlinesTable);
export const insertForecastSchema = createInsertSchema(pcForecastsTable);
export type PcMatter = typeof pcMattersTable.$inferSelect;
export type PcParty = typeof pcPartiesTable.$inferSelect;
export type PcClaim = typeof pcClaimsTable.$inferSelect;
export type PcOffer = typeof pcOffersTable.$inferSelect;
export type PcMedicalEvent = typeof pcMedicalEventsTable.$inferSelect;
export type PcDamages = typeof pcDamagesTable.$inferSelect;
export type PcLien = typeof pcLiensTable.$inferSelect;
export type PcDeadline = typeof pcDeadlinesTable.$inferSelect;
export type PcForecast = typeof pcForecastsTable.$inferSelect;
export type PcReadinessScore = typeof pcReadinessScoresTable.$inferSelect;
export type PcCommunication = typeof pcCommunicationsTable.$inferSelect;
export type PcAiRecommendation = typeof pcAiRecommendationsTable.$inferSelect;
export type PcApprovalRequest = typeof pcApprovalRequestsTable.$inferSelect;
export type PcAuditEvent = typeof pcAuditEventsTable.$inferSelect;
export type PcWitness = typeof pcWitnessesTable.$inferSelect;
export type PcDocumentChunk = typeof pcDocumentChunksTable.$inferSelect;
export type PcPrivilegeFlag = typeof pcPrivilegeFlagsTable.$inferSelect;
export type PcInconsistencyFlag = typeof pcInconsistencyFlagsTable.$inferSelect;
export type PcExport = typeof pcExportsTable.$inferSelect;
export type PcMatterTag = typeof pcMatterTagsTable.$inferSelect;
export type PcConnectorAccount = typeof pcConnectorAccountsTable.$inferSelect;
export type PcConnectorSyncRun = typeof pcConnectorSyncRunsTable.$inferSelect;
export type PcPlaybook = typeof pcPlaybooksTable.$inferSelect;
export type PcTask = typeof pcTasksTable.$inferSelect;

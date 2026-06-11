import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { pcMattersTable } from './prism_counsel.js';

export const pcMatterClocksTable = pgTable('pc_matter_clocks', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  clockType: text('clock_type', {
    enum: [
      'no_fault_notice',
      'no_fault_verification',
      'no_fault_arbitration',
      'disclaimer_timeliness',
      'eum_demand',
      'sol_tolling',
      'discovery_clock',
      'imc_verification',
      'peer_review_window',
    ],
  }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  deadlineAt: timestamp('deadline_at').notNull(),
  status: text('status', { enum: ['running', 'breached', 'met', 'tolled', 'waived'] })
    .notNull()
    .default('running'),
  daysRemaining: integer('days_remaining'),
  isBreached: boolean('is_breached').default(false),
  breachedAt: timestamp('breached_at'),
  ruleRef: text('rule_ref'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcClockEventsTable = pgTable('pc_clock_events', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  clockId: integer('clock_id')
    .notNull()
    .references(() => pcMatterClocksTable.id, { onDelete: 'cascade' }),
  eventType: text('event_type', {
    enum: ['start', 'toll', 'resume', 'breach', 'cure', 'waive', 'extend', 'close'],
  }).notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  description: text('description'),
  sourceDocument: text('source_document'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcNyRuleProfilesTable = pgTable('pc_ny_rule_profiles', {
  id: serial('id').primaryKey(),
  ruleId: text('rule_id').notNull().unique(),
  category: text('category', {
    enum: [
      'no_fault',
      'disclaimer',
      'discovery',
      'statute_of_limitations',
      'court_rules',
      'mediation',
      'arbitration',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dayLimit: integer('day_limit'),
  consequence: text('consequence'),
  citation: text('citation'),
  lastReviewed: timestamp('last_reviewed'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcNoFaultClaimsTable = pgTable('pc_no_fault_claims', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  claimantName: text('claimant_name').notNull(),
  carrierId: integer('carrier_id'),
  carrierName: text('carrier_name'),
  assignorName: text('assignor_name'),
  dateOfLoss: timestamp('date_of_loss').notNull(),
  noticeSentAt: timestamp('notice_sent_at'),
  noticeDueDate: timestamp('notice_due_date'),
  noticeStatus: text('notice_status', { enum: ['pending', 'timely', 'late', 'disputed'] })
    .notNull()
    .default('pending'),
  billStatus: text('bill_status', { enum: ['open', 'partial', 'paid', 'denied', 'arbitration'] })
    .notNull()
    .default('open'),
  totalBilled: numeric('total_billed', { precision: 14, scale: 2 }),
  totalPaid: numeric('total_paid', { precision: 14, scale: 2 }),
  totalDenied: numeric('total_denied', { precision: 14, scale: 2 }),
  arbitrationStatus: text('arbitration_status', {
    enum: ['not_filed', 'pending', 'scheduled', 'heard', 'awarded', 'appealed'],
  })
    .notNull()
    .default('not_filed'),
  arbitrationFiledAt: timestamp('arbitration_filed_at'),
  awardAmount: numeric('award_amount', { precision: 14, scale: 2 }),
  evidenceLockRisk: integer('evidence_lock_risk'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcVerificationRequestsTable = pgTable('pc_verification_requests', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  noFaultClaimId: integer('no_fault_claim_id').references(() => pcNoFaultClaimsTable.id),
  requestType: text('request_type', {
    enum: ['euo', 'imc', 'peer_review', 'additional_verification', 'examination'],
  }).notNull(),
  requestedBy: text('requested_by'),
  requestedAt: timestamp('requested_at').notNull(),
  dueDate: timestamp('due_date'),
  responseAt: timestamp('response_at'),
  status: text('status', {
    enum: ['pending', 'scheduled', 'completed', 'failed_to_appear', 'disputed', 'waived'],
  })
    .notNull()
    .default('pending'),
  outcome: text('outcome'),
  suspensionTrigger: boolean('suspension_trigger').default(false),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDenialsTable = pgTable('pc_denials', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  noFaultClaimId: integer('no_fault_claim_id').references(() => pcNoFaultClaimsTable.id),
  denialType: text('denial_type', {
    enum: [
      'no_fault_bill',
      'bodily_injury',
      'coverage',
      'late_notice',
      'policy_exclusion',
      'fraud',
    ],
  }).notNull(),
  deniedBy: text('denied_by'),
  deniedAt: timestamp('denied_at').notNull(),
  denialReason: text('denial_reason'),
  denialCode: text('denial_code'),
  amountDenied: numeric('amount_denied', { precision: 14, scale: 2 }),
  appealStatus: text('appeal_status', {
    enum: ['not_appealed', 'pending', 'filed', 'decided', 'exhausted'],
  })
    .notNull()
    .default('not_appealed'),
  appealDeadline: timestamp('appeal_deadline'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDisclaimersTable = pgTable('pc_disclaimers', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  issuedBy: text('issued_by'),
  issuedAt: timestamp('issued_at').notNull(),
  dueDate: timestamp('due_date'),
  isTimely: boolean('is_timely'),
  daysFromLoss: integer('days_from_loss'),
  basis: text('basis'),
  policyExclusion: text('policy_exclusion'),
  vulnerabilityScore: integer('vulnerability_score'),
  challengeStatus: text('challenge_status', {
    enum: ['unchallenged', 'challenged', 'defeated', 'upheld'],
  })
    .notNull()
    .default('unchallenged'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcCoveragePositionsTable = pgTable('pc_coverage_positions', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  positionType: text('position_type', {
    enum: [
      'coverage_affirmed',
      'coverage_denied',
      'reservation_of_rights',
      'partial_coverage',
      'disclaimer_issued',
    ],
  }).notNull(),
  carrierName: text('carrier_name'),
  positionDate: timestamp('position_date').notNull(),
  coverageAmount: numeric('coverage_amount', { precision: 14, scale: 2 }),
  reservationBasis: text('reservation_basis'),
  policyRef: text('policy_ref'),
  analysisNotes: text('analysis_notes'),
  disputeStrength: text('dispute_strength', { enum: ['strong', 'moderate', 'weak', 'unknown'] }),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcMedicalBillCyclesTable = pgTable('pc_medical_bill_cycles', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  noFaultClaimId: integer('no_fault_claim_id').references(() => pcNoFaultClaimsTable.id),
  providerName: text('provider_name').notNull(),
  serviceDate: timestamp('service_date').notNull(),
  submittedDate: timestamp('submitted_date'),
  billedAmount: numeric('billed_amount', { precision: 12, scale: 2 }),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }),
  deniedAmount: numeric('denied_amount', { precision: 12, scale: 2 }),
  status: text('status', {
    enum: ['submitted', 'paid', 'partially_paid', 'denied', 'arbitration', 'withdrawn'],
  })
    .notNull()
    .default('submitted'),
  denialReason: text('denial_reason'),
  daysToResponse: integer('days_to_response'),
  isLate: boolean('is_late').default(false),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcOfferMovementsTable = pgTable('pc_offer_movements', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  offerType: text('offer_type', {
    enum: [
      'plaintiff_demand',
      'insurer_offer',
      'counter_offer',
      'mediator_proposal',
      'nuisance_offer',
      'policy_limit_tender',
    ],
  }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  offeringParty: text('offering_party'),
  offeredAt: timestamp('offered_at').notNull(),
  expiresAt: timestamp('expires_at'),
  deltaFromPrevious: numeric('delta_from_previous', { precision: 14, scale: 2 }),
  deltaPct: numeric('delta_pct', { precision: 7, scale: 2 }),
  movementSignal: text('movement_signal', {
    enum: ['approaching', 'stalling', 'retreating', 'opening', 'closing'],
  }),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcReserveMovementsTable = pgTable('pc_reserve_movements', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  carrierId: integer('carrier_id'),
  carrierName: text('carrier_name'),
  reserveAmount: numeric('reserve_amount', { precision: 14, scale: 2 }).notNull(),
  priorReserve: numeric('prior_reserve', { precision: 14, scale: 2 }),
  delta: numeric('delta', { precision: 14, scale: 2 }),
  reserveDate: timestamp('reserve_date').notNull(),
  movementType: text('movement_type', { enum: ['increase', 'decrease', 'set', 'close'] }).notNull(),
  inferredSignal: text('inferred_signal'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcMediationEventsTable = pgTable('pc_mediation_events', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  mediatorName: text('mediator_name'),
  scheduledAt: timestamp('scheduled_at'),
  location: text('location'),
  sessionType: text('session_type', {
    enum: ['court_ordered', 'voluntary', 'imc', 'panel', 'mini_trial'],
  })
    .notNull()
    .default('court_ordered'),
  status: text('status', {
    enum: ['pending', 'scheduled', 'completed', 'adjourned', 'no_settlement', 'settled'],
  })
    .notNull()
    .default('pending'),
  preReadinessScore: integer('pre_readiness_score'),
  conversionProbability: numeric('conversion_probability', { precision: 5, scale: 2 }),
  settlementAmount: numeric('settlement_amount', { precision: 14, scale: 2 }),
  openingDemand: numeric('opening_demand', { precision: 14, scale: 2 }),
  openingOffer: numeric('opening_offer', { precision: 14, scale: 2 }),
  outcome: text('outcome'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcVenueProfilesTable = pgTable('pc_venue_profiles', {
  id: serial('id').primaryKey(),
  county: text('county').notNull(),
  courtName: text('court_name').notNull(),
  courtType: text('court_type', {
    enum: ['supreme', 'civil', 'district', 'appellate', 'federal'],
  }).notNull(),
  averageCycleMonths: integer('average_cycle_months'),
  medianVerdictAuto: numeric('median_verdict_auto', { precision: 14, scale: 2 }),
  medianVerdictPremises: numeric('median_verdict_premises', { precision: 14, scale: 2 }),
  medianVerdictCoverage: numeric('median_verdict_coverage', { precision: 14, scale: 2 }),
  plaintiffFriendliness: text('plaintiff_friendliness', {
    enum: ['very_high', 'high', 'moderate', 'low', 'very_low'],
  }),
  adrAvailability: text('adr_availability', {
    enum: ['mandatory', 'available', 'limited', 'none'],
  }),
  conferenceFrequency: text('conference_frequency'),
  typicalPartsAssigned: text('typical_parts_assigned'),
  specialRules: jsonb('special_rules'),
  filingExpectations: text('filing_expectations'),
  velocityScore: integer('velocity_score'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcPartProfilesTable = pgTable('pc_part_profiles', {
  id: serial('id').primaryKey(),
  venueId: integer('venue_id').references(() => pcVenueProfilesTable.id),
  partName: text('part_name').notNull(),
  judgeName: text('judge_name'),
  trackType: text('track_type', { enum: ['standard', 'expedited', 'complex', 'trial_ready'] }),
  conferenceRules: text('conference_rules'),
  discoveryTimeline: text('discovery_timeline'),
  mediationPolicy: text('mediation_policy'),
  dispositionHistory: jsonb('disposition_history'),
  velocityScore: integer('velocity_score'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcInsurerProfilesTable = pgTable('pc_insurer_profiles', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  carrierName: text('carrier_name').notNull(),
  claimOffice: text('claim_office'),
  region: text('region'),
  reservingStyle: text('reserving_style', {
    enum: ['aggressive', 'conservative', 'market', 'unknown'],
  }),
  denialPattern: text('denial_pattern'),
  medianFirstOffer: numeric('median_first_offer', { precision: 14, scale: 2 }),
  averageResponseDays: integer('average_response_days'),
  mediationBehavior: text('mediation_behavior', {
    enum: ['cooperative', 'resistant', 'strategic', 'unpredictable'],
  }),
  escalationThreshold: numeric('escalation_threshold', { precision: 14, scale: 2 }),
  litigationTolerance: text('litigation_tolerance', { enum: ['high', 'moderate', 'low'] }),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcAdjusterProfilesTable = pgTable('pc_adjuster_profiles', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  insurerProfileId: integer('insurer_profile_id').references(() => pcInsurerProfilesTable.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  claimOffice: text('claim_office'),
  negotiationStyle: text('negotiation_style', {
    enum: ['collaborative', 'adversarial', 'by_the_book', 'delay_tactics'],
  }),
  averageResponseDays: integer('average_response_days'),
  decisionAuthority: numeric('decision_authority', { precision: 14, scale: 2 }),
  historicalNotes: text('historical_notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcCommunicationWindowsTable = pgTable('pc_communication_windows', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  partyName: text('party_name').notNull(),
  partyRole: text('party_role', {
    enum: ['insurer', 'adjuster', 'opposing_counsel', 'mediator', 'court'],
  }).notNull(),
  lastContactAt: timestamp('last_contact_at'),
  daysSilent: integer('days_silent'),
  silenceRisk: text('silence_risk', { enum: ['none', 'low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('none'),
  expectedResponseDays: integer('expected_response_days'),
  outstandingItems: jsonb('outstanding_items'),
  escalationStatus: text('escalation_status', {
    enum: ['none', 'sent', 'pending_response', 'escalated'],
  })
    .notNull()
    .default('none'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcDemandPacketsTable = pgTable('pc_demand_packets', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  status: text('status', { enum: ['draft', 'review', 'approved', 'sent', 'responded'] })
    .notNull()
    .default('draft'),
  demandAmount: numeric('demand_amount', { precision: 14, scale: 2 }),
  readinessScore: integer('readiness_score'),
  missingItems: jsonb('missing_items'),
  includedItems: jsonb('included_items'),
  sentAt: timestamp('sent_at'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  responseAt: timestamp('response_at'),
  responseAmount: numeric('response_amount', { precision: 14, scale: 2 }),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcDemandReadinessSnapshotsTable = pgTable('pc_demand_readiness_snapshots', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  overallScore: integer('overall_score').notNull(),
  medicalChronologyScore: integer('medical_chronology_score'),
  liabilityScore: integer('liability_score'),
  damagesScore: integer('damages_score'),
  lienScore: integer('lien_score'),
  photographicScore: integer('photographic_score'),
  witnessScore: integer('witness_score'),
  expertScore: integer('expert_score'),
  missingItems: jsonb('missing_items'),
  blockingItems: jsonb('blocking_items'),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
});

export const pcForecastRunsTable = pgTable('pc_forecast_runs', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  forecastType: text('forecast_type', {
    enum: [
      'deadline_breach_risk',
      'no_fault_evidence_lock_risk',
      'disclaimer_vulnerability_score',
      'demand_readiness_score',
      'offer_movement_forecast',
      'mediation_conversion_probability',
      'venue_velocity_forecast',
      'ai_defensibility_score',
    ],
  }).notNull(),
  score: numeric('score', { precision: 7, scale: 2 }).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }),
  weeklyDelta: numeric('weekly_delta', { precision: 7, scale: 2 }),
  nextBestAction: text('next_best_action'),
  modelVersion: text('model_version'),
  runAt: timestamp('run_at').notNull().defaultNow(),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
});

export const pcForecastDriversTable = pgTable('pc_forecast_drivers', {
  id: serial('id').primaryKey(),
  forecastRunId: integer('forecast_run_id')
    .notNull()
    .references(() => pcForecastRunsTable.id, { onDelete: 'cascade' }),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id'),
  driverName: text('driver_name').notNull(),
  driverValue: text('driver_value'),
  impact: text('impact', { enum: ['positive', 'negative', 'neutral'] }).notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  explanation: text('explanation'),
  sourceRef: text('source_ref'),
  sourceLineage: text('source_lineage'),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcForecastExplanationsTable = pgTable('pc_forecast_explanations', {
  id: serial('id').primaryKey(),
  forecastRunId: integer('forecast_run_id')
    .notNull()
    .references(() => pcForecastRunsTable.id, { onDelete: 'cascade' }),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id'),
  headline: text('headline'),
  detail: text('detail'),
  recommendations: jsonb('recommendations'),
  citations: jsonb('citations'),
  isPrivileged: boolean('is_privileged').default(false),
  sourceLineage: text('source_lineage'),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcAiReviewPacketsTable = pgTable('pc_ai_review_packets', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  reviewType: text('review_type', {
    enum: [
      'demand_packet',
      'chronology',
      'coverage_analysis',
      'negotiation_memo',
      'deposition_prep',
      'mediation_brief',
      'forecast_review',
    ],
  }).notNull(),
  generatedContent: text('generated_content'),
  sourceReferences: jsonb('source_references'),
  groundingScore: integer('grounding_score'),
  flaggedAssertions: jsonb('flagged_assertions'),
  status: text('status', { enum: ['draft', 'pending_review', 'approved', 'rejected', 'revised'] })
    .notNull()
    .default('draft'),
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  modelRoute: text('model_route'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  actorId: integer('actor_id'),
  sourceLineage: text('source_lineage'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDefensibilityScoresTable = pgTable('pc_defensibility_scores', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  overallScore: integer('overall_score').notNull(),
  groundingScore: integer('grounding_score'),
  humanApprovalScore: integer('human_approval_score'),
  privilegeScore: integer('privilege_score'),
  auditCompleteness: integer('audit_completeness'),
  sourceAttributionScore: integer('source_attribution_score'),
  openFlags: integer('open_flags').default(0),
  flagDetails: jsonb('flag_details'),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
  actorId: integer('actor_id'),
  exportFlag: boolean('export_flag').default(false),
});

export const pcClockRulesTable = pgTable('pc_clock_rules', {
  id: serial('id').primaryKey(),
  ruleId: text('rule_id').notNull().unique(),
  clockType: text('clock_type', {
    enum: [
      'no_fault_notice',
      'no_fault_verification',
      'no_fault_arbitration',
      'disclaimer_timeliness',
      'eum_demand',
      'sol_tolling',
      'discovery_clock',
      'imc_verification',
      'peer_review_window',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dayLimit: integer('day_limit').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  consequence: text('consequence'),
  citation: text('citation'),
  isMandatory: boolean('is_mandatory').default(true),
  appliesTo: text('applies_to', { enum: ['no_fault', 'bodily_injury', 'coverage', 'all'] })
    .notNull()
    .default('all'),
  isActive: boolean('is_active').default(true),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(false),
  exportFlag: boolean('export_flag').default(false),
  lastReviewed: timestamp('last_reviewed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcAppealsTable = pgTable('pc_appeals', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  denialId: integer('denial_id').references(() => pcDenialsTable.id),
  noFaultClaimId: integer('no_fault_claim_id').references(() => pcNoFaultClaimsTable.id),
  appealType: text('appeal_type', {
    enum: ['administrative', 'arbitration', 'court', 'sup_ct_article_75', 'appellate_division'],
  }).notNull(),
  filedAt: timestamp('filed_at'),
  deadlineAt: timestamp('deadline_at'),
  status: text('status', {
    enum: ['not_filed', 'pending', 'filed', 'briefed', 'argued', 'decided', 'withdrawn'],
  })
    .notNull()
    .default('not_filed'),
  outcome: text('outcome', { enum: ['pending', 'granted', 'denied', 'settled', 'withdrawn'] }),
  decisionDate: timestamp('decision_date'),
  decisionNotes: text('decision_notes'),
  appealingParty: text('appealing_party'),
  groundsForAppeal: text('grounds_for_appeal'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcExternalAppealsTable = pgTable('pc_external_appeals', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  matterId: integer('matter_id')
    .notNull()
    .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
  appealId: integer('appeal_id').references(() => pcAppealsTable.id),
  tribunal: text('tribunal').notNull(),
  tribunalCaseNo: text('tribunal_case_no'),
  panelComposition: text('panel_composition'),
  hearingDate: timestamp('hearing_date'),
  filingDeadline: timestamp('filing_deadline'),
  status: text('status', {
    enum: ['pending', 'scheduled', 'heard', 'decided', 'remanded', 'withdrawn'],
  })
    .notNull()
    .default('pending'),
  awardAmount: numeric('award_amount', { precision: 14, scale: 2 }),
  outcome: text('outcome'),
  representingCounsel: text('representing_counsel'),
  notes: text('notes'),
  sourceLineage: text('source_lineage'),
  actorId: integer('actor_id'),
  isPrivileged: boolean('is_privileged').default(true),
  exportFlag: boolean('export_flag').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PcMatterClock = typeof pcMatterClocksTable.$inferSelect;
export type PcClockEvent = typeof pcClockEventsTable.$inferSelect;
export type PcNyRuleProfile = typeof pcNyRuleProfilesTable.$inferSelect;
export type PcNoFaultClaim = typeof pcNoFaultClaimsTable.$inferSelect;
export type PcVerificationRequest = typeof pcVerificationRequestsTable.$inferSelect;
export type PcDenial = typeof pcDenialsTable.$inferSelect;
export type PcDisclaimer = typeof pcDisclaimersTable.$inferSelect;
export type PcCoveragePosition = typeof pcCoveragePositionsTable.$inferSelect;
export type PcMedicalBillCycle = typeof pcMedicalBillCyclesTable.$inferSelect;
export type PcOfferMovement = typeof pcOfferMovementsTable.$inferSelect;
export type PcReserveMovement = typeof pcReserveMovementsTable.$inferSelect;
export type PcMediationEvent = typeof pcMediationEventsTable.$inferSelect;
export type PcVenueProfile = typeof pcVenueProfilesTable.$inferSelect;
export type PcPartProfile = typeof pcPartProfilesTable.$inferSelect;
export type PcInsurerProfile = typeof pcInsurerProfilesTable.$inferSelect;
export type PcAdjusterProfile = typeof pcAdjusterProfilesTable.$inferSelect;
export type PcCommunicationWindow = typeof pcCommunicationWindowsTable.$inferSelect;
export type PcDemandPacket = typeof pcDemandPacketsTable.$inferSelect;
export type PcDemandReadinessSnapshot = typeof pcDemandReadinessSnapshotsTable.$inferSelect;
export type PcForecastRun = typeof pcForecastRunsTable.$inferSelect;
export type PcForecastDriver = typeof pcForecastDriversTable.$inferSelect;
export type PcForecastExplanation = typeof pcForecastExplanationsTable.$inferSelect;
export type PcAiReviewPacket = typeof pcAiReviewPacketsTable.$inferSelect;
export type PcDefensibilityScore = typeof pcDefensibilityScoresTable.$inferSelect;
export type PcClockRule = typeof pcClockRulesTable.$inferSelect;
export type PcAppeal = typeof pcAppealsTable.$inferSelect;
export type PcExternalAppeal = typeof pcExternalAppealsTable.$inferSelect;

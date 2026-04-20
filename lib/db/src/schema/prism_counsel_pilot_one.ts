import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { pcMattersTable } from './prism_counsel';

/* ─── Insurer Pressure Snapshots ─────────────────────────────────────────── */

export const pcInsurerPressureSnapshotsTable = pgTable(
  'pc_insurer_pressure_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    overallScore: real('overall_score').notNull(),
    priorScore: real('prior_score'),
    direction: text('direction', { enum: ['rising', 'falling', 'stable', 'new'] })
      .notNull()
      .default('new'),
    confidence: real('confidence').notNull().default(0.7),
    operationalMeaning: text('operational_meaning'),
    recommendedNextAction: text('recommended_next_action'),
    carrierName: text('carrier_name'),
    adjusterId: integer('adjuster_id'),
    recentSignals: jsonb('recent_signals'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    modelVersion: text('model_version').default('v1'),
    requiresReview: boolean('requires_review').default(false),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    freshnessScore: real('freshness_score'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_ip_snap_matter_idx').on(t.matterId),
    index('pc_ip_snap_org_idx').on(t.orgId),
    index('pc_ip_snap_computed_idx').on(t.computedAt),
  ],
);

export const pcInsurerPressureDriversTable = pgTable(
  'pc_insurer_pressure_drivers',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    snapshotId: integer('snapshot_id').references(() => pcInsurerPressureSnapshotsTable.id, {
      onDelete: 'cascade',
    }),
    driverName: text('driver_name').notNull(),
    driverCategory: text('driver_category', {
      enum: [
        'response_latency',
        'silence_window',
        'partial_response',
        'verification_churn',
        'denial_frequency',
        'offer_movement',
        'reserve_movement',
        'escalation_responsiveness',
        'adjuster_handoff',
        'matter_stage_sensitivity',
        'historic_firm_experience',
        'posture_hardening',
      ],
    }).notNull(),
    weight: real('weight').notNull().default(0.5),
    impact: text('impact', { enum: ['positive', 'negative', 'neutral'] }).notNull(),
    rawValue: text('raw_value'),
    explanation: text('explanation'),
    sourceRef: text('source_ref'),
    sourceClass: text('source_class'),
    confidence: real('confidence'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_ip_drivers_matter_idx').on(t.matterId),
    index('pc_ip_drivers_snap_idx').on(t.snapshotId),
  ],
);

/* ─── Settlement Friction Snapshots ─────────────────────────────────────── */

export const pcSettlementFrictionSnapshotsTable = pgTable(
  'pc_settlement_friction_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    overallScore: real('overall_score').notNull(),
    priorScore: real('prior_score'),
    direction: text('direction', { enum: ['rising', 'falling', 'stable', 'new'] })
      .notNull()
      .default('new'),
    confidence: real('confidence').notNull().default(0.7),
    readinessDragDays: integer('readiness_drag_days'),
    frictionClass: text('friction_class', { enum: ['internal', 'external', 'mixed'] })
      .notNull()
      .default('mixed'),
    smallestAction: text('smallest_action'),
    requiresReview: boolean('requires_review').default(false),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    modelVersion: text('model_version').default('v1'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    freshnessScore: real('freshness_score'),
    generatedByService: text('generated_by_service').default('settlement_friction_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_sf_snap_matter_idx').on(t.matterId),
    index('pc_sf_snap_org_idx').on(t.orgId),
    index('pc_sf_snap_computed_idx').on(t.computedAt),
  ],
);

export const pcSettlementFrictionDriversTable = pgTable(
  'pc_settlement_friction_drivers',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    snapshotId: integer('snapshot_id').references(() => pcSettlementFrictionSnapshotsTable.id, {
      onDelete: 'cascade',
    }),
    driverName: text('driver_name').notNull(),
    blockerCategory: text('blocker_category', {
      enum: [
        'internal_process',
        'carrier_insurer',
        'evidence',
        'medical_damages',
        'governance_review',
        'venue_timing',
        'recovery_lien',
      ],
    }).notNull(),
    weight: real('weight').notNull().default(0.5),
    impact: text('impact', { enum: ['positive', 'negative', 'neutral'] }).notNull(),
    rawValue: text('raw_value'),
    explanation: text('explanation'),
    sourceRef: text('source_ref'),
    sourceClass: text('source_class'),
    confidence: real('confidence'),
    dragEstimateDays: integer('drag_estimate_days'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('settlement_friction_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_sf_drivers_matter_idx').on(t.matterId),
    index('pc_sf_drivers_snap_idx').on(t.snapshotId),
  ],
);

/* ─── Movement Recommendations ──────────────────────────────────────────── */

export const pcMovementRecommendationsTable = pgTable(
  'pc_movement_recommendations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    recommendationType: text('recommendation_type', {
      enum: [
        'reduce_friction',
        'counter_pressure',
        'unlock_movement',
        'improve_readiness',
        'carrier_engagement',
        'lien_resolution',
        'evidence_completion',
        'review_acceleration',
      ],
    }).notNull(),
    title: text('title').notNull(),
    explanation: text('explanation').notNull(),
    estimatedImpact: text('estimated_impact'),
    confidence: real('confidence'),
    priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    estimatedMinutes: integer('estimated_minutes'),
    status: text('status', { enum: ['suggested', 'accepted', 'dismissed', 'completed'] })
      .notNull()
      .default('suggested'),
    acceptedBy: integer('accepted_by'),
    acceptedAt: timestamp('accepted_at'),
    completedAt: timestamp('completed_at'),
    sourceRef: text('source_ref'),
    sourceClass: text('source_class'),
    proofChainRef: text('proof_chain_ref'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service'),
    requiresApproval: boolean('requires_approval').default(false),
    approvalId: integer('approval_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_mv_rec_matter_idx').on(t.matterId),
    index('pc_mv_rec_org_idx').on(t.orgId),
    index('pc_mv_rec_status_idx').on(t.status),
  ],
);

/* ─── Quiet Risk Snapshots (expanded) ───────────────────────────────────── */

export const pcQuietRiskSnapshotsTable = pgTable(
  'pc_quiet_risk_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    riskScore: real('risk_score').notNull(),
    priorScore: real('prior_score'),
    deteriorationRate: real('deterioration_rate'),
    topSignals: jsonb('top_signals'),
    silentDimensions: jsonb('silent_dimensions'),
    daysWithoutActivity: integer('days_without_activity'),
    lastPositiveEventAt: timestamp('last_positive_event_at'),
    recommendedAction: text('recommended_action'),
    confidence: real('confidence'),
    requiresReview: boolean('requires_review').default(false),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    modelVersion: text('model_version').default('v1'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('portfolio_learning'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_qr_snap_matter_idx').on(t.matterId), index('pc_qr_snap_org_idx').on(t.orgId)],
);

/* ─── Carrier Behavior Patterns ──────────────────────────────────────────── */

export const pcCarrierBehaviorPatternsTable = pgTable(
  'pc_carrier_behavior_patterns',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    carrierName: text('carrier_name').notNull(),
    claimOffice: text('claim_office'),
    patternType: text('pattern_type', {
      enum: [
        'silence_delay',
        'verification_churn',
        'hardening_posture',
        'softening_posture',
        'reserve_increase',
        'denial_clustering',
        'adjuster_rotation',
        'escalation_avoidance',
        'offer_stall',
        'mediation_resistance',
        'early_settlement_tendency',
      ],
    }).notNull(),
    description: text('description'),
    evidenceCount: integer('evidence_count').notNull().default(1),
    lastSeen: timestamp('last_seen').notNull().defaultNow(),
    firstSeen: timestamp('first_seen').notNull().defaultNow(),
    confidence: real('confidence'),
    operationalImplication: text('operational_implication'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    freshnessScore: real('freshness_score'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_carrier_pat_org_idx').on(t.orgId),
    index('pc_carrier_pat_name_idx').on(t.carrierName),
    index('pc_carrier_pat_type_idx').on(t.patternType),
  ],
);

export const pcCarrierResponseEventsTable = pgTable(
  'pc_carrier_response_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    carrierName: text('carrier_name').notNull(),
    adjusterId: integer('adjuster_id'),
    eventType: text('event_type', {
      enum: [
        'response_received',
        'silence_detected',
        'adjuster_changed',
        'escalation_triggered',
        'offer_made',
        'denial_issued',
        'verification_requested',
        'reserve_changed',
        'posture_shift',
      ],
    }).notNull(),
    description: text('description'),
    daysSinceLastContact: integer('days_since_last_contact'),
    signalStrength: real('signal_strength'),
    pressureImpact: text('pressure_impact', { enum: ['increases', 'decreases', 'neutral'] }),
    sourceRef: text('source_ref'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_carrier_ev_matter_idx').on(t.matterId),
    index('pc_carrier_ev_org_idx').on(t.orgId),
    index('pc_carrier_ev_type_idx').on(t.eventType),
  ],
);

export const pcCarrierSilenceWindowsTable = pgTable(
  'pc_carrier_silence_windows',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    carrierName: text('carrier_name').notNull(),
    adjusterId: integer('adjuster_id'),
    silenceStartAt: timestamp('silence_start_at').notNull(),
    silenceEndAt: timestamp('silence_end_at'),
    daysSilent: integer('days_silent').notNull().default(0),
    isCurrent: boolean('is_current').default(true),
    silenceRisk: text('silence_risk', { enum: ['none', 'low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('low'),
    outstandingItems: jsonb('outstanding_items'),
    escalationSuggested: boolean('escalation_suggested').default(false),
    escalationTemplateKey: text('escalation_template_key'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_silence_matter_idx').on(t.matterId),
    index('pc_silence_org_idx').on(t.orgId),
    index('pc_silence_current_idx').on(t.isCurrent),
  ],
);

export const pcCarrierOfferBehaviorTable = pgTable(
  'pc_carrier_offer_behavior',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    carrierName: text('carrier_name').notNull(),
    offerAmount: numeric('offer_amount', { precision: 14, scale: 2 }),
    priorOfferAmount: numeric('prior_offer_amount', { precision: 14, scale: 2 }),
    movementDelta: numeric('movement_delta', { precision: 14, scale: 2 }),
    movementPct: real('movement_pct'),
    movementSignal: text('movement_signal', {
      enum: ['approaching', 'stalling', 'retreating', 'opening', 'closing', 'new'],
    })
      .notNull()
      .default('new'),
    daysSinceLastOffer: integer('days_since_last_offer'),
    offerDate: timestamp('offer_date').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_offer_beh_matter_idx').on(t.matterId),
    index('pc_offer_beh_org_idx').on(t.orgId),
  ],
);

export const pcCarrierReserveBehaviorTable = pgTable(
  'pc_carrier_reserve_behavior',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    carrierName: text('carrier_name').notNull(),
    reserveAmount: numeric('reserve_amount', { precision: 14, scale: 2 }),
    priorReserve: numeric('prior_reserve', { precision: 14, scale: 2 }),
    delta: numeric('delta', { precision: 14, scale: 2 }),
    movementType: text('movement_type', {
      enum: ['increase', 'decrease', 'set', 'close'],
    }).notNull(),
    inferredSignal: text('inferred_signal'),
    pressureImpact: text('pressure_impact', { enum: ['increases', 'decreases', 'neutral'] }),
    reserveDate: timestamp('reserve_date').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('insurer_pressure_engine'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_reserve_beh_matter_idx').on(t.matterId),
    index('pc_reserve_beh_org_idx').on(t.orgId),
  ],
);

/* ─── Worldline V1 Expansion Tables ─────────────────────────────────────── */

export const pcWorldlineSourceClassesTable = pgTable(
  'pc_worldline_source_classes',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    classKey: text('class_key').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    pilotOneEnabled: boolean('pilot_one_enabled').default(true),
    legalUsefulnessBaseline: real('legal_usefulness_baseline').default(0.7),
    endpointTemplate: text('endpoint_template'),
    fetchMethod: text('fetch_method'),
    totalFetches: integer('total_fetches').default(0),
    lastFetchAt: timestamp('last_fetch_at'),
    status: text('status', { enum: ['active', 'paused', 'error', 'disabled'] })
      .notNull()
      .default('active'),
    tenantId: integer('tenant_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('pc_wl_sc_org_idx').on(t.orgId), index('pc_wl_sc_class_idx').on(t.classKey)],
);

export const pcWorldlineSignalOverlaysTable = pgTable(
  'pc_worldline_signal_overlays',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    signalId: integer('signal_id'),
    sourceClass: text('source_class').notNull(),
    overlayType: text('overlay_type', {
      enum: [
        'regulatory_impact',
        'weather_context',
        'venue_context',
        'demographic_context',
        'lien_exposure',
        'recovery_risk',
        'incident_environment',
      ],
    }).notNull(),
    plainLanguageSummary: text('plain_language_summary').notNull(),
    confidence: real('confidence'),
    freshnessScore: real('freshness_score'),
    provenanceScore: real('provenance_score'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    publishedToPressureGraph: boolean('published_to_pressure_graph').default(false),
    triggeredForecastRecompute: boolean('triggered_forecast_recompute').default(false),
    jurisdiction: text('jurisdiction'),
    county: text('county'),
    geoLat: real('geo_lat'),
    geoLon: real('geo_lon'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('worldline_engine'),
    validUntil: timestamp('valid_until'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_wl_overlay_matter_idx').on(t.matterId),
    index('pc_wl_overlay_org_idx').on(t.orgId),
    index('pc_wl_overlay_class_idx').on(t.sourceClass),
  ],
);

export const pcWorldlineWeatherEventsTable = pgTable(
  'pc_worldline_weather_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    severity: text('severity', { enum: ['extreme', 'severe', 'moderate', 'minor'] }),
    affectedArea: text('affected_area'),
    county: text('county'),
    state: text('state').default('NY'),
    geoLat: real('geo_lat'),
    geoLon: real('geo_lon'),
    onsetAt: timestamp('onset_at'),
    expiresAt: timestamp('expires_at'),
    nwsAlertId: text('nws_alert_id'),
    rawData: jsonb('raw_data'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    freshnessScore: real('freshness_score'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_wl_weather_org_idx').on(t.orgId),
    index('pc_wl_weather_onset_idx').on(t.onsetAt),
    index('pc_wl_weather_county_idx').on(t.county),
  ],
);

export const pcWorldlineCountyProfilesTable = pgTable(
  'pc_worldline_county_profiles',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    county: text('county').notNull(),
    state: text('state').notNull().default('NY'),
    population: integer('population'),
    medianIncome: numeric('median_income', { precision: 14, scale: 2 }),
    povertyRate: real('poverty_rate'),
    vehicleOwnershipRate: real('vehicle_ownership_rate'),
    uninsuredRate: real('uninsured_rate'),
    censusYear: integer('census_year'),
    rawData: jsonb('raw_data'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    freshnessScore: real('freshness_score'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('pc_wl_county_org_idx').on(t.orgId), index('pc_wl_county_name_idx').on(t.county)],
);

export const pcWorldlineRegulatoryEventsTable = pgTable(
  'pc_worldline_regulatory_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    source: text('source').notNull(),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    jurisdiction: text('jurisdiction'),
    affectedCarriers: jsonb('affected_carriers'),
    effectiveDate: timestamp('effective_date'),
    expiresDate: timestamp('expires_date'),
    citation: text('citation'),
    rawData: jsonb('raw_data'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    freshnessScore: real('freshness_score'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_wl_reg_org_idx').on(t.orgId),
    index('pc_wl_reg_source_idx').on(t.source),
    index('pc_wl_reg_effective_idx').on(t.effectiveDate),
  ],
);

export const pcWorldlineRecoveryMarkersTable = pgTable(
  'pc_worldline_recovery_markers',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    markerType: text('marker_type', {
      enum: [
        'cms_msp_threshold',
        'medicare_conditional_payment',
        'medicaid_recovery',
        'erisa_lien_indicator',
        'workers_comp_crossover',
        'subrogation_risk',
      ],
    }).notNull(),
    description: text('description'),
    claimantIdentifier: text('claimant_identifier'),
    estimatedAmount: numeric('estimated_amount', { precision: 14, scale: 2 }),
    mspStatus: text('msp_status'),
    requiresAction: boolean('requires_action').default(false),
    actionDescription: text('action_description'),
    rawData: jsonb('raw_data'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    freshnessScore: real('freshness_score'),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_wl_recovery_org_idx').on(t.orgId),
    index('pc_wl_recovery_matter_idx').on(t.matterId),
  ],
);

/* ─── Portfolio Learning Layer ───────────────────────────────────────────── */

export const pcPortfolioBenchmarkSnapshotsTable = pgTable(
  'pc_portfolio_benchmark_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    benchmarkType: text('benchmark_type', {
      enum: [
        'readiness_band',
        'insurer_pressure_cohort',
        'friction_cohort',
        'cycle_time_band',
        'settlement_range_band',
        'recovery_rate_band',
      ],
    }).notNull(),
    matterType: text('matter_type'),
    band: text('band', { enum: ['p25', 'p50', 'p75', 'p90', 'top10'] }).notNull(),
    metricName: text('metric_name').notNull(),
    metricValue: real('metric_value').notNull(),
    sampleSize: integer('sample_size').default(0),
    confidenceInterval: real('confidence_interval'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('portfolio_learning'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_pb_snap_org_idx').on(t.orgId),
    index('pc_pb_snap_type_idx').on(t.benchmarkType),
  ],
);

export const pcPortfolioActionEffectivenessTable = pgTable(
  'pc_portfolio_action_effectiveness',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    actionType: text('action_type').notNull(),
    matterType: text('matter_type'),
    outcomeMetric: text('outcome_metric').notNull(),
    averageImpact: real('average_impact'),
    successRate: real('success_rate'),
    averageTimeToImpactDays: real('average_time_to_impact_days'),
    sampleSize: integer('sample_size').default(0),
    contextualNote: text('contextual_note'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('portfolio_learning'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_pa_effect_org_idx').on(t.orgId),
    index('pc_pa_effect_action_idx').on(t.actionType),
  ],
);

export const pcPortfolioTeamLagMetricsTable = pgTable(
  'pc_portfolio_team_lag_metrics',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    metricType: text('metric_type', {
      enum: [
        'review_lag',
        'approval_lag',
        'demand_preparation_lag',
        'response_to_carrier_lag',
        'document_processing_lag',
        'mediation_prep_lag',
      ],
    }).notNull(),
    teamRole: text('team_role'),
    avgDays: real('avg_days'),
    medianDays: real('median_days'),
    p90Days: real('p90_days'),
    sampleSize: integer('sample_size').default(0),
    periodDays: integer('period_days').default(90),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('portfolio_learning'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_ptl_metrics_org_idx').on(t.orgId),
    index('pc_ptl_metrics_type_idx').on(t.metricType),
  ],
);

export const pcPortfolioMatterCohortsTable = pgTable(
  'pc_portfolio_matter_cohorts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    cohortType: text('cohort_type', {
      enum: [
        'insurer_pressure',
        'settlement_friction',
        'quiet_risk',
        'movement_ready',
        'high_complexity',
        'stalled',
      ],
    }).notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    cohortScore: real('cohort_score'),
    cohortRank: integer('cohort_rank'),
    cohortPercentile: real('cohort_percentile'),
    keySignals: jsonb('key_signals'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    tenantId: integer('tenant_id'),
    provenance: text('provenance'),
    generatedByService: text('generated_by_service').default('portfolio_learning'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_pm_cohort_org_idx').on(t.orgId),
    index('pc_pm_cohort_type_idx').on(t.cohortType),
    index('pc_pm_cohort_matter_idx').on(t.matterId),
  ],
);

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type PcInsurerPressureSnapshot = typeof pcInsurerPressureSnapshotsTable.$inferSelect;
export type PcInsurerPressureDriver = typeof pcInsurerPressureDriversTable.$inferSelect;
export type PcSettlementFrictionSnapshot = typeof pcSettlementFrictionSnapshotsTable.$inferSelect;
export type PcSettlementFrictionDriver = typeof pcSettlementFrictionDriversTable.$inferSelect;
export type PcMovementRecommendation = typeof pcMovementRecommendationsTable.$inferSelect;
export type PcQuietRiskSnapshot = typeof pcQuietRiskSnapshotsTable.$inferSelect;
export type PcCarrierBehaviorPattern = typeof pcCarrierBehaviorPatternsTable.$inferSelect;
export type PcCarrierResponseEvent = typeof pcCarrierResponseEventsTable.$inferSelect;
export type PcCarrierSilenceWindow = typeof pcCarrierSilenceWindowsTable.$inferSelect;
export type PcCarrierOfferBehavior = typeof pcCarrierOfferBehaviorTable.$inferSelect;
export type PcCarrierReserveBehavior = typeof pcCarrierReserveBehaviorTable.$inferSelect;
export type PcWorldlineSourceClass = typeof pcWorldlineSourceClassesTable.$inferSelect;
export type PcWorldlineSignalOverlay = typeof pcWorldlineSignalOverlaysTable.$inferSelect;
export type PcWorldlineWeatherEvent = typeof pcWorldlineWeatherEventsTable.$inferSelect;
export type PcWorldlineCountyProfile = typeof pcWorldlineCountyProfilesTable.$inferSelect;
export type PcWorldlineRegulatoryEvent = typeof pcWorldlineRegulatoryEventsTable.$inferSelect;
export type PcWorldlineRecoveryMarker = typeof pcWorldlineRecoveryMarkersTable.$inferSelect;
export type PcPortfolioBenchmarkSnapshot = typeof pcPortfolioBenchmarkSnapshotsTable.$inferSelect;
export type PcPortfolioActionEffectiveness =
  typeof pcPortfolioActionEffectivenessTable.$inferSelect;
export type PcPortfolioTeamLagMetric = typeof pcPortfolioTeamLagMetricsTable.$inferSelect;
export type PcPortfolioMatterCohort = typeof pcPortfolioMatterCohortsTable.$inferSelect;

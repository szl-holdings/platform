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

export const pcModelLanesTable = pgTable(
  'pc_model_lanes',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    lane: text('lane', {
      enum: [
        'embedding',
        'retrieval',
        'classification',
        'extraction',
        'reasoning',
        'forecast',
        'policy_guardrail',
      ],
    }).notNull(),
    provider: text('provider').notNull(),
    modelName: text('model_name').notNull(),
    modelVersion: text('model_version'),
    endpoint: text('endpoint'),
    status: text('status', { enum: ['active', 'degraded', 'disabled', 'failover'] })
      .notNull()
      .default('active'),
    priority: integer('priority').notNull().default(1),
    config: jsonb('config'),
    maxRps: integer('max_rps').default(100),
    timeoutMs: integer('timeout_ms').default(30000),
    costPerRequest: numeric('cost_per_request', { precision: 10, scale: 6 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_model_lanes_lane_idx').on(table.lane),
    index('pc_model_lanes_org_idx').on(table.orgId),
  ],
);

export const pcModelRequestsTable = pgTable(
  'pc_model_requests',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    laneId: integer('lane_id').references(() => pcModelLanesTable.id),
    lane: text('lane').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    taskType: text('task_type').notNull(),
    matterId: integer('matter_id'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms'),
    cost: numeric('cost', { precision: 10, scale: 6 }),
    status: text('status', { enum: ['success', 'failure', 'timeout', 'circuit_open'] }).notNull(),
    error: text('error'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_model_req_lane_idx').on(table.lane),
    index('pc_model_req_org_idx').on(table.orgId),
    index('pc_model_req_created_idx').on(table.createdAt),
  ],
);

export const pcHfEndpointsTable = pgTable(
  'pc_hf_endpoints',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    name: text('name').notNull(),
    task: text('task', {
      enum: [
        'text_embedding',
        'classification',
        'reranking',
        'summarization',
        'ner',
        'contradiction_detection',
        'sentence_similarity',
        'zero_shot',
      ],
    }).notNull(),
    endpointUrl: text('endpoint_url').notNull(),
    modelId: text('model_id'),
    status: text('status', { enum: ['healthy', 'degraded', 'down', 'disabled'] })
      .notNull()
      .default('healthy'),
    authToken: text('auth_token'),
    timeoutMs: integer('timeout_ms').default(15000),
    maxRetries: integer('max_retries').default(3),
    circuitState: text('circuit_state', { enum: ['closed', 'open', 'half_open'] })
      .notNull()
      .default('closed'),
    circuitFailures: integer('circuit_failures').default(0),
    circuitOpenedAt: timestamp('circuit_opened_at'),
    costPerCall: numeric('cost_per_call', { precision: 10, scale: 6 }),
    totalCalls: integer('total_calls').default(0),
    totalErrors: integer('total_errors').default(0),
    avgLatencyMs: real('avg_latency_ms').default(0),
    lastHealthCheck: timestamp('last_health_check'),
    config: jsonb('config'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_hf_endpoints_task_idx').on(table.task),
    index('pc_hf_endpoints_org_idx').on(table.orgId),
  ],
);

export const pcWorldlineSourcesTable = pgTable(
  'pc_worldline_sources',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    sourceClass: text('source_class', {
      enum: [
        'regulatory_insurance',
        'crash_incident',
        'weather_environmental',
        'county_demographic',
        'court_venue',
        'lien_recovery',
        'internal_firm',
      ],
    }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    endpoint: text('endpoint'),
    fetchMethod: text('fetch_method', {
      enum: ['api_pull', 'rss', 'scrape', 'webhook', 'internal_query', 'file_import'],
    }).notNull(),
    schedule: text('schedule'),
    status: text('status', { enum: ['active', 'paused', 'error', 'disabled'] })
      .notNull()
      .default('active'),
    lastFetchAt: timestamp('last_fetch_at'),
    lastFetchStatus: text('last_fetch_status'),
    totalSignals: integer('total_signals').default(0),
    config: jsonb('config'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_wl_sources_class_idx').on(table.sourceClass),
    index('pc_wl_sources_org_idx').on(table.orgId),
  ],
);

export const pcWorldlineSignalsTable = pgTable(
  'pc_worldline_signals',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    sourceId: integer('source_id').references(() => pcWorldlineSourcesTable.id),
    sourceClass: text('source_class').notNull(),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    rawData: jsonb('raw_data'),
    normalizedData: jsonb('normalized_data'),
    jurisdiction: text('jurisdiction'),
    county: text('county'),
    geoLat: real('geo_lat'),
    geoLon: real('geo_lon'),
    freshnessScore: real('freshness_score'),
    provenanceScore: real('provenance_score'),
    legalUsefulnessScore: real('legal_usefulness_score'),
    matchedMatterIds: jsonb('matched_matter_ids'),
    featuresPublished: boolean('features_published').default(false),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_wl_signals_class_idx').on(table.sourceClass),
    index('pc_wl_signals_org_idx').on(table.orgId),
    index('pc_wl_signals_created_idx').on(table.createdAt),
  ],
);

export const pcWorldlineFeaturesTable = pgTable(
  'pc_worldline_features',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    signalId: integer('signal_id').references(() => pcWorldlineSignalsTable.id),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    featureName: text('feature_name').notNull(),
    featureValue: real('feature_value'),
    featureText: text('feature_text'),
    sourceClass: text('source_class').notNull(),
    confidence: real('confidence'),
    publishedToPressureGraph: boolean('published_to_pressure_graph').default(false),
    triggeredForecastRecompute: boolean('triggered_forecast_recompute').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_wl_features_matter_idx').on(table.matterId),
    index('pc_wl_features_org_idx').on(table.orgId),
  ],
);

export const pcPressureScoresTable = pgTable(
  'pc_pressure_scores',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    dimension: text('dimension', {
      enum: [
        'deadline',
        'insurer',
        'adjuster',
        'coverage',
        'venue',
        'medical',
        'damages',
        'settlement',
        'weather_event',
        'evidence',
        'communication',
        'governance',
      ],
    }).notNull(),
    score: real('score').notNull(),
    priorScore: real('prior_score'),
    movement: text('movement', { enum: ['rising', 'falling', 'stable', 'new'] })
      .notNull()
      .default('new'),
    confidence: real('confidence'),
    topDrivers: jsonb('top_drivers'),
    sourceMix: jsonb('source_mix'),
    affectedMilestones: jsonb('affected_milestones'),
    likelyConsequence: text('likely_consequence'),
    recommendedActions: jsonb('recommended_actions'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_pressure_matter_idx').on(table.matterId),
    index('pc_pressure_dim_idx').on(table.dimension),
    index('pc_pressure_org_idx').on(table.orgId),
  ],
);

export const pcProofChainEntriesTable = pgTable(
  'pc_proof_chain_entries',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    outputType: text('output_type', {
      enum: [
        'summary',
        'chronology',
        'recommendation',
        'forecast',
        'memo',
        'extraction',
        'classification',
        'alert',
        'export_packet',
        'copilot_answer',
      ],
    }).notNull(),
    outputContent: text('output_content'),
    outputHash: text('output_hash'),
    sourceReferences: jsonb('source_references'),
    sourceClass: text('source_class'),
    extractionConfidence: real('extraction_confidence'),
    modelLane: text('model_lane'),
    modelProvider: text('model_provider'),
    modelVersion: text('model_version'),
    generationTimestamp: timestamp('generation_timestamp').notNull().defaultNow(),
    actorType: text('actor_type', { enum: ['system', 'user', 'service'] })
      .notNull()
      .default('system'),
    actorId: integer('actor_id'),
    reviewState: text('review_state', {
      enum: ['unreviewed', 'pending_review', 'reviewed', 'approved', 'rejected'],
    })
      .notNull()
      .default('unreviewed'),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    approvalState: text('approval_state', {
      enum: ['not_required', 'pending', 'approved', 'denied'],
    })
      .notNull()
      .default('not_required'),
    approvedBy: integer('approved_by'),
    approvedAt: timestamp('approved_at'),
    privilegeState: text('privilege_state', {
      enum: ['none', 'privileged', 'work_product', 'attorney_client'],
    })
      .notNull()
      .default('none'),
    exportSafe: boolean('export_safe').default(false),
    auditLink: text('audit_link'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_proof_chain_matter_idx').on(table.matterId),
    index('pc_proof_chain_type_idx').on(table.outputType),
    index('pc_proof_chain_org_idx').on(table.orgId),
    index('pc_proof_chain_review_idx').on(table.reviewState),
  ],
);

export const pcCopilotSessionsTable = pgTable(
  'pc_copilot_sessions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    userId: integer('user_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    mode: text('mode', {
      enum: ['matter', 'communications', 'document', 'strategy', 'ops'],
    }).notNull(),
    title: text('title'),
    messageCount: integer('message_count').default(0),
    lastMessageAt: timestamp('last_message_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_copilot_sessions_user_idx').on(table.userId),
    index('pc_copilot_sessions_matter_idx').on(table.matterId),
    index('pc_copilot_sessions_org_idx').on(table.orgId),
  ],
);

export const pcCopilotMessagesTable = pgTable(
  'pc_copilot_messages',
  {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id')
      .notNull()
      .references(() => pcCopilotSessionsTable.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    mode: text('mode'),
    sourcesUsed: jsonb('sources_used'),
    proofChainId: integer('proof_chain_id').references(() => pcProofChainEntriesTable.id),
    modelLane: text('model_lane'),
    modelProvider: text('model_provider'),
    latencyMs: integer('latency_ms'),
    actionSuggested: boolean('action_suggested').default(false),
    approvalRequired: boolean('approval_required').default(false),
    approvalId: integer('approval_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('pc_copilot_msgs_session_idx').on(table.sessionId)],
);

export const pcMatterTwinSnapshotsTable = pgTable(
  'pc_matter_twin_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    snapshotType: text('snapshot_type', {
      enum: ['daily', 'weekly', 'on_change', 'manual'],
    }).notNull(),
    domains: jsonb('domains'),
    pressureScores: jsonb('pressure_scores'),
    forecastSnapshot: jsonb('forecast_snapshot'),
    worldlineOverlays: jsonb('worldline_overlays'),
    communicationsSummary: jsonb('communications_summary'),
    documentsSummary: jsonb('documents_summary'),
    approvalsSummary: jsonb('approvals_summary'),
    healthScore: integer('health_score'),
    changesSincePrior: jsonb('changes_since_prior'),
    missingArtifacts: jsonb('missing_artifacts'),
    riskFactors: jsonb('risk_factors'),
    nextActions: jsonb('next_actions'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_twin_snap_matter_idx').on(table.matterId),
    index('pc_twin_snap_org_idx').on(table.orgId),
    index('pc_twin_snap_created_idx').on(table.createdAt),
  ],
);

export const pcForecastDiffsTable = pgTable(
  'pc_forecast_diffs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    forecastType: text('forecast_type').notNull(),
    currentScore: real('current_score').notNull(),
    priorScore: real('prior_score'),
    trend: text('trend', { enum: ['improving', 'declining', 'stable', 'volatile'] }).notNull(),
    confidence: real('confidence'),
    topDrivers: jsonb('top_drivers'),
    sourceClassesUsed: jsonb('source_classes_used'),
    whatChanged: text('what_changed'),
    internalDrivers: jsonb('internal_drivers'),
    worldlineDrivers: jsonb('worldline_drivers'),
    highestLeverageAction: text('highest_leverage_action'),
    approvalRequired: boolean('approval_required').default(false),
    modelVersion: text('model_version'),
    lastRefreshAt: timestamp('last_refresh_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_forecast_diff_matter_idx').on(table.matterId),
    index('pc_forecast_diff_type_idx').on(table.forecastType),
    index('pc_forecast_diff_org_idx').on(table.orgId),
  ],
);

export const pcDataProductScoresTable = pgTable(
  'pc_data_product_scores',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    product: text('product', {
      enum: [
        'insurer_pressure_index',
        'venue_velocity_index',
        'incident_context_layer',
        'nofault_friction_score',
        'settlement_friction_map',
        'ai_defensibility_index',
      ],
    }).notNull(),
    score: real('score').notNull(),
    priorScore: real('prior_score'),
    movement: text('movement', { enum: ['rising', 'falling', 'stable', 'new'] })
      .notNull()
      .default('new'),
    components: jsonb('components'),
    topDrivers: jsonb('top_drivers'),
    confidence: real('confidence'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_data_product_matter_idx').on(table.matterId),
    index('pc_data_product_type_idx').on(table.product),
    index('pc_data_product_org_idx').on(table.orgId),
  ],
);

export const pcM365SubscriptionsTable = pgTable(
  'pc_m365_subscriptions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    connectorAccountId: integer('connector_account_id'),
    resourceType: text('resource_type', {
      enum: ['mail', 'calendar', 'driveItem', 'chatMessage', 'channel'],
    }).notNull(),
    resourcePath: text('resource_path').notNull(),
    subscriptionId: text('subscription_id'),
    changeType: text('change_type').notNull().default('created,updated,deleted'),
    expirationDateTime: timestamp('expiration_date_time'),
    status: text('status', { enum: ['active', 'expiring', 'expired', 'error', 'suspended'] })
      .notNull()
      .default('active'),
    lastNotificationAt: timestamp('last_notification_at'),
    renewalCount: integer('renewal_count').default(0),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_m365_sub_org_idx').on(table.orgId),
    index('pc_m365_sub_status_idx').on(table.status),
  ],
);

export const pcM365DeltaCursorsTable = pgTable(
  'pc_m365_delta_cursors',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    connectorAccountId: integer('connector_account_id'),
    resourceType: text('resource_type').notNull(),
    resourcePath: text('resource_path').notNull(),
    deltaLink: text('delta_link'),
    lastSyncAt: timestamp('last_sync_at'),
    syncStatus: text('sync_status', { enum: ['synced', 'syncing', 'error', 'stale'] })
      .notNull()
      .default('synced'),
    itemsSynced: integer('items_synced').default(0),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_m365_delta_org_idx').on(table.orgId),
    index('pc_m365_delta_resource_idx').on(table.resourceType),
  ],
);

export const pcCostTrackingTable = pgTable(
  'pc_cost_tracking',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id'),
    workflow: text('workflow').notNull(),
    costCategory: text('cost_category', {
      enum: [
        'graph_sync',
        'extraction',
        'doc_intelligence',
        'search',
        'embedding',
        'hf_endpoint',
        'reasoning',
        'forecast_compute',
        'storage',
        'export_generation',
      ],
    }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 6 }).notNull(),
    units: integer('units').default(1),
    provider: text('provider'),
    model: text('model'),
    metadata: jsonb('metadata'),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_cost_org_idx').on(table.orgId),
    index('pc_cost_category_idx').on(table.costCategory),
    index('pc_cost_period_idx').on(table.periodStart),
  ],
);

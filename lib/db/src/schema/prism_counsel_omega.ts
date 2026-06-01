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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { pcMattersTable } from './prism_counsel';

/* ─── RBAC / Roles ──────────────────────────────────────────────────────── */

export const pcOrgRolesTable = pgTable(
  'pc_org_roles',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    userId: integer('user_id').notNull(),
    role: text('role', {
      enum: [
        'founder_admin',
        'platform_admin',
        'org_admin',
        'attorney',
        'paralegal',
        'operator',
        'analyst',
        'client_viewer',
        'external_reviewer',
        'support_admin',
      ],
    }).notNull(),
    matterId: integer('matter_id'),
    grantedBy: integer('granted_by'),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_org_roles_org_user_idx').on(t.orgId, t.userId),
    index('pc_org_roles_matter_idx').on(t.matterId),
  ],
);

/* ─── GraphQL Audit ──────────────────────────────────────────────────────── */

export const pcGraphqlAuditLogsTable = pgTable(
  'pc_graphql_audit_logs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    userId: integer('user_id'),
    operationName: text('operation_name'),
    operationType: text('operation_type', { enum: ['query', 'mutation', 'subscription'] }),
    fieldPath: text('field_path'),
    variables: jsonb('variables'),
    errors: jsonb('errors'),
    complexity: integer('complexity'),
    depth: integer('depth'),
    latencyMs: integer('latency_ms'),
    persistedQueryId: text('persisted_query_id'),
    correlationId: text('correlation_id'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_gql_audit_org_idx').on(t.orgId),
    index('pc_gql_audit_op_idx').on(t.operationName),
    index('pc_gql_audit_created_idx').on(t.createdAt),
  ],
);

export const pcGraphqlAuditTagsTable = pgTable(
  'pc_graphql_audit_tags',
  {
    id: serial('id').primaryKey(),
    auditLogId: integer('audit_log_id')
      .notNull()
      .references(() => pcGraphqlAuditLogsTable.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    value: text('value'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_gql_tags_log_idx').on(t.auditLogId)],
);

export const pcPersistedQueriesTable = pgTable('pc_persisted_queries', {
  id: serial('id').primaryKey(),
  queryId: text('query_id').notNull().unique(),
  operationName: text('operation_name'),
  queryBody: text('query_body').notNull(),
  allowedRoles: jsonb('allowed_roles'),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/* ─── Signal Forge ───────────────────────────────────────────────────────── */

export const pcSignalForgeRunsTable = pgTable(
  'pc_signal_forge_runs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    sourceId: integer('source_id'),
    stage: text('stage', {
      enum: [
        'ingest',
        'clean',
        'normalize',
        'enrich',
        'contradiction_detect',
        'feature_engineer',
        'quality_score',
        'complete',
        'failed',
      ],
    })
      .notNull()
      .default('ingest'),
    inputCount: integer('input_count').default(0),
    outputCount: integer('output_count').default(0),
    rejectedCount: integer('rejected_count').default(0),
    contradictionsFound: integer('contradictions_found').default(0),
    qualityScoreAvg: real('quality_score_avg'),
    errorDetails: jsonb('error_details'),
    durationMs: integer('duration_ms'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_sf_runs_org_idx').on(t.orgId), index('pc_sf_runs_stage_idx').on(t.stage)],
);

export const pcSignalQualityScoresTable = pgTable(
  'pc_signal_quality_scores',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    signalId: integer('signal_id').notNull(),
    signalTable: text('signal_table').notNull(),
    freshnessScore: real('freshness_score'),
    provenanceScore: real('provenance_score'),
    usefulnessScore: real('usefulness_score'),
    overallScore: real('overall_score').notNull(),
    geolinked: boolean('geolinked').default(false),
    jurisdictionMatched: boolean('jurisdiction_matched').default(false),
    normalized: boolean('normalized').default(true),
    flagged: boolean('flagged').default(false),
    flagReason: text('flag_reason'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_sig_quality_signal_idx').on(t.signalId),
    index('pc_sig_quality_org_idx').on(t.orgId),
  ],
);

/* ─── Pressure Graph ─────────────────────────────────────────────────────── */

export const pcPressureGraphDimensionsTable = pgTable(
  'pc_pressure_graph_dimensions',
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
    currentScore: real('current_score').notNull(),
    priorScore: real('prior_score'),
    movementDirection: text('movement_direction', {
      enum: ['rising', 'falling', 'stable', 'volatile'],
    })
      .notNull()
      .default('stable'),
    topDrivers: jsonb('top_drivers'),
    sourceMix: jsonb('source_mix'),
    confidence: real('confidence'),
    affectedMilestones: jsonb('affected_milestones'),
    likelyConsequence: text('likely_consequence'),
    recommendedNextActions: jsonb('recommended_next_actions'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_pg_dim_matter_idx').on(t.matterId),
    index('pc_pg_dim_type_idx').on(t.dimension),
    index('pc_pg_dim_computed_idx').on(t.computedAt),
  ],
);

export const pcPressureWatchlistTable = pgTable(
  'pc_pressure_watchlist',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    dimension: text('dimension').notNull(),
    thresholdScore: real('threshold_score').notNull(),
    alertOnExceed: boolean('alert_on_exceed').default(true),
    assignedTo: integer('assigned_to'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_pg_watchlist_matter_idx').on(t.matterId)],
);

/* ─── Matter Twin Domains ────────────────────────────────────────────────── */

export const pcMatterTwinSubpagesTable = pgTable(
  'pc_matter_twin_subpages',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    subpage: text('subpage', {
      enum: [
        'summary',
        'twin',
        'timeline',
        'deadlines',
        'forecast',
        'pressure',
        'medical',
        'damages',
        'communications',
        'documents',
        'demand',
        'discovery',
        'depositions',
        'mediation',
        'approvals',
        'audit',
        'proof_chain',
      ],
    }).notNull(),
    lastComputedAt: timestamp('last_computed_at'),
    snapshotData: jsonb('snapshot_data'),
    staleness: text('staleness', { enum: ['fresh', 'stale', 'outdated'] }).default('fresh'),
    computationMs: integer('computation_ms'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_twin_sp_matter_idx').on(t.matterId),
    uniqueIndex('pc_twin_sp_matter_subpage_idx').on(t.matterId, t.subpage),
  ],
);

/* ─── Copilot Workbench Drafts ───────────────────────────────────────────── */

export const pcCopilotDraftsTable = pgTable(
  'pc_copilot_drafts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    sessionId: integer('session_id'),
    draftType: text('draft_type', {
      enum: [
        'chronology',
        'demand_letter',
        'legal_memo',
        'checklist',
        'deposition_outline',
        'mediation_brief',
        'discovery_response',
        'expert_summary',
        'settlement_position',
        'trial_brief',
      ],
    }).notNull(),
    title: text('title').notNull(),
    content: text('content'),
    sourceReferences: jsonb('source_references'),
    groundingScore: real('grounding_score'),
    unsupportedClaimsCount: integer('unsupported_claims_count').default(0),
    reviewState: text('review_state', {
      enum: ['draft', 'review_pending', 'reviewed', 'approved', 'rejected', 'exported'],
    })
      .notNull()
      .default('draft'),
    exportSafe: boolean('export_safe').default(false),
    privilegeFlag: boolean('privilege_flag').default(true),
    proofChainId: integer('proof_chain_id'),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    approvedBy: integer('approved_by'),
    approvedAt: timestamp('approved_at'),
    modelLane: text('model_lane'),
    modelProvider: text('model_provider'),
    modelVersion: text('model_version'),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_copilot_drafts_matter_idx').on(t.matterId),
    index('pc_copilot_drafts_org_idx').on(t.orgId),
    index('pc_copilot_drafts_state_idx').on(t.reviewState),
  ],
);

/* ─── M365 Connector Extended ────────────────────────────────────────────── */

export const pcM365CalendarEventsTable = pgTable(
  'pc_m365_calendar_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    calendarEventId: text('calendar_event_id').notNull(),
    subject: text('subject'),
    organizer: text('organizer'),
    attendees: jsonb('attendees'),
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    location: text('location'),
    isOnlineMeeting: boolean('is_online_meeting').default(false),
    eventType: text('event_type', {
      enum: [
        'deposition',
        'mediation',
        'hearing',
        'settlement_conf',
        'client_meeting',
        'expert_meeting',
        'internal',
        'other',
      ],
    }),
    prepWindowStart: timestamp('prep_window_start'),
    prepWindowEnd: timestamp('prep_window_end'),
    linkedDeadlineId: integer('linked_deadline_id'),
    syncedAt: timestamp('synced_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_m365_cal_matter_idx').on(t.matterId),
    index('pc_m365_cal_event_id_idx').on(t.calendarEventId),
  ],
);

export const pcM365SharepointFilesTable = pgTable(
  'pc_m365_sharepoint_files',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    driveItemId: text('drive_item_id').notNull(),
    siteId: text('site_id'),
    libraryId: text('library_id'),
    fileName: text('file_name').notNull(),
    filePath: text('file_path'),
    mimeType: text('mime_type'),
    fileSize: integer('file_size'),
    webUrl: text('web_url'),
    eTag: text('e_tag'),
    lastModifiedAt: timestamp('last_modified_at'),
    lastModifiedBy: text('last_modified_by'),
    changeType: text('change_type', { enum: ['created', 'updated', 'deleted'] }),
    aclSnapshot: jsonb('acl_snapshot'),
    mappedToBinderId: integer('mapped_to_binder_id'),
    linkedDocumentId: integer('linked_document_id'),
    syncedAt: timestamp('synced_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_m365_sp_matter_idx').on(t.matterId),
    index('pc_m365_sp_drive_item_idx').on(t.driveItemId),
  ],
);

export const pcM365TeamsMessagesTable = pgTable(
  'pc_m365_teams_messages',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    messageId: text('message_id').notNull(),
    channelId: text('channel_id'),
    chatId: text('chat_id'),
    fromUserId: text('from_user_id'),
    fromDisplayName: text('from_display_name'),
    body: text('body'),
    messageType: text('message_type', {
      enum: [
        'alert_card',
        'approval_prompt',
        'deadline_warning',
        'connector_failure',
        'matter_update',
        'standard',
      ],
    })
      .notNull()
      .default('standard'),
    linkedApprovalId: integer('linked_approval_id'),
    sentAt: timestamp('sent_at'),
    syncedAt: timestamp('synced_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_m365_teams_matter_idx').on(t.matterId),
    index('pc_m365_teams_msg_id_idx').on(t.messageId),
  ],
);

/* ─── Schema Registry ────────────────────────────────────────────────────── */

export const pcSchemaRegistryTable = pgTable(
  'pc_schema_registry',
  {
    id: serial('id').primaryKey(),
    subgraphName: text('subgraph_name').notNull(),
    schemaVersion: text('schema_version').notNull(),
    schemaBody: text('schema_body').notNull(),
    isCurrently: boolean('is_currently_active').notNull().default(false),
    publishedBy: text('published_by'),
    breakingChange: boolean('breaking_change').default(false),
    changeNotes: text('change_notes'),
    publishedAt: timestamp('published_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_schema_reg_subgraph_idx').on(t.subgraphName)],
);

/* ─── Approval Evidence / Audit Packets ──────────────────────────────────── */

export const pcApprovalEvidenceTable = pgTable(
  'pc_approval_evidence',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    approvalRequestId: integer('approval_request_id').notNull(),
    evidenceType: text('evidence_type', {
      enum: [
        'source_document',
        'proof_chain_entry',
        'model_output',
        'audit_snapshot',
        'user_statement',
        'system_log',
      ],
    }).notNull(),
    entityRef: text('entity_ref'),
    entityId: integer('entity_id'),
    summary: text('summary'),
    confidence: real('confidence'),
    sourceClass: text('source_class'),
    attachedAt: timestamp('attached_at').notNull().defaultNow(),
    attachedBy: integer('attached_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('pc_approval_evidence_req_idx').on(t.approvalRequestId)],
);

export const pcAuditPacketsTable = pgTable(
  'pc_audit_packets',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    packetType: text('packet_type', {
      enum: [
        'review_packet',
        'demand_packet',
        'approval_packet',
        'export_safety_packet',
        'privilege_review_packet',
      ],
    }).notNull(),
    title: text('title').notNull(),
    contents: jsonb('contents'),
    proofChainIds: jsonb('proof_chain_ids'),
    exportSafe: boolean('export_safe').default(false),
    privilegeChecked: boolean('privilege_checked').default(false),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    generatedBy: integer('generated_by'),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    filePath: text('file_path'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_audit_packets_matter_idx').on(t.matterId),
    index('pc_audit_packets_type_idx').on(t.packetType),
  ],
);

/* ─── Contradiction Panel ────────────────────────────────────────────────── */

export const pcContradictionPanelTable = pgTable(
  'pc_contradiction_panel',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id')
      .notNull()
      .references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    contradictionType: text('contradiction_type', {
      enum: [
        'fact_conflict',
        'chronology_gap',
        'medical_discrepancy',
        'testimony_conflict',
        'document_vs_testimony',
        'insurer_vs_claimant',
        'expert_conflict',
        'date_conflict',
      ],
    }).notNull(),
    description: text('description').notNull(),
    sourceARef: text('source_a_ref'),
    sourceAType: text('source_a_type'),
    sourceBRef: text('source_b_ref'),
    sourceBType: text('source_b_type'),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    status: text('status', { enum: ['open', 'resolved', 'dismissed', 'escalated'] })
      .notNull()
      .default('open'),
    resolutionNotes: text('resolution_notes'),
    detectedByLane: text('detected_by_lane'),
    confidence: real('confidence'),
    resolvedBy: integer('resolved_by'),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_contradiction_matter_idx').on(t.matterId),
    index('pc_contradiction_status_idx').on(t.status),
  ],
);

/* ─── Operational Flows ──────────────────────────────────────────────────── */

export const pcOperationalFlowRunsTable = pgTable(
  'pc_operational_flow_runs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    flowType: text('flow_type', {
      enum: [
        'outlook_to_matter_twin',
        'sharepoint_to_evidence',
        'world_to_worldline',
        'copilot_workbench_answer',
        'approval_to_action',
        'review_packet_generation',
      ],
    }).notNull(),
    status: text('status', {
      enum: ['initiated', 'running', 'awaiting_approval', 'completed', 'failed', 'rolled_back'],
    })
      .notNull()
      .default('initiated'),
    inputPayload: jsonb('input_payload'),
    outputPayload: jsonb('output_payload'),
    stagesCompleted: jsonb('stages_completed'),
    currentStage: text('current_stage'),
    approvalId: integer('approval_id'),
    proofChainId: integer('proof_chain_id'),
    errorDetails: text('error_details'),
    retryCount: integer('retry_count').default(0),
    triggeredBy: integer('triggered_by'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_ops_flow_matter_idx').on(t.matterId),
    index('pc_ops_flow_type_idx').on(t.flowType),
    index('pc_ops_flow_status_idx').on(t.status),
  ],
);

/* ─── Executive / Cost / Health Dashboards ───────────────────────────────── */

export const pcDashboardSnapshotsTable = pgTable(
  'pc_dashboard_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    dashboardType: text('dashboard_type', {
      enum: [
        'executive_health',
        'connector_health',
        'worldline_health',
        'graphql_health',
        'forecast_health',
        'approval_health',
        'onboarding_health',
        'cost_visibility',
        'incident_response',
      ],
    }).notNull(),
    data: jsonb('data').notNull(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_dash_snap_org_type_idx').on(t.orgId, t.dashboardType),
    index('pc_dash_snap_computed_idx').on(t.computedAt),
  ],
);

export const pcServiceMetricsTable = pgTable(
  'pc_service_metrics',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    service: text('service', {
      enum: [
        'prism_web',
        'prism_api',
        'prism_gateway',
        'prism_worker',
        'prism_webhooks',
        'prism_connectors',
        'prism_ingestion',
        'prism_document_intel',
        'prism_forecast',
        'prism_worldline',
        'prism_model_router',
        'prism_hf_gateway',
        'prism_proof_chain',
        'prism_notifications',
        'prism_admin',
      ],
    }).notNull(),
    latencyP50Ms: real('latency_p50_ms'),
    latencyP95Ms: real('latency_p95_ms'),
    latencyP99Ms: real('latency_p99_ms'),
    requestCount: integer('request_count').default(0),
    errorCount: integer('error_count').default(0),
    queueDepth: integer('queue_depth'),
    dlqDepth: integer('dlq_depth'),
    syncLagMs: integer('sync_lag_ms'),
    healthStatus: text('health_status', { enum: ['healthy', 'degraded', 'critical', 'down'] })
      .notNull()
      .default('healthy'),
    measuredAt: timestamp('measured_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_svc_metrics_service_idx').on(t.service),
    index('pc_svc_metrics_org_idx').on(t.orgId),
    index('pc_svc_metrics_measured_idx').on(t.measuredAt),
  ],
);

/* ─── Tenant / Org Config ────────────────────────────────────────────────── */

export const pcTenantConfigTable = pgTable(
  'pc_tenant_config',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull().unique(),
    displayName: text('display_name').notNull(),
    slug: text('slug').notNull().unique(),
    oidcIssuer: text('oidc_issuer'),
    oidcClientId: text('oidc_client_id'),
    allowedDomains: jsonb('allowed_domains'),
    enabledLanes: jsonb('enabled_lanes'),
    enabledFeatures: jsonb('enabled_features'),
    maxMatters: integer('max_matters').default(1000),
    maxUsers: integer('max_users').default(50),
    billingPlan: text('billing_plan', { enum: ['trial', 'starter', 'professional', 'enterprise'] })
      .notNull()
      .default('trial'),
    onboardingStatus: text('onboarding_status', {
      enum: ['not_started', 'in_progress', 'connectors_setup', 'data_loaded', 'active'],
    })
      .notNull()
      .default('not_started'),
    copilotEnabled: boolean('copilot_enabled').default(false),
    worldlineEnabled: boolean('worldline_enabled').default(false),
    m365TenantId: text('m365_tenant_id'),
    m365ConsentGranted: boolean('m365_consent_granted').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('pc_tenant_config_org_idx').on(t.orgId)],
);

/* ─── Incident Response ──────────────────────────────────────────────────── */

export const pcIncidentsTable = pgTable(
  'pc_incidents',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    title: text('title').notNull(),
    severity: text('severity', { enum: ['p0', 'p1', 'p2', 'p3'] }).notNull(),
    service: text('service'),
    description: text('description'),
    status: text('status', {
      enum: ['open', 'investigating', 'mitigated', 'resolved', 'post_mortem'],
    })
      .notNull()
      .default('open'),
    affectedMatters: jsonb('affected_matters'),
    timeline: jsonb('timeline'),
    rootCause: text('root_cause'),
    resolution: text('resolution'),
    assignedTo: integer('assigned_to'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    mitigatedAt: timestamp('mitigated_at'),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('pc_incidents_org_idx').on(t.orgId), index('pc_incidents_status_idx').on(t.status)],
);

/* ─── Onboarding ─────────────────────────────────────────────────────────── */

export const pcOnboardingChecklistTable = pgTable(
  'pc_onboarding_checklist',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    step: text('step', {
      enum: [
        'oidc_configured',
        'first_user_created',
        'connector_added',
        'first_matter_created',
        'demo_data_seeded',
        'm365_consent_granted',
        'worldline_initialized',
        'model_lanes_configured',
        'playbook_created',
        'first_export_approved',
      ],
    }).notNull(),
    status: text('status', { enum: ['pending', 'complete', 'skipped', 'blocked'] })
      .notNull()
      .default('pending'),
    completedBy: integer('completed_by'),
    completedAt: timestamp('completed_at'),
    blockerReason: text('blocker_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pc_onboard_org_idx').on(t.orgId),
    uniqueIndex('pc_onboard_org_step_idx').on(t.orgId, t.step),
  ],
);

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PcOrgRole = typeof pcOrgRolesTable.$inferSelect;
export type PcGraphqlAuditLog = typeof pcGraphqlAuditLogsTable.$inferSelect;
export type PcPersistedQuery = typeof pcPersistedQueriesTable.$inferSelect;
export type PcSignalForgeRun = typeof pcSignalForgeRunsTable.$inferSelect;
export type PcSignalQualityScore = typeof pcSignalQualityScoresTable.$inferSelect;
export type PcPressureGraphDimension = typeof pcPressureGraphDimensionsTable.$inferSelect;
export type PcPressureWatchlist = typeof pcPressureWatchlistTable.$inferSelect;
export type PcMatterTwinSubpage = typeof pcMatterTwinSubpagesTable.$inferSelect;
export type PcCopilotDraft = typeof pcCopilotDraftsTable.$inferSelect;
export type PcM365CalendarEvent = typeof pcM365CalendarEventsTable.$inferSelect;
export type PcM365SharepointFile = typeof pcM365SharepointFilesTable.$inferSelect;
export type PcM365TeamsMessage = typeof pcM365TeamsMessagesTable.$inferSelect;
export type PcSchemaRegistry = typeof pcSchemaRegistryTable.$inferSelect;
export type PcApprovalEvidence = typeof pcApprovalEvidenceTable.$inferSelect;
export type PcAuditPacket = typeof pcAuditPacketsTable.$inferSelect;
export type PcContradictionPanel = typeof pcContradictionPanelTable.$inferSelect;
export type PcOperationalFlowRun = typeof pcOperationalFlowRunsTable.$inferSelect;
export type PcDashboardSnapshot = typeof pcDashboardSnapshotsTable.$inferSelect;
export type PcServiceMetric = typeof pcServiceMetricsTable.$inferSelect;
export type PcTenantConfig = typeof pcTenantConfigTable.$inferSelect;
export type PcIncident = typeof pcIncidentsTable.$inferSelect;
export type PcOnboardingChecklist = typeof pcOnboardingChecklistTable.$inferSelect;

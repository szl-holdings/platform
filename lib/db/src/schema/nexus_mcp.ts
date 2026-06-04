import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const nexusMcpExternalServersTable = pgTable(
  'nexus_mcp_external_servers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    endpointUrl: text('endpoint_url').notNull(),
    authMethod: text('auth_method').notNull().default('none'),
    authConfig: jsonb('auth_config').$type<Record<string, string>>().notNull().default({}),
    allowedTenantScopes: jsonb('allowed_tenant_scopes').$type<string[]>().notNull().default([]),
    discoveredTools: jsonb('discovered_tools')
      .$type<
        Array<{
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          riskLevel: 'low' | 'medium' | 'high';
        }>
      >()
      .notNull()
      .default([]),
    healthStatus: text('health_status').notNull().default('unknown'),
    latencyMs: integer('latency_ms'),
    errorRate: integer('error_rate').notNull().default(0),
    circuitBreakerState: text('circuit_breaker_state').notNull().default('closed'),
    circuitBreakerTrips: integer('circuit_breaker_trips').notNull().default(0),
    lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
    lastToolDiscovery: timestamp('last_tool_discovery', { withTimezone: true }),
    enabled: boolean('enabled').notNull().default(true),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    healthIdx: index('nexus_mcp_servers_health_idx').on(t.healthStatus),
    enabledIdx: index('nexus_mcp_servers_enabled_idx').on(t.enabled),
  }),
);

export const nexusMcpSessionsTable = pgTable(
  'nexus_mcp_sessions',
  {
    id: text('id').primaryKey(),
    clientIdentity: text('client_identity').notNull(),
    clientType: text('client_type').notNull().default('internal'),
    serverIdentity: text('server_identity').notNull(),
    serverType: text('server_type').notNull().default('internal'),
    externalServerId: text('external_server_id'),
    tenantId: text('tenant_id'),
    status: text('status').notNull().default('active'),
    riskLevel: text('risk_level').notNull().default('low'),
    toolCallCount: integer('tool_call_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    policyViolationCount: integer('policy_violation_count').notNull().default(0),
    pendingApprovalCount: integer('pending_approval_count').notNull().default(0),
    avgLatencyMs: integer('avg_latency_ms'),
    proofHash: text('proof_hash'),
    previousProofHash: text('previous_proof_hash'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('nexus_mcp_sessions_status_idx').on(t.status),
    startedAtIdx: index('nexus_mcp_sessions_started_at_idx').on(t.startedAt),
    clientIdx: index('nexus_mcp_sessions_client_idx').on(t.clientIdentity),
    serverIdx: index('nexus_mcp_sessions_server_idx').on(t.serverIdentity),
  }),
);

export const nexusMcpToolCallsTable = pgTable(
  'nexus_mcp_tool_calls',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    toolName: text('tool_name').notNull(),
    toolSource: text('tool_source').notNull().default('internal'),
    externalServerId: text('external_server_id'),
    inputParams: jsonb('input_params').$type<Record<string, unknown>>().notNull().default({}),
    outputSummary: text('output_summary'),
    outputRaw: jsonb('output_raw'),
    latencyMs: integer('latency_ms'),
    outcome: text('outcome').notNull().default('success'),
    policyResult: text('policy_result').notNull().default('pass'),
    policyReason: text('policy_reason'),
    approvalStatus: text('approval_status').notNull().default('not_required'),
    approvalId: text('approval_id'),
    errorMessage: text('error_message'),
    sequenceIndex: integer('sequence_index').notNull().default(0),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index('nexus_mcp_tool_calls_session_idx').on(t.sessionId),
    occurredAtIdx: index('nexus_mcp_tool_calls_occurred_at_idx').on(t.occurredAt),
    toolIdx: index('nexus_mcp_tool_calls_tool_idx').on(t.toolName),
  }),
);

export const nexusMcpAnomaliesTable = pgTable(
  'nexus_mcp_anomalies',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id'),
    externalServerId: text('external_server_id'),
    anomalyType: text('anomaly_type').notNull(),
    severity: text('severity').notNull().default('medium'),
    description: text('description').notNull(),
    evidence: jsonb('evidence').$type<Record<string, unknown>>().notNull().default({}),
    acknowledged: boolean('acknowledged').notNull().default(false),
    acknowledgedBy: text('acknowledged_by'),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    severityIdx: index('nexus_mcp_anomalies_severity_idx').on(t.severity),
    detectedAtIdx: index('nexus_mcp_anomalies_detected_at_idx').on(t.detectedAt),
    acknowledgedIdx: index('nexus_mcp_anomalies_acknowledged_idx').on(t.acknowledged),
  }),
);

export const nexusGovernedWorkflowsTable = pgTable(
  'nexus_governed_workflows',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    triggerType: text('trigger_type').notNull().default('manual'),
    triggerConfig: jsonb('trigger_config').$type<Record<string, unknown>>().notNull().default({}),
    steps: jsonb('steps')
      .$type<
        Array<{
          id: string;
          toolName: string;
          toolSource: 'internal' | 'external';
          externalServerId?: string;
          inputMapping: Record<string, string>;
          conditions: Array<{ field: string; operator: string; value: unknown }>;
          requiresApproval: boolean;
          approvalRole?: string;
          timeoutMs: number;
        }>
      >()
      .notNull()
      .default([]),
    status: text('status').notNull().default('draft'),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    runCount: integer('run_count').notNull().default(0),
    createdBy: text('created_by'),
    tenantId: text('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('nexus_governed_workflows_status_idx').on(t.status),
  }),
);

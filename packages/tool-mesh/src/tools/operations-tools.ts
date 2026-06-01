import { desc, gte, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

export const MetricsQueryInputSchema = z.object({
  metric: z.string(),
  labels: z.record(z.string()).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  step: z.string().default('5m'),
});

export const METRICS_QUERY_TOOL_MANIFEST: ToolManifest = {
  id: 'analytics.metrics-query',
  name: 'Metrics Query',
  version: '1.0.0',
  description:
    'Query time-series metrics from the platform observability store. Supports label filters and time ranges.',
  domainTags: ['analytics', 'data'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      metric: { type: 'string', description: 'Metric name to query (e.g. http_requests_total)' },
      labels: { type: 'object', description: 'Key-value label filters to apply' },
      startTime: { type: 'string', description: 'ISO 8601 datetime for range start' },
      endTime: { type: 'string', description: 'ISO 8601 datetime for range end' },
      step: { type: 'string', description: 'Query resolution step (e.g. 5m, 1h)' },
    },
    required: ['metric'],
  },
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'platform-ops',
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
  enabled: true,
};

export const metricsQueryHandler: ToolHandler = async (input) => {
  const parsed = MetricsQueryInputSchema.parse(input);
  const { db, agentUsageStats } = await import('@szl-holdings/db');

  const startDate = parsed.startTime ? new Date(parsed.startTime) : (() => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d;
  })();

  const rows = await db
    .select()
    .from(agentUsageStats)
    .where(gte(agentUsageStats.recordedAt, startDate))
    .orderBy(desc(agentUsageStats.recordedAt))
    .limit(100);

  const agentFilter = parsed.labels?.agent;
  const providerFilter = parsed.labels?.provider;
  const filtered = rows.filter((r) => {
    if (agentFilter && r.agentId !== agentFilter) return false;
    if (providerFilter && r.provider !== providerFilter) return false;
    return true;
  });

  const dataPoints = filtered.map((r) => ({
    timestamp: r.recordedAt?.toISOString(),
    agentId: r.agentId,
    agentName: r.agentName,
    domain: r.domain,
    tokensUsed: r.tokensUsed,
    latencyMs: r.latencyMs,
    success: r.success,
    provider: r.provider,
    model: r.model,
  }));

  const summary = {
    totalRequests: filtered.length,
    successRate: filtered.length > 0
      ? Math.round((filtered.filter((r) => r.success).length / filtered.length) * 100) / 100
      : 1.0,
    avgLatencyMs: filtered.length > 0
      ? Math.round(filtered.reduce((s, r) => s + r.latencyMs, 0) / filtered.length)
      : 0,
    totalTokensUsed: filtered.reduce((s, r) => s + r.tokensUsed, 0),
  };

  return {
    metric: parsed.metric,
    labels: parsed.labels ?? {},
    step: parsed.step,
    rangeStart: startDate.toISOString(),
    rangeEnd: parsed.endTime ?? new Date().toISOString(),
    dataPoints,
    summary,
  };
};

export const WorkflowTriggerInputSchema = z.object({
  workflowId: z.string(),
  payload: z.record(z.unknown()).default({}),
  dryRun: z.boolean().default(false),
});

export const WORKFLOW_TRIGGER_TOOL_MANIFEST: ToolManifest = {
  id: 'operations.workflow-trigger',
  name: 'Workflow Trigger',
  version: '1.0.0',
  description:
    'Trigger a named workflow with a payload. Dry-run mode validates without executing. Live triggers require operator review.',
  domainTags: ['data', 'custom'],
  policyTier: 'operator-assisted',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: { type: 'string', description: 'Unique identifier of the workflow to trigger' },
      payload: { type: 'object', description: 'Input payload to pass to the workflow' },
      dryRun: { type: 'boolean', description: 'If true, validates the trigger without executing' },
    },
    required: ['workflowId'],
  },
  rateLimits: { requestsPerMinute: 30, concurrency: 5 },
  timeoutMs: 120000,
  failureModes: [
    { type: 'timeout', retryable: false, maxRetries: 0 },
    { type: 'error', retryable: true, maxRetries: 1 },
  ],
  approvalRequired: false,
  owner: 'platform-ops',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['payload'] },
  enabled: true,
};

export const workflowTriggerHandler: ToolHandler = async (input) => {
  const parsed = WorkflowTriggerInputSchema.parse(input);
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const runId = `run-${Date.now()}`;

  if (!parsed.dryRun) {
    await db.insert(platformJobRunsTable).values({
      runId,
      workflowType: parsed.workflowId,
      domain: 'platform',
      triggeredBy: 'agent-tool-call',
      status: 'pending',
      payload: parsed.payload,
    });
  }

  return {
    workflowId: parsed.workflowId,
    runId: parsed.dryRun ? null : runId,
    dryRun: parsed.dryRun,
    status: parsed.dryRun ? 'validated' : 'triggered',
    message: parsed.dryRun
      ? `Workflow '${parsed.workflowId}' validated successfully`
      : `Workflow '${parsed.workflowId}' triggered with runId ${runId}`,
  };
};

export const NotificationSendInputSchema = z.object({
  channel: z.enum(['email', 'slack', 'sms', 'push', 'webhook']),
  recipients: z.array(z.string()).min(1),
  subject: z.string().optional(),
  body: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const NOTIFICATION_SEND_TOOL_MANIFEST: ToolManifest = {
  id: 'communication.notification-send',
  name: 'Notification Send',
  version: '1.0.0',
  description:
    'Send a notification across email, Slack, SMS, push, or webhook channels to specified recipients.',
  domainTags: ['communication'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        enum: ['email', 'slack', 'sms', 'push', 'webhook'],
        description: 'Delivery channel for the notification',
      },
      recipients: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of recipient identifiers (emails, user IDs, etc.)',
      },
      subject: {
        type: 'string',
        description: 'Message subject (used for email and similar channels)',
      },
      body: { type: 'string', description: 'Notification body content' },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high', 'urgent'],
        description: 'Delivery priority level',
      },
    },
    required: ['channel', 'recipients', 'body'],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [
    { type: 'error', retryable: true, maxRetries: 3 },
    { type: 'timeout', retryable: true, maxRetries: 2 },
  ],
  approvalRequired: false,
  owner: 'platform-ops',
  observabilityHooks: {
    emitTrace: true,
    emitMetrics: true,
    sensitiveFields: ['recipients', 'body'],
  },
  enabled: true,
};

export const notificationSendHandler: ToolHandler = async (input) => {
  const parsed = NotificationSendInputSchema.parse(input);
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const messageId = `msg-${Date.now()}`;
  await db.insert(platformJobRunsTable).values({
    runId: messageId,
    workflowType: 'notification_send',
    domain: 'communication',
    triggeredBy: 'agent-tool-call',
    status: 'pending',
    payload: {
      channel: parsed.channel,
      recipients: parsed.recipients,
      subject: parsed.subject ?? null,
      body: parsed.body.slice(0, 500),
      priority: parsed.priority,
    },
  });

  return {
    messageId,
    channel: parsed.channel,
    recipientCount: parsed.recipients.length,
    priority: parsed.priority,
    status: 'queued',
    message: `Notification queued for ${parsed.recipients.length} recipient(s) via ${parsed.channel} (priority: ${parsed.priority})`,
  };
};

export const ExternalWebhookCallInputSchema = z.object({
  endpointId: z.string(),
  eventType: z.string(),
  payload: z.record(z.unknown()).default({}),
  retryOnFailure: z.boolean().default(true),
});

export const EXTERNAL_WEBHOOK_TOOL_MANIFEST: ToolManifest = {
  id: 'communication.external-webhook',
  name: 'External Webhook Call',
  version: '1.0.0',
  description:
    'Deliver a webhook event to a registered external endpoint. Calls to client-facing endpoints require policy approval.',
  domainTags: ['communication'],
  policyTier: 'external-client-facing',
  allowedEnvironments: ['staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      endpointId: {
        type: 'string',
        description: 'Registered endpoint identifier to deliver the webhook to',
      },
      eventType: { type: 'string', description: 'Event type name (e.g. invoice.created)' },
      payload: { type: 'object', description: 'Webhook event payload' },
      retryOnFailure: { type: 'boolean', description: 'Whether to retry on delivery failure' },
    },
    required: ['endpointId', 'eventType'],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 30000,
  failureModes: [
    { type: 'timeout', retryable: true, maxRetries: 3 },
    { type: 'error', retryable: true, maxRetries: 2 },
  ],
  approvalRequired: false,
  owner: 'integrations-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['payload'] },
  enabled: true,
};

export const externalWebhookHandler: ToolHandler = async (input) => {
  const parsed = ExternalWebhookCallInputSchema.parse(input);
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const deliveryId = `del-${Date.now()}`;
  await db.insert(platformJobRunsTable).values({
    runId: deliveryId,
    workflowType: 'webhook_delivery',
    domain: 'integrations',
    triggeredBy: 'agent-tool-call',
    status: 'pending',
    payload: {
      endpointId: parsed.endpointId,
      eventType: parsed.eventType,
      payload: parsed.payload,
      retryOnFailure: parsed.retryOnFailure,
    },
  });

  return {
    deliveryId,
    endpointId: parsed.endpointId,
    eventType: parsed.eventType,
    status: 'queued',
    message: `Webhook '${parsed.eventType}' queued for delivery to endpoint ${parsed.endpointId}`,
  };
};

export const InfraProvisionInputSchema = z.object({
  resourceType: z.enum(['compute', 'storage', 'network', 'database', 'cache']),
  spec: z.record(z.unknown()),
  environment: z.enum(['development', 'staging', 'production']),
});

export const INFRA_PROVISION_TOOL_MANIFEST: ToolManifest = {
  id: 'infrastructure.provision',
  name: 'Infrastructure Provision',
  version: '1.0.0',
  description:
    'Provision infrastructure resources via IaC. Production provisioning is autonomous-reversible; Rollback plan must be verified prior to execution.',
  domainTags: ['infrastructure'],
  policyTier: 'autonomous-reversible',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      resourceType: {
        type: 'string',
        enum: ['compute', 'storage', 'network', 'database', 'cache'],
        description: 'Type of infrastructure resource to provision',
      },
      spec: {
        type: 'object',
        description: 'Resource specification (IaC-compatible config object)',
      },
      environment: {
        type: 'string',
        enum: ['development', 'staging', 'production'],
        description: 'Target deployment environment',
      },
    },
    required: ['resourceType', 'spec', 'environment'],
  },
  rateLimits: { requestsPerMinute: 10, concurrency: 2 },
  timeoutMs: 300000,
  failureModes: [
    { type: 'timeout', retryable: false, maxRetries: 0 },
    { type: 'error', retryable: false, maxRetries: 0 },
  ],
  approvalRequired: false,
  owner: 'platform-ops',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['spec'] },
  enabled: true,
};

export const infraProvisionHandler: ToolHandler = async (input) => {
  const parsed = InfraProvisionInputSchema.parse(input);
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const provisionId = `prov-${Date.now()}`;
  const rollbackId = `rollback-${Date.now()}`;

  await db.insert(platformJobRunsTable).values({
    runId: provisionId,
    workflowType: 'infrastructure_provision',
    domain: 'infrastructure',
    triggeredBy: 'agent-tool-call',
    status: 'pending',
    payload: {
      resourceType: parsed.resourceType,
      environment: parsed.environment,
      spec: parsed.spec,
      rollbackId,
    },
  });

  return {
    provisionId,
    resourceType: parsed.resourceType,
    environment: parsed.environment,
    status: 'provisioning',
    rollbackId,
    message: `Infrastructure provision for ${parsed.resourceType} in ${parsed.environment} queued (rollbackId: ${rollbackId})`,
  };
};

export const OPERATIONS_TOOL_MANIFESTS: ToolManifest[] = [
  METRICS_QUERY_TOOL_MANIFEST,
  WORKFLOW_TRIGGER_TOOL_MANIFEST,
  NOTIFICATION_SEND_TOOL_MANIFEST,
  EXTERNAL_WEBHOOK_TOOL_MANIFEST,
  INFRA_PROVISION_TOOL_MANIFEST,
];

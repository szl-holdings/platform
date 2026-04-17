import { z } from "zod";
import type { ToolManifest } from "../manifest.js";
import type { ToolHandler } from "../gateway.js";

export const MetricsQueryInputSchema = z.object({
  metric: z.string(),
  labels: z.record(z.string()).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  step: z.string().default("5m"),
});

export const METRICS_QUERY_TOOL_MANIFEST: ToolManifest = {
  id: "analytics.metrics-query",
  name: "Metrics Query",
  version: "1.0.0",
  description: "Query time-series metrics from the platform observability store. Supports label filters and time ranges.",
  domainTags: ["analytics", "data"],
  policyTier: "internal-workflow",
  allowedEnvironments: ["development", "staging", "production"],
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 10000,
  failureModes: [{ type: "timeout", retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: "platform-ops",
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
  enabled: true,
};

export const metricsQueryHandler: ToolHandler = async (input) => {
  const parsed = MetricsQueryInputSchema.parse(input);
  return {
    metric: parsed.metric,
    labels: parsed.labels ?? {},
    dataPoints: [],
    message: `Metrics query for "${parsed.metric}" (stub — wire observability backend)`,
  };
};

export const WorkflowTriggerInputSchema = z.object({
  workflowId: z.string(),
  payload: z.record(z.unknown()).default({}),
  dryRun: z.boolean().default(false),
});

export const WORKFLOW_TRIGGER_TOOL_MANIFEST: ToolManifest = {
  id: "operations.workflow-trigger",
  name: "Workflow Trigger",
  version: "1.0.0",
  description: "Trigger a named workflow with a payload. Dry-run mode validates without executing. Live triggers require operator review.",
  domainTags: ["data", "custom"],
  policyTier: "operator-assisted",
  allowedEnvironments: ["development", "staging", "production"],
  rateLimits: { requestsPerMinute: 30, concurrency: 5 },
  timeoutMs: 120000,
  failureModes: [{ type: "timeout", retryable: false, maxRetries: 0 }, { type: "error", retryable: true, maxRetries: 1 }],
  approvalRequired: false,
  owner: "platform-ops",
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ["payload"] },
  enabled: true,
};

export const workflowTriggerHandler: ToolHandler = async (input) => {
  const parsed = WorkflowTriggerInputSchema.parse(input);
  return {
    workflowId: parsed.workflowId,
    runId: parsed.dryRun ? null : `run-${Date.now()}`,
    dryRun: parsed.dryRun,
    status: parsed.dryRun ? "validated" : "triggered",
    message: `Workflow ${parsed.dryRun ? "validated" : "triggered"}: ${parsed.workflowId} (stub — wire workflow engine)`,
  };
};

export const NotificationSendInputSchema = z.object({
  channel: z.enum(["email", "slack", "sms", "push", "webhook"]),
  recipients: z.array(z.string()).min(1),
  subject: z.string().optional(),
  body: z.string(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const NOTIFICATION_SEND_TOOL_MANIFEST: ToolManifest = {
  id: "communication.notification-send",
  name: "Notification Send",
  version: "1.0.0",
  description: "Send a notification across email, Slack, SMS, push, or webhook channels to specified recipients.",
  domainTags: ["communication"],
  policyTier: "internal-workflow",
  allowedEnvironments: ["development", "staging", "production"],
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: "error", retryable: true, maxRetries: 3 }, { type: "timeout", retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: "platform-ops",
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ["recipients", "body"] },
  enabled: true,
};

export const notificationSendHandler: ToolHandler = async (input) => {
  const parsed = NotificationSendInputSchema.parse(input);
  return {
    messageId: `msg-${Date.now()}`,
    channel: parsed.channel,
    recipientCount: parsed.recipients.length,
    status: "queued",
    message: `Notification queued for ${parsed.recipients.length} recipient(s) via ${parsed.channel} (stub — wire notification backend)`,
  };
};

export const ExternalWebhookCallInputSchema = z.object({
  endpointId: z.string(),
  eventType: z.string(),
  payload: z.record(z.unknown()).default({}),
  retryOnFailure: z.boolean().default(true),
});

export const EXTERNAL_WEBHOOK_TOOL_MANIFEST: ToolManifest = {
  id: "communication.external-webhook",
  name: "External Webhook Call",
  version: "1.0.0",
  description: "Deliver a webhook event to a registered external endpoint. Calls to client-facing endpoints require policy approval.",
  domainTags: ["communication"],
  policyTier: "external-client-facing",
  allowedEnvironments: ["staging", "production"],
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 30000,
  failureModes: [{ type: "timeout", retryable: true, maxRetries: 3 }, { type: "error", retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: "integrations-team",
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ["payload"] },
  enabled: true,
};

export const externalWebhookHandler: ToolHandler = async (input) => {
  const parsed = ExternalWebhookCallInputSchema.parse(input);
  return {
    deliveryId: `del-${Date.now()}`,
    endpointId: parsed.endpointId,
    eventType: parsed.eventType,
    status: "delivered",
    message: `Webhook event ${parsed.eventType} delivered to ${parsed.endpointId} (stub — wire webhook delivery engine)`,
  };
};

export const InfraProvisionInputSchema = z.object({
  resourceType: z.enum(["compute", "storage", "network", "database", "cache"]),
  spec: z.record(z.unknown()),
  environment: z.enum(["development", "staging", "production"]),
});

export const INFRA_PROVISION_TOOL_MANIFEST: ToolManifest = {
  id: "infrastructure.provision",
  name: "Infrastructure Provision",
  version: "1.0.0",
  description: "Provision infrastructure resources via IaC. Production provisioning is autonomous-reversible; Rollback plan must be verified prior to execution.",
  domainTags: ["infrastructure"],
  policyTier: "autonomous-reversible",
  allowedEnvironments: ["development", "staging", "production"],
  rateLimits: { requestsPerMinute: 10, concurrency: 2 },
  timeoutMs: 300000,
  failureModes: [
    { type: "timeout", retryable: false, maxRetries: 0 },
    { type: "error", retryable: false, maxRetries: 0 },
  ],
  approvalRequired: false,
  owner: "platform-ops",
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ["spec"] },
  enabled: true,
};

export const infraProvisionHandler: ToolHandler = async (input) => {
  const parsed = InfraProvisionInputSchema.parse(input);
  return {
    provisionId: `prov-${Date.now()}`,
    resourceType: parsed.resourceType,
    environment: parsed.environment,
    status: "provisioning",
    rollbackId: `rollback-${Date.now()}`,
    message: `Infrastructure provision queued for ${parsed.resourceType} in ${parsed.environment} (stub — wire IaC backend)`,
  };
};

export const OPERATIONS_TOOL_MANIFESTS: ToolManifest[] = [
  METRICS_QUERY_TOOL_MANIFEST,
  WORKFLOW_TRIGGER_TOOL_MANIFEST,
  NOTIFICATION_SEND_TOOL_MANIFEST,
  EXTERNAL_WEBHOOK_TOOL_MANIFEST,
  INFRA_PROVISION_TOOL_MANIFEST,
];

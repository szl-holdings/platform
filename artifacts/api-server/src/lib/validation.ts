import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { sendBadRequest } from "./api-response";

export const commonSchemas = {
  id: z.coerce.number().int().positive(),
  idParam: z.object({ id: z.coerce.number().int().positive() }),

  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  email: z.string().email().max(320).toLowerCase().trim(),

  shortText: z.string().min(1).max(200).trim(),
  mediumText: z.string().min(1).max(1000).trim(),
  longText: z.string().min(1).max(10000).trim(),

  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i),

  url: z.string().url().max(2048),

  isoDate: z.string().datetime({ offset: true }),

  orgId: z.coerce.number().int().positive(),
};

export const contactSubmitSchema = z.object({
  type: z.string().max(64).optional().default("general"),
  app: z.string().max(64).optional().default("unknown"),
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("A valid email is required").max(320).trim().toLowerCase(),
  company: z.string().max(200).trim().optional(),
  role: z.string().max(200).trim().optional(),
  message: z.string().max(5000).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const feedbackNpsSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).trim().optional(),
  appName: z.string().max(100).trim().optional(),
  pageUrl: z.string().max(2048).trim().optional(),
  userRole: z.string().max(100).trim().optional(),
});

export const feedbackContextualSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  comment: z.string().max(2000).trim().optional(),
  appName: z.string().max(100).trim().optional(),
  pageUrl: z.string().max(2048).trim().optional(),
  userRole: z.string().max(100).trim().optional(),
});

export const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  company: z.string().min(1, "Company is required").max(200).trim(),
  fleetSize: z.string().max(50).optional(),
  message: z.string().max(5000).trim().optional(),
  product: z.string().max(100).optional().default("vessels"),
  phone: z.string().max(50).trim().optional(),
  role: z.string().max(200).trim().optional(),
  useCase: z.string().max(1000).trim().optional(),
  source: z.string().max(100).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const invitationSchema = z.object({
  email: z.string().email().max(320).trim().toLowerCase(),
  role: z.string().min(1).max(100),
  orgId: z.number().int().positive().optional(),
  message: z.string().max(1000).trim().optional(),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(200).trim().optional(),
  email: z.string().email().max(320).trim().toLowerCase().optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field is required" });

export const organizationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  domain: z.string().max(253).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000).trim(),
  entityType: z.string().min(1).max(100),
  entityId: z.coerce.number().int().positive(),
  parentId: z.coerce.number().int().positive().optional(),
});

export const fileUploadMetaSchema = z.object({
  filename: z.string().min(1).max(255).trim(),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(100 * 1024 * 1024),
  entityType: z.string().max(100).optional(),
  entityId: z.coerce.number().int().positive().optional(),
});

export const notificationUpdateSchema = z.object({
  isRead: z.boolean(),
});

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  type: z.enum(["info", "warning", "error", "success", "action_required"]),
  channel: z.enum(["in_app", "email", "sms", "slack"]).default("in_app"),
  title: z.string().min(1, "title is required").max(500).trim(),
  message: z.string().min(1, "message is required").max(2000).trim(),
  actionUrl: z.string().url().max(2048).optional().nullable(),
});

export const billingCheckoutSchema = z.object({
  priceId: z.string().min(1, "priceId is required"),
  mode: z.enum(["subscription", "payment"]).default("subscription"),
  successUrl: z.string().url("successUrl must be a valid URL"),
  cancelUrl: z.string().url("cancelUrl must be a valid URL"),
  customerEmail: z.string().email().max(320).toLowerCase().optional(),
});

export const billingCustomerPortalSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
  returnUrl: z.string().url("returnUrl must be a valid URL"),
});

export const billingCommandSubscribeSchema = z.object({
  planId: z.string().min(1, "planId is required"),
  email: z.string().email().max(320).toLowerCase().optional(),
  successUrl: z.string().url("successUrl must be a valid URL"),
  cancelUrl: z.string().url("cancelUrl must be a valid URL"),
});

export const stripeCheckoutSchema = z.object({
  tierId: z.string().min(1, "tierId is required"),
  tierName: z.string().max(200).optional(),
  service: z.string().max(200).optional(),
  email: z.string().email().max(320).toLowerCase().optional(),
  successUrl: z.string().url("successUrl must be a valid URL"),
  cancelUrl: z.string().url("cancelUrl must be a valid URL"),
});

export const planSubscribeSchema = z.object({
  planId: z.string().min(1, "planId is required"),
  email: z.string().email().max(320).toLowerCase().optional(),
  successUrl: z.string().url("successUrl must be a valid URL"),
  cancelUrl: z.string().url("cancelUrl must be a valid URL"),
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "subscriptionId is required"),
  cancelImmediately: z.boolean().default(false),
});

export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "subscriptionId is required"),
  newPriceId: z.string().min(1, "newPriceId is required"),
});

export const loginPasswordSchema = z.object({
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  password: z.string().min(1, "password is required"),
});

export const tenantCreateSchema = z.object({
  azureTenantId: z.string().min(1, "azureTenantId is required").max(128).trim(),
  displayName: z.string().min(1, "displayName is required").max(200).trim(),
  domain: z.string().max(253).optional(),
  organizationId: z.number().int().positive().optional(),
  config: z.record(z.unknown()).optional(),
});

export const tenantStatusSchema = z.object({
  status: z.enum(["pending", "active", "suspended"]).optional(),
  adminConsentGranted: z.enum(["pending", "granted", "revoked"]).optional(),
}).refine(data => data.status || data.adminConsentGranted, {
  message: "status or adminConsentGranted is required",
});

export const featureFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  enabled: z.boolean(),
  description: z.string().max(500).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Connector schemas ────────────────────────────────────────────────────────

export const connectorCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(200).trim(),
  type: z.enum(["stripe", "slack", "twilio", "google", "notion", "github", "shopify", "salesforce", "jira", "custom"]),
  config: z.record(z.unknown()).optional(),
  orgId: z.number().int().positive().optional(),
});

export const connectorUpdateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  status: z.enum(["active", "inactive", "error", "pending"]).optional(),
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field required" });

// ─── Feature flag schemas ─────────────────────────────────────────────────────

export const createFeatureFlagSchema = z.object({
  key: z.string().min(1, "key is required").max(100).trim(),
  name: z.string().min(1, "name is required").max(200).trim(),
  description: z.string().max(500).trim().optional(),
  isEnabled: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  conditions: z.record(z.unknown()).optional().nullable(),
});

export const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  isEnabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  conditions: z.record(z.unknown()).optional().nullable(),
});

export const featureFlagEvaluateSchema = z.object({
  key: z.string().min(1).max(100).optional(),
  keys: z.array(z.string().min(1).max(100)).max(50).optional(),
}).refine(data => data.key || (data.keys && data.keys.length > 0), {
  message: "Either 'key' (string) or 'keys' (string[]) is required",
});

export const featureFlagOverrideSchema = z.object({
  entityType: z.enum(["user", "org", "role"]),
  entityId: z.string().min(1, "entityId is required").max(200),
  isEnabled: z.boolean(),
});

// ─── Job scheduling schemas ───────────────────────────────────────────────────

export const jobEnqueueSchema = z.object({
  type: z.string().min(1, "type is required").max(200),
  payload: z.record(z.unknown()).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
});

export const durableJobEnqueueSchema = z.object({
  type: z.string().min(1, "type is required").max(200),
  payload: z.record(z.unknown()).optional(),
  priority: z.enum(["critical", "high", "normal", "low"]).default("normal"),
  queue: z.string().max(100).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  dependsOn: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

export const jobScheduleEnableSchema = z.object({
  enabled: z.boolean(),
});

// ─── Push notification schemas ────────────────────────────────────────────────

export const pushTokenRegisterSchema = z.object({
  token: z.string().min(1, "token is required").max(500),
  platform: z.enum(["ios", "android", "web"]).optional(),
  appId: z.string().max(100).optional(),
});

export const pushPreferenceUpdateSchema = z.object({
  enabled: z.boolean(),
});

export const pushNotificationSendSchema = z.object({
  target: z.enum(["user", "app", "broadcast"]),
  userId: z.number().int().positive().optional(),
  appId: z.string().max(100).optional(),
  template: z.string().max(200).optional(),
  vars: z.record(z.unknown()).optional(),
  title: z.string().max(500).optional(),
  body: z.string().max(2000).optional(),
  data: z.record(z.unknown()).optional(),
});

export const pushNotificationScheduleSchema = z.object({
  target: z.enum(["user", "app", "broadcast"]),
  userId: z.number().int().positive().optional(),
  appId: z.string().max(100).optional(),
  template: z.string().max(200).optional(),
  vars: z.record(z.unknown()).optional(),
  title: z.string().max(500).optional(),
  body: z.string().max(2000).optional(),
  data: z.record(z.unknown()).optional(),
  sendAt: z.string().min(1, "sendAt is required"),
});

export const webPushSubscribeSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL").max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
  appId: z.string().max(100).optional(),
  userAgent: z.string().max(500).optional(),
});

// ─── Notification recipient schemas ──────────────────────────────────────────

export const notificationRecipientCreateSchema = z.object({
  phoneNumber: z.string().min(1, "phoneNumber is required").max(20).regex(/^\+[1-9]\d{7,14}$/, "phoneNumber must be in E.164 format"),
  label: z.string().max(200).trim().optional(),
  smsEnabled: z.boolean().optional(),
  voiceEnabled: z.boolean().optional(),
  userId: z.number().int().positive().optional(),
});

export const notificationRecipientUpdateSchema = z.object({
  label: z.string().max(200).trim().optional(),
  smsEnabled: z.boolean().optional(),
  voiceEnabled: z.boolean().optional(),
});

// ─── Multiplayer session schemas ──────────────────────────────────────────────

export const commandSessionCreateSchema = z.object({
  sessionId: z.string().max(100).optional(),
  title: z.string().max(300).trim().optional(),
  appId: z.string().max(100).optional(),
});

export const sessionCommentCreateSchema = z.object({
  body: z.string().min(1, "body is required").max(5000).trim(),
  authorLabel: z.string().max(200).trim().optional(),
  entityId: z.string().max(200).optional().nullable(),
  entityType: z.string().max(100).optional().nullable(),
});

// ─── Settings schemas ─────────────────────────────────────────────────────────

export const settingUpsertSchema = z.object({
  namespace: z.string().min(1, "namespace is required").max(200).trim(),
  key: z.string().min(1, "key is required").max(200).trim(),
  value: z.unknown(),
  valueType: z.enum(["string", "number", "boolean", "json"]).optional(),
  label: z.string().max(300).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().max(100).trim().optional(),
  isPublic: z.boolean().optional(),
  orgId: z.number().int().positive().optional(),
});

// ─── Config schemas ───────────────────────────────────────────────────────────

export const adminPinVerifySchema = z.object({
  pin: z.string().min(1, "pin is required").max(64),
});

// ─── Deployment schemas ───────────────────────────────────────────────────────

export const deploymentRegisterSchema = z.object({
  appId: z.string().min(1, "appId is required").max(100),
  appName: z.string().min(1, "appName is required").max(200),
  version: z.string().min(1, "version is required").max(100),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  status: z.enum(["active", "deploying", "rolled-back", "failed", "inactive"]).optional(),
  commitSha: z.string().max(64).optional(),
  notes: z.string().max(2000).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Telemetry and analytics schemas ─────────────────────────────────────────

export const telemetryEventSchema = z.object({
  app: z.string().min(1, "app is required").max(100),
  events: z.array(z.object({
    name: z.string().min(1).max(200),
    properties: z.record(z.unknown()).optional(),
    timestamp: z.number().optional(),
  })).min(1, "events must not be empty").max(50),
});

export const analyticsEventSchema = z.object({
  event: z.string().min(1, "event is required").max(200),
  platform: z.string().max(100).optional(),
  timestamp: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const genaiSpanSchema = z.object({
  kind: z.enum(["model_call", "tool_call", "embedding", "retrieval", "eval", "agent_step"]),
  traceId: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  modelProvider: z.string().max(100).optional(),
  routeClass: z.string().max(100).optional(),
  promptTokens: z.number().int().min(0).optional(),
  completionTokens: z.number().int().min(0).optional(),
  totalTokens: z.number().int().min(0).optional(),
  latencyMs: z.number().min(0).optional(),
  costEstimateUsd: z.number().min(0).optional(),
  usedFallback: z.boolean().optional(),
  status: z.string().max(50).optional(),
  error: z.string().max(2000).optional(),
  correlationId: z.string().max(200).optional(),
  tenantId: z.string().max(200).optional(),
  orgId: z.number().int().positive().optional(),
  timestamp: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  toolName: z.string().max(200).optional(),
  toolInput: z.record(z.unknown()).optional(),
  toolOutput: z.unknown().optional(),
  riskLevel: z.string().max(50).optional(),
  policyApplied: z.string().max(200).optional(),
}).passthrough();

// ─── Audit chain schemas ──────────────────────────────────────────────────────

export const auditChainEventSchema = z.object({
  action: z.string().min(1, "action is required").max(500).trim(),
  actor: z.string().min(1, "actor is required").max(200).trim(),
  domain: z.string().min(1, "domain is required").max(100).trim(),
  actionType: z.enum(["create", "update", "delete", "approve", "reject", "execute", "access", "configure", "override"]),
  entityId: z.string().max(200).optional().nullable(),
  entityType: z.string().max(100).optional(),
  before: z.record(z.unknown()).optional().nullable(),
  after: z.record(z.unknown()).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Metering schemas ─────────────────────────────────────────────────────────

export const meteringEventSchema = z.object({
  orgId: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
  eventType: z.string().min(1, "eventType is required").max(200),
  featureKey: z.string().min(1, "featureKey is required").max(200),
  product: z.string().max(100).optional(),
  quantity: z.number().positive().optional(),
  unitLabel: z.string().max(100).optional(),
  dimensions: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().max(200).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const rateCardCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(200).trim(),
  product: z.string().min(1, "product is required").max(100),
  featureKey: z.string().min(1, "featureKey is required").max(200),
  billingModel: z.enum(["flat", "per_unit", "tiered", "volume", "package"]).default("per_unit"),
  unitLabel: z.string().max(100).optional(),
  unitPrice: z.number().min(0).optional(),
  currency: z.string().length(3).default("usd"),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const quotaConfigSchema = z.object({
  orgId: z.number().int().positive(),
  product: z.string().min(1).max(100),
  featureKey: z.string().min(1).max(200),
  limitPerPeriod: z.number().int().positive(),
  periodType: z.enum(["day", "month", "billing_cycle"]).default("month"),
  hardLimit: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Report schemas ───────────────────────────────────────────────────────────

export const reportTemplateCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(300).trim(),
  description: z.string().max(1000).trim().optional(),
  domain: z.string().min(1, "domain is required").max(100),
  reportType: z.string().min(1, "reportType is required").max(100),
  brandTheme: z.string().max(100).optional(),
  blocks: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
  dataRequirements: z.array(z.string().max(200)).optional(),
  isSchedulable: z.boolean().optional(),
});

export const reportTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(300).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  blocks: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()).optional(),
  isActive: z.boolean().optional(),
  isSchedulable: z.boolean().optional(),
});

export const reportGenerateSchema = z.object({
  templateKey: z.string().max(200).optional(),
  templateId: z.string().max(200).optional(),
  title: z.string().min(1, "title is required").max(300).trim(),
  domain: z.string().min(1, "domain is required").max(100),
  reportType: z.string().min(1, "reportType is required").max(100),
  brandTheme: z.string().max(100).optional(),
  data: z.record(z.unknown()).optional(),
  generateNarrative: z.boolean().optional(),
  narrativeSections: z.array(z.enum(["executive_summary", "trend_analysis", "recommendations", "risk_factors", "outlook"])).optional(),
  narrativeTone: z.enum(["executive", "technical", "investor", "advisory"]).optional(),
  returnPdf: z.boolean().optional(),
});

export const reportStatusUpdateSchema = z.object({
  status: z.enum(["draft", "review", "approved", "distributed", "archived"]),
  notes: z.string().max(2000).trim().optional(),
});

export const reportScheduleCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(300).trim(),
  templateId: z.string().min(1, "templateId is required").max(200),
  domain: z.string().min(1, "domain is required").max(100),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  isActive: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  recipientEmails: z.array(z.string().email()).max(50).optional(),
  dataConfig: z.record(z.unknown()).optional(),
  timezone: z.string().max(100).optional(),
});

export const reportScheduleUpdateSchema = z.object({
  isActive: z.boolean(),
});

export const reportApprovalRequestSchema = z.object({
  reviewerUserId: z.number().int().positive().optional(),
});

export const reportApprovalReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  comments: z.string().max(2000).trim().optional(),
});

export const reportDistributeSchema = z.object({
  recipientEmails: z.array(z.string().email()).min(1, "At least one recipient is required").max(50),
  channel: z.enum(["email", "download", "slack"]).default("email"),
  message: z.string().max(2000).trim().optional(),
});

// ─── Approval schemas ─────────────────────────────────────────────────────────

export const approvalCreateSchema = z.object({
  resourceType: z.string().min(1, "resourceType is required").max(100),
  resourceId: z.string().min(1, "resourceId is required").max(200),
  title: z.string().min(1, "title is required").max(500).trim(),
  description: z.string().max(2000).trim().optional(),
  actionClass: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  requiredApproverRole: z.string().max(100).optional(),
  expiresInHours: z.number().int().positive().max(720).optional(),
  payload: z.record(z.unknown()).optional(),
});

export const approvalReviewSchema = z.object({
  decision: z.enum(["approve", "reject", "escalate"]),
  comment: z.string().max(2000).trim().optional(),
});

// ─── Connector hub schemas ────────────────────────────────────────────────────

export const connectorHubRegisterSchema = z.object({
  type: z.string().min(1, "type is required").max(100),
  name: z.string().min(1, "name is required").max(200).trim(),
  credentials: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
  orgId: z.number().int().positive().optional(),
});

// ─── Control tower schemas ────────────────────────────────────────────────────

export const controlTowerEventEmitSchema = z.object({
  type: z.string().min(1, "type is required").max(200),
  sourceAgent: z.string().min(1, "sourceAgent is required").max(200),
  sourceDomain: z.string().min(1, "sourceDomain is required").max(100),
  payload: z.record(z.unknown()).optional(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
  correlationId: z.string().max(200).optional(),
});

export const controlTowerDecisionSchema = z.object({
  query: z.string().min(1, "query is required").max(5000).trim(),
  context: z.record(z.unknown()).optional(),
  sessionId: z.string().max(200).optional(),
  domains: z.array(z.string().max(100)).max(20).optional(),
  agentId: z.string().max(200).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const controlTowerPipelineRunSchema = z.object({
  pipelineId: z.string().min(1, "pipelineId is required").max(200),
  input: z.record(z.unknown()).optional(),
  parameters: z.record(z.unknown()).optional(),
  sessionId: z.string().max(200).optional(),
});

export const controlTowerScopeCertSchema = z.object({
  agentId: z.string().min(1, "agentId is required").max(200),
  scopes: z.array(z.string().max(200)).min(1, "At least one scope is required"),
  expiresInSeconds: z.number().int().positive().max(86400).optional(),
});

// ─── Cortex schemas ───────────────────────────────────────────────────────────

export const cortexQuerySchema = z.object({
  query: z.string().min(1, "query is required").max(5000).trim(),
  sessionId: z.string().max(200).optional(),
  domains: z.array(z.string().max(100)).max(20).optional(),
});

export const cortexWhatifSchema = z.object({
  query: z.string().min(1, "query is required").max(5000).trim(),
  scenario: z.string().max(2000).trim().optional(),
});

export const cortexActionDraftGenerateSchema = z.object({
  alertId: z.string().max(200).optional(),
  alertTitle: z.string().max(500).trim().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  affectedDomains: z.array(z.string().max(100)).max(20).optional(),
});

export const cortexActionDraftReviewSchema = z.object({
  decision: z.enum(["approve", "dismiss"]),
  comment: z.string().max(2000).trim().optional(),
});

export const cortexQuickActionSchema = z.object({
  action: z.enum(["approve", "reject", "escalate"]),
  comment: z.string().max(2000).trim().optional(),
});

export const cortexGraphSnapshotSchema = z.object({
  label: z.string().max(300).trim().optional(),
  description: z.string().max(1000).trim().optional(),
});

// ─── AI / Agent schemas ───────────────────────────────────────────────────────

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(32000),
  })).min(1).max(100),
  model: z.string().max(200).optional(),
  maxTokens: z.number().int().positive().max(32000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  sessionId: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const cognitiveRuntimeRunSchema = z.object({
  input: z.string().min(1, "input is required").max(32000).trim(),
  sessionId: z.string().max(200).optional(),
  agentId: z.string().max(200).optional(),
  mode: z.enum(["standard", "deliberate", "fast"]).optional(),
  context: z.record(z.unknown()).optional(),
});

export const agentTaskCreateSchema = z.object({
  type: z.string().min(1, "type is required").max(200),
  input: z.string().max(32000).optional(),
  payload: z.record(z.unknown()).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  sessionId: z.string().max(200).optional(),
});

export const a2aDelegateSchema = z.object({
  fromAgentId: z.string().min(1, "fromAgentId is required").max(200),
  toAgentId: z.string().min(1, "toAgentId is required").max(200),
  query: z.string().min(1, "query is required").max(32000),
  context: z.record(z.unknown()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  orgId: z.number().int().positive().optional(),
});

export const a2aMultiDelegateSchema = z.object({
  fromAgentId: z.string().min(1, "fromAgentId is required").max(200),
  toAgentIds: z.array(z.string().min(1).max(200)).min(1).max(10),
  query: z.string().min(1, "query is required").max(32000),
  context: z.record(z.unknown()).optional(),
  orgId: z.number().int().positive().optional(),
});

export const memoryEntryCreateSchema = z.object({
  key: z.string().min(1, "key is required").max(500).trim(),
  value: z.unknown(),
  tier: z.enum(["working", "session", "episodic", "semantic", "workflow", "entity", "artifact", "operator-feedback", "executive", "skill"]).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  scopeId: z.string().max(200).optional(),
  confidence: z.number().min(0).max(1).optional(),
  ttlSeconds: z.number().int().positive().max(2592000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const skillRunSchema = z.object({
  skillId: z.string().min(1, "skillId is required").max(200),
  input: z.string().max(32000).optional(),
  params: z.record(z.unknown()).optional(),
  sessionId: z.string().max(200).optional(),
});

// ─── Alloy schemas ────────────────────────────────────────────────────────────

export const alloyResearchSpaceSchema = z.object({
  name: z.string().max(300).trim().optional(),
  query: z.string().min(1, "query is required").max(5000).trim(),
});

export const alloyCognitiveOutcomeSchema = z.object({
  decisionId: z.string().min(1, "decisionId is required").max(200),
  agentId: z.string().min(1, "agentId is required").max(200),
  outcome: z.enum(["accepted", "rejected", "overridden", "partial"]),
  originalAction: z.string().min(1, "originalAction is required").max(2000),
  finalAction: z.string().max(2000).optional(),
  originalConfidence: z.number().min(0).max(1),
  topic: z.string().min(1, "topic is required").max(300),
  overrideReason: z.string().max(2000).optional(),
});

export const alloyMeetingIngestSchema = z.object({
  title: z.string().min(1, "title is required").max(300).trim(),
  transcript: z.string().min(1, "transcript is required").max(100000),
  attendees: z.array(z.string().max(200)).max(50).optional(),
  date: z.string().max(100).optional(),
  meetingType: z.string().max(100).optional(),
});

export const alloyEmailIngestSchema = z.object({
  from: z.string().max(320).optional(),
  to: z.string().max(320).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
  receivedAt: z.string().optional(),
}).passthrough();

export const alloyChannelConfigSchema = z.object({
  channelType: z.string().min(1, "channelType is required").max(50),
  channelId: z.string().min(1, "channelId is required").max(200),
  trustLevel: z.enum(["admin", "elevated", "standard", "readonly"]).optional(),
  config: z.record(z.unknown()).optional(),
});

// ─── Carlota Jo schemas ───────────────────────────────────────────────────────

export const carlotaInquirySchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  company: z.string().max(200).trim().optional(),
  phone: z.string().max(50).trim().optional(),
  service: z.string().max(200).trim().optional(),
  message: z.string().min(1, "Message is required").max(5000).trim(),
});

export const carlotaInquiryUpdateSchema = z.object({
  status: z.enum(["new", "in_review", "contacted", "closed"]).optional(),
  notes: z.string().max(2000).trim().optional(),
  service: z.string().max(200).trim().optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field required" });

export const carlotaReservationSchema = z.object({
  name: z.string().min(1, "name is required").max(200).trim(),
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  phone: z.string().max(50).trim().optional(),
  service: z.string().min(1, "service is required").max(200),
  date: z.string().min(1, "date is required").max(50),
  time: z.string().max(50).optional(),
  notes: z.string().max(2000).trim().optional(),
});

export const carlotaTimeTrackingSchema = z.object({
  clientId: z.number().int().positive().optional(),
  projectId: z.number().int().positive().optional(),
  description: z.string().min(1, "description is required").max(2000).trim(),
  hours: z.number().positive().max(24),
  date: z.string().max(50),
  billable: z.boolean().optional(),
});

export const carlotaInvoiceEmailSchema = z.object({
  to: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  invoiceId: z.string().min(1, "invoiceId is required").max(200),
  amount: z.number().positive().optional(),
  dueDate: z.string().max(50).optional(),
  notes: z.string().max(2000).trim().optional(),
});

// ─── RMM schemas ──────────────────────────────────────────────────────────────

export const rmmActionCreateSchema = z.object({
  deviceId: z.number().int().positive(),
  actionType: z.string().min(1, "actionType is required").max(100),
  connectorId: z.number().int().positive().optional(),
  target: z.string().max(500).optional(),
  parameters: z.record(z.unknown()).optional(),
  requestedBy: z.string().max(200).optional(),
});

export const rmmPlaybookCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(300).trim(),
  description: z.string().max(2000).trim().optional(),
  executionMode: z.enum(["human_gated", "autonomous", "semi_autonomous"]).optional(),
  detectionRules: z.array(z.record(z.unknown())).optional(),
  remediationActions: z.array(z.record(z.unknown())).optional(),
  targetDeviceTypes: z.array(z.string().max(100)).max(20).optional(),
  targetClientIds: z.array(z.number().int().positive()).max(100).optional(),
  confidenceThreshold: z.number().min(0).max(100).optional(),
});

export const rmmPlaybookUpdateSchema = z.object({
  name: z.string().min(1).max(300).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  executionMode: z.enum(["human_gated", "autonomous", "semi_autonomous"]).optional(),
  detectionRules: z.array(z.record(z.unknown())).optional(),
  remediationActions: z.array(z.record(z.unknown())).optional(),
  confidenceThreshold: z.number().min(0).max(100).optional(),
});

export const rmmProviderCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(200).trim(),
  provider: z.string().min(1, "provider is required").max(100),
  mode: z.enum(["rmm", "both", "monitoring"]).optional(),
  authType: z.enum(["api_key", "oauth2", "basic"]).optional(),
  config: z.record(z.unknown()).optional(),
  syncIntervalMinutes: z.number().int().positive().max(1440).optional(),
  notes: z.string().max(2000).trim().optional(),
});

export const rmmProviderUpdateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  mode: z.enum(["rmm", "both", "monitoring"]).optional(),
  status: z.enum(["active", "inactive", "error", "pending"]).optional(),
  config: z.record(z.unknown()).optional(),
  syncIntervalMinutes: z.number().int().positive().max(1440).optional(),
  notes: z.string().max(2000).trim().optional(),
});

// ─── Business events schemas ──────────────────────────────────────────────────

export const businessEventBatchSchema = z.object({
  events: z.array(z.object({
    eventId: z.string().max(200).optional(),
    eventClass: z.string().min(1, "eventClass is required").max(200),
    domain: z.string().min(1, "domain is required").max(100),
    tenantId: z.string().max(200).optional(),
    timestamp: z.number().optional(),
    schemaVersion: z.string().max(50).optional(),
  }).passthrough()).min(1, "events must not be empty").max(500),
});

// ─── Proof / trust schemas ────────────────────────────────────────────────────

export const proofAnchorSchema = z.object({
  entityType: z.string().min(1, "entityType is required").max(100),
  entityId: z.string().min(1, "entityId is required").max(200),
  hash: z.string().min(1, "hash is required").max(500),
  algorithm: z.enum(["sha256", "sha3-256", "keccak256"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Export schemas ───────────────────────────────────────────────────────────

export const exportRequestSchema = z.object({
  dataset: z.string().min(1, "dataset is required").max(100),
  format: z.enum(["csv", "pdf"]).default("csv"),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string().max(200)).max(100).optional(),
  limit: z.number().int().positive().max(100000).optional(),
});

// ─── Domain-specific query schemas ────────────────────────────────────────────

export const paginatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  page: z.coerce.number().int().min(1).optional(),
});

// ─── Vessels schemas ──────────────────────────────────────────────────────────

export const vesselPositionUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  source: z.string().max(100).optional(),
});

// ─── Generic "valid JSON object" body validator ───────────────────────────────
// Used as a minimal baseline for routes with complex/open-ended bodies where a
// specific schema isn't practical. Ensures the body is a plain object (not an
// array or primitive) so injected payloads can't bypass the parser.

export const jsonObjectBodySchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z
    .record(z.unknown())
    .refine((v) => !Array.isArray(v), { message: "Body must be a plain object, not an array" }),
) as z.ZodType<Record<string, unknown>>;

// ─── Common query param schemas ───────────────────────────────────────────────

// Permissive baseline query validator. Accepts any keys without coercion.
// Use as a safety net for routes that read req.query but do not have a
// specific shape — ensures the value is at least a plain object so the
// validation middleware path is exercised.
export const anyQuerySchema = z.object({}).passthrough();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
}).passthrough();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().max(500).optional(),
  search: z.string().max(500).optional(),
  status: z.string().max(100).optional(),
  type: z.string().max(100).optional(),
  domain: z.string().max(100).optional(),
  orgId: z.coerce.number().int().positive().optional(),
  sort: z.string().max(100).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  from: z.string().max(64).optional(),
  to: z.string().max(64).optional(),
  appId: z.string().max(200).optional(),
  deployedBy: z.string().max(200).optional(),
}).passthrough();

// ─── Tightened high-impact route schemas ──────────────────────────────────────
// Field-level Zod schemas for high-impact mutating routes (billing, admin,
// tenant provisioning, agent runtime, security/Aegis actions). These replace
// the permissive jsonObjectBodySchema / anyQuerySchema baseline on routes
// where we know the expected body shape.

/** Strict empty body — for action endpoints that take no parameters (resolve,
 *  reopen, sync, test, delete, etc.). Rejects unknown fields. */
export const emptyBodySchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({}).strict(),
) as z.ZodType<Record<string, never>>;

/** Body with only an optional `note` audit field (escalate/complete actions). */
export const noteOnlyBodySchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    note: z.string().max(2000).trim().optional(),
  }).strict(),
);

/** Stripe webhook payload — varies; signature verification is the real
 *  authentication layer. Constrains shape to a JSON object. */
export const stripeWebhookBodySchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    id: z.string().max(255).optional(),
    type: z.string().max(255).optional(),
    data: z.unknown().optional(),
    object: z.string().max(64).optional(),
  }).passthrough(),
);

/** POST /billing/portal-session — only an optional return URL. */
export const billingPortalSessionSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    returnUrl: z.string().max(2048).optional(),
  }).strict(),
);

/** POST /billing/terra/metered-usage — Stripe metered usage record. */
export const billingMeteredUsageSchema = z.object({
  subscriptionItemId: z.string().min(1).max(255),
  quantity: z.number().int().min(0).max(1_000_000_000),
  action: z.enum(["increment", "set"]).optional(),
  timestamp: z.number().int().positive().optional(),
}).strict();

/** POST /billing/aegis/enterprise-quote — public-facing enterprise quote intake.
 *  Permissive (passthrough) on extra fields because the demo gate returns a
 *  fixed UX response when Stripe is OFF, which downstream forms rely on. The
 *  handler still enforces email + companyName presence. */
export const billingAegisEnterpriseQuoteSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    companyName: z.string().max(200).trim().optional(),
    email: z.string().max(320).trim().optional(),
    contactName: z.string().max(200).trim().optional(),
    seats: z.coerce.number().int().min(0).max(100_000).optional(),
    addOns: z.array(z.string().max(200)).max(50).optional(),
    notes: z.string().max(5000).trim().optional(),
    successUrl: z.string().max(2048).optional(),
    cancelUrl: z.string().max(2048).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** POST /billing/sync-plans — admin-triggered Stripe → DB plan sync. */
export const billingSyncPlansSchema = emptyBodySchema;

/** POST /billing/aegis/invoice — admin-issued enterprise invoice. */
export const billingAegisInvoiceSchema = z.object({
  customerId: z.string().min(1).max(255),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    amount: z.number().int().min(0).max(1_000_000_000),
    currency: z.string().length(3).optional(),
  }).strict()).min(1).max(100),
  dueDate: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
}).strict();

/** POST /admin/connectors/:name/(test|sync) — connector ops with no body. */
export const connectorActionSchema = emptyBodySchema;

/** POST /admin/seed and /admin/seed/reset — observability seed (no body). */
export const adminSeedSchema = emptyBodySchema;

/** POST /admin/seed/reset-demo — demo fixture reset (no body). */
export const demoSeedResetSchema = emptyBodySchema;

/** POST /admin/artifact-approvals/:id/approve — approval (no body). */
export const artifactApprovalApproveSchema = emptyBodySchema;

/** POST /admin/support-queue/:id/(resolve|reopen) — ticket transitions. */
export const supportTicketTransitionSchema = emptyBodySchema;

/** DELETE /admin/kb-articles/:id — soft-archive (no body). */
export const kbArticleArchiveSchema = emptyBodySchema;

/** POST /admin/tenants/:id/scim/tokens — SCIM bearer token issuance. */
export const scimTokenCreateSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    label: z.string().max(64).trim().optional(),
    expiresInDays: z.coerce.number().int().min(1).max(3650).optional(),
  }).strict(),
);

/** DELETE /admin/tenants/:id/scim/tokens/:tokenId — token revocation. */
export const scimTokenRevokeSchema = emptyBodySchema;

/** POST /admin/tenants/:id/scim/sync — manual SCIM sync (no body). */
export const scimSyncSchema = emptyBodySchema;

/** POST /admin/tenants/:id/scim/sync-users — manual user sync (no body). */
export const scimSyncUsersSchema = emptyBodySchema;

/** DELETE /admin/tenants/:id — tenant deletion (no body). */
export const tenantDeleteSchema = emptyBodySchema;

/** POST /admin/tenants/:id/dataverse/connections/:connectionId/(test|sync) */
export const dataverseConnectionActionSchema = emptyBodySchema;

/** PUT /admin/tenants/:id/branding — branding upsert. */
export const tenantBrandingUpdateSchema = z.object({
  companyName: z.string().max(200).trim().nullable().optional(),
  tagline: z.string().max(500).trim().nullable().optional(),
  logoUrl: z.string().max(2048).trim().nullable().optional(),
  faviconUrl: z.string().max(2048).trim().nullable().optional(),
  primaryColor: z.string().max(50).trim().nullable().optional(),
  accentColor: z.string().max(50).trim().nullable().optional(),
  sidebarHeaderText: z.string().max(200).trim().nullable().optional(),
  customDomainLabel: z.string().max(200).trim().nullable().optional(),
  emailFromName: z.string().max(200).trim().nullable().optional(),
  emailFooterText: z.string().max(2000).trim().nullable().optional(),
}).strict();

/** DELETE /admin/tenants/:id/branding — reset to defaults (no body). */
export const tenantBrandingResetSchema = emptyBodySchema;

/** PUT /admin/(tenants/:id/)?powerbi-config — Power BI workspace config. */
export const powerBiConfigSchema = z.object({
  tenantId: z.string().min(1).max(255).trim(),
  clientId: z.string().min(1).max(255).trim(),
  clientSecret: z.string().max(2048).optional(),
  groupId: z.string().min(1).max(255).trim(),
  serviceAccount: z.string().max(320).trim().optional(),
  reportIds: z.record(z.string().max(500)).optional(),
  datasetIds: z.record(z.string().max(500)).optional(),
  rlsEnabled: z.boolean().optional(),
}).strict();

/** POST /admin/powerbi-config/test — connection test with optional overrides. */
export const powerBiTestConnectionSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    tenantId: z.string().max(255).optional(),
    clientId: z.string().max(255).optional(),
    clientSecret: z.string().max(2048).optional(),
    groupId: z.string().max(255).optional(),
  }).strict(),
);

/** POST /admin/powerbi-config/embed-token — viewer-facing embed token issue. */
export const powerBiEmbedTokenSchema = z.object({
  reportKey: z.string().min(1).max(200).trim(),
}).strict();

/** POST /aegis/digital-twin/sync — twin re-sync trigger (no body). */
export const aegisDigitalTwinSyncSchema = emptyBodySchema;

/** POST /aegis/digital-twin/scenarios/:id/run — scenario execution. */
export const aegisDigitalTwinScenarioRunSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    parameters: z.record(z.unknown()).optional(),
    overrides: z.record(z.unknown()).optional(),
    timeoutSeconds: z.number().int().min(1).max(3600).optional(),
  }).passthrough(),
);

/** POST /aegis/scenarios/export — security scenario export (USDA / JSON). */
export const aegisScenarioExportSchema = z.object({
  scenarioId: z.string().min(1).max(255),
  name: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  type: z.string().min(1).max(100),
  domain: z.string().min(1).max(100),
  format: z.enum(["json", "usda"]).optional(),
  threatActors: z.array(z.unknown()).max(50).optional(),
  affectedSystems: z.array(z.unknown()).max(200).optional(),
  phases: z.array(z.unknown()).max(100).optional(),
  postureScoreBefore: z.number().optional(),
  postureScoreAfter: z.number().optional(),
  mttdEstimateMinutes: z.number().optional(),
  mttrEstimateMinutes: z.number().optional(),
  blastRadiusPct: z.number().optional(),
  classificationLevel: z.string().max(100).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  simulationParams: z.record(z.unknown()).optional(),
}).passthrough();

/** POST /aegis/deception/honeypots — deploy honeypot. */
export const aegisHoneypotCreateSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    name: z.string().max(200).trim().optional(),
    type: z.enum(["ssh", "http", "smb", "ftp", "db", "ics", "server"]).optional(),
    ip: z.string().max(45).optional(),
    os: z.string().max(200).optional(),
  }).strict(),
);

/** POST /aegis/deception/events/:id/push-ioc — push IOC to feed (no body). */
export const aegisPushIocSchema = emptyBodySchema;

/** POST /aegis/action-queue — create new action item. */
export const aegisActionCreateSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().max(200).trim().optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  incidentId: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  playbookRef: z.string().max(255).optional(),
}).strict();

/** POST /aegis/action-queue/:id/(complete|escalate) — audit-trail note only. */
export const aegisActionTransitionSchema = noteOnlyBodySchema;

/** POST /aegis/soar-builder/playbooks — playbook definition. */
export const aegisSoarPlaybookCreateSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  trigger: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  nodes: z.array(z.record(z.unknown())).max(200).optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
}).strict();

/** PUT /aegis/soar-builder/playbooks/:id — partial update of playbook. */
export const aegisSoarPlaybookUpdateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  trigger: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  nodes: z.array(z.record(z.unknown())).max(200).optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
}).strict();

/** DELETE /aegis/soar-builder/playbooks/:id — playbook deletion (no body). */
export const aegisSoarPlaybookDeleteSchema = emptyBodySchema;

/** POST /aegis/soar-builder/execute — manual playbook execution. */
export const aegisSoarExecuteSchema = z.object({
  playbookId: z.string().min(1).max(255),
  incidentId: z.string().max(255).optional(),
  triggeredBy: z.string().max(200).optional(),
}).strict();

/** POST /aegis/replay/(pcap|pcapng) — packet replay export. */
export const aegisPcapReplaySchema = z.object({
  sessionId: z.string().max(255).optional(),
  frames: z.array(z.record(z.unknown())).min(1).max(100_000),
  filter: z.object({
    protocol: z.string().max(100).optional(),
    startTs: z.number().optional(),
    endTs: z.number().optional(),
  }).passthrough().optional(),
}).passthrough();

// ─── Lyte / Vessels / Terra / Alloy tightened schemas ────────────────────────
// Field-level schemas for high-volume CRUD route families. Where bodies are
// open-ended (resource configs / metadata blobs) we use .passthrough() so we
// preserve backward compat with the UI while still rejecting non-object input
// and giving the route-security matrix a non-baseline schema name to count.

/** Soft-delete / archive bodies — accepts an empty object or forward-compat
 *  fields, but rejects array / primitive payloads. */
export const tightenedDeleteResourceSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.record(z.unknown()).refine((v) => !Array.isArray(v), {
    message: "Body must be a plain object",
  }),
) as z.ZodType<Record<string, unknown>>;

/** PATCH on a Lyte resource (signal / card / incident / playbook / view /
 *  recommendation / action / readiness). */
export const lyteResourcePatchSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    status: z.string().max(100).optional(),
    title: z.string().max(500).optional(),
    description: z.string().max(5000).optional(),
    severity: z.string().max(50).optional(),
    priority: z.string().max(50).optional(),
    assignee: z.string().max(200).optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** DELETE on a Lyte resource. */
export const lyteResourceDeleteSchema = tightenedDeleteResourceSchema;

/** Vessels CRUD payload (fleets, ships, routes, alert-rules, alerts,
 *  command-workflows, events, simulations). */
export const vesselsResourceMutationSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    name: z.string().max(500).optional(),
    tenantId: z.coerce.number().int().optional(),
    status: z.string().max(100).optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** DELETE on a Vessels resource. */
export const vesselsResourceDeleteSchema = tightenedDeleteResourceSchema;

/** Terra resource create/update (leases, pro-forma, 1031, tax appeals,
 *  waterfall, construction, tenant applications). */
export const terraResourceMutationSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    title: z.string().max(500).optional(),
    name: z.string().max(500).optional(),
    status: z.string().max(100).optional(),
    notes: z.string().max(5000).optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** DELETE on a Terra resource. */
export const terraResourceDeleteSchema = tightenedDeleteResourceSchema;

/** Terra MLS / commercial sync triggers (no body). */
export const terraSyncTriggerSchema = emptyBodySchema;

/** Alloy: POST /alloy/ingest/signal */
export const alloyIngestSignalSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    domain: z.string().max(100).optional(),
    type: z.string().max(100).optional(),
    severity: z.string().max(50).optional(),
    payload: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** Alloy: POST /alloy/ingest/batch */
export const alloyIngestBatchSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    signals: z.array(z.record(z.unknown())).max(10_000).optional(),
    items: z.array(z.record(z.unknown())).max(10_000).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** Alloy workflow create/update/delete. */
export const alloyWorkflowMutationSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    name: z.string().max(500).optional(),
    description: z.string().max(5000).optional(),
    nodes: z.array(z.record(z.unknown())).max(500).optional(),
    config: z.record(z.unknown()).optional(),
    status: z.string().max(100).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;
export const alloyWorkflowDeleteSchema = tightenedDeleteResourceSchema;

/** Alloy run actions (retry / cancel) — optional reason. */
export const alloyRunActionSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    reason: z.string().max(2000).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** Alloy decision approve / reject — optional rationale. */
export const alloyDecisionTransitionSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    rationale: z.string().max(5000).optional(),
    reason: z.string().max(2000).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;

/** Generic Alloy passthrough body — for routes whose payload schema is
 *  intentionally open (planning / execution glue). Still rejects arrays. */
export const alloyResourceBodySchema = tightenedDeleteResourceSchema;

/** Alloy skill / chain / decision-outcome mutations. */
export const alloySkillMutationSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    name: z.string().max(500).optional(),
    domain: z.string().max(100).optional(),
    description: z.string().max(5000).optional(),
    config: z.record(z.unknown()).optional(),
    status: z.string().max(100).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;
export const alloySkillDeleteSchema = tightenedDeleteResourceSchema;

/** Alloy runtime resource bodies (workflows, agents, models, prompts,
 *  signals, actions, replays). Open-ended payload, rejects arrays. */
export const alloyRuntimeResourceSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({
    name: z.string().max(500).optional(),
    description: z.string().max(5000).optional(),
    config: z.record(z.unknown()).optional(),
    status: z.string().max(100).optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(),
) as z.ZodType<Record<string, unknown>>;
export const alloyRuntimeResourceDeleteSchema = tightenedDeleteResourceSchema;

/** GET /aegis/(action-queue|soar-builder/runs) — Aegis list query with filters. */
export const aegisListQuerySchema = z.object({
  status: z.string().max(100).optional(),
  priority: z.string().max(100).optional(),
  playbookId: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).passthrough();

// ─── Middleware ───────────────────────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.errors.map(e => ({
        path: e.path,
        message: e.message,
        code: e.code,
      }));
      const errors = issues.map(e => `${e.path.join(".") || "(root)"}: ${e.message}`).join("; ");
      sendBadRequest(res, `Validation error: ${errors}`, { issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.errors.map(e => ({
        path: e.path,
        message: e.message,
        code: e.code,
      }));
      const errors = issues.map(e => `${e.path.join(".") || "(root)"}: ${e.message}`).join("; ");
      sendBadRequest(res, `Invalid query parameters: ${errors}`, { issues });
      return;
    }
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      sendBadRequest(res, `Invalid path parameters: ${errors}`);
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}

// ─── Strict route schemas (replacing generic placeholders) ────────────────────
// These schemas tighten body / query validation on routes that previously used
// jsonObjectBodySchema / listQuerySchema as a baseline. They enforce typed
// fields, enums, and length limits so that malformed payloads are rejected at
// the edge instead of being passed through to the handler.

const optionalEmptyBody = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val == null ? {} : val), schema);

// admin/users: POST /admin/users/:id/revoke-sessions
export const revokeSessionsBodySchema = optionalEmptyBody(
  z.object({
    reason: z.string().min(1).max(500).trim().optional(),
  }).strict(),
);

// alloy: GET /alloy/autonomy-mode (query: domain)
export const autonomyModeQuerySchema = z.object({
  domain: z.string().min(1).max(120).trim().optional(),
}).strict();

// carlota-jo: GET /carlota/radar-signals (query: competitors, clientId)
export const carlotaRadarSignalsQuerySchema = z.object({
  competitors: z.string().max(1000).optional(),
  clientId: z.string().max(100).optional(),
}).strict();

// carlota-jo: GET /carlota/radar-competitors (query: clientId)
export const carlotaRadarCompetitorsQuerySchema = z.object({
  clientId: z.string().max(100).optional(),
}).strict();

// carlota-jo: PUT /carlota/radar-competitors (body: clientId?, competitors[])
export const carlotaRadarCompetitorsBodySchema = z.object({
  clientId: z.string().max(100).optional().nullable(),
  competitors: z.array(z.string().min(1).max(120).trim()).min(1).max(12),
}).strict();

// counsel: DELETE /counsel/matters/:id (no body)
export const counselDeleteMatterBodySchema = optionalEmptyBody(
  z.object({}).strict(),
);

// counsel: GET /counsel/audit-trail (query: matterId)
export const counselAuditTrailQuerySchema = z.object({
  matterId: z.string().min(1).max(200).optional(),
}).strict();

// counsel: GET /counsel/proof-chain (query: matterId required)
export const counselProofChainQuerySchema = z.object({
  matterId: z.string().min(1).max(200),
}).strict();

// demo-governed-scenarios: POST /demo/seed-governed-scenarios (no body)
export const demoSeedGovernedScenariosBodySchema = optionalEmptyBody(
  z.object({}).strict(),
);

// lyte: GET /lyte/interventions (query)
const LYTE_INTERVENTION_TYPES = ["claim", "resolve", "reassign", "address"] as const;
const LYTE_ITEM_KINDS = ["drift", "debt"] as const;

export const lyteInterventionsQuerySchema = z.object({
  itemKind: z.enum(LYTE_ITEM_KINDS).optional(),
  itemId: z.string().min(1).max(200).optional(),
  type: z.enum(LYTE_INTERVENTION_TYPES).optional(),
}).strict();

// lyte: POST /lyte/interventions (body) — promote manual checks into schema
export const lyteInterventionCreateSchema = z.object({
  itemId: z.string().min(1, "itemId is required").max(200),
  itemKind: z.enum(LYTE_ITEM_KINDS),
  itemTitle: z.string().min(1, "itemTitle is required").max(500),
  type: z.enum(LYTE_INTERVENTION_TYPES),
  notes: z.string().max(5000).optional(),
  newOwner: z.string().min(1).max(200).trim().optional(),
}).superRefine((val, ctx) => {
  if (val.type === "reassign" && (!val.newOwner || !val.newOwner.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["newOwner"],
      message: "newOwner is required for reassign",
    });
  }
  if (val.type === "address" && (!val.notes || !val.notes.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["notes"],
      message: "notes (evidence) is required for address",
    });
  }
});

// lyte-cognitive: GET /lyte/cognitive/interventions (query: limit)
// Route handler uses safeParseLimit() which gracefully handles NaN / oversize
// values, so the schema only enforces shape and a sane string length.
export const lyteCognitiveInterventionsQuerySchema = z.object({
  limit: z.string().max(20).optional(),
}).strict();

// memory: POST /memory/:id/pin and DELETE /memory/:id/pin (no body)
export const memoryPinBodySchema = optionalEmptyBody(
  z.object({}).strict(),
);

// policy-modes: GET /policy-modes/resolve (query)
export const policyModesResolveQuerySchema = z.object({
  product: z.string().min(1).max(100).optional(),
  actionType: z.string().min(1).max(200).optional(),
  workspace: z.string().min(1).max(100).optional(),
}).strict().refine(
  (q) => !!(q.product || q.actionType || q.workspace),
  { message: "At least one of product, actionType, or workspace is required" },
);

// policy-modes: DELETE /policy-modes/:id (no body)
export const policyModesDeleteBodySchema = optionalEmptyBody(
  z.object({}).strict(),
);

// stephen: GET /stephen/booking-requests (query)
const STEPHEN_BOOKING_TYPES = ["consultation", "project", "recruitment", "partnership", "investment", "speaking", "other"] as const;
const STEPHEN_BOOKING_STATUSES = ["pending", "confirmed", "declined", "completed"] as const;

export const stephenBookingRequestsQuerySchema = z.object({
  type: z.enum(STEPHEN_BOOKING_TYPES).optional(),
  status: z.enum(STEPHEN_BOOKING_STATUSES).optional(),
}).strict();

// vessels-voyage-risk: POST /vessels/voyage-risk/score
export const voyageRiskScoreRequestSchema = z.object({
  vesselImo: z.string().max(20).optional(),
  vesselName: z.string().max(200).optional(),
  origin: z.string().min(1, "origin is required").max(200),
  destination: z.string().min(1, "destination is required").max(200),
  routeVariant: z.string().min(1, "routeVariant is required").max(100),
  cargoType: z.string().max(200).optional(),
  chartererName: z.string().max(200).optional(),
}).strict();

// vessels-voyage-risk: POST /vessels/voyage-risk/sanctions/refresh
export const sanctionsRefreshBodySchema = optionalEmptyBody(
  z.object({
    sourceId: z.string().min(1).max(100).optional(),
  }).strict(),
);

// vessels-voyage-risk: POST /vessels/voyage-risk/memo/pdf
// Payload is a previously-computed VoyageRiskScore object — large nested
// structure. Enforce the top-level shape (scenarioId required, route + risk +
// economics objects present) but allow nested fields through passthrough so
// the PDF renderer receives the full computed shape.
export const voyageRiskMemoPdfBodySchema = z.object({
  scenarioId: z.string().min(1, "scenarioId is required").max(200),
  vessel: z.object({}).passthrough(),
  route: z.object({}).passthrough(),
  risk: z.object({}).passthrough(),
  economics: z.object({}).passthrough(),
  counterparty: z.object({}).passthrough(),
  sanctionsRefresh: z.object({}).passthrough().optional(),
  provenance: z.object({}).passthrough().optional(),
}).passthrough();

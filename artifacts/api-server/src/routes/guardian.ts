import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendServiceUnavailable,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import {
  GuardianDecisionEngine,
  GuardianRuleSchema,
  PolicyTierSchema,
  POLICY_TIER_DESCRIPTIONS,
  TIER_RISK_LEVEL,
  TIER_CONTROLS,
  TIER_NUMBER,
  computeApprovalExpiresAt,
  type DecisionRequest,
  type GuardianRule,
  type PolicyTier,
} from "@workspace/guardian";
import { getGuardianEngine, syncGuardianPolicies } from "../lib/guardian-engine";
import { getAllEffectiveTiers, invalidateEffectiveTierCache } from "../lib/effective-tiers";
import {
  defaultToolRegistry,
  ToolManifestSchema,
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  SECURITY_TOOL_MANIFESTS,
  FINANCE_TOOL_MANIFESTS,
  OPERATIONS_TOOL_MANIFESTS,
  type ToolManifest,
} from "@workspace/tool-mesh";
import {
  db,
  guardianPoliciesTable,
  guardianPolicyAssignmentsTable,
  guardianActionsTable,
  guardianApprovalRequestsTable,
  guardianTiersTable,
  guardrailConfigsTable,
  rollbackEventsTable,
  toolMeshToolsTable,
  toolMeshToolVersionsTable,
  toolMeshToolPermissionsTable,
  toolMeshActionApprovalsTable,
  auditEventsTable,
  usersTable,
  type GuardianPolicy,
  type GuardianPolicyAssignment,
  type GuardrailConfig,
  type ToolMeshTool,
  type ToolMeshToolVersion,
  type ToolMeshToolPermission,
  type ToolMeshActionApproval,
} from "@szl-holdings/db";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";
import { sendEmail, hasEmailProviderConfigured } from "../lib/email";

const router: IRouter = Router();

const GUARDIAN_ALERT_EMAIL = process.env.FOUNDER_ALERT_EMAIL ?? process.env.SZL_INTERNAL_EMAIL ?? "team@szlholdings.com";
const GUARDIAN_SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const APPROVALS_URL = process.env.APP_URL ? `${process.env.APP_URL}/command/operations/guardian/approvals` : "https://szlholdings.com/command/operations/guardian/approvals";

async function logToolAuditEvent(params: {
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  req: Request;
}) {
  try {
    await db.insert(auditEventsTable).values({
      userId: params.req.user?.id ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      oldValues: params.oldValues ?? null,
      newValues: params.newValues ?? null,
      ipAddress: params.req.ip ?? null,
      userAgent: params.req.get("user-agent") ?? null,
    });
  } catch (err) {
    logger.error({ err, action: params.action }, "Failed to write audit event");
  }
}

interface PolicyEvaluationLike {
  evaluationId?: string;
  resolvedMode?: string;
  mode?: string;
  confidence?: number;
  blockedReason?: string;
  projectedImpact?: Record<string, unknown> | null;
  policyResult?: { effect?: string };
  memoryRefs?: unknown;
  evidenceChain?: unknown;
}

type UiPolicyMode =
  | "observe"
  | "recommend"
  | "draft"
  | "approval-required"
  | "auto-within-guardrails";

interface UiMemoryRef {
  tier: string;
  key: string;
  freshness?: number;
  confidence?: number;
  summary?: string;
}

interface UiPolicyEvaluation {
  evaluationId: string;
  resolvedMode: UiPolicyMode;
  confidence: number;
  blockedReason?: string;
  approvalRequired: boolean;
  projectedImpact: {
    severity: "low" | "medium" | "high" | "critical";
    reversible: boolean;
    estimatedCostUsd?: number;
    affectedEntityIds?: string[];
  };
  projectedRisk: {
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
  };
  memoryRefs: UiMemoryRef[];
  evaluatedAt: number;
}

const TIER_TO_RISK_LEVEL: Record<string, "low" | "medium" | "high" | "critical"> = {
  advisory: "low",
  supervised: "low",
  "operator-approved": "medium",
  "dual-approved": "high",
  regulated: "high",
  sovereign: "critical",
};

function severityForTier(tier: string): "low" | "medium" | "high" | "critical" {
  return TIER_TO_RISK_LEVEL[tier] ?? "medium";
}

function pickStrings(...vals: unknown[]): string[] {
  const out: string[] = [];
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0 && !out.includes(v)) out.push(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === "string" && !out.includes(x)) out.push(x);
  }
  return out;
}

/**
 * Build the front-end-shape PolicyEvaluation that the Policy Approvals
 * inbox renders. Every live approval enqueued by the guardian routes is
 * decorated with this object so the Evidence Chain panel always shows
 * real memory tier badges, freshness bars, projected risk, and at least
 * three memory references — even when no caller-supplied evaluation
 * existed on the original request.
 */
function buildLiveApprovalPolicyEvaluation(args: {
  requestId: string;
  action: string;
  tier: string;
  outcome?: string;
  matchedRuleId?: string | null;
  reason?: string | null;
  blockedReason?: string;
  toolId?: string | null;
  agentId?: string | null;
  sessionId?: string | null;
  workflowId?: string | null;
  product?: string | null;
  estimatedCostUsd?: number;
  context?: Record<string, unknown>;
  toolManifest?: { id: string; name?: string; policyTier?: string; description?: string } | null;
  controlViolations?: string[];
  rollbackRequired?: boolean;
  redactedFields?: string[];
}): UiPolicyEvaluation {
  const ctx = args.context ?? {};
  const tier = args.tier;
  const severity = severityForTier(tier);
  const approvalRequired =
    args.outcome === "require-approval" || args.outcome === "require-dual-approval" || args.outcome === "block";
  const resolvedMode: UiPolicyMode = approvalRequired
    ? "approval-required"
    : args.outcome === "allow"
      ? "auto-within-guardrails"
      : "observe";

  // Confidence: prefer caller-supplied; otherwise derive from match status.
  const ctxConfidence = typeof ctx["confidence"] === "number" ? (ctx["confidence"] as number) : undefined;
  const confidence = ctxConfidence ?? (args.matchedRuleId ? 0.86 : 0.62);

  // Risk factors: assemble from real signals on the decision.
  const factors: string[] = [];
  factors.push(`tier:${tier}`);
  if (args.outcome === "require-dual-approval") factors.push("dual-approval-required");
  if (args.rollbackRequired) factors.push("rollback-required");
  if ((args.controlViolations?.length ?? 0) > 0) factors.push(`control-violations:${args.controlViolations!.length}`);
  if ((args.redactedFields?.length ?? 0) > 0) factors.push(`pii-redacted:${args.redactedFields!.length}`);
  if (args.blockedReason) factors.push("policy-blocked");

  // Reversibility: regulated/dual-approved tiers and rollback-required actions
  // are treated as reversible-on-execute; sovereign and explicit blocks are not.
  const reversible = tier !== "sovereign" && !args.blockedReason;

  // Affected entities: pull common id-bearing fields out of the context.
  const affectedEntityIds = pickStrings(
    ctx["entityId"],
    ctx["entityIds"],
    ctx["targetId"],
    ctx["targetIds"],
    ctx["resourceId"],
    ctx["recommendationId"],
    args.workflowId ?? undefined,
  ).slice(0, 8);

  // Memory references — always at least three:
  //   1. Policy match (semantic memory tier)
  //   2. Agent / session working memory
  //   3. Tool manifest (artifact memory tier)
  // Plus optional: matched rule, escalation history, request payload context.
  const evaluatedAt = Date.now();
  const memoryRefs: UiMemoryRef[] = [];

  memoryRefs.push({
    tier: "semantic",
    key: args.matchedRuleId
      ? `guardian.rule:${args.matchedRuleId}`
      : `guardian.tier:${tier}`,
    freshness: 0.95,
    confidence: args.matchedRuleId ? 0.92 : 0.78,
    summary: args.reason ?? `Policy tier '${tier}' default control set.`,
  });

  memoryRefs.push({
    tier: "working",
    key: `agent:${args.agentId ?? "anon-agent"}${args.sessionId ? `:session:${args.sessionId.substring(0, 12)}` : ""}`,
    freshness: 1.0,
    confidence,
    summary: `Action '${args.action}' initiated by ${args.agentId ?? "unattributed agent"}${args.sessionId ? ` in active session` : ""}.`,
  });

  const toolKey = args.toolManifest?.id ?? args.toolId ?? "unknown-tool";
  memoryRefs.push({
    tier: "artifact",
    key: `tool-mesh:${toolKey}`,
    freshness: 0.88,
    confidence: args.toolManifest ? 0.9 : 0.55,
    summary: args.toolManifest?.description
      ? `${args.toolManifest.name ?? toolKey}: ${args.toolManifest.description.substring(0, 140)}`
      : `Tool '${toolKey}' invocation manifest`,
  });

  if (args.product) {
    memoryRefs.push({
      tier: "entity",
      key: `product:${args.product}`,
      freshness: 0.9,
      confidence: 0.82,
      summary: `Action targets product surface '${args.product}'.`,
    });
  }

  if (affectedEntityIds.length > 0) {
    memoryRefs.push({
      tier: "episodic",
      key: `entities:${affectedEntityIds.slice(0, 3).join(",")}`,
      freshness: 0.8,
      confidence: 0.7,
      summary: `${affectedEntityIds.length} entity reference${affectedEntityIds.length === 1 ? "" : "s"} pulled from request context.`,
    });
  }

  if (args.outcome === "require-dual-approval") {
    memoryRefs.push({
      tier: "executive",
      key: `escalation:dual-approval:${tier}`,
      freshness: 1.0,
      confidence: 1.0,
      summary: "Escalation policy requires operator + executive sign-off before execution.",
    });
  }

  return {
    evaluationId: args.requestId,
    resolvedMode,
    confidence,
    blockedReason: args.blockedReason,
    approvalRequired,
    projectedImpact: {
      severity,
      reversible,
      estimatedCostUsd: args.estimatedCostUsd,
      affectedEntityIds: affectedEntityIds.length > 0 ? affectedEntityIds : undefined,
    },
    projectedRisk: {
      level: severity,
      factors,
    },
    memoryRefs,
    evaluatedAt,
  };
}

function extractPolicyEvaluation(payload: unknown): PolicyEvaluationLike | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const ev = (obj["policyEvaluation"] ?? obj["policy_evaluation"]) as PolicyEvaluationLike | undefined;
  return ev && typeof ev === "object" ? ev : null;
}

function extractProduct(payload: unknown, fallback?: string | null): string | null {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj["product"] === "string") return obj["product"] as string;
    const ev = obj["policyEvaluation"] as { product?: string } | undefined;
    if (ev && typeof ev.product === "string") return ev.product;
  }
  return fallback ?? null;
}

/**
 * Persist an approve/reject policy decision into the unified audit_events log.
 * Captures: who decided, the action, the policy evaluation id, the resolved
 * mode, confidence, blocked reason, and projected impact — so post-hoc
 * compliance review and the executive digest can replay why an action ran.
 */
async function recordPolicyDecisionAudit(params: {
  req: Request;
  decision: "approved" | "rejected";
  entityType: string;
  entityId: string;
  action: string;
  product?: string | null;
  decisionReason?: string | null;
  payload?: unknown;
  policyEvaluation?: PolicyEvaluationLike | null;
  extra?: Record<string, unknown>;
}): Promise<void> {
  try {
    const ev = params.policyEvaluation ?? extractPolicyEvaluation(params.payload);
    const resolvedMode =
      (ev?.resolvedMode as string | undefined) ??
      (ev?.mode as string | undefined) ??
      null;
    const confidence = typeof ev?.confidence === "number" ? ev.confidence : null;
    const blockedReason = (ev?.blockedReason as string | undefined) ?? null;
    const projectedImpact =
      (ev?.projectedImpact as Record<string, unknown> | null | undefined) ?? null;
    const evaluationId = (ev?.evaluationId as string | undefined) ?? null;
    const product = extractProduct(params.payload, params.product);

    await db.insert(auditEventsTable).values({
      userId: params.req.user?.id ?? null,
      action: `policy.${params.decision === "approved" ? "approve" : "reject"}`,
      entityType: params.entityType,
      entityId: params.entityId,
      newValues: {
        action: params.action,
        decisionReason: params.decisionReason ?? null,
        memoryRefs: ev?.memoryRefs ?? ev?.evidenceChain ?? null,
        ...(params.extra ?? {}),
      },
      ipAddress: params.req.ip ?? null,
      userAgent: params.req.get("user-agent") ?? null,
      decision: params.decision,
      policyEvaluationId: evaluationId,
      resolvedMode,
      confidence,
      blockedReason,
      projectedImpact,
      product,
    });
  } catch (err) {
    logger.error(
      { err, entityId: params.entityId, decision: params.decision },
      "Failed to write policy decision audit event",
    );
  }
}

async function notifyApprovalQueueFilled(params: {
  requestId: string;
  action: string;
  tier: string;
  approvalType: string;
  agentId?: string | null;
  toolId?: string | null;
}): Promise<void> {
  const label = params.approvalType === "dual" ? "Dual-Approval Required" : "Approval Required";
  const subject = `[Guardian] ${label}: ${params.action}`;
  const body = `A new Guardian approval request has been queued and is awaiting review.\n\nRequest ID: ${params.requestId}\nAction: ${params.action}\nTier: ${params.tier}\nType: ${params.approvalType === "dual" ? "Dual-approval" : "Single-approval"}\nAgent: ${params.agentId ?? "unknown"}\nTool: ${params.toolId ?? "unknown"}\n\nReview at: ${APPROVALS_URL}`;
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#7c3aed;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0"><h1 style="margin:0;font-size:18px">🛡 Guardian: ${label}</h1></div><div style="background:#1e1e2e;color:#e2e8f0;padding:24px;border-radius:0 0 8px 8px"><table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px;width:120px">Request ID</td><td style="color:#f8f8f8;font-size:13px">${params.requestId}</td></tr><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px">Action</td><td style="color:#f8f8f8;font-size:13px">${params.action}</td></tr><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px">Policy Tier</td><td style="color:#f8f8f8;font-size:13px">${params.tier}</td></tr><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px">Type</td><td style="color:#f8f8f8;font-size:13px">${params.approvalType === "dual" ? "Dual-approval (2 reviewers required)" : "Single-approval"}</td></tr><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px">Agent</td><td style="color:#f8f8f8;font-size:13px">${params.agentId ?? "unknown"}</td></tr><tr><td style="color:#94a3b8;padding:4px 0;font-size:13px">Tool</td><td style="color:#f8f8f8;font-size:13px">${params.toolId ?? "unknown"}</td></tr></table><a href="${APPROVALS_URL}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Review in Command Center →</a></div></div>`;

  if (hasEmailProviderConfigured()) {
    sendEmail({ to: GUARDIAN_ALERT_EMAIL, subject, html, text: body }).catch((err: unknown) =>
      logger.warn({ err }, "[guardian] Failed to send approval queue email notification"),
    );
  }

  if (GUARDIAN_SLACK_WEBHOOK) {
    const slackText = `*🛡 Guardian — ${label}*\n*Action:* ${params.action}\n*Tier:* ${params.tier} | *Type:* ${params.approvalType === "dual" ? "dual-approval" : "single-approval"}\n*Request ID:* \`${params.requestId}\`\n*Review:* <${APPROVALS_URL}|Open in Command Center>`;
    fetch(GUARDIAN_SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: slackText }),
    }).catch((err: unknown) => logger.warn({ err }, "[guardian] Failed to post approval Slack notification"));
  }
}

const sharedDecisionEngine: GuardianDecisionEngine = getGuardianEngine();

const allToolManifests = [
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  ...SECURITY_TOOL_MANIFESTS,
  ...FINANCE_TOOL_MANIFESTS,
  ...OPERATIONS_TOOL_MANIFESTS,
];
for (const manifest of allToolManifests) {
  defaultToolRegistry.register(manifest);
}

function policyRowToApi(row: GuardianPolicy) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    tier: row.tier,
    conditions: (row.conditions as unknown[]) ?? [],
    action: row.action,
    priority: row.priority,
    enabled: row.enabled,
    owner: row.owner ?? undefined,
    tags: (row.tags as string[]) ?? [],
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

function policyRowToRule(row: GuardianPolicy): GuardianRule {
  return {
    id: `policy-${row.id}`,
    name: row.name,
    description: row.description ?? undefined,
    tier: row.tier as GuardianRule["tier"],
    conditions: ((row.conditions as unknown[]) ?? []) as GuardianRule["conditions"],
    action: row.action as GuardianRule["action"],
    priority: row.priority,
    enabled: row.enabled,
    owner: row.owner ?? undefined,
    tags: ((row.tags as string[]) ?? []),
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt as unknown as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt as unknown as string),
  };
}

function toolRowToManifest(row: ToolMeshTool): ToolManifest {
  return {
    id: row.toolId,
    name: row.name,
    version: row.version,
    description: row.description,
    domainTags: ((row.domainTags as string[]) ?? []) as ToolManifest["domainTags"],
    policyTier: row.policyTier as ToolManifest["policyTier"],
    allowedEnvironments: ((row.allowedEnvironments as string[]) ?? []) as ToolManifest["allowedEnvironments"],
    inputSchema: (row.inputSchema as Record<string, unknown> | null) ?? undefined,
    outputSchema: (row.outputSchema as Record<string, unknown> | null) ?? undefined,
    rateLimits: (row.rateLimits as ToolManifest["rateLimits"]) ?? {},
    timeoutMs: row.timeoutMs,
    failureModes: ((row.failureModes as unknown[]) ?? []) as ToolManifest["failureModes"],
    approvalRequired: row.approvalRequired,
    owner: row.owner ?? undefined,
    observabilityHooks: (row.observabilityHooks as ToolManifest["observabilityHooks"]) ?? {
      emitTrace: true,
      emitMetrics: true,
      sensitiveFields: [],
    },
    enabled: row.enabled,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt as unknown as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt as unknown as string),
  };
}

function assignmentRowToApi(row: GuardianPolicyAssignment) {
  return {
    id: row.id,
    policyId: row.policyId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    context: (row.context as Record<string, unknown>) ?? {},
    grantedById: row.grantedById ?? undefined,
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt.toISOString() : row.expiresAt ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

function versionRowToApi(row: ToolMeshToolVersion) {
  return {
    id: row.id,
    toolDbId: row.toolDbId,
    version: row.version,
    changelog: row.changelog ?? undefined,
    schemaSnapshot: (row.schemaSnapshot as Record<string, unknown>) ?? {},
    publishedById: row.publishedById ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

function permissionRowToApi(row: ToolMeshToolPermission) {
  return {
    id: row.id,
    toolDbId: row.toolDbId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    permission: row.permission,
    grantedById: row.grantedById ?? undefined,
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt.toISOString() : row.expiresAt ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

interface ResolvedActor {
  id: number;
  displayName: string;
  email: string | null;
}

type ActorMap = Map<number, ResolvedActor>;

async function resolveActorMap(ids: Array<number | null | undefined>): Promise<ActorMap> {
  const map: ActorMap = new Map();
  const unique = Array.from(new Set(ids.filter((v): v is number => typeof v === "number" && v > 0)));
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: usersTable.id, displayName: usersTable.displayName, email: usersTable.email })
    .from(usersTable)
    .where(sql`${usersTable.id} IN (${sql.join(unique.map(v => sql`${v}`), sql`, `)})`);
  for (const r of rows) {
    map.set(r.id, { id: r.id, displayName: r.displayName, email: r.email ?? null });
  }
  return map;
}

function actorOrUndefined(id: number | null | undefined, actors: ActorMap): ResolvedActor | undefined {
  if (typeof id !== "number" || id <= 0) return undefined;
  return actors.get(id);
}

function approvalRowToApi(row: ToolMeshActionApproval, actors?: ActorMap) {
  const map = actors ?? new Map<number, ResolvedActor>();
  return {
    id: row.id,
    requestId: row.requestId,
    toolId: row.toolId,
    action: row.action,
    agentId: row.agentId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    workflowId: row.workflowId ?? undefined,
    status: row.status,
    decisionReason: row.decisionReason ?? undefined,
    requestedById: row.requestedById ?? undefined,
    requestedBy: actorOrUndefined(row.requestedById, map),
    approvedById: row.approvedById ?? undefined,
    approvedBy: actorOrUndefined(row.approvedById, map),
    approvedAt: row.approvedAt instanceof Date ? row.approvedAt.toISOString() : row.approvedAt ?? undefined,
    rejectedById: row.rejectedById ?? undefined,
    rejectedBy: actorOrUndefined(row.rejectedById, map),
    rejectedAt: row.rejectedAt instanceof Date ? row.rejectedAt.toISOString() : row.rejectedAt ?? undefined,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

async function syncDecisionEngine(): Promise<void> {
  await syncGuardianPolicies(true);
}

const PII_FIELD_PATTERNS = [
  /^(email|phone|ssn|dob|date_of_birth|birthdate|address|postal_code|zip|credit_card|card_number|cvv|password|secret|token|api_key|private_key|national_id|passport|drivers_license|bank_account|routing_number|tax_id|ein|sin)/i,
];

function redactPayload(payload: Record<string, unknown>): { redacted: Record<string, unknown>; redactedFields: string[] } {
  const redacted: Record<string, unknown> = {};
  const redactedFields: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (PII_FIELD_PATTERNS.some(p => p.test(key))) {
      redacted[key] = "[REDACTED]";
      redactedFields.push(key);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const inner = redactPayload(value as Record<string, unknown>);
      redacted[key] = inner.redacted;
      redactedFields.push(...inner.redactedFields.map(f => `${key}.${f}`));
    } else {
      redacted[key] = value;
    }
  }
  return { redacted, redactedFields };
}

function isAdminUser(user: Request["user"]): boolean {
  return user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
}

function userOrgId(user: Request["user"]): number | null {
  return user?.orgs?.[0]?.orgId ?? null;
}

// ============================================================
// POLICIES
// ============================================================

router.get("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const tier = req.query["tier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(guardianPoliciesTable.orgId, orgId));
    }
    if (tier) conditions.push(eq(guardianPoliciesTable.tier, tier as GuardianPolicy["tier"]));
    if (enabled !== undefined) conditions.push(eq(guardianPoliciesTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianPoliciesTable).where(where as ReturnType<typeof and>).orderBy(desc(guardianPoliciesTable.priority), desc(guardianPoliciesTable.id)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardianPoliciesTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows.map(policyRowToApi), 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list policies");
  }
});

router.get("/policies/tiers", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = userOrgId(req.user);
    const tiers = await getAllEffectiveTiers(orgId);
    sendSuccess(
      res,
      tiers.map((t) => ({
        tier: t.tier,
        tierNumber: t.tierNumber,
        description: t.description,
        riskLevel: t.riskLevel,
        controls: t.controls as unknown as Record<string, unknown>,
      })),
    );
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy tiers");
  }
});

router.patch("/policies/tiers/:tier", authMiddleware(), requireRole("super_admin", "admin"), validateBody(bodyShape({
      "controls": z.unknown().optional(),
      "description": z.unknown().optional(),
      "enabled": z.unknown().optional(),
      "riskLevel": z.unknown().optional(),
      "tierNumber": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const tierName = req.params["tier"] as string;
    const tierParsed = PolicyTierSchema.safeParse(tierName);
    if (!tierParsed.success) { sendBadRequest(res, "Invalid tier name"); return; }
    const tier = tierParsed.data;
    const body = req.body as Partial<{ description: string; controls: Record<string, unknown>; tierNumber: number; riskLevel: number; enabled: boolean }>;
    const orgId = userOrgId(req.user);

    const u: Record<string, unknown> = { updatedAt: new Date(), updatedById: req.user?.id ?? null };
    if (body.description !== undefined) u.description = body.description;
    if (body.controls !== undefined) u.controls = body.controls;
    if (body.tierNumber !== undefined) u.tierNumber = body.tierNumber;
    if (body.riskLevel !== undefined) u.riskLevel = body.riskLevel;
    if (body.enabled !== undefined) u.enabled = body.enabled;

    const [existing] = await db.select().from(guardianTiersTable).where(and(eq(guardianTiersTable.tier, tier), orgId !== null ? eq(guardianTiersTable.orgId, orgId) : isNull(guardianTiersTable.orgId))).limit(1);

    if (!existing) {
      const [inserted] = await db.insert(guardianTiersTable).values({
        orgId,
        tier,
        tierNumber: body.tierNumber ?? TIER_NUMBER[tier],
        description: body.description ?? POLICY_TIER_DESCRIPTIONS[tier],
        riskLevel: body.riskLevel ?? TIER_RISK_LEVEL[tier],
        controls: (body.controls ?? TIER_CONTROLS[tier]) as Record<string, unknown>,
        enabled: body.enabled ?? true,
        updatedById: req.user?.id ?? null,
      }).returning();
      invalidateEffectiveTierCache(orgId);
      sendCreated(res, inserted);
      return;
    }

    const [updated] = await db.update(guardianTiersTable).set(u).where(eq(guardianTiersTable.id, existing.id)).returning();
    invalidateEffectiveTierCache(orgId);
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update tier definition");
  }
});

router.get("/policies/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const [row] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!row) { sendNotFound(res, "Policy not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (row.orgId !== orgId) { sendNotFound(res, "Policy not found"); return; }
    }

    sendSuccess(res, policyRowToApi(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get policy");
  }
});

router.get("/policies/:id/audit", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst", "compliance"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const [policyRow] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!policyRow) { sendNotFound(res, "Policy not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (policyRow.orgId !== orgId) { sendNotFound(res, "Policy not found"); return; }
    }

    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const offset = (page - 1) * limit;
    const where = and(
      eq(auditEventsTable.entityType, "guardian_policy"),
      eq(auditEventsTable.entityId, String(id)),
    );
    const [rows, totalRow] = await Promise.all([
      db.select().from(auditEventsTable).where(where).orderBy(desc(auditEventsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditEventsTable).where(where),
    ]);
    const actors = await resolveActorMap(rows.map(r => r.userId));
    const items = rows.map(r => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      actor: actorOrUndefined(r.userId, actors),
      actorUserId: r.userId ?? undefined,
      oldValues: r.oldValues ?? null,
      newValues: r.newValues ?? null,
      ipAddress: r.ipAddress ?? undefined,
      userAgent: r.userAgent ?? undefined,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    sendSuccess(res, items, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy audit history");
  }
});

router.post("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "id": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const parsed = GuardianRuleSchema.safeParse({ ...req.body, id: req.body.id ?? "policy-pending", createdAt: nowIso, updatedAt: nowIso });
    if (!parsed.success) { sendBadRequest(res, "Invalid policy schema", parsed.error.flatten()); return; }

    const rule = parsed.data;
    const user = req.user;
    const orgId = userOrgId(user);

    const [inserted] = await db.insert(guardianPoliciesTable).values({
      orgId, name: rule.name, description: rule.description ?? null, tier: rule.tier,
      conditions: rule.conditions, action: rule.action, priority: rule.priority, enabled: rule.enabled,
      owner: rule.owner ?? null, tags: rule.tags, allowedModels: rule.allowedModels ?? null,
      allowedTools: rule.allowedTools ?? null, createdById: user?.id ?? null,
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create policy"); return; }
    if (inserted.enabled) sharedDecisionEngine.addRule(policyRowToRule(inserted));
    await syncDecisionEngine();

    logger.info({ policyId: inserted.id, tier: inserted.tier, action: inserted.action }, "Policy created");
    await logToolAuditEvent({
      action: "policy.create",
      entityType: "guardian_policy",
      entityId: String(inserted.id),
      newValues: policyRowToApi(inserted) as unknown as Record<string, unknown>,
      req,
    });
    sendCreated(res, policyRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy");
  }
});

router.patch("/policies/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "action": z.unknown().optional(),
      "allowedModels": z.unknown().optional(),
      "allowedTools": z.unknown().optional(),
      "conditions": z.unknown().optional(),
      "description": z.unknown().optional(),
      "enabled": z.unknown().optional(),
      "name": z.unknown().optional(),
      "owner": z.unknown().optional(),
      "priority": z.unknown().optional(),
      "tags": z.unknown().optional(),
      "tier": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const [existing] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Policy not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Policy not found"); return; }
    }

    const body = req.body as Partial<{ name: string; description: string | null; tier: GuardianPolicy["tier"]; conditions: unknown[]; action: GuardianPolicy["action"]; priority: number; enabled: boolean; owner: string | null; tags: string[]; allowedModels: string[] | null; allowedTools: string[] | null }>;

    const u: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) u.name = body.name;
    if (body.description !== undefined) u.description = body.description;
    if (body.tier !== undefined) u.tier = body.tier;
    if (body.conditions !== undefined) u.conditions = body.conditions;
    if (body.action !== undefined) u.action = body.action;
    if (body.priority !== undefined) u.priority = body.priority;
    if (body.enabled !== undefined) u.enabled = body.enabled;
    if (body.owner !== undefined) u.owner = body.owner;
    if (body.tags !== undefined) u.tags = body.tags;
    if (body.allowedModels !== undefined) u.allowedModels = body.allowedModels;
    if (body.allowedTools !== undefined) u.allowedTools = body.allowedTools;

    const [updated] = await db.update(guardianPoliciesTable).set(u).where(eq(guardianPoliciesTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Policy not found"); return; }

    await syncDecisionEngine();
    await logToolAuditEvent({
      action: "policy.update",
      entityType: "guardian_policy",
      entityId: String(id),
      oldValues: policyRowToApi(existing) as unknown as Record<string, unknown>,
      newValues: policyRowToApi(updated) as unknown as Record<string, unknown>,
      req,
    });
    sendSuccess(res, policyRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to update policy");
  }
});

router.delete("/policies/:id", validateBody(bodyShape({})), authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const [existing] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Policy not found"); return; }
    const deleted = await db.delete(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).returning({ id: guardianPoliciesTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Policy not found"); return; }
    await syncDecisionEngine();
    logger.info({ policyId: id }, "Policy deleted");
    await logToolAuditEvent({
      action: "policy.delete",
      entityType: "guardian_policy",
      entityId: String(id),
      oldValues: policyRowToApi(existing) as unknown as Record<string, unknown>,
      req,
    });
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy");
  }
});

router.get("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const rows = await db.select().from(guardianPolicyAssignmentsTable).where(eq(guardianPolicyAssignmentsTable.policyId, policyId)).orderBy(desc(guardianPolicyAssignmentsTable.createdAt));
    sendSuccess(res, rows.map(assignmentRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy assignments");
  }
});

router.post("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "context": z.unknown().optional(),
      "expiresAt": z.unknown().optional(),
      "subjectId": z.unknown().optional(),
      "subjectType": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const body = req.body as { subjectType?: GuardianPolicyAssignment["subjectType"]; subjectId?: string; context?: Record<string, unknown>; expiresAt?: string };
    if (!body.subjectType || !body.subjectId) { sendBadRequest(res, "subjectType and subjectId are required"); return; }

    const [policy] = await db.select({ id: guardianPoliciesTable.id }).from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, policyId)).limit(1);
    if (!policy) { sendNotFound(res, "Policy not found"); return; }

    const [inserted] = await db.insert(guardianPolicyAssignmentsTable).values({
      policyId, subjectType: body.subjectType, subjectId: body.subjectId,
      context: body.context ?? {}, grantedById: req.user?.id ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).onConflictDoNothing({ target: [guardianPolicyAssignmentsTable.policyId, guardianPolicyAssignmentsTable.subjectType, guardianPolicyAssignmentsTable.subjectId] }).returning();

    if (!inserted) {
      const [ex] = await db.select().from(guardianPolicyAssignmentsTable).where(and(eq(guardianPolicyAssignmentsTable.policyId, policyId), eq(guardianPolicyAssignmentsTable.subjectType, body.subjectType), eq(guardianPolicyAssignmentsTable.subjectId, body.subjectId))).limit(1);
      if (ex) { sendSuccess(res, assignmentRowToApi(ex)); return; }
      handleRouteError(res, new Error("insert returned no row"), "Failed to create assignment");
      return;
    }
    logger.info({ policyId, subject: `${inserted.subjectType}:${inserted.subjectId}` }, "Policy assignment created");
    await logToolAuditEvent({
      action: "policy.assignment.create",
      entityType: "guardian_policy_assignment",
      entityId: String(inserted.id),
      newValues: assignmentRowToApi(inserted) as unknown as Record<string, unknown>,
      req,
    });
    sendCreated(res, assignmentRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy assignment");
  }
});

router.delete("/policies/:id/assignments/:assignmentId", validateBody(bodyShape({})), authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    const assignmentId = parseInt(req.params["assignmentId"] as string, 10);
    if (isNaN(policyId) || isNaN(assignmentId)) { sendBadRequest(res, "Invalid ID"); return; }
    const [existing] = await db.select().from(guardianPolicyAssignmentsTable).where(and(eq(guardianPolicyAssignmentsTable.id, assignmentId), eq(guardianPolicyAssignmentsTable.policyId, policyId))).limit(1);
    const deleted = await db.delete(guardianPolicyAssignmentsTable).where(and(eq(guardianPolicyAssignmentsTable.id, assignmentId), eq(guardianPolicyAssignmentsTable.policyId, policyId))).returning({ id: guardianPolicyAssignmentsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Assignment not found"); return; }
    await logToolAuditEvent({
      action: "policy.assignment.delete",
      entityType: "guardian_policy_assignment",
      entityId: String(assignmentId),
      oldValues: existing ? (assignmentRowToApi(existing) as unknown as Record<string, unknown>) : null,
      req,
    });
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy assignment");
  }
});

// ============================================================
// TOOL MESH — tools, versions, permissions
// ============================================================

router.get("/tools", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const domainTag = req.query["domainTag"] as string | undefined;
    const policyTier = req.query["policyTier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    const conditions: Parameters<typeof and>[0][] = [];
    if (policyTier) conditions.push(eq(toolMeshToolsTable.policyTier, policyTier as ToolMeshTool["policyTier"]));
    if (enabled !== undefined) conditions.push(eq(toolMeshToolsTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(toolMeshToolsTable).where(where as ReturnType<typeof and>);
    let manifests = rows.map(toolRowToManifest);
    if (domainTag) manifests = manifests.filter(m => m.domainTags.includes(domainTag as ToolManifest["domainTags"][number]));

    const offset = (page - 1) * limit;
    sendSuccess(res, manifests.slice(offset, offset + limit), 200, { page, limit, total: manifests.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list tools");
  }
});

router.get("/tools/:toolId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [row] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!row) { sendNotFound(res, "Tool not found"); return; }
    sendSuccess(res, toolRowToManifest(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get tool");
  }
});

router.post("/tools", authMiddleware(), requireRole("super_admin", "admin"), validateBody(bodyShape({
      "id": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const parsed = ToolManifestSchema.safeParse({ ...req.body, createdAt: nowIso, updatedAt: nowIso });
    if (!parsed.success) { sendBadRequest(res, "Invalid tool manifest", parsed.error.flatten()); return; }

    const ex = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, parsed.data.id)).limit(1);
    if (ex.length > 0) { sendBadRequest(res, `Tool with id "${parsed.data.id}" already registered`); return; }

    const m = parsed.data;
    const [inserted] = await db.insert(toolMeshToolsTable).values({
      toolId: m.id, name: m.name, version: m.version, description: m.description,
      domainTags: m.domainTags, policyTier: m.policyTier as any, allowedEnvironments: m.allowedEnvironments,
      inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null,
      rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, failureModes: m.failureModes,
      approvalRequired: m.approvalRequired, owner: m.owner ?? null,
      observabilityHooks: m.observabilityHooks, enabled: m.enabled,
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to register tool"); return; }

    await db.insert(toolMeshToolVersionsTable).values({
      toolDbId: inserted.id, version: m.version, changelog: "Initial registration",
      schemaSnapshot: { inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null, rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, policyTier: m.policyTier },
      publishedById: req.user?.id ?? null,
    }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] });

    const manifest = toolRowToManifest(inserted);
    defaultToolRegistry.register(manifest);
    logger.info({ toolId: manifest.id, policyTier: manifest.policyTier }, "Tool registered");
    await logToolAuditEvent({
      action: "tool.register",
      entityType: "tool",
      entityId: manifest.id,
      newValues: manifest as unknown as Record<string, unknown>,
      req,
    });
    sendCreated(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to register tool");
  }
});

router.patch("/tools/:toolId", authMiddleware(), requireRole("super_admin", "admin"), validateBody(bodyShape({})), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [existing] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!existing) { sendNotFound(res, "Tool not found"); return; }

    const merged = { ...toolRowToManifest(existing), ...req.body, id: toolId, updatedAt: new Date().toISOString() };
    const parsed = ToolManifestSchema.safeParse(merged);
    if (!parsed.success) { sendBadRequest(res, "Invalid tool manifest update", parsed.error.flatten()); return; }

    const m = parsed.data;
    const versionChanged = m.version !== existing.version;

    const [updated] = await db.update(toolMeshToolsTable).set({
      name: m.name, version: m.version, description: m.description,
      domainTags: m.domainTags, policyTier: m.policyTier as any, allowedEnvironments: m.allowedEnvironments,
      inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null,
      rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, failureModes: m.failureModes,
      approvalRequired: m.approvalRequired, owner: m.owner ?? null,
      observabilityHooks: m.observabilityHooks, enabled: m.enabled, updatedAt: new Date(),
    }).where(eq(toolMeshToolsTable.toolId, toolId)).returning();

    if (!updated) { sendNotFound(res, "Tool not found"); return; }

    if (versionChanged) {
      await db.insert(toolMeshToolVersionsTable).values({
        toolDbId: updated.id, version: m.version,
        changelog: (req.body as { changelog?: string }).changelog ?? `Updated to ${m.version}`,
        schemaSnapshot: { inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null, rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, policyTier: m.policyTier },
        publishedById: req.user?.id ?? null,
      }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] });
    }

    const manifest = toolRowToManifest(updated);
    defaultToolRegistry.register(manifest);
    await logToolAuditEvent({
      action: "tool.update",
      entityType: "tool",
      entityId: manifest.id,
      oldValues: toolRowToManifest(existing) as unknown as Record<string, unknown>,
      newValues: { ...(manifest as unknown as Record<string, unknown>), versionChanged },
      req,
    });
    sendSuccess(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to update tool");
  }
});

router.get("/tools/:toolId/audit", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst", "compliance"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [toolRow] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!toolRow) { sendNotFound(res, "Tool not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
    }
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const offset = (page - 1) * limit;
    const where = and(
      or(
        eq(auditEventsTable.entityType, "tool"),
        eq(auditEventsTable.entityType, "tool_version"),
        eq(auditEventsTable.entityType, "tool_permission"),
      ),
      eq(auditEventsTable.entityId, toolId),
    );
    const [rows, totalRow] = await Promise.all([
      db.select().from(auditEventsTable).where(where).orderBy(desc(auditEventsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditEventsTable).where(where),
    ]);
    const actors = await resolveActorMap(rows.map(r => r.userId));
    const items = rows.map(r => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      actor: actorOrUndefined(r.userId, actors),
      actorUserId: r.userId ?? undefined,
      oldValues: r.oldValues ?? null,
      newValues: r.newValues ?? null,
      ipAddress: r.ipAddress ?? undefined,
      userAgent: r.userAgent ?? undefined,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    sendSuccess(res, items, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool audit history");
  }
});

router.get("/tools/:toolId/versions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const rows = await db.select().from(toolMeshToolVersionsTable).where(eq(toolMeshToolVersionsTable.toolDbId, tool.id)).orderBy(desc(toolMeshToolVersionsTable.createdAt));
    sendSuccess(res, rows.map(versionRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool versions");
  }
});

router.post("/tools/:toolId/versions", authMiddleware(), requireRole("super_admin", "admin"), validateBody(bodyShape({
      "changelog": z.unknown().optional(),
      "schemaSnapshot": z.unknown().optional(),
      "version": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const body = req.body as { version?: string; changelog?: string; schemaSnapshot?: Record<string, unknown> };
    if (!body.version) { sendBadRequest(res, "version is required"); return; }
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const [inserted] = await db.insert(toolMeshToolVersionsTable).values({
      toolDbId: tool.id, version: body.version, changelog: body.changelog ?? null,
      schemaSnapshot: body.schemaSnapshot ?? {}, publishedById: req.user?.id ?? null,
    }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] }).returning();
    if (!inserted) { sendBadRequest(res, `Version ${body.version} already exists for tool ${toolId}`); return; }
    await logToolAuditEvent({ action: "tool.version.add", entityType: "tool_version", entityId: toolId, newValues: { version: body.version }, req });
    sendCreated(res, versionRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create tool version");
  }
});

router.get("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const rows = await db.select().from(toolMeshToolPermissionsTable).where(eq(toolMeshToolPermissionsTable.toolDbId, tool.id)).orderBy(desc(toolMeshToolPermissionsTable.createdAt));
    sendSuccess(res, rows.map(permissionRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool permissions");
  }
});

router.post("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin"), validateBody(bodyShape({
      "expiresAt": z.unknown().optional(),
      "permission": z.unknown().optional(),
      "subjectId": z.unknown().optional(),
      "subjectType": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const body = req.body as { subjectType?: ToolMeshToolPermission["subjectType"]; subjectId?: string; permission?: ToolMeshToolPermission["permission"]; expiresAt?: string };
    if (!body.subjectType || !body.subjectId) { sendBadRequest(res, "subjectType and subjectId are required"); return; }
    const permission = body.permission ?? "invoke";
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const [inserted] = await db.insert(toolMeshToolPermissionsTable).values({
      toolDbId: tool.id, subjectType: body.subjectType, subjectId: body.subjectId, permission,
      grantedById: req.user?.id ?? null, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).onConflictDoNothing({ target: [toolMeshToolPermissionsTable.toolDbId, toolMeshToolPermissionsTable.subjectType, toolMeshToolPermissionsTable.subjectId, toolMeshToolPermissionsTable.permission] }).returning();
    if (!inserted) {
      const [ex] = await db.select().from(toolMeshToolPermissionsTable).where(and(eq(toolMeshToolPermissionsTable.toolDbId, tool.id), eq(toolMeshToolPermissionsTable.subjectType, body.subjectType), eq(toolMeshToolPermissionsTable.subjectId, body.subjectId), eq(toolMeshToolPermissionsTable.permission, permission))).limit(1);
      if (ex) { sendSuccess(res, permissionRowToApi(ex)); return; }
      handleRouteError(res, new Error("insert returned no row"), "Failed to grant permission");
      return;
    }
    await logToolAuditEvent({ action: "tool.permission.grant", entityType: "tool_permission", entityId: toolId, newValues: { subjectType: body.subjectType, subjectId: body.subjectId, permission }, req });
    sendCreated(res, permissionRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to grant tool permission");
  }
});

router.delete("/tools/:toolId/permissions/:permissionId", validateBody(bodyShape({})), authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const permissionId = parseInt(req.params["permissionId"] as string, 10);
    if (isNaN(permissionId)) { sendBadRequest(res, "Invalid permission ID"); return; }
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const deleted = await db.delete(toolMeshToolPermissionsTable).where(and(eq(toolMeshToolPermissionsTable.id, permissionId), eq(toolMeshToolPermissionsTable.toolDbId, tool.id))).returning({ id: toolMeshToolPermissionsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Permission not found"); return; }
    await logToolAuditEvent({ action: "tool.permission.revoke", entityType: "tool_permission", entityId: toolId, newValues: { permissionId }, req });
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to revoke tool permission");
  }
});

// ============================================================
// GUARDIAN ACTIONS (governance audit log)
// ============================================================

router.get("/actions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const agentId = req.query["agentId"] as string | undefined;
    const toolId = req.query["toolId"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(toolMeshActionApprovalsTable.orgId, orgId));
    }
    if (status) conditions.push(eq(toolMeshActionApprovalsTable.status, status as any));
    if (agentId) conditions.push(eq(toolMeshActionApprovalsTable.agentId, agentId));
    if (toolId) conditions.push(eq(toolMeshActionApprovalsTable.toolId, toolId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(toolMeshActionApprovalsTable).where(where as ReturnType<typeof and>).orderBy(desc(toolMeshActionApprovalsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(toolMeshActionApprovalsTable).where(where as ReturnType<typeof and>),
    ]);

    const actorIds: Array<number | null | undefined> = [];
    for (const r of rows) {
      actorIds.push(r.approvedById, r.rejectedById, r.requestedById);
    }
    const actors = await resolveActorMap(actorIds);

    sendSuccess(res, rows.map(r => approvalRowToApi(r, actors)), 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list guardian actions");
  }
});

router.get("/actions/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [action] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!action) { sendNotFound(res, "Guardian action not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (action.orgId !== orgId) { sendNotFound(res, "Guardian action not found"); return; }
    }
    const actors = await resolveActorMap([action.approvedById, action.rejectedById, action.requestedById]);
    sendSuccess(res, approvalRowToApi(action, actors));
  } catch (err) {
    handleRouteError(res, err, "Failed to get guardian action");
  }
});

// ============================================================
// TOOL MESH ACTION APPROVALS (tool invocation approval workflow)
// ============================================================

router.post("/tool-approvals", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "action": z.unknown().optional(),
      "agentId": z.unknown().optional(),
      "payload": z.unknown().optional(),
      "reason": z.unknown().optional(),
      "sessionId": z.unknown().optional(),
      "toolId": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { toolId, action, agentId, sessionId, workflowId, payload } = req.body as { toolId?: string; action?: string; agentId?: string; sessionId?: string; workflowId?: string; payload?: Record<string, unknown> };
    if (!toolId || !action) { sendBadRequest(res, "toolId and action are required"); return; }
    const [toolRow] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    const registryHit = !toolRow ? defaultToolRegistry.get(toolId) : null;
    if (!toolRow && !registryHit) { sendNotFound(res, "Tool not found"); return; }
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const incomingPayload: Record<string, unknown> = payload ?? {};
    const toolManifestForEval = toolRow
      ? { id: toolRow.toolId, name: toolRow.name, policyTier: toolRow.policyTier, description: toolRow.description ?? undefined }
      : registryHit
        ? { id: registryHit.id, name: registryHit.name, policyTier: registryHit.policyTier, description: registryHit.description }
        : null;
    const tierForEval = (toolManifestForEval?.policyTier as string | undefined) ?? "operator-approved";

    // Always synthesize a UI-shape evaluation so the approvals inbox
    // can render full evidence + risk. If the caller supplied a
    // policyEvaluation object, merge it on top so caller fields win,
    // but any missing required UI fields (resolvedMode, projectedRisk,
    // projectedImpact, ≥3 memoryRefs) are repaired from the synthesized
    // baseline.
    const synthesized = buildLiveApprovalPolicyEvaluation({
      requestId,
      action,
      tier: tierForEval,
      outcome: "require-approval",
      toolId,
      agentId: agentId ?? null,
      sessionId: sessionId ?? null,
      workflowId: workflowId ?? null,
      product: extractProduct(incomingPayload, toolId),
      context: incomingPayload,
      toolManifest: toolManifestForEval,
    });

    const callerEval =
      incomingPayload && typeof incomingPayload["policyEvaluation"] === "object" && incomingPayload["policyEvaluation"] !== null
        ? (incomingPayload["policyEvaluation"] as Record<string, unknown>)
        : null;

    const callerMemoryRefs = Array.isArray(callerEval?.memoryRefs) ? (callerEval!.memoryRefs as unknown[]) : [];
    const mergedMemoryRefs = callerMemoryRefs.length >= 3 ? callerMemoryRefs : synthesized.memoryRefs;

    const repairedEvaluation: UiPolicyEvaluation = {
      ...synthesized,
      ...(callerEval ?? {}),
      // Force the four UI-critical fields to be well-formed.
      resolvedMode: (callerEval?.["resolvedMode"] as UiPolicyMode | undefined) ?? synthesized.resolvedMode,
      projectedRisk:
        callerEval && typeof callerEval["projectedRisk"] === "object" && callerEval["projectedRisk"] !== null
          ? (callerEval["projectedRisk"] as UiPolicyEvaluation["projectedRisk"])
          : synthesized.projectedRisk,
      projectedImpact:
        callerEval && typeof callerEval["projectedImpact"] === "object" && callerEval["projectedImpact"] !== null
          ? (callerEval["projectedImpact"] as UiPolicyEvaluation["projectedImpact"])
          : synthesized.projectedImpact,
      memoryRefs: mergedMemoryRefs as UiPolicyEvaluation["memoryRefs"],
      evaluationId: (callerEval?.["evaluationId"] as string | undefined) ?? synthesized.evaluationId,
      evaluatedAt: (callerEval?.["evaluatedAt"] as number | undefined) ?? synthesized.evaluatedAt,
    };

    const enrichedPayload: Record<string, unknown> = {
      ...incomingPayload,
      policyEvaluation: repairedEvaluation,
    };

    const [inserted] = await db.insert(toolMeshActionApprovalsTable).values({
      requestId, toolId, action, agentId: agentId ?? null, sessionId: sessionId ?? null,
      workflowId: workflowId ?? null, status: "pending", requestedById: req.user?.id ?? null, payload: enrichedPayload,
    }).returning();
    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create action approval"); return; }
    logger.info({ actionId: inserted.id, toolId, action }, "Action approval request created");
    await logToolAuditEvent({
      action: "action.create",
      entityType: "tool_action_approval",
      entityId: inserted.requestId,
      newValues: approvalRowToApi(inserted) as unknown as Record<string, unknown>,
      req,
    });
    sendCreated(res, approvalRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create action approval");
  }
});

const approveActionHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") { sendBadRequest(res, `Cannot approve action in status: ${existing.status}`); return; }
    const { reason } = req.body as { reason?: string };
    const user = req.user;
    const [updated] = await db.update(toolMeshActionApprovalsTable).set({ status: "approved", approvedById: user?.id ?? null, approvedAt: new Date(), decisionReason: reason ?? null, updatedAt: new Date() }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Action approval not found"); return; }
    logger.info({ actionId: id, approvedBy: user?.id, toolId: updated.toolId }, "Action approved");
    await recordPolicyDecisionAudit({
      req, decision: "approved",
      entityType: "tool_action_approval",
      entityId: updated.requestId,
      action: updated.action,
      product: updated.toolId,
      decisionReason: reason ?? null,
      payload: updated.payload,
      extra: { toolId: updated.toolId, agentId: updated.agentId, approvalId: updated.id },
    });
    await logToolAuditEvent({
      action: "action.approve",
      entityType: "tool_action_approval",
      entityId: updated.requestId,
      oldValues: approvalRowToApi(existing) as unknown as Record<string, unknown>,
      newValues: approvalRowToApi(updated) as unknown as Record<string, unknown>,
      req,
    });
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to approve action");
  }
};

const rejectActionHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") { sendBadRequest(res, `Cannot reject action in status: ${existing.status}`); return; }
    const { reason } = req.body as { reason?: string };
    const user = req.user;
    const [updated] = await db.update(toolMeshActionApprovalsTable).set({ status: "rejected", rejectedById: user?.id ?? null, rejectedAt: new Date(), decisionReason: reason ?? null, updatedAt: new Date() }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Action approval not found"); return; }
    logger.info({ actionId: id, rejectedBy: user?.id, toolId: updated.toolId }, "Action rejected");
    await recordPolicyDecisionAudit({
      req, decision: "rejected",
      entityType: "tool_action_approval",
      entityId: updated.requestId,
      action: updated.action,
      product: updated.toolId,
      decisionReason: reason ?? null,
      payload: updated.payload,
      extra: { toolId: updated.toolId, agentId: updated.agentId, approvalId: updated.id },
    });
    await logToolAuditEvent({
      action: "action.reject",
      entityType: "tool_action_approval",
      entityId: updated.requestId,
      oldValues: approvalRowToApi(existing) as unknown as Record<string, unknown>,
      newValues: approvalRowToApi(updated) as unknown as Record<string, unknown>,
      req,
    });
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to reject action");
  }
};

router.post("/tool-approvals/:id/approve", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({})), approveActionHandler);
router.post("/tool-approvals/:id/reject", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({})), rejectActionHandler);

// Aliases used by the operator UI (policy-approvals page) so the action
// approval buttons work end-to-end and audit rows are written.
router.post("/actions/:id/approve", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({})), approveActionHandler);
router.post("/actions/:id/reject", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({})), rejectActionHandler);

// ============================================================
// GUARDIAN APPROVAL REQUESTS (multi-tier governance approvals)
// ============================================================

router.get("/approvals", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst", "compliance", "exec"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const tier = req.query["tier"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(guardianApprovalRequestsTable.orgId, orgId));
    }
    if (status) conditions.push(eq(guardianApprovalRequestsTable.status, status as any));
    if (tier) conditions.push(eq(guardianApprovalRequestsTable.tier, tier as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianApprovalRequestsTable).where(where as ReturnType<typeof and>).orderBy(desc(guardianApprovalRequestsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardianApprovalRequestsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list guardian approvals");
  }
});

router.get("/approvals/:requestId", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "exec"), async (req: Request, res: Response) => {
  try {
    const requestId = req.params["requestId"] as string;
    const [approval] = await db.select().from(guardianApprovalRequestsTable).where(eq(guardianApprovalRequestsTable.requestId, requestId)).limit(1);
    if (!approval) { sendNotFound(res, "Guardian approval not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (approval.orgId !== orgId) { sendNotFound(res, "Guardian approval not found"); return; }
    }
    sendSuccess(res, approval);
  } catch (err) {
    handleRouteError(res, err, "Failed to get guardian approval");
  }
});

router.post("/approvals/:requestId/review", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "exec"), validateBody(bodyShape({
      "decision": z.unknown().optional(),
      "note": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const requestId = req.params["requestId"] as string;
    const { decision, note } = req.body as { decision?: string; note?: string };

    if (!decision || !["approved", "rejected"].includes(decision)) { sendBadRequest(res, "decision must be one of: approved, rejected"); return; }

    const [existing] = await db.select().from(guardianApprovalRequestsTable).where(eq(guardianApprovalRequestsTable.requestId, requestId)).limit(1);
    if (!existing) { sendNotFound(res, "Guardian approval not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Guardian approval not found"); return; }
    }

    if (existing.status !== "pending") { sendBadRequest(res, `Cannot review approval in status: ${existing.status}`); return; }

    const user = req.user;
    const resolvedApproverId = user?.id?.toString() ?? "unknown";
    const userRoles = user?.roles ?? [];
    const requiredApprovers = (existing.requiredApprovers as string[]) ?? [];
    const currentApprovals = (existing.approvals as Array<Record<string, unknown>>) ?? [];

    const matchingRole = userRoles.find(r => requiredApprovers.includes(r));
    if (!matchingRole && !requiredApprovers.includes("approver")) {
      sendBadRequest(res, `None of your roles [${userRoles.join(", ")}] are in the required approvers set: [${requiredApprovers.join(", ")}]`);
      return;
    }
    const resolvedApproverRole = matchingRole ?? userRoles[0] ?? "operator";

    if (currentApprovals.find(a => a["approverId"] === resolvedApproverId)) {
      sendBadRequest(res, "You have already submitted a review for this approval request");
      return;
    }

    const newApproval = { approverId: resolvedApproverId, approverRole: resolvedApproverRole, decision, note, decidedAt: new Date().toISOString() };
    const updatedApprovals = [...currentApprovals, newApproval];

    const isDualApproval = existing.approvalType === "dual";
    let newStatus: "pending" | "approved" | "rejected" = "pending";

    if (decision === "rejected") {
      newStatus = "rejected";
    } else if (isDualApproval) {
      const approved = updatedApprovals.filter(a => a["decision"] === "approved");
      const distinctIds = new Set(approved.map(a => a["approverId"]));
      const distinctRoles = new Set(approved.map(a => a["approverRole"]));
      if (distinctIds.size >= 2 && distinctRoles.size >= 2) newStatus = "approved";
    } else {
      newStatus = "approved";
    }

    const [updated] = await db.update(guardianApprovalRequestsTable).set({ approvals: updatedApprovals, status: newStatus, updatedAt: new Date() }).where(eq(guardianApprovalRequestsTable.requestId, requestId)).returning();
    logger.info({ requestId, decision, approverId: resolvedApproverId, newStatus }, "Guardian approval reviewed");
    if (decision === "approved" || decision === "rejected") {
      await recordPolicyDecisionAudit({
        req,
        decision: decision as "approved" | "rejected",
        entityType: "guardian_approval_request",
        entityId: requestId,
        action: existing.action,
        product: existing.toolId ?? null,
        decisionReason: note ?? null,
        payload: existing.payload,
        extra: {
          tier: existing.tier,
          approvalType: existing.approvalType,
          approverRole: resolvedApproverRole,
          newStatus,
          agentId: existing.agentId,
          toolId: existing.toolId,
        },
      });
    }
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review guardian approval");
  }
});

// ============================================================
// POLICY DECISION AUDIT EVENTS (proof chain replay)
// ============================================================

router.get(
  "/audit/policy-decisions",
  authMiddleware(),
  requireRole("super_admin", "admin", "ops", "analyst", "compliance", "exec"),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      const product = req.query["product"] as string | undefined;
      const mode = req.query["mode"] as string | undefined;
      const decision = req.query["decision"] as string | undefined;
      const sinceParam = req.query["since"] as string | undefined;

      const conditions: Parameters<typeof and>[0][] = [
        sql`${auditEventsTable.action} IN ('policy.approve', 'policy.reject')`,
      ];
      if (product) conditions.push(eq(auditEventsTable.product, product));
      if (mode) conditions.push(eq(auditEventsTable.resolvedMode, mode));
      if (decision) conditions.push(eq(auditEventsTable.decision, decision));
      if (sinceParam) {
        const sinceDate = new Date(sinceParam);
        if (!isNaN(sinceDate.getTime())) {
          conditions.push(sql`${auditEventsTable.createdAt} >= ${sinceDate}`);
        }
      }

      const where = and(...conditions);
      const format = (req.query["format"] as string | undefined)?.toLowerCase();

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="proof-chain-audit-${new Date().toISOString().substring(0, 10)}.csv"`,
        );
        res.setHeader("Cache-Control", "no-store");

        const header = [
          "timestamp",
          "user_id",
          "action",
          "product",
          "decision",
          "resolved_mode",
          "confidence",
          "blocked_reason",
          "projected_impact_severity",
          "policy_evaluation_id",
          "entity_id",
        ];
        const csvEscape = (v: unknown): string => {
          if (v === null || v === undefined) return "";
          let s = String(v);
          // Neutralize CSV formula injection: prefix cells starting with =, +, -, @, tab, or CR
          // with a single quote so spreadsheet apps treat them as literal text.
          if (s.length > 0 && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };
        const writeLine = async (line: string): Promise<void> => {
          if (!res.write(line)) {
            await new Promise<void>(resolve => res.once("drain", () => resolve()));
          }
        };
        await writeLine(header.join(",") + "\n");

        const CHUNK = 500;
        let offset = 0;
        while (true) {
          const batch = await db
            .select()
            .from(auditEventsTable)
            .where(where as ReturnType<typeof and>)
            .orderBy(desc(auditEventsTable.createdAt))
            .limit(CHUNK)
            .offset(offset);
          if (batch.length === 0) break;
          for (const row of batch) {
            const newValues = (row.newValues as Record<string, unknown> | null) ?? {};
            const action = typeof newValues["action"] === "string" ? (newValues["action"] as string) : "";
            const impact = (row.projectedImpact as Record<string, unknown> | null) ?? {};
            const severity = typeof impact["severity"] === "string" ? (impact["severity"] as string) : "";
            const ts = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? "");
            await writeLine(
              [
                csvEscape(ts),
                csvEscape(row.userId ?? ""),
                csvEscape(action),
                csvEscape(row.product ?? ""),
                csvEscape(row.decision ?? ""),
                csvEscape(row.resolvedMode ?? ""),
                csvEscape(row.confidence ?? ""),
                csvEscape(row.blockedReason ?? ""),
                csvEscape(severity),
                csvEscape(row.policyEvaluationId ?? ""),
                csvEscape(row.entityId ?? ""),
              ].join(",") + "\n",
            );
          }
          if (batch.length < CHUNK) break;
          offset += CHUNK;
        }
        res.end();
        return;
      }

      const offset = (page - 1) * limit;

      const [rows, totalRow] = await Promise.all([
        db.select().from(auditEventsTable).where(where as ReturnType<typeof and>).orderBy(desc(auditEventsTable.createdAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(auditEventsTable).where(where as ReturnType<typeof and>),
      ]);

      sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
    } catch (err) {
      handleRouteError(res, err, "Failed to list policy-decision audit events");
    }
  },
);

// ============================================================
// ROLLBACK EVENTS
// ============================================================

router.get("/rollback-events", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const tier = req.query["tier"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(rollbackEventsTable.orgId, orgId));
    }
    if (status) conditions.push(eq(rollbackEventsTable.status, status as any));
    if (tier) conditions.push(eq(rollbackEventsTable.tier, tier as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(rollbackEventsTable).where(where as ReturnType<typeof and>).orderBy(desc(rollbackEventsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(rollbackEventsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list rollback events");
  }
});

router.get("/rollback-events/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid rollback event ID"); return; }
    const [event] = await db.select().from(rollbackEventsTable).where(eq(rollbackEventsTable.id, id)).limit(1);
    if (!event) { sendNotFound(res, "Rollback event not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (event.orgId !== orgId) { sendNotFound(res, "Rollback event not found"); return; }
    }
    sendSuccess(res, event);
  } catch (err) {
    handleRouteError(res, err, "Failed to get rollback event");
  }
});

router.post("/rollback-events", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "actionId": z.unknown().optional(),
      "agentId": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "reason": z.unknown().optional(),
      "requestId": z.unknown().optional(),
      "tier": z.unknown().optional(),
      "triggeredBy": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { actionId, requestId, agentId, tier, triggeredBy, reason, metadata } = req.body as { actionId?: string; requestId?: string; agentId?: string; tier?: string; triggeredBy?: string; reason?: string; metadata?: Record<string, unknown> };
    if (!actionId || !requestId || !tier || !triggeredBy || !reason) { sendBadRequest(res, "actionId, requestId, tier, triggeredBy, and reason are required"); return; }

    const tierParsed = PolicyTierSchema.safeParse(tier);
    if (!tierParsed.success) { sendBadRequest(res, `Invalid tier: ${tier}`); return; }

    const orgId = userOrgId(req.user);
    const [event] = await db.insert(rollbackEventsTable).values({
      actionId, requestId, agentId, orgId, tier: tierParsed.data,
      triggeredBy, reason, metadata: metadata ?? {}, status: "pending",
    }).returning();

    logger.info({ rollbackEventId: event?.id, actionId, requestId, tier }, "Rollback event created");
    sendCreated(res, event);
  } catch (err) {
    handleRouteError(res, err, "Failed to create rollback event");
  }
});

router.patch("/rollback-events/:id/status", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "status": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid rollback event ID"); return; }

    const { status } = req.body as { status?: string };
    if (!status || !["pending", "in-progress", "completed", "failed"].includes(status)) { sendBadRequest(res, "status must be one of: pending, in-progress, completed, failed"); return; }

    const [existing] = await db.select().from(rollbackEventsTable).where(eq(rollbackEventsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Rollback event not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Rollback event not found"); return; }
    }

    const [updated] = await db.update(rollbackEventsTable).set({
      status: status as "pending" | "in-progress" | "completed" | "failed",
      completedAt: status === "completed" || status === "failed" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(rollbackEventsTable.id, id)).returning();

    if (!updated) { sendNotFound(res, "Rollback event not found"); return; }
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update rollback event status");
  }
});

// ============================================================
// DECISION ENGINE — decide (legacy) + evaluate (full 6-tier)
// ============================================================

router.post("/guardian/decide", authMiddleware(), validateBody(bodyShape({
      "action": z.unknown().optional(),
      "agentId": z.unknown().optional(),
      "context": z.unknown().optional(),
      "domain": z.unknown().optional(),
      "requestId": z.unknown().optional(),
      "sessionId": z.unknown().optional(),
      "tier": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, context } = req.body as Partial<DecisionRequest>;
    if (!requestId || !action) { sendBadRequest(res, "requestId and action are required"); return; }

    await syncDecisionEngine();

    const decision = sharedDecisionEngine.decide({
      requestId, agentId, sessionId, workflowId, action, domain, tier,
      context: (context as Record<string, unknown>) ?? {},
    });

    sendSuccess(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate policy decision");
  }
});

router.post("/guardian/evaluate", authMiddleware(), validateBody(bodyShape({
      "action": z.unknown().optional(),
      "actionCount": z.unknown().optional(),
      "agentId": z.unknown().optional(),
      "context": z.unknown().optional(),
      "domain": z.unknown().optional(),
      "environment": z.unknown().optional(),
      "isExternalComms": z.unknown().optional(),
      "memoryScope": z.unknown().optional(),
      "model": z.unknown().optional(),
      "requestId": z.unknown().optional(),
      "sessionId": z.unknown().optional(),
      "tier": z.unknown().optional(),
      "toolId": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, model, toolId, actionCount, environment, memoryScope, isExternalComms, context } = req.body as Partial<DecisionRequest>;

    if (!requestId || !action) { sendBadRequest(res, "requestId and action are required"); return; }

    await syncDecisionEngine();

    const request: DecisionRequest = {
      requestId, agentId, sessionId, workflowId, action, domain, tier,
      model, toolId, actionCount, environment, memoryScope, isExternalComms,
      context: (context as Record<string, unknown>) ?? {},
    };

    const result = sharedDecisionEngine.evaluate(request);

    const user = req.user;
    const orgId = userOrgId(user);
    const isFailClosedOutcome = result.outcome === "require-approval" || result.outcome === "require-dual-approval" || result.outcome === "block";
    const contextPayload = (context as Record<string, unknown>) ?? {};
    const { redacted: redactedPayload, redactedFields } = redactPayload(contextPayload);

    try {
      const tierParsed = tier ? PolicyTierSchema.safeParse(tier) : { success: false as const };
      const tierValue = (tierParsed.success ? tierParsed.data : (tier ?? "advisory")) as PolicyTier;

      // Look up the tool manifest (DB row → memory fallback) so the
      // evidence chain can carry the real tool description and tier.
      let toolManifestForEval: { id: string; name?: string; policyTier?: string; description?: string } | null = null;
      if (toolId) {
        try {
          const [toolRow] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
          if (toolRow) {
            toolManifestForEval = { id: toolRow.toolId, name: toolRow.name, policyTier: toolRow.policyTier, description: toolRow.description ?? undefined };
          } else {
            const reg = defaultToolRegistry.get(toolId);
            if (reg) toolManifestForEval = { id: reg.id, name: reg.name, policyTier: reg.policyTier, description: reg.description };
          }
        } catch {
          // Manifest lookup is best-effort — never fail evaluation.
        }
      }

      const livePolicyEvaluation = buildLiveApprovalPolicyEvaluation({
        requestId,
        action,
        tier: tierValue,
        outcome: result.outcome,
        matchedRuleId: result.matchedRuleId ?? null,
        reason: result.reason ?? null,
        blockedReason: result.outcome === "block" ? (result.reason ?? "Blocked by policy") : undefined,
        toolId: toolId ?? null,
        agentId: agentId ?? null,
        sessionId: sessionId ?? null,
        workflowId: workflowId ?? null,
        product: extractProduct(redactedPayload, toolManifestForEval?.id ?? null),
        context: redactedPayload,
        toolManifest: toolManifestForEval,
        controlViolations: result.controlViolations,
        rollbackRequired: result.rollbackRequired,
        redactedFields,
      });

      const enrichedPayload: Record<string, unknown> = {
        ...redactedPayload,
        policyEvaluation: livePolicyEvaluation,
      };

      const [actionRecord] = await db.insert(guardianActionsTable).values({
        requestId, agentId, sessionId, workflowId, orgId,
        tier: tierValue, action, toolId, model, environment,
        outcome: result.outcome, matchedRuleId: result.matchedRuleId, reason: result.reason,
        rollbackRequired: result.rollbackRequired, redactApplied: result.redactApplied || redactedFields.length > 0,
        controlViolations: result.controlViolations, payload: enrichedPayload,
        decidedAt: new Date(result.decidedAt),
      }).onConflictDoNothing().returning();

      if (result.outcome === "require-approval" || result.outcome === "require-dual-approval") {
        const approvalType = result.outcome === "require-dual-approval" ? "dual" : "single";
        const expiresAt = computeApprovalExpiresAt(tierValue as PolicyTier);
        const inserted = await db.insert(guardianApprovalRequestsTable).values({
          requestId, agentId, sessionId, workflowId, orgId,
          tier: tierValue, action, toolId, approvalType, status: "pending",
          requiredApprovers: result.requiredApprovers, approvals: [], payload: enrichedPayload,
          expiresAt,
        }).onConflictDoNothing().returning({ requestId: guardianApprovalRequestsTable.requestId });

        if (inserted.length > 0) {
          void notifyApprovalQueueFilled({
            requestId,
            action,
            tier: String(tierValue),
            approvalType,
            agentId,
            toolId,
          });
        }
      }

      logger.info({
        requestId, tier, action, outcome: result.outcome, actionId: actionRecord?.id,
        redactedFields: redactedFields.length > 0 ? redactedFields : undefined,
      }, "Guardian evaluate completed");
    } catch (dbErr) {
      logger.error({ err: dbErr, requestId }, "Failed to persist guardian action");
      if (isFailClosedOutcome) {
        sendServiceUnavailable(res, "Governance persistence failed — action blocked for safety");
        return;
      }
    }

    sendSuccess(res, { ...result, redactedFields: redactedFields.length > 0 ? redactedFields : undefined });
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate guardian policy");
  }
});

// ============================================================
// GUARDRAIL CONFIGS — persisted runtime guardrail configurations
// ============================================================

function guardrailRowToApi(row: GuardrailConfig) {
  return {
    id: row.id,
    orgId: row.orgId,
    guardrailId: row.guardrailId,
    name: row.name,
    description: row.description ?? undefined,
    guardrailType: row.guardrailType,
    config: (row.config as Record<string, unknown>) ?? {},
    appliesToTier: row.appliesToTier ?? undefined,
    enforcement: row.enforcement,
    enabled: row.enabled,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

router.get("/guardrail-configs", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const guardrailType = req.query["guardrailType"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      // Tenant scope: org-specific rows OR global defaults (org_id IS NULL).
      conditions.push(or(eq(guardrailConfigsTable.orgId, orgId), isNull(guardrailConfigsTable.orgId))!);
    }
    if (guardrailType) conditions.push(eq(guardrailConfigsTable.guardrailType, guardrailType as GuardrailConfig["guardrailType"]));
    if (enabled !== undefined) conditions.push(eq(guardrailConfigsTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardrailConfigsTable).where(where as ReturnType<typeof and>).orderBy(desc(guardrailConfigsTable.id)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardrailConfigsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows.map(guardrailRowToApi), 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list guardrail configs");
  }
});

router.get("/guardrail-configs/:id", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid guardrail config ID"); return; }
    const [row] = await db.select().from(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, id)).limit(1);
    if (!row) { sendNotFound(res, "Guardrail config not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (row.orgId !== null && row.orgId !== orgId) { sendNotFound(res, "Guardrail config not found"); return; }
    }
    sendSuccess(res, guardrailRowToApi(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get guardrail config");
  }
});

router.post("/guardrail-configs", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "appliesToTier": z.unknown().optional(),
      "config": z.unknown().optional(),
      "description": z.unknown().optional(),
      "enabled": z.unknown().optional(),
      "enforcement": z.unknown().optional(),
      "guardrailId": z.unknown().optional(),
      "guardrailType": z.unknown().optional(),
      "name": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const body = req.body as { guardrailId?: string; name?: string; description?: string; guardrailType?: GuardrailConfig["guardrailType"]; config?: Record<string, unknown>; appliesToTier?: GuardrailConfig["appliesToTier"]; enforcement?: GuardrailConfig["enforcement"]; enabled?: boolean };
    if (!body.guardrailId || !body.name || !body.guardrailType) { sendBadRequest(res, "guardrailId, name, and guardrailType are required"); return; }
    const orgId = userOrgId(req.user);
    const [inserted] = await db.insert(guardrailConfigsTable).values({
      orgId,
      guardrailId: body.guardrailId,
      name: body.name,
      description: body.description ?? null,
      guardrailType: body.guardrailType,
      config: body.config ?? {},
      appliesToTier: body.appliesToTier ?? null,
      enforcement: body.enforcement ?? "enforce",
      enabled: body.enabled ?? true,
      createdById: req.user?.id ?? null,
    }).returning();
    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create guardrail config"); return; }
    logger.info({ guardrailId: inserted.guardrailId, type: inserted.guardrailType }, "Guardrail config created");
    sendCreated(res, guardrailRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create guardrail config");
  }
});

router.patch("/guardrail-configs/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "appliesToTier": z.unknown().optional(),
      "config": z.unknown().optional(),
      "description": z.unknown().optional(),
      "enabled": z.unknown().optional(),
      "enforcement": z.unknown().optional(),
      "name": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid guardrail config ID"); return; }
    const [existing] = await db.select().from(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Guardrail config not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Guardrail config not found"); return; }
    }
    const body = req.body as Partial<{ name: string; description: string | null; config: Record<string, unknown>; appliesToTier: GuardrailConfig["appliesToTier"]; enforcement: GuardrailConfig["enforcement"]; enabled: boolean }>;
    const u: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) u.name = body.name;
    if (body.description !== undefined) u.description = body.description;
    if (body.config !== undefined) u.config = body.config;
    if (body.appliesToTier !== undefined) u.appliesToTier = body.appliesToTier;
    if (body.enforcement !== undefined) u.enforcement = body.enforcement;
    if (body.enabled !== undefined) u.enabled = body.enabled;
    const [updated] = await db.update(guardrailConfigsTable).set(u).where(eq(guardrailConfigsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Guardrail config not found"); return; }
    sendSuccess(res, guardrailRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to update guardrail config");
  }
});

router.delete("/guardrail-configs/:id", validateBody(bodyShape({})), authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid guardrail config ID"); return; }
    const [existing] = await db.select().from(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Guardrail config not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Guardrail config not found"); return; }
    }
    await db.delete(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete guardrail config");
  }
});

export default router;

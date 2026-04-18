/**
 * Forge REST API.
 * Thin handlers — all business logic lives in services/forge/.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "@szl-holdings/db";
import { validateQuery, listQuerySchema } from "../lib/validation.js";
import {
  forgeAgentsTable,
  forgeAgentVersionsTable,
  forgePromotionsTable,
  forgeDriftEventsTable,
  forgeExecutionRunsTable,
  forgePolicyPacksTable,
  forgeDeploymentTargetsTable,
  forgeModelsTable,
  forgePromptsTable,
  forgePromptVersionsTable,
  forgeEnvironmentProfilesTable,
  forgeRollbackEventsTable,
  forgeToolsTable,
} from "@szl-holdings/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import {
  ENV_TIERS,
  validatePromotion,
  evaluateDrift,
  recordDriftEvent,
  enforcePolicy,
  captureRuntime,
  rollbackAgent,
  executePromotion,
  recordPromotionApproval,
  writeAudit,
  type EnvTier,
} from "../services/forge";

const router: IRouter = Router();

/**
 * Forge governance is operator-scoped (single platform tenant). Write
 * operations on the registry, promotions, rollbacks, executions and
 * approvals must come from a privileged operator role. Read endpoints
 * remain authenticated-only since the registry is non-confidential
 * platform metadata.
 */
const FORGE_OPERATOR_ROLES = new Set(["super_admin", "admin", "platform_operator"]);
function requireForgeOperator(req: Request, res: Response): boolean {
  const roles = req.user?.roles ?? [];
  if (!roles.some(r => FORGE_OPERATOR_ROLES.has(r))) {
    sendBadRequest(res, "Forge write operations require platform operator role");
    return false;
  }
  return true;
}

function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendBadRequest(res, "Validation failed", result.error.flatten());
      return;
    }
    req.body = result.data;
    next();
  };
}

// ─── Schemas ──────────────────────────────────────────────────────────────
const jsonObjectBodySchema = z.record(z.unknown());
const envEnum = z.enum(ENV_TIERS);
const riskEnum = z.enum(["low", "standard", "regulated", "executive"]);

const createAgentSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  domain: z.string().max(80).default("general"),
  riskTier: riskEnum.default("standard"),
  policyPackId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const createVersionSchema = z.object({
  modelId: z.string().optional(),
  promptVersionId: z.string().optional(),
  toolIds: z.array(z.string()).default([]),
  systemConfig: z.record(z.unknown()).default({}),
  evalsPassed: z.boolean().default(false),
  observabilityHookConfigured: z.boolean().default(false),
  provenanceComplete: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

const promoteSchema = z.object({
  toVersionId: z.string(),
  toEnv: envEnum,
  // Human approval is NOT trusted from request payload — derived
  // server-side from approval records on the promotion row.
});

const rollbackSchema = z.object({
  toVersionId: z.string(),
  envTier: envEnum,
  reason: z.string().min(1).max(500),
});

const executeSchema = z.object({
  envTier: envEnum,
  status: z.enum(["success", "failure", "escalated", "overridden"]).default("success"),
  outcome: z.string().max(120).optional(),
  latencyMs: z.number().int().positive().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  toolCalls: z.number().int().nonnegative().optional(),
  toolFailures: z.number().int().nonnegative().optional(),
  humanOverride: z.boolean().optional(),
  valueAtRiskUsd: z.number().nonnegative().optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  trace: z.unknown().optional(),
});

const approveSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(2000).optional(),
});

router.use(authMiddleware());

// ─── Agents ───────────────────────────────────────────────────────────────
router.get("/forge/agents", validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const envFilter = req.query.env as EnvTier | undefined;
    const where = envFilter ? eq(forgeAgentsTable.currentEnv, envFilter) : undefined;
    const rows = await db
      .select()
      .from(forgeAgentsTable)
      .where(where)
      .orderBy(desc(forgeAgentsTable.updatedAt))
      .limit(limit).offset(offset);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list agents"); }
});

router.post("/forge/agents", validateBody(createAgentSchema), async (req: Request, res: Response) => {
    if (!requireForgeOperator(req, res)) return;
  try {
    const data = req.body as z.infer<typeof createAgentSchema>;
    const [agent] = await db.insert(forgeAgentsTable).values({
      slug: data.slug, name: data.name, description: data.description,
      domain: data.domain, riskTier: data.riskTier, policyPackId: data.policyPackId,
      tags: data.tags, ownerUserId: req.user?.id, orgId: req.user?.orgs?.[0]?.orgId ?? null,
    }).returning();
    await writeAudit({ agentId: agent!.id, actorUserId: req.user?.id, action: "create", resourceType: "agent", resourceId: agent!.id, after: agent });
    sendCreated(res, agent);
  } catch (err) { handleRouteError(res, err, "Failed to create agent"); }
});

router.get("/forge/agents/:id", async (req, res) => {
  try {
    const [agent] = await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.id, req.params.id as string)).limit(1);
    if (!agent) return sendNotFound(res, "Agent not found");
    const versions = await db.select().from(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.agentId, agent.id)).orderBy(desc(forgeAgentVersionsTable.version));
    const promotions = await db.select().from(forgePromotionsTable).where(eq(forgePromotionsTable.agentId, agent.id)).orderBy(desc(forgePromotionsTable.createdAt)).limit(20);
    const drift = await db.select().from(forgeDriftEventsTable).where(eq(forgeDriftEventsTable.agentId, agent.id)).orderBy(desc(forgeDriftEventsTable.detectedAt)).limit(20);
    const rollbacks = await db.select().from(forgeRollbackEventsTable).where(eq(forgeRollbackEventsTable.agentId, agent.id)).orderBy(desc(forgeRollbackEventsTable.createdAt)).limit(10);
    sendSuccess(res, { agent, versions, promotions, drift, rollbacks });
  } catch (err) { handleRouteError(res, err, "Failed to fetch agent"); }
});

router.get("/forge/agents/:id/versions", async (req, res) => {
  try {
    const versions = await db.select().from(forgeAgentVersionsTable)
      .where(eq(forgeAgentVersionsTable.agentId, req.params.id as string))
      .orderBy(desc(forgeAgentVersionsTable.version));
    sendSuccess(res, versions);
  } catch (err) { handleRouteError(res, err, "Failed to list versions"); }
});

router.post("/forge/agents/:id/versions", validateBody(createVersionSchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const agentId = req.params.id as string;
    const [last] = await db.select({ v: sql<number>`coalesce(max(${forgeAgentVersionsTable.version}), 0)` })
      .from(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.agentId, agentId));
    const nextVersion = (last?.v ?? 0) + 1;
    const data = req.body as z.infer<typeof createVersionSchema>;
    const [v] = await db.insert(forgeAgentVersionsTable).values({
      agentId, version: nextVersion,
      modelId: data.modelId, promptVersionId: data.promptVersionId,
      toolIds: data.toolIds, systemConfig: data.systemConfig,
      evalsPassed: data.evalsPassed, observabilityHookConfigured: data.observabilityHookConfigured,
      provenanceComplete: data.provenanceComplete, notes: data.notes, createdBy: req.user?.id,
    }).returning();
    await writeAudit({ agentId, actorUserId: req.user?.id, action: "create_version", resourceType: "agent_version", resourceId: v!.id, after: v });
    sendCreated(res, v);
  } catch (err) { handleRouteError(res, err, "Failed to create version"); }
});

router.post("/forge/agents/:id/promote", validateBody(promoteSchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const agentId = req.params.id as string;
    const [agent] = await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.id, agentId)).limit(1);
    if (!agent) return sendNotFound(res, "Agent not found");
    const data = req.body as z.infer<typeof promoteSchema>;
    const fromEnv = agent.currentEnv as EnvTier;

    // Approval is server-authoritative: a brand new promotion has no
    // approvals yet, so we always validate with hasHumanApproval=false.
    // The approver must call /forge/promotions/:id/approve, which will
    // re-validate and (if clean) advance status to "approved". Final
    // executePromotion always re-validates a third time before swap.
    const validation = await validatePromotion({
      agentId, toVersionId: data.toVersionId,
      fromEnv, toEnv: data.toEnv, hasHumanApproval: false,
    });

    const [promo] = await db.insert(forgePromotionsTable).values({
      agentId, fromVersionId: agent.activeVersionId, toVersionId: data.toVersionId,
      fromEnv, toEnv: data.toEnv, requestedBy: req.user?.id,
      status: validation.ok ? "validated" : "blocked",
      blockers: validation.blockers, validationReport: validation.report,
    }).returning();

    await writeAudit({ agentId, actorUserId: req.user?.id, action: "promote_request", resourceType: "promotion", resourceId: promo!.id, after: promo });

    // Auto-execute only when validation OK and the target tier does not
    // require human approval (i.e. dev/sandbox/staging for non-regulated
    // agents). Production and regulated/executive risk classes always wait
    // for an explicit approval call.
    const requiresApproval =
      data.toEnv === "production" ||
      agent.riskTier === "regulated" ||
      agent.riskTier === "executive";
    if (validation.ok && !requiresApproval) {
      const executed = await executePromotion({ promotionId: promo!.id, approverUserId: req.user?.id });
      return sendCreated(res, { promotion: executed, validation });
    }

    sendCreated(res, { promotion: promo, validation });
  } catch (err) { handleRouteError(res, err, "Failed to request promotion"); }
});

router.post("/forge/agents/:id/rollback", validateBody(rollbackSchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const data = req.body as z.infer<typeof rollbackSchema>;
    const agentId = req.params.id as string;
    // Integrity: target version must belong to this agent
    const [target] = await db.select().from(forgeAgentVersionsTable)
      .where(eq(forgeAgentVersionsTable.id, data.toVersionId)).limit(1);
    if (!target || target.agentId !== agentId) {
      return sendBadRequest(res, "Rollback target version does not belong to this agent");
    }
    // Policy gate: rollback is a write action and respects policy outcomes.
    const policy = await enforcePolicy({ agentId, envTier: data.envTier, action: "rollback" });
    if (policy.outcome === "deny") {
      return sendBadRequest(res, `Rollback denied by policy: ${policy.reasons.join("; ")}`);
    }
    if (policy.outcome === "needs_approval") {
      return sendBadRequest(res, `Rollback in ${data.envTier} requires human approval (policy: ${policy.reasons.join("; ")})`);
    }
    const result = await rollbackAgent({ agentId, toVersionId: data.toVersionId, envTier: data.envTier, reason: data.reason, triggeredBy: req.user?.id });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to rollback"); }
});

router.post("/forge/agents/:id/execute", validateBody(executeSchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const agentId = req.params.id as string;
    const [agent] = await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.id, agentId)).limit(1);
    if (!agent || !agent.activeVersionId) return sendBadRequest(res, "Agent has no active version");
    const [version] = await db.select().from(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.id, agent.activeVersionId)).limit(1);
    const data = req.body as z.infer<typeof executeSchema>;
    const policy = await enforcePolicy({ agentId, envTier: data.envTier, action: "execute" });
    if (policy.outcome === "deny") {
      return sendBadRequest(res, `Execution denied by policy: ${policy.reasons.join("; ")}`);
    }
    // needs_approval is a hard gate: the caller must explicitly assert a
    // recorded human override (recorded on the run row for audit). Without
    // it, the request is rejected — informational policy outcomes never
    // silently allow runs to proceed.
    if (policy.outcome === "needs_approval" && !data.humanOverride) {
      return sendBadRequest(res, `Execution requires human approval (policy: ${policy.reasons.join("; ")})`);
    }
    const run = await captureRuntime({
      agentId, versionId: agent.activeVersionId, envTier: data.envTier,
      modelId: version?.modelId ?? undefined, promptVersionId: version?.promptVersionId ?? undefined,
      status: data.status, outcome: data.outcome, latencyMs: data.latencyMs,
      inputTokens: data.inputTokens, outputTokens: data.outputTokens,
      toolCalls: data.toolCalls, toolFailures: data.toolFailures,
      policyOutcome: policy.outcome, humanOverride: data.humanOverride,
      valueAtRiskUsd: data.valueAtRiskUsd, input: data.input, output: data.output, trace: data.trace,
    });
    sendCreated(res, { run, policy });
  } catch (err) { handleRouteError(res, err, "Failed to execute agent"); }
});

// ─── Promotions ──────────────────────────────────────────────────────────
router.get("/forge/promotions", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const where = status ? eq(forgePromotionsTable.status, status) : undefined;
    const rows = await db.select().from(forgePromotionsTable).where(where).orderBy(desc(forgePromotionsTable.createdAt)).limit(limit).offset(offset);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list promotions"); }
});

router.post("/forge/promotions/:id/approve", validateBody(approveSchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const data = req.body as z.infer<typeof approveSchema>;
    const result = await recordPromotionApproval({
      promotionId: req.params.id as string, approverUserId: req.user?.id,
      approverRole: req.user?.roles?.[0], decision: data.decision, note: data.note,
    });
    if (data.decision === "approved") {
      const executed = await executePromotion({ promotionId: req.params.id as string, approverUserId: req.user?.id });
      return sendSuccess(res, { approval: result, promotion: executed });
    }
    sendSuccess(res, { approval: result });
  } catch (err) { handleRouteError(res, err, "Failed to approve promotion"); }
});

// ─── Drift ───────────────────────────────────────────────────────────────
router.get("/forge/drift/events", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(forgeDriftEventsTable).orderBy(desc(forgeDriftEventsTable.detectedAt)).limit(limit).offset(offset);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list drift events"); }
});

router.get("/forge/drift/summary", async (_req, res) => {
  try {
    const events = await db.select().from(forgeDriftEventsTable).orderBy(desc(forgeDriftEventsTable.detectedAt)).limit(500);
    const bySeverity: Record<string, number> = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const byDimension: Record<string, number> = {};
    for (const e of events) {
      bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
      byDimension[e.dimension] = (byDimension[e.dimension] ?? 0) + 1;
    }
    const agentEnvMap: Record<string, Record<string, { score: number; severity: string }>> = {};
    for (const e of events) {
      agentEnvMap[e.agentId] ||= {};
      agentEnvMap[e.agentId]![e.envId] = { score: Number(e.driftScore), severity: e.severity };
    }
    sendSuccess(res, { totalEvents: events.length, bySeverity, byDimension, heatmap: agentEnvMap });
  } catch (err) { handleRouteError(res, err, "Failed to compute drift summary"); }
});

router.post("/forge/drift/evaluate", validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    if (!requireForgeOperator(req, res)) return;
    const { agentId, envId } = req.body as { agentId?: string; envId?: string };
    if (!agentId || !envId) return sendBadRequest(res, "agentId and envId required");
    const report = await evaluateDrift(agentId, envId);
    const event = await recordDriftEvent(report);
    sendSuccess(res, { report, event });
  } catch (err) { handleRouteError(res, err, "Failed to evaluate drift"); }
});

// ─── Executions / Telemetry ──────────────────────────────────────────────
router.get("/forge/executions", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const agentId = req.query.agentId as string | undefined;
    const where = agentId ? eq(forgeExecutionRunsTable.agentId, agentId) : undefined;
    const rows = await db.select().from(forgeExecutionRunsTable).where(where).orderBy(desc(forgeExecutionRunsTable.startedAt)).limit(limit).offset(offset);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list executions"); }
});

router.get("/forge/executions/:id", async (req, res) => {
  try {
    const [run] = await db.select().from(forgeExecutionRunsTable).where(eq(forgeExecutionRunsTable.id, req.params.id as string)).limit(1);
    if (!run) return sendNotFound(res, "Execution not found");
    sendSuccess(res, run);
  } catch (err) { handleRouteError(res, err, "Failed to fetch execution"); }
});

router.get("/forge/telemetry/summary", async (_req, res) => {
  try {
    const recent = await db.select().from(forgeExecutionRunsTable).orderBy(desc(forgeExecutionRunsTable.startedAt)).limit(1000);
    const total = recent.length;
    const successes = recent.filter(r => r.status === "success").length;
    const failures = recent.filter(r => r.status === "failure").length;
    const escalations = recent.filter(r => r.status === "escalated").length;
    const overrides = recent.filter(r => r.humanOverride).length;
    const policyDenials = recent.filter(r => r.policyOutcome === "deny").length;
    const totalToolCalls = recent.reduce((s, r) => s + (r.toolCalls ?? 0), 0);
    const totalToolFailures = recent.reduce((s, r) => s + (r.toolFailures ?? 0), 0);
    const valueAtRisk = recent.reduce((s, r) => s + Number(r.valueAtRiskUsd ?? 0), 0);
    const sortedLat = recent.map(r => r.latencyMs ?? 0).filter(n => n > 0).sort((a, b) => a - b);
    const p = (q: number) => sortedLat.length ? sortedLat[Math.floor((sortedLat.length - 1) * q)] : 0;
    sendSuccess(res, {
      total, successes, failures, escalations, overrides, policyDenials,
      successRate: total ? successes / total : 0,
      escalationRate: total ? escalations / total : 0,
      overrideRate: total ? overrides / total : 0,
      toolFailureRate: totalToolCalls ? totalToolFailures / totalToolCalls : 0,
      latencyP50Ms: p(0.5), latencyP95Ms: p(0.95),
      valueAtRiskProtectedUsd: valueAtRisk,
    });
  } catch (err) { handleRouteError(res, err, "Failed to compute telemetry summary"); }
});

// ─── Lookups ─────────────────────────────────────────────────────────────
router.get("/forge/policies", async (_req, res) => {
  try { sendSuccess(res, await db.select().from(forgePolicyPacksTable).orderBy(forgePolicyPacksTable.name)); }
  catch (err) { handleRouteError(res, err, "Failed to list policies"); }
});
router.get("/forge/targets", async (_req, res) => {
  try { sendSuccess(res, await db.select().from(forgeDeploymentTargetsTable).orderBy(forgeDeploymentTargetsTable.name)); }
  catch (err) { handleRouteError(res, err, "Failed to list targets"); }
});
router.get("/forge/models", async (_req, res) => {
  try { sendSuccess(res, await db.select().from(forgeModelsTable).orderBy(forgeModelsTable.name)); }
  catch (err) { handleRouteError(res, err, "Failed to list models"); }
});
router.get("/forge/tools", async (_req, res) => {
  try { sendSuccess(res, await db.select().from(forgeToolsTable).orderBy(forgeToolsTable.name)); }
  catch (err) { handleRouteError(res, err, "Failed to list tools"); }
});
router.get("/forge/prompts", async (_req, res) => {
  try {
    const prompts = await db.select().from(forgePromptsTable).orderBy(forgePromptsTable.name);
    const versions = await db.select().from(forgePromptVersionsTable);
    const byPrompt: Record<string, typeof versions> = {};
    for (const v of versions) { (byPrompt[v.promptId] ||= []).push(v); }
    sendSuccess(res, prompts.map(p => ({ ...p, versions: byPrompt[p.id] ?? [] })));
  } catch (err) { handleRouteError(res, err, "Failed to list prompts"); }
});
router.get("/forge/environments", async (_req, res) => {
  try { sendSuccess(res, await db.select().from(forgeEnvironmentProfilesTable).orderBy(forgeEnvironmentProfilesTable.tier)); }
  catch (err) { handleRouteError(res, err, "Failed to list environments"); }
});

// ─── Overview ────────────────────────────────────────────────────────────
router.get("/forge/overview", async (_req, res) => {
  try {
    const agents = await db.select().from(forgeAgentsTable);
    const promos = await db.select().from(forgePromotionsTable).orderBy(desc(forgePromotionsTable.createdAt)).limit(50);
    const drift = await db.select().from(forgeDriftEventsTable).orderBy(desc(forgeDriftEventsTable.detectedAt)).limit(50);
    const rollbacks = await db.select().from(forgeRollbackEventsTable).orderBy(desc(forgeRollbackEventsTable.createdAt)).limit(10);
    const recentExec = await db.select().from(forgeExecutionRunsTable).orderBy(desc(forgeExecutionRunsTable.startedAt)).limit(50);

    const byEnv: Record<string, number> = { dev: 0, sandbox: 0, staging: 0, production: 0 };
    const byRisk: Record<string, number> = { low: 0, standard: 0, regulated: 0, executive: 0 };
    for (const a of agents) {
      byEnv[a.currentEnv] = (byEnv[a.currentEnv] ?? 0) + 1;
      byRisk[a.riskTier] = (byRisk[a.riskTier] ?? 0) + 1;
    }
    const driftStatus = {
      healthy: agents.length - new Set(drift.filter(d => d.severity === "high" || d.severity === "critical").map(d => d.agentId)).size,
      drifting: new Set(drift.filter(d => d.severity === "medium").map(d => d.agentId)).size,
      critical: new Set(drift.filter(d => d.severity === "critical" || d.severity === "high").map(d => d.agentId)).size,
    };
    const promotionQueue = promos.filter(p => p.status === "validated" || p.status === "blocked" || p.status === "requested" || p.status === "approved");
    const recentFailures = recentExec.filter(r => r.status === "failure").slice(0, 10);

    sendSuccess(res, {
      totals: { agents: agents.length, executions: recentExec.length, promotions: promos.length, drift: drift.length, rollbacks: rollbacks.length },
      byEnv, byRisk, driftStatus,
      promotionQueue, recentFailures, recentRollbacks: rollbacks,
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch overview"); }
});

export default router;

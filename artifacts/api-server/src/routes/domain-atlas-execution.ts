/**
 * Domain ATLAS Execution Routes
 *
 * Provides the standardized signal → enrichment → recommendation → approval
 * → execution → evidence → outcome flow for all six SZL domain packs:
 *
 *   /aegis/atlas/*        — Aegis security incident signals
 *   /vessels/atlas/*      — Vessels voyage/sanctions/anomaly signals
 *   /terra/atlas/*        — Terra property/ownership/distress signals
 *   /carlota-jo/atlas/*   — Carlota Jo client/property/vendor signals
 *   /imperium/atlas/*     — IMPERIUM infra/cost/policy/sovereignty signals
 *
 * Each domain exposes:
 *   POST   /:domain/atlas/signals              — ingest a domain signal
 *   GET    /:domain/atlas/signals              — list ingested signals
 *   POST   /:domain/atlas/evaluate             — evaluate signals through decision engine
 *   POST   /:domain/atlas/policy-check         — check policy gate for an action
 *   POST   /:domain/atlas/execute              — execute an approved workflow
 *   GET    /:domain/atlas/runs                 — list workflow runs
 *   GET    /:domain/atlas/runs/:runId          — get a specific run
 *   POST   /:domain/atlas/evidence             — capture evidence record
 *   GET    /:domain/atlas/evidence             — list evidence for domain
 *   POST   /:domain/atlas/outcome              — record workflow outcome
 *   GET    /:domain/atlas/outcomes             — list outcomes for domain
 *   GET    /:domain/atlas/evaluation-hooks     — list evaluation hooks for replay
 *   POST   /:domain/atlas/evaluation-hooks/replay — replay a recorded workflow
 *   GET    /:domain/atlas/workflows            — list available workflows for domain
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.js";
import { sendSuccess, sendCreated, sendBadRequest, sendNotFound, sendForbidden, handleRouteError } from "../lib/api-response.js";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation.js";
import { logger } from "../lib/logger.js";
import {
  initializeAtlasExecutionEngine,
  ingestSignal,
  getSignals,
  updateSignalStatus,
  captureEvidence,
  getEvidence,
  recordOutcome,
  getOutcomes,
  getEvaluationHooks,
  getEvaluationHookById,
  registerEvaluationHook,
  evaluateSignalsForDomain,
  checkDomainPolicy,
  executedomainWorkflow,
  DOMAIN_WORKFLOWS,
  type AtlasSignalRecord,
} from "../lib/atlas-execution-engine.js";
import { dbListRuns, dbGetRunById, dbCancelRun, dbApproveRun } from "../lib/decisioning-store.js";

import { bodyShape } from "@szl-holdings/contracts/common";
initializeAtlasExecutionEngine();

const router: IRouter = Router();

// ─── Domain Configuration ─────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<string, { label: string; workflowKey: string; signalTypes: string[] }> = {
  aegis: {
    label: "PARAGON — Security Intelligence",
    workflowKey: "aegis-incident-response",
    signalTypes: ["security-incident", "threat-detection", "vulnerability", "anomaly", "policy-violation", "intrusion-attempt"],
  },
  vessels: {
    label: "SEXTANT — Maritime Intelligence",
    workflowKey: "vessels-voyage-risk",
    signalTypes: ["voyage-anomaly", "sanctions-match", "ais-gap", "cargo-risk", "port-risk", "weather-hazard", "dark-vessel"],
  },
  terra: {
    label: "DOMAINE — Real Estate Intelligence",
    workflowKey: "terra-deal-underwriting",
    signalTypes: ["distress-signal", "ownership-change", "price-anomaly", "market-shift", "zoning-change", "tax-delinquency", "lien-detected"],
  },
  "carlota-jo": {
    label: "Carlota Jo — Concierge Operations",
    workflowKey: "carlota-concierge-workflow",
    signalTypes: ["client-request", "property-ops-issue", "vendor-issue", "booking-request", "service-escalation", "maintenance-alert"],
  },
  imperium: {
    label: "IMPERIUM — Infrastructure Governance",
    workflowKey: "imperium-remediation",
    signalTypes: ["cost-anomaly", "policy-drift", "sovereignty-risk", "capacity-breach", "security-misconfiguration", "compliance-gap"],
  },
};

const SUPPORTED_DOMAINS = Object.keys(DOMAIN_CONFIG);

function tenantIdFromReq(req: Request): string | undefined {
  const orgId = req.user?.orgs?.[0]?.orgId;
  return orgId != null ? String(orgId) : undefined;
}

/**
 * Resolve the tenant context for a tenant-scoped ATLAS read/write.
 *
 * Fail-closed semantics:
 *   - Internal agent calls (server-to-server with the internal token) are
 *     allowed through with `tenantId = undefined` — they are trusted to
 *     query across tenants for system workflows.
 *   - Authenticated end users MUST belong to at least one organization;
 *     if not, the request is denied with 403 so we never silently fall
 *     back to a domain-wide read.
 *   - Unauthenticated requests are rejected with 401.
 *
 * On denial this writes the response and returns null; callers must early-return.
 */
function resolveTenantContext(req: Request, res: Response): { tenantId: string | undefined } | null {
  if (req.isInternalAgent) {
    return { tenantId: undefined };
  }
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    return null;
  }
  const tenantId = tenantIdFromReq(req);
  if (!tenantId) {
    res.status(403).json({ error: "Tenant context required", code: "TENANT_REQUIRED" });
    return null;
  }
  return { tenantId };
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const SignalIngestSchema = z.object({
  signalType: z.string().min(1).max(100),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).default(""),
  confidence: z.number().min(0).max(1).default(0.75),
  source: z.string().min(1).max(200).default("manual"),
  payload: z.record(z.unknown()).default({}),
  tenantId: z.string().default("default"),
});

const EvaluateSignalsSchema = z.object({
  signalIds: z.array(z.string()).min(1).max(50),
  context: z.record(z.unknown()).optional(),
});

const PolicyCheckSchema = z.object({
  action: z.string().min(1),
  actionClass: z.string().optional(),
  subjectRoles: z.array(z.string()).default(["operator"]),
  resourceType: z.string().default("workflow"),
  resourceId: z.string().optional(),
  resourceAttributes: z.record(z.unknown()).default({}),
  tenantId: z.string().optional(),
});

const ExecuteWorkflowSchema = z.object({
  workflowKey: z.string().optional(),
  signalIds: z.array(z.string()).optional(),
  recommendationId: z.string().optional(),
  approvedBy: z.string().optional(),
  isDryRun: z.boolean().default(false),
  isSimulation: z.boolean().default(false),
  tenantId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const EvidenceCaptureSchema = z.object({
  workflowId: z.string().min(1),
  label: z.string().min(1).max(300),
  value: z.string().min(1).max(10000),
  source: z.string().default("manual"),
  capturedBy: z.string().default("system"),
  immutable: z.boolean().default(true),
});

const OutcomeRecordSchema = z.object({
  workflowId: z.string().min(1),
  signalId: z.string().optional(),
  recommendationId: z.string().optional(),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(5000),
  status: z.enum(["success", "partial", "failed", "rolled_back"]),
  businessImpact: z.object({
    financialImpactUsd: z.number().optional(),
    operationalSeverity: z.string().optional(),
    entitiesAffected: z.number().int().nonnegative().optional(),
  }).optional(),
  recordedBy: z.string().default("system"),
  evidence: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Domain Middleware ────────────────────────────────────────────────────────

function _requireValidDomain(_req: Request, res: Response, domain: string): boolean {
  if (!SUPPORTED_DOMAINS.includes(domain)) {
    res.status(404).json({ error: `Unknown domain: ${domain}. Supported: ${SUPPORTED_DOMAINS.join(", ")}` });
    return false;
  }
  return true;
}

// ─── Route Builders ───────────────────────────────────────────────────────────

function buildDomainRoutes(domain: string): void {
  const config = DOMAIN_CONFIG[domain];
  const prefix = `/${domain}/atlas`;

  // ── GET /:domain/atlas/workflows ────────────────────────────────────────────
  router.get(`${prefix}/workflows`, authMiddleware({ required: false }), (_req: Request, res: Response) => {
    const domainWorkflows = Object.values(DOMAIN_WORKFLOWS).filter(w => w.domain === domain || w.domain === (domain === "aegis" ? "aegis" : domain));
    sendSuccess(res, {
      domain,
      label: config.label,
      workflows: domainWorkflows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        executionMode: w.executionMode,
        requiresExplicitApproval: w.requiresExplicitApproval,
        isDryRunCapable: w.isDryRunCapable,
        isSimulationCapable: w.isSimulationCapable,
        stepCount: w.steps.length,
        steps: w.steps.map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          requiresApproval: s.requiresApproval,
          approverRole: s.approverRole,
          executionMode: s.executionMode,
        })),
      })),
      supportedSignalTypes: config.signalTypes,
    });
  });

  // ── POST /:domain/atlas/signals ─────────────────────────────────────────────
  router.post(
    `${prefix}/signals`,
    authMiddleware(),
    validateBody(SignalIngestSchema),
    async (req: Request, res: Response) => {
      try {
        const ctx = resolveTenantContext(req, res);
        if (!ctx) return;
        const body = req.body as z.infer<typeof SignalIngestSchema>;
        // For end-user callers, derive tenantId from the session and ignore
        // any body-supplied tenantId to prevent cross-tenant injection.
        // Internal-agent (server-to-server) callers may set tenantId in the
        // body since they legitimately ingest on behalf of any tenant.
        const tenantId = req.isInternalAgent ? (body.tenantId ?? ctx.tenantId) : ctx.tenantId;
        const signal = await ingestSignal({
          domain,
          signalType: body.signalType,
          severity: body.severity,
          title: body.title,
          description: body.description,
          confidence: body.confidence,
          source: body.source,
          payload: body.payload,
          status: "raw",
          tenantId,
        });
        logger.info({ domain, signalId: signal.id, signalType: body.signalType }, "domain-atlas:signal:ingested");
        sendCreated(res, signal);
      } catch (err) {
        handleRouteError(res, err, "Failed to ingest signal");
      }
    }
  );

  // ── GET /:domain/atlas/signals ──────────────────────────────────────────────
  router.get(`${prefix}/signals`, authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
      const signals = await getSignals(domain, limit, ctx.tenantId);
      sendSuccess(res, { domain, signals, count: signals.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to list signals");
    }
  });

  // ── PATCH /:domain/atlas/signals/:signalId/status ───────────────────────────
  router.patch(`${prefix}/signals/:signalId/status`, authMiddleware(), validateBody(bodyShape({
      "action": z.unknown().optional(),
      "actionClass": z.unknown().optional(),
      "approvedBy": z.unknown().optional(),
      "businessImpact": z.unknown().optional(),
      "capturedBy": z.unknown().optional(),
      "context": z.unknown().optional(),
      "evidence": z.unknown().optional(),
      "hookId": z.unknown().optional(),
      "immutable": z.unknown().optional(),
      "isDryRun": z.unknown().optional(),
      "isSimulation": z.unknown().optional(),
      "label": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "recommendationId": z.unknown().optional(),
      "recordedBy": z.unknown().optional(),
      "resourceAttributes": z.unknown().optional(),
      "resourceId": z.unknown().optional(),
      "resourceType": z.unknown().optional(),
      "signalId": z.unknown().optional(),
      "signalIds": z.unknown().optional(),
      "source": z.unknown().optional(),
      "status": z.unknown().optional(),
      "subjectRoles": z.unknown().optional(),
      "summary": z.unknown().optional(),
      "tenantId": z.unknown().optional(),
      "title": z.unknown().optional(),
      "value": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
      "workflowKey": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
    try {
      const signalId = String(req.params.signalId);
      const { status } = req.body as { status?: AtlasSignalRecord["status"] };
      const validStatuses: AtlasSignalRecord["status"][] = ["raw", "normalized", "processed", "acknowledged", "resolved"];
      if (!status || !validStatuses.includes(status)) {
        sendBadRequest(res, `status must be one of: ${validStatuses.join(", ")}`);
        return;
      }
      const updated = await updateSignalStatus(domain, signalId, status);
      if (!updated) { sendNotFound(res, "Signal not found"); return; }
      sendSuccess(res, { domain, signalId, status, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, "Failed to update signal status");
    }
  });

  // ── POST /:domain/atlas/evaluate ────────────────────────────────────────────
  router.post(
    `${prefix}/evaluate`,
    authMiddleware({ required: false }),
    validateBody(EvaluateSignalsSchema),
    validateQuery(listQuerySchema),
    async (req: Request, res: Response) => {
      try {
        const ctx = resolveTenantContext(req, res);
        if (!ctx) return;
        const body = req.body as z.infer<typeof EvaluateSignalsSchema>;
        const allSignals = await getSignals(domain, 200, ctx.tenantId);
        const targetSignals = allSignals.filter(s => body.signalIds.includes(s.id));

        if (targetSignals.length === 0) {
          sendBadRequest(res, "None of the provided signalIds were found for this domain");
          return;
        }

        const recommendations = await evaluateSignalsForDomain(domain, targetSignals, body.context);

        for (const id of body.signalIds) {
          await updateSignalStatus(domain, id, "processed");
        }

        logger.info({ domain, signalCount: targetSignals.length, recommendationCount: recommendations.length }, "domain-atlas:evaluate:completed");
        sendSuccess(res, {
          domain,
          signalsEvaluated: targetSignals.length,
          recommendations,
          evaluatedAt: new Date().toISOString(),
          engineVersion: "decision-engine/1.0",
        });
      } catch (err) {
        handleRouteError(res, err, "Failed to evaluate signals");
      }
    }
  );

  // ── POST /:domain/atlas/policy-check ────────────────────────────────────────
  router.post(
    `${prefix}/policy-check`,
    authMiddleware({ required: false }),
    validateBody(PolicyCheckSchema),
    (req: Request, res: Response) => {
      try {
        const body = req.body as z.infer<typeof PolicyCheckSchema>;
        const result = checkDomainPolicy({
          action: body.action,
          domain,
          tenantId: body.tenantId,
          actionClass: body.actionClass,
          subject: {
            id: req.user?.id != null ? String(req.user.id) : "anonymous",
            roles: body.subjectRoles,
            tenantId: body.tenantId,
          },
          resource: {
            type: body.resourceType,
            id: body.resourceId,
            domain,
            attributes: body.resourceAttributes,
          },
        });

        logger.info({ domain, action: body.action, effect: result.effect, allowed: result.allowed }, "domain-atlas:policy-check:completed");
        sendSuccess(res, {
          domain,
          action: body.action,
          ...result,
          checkedAt: new Date().toISOString(),
          engineVersion: "policy-engine/1.0",
        });
      } catch (err) {
        handleRouteError(res, err, "Failed to evaluate policy");
      }
    }
  );

  // ── POST /:domain/atlas/execute ─────────────────────────────────────────────
  router.post(
    `${prefix}/execute`,
    authMiddleware({ required: false }),
    validateBody(ExecuteWorkflowSchema),
    async (req: Request, res: Response) => {
      try {
        const body = req.body as z.infer<typeof ExecuteWorkflowSchema>;
        const workflowKey = body.workflowKey ?? config.workflowKey;

        if (!DOMAIN_WORKFLOWS[workflowKey]) {
          sendBadRequest(res, `Unknown workflowKey: ${workflowKey}`);
          return;
        }

        const result = await executedomainWorkflow({
          domain,
          workflowKey,
          signalIds: body.signalIds,
          recommendationId: body.recommendationId,
          approvedBy: body.approvedBy ?? (req.user?.id != null ? String(req.user.id) : undefined),
          isDryRun: body.isDryRun,
          isSimulation: body.isSimulation,
          tenantId: body.tenantId ?? (req.user?.orgs?.[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined),
          initiatedBy: req.user?.id != null ? String(req.user.id) : "system",
          metadata: body.metadata,
        });

        logger.info({ domain, workflowKey, runId: result.run.runId, status: result.run.status }, "domain-atlas:execute:completed");
        sendCreated(res, {
          domain,
          workflowKey,
          run: result.run,
          requiresApproval: result.requiresApproval,
          approvalRequest: result.approvalRequest,
          dryRunSummary: result.dryRunSummary,
          simulationSummary: result.simulationSummary,
          executedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleRouteError(res, err, "Failed to execute workflow");
      }
    }
  );

  // ── GET /:domain/atlas/runs ─────────────────────────────────────────────────
  router.get(`${prefix}/runs`, authMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString();
      const result = await dbListRuns({ domain, tenantId, onlyNullTenant: !tenantId });
      sendSuccess(res, { domain, runs: result.runs, count: result.total });
    } catch (err) {
      handleRouteError(res, err, "Failed to list runs");
    }
  });

  // ── GET /:domain/atlas/runs/:runId ──────────────────────────────────────────
  router.get(`${prefix}/runs/:runId`, authMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString();
      const run = await dbGetRunById(req.params.runId as string, tenantId);
      if (!run) { sendNotFound(res, "Run not found"); return; }
      sendSuccess(res, { domain, run });
    } catch (err) {
      handleRouteError(res, err, "Failed to get run");
    }
  });

  // ── POST /:domain/atlas/runs/:runId/approve ─────────────────────────────────
  router.post(`${prefix}/runs/:runId/approve`, validateBody(bodyShape({
      "businessImpact": z.unknown().optional(),
      "capturedBy": z.unknown().optional(),
      "evidence": z.unknown().optional(),
      "hookId": z.unknown().optional(),
      "immutable": z.unknown().optional(),
      "isDryRun": z.unknown().optional(),
      "isSimulation": z.unknown().optional(),
      "label": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "recommendationId": z.unknown().optional(),
      "recordedBy": z.unknown().optional(),
      "signalId": z.unknown().optional(),
      "source": z.unknown().optional(),
      "status": z.unknown().optional(),
      "summary": z.unknown().optional(),
      "title": z.unknown().optional(),
      "value": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
    })), authMiddleware({ required: true }), async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString();
      const approvedBy = `user:${String(req.user?.id)}`;

      // Fetch the paused run to extract workflow context for continuation
      const existing = await dbGetRunById(runId as string, tenantId);
      if (!existing) { sendNotFound(res, "Run not found"); return; }
      if (!["pending", "pending_approval", "awaiting_approval"].includes(existing.status)) {
        sendBadRequest(res, `Run is not in an approvable state (status: ${existing.status})`); return;
      }

      // Derive workflow context from the stored run
      const existingMeta = existing.metadata as Record<string, unknown> | null;
      const signalIds = Array.isArray(existingMeta?.signalIds) ? (existingMeta.signalIds as string[]) : undefined;
      const workflowKey = existing.workflowId ?? Object.keys(DOMAIN_WORKFLOWS).find(k => k.startsWith(`${domain}.`));
      if (!workflowKey || !DOMAIN_WORKFLOWS[workflowKey]) {
        sendBadRequest(res, `Cannot continue run: workflow key '${workflowKey}' not found`); return;
      }

      // Check that the current user holds the role required by the approval step
      type WFStep = { requiresApproval?: boolean; approverRole?: string };
      const approvalStep = (DOMAIN_WORKFLOWS[workflowKey].steps as WFStep[]).find(s => s.requiresApproval);
      const requiredRole = approvalStep?.approverRole;
      if (requiredRole) {
        const userRoles: string[] = (req.user?.roles as string[]) ?? [];
        const isSuperAdmin = userRoles.includes("super_admin") || userRoles.includes("admin");
        if (!isSuperAdmin && !userRoles.includes(requiredRole)) {
          sendForbidden(res, `Insufficient role: '${requiredRole}' required to approve this run`); return;
        }
      }

      // Mark the original pending run as approved in the DB
      await dbApproveRun(runId as string, tenantId, approvedBy);

      const result = await executedomainWorkflow({
        domain,
        workflowKey,
        signalIds,
        approvedBy,
        tenantId,
        initiatedBy: approvedBy,
        metadata: { continuationOf: runId as string },
      });

      logger.info({ domain, runId, approvedBy, newRunId: result.run.runId }, "domain-atlas:run:approved+continued");
      sendSuccess(res, { domain, runId, status: "approved", approvedBy, continuationRun: result.run });
    } catch (err) {
      handleRouteError(res, err, "Failed to approve run");
    }
  });

  // ── POST /:domain/atlas/runs/:runId/cancel ──────────────────────────────────
  router.post(`${prefix}/runs/:runId/cancel`, validateBody(bodyShape({
      "businessImpact": z.unknown().optional(),
      "capturedBy": z.unknown().optional(),
      "evidence": z.unknown().optional(),
      "hookId": z.unknown().optional(),
      "immutable": z.unknown().optional(),
      "isDryRun": z.unknown().optional(),
      "isSimulation": z.unknown().optional(),
      "label": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "recommendationId": z.unknown().optional(),
      "recordedBy": z.unknown().optional(),
      "signalId": z.unknown().optional(),
      "source": z.unknown().optional(),
      "status": z.unknown().optional(),
      "summary": z.unknown().optional(),
      "title": z.unknown().optional(),
      "value": z.unknown().optional(),
      "workflowId": z.unknown().optional(),
    })), authMiddleware({ required: true }), async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString();
      const rejectedBy = `user:${String(req.user?.id)}`;
      const cancelled = await dbCancelRun(runId as string, tenantId, rejectedBy);
      if (!cancelled) { sendNotFound(res, "Run not found or already completed"); return; }
      logger.info({ domain, runId, rejectedBy }, "domain-atlas:run:rejected");
      sendSuccess(res, { domain, runId, status: "rejected" });
    } catch (err) {
      handleRouteError(res, err, "Failed to cancel run");
    }
  });

  // ── POST /:domain/atlas/evidence ────────────────────────────────────────────
  router.post(
    `${prefix}/evidence`,
    authMiddleware({ required: false }),
    validateBody(EvidenceCaptureSchema),
    async (req: Request, res: Response) => {
      try {
        const ctx = resolveTenantContext(req, res);
        if (!ctx) return;
        const body = req.body as z.infer<typeof EvidenceCaptureSchema>;
        const evidence = await captureEvidence({
          domain,
          workflowId: body.workflowId,
          label: body.label,
          value: body.value,
          source: body.source,
          capturedBy: body.capturedBy,
          immutable: body.immutable,
          tenantId: ctx.tenantId,
        });
        logger.info({ domain, evidenceId: evidence.id, workflowId: body.workflowId }, "domain-atlas:evidence:captured");
        sendCreated(res, evidence);
      } catch (err) {
        handleRouteError(res, err, "Failed to capture evidence");
      }
    }
  );

  // ── GET /:domain/atlas/evidence ─────────────────────────────────────────────
  router.get(`${prefix}/evidence`, authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const workflowId = req.query.workflowId as string | undefined;
      const evidence = await getEvidence(domain, workflowId, ctx.tenantId);
      sendSuccess(res, { domain, evidence, count: evidence.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to list evidence");
    }
  });

  // ── POST /:domain/atlas/outcome ─────────────────────────────────────────────
  router.post(
    `${prefix}/outcome`,
    authMiddleware({ required: false }),
    validateBody(OutcomeRecordSchema),
    async (req: Request, res: Response) => {
      try {
        const ctx = resolveTenantContext(req, res);
        if (!ctx) return;
        const body = req.body as z.infer<typeof OutcomeRecordSchema>;
        const outcome = await recordOutcome({
          domain,
          workflowId: body.workflowId,
          signalId: body.signalId,
          recommendationId: body.recommendationId,
          title: body.title,
          summary: body.summary,
          status: body.status,
          businessImpact: body.businessImpact,
          recordedBy: body.recordedBy,
          evidence: body.evidence,
          metadata: body.metadata,
          tenantId: ctx.tenantId,
        });
        logger.info({ domain, outcomeId: outcome.id, workflowId: body.workflowId, status: body.status }, "domain-atlas:outcome:recorded");
        sendCreated(res, outcome);
      } catch (err) {
        handleRouteError(res, err, "Failed to record outcome");
      }
    }
  );

  // ── GET /:domain/atlas/outcomes ─────────────────────────────────────────────
  router.get(`${prefix}/outcomes`, authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
      const outcomes = await getOutcomes(domain, limit, ctx.tenantId);
      sendSuccess(res, { domain, outcomes, count: outcomes.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to list outcomes");
    }
  });

  // ── GET /:domain/atlas/evaluation-hooks ─────────────────────────────────────
  router.get(`${prefix}/evaluation-hooks`, authMiddleware(), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const hooks = await getEvaluationHooks(domain, ctx.tenantId);
      sendSuccess(res, {
        domain,
        hooks: hooks.map(h => ({
          id: h.id,
          workflowId: h.workflowId,
          workflowName: h.workflowName,
          triggerSignalId: h.triggerSignalId,
          replayable: h.replayable,
          snapshotAt: h.snapshotAt,
          benchmarkMetrics: h.benchmarkMetrics,
          signalSnapshotCount: h.signalSnapshot.length,
          runStatus: h.runSnapshot.status,
        })),
        count: hooks.length,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list evaluation hooks");
    }
  });

  // ── POST /:domain/atlas/evaluation-hooks/replay ──────────────────────────────
  router.post(`${prefix}/evaluation-hooks/replay`, authMiddleware({ required: false }), validateBody(bodyShape({
      "hookId": z.unknown().optional(),
      "isDryRun": z.unknown().optional(),
      "isSimulation": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const { hookId, isDryRun, isSimulation } = req.body as { hookId?: string; isDryRun?: boolean; isSimulation?: boolean };
      if (!hookId) { sendBadRequest(res, "hookId is required"); return; }

      const reqTenantId = ctx.tenantId;
      const hook = await getEvaluationHookById(hookId, reqTenantId);
      if (!hook) { sendNotFound(res, "Evaluation hook not found"); return; }
      if (hook.domain !== domain) { res.status(403).json({ error: "Hook belongs to a different domain" }); return; }
      if (!hook.replayable) { res.status(422).json({ error: "This hook is not marked as replayable" }); return; }

      for (const signal of hook.signalSnapshot) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...signalData } = signal;
        await ingestSignal({ ...signalData, status: "raw", tenantId: reqTenantId ?? signalData.tenantId });
      }

      const workflowKey = Object.keys(DOMAIN_WORKFLOWS).find(k => DOMAIN_WORKFLOWS[k].domain === domain) ?? config.workflowKey;
      const startedAt = Date.now();
      const result = await executedomainWorkflow({
        domain,
        workflowKey,
        signalIds: hook.signalSnapshot.map(s => s.id),
        isDryRun: isDryRun ?? true,
        isSimulation: isSimulation ?? false,
        initiatedBy: req.user?.id != null ? String(req.user.id) : "replay-system",
        metadata: { replayOf: hookId, originalWorkflowId: hook.workflowId },
      });
      const latencyMs = Date.now() - startedAt;

      const replayHook = await registerEvaluationHook({
        domain,
        workflowId: result.run.runId,
        workflowName: `[REPLAY] ${hook.workflowName}`,
        triggerSignalId: hook.triggerSignalId,
        replayable: false,
        signalSnapshot: hook.signalSnapshot,
        runSnapshot: result.run,
        benchmarkMetrics: {
          latencyMs,
          stepsCompleted: (result.run.steps as Array<{ status: string }>).filter(s => s.status === "completed").length,
          stepsFailed: (result.run.steps as Array<{ status: string }>).filter(s => s.status === "failed").length,
        },
        tenantId: reqTenantId ?? hook.tenantId,
      });

      logger.info({ domain, hookId, replayHookId: replayHook.id, latencyMs }, "domain-atlas:replay:completed");
      const replayStepsCompleted = (result.run.steps as Array<{ status: string }>).filter(s => s.status === "completed").length;
      sendCreated(res, {
        domain,
        replayedHookId: hookId,
        replayHookId: replayHook.id,
        run: result.run,
        latencyMs,
        benchmarkComparison: {
          originalLatencyMs: hook.benchmarkMetrics?.latencyMs,
          replayLatencyMs: latencyMs,
          originalStepsCompleted: hook.benchmarkMetrics?.stepsCompleted,
          replayStepsCompleted,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to replay evaluation hook");
    }
  });

  // ── GET /:domain/atlas/status ───────────────────────────────────────────────
  router.get(`${prefix}/status`, authMiddleware(), async (req: Request, res: Response) => {
    try {
      const ctx = resolveTenantContext(req, res);
      if (!ctx) return;
      const tenantId = ctx.tenantId;
      const [signals, evidence, outcomes, hooks] = await Promise.all([
        getSignals(domain, 200, tenantId),
        getEvidence(domain, undefined, tenantId),
        getOutcomes(domain, 200, tenantId),
        getEvaluationHooks(domain, tenantId),
      ]);
      const domainWorkflows = Object.values(DOMAIN_WORKFLOWS).filter(w => w.domain === domain);

      sendSuccess(res, {
        domain,
        label: config.label,
        atlasExecutionPattern: {
          wired: true,
          engineVersion: "atlas-execution/1.0",
          workflowCount: domainWorkflows.length,
          defaultWorkflowKey: config.workflowKey,
        },
        stats: {
          totalSignals: signals.length,
          signalsBySeverity: {
            critical: signals.filter(s => s.severity === "critical").length,
            high: signals.filter(s => s.severity === "high").length,
            medium: signals.filter(s => s.severity === "medium").length,
            low: signals.filter(s => s.severity === "low").length,
            info: signals.filter(s => s.severity === "info").length,
          },
          signalsByStatus: {
            raw: signals.filter(s => s.status === "raw").length,
            processed: signals.filter(s => s.status === "processed").length,
            resolved: signals.filter(s => s.status === "resolved").length,
          },
          totalEvidence: evidence.length,
          totalOutcomes: outcomes.length,
          outcomesByStatus: {
            success: outcomes.filter(o => o.status === "success").length,
            partial: outcomes.filter(o => o.status === "partial").length,
            failed: outcomes.filter(o => o.status === "failed").length,
          },
          evaluationHooks: hooks.length,
          replayableHooks: hooks.filter(h => h.replayable).length,
        },
        supportedSignalTypes: config.signalTypes,
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get domain ATLAS status");
    }
  });
}

// ─── Register all domain routes ───────────────────────────────────────────────

for (const domain of SUPPORTED_DOMAINS) {
  buildDomainRoutes(domain);
}

// ─── Platform-level ATLAS status ─────────────────────────────────────────────

router.get("/atlas/execution/status", authMiddleware({ required: false }), (_req: Request, res: Response) => {
  sendSuccess(res, {
    platform: "SZL Holdings",
    atlasExecutionPattern: "wired",
    engineVersion: "atlas-execution/1.0",
    domains: SUPPORTED_DOMAINS.map(d => ({
      domain: d,
      label: DOMAIN_CONFIG[d].label,
      defaultWorkflow: DOMAIN_CONFIG[d].workflowKey,
      signalTypesCount: DOMAIN_CONFIG[d].signalTypes.length,
      statusUrl: `/${d}/atlas/status`,
    })),
    sharedEngines: [
      { name: "decision-engine", version: "1.0", purpose: "Signal ranking and recommendation generation" },
      { name: "policy-engine", version: "1.0", purpose: "Policy evaluation and approval gates" },
      { name: "action-engine", version: "1.0", purpose: "Workflow execution and audit trails" },
    ],
    evaluationCapabilities: ["replay", "benchmarking", "dry-run", "simulation"],
    checkedAt: new Date().toISOString(),
  });
});

export default router;

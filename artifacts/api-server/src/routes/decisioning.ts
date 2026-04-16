/**
 * Decisioning API
 *
 * Wires Decision Engine → Policy Engine → Action Engine into a single
 * governed, explainable, executable pipeline.
 *
 * Routes:
 *   POST /decisioning/evaluate          — evaluate signals into ranked recommendations
 *   POST /decisioning/check-policy      — evaluate a policy gate for a given action
 *   POST /decisioning/execute           — execute an approved recommendation as a workflow
 *   POST /decisioning/dry-run           — dry-run a workflow without side effects
 *   POST /decisioning/simulate          — simulate workflow outcomes
 *   GET  /decisioning/runs              — list workflow execution history
 *   GET  /decisioning/runs/:runId       — get a specific run with full audit trail
 *   GET  /decisioning/policies          — list registered policies
 *   POST /decisioning/policies          — register a policy
 *   GET  /decisioning/stats             — engine statistics
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { validateBody } from "../lib/validation";
import { logger } from "../lib/logger";

const router: IRouter = Router();

import {
  rankSignalGroups,
  computePriorityScore,
  type Signal,
  type BusinessImpact,
  type Recommendation,
  type SignalGroup,
  RankingWeightsSchema,
} from "@szl-holdings/decision-engine";

import {
  evaluatePolicies,
  registerPolicy,
  getRegisteredPolicies,
  checkAction,
  type Policy,
  type EvaluationRequest,
  PolicySchema,
} from "@szl-holdings/policy-engine";

import {
  executeWorkflow,
  recordRun,
  listRuns,
  getRunById,
  getHistoryStats,
  type WorkflowDefinition,
} from "@szl-holdings/action-engine";

const BUILT_IN_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "portfolio-rebalance",
    name: "Portfolio Rebalance Workflow",
    description: "Initiates a cross-domain portfolio rebalancing based on market signal analysis.",
    domain: "szl-holdings",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    estimatedCostUsd: 0,
    steps: [
      {
        id: "assess-macro",
        name: "Assess macro market conditions",
        handler: "portfolio.assess-macro",
        executionMode: "semi_auto",
        requiresApproval: false,
        retryCount: 0,
      },
      {
        id: "score-assets",
        name: "Score and rank impacted asset classes",
        handler: "portfolio.score-assets",
        executionMode: "semi_auto",
        requiresApproval: false,
        retryCount: 0,
      },
      {
        id: "generate-proposal",
        name: "Generate rebalancing proposal",
        handler: "portfolio.generate-proposal",
        executionMode: "semi_auto",
        requiresApproval: true,
        approverRole: "exec",
        retryCount: 0,
      },
      {
        id: "execute-rebalance",
        name: "Execute approved rebalancing",
        handler: "portfolio.execute-rebalance",
        executionMode: "semi_auto",
        requiresApproval: true,
        approverRole: "admin",
        rollbackHandler: "portfolio.rollback-rebalance",
        retryCount: 0,
      },
    ],
    metadata: { domain: "szl-holdings", category: "portfolio-management" },
  },
  {
    id: "security-legal-escalation",
    name: "Security Incident Legal Escalation",
    description: "Escalates a critical security incident to legal for hold review and regulatory disclosure.",
    domain: "aegis",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "none",
    steps: [
      {
        id: "classify-incident",
        name: "Classify and scope incident",
        handler: "aegis.classify-incident",
        executionMode: "manual",
        requiresApproval: false,
        retryCount: 0,
      },
      {
        id: "legal-hold",
        name: "Initiate legal hold",
        handler: "prism.initiate-legal-hold",
        executionMode: "manual",
        requiresApproval: true,
        approverRole: "compliance",
        retryCount: 0,
      },
      {
        id: "update-risk-score",
        name: "Update portfolio risk score",
        handler: "portfolio.update-risk-score",
        executionMode: "semi_auto",
        requiresApproval: false,
        retryCount: 0,
      },
    ],
    metadata: { domain: "aegis", category: "incident-response" },
  },
  {
    id: "maritime-terra-alert",
    name: "Maritime Delay Real Estate Alert",
    description: "Flags port-adjacent properties and reviews contracts when vessel delay exceeds threshold.",
    domain: "vessels",
    executionMode: "semi_auto",
    requiresExplicitApproval: false,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "none",
    steps: [
      {
        id: "identify-delay",
        name: "Identify delayed vessels",
        handler: "vessels.identify-delay",
        executionMode: "autonomous",
        requiresApproval: false,
        retryCount: 0,
      },
      {
        id: "flag-properties",
        name: "Flag affected properties",
        handler: "terra.flag-properties",
        executionMode: "semi_auto",
        requiresApproval: false,
        retryCount: 0,
      },
      {
        id: "review-contracts",
        name: "Review affected contracts",
        handler: "prism.review-contracts",
        executionMode: "manual",
        requiresApproval: false,
        retryCount: 0,
      },
    ],
    metadata: { domain: "vessels", category: "cross-domain-alert" },
  },
];

const workflowRegistry = new Map<string, WorkflowDefinition>(
  BUILT_IN_WORKFLOWS.map(w => [w.id, w])
);

const SignalInputSchema = z.object({
  id: z.string(),
  domain: z.string(),
  type: z.string(),
  value: z.unknown(),
  source: z.string(),
  sourceId: z.string().optional(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

const SignalGroupInputSchema = z.object({
  domain: z.string(),
  signals: z.array(SignalInputSchema),
  businessImpact: z.object({
    financialExposureUsd: z.number().optional(),
    affectedEntities: z.number().int().optional(),
    reputationalRisk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
    regulatoryExposure: z.boolean().optional(),
    crossDomainBlastRadius: z.array(z.string()).optional(),
  }),
  confidence: z.number().min(0).max(1),
  suggestedAction: z.string(),
  suggestedOwner: z.string().optional(),
  estimatedCostUsd: z.number().optional(),
  evidence: z.array(z.object({ label: z.string(), value: z.string(), source: z.string().optional() })).optional(),
  customTitle: z.string().optional(),
  customSummary: z.string().optional(),
  customReasoning: z.string().optional(),
});

const EvaluateSchema = z.object({
  groups: z.array(SignalGroupInputSchema).min(1),
  weights: RankingWeightsSchema.optional(),
});

const CheckPolicySchema = z.object({
  action: z.string(),
  domain: z.string().optional(),
  tenantId: z.string().optional(),
  actionClass: z.string().optional(),
  subject: z.object({
    id: z.string().optional(),
    roles: z.array(z.string()),
    tenantId: z.string().optional(),
  }),
  resource: z.object({
    type: z.string(),
    id: z.string().optional(),
    domain: z.string().optional(),
    attributes: z.record(z.unknown()).optional(),
  }),
  context: z.record(z.unknown()).optional(),
  estimatedCostUsd: z.number().optional(),
  confidence: z.number().optional(),
  urgency: z.string().optional(),
});

const ExecuteSchema = z.object({
  workflowId: z.string(),
  recommendationId: z.string().optional(),
  isDryRun: z.boolean().optional(),
  isSimulation: z.boolean().optional(),
  approvedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post(
  "/decisioning/evaluate",
  authMiddleware({ required: false }),
  validateBody(EvaluateSchema),
  (req: Request, res: Response) => {
    try {
      const { groups, weights } = req.body;
      const recommendations = rankSignalGroups(groups as SignalGroup[], weights);

      const withPolicies = recommendations.map((rec: Recommendation) => {
        const policyCheck = checkAction({
          action: rec.suggestedAction,
          domain: rec.domain,
          tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
          subject: {
            id: req.user?.id?.toString(),
            roles: req.user?.roles ?? ["analyst"],
          },
          resource: { type: "recommendation", id: rec.id, domain: rec.domain },
          estimatedCostUsd: rec.estimatedCostUsd,
          confidence: rec.confidence,
          urgency: rec.urgency,
          context: { regulatoryExposure: rec.businessImpact.regulatoryExposure },
        });

        return {
          ...rec,
          policyState: policyCheck.allowed
            ? (policyCheck.requiresApproval ? "requires_approval" : "allowed")
            : "blocked",
          policyEvaluation: {
            effect: policyCheck.effect,
            reasoning: policyCheck.reasoning,
            matchedPolicies: policyCheck.matchedPolicies,
            violations: policyCheck.violations,
          },
        };
      });

      return sendSuccess(res, {
        recommendations: withPolicies,
        totalSignalsEvaluated: groups.reduce((sum: number, g: SignalGroup) => sum + g.signals.length, 0),
        evaluatedAt: Date.now(),
        engineVersion: "1.0.0",
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to evaluate signals");
    }
  }
);

router.post(
  "/decisioning/check-policy",
  authMiddleware({ required: false }),
  validateBody(CheckPolicySchema),
  (req: Request, res: Response) => {
    try {
      const request = req.body as EvaluationRequest;
      const result = checkAction(request);
      return sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, "Failed to evaluate policy");
    }
  }
);

router.post(
  "/decisioning/execute",
  authMiddleware({ required: false }),
  validateBody(ExecuteSchema),
  async (req: Request, res: Response) => {
    try {
      const { workflowId, recommendationId, isDryRun, isSimulation, approvedBy, metadata } = req.body;

      const definition = workflowRegistry.get(workflowId);
      if (!definition) {
        return sendNotFound(res, "Workflow not found. Use GET /decisioning/workflows to list available workflows.");
      }

      const policyResult = checkAction({
        action: workflowId,
        domain: definition.domain,
        tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
        subject: {
          id: req.user?.id?.toString(),
          roles: req.user?.roles ?? ["analyst"],
        },
        resource: { type: "workflow", id: workflowId, domain: definition.domain },
        estimatedCostUsd: definition.estimatedCostUsd,
        context: metadata,
      });

      if (policyResult.effect === "block") {
        return sendBadRequest(res, `Policy blocked execution: ${policyResult.reasoning}`);
      }

      const result = await executeWorkflow({
        definition,
        initiatedBy: req.user?.displayName ?? approvedBy ?? "api",
        tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
        recommendationId,
        isDryRun: isDryRun ?? false,
        isSimulation: isSimulation ?? false,
        approvedBy: approvedBy ?? (policyResult.effect === "allow" && !definition.requiresExplicitApproval ? "policy-auto" : undefined),
        policyEvaluation: policyResult as unknown as Record<string, unknown>,
        metadata,
      });

      recordRun(result.run);

      logger.info({ runId: result.run.runId, workflowId, status: result.run.status }, "[Decisioning] Workflow executed");

      return sendCreated(res, {
        run: result.run,
        requiresApproval: result.requiresApproval,
        approvalRequest: result.approvalRequest,
        dryRunSummary: result.dryRunSummary,
        simulationSummary: result.simulationSummary,
        policyEvaluation: policyResult,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to execute workflow");
    }
  }
);

router.get(
  "/decisioning/workflows",
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    const workflows = Array.from(workflowRegistry.values()).map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      domain: w.domain,
      executionMode: w.executionMode,
      stepCount: w.steps.length,
      requiresExplicitApproval: w.requiresExplicitApproval,
      estimatedCostUsd: w.estimatedCostUsd,
    }));
    return sendSuccess(res, { workflows, total: workflows.length });
  }
);

router.get(
  "/decisioning/runs",
  authMiddleware({ required: false }),
  (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const workflowId = req.query.workflowId as string | undefined;
      const limit = Math.min(Number(req.query.limit ?? 50), 200);
      const offset = Number(req.query.offset ?? 0);

      const runs = listRuns({
        workflowId,
        status: status as any,
        limit,
        offset,
        tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
      });

      return sendSuccess(res, { runs, total: runs.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to list runs");
    }
  }
);

router.get(
  "/decisioning/runs/:runId",
  authMiddleware({ required: false }),
  (req: Request, res: Response) => {
    try {
      const run = getRunById(req.params.runId as string);
      if (!run) return sendNotFound(res, "Run not found");
      return sendSuccess(res, run);
    } catch (err) {
      handleRouteError(res, err, "Failed to get run");
    }
  }
);

router.get(
  "/decisioning/policies",
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    try {
      const policies = getRegisteredPolicies();
      return sendSuccess(res, { policies, total: policies.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to list policies");
    }
  }
);

router.post(
  "/decisioning/policies",
  authMiddleware(),
  requireRole("super_admin", "admin"),
  (req: Request, res: Response) => {
    try {
      const parsed = PolicySchema.safeParse(req.body);
      if (!parsed.success) return sendBadRequest(res, parsed.error.message);
      registerPolicy(parsed.data);
      return sendCreated(res, { id: parsed.data.id, registered: true });
    } catch (err) {
      handleRouteError(res, err, "Failed to register policy");
    }
  }
);

router.get(
  "/decisioning/stats",
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    try {
      const historyStats = getHistoryStats();
      const policies = getRegisteredPolicies();
      const workflows = Array.from(workflowRegistry.values());

      return sendSuccess(res, {
        decisionEngine: { version: "1.0.0", status: "active" },
        policyEngine: {
          version: "1.0.0",
          registeredPolicies: policies.length,
          activePolicies: policies.filter((p: Policy) => p.isActive).length,
        },
        actionEngine: {
          version: "1.0.0",
          registeredWorkflows: workflows.length,
          ...historyStats,
        },
        evaluatedAt: Date.now(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch stats");
    }
  }
);

export default router;

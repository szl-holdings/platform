import { bodyShape } from '@szl-holdings/contracts/common';
import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  getDecision,
  insertDecision,
  listDecisions,
  updateDecisionStatus,
} from '../../lib/alloy-decision-store';
import {
  handleRouteError,
  sendBadRequest,
  sendConflict,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { logger } from '../../lib/logger';
import { getOrchestratorCapabilities, orchestrate } from '../../lib/multi-agent-orchestrator';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { requireRole } from '../../middlewares/auth';
import {
  AGENT_MANIFEST_DATE,
  AGENT_MANIFEST_VERSION,
  buildAgentRegistryWithHealth,
  CONTROL_TOWER_AGENT_REGISTRY,
  evaluatePolicies,
  getOrCreatePerf,
  makeEvidenceRef,
  persistAgentPerformance,
  riskLevelToDepth,
  toRiskLevel,
} from './shared';
import { getDomainAutonomyLevel } from '../../middlewares/zero-trust';

const router = Router();

router.get('/control-tower/decide/agents', (_req: Request, res: Response) => {
  try {
    const registry = buildAgentRegistryWithHealth();
    const capabilities = getOrchestratorCapabilities();
    sendSuccess(res, {
      layer: 'decide',
      agents: registry,
      meshCapabilities: capabilities,
      totalAgents: registry.length,
      manifestVersion: AGENT_MANIFEST_VERSION,
      manifestDate: AGENT_MANIFEST_DATE,
      healthySummary: {
        healthy: registry.filter((a) => a.health.status === 'healthy').length,
        degraded: registry.filter((a) => a.health.status === 'degraded').length,
        unhealthy: registry.filter((a) => a.health.status === 'unhealthy').length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'control-tower/decide/agents');
  }
});

router.get(
  '/control-tower/decide/journal',
  requireRole('super_admin', 'ops', 'exec'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(100, parseInt(String(req.query.limit ?? '20'), 10));
      const statusFilter = req.query.status as string | undefined;
      const riskLevel = req.query.riskLevel as string | undefined;

      const { decisions, total } = await listDecisions({
        limit,
        offset: 0,
        status: statusFilter as 'proposed' | 'approved' | 'rejected' | 'executed' | undefined,
        riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical' | undefined,
        orgId: null,
        isAdmin: true,
      });

      const entries = decisions.map((d) => {
        const routePrefix = d.modelRoute?.split(':')?.[0] ?? 'alloy-orchestrator';
        const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find((a) => a.id === routePrefix);
        const domain =
          agentDef?.domain ??
          (d.workflowId?.split('-')?.[0] !== undefined
            ? d.workflowId?.split('-')[0]!
            : 'orchestration');

        return {
          id: d.decisionId,
          timestamp: d.createdAt,
          agentId: routePrefix,
          domain,
          query: d.rawInput?.slice(0, 200) ?? d.recommendedAction,
          decision: d.recommendedAction,
          confidence: d.confidence,
          reasoningChain: d.evidenceRefs.map((e) =>
            typeof e === 'string' ? e : JSON.stringify(e).slice(0, 150),
          ),
          outcome:
            d.status === 'approved'
              ? 'accepted'
              : d.status === 'rejected'
                ? 'rejected'
                : d.status === 'executed'
                  ? 'accepted'
                  : 'pending',
          riskLevel: d.riskLevel,
          approvalRequired: d.approvalRequired,
          durationMs: 0,
        };
      });

      sendSuccess(res, { layer: 'decide', entries, total, filteredCount: entries.length });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/decide/journal');
    }
  },
);

router.post(
  '/control-tower/decide/orchestrate',
  requireRole('super_admin', 'ops', 'exec'),
  validateBody(
    bodyShape({
      depth: z.unknown().optional(),
      domains: z.unknown().optional(),
      query: z.unknown().optional(),
      sessionId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { query, domains, depth, sessionId } = req.body as {
        query?: string;
        domains?: string[];
        depth?: 'shallow' | 'standard' | 'deep';
        sessionId?: string;
      };
      if (!query) {
        sendBadRequest(res, 'query is required');
        return;
      }

      const riskLevel = depth === 'deep' ? 'high' : depth === 'standard' ? 'medium' : 'low';
      const govCheck = evaluatePolicies('alloy-orchestrator', query, riskLevel);

      const decisionId = `ct-dec-${randomUUID()}`;

      if (govCheck.requiresApproval && !govCheck.allowed) {
        try {
          await insertDecision({
            decisionId,
            workflowId: sessionId ?? null,
            signalIds: [],
            recommendedAction: query,
            rationaleSummary: `[PENDING APPROVAL] ${govCheck.blockedReason}`,
            evidenceRefs: [
              makeEvidenceRef({
                source: 'pol-001: High-Risk Action Approval Gate',
                sourceType: 'policy',
                content: `Action '${query.slice(0, 200)}' blocked at depth '${depth ?? 'standard'}' — requires human approval before execution.`,
                relevanceScore: 1.0,
              }),
            ],
            confidence: 0,
            ownerSuggestion: 'Review required before execution',
            approvalRequired: true,
            riskLevel: toRiskLevel(riskLevel),
            fallbackPlan: "Reduce query depth to 'standard' or 'shallow' for auto-execution",
            modelRoute: 'alloy-orchestrator',
            schemaVersion: '2.0.0',
            status: 'proposed',
            rawInput: query,
            rawOutput: null,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          logger.warn({ err: dbErr }, 'control-tower: failed to persist proposed decision');
        }

        res.status(202).json({
          status: 'pending_approval',
          message:
            'High-risk orchestration has been queued for human approval. Approve at /decide/approve/:id.',
          decisionId,
          riskLevel,
          governanceCheck: {
            allowed: false,
            requiresApproval: true,
            blockedReason: govCheck.blockedReason,
            violatedPolicies: govCheck.violatedPolicies,
          },
        });
        return;
      }

      if (!govCheck.allowed) {
        sendError(res, 'Governance pre-flight failed: scope exceeded', 403, 'FORBIDDEN', {
          blockedReason: govCheck.blockedReason,
          violatedPolicies: govCheck.violatedPolicies,
        });
        return;
      }

      // Graduated autonomy gate — check each requested domain's autonomy level.
      // 'manual' and 'propose-only' domains require human approval before autonomous execution.
      const requestedDomains = Array.isArray(domains) && domains.length > 0
        ? domains
        : ['lyte', 'vessels', 'terra'];
      const blockedDomains = requestedDomains.filter((d: string) => {
        const level = getDomainAutonomyLevel(d);
        return level === 'manual' || level === 'propose-only';
      });

      if (blockedDomains.length > 0) {
        const autonomyDecisionId = `ct-aut-${randomUUID()}`;
        try {
          await insertDecision({
            decisionId: autonomyDecisionId,
            workflowId: sessionId ?? null,
            signalIds: [],
            recommendedAction: query,
            rationaleSummary: `[AUTONOMY GATE] Domains ${blockedDomains.join(', ')} require human approval before autonomous execution.`,
            evidenceRefs: [
              makeEvidenceRef({
                source: 'autonomy-gate: graduated-autonomy-check',
                sourceType: 'policy',
                content: `Domains ${blockedDomains.join(', ')} are in restricted autonomy mode. Action queued for approval.`,
                relevanceScore: 1.0,
              }),
            ],
            confidence: 0,
            ownerSuggestion: 'Promote domain autonomy level to full-auto to enable auto-execution',
            approvalRequired: true,
            riskLevel: toRiskLevel(riskLevel),
            fallbackPlan: `Use PUT /api/autonomy/level to set ${blockedDomains.join(', ')} to 'full-auto'`,
            modelRoute: 'alloy-orchestrator',
            schemaVersion: '2.0.0',
            status: 'proposed',
            rawInput: query,
            rawOutput: null,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          logger.warn({ err: dbErr }, 'control-tower: failed to persist autonomy-blocked decision');
        }

        res.status(202).json({
          status: 'pending_approval',
          message: `Autonomy gate blocked execution: domains [${blockedDomains.join(', ')}] require approval.`,
          decisionId: autonomyDecisionId,
          autonomyGate: {
            blockedDomains,
            autonomyLevels: Object.fromEntries(
              blockedDomains.map((d: string) => [d, getDomainAutonomyLevel(d)]),
            ),
          },
        });
        return;
      }

      const startTime = Date.now();
      const result = await orchestrate({ query, domains, depth, sessionId });
      const durationMs = Date.now() - startTime;

      try {
        await insertDecision({
          decisionId,
          workflowId: sessionId ?? null,
          signalIds: [],
          recommendedAction: result.synthesis.slice(0, 1000),
          rationaleSummary: result.steps
            .filter((s) => s.status === 'completed')
            .map((s) => `[${s.domain}] ${s.result?.slice(0, 200) ?? ''}`)
            .join('\n'),
          evidenceRefs: result.steps.map((s) =>
            makeEvidenceRef({
              source: `orchestration-step:${s.domain}`,
              sourceType: 'workflow',
              content: `Task: ${s.task.slice(0, 150)} | Result: ${s.result?.slice(0, 150) ?? ''}`,
              relevanceScore: result.confidence,
            }),
          ),
          confidence: result.confidence,
          ownerSuggestion: null,
          approvalRequired: false,
          riskLevel: toRiskLevel(riskLevel),
          fallbackPlan: null,
          modelRoute: 'alloy-orchestrator',
          schemaVersion: '2.0.0',
          status: 'executed',
          rawInput: query,
          rawOutput: result.synthesis.slice(0, 2000),
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, 'control-tower: failed to persist decision to DB');
      }

      const alloyPerf = getOrCreatePerf('alloy-orchestrator', 'orchestration');
      alloyPerf.totalDecisions++;
      alloyPerf.avgConfidence =
        (alloyPerf.avgConfidence * (alloyPerf.totalDecisions - 1) + result.confidence) /
        alloyPerf.totalDecisions;
      alloyPerf.avgLatencyMs =
        (alloyPerf.avgLatencyMs * (alloyPerf.totalDecisions - 1) + durationMs) /
        alloyPerf.totalDecisions;
      alloyPerf.totalTokenCost += result.totalCostUsd;
      alloyPerf.lastUpdated = new Date().toISOString();
      void persistAgentPerformance(alloyPerf);

      sendSuccess(res, {
        layer: 'decide',
        result,
        decisionId,
        governanceCheck: { allowed: true, requiresApproval: false, riskLevel },
      });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/decide/orchestrate');
    }
  },
);

router.post(
  '/control-tower/decide/approve/:id',
  requireRole('super_admin', 'ops', 'exec'),
  validateBody(
    bodyShape({
      approvedBy: z.unknown().optional(),
      domains: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { approvedBy, domains } = req.body as { approvedBy?: string; domains?: string[] };

      const decision = await getDecision(id, null, true);
      if (!decision) {
        sendNotFound(res, `Decision ${id}`);
        return;
      }
      if (decision.status !== 'proposed') {
        sendConflict(res, `Decision is already ${decision.status}; cannot re-approve`);
        return;
      }
      if (!decision.approvalRequired) {
        sendBadRequest(res, 'This decision did not require approval');
        return;
      }

      await updateDecisionStatus(
        id,
        {
          status: 'approved',
          approvedBy: approvedBy ?? 'control-tower-operator',
          approvedAt: new Date().toISOString(),
        },
        null,
        true,
      );

      const query = decision.rawInput ?? decision.recommendedAction;
      const depth = riskLevelToDepth(decision.riskLevel);

      const startTime = Date.now();
      const result = await orchestrate({ query, domains, depth });
      const durationMs = Date.now() - startTime;

      await updateDecisionStatus(
        id,
        {
          status: 'executed',
          executionOutcome: result.status === 'completed' ? 'executed' : 'failed',
          executedAt: new Date().toISOString(),
        },
        null,
        true,
      );

      const alloyPerf = getOrCreatePerf('alloy-orchestrator', 'orchestration');
      alloyPerf.totalDecisions++;
      alloyPerf.acceptedDecisions++;
      alloyPerf.avgConfidence =
        (alloyPerf.avgConfidence * (alloyPerf.totalDecisions - 1) + result.confidence) /
        alloyPerf.totalDecisions;
      alloyPerf.avgLatencyMs =
        (alloyPerf.avgLatencyMs * (alloyPerf.totalDecisions - 1) + durationMs) /
        alloyPerf.totalDecisions;
      alloyPerf.lastUpdated = new Date().toISOString();
      void persistAgentPerformance(alloyPerf);

      sendSuccess(res, {
        layer: 'decide',
        result,
        decisionId: id,
        approvedBy: approvedBy ?? 'control-tower-operator',
        executedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/decide/approve/:id');
    }
  },
);

router.patch(
  '/control-tower/decide/journal/:id',
  requireRole('super_admin', 'ops', 'exec'),
  validateBody(
    bodyShape({
      outcome: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { outcome } = req.body as { outcome?: 'accepted' | 'rejected' | 'overridden' };
      if (!outcome) {
        sendBadRequest(res, 'outcome is required');
        return;
      }
      const dbStatus =
        outcome === 'accepted' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'proposed';
      await updateDecisionStatus(id, { status: dbStatus }, null, true);
      sendSuccess(res, { id, outcome, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/decide/journal/:id');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}

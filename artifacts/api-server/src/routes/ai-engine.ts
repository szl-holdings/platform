import {
  type ActionDecision,
  type AITrace,
  ALLOY_TOOL_DEFINITIONS,
  type AlloyDecision,
  APPROVAL_MATRIX,
  alloyRetrieval,
  autoEnqueueTrace,
  captureTrace,
  chatCompletionWithFallback,
  checkToolPolicy,
  createAlloyDecision,
  type DomainEvalContext,
  type ExtractedEntities,
  enqueueForReview,
  executeToolCall,
  GOLDEN_SET,
  getApprovalPolicy,
  getModelSlots,
  getRouteConfig,
  governedStructuredCall,
  type HFChatMessage,
  PolicyBlockError,
  proofChain,
  type RiskLevel,
  RefusalError,
  type RouteClass,
  routeModel,
  runEvals,
  runEvaluatorHooksForTrace,
  safeFallbackDecision,
  type TriageDecision,
  updateTraceStatus,
} from '@szl-holdings/ai-engine';
import {
  actionDecisionSchema,
  evalResponseSchema,
  extractedEntitiesSchema,
  planningResultSchema,
  triageDecisionSchema,
} from '@szl-holdings/schemas/ai';
import { bodyShape } from '@szl-holdings/contracts/common';
import { recordRecommendation } from '@szl-holdings/outcome-graph';
import { Router } from 'express';
import { z } from 'zod';
import {
  appendAuditEntry,
  getDecision,
  insertDecision,
  listAuditEntries,
  listDecisions,
  updateDecisionStatus,
} from '../lib/alloy-decision-store';
import { sendBadRequest, sendError, sendNotFound } from '../lib/api-response';
import { getGatewayStatus } from '../lib/ai-gateway';
import { getCircuitBreakerMetrics } from '../lib/ai-model-observability';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

function getOrgId(user?: AuthenticatedUser): number | null {
  return user?.orgs?.[0]?.orgId ?? null;
}

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes('super_admin') || user.roles.includes('admin');
}

const router = Router();
const auditLog: Array<Record<string, unknown>> = [];
const MAX_AUDIT_LOG = 500;

function writeAudit(entry: Record<string, unknown>): void {
  auditLog.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > MAX_AUDIT_LOG) auditLog.length = MAX_AUDIT_LOG;
  appendAuditEntry({
    decisionId: entry.decisionId as string | undefined,
    orgId: entry.orgId as number | null | undefined,
    endpoint: String(entry.endpoint ?? ''),
    model: entry.model as string | undefined,
    routeClass: entry.routeClass as string | undefined,
    confidence: entry.confidence as number | undefined,
    latencyMs: entry.latencyMs as number | undefined,
    approverUserId: entry.approverUserId as number | undefined,
    approverRoles: entry.approverRoles as string[] | undefined,
    metadata: entry,
  }).catch(() => {});
}

function logGuardrailIfTriggered(
  trace: AITrace,
  source: 'auto_capture' | 'eval_failed' | 'override',
): void {
  if (!trace.requiresReview && source === 'auto_capture') return;
  logger.info(
    {
      event: 'guardrail.triggered',
      traceId: trace.traceId,
      orgId: trace.orgId ?? null,
      domain: trace.domain,
      model: trace.model,
      modelProvider: trace.modelProvider,
      recommendationType: trace.recommendationType,
      confidence: trace.confidence,
      riskLevel: trace.riskLevel ?? null,
      costEstimateUsd: trace.costEstimateUsd,
      latencyMs: trace.latencyMs,
      rule: source,
      reason: trace.reviewReason ?? source,
      action: 'enqueue_for_review',
    },
    'AI guardrail triggered',
  );
}

async function runAndPersistEval(trace: AITrace, ctx: DomainEvalContext): Promise<void> {
  try {
    const results = await runEvaluatorHooksForTrace(trace, ctx);
    if (results.length === 0) return;
    const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      updateTraceStatus(trace.traceId, 'evaluated', avgScore, true);
    } else {
      updateTraceStatus(trace.traceId, 'flagged', avgScore, false);
      if (!trace.requiresReview) {
        enqueueForReview({ trace, overrideReason: 'eval_failed' });
        logGuardrailIfTriggered(
          { ...trace, reviewReason: `eval_failed (score ${avgScore.toFixed(2)})` },
          'eval_failed',
        );
      }
    }
  } catch {}
}

router.get('/ai/health', (_req, res) => {
  const config = getRouteConfig();
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const circuitBreakers = getCircuitBreakerMetrics();
  res.json({
    status: token ? 'configured' : 'no_token',
    provider: config.config.executionMode,
    models: config.models,
    routes: Object.keys(config.routes),
    retrieval: alloyRetrieval.getStats(),
    config: {
      structuredOutputs: config.config.useStructuredOutputs,
      functionCalling: config.config.useFunctionCalling,
      streaming: config.config.enableStreaming,
      executionMode: config.config.executionMode,
      approvalForHighRisk: config.config.requireApprovalForHighRisk,
    },
    auditLogSize: auditLog.length,
    circuitBreakers: {
      summary: {
        openCount: circuitBreakers.openCount,
        halfOpenCount: circuitBreakers.halfOpenCount,
        closedCount: circuitBreakers.closedCount,
      },
      providers: circuitBreakers.circuits.map((c) => ({
        provider: c.provider,
        state: c.state,
        consecutiveFailures: c.consecutiveFailures,
        openedAt: c.openedAt != null ? new Date(c.openedAt).toISOString() : null,
        lastTestedAt: c.lastTestedAt != null ? new Date(c.lastTestedAt).toISOString() : null,
        totalTripped: c.totalTripped,
      })),
    },
  });
});

router.get('/ai/gateway/status', (_req, res) => {
  try {
    const status = getGatewayStatus();
    const circuitBreakers = getCircuitBreakerMetrics();
    res.json({
      ...status,
      circuitBreakers: {
        summary: {
          openCount: circuitBreakers.openCount,
          halfOpenCount: circuitBreakers.halfOpenCount,
          closedCount: circuitBreakers.closedCount,
        },
        providers: circuitBreakers.circuits.map((c) => ({
          provider: c.provider,
          state: c.state,
          consecutiveFailures: c.consecutiveFailures,
          openedAt: c.openedAt != null ? new Date(c.openedAt).toISOString() : null,
          lastTestedAt: c.lastTestedAt != null ? new Date(c.lastTestedAt).toISOString() : null,
          totalTripped: c.totalTripped,
        })),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, '[ai-engine] /ai/gateway/status failed');
    sendError(res, 'Failed to retrieve gateway status', 500, 'GATEWAY_STATUS_FAILED');
  }
});

router.get('/ai/models', (_req, res) => {
  const slots = getModelSlots();
  const config = getRouteConfig();
  res.json({
    slots,
    routes: config.routes,
    provider: process.env.HF_PROVIDER || 'huggingface',
    tokenConfigured: !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
  });
});

router.post(
  '/ai/respond',
  validateBody(
    bodyShape({
      maxTokens: z.unknown().optional(),
      messages: z.unknown().optional(),
      model: z.unknown().optional(),
      routeClass: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    const _start = Date.now();
    try {
      const { messages, model, maxTokens, routeClass } = req.body as {
        messages?: Array<{ role: string; content: string }>;
        model?: string;
        maxTokens?: number;
        routeClass?: RouteClass;
      };

      if (!messages?.length) {
        res.status(400).json({ error: 'messages array required' });
        return;
      }

      const route = routeModel(routeClass || 'reasoning', { model, maxTokens });
      const chatMessages: HFChatMessage[] = [
        {
          role: 'system',
          content:
            "You are Alloy, the AI execution fabric for Lyte — SZL Holdings' business observability platform. Produce structured, actionable intelligence. When the context demands a decision, provide a recommended action with confidence, evidence, and approval requirements. Never return a naked paragraph where a decision object is needed.",
        },
        ...messages.map((m) => ({ role: m.role as HFChatMessage['role'], content: m.content })),
      ];

      const completion = await chatCompletionWithFallback(chatMessages, route);

      res.locals.aiUsage = {
        model: completion.model,
        provider: completion.provider ?? 'unknown',
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        routeClass: 'respond',
      };

      writeAudit({
        endpoint: 'respond',
        model: completion.model,
        provider: completion.provider,
        latencyMs: completion.latencyMs,
        tokenUsage: completion.usage,
        inputLength: messages.map((m) => m.content).join('').length,
      });

      const respondTrace = captureTrace({
        domain: 'alloy',
        recommendationType: 'generic',
        model: completion.model,
        modelProvider: completion.provider ?? 'unknown',
        orgId: getOrgId(req.user),
        promptText: messages
          .map((m) => m.content)
          .join(' ')
          .slice(0, 500),
        latencyMs: completion.latencyMs,
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        outputSummary: `Chat response (${completion.finishReason ?? 'stop'})`,
      });
      const respondCtx: DomainEvalContext = { domain: 'alloy' };
      autoEnqueueTrace(respondTrace);
      logGuardrailIfTriggered(respondTrace, 'auto_capture');
      runAndPersistEval(respondTrace, respondCtx);

      let outcomeGraphId: number | null = null;
      try {
        const outcomeRow = await recordRecommendation({
          orgId: getOrgId(req.user),
          domain: 'general',
          entityType: 'chat_response',
          recommendationText: completion.content.slice(0, 1000),
          agentId: 'alloy',
          modelId: completion.model,
          modelProvider: completion.provider ?? 'unknown',
          correlationId: respondTrace.traceId,
          metadata: { endpoint: 'respond', routeClass: routeClass ?? 'reasoning' },
        });
        outcomeGraphId = outcomeRow.id;
      } catch (ogErr) {
        logger.warn({ err: ogErr }, 'outcome-graph recordRecommendation failed for /ai/respond');
      }

      res.json({
        content: completion.content,
        model: completion.model,
        provider: completion.provider,
        usage: completion.usage,
        latencyMs: completion.latencyMs,
        finishReason: completion.finishReason,
        outcomeGraphId,
      });
    } catch (err) {
      logger.error({ err }, 'AI respond error');
      res.status(500).json({
        error: 'AI inference failed',
        fallback: safeFallbackDecision(err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  },
);

router.post(
  '/ai/triage',
  validateBody(
    bodyShape({
      context: z.unknown().optional(),
      input: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { input, context } = req.body as { input?: string; context?: string };
      if (!input) {
        res.status(400).json({ error: 'input required' });
        return;
      }

      const route = routeModel('triage');
      const messages: HFChatMessage[] = [
        {
          role: 'system',
          content: `You are Alloy's triage engine. Analyze the input and produce a structured triage decision as JSON with these fields:
- priority: "P0" | "P1" | "P2" | "P3" | "P4"
- urgency: "immediate" | "urgent" | "standard" | "deferred"
- category: string (e.g. "security", "infrastructure", "compliance", "maritime", "financial")
- subcategory: string or null
- routeTo: string (team or role to handle this)
- routeReason: string
- summary: string (1-2 sentence summary)
- keyEntities: array of {type, value, confidence}
- suggestedActions: array of {action, reason, confidence}
- requiresHumanReview: boolean
- confidence: number 0-1`,
        },
        { role: 'user', content: context ? `Context: ${context}\n\nInput: ${input}` : input },
      ];

      const governed = await governedStructuredCall(messages, route, triageDecisionSchema, {
        domain: 'alloy',
        schemaName: 'TriageDecision',
        riskTier: 'medium',
        softBlock: false,
      });
      const { result, completion } = { result: governed.result, completion: governed.completion };

      res.locals.aiUsage = {
        model: completion.model,
        provider: completion.provider ?? 'unknown',
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        routeClass: 'triage',
      };

      writeAudit({
        endpoint: 'triage',
        model: completion.model,
        provider: completion.provider,
        latencyMs: completion.latencyMs,
        priority: result.priority,
        routeTo: result.routeTo,
        confidence: result.confidence,
        governedRunId: governed.runId,
        schemaAdherent: true,
      });

      const trace = captureTrace({
        domain: 'alloy',
        recommendationType: 'threat_triage',
        model: completion.model,
        modelProvider: completion.provider ?? 'unknown',
        orgId: getOrgId(req.user),
        promptText: (context ? `${context}\n${input}` : input).slice(0, 500),
        latencyMs: completion.latencyMs,
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        confidence: result.confidence,
        outputSummary: `Triage: ${result.priority} → ${result.routeTo}`,
      });
      const triageCtx: DomainEvalContext = { domain: 'alloy' };
      autoEnqueueTrace(trace);
      logGuardrailIfTriggered(trace, 'auto_capture');
      runAndPersistEval(trace, triageCtx);

      let outcomeGraphId: number | null = null;
      try {
        const outcomeRow = await recordRecommendation({
          orgId: getOrgId(req.user),
          domain: 'general',
          entityType: 'triage_decision',
          recommendationText: result.summary ?? `Triage: ${result.priority} → ${result.routeTo}`,
          recommendationAction: result.routeTo,
          agentId: 'alloy',
          modelId: completion.model,
          modelProvider: completion.provider ?? 'unknown',
          confidence: result.confidence,
          correlationId: trace.traceId,
          metadata: {
            endpoint: 'triage',
            priority: result.priority,
            urgency: result.urgency,
            category: result.category,
          },
        });
        outcomeGraphId = outcomeRow.id;
      } catch (ogErr) {
        logger.warn({ err: ogErr }, 'outcome-graph recordRecommendation failed for /ai/triage');
      }

      res.json({ decision: result, model: completion.model, latencyMs: completion.latencyMs, outcomeGraphId });
    } catch (err) {
      if (err instanceof RefusalError) {
        logger.warn({ runId: err.runId, incidentId: err.incidentId, domain: err.domain }, 'Model refusal in /ai/triage');
        res.status(503).json({
          error: 'Model refusal',
          refusalIncidentId: err.incidentId,
          governanceEvent: 'REFUSAL_INCIDENT',
          message: err.message,
          fallback: { priority: 'P2', urgency: 'standard', category: 'unknown', routeTo: 'operations', summary: 'Refusal incident created — manual triage required', requiresHumanReview: true, confidence: 0 },
        });
        return;
      }
      if (err instanceof PolicyBlockError) {
        logger.warn({ runId: err.runId, rules: err.failedRules }, 'Policy block in /ai/triage');
        res.status(422).json({ error: 'Covenant policy block', failedRules: err.failedRules, message: err.message });
        return;
      }
      logger.error({ err }, 'AI triage error');
      res.status(500).json({
        error: 'Triage failed',
        fallback: {
          priority: 'P2',
          urgency: 'standard',
          category: 'unknown',
          routeTo: 'operations',
          summary: 'Automated triage unavailable — manual review required',
          requiresHumanReview: true,
          confidence: 0,
        },
      });
    }
  },
);

router.post(
  '/ai/extract',
  validateBody(
    bodyShape({
      entityTypes: z.unknown().optional(),
      input: z.unknown().optional(),
      slice: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { input, entityTypes } = req.body as { input?: string; entityTypes?: string[] };
      if (!input) {
        res.status(400).json({ error: 'input required' });
        return;
      }

      const route = routeModel('extraction');
      const messages: HFChatMessage[] = [
        {
          role: 'system',
          content: `You are Alloy's entity extraction engine. Extract structured entities from the input. Return JSON with:
- entities: array of {type, value, confidence, context, normalizedValue}
  Types: ${entityTypes?.join(', ') || 'person, organization, location, asset, vulnerability, indicator, date, amount, reference'}
- relationships: array of {from, to, relationType, confidence}
- summary: brief summary of extracted information
- confidence: overall confidence 0-1`,
        },
        { role: 'user', content: input },
      ];

      const governed = await governedStructuredCall(messages, route, extractedEntitiesSchema, {
        domain: 'alloy',
        schemaName: 'ExtractedEntities',
        riskTier: 'low',
        softBlock: true,
      });
      const { result, completion } = { result: governed.result, completion: governed.completion };

      res.locals.aiUsage = {
        model: completion.model,
        provider: completion.provider ?? 'unknown',
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        routeClass: 'extract',
      };

      writeAudit({
        endpoint: 'extract',
        model: completion.model,
        latencyMs: completion.latencyMs,
        entityCount: result.entities.length,
        governedRunId: governed.runId,
        schemaAdherent: true,
      });

      const extractTrace = captureTrace({
        domain: 'alloy',
        recommendationType: 'anomaly_detection',
        model: completion.model,
        modelProvider: completion.provider ?? 'unknown',
        orgId: getOrgId(req.user),
        promptText: input.slice(0, 500),
        latencyMs: completion.latencyMs,
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        confidence: result.confidence ?? 1.0,
        outputSummary: `Extracted ${result.entities.length} entities`,
      });
      const extractCtx: DomainEvalContext = { domain: 'alloy' };
      autoEnqueueTrace(extractTrace);
      logGuardrailIfTriggered(extractTrace, 'auto_capture');
      runAndPersistEval(extractTrace, extractCtx);

      res.json({ result, model: completion.model, latencyMs: completion.latencyMs });
    } catch (err) {
      if (err instanceof RefusalError) {
        logger.warn({ runId: err.runId, incidentId: err.incidentId }, 'Model refusal in /ai/extract');
        res.status(503).json({ error: 'Model refusal', refusalIncidentId: err.incidentId, governanceEvent: 'REFUSAL_INCIDENT', message: err.message, fallback: { entities: [], relationships: [], summary: 'Refusal incident created', confidence: 0 } });
        return;
      }
      if (err instanceof PolicyBlockError) {
        res.status(422).json({ error: 'Covenant policy block', failedRules: err.failedRules, message: err.message });
        return;
      }
      logger.error({ err }, 'AI extract error');
      res.status(500).json({
        error: 'Extraction failed',
        fallback: {
          entities: [],
          relationships: [],
          summary: 'Extraction unavailable',
          confidence: 0,
        },
      });
    }
  },
);

router.post(
  '/ai/plan',
  validateBody(
    bodyShape({
      constraints: z.unknown().optional(),
      context: z.unknown().optional(),
      objective: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { objective, context, constraints } = req.body as {
        objective?: string;
        context?: string;
        constraints?: string[];
      };
      if (!objective) {
        res.status(400).json({ error: 'objective required' });
        return;
      }

      const route = routeModel('planning');
      const messages: HFChatMessage[] = [
        {
          role: 'system',
          content: `You are Alloy's planning engine. Create a multi-step execution plan. Return JSON with:
- action: primary recommended action
- actionType: "approve" | "escalate" | "defer" | "route" | "close" | "investigate"
- confidence: 0-1
- evidence: array of {source, sourceType, content, relevanceScore}
- impactedOwner: who is affected (string or null)
- approvalRequired: boolean
- approvalLevel: "none" | "operator" | "manager" | "executive"
- deadline: ISO date string or null
- sla: string or null
- reasoning: detailed reasoning
- alternatives: array of {action, confidence, tradeoff}

Consider constraints: ${constraints?.join('; ') || 'none specified'}`,
        },
        {
          role: 'user',
          content: context ? `Context: ${context}\n\nObjective: ${objective}` : objective,
        },
      ];

      const governed = await governedStructuredCall(messages, route, planningResultSchema, {
        domain: 'alloy',
        schemaName: 'PlanningResult',
        riskTier: 'high',
        softBlock: false,
      });
      const { result, completion } = { result: governed.result, completion: governed.completion };

      res.locals.aiUsage = {
        model: completion.model,
        provider: completion.provider ?? 'unknown',
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        routeClass: 'plan',
      };

      writeAudit({
        endpoint: 'plan',
        model: completion.model,
        latencyMs: completion.latencyMs,
        actionType: result.actionType,
        approvalRequired: result.approvalRequired,
        confidence: result.confidence,
        governedRunId: governed.runId,
        schemaAdherent: true,
      });

      const planTrace = captureTrace({
        domain: 'alloy',
        recommendationType: 'escalation_proposal',
        model: completion.model,
        modelProvider: 'unknown',
        orgId: getOrgId(req.user),
        promptText: (context ? `${context}\n${objective}` : objective).slice(0, 500),
        latencyMs: completion.latencyMs,
        promptTokens: completion.usage?.promptTokens,
        completionTokens: completion.usage?.completionTokens,
        confidence: result.confidence,
        riskLevel: result.approvalRequired ? 'high' : 'low',
        outputSummary: `Plan: ${result.action} (${result.actionType})`,
      });
      const planCtx: DomainEvalContext = { domain: 'alloy' };
      autoEnqueueTrace(planTrace);
      logGuardrailIfTriggered(planTrace, 'auto_capture');
      runAndPersistEval(planTrace, planCtx);

      let outcomeGraphId: number | null = null;
      try {
        const outcomeRow = await recordRecommendation({
          orgId: getOrgId(req.user),
          domain: 'general',
          entityType: 'action_plan',
          recommendationText: (result.reasoning ?? result.action).slice(0, 1000),
          recommendationAction: result.actionType,
          agentId: 'alloy',
          modelId: completion.model,
          modelProvider: completion.provider ?? 'unknown',
          confidence: result.confidence,
          correlationId: planTrace.traceId,
          metadata: {
            endpoint: 'plan',
            actionType: result.actionType,
            approvalRequired: result.approvalRequired,
            approvalLevel: result.approvalLevel,
          },
        });
        outcomeGraphId = outcomeRow.id;
      } catch (ogErr) {
        logger.warn({ err: ogErr }, 'outcome-graph recordRecommendation failed for /ai/plan');
      }

      res.json({ plan: result, model: completion.model, latencyMs: completion.latencyMs, outcomeGraphId });
    } catch (err) {
      if (err instanceof RefusalError) {
        logger.warn({ runId: err.runId, incidentId: err.incidentId }, 'Model refusal in /ai/plan');
        res.status(503).json({ error: 'Model refusal', refusalIncidentId: err.incidentId, governanceEvent: 'REFUSAL_INCIDENT', message: err.message, fallback: safeFallbackDecision('model-refusal') });
        return;
      }
      if (err instanceof PolicyBlockError) {
        res.status(422).json({ error: 'Covenant policy block', failedRules: err.failedRules, message: err.message });
        return;
      }
      logger.error({ err }, 'AI plan error');
      res.status(500).json({
        error: 'Planning failed',
        fallback: safeFallbackDecision(err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  },
);

router.post(
  '/ai/retrieve',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      method: z.unknown().optional(),
      query: z.unknown().optional(),
      topK: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { query, topK, method } = req.body as {
        query?: string;
        topK?: number;
        method?: 'semantic' | 'keyword' | 'hybrid';
      };
      if (!query) {
        res.status(400).json({ error: 'query required' });
        return;
      }

      const k = Math.min(topK || 12, 50);
      const isAdmin = req.user && isGlobalAdmin(req.user);
      const maxSensitivity = isAdmin ? 'restricted' : 'internal';
      const callerTenantId =
        req.user?.orgs?.[0]?.orgId != null ? String(req.user.orgs[0].orgId) : '';
      if (!callerTenantId) {
        res.status(403).json({ error: 'Tenant context required for AI retrieval' });
        return;
      }
      let result;
      if (method === 'keyword') {
        const chunks = alloyRetrieval.retrieveKeyword(query, k, callerTenantId);
        result = {
          chunks,
          query,
          method: 'keyword' as const,
          totalIndexed: alloyRetrieval.tenantIndexedCount(callerTenantId),
          latencyMs: 0,
        };
      } else {
        result = await alloyRetrieval.retrieveFromDb(query, null, {
          topK: k,
          maxSensitivityLevel: maxSensitivity as any,
          tenantId: callerTenantId,
        });
      }
      const evidence = alloyRetrieval.toEvidenceItems(result.chunks);

      res.json({
        chunks: result.chunks.map((c) => ({
          id: c.id,
          content: c.content.slice(0, 500),
          source: c.source,
          sourceType: c.sourceType,
          score: c.score,
          matchType: c.matchType,
        })),
        evidence,
        query: result.query,
        method: result.method,
        totalIndexed: result.totalIndexed,
        latencyMs: result.latencyMs,
      });
    } catch (err) {
      logger.error({ err }, 'AI retrieve error');
      res.status(500).json({ error: 'Retrieval failed', chunks: [], evidence: [] });
    }
  },
);

router.post(
  '/ai/tools/preview',
  validateBody(
    bodyShape({
      arguments: z.unknown().optional(),
      toolName: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { toolName, arguments: args } = req.body as {
        toolName?: string;
        arguments?: Record<string, unknown>;
      };
      if (!toolName) {
        res.status(400).json({ error: 'toolName required' });
        return;
      }

      const policy = checkToolPolicy(toolName, args || {});
      const toolDef = ALLOY_TOOL_DEFINITIONS.find((t) => t.function.name === toolName);

      res.json({
        toolName,
        exists: !!toolDef,
        definition: toolDef?.function || null,
        policy: {
          allowed: policy.allowed,
          requiresApproval: policy.requiresApproval,
          reason: policy.reason,
        },
        dryRun: true,
        proposedAction: { tool: toolName, args: args || {} },
      });
    } catch (err) {
      logger.error({ err }, 'AI tools preview error');
      res.status(500).json({ error: 'Tool preview failed' });
    }
  },
);

router.post(
  '/ai/tools/execute',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      arguments: z.unknown().optional(),
      calledBy: z.unknown().optional(),
      toolName: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        toolName,
        arguments: args,
        calledBy,
      } = req.body as {
        toolName?: string;
        arguments?: Record<string, unknown>;
        calledBy?: string;
      };
      if (!toolName) {
        res.status(400).json({ error: 'toolName required' });
        return;
      }

      const user = req.user;
      const callerIdentity = user
        ? `${user.displayName ?? user.email ?? `user:${user.id}`}`
        : calledBy || 'api';
      const result = await executeToolCall(toolName, args || {}, callerIdentity, {
        tenantId: 'default',
      });

      writeAudit({
        endpoint: 'tools/execute',
        toolName,
        success: result.success,
        auditEntry: result.auditEntry,
      });

      res.json(result);
    } catch (err) {
      logger.error({ err }, 'AI tools execute error');
      res.status(500).json({ error: 'Tool execution failed' });
    }
  },
);

router.get(
  '/ai/audit',
  authMiddleware({ required: true }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit) || '50', 10), 200);
      const offset = parseInt(String(req.query.offset) || '0', 10);
      const orgId = getOrgId(req.user);
      const admin = isGlobalAdmin(req.user);
      const result = await listAuditEntries({ limit, offset, orgId, isAdmin: admin });
      res.json({ total: result.total, offset, limit, entries: result.entries });
    } catch (err) {
      logger.error({ err }, 'Audit list error');
      sendError(res, 'Failed to list audit entries', 500, 'INTERNAL_ERROR');
    }
  },
);

router.get('/ai/tools', (_req, res) => {
  res.json({
    tools: ALLOY_TOOL_DEFINITIONS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
      policy: checkToolPolicy(t.function.name, {}),
    })),
    executionMode: process.env.AI_EXECUTION_MODE || 'propose_only',
    approvalRequired: (process.env.AI_REQUIRE_APPROVAL_FOR_HIGH_RISK ?? 'true') === 'true',
  });
});

router.post(
  '/ai/evals/run',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      categories: z.unknown().optional(),
      testIds: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { categories, testIds } = req.body as { categories?: string[]; testIds?: string[] };

      const report = await runEvals(
        async (input, category) => {
          const routeClass =
            category === 'risk_extraction' ? 'reasoning' :
            category === 'owner_assignment' ? 'triage' :
            'reasoning';
          const route = routeModel(routeClass as RouteClass);
          const messages: HFChatMessage[] = [
            {
              role: 'system',
              content: "You are Alloy's AI engine. Respond with valid JSON matching the evalResponse schema.",
            },
            { role: 'user', content: input || 'Generate a safe fallback response.' },
          ];
          try {
            const governed = await governedStructuredCall(messages, route, evalResponseSchema, {
              domain: 'eval',
              schemaName: 'evalResponse',
              agentId: 'eval-runner',
              riskTier: 'low',
              softBlock: true,
            });
            return {
              output: governed.result as unknown as Record<string, unknown>,
              model: governed.completion.model,
              latencyMs: governed.completion.latencyMs,
            };
          } catch {
            return {
              output: safeFallbackDecision('eval-error') as unknown as Record<string, unknown>,
              model: 'fallback',
              latencyMs: 0,
            };
          }
        },
        { categories, testIds },
      );

      res.json(report);
    } catch (err) {
      logger.error({ err }, 'AI evals error');
      res.status(500).json({ error: 'Evaluation run failed' });
    }
  },
);

router.get('/ai/evals/golden-set', (_req, res) => {
  res.json({
    total: GOLDEN_SET.length,
    byCategory: GOLDEN_SET.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    tests: GOLDEN_SET.map((t) => ({
      id: t.id,
      category: t.category,
      inputPreview: t.input.slice(0, 100),
      assertionCount: t.assertions.length,
    })),
  });
});

router.post(
  '/ai/retrieval/ingest',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      content: z.unknown().optional(),
      metadata: z.unknown().optional(),
      source: z.unknown().optional(),
      sourceType: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { content, source, sourceType, metadata } = req.body as {
        content?: string;
        source?: string;
        sourceType?: string;
        metadata?: Record<string, unknown>;
      };
      if (!content || !source) {
        res.status(400).json({ error: 'content and source required' });
        return;
      }

      const ingestTenantId =
        req.user?.orgs?.[0]?.orgId != null ? String(req.user.orgs[0].orgId) : '';
      if (!ingestTenantId) {
        res.status(403).json({ error: 'Tenant context required for AI ingestion' });
        return;
      }
      const chunks = alloyRetrieval.ingest(
        content,
        source,
        (sourceType || 'playbook') as any,
        metadata,
        ingestTenantId,
      );
      res.json({ ingested: chunks.length, source, stats: alloyRetrieval.getStats() });
    } catch (err) {
      logger.error({ err }, 'AI retrieval ingest error');
      res.status(500).json({ error: 'Ingestion failed' });
    }
  },
);

// ─── Alloy Decision Store ─────────────────────────────────────────────────────

router.get(
  '/ai/decision',
  authMiddleware({ required: true }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit) || '50', 10), 200);
      const offset = parseInt(String(req.query.offset) || '0', 10);
      const statusFilter = req.query.status as string | undefined;
      const riskFilter = req.query.riskLevel as string | undefined;

      const orgId = getOrgId(req.user);
      const admin = isGlobalAdmin(req.user);
      const result = await listDecisions({
        limit,
        offset,
        status: statusFilter,
        riskLevel: riskFilter,
        orgId,
        isAdmin: admin,
      });
      res.json({ total: result.total, offset, limit, decisions: result.decisions });
    } catch (err) {
      logger.error({ err }, 'Decision list error');
      sendError(res, 'Failed to list decisions', 500, 'INTERNAL_ERROR');
    }
  },
);

router.post(
  '/ai/decision',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      confidence: z.unknown().optional(),
      evidenceRefs: z.unknown().optional(),
      fallbackPlan: z.unknown().optional(),
      modelRoute: z.unknown().optional(),
      ownerSuggestion: z.unknown().optional(),
      rationaleSummary: z.unknown().optional(),
      rawInput: z.unknown().optional(),
      recommendedAction: z.unknown().optional(),
      riskLevel: z.unknown().optional(),
      signalIds: z.unknown().optional(),
      workflowId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        recommendedAction,
        rationaleSummary,
        riskLevel,
        confidence,
        workflowId,
        signalIds,
        evidenceRefs,
        ownerSuggestion,
        fallbackPlan,
        modelRoute,
        rawInput,
      } = req.body as Partial<AlloyDecision>;

      if (!recommendedAction || !rationaleSummary || !riskLevel) {
        sendBadRequest(res, 'recommendedAction, rationaleSummary, and riskLevel are required');
        return;
      }

      const admin = isGlobalAdmin(req.user);
      const orgId = getOrgId(req.user);
      if (!admin && orgId === null) {
        sendError(res, 'User must belong to an organization to create decisions', 403, 'NO_ORG');
        return;
      }

      const validRiskLevels: RiskLevel[] = ['P0', 'P1', 'P2', 'P3', 'P4'];
      if (!validRiskLevels.includes(riskLevel as RiskLevel)) {
        sendBadRequest(res, 'riskLevel must be P0, P1, P2, P3, or P4');
        return;
      }

      const policy = getApprovalPolicy(riskLevel as RiskLevel);

      const isAdminUser = req.user && isGlobalAdmin(req.user);
      const decisionSensitivity = isAdminUser ? 'restricted' : 'internal';
      const decisionTenantId =
        req.user?.orgs?.[0]?.orgId != null ? String(req.user.orgs[0].orgId) : '';
      const retrievalContext =
        rawInput && decisionTenantId
          ? await alloyRetrieval.retrieveFromDb(rawInput as string, null, {
              topK: 5,
              maxSensitivityLevel: decisionSensitivity as any,
              tenantId: decisionTenantId,
            })
          : null;

      const enrichedEvidence = [
        ...(evidenceRefs || []),
        ...(retrievalContext?.chunks?.map((c) => ({
          refId: `rag_${c.id}`,
          source: c.source,
          sourceType: 'retrieval' as const,
          content: c.content.slice(0, 300),
          relevanceScore: c.score ?? 0,
          timestamp: null,
          objectId: null,
        })) || []),
      ];

      const decision = createAlloyDecision({
        recommendedAction,
        rationaleSummary,
        riskLevel: riskLevel as RiskLevel,
        confidence: confidence ?? 0.5,
        workflowId: workflowId ?? null,
        signalIds: signalIds ?? [],
        evidenceRefs: enrichedEvidence,
        ownerSuggestion: ownerSuggestion ?? null,
        fallbackPlan:
          fallbackPlan ??
          (policy.requiresApproval ? `Escalate to ${policy.approverRole} for review` : null),
        modelRoute: modelRoute ?? 'planning',
        rawInput: rawInput ?? null,
      });

      await insertDecision(decision as any, orgId);

      writeAudit({
        endpoint: 'decision/create',
        decisionId: decision.decisionId,
        orgId,
        riskLevel: decision.riskLevel,
        approvalRequired: decision.approvalRequired,
        confidence: decision.confidence,
        status: decision.status,
      });

      res.status(201).json({
        decision,
        approvalPolicy: policy,
        message: decision.approvalRequired
          ? `Decision created. ${policy.approverRole} approval required within ${policy.sla}.`
          : 'Decision created and ready for execution.',
      });
    } catch (err) {
      logger.error({ err }, 'Decision create error');
      sendError(res, 'Failed to create decision', 500, 'INTERNAL_ERROR');
    }
  },
);

router.get('/ai/decision/:id', authMiddleware({ required: true }), async (req, res) => {
  try {
    const orgId = getOrgId(req.user);
    const admin = isGlobalAdmin(req.user);
    const decision = await getDecision(String(req.params.id), orgId, admin);
    if (!decision) {
      sendNotFound(res, 'Decision');
      return;
    }
    const policy = getApprovalPolicy(decision.riskLevel);
    res.json({ decision, approvalPolicy: policy });
  } catch (err) {
    logger.error({ err }, 'Decision get error');
    sendError(res, 'Failed to get decision', 500, 'INTERNAL_ERROR');
  }
});

router.post(
  '/ai/decision/:id/approve',
  authMiddleware({ required: true }),
  requireRole('exec', 'ops', 'admin', 'super_admin'),
  validateBody(
    bodyShape({
      approverName: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const orgId = getOrgId(req.user);
      const admin = isGlobalAdmin(req.user);
      const decision = await getDecision(String(req.params.id), orgId, admin);
      if (!decision) {
        sendNotFound(res, 'Decision');
        return;
      }
      if (decision.status !== 'pending_approval' && decision.status !== 'proposed') {
        sendError(res, 'Decision is not in a pending state', 409, 'WRONG_STATE');
        return;
      }

      const userRoles = req.user?.roles ?? [];
      const isExec =
        userRoles.includes('exec') ||
        userRoles.includes('admin') ||
        userRoles.includes('super_admin');

      if (decision.riskLevel === 'P0' && !isExec) {
        sendError(
          res,
          'P0 decisions require executive-level authorization',
          403,
          'INSUFFICIENT_ROLE',
        );
        return;
      }

      const approverName = req.body.approverName || req.user?.displayName || 'system';
      const now = new Date().toISOString();
      await updateDecisionStatus(
        decision.decisionId,
        {
          status: 'approved',
          approvedBy: approverName,
          approvedAt: now,
          executionOutcome: 'pending',
        },
        orgId,
        admin,
      );

      writeAudit({
        endpoint: 'decision/approve',
        decisionId: decision.decisionId,
        orgId,
        approvedBy: approverName,
        approverUserId: req.user?.id ?? null,
        approverRoles: userRoles,
        riskLevel: decision.riskLevel,
      });

      const updated = await getDecision(decision.decisionId, orgId, admin);
      res.json({ decision: updated, message: 'Decision approved and queued for execution.' });
    } catch (err) {
      logger.error({ err }, 'Decision approve error');
      sendError(res, 'Failed to approve decision', 500, 'INTERNAL_ERROR');
    }
  },
);

router.post(
  '/ai/decision/:id/reject',
  authMiddleware({ required: true }),
  requireRole('exec', 'ops', 'admin', 'super_admin'),
  validateBody(
    bodyShape({
      reason: z.unknown().optional(),
      rejectorName: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const orgId = getOrgId(req.user);
      const admin = isGlobalAdmin(req.user);
      const decision = await getDecision(String(req.params.id), orgId, admin);
      if (!decision) {
        sendNotFound(res, 'Decision');
        return;
      }
      if (decision.status !== 'pending_approval' && decision.status !== 'proposed') {
        sendError(res, 'Decision is not in a pending state', 409, 'WRONG_STATE');
        return;
      }

      const userRoles = req.user?.roles ?? [];
      const rejectorName = req.body.rejectorName || req.user?.displayName || 'system';
      const now = new Date().toISOString();
      await updateDecisionStatus(
        decision.decisionId,
        {
          status: 'rejected',
          rejectedBy: rejectorName,
          rejectedAt: now,
          rejectionReason: req.body.reason || null,
          executionOutcome: 'rejected',
        },
        orgId,
        admin,
      );

      writeAudit({
        endpoint: 'decision/reject',
        decisionId: decision.decisionId,
        orgId,
        rejectedBy: rejectorName,
        rejectorUserId: req.user?.id ?? null,
        rejectorRoles: userRoles,
        reason: req.body.reason,
        riskLevel: decision.riskLevel,
      });

      const updated = await getDecision(decision.decisionId, orgId, admin);
      res.json({ decision: updated, message: 'Decision rejected.' });
    } catch (err) {
      logger.error({ err }, 'Decision reject error');
      sendError(res, 'Failed to reject decision', 500, 'INTERNAL_ERROR');
    }
  },
);

router.get('/ai/approval-matrix', (_req, res) => {
  res.json({
    matrix: APPROVAL_MATRIX,
    description: 'Approval requirements and SLAs by risk level',
    executionMode: process.env.AI_EXECUTION_MODE ?? 'propose_only',
  });
});

router.get('/ai/structured-intelligence', (_req, res) => {
  const stats = proofChain.getStats();
  const recentEntries = proofChain.getEntries(20);
  const refusalIncidents = proofChain.getRefusalIncidents(20);
  res.json({
    stats,
    recentProofChainEntries: recentEntries,
    refusalIncidents,
    pipeline: {
      engine: 'governedStructuredCall',
      schemaValidation: 'zod-native',
      provenanceEnvelopes: true,
      covenantPolicy: true,
      proofChain: true,
      refusalDetection: true,
    },
    generatedAt: new Date().toISOString(),
  });
});

router.get('/ai/structured-intelligence/refusal-incidents', (_req, res) => {
  const incidents = proofChain.getRefusalIncidents(50);
  res.json({ incidents, total: incidents.length, generatedAt: new Date().toISOString() });
});

router.get('/ai/structured-intelligence/proof-chain', (_req, res) => {
  const domain = typeof _req.query.domain === 'string' ? _req.query.domain : undefined;
  const limit = Math.min(parseInt(String(_req.query.limit ?? '50'), 10), 200);
  const entries = proofChain.getEntries(limit, domain);
  res.json({ entries, total: entries.length, generatedAt: new Date().toISOString() });
});

export default router;

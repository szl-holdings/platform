import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import {
  gatewayInfer,
  getGatewayStatus,
  isValidProvider,
  isValidStrategy,
  providerCircuitBreaker,
} from '../lib/ai-gateway.js';
import { getGuardianEngine, makeGuardianRequestId, recordGuardianAction } from '../lib/guardian-engine.js';
import { inferenceTelemetry } from '../lib/inference-telemetry.js';
import { budgetLedger } from '../lib/budget-ledger.js';
import type { InferenceProvider } from '../lib/inference-telemetry.js';
import { logger } from '../lib/logger.js';
import { providerHealth } from '../lib/provider-health.js';
import { authMiddleware } from '../middlewares/auth.js';
import { tenantScope } from '../middlewares/tenant-scope.js';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { createDefaultSandboxPolicy } from '@szl-holdings/forge-runtime/sandbox';
import {
  CodeSandbox,
  defaultExecutor,
  defaultGateway,
  defaultToolRegistry,
} from '@workspace/tool-mesh';

const router = Router();

// Shared CodeSandbox instance (idempotent, same as tool-mesh route)
const codeSandbox = new CodeSandbox(
  defaultGateway,
  defaultToolRegistry.getCatalogSearch(),
  30_000,
  defaultExecutor,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPolicyDecision(
  domain: string,
  riskTier: string,
  model: string | undefined,
  requestId: string,
) {
  const engine = getGuardianEngine();
  return engine.decide({
    requestId,
    tier: riskTier as 'advisory' | 'supervised' | 'operator-approved' | 'classified' | 'sovereign',
    action: 'model-inference',
    domain,
    model: model ?? undefined,
    agentId: 'ai-gateway',
  });
}

// ---------------------------------------------------------------------------
// Server-side risk-tier floor: callers cannot self-downgrade below the domain
// minimum. A caller claiming "advisory" for a legal domain is silently raised
// to "supervised", preventing policy bypass via tier downgrade.
// ---------------------------------------------------------------------------
const TIER_RANK: Record<string, number> = {
  advisory: 0,
  supervised: 1,
  'operator-approved': 2,
  classified: 3,
  sovereign: 4,
};

const DOMAIN_MIN_TIER: Record<string, string> = {
  legal: 'supervised',
  medical: 'operator-approved',
  financial: 'supervised',
  compliance: 'supervised',
  security: 'operator-approved',
  hr: 'supervised',
  classified: 'classified',
  sovereign: 'sovereign',
};

function resolveRiskTier(domain: string, callerTier: string): string {
  const minTier = DOMAIN_MIN_TIER[domain] ?? 'advisory';
  const minRank = TIER_RANK[minTier] ?? 0;
  const callerRank = TIER_RANK[callerTier] ?? 0;
  return callerRank >= minRank ? callerTier : minTier;
}

// ---------------------------------------------------------------------------
// Policy-approved providers by tier: requests cannot route to unapproved
// providers. Higher tiers restrict to auditable cloud providers only.
// ---------------------------------------------------------------------------
const TIER_ALLOWED_PROVIDERS: Record<string, InferenceProvider[]> = {
  advisory: ['openai', 'anthropic', 'replit-proxy', 'gemini', 'huggingface', 'qclaw', 'mock'],
  supervised: ['openai', 'anthropic', 'replit-proxy', 'gemini', 'qclaw'],
  'operator-approved': ['openai', 'anthropic', 'replit-proxy'],
  classified: ['anthropic', 'openai'],
  sovereign: ['openai'],
};

function getAllowedProviders(effectiveTier: string): InferenceProvider[] {
  return TIER_ALLOWED_PROVIDERS[effectiveTier] ?? TIER_ALLOWED_PROVIDERS['advisory']!;
}

// ---------------------------------------------------------------------------
// Server-side tool allowlist by tier: callers cannot request tools beyond
// what their tier permits. Effective tools = intersection of tier allowlist
// and caller-requested tools (callers can further restrict, never expand).
// ---------------------------------------------------------------------------
const TIER_ALLOWED_TOOLS: Record<string, string[]> = {
  advisory: ['web-search', 'calculator', 'text-processor', 'data-reader', 'file-reader', 'summarizer'],
  supervised: ['web-search', 'calculator', 'text-processor', 'data-reader', 'file-reader'],
  'operator-approved': ['calculator', 'text-processor', 'data-reader', 'file-reader'],
  classified: ['calculator', 'text-processor', 'data-reader'],
  sovereign: ['calculator', 'text-processor'],
};

function resolveAllowedTools(effectiveTier: string, requestedTools: string[]): string[] {
  const tierTools = TIER_ALLOWED_TOOLS[effectiveTier] ?? [];
  if (requestedTools.length === 0) return [];
  // Intersection: caller can request a subset of tier-allowed tools, never more
  return requestedTools.filter((t) => tierTools.includes(t));
}

// ---------------------------------------------------------------------------
// Tool allowlist enforcement: validate generated code does not reference tools
// outside the approved set. Empty allowedTools = read-only (no tool calls).
// ---------------------------------------------------------------------------
const TOOL_CALL_PATTERN = /\b(?:callTool|executeTool|invokeTool|toolRegistry\.call)\s*\(\s*['"]([^'"]+)['"]/g;

function enforceToolAllowlist(code: string, allowedTools: string[]): { ok: true } | { ok: false; violatingTool: string } {
  const matches = code.matchAll(TOOL_CALL_PATTERN);
  for (const match of matches) {
    const tool = match[1]!;
    if (!allowedTools.includes(tool)) {
      return { ok: false, violatingTool: tool };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// GET /ai-gateway/status
// Unified provider health + circuit breaker + gateway configuration
// ---------------------------------------------------------------------------
router.get('/ai-gateway/status', authMiddleware(), tenantScope({ required: true }), (req, res) => {
  try {
    const orgId = req.tenantOrgId != null ? String(req.tenantOrgId) : undefined;
    const status = getGatewayStatus();
    const circuitStatuses = providerCircuitBreaker.getAllStatuses();
    const providerStats = inferenceTelemetry.getProviderStats(300_000, orgId);

    const enriched = status.availableProviders.map((p) => {
      const circuit = circuitStatuses.find((c) => c.provider === p.provider);
      const stats = providerStats.find((s) => s.provider === p.provider);
      const health = providerHealth.getStatus(p.provider);
      return {
        ...p,
        circuitBreaker: circuit ?? null,
        successRate: stats ? (1 - stats.errorRate) * 100 : null,
        p50LatencyMs: stats?.p50LatencyMs ?? null,
        p95LatencyMs: stats?.p95LatencyMs ?? null,
        totalCallsLast5m: stats?.totalRequests ?? 0,
        costLast5mUsd: stats?.totalCostUsd ?? 0,
        healthDetail: health,
      };
    });

    res.json({
      ok: true,
      data: {
        providers: enriched,
        defaultStrategy: status.defaultStrategy,
        supportedStrategies: status.supportedStrategies,
        taskTypes: status.taskTypes,
        circuitBreakers: circuitStatuses,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, '[ai-gateway] /status error');
    res.status(500).json({ ok: false, error: 'Failed to retrieve gateway status' });
  }
});

// ---------------------------------------------------------------------------
// GET /ai-gateway/metrics
// Telemetry summary: usage, cost, model breakdown, provider breakdown
// ---------------------------------------------------------------------------
router.get('/ai-gateway/metrics', authMiddleware(), tenantScope({ required: true }), (req, res) => {
  try {
    const windowMs = Number(req.query.windowMs ?? 3_600_000); // default 1h
    const tenantOrgId = req.tenantOrgId;
    const orgId = tenantOrgId != null ? String(tenantOrgId) : undefined;
    const summary = inferenceTelemetry.getSummary(windowMs, orgId);
    const providerStats = inferenceTelemetry.getProviderStats(windowMs, orgId);
    const modelStats = inferenceTelemetry.getModelStats(windowMs, orgId);

    res.json({
      ok: true,
      data: {
        window: { ms: windowMs, label: windowMs >= 3_600_000 ? '1h' : `${windowMs / 60_000}m` },
        summary,
        providerBreakdown: providerStats,
        modelBreakdown: modelStats,
        tenantOrgId: tenantOrgId ?? null,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, '[ai-gateway] /metrics error');
    res.status(500).json({ ok: false, error: 'Failed to retrieve gateway metrics' });
  }
});

// ---------------------------------------------------------------------------
// GET /ai-gateway/cost
// Cost intelligence per domain, per model, per provider
// ---------------------------------------------------------------------------
router.get('/ai-gateway/cost', authMiddleware(), tenantScope({ required: true }), (req, res) => {
  try {
    const windowMs = Number(req.query.windowMs ?? 86_400_000); // default 24h
    const tenantOrgId = req.tenantOrgId;
    const orgId = tenantOrgId != null ? String(tenantOrgId) : undefined;
    const filtered = inferenceTelemetry.getRecords({ windowMs, orgId, limit: 10_000 });

    const byDomain: Record<string, { calls: number; costUsd: number; tokens: number }> = {};
    const byModel: Record<string, { calls: number; costUsd: number; tokens: number }> = {};
    const byProvider: Record<string, { calls: number; costUsd: number; tokens: number }> = {};

    let totalCostUsd = 0;
    let totalCalls = 0;
    let totalTokens = 0;

    for (const r of filtered) {
      const domain = r.domain ?? 'unknown';
      const model = r.model;
      const provider = r.provider;
      const cost = r.estimatedCostUsd ?? 0;
      const tokens = r.totalTokens ?? 0;

      byDomain[domain] ??= { calls: 0, costUsd: 0, tokens: 0 };
      byDomain[domain].calls++;
      byDomain[domain].costUsd += cost;
      byDomain[domain].tokens += tokens;

      byModel[model] ??= { calls: 0, costUsd: 0, tokens: 0 };
      byModel[model].calls++;
      byModel[model].costUsd += cost;
      byModel[model].tokens += tokens;

      byProvider[provider] ??= { calls: 0, costUsd: 0, tokens: 0 };
      byProvider[provider].calls++;
      byProvider[provider].costUsd += cost;
      byProvider[provider].tokens += tokens;

      totalCostUsd += cost;
      totalCalls++;
      totalTokens += tokens;
    }

    const domainRows = Object.entries(byDomain)
      .map(([d, v]) => {
        const budget = orgId ? budgetLedger.check(orgId, d) : null;
        return {
          domain: d,
          ...v,
          budget: budget
            ? { limitUsd: budget.limitUsd, spentUsd: budget.spentUsd, utilizationPct: budget.utilizationPct, over: budget.over }
            : null,
        };
      })
      .sort((a, b) => b.costUsd - a.costUsd);

    const modelRows = Object.entries(byModel)
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.costUsd - a.costUsd);

    const providerRows = Object.entries(byProvider)
      .map(([provider, v]) => ({ provider, ...v }))
      .sort((a, b) => b.costUsd - a.costUsd);

    res.json({
      ok: true,
      data: {
        window: { ms: windowMs },
        totals: { calls: totalCalls, costUsd: totalCostUsd, tokens: totalTokens },
        byDomain: domainRows,
        byModel: modelRows,
        byProvider: providerRows,
        tenantOrgId: tenantOrgId ?? null,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, '[ai-gateway] /cost error');
    res.status(500).json({ ok: false, error: 'Failed to retrieve cost data' });
  }
});

// ---------------------------------------------------------------------------
// GET /ai-gateway/failover
// Recent failover events (retried requests with provider switches)
// ---------------------------------------------------------------------------
router.get('/ai-gateway/failover', authMiddleware(), tenantScope({ required: true }), (req, res) => {
  try {
    const windowMs = Number(req.query.windowMs ?? 3_600_000);
    const orgId = req.tenantOrgId != null ? String(req.tenantOrgId) : undefined;
    const records = inferenceTelemetry.getRecords({ windowMs, orgId, limit: 5000 });
    const failoverEvents = records
      .filter((r) => r.retryCount > 0 || !r.success)
      .slice(0, 100)
      .map((r) => ({
        id: r.id,
        provider: r.provider,
        model: r.model,
        domain: r.domain,
        retryCount: r.retryCount,
        success: r.success,
        latencyMs: r.latencyMs,
        errorType: r.errorType ?? null,
        routingStrategy: r.routingStrategy,
        timestamp: r.timestamp,
      }));

    const circuitTrips = providerCircuitBreaker.getAllStatuses().filter((s) => s.totalTripped > 0);

    res.json({
      ok: true,
      data: {
        failoverEvents,
        circuitBreakerTrips: circuitTrips,
        window: { ms: windowMs },
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, '[ai-gateway] /failover error');
    res.status(500).json({ ok: false, error: 'Failed to retrieve failover data' });
  }
});

// ---------------------------------------------------------------------------
// GET /ai-gateway/records
// Recent inference records for the activity feed
// ---------------------------------------------------------------------------
router.get('/ai-gateway/records', authMiddleware(), tenantScope({ required: true }), (req, res) => {
  try {
    const windowMs = Number(req.query.windowMs ?? 3_600_000);
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const provider = req.query.provider as string | undefined;
    const domain = req.query.domain as string | undefined;
    const orgId = req.tenantOrgId != null ? String(req.tenantOrgId) : undefined;

    const records = inferenceTelemetry.getRecords({
      windowMs,
      orgId,
      provider: provider as Parameters<typeof inferenceTelemetry.getRecords>[0]['provider'],
      limit,
    });

    const filtered = domain ? records.filter((r) => r.domain === domain) : records;

    res.json({
      ok: true,
      data: { records: filtered, total: filtered.length, window: { ms: windowMs } },
    });
  } catch (err) {
    logger.error({ err }, '[ai-gateway] /records error');
    res.status(500).json({ ok: false, error: 'Failed to retrieve records' });
  }
});

// ---------------------------------------------------------------------------
// POST /ai-gateway/infer
// Governed inference: Guardian policy gate → routing → Proof Chain recording
// ---------------------------------------------------------------------------
router.post(
  '/ai-gateway/infer',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req, res) => {
    const {
      messages,
      model,
      maxTokens,
      agentId,
      domain = 'general',
      riskTier = 'advisory',
      preferredProvider,
      strategy,
      timeoutMs,
      maxRetries,
      taskType,
    } = req.body as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      maxTokens?: number;
      agentId?: string;
      domain?: string;
      riskTier?: string;
      preferredProvider?: string;
      strategy?: string;
      timeoutMs?: number;
      maxRetries?: number;
      taskType?: string;
    };

    // Derive tenant identity from authenticated session — not from request body
    const tenantOrgId = req.tenantOrgId;
    const trustedTenantId = tenantOrgId?.toString();
    const orgId = tenantOrgId != null ? String(tenantOrgId) : undefined;

    // Enforce server-side minimum tier floor: callers cannot self-downgrade
    // below the domain's required minimum (e.g. "legal" requires "supervised").
    const effectiveTier = resolveRiskTier(domain, riskTier);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: 'messages array is required' });
    }

    const requestId = makeGuardianRequestId('gw');

    // ── Step 1: Guardian policy gate ──────────────────────────────────────────
    let policyDecision: Awaited<ReturnType<typeof buildPolicyDecision>>;
    try {
      policyDecision = buildPolicyDecision(domain, effectiveTier, model, requestId);
    } catch (err) {
      logger.error({ err, requestId }, '[ai-gateway] Guardian policy evaluation failed');
      return res.status(500).json({ ok: false, error: 'Policy evaluation failed', requestId });
    }

    void recordGuardianAction({
      request: {
        requestId,
        tier: effectiveTier as 'advisory' | 'supervised' | 'operator-approved',
        action: 'model-inference',
        domain,
        model: model ?? 'auto',
        agentId: agentId ?? 'api-gateway',
      },
      result: policyDecision,
      payload: { tenantOrgId: trustedTenantId, taskType, preferredProvider, strategy },
    });

    if (policyDecision.outcome === 'deny' || policyDecision.outcome === 'block') {
      return res.status(403).json({
        ok: false,
        error: 'Request blocked by governance policy',
        requestId,
        policy: {
          outcome: policyDecision.outcome,
          reason: policyDecision.reason,
          matchedRuleId: policyDecision.matchedRuleId ?? null,
        },
      });
    }

    if (policyDecision.outcome === 'require-approval' || policyDecision.outcome === 'require-dual-approval') {
      return res.status(202).json({
        ok: false,
        pending: true,
        requestId,
        policy: {
          outcome: policyDecision.outcome,
          reason: policyDecision.reason,
          requiredApprovers: policyDecision.requiredApprovers,
        },
        message: 'Inference request requires human approval before execution',
      });
    }

    // ── Step 2: Validate provider/strategy ────────────────────────────────────
    let resolvedStrategy = strategy && isValidStrategy(strategy) ? strategy : 'fastest';
    const resolvedProvider =
      preferredProvider && isValidProvider(preferredProvider) ? preferredProvider : undefined;

    // ── Step 2a: Budget check + automatic downgrade ────────────────────────────
    // Check per-org/domain budget. If consumed, force cheapest routing strategy
    // to preserve remaining budget rather than blocking the request entirely.
    const budgetStatus = orgId
      ? budgetLedger.check(orgId, domain)
      : null;

    if (budgetStatus?.over) {
      logger.warn(
        { orgId, domain, spentUsd: budgetStatus.spentUsd, limitUsd: budgetStatus.limitUsd },
        '[ai-gateway] Budget exceeded — downgrading to cheapest routing strategy',
      );
      resolvedStrategy = 'cheapest';
    } else if (budgetStatus && budgetStatus.utilizationPct >= 80) {
      logger.info(
        { orgId, domain, utilizationPct: budgetStatus.utilizationPct },
        '[ai-gateway] Budget >80% consumed — preferring cheapest routing strategy',
      );
      resolvedStrategy = 'cheapest';
    }

    // ── Step 2b: Policy-constrained provider selection ────────────────────────
    // Derive the approved provider set for this risk tier. Requests cannot
    // route to providers outside the tier's allowlist.
    const allowedProviders = getAllowedProviders(effectiveTier);

    // ── Step 3: Execute inference ──────────────────────────────────────────────
    const inferStart = Date.now();
    let inferResult: Awaited<ReturnType<typeof gatewayInfer>>;
    try {
      inferResult = await gatewayInfer({
        messages: messages as Array<{ role: string; content: string }>,
        model,
        maxTokens,
        agentId,
        domain,
        orgId,
        preferredProvider: resolvedProvider,
        allowedProviders,
        strategy: resolvedStrategy,
        timeoutMs,
        maxRetries,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error({ err, requestId, domain }, '[ai-gateway] Inference failed');

      if (process.env.DATABASE_URL) {
        void tagAIContent({
          contentId: requestId,
          contentType: 'gateway-inference',
          sourceClass: 'llm_generated',
          confidenceScore: 0,
          modelId: model ?? 'unknown',
          modelProvider: resolvedProvider ?? 'unknown',
          serviceAttribution: 'ai-gateway',
          metadata: {
            domain,
            riskTier: effectiveTier,
            tenantOrgId: trustedTenantId,
            taskType,
            outcome: 'failure',
            error: errMsg,
            policyOutcome: policyDecision.outcome,
            policyMatchedRuleId: policyDecision.matchedRuleId,
            requestId,
          },
        }).catch(() => {});
      }

      return res.status(503).json({
        ok: false,
        error: errMsg,
        requestId,
        policy: { outcome: policyDecision.outcome, matchedRuleId: policyDecision.matchedRuleId ?? null },
      });
    }

    const totalLatencyMs = Date.now() - inferStart;

    // ── Step 3a: Record cost to budget ledger ─────────────────────────────────
    if (orgId) {
      budgetLedger.record(orgId, domain, inferResult.estimatedCostUsd);
    }

    // ── Step 4: Record to Proof Chain ─────────────────────────────────────────
    if (process.env.DATABASE_URL) {
      void tagAIContent({
        contentId: requestId,
        contentType: 'gateway-inference',
        sourceClass: 'llm_generated',
        confidenceScore: 0.85,
        modelId: inferResult.model,
        modelProvider: inferResult.provider,
        modelLane: resolvedStrategy,
        serviceAttribution: 'ai-gateway',
        inputSources: [{ type: 'request', id: requestId, label: `${domain}/${effectiveTier}` }],
        metadata: {
          domain,
          riskTier: effectiveTier,
          tenantOrgId: trustedTenantId,
          taskType,
          outcome: 'success',
          policyOutcome: policyDecision.outcome,
          policyMatchedRuleId: policyDecision.matchedRuleId,
          attemptedProviders: inferResult.routing.attemptedProviders,
          retryCount: inferResult.routing.retryCount,
          estimatedCostUsd: inferResult.estimatedCostUsd,
          totalTokens: inferResult.usage.totalTokens,
          totalLatencyMs,
          requestId,
        },
      }).catch(() => {});
    }

    const updatedBudget = orgId ? budgetLedger.check(orgId, domain) : null;

    return res.json({
      ok: true,
      data: {
        requestId,
        content: inferResult.content,
        model: inferResult.model,
        provider: inferResult.provider,
        usage: inferResult.usage,
        estimatedCostUsd: inferResult.estimatedCostUsd,
        routing: inferResult.routing,
        policy: {
          outcome: policyDecision.outcome,
          matchedRuleId: policyDecision.matchedRuleId ?? null,
          reason: policyDecision.reason,
          riskTier: effectiveTier,
          allowedProviders,
        },
        budget: updatedBudget
          ? {
              spentUsd: updatedBudget.spentUsd,
              limitUsd: updatedBudget.limitUsd,
              utilizationPct: updatedBudget.utilizationPct,
              over: updatedBudget.over,
            }
          : null,
        totalLatencyMs,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// POST /ai-gateway/code-agent
// Governed code agent: Guardian gate → LLM code generation → sandboxed V8 execution
// ---------------------------------------------------------------------------
router.post(
  '/ai-gateway/code-agent',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req, res) => {
    const {
      task,
      domain = 'general',
      riskTier = 'advisory',
      agentId,
      allowedTools = [],
      maxExecutionMs = 10_000,
    } = req.body as {
      task: string;
      domain?: string;
      riskTier?: string;
      agentId?: string;
      allowedTools?: string[];
      maxExecutionMs?: number;
    };

    // Derive tenant identity from authenticated session — not from request body
    const tenantOrgId = req.tenantOrgId;
    const trustedTenantId = tenantOrgId?.toString();
    const orgId = tenantOrgId != null ? String(tenantOrgId) : undefined;

    // Server-side tier floor — code-agent access cannot be downgraded by callers
    const effectiveTier = resolveRiskTier(domain, riskTier);

    // Server-side tool resolution: intersect caller-requested tools with the
    // tier's approved set. Callers cannot self-grant tools beyond tier policy.
    // Empty requestedTools → read-only mode (no tools permitted).
    const requestedTools = Array.isArray(allowedTools) ? allowedTools : [];
    const effectiveAllowedTools = resolveAllowedTools(effectiveTier, requestedTools);

    if (!task || typeof task !== 'string') {
      return res.status(400).json({ ok: false, error: 'task string is required' });
    }

    const requestId = makeGuardianRequestId('code-agent');

    // ── Guardian policy gate ────────────────────────────────────────────────────
    const engine = getGuardianEngine();
    const policyDecision = engine.decide({
      requestId,
      tier: effectiveTier as 'advisory' | 'supervised' | 'operator-approved',
      action: 'code-agent-execute',
      domain,
      agentId: agentId ?? 'code-agent',
      toolId: effectiveAllowedTools.length > 0 ? effectiveAllowedTools[0] : undefined,
    });

    void recordGuardianAction({
      request: {
        requestId,
        tier: effectiveTier as 'advisory' | 'supervised' | 'operator-approved',
        action: 'code-agent-execute',
        domain,
        agentId: agentId ?? 'code-agent',
      },
      result: policyDecision,
      payload: { tenantOrgId: trustedTenantId, task: task.slice(0, 200), effectiveAllowedTools },
    });

    if (policyDecision.outcome === 'deny' || policyDecision.outcome === 'block') {
      return res.status(403).json({
        ok: false,
        error: 'Code agent execution blocked by governance policy',
        requestId,
        policy: { outcome: policyDecision.outcome, reason: policyDecision.reason },
      });
    }

    if (policyDecision.outcome === 'require-approval' || policyDecision.outcome === 'require-dual-approval') {
      return res.status(202).json({
        ok: false,
        pending: true,
        requestId,
        policy: {
          outcome: policyDecision.outcome,
          requiredApprovers: policyDecision.requiredApprovers,
          reason: policyDecision.reason,
        },
        message: 'Code agent execution requires human approval',
      });
    }

    // ── Scope certificate (enforced via sandbox policy below) ─────────────────
    // Write access is always denied through the AI gateway sandbox. Writes and
    // external calls require a dedicated Guardian approval workflow — they are
    // not derived from the caller-supplied riskTier.
    const scopeCertificate = {
      certId: randomUUID(),
      domain,
      riskTier: effectiveTier,
      allowedTools: effectiveAllowedTools,
      allowWrites: false,
      allowExternalCalls: false,
      issuedAt: new Date().toISOString(),
      expiresIn: maxExecutionMs,
      policyMatchedRuleId: policyDecision.matchedRuleId ?? null,
    };

    const execStart = Date.now();

    // ── Step 1a: Budget check + automatic strategy downgrade ───────────────────
    // Mirror the same budget governance used by /infer — code-agent LLM calls
    // consume budget and must respect per-org/domain spend limits.
    const caBudgetStatus = orgId ? budgetLedger.check(orgId, domain) : null;
    let caResolvedStrategy: 'fastest' | 'cheapest' | 'balanced' = 'fastest';
    if (caBudgetStatus?.over) {
      logger.warn(
        { orgId, domain, spentUsd: caBudgetStatus.spentUsd, limitUsd: caBudgetStatus.limitUsd },
        '[ai-gateway/code-agent] Budget exceeded — downgrading to cheapest routing strategy',
      );
      caResolvedStrategy = 'cheapest';
    } else if (caBudgetStatus && caBudgetStatus.utilizationPct >= 80) {
      logger.info(
        { orgId, domain, utilizationPct: caBudgetStatus.utilizationPct },
        '[ai-gateway/code-agent] Budget >80% consumed — preferring cheapest routing strategy',
      );
      caResolvedStrategy = 'cheapest';
    }

    // ── Step 1b: Provider allowlist for this risk tier ─────────────────────────
    // Code-agent LLM generation must be constrained to the same provider set as
    // /infer — the risk tier governs which providers may handle inference.
    const caAllowedProviders = getAllowedProviders(effectiveTier);

    // ── Step 1c: Inference-specific Guardian policy gate ───────────────────────
    // Every LLM call must pass an inference policy decision — including internal
    // calls made by the code agent. This makes code-agent inference auditable and
    // subject to the same deny/require-approval rules as /infer.
    const inferRequestId = makeGuardianRequestId('ca-infer');
    let inferPolicyDecision: Awaited<ReturnType<typeof buildPolicyDecision>>;
    try {
      inferPolicyDecision = buildPolicyDecision(domain, effectiveTier, undefined, inferRequestId);
    } catch (err) {
      logger.error({ err, requestId }, '[ai-gateway/code-agent] Inference policy evaluation failed');
      return res.status(500).json({ ok: false, error: 'Inference policy evaluation failed', requestId });
    }

    void recordGuardianAction({
      request: {
        requestId: inferRequestId,
        tier: effectiveTier as 'advisory' | 'supervised' | 'operator-approved',
        action: 'model-inference',
        domain,
        agentId: agentId ?? 'code-agent',
      },
      result: inferPolicyDecision,
      payload: { tenantOrgId: trustedTenantId, parentRequestId: requestId, caResolvedStrategy },
    });

    if (inferPolicyDecision.outcome === 'deny' || inferPolicyDecision.outcome === 'block') {
      return res.status(403).json({
        ok: false,
        error: 'Code agent LLM inference blocked by governance policy',
        requestId,
        policy: {
          outcome: inferPolicyDecision.outcome,
          reason: inferPolicyDecision.reason,
          matchedRuleId: inferPolicyDecision.matchedRuleId ?? null,
        },
      });
    }

    if (inferPolicyDecision.outcome === 'require-approval' || inferPolicyDecision.outcome === 'require-dual-approval') {
      return res.status(202).json({
        ok: false,
        pending: true,
        requestId,
        policy: {
          outcome: inferPolicyDecision.outcome,
          reason: inferPolicyDecision.reason,
          requiredApprovers: inferPolicyDecision.requiredApprovers,
        },
        message: 'Code agent LLM inference requires human approval before execution',
      });
    }

    // ── Step 1: LLM code generation ────────────────────────────────────────────
    let agentResult: Awaited<ReturnType<typeof gatewayInfer>>;
    try {
      const codePrompt = [
        {
          role: 'system' as const,
          content: [
            `You are a governed code agent. Generate TypeScript code to accomplish the task.`,
            `Scope: domain=${domain}, riskTier=${effectiveTier}, allowWrites=${scopeCertificate.allowWrites}, allowExternalCalls=${scopeCertificate.allowExternalCalls}`,
            `Available tools: ${effectiveAllowedTools.length > 0 ? effectiveAllowedTools.join(', ') : 'none (read-only mode)'}`,
            ``,
            `Respond with ONLY a JSON object in this format:`,
            `{ "type": "code", "code": "<executable TypeScript>", "explanation": "<brief explanation>" }`,
            ``,
            `If the task cannot be expressed as code, respond with:`,
            `{ "type": "answer", "answer": "<direct answer>", "explanation": "<reasoning>" }`,
          ].join('\n'),
        },
        {
          role: 'user' as const,
          content: `Task: ${task}`,
        },
      ];

      agentResult = await gatewayInfer({
        messages: codePrompt,
        agentId: agentId ?? 'code-agent',
        domain,
        orgId,
        allowedProviders: caAllowedProviders,
        strategy: caResolvedStrategy,
        maxTokens: 2048,
        timeoutMs: Math.min(maxExecutionMs, 25_000),
      });

      // Record LLM cost against the org/domain budget after successful inference
      if (orgId && agentResult.estimatedCostUsd > 0) {
        budgetLedger.record(orgId, domain, agentResult.estimatedCostUsd);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(503).json({
        ok: false,
        error: `Code agent LLM generation failed: ${errMsg}`,
        requestId,
        scopeCertificate,
      });
    }

    // ── Step 2: Parse LLM output ───────────────────────────────────────────────
    let parsedOutput: { type: string; code?: string; answer?: string; explanation?: string } = {
      type: 'answer',
      answer: agentResult.content,
    };

    try {
      const match = agentResult.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as typeof parsedOutput;
        if (parsed && typeof parsed === 'object') {
          parsedOutput = parsed;
        }
      }
    } catch {
      // keep raw answer
    }

    // ── Step 3: Execute in governed V8 sandbox (when LLM produced code) ────────
    let sandboxRecord: {
      id: string;
      success: boolean;
      durationMs: number;
      toolCalls: unknown[];
      violations: unknown[];
      result?: unknown;
      error?: string;
    } | null = null;

    if (parsedOutput.type === 'code' && parsedOutput.code && parsedOutput.code.trim().length > 0) {
      // ── Tool allowlist enforcement ────────────────────────────────────────────
      // Validate the generated code does not call tools outside the approved set.
      // Empty allowedTools = read-only mode (no tool calls permitted at all).
      const allowlistResult = enforceToolAllowlist(parsedOutput.code, effectiveAllowedTools);
      if (!allowlistResult.ok) {
        return res.status(403).json({
          ok: false,
          error: `Generated code references disallowed tool: ${allowlistResult.violatingTool}`,
          requestId,
          policy: {
            outcome: 'deny',
            reason: 'tool-not-in-allowlist',
            violatingTool: allowlistResult.violatingTool,
            allowedTools: effectiveAllowedTools,
          },
          scopeCertificate,
        });
      }

      try {
        // Enforce hardened read-only policy — writes and external calls are
        // always disabled through the AI gateway sandbox.
        const policy = createDefaultSandboxPolicy(
          (domain ?? 'general') as Parameters<typeof createDefaultSandboxPolicy>[0],
          {
            allowWrites: false,
            allowExternalRequests: false,
          } as Parameters<typeof createDefaultSandboxPolicy>[1],
        );

        const sandboxAgentId = agentId
          ? agentId
          : trustedTenantId
            ? `tenant:${trustedTenantId}`
            : 'code-agent';

        const record = await codeSandbox.execute(
          parsedOutput.code,
          policy,
          { agentId: sandboxAgentId },
          { timeoutMs: Math.min(maxExecutionMs, 25_000) },
        );

        sandboxRecord = {
          id: record.id,
          success: record.success,
          durationMs: record.durationMs,
          toolCalls: record.toolCalls,
          violations: record.violations,
          result: (record as Record<string, unknown>).result,
          error: (record as Record<string, unknown>).error as string | undefined,
        };

        logger.info(
          { requestId, execSuccess: record.success, durationMs: record.durationMs, violations: record.violations.length },
          '[ai-gateway] Code agent sandbox execution complete',
        );
      } catch (sandboxErr) {
        const errMsg = sandboxErr instanceof Error ? sandboxErr.message : String(sandboxErr);
        logger.warn({ err: sandboxErr, requestId }, '[ai-gateway] Sandbox execution failed — returning LLM output only');
        sandboxRecord = {
          id: randomUUID(),
          success: false,
          durationMs: 0,
          toolCalls: [],
          violations: [],
          error: errMsg,
        };
      }
    }

    const execDurationMs = Date.now() - execStart;

    // ── Proof Chain recording ──────────────────────────────────────────────────
    if (process.env.DATABASE_URL) {
      void tagAIContent({
        contentId: requestId,
        contentType: 'code-agent-execution',
        sourceClass: 'llm_generated',
        confidenceScore: 0.8,
        modelId: agentResult.model,
        modelProvider: agentResult.provider,
        serviceAttribution: 'ai-gateway/code-agent',
        metadata: {
          domain,
          riskTier: effectiveTier,
          tenantOrgId: trustedTenantId,
          task: task.slice(0, 200),
          scopeCertificate,
          outputType: parsedOutput.type,
          sandboxExecuted: sandboxRecord !== null,
          sandboxSuccess: sandboxRecord?.success ?? false,
          sandboxViolations: sandboxRecord?.violations?.length ?? 0,
          execDurationMs,
          policyOutcome: policyDecision.outcome,
          estimatedCostUsd: agentResult.estimatedCostUsd,
          requestId,
        },
      }).catch(() => {});
    }

    return res.json({
      ok: true,
      data: {
        requestId,
        output: parsedOutput,
        sandbox: sandboxRecord,
        rawContent: agentResult.content,
        model: agentResult.model,
        provider: agentResult.provider,
        usage: agentResult.usage,
        estimatedCostUsd: agentResult.estimatedCostUsd,
        scopeCertificate,
        policy: {
          outcome: policyDecision.outcome,
          matchedRuleId: policyDecision.matchedRuleId ?? null,
          reason: policyDecision.reason,
        },
        execDurationMs,
      },
    });
  },
);

export default router;

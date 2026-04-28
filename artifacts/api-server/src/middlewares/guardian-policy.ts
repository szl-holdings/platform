import type { PolicyTier } from '@workspace/guardian';
import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { getEffectiveTierOverride } from '../lib/effective-tiers';
import {
  getGuardianEngine,
  makeGuardianRequestId,
  recordGuardianAction,
} from '../lib/guardian-engine';
import { logger } from '../lib/logger';

export interface GuardianPolicyOptions {
  category?: string;
  defaultTier?: PolicyTier;
  enforce?: boolean;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ENFORCE_BY_DEFAULT = process.env.GUARDIAN_ENFORCE === 'true';

const SKIP_PATH_PREFIXES = [
  '/health',
  '/apm',
  '/traces',
  '/guardian/policies',
  '/guardian/assignments',
];

const PATH_TO_CATEGORY: Array<{ prefix: string; category: string }> = [
  { prefix: '/alloy', category: 'continuum' },
  { prefix: '/governance', category: 'governance' },
  { prefix: '/memory', category: 'memory' },
  { prefix: '/workflow-runs', category: 'continuum' },
  { prefix: '/workflows', category: 'continuum' },
  { prefix: '/agents', category: 'agents' },
  { prefix: '/actions', category: 'continuum' },
  { prefix: '/ai', category: 'ai' },
  { prefix: '/decisions', category: 'decisions' },
  { prefix: '/self-model', category: 'self-model' },
  { prefix: '/verifier', category: 'verifier' },
  { prefix: '/skill-library', category: 'skills' },
  { prefix: '/plans', category: 'plans' },
  { prefix: '/reflections', category: 'reflections' },
  { prefix: '/nexus', category: 'nexus' },
  { prefix: '/signals', category: 'signals' },
  { prefix: '/recommendations', category: 'continuum' },
  { prefix: '/models', category: 'ai' },
  { prefix: '/prompts', category: 'ai' },
];

/**
 * Build the path to match against — handle both the case where this
 * middleware runs inside a sub-router (req.path is "/alloy/...") and
 * where it runs at app level (req.path is "/api/alloy/..."). We
 * normalize by stripping a leading "/api" segment if present.
 */
function normalizedPath(req: Request): string {
  // baseUrl = "/api" when mounted there, "" otherwise. req.path is
  // relative to baseUrl. Combine then strip the "/api" prefix so our
  // matcher works the same regardless of mount depth.
  const combined = `${req.baseUrl ?? ''}${req.path}`;
  if (combined.startsWith('/api/')) return combined.slice(4);
  if (combined === '/api') return '/';
  return combined || req.path;
}

const traceWriter = new TraceWriter(defaultTraceStore);

/**
 * Map a request path to its policy category. Falls back to "general" so
 * every non-skipped agent-facing route is policy-checked, audit-logged,
 * and trace-emitted — no silent bypass.
 */
function deriveCategory(path: string, override?: string): string {
  if (override) return override;
  for (const { prefix, category } of PATH_TO_CATEGORY) {
    if (path.startsWith(prefix)) return category;
  }
  return 'general';
}

function shouldSkip(path: string): boolean {
  return SKIP_PATH_PREFIXES.some((p) => path.startsWith(p));
}

/**
 * Server-side tier derivation. Never trust client headers for security
 * tier — derive from the authenticated user's roles or trusted internal
 * call markers (validated upstream by auth middleware). Falls back to the
 * configured default tier (safer-than-allow).
 */
function deriveTier(req: Request, defaultTier: PolicyTier): PolicyTier {
  const user = req.user;
  const roles = user?.roles ?? [];

  if ((roles as string[]).includes('system') || (roles as string[]).includes('internal-service')) {
    return 'operator-approved';
  }
  if (roles.includes('admin') || roles.includes('operator')) {
    return 'operator-approved';
  }
  if ((roles as string[]).includes('supervisor')) {
    return 'supervised';
  }
  return defaultTier;
}

/**
 * Express middleware: runs every matched mutating request through the
 * shared GuardianDecisionEngine, records the decision to the action
 * ledger, and emits a Trace Graph span linked to the request's traceId
 * (set upstream by traceEmitMiddleware).
 *
 * Read-only safe-method requests are skipped. Tier is derived server-side
 * from the authenticated user — never from client headers.
 */
export function guardianPolicyCheck(options: GuardianPolicyOptions = {}) {
  const enforce = options.enforce ?? ENFORCE_BY_DEFAULT;
  const defaultTier: PolicyTier = options.defaultTier ?? 'supervised';
  const fixedCategory = options.category;

  return function guardianPolicyMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }
    const matchPath = normalizedPath(req);
    if (shouldSkip(matchPath)) {
      next();
      return;
    }

    const category = deriveCategory(matchPath, fixedCategory);

    const engine = getGuardianEngine();
    const tier = deriveTier(req, defaultTier);

    const requestId = makeGuardianRequestId('api');
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;
    const agentHeader = req.headers['x-agent-id'];
    const agentId = Array.isArray(agentHeader) ? agentHeader[0] : agentHeader;
    const sessionId = (req as Request & { correlationId?: string }).correlationId ?? undefined;
    const traceId = (req as Request & { _traceId?: string })._traceId;

    // Resolve org-scoped tier overrides synchronously off the cache so a
    // single decide() call sees the same tier metadata as the rest of the
    // platform. Falls back to constants if the lookup fails.
    void runDecision();

    async function runDecision(): Promise<void> {
      let tierOverride:
        | { controls: import('@workspace/guardian').TierControlSet; riskLevel: number }
        | undefined;
      try {
        tierOverride = await getEffectiveTierOverride(orgId, tier);
      } catch (err) {
        logger.debug(
          { err, orgId, tier },
          '[guardian] tier override lookup failed; using constants',
        );
      }

      const decisionStartedAt = new Date().toISOString();
      const t0 = process.hrtime.bigint();

      const decision = engine.decide(
        {
          requestId,
          agentId: typeof agentId === 'string' ? agentId : undefined,
          sessionId,
          action: `${req.method}:${req.path}`,
          domain: category,
          tier,
          environment: process.env.NODE_ENV ?? 'development',
          context: {
            orgId,
            userId: user?.id ?? null,
            roles: user?.roles ?? [],
          },
        },
        tierOverride,
      );

      const latencyMs = Number(process.hrtime.bigint() - t0) / 1e6;

      res.setHeader('X-Guardian-Outcome', decision.outcome);
      res.setHeader('X-Guardian-Request-Id', requestId);
      if (decision.matchedRuleId) {
        res.setHeader('X-Guardian-Matched-Rule', decision.matchedRuleId);
      }

      void recordGuardianAction({
        request: {
          requestId,
          agentId: typeof agentId === 'string' ? agentId : undefined,
          sessionId,
          action: `${req.method}:${req.path}`,
          domain: category,
          tier,
          environment: process.env.NODE_ENV ?? 'development',
          context: {},
        },
        result: decision,
        orgId: typeof orgId === 'number' ? orgId : null,
        payload: {
          method: req.method,
          path: req.path,
          category,
        },
      });

      if (traceId) {
        try {
          traceWriter.appendSpan(traceId, {
            spanId: randomUUID(),
            name: `guardian:${decision.outcome}`,
            startedAt: decisionStartedAt,
            endedAt: new Date().toISOString(),
            latencyMs,
            status: decision.outcome === 'allow' ? 'ok' : 'error',
            errorMessage: decision.outcome === 'allow' ? undefined : decision.reason,
            attributes: {
              category,
              tier,
              method: req.method,
              path: req.path,
              outcome: decision.outcome,
              matchedRuleId: decision.matchedRuleId,
              requestId,
              enforced: enforce && decision.outcome !== 'allow',
            },
          });
        } catch (err) {
          logger.debug({ err, traceId }, '[guardian] trace span append failed');
        }
      }

      if (decision.outcome === 'allow') {
        next();
        return;
      }

      if (!enforce) {
        logger.warn(
          {
            requestId,
            outcome: decision.outcome,
            path: req.path,
            method: req.method,
            category,
            reason: decision.reason,
          },
          '[guardian] Policy decision recorded (enforcement disabled)',
        );
        next();
        return;
      }

      logger.warn(
        {
          requestId,
          outcome: decision.outcome,
          path: req.path,
          method: req.method,
          category,
          reason: decision.reason,
        },
        '[guardian] Request blocked by policy',
      );

      if (decision.outcome === 'deny') {
        res.status(403).json({
          success: false,
          error: 'Request denied by policy',
          code: 'GUARDIAN_DENY',
          requestId,
          reason: decision.reason,
          matchedRuleId: decision.matchedRuleId,
        });
        return;
      }

      // Route the gated action through the existing covenant-policy
      // approval system so an operator has something to approve. Surfaced
      // back to the caller as `approvalRequestId` (distinct from the
      // Guardian decision `requestId`). Fail-closed: if the approval gate
      // cannot create a request, the caller gets 503 — never a 202 with
      // a null id, since "approve later" with no id is unrecoverable.
      let approvalRequestId: number;
      try {
        const { createApprovalRequest } = await import('@szl-holdings/covenant-policy');
        const approval = await createApprovalRequest({
          orgId: typeof orgId === 'number' ? orgId : null,
          resourceType: 'guardian.api.request',
          resourceId: `${req.method}:${req.path}`,
          title: `Guardian approval required: ${req.method} ${req.path}`,
          description: decision.reason,
          actionClass: category,
          priority: decision.outcome === 'require-dual-approval' ? 'critical' : 'high',
          requestedById: typeof user?.id === 'number' ? user.id : null,
          requestedByRole: (user?.roles?.[0] as string | undefined) ?? undefined,
          requiredApproverRole: decision.requiredApprovers?.[0],
          correlationId: requestId,
          serviceAttribution: 'guardian.policy-middleware',
          payload: {
            requestId,
            method: req.method,
            path: req.path,
            category,
            tier,
            matchedRuleId: decision.matchedRuleId ?? null,
            requiredApprovers: decision.requiredApprovers ?? [],
          },
          metadata: { source: 'guardian-policy', traceId },
        });
        approvalRequestId = approval.id;
        res.setHeader('X-Guardian-Approval-Id', String(approval.id));
      } catch (err) {
        logger.error(
          { err, requestId, path: req.path, method: req.method, category },
          '[guardian] approval request creation failed — failing closed',
        );
        res.status(503).json({
          success: false,
          error: 'Approval gate unavailable; action blocked',
          code: 'GUARDIAN_APPROVAL_GATE_UNAVAILABLE',
          requestId,
          outcome: decision.outcome,
          reason: decision.reason,
          matchedRuleId: decision.matchedRuleId,
        });
        return;
      }

      res.status(202).json({
        success: false,
        status: 'approval-required',
        code: 'GUARDIAN_APPROVAL_REQUIRED',
        requestId,
        approvalRequestId,
        outcome: decision.outcome,
        reason: decision.reason,
        requiredApprovers: decision.requiredApprovers ?? [],
        matchedRuleId: decision.matchedRuleId,
      });
    }
  };
}

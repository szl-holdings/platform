/**
 * AI Control Plane Middleware
 *
 * Wraps every AI/Forge inference endpoint with:
 *   1. PII redaction on inbound prompt text (field-by-field, in-place)
 *   2. Prompt-injection scanning
 *   3. Agent-tier policy enforcement (tier derived from authenticated user roles)
 *   4. Budget check (hard-stop if org is over limit)
 *   5. Post-response cost recording
 *
 * Design notes:
 *   - Agent tier is derived server-side from req.user.roles — never from
 *     client-supplied headers.
 *   - Policy routeClass is not forwarded from the request body. Each
 *     endpoint has a fixed, authoritative policy routeClass set by the
 *     server.  Only route classes present in the tier definitions are used.
 *   - PII redaction is applied per-field so concatenation mismatches
 *     cannot leave raw PII in any individual body field.
 *   - Cost is recorded with approximate per-token pricing so budget
 *     enforcement produces non-zero costUsd values.
 */

import {
  type AgentTierName,
  costController,
  evaluatePolicy,
  modelRouter,
  piiRedactor,
  type RouteClass,
  scanForInjection,
} from '@szl-holdings/ai-control-plane';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

// ---------------------------------------------------------------------------
// Approximate token pricing (USD per token) for common providers/models.
// These are conservative public estimates; real billing comes from provider.
// ---------------------------------------------------------------------------

const PROVIDER_PRICING: Record<string, { inputPerToken: number; outputPerToken: number }> = {
  openai: { inputPerToken: 0.0000025, outputPerToken: 0.00001 },
  anthropic: { inputPerToken: 0.000003, outputPerToken: 0.000015 },
  huggingface: { inputPerToken: 0.000001, outputPerToken: 0.000002 },
  local: { inputPerToken: 0, outputPerToken: 0 },
};

function getProviderPricing(provider: string): { inputPerToken: number; outputPerToken: number } {
  const key = provider.toLowerCase();
  for (const [prefix, pricing] of Object.entries(PROVIDER_PRICING)) {
    if (key.startsWith(prefix)) return pricing;
  }
  return { inputPerToken: 0.000001, outputPerToken: 0.000002 };
}

// ---------------------------------------------------------------------------
// Tier resolution — server-authoritative from authenticated user roles
// ---------------------------------------------------------------------------

function resolveTierFromRoles(roles: string[] = []): AgentTierName {
  if (roles.includes('autonomous_agent')) return 'autonomous';
  if (roles.includes('super_admin') || roles.includes('admin') || roles.includes('operator'))
    return 'operator';
  if (roles.includes('analyst')) return 'analyst';
  return 'assistant';
}

// ---------------------------------------------------------------------------
// PII redaction helpers — operate per-field so each field is independently
// scanned and mutated without cross-field string matching issues.
// ---------------------------------------------------------------------------

/** Redact a single string field. Returns the (possibly mutated) string. */
function redactField(text: string): { redacted: string; types: string[] } {
  const result = piiRedactor.redact(text);
  return { redacted: result.redacted, types: result.detectedTypes };
}

/** Redact all text fields in the body in-place. Returns all detected PII types. */
function redactBodyInPlace(body: Record<string, unknown>): string[] {
  const allTypes: string[] = [];

  // messages array: [{role, content}]
  if (Array.isArray(body['messages'])) {
    for (const m of body['messages'] as Array<{ content?: unknown }>) {
      if (typeof m?.content === 'string') {
        const { redacted, types } = redactField(m.content);
        if (types.length > 0) {
          m.content = redacted;
          allTypes.push(...types);
        }
      }
    }
  }

  // Scalar text fields
  for (const field of ['input', 'objective', 'context', 'query', 'content', 'prompt'] as const) {
    const val = body[field];
    if (typeof val === 'string') {
      const { redacted, types } = redactField(val);
      if (types.length > 0) {
        body[field] = redacted;
        allTypes.push(...types);
      }
    }
  }

  return [...new Set(allTypes)];
}

/** Collect all prompt text for injection scanning without modifying the body. */
function collectPromptText(body: Record<string, unknown>): string {
  const parts: string[] = [];
  if (Array.isArray(body['messages'])) {
    for (const m of body['messages'] as Array<{ content?: unknown }>) {
      if (typeof m?.content === 'string') parts.push(m.content);
    }
  }
  for (const field of ['input', 'objective', 'context', 'query', 'content', 'prompt'] as const) {
    if (typeof body[field] === 'string') parts.push(body[field] as string);
  }
  return parts.join('\n');
}

/** Rough token estimate: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// Exported middleware factory
// ---------------------------------------------------------------------------

export interface AiControlPlaneOptions {
  /**
   * Route class used for policy enforcement. Must be one of the values in
   * AgentTierDefinition.allowedRouteClasses (e.g. "reasoning", "planning",
   * "extraction", "triage", "classification", "summarization", "generation").
   * If omitted, the route-class policy check is skipped.
   */
  policyRouteClass?: string;
  /**
   * Route class label used for cost recording. Can be any descriptive string.
   * Defaults to policyRouteClass or "inference".
   */
  costRouteClass?: string;
  /** Block (HTTP 400) when high-severity injection is detected. Default: true. */
  blockOnInjection?: boolean;
  /** Block (HTTP 429) when the org budget hard-stop is triggered. Default: true. */
  blockOnBudgetExceeded?: boolean;
}

/**
 * Returns an Express middleware that applies full AI control-plane checks.
 * Mount this before AI/Forge route handlers.
 */
export function aiControlPlane(
  opts: AiControlPlaneOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    policyRouteClass,
    costRouteClass = policyRouteClass ?? 'inference',
    blockOnInjection = true,
    blockOnBudgetExceeded = true,
  } = opts;

  return function controlPlaneMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only process bodies with text content (skip GET, HEAD, OPTIONS, etc.)
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const orgId = String(req.user?.orgs?.[0]?.orgId ?? 'default');

    // ── 1. PII redaction (in-place, field-by-field) ─────────────────────────
    let piiTypes: string[] = [];
    if (hasBody) {
      piiTypes = redactBodyInPlace(body);
      if (piiTypes.length > 0) {
        logger.info(
          {
            event: 'ai_control_plane.pii_redacted',
            orgId,
            detectedTypes: piiTypes,
            count: piiTypes.length,
            path: req.path,
          },
          'PII redacted from AI request',
        );
        res.setHeader('X-AI-PII-Redacted', piiTypes.join(','));
      }
    }

    // ── 2. Prompt-injection scan ────────────────────────────────────────────
    //    Scan after redaction so PII is not logged.
    const promptText = hasBody ? collectPromptText(body) : '';
    if (promptText) {
      const injectionResult = scanForInjection(promptText);
      if (!injectionResult.safe) {
        logger.warn(
          {
            event: 'ai_control_plane.injection_detected',
            orgId,
            severity: injectionResult.severity,
            path: req.path,
          },
          'Prompt injection detected by AI control plane',
        );

        if (blockOnInjection && injectionResult.severity === 'high') {
          res.status(400).json({
            error: 'Request blocked by AI safety policy',
            code: 'PROMPT_INJECTION_DETECTED',
            severity: injectionResult.severity,
          });
          return;
        }
        res.setHeader('X-AI-Injection-Warning', injectionResult.severity);
      }
    }

    // ── 3. Policy enforcement ───────────────────────────────────────────────
    //    Tier is derived server-side from authenticated user roles.
    const tier = resolveTierFromRoles(req.user?.roles ?? []);
    const policyDecision = evaluatePolicy({
      tier,
      orgId,
      // Only include routeClass if a server-authoritative value was provided.
      ...(policyRouteClass !== undefined ? { routeClass: policyRouteClass } : {}),
    });

    if (!policyDecision.allowed) {
      const blocker = policyDecision.violations.find((v) => v.severity === 'block');
      logger.warn(
        {
          event: 'ai_control_plane.policy_blocked',
          orgId,
          tier,
          code: blocker?.code,
          path: req.path,
        },
        'AI request blocked by policy engine',
      );
      res.status(403).json({
        error: 'AI request blocked by policy',
        code: blocker?.code ?? 'POLICY_VIOLATION',
        message: blocker?.message,
      });
      return;
    }

    if (policyDecision.requiresApproval) {
      res.setHeader('X-AI-Approval-Required', policyDecision.approvalLevel);
    }

    // ── 4. Control-plane model route resolution ─────────────────────────────
    //    Resolves the recommended model endpoint for this request class.
    //    Result is stored in res.locals.controlPlaneRoute so inference
    //    handlers can use it (or their own routing logic as a fallback).
    if (policyRouteClass !== undefined) {
      try {
        const routeResult = modelRouter.route({
          routeClass: policyRouteClass as RouteClass,
          orgId,
          agentTier: tier,
          promptTokenEstimate: promptText ? estimateTokens(promptText) : undefined,
        });
        res.locals['controlPlaneRoute'] = routeResult;
        res.setHeader('X-AI-Route-Class', policyRouteClass);
        res.setHeader(
          'X-AI-Resolved-Model',
          `${routeResult.endpoint.provider}/${routeResult.endpoint.model}`,
        );
      } catch {
        // Route resolution failure is non-fatal — handlers fall back to their own routing.
      }
    }

    // ── 5. Budget check ─────────────────────────────────────────────────────
    const budgetCheck = costController.isAllowed(orgId);
    if (!budgetCheck.allowed) {
      logger.warn(
        {
          event: 'ai_control_plane.budget_exceeded',
          orgId,
          tier,
          reason: budgetCheck.reason,
          path: req.path,
        },
        'AI request blocked by budget hard-stop',
      );
      if (blockOnBudgetExceeded) {
        res.status(429).json({
          error: 'AI budget limit reached',
          code: 'BUDGET_HARD_STOP',
          message: budgetCheck.reason,
        });
        return;
      }
      res.setHeader('X-AI-Budget-Warning', budgetCheck.reason ?? 'budget_limit_approaching');
    }

    // ── 6. Post-response cost recording ────────────────────────────────────
    //    Uses res.locals.aiUsage if set by the handler, otherwise falls back
    //    to the control-plane-resolved model endpoint for pricing context.
    const promptCharCount = promptText.length;

    res.on('finish', () => {
      try {
        const usage = res.locals['aiUsage'] as
          | {
              promptTokens?: number;
              completionTokens?: number;
              model?: string;
              provider?: string;
              routeClass?: string;
            }
          | undefined;

        const controlPlaneRoute = res.locals['controlPlaneRoute'] as
          | {
              endpoint: {
                provider: string;
                model: string;
                costPerInputToken?: number;
                costPerOutputToken?: number;
              };
            }
          | undefined;

        const provider = usage?.provider ?? controlPlaneRoute?.endpoint.provider ?? 'unknown';
        const model = usage?.model ?? controlPlaneRoute?.endpoint.model ?? 'unknown';
        const inputTokens =
          usage?.promptTokens ?? estimateTokens(promptCharCount > 0 ? promptText : '');
        const outputTokens = usage?.completionTokens ?? 0;

        const inputCostPerToken =
          controlPlaneRoute?.endpoint.costPerInputToken ??
          getProviderPricing(provider).inputPerToken;
        const outputCostPerToken =
          controlPlaneRoute?.endpoint.costPerOutputToken ??
          getProviderPricing(provider).outputPerToken;

        costController.record({
          orgId,
          provider,
          model,
          routeClass: usage?.routeClass ?? costRouteClass,
          inputTokens,
          outputTokens,
          inputCostPerToken,
          outputCostPerToken,
        });
      } catch {
        // Cost recording must never crash the app
      }
    });

    next();
  };
}

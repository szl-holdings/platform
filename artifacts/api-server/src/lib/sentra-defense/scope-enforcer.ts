/**
 * Scope Boundary Enforcer
 *
 * Every active-response and counter-move action MUST pass through this module.
 * It refuses any action whose target is not in the owned-asset registry, logs
 * a scope_violation to the evidence ledger, and surfaces an operator alert.
 *
 * This is the legal guardrail in code — not a policy document.
 */

import { lookupAsset } from './owned-assets.js';
import { logger } from '../logger.js';

export interface ScopeCheckInput {
  action: string;
  targetType: string;
  targetValue: string;
  requestedBy?: string;
  context?: Record<string, unknown>;
}

export type ScopeCheckResult =
  | { allowed: true; reason: string }
  | { allowed: false; reason: string; violationType: 'out_of_scope' | 'action_not_permitted' };

export function checkScope(input: ScopeCheckInput): ScopeCheckResult {
  const { action, targetType, targetValue } = input;

  if (!targetValue || targetValue.trim() === '') {
    return {
      allowed: false,
      reason: 'Target value is empty — action refused',
      violationType: 'out_of_scope',
    };
  }

  const result = lookupAsset(targetType, targetValue, action);

  if (!result.found) {
    const msg = `[ScopeEnforcer] BLOCKED: target "${targetValue}" (${targetType}) is not in owned-asset registry. Action: ${action}`;
    logger.warn({ action, targetType, targetValue, requestedBy: input.requestedBy }, msg);
    return {
      allowed: false,
      reason: `Target "${targetValue}" is not in the owned-asset registry`,
      violationType: 'out_of_scope',
    };
  }

  if (!result.actionAllowed) {
    const msg = `[ScopeEnforcer] BLOCKED: action "${action}" not permitted on asset "${result.asset?.id}" (${targetType}:${targetValue})`;
    logger.warn({ action, targetType, targetValue, assetId: result.asset?.id }, msg);
    return {
      allowed: false,
      reason: `Action "${action}" is not permitted on asset type "${result.asset?.type}"`,
      violationType: 'action_not_permitted',
    };
  }

  logger.debug({ action, targetType, targetValue }, '[ScopeEnforcer] ALLOWED');
  return {
    allowed: true,
    reason: `Target is registered asset "${result.asset?.id}" and action is permitted`,
  };
}

/**
 * Throws if the action is out of scope.
 * Use this at the action-execution site as a hard invariant.
 */
export function assertScope(input: ScopeCheckInput): void {
  const result = checkScope(input);
  if (!result.allowed) {
    throw new ScopeViolationError(result.reason, result.violationType, input);
  }
}

export class ScopeViolationError extends Error {
  readonly violationType: 'out_of_scope' | 'action_not_permitted';
  readonly input: ScopeCheckInput;

  constructor(
    message: string,
    violationType: 'out_of_scope' | 'action_not_permitted',
    input: ScopeCheckInput,
  ) {
    super(message);
    this.name = 'ScopeViolationError';
    this.violationType = violationType;
    this.input = input;
  }
}

/**
 * SzlGuardrailAdapter — bridges SDK input/output guardrails to the Policy Engine.
 *
 * Implements SDK-style guardrail functions that internally call
 * policy-engine's evaluateFull() for covenant policy enforcement.
 *
 * Policy blocks → guardrail tripwires (SDK throws InputGuardrailTripwireTriggered)
 * Policy warnings → pass-through with logged alerts in Trace Graph
 *
 * IMPORTANT: This adapter is FAIL-CLOSED. If the Policy Engine is unavailable or
 * throws, the guardrail denies the action rather than permitting it. This is a
 * deliberate safety choice for a governed autonomous platform.
 */

import { evaluateFull, type FullEvaluationRequest } from '@szl-holdings/policy-engine';
import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import type { TraceStore } from '@workspace/trace-graph/store';

const log = {
  warn: (msg: string, meta?: unknown) =>
    console.warn(`[SzlGuardrailAdapter] ${msg}`, meta ?? ''),
  debug: (msg: string, meta?: unknown) =>
    console.debug(`[SzlGuardrailAdapter] ${msg}`, meta ?? ''),
};

export interface SzlGuardrailAdapterOptions {
  /**
   * Agent ID used in policy evaluation requests. Defaults to 'sdk-agent'.
   */
  agentId?: string;

  /**
   * Domain context for policy evaluation. Defaults to 'general'.
   */
  domain?: string;

  /**
   * Action name used in policy evaluation requests. Defaults to 'llm-generation'.
   */
  action?: string;

  /**
   * Trace store for recording guardrail decisions. Defaults to defaultTraceStore.
   */
  traceStore?: TraceStore;
}

export interface GuardrailCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason?: string;
}

/**
 * SzlGuardrailAdapter wraps the Policy Engine's evaluateFull() as SDK-compatible
 * guardrail check functions.
 */
export class SzlGuardrailAdapter {
  private readonly writer: TraceWriter;
  private readonly agentId: string;
  private readonly domain: string;
  private readonly action: string;

  constructor(options: SzlGuardrailAdapterOptions = {}) {
    this.writer = new TraceWriter(options.traceStore ?? defaultTraceStore);
    this.agentId = options.agentId ?? 'sdk-agent';
    this.domain = options.domain ?? 'general';
    this.action = options.action ?? 'llm-generation';
  }

  /**
   * Evaluate an input string through the Policy Engine.
   * Returns a GuardrailCheckResult indicating whether the input is allowed.
   *
   * Use this as the guardrail function passed to an Agent's inputGuardrails array.
   */
  async checkInput(
    input: string,
    traceId?: string,
  ): Promise<GuardrailCheckResult> {
    return this.evaluate(input, 'input', traceId);
  }

  /**
   * Evaluate an output string through the Policy Engine.
   * Returns a GuardrailCheckResult indicating whether the output is allowed.
   *
   * Use this as the guardrail function passed to an Agent's outputGuardrails array.
   */
  async checkOutput(
    output: string,
    traceId?: string,
  ): Promise<GuardrailCheckResult> {
    return this.evaluate(output, 'output', traceId);
  }

  private async evaluate(
    text: string,
    phase: 'input' | 'output',
    traceId?: string,
  ): Promise<GuardrailCheckResult> {
    const request: FullEvaluationRequest = {
      action: this.action,
      domain: this.domain,
      subject: { id: this.agentId, roles: [] },
      resource: { type: 'llm-generation', domain: this.domain },
      context: { phase, textLength: text.length },
      promptText: text,
    };

    let result;
    try {
      result = await evaluateFull(request);
    } catch (err) {
      // FAIL-CLOSED: deny the action when the Policy Engine is unavailable.
      // Permitting actions on evaluator failure would silently bypass governance
      // on this platform, which is unacceptable.
      log.warn(
        `Policy evaluation unavailable for ${phase} check on domain=${this.domain}; denying by default.`,
        err,
      );
      return {
        allowed: false,
        requiresApproval: false,
        blockedReason: 'Policy evaluation unavailable',
      };
    }

    if (traceId) {
      try {
        const guardId = `szl-policy:${this.domain}:${phase}`;
        let outcome: 'pass' | 'block' | 'warn' | 'require-approval' = 'pass';
        if (!result.allowed) {
          outcome = 'block';
        } else if (result.requiresApproval) {
          outcome = 'require-approval';
        }

        this.writer.appendGuardrailResult(traceId, {
          guardId,
          tier: this.domain,
          outcome,
          reason: result.blockedReason,
        });
      } catch (err) {
        log.debug(`Failed to persist guardrail result in Trace Graph for traceId=${traceId}`, err);
      }
    }

    return {
      allowed: result.allowed,
      requiresApproval: result.requiresApproval,
      blockedReason: result.blockedReason,
    };
  }

  /**
   * Build an SDK input guardrail function suitable for use in an Agent's config.
   *
   * Usage:
   *   const adapter = new SzlGuardrailAdapter({ domain: 'maritime' });
   *   const agent = new Agent({ inputGuardrails: [adapter.inputGuardrailFn()], ... });
   */
  inputGuardrailFn(): (input: string, traceId?: string) => Promise<GuardrailCheckResult> {
    return (input, traceId) => this.checkInput(input, traceId);
  }

  /**
   * Build an SDK output guardrail function suitable for use in an Agent's config.
   */
  outputGuardrailFn(): (output: string, traceId?: string) => Promise<GuardrailCheckResult> {
    return (output, traceId) => this.checkOutput(output, traceId);
  }
}

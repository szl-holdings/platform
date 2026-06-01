import { piiRedactor, scanForInjection } from '@szl-holdings/ai-control-plane';
import { evaluateFull, type FullEvaluationRequest } from '@szl-holdings/policy-engine';
import { globalCollector } from '@workspace/cognitive-observability';
import type { PolicyTier } from '@workspace/guardian';
import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';
import type { ToolManifest, ToolPolicyTier } from './manifest.js';
import { ToolRateLimiter } from './rate-limiter.js';
import { type ToolRegistry, defaultToolRegistry } from './registry.js';
import { validateAgainstSchema } from './schema-validator.js';

export type ToolHandler = (input: unknown, manifest: ToolManifest) => Promise<unknown>;

const TOOL_TIER_TO_GUARDIAN_TIER: Record<ToolPolicyTier, PolicyTier> = {
  'advisory-only': 'advisory',
  'internal-workflow': 'supervised',
  'operator-assisted': 'operator-approved',
  'executive-facing': 'dual-approved',
  'regulated-workflow': 'regulated',
  'external-client-facing': 'supervised',
  'autonomous-reversible': 'sovereign',
  'human-approval-mandatory': 'operator-approved',
};

export interface GatewayInvocationResult {
  success: boolean;
  output?: unknown;
  error?: string;
  traceId?: string;
  decisionOutcome?: string;
  latencyMs?: number;
  rateLimitRetryAfterMs?: number;
  fallbackToolId?: string;
  schemaErrors?: string[];
  /** Non-empty when the tool returned an output that violates its declared outputSchema.
   * Execution still succeeded — this is a warn-level contract violation. */
  outputSchemaErrors?: string[];
}

export interface GatewayInvokeContext {
  requestId: string;
  agentId?: string;
  sessionId?: string;
  workflowId?: string;
  callerId?: string;
  dryRun?: boolean;
  _fallbackDepth?: number;
}

export class ToolMeshGateway {
  private readonly registry: ToolRegistry;
  private readonly guardian: GuardianDecisionEngine;
  private readonly traceWriter: TraceWriter;
  private readonly rateLimiter: ToolRateLimiter;
  private readonly handlers = new Map<string, ToolHandler>();

  private static readonly MAX_FALLBACK_DEPTH = 3;

  constructor(
    registry: ToolRegistry = defaultToolRegistry,
    guardian: GuardianDecisionEngine = new GuardianDecisionEngine(),
    traceWriter: TraceWriter = new TraceWriter(new InMemoryTraceStore()),
    rateLimiter: ToolRateLimiter = new ToolRateLimiter(),
  ) {
    this.registry = registry;
    this.guardian = guardian;
    this.traceWriter = traceWriter;
    this.rateLimiter = rateLimiter;
  }

  registerHandler(toolId: string, handler: ToolHandler): void {
    this.handlers.set(toolId, handler);
  }

  async invoke(
    toolId: string,
    input: unknown,
    context: GatewayInvokeContext,
  ): Promise<GatewayInvocationResult> {
    const fallbackDepth = context._fallbackDepth ?? 0;

    const manifest = this.registry.get(toolId);
    if (!manifest) {
      return { success: false, error: `Tool not found: ${toolId}` };
    }

    if (!manifest.enabled) {
      return { success: false, error: `Tool is disabled: ${toolId}` };
    }

    if (!manifest.inputSchema) {
      return {
        success: false,
        error: `Tool '${toolId}' is missing required inputSchema — runtime invocation requires a schema-bound contract. Register a JSON Schema inputSchema on the manifest.`,
        schemaErrors: ['inputSchema is absent'],
      };
    }

    const schemaResult = validateAgainstSchema(toolId, input, manifest.inputSchema);
    if (!schemaResult.valid) {
      return {
        success: false,
        error: `Schema validation failed for tool '${toolId}': ${schemaResult.errors[0]}`,
        schemaErrors: schemaResult.errors,
      };
    }

    // Unified guardrail chain (PII scan + policy-engine + guardian).
    let stringifiedInput = '';
    try {
      stringifiedInput = typeof input === 'string' ? input : JSON.stringify(input);
    } catch {
      stringifiedInput = '';
    }
    const guardianTierForFull =
      TOOL_TIER_TO_GUARDIAN_TIER[manifest.policyTier] ?? 'supervised';
    const fullEvalRequest: FullEvaluationRequest = {
      action: `tool:${toolId}`,
      subject: { id: context.agentId ?? 'unknown-agent', roles: ['agent'] },
      resource: { type: 'tool', id: toolId, attributes: { tier: guardianTierForFull } },
      context: { requestId: context.requestId, sessionId: context.sessionId },
      ...(manifest.domainTags[0] ? { domain: manifest.domainTags[0] } : {}),
      ...(stringifiedInput ? { promptText: stringifiedInput } : {}),
    };
    const fullEval = evaluateFull(fullEvalRequest, {
      piiScanner: (text: string) => {
        const inj = scanForInjection(text);
        const pii = piiRedactor.redact(text);
        return {
          hasPii: !pii.safe,
          hasInjection: inj.detected,
          patterns: [...inj.patterns, ...pii.detectedTypes],
          redacted: pii.redacted,
        };
      },
      guardianCheck: (req: { action: string; domain?: string }) => {
        const decision = this.guardian.decide({
          requestId: context.requestId,
          agentId: context.agentId,
          sessionId: context.sessionId,
          workflowId: context.workflowId,
          action: req.action,
          domain: req.domain,
          tier: guardianTierForFull,
          context: { toolId, input },
        });
        return { outcome: decision.outcome, reason: decision.reason };
      },
    });
    // Fail-closed on injection patterns at this boundary.
    if (fullEval.piiScan?.hasInjection) {
      globalCollector.recordKnown('tool_error_rate', 1, {
        toolId,
        errorType: 'injection_blocked',
      });
      return {
        success: false,
        error: `Tool invocation blocked — prompt-injection pattern detected in input: ${fullEval.piiScan.patterns[0] ?? 'pattern matched'}`,
        decisionOutcome: 'deny',
      };
    }
    if (!fullEval.allowed && fullEval.blockedReason) {
      globalCollector.recordKnown('tool_error_rate', 1, {
        toolId,
        errorType: 'guardrail_blocked',
      });
      return {
        success: false,
        error: `Tool invocation blocked by unified guardrail chain: ${fullEval.blockedReason}`,
        decisionOutcome: 'deny',
      };
    }
    if (fullEval.requiresApproval || fullEval.requiresDualApproval) {
      return {
        success: false,
        error: 'Tool invocation requires human approval (unified guardrail chain).',
        decisionOutcome: fullEval.requiresDualApproval
          ? 'require-dual-approval'
          : 'require-approval',
      };
    }

    const rateLimitCheck = this.rateLimiter.check(toolId, manifest.rateLimits);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.reason,
        rateLimitRetryAfterMs: rateLimitCheck.retryAfterMs,
      };
    }

    // Manifest-level approval gate.
    if (manifest.approvalRequired) {
      return {
        success: false,
        error: `Tool invocation requires human approval: tool '${toolId}' is approval-gated (approvalRequired=true)`,
        decisionOutcome: 'require-approval',
      };
    }

    if (context.dryRun) {
      return {
        success: true,
        output: {
          dryRun: true,
          toolId,
          input,
          message: `Dry run — no side effects executed for tool '${manifest.name}'`,
        },
        decisionOutcome: 'allow',
      };
    }

    const handler = this.handlers.get(toolId);
    if (!handler) {
      return { success: false, error: `No handler registered for tool: ${toolId}` };
    }

    const emitTrace = manifest.observabilityHooks.emitTrace;
    const traceId = `tool-${toolId}-${Date.now()}`;
    const trace = emitTrace
      ? this.traceWriter.startTrace({ traceId, ...context, model: undefined })
      : { traceId };

    this.rateLimiter.increment(toolId);
    const t0 = Date.now();

    try {
      const output = await this.executeWithTimeout(handler, input, manifest);
      const latencyMs = Date.now() - t0;
      this.rateLimiter.decrement(toolId);

      // Output schema validation — warn on violation, do not block execution.
      // Violations are surfaced in the result and emitted as a metric so
      // downstream consumers (verifier, memory writer, next step) can detect
      // that the output may not match the declared contract.
      let outputSchemaErrors: string[] | undefined;
      if (manifest.outputSchema) {
        const outputValidation = validateAgainstSchema(`${toolId}:output`, output, manifest.outputSchema);
        if (!outputValidation.valid) {
          outputSchemaErrors = outputValidation.errors;
          if (manifest.observabilityHooks.emitMetrics) {
            globalCollector.recordKnown('tool_error_rate', 1, {
              toolId,
              toolName: manifest.name,
              reason: 'output_schema_violation',
            });
          }
        }
      }

      if (emitTrace) {
        this.traceWriter.appendToolCall(traceId, {
          toolId,
          toolName: manifest.name,
          success: true,
          retries: 0,
          approvalRequired: manifest.approvalRequired,
          latencyMs,
        });
        this.traceWriter.completeTrace(traceId, { status: 'completed', latencyMs });
      }

      if (manifest.observabilityHooks.emitMetrics) {
        globalCollector.recordKnown('latency_ms', latencyMs, {
          toolId,
          toolName: manifest.name,
          domain: manifest.domainTags[0] ?? 'custom',
        });
        if (!outputSchemaErrors) {
          globalCollector.recordKnown('tool_error_rate', 0, { toolId });
        }
      }

      return {
        success: true,
        output,
        traceId: trace.traceId,
        decisionOutcome: 'allow',
        latencyMs,
        ...(outputSchemaErrors ? { outputSchemaErrors } : {}),
      };
    } catch (err) {
      const latencyMs = Date.now() - t0;
      this.rateLimiter.decrement(toolId);
      const message = err instanceof Error ? err.message : String(err);

      if (emitTrace) {
        this.traceWriter.appendToolCall(traceId, {
          toolId,
          toolName: manifest.name,
          success: false,
          retries: 0,
          approvalRequired: manifest.approvalRequired,
          latencyMs,
          errorCode: 'TOOL_ERROR',
        });
        this.traceWriter.recordError(traceId, 'TOOL_ERROR', message);
      }

      if (manifest.observabilityHooks.emitMetrics) {
        globalCollector.recordKnown('latency_ms', latencyMs, {
          toolId,
          toolName: manifest.name,
          domain: manifest.domainTags[0] ?? 'custom',
        });
        globalCollector.recordKnown('tool_error_rate', 1, { toolId });
      }

      if (fallbackDepth < ToolMeshGateway.MAX_FALLBACK_DEPTH) {
        const fallbackResult = await this.tryFallbackViaInvoke(
          toolId,
          input,
          context,
          manifest,
          fallbackDepth,
        );
        if (fallbackResult) {
          if (emitTrace) {
            this.traceWriter.completeTrace(traceId, {
              status: 'completed',
              latencyMs: fallbackResult.latencyMs ?? latencyMs,
            });
          }
          return { ...fallbackResult, traceId: trace.traceId };
        }
      }

      if (emitTrace) {
        this.traceWriter.completeTrace(traceId, { status: 'failed', latencyMs });
      }

      return {
        success: false,
        error: message,
        traceId: trace.traceId,
        decisionOutcome: 'allow',
        latencyMs,
      };
    }
  }

  private async executeWithTimeout(
    handler: ToolHandler,
    input: unknown,
    manifest: ToolManifest,
  ): Promise<unknown> {
    const timeoutMs = manifest.timeoutMs;
    return Promise.race([
      handler(input, manifest),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tool '${manifest.id}' timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  private async tryFallbackViaInvoke(
    _failedToolId: string,
    input: unknown,
    context: GatewayInvokeContext,
    manifest: ToolManifest,
    currentDepth: number,
  ): Promise<GatewayInvocationResult | null> {
    const fallbackMode = manifest.failureModes.find((fm) => fm.fallbackToolId);
    if (!fallbackMode?.fallbackToolId) return null;

    const fallbackId = fallbackMode.fallbackToolId;
    if (!this.registry.get(fallbackId)) return null;
    if (!this.handlers.has(fallbackId)) return null;

    const fallbackContext: GatewayInvokeContext = {
      ...context,
      requestId: `${context.requestId}-fallback-${currentDepth + 1}`,
      _fallbackDepth: currentDepth + 1,
    };

    const result = await this.invoke(fallbackId, input, fallbackContext);
    if (result.success) {
      return { ...result, fallbackToolId: fallbackId };
    }
    return null;
  }
}

export const defaultGateway = new ToolMeshGateway();

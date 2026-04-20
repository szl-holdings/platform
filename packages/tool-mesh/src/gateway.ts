import { globalCollector } from '@workspace/cognitive-observability';
import type { PolicyTier } from '@workspace/guardian';
import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';
import type { ToolManifest, ToolPolicyTier } from './manifest.js';
import { ToolRateLimiter } from './rate-limiter.js';
import type { ToolRegistry } from './registry.js';
import { defaultToolRegistry } from './registry.js';
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

    const rateLimitCheck = this.rateLimiter.check(toolId, manifest.rateLimits);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.reason,
        rateLimitRetryAfterMs: rateLimitCheck.retryAfterMs,
      };
    }

    const guardianTier = TOOL_TIER_TO_GUARDIAN_TIER[manifest.policyTier] ?? 'supervised';
    const decision = this.guardian.decide({
      requestId: context.requestId,
      agentId: context.agentId,
      sessionId: context.sessionId,
      workflowId: context.workflowId,
      action: `tool:${toolId}`,
      domain: manifest.domainTags[0],
      tier: guardianTier,
      context: { toolId, input },
    });

    const needsApproval =
      manifest.approvalRequired ||
      decision.outcome === 'require-approval' ||
      decision.outcome === 'require-dual-approval';

    if (needsApproval) {
      const reason =
        decision.outcome === 'require-approval' || decision.outcome === 'require-dual-approval'
          ? decision.reason
          : `tool '${toolId}' is approval-gated (approvalRequired=true)`;
      return {
        success: false,
        error: `Tool invocation requires human approval: ${reason}`,
        decisionOutcome:
          decision.outcome === 'require-dual-approval'
            ? 'require-dual-approval'
            : 'require-approval',
      };
    }

    if (decision.outcome === 'deny') {
      return {
        success: false,
        error: `Guardian denied tool invocation: ${decision.reason}`,
        decisionOutcome: 'deny',
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
        globalCollector.recordKnown('tool_error_rate', 0, { toolId });
      }

      return {
        success: true,
        output,
        traceId: trace.traceId,
        decisionOutcome: 'allow',
        latencyMs,
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
    failedToolId: string,
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

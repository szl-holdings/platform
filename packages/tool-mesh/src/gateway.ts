import type { ToolManifest } from "./manifest.js";
import type { ToolRegistry } from "./registry.js";
import { defaultToolRegistry } from "./registry.js";
import { GuardianDecisionEngine } from "@workspace/guardian/decision-engine";
import { InMemoryTraceStore } from "@workspace/trace-graph/store";
import { TraceWriter } from "@workspace/trace-graph/writer";

export type ToolHandler = (input: unknown, manifest: ToolManifest) => Promise<unknown>;

export interface GatewayInvocationResult {
  success: boolean;
  output?: unknown;
  error?: string;
  traceId?: string;
  decisionOutcome?: string;
  latencyMs?: number;
}

export class ToolMeshGateway {
  private readonly registry: ToolRegistry;
  private readonly guardian: GuardianDecisionEngine;
  private readonly traceWriter: TraceWriter;
  private readonly handlers = new Map<string, ToolHandler>();

  constructor(
    registry: ToolRegistry = defaultToolRegistry,
    guardian: GuardianDecisionEngine = new GuardianDecisionEngine(),
    traceWriter: TraceWriter = new TraceWriter(new InMemoryTraceStore())
  ) {
    this.registry = registry;
    this.guardian = guardian;
    this.traceWriter = traceWriter;
  }

  registerHandler(toolId: string, handler: ToolHandler): void {
    this.handlers.set(toolId, handler);
  }

  async invoke(
    toolId: string,
    input: unknown,
    context: { requestId: string; agentId?: string; sessionId?: string; workflowId?: string }
  ): Promise<GatewayInvocationResult> {
    const manifest = this.registry.get(toolId);
    if (!manifest) {
      return { success: false, error: `Tool not found: ${toolId}` };
    }

    if (!manifest.enabled) {
      return { success: false, error: `Tool is disabled: ${toolId}` };
    }

    const decision = this.guardian.decide({
      requestId: context.requestId,
      agentId: context.agentId,
      sessionId: context.sessionId,
      workflowId: context.workflowId,
      action: `tool:${toolId}`,
      domain: manifest.domainTags[0],
      tier: manifest.policyTier,
      context: { toolId, input },
    });

    if (decision.outcome === "deny") {
      return {
        success: false,
        error: `Guardian denied tool invocation: ${decision.reason}`,
        decisionOutcome: "deny",
      };
    }

    if (decision.outcome === "require-approval") {
      return {
        success: false,
        error: `Tool invocation requires human approval: ${decision.reason}`,
        decisionOutcome: "require-approval",
      };
    }

    const handler = this.handlers.get(toolId);
    if (!handler) {
      return { success: false, error: `No handler registered for tool: ${toolId}` };
    }

    const traceId = `tool-${toolId}-${Date.now()}`;
    const trace = this.traceWriter.startTrace({
      traceId,
      ...context,
      model: undefined,
    });

    const t0 = Date.now();
    try {
      const output = await handler(input, manifest);
      const latencyMs = Date.now() - t0;

      this.traceWriter.appendToolCall(traceId, {
        toolId,
        toolName: manifest.name,
        success: true,
        retries: 0,
        approvalRequired: manifest.approvalRequired,
        latencyMs,
      });

      this.traceWriter.completeTrace(traceId, { status: "completed", latencyMs });

      return { success: true, output, traceId: trace.traceId, decisionOutcome: "allow", latencyMs };
    } catch (err) {
      const latencyMs = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);

      this.traceWriter.appendToolCall(traceId, {
        toolId,
        toolName: manifest.name,
        success: false,
        retries: 0,
        approvalRequired: manifest.approvalRequired,
        latencyMs,
        errorCode: "TOOL_ERROR",
      });
      this.traceWriter.recordError(traceId, "TOOL_ERROR", message);
      this.traceWriter.completeTrace(traceId, { status: "failed", latencyMs });

      return { success: false, error: message, traceId: trace.traceId, decisionOutcome: "allow", latencyMs };
    }
  }
}

export const defaultGateway = new ToolMeshGateway();

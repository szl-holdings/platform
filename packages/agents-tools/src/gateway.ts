import { ZodError } from "zod";
import type { TypedTool } from "./typed-tool.js";
import { defaultTypedToolRegistry, type TypedToolRegistry } from "./registry.js";
import { ToolInvocationError, ToolSchemaValidationError } from "./errors.js";

export interface TypedToolInvocationContext {
  requestId: string;
  runId?: string;
  stepId?: string;
  agentId?: string;
  dryRun?: boolean;
  /**
   * Set to true when the agents-core ApprovalGate has already cleared this invocation.
   * Bypasses the gateway-level approval block so that approval-required tools can execute
   * after the operator has granted approval in the approvals inbox.
   */
  preApproved?: boolean;
}

export interface TypedToolInvocationResult<TOutput = unknown> {
  success: boolean;
  output?: TOutput;
  error?: string;
  toolId: string;
  requestId: string;
  latencyMs: number;
  requiresApproval: boolean;
  approvalPending?: boolean;
}

export class TypedToolGateway {
  private readonly registry: TypedToolRegistry;

  constructor(registry: TypedToolRegistry = defaultTypedToolRegistry) {
    this.registry = registry;
  }

  async invoke<TOutput = unknown>(
    toolId: string,
    rawInput: unknown,
    context: TypedToolInvocationContext,
  ): Promise<TypedToolInvocationResult<TOutput>> {
    const startedAt = Date.now();
    const tool = this.registry.get(toolId) as TypedTool<unknown, TOutput> | undefined;

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolId}' not found in the typed registry`,
        toolId,
        requestId: context.requestId,
        latencyMs: Date.now() - startedAt,
        requiresApproval: false,
      };
    }

    let validatedInput: unknown;
    try {
      validatedInput = tool.inputSchema.parse(rawInput);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ToolSchemaValidationError(toolId, "input", err.issues);
      }
      throw err;
    }

    if (!tool.manifest.enabled) {
      return {
        success: false,
        error: `Tool '${toolId}' is disabled`,
        toolId,
        requestId: context.requestId,
        latencyMs: Date.now() - startedAt,
        requiresApproval: tool.manifest.approvalRequired,
      };
    }

    if (tool.manifest.approvalRequired && !context.preApproved) {
      return {
        success: false,
        error: `Tool '${toolId}' requires explicit approval — use agents-core approval gate before invoking`,
        toolId,
        requestId: context.requestId,
        latencyMs: Date.now() - startedAt,
        requiresApproval: true,
        approvalPending: true,
      };
    }

    if (context.dryRun) {
      return {
        success: true,
        output: undefined,
        toolId,
        requestId: context.requestId,
        latencyMs: Date.now() - startedAt,
        requiresApproval: tool.manifest.approvalRequired,
      };
    }

    try {
      const raw = await tool.handler(validatedInput, tool.manifest);

      let output: TOutput;
      try {
        output = tool.outputSchema.parse(raw) as TOutput;
      } catch (err) {
        if (err instanceof ZodError) {
          throw new ToolSchemaValidationError(toolId, "output", err.issues);
        }
        throw err;
      }

      return {
        success: true,
        output,
        toolId,
        requestId: context.requestId,
        latencyMs: Date.now() - startedAt,
        requiresApproval: tool.manifest.approvalRequired,
      };
    } catch (err) {
      if (err instanceof ToolSchemaValidationError) throw err;
      throw new ToolInvocationError(toolId, err instanceof Error ? err.message : String(err), err);
    }
  }
}

export const defaultTypedToolGateway = new TypedToolGateway();

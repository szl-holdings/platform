import type { TypedTool } from "./typed-tool.js";
import { ToolRegistrationError } from "./errors.js";

export interface TypedToolRegistry {
  register<TInput, TOutput>(tool: TypedTool<TInput, TOutput>): void;
  get(toolId: string): TypedTool | undefined;
  list(filter?: { domain?: string; requiresApproval?: boolean; enabled?: boolean }): TypedTool[];
  unregister(toolId: string): boolean;
  count(): number;
}

export class InMemoryTypedToolRegistry implements TypedToolRegistry {
  private readonly tools = new Map<string, TypedTool>();

  register<TInput, TOutput>(tool: TypedTool<TInput, TOutput>): void {
    if (!tool.manifest.id) {
      throw new ToolRegistrationError("(unknown)", "Tool manifest must have an id");
    }
    if (!tool.inputSchema) {
      throw new ToolRegistrationError(tool.manifest.id, "inputSchema is required — untyped tools are rejected");
    }
    if (!tool.outputSchema) {
      throw new ToolRegistrationError(tool.manifest.id, "outputSchema is required — untyped tools are rejected");
    }
    if (typeof tool.handler !== "function") {
      throw new ToolRegistrationError(tool.manifest.id, "handler must be a function");
    }
    this.tools.set(tool.manifest.id, tool as TypedTool);
  }

  get(toolId: string): TypedTool | undefined {
    return this.tools.get(toolId);
  }

  list(filter?: { domain?: string; requiresApproval?: boolean; enabled?: boolean }): TypedTool[] {
    let results = Array.from(this.tools.values());
    if (filter?.domain !== undefined) {
      results = results.filter((t) => t.manifest.domainTags.includes(filter.domain as never));
    }
    if (filter?.requiresApproval !== undefined) {
      results = results.filter((t) => t.manifest.approvalRequired === filter.requiresApproval);
    }
    if (filter?.enabled !== undefined) {
      results = results.filter((t) => t.manifest.enabled === filter.enabled);
    }
    return results;
  }

  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  count(): number {
    return this.tools.size;
  }
}

export const defaultTypedToolRegistry = new InMemoryTypedToolRegistry();

export function registerTypedTool<TInput, TOutput>(tool: TypedTool<TInput, TOutput>): void {
  defaultTypedToolRegistry.register(tool);
}

export function getTypedTool(toolId: string): TypedTool | undefined {
  return defaultTypedToolRegistry.get(toolId);
}

export function listTypedTools(filter?: {
  domain?: string;
  requiresApproval?: boolean;
  enabled?: boolean;
}): TypedTool[] {
  return defaultTypedToolRegistry.list(filter);
}

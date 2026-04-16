import { createLogger } from "./logger.js";
import { toolRegistry, enforceToolCallPolicy } from "./registry.js";
import type { ToolContext, ToolResult } from "./registry.js";

const logger = createLogger("tool-registry:executor");

export interface ExecutionRecord {
  id: string;
  toolId: string;
  toolName: string;
  callerId: string;
  orgId?: string;
  args: Record<string, unknown>;
  result: ToolResult;
  dryRun: boolean;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
}

export interface ExecuteOptions {
  dryRun?: boolean;
  timeout?: number;
}

class ToolExecutor {
  private records: ExecutionRecord[] = [];
  private readonly MAX_RECORDS = 10_000;

  async execute(
    toolId: string,
    args: Record<string, unknown>,
    context: ToolContext,
    options: ExecuteOptions = {},
  ): Promise<ToolResult & { executionId: string }> {
    const tool = toolRegistry.get(toolId);
    if (!tool) {
      return { success: false, error: `Tool '${toolId}' not found`, executionId: "" };
    }

    const isDryRun = options.dryRun ?? context.dryRun ?? false;
    const effectiveContext: ToolContext = { ...context, dryRun: isDryRun };

    const enforcement = enforceToolCallPolicy(toolId, effectiveContext);
    if (enforcement.blocked) {
      logger.warn({ toolId, callerId: context.callerId, reason: enforcement.reason }, "Tool execution blocked by policy");
      return { success: false, error: enforcement.reason ?? "Policy blocked", executionId: "" };
    }

    if (!tool.handler) {
      return { success: false, error: `Tool '${tool.name}' has no handler`, executionId: "" };
    }

    const startedAt = new Date().toISOString();
    const start = Date.now();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let result: ToolResult;

    try {
      if (isDryRun) {
        result = {
          success: true,
          output: { dryRun: true, toolId, args, message: "Dry run — no side effects executed" },
          auditEntry: `DRY_RUN: ${tool.name} by ${context.callerId}`,
        };
      } else {
        const timeout = options.timeout ?? tool.timeoutMs ?? 30_000;
        result = await Promise.race([
          tool.handler(args, effectiveContext),
          new Promise<ToolResult>((_, reject) =>
            setTimeout(() => reject(new Error(`Tool timeout after ${timeout}ms`)), timeout),
          ),
        ]);
      }
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : "Execution failed" };
    }

    const latencyMs = Date.now() - start;
    const completedAt = new Date().toISOString();

    const record: ExecutionRecord = {
      id: executionId,
      toolId,
      toolName: tool.name,
      callerId: context.callerId,
      orgId: context.orgId,
      args,
      result,
      dryRun: isDryRun,
      startedAt,
      completedAt,
      latencyMs,
    };

    this.records.unshift(record);
    if (this.records.length > this.MAX_RECORDS) this.records.length = this.MAX_RECORDS;

    logger.info({ executionId, toolName: tool.name, success: result.success, latencyMs, dryRun: isDryRun }, "Tool executed");

    return { ...result, executionId };
  }

  getRecord(executionId: string): ExecutionRecord | undefined {
    return this.records.find(r => r.id === executionId);
  }

  getHistory(filters: { toolId?: string; callerId?: string; limit?: number } = {}): ExecutionRecord[] {
    let results = this.records;
    if (filters.toolId) results = results.filter(r => r.toolId === filters.toolId);
    if (filters.callerId) results = results.filter(r => r.callerId === filters.callerId);
    return results.slice(0, filters.limit ?? 100);
  }

  summary(): { totalExecutions: number; successRate: number; avgLatencyMs: number; byTool: Record<string, number> } {
    const total = this.records.length;
    const success = this.records.filter(r => r.result.success).length;
    const avgLatencyMs = total > 0 ? this.records.reduce((s, r) => s + r.latencyMs, 0) / total : 0;
    const byTool: Record<string, number> = {};
    for (const r of this.records) byTool[r.toolName] = (byTool[r.toolName] ?? 0) + 1;
    return { totalExecutions: total, successRate: total > 0 ? success / total : 0, avgLatencyMs, byTool };
  }
}

export const toolExecutor = new ToolExecutor();
export { ToolExecutor };

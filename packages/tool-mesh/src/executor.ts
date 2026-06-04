import type { ToolHandler } from './gateway.js';
import type { ToolManifest } from './manifest.js';

export interface ToolExecutionRecord {
  id: string;
  toolId: string;
  toolName: string;
  callerId: string;
  input: unknown;
  output: unknown;
  success: boolean;
  error?: string;
  dryRun: boolean;
  traceId?: string;
  latencyMs: number;
  startedAt: string;
  completedAt: string;
}

export interface ExecutionSummary {
  totalExecutions: number;
  successRate: number;
  avgLatencyMs: number;
  byTool: Record<string, number>;
  byStatus: { success: number; failure: number };
}

export class ToolMeshExecutor {
  private records: ToolExecutionRecord[] = [];
  private readonly maxRecords = 10_000;

  record(entry: ToolExecutionRecord): void {
    this.records.unshift(entry);
    if (this.records.length > this.maxRecords) {
      this.records.length = this.maxRecords;
    }
  }

  async executeDryRun(
    toolId: string,
    toolName: string,
    input: unknown,
    _callerId: string,
  ): Promise<{ dryRun: true; toolId: string; toolName: string; input: unknown; message: string }> {
    return {
      dryRun: true,
      toolId,
      toolName,
      input,
      message: `Dry run — no side effects executed for tool '${toolName}'`,
    };
  }

  async executeWithTimeout(
    handler: ToolHandler,
    input: unknown,
    manifest: ToolManifest,
    timeoutMs: number,
  ): Promise<unknown> {
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

  getRecord(id: string): ToolExecutionRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  getHistory(
    filters: { toolId?: string; callerId?: string; limit?: number } = {},
  ): ToolExecutionRecord[] {
    let results = this.records;
    if (filters.toolId) results = results.filter((r) => r.toolId === filters.toolId);
    if (filters.callerId) results = results.filter((r) => r.callerId === filters.callerId);
    return results.slice(0, filters.limit ?? 100);
  }

  summary(): ExecutionSummary {
    const total = this.records.length;
    const successes = this.records.filter((r) => r.success).length;
    const failures = total - successes;
    const avgLatencyMs =
      total > 0 ? this.records.reduce((sum, r) => sum + r.latencyMs, 0) / total : 0;
    const byTool: Record<string, number> = {};
    for (const r of this.records) {
      byTool[r.toolName] = (byTool[r.toolName] ?? 0) + 1;
    }
    return {
      totalExecutions: total,
      successRate: total > 0 ? successes / total : 0,
      avgLatencyMs,
      byTool,
      byStatus: { success: successes, failure: failures },
    };
  }

  clear(): void {
    this.records = [];
  }
}

export const defaultExecutor = new ToolMeshExecutor();

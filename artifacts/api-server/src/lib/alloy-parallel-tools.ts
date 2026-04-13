import { pool } from "@szl-holdings/db";
import { executeTool, listTools } from "./mastra/tool-registry";
import { logger } from "./logger";
import { makeProgrammaticContext } from "./alloy-execution-context";

export interface BatchToolCall {
  callId: string;
  tool: string;
  inputs: Record<string, unknown>;
  timeout?: number;
}

export interface BatchToolResult {
  callId: string;
  tool: string;
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs: number;
}

export interface BatchExecutionResult {
  batchId: string;
  totalCalls: number;
  successful: number;
  failed: number;
  results: BatchToolResult[];
  totalLatencyMs: number;
  parallelSavingsMs: number;
}

async function ensureBatchTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_batch_executions (
      batch_id TEXT PRIMARY KEY,
      agent_id TEXT,
      total_calls INT NOT NULL DEFAULT 0,
      successful INT NOT NULL DEFAULT 0,
      failed INT NOT NULL DEFAULT 0,
      total_latency_ms INT NOT NULL DEFAULT 0,
      parallel_savings_ms INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureBatchTables(); tablesEnsured = true; } catch {}
}

export async function executeBatchTools(params: {
  calls: BatchToolCall[];
  agentId?: string;
  maxConcurrency?: number;
}): Promise<BatchExecutionResult> {
  await ensureTables();
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  const maxConcurrency = params.maxConcurrency ?? 8;

  const calls = params.calls.slice(0, 20);
  const results: BatchToolResult[] = [];

  // Build tool allowlist from the registered tool registry
  const registeredToolNames = new Set(listTools().map(t => t.name));

  // Build a proper AgentExecutionContext so executeTool can emit traces without crashing
  const execContext = makeProgrammaticContext({
    agentId: params.agentId ?? "batch-orchestrator",
    runId: batchId,
    domain: "alloy",
    threadId: batchId,
  });

  const chunks: BatchToolCall[][] = [];
  for (let i = 0; i < calls.length; i += maxConcurrency) {
    chunks.push(calls.slice(i, i + maxConcurrency));
  }

  let totalSequentialMs = 0;

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(async (call) => {
        const callStart = Date.now();
        const timeout = call.timeout ?? 10000;

        // Reject tool names that aren't registered
        if (!registeredToolNames.has(call.tool)) {
          const callLatency = Date.now() - callStart;
          return {
            callId: call.callId,
            tool: call.tool,
            success: false,
            error: `Tool "${call.tool}" is not in the registered tool allowlist`,
            latencyMs: callLatency,
          } as BatchToolResult;
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tool ${call.tool} timed out after ${timeout}ms`)), timeout)
        );

        const toolPromise = executeTool(call.tool, call.inputs, execContext);

        try {
          const result = await Promise.race([toolPromise, timeoutPromise]);
          const callLatency = Date.now() - callStart;
          totalSequentialMs += callLatency;
          return {
            callId: call.callId,
            tool: call.tool,
            success: !result.error,
            output: result.output ?? result,
            error: result.error,
            latencyMs: callLatency,
          } as BatchToolResult;
        } catch (err) {
          const callLatency = Date.now() - callStart;
          totalSequentialMs += callLatency;
          return {
            callId: call.callId,
            tool: call.tool,
            success: false,
            error: err instanceof Error ? err.message : String(err),
            latencyMs: callLatency,
          } as BatchToolResult;
        }
      })
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          callId: "unknown",
          tool: "unknown",
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
          latencyMs: 0,
        });
      }
    }
  }

  const totalLatencyMs = Date.now() - startTime;
  const parallelSavingsMs = Math.max(0, totalSequentialMs - totalLatencyMs);
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  try {
    await pool.query(
      `INSERT INTO alloy_batch_executions (batch_id, agent_id, total_calls, successful, failed, total_latency_ms, parallel_savings_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [batchId, params.agentId ?? null, calls.length, successful, failed, totalLatencyMs, parallelSavingsMs]
    );
  } catch (dbErr) {
    logger.warn({ err: dbErr, batchId }, "Failed to persist batch execution record");
  }

  return {
    batchId,
    totalCalls: calls.length,
    successful,
    failed,
    results,
    totalLatencyMs,
    parallelSavingsMs,
  };
}

export function buildBatchToolMetaTool() {
  return {
    name: "batch_execute_tools",
    description: "Execute multiple independent tool calls simultaneously in parallel. Use this instead of sequential calls when tools don't depend on each other's results. Dramatically reduces latency and token consumption.",
    inputSchema: {
      type: "object",
      properties: {
        calls: {
          type: "array",
          description: "Array of tool calls to execute in parallel",
          items: {
            type: "object",
            properties: {
              callId: { type: "string", description: "Unique identifier for this call" },
              tool: { type: "string", description: "Tool name to invoke" },
              inputs: { type: "object", description: "Tool input parameters" },
              timeout: { type: "number", description: "Timeout in milliseconds (default 10000)" },
            },
            required: ["callId", "tool", "inputs"],
          },
        },
        maxConcurrency: { type: "number", description: "Max parallel calls (default 8)" },
      },
      required: ["calls"],
    },
    domain: "orchestration",
  };
}

export async function getBatchStats(): Promise<{
  totalBatches: number;
  totalToolCalls: number;
  totalParallelSavingsMs: number;
  avgSuccessRate: number;
}> {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as batches, SUM(total_calls) as calls, SUM(parallel_savings_ms) as savings,
              AVG(successful::float / NULLIF(total_calls, 0)) as avg_success
       FROM alloy_batch_executions`
    );
    const row = rows[0];
    return {
      totalBatches: parseInt(row?.batches ?? "0"),
      totalToolCalls: parseInt(row?.calls ?? "0"),
      totalParallelSavingsMs: parseInt(row?.savings ?? "0"),
      avgSuccessRate: parseFloat(row?.avg_success ?? "0"),
    };
  } catch {
    return { totalBatches: 0, totalToolCalls: 0, totalParallelSavingsMs: 0, avgSuccessRate: 0 };
  }
}

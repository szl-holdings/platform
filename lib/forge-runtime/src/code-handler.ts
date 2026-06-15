/**
 * FORGE Runtime — TypeScript/V8 Code Handler
 *
 * Executes TypeScript source inside an isolated worker_threads sandbox.
 * TypeScript is compiled to JavaScript by esbuild.transform in the main thread
 * before being handed to the worker.  All tool invocations from guest code are
 * mediated through postMessage to the main thread, which runs the full Tool
 * Mesh Gateway guardrail chain before returning results.  The worker never has
 * direct access to main-thread resources (DB connections, API keys, service clients).
 *
 * Security model:
 *   • Governance — every callTool request goes through the main thread's
 *     guardrail chain (allowlist, PII scan, policy tier, rate limits)
 *   • Audit — stdout/stderr are captured and written to the evidence store
 *   • Hard kill — wall-clock timeout terminates the worker thread completely
 *   • Blast radius — a vm.createContext escape reaches only worker-thread
 *     resources, not the main process
 */

import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { forgeEvidenceStore } from './evidence.js';
import { forgeTimeline } from './timeline.js';
import type { ForgeExecution } from './runtime.js';

// ─── TypeScript → JavaScript transformer ─────────────────────────────────────
// Uses esbuild.transform to correctly handle all TypeScript syntax including
// object literals, generics, decorators, mapped types, and template literal types.

async function compileTypeScript(source: string): Promise<string> {
  const result = await esbuild.transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'node18',
    // Produce inline source map so vm error stacks map to original source lines
    sourcemap: 'inline',
    // Strip type annotations only — do not bundle or resolve imports
    tsconfigRaw: { compilerOptions: { strict: false, skipLibCheck: true } },
  });
  return result.code;
}

// ─── Worker file path ─────────────────────────────────────────────────────────

const SANDBOX_WORKER_PATH = fileURLToPath(
  new URL('./sandbox-worker.cjs', import.meta.url),
);

// ─── Worker message types ─────────────────────────────────────────────────────

interface WorkerCallToolMsg {
  type: 'callTool';
  id: string;
  toolId: string;
  input: unknown;
}

interface WorkerCompleteMsg {
  type: 'complete';
  result: unknown;
  stdout: string[];
  stderr: string[];
}

interface WorkerErrorMsg {
  type: 'error';
  error: string;
  stdout: string[];
  stderr: string[];
}

type WorkerMessage = WorkerCallToolMsg | WorkerCompleteMsg | WorkerErrorMsg;

// ─── Code handler implementation ──────────────────────────────────────────────

export async function runCodeHandler(
  execution: ForgeExecution,
): Promise<{ result: unknown; costUsd?: number }> {
  const { payload, domain } = execution.task;

  const source = typeof payload.source === 'string' ? payload.source : '';
  if (!source.trim()) {
    throw new Error('Counsel code handler: payload.source must be a non-empty TypeScript string');
  }

  const timeoutMs =
    typeof payload.timeoutMs === 'number'
      ? Math.min(payload.timeoutMs, execution.sandbox.getPolicy().maxDurationMs)
      : Math.min(30_000, execution.sandbox.getPolicy().maxDurationMs);

  // Compile TypeScript to JavaScript using esbuild before sending to worker.
  // This correctly handles all TS syntax including object literals, generics,
  // decorators, and mapped types — unlike regex-based approaches.
  let jsSource: string;
  try {
    jsSource = await compileTypeScript(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Counsel code sandbox: TypeScript compilation failed — ${message}`);
  }

  // Late-bind the gateway via a string-typed dynamic import to avoid a circular
  // dependency: @workspace/tool-mesh depends on @szl-holdings/forge-runtime (via
  // forge-runtime/sandbox), so this package must NOT declare tool-mesh as a
  // dependency — that would form a cyclic build graph in turbo. Typing the
  // specifier as string keeps the compiler from statically resolving the module
  // (which would require the dependency); we assert the minimal gateway shape we
  // use. The runtime module specifier is unchanged.
  type SandboxToolGateway = {
    invoke(
      toolId: string,
      input: unknown,
      context: {
        requestId: string;
        agentId: string;
        workflowId: string;
        dryRun?: boolean;
      },
    ): Promise<{
      success: boolean;
      error?: string;
      latencyMs?: number;
      output?: unknown;
    }>;
  };
  const { defaultGateway } = (await import('@workspace/tool-mesh' as string)) as {
    defaultGateway: SandboxToolGateway;
  };

  return new Promise<{ result: unknown; costUsd?: number }>((resolve, reject) => {
    const worker = new Worker(SANDBOX_WORKER_PATH, {
      workerData: { jsSource, timeoutMs },
    });

    // Hard wall-clock kill — terminates the worker thread regardless of
    // what the guest code is doing (blocks CPU-bound loops, async hangs, etc.)
    const hardKill = setTimeout(() => {
      worker.terminate();
      const timeoutErr = new Error(
        `Counsel code sandbox: execution timed out after ${timeoutMs}ms`,
      );

      if (execution.sandbox.requiresEvidenceCapture) {
        forgeEvidenceStore.capture({
          executionId: execution.executionId,
          domain,
          type: 'log_snapshot',
          description: 'Code sandbox timed out',
          data: { timeoutMs, error: timeoutErr.message },
        });
      }

      forgeTimeline.record({
        executionId: execution.executionId,
        domain,
        type: 'sandbox_violation',
        label: 'Code sandbox timed out',
        payload: { timeoutMs },
      });

      reject(timeoutErr);
    }, timeoutMs + 500); // Brief buffer — VM-level timeout fires first for sync loops

    let settled = false;
    function settle(fn: () => void): void {
      if (settled) return;
      settled = true;
      clearTimeout(hardKill);
      fn();
    }

    worker.on('message', async (msg: WorkerMessage) => {
      if (msg.type === 'callTool') {
        // ── Mediated tool invocation ──────────────────────────────────────
        // Tool calls from the sandbox are never executed directly in the worker.
        // The main thread validates, guardrails, and invokes the tool, then
        // posts the result back to the worker.
        const { id, toolId, input } = msg;

        // Enforce tool allowlist from sandbox policy
        if (execution.sandbox.getPolicy().allowedTools.length > 0) {
          const violation = execution.sandbox.checkTool(toolId);
          if (violation) {
            worker.postMessage({ type: 'toolResult', id, error: violation.detail });
            return;
          }
        }

        forgeTimeline.record({
          executionId: execution.executionId,
          domain,
          type: 'tool_called',
          label: `callTool: ${toolId}`,
          payload: { toolId },
        });

        try {
          const result = await defaultGateway.invoke(toolId, input, {
            requestId: `${execution.executionId}-callTool-${Date.now()}`,
            agentId: execution.task.userId ?? 'forge-sandbox',
            workflowId: execution.executionId,
            dryRun: execution.task.isDryRun,
          });

          forgeTimeline.record({
            executionId: execution.executionId,
            domain,
            type: 'tool_result',
            label: `callTool result: ${toolId}`,
            payload: { toolId, success: result.success, latencyMs: result.latencyMs },
          });

          if (!result.success) {
            worker.postMessage({
              type: 'toolResult',
              id,
              error: `Tool '${toolId}' failed: ${result.error}`,
            });
          } else {
            worker.postMessage({ type: 'toolResult', id, result: result.output });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          worker.postMessage({ type: 'toolResult', id, error: message });
        }
      } else if (msg.type === 'complete') {
        settle(() => {
          worker.terminate();

          const executionResult = {
            returnValue: msg.result,
            stdout: msg.stdout,
            stderr: msg.stderr,
            executedAt: new Date().toISOString(),
            executionId: execution.executionId,
          };

          if (execution.sandbox.requiresEvidenceCapture) {
            const ev = forgeEvidenceStore.capture({
              executionId: execution.executionId,
              domain,
              type: 'log_snapshot',
              description: `Code sandbox execution: ${execution.task.label}`,
              data: executionResult,
            });
            execution.evidenceIds.push(ev.evidenceId);
          }

          forgeTimeline.record({
            executionId: execution.executionId,
            domain,
            type: 'step_completed',
            label: 'Code sandbox completed',
            payload: { stdoutLines: msg.stdout.length, stderrLines: msg.stderr.length },
          });

          resolve({ result: executionResult, costUsd: 0 });
        });
      } else if (msg.type === 'error') {
        settle(() => {
          worker.terminate();

          if (execution.sandbox.requiresEvidenceCapture) {
            forgeEvidenceStore.capture({
              executionId: execution.executionId,
              domain,
              type: 'log_snapshot',
              description: `Code sandbox error: ${msg.error}`,
              data: { error: msg.error, stdout: msg.stdout, stderr: msg.stderr },
            });
          }

          forgeTimeline.record({
            executionId: execution.executionId,
            domain,
            type: 'sandbox_violation',
            label: 'Code sandbox error',
            payload: { error: msg.error },
          });

          reject(new Error(`Counsel code sandbox: ${msg.error}`));
        });
      }
    });

    worker.on('error', (err: Error) => {
      settle(() => {
        reject(new Error(`Counsel code sandbox worker error: ${err.message}`));
      });
    });

    worker.on('exit', (code) => {
      // Only handle unexpected exits (terminate() sends null, normal exit sends 0)
      if (!settled && code !== 0 && code !== null) {
        settle(() => {
          reject(new Error(`Counsel code sandbox: worker exited unexpectedly with code ${code}`));
        });
      }
    });
  });
}

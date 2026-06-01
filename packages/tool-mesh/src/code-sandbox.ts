/**
 * CodeSandbox — TypeScript/V8 code sandbox for agentic tool-mesh execution.
 *
 * Execution model:
 *   • User code runs inside a vm.Script within a dedicated Worker thread.
 *   • Memory ceiling: enforced via worker_threads resourceLimits.maxOldGenerationSizeMb.
 *     When the limit is exceeded, Node raises ERR_WORKER_OUT_OF_MEMORY and the
 *     execution record carries a "Memory limit exceeded" error.
 *   • CPU timeout: enforced by vm.Script timeout + a safety-net kill timer.
 *   • Domain/Host: checked once at execute() entry as an access-control gate.
 *   • Tool/Host/Domain/Cost: checked per tools.call() on the main thread before
 *     each gateway invocation — fail-fast before any side effects.
 *   • Manifest isolation: manifests are serialized into the worker via workerData
 *     (Node's structured-clone protocol). Sandboxed code receives deep copies and
 *     cannot mutate the live registry state.
 */
import {
  type ForgeSandboxPolicy,
  type ForgeSandboxViolation,
  ForgeSandbox,
} from '@szl-holdings/forge-runtime/sandbox';
import { globalCollector } from '@workspace/cognitive-observability';
import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import type { CatalogSearch } from './catalog-search.js';
import type { ToolExecutionRecord, ToolMeshExecutor } from './executor.js';
import type { GatewayInvokeContext, ToolMeshGateway } from './gateway.js';
import type { ToolManifest } from './manifest.js';

/**
 * Worker thread script (runs as CommonJS with eval:true).
 *
 * The worker receives transpiledCode, timeoutMs, and a manifests snapshot via
 * workerData. It runs the code inside a vm context and messages the main thread
 * for every tools.call(), waiting asynchronously for TOOL_RESULT/TOOL_ERROR.
 * tools.search() is served locally from the workerData manifests snapshot using
 * simple substring matching (BM25 lives on the main thread; the deep-clone
 * workerData snapshot prevents registry mutation).
 */
const WORKER_SCRIPT = `
const { workerData, parentPort } = require('worker_threads');
const vm = require('vm');
let seq = 0;
const pendingCalls = new Map();
const logs = [];

parentPort.on('message', (msg) => {
  const p = pendingCalls.get(msg.seq);
  if (!p) return;
  pendingCalls.delete(msg.seq);
  if (msg.ok) {
    p.resolve(msg.output);
  } else {
    p.reject(new Error(msg.error || 'Tool call failed'));
  }
});

// BM25 constants — kept in sync with packages/tool-mesh/src/catalog-search.ts
const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','by','for','from',
  'has','have','in','is','it','its','of','on','or','that','the',
  'this','to','was','were','will','with',
]);
const BM25_K1 = 1.2;
const BM25_B  = 0.75;

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function fieldTokens(m) {
  const parts = [m.name || '', m.description || '', ...(Array.isArray(m.domainTags) ? m.domainTags : [])];
  return parts.flatMap(tokenize);
}

function buildBm25Index(manifests) {
  const invertedIndex = new Map();
  const docLengths = new Map();
  let totalTokens = 0;
  for (const m of manifests) {
    const tokens = fieldTokens(m);
    docLengths.set(m.id, tokens.length);
    totalTokens += tokens.length;
    const tfMap = new Map();
    for (const t of tokens) tfMap.set(t, (tfMap.get(t) || 0) + 1);
    for (const [term, tf] of tfMap) {
      if (!invertedIndex.has(term)) invertedIndex.set(term, new Map());
      invertedIndex.get(term).set(m.id, tf);
    }
  }
  return { invertedIndex, docLengths, totalTokens };
}

function bm25Search(query, limit, manifests, index) {
  const N = manifests.length;
  if (N === 0) return [];
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];
  const { invertedIndex, docLengths, totalTokens } = index;
  const avgdl = totalTokens / N;
  const scores = new Map();
  for (const term of queryTerms) {
    const postings = invertedIndex.get(term);
    if (!postings) continue;
    const df = postings.size;
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    for (const [docId, tf] of postings) {
      const dl = docLengths.get(docId) || 0;
      const tfNorm = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (dl / avgdl)));
      scores.set(docId, (scores.get(docId) || 0) + idf * tfNorm);
    }
  }
  const manifestMap = new Map(manifests.map(m => [m.id, m]));
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 10)
    .map(([docId]) => manifestMap.get(docId))
    .filter(Boolean);
}

const _manifests = workerData.manifests || [];
const _bm25Index = buildBm25Index(_manifests);

const context = vm.createContext({
  tools: {
    call: async (toolId, input) => {
      const s = ++seq;
      parentPort.postMessage({ type: 'TOOL_CALL', toolId, input, seq: s });
      return new Promise((resolve, reject) => {
        pendingCalls.set(s, { resolve, reject });
      });
    },
    search: (query, limit) => bm25Search(query, limit, _manifests, _bm25Index),
  },
  console: {
    log: (...args) => logs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')),
    warn: (...args) => logs.push('[warn] ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')),
    error: (...args) => logs.push('[error] ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')),
  },
  JSON: JSON,
  Math: Math,
  Date: Date,
  setTimeout: undefined,
  setInterval: undefined,
  clearTimeout: undefined,
  clearInterval: undefined,
  require: undefined,
  process: undefined,
  Buffer: undefined,
  __filename: undefined,
  __dirname: undefined,
  module: undefined,
  exports: undefined,
  global: undefined,
  globalThis: undefined,
  import: undefined,
}, { codeGeneration: { strings: false, wasm: false } });

const wrappedCode = '(async () => { ' + workerData.code + ' })()';
const script = new vm.Script(wrappedCode, { filename: 'sandbox-' + workerData.id + '.js' });

script.runInContext(context, { timeout: workerData.timeoutMs, breakOnSigint: false })
  .then(output => { parentPort.postMessage({ type: 'DONE', output, logs }); })
  .catch(err => { parentPort.postMessage({ type: 'EXEC_ERROR', error: err.message, logs }); });
`;

export interface CodeToolCallRecord {
  toolId: string;
  input: unknown;
  output: unknown;
  success: boolean;
  error?: string;
  latencyMs: number;
}

export interface CodeExecutionRecord {
  id: string;
  sourceCode: string;
  policySnapshot: ForgeSandboxPolicy;
  toolCalls: CodeToolCallRecord[];
  output: unknown;
  logs: string[];
  errors: string[];
  violations: ForgeSandboxViolation[];
  success: boolean;
  durationMs: number;
  costEstimateUsd: number;
  startedAt: string;
  completedAt: string;
}

/**
 * Transpile TypeScript source to plain JavaScript using `typescript.transpileModule`.
 * Uses `ModuleKind.None` to avoid CommonJS boilerplate (exports/require) being injected
 * into the vm context where those globals are intentionally blocked.
 * Falls back to passing source through as-is when the `typescript` package is unavailable.
 */
async function transpileToJs(source: string): Promise<string> {
  try {
    const ts = await import('typescript');
    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.None,
        target: ts.ScriptTarget.ES2022,
        strict: false,
        skipLibCheck: true,
        removeComments: false,
      },
    });
    return result.outputText;
  } catch {
    return source;
  }
}

interface WorkerMessage {
  type: string;
  seq?: number;
  toolId?: string;
  input?: unknown;
  output?: unknown;
  logs?: string[];
  error?: string;
  ok?: boolean;
}

export class CodeSandbox {
  private readonly gateway: ToolMeshGateway;
  private readonly catalogSearch: CatalogSearch;
  private readonly defaultTimeoutMs: number;
  private readonly executor?: ToolMeshExecutor;
  /** Memory ceiling for the worker thread (maxOldGenerationSizeMb). */
  private readonly maxMemoryMb: number;

  constructor(
    gateway: ToolMeshGateway,
    catalogSearch: CatalogSearch,
    defaultTimeoutMs = 30_000,
    executor?: ToolMeshExecutor,
    maxMemoryMb = 256,
  ) {
    this.gateway = gateway;
    this.catalogSearch = catalogSearch;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.executor = executor;
    this.maxMemoryMb = maxMemoryMb;
  }

  async execute(
    sourceCode: string,
    policy: ForgeSandboxPolicy,
    invokeContext: Omit<GatewayInvokeContext, 'requestId'>,
    options?: { timeoutMs?: number },
  ): Promise<CodeExecutionRecord> {
    const id = randomUUID();
    const startedAt = new Date().toISOString();
    const t0 = Date.now();

    const sandbox = new ForgeSandbox(policy);
    const toolCalls: CodeToolCallRecord[] = [];
    const errors: string[] = [];

    const policyMaxMs = policy.maxDurationMs ?? this.defaultTimeoutMs;
    const requestedMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const timeoutMs = Math.min(requestedMs, policyMaxMs);

    // ── Entry-level policy gates ────────────────────────────────────────────
    const domainViolation = sandbox.checkDomain(policy.domain);
    if (domainViolation) {
      errors.push(`Policy violation [domain_blocked]: ${domainViolation.detail}`);
      return this.buildRecord(
        id,
        sourceCode,
        policy,
        toolCalls,
        undefined,
        [],
        errors,
        sandbox.getViolations(),
        false,
        0,
        0,
        startedAt,
      );
    }

    const hostViolation = sandbox.checkHost('tool-mesh.internal');
    if (hostViolation) {
      errors.push(`Policy violation [host_blocked]: ${hostViolation.detail}`);
      return this.buildRecord(
        id,
        sourceCode,
        policy,
        toolCalls,
        undefined,
        [],
        errors,
        sandbox.getViolations(),
        false,
        0,
        0,
        startedAt,
      );
    }

    // ── TypeScript transpilation ────────────────────────────────────────────
    let transpiledCode: string;
    try {
      transpiledCode = await transpileToJs(sourceCode);
    } catch (transpileErr) {
      const msg = transpileErr instanceof Error ? transpileErr.message : String(transpileErr);
      errors.push(`Transpile error: ${msg}`);
      transpiledCode = sourceCode;
    }

    // ── Manifests snapshot for worker (deep-cloned via structured clone) ───
    const manifests: ToolManifest[] = this.catalogSearch.getManifests();

    let output: unknown = undefined;
    let executionSuccess = false;
    let workerLogs: string[] = [];

    // ── Worker thread execution ─────────────────────────────────────────────
    await new Promise<void>((resolve) => {
      let settled = false;
      const finalize = (fn: () => void): void => {
        if (settled) return;
        settled = true;
        fn();
        resolve();
      };

      const worker = new Worker(WORKER_SCRIPT, {
        eval: true,
        workerData: { id, code: transpiledCode, timeoutMs, manifests },
        resourceLimits: { maxOldGenerationSizeMb: this.maxMemoryMb },
      });

      // Safety-net kill timer: fires if the worker does not self-terminate
      // (vm.Script timeout should handle CPU-bound loops; this covers edge cases)
      const killTimer = setTimeout(() => {
        finalize(() => {
          errors.push(`Code sandbox exceeded timeout of ${timeoutMs}ms`);
          executionSuccess = false;
        });
        worker.terminate().catch(() => {});
      }, timeoutMs + 500);

      worker.on('message', (msg: WorkerMessage) => {
        if (msg.type === 'TOOL_CALL') {
          const toolId = msg.toolId as string;
          const input = msg.input;
          const seq = msg.seq as number;

          // ── Per-call policy enforcement ──────────────────────────────────
          const toolViolation = sandbox.checkTool(toolId);
          if (toolViolation) {
            worker.postMessage({
              seq,
              ok: false,
              error: `Policy violation [tool_blocked]: ${toolViolation.detail}`,
            });
            return;
          }

          const perCallHostViolation = sandbox.checkHost('tool-mesh.internal');
          if (perCallHostViolation) {
            worker.postMessage({
              seq,
              ok: false,
              error: `Policy violation [host_blocked]: ${perCallHostViolation.detail}`,
            });
            return;
          }

          const perCallDomainViolation = sandbox.checkDomain(policy.domain);
          if (perCallDomainViolation) {
            worker.postMessage({
              seq,
              ok: false,
              error: `Policy violation [domain_blocked]: ${perCallDomainViolation.detail}`,
            });
            return;
          }

          // Pre-call cost gate: check projected cost (accumulated + this call)
          // to reject before invocation rather than discovering overspend after.
          const projectedCost = (toolCalls.length + 1) * 0.001;
          const preCostViolation = sandbox.checkCost(projectedCost);
          if (preCostViolation) {
            worker.postMessage({
              seq,
              ok: false,
              error: `Policy violation [cost_exceeded]: ${preCostViolation.detail}`,
            });
            return;
          }

          // ── Gateway invocation ──────────────────────────────────────────
          const requestId = randomUUID();
          const callStart = Date.now();
          this.gateway
            .invoke(toolId, input, { ...invokeContext, requestId })
            .then((result) => {
              const latencyMs = Date.now() - callStart;
              toolCalls.push({
                toolId,
                input,
                output: result.output,
                success: result.success,
                error: result.error,
                latencyMs,
              });
              if (!result.success) {
                worker.postMessage({
                  seq,
                  ok: false,
                  error: result.error ?? `Tool '${toolId}' failed`,
                });
              } else {
                worker.postMessage({ seq, ok: true, output: result.output });
              }
            })
            .catch((err: unknown) => {
              worker.postMessage({
                seq,
                ok: false,
                error: err instanceof Error ? err.message : String(err),
              });
            });
        } else if (msg.type === 'DONE') {
          finalize(() => {
            output = msg.output;
            workerLogs = (msg.logs as string[]) ?? [];
            executionSuccess = true;
          });
          clearTimeout(killTimer);
          worker.terminate().catch(() => {});
        } else if (msg.type === 'EXEC_ERROR') {
          finalize(() => {
            errors.push((msg.error as string) ?? 'Unknown execution error');
            workerLogs = (msg.logs as string[]) ?? [];
            executionSuccess = false;
          });
          clearTimeout(killTimer);
          worker.terminate().catch(() => {});
        }
      });

      worker.on('error', (err: Error & { code?: string }) => {
        const isOom = err.code === 'ERR_WORKER_OUT_OF_MEMORY' || /out of memory/i.test(err.message);
        finalize(() => {
          errors.push(
            isOom ? `Memory limit exceeded (${this.maxMemoryMb} MB): ${err.message}` : err.message,
          );
          executionSuccess = false;
        });
        clearTimeout(killTimer);
      });

      worker.on('exit', (code: number) => {
        clearTimeout(killTimer);
        finalize(() => {
          if (code !== 0) {
            errors.push(`Worker thread exited with code ${code}`);
          }
          executionSuccess = false;
        });
      });
    });

    // ── Post-execution policy checks ────────────────────────────────────────
    const durationMs = Date.now() - t0;
    const completedAt = new Date().toISOString();

    const durationViolation = sandbox.checkDuration(durationMs);
    if (durationViolation) {
      errors.push(`Policy violation [duration_exceeded]: ${durationViolation.detail}`);
      executionSuccess = false;
    }

    const costEstimateUsd = toolCalls.length * 0.001;
    const postCostViolation = sandbox.checkCost(costEstimateUsd);
    if (postCostViolation) {
      errors.push(`Policy violation [cost_exceeded]: ${postCostViolation.detail}`);
      executionSuccess = false;
    }

    const policyViolations = sandbox
      .getViolations()
      .filter(
        (v) =>
          v.type === 'tool_blocked' || v.type === 'domain_blocked' || v.type === 'host_blocked',
      );
    const finalSuccess = executionSuccess && policyViolations.length === 0;

    const record = this.buildRecord(
      id,
      sourceCode,
      policy,
      toolCalls,
      output,
      workerLogs,
      errors,
      sandbox.getViolations(),
      finalSuccess,
      durationMs,
      costEstimateUsd,
      startedAt,
      completedAt,
    );

    // ── Observability metrics ────────────────────────────────────────────────
    globalCollector.recordKnown('latency_ms', durationMs, {
      toolId: 'code_sandbox',
      toolName: 'CodeSandbox',
      domain: String(policy.domain),
    });

    globalCollector.recordKnown('code_execution_count', 1, {
      success: String(finalSuccess),
      domain: String(policy.domain),
      agentId: invokeContext.agentId ?? 'unknown',
      toolCallCount: String(toolCalls.length),
      violationCount: String(sandbox.getViolations().length),
    });

    // Dedicated execution event — carries executionId for cross-signal correlation
    globalCollector.recordKnown('code_execution_event', 1, {
      executionId: id,
      success: String(finalSuccess),
      domain: String(policy.domain),
      agentId: invokeContext.agentId ?? 'unknown',
      toolCallCount: String(toolCalls.length),
      violationCount: String(sandbox.getViolations().length),
      durationMs: String(durationMs),
      costUsd: costEstimateUsd.toFixed(4),
    });

    if (!finalSuccess) {
      globalCollector.recordKnown('tool_error_rate', 1, {
        toolId: 'code_sandbox',
        errorType: policyViolations.length > 0 ? 'policy_violation' : 'execution_error',
      });
    } else {
      globalCollector.recordKnown('tool_error_rate', 0, { toolId: 'code_sandbox' });
    }

    // ── Executor record ──────────────────────────────────────────────────────
    if (this.executor) {
      const execRecord: ToolExecutionRecord = {
        id,
        toolId: 'code_sandbox',
        toolName: 'CodeSandbox',
        callerId: invokeContext.agentId ?? 'unknown',
        input: { sourceCode, policyDomain: policy.domain },
        output: record,
        success: finalSuccess,
        error: errors[0],
        dryRun: false,
        latencyMs: durationMs,
        startedAt,
        completedAt,
      };
      this.executor.record(execRecord);
    }

    return record;
  }

  private buildRecord(
    id: string,
    sourceCode: string,
    policy: ForgeSandboxPolicy,
    toolCalls: CodeToolCallRecord[],
    output: unknown,
    logs: string[],
    errors: string[],
    violations: ForgeSandboxViolation[],
    success: boolean,
    durationMs: number,
    costEstimateUsd: number,
    startedAt: string,
    completedAt?: string,
  ): CodeExecutionRecord {
    return {
      id,
      sourceCode,
      policySnapshot: policy,
      toolCalls,
      output,
      logs,
      errors,
      violations,
      success,
      durationMs,
      costEstimateUsd,
      startedAt,
      completedAt: completedAt ?? new Date().toISOString(),
    };
  }
}

import { globalCollector } from '@workspace/cognitive-observability';
import { createHash } from 'node:crypto';

// ── TypeScript transpilation ──────────────────────────────────────────────────
// Model-authored scripts may contain TS type annotations that V8 cannot run.
// We lazily resolve TypeScript's `transpileModule` via standard module
// resolution and use it to strip types before handing the script to the isolate.

interface TsModule {
  transpileModule(
    input: string,
    opts: { compilerOptions: Record<string, unknown> },
  ): { outputText: string };
}

let _tsModule: TsModule | null | undefined;

async function transpileToJS(script: string): Promise<string> {
  if (_tsModule === null) return script;
  if (_tsModule === undefined) {
    try {
      const { createRequire } = await import('node:module');
      const req = createRequire(import.meta.url);
      // Resolve via normal Node module resolution; relative paths cover monorepo roots.
      for (const id of ['typescript', '../../../node_modules/typescript']) {
        try { _tsModule = req(id) as TsModule; break; } catch { /* next */ }
      }
    } catch { /* createRequire unavailable */ }
    if (_tsModule === undefined) _tsModule = null;
  }
  if (!_tsModule) return script;
  try {
    return _tsModule.transpileModule(script, {
      compilerOptions: { target: 99, module: 1, esModuleInterop: true, strict: false },
    }).outputText;
  } catch {
    return script;
  }
}

// ── isolated-vm type surface ───────────────────────────────────────────────────
// isolated-vm is a native CommonJS addon without bundled TypeScript declarations
// in this workspace. We define a minimal structural interface that covers exactly
// the API surface this module uses, eliminating the need for an `any` cast while
// preserving full type safety for the consumer.

interface IvmGlobal {
  set(key: string, value: unknown): Promise<void>;
  get(key: string, options?: { copy?: boolean }): Promise<unknown>;
  derefInto(): unknown;
}

interface IvmContext {
  global: IvmGlobal;
  eval(code: string, options?: { timeout?: number }): Promise<unknown>;
}

interface IvmScript {
  run(context: IvmContext, options?: { timeout?: number; promise?: boolean }): Promise<unknown>;
}

interface IvmIsolate {
  createContext(): Promise<IvmContext>;
  compileScript(code: string, options?: { filename?: string }): Promise<IvmScript>;
  dispose(): void;
}

interface IvmModule {
  Isolate: new (options: { memoryLimit: number }) => IvmIsolate;
  Reference: new (value: unknown) => object;
}

let ivm: IvmModule | undefined;

async function getIvm(): Promise<IvmModule> {
  if (!ivm) {
    try {
      // isolated-vm is a CommonJS native addon — use createRequire to load it
      const { createRequire } = await import('node:module');
      const req = createRequire(import.meta.url);
      ivm = req('isolated-vm') as IvmModule;
    } catch {
      throw new Error(
        'isolated-vm native module is unavailable in this environment. ' +
          'Install isolated-vm and ensure it has been compiled (node-gyp-build). ' +
          'CodeSandbox requires a real V8 isolate for secure execution of model-generated code.',
      );
    }
  }
  return ivm;
}

export type SandboxToolInvoker = (
  toolId: string,
  args: Record<string, unknown>,
  caller: 'sandbox',
) => Promise<unknown>;

export interface CodeSandboxOptions {
  timeoutMs?: number;
  memoryLimitMb?: number;
  maxToolCalls?: number;
}

export interface SandboxExecution {
  scriptHash: string;
  output: string;
  returnValue: unknown;
  toolCallsMade: string[];
  durationMs: number;
  success: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: Required<CodeSandboxOptions> = {
  timeoutMs: 15_000,
  memoryLimitMb: 64,
  maxToolCalls: 50,
};

function hashScript(script: string): string {
  return createHash('sha256').update(script).digest('hex').slice(0, 16);
}

export class CodeSandbox {
  private readonly options: Required<CodeSandboxOptions>;

  constructor(options: CodeSandboxOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute(
    script: string,
    stubSource: string,
    invoker: SandboxToolInvoker,
  ): Promise<SandboxExecution> {
    const scriptHash = hashScript(script);
    const t0 = Date.now();
    const logs: string[] = [];
    const toolCallsMade: string[] = [];
    let toolCallCount = 0;

    const IsolatedVM = await getIvm();

    const isolate = new IsolatedVM.Isolate({ memoryLimit: this.options.memoryLimitMb });

    try {
      const context = await isolate.createContext();
      const jail = context.global;

      await jail.set('global', jail.derefInto());

      // Cross-isolate refs must be set before calling context.eval. The eval'd
      // bootstrap immediately captures them via closure; setting them afterward
      // would leave the captured references undefined at call time.

      const logRef = new IsolatedVM.Reference((...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      });
      const warnRef = new IsolatedVM.Reference((...args: unknown[]) => {
        logs.push('[warn] ' + args.map(String).join(' '));
      });
      const errorRef = new IsolatedVM.Reference((...args: unknown[]) => {
        logs.push('[error] ' + args.map(String).join(' '));
      });

      await jail.set('__log_ref', logRef);
      await jail.set('__warn_ref', warnRef);
      await jail.set('__err_ref', errorRef);

      await context.eval(`
        const __log = (() => { const r = global.__log_ref; return (...a) => r.applyIgnored(undefined, a, { arguments: { copy: true } }); })();
        const __warn = (() => { const r = global.__warn_ref; return (...a) => r.applyIgnored(undefined, a, { arguments: { copy: true } }); })();
        const __error = (() => { const r = global.__err_ref; return (...a) => r.applyIgnored(undefined, a, { arguments: { copy: true } }); })();
        global.console = { log: __log, warn: __warn, error: __error, info: __log };
        delete global.__log_ref; delete global.__warn_ref; delete global.__err_ref;
      `);

      const mcpCallRef = new IsolatedVM.Reference(
        async (toolId: unknown, args: unknown): Promise<unknown> => {
          if (toolCallCount >= this.options.maxToolCalls) {
            throw new Error(
              `Sandbox exceeded maximum tool call limit (${this.options.maxToolCalls}).`,
            );
          }
          toolCallCount++;
          const safeToolId = typeof toolId === 'string' ? toolId : String(toolId);
          const safeArgs =
            args && typeof args === 'object' && !Array.isArray(args)
              ? (args as Record<string, unknown>)
              : {};
          toolCallsMade.push(safeToolId);

          const callT0 = Date.now();
          try {
            const result = await invoker(safeToolId, safeArgs, 'sandbox');
            globalCollector.recordKnown('latency_ms', Date.now() - callT0, {
              phase: 'sandbox_tool_call',
              toolId: safeToolId,
              caller: 'sandbox',
              scriptHash,
              success: 'true',
            });
            return result;
          } catch (err) {
            globalCollector.recordKnown('tool_error_rate', 1, {
              toolId: safeToolId,
              caller: 'sandbox',
              scriptHash,
            });
            throw err;
          }
        },
      );

      await jail.set('__mcp_call_ref', mcpCallRef);

      const stubPreamble = `
        async function __mcp_call(toolId, args) {
          return __mcp_call_ref.apply(undefined, [toolId, args], {
            arguments: { copy: true },
            result: { promise: true, copy: true }
          });
        }
        ${stubSource}
      `;

      // Transpile TypeScript → JavaScript before V8 compilation. Model-authored
      // scripts may include TS-only syntax (type annotations, interfaces,
      // generics, `as` casts) that isolated-vm's V8 cannot execute directly.
      // transpileToJS lazily loads TypeScript's `transpileModule` for accurate
      // stripping; falls back to the raw script for plain-JS-only callers.
      const jsScript = await transpileToJS(script);

      // The IIFE result is stored in global.__sandbox_result so we can read it
      // back via jail.get() after execution. compiledScript.run() discards the
      // resolved promise value across the isolate boundary, so the explicit
      // side-channel via a global is required to surface the return value.
      const fullScript = `(async function __sandboxMain__() {
        'use strict';
        ${stubPreamble}
        const __result__ = await (async () => {
          ${jsScript}
        })();
        global.__sandbox_result = __result__;
        return __result__;
      })()`;

      const compiledScript = await isolate.compileScript(fullScript, {
        filename: `sandbox:${scriptHash}`,
      });

      await compiledScript.run(context, { timeout: this.options.timeoutMs, promise: true });

      // Read the return value from the isolate — copy: true handles primitives
      // and plain objects. Non-copyable values (functions, class instances, etc.)
      // are silently returned as undefined rather than throwing.
      let returnValue: unknown = undefined;
      try {
        returnValue = await jail.get('__sandbox_result', { copy: true });
      } catch {
        // Non-copyable value — leave as undefined
      }

      const durationMs = Date.now() - t0;
      const output = logs.join('\n');

      globalCollector.recordKnown('latency_ms', durationMs, {
        phase: 'sandbox_execution',
        scriptHash,
        toolCallCount: String(toolCallCount),
        success: 'true',
      });

      return {
        scriptHash,
        output,
        returnValue,
        toolCallsMade,
        durationMs,
        success: true,
      };
    } catch (err) {
      const durationMs = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);
      const output = logs.join('\n');

      globalCollector.recordKnown('latency_ms', durationMs, {
        phase: 'sandbox_execution',
        scriptHash,
        toolCallCount: String(toolCallCount),
        success: 'false',
      });

      return {
        scriptHash,
        output,
        returnValue: undefined,
        toolCallsMade,
        durationMs,
        success: false,
        error: message,
      };
    } finally {
      isolate.dispose();
    }
  }
}

export const defaultCodeSandbox = new CodeSandbox();

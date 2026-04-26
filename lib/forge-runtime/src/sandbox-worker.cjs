'use strict';
/**
 * FORGE Sandbox Worker (CommonJS)
 *
 * Runs in an isolated worker_threads context.  All tool invocations are sent
 * to the main thread via postMessage — the main thread runs the actual Tool
 * Mesh Gateway guardrail chain and returns results.  This is the "mediated
 * message-passing" boundary: the worker cannot directly access main-thread
 * resources; it can only request tool invocations through the message channel.
 *
 * Even if guest code escapes the vm.createContext boundary (a known Node.js vm
 * limitation), the blast radius is limited to this worker thread.  The main
 * thread's DB connections, API keys, and service clients are not reachable
 * from the worker because they are not passed via workerData or postMessage.
 *
 * Security model summary:
 *   • Governance: all callTool requests are mediated through main-thread guardrails
 *   • Audit: stdout/stderr captured and returned to main thread for evidence storage
 *   • Hard kill: main thread calls worker.terminate() on timeout
 *   • Blast radius: a vm escape only reaches this worker's CJS module environment
 */

const { workerData, parentPort } = require('worker_threads');
const vm = require('vm');

// ─── Tool call message-passing bridge ────────────────────────────────────────

/** Pending callTool requests keyed by correlation id. */
const pending = new Map();

parentPort.on('message', (msg) => {
  if (msg.type === 'toolResult') {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) {
      p.reject(new Error(msg.error));
    } else {
      p.resolve(msg.result);
    }
  }
});

/**
 * sandboxCallTool is exposed in the vm context as `callTool`.
 * All invocations go through postMessage to the main thread — the main thread
 * validates the tool against the allowlist and runs it through the guardrail
 * chain before responding with the result.
 */
async function sandboxCallTool(toolId, input) {
  const id = String(Math.random()).slice(2) + String(Date.now());
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    // Serialize input to prevent passing host-object references across threads
    let safeInput;
    try {
      safeInput = JSON.parse(JSON.stringify(input ?? {}));
    } catch {
      safeInput = {};
    }
    parentPort.postMessage({ type: 'callTool', id, toolId, input: safeInput });
  });
}

// ─── Captured output ─────────────────────────────────────────────────────────

const stdout = [];
const stderr = [];

// ─── Sandbox globals ──────────────────────────────────────────────────────────
// Only safe primitives and the callTool bridge are exposed.
// Network, file-system, and process access are deliberately absent.

const sandboxGlobals = {
  // Tool bridge
  callTool: sandboxCallTool,

  // Capturing console
  console: {
    log: (...args) => {
      stdout.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    },
    warn: (...args) => {
      stdout.push('[warn] ' + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    },
    error: (...args) => {
      stderr.push('[error] ' + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    },
    info: (...args) => {
      stdout.push('[info] ' + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    },
  },

  // Capped setTimeout — prevents unbounded timers
  setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5000)),
  clearTimeout,

  // Language primitives
  undefined: undefined,
  null: null,
  NaN,
  Infinity,
  isFinite,
  isNaN,
  parseInt,
  parseFloat,
  decodeURI,
  decodeURIComponent,
  encodeURI,
  encodeURIComponent,
  JSON,
  Math,
  Date,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  TypeError,
  RangeError,
  Map,
  Set,
  Promise,
  Symbol,
  BigInt,
};

// ─── Execution ────────────────────────────────────────────────────────────────

const { jsSource, timeoutMs } = workerData;

const context = vm.createContext(sandboxGlobals);

// Wrap user code in an async IIFE so top-level await works
const wrappedSource = '(async () => { ' + jsSource + ' })()';

(async () => {
  try {
    const script = new vm.Script(wrappedSource, { filename: 'forge-sandbox' });
    // VM-level timeout terminates CPU-bound synchronous loops via V8 interrupt.
    // Wall-clock timeout is enforced by the main thread via worker.terminate().
    const result = await script.runInContext(context, {
      timeout: timeoutMs,
      breakOnSigint: true,
    });
    parentPort.postMessage({
      type: 'complete',
      result: result !== undefined ? result : null,
      stdout,
      stderr,
    });
  } catch (err) {
    parentPort.postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
      stdout,
      stderr,
    });
  }
})();

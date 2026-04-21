import { isMainThread, parentPort, Worker, workerData } from 'worker_threads';
import { sample } from './distributions.js';
import type { RunConfig, ScenarioDefinition } from './schema.js';

export interface WorkerTask {
  iterations: number;
  scenarioJson: string;
  seed?: number;
}

export interface WorkerResult {
  inputSamples: Record<string, number[]>;
  validInputSamples: Record<string, number[]>;
  outputSamples: Record<string, number[]>;
  validCount: number;
  violationCount: number;
  error?: string;
}

const WORKER_BOOTSTRAP = `
(function() {
const { workerData, parentPort } = require("worker_threads");

function sample(dist) {
  function randomNormal(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function randomGamma(shape) {
    if (shape < 1) return randomGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
    const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do { x = randomNormal(0, 1); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  switch (dist.type) {
    case "normal": return randomNormal(dist.mean, dist.stdDev);
    case "log_normal": {
      const lnM = Math.log(dist.mean * dist.mean / Math.sqrt(dist.stdDev * dist.stdDev + dist.mean * dist.mean));
      const lnS = Math.sqrt(Math.log(1 + (dist.stdDev / dist.mean) ** 2));
      return Math.exp(randomNormal(lnM, lnS));
    }
    case "uniform": return dist.min + Math.random() * (dist.max - dist.min);
    case "triangular": {
      const u = Math.random(), fc = (dist.mode - dist.min) / (dist.max - dist.min);
      if (u < fc) return dist.min + Math.sqrt(u * (dist.max - dist.min) * (dist.mode - dist.min));
      return dist.max - Math.sqrt((1 - u) * (dist.max - dist.min) * (dist.max - dist.mode));
    }
    case "beta": {
      const raw = randomGamma(dist.alpha) / (randomGamma(dist.alpha) + randomGamma(dist.beta));
      return (dist.min != null ? dist.min : 0) + raw * ((dist.max != null ? dist.max : 1) - (dist.min != null ? dist.min : 0));
    }
    case "poisson": {
      const L = Math.exp(-dist.lambda); let k = 0, p = 1;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    }
    case "constant": return dist.value;
    case "custom": {
      if (dist.weights) {
        const t = dist.weights.reduce(function(a, b) { return a + b; }, 0); let r = Math.random() * t;
        for (let i = 0; i < dist.values.length; i++) { r -= dist.weights[i]; if (r <= 0) return dist.values[i]; }
      }
      return dist.values[Math.floor(Math.random() * dist.values.length)];
    }
    default: throw new Error("Unknown distribution type: " + dist.type);
  }
}

const task = workerData;
let parsed;
try { parsed = JSON.parse(task.scenarioJson); } catch(e) {
  parentPort.postMessage({ error: "Cannot parse scenario: " + e.message });
  return;
}

const { inputs, outputs, outputExprs, intermediates, constraints } = parsed;
const inputSamples = {};
const validInputSamples = {};
const outputSamples = {};
for (const inp of inputs) { inputSamples[inp.id] = []; validInputSamples[inp.id] = []; }
for (const out of outputs) { outputSamples[out.id] = []; }

let validCount = 0, violationCount = 0;

function evalExpr(expr, vars) {
  switch (expr.type) {
    case "number": return expr.value;
    case "variable": {
      if (!(expr.id in vars)) throw new Error("Undefined variable: " + expr.id);
      return vars[expr.id];
    }
    case "binary": {
      const l = evalExpr(expr.left, vars), r = evalExpr(expr.right, vars);
      switch (expr.op) {
        case "+": return l + r; case "-": return l - r; case "*": return l * r;
        case "/": {
          if (r === 0) throw new Error("Division by zero in expression");
          return l / r;
        }
        case "**": return Math.pow(l, r);
        case "%": return l % r; case "min": return Math.min(l, r); case "max": return Math.max(l, r);
        default: throw new Error("Unknown binary op: " + expr.op);
      }
    }
    case "unary": {
      const v = evalExpr(expr.operand, vars);
      switch (expr.op) {
        case "-": return -v; case "abs": return Math.abs(v); case "sqrt": return Math.sqrt(v);
        case "log": {
          if (v <= 0) throw new Error("log() of non-positive value: " + v);
          return Math.log(v);
        }
        case "log10": {
          if (v <= 0) throw new Error("log10() of non-positive value: " + v);
          return Math.log10(v);
        }
        case "exp": return Math.exp(v);
        case "floor": return Math.floor(v); case "ceil": return Math.ceil(v); case "round": return Math.round(v);
        default: throw new Error("Unknown unary op: " + expr.op);
      }
    }
    case "call": {
      const args = expr.args.map(function(a) { return evalExpr(a, vars); });
      switch (expr.fn) {
        case "max": return Math.max.apply(null, args); case "min": return Math.min.apply(null, args);
        case "pow": return Math.pow(args[0], args[1]);
        case "clamp": return Math.min(Math.max(args[0], args[1]), args[2]);
        default: throw new Error("Unknown function: " + expr.fn);
      }
    }
    case "conditional": {
      const cond = evalBool(expr.condition, vars);
      return cond ? evalExpr(expr.then, vars) : evalExpr(expr.else, vars);
    }
    default: throw new Error("Unknown expression type: " + expr.type);
  }
}

function evalBool(expr, vars) {
  if (expr.type === "compare") {
    const l = evalExpr(expr.left, vars), r = evalExpr(expr.right, vars);
    switch (expr.op) {
      case "<": return l < r; case "<=": return l <= r; case ">": return l > r;
      case ">=": return l >= r; case "==": return l === r; case "!=": return l !== r;
      default: throw new Error("Unknown compare op: " + expr.op);
    }
  }
  if (expr.type === "logical") {
    if (expr.op === "and") return expr.operands.every(function(o) { return evalBool(o, vars); });
    if (expr.op === "or") return expr.operands.some(function(o) { return evalBool(o, vars); });
    if (expr.op === "not") return !evalBool(expr.operands[0], vars);
  }
  throw new Error("Unknown boolean expression type: " + expr.type);
}

const progressInterval = Math.max(1, Math.floor(task.iterations / 10));
for (let i = 0; i < task.iterations; i++) {
  if (i > 0 && i % progressInterval === 0) {
    parentPort.postMessage({ type: "progress", completed: i, total: task.iterations });
  }

  const inVals = {};
  for (const inp of inputs) {
    const v = sample(inp.distribution);
    inVals[inp.id] = v;
    inputSamples[inp.id].push(v);
  }

  try {
    let ctx = Object.assign({}, inVals);
    if (intermediates) {
      for (const inter of intermediates) ctx[inter.id] = evalExpr(inter.expr, ctx);
    }

    const outVals = {};
    for (const out of outputs) {
      const exprDef = outputExprs ? outputExprs.find(function(e) { return e.id === out.id; }) : null;
      if (!exprDef) throw new Error("Missing outputExpr for output: " + out.id);
      const v = evalExpr(exprDef.expr, ctx);
      if (!isFinite(v)) throw new Error("Non-finite output value for: " + out.id);
      outVals[out.id] = v;
    }

    if (constraints && constraints.length > 0) {
      const fullCtx = Object.assign({}, ctx, outVals);
      for (const con of constraints) {
        if (!evalBool(con.expr, fullCtx)) throw new Error("Constraint violated: " + con.id);
      }
    }

    validCount++;
    for (const inp of inputs) { validInputSamples[inp.id].push(inVals[inp.id]); }
    for (const out of outputs) {
      if (outVals[out.id] !== undefined) outputSamples[out.id].push(outVals[out.id]);
    }
  } catch(_iterErr) {
    violationCount++;
  }
}

parentPort.postMessage({ type: "result", inputSamples, validInputSamples, outputSamples, validCount, violationCount });
})();
`;

export type ParallelProgressCallback = (
  completedIterations: number,
  totalIterations: number,
) => void;

export interface ParallelRunConfig {
  workers?: number | undefined;
  iterations: number;
  timeoutMs?: number | undefined;
  onProgress?: ParallelProgressCallback | undefined;
}

export interface ChunkResult {
  inputSamples: Record<string, number[]>;
  validInputSamples: Record<string, number[]>;
  outputSamples: Record<string, number[]>;
  validCount: number;
  violationCount: number;
}

export function runParallelChunks(
  scenarioJson: string,
  config: ParallelRunConfig,
): Promise<ChunkResult> {
  const numWorkers = Math.min(config.workers ?? 4, 8);
  const totalIterations = config.iterations;
  const chunkSize = Math.ceil(totalIterations / numWorkers);
  const timeoutMs = config.timeoutMs ?? 60_000;
  const onProgress = config.onProgress;

  const workerCompletedMap = new Map<number, number>();
  let workersLaunched = 0;

  function reportAggregatedProgress(): void {
    if (!onProgress) return;
    let sum = 0;
    for (const v of workerCompletedMap.values()) sum += v;
    onProgress(sum, totalIterations);
  }

  const workerPromises: Promise<WorkerResult>[] = [];

  for (let i = 0; i < numWorkers; i++) {
    const iters = Math.min(chunkSize, totalIterations - i * chunkSize);
    if (iters <= 0) break;

    const workerId = workersLaunched++;
    workerCompletedMap.set(workerId, 0);

    workerPromises.push(
      new Promise<WorkerResult>((resolve, reject) => {
        const w = new Worker(WORKER_BOOTSTRAP, {
          eval: true,
          workerData: { iterations: iters, scenarioJson } satisfies WorkerTask,
        });

        const timer = setTimeout(() => {
          void w.terminate();
          reject(new Error(`Worker timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        w.on('message', (msg: { type?: string } & WorkerResult) => {
          if (msg.type === 'progress') {
            const progressMsg = msg as unknown as {
              type: 'progress';
              completed: number;
              total: number;
            };
            workerCompletedMap.set(workerId, progressMsg.completed);
            reportAggregatedProgress();
            return;
          }
          clearTimeout(timer);
          workerCompletedMap.set(workerId, iters);
          reportAggregatedProgress();
          resolve(msg);
        });
        w.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
        w.on('exit', (code) => {
          clearTimeout(timer);
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });
      }),
    );
  }

  return Promise.all(workerPromises).then((results) => {
    const merged: ChunkResult = {
      inputSamples: {},
      validInputSamples: {},
      outputSamples: {},
      validCount: 0,
      violationCount: 0,
    };

    for (const r of results) {
      merged.validCount += r.validCount;
      merged.violationCount += r.violationCount;
      for (const [k, v] of Object.entries(r.inputSamples)) {
        if (!merged.inputSamples[k]) merged.inputSamples[k] = [];
        merged.inputSamples[k]!.push(...v);
      }
      for (const [k, v] of Object.entries(r.validInputSamples ?? {})) {
        if (!merged.validInputSamples[k]) merged.validInputSamples[k] = [];
        merged.validInputSamples[k]!.push(...v);
      }
      for (const [k, v] of Object.entries(r.outputSamples)) {
        if (!merged.outputSamples[k]) merged.outputSamples[k] = [];
        merged.outputSamples[k]!.push(...v);
      }
    }

    if (merged.validCount === 0 && merged.violationCount > 0) {
      throw new Error(
        `Simulation produced 0 valid iterations out of ${merged.violationCount + merged.validCount} attempts. ` +
          `All iterations failed due to expression errors or constraint violations. ` +
          `Check your outputExprs, intermediates, and constraints for correctness.`,
      );
    }

    return merged;
  });
}

export function isWorkerAvailable(): boolean {
  return isMainThread;
}

export { sample };

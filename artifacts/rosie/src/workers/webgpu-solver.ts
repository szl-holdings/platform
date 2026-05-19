/**
 * WebGPU-backed Simulated Annealing solver for Ising models.
 *
 * Runs on the GPU when available; otherwise the caller falls back to the
 * Web Worker CPU descent in `ising-solver.worker.ts`. The WGSL kernel runs
 * the sweep as a serial-flip metropolis pass inside a single workgroup
 * invocation (n ≤ 64 spins per problem fits trivially), but executes the
 * full SA schedule on-device so the round-trip cost is one buffer upload
 * + one readback regardless of `sweeps`. This is the right shape for the
 * narrative descent preview — the authoritative receipt always comes from
 * the deterministic server-side solver.
 *
 * Governance: same as the worker — PREVIEW ONLY. Display energy must be
 * tagged as such in the UI so operators never confuse it with the sealed
 * server receipt.
 */

export interface WebGPUSolveInput {
  J: number[][];
  h: number[];
  seed: number;
  sweeps?: number;
  tStart?: number;
  tEnd?: number;
}

export interface WebGPUSolveResult {
  spins: number[];
  energy: number;
  trace: number[];
  iterations: number;
  ms: number;
  backend: "webgpu";
  adapter: string;
}

/** Cheap async probe — separate from `detectWebGPU` so callers can request a device. */
export async function tryAcquireWebGPU(): Promise<{ device: GPUDevice; adapter: string } | null> {
  if (typeof navigator === "undefined" || !(navigator as unknown as { gpu?: GPU }).gpu) return null;
  try {
    const gpu = (navigator as unknown as { gpu: GPU }).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) return null;
    const device = await adapter.requestDevice();
    const info = (await (adapter as unknown as { requestAdapterInfo?: () => Promise<{ description?: string; vendor?: string }> }).requestAdapterInfo?.()) ?? {};
    const name = info?.description || info?.vendor || "WebGPU adapter";
    device.lost.then(() => {
      // surface for caller; not fatal — caller will fall back to CPU on next solve
      // (we drop the cached device in `solveOnWebGPU` below).
    });
    return { device, adapter: name };
  } catch {
    return null;
  }
}

const WGSL = /* wgsl */`
struct Params {
  n: u32,
  sweeps: u32,
  seed: u32,
  _pad: u32,
  tStart: f32,
  tEnd: f32,
  traceStride: u32,
  traceCap: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> J: array<f32>;
@group(0) @binding(2) var<storage, read> hField: array<f32>;
@group(0) @binding(3) var<storage, read_write> spins: array<i32>;
@group(0) @binding(4) var<storage, read_write> trace: array<f32>;
@group(0) @binding(5) var<storage, read_write> outMeta: array<f32>;
@group(0) @binding(6) var<storage, read_write> bestSpins: array<i32>;

fn rng_next(state: ptr<function, u32>) -> f32 {
  let s = *state + 0x6D2B79F5u;
  *state = s;
  var t: u32 = s;
  t = (t ^ (t >> 15u)) * (t | 1u);
  t = t ^ (t + ((t ^ (t >> 7u)) * (t | 61u)));
  let r = (t ^ (t >> 14u));
  return f32(r) / 4294967296.0;
}

fn local_field(i: u32, n: u32) -> f32 {
  var f: f32 = hField[i];
  for (var j: u32 = 0u; j < n; j = j + 1u) {
    if (j == i) { continue; }
    var a = i;
    var b = j;
    if (b < a) {
      let t = a; a = b; b = t;
    }
    f = f + J[a * n + b] * f32(spins[j]);
  }
  return f;
}

fn total_energy(n: u32) -> f32 {
  var e: f32 = 0.0;
  for (var i: u32 = 0u; i < n; i = i + 1u) {
    e = e + hField[i] * f32(spins[i]);
    for (var j: u32 = i + 1u; j < n; j = j + 1u) {
      e = e + J[i * n + j] * f32(spins[i]) * f32(spins[j]);
    }
  }
  return e;
}

@compute @workgroup_size(1)
fn main() {
  let n = params.n;
  let sweeps = params.sweeps;
  var state: u32 = params.seed;

  // Initial random ±1 spins (deterministic from seed)
  for (var i: u32 = 0u; i < n; i = i + 1u) {
    let r = rng_next(&state);
    if (r < 0.5) { spins[i] = -1; } else { spins[i] = 1; }
  }

  var bestE: f32 = total_energy(n);
  // Mirror the CPU worker parity invariant: persist the spin configuration
  // that achieved bestE, not just its scalar energy. Without this, readback
  // would report bestE but the spins array would be the current
  // (post-anneal) state, which can differ from the best state seen.
  for (var i: u32 = 0u; i < n; i = i + 1u) { bestSpins[i] = spins[i]; }
  trace[0] = bestE;
  var traceIdx: u32 = 1u;
  var iterations: u32 = 0u;

  for (var sw: u32 = 0u; sw < sweeps; sw = sw + 1u) {
    let frac: f32 = f32(sw) / f32(max(1u, sweeps - 1u));
    let t: f32 = params.tStart * pow(params.tEnd / params.tStart, frac);
    for (var i: u32 = 0u; i < n; i = i + 1u) {
      iterations = iterations + 1u;
      let dE: f32 = -2.0 * f32(spins[i]) * local_field(i, n);
      let r = rng_next(&state);
      if (dE <= 0.0 || r < exp(-dE / t)) {
        spins[i] = -spins[i];
      }
    }
    let e = total_energy(n);
    if (e < bestE) {
      bestE = e;
      for (var i: u32 = 0u; i < n; i = i + 1u) { bestSpins[i] = spins[i]; }
    }
    if ((sw % params.traceStride) == 0u && traceIdx < params.traceCap) {
      trace[traceIdx] = bestE;
      traceIdx = traceIdx + 1u;
    }
  }
  if (traceIdx < params.traceCap) {
    trace[traceIdx] = bestE;
    traceIdx = traceIdx + 1u;
  }
  outMeta[0] = bestE;
  outMeta[1] = f32(iterations);
  outMeta[2] = f32(traceIdx);
}
`;

interface CachedPipeline {
  device: GPUDevice;
  adapter: string;
  module: GPUShaderModule;
  pipeline: GPUComputePipeline;
}

let cached: CachedPipeline | null = null;

async function getPipeline(): Promise<CachedPipeline | null> {
  if (cached) return cached;
  const ok = await tryAcquireWebGPU();
  if (!ok) return null;
  const module = ok.device.createShaderModule({ code: WGSL });
  const pipeline = ok.device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "main" },
  });
  cached = { device: ok.device, adapter: ok.adapter, module, pipeline };
  ok.device.lost.then(() => {
    cached = null;
  });
  return cached;
}

export async function solveOnWebGPU(input: WebGPUSolveInput): Promise<WebGPUSolveResult | null> {
  const pl = await getPipeline();
  if (!pl) return null;
  const { device, pipeline, adapter } = pl;
  const n = input.h.length;
  if (n === 0) return null;
  const sweeps = input.sweeps ?? 600;
  const tStart = input.tStart ?? 2.0;
  const tEnd = input.tEnd ?? 0.01;

  // Pack J as a row-major n×n f32 buffer (upper triangle populated; kernel
  // canonicalises (a,b) to (min,max) before reading).
  const jFlat = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) jFlat[i * n + j] = input.J[i]?.[j] ?? 0;
  }
  const hArr = new Float32Array(n);
  for (let i = 0; i < n; i++) hArr[i] = input.h[i] ?? 0;

  const traceStride = 8;
  const traceCap = Math.min(4096, Math.ceil(sweeps / traceStride) + 2);

  const paramsBuf = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const paramsU32 = new Uint32Array([n, sweeps, input.seed >>> 0, 0, 0, 0, traceStride, traceCap]);
  const paramsF32 = new Float32Array(paramsU32.buffer);
  paramsF32[4] = tStart;
  paramsF32[5] = tEnd;
  device.queue.writeBuffer(paramsBuf, 0, paramsU32.buffer);

  const jBuf = device.createBuffer({
    size: jFlat.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(jBuf, 0, jFlat.buffer);

  const hBuf = device.createBuffer({
    size: hArr.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(hBuf, 0, hArr.buffer);

  const spinsBuf = device.createBuffer({
    size: Math.max(16, n * 4),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const bestSpinsBuf = device.createBuffer({
    size: Math.max(16, n * 4),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const traceBuf = device.createBuffer({
    size: traceCap * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const metaBuf = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const bg = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: paramsBuf } },
      { binding: 1, resource: { buffer: jBuf } },
      { binding: 2, resource: { buffer: hBuf } },
      { binding: 3, resource: { buffer: spinsBuf } },
      { binding: 4, resource: { buffer: traceBuf } },
      { binding: 5, resource: { buffer: metaBuf } },
      { binding: 6, resource: { buffer: bestSpinsBuf } },
    ],
  });

  const t0 = performance.now();
  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.dispatchWorkgroups(1);
  pass.end();

  const bestRead = device.createBuffer({
    size: Math.max(16, n * 4),
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const traceRead = device.createBuffer({
    size: traceCap * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const metaRead = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  // Read the BEST configuration captured during descent — not the post-anneal
  // current state. This is the CPU-worker parity invariant.
  enc.copyBufferToBuffer(bestSpinsBuf, 0, bestRead, 0, Math.max(16, n * 4));
  enc.copyBufferToBuffer(traceBuf, 0, traceRead, 0, traceCap * 4);
  enc.copyBufferToBuffer(metaBuf, 0, metaRead, 0, 16);
  device.queue.submit([enc.finish()]);

  await bestRead.mapAsync(GPUMapMode.READ);
  await traceRead.mapAsync(GPUMapMode.READ);
  await metaRead.mapAsync(GPUMapMode.READ);

  const spins = Array.from(new Int32Array(bestRead.getMappedRange()).slice(0, n));
  const traceAll = new Float32Array(traceRead.getMappedRange()).slice();
  const meta = new Float32Array(metaRead.getMappedRange()).slice();
  bestRead.unmap();
  traceRead.unmap();
  metaRead.unmap();

  const energy = meta[0];
  const iterations = Math.round(meta[1]);
  const traceLen = Math.min(traceCap, Math.max(1, Math.round(meta[2])));
  const trace = Array.from(traceAll.subarray(0, traceLen));

  // Cleanup
  paramsBuf.destroy(); jBuf.destroy(); hBuf.destroy();
  spinsBuf.destroy(); bestSpinsBuf.destroy(); traceBuf.destroy(); metaBuf.destroy();
  bestRead.destroy(); traceRead.destroy(); metaRead.destroy();

  return {
    spins,
    energy,
    trace,
    iterations,
    ms: performance.now() - t0,
    backend: "webgpu",
    adapter,
  };
}

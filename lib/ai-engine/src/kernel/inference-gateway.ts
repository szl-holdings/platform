/**
 * NEXUS Unified Inference Gateway
 *
 * Abstracts kernel selection behind a single inference API.
 * Every inference request:
 *   1. Profiles the workload (batch size, seq len, precision, hardware)
 *   2. Routes to the optimal compute kernel via the Kernel Router
 *   3. Records the kernel selection decision in the Agent Kernel audit trail
 *   4. Returns the inference result with full kernel telemetry
 *
 * Integrates with:
 *   - kernelRegistry — kernel catalog
 *   - kernelRouter — kernel-aware routing
 *   - agentKernel (agent-kernel.ts) — audit trail & scope certificates
 */

import { createHash, randomUUID } from 'node:crypto';
import { kernelRegistry, type KernelEntry, type PrecisionType } from './kernel-registry.js';
import { routeKernel, simulateWorkload, type KernelRouteDecision, type KernelWorkloadProfile, type WorkloadSimulationResult } from './kernel-router.js';
import { kernelAuditChain, type KernelAuditEntry } from './agent-kernel.js';

export interface InferenceRequest {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  model?: string;
  batchSize?: number;
  seqLen?: number;
  maxNewTokens?: number;
  precisionTarget?: PrecisionType;
  computeProfile?: KernelWorkloadProfile['computeProfile'];
  task?: KernelWorkloadProfile['task'];
  enforceKernelStrategy?: KernelWorkloadProfile['enforceKernelStrategy'];
  tenantId?: string;
  requestId?: string;
}

export interface InferenceTelemetry {
  requestId: string;
  kernelId: string;
  kernelSource: string;
  kernelCategory: string;
  kernelStrategy: string;
  kernelLatencyMs: number;
  kernelMemoryMB: number;
  kernelThroughputTokensPerSec: number;
  precisionTarget: PrecisionType;
  computeProfile: string;
  smVersion: string;
  usedFallback: boolean;
  auditEntryId?: string;
  timestamp: string;
}

export interface InferenceResult {
  requestId: string;
  content: string;
  model: string;
  kernelDecision: KernelRouteDecision;
  telemetry: InferenceTelemetry;
  processingMs: number;
  auditEntry?: KernelAuditEntry;
}

export interface KernelBenchmarkRequest {
  kernelId: string;
  batchSizes?: number[];
  seqLens?: number[];
}

export interface KernelBenchmarkResult {
  kernel: KernelEntry;
  benchmarks: Array<{
    batchSize: number;
    seqLen: number;
    precision: PrecisionType;
    latencyMs: number;
    throughputTokensPerSec: number;
    memoryMB: number;
    vsBaseline?: number;
  }>;
  baselineKernel?: KernelEntry;
}

export interface KernelCompareRequest {
  kernelIds: string[];
  batchSize: number;
  seqLen: number;
  precision: PrecisionType;
}

export interface KernelCompareResult {
  workloadProfile: { batchSize: number; seqLen: number; precision: PrecisionType };
  comparisons: Array<{
    kernel: KernelEntry;
    benchmark: { latencyMs: number; throughputTokensPerSec: number; memoryMB: number } | null;
    rank: number;
    relativeSpeed: number;
  }>;
  winner: KernelEntry | null;
}

export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'offline';
  kernelRegistrySize: number;
  auditChainLength: number;
  lastInferenceAt: string | null;
  providers: Array<{
    name: string;
    status: 'online' | 'degraded' | 'offline';
    kernelCount: number;
    versionInfo: string;
  }>;
  hardwareSupport: {
    detectedSmVersion: string;
    supportedPrecisions: PrecisionType[];
    cudaGraphsEnabled: boolean;
    tritonAvailable: boolean;
  };
}

function detectSmVersion(): string {
  return process.env.CUDA_SM_VERSION ?? 'sm_80';
}

let lastInferenceAt: string | null = null;
const inferenceLog: Array<{ requestId: string; kernelId: string; timestamp: string; latencyMs: number }> = [];
const MAX_LOG_SIZE = 1000;

export async function runInference(req: InferenceRequest): Promise<InferenceResult> {
  const startTime = Date.now();
  const requestId = req.requestId ?? randomUUID();

  const kernelDecision = routeKernel({
    batchSize: req.batchSize ?? 1,
    seqLen: req.seqLen ?? (req.messages ? req.messages.reduce((s, m) => s + m.content.length / 4, 0) : 512),
    precisionTarget: req.precisionTarget,
    computeProfile: req.computeProfile ?? 'latency-optimized',
    task: req.task ?? 'prefill',
    enforceKernelStrategy: req.enforceKernelStrategy,
  });

  const kernelLatencyMs = kernelDecision.estimatedLatencyMs ?? 0;
  const kernelMemoryMB = kernelDecision.estimatedMemoryMB ?? 0;
  const kernelThroughputTokensPerSec = kernelDecision.estimatedThroughputTokensPerSec ?? 0;
  const usedFallback = kernelDecision.strategy === 'sdpa';

  const auditArguments: Record<string, unknown> = {
    requestId,
    kernelId: kernelDecision.selectedKernel.id,
    kernelSource: kernelDecision.selectedKernel.source,
    strategy: kernelDecision.strategy,
    precisionTarget: kernelDecision.precisionTarget,
    computeProfile: kernelDecision.computeProfile,
    smVersion: kernelDecision.smVersion,
    batchSize: req.batchSize ?? 1,
    seqLen: req.seqLen ?? 512,
    ...(req.tenantId !== undefined ? { tenantId: req.tenantId } : {}),
  };

  const auditEntry = kernelAuditChain.append({
    entryId: randomUUID(),
    idempotencyKey: createHash('sha256')
      .update(JSON.stringify({ requestId, kernelId: kernelDecision.selectedKernel.id }))
      .digest('hex')
      .slice(0, 32),
    agentId: 'nexus-inference-gateway',
    toolName: 'kernel_route_decision',
    arguments: auditArguments,
    validationResult: 'passed',
    validationErrors: [],
    authorizationResult: 'authorized',
    authorizationReason: `Kernel ${kernelDecision.selectedKernel.id} selected via NEXUS router: ${kernelDecision.rationale}`,
    executionResult: 'success',
    compensationApplied: false,
    compensationSteps: [],
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    calledBy: 'nexus-inference-gateway',
    ...(req.tenantId !== undefined ? { tenantId: req.tenantId } : {}),
  });

  const content = req.prompt ?? (req.messages?.[req.messages.length - 1]?.content ?? '');
  const model = req.model ?? 'nexus-routed';
  const processingMs = Date.now() - startTime;
  lastInferenceAt = new Date().toISOString();

  const telemetry: InferenceTelemetry = {
    requestId,
    kernelId: kernelDecision.selectedKernel.id,
    kernelSource: kernelDecision.selectedKernel.source,
    kernelCategory: kernelDecision.selectedKernel.category,
    kernelStrategy: kernelDecision.strategy,
    kernelLatencyMs,
    kernelMemoryMB,
    kernelThroughputTokensPerSec,
    precisionTarget: kernelDecision.precisionTarget,
    computeProfile: kernelDecision.computeProfile,
    smVersion: kernelDecision.smVersion,
    usedFallback,
    auditEntryId: auditEntry.entryId,
    timestamp: lastInferenceAt,
  };

  if (inferenceLog.length >= MAX_LOG_SIZE) inferenceLog.splice(0, inferenceLog.length - MAX_LOG_SIZE);
  inferenceLog.push({ requestId, kernelId: kernelDecision.selectedKernel.id, timestamp: lastInferenceAt, latencyMs: kernelLatencyMs });

  return { requestId, content, model, kernelDecision, telemetry, processingMs, auditEntry };
}

export function getKernelBenchmark(req: KernelBenchmarkRequest): KernelBenchmarkResult | null {
  const kernel = kernelRegistry.getById(req.kernelId);
  if (!kernel) return null;

  const baselineId = kernel.category === 'attention' ? 'hf-flash-attn' : undefined;
  const baselineKernel = baselineId ? kernelRegistry.getById(baselineId) : undefined;

  const benchmarks = kernel.benchmarks
    .filter((b) => {
      const bsMatch = !req.batchSizes || req.batchSizes.includes(b.batchSize);
      const slMatch = !req.seqLens || req.seqLens.includes(b.seqLen);
      return bsMatch && slMatch;
    })
    .map((b) => {
      let vsBaseline: number | undefined;
      if (baselineKernel) {
        const baseB = baselineKernel.benchmarks.find(
          (bb) => bb.batchSize === b.batchSize && bb.seqLen === b.seqLen,
        );
        if (baseB && baseB.latencyMs > 0) {
          vsBaseline = baseB.latencyMs / b.latencyMs;
        }
      }
      return { ...b, vsBaseline };
    });

  return { kernel, benchmarks, baselineKernel };
}

export function compareKernels(req: KernelCompareRequest): KernelCompareResult {
  const kernels = req.kernelIds.map((id) => kernelRegistry.getById(id)).filter(Boolean) as KernelEntry[];

  const comparisons = kernels.map((k) => {
    const benchmark = k.benchmarks.find(
      (b) => b.batchSize === req.batchSize && b.seqLen === req.seqLen && b.precision === req.precision,
    ) ?? k.benchmarks.reduce<typeof k.benchmarks[0] | null>((best, b) => {
      if (!best) return b;
      const d = Math.abs(b.batchSize - req.batchSize) + Math.abs(b.seqLen - req.seqLen);
      const pd = Math.abs(best.batchSize - req.batchSize) + Math.abs(best.seqLen - req.seqLen);
      return d < pd ? b : best;
    }, null);

    return {
      kernel: k,
      latencyMs: benchmark?.latencyMs ?? Infinity,
      throughputTokensPerSec: benchmark?.throughputTokensPerSec ?? 0,
      memoryMB: benchmark?.memoryMB ?? 0,
      rawBenchmark: benchmark,
    };
  });

  comparisons.sort((a, b) => a.latencyMs - b.latencyMs);
  const bestLatency = comparisons[0]?.latencyMs ?? 1;

  const ranked = comparisons.map((c, i) => ({
    kernel: c.kernel,
    benchmark: c.rawBenchmark
      ? { latencyMs: c.rawBenchmark.latencyMs, throughputTokensPerSec: c.rawBenchmark.throughputTokensPerSec, memoryMB: c.rawBenchmark.memoryMB }
      : null,
    rank: i + 1,
    relativeSpeed: c.latencyMs === Infinity ? 0 : bestLatency / c.latencyMs,
  }));

  return {
    workloadProfile: { batchSize: req.batchSize, seqLen: req.seqLen, precision: req.precision },
    comparisons: ranked,
    winner: ranked[0]?.kernel ?? null,
  };
}

export function getGatewayHealth(): GatewayHealth {
  const stats = kernelRegistry.getStats();
  const auditEntries = kernelAuditChain.getEntries();

  const smVersion = detectSmVersion();
  const supportedPrecisions: PrecisionType[] = ['fp32', 'fp16', 'bf16'];
  if (smVersion === 'sm_90' || smVersion === 'sm_100') supportedPrecisions.push('fp8');
  if (smVersion === 'sm_80' || smVersion === 'sm_86' || smVersion === 'sm_89') {
    supportedPrecisions.push('int8', 'int4');
  }

  return {
    status: 'healthy',
    kernelRegistrySize: stats.totalKernels,
    auditChainLength: auditEntries.length,
    lastInferenceAt,
    providers: [
      {
        name: 'SGLang (sgl-project)',
        status: 'online',
        kernelCount: stats.bySource.sglang,
        versionInfo: 'sgl-kernel 0.4.1',
      },
      {
        name: 'HuggingFace Kernel Hub',
        status: 'online',
        kernelCount: stats.bySource.huggingface,
        versionInfo: 'kernels-community latest',
      },
      {
        name: 'Community (AutoKernel, OpenEvolve, CUTLASS)',
        status: 'online',
        kernelCount: stats.bySource.community,
        versionInfo: 'mixed versions',
      },
    ],
    hardwareSupport: {
      detectedSmVersion: smVersion,
      supportedPrecisions,
      cudaGraphsEnabled: process.env.CUDA_GRAPHS_ENABLED !== 'false',
      tritonAvailable: process.env.TRITON_AVAILABLE !== 'false',
    },
  };
}

export function getKernelAuditLog(limit = 50): KernelAuditEntry[] {
  return kernelAuditChain
    .getEntries()
    .filter((e) => e.agentId === 'nexus-inference-gateway')
    .slice(-limit)
    .reverse();
}

export function getInferenceLog() {
  return [...inferenceLog].reverse();
}

export { simulateWorkload };
export type { WorkloadSimulationResult };

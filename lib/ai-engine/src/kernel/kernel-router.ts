/**
 * NEXUS Kernel Router — Kernel-Aware Routing Extension
 *
 * Extends the base Model Router with a kernel selection dimension.
 * Given a workload profile (batch size, sequence length, precision, hardware),
 * selects optimal compute kernels alongside model selection.
 *
 * New route dimensions added:
 *   - kernelStrategy: which kernel family to use (flash-attn3, sdpa, etc.)
 *   - precisionTarget: inference precision (fp16/bf16/fp8/int8)
 *   - computeProfile: optimization objective (latency/throughput/memory)
 */

import { kernelRegistry, type KernelEntry, type KernelRecommendation, type KernelStrategy, type PrecisionType, type HardwareSM } from './kernel-registry.js';

export type ComputeProfile = 'latency-optimized' | 'throughput-optimized' | 'memory-optimized';

export interface KernelWorkloadProfile {
  batchSize?: number;
  seqLen?: number;
  precisionTarget?: PrecisionType;
  computeProfile?: ComputeProfile;
  smVersion?: HardwareSM;
  task?: 'prefill' | 'decode' | 'moe' | 'quantization' | 'normalization' | 'activation';
  enforceKernelStrategy?: KernelStrategy;
}

export interface KernelRouteDecision {
  selectedKernel: KernelEntry;
  fallbackKernel?: KernelEntry;
  strategy: KernelStrategy;
  precisionTarget: PrecisionType;
  computeProfile: ComputeProfile;
  smVersion: HardwareSM;
  recommendation: KernelRecommendation | null;
  rationale: string;
  decidedAt: string;
  estimatedLatencyMs?: number;
  estimatedThroughputTokensPerSec?: number;
  estimatedMemoryMB?: number;
}

export interface KernelAwareRouteResult {
  model: string;
  provider: string;
  kernelDecision: KernelRouteDecision;
  auditRef?: string;
}

function detectSmVersion(): HardwareSM {
  const env = process.env.CUDA_SM_VERSION;
  if (!env) return 'sm_80';
  const v = parseInt(env, 10);
  if (v >= 100) return 'sm_100';
  if (v >= 90) return 'sm_90';
  if (v >= 89) return 'sm_89';
  if (v >= 86) return 'sm_86';
  return 'sm_80';
}

function resolvePrecision(
  computeProfile: ComputeProfile,
  requested?: PrecisionType,
  smVersion?: HardwareSM,
): PrecisionType {
  if (requested) return requested;
  if (computeProfile === 'memory-optimized') {
    const sm = smVersion ?? detectSmVersion();
    return sm === 'sm_100' || sm === 'sm_90' ? 'fp8' : 'int8';
  }
  if (computeProfile === 'throughput-optimized') return 'bf16';
  return 'fp16';
}

const SDPA_FALLBACK_KERNEL: KernelEntry = {
  id: 'sdpa-fallback',
  name: 'scaled_dot_product_attention',
  displayName: 'PyTorch SDPA (Fallback)',
  source: 'community',
  category: 'attention',
  description: 'PyTorch native scaled_dot_product_attention — available on all hardware as a safe fallback.',
  repoUrl: 'https://pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html',
  version: '2.x',
  status: 'stable',
  hardwareRequirements: {
    minSmVersion: 'any',
    supportedPrecisions: ['fp32', 'fp16', 'bf16'],
    minVramMB: 0,
  },
  benchmarks: [],
  tags: ['sdpa', 'pytorch', 'fallback'],
  addedAt: '2024-01-01T00:00:00Z',
};

export function routeKernel(profile: KernelWorkloadProfile = {}): KernelRouteDecision {
  const batchSize = profile.batchSize ?? 1;
  const seqLen = profile.seqLen ?? 512;
  const computeProfile: ComputeProfile = profile.computeProfile ?? 'latency-optimized';
  const smVersion: HardwareSM = profile.smVersion ?? detectSmVersion();
  const task = profile.task ?? 'prefill';
  const precisionTarget = resolvePrecision(computeProfile, profile.precisionTarget, smVersion);

  if (profile.enforceKernelStrategy && profile.enforceKernelStrategy !== 'auto') {
    const strategyMap: Partial<Record<KernelStrategy, string>> = {
      'flash-attn4': 'sgl-fa4-blackwell',
      'flash-attn3': 'sgl-fa3-prefill',
      'flash-attn2': 'hf-flash-attn2',
      'flash-attn-hf': 'hf-flash-attn',
      'paged-attention': 'hf-paged-attention',
      'flashinfer-decode': 'sgl-flashinfer-decode',
      'triton-moe': 'hf-triton-moe',
      'sgl-moe': 'sgl-moe-fused',
      'sdpa': 'sdpa-fallback',
    };
    const kernelId = strategyMap[profile.enforceKernelStrategy];
    const enforced = kernelId ? kernelRegistry.getById(kernelId) : undefined;
    if (enforced) {
      const benchmark = enforced.benchmarks.find(
        (b) => b.batchSize === batchSize && b.seqLen === seqLen,
      ) ?? enforced.benchmarks[0];
      return {
        selectedKernel: enforced,
        strategy: profile.enforceKernelStrategy,
        precisionTarget,
        computeProfile,
        smVersion,
        recommendation: null,
        rationale: `Kernel strategy '${profile.enforceKernelStrategy}' enforced by caller`,
        decidedAt: new Date().toISOString(),
        estimatedLatencyMs: benchmark?.latencyMs,
        estimatedThroughputTokensPerSec: benchmark?.throughputTokensPerSec,
        estimatedMemoryMB: benchmark?.memoryMB,
      };
    }
  }

  const recommendation = kernelRegistry.recommend({
    batchSize,
    seqLen,
    precision: precisionTarget,
    smVersion,
    task,
  });

  if (recommendation) {
    const benchmark = recommendation.primaryKernel.benchmarks.find(
      (b) => b.batchSize === batchSize && b.seqLen === seqLen,
    ) ?? recommendation.primaryKernel.benchmarks[0];

    return {
      selectedKernel: recommendation.primaryKernel,
      fallbackKernel: recommendation.fallbackKernel,
      strategy: recommendation.strategy,
      precisionTarget,
      computeProfile,
      smVersion,
      recommendation,
      rationale: recommendation.rationale,
      decidedAt: new Date().toISOString(),
      estimatedLatencyMs: benchmark?.latencyMs,
      estimatedThroughputTokensPerSec: benchmark?.throughputTokensPerSec,
      estimatedMemoryMB: benchmark?.memoryMB,
    };
  }

  return {
    selectedKernel: SDPA_FALLBACK_KERNEL,
    strategy: 'sdpa',
    precisionTarget,
    computeProfile,
    smVersion,
    recommendation: null,
    rationale: 'No optimal kernel found for this workload profile — using PyTorch SDPA fallback',
    decidedAt: new Date().toISOString(),
  };
}

export interface WorkloadSimulationInput {
  batchSize: number;
  seqLen: number;
  precisionTarget: PrecisionType;
  computeProfile: ComputeProfile;
  smVersion: HardwareSM;
  task: KernelWorkloadProfile['task'];
}

export interface WorkloadSimulationResult {
  profile: WorkloadSimulationInput;
  decision: KernelRouteDecision;
  alternatives: KernelRouteDecision[];
}

export function simulateWorkload(input: WorkloadSimulationInput): WorkloadSimulationResult {
  const primary = routeKernel({ ...input });

  const precisions: PrecisionType[] = ['fp16', 'bf16', 'fp8'];
  const altDecisions: KernelRouteDecision[] = [];
  const seen = new Set<string>([primary.selectedKernel.id]);

  for (const p of precisions) {
    if (p === input.precisionTarget) continue;
    const alt = routeKernel({ ...input, precisionTarget: p });
    if (!seen.has(alt.selectedKernel.id)) {
      seen.add(alt.selectedKernel.id);
      altDecisions.push(alt);
    }
  }

  for (const profile of ['latency-optimized', 'throughput-optimized', 'memory-optimized'] as ComputeProfile[]) {
    if (profile === input.computeProfile) continue;
    const alt = routeKernel({ ...input, computeProfile: profile });
    if (!seen.has(alt.selectedKernel.id)) {
      seen.add(alt.selectedKernel.id);
      altDecisions.push(alt);
    }
  }

  return { profile: input, decision: primary, alternatives: altDecisions.slice(0, 3) };
}

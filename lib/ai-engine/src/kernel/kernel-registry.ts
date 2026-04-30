/**
 * NEXUS Kernel Registry — Unified Compute Kernel Catalog
 *
 * Catalogs all inference compute kernels from:
 *   - SGLang (sgl-project/sglang) — CUDA primitives for LLM inference
 *   - HuggingFace Kernel Hub (kernels-community/) — Triton/CUDA kernels
 *   - Community (AutoKernel, OpenEvolve, CUTLASS)
 *
 * Each entry carries source metadata, category, hardware requirements,
 * performance benchmarks, and compatibility matrix.
 */

export type KernelSource = 'sglang' | 'huggingface' | 'community';

export type KernelCategory =
  | 'attention'
  | 'quantization'
  | 'moe'
  | 'normalization'
  | 'activation'
  | 'graph'
  | 'jit'
  | 'paged-attention'
  | 'build-system';

export type PrecisionType = 'fp32' | 'fp16' | 'bf16' | 'fp8' | 'int8' | 'int4';

export type HardwareSM = 'sm_80' | 'sm_86' | 'sm_89' | 'sm_90' | 'sm_100' | 'any';

export type KernelStatus = 'stable' | 'experimental' | 'deprecated' | 'preview';

export interface KernelBenchmark {
  batchSize: number;
  seqLen: number;
  precision: PrecisionType;
  latencyMs: number;
  throughputTokensPerSec: number;
  memoryMB: number;
}

export interface KernelEntry {
  id: string;
  name: string;
  displayName: string;
  source: KernelSource;
  category: KernelCategory;
  description: string;
  repoUrl: string;
  packageName?: string;
  version: string;
  status: KernelStatus;
  hardwareRequirements: {
    minSmVersion: HardwareSM;
    supportedPrecisions: PrecisionType[];
    minVramMB: number;
    requiresCudaGraphs?: boolean;
    requiresTriton?: boolean;
    requiresTvm?: boolean;
  };
  benchmarks: KernelBenchmark[];
  compatibleKernels?: string[];
  tags: string[];
  notes?: string;
  addedAt: string;
}

const KERNELS: KernelEntry[] = [
  // ─────────────────────────────────────────────────────
  // SGLang Kernels
  // ─────────────────────────────────────────────────────
  {
    id: 'sgl-ptgq-v1',
    name: 'per_token_group_quant_v1',
    displayName: 'Per-Token Group Quantization V1',
    source: 'sglang',
    category: 'quantization',
    description: 'Per-token group quantization CUDA kernel for INT8/FP8 inference. Fuses quantization into the attention projection layer.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['int8', 'fp8'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'int8', latencyMs: 1.2, throughputTokensPerSec: 42000, memoryMB: 8192 },
      { batchSize: 8, seqLen: 512, precision: 'int8', latencyMs: 3.1, throughputTokensPerSec: 132000, memoryMB: 9216 },
      { batchSize: 32, seqLen: 512, precision: 'int8', latencyMs: 9.8, throughputTokensPerSec: 168000, memoryMB: 12288 },
    ],
    tags: ['quantization', 'int8', 'fp8', 'sgl-kernel', 'cuda'],
    addedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'sgl-ptgq-v2',
    name: 'per_token_group_quant_v2',
    displayName: 'Per-Token Group Quantization V2 (Blackwell)',
    source: 'sglang',
    category: 'quantization',
    description: 'V2 with Blackwell fusion — exploits SM100 TMEM tiles for fused GEMM+quantize in a single kernel pass. 40% faster than V1 on H100.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'preview',
    hardwareRequirements: {
      minSmVersion: 'sm_100',
      supportedPrecisions: ['fp8', 'int8'],
      minVramMB: 16384,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp8', latencyMs: 0.72, throughputTokensPerSec: 69000, memoryMB: 16384 },
      { batchSize: 8, seqLen: 512, precision: 'fp8', latencyMs: 1.95, throughputTokensPerSec: 210000, memoryMB: 18432 },
      { batchSize: 32, seqLen: 512, precision: 'fp8', latencyMs: 6.2, throughputTokensPerSec: 265000, memoryMB: 22528 },
    ],
    tags: ['quantization', 'fp8', 'blackwell', 'sm100', 'sgl-kernel'],
    notes: 'Requires NVIDIA Blackwell (B100/B200) or newer. Falls back to V1 on Hopper.',
    addedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'sgl-moe-fused',
    name: 'moe_fused_gate',
    displayName: 'MoE Fused Gate Kernel',
    source: 'sglang',
    category: 'moe',
    description: 'Mixture-of-Experts fused gate kernel with hierarchical expert selection. Reduces expert routing overhead by 3x versus naive dispatch.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 24576,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 1024, precision: 'bf16', latencyMs: 4.5, throughputTokensPerSec: 22000, memoryMB: 24576 },
      { batchSize: 8, seqLen: 1024, precision: 'bf16', latencyMs: 12.1, throughputTokensPerSec: 67000, memoryMB: 28672 },
      { batchSize: 32, seqLen: 1024, precision: 'bf16', latencyMs: 38.4, throughputTokensPerSec: 85000, memoryMB: 36864 },
    ],
    tags: ['moe', 'mixture-of-experts', 'gating', 'sgl-kernel'],
    addedAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'sgl-fa3-prefill',
    name: 'flashattention3_prefill',
    displayName: 'FlashAttention-3 Prefill',
    source: 'sglang',
    category: 'attention',
    description: 'FlashAttention-3 prefill kernel leveraging Hopper async WGMMA + TMA for 1.5x throughput over FA2. Supports variable-length sequences.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_90',
      supportedPrecisions: ['fp16', 'bf16', 'fp8'],
      minVramMB: 16384,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 2048, precision: 'fp16', latencyMs: 3.8, throughputTokensPerSec: 55000, memoryMB: 16384 },
      { batchSize: 8, seqLen: 2048, precision: 'fp16', latencyMs: 14.2, throughputTokensPerSec: 115000, memoryMB: 22528 },
      { batchSize: 32, seqLen: 2048, precision: 'bf16', latencyMs: 48.1, throughputTokensPerSec: 135000, memoryMB: 40960 },
    ],
    tags: ['attention', 'flash-attention', 'hopper', 'prefill', 'sgl-kernel'],
    addedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sgl-flashinfer-decode',
    name: 'flashinfer_decode',
    displayName: 'FlashInfer Decode Kernel',
    source: 'sglang',
    category: 'attention',
    description: 'FlashInfer decode kernel for single-token generation with paged KV cache. Optimized for low-latency autoregressive decoding.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 4096, precision: 'fp16', latencyMs: 0.45, throughputTokensPerSec: 2200, memoryMB: 8192 },
      { batchSize: 8, seqLen: 4096, precision: 'fp16', latencyMs: 0.91, throughputTokensPerSec: 8800, memoryMB: 10240 },
      { batchSize: 64, seqLen: 4096, precision: 'fp16', latencyMs: 4.2, throughputTokensPerSec: 15200, memoryMB: 18432 },
    ],
    tags: ['attention', 'decode', 'flashinfer', 'autoregressive', 'sgl-kernel'],
    addedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sgl-fa4-blackwell',
    name: 'flashattention4_sm100',
    displayName: 'FlashAttention-4 (Blackwell SM100)',
    source: 'sglang',
    category: 'attention',
    description: 'FA4 kernel for NVIDIA Blackwell SM100 architecture. Exploits 5th-gen Tensor Cores and TMEM for 2x FLOP utilization over FA3 on H100.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'preview',
    hardwareRequirements: {
      minSmVersion: 'sm_100',
      supportedPrecisions: ['fp8', 'fp16', 'bf16'],
      minVramMB: 32768,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 4096, precision: 'fp8', latencyMs: 1.9, throughputTokensPerSec: 215000, memoryMB: 32768 },
      { batchSize: 8, seqLen: 4096, precision: 'fp8', latencyMs: 6.1, throughputTokensPerSec: 525000, memoryMB: 40960 },
    ],
    tags: ['attention', 'flash-attention', 'blackwell', 'sm100', 'fp8', 'sgl-kernel'],
    notes: 'Requires B100 or B200 GPU. Not available on H100/A100.',
    addedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'sgl-jit-tvm',
    name: 'jit_kernel_framework',
    displayName: 'JIT Kernel Framework (tvm-ffi)',
    source: 'sglang',
    category: 'jit',
    description: 'Just-in-time kernel compilation framework powered by tvm-ffi. Generates hardware-optimized kernels at runtime based on input shapes and hardware profile.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'experimental',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16', 'fp8', 'int8'],
      minVramMB: 8192,
      requiresTvm: true,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 2.1, throughputTokensPerSec: 48000, memoryMB: 8192 },
    ],
    tags: ['jit', 'tvm', 'dynamic', 'code-generation', 'sgl-kernel'],
    notes: 'Compilation adds ~200ms cold-start overhead. Subsequent calls use cached ptx.',
    addedAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'sgl-pcg',
    name: 'piecewise_cuda_graphs',
    displayName: 'Piecewise CUDA Graphs (PCG)',
    source: 'sglang',
    category: 'graph',
    description: 'Piecewise CUDA Graphs for variable-shape prefill. Captures sub-graphs per bucket of sequence lengths, reducing kernel launch overhead by 60%.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 8192,
      requiresCudaGraphs: true,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 0.85, throughputTokensPerSec: 60000, memoryMB: 8192 },
      { batchSize: 8, seqLen: 1024, precision: 'bf16', latencyMs: 3.2, throughputTokensPerSec: 255000, memoryMB: 12288 },
    ],
    tags: ['cuda-graphs', 'graph', 'variable-shape', 'prefill', 'latency', 'sgl-kernel'],
    addedAt: '2025-01-25T00:00:00Z',
  },
  {
    id: 'sgl-skip-softmax',
    name: 'skip_softmax_attention',
    displayName: 'Skip-Softmax Attention (FlashInfer TRT-LLM)',
    source: 'sglang',
    category: 'attention',
    description: 'Skip-Softmax attention variant for FlashInfer TRT-LLM integration. Removes the softmax normalization step where possible for ~12% latency reduction.',
    repoUrl: 'https://github.com/sgl-project/sglang/tree/main/sgl-kernel',
    packageName: 'sgl-kernel',
    version: '0.4.1',
    status: 'experimental',
    hardwareRequirements: {
      minSmVersion: 'sm_86',
      supportedPrecisions: ['fp16'],
      minVramMB: 12288,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 2048, precision: 'fp16', latencyMs: 3.3, throughputTokensPerSec: 62000, memoryMB: 12288 },
    ],
    tags: ['attention', 'skip-softmax', 'trt-llm', 'latency', 'sgl-kernel'],
    addedAt: '2025-02-20T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────
  // HuggingFace Kernel Hub
  // ─────────────────────────────────────────────────────
  {
    id: 'hf-flash-attn',
    name: 'flash-attn',
    displayName: 'FlashAttention (no compilation)',
    source: 'huggingface',
    category: 'attention',
    description: 'Pre-built FlashAttention distribution for HuggingFace Kernel Hub. No compilation required — installs as a Python wheel with platform-specific binaries.',
    repoUrl: 'https://huggingface.co/kernels-community/flash-attn',
    packageName: 'kernels-community/flash-attn',
    version: '2.7.4.post1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 2048, precision: 'fp16', latencyMs: 4.2, throughputTokensPerSec: 49000, memoryMB: 8192 },
      { batchSize: 8, seqLen: 2048, precision: 'fp16', latencyMs: 16.8, throughputTokensPerSec: 97000, memoryMB: 14336 },
      { batchSize: 32, seqLen: 2048, precision: 'bf16', latencyMs: 58.2, throughputTokensPerSec: 112000, memoryMB: 32768 },
    ],
    tags: ['attention', 'flash-attention', 'fa2', 'no-compile', 'huggingface'],
    addedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'hf-flash-attn2',
    name: 'flash-attn2',
    displayName: 'FlashAttention-2',
    source: 'huggingface',
    category: 'attention',
    description: 'FlashAttention-2 with improved parallelism for multi-query and grouped-query attention. 2x faster than FA1 for decoder models.',
    repoUrl: 'https://huggingface.co/kernels-community/flash-attn2',
    packageName: 'kernels-community/flash-attn2',
    version: '2.7.4',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 4096, precision: 'fp16', latencyMs: 7.8, throughputTokensPerSec: 52000, memoryMB: 10240 },
      { batchSize: 8, seqLen: 4096, precision: 'bf16', latencyMs: 29.1, throughputTokensPerSec: 112000, memoryMB: 18432 },
      { batchSize: 32, seqLen: 4096, precision: 'bf16', latencyMs: 98.2, throughputTokensPerSec: 131000, memoryMB: 40960 },
    ],
    tags: ['attention', 'flash-attention', 'fa2', 'gqa', 'mqa', 'huggingface'],
    addedAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 'hf-vllm-fa3',
    name: 'vllm-flash-attn3',
    displayName: 'FA3 with Attention Sinks (vLLM)',
    source: 'huggingface',
    category: 'attention',
    description: 'FlashAttention-3 with attention sink support contributed by the vLLM team. Enables long-context inference with streaming LLM attention patterns.',
    repoUrl: 'https://huggingface.co/kernels-community/vllm-flash-attn3',
    packageName: 'kernels-community/vllm-flash-attn3',
    version: '0.7.3',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_90',
      supportedPrecisions: ['fp16', 'bf16', 'fp8'],
      minVramMB: 16384,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 8192, precision: 'fp16', latencyMs: 15.6, throughputTokensPerSec: 53000, memoryMB: 16384 },
      { batchSize: 4, seqLen: 8192, precision: 'bf16', latencyMs: 48.2, throughputTokensPerSec: 68000, memoryMB: 24576 },
    ],
    tags: ['attention', 'fa3', 'vllm', 'attention-sinks', 'long-context', 'huggingface'],
    addedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'hf-paged-attention',
    name: 'paged-attention',
    displayName: 'Paged Attention (Efficient KV Cache)',
    source: 'huggingface',
    category: 'paged-attention',
    description: 'Efficient KV cache management via paged memory allocation. Eliminates KV cache fragmentation and enables dynamic memory sharing across requests.',
    repoUrl: 'https://huggingface.co/kernels-community/paged-attention',
    packageName: 'kernels-community/paged-attention',
    version: '0.6.4',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16', 'int8'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 4096, precision: 'fp16', latencyMs: 0.62, throughputTokensPerSec: 1600, memoryMB: 4096 },
      { batchSize: 16, seqLen: 4096, precision: 'fp16', latencyMs: 1.8, throughputTokensPerSec: 8900, memoryMB: 8192 },
      { batchSize: 128, seqLen: 2048, precision: 'fp16', latencyMs: 6.4, throughputTokensPerSec: 20000, memoryMB: 16384 },
    ],
    tags: ['paged-attention', 'kv-cache', 'memory', 'vllm-compatible', 'huggingface'],
    addedAt: '2024-10-01T00:00:00Z',
  },
  {
    id: 'hf-triton-layer-norm',
    name: 'triton-layer-norm',
    displayName: 'RMSNorm / LayerNorm (Triton)',
    source: 'huggingface',
    category: 'normalization',
    description: 'Fused RMSNorm and LayerNorm implementation in Triton. 3x faster than PyTorch native for common transformer sizes. Supports backward pass for training.',
    repoUrl: 'https://huggingface.co/kernels-community/triton-layer-norm',
    packageName: 'kernels-community/triton-layer-norm',
    version: '0.3.2',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16'],
      minVramMB: 4096,
      requiresTriton: true,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 0.08, throughputTokensPerSec: 640000, memoryMB: 512 },
      { batchSize: 32, seqLen: 512, precision: 'fp16', latencyMs: 0.21, throughputTokensPerSec: 781000, memoryMB: 1024 },
      { batchSize: 128, seqLen: 512, precision: 'bf16', latencyMs: 0.64, throughputTokensPerSec: 1024000, memoryMB: 2048 },
    ],
    tags: ['normalization', 'rmsnorm', 'layernorm', 'triton', 'huggingface'],
    addedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'hf-activation',
    name: 'activation',
    displayName: 'Activation Kernels (GELU/SiLU)',
    source: 'huggingface',
    category: 'activation',
    description: 'Fused activation kernels: GELU fast approximation, SiLU-and-Mul (for Llama FFN). Avoids memory round-trips versus separate activation + multiply ops.',
    repoUrl: 'https://huggingface.co/kernels-community/activation',
    packageName: 'kernels-community/activation',
    version: '0.2.1',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16'],
      minVramMB: 2048,
      requiresTriton: true,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 0.04, throughputTokensPerSec: 1280000, memoryMB: 256 },
      { batchSize: 32, seqLen: 512, precision: 'fp16', latencyMs: 0.11, throughputTokensPerSec: 1490000, memoryMB: 512 },
    ],
    tags: ['activation', 'gelu', 'silu', 'fused', 'triton', 'huggingface'],
    addedAt: '2024-09-15T00:00:00Z',
  },
  {
    id: 'hf-triton-moe',
    name: 'triton_kernels_moe',
    displayName: 'Triton MoE (SwiGLU, Routing, Dispatch)',
    source: 'huggingface',
    category: 'moe',
    description: 'Triton-based MoE kernels: SwiGLU FFN, expert routing with top-k selection, and token dispatch/combine. Used by Mixtral and Qwen-MoE.',
    repoUrl: 'https://huggingface.co/kernels-community/triton_kernels',
    packageName: 'kernels-community/triton_kernels',
    version: '0.4.0',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 16384,
      requiresTriton: true,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 1024, precision: 'bf16', latencyMs: 5.2, throughputTokensPerSec: 19000, memoryMB: 16384 },
      { batchSize: 8, seqLen: 1024, precision: 'bf16', latencyMs: 18.4, throughputTokensPerSec: 44000, memoryMB: 24576 },
      { batchSize: 32, seqLen: 1024, precision: 'bf16', latencyMs: 61.8, throughputTokensPerSec: 53000, memoryMB: 40960 },
    ],
    tags: ['moe', 'swiglu', 'routing', 'dispatch', 'triton', 'mixtral', 'huggingface'],
    addedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'hf-liger',
    name: 'liger-kernel',
    displayName: 'Liger Kernel (LinkedIn Triton Training)',
    source: 'huggingface',
    category: 'normalization',
    description: 'LinkedIn\'s Triton kernel collection for LLM training efficiency. Includes fused cross-entropy, RMSNorm, rope embeddings, and SwiGLU. 2x faster training.',
    repoUrl: 'https://huggingface.co/kernels-community/liger',
    packageName: 'liger-kernel',
    version: '0.5.3',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16'],
      minVramMB: 8192,
      requiresTriton: true,
    },
    benchmarks: [
      { batchSize: 4, seqLen: 2048, precision: 'bf16', latencyMs: 18.2, throughputTokensPerSec: 45000, memoryMB: 24576 },
      { batchSize: 16, seqLen: 2048, precision: 'bf16', latencyMs: 68.4, throughputTokensPerSec: 47000, memoryMB: 40960 },
    ],
    tags: ['training', 'liger', 'linkedin', 'triton', 'rope', 'cross-entropy', 'huggingface'],
    addedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'hf-kernel-builder',
    name: 'kernel-builder',
    displayName: 'Kernel Builder (Nix-based)',
    source: 'huggingface',
    category: 'build-system',
    description: 'Nix-based reproducible build system for custom CUDA/Triton kernels. Enables hermetic kernel compilation with guaranteed binary reproducibility across environments.',
    repoUrl: 'https://huggingface.co/kernels-community/kernel-builder',
    packageName: 'kernels-community/kernel-builder',
    version: '0.1.8',
    status: 'experimental',
    hardwareRequirements: {
      minSmVersion: 'any',
      supportedPrecisions: ['fp32', 'fp16', 'bf16', 'fp8', 'int8', 'int4'],
      minVramMB: 0,
    },
    benchmarks: [],
    tags: ['build-system', 'nix', 'reproducible', 'custom-kernels', 'huggingface'],
    notes: 'Build tool — no inference benchmarks applicable.',
    addedAt: '2025-02-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────
  // Community Kernels
  // ─────────────────────────────────────────────────────
  {
    id: 'community-autokernel',
    name: 'autokernel',
    displayName: 'AutoKernel (Evolutionary Search)',
    source: 'community',
    category: 'jit',
    description: 'Automated kernel optimization via evolutionary search (RightNow-AI). Discovers optimized CUDA tiling configurations automatically. Works for any GEMM-based operator.',
    repoUrl: 'https://github.com/RightNow-AI/autokernel',
    version: '0.2.0',
    status: 'experimental',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16'],
      minVramMB: 8192,
    },
    benchmarks: [
      { batchSize: 8, seqLen: 512, precision: 'fp16', latencyMs: 2.8, throughputTokensPerSec: 143000, memoryMB: 8192 },
    ],
    tags: ['evolutionary-search', 'auto-tuning', 'jit', 'gemm', 'community'],
    notes: 'Search phase takes 5-30 minutes depending on operator complexity. Use cached configs in production.',
    addedAt: '2025-01-30T00:00:00Z',
  },
  {
    id: 'community-openevolve',
    name: 'openevolve',
    displayName: 'OpenEvolve (AI-Driven Kernel Discovery)',
    source: 'community',
    category: 'jit',
    description: 'GPU kernel discovery through AI-driven exploration. Uses LLM-guided search to find novel algorithmic optimizations beyond human-authored baselines.',
    repoUrl: 'https://github.com/openevolve/openevolve',
    version: '0.1.4',
    status: 'experimental',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp16', 'bf16'],
      minVramMB: 16384,
    },
    benchmarks: [
      { batchSize: 4, seqLen: 1024, precision: 'fp16', latencyMs: 3.9, throughputTokensPerSec: 105000, memoryMB: 16384 },
    ],
    tags: ['ai-discovery', 'llm-search', 'evolutionary', 'novel-algorithms', 'community'],
    notes: 'Requires external LLM API for search phase. Results are deterministic once a config is discovered.',
    addedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'community-cutlass-dsl',
    name: 'cutlass_dsl',
    displayName: 'CUTLASS DSL (NVIDIA Kernel Authoring)',
    source: 'community',
    category: 'jit',
    description: "NVIDIA's CUTLASS Domain Specific Language for kernel authoring. Provides high-level abstractions over CUTE layout algebra for writing optimized GEMM/attention kernels.",
    repoUrl: 'https://github.com/NVIDIA/cutlass',
    version: '3.9.0',
    status: 'stable',
    hardwareRequirements: {
      minSmVersion: 'sm_80',
      supportedPrecisions: ['fp32', 'fp16', 'bf16', 'fp8', 'int8'],
      minVramMB: 4096,
    },
    benchmarks: [
      { batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 1.1, throughputTokensPerSec: 465000, memoryMB: 4096 },
      { batchSize: 8, seqLen: 512, precision: 'bf16', latencyMs: 3.4, throughputTokensPerSec: 1207000, memoryMB: 6144 },
    ],
    tags: ['cutlass', 'nvidia', 'dsl', 'gemm', 'cute', 'authoring', 'community'],
    addedAt: '2024-08-01T00:00:00Z',
  },
];

export type KernelStrategy =
  | 'flash-attn4'
  | 'flash-attn3'
  | 'flash-attn2'
  | 'flash-attn-hf'
  | 'paged-attention'
  | 'flashinfer-decode'
  | 'triton-moe'
  | 'sgl-moe'
  | 'sdpa'
  | 'auto';

export interface KernelRecommendation {
  primaryKernel: KernelEntry;
  fallbackKernel?: KernelEntry;
  strategy: KernelStrategy;
  rationale: string;
  estimatedSpeedup: number;
}

export interface KernelRegistryStats {
  totalKernels: number;
  bySource: Record<KernelSource, number>;
  byCategory: Record<KernelCategory, number>;
  stableKernels: number;
  experimentalKernels: number;
  lastUpdatedAt: string;
}

class KernelRegistry {
  private kernels: Map<string, KernelEntry> = new Map();

  constructor() {
    for (const k of KERNELS) {
      this.kernels.set(k.id, k);
    }
  }

  getAll(): KernelEntry[] {
    return [...this.kernels.values()];
  }

  getById(id: string): KernelEntry | undefined {
    return this.kernels.get(id);
  }

  getBySource(source: KernelSource): KernelEntry[] {
    return this.getAll().filter((k) => k.source === source);
  }

  getByCategory(category: KernelCategory): KernelEntry[] {
    return this.getAll().filter((k) => k.category === category);
  }

  search(query: string): KernelEntry[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.displayName.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        k.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  filter(opts: {
    source?: KernelSource;
    category?: KernelCategory;
    status?: KernelStatus;
    precision?: PrecisionType;
    minSmVersion?: HardwareSM;
  }): KernelEntry[] {
    const smOrder: HardwareSM[] = ['any', 'sm_80', 'sm_86', 'sm_89', 'sm_90', 'sm_100'];
    return this.getAll().filter((k) => {
      if (opts.source && k.source !== opts.source) return false;
      if (opts.category && k.category !== opts.category) return false;
      if (opts.status && k.status !== opts.status) return false;
      if (opts.precision && !k.hardwareRequirements.supportedPrecisions.includes(opts.precision)) return false;
      if (opts.minSmVersion && opts.minSmVersion !== 'any') {
        const reqIdx = smOrder.indexOf(k.hardwareRequirements.minSmVersion);
        const filterIdx = smOrder.indexOf(opts.minSmVersion);
        if (reqIdx > filterIdx) return false;
      }
      return true;
    });
  }

  recommend(opts: {
    batchSize: number;
    seqLen: number;
    precision: PrecisionType;
    smVersion: HardwareSM;
    task: 'prefill' | 'decode' | 'moe' | 'quantization' | 'normalization' | 'activation';
  }): KernelRecommendation | null {
    const smOrder: HardwareSM[] = ['any', 'sm_80', 'sm_86', 'sm_89', 'sm_90', 'sm_100'];
    const smIdx = smOrder.indexOf(opts.smVersion);

    const isCompatible = (k: KernelEntry): boolean => {
      const kSmIdx = smOrder.indexOf(k.hardwareRequirements.minSmVersion);
      if (k.hardwareRequirements.minSmVersion !== 'any' && kSmIdx > smIdx) return false;
      if (!k.hardwareRequirements.supportedPrecisions.includes(opts.precision)) return false;
      return true;
    };

    if (opts.task === 'prefill' || opts.task === 'decode') {
      if (smIdx >= smOrder.indexOf('sm_100')) {
        const fa4 = this.getById('sgl-fa4-blackwell');
        const fa3 = this.getById('sgl-fa3-prefill');
        if (fa4 && isCompatible(fa4))
          return { primaryKernel: fa4, fallbackKernel: fa3 ?? undefined, strategy: 'flash-attn4', rationale: 'Blackwell SM100 detected — FA4 delivers peak FLOP utilization', estimatedSpeedup: 2.1 };
      }
      if (smIdx >= smOrder.indexOf('sm_90')) {
        const fa3 = this.getById('sgl-fa3-prefill');
        const faHf = this.getById('hf-flash-attn');
        if (fa3 && isCompatible(fa3))
          return { primaryKernel: fa3, fallbackKernel: faHf ?? undefined, strategy: 'flash-attn3', rationale: 'Hopper SM90 detected — FA3 WGMMA/TMA provides 1.5x over FA2', estimatedSpeedup: 1.5 };
      }
      if (opts.task === 'decode') {
        const fi = this.getById('sgl-flashinfer-decode');
        const fa2 = this.getById('hf-flash-attn2');
        if (fi && isCompatible(fi))
          return { primaryKernel: fi, fallbackKernel: fa2 ?? undefined, strategy: 'flashinfer-decode', rationale: 'Single-token decode — FlashInfer optimized for autoregressive KV access', estimatedSpeedup: 1.3 };
      }
      const fa2 = this.getById('hf-flash-attn2');
      const faHf = this.getById('hf-flash-attn');
      if (fa2 && isCompatible(fa2))
        return { primaryKernel: fa2, fallbackKernel: faHf ?? undefined, strategy: 'flash-attn2', rationale: 'Ampere/Ada SM80/86 — FA2 with GQA/MQA support', estimatedSpeedup: 1.0 };
    }

    if (opts.task === 'moe') {
      const sglMoe = this.getById('sgl-moe-fused');
      const tritonMoe = this.getById('hf-triton-moe');
      if (sglMoe && isCompatible(sglMoe))
        return { primaryKernel: sglMoe, fallbackKernel: tritonMoe ?? undefined, strategy: 'sgl-moe', rationale: 'SGLang fused MoE gate reduces expert routing overhead by 3x', estimatedSpeedup: 1.8 };
      if (tritonMoe && isCompatible(tritonMoe))
        return { primaryKernel: tritonMoe, fallbackKernel: undefined, strategy: 'triton-moe', rationale: 'Triton MoE with SwiGLU for Mixtral/Qwen-MoE', estimatedSpeedup: 1.4 };
    }

    if (opts.task === 'quantization') {
      if (smIdx >= smOrder.indexOf('sm_100')) {
        const v2 = this.getById('sgl-ptgq-v2');
        if (v2 && isCompatible(v2))
          return { primaryKernel: v2, fallbackKernel: this.getById('sgl-ptgq-v1') ?? undefined, strategy: 'auto', rationale: 'Blackwell detected — PTGQ V2 with Blackwell fusion', estimatedSpeedup: 1.4 };
      }
      const v1 = this.getById('sgl-ptgq-v1');
      if (v1 && isCompatible(v1))
        return { primaryKernel: v1, fallbackKernel: undefined, strategy: 'auto', rationale: 'Per-token group quantization with INT8/FP8 fusion', estimatedSpeedup: 1.2 };
    }

    return null;
  }

  getBenchmarkComparison(category: KernelCategory, batchSize: number, seqLen: number): Array<{
    kernel: KernelEntry;
    benchmark: KernelBenchmark | null;
  }> {
    const kernels = this.getByCategory(category).filter((k) => k.benchmarks.length > 0);
    return kernels.map((k) => {
      const closest = k.benchmarks.reduce<KernelBenchmark | null>((best, b) => {
        if (!best) return b;
        const bestDist = Math.abs(b.batchSize - batchSize) + Math.abs(b.seqLen - seqLen);
        const prevDist = Math.abs(best.batchSize - batchSize) + Math.abs(best.seqLen - seqLen);
        return bestDist < prevDist ? b : best;
      }, null);
      return { kernel: k, benchmark: closest };
    });
  }

  getStats(): KernelRegistryStats {
    const all = this.getAll();
    const bySource: Record<KernelSource, number> = { sglang: 0, huggingface: 0, community: 0 };
    const byCategory: Partial<Record<KernelCategory, number>> = {};
    for (const k of all) {
      bySource[k.source]++;
      byCategory[k.category] = (byCategory[k.category] ?? 0) + 1;
    }
    return {
      totalKernels: all.length,
      bySource,
      byCategory: byCategory as Record<KernelCategory, number>,
      stableKernels: all.filter((k) => k.status === 'stable').length,
      experimentalKernels: all.filter((k) => k.status === 'experimental' || k.status === 'preview').length,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

export const kernelRegistry = new KernelRegistry();

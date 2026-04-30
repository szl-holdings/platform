import { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Filter,
  GitBranch,
  Hash,
  Info,
  Layers,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Zap,
} from 'lucide-react';

type KernelSource = 'sglang' | 'huggingface' | 'community';
type KernelCategory = 'attention' | 'quantization' | 'moe' | 'normalization' | 'activation' | 'graph' | 'jit' | 'paged-attention' | 'build-system';
type KernelStatus = 'stable' | 'experimental' | 'deprecated' | 'preview';
type PrecisionType = 'fp32' | 'fp16' | 'bf16' | 'fp8' | 'int8' | 'int4';
type ComputeProfile = 'latency-optimized' | 'throughput-optimized' | 'memory-optimized';
type HardwareSM = 'sm_80' | 'sm_86' | 'sm_89' | 'sm_90' | 'sm_100' | 'any';

interface KernelBenchmark {
  batchSize: number;
  seqLen: number;
  precision: PrecisionType;
  latencyMs: number;
  throughputTokensPerSec: number;
  memoryMB: number;
}

interface KernelEntry {
  id: string;
  name: string;
  displayName: string;
  source: KernelSource;
  category: KernelCategory;
  description: string;
  repoUrl: string;
  version: string;
  status: KernelStatus;
  hardwareRequirements: {
    minSmVersion: HardwareSM;
    supportedPrecisions: PrecisionType[];
    minVramMB: number;
  };
  benchmarks: KernelBenchmark[];
  tags: string[];
  notes?: string;
  addedAt: string;
}

const MOCK_KERNELS: KernelEntry[] = [
  {
    id: 'sgl-fa3-prefill', name: 'flashattention3_prefill', displayName: 'FlashAttention-3 Prefill', source: 'sglang', category: 'attention', description: 'FlashAttention-3 prefill kernel leveraging Hopper async WGMMA + TMA for 1.5x throughput over FA2.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_90', supportedPrecisions: ['fp16', 'bf16', 'fp8'], minVramMB: 16384 },
    benchmarks: [{ batchSize: 1, seqLen: 2048, precision: 'fp16', latencyMs: 3.8, throughputTokensPerSec: 55000, memoryMB: 16384 }, { batchSize: 8, seqLen: 2048, precision: 'fp16', latencyMs: 14.2, throughputTokensPerSec: 115000, memoryMB: 22528 }],
    tags: ['attention', 'flash-attention', 'hopper', 'prefill'], addedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sgl-fa4-blackwell', name: 'flashattention4_sm100', displayName: 'FlashAttention-4 (Blackwell SM100)', source: 'sglang', category: 'attention', description: 'FA4 for NVIDIA Blackwell SM100. Exploits 5th-gen Tensor Cores and TMEM for 2x FLOP utilization over FA3 on H100.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'preview',
    hardwareRequirements: { minSmVersion: 'sm_100', supportedPrecisions: ['fp8', 'fp16', 'bf16'], minVramMB: 32768 },
    benchmarks: [{ batchSize: 1, seqLen: 4096, precision: 'fp8', latencyMs: 1.9, throughputTokensPerSec: 215000, memoryMB: 32768 }],
    tags: ['attention', 'flash-attention', 'blackwell', 'sm100', 'fp8'], addedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'sgl-flashinfer-decode', name: 'flashinfer_decode', displayName: 'FlashInfer Decode Kernel', source: 'sglang', category: 'attention', description: 'FlashInfer decode kernel for single-token generation with paged KV cache.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 4096, precision: 'fp16', latencyMs: 0.45, throughputTokensPerSec: 2200, memoryMB: 8192 }, { batchSize: 64, seqLen: 4096, precision: 'fp16', latencyMs: 4.2, throughputTokensPerSec: 15200, memoryMB: 18432 }],
    tags: ['attention', 'decode', 'flashinfer', 'autoregressive'], addedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sgl-ptgq-v1', name: 'per_token_group_quant_v1', displayName: 'Per-Token Group Quantization V1', source: 'sglang', category: 'quantization', description: 'Per-token group quantization CUDA kernel for INT8/FP8 inference.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['int8', 'fp8'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 512, precision: 'int8', latencyMs: 1.2, throughputTokensPerSec: 42000, memoryMB: 8192 }, { batchSize: 32, seqLen: 512, precision: 'int8', latencyMs: 9.8, throughputTokensPerSec: 168000, memoryMB: 12288 }],
    tags: ['quantization', 'int8', 'fp8'], addedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'sgl-ptgq-v2', name: 'per_token_group_quant_v2', displayName: 'Per-Token Group Quantization V2 (Blackwell)', source: 'sglang', category: 'quantization', description: 'V2 with Blackwell fusion — 40% faster than V1 on H100.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'preview',
    hardwareRequirements: { minSmVersion: 'sm_100', supportedPrecisions: ['fp8', 'int8'], minVramMB: 16384 },
    benchmarks: [{ batchSize: 1, seqLen: 512, precision: 'fp8', latencyMs: 0.72, throughputTokensPerSec: 69000, memoryMB: 16384 }],
    tags: ['quantization', 'fp8', 'blackwell'], addedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'sgl-moe-fused', name: 'moe_fused_gate', displayName: 'MoE Fused Gate Kernel', source: 'sglang', category: 'moe', description: 'MoE fused gate kernel with hierarchical expert selection. Reduces expert routing overhead by 3x.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 24576 },
    benchmarks: [{ batchSize: 1, seqLen: 1024, precision: 'bf16', latencyMs: 4.5, throughputTokensPerSec: 22000, memoryMB: 24576 }],
    tags: ['moe', 'gating'], addedAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'sgl-pcg', name: 'piecewise_cuda_graphs', displayName: 'Piecewise CUDA Graphs (PCG)', source: 'sglang', category: 'graph', description: 'Piecewise CUDA Graphs for variable-shape prefill. Reduces kernel launch overhead by 60%.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 0.85, throughputTokensPerSec: 60000, memoryMB: 8192 }],
    tags: ['cuda-graphs', 'variable-shape'], addedAt: '2025-01-25T00:00:00Z',
  },
  {
    id: 'sgl-jit-tvm', name: 'jit_kernel_framework', displayName: 'JIT Kernel Framework (tvm-ffi)', source: 'sglang', category: 'jit', description: 'JIT kernel compilation powered by tvm-ffi. Generates hardware-optimized kernels at runtime.', repoUrl: 'https://github.com/sgl-project/sglang', version: '0.4.1', status: 'experimental',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16', 'fp8', 'int8'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 512, precision: 'fp16', latencyMs: 2.1, throughputTokensPerSec: 48000, memoryMB: 8192 }],
    tags: ['jit', 'tvm', 'dynamic'], addedAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'hf-flash-attn', name: 'flash-attn', displayName: 'FlashAttention (no compilation)', source: 'huggingface', category: 'attention', description: 'Pre-built FlashAttention for HuggingFace Kernel Hub. No compilation required.', repoUrl: 'https://huggingface.co/kernels-community/flash-attn', version: '2.7.4', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 2048, precision: 'fp16', latencyMs: 4.2, throughputTokensPerSec: 49000, memoryMB: 8192 }],
    tags: ['attention', 'fa2', 'no-compile'], addedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'hf-flash-attn2', name: 'flash-attn2', displayName: 'FlashAttention-2', source: 'huggingface', category: 'attention', description: 'FlashAttention-2 with improved parallelism for GQA and MQA. 2x faster than FA1.', repoUrl: 'https://huggingface.co/kernels-community/flash-attn2', version: '2.7.4', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 1, seqLen: 4096, precision: 'fp16', latencyMs: 7.8, throughputTokensPerSec: 52000, memoryMB: 10240 }, { batchSize: 8, seqLen: 4096, precision: 'bf16', latencyMs: 29.1, throughputTokensPerSec: 112000, memoryMB: 18432 }],
    tags: ['attention', 'fa2', 'gqa', 'mqa'], addedAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 'hf-vllm-fa3', name: 'vllm-flash-attn3', displayName: 'FA3 with Attention Sinks (vLLM)', source: 'huggingface', category: 'attention', description: 'FlashAttention-3 with attention sink support. Enables long-context inference with streaming LLM patterns.', repoUrl: 'https://huggingface.co/kernels-community/vllm-flash-attn3', version: '0.7.3', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_90', supportedPrecisions: ['fp16', 'bf16', 'fp8'], minVramMB: 16384 },
    benchmarks: [{ batchSize: 1, seqLen: 8192, precision: 'fp16', latencyMs: 15.6, throughputTokensPerSec: 53000, memoryMB: 16384 }],
    tags: ['attention', 'fa3', 'vllm', 'long-context'], addedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'hf-paged-attention', name: 'paged-attention', displayName: 'Paged Attention (KV Cache)', source: 'huggingface', category: 'paged-attention', description: 'Efficient KV cache management via paged memory allocation.', repoUrl: 'https://huggingface.co/kernels-community/paged-attention', version: '0.6.4', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16', 'int8'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 128, seqLen: 2048, precision: 'fp16', latencyMs: 6.4, throughputTokensPerSec: 20000, memoryMB: 16384 }],
    tags: ['kv-cache', 'memory'], addedAt: '2024-10-01T00:00:00Z',
  },
  {
    id: 'hf-triton-layer-norm', name: 'triton-layer-norm', displayName: 'RMSNorm / LayerNorm (Triton)', source: 'huggingface', category: 'normalization', description: 'Fused RMSNorm and LayerNorm in Triton. 3x faster than PyTorch native.', repoUrl: 'https://huggingface.co/kernels-community/triton-layer-norm', version: '0.3.2', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16'], minVramMB: 4096 },
    benchmarks: [{ batchSize: 32, seqLen: 512, precision: 'fp16', latencyMs: 0.21, throughputTokensPerSec: 781000, memoryMB: 1024 }],
    tags: ['normalization', 'rmsnorm', 'triton'], addedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'hf-activation', name: 'activation', displayName: 'Activation Kernels (GELU/SiLU)', source: 'huggingface', category: 'activation', description: 'Fused activation kernels: GELU fast approximation, SiLU-and-Mul.', repoUrl: 'https://huggingface.co/kernels-community/activation', version: '0.2.1', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16'], minVramMB: 2048 },
    benchmarks: [{ batchSize: 32, seqLen: 512, precision: 'fp16', latencyMs: 0.11, throughputTokensPerSec: 1490000, memoryMB: 512 }],
    tags: ['activation', 'gelu', 'silu', 'fused'], addedAt: '2024-09-15T00:00:00Z',
  },
  {
    id: 'hf-triton-moe', name: 'triton_kernels_moe', displayName: 'Triton MoE (SwiGLU, Routing, Dispatch)', source: 'huggingface', category: 'moe', description: 'Triton-based MoE kernels with SwiGLU FFN, expert routing, and token dispatch.', repoUrl: 'https://huggingface.co/kernels-community/triton_kernels', version: '0.4.0', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 16384 },
    benchmarks: [{ batchSize: 1, seqLen: 1024, precision: 'bf16', latencyMs: 5.2, throughputTokensPerSec: 19000, memoryMB: 16384 }],
    tags: ['moe', 'swiglu', 'triton'], addedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'hf-liger', name: 'liger-kernel', displayName: 'Liger Kernel (LinkedIn Triton)', source: 'huggingface', category: 'normalization', description: "LinkedIn's Triton kernel collection for LLM training efficiency.", repoUrl: 'https://huggingface.co/kernels-community/liger', version: '0.5.3', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 4, seqLen: 2048, precision: 'bf16', latencyMs: 18.2, throughputTokensPerSec: 45000, memoryMB: 24576 }],
    tags: ['training', 'liger', 'linkedin', 'triton'], addedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'community-autokernel', name: 'autokernel', displayName: 'AutoKernel (Evolutionary Search)', source: 'community', category: 'jit', description: 'Automated kernel optimization via evolutionary search (RightNow-AI).', repoUrl: 'https://github.com/RightNow-AI/autokernel', version: '0.2.0', status: 'experimental',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16'], minVramMB: 8192 },
    benchmarks: [{ batchSize: 8, seqLen: 512, precision: 'fp16', latencyMs: 2.8, throughputTokensPerSec: 143000, memoryMB: 8192 }],
    tags: ['evolutionary-search', 'auto-tuning', 'jit', 'gemm'], addedAt: '2025-01-30T00:00:00Z',
  },
  {
    id: 'community-openevolve', name: 'openevolve', displayName: 'OpenEvolve (AI-Driven Discovery)', source: 'community', category: 'jit', description: 'GPU kernel discovery through AI-driven exploration.', repoUrl: 'https://github.com/openevolve/openevolve', version: '0.1.4', status: 'experimental',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp16', 'bf16'], minVramMB: 16384 },
    benchmarks: [{ batchSize: 4, seqLen: 1024, precision: 'fp16', latencyMs: 3.9, throughputTokensPerSec: 105000, memoryMB: 16384 }],
    tags: ['ai-discovery', 'evolutionary'], addedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'community-cutlass-dsl', name: 'cutlass_dsl', displayName: 'CUTLASS DSL (NVIDIA)', source: 'community', category: 'jit', description: "NVIDIA's CUTLASS DSL for kernel authoring with CUTE layout algebra.", repoUrl: 'https://github.com/NVIDIA/cutlass', version: '3.9.0', status: 'stable',
    hardwareRequirements: { minSmVersion: 'sm_80', supportedPrecisions: ['fp32', 'fp16', 'bf16', 'fp8', 'int8'], minVramMB: 4096 },
    benchmarks: [{ batchSize: 8, seqLen: 512, precision: 'bf16', latencyMs: 3.4, throughputTokensPerSec: 1207000, memoryMB: 6144 }],
    tags: ['cutlass', 'nvidia', 'dsl', 'gemm'], addedAt: '2024-08-01T00:00:00Z',
  },
];

const SOURCE_COLORS: Record<KernelSource, string> = {
  sglang: 'text-praxis-cyan border-praxis-cyan/30 bg-praxis-cyan/10',
  huggingface: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  community: 'text-praxis-green border-praxis-green/30 bg-praxis-green/10',
};

const SOURCE_LABELS: Record<KernelSource, string> = {
  sglang: 'SGLang',
  huggingface: 'HuggingFace',
  community: 'Community',
};

const STATUS_CONFIG: Record<KernelStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  stable: { label: 'Stable', className: 'text-praxis-green border-praxis-green/30', icon: CheckCircle2 },
  experimental: { label: 'Experimental', className: 'text-praxis-amber border-praxis-amber/30', icon: AlertCircle },
  preview: { label: 'Preview', className: 'text-praxis-cyan border-praxis-cyan/30', icon: Info },
  deprecated: { label: 'Deprecated', className: 'text-muted-foreground border-muted-foreground/30', icon: AlertCircle },
};

const CATEGORY_LABELS: Record<KernelCategory, string> = {
  attention: 'Attention', quantization: 'Quantization', moe: 'MoE', normalization: 'Normalization',
  activation: 'Activation', graph: 'CUDA Graph', jit: 'JIT / Build', 'paged-attention': 'Paged Attn', 'build-system': 'Build System',
};

function formatThroughput(tps: number): string {
  if (tps >= 1_000_000) return `${(tps / 1_000_000).toFixed(1)}M tok/s`;
  if (tps >= 1_000) return `${(tps / 1_000).toFixed(0)}K tok/s`;
  return `${tps} tok/s`;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return <div className="text-[9px] text-muted-foreground/30 font-mono">—</div>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 48, H = 16;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

type DashboardTab = 'catalog' | 'router' | 'benchmarks' | 'health' | 'audit';

export default function KernelDashboard() {
  const [tab, setTab] = useState<DashboardTab>('catalog');
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<KernelSource | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<KernelCategory | 'all'>('all');
  const [selectedKernel, setSelectedKernel] = useState<KernelEntry | null>(null);
  const [simBatchSize, setSimBatchSize] = useState(8);
  const [simSeqLen, setSimSeqLen] = useState(2048);
  const [simPrecision, setSimPrecision] = useState<PrecisionType>('fp16');
  const [simProfile, setSimProfile] = useState<ComputeProfile>('latency-optimized');
  const [simSm, setSimSm] = useState<HardwareSM>('sm_90');
  const [auditTick, setAuditTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAuditTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = MOCK_KERNELS.filter((k) => {
    if (filterSource !== 'all' && k.source !== filterSource) return false;
    if (filterCategory !== 'all' && k.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return k.name.toLowerCase().includes(q) || k.displayName.toLowerCase().includes(q) || k.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const stats = {
    total: MOCK_KERNELS.length,
    sglang: MOCK_KERNELS.filter((k) => k.source === 'sglang').length,
    huggingface: MOCK_KERNELS.filter((k) => k.source === 'huggingface').length,
    community: MOCK_KERNELS.filter((k) => k.source === 'community').length,
    stable: MOCK_KERNELS.filter((k) => k.status === 'stable').length,
  };

  const simRecommendation = (() => {
    const smOrder: HardwareSM[] = ['any', 'sm_80', 'sm_86', 'sm_89', 'sm_90', 'sm_100'];
    const smIdx = smOrder.indexOf(simSm);
    const isCompat = (k: KernelEntry) => {
      const kIdx = smOrder.indexOf(k.hardwareRequirements.minSmVersion);
      if (k.hardwareRequirements.minSmVersion !== 'any' && kIdx > smIdx) return false;
      return k.hardwareRequirements.supportedPrecisions.includes(simPrecision);
    };
    if (smIdx >= smOrder.indexOf('sm_100')) {
      const fa4 = MOCK_KERNELS.find((k) => k.id === 'sgl-fa4-blackwell');
      if (fa4 && isCompat(fa4)) return { kernel: fa4, strategy: 'flash-attn4', rationale: 'Blackwell SM100 detected — FA4 delivers peak FLOP utilization with 5th-gen Tensor Cores', speedup: '2.1×' };
    }
    if (smIdx >= smOrder.indexOf('sm_90')) {
      const fa3 = MOCK_KERNELS.find((k) => k.id === 'sgl-fa3-prefill');
      if (fa3 && isCompat(fa3)) return { kernel: fa3, strategy: 'flash-attn3', rationale: 'Hopper SM90 detected — FA3 WGMMA/TMA provides 1.5× throughput over FA2', speedup: '1.5×' };
    }
    const fi = MOCK_KERNELS.find((k) => k.id === 'sgl-flashinfer-decode');
    if (fi && isCompat(fi)) return { kernel: fi, strategy: 'flashinfer-decode', rationale: 'Ampere detected — FlashInfer optimized for paged KV decode', speedup: '1.3×' };
    const fa2 = MOCK_KERNELS.find((k) => k.id === 'hf-flash-attn2');
    return { kernel: fa2, strategy: 'flash-attn2', rationale: 'Ampere/Ada baseline — FlashAttention-2 with GQA/MQA support', speedup: '1.0×' };
  })();

  const benchmarkKernels = MOCK_KERNELS.filter((k) => k.category === 'attention' && k.benchmarks.length > 0);

  const TABS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'catalog', label: 'Kernel Catalog', icon: Layers },
    { id: 'router', label: 'Router Intelligence', icon: GitBranch },
    { id: 'benchmarks', label: 'Benchmarks', icon: BarChart2 },
    { id: 'health', label: 'Health Monitor', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col bg-praxis-bg">
      <div className="border-b border-praxis px-6 py-4 flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-praxis-cyan" />
            <h1 className="text-sm font-mono font-bold text-praxis-cyan tracking-widest">NEXUS KERNEL</h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-cyan/30 bg-praxis-cyan/10 text-praxis-cyan tracking-widest">UNIFIED COMPUTE</span>
          </div>
          <p className="text-xs text-muted-foreground/70">Unified AI compute kernel orchestration — SGLang + HuggingFace Kernel Hub + Community</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Kernels', value: stats.total, color: 'text-praxis-cyan' },
            { label: 'SGLang', value: stats.sglang, color: 'text-praxis-cyan' },
            { label: 'HuggingFace', value: stats.huggingface, color: 'text-yellow-400' },
            { label: 'Community', value: stats.community, color: 'text-praxis-green' },
            { label: 'Stable', value: stats.stable, color: 'text-praxis-green' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-0 border-b border-praxis shrink-0 px-6 pt-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                active ? 'border-praxis-cyan text-praxis-cyan' : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'catalog' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search kernels, tags, categories…"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-praxis-surface border border-praxis rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-praxis-cyan/40" />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground/40" />
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value as KernelSource | 'all')}
                  className="text-xs bg-praxis-surface border border-praxis rounded px-2 py-1.5 text-muted-foreground focus:outline-none">
                  <option value="all">All Sources</option>
                  <option value="sglang">SGLang</option>
                  <option value="huggingface">HuggingFace</option>
                  <option value="community">Community</option>
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as KernelCategory | 'all')}
                  className="text-xs bg-praxis-surface border border-praxis rounded px-2 py-1.5 text-muted-foreground focus:outline-none">
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-muted-foreground/50 flex items-center font-mono">{filtered.length} of {MOCK_KERNELS.length}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((k) => {
                const StatusIcon = STATUS_CONFIG[k.status].icon;
                const throughputs = k.benchmarks.map((b) => b.throughputTokensPerSec);
                const topBench = k.benchmarks[0];
                return (
                  <button key={k.id} onClick={() => setSelectedKernel(selectedKernel?.id === k.id ? null : k)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedKernel?.id === k.id ? 'border-praxis-cyan/40 bg-praxis-cyan/5' : 'border-praxis hover:border-praxis-cyan/20 bg-praxis-surface'
                    }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{k.displayName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/50 truncate">{k.name}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${SOURCE_COLORS[k.source]}`}>
                          {SOURCE_LABELS[k.source]}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground/60 mb-2 line-clamp-2">{k.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          k.category === 'attention' ? 'text-praxis-cyan/80 border-praxis-cyan/20' :
                          k.category === 'moe' ? 'text-purple-400 border-purple-400/20' :
                          k.category === 'quantization' ? 'text-orange-400 border-orange-400/20' :
                          'text-muted-foreground/60 border-muted-foreground/20'
                        }`}>{CATEGORY_LABELS[k.category]}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${STATUS_CONFIG[k.status].className}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{STATUS_CONFIG[k.status].label}
                        </span>
                      </div>
                      {throughputs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Sparkline values={throughputs} color={k.source === 'sglang' ? '#22d3ee' : k.source === 'huggingface' ? '#facc15' : '#4ade80'} />
                          {topBench && (
                            <div className="text-right">
                              <div className="text-[9px] font-mono text-praxis-green">{formatThroughput(topBench.throughputTokensPerSec)}</div>
                              <div className="text-[9px] font-mono text-muted-foreground/40">{topBench.latencyMs}ms</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedKernel?.id === k.id && (
                      <div className="mt-3 pt-3 border-t border-praxis space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {k.hardwareRequirements.supportedPrecisions.map((p) => (
                            <span key={p} className="text-[9px] font-mono px-1 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/70">{p}</span>
                          ))}
                        </div>
                        <div className="text-[10px] text-muted-foreground/50 flex items-center gap-3">
                          <span>Min SM: <span className="text-foreground font-mono">{k.hardwareRequirements.minSmVersion}</span></span>
                          <span>VRAM: <span className="text-foreground font-mono">{(k.hardwareRequirements.minVramMB / 1024).toFixed(0)}GB+</span></span>
                          <span>v<span className="text-foreground font-mono">{k.version}</span></span>
                        </div>
                        {k.notes && <div className="text-[10px] text-praxis-amber/70 italic">{k.notes}</div>}
                        <div className="flex flex-wrap gap-1">
                          {k.tags.map((t) => (
                            <span key={t} className="text-[9px] text-muted-foreground/40 bg-praxis-bg px-1 py-0.5 rounded font-mono">#{t}</span>
                          ))}
                        </div>
                        {k.benchmarks.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1">Benchmark</div>
                            <div className="space-y-1">
                              {k.benchmarks.slice(0, 2).map((b, i) => (
                                <div key={i} className="grid grid-cols-3 text-[9px] font-mono text-muted-foreground/60">
                                  <span>bs={b.batchSize} sl={b.seqLen}</span>
                                  <span className="text-praxis-green">{formatThroughput(b.throughputTokensPerSec)}</span>
                                  <span>{b.latencyMs}ms / {(b.memoryMB / 1024).toFixed(0)}GB</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'router' && (
          <div className="space-y-4 max-w-3xl">
            <div className="text-xs text-muted-foreground/60 mb-4">Configure a workload profile and the NEXUS Kernel Router will select the optimal compute kernel.</div>

            <div className="bg-praxis-surface border border-praxis rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-praxis-cyan" />
                <span className="text-xs font-medium text-foreground">Workload Simulator</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Batch Size', value: simBatchSize, setValue: (v: number) => setSimBatchSize(v), opts: [1, 4, 8, 16, 32, 64, 128] },
                  { label: 'Sequence Length', value: simSeqLen, setValue: (v: number) => setSimSeqLen(v), opts: [256, 512, 1024, 2048, 4096, 8192] },
                ].map(({ label, value, setValue, opts }) => (
                  <div key={label}>
                    <div className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-widest">{label}</div>
                    <div className="flex gap-1 flex-wrap">
                      {opts.map((o) => (
                        <button key={o} onClick={() => setValue(o)}
                          className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                            value === o ? 'border-praxis-cyan bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis text-muted-foreground/60 hover:border-praxis-cyan/30'
                          }`}>{o}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <div className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-widest">Precision Target</div>
                  <div className="flex gap-1 flex-wrap">
                    {(['fp32', 'fp16', 'bf16', 'fp8', 'int8'] as PrecisionType[]).map((p) => (
                      <button key={p} onClick={() => setSimPrecision(p)}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                          simPrecision === p ? 'border-praxis-cyan bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis text-muted-foreground/60 hover:border-praxis-cyan/30'
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-widest">Hardware (SM Version)</div>
                  <div className="flex gap-1 flex-wrap">
                    {(['sm_80', 'sm_86', 'sm_89', 'sm_90', 'sm_100'] as HardwareSM[]).map((s) => (
                      <button key={s} onClick={() => setSimSm(s)}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                          simSm === s ? 'border-praxis-cyan bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis text-muted-foreground/60 hover:border-praxis-cyan/30'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-widest">Compute Profile</div>
                  <div className="flex gap-1 flex-wrap">
                    {(['latency-optimized', 'throughput-optimized', 'memory-optimized'] as ComputeProfile[]).map((p) => (
                      <button key={p} onClick={() => setSimProfile(p)}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                          simProfile === p ? 'border-praxis-cyan bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis text-muted-foreground/60 hover:border-praxis-cyan/30'
                        }`}>{p.replace('-optimized', '')}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {simRecommendation && simRecommendation.kernel && (
              <div className="bg-praxis-surface border border-praxis-cyan/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-praxis-cyan" />
                  <span className="text-xs font-medium text-praxis-cyan">Router Decision</span>
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-cyan/30 bg-praxis-cyan/10 text-praxis-cyan">{simRecommendation.strategy}</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-0.5">{simRecommendation.kernel.displayName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/50 mb-2">{simRecommendation.kernel.name}</div>
                    <div className="text-[10px] text-muted-foreground/60">{simRecommendation.rationale}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-praxis-green">{simRecommendation.speedup}</div>
                    <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">vs baseline</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-praxis flex items-center gap-4">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${SOURCE_COLORS[simRecommendation.kernel.source]}`}>
                    {SOURCE_LABELS[simRecommendation.kernel.source]}
                  </span>
                  {simRecommendation.kernel.benchmarks[0] && (
                    <>
                      <span className="text-[10px] font-mono text-muted-foreground/50">Est. latency: <span className="text-foreground">{simRecommendation.kernel.benchmarks[0].latencyMs}ms</span></span>
                      <span className="text-[10px] font-mono text-muted-foreground/50">Throughput: <span className="text-praxis-green">{formatThroughput(simRecommendation.kernel.benchmarks[0].throughputTokensPerSec)}</span></span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'benchmarks' && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground/60">Comparative benchmark data across attention, quantization, MoE, and normalization kernel categories.</div>

            {(['attention', 'quantization', 'moe', 'normalization'] as KernelCategory[]).map((cat) => {
              const catKernels = MOCK_KERNELS.filter((k) => k.category === cat && k.benchmarks.length > 0);
              if (catKernels.length === 0) return null;
              const maxThroughput = Math.max(...catKernels.flatMap((k) => k.benchmarks.map((b) => b.throughputTokensPerSec)));
              return (
                <div key={cat} className="bg-praxis-surface border border-praxis rounded-lg p-4">
                  <div className="text-xs font-medium text-foreground mb-4 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-praxis-cyan" />
                    {CATEGORY_LABELS[cat]} — Throughput Comparison
                  </div>
                  <div className="space-y-2">
                    {catKernels.map((k) => {
                      const topBench = k.benchmarks.reduce((best, b) => b.throughputTokensPerSec > best.throughputTokensPerSec ? b : best, k.benchmarks[0]!);
                      const pct = (topBench.throughputTokensPerSec / maxThroughput) * 100;
                      return (
                        <div key={k.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono px-1 py-0.5 rounded border text-[8px] ${SOURCE_COLORS[k.source]}`}>{SOURCE_LABELS[k.source]}</span>
                              <span className="text-foreground">{k.displayName}</span>
                            </div>
                            <div className="font-mono text-praxis-green">{formatThroughput(topBench.throughputTokensPerSec)}</div>
                          </div>
                          <div className="h-1.5 bg-praxis-bg rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: k.source === 'sglang' ? '#22d3ee' : k.source === 'huggingface' ? '#facc15' : '#4ade80',
                              }} />
                          </div>
                          <div className="flex gap-4 text-[9px] text-muted-foreground/40 font-mono">
                            <span>bs={topBench.batchSize} sl={topBench.seqLen} {topBench.precision}</span>
                            <span>{topBench.latencyMs}ms latency</span>
                            <span>{(topBench.memoryMB / 1024).toFixed(0)}GB VRAM</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'health' && (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'SGLang (sgl-project)', kernels: stats.sglang, version: 'sgl-kernel 0.4.1', status: 'online' as const },
                { name: 'HuggingFace Kernel Hub', kernels: stats.huggingface, version: 'kernels-community latest', status: 'online' as const },
                { name: 'Community Kernels', kernels: stats.community, version: 'mixed versions', status: 'online' as const },
              ].map((p) => (
                <div key={p.name} className="bg-praxis-surface border border-praxis rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-medium text-foreground">{p.name}</div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-praxis-green" />
                      <span className="text-[9px] text-praxis-green font-mono">ONLINE</span>
                    </div>
                  </div>
                  <div className="text-lg font-mono font-bold text-praxis-cyan">{p.kernels}</div>
                  <div className="text-[9px] text-muted-foreground/40">kernels indexed</div>
                  <div className="text-[9px] font-mono text-muted-foreground/50 mt-1">{p.version}</div>
                </div>
              ))}
            </div>

            <div className="bg-praxis-surface border border-praxis rounded-lg p-4">
              <div className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-praxis-cyan" />
                Hardware Support Grid
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px] font-mono">
                  <thead>
                    <tr className="text-muted-foreground/40 border-b border-praxis">
                      <th className="text-left py-1.5 pr-4 font-normal uppercase tracking-widest">SM Version</th>
                      <th className="text-left py-1.5 px-2 font-normal">fp32</th>
                      <th className="text-left py-1.5 px-2 font-normal">fp16</th>
                      <th className="text-left py-1.5 px-2 font-normal">bf16</th>
                      <th className="text-left py-1.5 px-2 font-normal">fp8</th>
                      <th className="text-left py-1.5 px-2 font-normal">int8</th>
                      <th className="text-left py-1.5 px-2 font-normal">Kernels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { sm: 'SM 8.0 (A100)', precs: [true, true, true, false, true], kernels: 12 },
                      { sm: 'SM 8.6 (RTX 3090)', precs: [true, true, true, false, true], kernels: 10 },
                      { sm: 'SM 8.9 (RTX 4090)', precs: [true, true, true, false, true], kernels: 10 },
                      { sm: 'SM 9.0 (H100)', precs: [true, true, true, true, true], kernels: 15 },
                      { sm: 'SM 10.0 (B100/B200)', precs: [true, true, true, true, true], kernels: 17 },
                    ].map((row) => (
                      <tr key={row.sm} className="border-b border-praxis/40 hover:bg-praxis-bg/30">
                        <td className="py-1.5 pr-4 text-foreground">{row.sm}</td>
                        {row.precs.map((s, i) => (
                          <td key={i} className="py-1.5 px-2">
                            {s ? <CheckCircle2 className="w-3 h-3 text-praxis-green" /> : <div className="w-3 h-3 rounded-full bg-praxis/60" />}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-praxis-cyan">{row.kernels}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-praxis-surface border border-praxis rounded-lg p-4">
              <div className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-praxis-cyan" />
                Kernel Registry Health
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Kernels', value: MOCK_KERNELS.length.toString(), color: 'text-praxis-cyan' },
                  { label: 'Stable', value: stats.stable.toString(), color: 'text-praxis-green' },
                  { label: 'Experimental / Preview', value: (MOCK_KERNELS.length - stats.stable).toString(), color: 'text-praxis-amber' },
                  { label: 'Audit Chain', value: `${auditTick * 2 + 47} entries`, color: 'text-muted-foreground' },
                  { label: 'Triton Kernels', value: '7', color: 'text-yellow-400' },
                  { label: 'CUDA Kernels', value: '12', color: 'text-praxis-cyan' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-1 border-b border-praxis/40 last:border-0">
                    <span className="text-[10px] text-muted-foreground/60">{s.label}</span>
                    <span className={`text-[10px] font-mono ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-3 max-w-3xl">
            <div className="text-xs text-muted-foreground/60">Hash-chained audit trail of all kernel routing decisions. Each entry is linked to the previous via SHA-256.</div>

            <div className="bg-praxis-surface border border-praxis rounded-lg overflow-hidden">
              <div className="border-b border-praxis px-4 py-2 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-praxis-cyan" />
                <span className="text-xs font-medium text-foreground">Kernel Selection Audit Chain</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-praxis-green pulse-dot" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">CHAIN VALID</span>
                </div>
              </div>
              <div className="divide-y divide-praxis/40">
                {Array.from({ length: 8 }, (_, i) => {
                  const kernelIdx = (i * 3 + auditTick) % MOCK_KERNELS.length;
                  const k = MOCK_KERNELS[kernelIdx]!;
                  const hash = `${(0x1a2b3c4d + i * 0xdeadbeef + auditTick * 17).toString(16).slice(0, 8)}…`;
                  const prevHash = `${(0x9e8f7d6c + i * 0xdeadbeef + auditTick * 13).toString(16).slice(0, 8)}…`;
                  const ts = new Date(Date.now() - i * 12000 - auditTick * 1000).toISOString().slice(11, 23);
                  return (
                    <div key={i} className="px-4 py-2.5 hover:bg-praxis-bg/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium text-foreground">kernel_route_decision</span>
                            <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${SOURCE_COLORS[k.source]}`}>{SOURCE_LABELS[k.source]}</span>
                            <span className="text-[9px] text-praxis-green font-mono">authorized</span>
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground/50">
                            kernel: {k.id} · strategy: {k.category === 'attention' ? 'flash-attn3' : k.category}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-mono text-muted-foreground/30">prev: {prevHash}</span>
                            <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/20" />
                            <span className="text-[9px] font-mono text-praxis-cyan/50">curr: {hash}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-mono text-muted-foreground/40">{ts}</div>
                          <div className="text-[9px] font-mono text-praxis-green mt-0.5">success</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-praxis px-4 py-2 flex items-center justify-between text-[9px] text-muted-foreground/40 font-mono">
                <span>{auditTick * 2 + 47} total entries · genesis block: 2025-01-10</span>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>SHA-256 chain integrity verified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

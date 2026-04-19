import { seededRng } from "./prng.js";

export type GpuState = "idle" | "ramping" | "plateau" | "throttle" | "error";
export type GpuModel = "NVIDIA H100 SXM5" | "NVIDIA A100 80GB" | "NVIDIA A100 40GB" | "NVIDIA H200 SXM5";

export interface GpuNode {
  id: string;
  name: string;
  model: GpuModel;
  gpuCount: number;
  state: GpuState;
  utilizationPct: number;
  vramUsedGb: number;
  vramTotalGb: number;
  vramFragmentation: number;
  tempCelsius: number;
  powerWatts: number;
  powerLimitWatts: number;
  nvlinkBandwidthGbps: number;
  nvlinkBandwidthMaxGbps: number;
  activeJob?: GpuJob;
  eccErrorCount: number;
  xidEvents: XidEvent[];
  thermalCurve: ThermalPoint[];
  tokenThroughput: number;
  trainingLoss?: number;
  gradientNorm?: number;
}

export interface GpuJob {
  id: string;
  name: string;
  type: "training" | "inference" | "evaluation" | "fine-tuning" | "embedding";
  model: string;
  batchSize: number;
  gpusAllocated: number;
  startedAt: number;
  estimatedEtaMs: number;
  progress: number;
  priority: "low" | "medium" | "high" | "critical";
  preemptible: boolean;
  preemptedAt?: number;
}

export interface QueuedJob {
  id: string;
  name: string;
  type: GpuJob["type"];
  model: string;
  gpusRequired: number;
  priority: GpuJob["priority"];
  submittedAt: number;
  estimatedWaitMs: number;
  preemptible: boolean;
}

export interface XidEvent {
  xidCode: number;
  description: string;
  occurredAt: number;
  severity: "info" | "warning" | "critical";
}

export interface ThermalPoint {
  timestamp: number;
  celsius: number;
  phase: GpuState;
}

export interface NvLinkTopology {
  nodes: string[];
  links: NvLinkLink[];
}

export interface NvLinkLink {
  from: string;
  to: string;
  bandwidthGbps: number;
  utilizationPct: number;
  healthy: boolean;
}

export interface GpuClusterSnapshot {
  nodes: GpuNode[];
  totalGpus: number;
  activeGpus: number;
  avgUtilization: number;
  avgTemp: number;
  totalVramGb: number;
  usedVramGb: number;
  totalPowerKw: number;
  totalThroughputKtps: number;
  activeJobs: number;
  queuedJobs: QueuedJob[];
  nvlinkTopology: NvLinkTopology;
  clusterHealth: "healthy" | "degraded" | "critical";
}

export interface NetworkFlow {
  id: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "TLS1.3" | "QUIC" | "gRPC";
  direction: "ingress" | "egress" | "lateral";
  bytesPerSec: number;
  packetsPerSec: number;
  service: string;
  action: "ALLOW" | "DENY" | "INSPECT";
  anomalous: boolean;
  threatLabel?: string;
  geo: string;
  timestamp: number;
}

export interface ContainerMetric {
  namespace: string;
  podName: string;
  cpuPct: number;
  memPct: number;
  networkRxMbps: number;
  networkTxMbps: number;
  restartCount: number;
  status: "Running" | "Pending" | "CrashLoopBackOff" | "Terminating" | "OOMKilled";
}

const XID_REGISTRY: Record<number, { description: string; severity: XidEvent["severity"] }> = {
  13: { description: "Graphics Engine Exception — shader fault", severity: "warning" },
  31: { description: "GPU memory page fault", severity: "warning" },
  45: { description: "Preemptive cleanup — context reset required", severity: "info" },
  48: { description: "Double Bit ECC Error — memory scrubbing initiated", severity: "critical" },
  63: { description: "Row remapper failure — DRAM bank retirement", severity: "critical" },
  74: { description: "NVLink error — link retraining", severity: "warning" },
  79: { description: "GPU has fallen off the bus", severity: "critical" },
  92: { description: "High single-bit ECC error rate — watchdog active", severity: "warning" },
};

const GPU_JOBS = [
  { name: "LLaMA-3-70B Fine-tune", type: "fine-tuning" as const, model: "LLaMA-3-70B", batchSize: 128 },
  { name: "Stable Diffusion 3 XL Training", type: "training" as const, model: "SD-3-XL", batchSize: 64 },
  { name: "GPT-4 Evaluation Suite", type: "evaluation" as const, model: "GPT-4", batchSize: 256 },
  { name: "Mistral-8x7B Inference", type: "inference" as const, model: "Mistral-8x7B", batchSize: 512 },
  { name: "Embedding Batch — text-embedding-3", type: "embedding" as const, model: "text-embedding-3-large", batchSize: 2048 },
  { name: "Llama 3.1 405B Pre-train", type: "training" as const, model: "Llama-3.1-405B", batchSize: 32 },
  { name: "FLUX.1 Image Training", type: "training" as const, model: "FLUX.1-dev", batchSize: 16 },
  { name: "Whisper Large v3 Fine-tune", type: "fine-tuning" as const, model: "whisper-large-v3", batchSize: 64 },
];

const NODE_NAMES = [
  ["H100 Node Alpha", "H100 Node Beta", "H100 Node Gamma", "H100 Node Delta"],
  ["A100 Node Epsilon", "A100 Node Zeta", "A100 Node Eta", "A100 Node Theta"],
];

export class InfraSimulator {
  private rng: ReturnType<typeof seededRng>;
  private seed: number;

  constructor(seed = 0x9ef4a2b8) {
    this.seed = seed;
    this.rng = seededRng(seed);
  }

  reset() {
    this.rng = seededRng(this.seed);
  }

  private generateThermalCurve(state: GpuState, points = 20, nowMs = Date.now()): ThermalPoint[] {
    const rng = this.rng;
    const baseTempByState: Record<GpuState, number> = {
      idle: 35,
      ramping: 55,
      plateau: 68,
      throttle: 84,
      error: 88,
    };

    const base = baseTempByState[state];
    const curve: ThermalPoint[] = [];

    let temp = base + rng.gauss(0, 3);
    for (let i = points - 1; i >= 0; i--) {
      temp = Math.max(30, Math.min(95, temp + rng.gauss(0, 1.5)));
      curve.push({
        timestamp: nowMs - i * 30_000,
        celsius: parseFloat(temp.toFixed(1)),
        phase: state,
      });
    }
    return curve;
  }

  private generateXidEvents(rng: ReturnType<typeof seededRng>, state: GpuState, nowMs: number): XidEvent[] {
    if (state === "idle") return [];
    const count = state === "error" ? rng.int(2, 5) : state === "throttle" ? rng.int(0, 2) : rng.bool(0.2) ? rng.int(1, 2) : 0;
    const xidCodes = Object.keys(XID_REGISTRY).map(Number);

    return Array.from({ length: count }, () => {
      const code = rng.pick(xidCodes);
      const info = XID_REGISTRY[code]!;
      return {
        xidCode: code,
        description: info.description,
        occurredAt: nowMs - rng.range(0, 7_200_000),
        severity: info.severity,
      };
    });
  }

  generateGpuNode(id: string, name: string, model: GpuModel, gpuCount: number, nowMs = Date.now()): GpuNode {
    const rng = this.rng;
    const vramByModel: Record<GpuModel, number> = {
      "NVIDIA H100 SXM5": 80,
      "NVIDIA H200 SXM5": 141,
      "NVIDIA A100 80GB": 80,
      "NVIDIA A100 40GB": 40,
    };
    const powerLimitByModel: Record<GpuModel, number> = {
      "NVIDIA H100 SXM5": 700,
      "NVIDIA H200 SXM5": 700,
      "NVIDIA A100 80GB": 400,
      "NVIDIA A100 40GB": 400,
    };
    const nvlinkMaxByModel: Record<GpuModel, number> = {
      "NVIDIA H100 SXM5": 900,
      "NVIDIA H200 SXM5": 900,
      "NVIDIA A100 80GB": 600,
      "NVIDIA A100 40GB": 600,
    };

    const states: GpuState[] = ["idle", "ramping", "plateau", "throttle", "error"];
    const stateWeights = [0.1, 0.15, 0.55, 0.15, 0.05];
    let cumWeight = 0;
    const rand = rng.next();
    let state: GpuState = "plateau";
    for (let i = 0; i < states.length; i++) {
      cumWeight += stateWeights[i]!;
      if (rand < cumWeight) { state = states[i]!; break; }
    }

    const vramTotal = vramByModel[model] * gpuCount;
    const powerLimit = powerLimitByModel[model] * gpuCount;
    const nvlinkMax = nvlinkMaxByModel[model];

    const utilByState: Record<GpuState, [number, number]> = {
      idle: [5, 20],
      ramping: [35, 70],
      plateau: [75, 98],
      throttle: [88, 100],
      error: [10, 45],
    };
    const [uMin, uMax] = utilByState[state]!;
    const util = rng.range(uMin, uMax);

    const vramUsed = (util / 100) * vramTotal * rng.range(0.85, 1.05);
    const vramFrag = state === "plateau" ? rng.range(5, 22) : rng.range(1, 8);
    const powerUsed = (util / 100) * powerLimit * rng.range(0.8, 1.0);
    const nvlinkUtil = state !== "idle" ? rng.range(0.3, 0.9) : rng.range(0.02, 0.1);

    const hasJob = state !== "idle";
    const jobDef = hasJob ? rng.pick(GPU_JOBS) : undefined;
    const activeJob: GpuJob | undefined = jobDef ? {
      id: `job-${id}-${rng.int(1000, 9999)}`,
      ...jobDef,
      gpusAllocated: gpuCount,
      startedAt: nowMs - rng.range(0, 8 * 3_600_000),
      estimatedEtaMs: rng.range(30 * 60_000, 8 * 3_600_000),
      progress: parseFloat(rng.range(5, 95).toFixed(1)),
      priority: rng.pick(["medium", "high", "high", "critical"] as const),
      preemptible: rng.bool(0.4),
    } : undefined;

    const isTraining = activeJob?.type === "training" || activeJob?.type === "fine-tuning";
    const trainingLoss = isTraining ? parseFloat((2.8 - activeJob!.progress / 100 * 2.4 + rng.gauss(0, 0.05)).toFixed(4)) : undefined;
    const gradientNorm = isTraining ? parseFloat(rng.range(0.8, 4.5).toFixed(3)) : undefined;

    return {
      id,
      name,
      model,
      gpuCount,
      state,
      utilizationPct: parseFloat(util.toFixed(1)),
      vramUsedGb: parseFloat(Math.min(vramTotal, vramUsed).toFixed(1)),
      vramTotalGb: vramTotal,
      vramFragmentation: parseFloat(vramFrag.toFixed(1)),
      tempCelsius: parseFloat((state === "throttle" ? rng.range(82, 92) : state === "plateau" ? rng.range(60, 80) : state === "idle" ? rng.range(30, 45) : rng.range(50, 70)).toFixed(0)),
      powerWatts: parseFloat(powerUsed.toFixed(0)),
      powerLimitWatts: powerLimit,
      nvlinkBandwidthGbps: parseFloat((nvlinkMax * nvlinkUtil).toFixed(1)),
      nvlinkBandwidthMaxGbps: nvlinkMax,
      ...(activeJob !== undefined ? { activeJob } : {}),
      eccErrorCount: state === "error" ? rng.int(5, 150) : state === "throttle" ? rng.int(0, 4) : 0,
      xidEvents: this.generateXidEvents(rng, state, nowMs),
      thermalCurve: this.generateThermalCurve(state, 20, nowMs),
      tokenThroughput: hasJob ? rng.range(40_000, 280_000) : 0,
      ...(trainingLoss !== undefined ? { trainingLoss } : {}),
      ...(gradientNorm !== undefined ? { gradientNorm } : {}),
    };
  }

  generateClusterSnapshot(nowMs = Date.now()): GpuClusterSnapshot {
    const rng = this.rng;
    const nodeConfigs: Array<{ model: GpuModel; count: number }> = [
      { model: "NVIDIA H100 SXM5", count: 8 },
      { model: "NVIDIA H100 SXM5", count: 8 },
      { model: "NVIDIA A100 80GB", count: 4 },
      { model: "NVIDIA A100 80GB", count: 4 },
    ];

    const nodes: GpuNode[] = nodeConfigs.map((cfg, i) => {
      const tier = i < 2 ? 0 : 1;
      const name = NODE_NAMES[tier]![i < 2 ? i : i - 2]!;
      return this.generateGpuNode(`node-${String(i + 1).padStart(2, "0")}`, name, cfg.model, cfg.count, nowMs);
    });

    const totalGpus = nodes.reduce((s, n) => s + n.gpuCount, 0);
    const activeGpus = nodes.filter(n => n.state !== "idle").reduce((s, n) => s + n.gpuCount, 0);
    const avgUtil = nodes.reduce((s, n) => s + n.utilizationPct, 0) / nodes.length;
    const avgTemp = nodes.reduce((s, n) => s + n.tempCelsius, 0) / nodes.length;
    const totalVram = nodes.reduce((s, n) => s + n.vramTotalGb, 0);
    const usedVram = nodes.reduce((s, n) => s + n.vramUsedGb, 0);
    const totalPower = nodes.reduce((s, n) => s + n.powerWatts, 0);
    const totalThroughput = nodes.reduce((s, n) => s + n.tokenThroughput, 0);

    const queuedCount = rng.int(3, 12);
    const queuedJobs: QueuedJob[] = Array.from({ length: queuedCount }, (_, i) => {
      const def = rng.pick(GPU_JOBS);
      return {
        id: `queued-${i}-${rng.int(1000, 9999)}`,
        ...def,
        gpusRequired: rng.int(2, 8),
        priority: rng.pick(["low", "medium", "high", "high"] as const),
        submittedAt: nowMs - rng.range(0, 3_600_000),
        estimatedWaitMs: rng.range(5 * 60_000, 2 * 3_600_000),
        preemptible: rng.bool(0.5),
      };
    });

    const nvlinkTopology: NvLinkTopology = {
      nodes: nodes.map(n => n.id),
      links: nodes.flatMap((n, i) =>
        nodes.slice(i + 1).map(m => ({
          from: n.id,
          to: m.id,
          bandwidthGbps: rng.range(200, 900),
          utilizationPct: parseFloat(rng.range(10, 85).toFixed(1)),
          healthy: rng.bool(0.92),
        }))
      ),
    };

    const hasCritical = nodes.some(n => n.state === "error" || n.xidEvents.some(x => x.severity === "critical"));
    const hasThrottle = nodes.some(n => n.state === "throttle");
    const clusterHealth: GpuClusterSnapshot["clusterHealth"] = hasCritical ? "critical" : hasThrottle ? "degraded" : "healthy";

    return {
      nodes,
      totalGpus,
      activeGpus,
      avgUtilization: parseFloat(avgUtil.toFixed(1)),
      avgTemp: parseFloat(avgTemp.toFixed(1)),
      totalVramGb: totalVram,
      usedVramGb: parseFloat(usedVram.toFixed(1)),
      totalPowerKw: parseFloat((totalPower / 1000).toFixed(2)),
      totalThroughputKtps: parseFloat((totalThroughput / 1000).toFixed(1)),
      activeJobs: nodes.filter(n => n.activeJob).length,
      queuedJobs,
      nvlinkTopology,
      clusterHealth,
    };
  }

  generateNetworkFlows(count = 30, nowMs = Date.now()): NetworkFlow[] {
    const rng = this.rng;
    const protocols = ["TCP", "UDP", "TLS1.3", "QUIC", "gRPC"] as const;
    const directions = ["ingress", "egress", "lateral"] as const;
    const srcRanges = ["10.0.0", "10.1.0", "172.16.0", "192.168.1"];
    const dstRanges = ["10.0.1", "10.2.0", "172.17.0", "203.0.113"];
    const services = ["api-gateway", "auth-service", "payment-service", "ml-inference", "cdn-edge", "monitoring"];
    const actions = ["ALLOW", "DENY", "INSPECT"] as const;
    const threats = ["port-scan", "data-exfiltration", "c2-beacon", "brute-force", "lateral-movement"];

    return Array.from({ length: count }, (_, i) => {
      const isAnomalous = rng.bool(0.12);
      const bytesPerSec = isAnomalous ? rng.range(50_000_000, 500_000_000) : rng.range(1_000, 50_000_000);
      const direction = rng.pick([...directions]);
      return {
        id: `flow-${i}-${rng.int(1000, 9999)}`,
        srcIp: `${rng.pick(srcRanges)}.${rng.int(1, 254)}`,
        dstIp: `${rng.pick(dstRanges)}.${rng.int(1, 254)}`,
        srcPort: rng.int(1024, 65535),
        dstPort: rng.pick([80, 443, 8080, 5432, 6379, 9092, 3306, 27017, rng.int(1024, 65535)]),
        protocol: rng.pick([...protocols]),
        direction,
        bytesPerSec: parseFloat(bytesPerSec.toFixed(0)),
        packetsPerSec: parseFloat(rng.range(100, 50000).toFixed(0)),
        service: rng.pick(services),
        action: isAnomalous && rng.bool(0.4) ? "DENY" : rng.bool(0.1) ? "INSPECT" : "ALLOW",
        anomalous: isAnomalous,
        ...(isAnomalous ? { threatLabel: rng.pick(threats) } : {}),
        geo: direction === "egress" ? rng.pick(["US", "DE", "CN", "RU", "NL", "SG", "GB"]) : "internal",
        timestamp: nowMs - rng.range(0, 3_600_000),
      };
    });
  }

  generateContainerMetrics(count = 20): ContainerMetric[] {
    const rng = this.rng;
    const namespaces = ["production", "ml-serving", "data-pipeline", "monitoring", "security"];
    const services = ["api-gateway", "auth-svc", "infer-worker", "metrics-collector", "threat-detector"];
    const statuses: ContainerMetric["status"][] = ["Running", "Running", "Running", "Running", "Pending", "CrashLoopBackOff", "Terminating", "OOMKilled"];

    return Array.from({ length: count }, (_, i) => {
      const status = rng.pick(statuses);
      return {
        namespace: rng.pick(namespaces),
        podName: `${rng.pick(services)}-${rng.int(1000, 9999)}-${String.fromCharCode(rng.int(97, 122))}`,
        cpuPct: parseFloat(rng.range(5, 95).toFixed(1)),
        memPct: parseFloat(rng.range(10, 92).toFixed(1)),
        networkRxMbps: parseFloat(rng.range(0.1, 200).toFixed(1)),
        networkTxMbps: parseFloat(rng.range(0.1, 80).toFixed(1)),
        restartCount: status === "CrashLoopBackOff" ? rng.int(3, 25) : rng.int(0, 2),
        status,
      };
    });
  }
}

export const defaultInfraSimulator = new InfraSimulator(0x9ef4a2b8);

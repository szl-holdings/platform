import { useState, useEffect, useRef } from "react";
import { Cpu, Zap, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, Brain, DollarSign, RefreshCw } from "lucide-react";
import { InfraSimulator, seededRng } from "@szl-holdings/observability";

interface GpuState {
  id: string;
  name: string;
  utilizationPct: number;
  memUsedGb: number;
  memTotalGb: number;
  temperatureC: number;
  powerWatts: number;
  workload: string;
  history: number[];
  status: "optimal" | "high" | "critical";
}

interface ModelState {
  id: string;
  name: string;
  provider: string;
  latencyMs: number;
  tokensPerSec: number;
  costPerInference: number;
  requestCount: number;
  errorRate: number;
  driftScore: number;
  driftAlert: boolean;
  history: number[];
  trend: "improving" | "stable" | "degrading";
}

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

function SparkBar({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data) || 1;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 4} ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        return <rect key={i} x={i * 4} y={height - h} width="3" height={h} rx="0.5" fill={`${color}80`} />;
      })}
    </svg>
  );
}

function GpuCard({ gpu, animate }: { gpu: GpuState; animate: boolean }) {
  const utilColor = gpu.status === "critical" ? "#c45a4a" : gpu.status === "high" ? "#d4a054" : "#6b8f71";
  const memPct = (gpu.memUsedGb / gpu.memTotalGb) * 100;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${utilColor}25`, background: `${utilColor}06` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-white">{gpu.name}</div>
          <div className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.muted }}>{gpu.workload}</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: `${utilColor}15`, border: `1px solid ${utilColor}30` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: utilColor, boxShadow: animate ? `0 0 6px ${utilColor}` : "none" }} />
          <span className="text-[10px] font-bold font-mono" style={{ color: utilColor }}>{gpu.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px]" style={{ color: DS.text.muted }}>GPU Util</span>
            <span className="text-[10px] font-bold font-mono" style={{ color: utilColor }}>{gpu.utilizationPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${gpu.utilizationPct}%`, background: utilColor }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px]" style={{ color: DS.text.muted }}>VRAM</span>
            <span className="text-[10px] font-bold font-mono" style={{ color: memPct > 85 ? "#c45a4a" : GOLD }}>{memPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${memPct}%`, background: memPct > 85 ? "#c45a4a" : "#4B8BDB" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Temp", value: `${gpu.temperatureC.toFixed(0)}°C`, color: gpu.temperatureC > 80 ? "#c45a4a" : GOLD },
          { label: "Power", value: `${gpu.powerWatts.toFixed(0)}W`, color: GOLD },
          { label: "Mem", value: `${gpu.memUsedGb.toFixed(0)}/${gpu.memTotalGb}G`, color: "#4B8BDB" },
        ].map(m => (
          <div key={m.label} className="py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[10px] font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[8px]" style={{ color: DS.text.muted }}>{m.label}</div>
          </div>
        ))}
      </div>

      <SparkBar data={gpu.history} color={utilColor} />
    </div>
  );
}

function ModelCard({ model }: { model: ModelState }) {
  const driftColor = model.driftScore > 25 ? "#c45a4a" : model.driftScore > 15 ? "#d4a054" : "#6b8f71";
  const trendIcon = model.trend === "improving" ? TrendingUp : model.trend === "degrading" ? TrendingDown : Activity;
  const TrendIcon = trendIcon;
  const trendColor = model.trend === "improving" ? "#6b8f71" : model.trend === "degrading" ? "#c45a4a" : GOLD;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: DS.border, background: DS.surface }}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-white truncate">{model.name}</div>
          <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{model.provider}</div>
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
          {model.driftAlert && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(196,90,74,0.15)", color: "#c45a4a" }}>
              <AlertTriangle className="w-2.5 h-2.5" /> DRIFT
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Latency P50", value: `${model.latencyMs.toFixed(0)}ms`, color: model.latencyMs > 800 ? "#c45a4a" : model.latencyMs > 500 ? GOLD : "#6b8f71" },
          { label: "Tokens/sec", value: model.tokensPerSec.toFixed(0), color: "#4B8BDB" },
          { label: "Cost/req", value: `$${model.costPerInference.toFixed(4)}`, color: GOLD },
          { label: "Error Rate", value: `${model.errorRate.toFixed(1)}%`, color: model.errorRate > 3 ? "#c45a4a" : "#6b8f71" },
        ].map(m => (
          <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[8px]" style={{ color: DS.text.muted }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px]" style={{ color: DS.text.muted }}>Model Drift Score</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: driftColor }}>{model.driftScore.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, model.driftScore * 3.3)}%`, background: driftColor }} />
        </div>
      </div>

      <SparkBar data={model.history} color={driftColor} height={20} />
    </div>
  );
}

const MODELS_SEED = [
  { id: "alloy-gpt4", name: "Alloy GPT-4o", provider: "OpenAI / Azure", baseLatency: 850, baseDrift: 4 },
  { id: "quipu-claude", name: "Claude-3.5 Sonnet", provider: "Anthropic", baseLatency: 650, baseDrift: 8 },
  { id: "rag-embed", name: "RAG Embedder ada-002", provider: "OpenAI", baseLatency: 90, baseDrift: 2 },
  { id: "drift-det", name: "Drift Detector v2", provider: "SZL Custom", baseLatency: 45, baseDrift: 18 },
  { id: "quipu-classify", name: "SZL Classifier v2", provider: "SZL Fine-tuned", baseLatency: 180, baseDrift: 12 },
  { id: "alloy-embed", name: "Alloy Embedder v3", provider: "SZL Custom", baseLatency: 70, baseDrift: 5 },
];

const GPU_SEED = [
  { id: "gpu-0", name: "GPU-0 · NVIDIA A100", workload: "Alloy GPT-4o Inference" },
  { id: "gpu-1", name: "GPU-1 · NVIDIA A100", workload: "RAG Pipeline + Embeddings" },
  { id: "gpu-2", name: "GPU-2 · NVIDIA H100", workload: "Claude Proxy Cache" },
  { id: "gpu-3", name: "GPU-3 · NVIDIA H100", workload: "Drift Detection + Fine-tune" },
];

const _infraSim = new InfraSimulator(0x9ef4a2b8);
const _clusterSnap = _infraSim.generateClusterSnapshot(Date.now());
const _liveRng = seededRng(0xcafe0001);

export default function GpuComputeObservatory() {
  const [gpus, setGpus] = useState<GpuState[]>(() => {
    const rng = seededRng(0x9ef4a2b8);
    return GPU_SEED.map((g, i) => {
      const node = _clusterSnap.nodes[i % _clusterSnap.nodes.length];
      const util = node?.utilizationPct ?? rng.range(45, 95);
      const mem = node?.vramUsedGb ?? rng.range(25, 70);
      return {
        ...g,
        utilizationPct: util,
        memUsedGb: Math.min(79, mem),
        memTotalGb: 80,
        temperatureC: node?.tempCelsius ?? rng.range(55, 85),
        powerWatts: node?.powerWatts ?? rng.range(200, 400),
        history: node?.thermalCurve.slice(-20).map(p => p.celsius) ?? Array.from({ length: 20 }, () => rng.range(45, 95)),
        status: util > 90 ? "critical" as const : util > 75 ? "high" as const : "optimal" as const,
      };
    });
  });

  const [models, setModels] = useState<ModelState[]>(() => {
    const rng = seededRng(0xdeadbeef);
    return MODELS_SEED.map(m => ({
      ...m,
      latencyMs: m.baseLatency + rng.range(0, m.baseLatency * 0.4),
      tokensPerSec: rng.range(50, 200),
      costPerInference: rng.range(0.001, 0.05),
      requestCount: rng.int(100, 5000),
      errorRate: rng.range(0, 5),
      driftScore: m.baseDrift + rng.range(0, 10),
      driftAlert: m.baseDrift > 12,
      history: Array.from({ length: 20 }, () => m.baseDrift + rng.range(0, 10)),
      trend: rng.pick(["improving", "stable", "degrading"] as const),
    }));
  });

  const [animate, setAnimate] = useState(true);
  const [tab, setTab] = useState<"gpu" | "models" | "costs">("gpu");

  useEffect(() => {
    const t = setInterval(() => {
      setGpus(prev => prev.map(g => {
        const newUtil = Math.max(10, Math.min(100, g.utilizationPct + (_liveRng.next() - 0.5) * 8));
        const newMem = Math.max(10, Math.min(78, g.memUsedGb + (_liveRng.next() - 0.5) * 3));
        const status: GpuState["status"] = newUtil > 90 ? "critical" : newUtil > 75 ? "high" : "optimal";
        return {
          ...g,
          utilizationPct: newUtil,
          memUsedGb: newMem,
          temperatureC: Math.max(45, Math.min(90, g.temperatureC + (_liveRng.next() - 0.5) * 2)),
          powerWatts: Math.max(150, Math.min(400, g.powerWatts + (_liveRng.next() - 0.5) * 15)),
          history: [...g.history.slice(-19), newUtil],
          status,
        };
      }));
      setModels(prev => prev.map(m => {
        const newLatency = Math.max(20, m.latencyMs + (_liveRng.next() - 0.5) * m.latencyMs * 0.1);
        const newDrift = Math.max(0, Math.min(50, m.driftScore + (_liveRng.next() - 0.48) * 1.5));
        return {
          ...m,
          latencyMs: newLatency,
          tokensPerSec: Math.max(10, m.tokensPerSec + (_liveRng.next() - 0.5) * 20),
          driftScore: newDrift,
          driftAlert: newDrift > 20,
          requestCount: m.requestCount + _liveRng.int(0, 9),
          errorRate: Math.max(0, m.errorRate + (_liveRng.next() - 0.5) * 0.3),
          history: [...m.history.slice(-19), newDrift],
          trend: newLatency < m.latencyMs * 0.98 ? "improving" : newLatency > m.latencyMs * 1.02 ? "degrading" : "stable",
        };
      }));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const totalUtil = gpus.reduce((s, g) => s + g.utilizationPct, 0) / gpus.length;
  const totalPower = gpus.reduce((s, g) => s + g.powerWatts, 0);
  const driftAlerts = models.filter(m => m.driftAlert).length;
  const totalCost = models.reduce((s, m) => s + m.costPerInference * m.requestCount, 0);

  const TABS = [
    { id: "gpu" as const, label: "GPU Cluster" },
    { id: "models" as const, label: "Model Registry" },
    { id: "costs" as const, label: "Cost Intelligence" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: GOLD }}>Lyte · GPU & AI Compute</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(212,160,84,0.15)", color: GOLD }}>NVIDIA-CLASS</span>
          </div>
          <h1 className="text-xl font-bold text-white">GPU & AI Compute Observatory</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Real-time GPU utilization, model inference monitoring, drift detection, and compute allocation optimization across all AI workloads.</p>
        </div>
        <button onClick={() => setAnimate(v => !v)} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`w-3 h-3 ${animate ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Avg GPU Util", value: `${totalUtil.toFixed(1)}%`, color: totalUtil > 85 ? "#c45a4a" : totalUtil > 70 ? GOLD : "#6b8f71", icon: Cpu },
          { label: "Total Power Draw", value: `${(totalPower / 1000).toFixed(2)} kW`, color: GOLD, icon: Zap },
          { label: "Drift Alerts", value: driftAlerts.toString(), color: driftAlerts > 0 ? "#c45a4a" : "#6b8f71", icon: AlertTriangle, pulse: driftAlerts > 0 },
          { label: "Compute Cost (est.)", value: `$${totalCost.toFixed(2)}`, color: "#4B8BDB", icon: DollarSign },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                <span className="text-[10px]" style={{ color: DS.text.muted }}>{c.label}</span>
                {(c as { pulse?: boolean }).pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto" style={{ background: c.color }} />}
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map(tab_item => (
          <button
            key={tab_item.id}
            onClick={() => setTab(tab_item.id)}
            className="px-4 py-2 text-xs font-medium transition-colors"
            style={{
              color: tab === tab_item.id ? "white" : "rgba(255,255,255,0.4)",
              borderBottom: tab === tab_item.id ? `2px solid ${GOLD}` : "2px solid transparent",
            }}
          >
            {tab_item.label}
          </button>
        ))}
      </div>

      {tab === "gpu" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {gpus.map(gpu => <GpuCard key={gpu.id} gpu={gpu} animate={animate} />)}
        </div>
      )}

      {tab === "models" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => <ModelCard key={model.id} model={model} />)}
        </div>
      )}

      {tab === "costs" && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="text-xs font-bold text-white mb-4">Cost Per Inference by Model</div>
            <div className="space-y-3">
              {models.sort((a, b) => b.costPerInference - a.costPerInference).map(m => {
                const maxCost = Math.max(...models.map(mo => mo.costPerInference));
                const pct = (m.costPerInference / maxCost) * 100;
                const totalModelCost = m.costPerInference * m.requestCount;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-36 text-[10px] text-white/60 truncate">{m.name}</div>
                    <div className="flex-1 h-4 rounded-full relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `${GOLD}40`, border: `1px solid ${GOLD}30` }} />
                    </div>
                    <div className="w-20 text-right font-mono text-[10px]" style={{ color: GOLD }}>${m.costPerInference.toFixed(4)}</div>
                    <div className="w-24 text-right font-mono text-[10px]" style={{ color: "#4B8BDB" }}>${totalModelCost.toFixed(2)} total</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Optimization Opportunity", desc: "Alloy GPT-4o handles 40% of requests that could be routed to smaller models. Estimated savings: $120/day", color: "#6b8f71" },
              { label: "Drift Alert Action", desc: "SZL Classifier v2 drift score 18.4 — re-evaluation recommended. Model performance degrading on financial domain queries.", color: "#d4a054" },
              { label: "Capacity Forecast", desc: "GPU-0 projected to exceed 95% utilization in 3.2 hours at current inference rate. Recommend spinning up GPU-4.", color: "#c45a4a" },
            ].map(r => (
              <div key={r.label} className="rounded-xl border p-4" style={{ borderColor: `${r.color}20`, background: `${r.color}06` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
                  <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.label}</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

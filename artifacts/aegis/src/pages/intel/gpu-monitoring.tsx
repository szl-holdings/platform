import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import {
  Server, Activity, Thermometer, Zap, Clock, TrendingUp,
  AlertTriangle, CheckCircle, Cpu, Database, Network, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine, BarChart, Bar,
} from "recharts";
import { InfraSimulator, MetricTimeSeriesSimulator } from "@szl-holdings/observability";
import type { GpuNode, QueuedJob } from "@szl-holdings/observability";
import { api } from "@/lib/api";

const infraSim = new InfraSimulator(0x9ef4a2b8);
const metricSim = new MetricTimeSeriesSimulator(0xdeadbeef);
const NOW = Date.now();

const clusterSnapshot = infraSim.generateClusterSnapshot(NOW);

const throughputHistory = metricSim.generateTimeSeries(148_000, 24, 3_600_000, {
  variance: 0.12,
  anomalyRate: 0.06,
  nowMs: NOW,
});

const throughputData = throughputHistory.map((p, i) => ({
  hour: `${new Date(p.timestamp).getHours()}:00`,
  tokens: Math.floor(p.value),
  flops: Math.floor(p.value / 800),
  anomaly: p.anomaly,
}));

const trainingNode = clusterSnapshot.nodes.find(n => n.trainingLoss !== undefined);
const lossHistory = trainingNode
  ? Array.from({ length: 30 }, (_, i) => {
      const prog = i / 29;
      const base = 2.8 - prog * (2.8 - (trainingNode.trainingLoss ?? 0.6));
      return {
        step: `${i * 100}`,
        loss: parseFloat((base + (Math.sin(i) * 0.04)).toFixed(4)),
        gradNorm: parseFloat(((trainingNode.gradientNorm ?? 1.5) * (1 - prog * 0.4) + Math.sin(i * 0.5) * 0.2).toFixed(3)),
      };
    })
  : [];

function stateColor(state: GpuNode["state"]) {
  return state === "error" ? "text-red-400" :
    state === "throttle" ? "text-orange-400" :
    state === "plateau" ? "text-emerald-400" :
    state === "ramping" ? "text-cyan-400" : "text-slate-400";
}

function stateBg(state: GpuNode["state"]) {
  return state === "error" ? "border-red-500/30" :
    state === "throttle" ? "border-orange-500/30" :
    state === "plateau" ? "" : "";
}

function GpuNodeCard({ node }: { node: GpuNode }) {
  const [expanded, setExpanded] = useState(false);
  const vramPct = (node.vramUsedGb / node.vramTotalGb) * 100;
  const powerPct = (node.powerWatts / node.powerLimitWatts) * 100;
  const nvlinkPct = (node.nvlinkBandwidthGbps / node.nvlinkBandwidthMaxGbps) * 100;

  return (
    <Card className={`${stateBg(node.state)} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm">{node.name}</span>
              <Badge variant="outline" className="text-[10px]">{node.model}</Badge>
              <Badge variant="outline" className="text-[10px]">{node.gpuCount} GPUs</Badge>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${stateColor(node.state)}`}
              >
                {node.state}
              </Badge>
              {node.eccErrorCount > 0 && (
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20">
                  {node.eccErrorCount} ECC errors
                </Badge>
              )}
            </div>

            {node.activeJob ? (
              <p className="text-xs text-muted-foreground mb-2">
                Job: <span className="text-foreground">{node.activeJob.name}</span>
                <span className="text-sky-400 ml-2">
                  {node.activeJob.progress.toFixed(0)}% — ETA {Math.round(node.activeJob.estimatedEtaMs / 60000)}m
                </span>
                {node.activeJob.preemptible && (
                  <span className="text-amber-400 ml-2 text-[10px]">preemptible</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mb-2">Idle — no active job</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">GPU Util</span>
                  <span className={node.utilizationPct >= 90 ? "text-emerald-400" : node.utilizationPct >= 60 ? "text-amber-400" : "text-slate-400"}>
                    {node.utilizationPct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${node.utilizationPct >= 90 ? "bg-emerald-500" : node.utilizationPct >= 60 ? "bg-amber-500" : "bg-slate-500"}`}
                    style={{ width: `${node.utilizationPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">VRAM</span>
                  <span>{node.vramUsedGb.toFixed(0)}/{node.vramTotalGb}GB <span className="text-muted-foreground">({node.vramFragmentation.toFixed(0)}% frag)</span></span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, vramPct)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">Power</span>
                  <span className={powerPct >= 95 ? "text-orange-400" : "text-sky-400"}>
                    {(node.powerWatts / 1000).toFixed(1)}kW / {(node.powerLimitWatts / 1000).toFixed(1)}kW
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${powerPct >= 95 ? "bg-orange-500" : "bg-sky-500"}`} style={{ width: `${powerPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">NVLink BW</span>
                  <span className="text-violet-400">{node.nvlinkBandwidthGbps.toFixed(0)} / {node.nvlinkBandwidthMaxGbps} GB/s</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${nvlinkPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center shrink-0">
            <div>
              <p className={`text-sm font-bold ${node.tempCelsius >= 85 ? "text-red-400" : node.tempCelsius >= 75 ? "text-orange-400" : node.tempCelsius >= 65 ? "text-amber-400" : "text-emerald-400"}`}>
                {node.tempCelsius}°C
              </p>
              <p className="text-[10px] text-muted-foreground">Temp</p>
            </div>
            <div>
              <p className="text-sm font-bold text-cyan-400">
                {node.tokenThroughput > 0 ? `${(node.tokenThroughput / 1000).toFixed(0)}K` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">tok/s</p>
            </div>
            {node.trainingLoss !== undefined && (
              <div>
                <p className="text-sm font-bold text-violet-400">{node.trainingLoss.toFixed(4)}</p>
                <p className="text-[10px] text-muted-foreground">Loss</p>
              </div>
            )}
            {node.gradientNorm !== undefined && (
              <div>
                <p className="text-sm font-bold text-pink-400">{node.gradientNorm.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">∇ Norm</p>
              </div>
            )}
          </div>
        </div>

        {node.xidEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1 mb-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400">Xid Events ({node.xidEvents.length})</span>
            </div>
            <div className="space-y-1">
              {node.xidEvents.slice(0, 2).map((xid) => (
                <div key={xid.xidCode} className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-amber-400">Xid {xid.xidCode}</span>
                  <span className="text-muted-foreground">{xid.description}</span>
                  <span className="text-muted-foreground ml-auto">{Math.floor((NOW - xid.occurredAt) / 60000)}m ago</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.thermalCurve.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">Thermal curve (10 min)</p>
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={node.thermalCurve.slice(-10)} margin={{ top: 2, right: 2, left: -40, bottom: 0 }}>
                <Area
                  type="monotone"
                  dataKey="celsius"
                  stroke={node.tempCelsius >= 80 ? "#f97316" : "#6366f1"}
                  fill={node.tempCelsius >= 80 ? "#f97316" : "#6366f1"}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  dot={false}
                />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QueuedJobRow({ job, rank }: { job: QueuedJob; rank: number }) {
  const priorityColors: Record<string, string> = {
    critical: "text-red-400 bg-red-400/10 border-red-400/20",
    high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  const waitMin = Math.round(job.estimatedWaitMs / 60_000);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{job.name}</span>
          <Badge variant="outline" className={`text-[9px] ${priorityColors[job.priority]}`}>{job.priority}</Badge>
          {job.preemptible && <Badge variant="outline" className="text-[9px] text-slate-400">preemptible</Badge>}
        </div>
        <p className="text-[10px] text-muted-foreground">{job.type} · {job.model} · {job.gpusRequired} GPUs required</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-amber-400">{waitMin < 60 ? `${waitMin}m` : `${(waitMin / 60).toFixed(1)}h`}</p>
        <p className="text-[10px] text-muted-foreground">est. wait</p>
      </div>
    </div>
  );
}

export default function GPUMonitoring() {
  const { data: liveGpuData } = useQuery({
    queryKey: ["dcgm-gpus"],
    queryFn: () => api.live.gpuMetrics(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: liveClusterData } = useQuery({
    queryKey: ["dcgm-cluster"],
    queryFn: () => api.live.gpuCluster(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  interface DcgmGpu {
    gpuIndex: number;
    uuid: string;
    modelName: string;
    utilizationPct: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    temperatureCelsius: number;
    powerDrawWatts: number;
    powerLimitWatts: number;
    smClockMhz: number;
    memClockMhz: number;
    eccSingleBit: number;
    eccDoubleBit: number;
    pcieRxBytesPerSec: number;
    pcieTxBytesPerSec: number;
    fanSpeedPct: number;
    throttleReasons: string[];
  }

  const liveGpus = liveGpuData?.gpus as DcgmGpu[] | undefined;

  const modelMap: Record<string, GpuNode["model"]> = {
    "NVIDIA H100 80GB HBM3": "NVIDIA H100 SXM5",
    "NVIDIA A100 80GB SXM": "NVIDIA A100 80GB",
    "NVIDIA A100 40GB SXM": "NVIDIA A100 40GB",
    "NVIDIA H200 141GB HBM3e": "NVIDIA H200 SXM5",
  };

  const liveNodes: GpuNode[] | undefined = liveGpus?.map((g) => {
    const state: GpuNode["state"] = g.temperatureCelsius >= 85 ? "error"
      : g.temperatureCelsius >= 75 ? "throttle"
      : g.utilizationPct >= 90 ? "plateau"
      : g.utilizationPct > 5 ? "ramping"
      : "idle";
    return {
      id: g.uuid ?? `gpu-${g.gpuIndex}`,
      name: `gpu-node-${g.gpuIndex}`,
      model: modelMap[g.modelName] ?? "NVIDIA H100 SXM5",
      gpuCount: 1,
      state,
      utilizationPct: g.utilizationPct ?? 0,
      vramUsedGb: (g.memoryUsedMb ?? 0) / 1024,
      vramTotalGb: (g.memoryTotalMb ?? 0) / 1024,
      vramFragmentation: 0,
      tempCelsius: g.temperatureCelsius ?? 0,
      powerWatts: g.powerDrawWatts ?? 0,
      powerLimitWatts: g.powerLimitWatts ?? 700,
      nvlinkBandwidthGbps: 0,
      nvlinkBandwidthMaxGbps: 600,
      eccErrorCount: (g.eccSingleBit ?? 0) + (g.eccDoubleBit ?? 0),
      xidEvents: g.throttleReasons?.length
        ? g.throttleReasons.map((r) => ({ xidCode: 79, description: r, occurredAt: Date.now(), severity: "warning" as const }))
        : [],
      thermalCurve: [],
      tokenThroughput: 0,
    };
  });

  interface DcgmClusterSummary {
    totalGpus: number;
    activeGpus: number;
    avgUtilization: number;
    totalVramGb: number;
    usedVramGb: number;
    totalPowerKw: number;
  }
  const liveSummary = liveClusterData?.summary as DcgmClusterSummary | undefined;

  const nodes = liveNodes ?? clusterSnapshot.nodes;
  const queuedJobs = clusterSnapshot.queuedJobs;
  const isLive = !!liveGpus;

  const derivedClusterHealth = (() => {
    const src = liveNodes ?? clusterSnapshot.nodes;
    const errorCount = src.filter((n) => n.state === "error").length;
    const throttleCount = src.filter((n) => n.state === "throttle").length;
    if (errorCount > 0) return "critical";
    if (throttleCount > 0) return "degraded";
    return "healthy";
  })();
  const clusterHealth = derivedClusterHealth;

  const healthColor = clusterHealth === "critical" ? "text-red-400" :
    clusterHealth === "degraded" ? "text-orange-400" : "text-emerald-400";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            GPU Cluster — DCGM Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            NVIDIA DCGM-style telemetry — thermal curves, VRAM fragmentation, NVLink mesh, Xid events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${isLive ? "text-cyan-400 border-cyan-500/30" : "text-slate-400 border-slate-500/30"}`}>
            {isLive ? <Cpu className="w-3 h-3 mr-1 inline" /> : <Database className="w-3 h-3 mr-1 inline" />}
            {isLive ? "DCGM Live" : "Simulated"}
          </Badge>
          <Badge variant="outline" className={`${healthColor} text-xs capitalize`}>
            {clusterHealth === "healthy" ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <AlertTriangle className="w-3 h-3 mr-1 inline" />}
            Cluster {clusterHealth}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total GPUs", value: liveSummary?.totalGpus ?? clusterSnapshot.totalGpus },
          { label: "Active GPUs", value: liveSummary?.activeGpus ?? clusterSnapshot.activeGpus },
          { label: "Avg Util", value: `${(liveSummary?.avgUtilization ?? clusterSnapshot.avgUtilization).toFixed(0)}%` },
          { label: "VRAM Used", value: `${(liveSummary?.usedVramGb ?? clusterSnapshot.usedVramGb).toFixed(0)}/${(liveSummary?.totalVramGb ?? clusterSnapshot.totalVramGb).toFixed(0)}GB` },
          { label: "Total Power", value: `${(liveSummary?.totalPowerKw ?? clusterSnapshot.totalPowerKw).toFixed(1)}kW` },
          { label: "Throughput", value: `${clusterSnapshot.totalThroughputKtps.toFixed(0)}K tok/s` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Token Throughput — 24h (tok/s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={throughputData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v.toLocaleString()} tok/s`, "Throughput"]}
                />
                <Area type="monotone" dataKey="tokens" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {lossHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Training Loss Curve — {trainingNode?.activeJob?.model ?? "Active Model"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={lossHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="step" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={5} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={["dataMin - 0.1", "dataMax + 0.1"]} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#a78bfa" dot={false} strokeWidth={2} name="Train Loss" />
                  <Line type="monotone" dataKey="gradNorm" stroke="#f0abfc" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Grad Norm" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Node Details</h2>
          {nodes.map(node => (
            <GpuNodeCard key={node.id} node={node} />
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Job Queue ({queuedJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 max-h-[320px] overflow-y-auto">
              {queuedJobs
                .sort((a, b) => {
                  const p = { critical: 0, high: 1, medium: 2, low: 3 };
                  return p[a.priority] - p[b.priority];
                })
                .map((job, i) => (
                  <QueuedJobRow key={job.id} job={job} rank={i + 1} />
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="w-4 h-4 text-violet-400" />
                NVLink Mesh Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {clusterSnapshot.nvlinkTopology.links.slice(0, 6).map((link) => (
                  <div key={`${link.from}-${link.to}`} className="rounded-lg border border-border p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${link.healthy ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className="text-[10px] text-muted-foreground font-mono">{link.from} ↔ {link.to}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-foreground">{link.bandwidthGbps.toFixed(0)} GB/s</span>
                      <span className={link.utilizationPct > 80 ? "text-amber-400" : "text-muted-foreground"}>
                        {link.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${link.utilizationPct > 80 ? "bg-amber-500" : "bg-violet-500"}`}
                        style={{ width: `${link.utilizationPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{clusterSnapshot.nvlinkTopology.links.filter(l => l.healthy).length}/{clusterSnapshot.nvlinkTopology.links.length} links healthy</span>
                <span>{clusterSnapshot.nvlinkTopology.links.filter(l => !l.healthy).length > 0 ? "⚠ degraded links detected" : "✓ mesh nominal"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                Cluster Thermal Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {nodes.map(node => (
                <div key={node.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-24 truncate">{node.name.split(" ").slice(-2).join(" ")}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${node.tempCelsius >= 85 ? "bg-red-500" : node.tempCelsius >= 75 ? "bg-orange-500" : node.tempCelsius >= 65 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${(node.tempCelsius / 95) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-12 text-right ${node.tempCelsius >= 85 ? "text-red-400" : node.tempCelsius >= 75 ? "text-orange-400" : node.tempCelsius >= 65 ? "text-amber-400" : "text-emerald-400"}`}>
                    {node.tempCelsius}°C
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

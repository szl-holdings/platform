import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Server, Activity, Thermometer, Zap, Clock, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const gpuNodes = [
  { id: "node-01", name: "H100 Node Alpha", gpus: 8, model: "NVIDIA H100 SXM5", utilization: 94, memUsed: 620, memTotal: 640, temp: 71, power: 6200, job: "LLaMA-3-70B Fine-tune", eta: "2h 14m" },
  { id: "node-02", name: "H100 Node Beta", gpus: 8, model: "NVIDIA H100 SXM5", utilization: 78, memUsed: 480, memTotal: 640, temp: 67, power: 5100, job: "Stable Diffusion 3 XL Training", eta: "5h 32m" },
  { id: "node-03", name: "A100 Node Gamma", gpus: 4, model: "NVIDIA A100 80GB", utilization: 100, memUsed: 320, memTotal: 320, temp: 84, power: 2800, job: "GPT-4 Evaluation Suite", eta: "41 min" },
  { id: "node-04", name: "A100 Node Delta", gpus: 4, model: "NVIDIA A100 80GB", utilization: 23, memUsed: 87, memTotal: 320, temp: 42, power: 820, job: "Idle — next job queued", eta: "—" },
];

const throughputData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  tokens: Math.floor(Math.random() * 80000 + 120000),
  flops: Math.floor(Math.random() * 20 + 180),
}));

const clusterSummary = {
  totalGPUs: 24,
  activeGPUs: 24,
  avgUtilization: Math.round(gpuNodes.reduce((a, n) => a + n.utilization, 0) / gpuNodes.length),
  totalMemory: "1.28 TB",
  activeJobs: 3,
  queuedJobs: 7,
};

export default function GPUMonitoring() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="w-6 h-6 text-primary" />
          GPU Cluster Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time GPU utilization, memory, thermal, and training throughput for A100/H100 clusters</p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total GPUs", value: clusterSummary.totalGPUs },
          { label: "Avg Utilization", value: `${clusterSummary.avgUtilization}%` },
          { label: "Total VRAM", value: clusterSummary.totalMemory },
          { label: "Active Jobs", value: clusterSummary.activeJobs },
          { label: "Queued Jobs", value: clusterSummary.queuedJobs },
          { label: "Throughput", value: "124K tok/s" },
        ].map(({ label, value }) => (
          <Card key={label}><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cluster Throughput — 24h (Tokens/sec)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={throughputData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`${Number(v).toLocaleString()} tok/s`, "Throughput"]} />
              <Area type="monotone" dataKey="tokens" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {gpuNodes.map((node) => (
          <Card key={node.id} className={node.temp >= 80 ? "border-orange-500/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{node.name}</span>
                    <Badge variant="outline" className="text-[10px]">{node.model}</Badge>
                    <Badge variant="outline" className="text-[10px]">{node.gpus} GPUs</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Job: <span className="text-foreground">{node.job}</span>{node.eta !== "—" && <span className="text-sky-400 ml-2">ETA: {node.eta}</span>}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">GPU Util</span>
                        <span className={node.utilization >= 90 ? "text-green-400" : "text-amber-400"}>{node.utilization}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${node.utilization >= 90 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${node.utilization}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">VRAM</span>
                        <span>{node.memUsed}/{node.memTotal} GB</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full bg-purple-500" style={{ width: `${(node.memUsed / node.memTotal) * 100}%` }} /></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                  <div>
                    <p className={`text-sm font-bold ${node.temp >= 80 ? "text-orange-400" : node.temp >= 70 ? "text-amber-400" : "text-emerald-400"}`}>{node.temp}°C</p>
                    <p className="text-[10px] text-muted-foreground">Temp</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-sky-400">{(node.power / 1000).toFixed(1)}kW</p>
                    <p className="text-[10px] text-muted-foreground">Power</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

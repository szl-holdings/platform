import { BarChart3, TrendingUp, Clock, Cpu, HardDrive, Wifi, Activity, Zap, ArrowUp, ArrowDown } from "lucide-react";

const resourceMetrics = [
  { name: "CPU Utilization", current: 67, peak: 94, avg: 62, trend: "up", unit: "%" },
  { name: "Memory Usage", current: 74, peak: 89, avg: 71, trend: "up", unit: "%" },
  { name: "Network I/O", current: 2.4, peak: 4.8, avg: 2.1, trend: "down", unit: "Gbps" },
  { name: "Disk IOPS", current: 12400, peak: 28900, avg: 11200, trend: "up", unit: "" },
];

const serviceLatency = [
  { service: "API Gateway", p50: 12, p95: 45, p99: 128, status: "healthy" },
  { service: "Auth Service", p50: 8, p95: 22, p99: 67, status: "healthy" },
  { service: "Core Engine", p50: 45, p95: 180, p99: 450, status: "degraded" },
  { service: "Data Pipeline", p50: 22, p95: 89, p99: 210, status: "healthy" },
  { service: "Event Queue", p50: 4, p95: 12, p99: 34, status: "healthy" },
  { service: "CDN Edge", p50: 15, p95: 42, p99: 95, status: "healthy" },
];

const heatmapData = [
  { hour: "00:00", cpu: 32, mem: 45, net: 18 }, { hour: "04:00", cpu: 28, mem: 42, net: 12 },
  { hour: "08:00", cpu: 65, mem: 68, net: 45 }, { hour: "12:00", cpu: 82, mem: 78, net: 67 },
  { hour: "16:00", cpu: 94, mem: 85, net: 78 }, { hour: "20:00", cpu: 58, mem: 62, net: 42 },
];

function HeatCell({ value }: { value: number }) {
  const bg = value > 80 ? "bg-[#c45a4a]" : value > 60 ? "bg-[#d4a054]" : value > 40 ? "bg-[#4a90b8]" : "bg-[#6b8f71]";
  const opacity = Math.max(0.3, value / 100);
  return (
    <div className={`w-full h-8 rounded ${bg} flex items-center justify-center text-[10px] font-mono text-white`} style={{ opacity }}>
      {value}%
    </div>
  );
}

export default function MeridianAnalytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Operational Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Infrastructure performance metrics and resource utilization</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resourceMetrics.map((m) => (
          <div key={m.name} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-2">{m.name}</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-display font-bold">
                {typeof m.current === "number" && m.current > 100 ? m.current.toLocaleString() : m.current}{m.unit}
              </div>
              <span className={`flex items-center gap-1 text-xs ${m.trend === "up" ? "text-[#d4a054]" : "text-[#6b8f71]"}`}>
                {m.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className={`h-2 rounded-full ${typeof m.current === "number" && m.current > 80 ? "bg-[#c45a4a]" : m.current > 60 ? "bg-[#d4a054]" : "bg-[#6b8f71]"}`} style={{ width: `${Math.min(typeof m.current === "number" ? m.current : 50, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Avg: {typeof m.avg === "number" && m.avg > 100 ? m.avg.toLocaleString() : m.avg}{m.unit}</span>
              <span>Peak: {typeof m.peak === "number" && m.peak > 100 ? m.peak.toLocaleString() : m.peak}{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#d4a054]" /> Resource Utilization Heatmap (24h)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left py-2 w-16">Metric</th>
                {heatmapData.map((d) => (
                  <th key={d.hour} className="text-center py-2">{d.hour}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-xs text-muted-foreground py-1">CPU</td>
                {heatmapData.map((d) => <td key={d.hour} className="px-1 py-1"><HeatCell value={d.cpu} /></td>)}
              </tr>
              <tr>
                <td className="text-xs text-muted-foreground py-1">MEM</td>
                {heatmapData.map((d) => <td key={d.hour} className="px-1 py-1"><HeatCell value={d.mem} /></td>)}
              </tr>
              <tr>
                <td className="text-xs text-muted-foreground py-1">NET</td>
                {heatmapData.map((d) => <td key={d.hour} className="px-1 py-1"><HeatCell value={d.net} /></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4a90b8]" /> Service Latency Distribution
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">Service</th>
              <th className="text-center p-4">P50</th>
              <th className="text-center p-4">P95</th>
              <th className="text-center p-4">P99</th>
              <th className="text-center p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {serviceLatency.map((s) => (
              <tr key={s.service} className="hover:bg-muted/30">
                <td className="p-4 text-sm font-medium">{s.service}</td>
                <td className="p-4 text-center text-sm font-mono">{s.p50}ms</td>
                <td className="p-4 text-center text-sm font-mono">{s.p95}ms</td>
                <td className="p-4 text-center text-sm font-mono text-muted-foreground">{s.p99}ms</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.status === "healthy" ? "bg-[#6b8f71]/10 text-[#6b8f71]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Monitor, AlertTriangle, CheckCircle, RefreshCw, Shield, Package, Terminal, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api";
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Device {
  id: number;
  deviceId: string;
  hostname: string;
  clientName: string;
  type: string;
  os: string;
  ipAddress: string;
  status: "online" | "warning" | "critical" | "offline";
  cpu: number;
  memory: number;
  disk: number;
  alerts: number;
  patchesPending: number;
  threats: number;
  lastSeen: string;
}

interface DevicesResponse {
  devices: Device[];
  total: number;
}

interface SystemMetrics {
  device: { id: string; hostname: string; platform: string; arch: string; release: string; type: string; status: string };
  metrics: {
    cpu: { percent: number; cores: number; loadAvg1m: number; loadAvg5m: number; loadAvg15m: number };
    memory: { percent: number; totalGb: number; freeGb: number; usedGb: number; processRssGb: number; processHeapUsedGb: number };
    uptime: { seconds: number; hours: number; days: number; formatted: string };
    process: { pid: number; uptime: number; nodeVersion: string };
    disk: { percent: number; note: string };
  };
  fetchedAt: string;
}

const patchGroups = [
  { name: "Critical Security (0-day)", count: 14, severity: "Critical", autoApprove: false },
  { name: "High Priority Security", count: 47, severity: "High", autoApprove: true },
  { name: "Feature Updates", count: 132, severity: "Medium", autoApprove: false },
  { name: "Driver Updates", count: 28, severity: "Low", autoApprove: false },
];

const statusColor: Record<string, string> = {
  online: "text-emerald-400 bg-emerald-500/10",
  critical: "text-red-400 bg-red-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  offline: "text-muted-foreground bg-muted",
};

function MetricBar({ value, label }: { value: number; label: string }) {
  const color = value >= 85 ? "bg-red-500" : value >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">{label}</span><span>{value}%</span></div>
      <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function LiveServerCard({ metrics, loading }: { metrics: SystemMetrics | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!metrics) return null;
  const m = metrics.metrics;
  const status = m.cpu.percent > 85 || m.memory.percent > 90 ? "warning" : "online";

  return (
    <Card className={`border-2 ${status === "warning" ? "border-amber-500/30" : "border-emerald-500/20"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-2 h-2 rounded-full mt-1.5 ${status === "online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm font-mono">{metrics.device.hostname}</span>
              <Badge variant="outline" className="text-[10px]">SZL Infrastructure</Badge>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor[status]}`}>{status === "online" ? "Online" : "Warning"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">LIVE</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{metrics.device.platform} {metrics.device.arch} · Node {m.process.nodeVersion} · Uptime: {m.uptime.formatted}</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <MetricBar value={m.cpu.percent} label="CPU" />
              <MetricBar value={m.memory.percent} label="Memory" />
              <MetricBar value={m.disk.percent} label="Disk" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{m.cpu.cores} cores · {m.cpu.loadAvg1m} load</span>
              <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" />{m.memory.usedGb}GB / {m.memory.totalGb}GB RAM</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Terminal className="w-3 h-3" />Console
            </button>
            <button className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 transition-colors">Metrics</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RMMConsole() {
  const [search, setSearch] = useState("");
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [lastPolled, setLastPolled] = useState<Date>(new Date());

  const { data: devicesData, isLoading: devicesLoading, refetch } = useQuery<DevicesResponse>({
    queryKey: ["msp-devices-rmm"],
    queryFn: () => apiFetch<DevicesResponse>("/msp/devices?limit=50"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiFetch<SystemMetrics>("/msp/live/system-metrics");
      setSystemMetrics(data);
      setLastPolled(new Date());
    } catch {
      // silently fail
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const devices = devicesData?.devices ?? [];
  const filtered = devices.filter(e =>
    e.hostname.toLowerCase().includes(search.toLowerCase()) ||
    (e.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalEndpoints = devices.length + 1;
  const onlineCount = devices.filter(e => e.status === "online").length + (systemMetrics ? 1 : 0);
  const alertCount = devices.filter(e => e.status !== "online").length + (systemMetrics && (systemMetrics.metrics.cpu.percent > 85 || systemMetrics.metrics.memory.percent > 90) ? 1 : 0);
  const patchesPending = devices.reduce((a, d) => a + (d.patchesPending || 0), 0) + patchGroups.reduce((a, p) => a + p.count, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            RMM Console — Endpoint Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Remote monitoring across managed endpoints — real server metrics, patch management, and threat status</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Last polled {lastPolled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
          <button onClick={() => { refetch(); fetchMetrics(); }} className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
            <RefreshCw className="w-3 h-3" /> Refresh All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Endpoints", value: totalEndpoints, color: "text-sky-400" },
          { label: "Online", value: onlineCount, color: "text-emerald-400" },
          { label: "Alerts / Warnings", value: alertCount, color: "text-red-400" },
          { label: "Patches Pending", value: patchesPending, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search endpoints or clients..."
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Live server card — always first */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Monitored Server
            </p>
            <LiveServerCard metrics={systemMetrics} loading={metricsLoading} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Managed Endpoints ({filtered.length})</p>
            {devicesLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {filtered.slice(0, 20).map((ep) => (
                  <Card key={ep.id} className={ep.status === "critical" ? "border-red-500/30" : ep.status === "warning" ? "border-amber-500/20" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${ep.status === "online" ? "bg-emerald-500" : ep.status === "critical" ? "bg-red-500 animate-pulse" : ep.status === "warning" ? "bg-amber-500" : "bg-zinc-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm font-mono">{ep.hostname}</span>
                            <Badge variant="outline" className="text-[10px]">{ep.clientName}</Badge>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor[ep.status]}`}>{ep.status.charAt(0).toUpperCase() + ep.status.slice(1)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{ep.os} · Last: {formatLastSeen(ep.lastSeen)}</p>
                          {ep.status !== "offline" && (
                            <div className="grid grid-cols-3 gap-3 mt-2">
                              <MetricBar value={ep.cpu} label="CPU" />
                              <MetricBar value={ep.memory} label="RAM" />
                              <MetricBar value={ep.disk} label="Disk" />
                            </div>
                          )}
                          <div className="flex gap-3 mt-2">
                            {ep.patchesPending > 0 && <span className="flex items-center gap-1 text-[10px] text-amber-400"><Package className="w-3 h-3" />{ep.patchesPending} patches</span>}
                            {ep.threats > 0 && <span className="flex items-center gap-1 text-[10px] text-red-400"><Shield className="w-3 h-3" />{ep.threats} threat</span>}
                            {ep.alerts > 0 && <span className="flex items-center gap-1 text-[10px] text-orange-400"><AlertTriangle className="w-3 h-3" />{ep.alerts} alert{ep.alerts > 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center gap-1"><Terminal className="w-3 h-3" />Remote</button>
                          <button className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 transition-colors">Patch</button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Patch Approval Queue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {patchGroups.map((g) => (
                <div key={g.name} className="p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{g.count} patches pending</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] ${g.severity === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : g.severity === "High" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-muted-foreground"}`}>{g.severity}</Badge>
                      {g.autoApprove && <span className="text-[10px] text-emerald-400">Auto-approved</span>}
                    </div>
                  </div>
                  {!g.autoApprove && <button className="mt-2 text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors w-full">Review & Deploy</button>}
                </div>
              ))}
            </CardContent>
          </Card>

          {systemMetrics && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-400" />API Server — Live</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">CPU Load (1m)</span><span className="font-mono">{systemMetrics.metrics.cpu.loadAvg1m}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CPU Load (5m)</span><span className="font-mono">{systemMetrics.metrics.cpu.loadAvg5m}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CPU Load (15m)</span><span className="font-mono">{systemMetrics.metrics.cpu.loadAvg15m}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">RAM Used</span><span className="font-mono">{systemMetrics.metrics.memory.usedGb}GB</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Process RSS</span><span className="font-mono">{systemMetrics.metrics.memory.processRssGb}GB</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Heap Used</span><span className="font-mono">{systemMetrics.metrics.memory.processHeapUsedGb}GB</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="font-mono">{systemMetrics.metrics.uptime.formatted}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Node.js</span><span className="font-mono">{systemMetrics.metrics.process.nodeVersion}</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

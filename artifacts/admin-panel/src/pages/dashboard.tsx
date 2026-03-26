import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, Database, HardDrive, Cpu, Wifi, WifiOff, AlertTriangle, Server, Layers, Users, Zap, Clock } from "lucide-react";

function StatusDot({ status }: { status: string }) {
  const color = status === "healthy" || status === "active" || status === "LIVE_CONFIGURED"
    ? "bg-emerald-500" : status === "demo" || status === "MOCKED_DEMO_MODE"
    ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: api.getOverview,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading system overview...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertTriangle className="w-8 h-8" />
          <span className="text-sm">Failed to load system overview</span>
        </div>
      </div>
    );
  }

  const memPercent = Math.round((data.system.memoryUsage.heapUsed / data.system.memoryUsage.heapTotal) * 100);
  const storagePercent = Math.round((data.storage.usedBytes / data.storage.totalBytes) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time health and performance metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Layers className="w-4 h-4" />} label="Apps" value={`${data.counts.activeApps}/${data.counts.apps}`} sub="Active" color="text-blue-400" />
        <MetricCard icon={<Zap className="w-4 h-4" />} label="Connectors" value={`${data.counts.liveConnectors}/${data.counts.connectors}`} sub="Live" color="text-emerald-400" />
        <MetricCard icon={<Users className="w-4 h-4" />} label="Users" value={`${data.counts.activeUsers}/${data.counts.users}`} sub="Active" color="text-purple-400" />
        <MetricCard icon={<Clock className="w-4 h-4" />} label="Uptime" value={formatUptime(data.system.uptime)} sub={data.system.nodeVersion} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <StatusDot status={data.database.status} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize font-medium text-emerald-400">{data.database.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-mono">{data.database.latency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-mono">{data.database.connections}/{data.database.maxConnections}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <StatusDot status={data.storage.status} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono">{formatBytes(data.storage.usedBytes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono">{formatBytes(data.storage.totalBytes)}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{memPercent}%</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heap Used</span>
              <span className="font-mono">{formatBytes(data.system.memoryUsage.heapUsed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heap Total</span>
              <span className="font-mono">{formatBytes(data.system.memoryUsage.heapTotal)}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${memPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Integration Health</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {data.connectors.summary.total} connectors
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.connectors.services.map((svc) => (
            <div key={svc.name} className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
              {svc.status === "LIVE_CONFIGURED" ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : svc.status === "MOCKED_DEMO_MODE" ? (
                <Server className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{svc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {svc.status === "LIVE_CONFIGURED" ? "Live" : svc.status === "MOCKED_DEMO_MODE" ? "Demo" : "Not Configured"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Server,
  Users,
  Zap,
  TrendingUp,
  HardDrive,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: api.getOverview,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const counts = data?.counts;
  const db = data?.database;
  const storage = data?.storage;
  const system = data?.system;

  const statCards = [
    {
      label: "Active Apps",
      value: counts?.activeApps ?? "—",
      sub: `of ${counts?.apps ?? "?"} total`,
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      color: "emerald",
    },
    {
      label: "Live Connectors",
      value: counts?.liveConnectors ?? "—",
      sub: `of ${counts?.connectors ?? "?"} total`,
      icon: <Activity className="w-5 h-5 text-blue-400" />,
      color: "blue",
    },
    {
      label: "Active Users",
      value: counts?.activeUsers ?? "—",
      sub: `of ${counts?.users ?? "?"} registered`,
      icon: <Users className="w-5 h-5 text-violet-400" />,
      color: "violet",
    },
    {
      label: "System Uptime",
      value: system ? formatUptime(system.uptime) : "—",
      sub: `Node ${system?.nodeVersion ?? ""}`,
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
      color: "amber",
    },
  ];

  const dbStatus = db?.status === "healthy";
  const storageStatus = storage?.status === "healthy";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and platform health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Database</h3>
            {dbStatus ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 ml-auto" />
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={dbStatus ? "text-emerald-400" : "text-amber-400"}>{db?.status ?? "unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency</span>
              <span>{db?.latency != null ? `${db.latency}ms` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span>{db ? `${db.connections} / ${db.maxConnections}` : "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Storage</h3>
            {storageStatus ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
            ) : (
              <Server className="w-3.5 h-3.5 text-amber-400 ml-auto" />
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={storageStatus ? "text-emerald-400" : "text-amber-400"}>{storage?.status ?? "unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{storage ? formatBytes(storage.usedBytes) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>{storage ? formatBytes(storage.totalBytes) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">System</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node.js</span>
              <span>{system?.nodeVersion ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="capitalize">{system?.platform ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heap Used</span>
              <span>{system?.memoryUsage ? formatBytes(system.memoryUsage.heapUsed) : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, Database, HardDrive, Cpu, Wifi, WifiOff, AlertTriangle, Server, Layers, Users, Zap, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

function AnimatedStatusDot({ status }: { status: string }) {
  const isHealthy = status === "healthy" || status === "active" || status === "LIVE_CONFIGURED";
  const isWarning = status === "demo" || status === "MOCKED_DEMO_MODE";
  const color = isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500";
  const ringColor = isHealthy ? "ring-emerald-500/30" : isWarning ? "ring-amber-500/30" : "ring-red-500/30";

  return (
    <span className="relative inline-flex">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ring-4 ${ringColor}`} />
      <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${color} animate-ping opacity-40`} />
    </span>
  );
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prevValue.current = value;
  }, [value, duration]);

  return <>{display}</>;
}

function MiniSparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
    </svg>
  );
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

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-7 w-20 bg-muted rounded animate-pulse" />
            <div className="h-3 w-12 bg-muted/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 h-40 animate-pulse" />
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 h-48 animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: api.getOverview,
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Failed to load system overview</p>
            <p className="text-xs text-muted-foreground mt-1">Check your API server connection</p>
          </div>
        </div>
      </div>
    );
  }

  const memPercent = Math.round((data.system.memoryUsage.heapUsed / data.system.memoryUsage.heapTotal) * 100);
  const storagePercent = Math.round((data.storage.usedBytes / data.storage.totalBytes) * 100);

  const sparkData = Array.from({ length: 12 }, (_, i) => 60 + Math.sin(i * 0.8) * 20 + Math.random() * 10);
  const memSparkData = Array.from({ length: 12 }, (_, i) => memPercent - 10 + Math.sin(i * 0.5) * 8 + Math.random() * 5);
  const storageSparkData = Array.from({ length: 12 }, (_, i) => storagePercent - 5 + Math.sin(i * 0.3) * 3 + Math.random() * 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time health and performance metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Layers className="w-4 h-4" />}
          label="Apps"
          value={data.counts.activeApps}
          total={data.counts.apps}
          sub="Active"
          color="text-blue-400"
          trend={+2}
          sparkData={sparkData}
          sparkColor="#60a5fa"
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Connectors"
          value={data.counts.liveConnectors}
          total={data.counts.connectors}
          sub="Live"
          color="text-emerald-400"
          trend={0}
          sparkData={sparkData}
          sparkColor="#34d399"
        />
        <MetricCard
          icon={<Users className="w-4 h-4" />}
          label="Users"
          value={data.counts.activeUsers}
          total={data.counts.users}
          sub="Active"
          color="text-purple-400"
          trend={+5}
          sparkData={sparkData}
          sparkColor="#c084fc"
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Uptime"
          valueStr={formatUptime(data.system.uptime)}
          sub={data.system.nodeVersion}
          color="text-amber-400"
          sparkData={sparkData}
          sparkColor="#fbbf24"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Database</span>
            </div>
            <AnimatedStatusDot status={data.database.status} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize font-medium text-emerald-400">{data.database.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-mono text-foreground">{data.database.latency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-mono text-foreground">{data.database.connections}/{data.database.maxConnections}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(data.database.connections / data.database.maxConnections) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-medium">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <MiniSparkline data={storageSparkData} color="#a855f7" />
              <AnimatedStatusDot status={data.storage.status} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono text-foreground">{formatBytes(data.storage.usedBytes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono text-foreground">{formatBytes(data.storage.totalBytes)}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <MiniSparkline data={memSparkData} color="#f59e0b" />
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{memPercent}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heap Used</span>
              <span className="font-mono text-foreground">{formatBytes(data.system.memoryUsage.heapUsed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heap Total</span>
              <span className="font-mono text-foreground">{formatBytes(data.system.memoryUsage.heapTotal)}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${memPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <IntegrationHealthSection connectors={data.connectors} />
    </div>
  );
}

function IntegrationHealthSection({ connectors }: { connectors: { summary: { total: number }; services: { name: string; status: string }[] } }) {
  const [showAll, setShowAll] = useState(false);

  const unhealthy = connectors.services.filter(s => s.status !== "LIVE_CONFIGURED");
  const healthy = connectors.services.filter(s => s.status === "LIVE_CONFIGURED");
  const displayedServices = showAll ? connectors.services : unhealthy;
  const hasUnhealthy = unhealthy.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-sm font-medium">Integration Health</span>
        <div className="ml-auto flex items-center gap-2">
          {hasUnhealthy && !showAll && (
            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {unhealthy.length} need attention
            </span>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-0.5 rounded-full"
          >
            {showAll ? `Show issues only (${unhealthy.length})` : `Show all (${connectors.summary.total})`}
          </button>
        </div>
      </div>
      {displayedServices.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400 py-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          All {healthy.length} integrations are live and configured
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedServices.map((svc) => (
            <ConnectorStatusCard key={svc.name} name={svc.name} status={svc.status} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectorStatusCard({ name, status }: { name: string; status: string }) {
  const isLive = status === "LIVE_CONFIGURED";
  const isDemo = status === "MOCKED_DEMO_MODE";

  const borderColor = isLive ? "border-emerald-500/20 hover:border-emerald-500/40" : isDemo ? "border-amber-500/20 hover:border-amber-500/40" : "border-red-500/20 hover:border-red-500/40";
  const bgGlow = isLive ? "hover:shadow-emerald-500/5" : isDemo ? "hover:shadow-amber-500/5" : "hover:shadow-red-500/5";

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 border ${borderColor} ${bgGlow} hover:shadow-lg transition-all duration-200`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isLive ? "bg-emerald-500/10" : isDemo ? "bg-amber-500/10" : "bg-red-500/10"
      }`}>
        {isLive ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : isDemo ? (
          <Server className="w-4 h-4 text-amber-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className={`text-xs font-medium ${isLive ? "text-emerald-400" : isDemo ? "text-amber-400" : "text-red-400"}`}>
          {isLive ? "Live" : isDemo ? "Demo" : "Not Configured"}
        </div>
      </div>
      <AnimatedStatusDot status={status} />
    </div>
  );
}

function MetricCard({ icon, label, value, total, valueStr, sub, color, trend, sparkData, sparkColor }: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  total?: number;
  valueStr?: string;
  sub: string;
  color: string;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {valueStr || (value !== undefined ? (
              <><AnimatedCounter value={value} />{total !== undefined ? <span className="text-muted-foreground text-lg">/{total}</span> : null}</>
            ) : null)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>
        {sparkData && sparkColor && <MiniSparkline data={sparkData} color={sparkColor} />}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { useState } from "react";

function StatusIcon({ status }: { status: string }) {
  if (status === "healthy") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "degraded") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const colors = status === "healthy"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : status === "degraded"
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : "bg-red-500/10 text-red-400 border-red-500/30";
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize font-medium ${colors}`}>
      {status}
    </span>
  );
}

function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MiniSparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/60 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-24 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 h-40 animate-pulse" />
      ))}
    </div>
  );
}

export default function SystemHealthPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000,
  });

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-red-500/30 bg-red-500/5">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-sm text-muted-foreground">Failed to load system health</span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories = [...new Set(data.checks.map((c) => c.category))];
  const healthPercent = data.summary.total > 0 ? Math.round((data.summary.healthy / data.summary.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Unified health status across all platform services</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-5 ${data.status === "healthy" ? "bg-emerald-500" : data.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Overall</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-semibold capitalize">{data.status}</div>
              <StatusBadge status={data.status} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{healthPercent}% healthy</div>
          </div>
        </div>
        <HealthSummaryCard icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} label="Healthy" count={data.summary.healthy} total={data.summary.total} color="bg-emerald-500" />
        <HealthSummaryCard icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} label="Degraded" count={data.summary.degraded} total={data.summary.total} color="bg-amber-500" />
        <HealthSummaryCard icon={<XCircle className="w-4 h-4 text-red-400" />} label="Down" count={data.summary.down} total={data.summary.total} color="bg-red-500" />
      </div>

      {categories.map((category) => {
        const categoryChecks = data.checks.filter((c) => c.category === category);
        const healthyCount = categoryChecks.filter((c) => c.status === "healthy").length;
        const isExpanded = expandedCategory === null || expandedCategory === category;
        const sparkData = categoryChecks.map(c => c.latencyMs ?? 0);

        return (
          <div key={category} className="rounded-xl border border-border bg-card overflow-hidden transition-all">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center gap-3 p-5 hover:bg-muted/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">{category}</span>
              <div className="flex items-center gap-2 ml-auto">
                {sparkData.length > 1 && <MiniSparkline data={sparkData} color={healthyCount === categoryChecks.length ? "#10b981" : "#f59e0b"} />}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  healthyCount === categoryChecks.length
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {healthyCount}/{categoryChecks.length}
                </span>
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-border p-5 pt-3 space-y-2">
                {categoryChecks.map((check) => (
                  <div key={check.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                    <StatusIcon status={check.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.details}</div>
                    </div>
                    {check.latencyMs !== null && (
                      <div className="flex items-center gap-2 shrink-0">
                        <HealthBar value={check.latencyMs} max={500} color={check.latencyMs < 100 ? "bg-emerald-500" : check.latencyMs < 300 ? "bg-amber-500" : "bg-red-500"} />
                        <span className="text-xs font-mono text-muted-foreground w-12 text-right">{check.latencyMs}ms</span>
                      </div>
                    )}
                    <StatusBadge status={check.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Last checked: {new Date(data.timestamp).toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Auto-refresh every 30s
        </div>
      </div>
    </div>
  );
}

function HealthSummaryCard({ icon, label, count, total, color }: { icon: React.ReactNode; label: string; count: number; total: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold">{count}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">of {total} checks</span>
        {count > 0 && (
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${(count / total) * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

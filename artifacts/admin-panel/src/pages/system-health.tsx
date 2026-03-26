import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

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
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colors}`}>
      {status}
    </span>
  );
}

export default function SystemHealthPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm text-muted-foreground">Failed to load system health</span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-border bg-card hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories = [...new Set(data.checks.map((c) => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Unified health status across all platform services</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall</span>
          </div>
          <div className="text-2xl font-semibold capitalize">{data.status}</div>
          <StatusBadge status={data.status} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Healthy</span>
          </div>
          <div className="text-2xl font-semibold">{data.summary.healthy}</div>
          <span className="text-xs text-muted-foreground">of {data.summary.total} checks</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Degraded</span>
          </div>
          <div className="text-2xl font-semibold">{data.summary.degraded}</div>
          <span className="text-xs text-muted-foreground">services</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Down</span>
          </div>
          <div className="text-2xl font-semibold">{data.summary.down}</div>
          <span className="text-xs text-muted-foreground">services</span>
        </div>
      </div>

      {categories.map((category) => {
        const categoryChecks = data.checks.filter((c) => c.category === category);
        return (
          <div key={category} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{category}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {categoryChecks.filter((c) => c.status === "healthy").length}/{categoryChecks.length} healthy
              </span>
            </div>
            <div className="space-y-2">
              {categoryChecks.map((check) => (
                <div key={check.name} className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                  <StatusIcon status={check.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{check.name}</div>
                    <div className="text-xs text-muted-foreground">{check.details}</div>
                  </div>
                  {check.latencyMs !== null && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{check.latencyMs}ms</span>
                  )}
                  <StatusBadge status={check.status} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-muted-foreground text-right">
        Last checked: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

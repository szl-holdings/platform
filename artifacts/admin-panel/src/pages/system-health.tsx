import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, HeartPulse } from "lucide-react";

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Degraded" },
  down: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Down" },
};

export default function SystemHealthPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: api.getSystemHealth,
    refetchInterval: 60000,
  });

  const summary = data?.summary;
  const categories = [...new Set(data?.checks.map(c => c.category) ?? [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time health status across all services</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Healthy", value: summary.healthy, color: "emerald" },
            { label: "Degraded", value: summary.degraded, color: "amber" },
            { label: "Down", value: summary.down, color: "red" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${s.color === "emerald" ? "text-emerald-400" : s.color === "amber" ? "text-amber-400" : "text-red-400"}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const checks = data?.checks.filter(c => c.category === cat) ?? [];
            return (
              <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-semibold">{cat}</h3>
                </div>
                <div className="divide-y divide-border">
                  {checks.map((check) => {
                    const cfg = STATUS_CONFIG[check.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.degraded;
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={check.name} className="flex items-center gap-4 px-5 py-3.5">
                        <StatusIcon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{check.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{check.details}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          {check.latencyMs != null && <span>{check.latencyMs}ms</span>}
                          <span className={`px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>{cfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

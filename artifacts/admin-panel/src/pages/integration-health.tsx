import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  LIVE_CONFIGURED: "text-emerald-400",
  MOCKED_DEMO_MODE: "text-amber-400",
  MANUAL_REQUIRED: "text-red-400",
};

export default function IntegrationHealthPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-integration-health"],
    queryFn: api.getIntegrationHealth,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integration Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Status of all external integrations</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {data?.services?.map((s) => (
            <div key={s.name} className="flex items-center gap-4 px-5 py-3.5">
              <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.description}</p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                {s.responseTimeMs != null && <span className="text-muted-foreground">{s.responseTimeMs}ms</span>}
                <span className={`font-medium ${STATUS_COLORS[s.status] || "text-muted-foreground"}`}>
                  {s.status.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

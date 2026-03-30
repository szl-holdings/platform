import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function IntegrationActivityPage() {
  const [filters, setFilters] = useState({ connector: "", status: "" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-integration-activity", filters],
    queryFn: () => api.getIntegrationActivity(filters),
    refetchInterval: 15000,
  });

  const STATUS_COLORS: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-500/10",
    error: "text-red-400 bg-red-500/10",
    warning: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integration Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Live feed of integration events and syncs</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-3">
        <select
          className="px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {data?.events?.map((e) => (
            <div key={e.id} className="flex items-start gap-4 px-5 py-3.5">
              <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{e.connector}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{e.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-1 ${STATUS_COLORS[e.status] || "bg-muted text-muted-foreground"}`}>{e.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.message}</p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {e.responseTimeMs != null && <span className="mr-2">{e.responseTimeMs}ms</span>}
                {e.timestamp && new Date(e.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {!data?.events?.length && (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">No activity recorded yet</div>
          )}
        </div>
      )}
    </div>
  );
}

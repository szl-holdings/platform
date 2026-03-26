import { useQuery } from "@tanstack/react-query";
import { api, type IntegrationActivity } from "@/lib/api";
import { useState } from "react";
import { Activity, CheckCircle2, XCircle, AlertTriangle, Zap, RefreshCw, Webhook, Radio, Search, Filter, Clock } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  connection_test: { icon: Zap, label: "Test", color: "text-blue-400 bg-blue-500/10" },
  sync: { icon: RefreshCw, label: "Sync", color: "text-purple-400 bg-purple-500/10" },
  webhook: { icon: Webhook, label: "Webhook", color: "text-cyan-400 bg-cyan-500/10" },
  api_call: { icon: Radio, label: "API Call", color: "text-indigo-400 bg-indigo-500/10" },
  error: { icon: XCircle, label: "Error", color: "text-red-400 bg-red-500/10" },
  health_check: { icon: Activity, label: "Health Check", color: "text-emerald-400 bg-emerald-500/10" },
};

const STATUS_STYLES: Record<string, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function IntegrationActivityPage() {
  const [connectorFilter, setConnectorFilter] = useState("");
  const [appFilter, setAppFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["integration-activity", connectorFilter, appFilter, typeFilter, statusFilter],
    queryFn: () => api.getIntegrationActivity({
      connector: connectorFilter || undefined,
      app: appFilter || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    }),
    refetchInterval: 15000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const connectors = Array.from(new Set(data.events.map((e) => e.connector))).sort();
  const apps = Array.from(new Set(data.events.map((e) => e.app).filter(Boolean) as string[])).sort();
  const errorCount = data.events.filter((e) => e.status === "error").length;
  const successCount = data.events.filter((e) => e.status === "success").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integration Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Recent connector events, API calls, and sync operations</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md text-emerald-400 bg-emerald-500/10">{successCount} success</span>
          {errorCount > 0 && <span className="text-xs px-2.5 py-1 rounded-md text-red-400 bg-red-500/10">{errorCount} errors</span>}
          <span className="text-xs px-2.5 py-1 rounded-md text-muted-foreground bg-muted/40">{data.total} total</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={connectorFilter}
          onChange={(e) => setConnectorFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-md border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Connectors</option>
          {connectors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-md border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Apps</option>
          {apps.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-md border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="connection_test">Connection Test</option>
          <option value="sync">Sync</option>
          <option value="webhook">Webhook</option>
          <option value="api_call">API Call</option>
          <option value="error">Error</option>
          <option value="health_check">Health Check</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-md border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      <div className="space-y-2">
        {data.events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No activity matching filters</p>
          </div>
        ) : (
          data.events.map((event) => <ActivityRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}

function ActivityRow({ event }: { event: IntegrationActivity }) {
  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG["error"];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.connector}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>{config.label}</span>
          {event.app && (
            <span className="text-xs text-muted-foreground">via {event.app}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.message}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {event.responseTimeMs !== null && (
          <span className="text-xs font-mono text-muted-foreground">{event.responseTimeMs}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          {event.status === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : event.status === "error" ? (
            <XCircle className="w-4 h-4 text-red-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground w-20 justify-end">
          <Clock className="w-3 h-3" />
          {formatTime(event.timestamp)}
        </div>
      </div>
    </div>
  );
}

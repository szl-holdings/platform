import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, Filter, Webhook } from "lucide-react";
import { apiFetch } from "../../lib/admin-api";

interface WebhookEndpoint {
  id: string;
  url: string;
  eventTypes: string[] | "*";
  active: boolean;
  description?: string;
  failureCount: number;
  lastDeliveredAt?: number;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  status: "pending" | "delivered" | "failed";
  statusCode?: number;
  attempt: number;
  deliveredAt?: number;
  error?: string;
}

const DECISION_EVENTS = [
  "decision.created",
  "decision.approved",
  "decision.executed",
  "decision.proved",
  "decision.outcome_recorded",
];

const EVENT_COLORS: Record<string, string> = {
  "decision.created": "text-blue-400 bg-blue-400/10",
  "decision.approved": "text-green-400 bg-green-400/10",
  "decision.executed": "text-purple-400 bg-purple-400/10",
  "decision.proved": "text-amber-400 bg-amber-400/10",
  "decision.outcome_recorded": "text-teal-400 bg-teal-400/10",
};

const STATUS_ICONS = {
  delivered: CheckCircle2,
  failed: XCircle,
  pending: Clock,
};

const STATUS_COLORS = {
  delivered: "text-green-400",
  failed: "text-red-400",
  pending: "text-amber-400",
};

function relativeTime(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleString();
}

export default function DecisionEventLog() {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [deliveryData, endpointData] = await Promise.all([
        apiFetch<{ data: WebhookDelivery[] }>("/webhooks/deliveries?eventType=decision.*&limit=100"),
        apiFetch<{ data: WebhookEndpoint[] }>("/webhooks/endpoints"),
      ]);
      setDeliveries(deliveryData.data ?? []);
      setEndpoints(endpointData.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event log");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const endpointMap = Object.fromEntries(endpoints.map((e) => [e.id, e]));

  const filtered = deliveries.filter((d) => {
    if (filterEvent !== "all" && d.eventType !== filterEvent) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: deliveries.length,
    delivered: deliveries.filter((d) => d.status === "delivered").length,
    failed: deliveries.filter((d) => d.status === "failed").length,
    pending: deliveries.filter((d) => d.status === "pending").length,
  };

  const eventCounts = DECISION_EVENTS.reduce<Record<string, number>>((acc, ev) => {
    acc[ev] = deliveries.filter((d) => d.eventType === ev).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Decision Webhook Event Log
          </h1>
          <p className="text-text-secondary text-sm">
            Real-time log of decision lifecycle events delivered to registered webhook endpoints.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, color: "text-text-primary" },
          { label: "Delivered", value: stats.delivered, color: "text-green-400" },
          { label: "Failed", value: stats.failed, color: "text-red-400" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {DECISION_EVENTS.map((ev) => (
          <div key={ev} className="bg-surface border border-border rounded-lg p-3 text-center">
            <p className={`text-xs font-mono px-2 py-0.5 rounded inline-block mb-1 ${EVENT_COLORS[ev] ?? "text-text-muted"}`}>
              {ev.split(".")[1]}
            </p>
            <p className="text-xl font-bold">{eventCounts[ev] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-2 py-1 bg-surface-elevated border border-border rounded text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All Events</option>
            {DECISION_EVENTS.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 bg-surface-elevated border border-border rounded text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <span className="text-xs text-text-muted ml-auto">{filtered.length} events</span>
        </div>

        {loading && deliveries.length === 0 ? (
          <div className="text-center py-12 text-text-muted">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Webhook className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No decision webhook events yet.</p>
            <p className="text-text-muted text-xs mt-1">
              Events appear here when decisions are created, approved, or executed via the API.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((delivery) => {
              const StatusIcon = STATUS_ICONS[delivery.status] ?? Clock;
              const endpoint = endpointMap[delivery.endpointId];
              return (
                <div key={delivery.id} className="py-3 flex items-center gap-3 text-sm">
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 ${STATUS_COLORS[delivery.status] ?? "text-text-muted"}`} />
                  <span className={`px-2 py-0.5 rounded text-xs font-mono flex-shrink-0 ${EVENT_COLORS[delivery.eventType] ?? "text-text-muted bg-surface-elevated"}`}>
                    {delivery.eventType}
                  </span>
                  <span className="text-text-muted truncate flex-1 font-mono text-xs">
                    {endpoint ? endpoint.url : delivery.endpointId}
                  </span>
                  {delivery.statusCode && (
                    <span className="text-text-muted text-xs flex-shrink-0">HTTP {delivery.statusCode}</span>
                  )}
                  <span className="text-xs text-text-muted flex-shrink-0 min-w-[70px] text-right">
                    {relativeTime(delivery.deliveredAt)}
                  </span>
                  {delivery.attempt > 1 && (
                    <span className="text-xs text-amber-400 flex-shrink-0">retry #{delivery.attempt}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {endpoints.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 flex items-start gap-4">
          <Webhook className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">No webhook endpoints registered</h3>
            <p className="text-sm text-text-secondary mb-3">
              Register an endpoint to start receiving decision lifecycle events. Subscribe to{" "}
              <code className="text-accent font-mono text-xs">decision.*</code> to capture all lifecycle stages.
            </p>
            <pre className="text-xs bg-surface-elevated rounded-lg p-3 overflow-auto text-text-secondary">{`POST /api/webhooks
{
  "url": "https://your-app.com/webhooks/szl",
  "eventTypes": [
    "decision.created",
    "decision.approved",
    "decision.executed",
    "decision.proved",
    "decision.outcome_recorded"
  ],
  "description": "Decision lifecycle integration"
}`}</pre>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3">Decision Lifecycle Event Reference</h3>
        <div className="space-y-3">
          {[
            { event: "decision.created", desc: "Fired when signals are evaluated and recommendations are generated.", endpoint: "POST /api/decisioning/evaluate" },
            { event: "decision.approved", desc: "Fired when a decision is approved, either by policy or an explicit approver.", endpoint: "POST /api/decisioning/execute" },
            { event: "decision.executed", desc: "Fired when a workflow run is recorded after execution.", endpoint: "POST /api/decisioning/execute" },
            { event: "decision.proved", desc: "Fired when cryptographic or human proof is recorded for a run.", endpoint: "POST /api/decisioning/runs/:runId/prove" },
            { event: "decision.outcome_recorded", desc: "Fired when the outcome of a decision run is logged.", endpoint: "POST /api/decisioning/runs/:runId/outcome" },
          ].map((item) => (
            <div key={item.event} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <span className={`px-2 py-0.5 rounded text-xs font-mono flex-shrink-0 mt-0.5 ${EVENT_COLORS[item.event] ?? ""}`}>
                {item.event}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary">{item.desc}</p>
                <p className="text-xs text-text-muted font-mono mt-0.5">{item.endpoint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

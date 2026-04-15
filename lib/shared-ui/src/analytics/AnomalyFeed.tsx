import type { AnomalyRecord } from "@szl-holdings/observability/analytics";

export interface AnomalyFeedProps {
  anomalies: AnomalyRecord[];
  loading?: boolean;
  maxItems?: number;
  onResolve?: (anomalyId: string) => void;
  onSuppress?: (anomalyId: string) => void;
  label?: string;
}

const SEVERITY_CONFIG = {
  critical: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400", dot: "bg-red-500" },
  high: { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400", dot: "bg-orange-500" },
  medium: { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400", dot: "bg-yellow-500" },
  low: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
};

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  spike: "Spike Detected",
  drop: "Drop Detected",
  trend_change: "Trend Change",
  seasonal_deviation: "Seasonal Deviation",
  missing: "Missing Data",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AnomalyFeed({
  anomalies,
  loading = false,
  maxItems = 10,
  onResolve,
  onSuppress,
  label,
}: AnomalyFeedProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 animate-pulse">
        <div className="h-3 w-32 rounded bg-white/10" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-lg bg-white/10" />
        ))}
      </div>
    );
  }

  const visible = anomalies.slice(0, maxItems);
  const active = visible.filter(a => !a.isResolved);
  const resolved = visible.filter(a => a.isResolved);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2 text-xs">
            {active.length > 0 && (
              <span className="text-red-400 font-medium">{active.length} active</span>
            )}
            {resolved.length > 0 && (
              <span className="text-zinc-500">{resolved.length} resolved</span>
            )}
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <div className="text-center py-6">
          <p className="text-zinc-500 text-sm">No anomalies detected</p>
          <p className="text-zinc-600 text-xs mt-1">All metrics within expected ranges</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visible.map(anomaly => {
          const config = SEVERITY_CONFIG[anomaly.severity];
          const typeLabel = ANOMALY_TYPE_LABELS[anomaly.anomalyType] ?? anomaly.anomalyType;
          const deviationSign = anomaly.anomalyType === "spike" ? "+" : anomaly.anomalyType === "drop" ? "−" : "~";

          return (
            <div
              key={anomaly.anomalyId}
              className={`rounded-lg border p-3 flex flex-col gap-1.5 ${config.bg} ${config.border} ${anomaly.isResolved ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
                  <span className={`text-xs font-semibold ${config.text}`}>{typeLabel}</span>
                  <span className="text-xs text-zinc-500 truncate">{anomaly.metricId}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-zinc-500">{timeAgo(anomaly.detectedAt)}</span>
                  {anomaly.isResolved && (
                    <span className="text-xs text-emerald-400 ml-1">✓ Resolved</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400">
                  Observed: <span className="text-white font-medium">{anomaly.observedValue.toFixed(2)}</span>
                </span>
                <span className="text-zinc-400">
                  Expected: <span className="text-zinc-300">{anomaly.expectedValue.toFixed(2)}</span>
                </span>
                <span className={config.text}>
                  {deviationSign}{anomaly.deviationPercent.toFixed(1)}%
                </span>
              </div>

              {anomaly.potentialCauses && anomaly.potentialCauses.length > 0 && (
                <p className="text-xs text-zinc-500 line-clamp-1">
                  Possible: {anomaly.potentialCauses[0]}
                </p>
              )}

              {!anomaly.isResolved && (onResolve || onSuppress) && (
                <div className="flex items-center gap-2 pt-1">
                  {onResolve && (
                    <button
                      onClick={() => onResolve(anomaly.anomalyId)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Mark resolved
                    </button>
                  )}
                  {onSuppress && (
                    <button
                      onClick={() => onSuppress(anomaly.anomalyId)}
                      className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                    >
                      Suppress
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

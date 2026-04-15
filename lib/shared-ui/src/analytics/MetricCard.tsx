import { useMemo } from "react";
import type { MetricQueryResult } from "@szl-holdings/observability/analytics";

export interface MetricCardProps {
  result: MetricQueryResult;
  label: string;
  unit?: string;
  description?: string;
  thresholdWarning?: number;
  thresholdCritical?: number;
  thresholdDirection?: "above" | "below";
  loading?: boolean;
  compact?: boolean;
}

function formatValue(value: number, unit?: string): string {
  if (unit === "%" || unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "ms") return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value.toFixed(0)}ms`;
  if (unit === "hours") return value >= 24 ? `${(value / 24).toFixed(1)}d` : `${value.toFixed(1)}h`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function getTrendIcon(trend?: "up" | "down" | "stable"): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function getStatusColor(
  value: number,
  thresholdWarning?: number,
  thresholdCritical?: number,
  thresholdDirection?: "above" | "below"
): string {
  if (!thresholdDirection) return "text-white";

  const isAbove = thresholdDirection === "above";
  if (thresholdCritical !== undefined) {
    const exceeded = isAbove ? value >= thresholdCritical : value <= thresholdCritical;
    if (exceeded) return "text-red-400";
  }
  if (thresholdWarning !== undefined) {
    const exceeded = isAbove ? value >= thresholdWarning : value <= thresholdWarning;
    if (exceeded) return "text-yellow-400";
  }
  return "text-emerald-400";
}

export function MetricCard({
  result,
  label,
  unit,
  description,
  thresholdWarning,
  thresholdCritical,
  thresholdDirection,
  loading = false,
  compact = false,
}: MetricCardProps) {
  const statusColor = useMemo(
    () => getStatusColor(result.currentValue, thresholdWarning, thresholdCritical, thresholdDirection),
    [result.currentValue, thresholdWarning, thresholdCritical, thresholdDirection]
  );

  const changeColor = useMemo(() => {
    if (!result.changePercent) return "text-zinc-400";
    const isPositive = result.changePercent > 0;
    const goodDirection = thresholdDirection !== "above";
    const isGood = isPositive === goodDirection;
    return isGood ? "text-emerald-400" : "text-red-400";
  }, [result.changePercent, thresholdDirection]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="h-3 w-24 rounded bg-white/10 mb-3" />
        <div className="h-8 w-32 rounded bg-white/10 mb-2" />
        <div className="h-3 w-16 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          {!compact && description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>
        {result.trend && (
          <span className={`text-xs font-medium ${changeColor}`}>
            {getTrendIcon(result.trend)}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold tabular-nums ${statusColor}`}>
          {formatValue(result.currentValue, unit)}
        </span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>

      {result.changePercent !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
          <span>{result.changePercent >= 0 ? "+" : ""}{result.changePercent.toFixed(1)}%</span>
          <span className="text-zinc-500">vs prev period</span>
        </div>
      )}

      {!compact && thresholdCritical !== undefined && (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <span>Critical: {thresholdCritical}{unit}</span>
          {thresholdWarning !== undefined && <span>· Warn: {thresholdWarning}{unit}</span>}
        </div>
      )}
    </div>
  );
}

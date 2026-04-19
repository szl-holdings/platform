import { useState, useCallback, useEffect } from "react";
import type { MetricQueryResult, FunnelAnalysisResult, CohortAnalysisResult, AnomalyRecord } from "@szl-holdings/observability/analytics";
import { MetricCard } from "./MetricCard";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { FunnelChart } from "./FunnelChart";
import { CohortMatrix } from "./CohortMatrix";
import { AnomalyFeed } from "./AnomalyFeed";

// ---------------------------------------------------------------------------
// Time range picker
// ---------------------------------------------------------------------------

const TIME_RANGES = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

function TimeRangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
      {TIME_RANGES.map(range => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${
            value === range.value
              ? "bg-white/15 text-white font-medium"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard widget types
// ---------------------------------------------------------------------------

export type DashboardWidgetType = "metric_card" | "time_series" | "funnel" | "cohort" | "anomaly_feed";

export interface DashboardWidgetConfig {
  id: string;
  type: DashboardWidgetType;
  title?: string;
  metricId?: string;
  funnelId?: string;
  cohortId?: string;
  unit?: string;
  color?: string;
  thresholdWarning?: number;
  thresholdCritical?: number;
  thresholdDirection?: "above" | "below";
  width?: "full" | "half" | "third";
}

export interface MetricsDashboardProps {
  title: string;
  domain: string;
  widgets: DashboardWidgetConfig[];
  metrics?: Record<string, MetricQueryResult>;
  funnels?: Record<string, FunnelAnalysisResult>;
  cohorts?: Record<string, CohortAnalysisResult>;
  anomalies?: AnomalyRecord[];
  loading?: boolean;
  defaultTimeRange?: string;
  onTimeRangeChange?: (timeRange: string) => void;
  onResolveAnomaly?: (anomalyId: string) => void;
  refreshInterval?: number;
  onRefresh?: (timeRange: string) => void;
  children?: React.ReactNode;
}

export function MetricsDashboard({
  title,
  domain,
  widgets,
  metrics = {},
  funnels = {},
  cohorts = {},
  anomalies = [],
  loading = false,
  defaultTimeRange = "7d",
  onTimeRangeChange,
  onResolveAnomaly,
  refreshInterval,
  onRefresh,
  children,
}: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
    onRefresh?.(range);
  }, [onTimeRangeChange, onRefresh]);

  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      onRefresh(timeRange);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh, timeRange]);

  function getWidthClass(width?: "full" | "half" | "third"): string {
    switch (width) {
      case "full": return "col-span-full";
      case "half": return "col-span-full md:col-span-2";
      case "third": return "col-span-1";
      default: return "col-span-1";
    }
  }

  function renderWidget(widget: DashboardWidgetConfig) {
    const isLoading = loading;

    switch (widget.type) {
      case "metric_card": {
        if (!widget.metricId) return null;
        const result = metrics[widget.metricId];
        if (!result && !isLoading) return null;
        if (!result) {
          return (
            <MetricCard
              result={{ metricId: widget.metricId ?? "", domain, granularity: "day", periodStart: new Date(), periodEnd: new Date(), dataPoints: [], currentValue: 0, trend: "stable" }}
              label={widget.title ?? widget.metricId ?? ""}
              {...(widget.unit !== undefined ? { unit: widget.unit } : {})}
              loading={true}
            />
          );
        }
        return (
          <MetricCard
            result={result}
            label={widget.title ?? result.metricId}
            {...(widget.unit !== undefined ? { unit: widget.unit } : {})}
            {...(widget.thresholdWarning !== undefined ? { thresholdWarning: widget.thresholdWarning } : {})}
            {...(widget.thresholdCritical !== undefined ? { thresholdCritical: widget.thresholdCritical } : {})}
            {...(widget.thresholdDirection !== undefined ? { thresholdDirection: widget.thresholdDirection } : {})}
            loading={isLoading}
          />
        );
      }

      case "time_series": {
        if (!widget.metricId) return null;
        const result = metrics[widget.metricId];
        if (!result && !isLoading) return null;
        if (!result) {
          return (
            <TimeSeriesChart
              result={{ metricId: widget.metricId ?? "", domain, granularity: "day", periodStart: new Date(), periodEnd: new Date(), dataPoints: [], currentValue: 0, trend: "stable" }}
              label={widget.title ?? widget.metricId}
              loading={true}
            />
          );
        }
        return (
          <TimeSeriesChart
            result={result}
            label={widget.title ?? result.metricId}
            {...(widget.unit !== undefined ? { unit: widget.unit } : {})}
            {...(widget.color !== undefined ? { color: widget.color } : {})}
            {...(widget.thresholdWarning !== undefined ? { thresholdWarning: widget.thresholdWarning } : {})}
            {...(widget.thresholdCritical !== undefined ? { thresholdCritical: widget.thresholdCritical } : {})}
            loading={isLoading}
          />
        );
      }

      case "funnel": {
        if (!widget.funnelId) return null;
        const result = funnels[widget.funnelId];
        return (
          <FunnelChart
            result={result ?? { funnelId: widget.funnelId, domain, periodStart: new Date(), periodEnd: new Date(), totalEntries: 0, totalCompletions: 0, overallConversionRate: 0, steps: [] }}
            {...(widget.title !== undefined ? { label: widget.title } : {})}
            loading={isLoading || !result}
          />
        );
      }

      case "cohort": {
        if (!widget.cohortId) return null;
        const result = cohorts[widget.cohortId];
        return (
          <CohortMatrix
            result={result ?? { cohortId: widget.cohortId, domain, analysisType: "retention", cohorts: [], overallRetentionRate: 0 }}
            {...(widget.title !== undefined ? { label: widget.title } : {})}
            loading={isLoading || !result}
          />
        );
      }

      case "anomaly_feed": {
        return (
          <AnomalyFeed
            anomalies={anomalies}
            label={widget.title ?? "Anomaly Feed"}
            loading={isLoading}
            {...(onResolveAnomaly !== undefined ? { onResolve: onResolveAnomaly } : {})}
          />
        );
      }

      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Domain: {domain} · Refreshed {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangePicker value={timeRange} onChange={handleTimeRangeChange} />
          {onRefresh && (
            <button
              onClick={() => { setLastRefreshed(new Date()); onRefresh(timeRange); }}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-md hover:bg-white/5"
            >
              ↺ Refresh
            </button>
          )}
        </div>
      </div>

      {children}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgets.map(widget => (
          <div key={widget.id} className={getWidthClass(widget.width)}>
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composable metric summary row (for quick KPI overviews)
// ---------------------------------------------------------------------------

export interface MetricSummaryRowProps {
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    unit?: string;
    change?: number;
    trend?: "up" | "down" | "stable";
  }>;
  loading?: boolean;
}

export function MetricSummaryRow({ metrics, loading = false }: MetricSummaryRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map(metric => (
        <div key={metric.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{metric.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white tabular-nums">
              {metric.value >= 1_000_000
                ? `${(metric.value / 1_000_000).toFixed(1)}M`
                : metric.value >= 1_000
                ? `${(metric.value / 1_000).toFixed(1)}K`
                : metric.unit === "%" ? `${metric.value.toFixed(1)}%` : String(metric.value)}
            </span>
            {metric.unit && metric.unit !== "%" && <span className="text-xs text-zinc-500">{metric.unit}</span>}
          </div>
          {metric.change !== undefined && (
            <span className={`text-xs ${metric.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {metric.change >= 0 ? "+" : ""}{metric.change.toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

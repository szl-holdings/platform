import { useMemo } from "react";
import type { MetricQueryResult, MetricDataPoint } from "@szl-holdings/observability/analytics";

export interface TimeSeriesChartProps {
  result: MetricQueryResult;
  label?: string;
  unit?: string;
  height?: number;
  showGrid?: boolean;
  thresholdWarning?: number;
  thresholdCritical?: number;
  loading?: boolean;
  color?: string;
  compareResult?: MetricQueryResult;
}

const DEFAULT_COLOR = "#60a5fa";
const COMPARE_COLOR = "#a78bfa";

function formatAxisLabel(date: Date, granularity: string): string {
  const opts: Intl.DateTimeFormatOptions = (() => {
    switch (granularity) {
      case "minute": return { hour: "2-digit", minute: "2-digit" };
      case "hour": return { month: "short", day: "numeric", hour: "2-digit" };
      case "day": return { month: "short", day: "numeric" };
      case "week": return { month: "short", day: "numeric" };
      case "month": return { year: "numeric", month: "short" };
      default: return { month: "short", day: "numeric" };
    }
  })();
  return date.toLocaleDateString(undefined, opts);
}

function buildSVGPath(points: Array<{ x: number; y: number }>, smooth = true): string {
  if (points.length < 2) return "";
  if (!smooth) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }

  const path: string[] = [`M${points[0]!.x},${points[0]!.y}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    path.push(`C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`);
  }
  return path.join(" ");
}

function computeChartPoints(
  dataPoints: MetricDataPoint[],
  width: number,
  height: number,
  minVal: number,
  maxVal: number
): Array<{ x: number; y: number }> {
  if (dataPoints.length === 0) return [];
  const padding = 8;
  const range = maxVal - minVal || 1;

  return dataPoints.map((dp, i) => ({
    x: padding + (i / (dataPoints.length - 1 || 1)) * (width - padding * 2),
    y: padding + (1 - (dp.value - minVal) / range) * (height - padding * 2),
  }));
}

export function TimeSeriesChart({
  result,
  label,
  unit,
  height = 160,
  showGrid = true,
  thresholdWarning,
  thresholdCritical,
  loading = false,
  color = DEFAULT_COLOR,
  compareResult,
}: TimeSeriesChartProps) {
  const width = 400;
  const padTop = 20;

  const allValues = useMemo(() => {
    const primary = result.dataPoints.map(d => d.value);
    const compare = compareResult?.dataPoints.map(d => d.value) ?? [];
    const thresholds = [thresholdWarning, thresholdCritical].filter(Boolean) as number[];
    return [...primary, ...compare, ...thresholds];
  }, [result, compareResult, thresholdWarning, thresholdCritical]);

  const minVal = useMemo(() => Math.max(0, Math.min(...allValues) * 0.9), [allValues]);
  const maxVal = useMemo(() => Math.max(...allValues) * 1.1 || 1, [allValues]);

  const primaryPoints = useMemo(
    () => computeChartPoints(result.dataPoints, width, height, minVal, maxVal),
    [result.dataPoints, height, minVal, maxVal]
  );

  const comparePoints = useMemo(
    () => compareResult ? computeChartPoints(compareResult.dataPoints, width, height, minVal, maxVal) : [],
    [compareResult, height, minVal, maxVal]
  );

  const primaryPath = useMemo(() => buildSVGPath(primaryPoints), [primaryPoints]);
  const comparePath = useMemo(() => buildSVGPath(comparePoints), [comparePoints]);

  const areaPath = useMemo(() => {
    if (primaryPoints.length === 0) return "";
    const last = primaryPoints[primaryPoints.length - 1]!;
    const first = primaryPoints[0]!;
    return `${primaryPath} L${last.x},${height} L${first.x},${height} Z`;
  }, [primaryPath, primaryPoints, height]);

  const thresholdY = (threshold: number) => {
    const range = maxVal - minVal || 1;
    return padTop + (1 - (threshold - minVal) / range) * (height - padTop * 2);
  };

  const xLabels = useMemo(() => {
    const points = result.dataPoints;
    if (points.length === 0) return [];
    const step = Math.max(1, Math.floor(points.length / 6));
    return points
      .filter((_, i) => i % step === 0)
      .map((dp, idx) => ({
        label: formatAxisLabel(dp.timestamp, result.granularity),
        x: 8 + (idx * step / (points.length - 1 || 1)) * (width - 16),
      }));
  }, [result.dataPoints, result.granularity]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse" style={{ height: height + 60 }}>
        <div className="h-3 w-24 rounded bg-white/10 mb-3" />
        <div className="h-full rounded bg-white/5" />
      </div>
    );
  }

  const gradientId = `ts-gradient-${result.metricId.replace(/\./g, "-")}`;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          {unit && <span className="text-xs text-zinc-500">{unit}</span>}
        </div>
      )}

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showGrid && [0.25, 0.5, 0.75].map(fraction => {
          const y = padTop + fraction * (height - padTop * 2);
          return (
            <line
              key={fraction}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          );
        })}

        {thresholdWarning !== undefined && (
          <line
            x1={0} y1={thresholdY(thresholdWarning)}
            x2={width} y2={thresholdY(thresholdWarning)}
            stroke="#eab308" strokeWidth={1} strokeDasharray="4 4"
          />
        )}
        {thresholdCritical !== undefined && (
          <line
            x1={0} y1={thresholdY(thresholdCritical)}
            x2={width} y2={thresholdY(thresholdCritical)}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4"
          />
        )}

        {areaPath && (
          <path d={areaPath} fill={`url(#${gradientId})`} />
        )}

        {comparePath && (
          <path d={comparePath} fill="none" stroke={COMPARE_COLOR} strokeWidth={1.5} strokeDasharray="4 2" opacity={0.6} />
        )}

        {primaryPath && (
          <path d={primaryPath} fill="none" stroke={color} strokeWidth={2} />
        )}

        {primaryPoints.length > 0 && (
          <circle cx={primaryPoints[primaryPoints.length - 1]!.x} cy={primaryPoints[primaryPoints.length - 1]!.y} r={3} fill={color} />
        )}
      </svg>

      <div className="flex justify-between">
        {xLabels.map((l, i) => (
          <span key={i} className="text-xs text-zinc-600" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {l.label}
          </span>
        ))}
      </div>

      {compareResult && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4" style={{ backgroundColor: color }} />
            <span className="text-zinc-400">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: COMPARE_COLOR }} />
            <span className="text-zinc-400">Previous period</span>
          </div>
        </div>
      )}
    </div>
  );
}

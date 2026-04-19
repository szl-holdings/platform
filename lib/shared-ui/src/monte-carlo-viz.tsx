import React, { useMemo } from "react";

export interface HistogramBucket {
  lo: number;
  hi: number;
  mid: number;
  count: number;
  frequency: number;
}

export interface CDFPoint {
  value: number;
  cumProb: number;
}

export interface DistributionStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  confidenceInterval95: { lower: number; upper: number };
}

export interface TornadoEntry {
  inputId: string;
  inputLabel: string;
  lowValue: number;
  highValue: number;
  swing: number;
  impactPct: number;
  rank: number;
  direction: "positive" | "negative" | "mixed";
}

export interface ScenarioComparisonItem {
  scenarioId: string;
  scenarioTitle: string;
  stats: DistributionStats;
  histogram: HistogramBucket[];
}

function fmt(value: number, format?: string): string {
  if (!isFinite(value)) return "—";
  if (format === "currency") return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (format === "percentage") return `${value.toFixed(1)}%`;
  if (format === "years") return `${value.toFixed(1)}y`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const COLORS = {
  primary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  neutral: "#6b7280",
  positive: "#10b981",
  negative: "#ef4444",
  mixed: "#f59e0b",
  ci: "rgba(99,102,241,0.15)",
  gridLine: "rgba(255,255,255,0.08)",
  text: "#e5e7eb",
  subtext: "#9ca3af",
};

const SCENARIO_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface ProbabilityDensityPlotProps {
  histogram: HistogramBucket[];
  stats: DistributionStats;
  title?: string;
  format?: string;
  width?: number;
  height?: number;
  showCI?: boolean;
}

export function ProbabilityDensityPlot({
  histogram,
  stats,
  title,
  format,
  width = 480,
  height = 220,
  showCI = true,
}: ProbabilityDensityPlotProps) {
  const pad = useMemo(() => ({ top: 16, right: 16, bottom: 40, left: 48 }), []);
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxFreq = Math.max(...histogram.map((b) => b.frequency), 0.001);
  const minVal = stats.min;
  const maxVal = stats.max;
  const valRange = maxVal - minVal || 1;

  const xScale = (v: number) => ((v - minVal) / valRange) * plotW;
  const yScale = (f: number) => plotH - (f / maxFreq) * plotH;

  const barWidth = histogram.length > 0 ? plotW / histogram.length - 0.5 : 10;

  const ci = stats.confidenceInterval95;
  const ciX1 = xScale(Math.max(ci.lower, minVal));
  const ciX2 = xScale(Math.min(ci.upper, maxVal));
  const meanX = xScale(stats.mean);
  const medianX = xScale(stats.median);

  const xTicks = [stats.p5, stats.p25, stats.p50, stats.p75, stats.p95];

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
      {title && <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      <svg width={width} height={height}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {showCI && (
            <rect x={ciX1} y={0} width={ciX2 - ciX1} height={plotH} fill={COLORS.ci} />
          )}
          {histogram.map((b, i) => (
            <rect
              key={i}
              x={xScale(b.lo)}
              y={yScale(b.frequency)}
              width={Math.max(barWidth, 1)}
              height={plotH - yScale(b.frequency)}
              fill={COLORS.primary}
              opacity={0.8}
            />
          ))}
          <line x1={meanX} y1={0} x2={meanX} y2={plotH} stroke={COLORS.warning} strokeWidth={1.5} strokeDasharray="4 2" />
          <line x1={medianX} y1={0} x2={medianX} y2={plotH} stroke={COLORS.success} strokeWidth={1.5} strokeDasharray="4 2" />
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={COLORS.gridLine} />
          {xTicks.map((v, i) => (
            <g key={i} transform={`translate(${xScale(v)},${plotH})`}>
              <line y2={4} stroke={COLORS.subtext} />
              <text y={16} textAnchor="middle" fontSize={9} fill={COLORS.subtext}>
                {fmt(v, format)}
              </text>
            </g>
          ))}
          <text x={-8} y={0} textAnchor="end" fontSize={9} fill={COLORS.subtext}>High</text>
          <text x={-8} y={plotH} textAnchor="end" fontSize={9} fill={COLORS.subtext}>Low</text>
        </g>
        <g transform={`translate(${pad.left + plotW - 120}, ${pad.top + 4})`}>
          <rect width={8} height={2} y={4} fill={COLORS.warning} />
          <text x={12} y={8} fontSize={9} fill={COLORS.subtext}>Mean: {fmt(stats.mean, format)}</text>
          <rect width={8} height={2} y={18} fill={COLORS.success} />
          <text x={12} y={22} fontSize={9} fill={COLORS.subtext}>Median: {fmt(stats.median, format)}</text>
        </g>
      </svg>
    </div>
  );
}

interface CumulativeDistributionCurveProps {
  cdf: CDFPoint[];
  stats: DistributionStats;
  title?: string;
  format?: string;
  width?: number;
  height?: number;
}

export function CumulativeDistributionCurve({
  cdf,
  stats,
  title,
  format,
  width = 480,
  height = 200,
}: CumulativeDistributionCurveProps) {
  const pad = { top: 16, right: 16, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (!cdf || cdf.length === 0) return null;

  const minVal = cdf[0]!.value;
  const maxVal = cdf[cdf.length - 1]!.value;
  const valRange = maxVal - minVal || 1;

  const xScale = (v: number) => ((v - minVal) / valRange) * plotW;
  const yScale = (p: number) => plotH - p * plotH;

  const pathD = cdf.map((pt, i) => `${i === 0 ? "M" : "L"}${xScale(pt.value).toFixed(1)},${yScale(pt.cumProb).toFixed(1)}`).join(" ");

  const pLines = [{ p: 0.1, label: "P10" }, { p: 0.5, label: "P50" }, { p: 0.9, label: "P90" }];

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
      {title && <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      <svg width={width} height={height}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line key={p} x1={0} y1={yScale(p)} x2={plotW} y2={yScale(p)} stroke={COLORS.gridLine} />
          ))}
          {pLines.map(({ p, label }) => {
            const yPos = yScale(p);
            const closest = [...cdf].sort((a, b) => Math.abs(a.cumProb - p) - Math.abs(b.cumProb - p))[0];
            if (!closest) return null;
            const xPos = xScale(closest.value);
            return (
              <g key={label}>
                <line x1={xPos} y1={0} x2={xPos} y2={plotH} stroke={COLORS.gridLine} strokeDasharray="3 3" />
                <line x1={0} y1={yPos} x2={xPos} y2={yPos} stroke={COLORS.gridLine} strokeDasharray="3 3" />
                <circle cx={xPos} cy={yPos} r={3} fill={COLORS.primary} />
                <text x={xPos + 4} y={yPos - 4} fontSize={9} fill={COLORS.subtext}>{label}: {fmt(closest.value, format)}</text>
              </g>
            );
          })}
          <path d={pathD} fill="none" stroke={COLORS.primary} strokeWidth={2} />
          <line x1={0} y1={0} x2={0} y2={plotH} stroke={COLORS.gridLine} />
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={COLORS.gridLine} />
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <text key={p} x={-4} y={yScale(p) + 4} textAnchor="end" fontSize={9} fill={COLORS.subtext}>{(p * 100).toFixed(0)}%</text>
          ))}
        </g>
      </svg>
    </div>
  );
}

interface TornadoDiagramProps {
  tornado: TornadoEntry[];
  baselineMean: number;
  outputLabel: string;
  format?: string;
  maxEntries?: number;
  width?: number;
  height?: number;
}

export function TornadoDiagram({
  tornado,
  baselineMean,
  outputLabel,
  format,
  maxEntries = 8,
  width = 560,
  height,
}: TornadoDiagramProps) {
  const entries = tornado.slice(0, maxEntries);
  const rowH = 32;
  const labelW = 160;
  const barAreaW = width - labelW - 80;
  const totalH = height ?? entries.length * rowH + 60;

  if (entries.length === 0) return null;

  const maxSwing = Math.max(...entries.map((e) => Math.abs(e.highValue - baselineMean)), Math.abs(entries[0]!.lowValue - baselineMean), 0.001);
  const centerX = labelW + barAreaW / 2;

  const xScale = (v: number) => {
    const delta = v - baselineMean;
    return centerX + (delta / maxSwing) * (barAreaW / 2);
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
      <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        Sensitivity — Impact on {outputLabel}
      </div>
      <svg width={width} height={totalH}>
        <line x1={centerX} y1={0} x2={centerX} y2={totalH - 24} stroke={COLORS.gridLine} strokeWidth={1} />
        {entries.map((e, i) => {
          const y = i * rowH + 8;
          const color = e.direction === "positive" ? COLORS.positive : e.direction === "negative" ? COLORS.negative : COLORS.mixed;
          const x1 = Math.min(xScale(e.lowValue), centerX);
          const x2 = Math.max(xScale(e.highValue), centerX);
          const barW = Math.max(x2 - x1, 2);

          return (
            <g key={e.inputId}>
              <text x={labelW - 6} y={y + 12} textAnchor="end" fontSize={11} fill={COLORS.text} fontWeight={i === 0 ? 600 : 400}>
                {e.inputLabel.length > 22 ? e.inputLabel.slice(0, 22) + "…" : e.inputLabel}
              </text>
              <rect x={x1} y={y + 2} width={barW} height={rowH - 8} fill={color} opacity={0.75} rx={2} />
              <text x={x2 + 4} y={y + 13} fontSize={9} fill={COLORS.subtext}>
                {e.impactPct.toFixed(0)}%
              </text>
            </g>
          );
        })}
        <text x={centerX} y={totalH - 8} textAnchor="middle" fontSize={10} fill={COLORS.subtext}>
          Baseline: {fmt(baselineMean, format)}
        </text>
      </svg>
    </div>
  );
}

interface ScenarioComparisonMatrixProps {
  scenarios: ScenarioComparisonItem[];
  outputLabel: string;
  format?: string;
  width?: number;
}

export function ScenarioComparisonMatrix({
  scenarios,
  outputLabel,
  format,
  width = 560,
}: ScenarioComparisonMatrixProps) {
  const metrics = ["mean", "p10", "p50", "p90", "stdDev"] as const;
  const metricLabels: Record<string, string> = { mean: "Mean", p10: "P10", p50: "Median", p90: "P90", stdDev: "Std Dev" };

  const best = Math.max(...scenarios.map((s) => s.stats.mean));

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12, overflowX: "auto" }}>
      <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        Scenario Comparison — {outputLabel}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "4px 8px", color: COLORS.subtext, fontWeight: 500, borderBottom: `1px solid ${COLORS.gridLine}` }}>
              Scenario
            </th>
            {metrics.map((m) => (
              <th key={m} style={{ textAlign: "right", padding: "4px 8px", color: COLORS.subtext, fontWeight: 500, borderBottom: `1px solid ${COLORS.gridLine}` }}>
                {metricLabels[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, i) => {
            const isBest = s.stats.mean === best;
            return (
              <tr key={s.scenarioId} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td style={{ padding: "6px 8px", color: isBest ? COLORS.success : COLORS.text, fontWeight: isBest ? 600 : 400 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: SCENARIO_PALETTE[i % SCENARIO_PALETTE.length], marginRight: 6 }} />
                  {s.scenarioTitle}
                  {isBest && <span style={{ marginLeft: 6, fontSize: 9, background: COLORS.success, color: "#000", padding: "1px 4px", borderRadius: 3 }}>BEST</span>}
                </td>
                {metrics.map((m) => (
                  <td key={m} style={{ textAlign: "right", padding: "6px 8px", color: COLORS.text, fontFamily: "monospace" }}>
                    {fmt(s.stats[m], format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ConfidenceBandChartProps {
  cdf: CDFPoint[];
  stats: DistributionStats;
  title?: string;
  format?: string;
  width?: number;
  height?: number;
}

export function ConfidenceBandChart({ cdf, stats, title, format, width = 480, height = 180 }: ConfidenceBandChartProps) {
  const pad = { top: 16, right: 16, bottom: 36, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (!cdf || cdf.length === 0) return null;

  const minVal = cdf[0]!.value;
  const maxVal = cdf[cdf.length - 1]!.value;
  const valRange = maxVal - minVal || 1;

  const xScale = (v: number) => ((v - minVal) / valRange) * plotW;
  const yScale = (p: number) => plotH - p * plotH;

  const ci90Lower = cdf.find((p) => p.cumProb >= 0.05)?.value ?? minVal;
  const ci90Upper = cdf.find((p) => p.cumProb >= 0.95)?.value ?? maxVal;
  const ci50Lower = cdf.find((p) => p.cumProb >= 0.25)?.value ?? minVal;
  const ci50Upper = cdf.find((p) => p.cumProb >= 0.75)?.value ?? maxVal;

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
      {title && <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      <svg width={width} height={height}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          <rect
            x={xScale(ci90Lower)} y={0}
            width={xScale(ci90Upper) - xScale(ci90Lower)}
            height={plotH}
            fill={COLORS.primary} opacity={0.1}
          />
          <rect
            x={xScale(ci50Lower)} y={0}
            width={xScale(ci50Upper) - xScale(ci50Lower)}
            height={plotH}
            fill={COLORS.primary} opacity={0.2}
          />
          <line x1={xScale(stats.mean)} y1={0} x2={xScale(stats.mean)} y2={plotH} stroke={COLORS.warning} strokeWidth={2} />
          <line x1={xScale(stats.median)} y1={0} x2={xScale(stats.median)} y2={plotH} stroke={COLORS.success} strokeWidth={1.5} strokeDasharray="4 2" />

          {[stats.p5, stats.p25, stats.p50, stats.p75, stats.p95].map((v, i) => (
            <g key={i} transform={`translate(${xScale(v)},${plotH})`}>
              <line y2={4} stroke={COLORS.subtext} />
              <text y={14} textAnchor="middle" fontSize={9} fill={COLORS.subtext}>{fmt(v, format)}</text>
            </g>
          ))}

          <text x={xScale(ci90Lower)} y={plotH - 4} fontSize={9} fill={COLORS.subtext} textAnchor="middle">P5</text>
          <text x={xScale(ci90Upper)} y={plotH - 4} fontSize={9} fill={COLORS.subtext} textAnchor="middle">P95</text>

          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={COLORS.gridLine} />
        </g>
      </svg>
    </div>
  );
}

interface SimulationResultCardProps {
  outputId: string;
  metric: { label: string; format?: string };
  stats: DistributionStats;
  histogram: HistogramBucket[];
  cdf: CDFPoint[];
  tornado?: TornadoEntry[];
  baselineMean?: number;
  compact?: boolean;
}

export function SimulationResultCard({
  metric,
  stats,
  histogram,
  cdf,
  tornado,
  baselineMean,
  compact = false,
}: SimulationResultCardProps) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>{metric.label}</div>
          <div style={{ color: COLORS.warning, fontSize: 20, fontWeight: 700, marginTop: 2 }}>
            {fmt(stats.mean, metric.format)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.subtext }}>
          <div>
            <div>P10</div>
            <div style={{ color: COLORS.text, fontWeight: 600 }}>{fmt(stats.p10, metric.format)}</div>
          </div>
          <div>
            <div>P50</div>
            <div style={{ color: COLORS.text, fontWeight: 600 }}>{fmt(stats.p50, metric.format)}</div>
          </div>
          <div>
            <div>P90</div>
            <div style={{ color: COLORS.text, fontWeight: 600 }}>{fmt(stats.p90, metric.format)}</div>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <ProbabilityDensityPlot histogram={histogram} stats={stats} {...(metric.format !== undefined ? { format: metric.format } : {})} height={160} />
          <CumulativeDistributionCurve cdf={cdf} stats={stats} {...(metric.format !== undefined ? { format: metric.format } : {})} height={160} />
          {tornado && baselineMean !== undefined && tornado.length > 0 && (
            <TornadoDiagram
              tornado={tornado}
              baselineMean={baselineMean}
              outputLabel={metric.label}
              {...(metric.format !== undefined ? { format: metric.format } : {})}
              maxEntries={6}
            />
          )}
        </>
      )}
    </div>
  );
}

interface ProgressTrackerProps {
  percentComplete: number;
  iteration: number;
  totalIterations: number;
  estimatedRemainingMs: number;
  elapsedMs: number;
}

export function SimulationProgressTracker({
  percentComplete,
  iteration,
  totalIterations,
  estimatedRemainingMs,
  elapsedMs,
}: ProgressTrackerProps) {
  const secRemaining = Math.round(estimatedRemainingMs / 1000);
  const secElapsed = Math.round(elapsedMs / 1000);

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: COLORS.text }}>Running simulation…</span>
        <span style={{ color: COLORS.subtext }}>{percentComplete.toFixed(1)}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${percentComplete}%`, height: "100%", background: COLORS.primary, transition: "width 0.3s ease", borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: COLORS.subtext }}>
        <span>{iteration.toLocaleString()} / {totalIterations.toLocaleString()} iterations</span>
        <span>{secRemaining > 0 ? `~${secRemaining}s remaining` : `${secElapsed}s elapsed`}</span>
      </div>
    </div>
  );
}

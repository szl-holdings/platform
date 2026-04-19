import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { sample } from "@szl-holdings/monte-carlo/distributions";
import type { ScenarioDefinition } from "@szl-holdings/monte-carlo/schema";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { Activity, BarChart3, Layers, RefreshCw } from "lucide-react";

const VESSELS_ACCENT = LANE_ACCENT_HEX.vessels.primaryLight;

export interface MonteCarloResult {
  scenarioId: string;
  title: string;
  description: string;
  domain: string;
  iterations: number;
  validIterations: number;
  durationMs: number;
  metrics: Record<string, {
    label: string;
    format?: string;
    higherIsBetter?: boolean;
    mean: number;
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    min: number;
    max: number;
    stdDev: number;
  }>;
  inputSensitivity: Array<{ inputId: string; label: string; impact: number }>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p / 100) - 1);
  return sorted[idx]!;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function runScenarioSimulation(scenario: ScenarioDefinition, iterations: number): MonteCarloResult {
  const start = performance.now();
  const outputAccum: Record<string, number[]> = {};
  for (const out of scenario.outputs) outputAccum[out.id] = [];
  const inputAccum: Record<string, number[]> = {};
  for (const inp of scenario.inputs) inputAccum[inp.id] = [];

  let validIterations = 0;

  for (let i = 0; i < iterations; i++) {
    const inputs: Record<string, number> = {};
    for (const inp of scenario.inputs) {
      const val = sample(inp.distribution);
      inputs[inp.id] = val;
      inputAccum[inp.id]!.push(val);
    }
    try {
      const outputs = scenario.calculate(inputs, i);
      let valid = true;
      if (scenario.constraints) {
        for (const constraint of scenario.constraints) {
          if (!constraint.check(outputs)) { valid = false; break; }
        }
      }
      if (!valid) continue;
      validIterations++;
      for (const out of scenario.outputs) {
        const v = outputs[out.id];
        if (v !== undefined && isFinite(v)) outputAccum[out.id]!.push(v);
      }
    } catch { /* constraint violation */ }
  }

  const metrics: MonteCarloResult["metrics"] = {};
  for (const out of scenario.outputs) {
    const values = outputAccum[out.id] ?? [];
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    metrics[out.id] = {
      label: out.label,
      format: out.format,
      higherIsBetter: out.higherIsBetter,
      mean,
      p5: percentile(sorted, 5),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      stdDev: computeStdDev(values, mean),
    };
  }

  const primaryOutput = scenario.outputs[0];
  const baseOutputs = primaryOutput ? (outputAccum[primaryOutput.id] ?? []) : [];
  const baseMean = baseOutputs.length > 0 ? baseOutputs.reduce((s, v) => s + v, 0) / baseOutputs.length : 0;
  const baseVar = baseOutputs.length > 0 ? baseOutputs.reduce((s, v) => s + (v - baseMean) ** 2, 0) / baseOutputs.length : 0;

  const inputSensitivity = scenario.inputs.map(inp => {
    const inputVals = inputAccum[inp.id]!;
    const inputMean = inputVals.reduce((s, v) => s + v, 0) / inputVals.length;
    let cov = 0;
    for (let i = 0; i < Math.min(inputVals.length, baseOutputs.length); i++) {
      cov += (inputVals[i]! - inputMean) * (baseOutputs[i]! - baseMean);
    }
    cov /= inputVals.length;
    const inputVar = inputVals.reduce((s, v) => s + (v - inputMean) ** 2, 0) / inputVals.length;
    const r2 = baseVar > 0 && inputVar > 0 ? (cov * cov) / (inputVar * baseVar) : 0;
    return { inputId: inp.id, label: inp.label, impact: Math.sqrt(r2) };
  }).sort((a, b) => b.impact - a.impact);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    description: scenario.description,
    domain: scenario.domain,
    iterations,
    validIterations,
    durationMs: performance.now() - start,
    metrics,
    inputSensitivity,
  };
}

function formatValue(value: number, format?: string): string {
  if (!isFinite(value)) return "—";
  if (format === "currency") {
    const abs = Math.abs(value);
    if (abs >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  if (format === "percentage") return `${value.toFixed(1)}%`;
  if (format === "years") return `${value.toFixed(1)}y`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface RiskSimulationPanelProps {
  scenario: ScenarioDefinition;
  iterations?: number;
  accentColor?: string;
  title?: string;
  subtitle?: string;
}

export function RiskSimulationPanel({
  scenario,
  iterations = 5000,
  accentColor = VESSELS_ACCENT,
  title,
  subtitle,
}: RiskSimulationPanelProps) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [iterCount, setIterCount] = useState<number>(iterations);
  const [running, setRunning] = useState<boolean>(true);
  const [runKey, setRunKey] = useState<number>(0);

  useEffect(() => {
    setRunning(true);
    const handle = window.setTimeout(() => {
      try {
        const r = runScenarioSimulation(scenario, iterCount);
        setResult(r);
      } finally {
        setRunning(false);
      }
    }, 30);
    return () => window.clearTimeout(handle);
  }, [scenario, iterCount, runKey]);

  const primary = scenario.outputs[0];
  const primaryMetric = primary ? result?.metrics[primary.id] : undefined;

  const metricRows = useMemo(() => {
    if (!result) return [];
    return scenario.outputs.map(o => ({
      id: o.id,
      label: o.label,
      format: o.format,
      stat: result.metrics[o.id],
    })).filter(r => r.stat);
  }, [result, scenario]);

  const maxP95 = useMemo(() => {
    if (metricRows.length === 0) return 0;
    return Math.max(...metricRows.map(r => Math.abs(r.stat?.p95 ?? 0)), 0.0001);
  }, [metricRows]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">{title ?? scenario.title}</h2>
          <p className="text-[12px] mt-1 max-w-2xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            {subtitle ?? scenario.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={iterCount}
            onChange={(e) => setIterCount(Number(e.target.value))}
            className="text-[11px] bg-transparent border rounded-md px-2 py-1.5 font-mono text-white/80"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            aria-label="Monte Carlo iterations"
          >
            <option value={1000}>1,000 iter</option>
            <option value={5000}>5,000 iter</option>
            <option value={10000}>10,000 iter</option>
            <option value={25000}>25,000 iter</option>
          </select>
          <button
            onClick={() => setRunKey(k => k + 1)}
            disabled={running}
            className="flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
            style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            aria-label="Re-run simulation"
          >
            <RefreshCw className={`w-3 h-3 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Re-run"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Iterations</div>
          <div className="text-sm font-mono text-white">{result?.iterations.toLocaleString() ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Valid Runs</div>
          <div className="text-sm font-mono text-white">{result?.validIterations.toLocaleString() ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Compute</div>
          <div className="text-sm font-mono text-white">{result ? `${result.durationMs.toFixed(0)}ms` : "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Domain</div>
          <div className="text-sm font-mono uppercase" style={{ color: accentColor }}>{result?.domain ?? scenario.domain}</div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
            Output Distributions — {result?.scenarioId ?? scenario.id}
          </h3>
        </div>
        <div className="space-y-4">
          {metricRows.map(({ id, label, format, stat }, rowIdx) => {
            if (!stat) return null;
            const p95 = Math.abs(stat.p95);
            const p5 = Math.abs(stat.p5);
            const mean = Math.abs(stat.mean);
            const p95Pct = maxP95 > 0 ? Math.min(100, (p95 / maxP95) * 100) : 0;
            const p5Pct = maxP95 > 0 ? Math.min(100, (p5 / maxP95) * 100) : 0;
            const iqrPct = Math.max(0, p95Pct - p5Pct);
            const meanPct = maxP95 > 0 ? Math.min(100, (mean / maxP95) * 100) : 0;
            const delay = rowIdx * 0.1;
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-white">{label}</span>
                  <span className="text-sm font-bold text-white">
                    {formatValue(stat.mean, format)}{" "}
                    <span className="text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>(mean)</span>
                  </span>
                </div>
                <div className="relative h-6 rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-md"
                    style={{ background: `${accentColor}33` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p95Pct}%` }}
                    transition={{ duration: 0.7, delay, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-sm"
                    style={{ background: `${accentColor}66`, left: `${p5Pct}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${iqrPct}%` }}
                    transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    initial={{ left: 0, opacity: 0 }}
                    animate={{ left: `${meanPct}%`, opacity: 1 }}
                    transition={{ duration: 0.7, delay: delay + 0.2, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-1 font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>P5: {formatValue(stat.p5, format)}</span>
                  <span>P25: {formatValue(stat.p25, format)}</span>
                  <span>P50: {formatValue(stat.p50, format)}</span>
                  <span>P75: {formatValue(stat.p75, format)}</span>
                  <span>P95: {formatValue(stat.p95, format)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
              Input Sensitivity{primary ? ` (Correlation to ${primary.label})` : ""}
            </h4>
          </div>
          <div className="space-y-2">
            {result?.inputSensitivity.slice(0, 8).map((item, i) => (
              <div key={item.inputId} className="flex items-center gap-2">
                <span className="text-[11px] w-44 truncate flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accentColor, opacity: 0.7 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, item.impact * 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] font-mono w-10 text-right text-white">{(item.impact * 100).toFixed(0)}%</span>
              </div>
            )) ?? null}
            {!result && <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Sampling driver impact…</p>}
          </div>
        </div>
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Risk Bands</h4>
          </div>
          {primary && primaryMetric && (
            <>
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Standard Deviation</div>
                <div className="text-sm font-bold text-white">{formatValue(primaryMetric.stdDev, primary.format)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>90% Confidence Band</div>
                <div className="text-sm font-semibold text-white">
                  {formatValue(primaryMetric.p5, primary.format)} – {formatValue(primaryMetric.p95, primary.format)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>50% Interquartile</div>
                <div className="text-sm font-semibold text-white">
                  {formatValue(primaryMetric.p25, primary.format)} – {formatValue(primaryMetric.p75, primary.format)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Range</div>
                <div className="text-sm font-mono text-white">
                  {formatValue(primaryMetric.min, primary.format)} → {formatValue(primaryMetric.max, primary.format)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

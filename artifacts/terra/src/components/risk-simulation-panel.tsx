import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  runScenarioSimulation as runScenarioSimulationSync,
  type MonteCarloResult,
} from "@szl-holdings/monte-carlo/scenario-simulation";
import { runScenarioInPool } from "@szl-holdings/monte-carlo/scenario-pool";
import type { ScenarioDefinition, InputVariable } from "@szl-holdings/monte-carlo/schema";
import {
  type DriverTweak,
  IDENTITY_TWEAK,
  isIdentityTweak,
  tweakedInputs,
  tweakSummary,
  distributionSupportsSpread,
} from "@szl-holdings/monte-carlo";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { SaveRiskRunButton, type SavedRiskRun } from "@szl-holdings/shared-ui/risk-evidence";
import { DriverTweakPresets } from "@szl-holdings/shared-ui/driver-tweak-presets";
import { Activity, BarChart3, Layers, RefreshCw, Sliders, RotateCcw, ChevronDown, ChevronUp, BookmarkPlus, X } from "lucide-react";
import RiskSimulationWorker from "@/workers/risk-simulation.worker?worker";

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

export type { MonteCarloResult };
export { runScenarioSimulationSync as runScenarioSimulation };

interface SimulationProgressState {
  completed: number;
  total: number;
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

function formatSignedValue(value: number, format?: string): string {
  if (!isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatValue(Math.abs(value), format)}`;
}

function formatPctDelta(curr: number, base: number): string {
  if (!isFinite(curr) || !isFinite(base) || base === 0) return "—";
  const pct = ((curr - base) / Math.abs(base)) * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

interface BaselineSnapshot {
  result: MonteCarloResult;
  capturedAt: number;
  tweakCount: number;
}

interface RiskSimulationPanelProps {
  scenario: ScenarioDefinition;
  iterations?: number;
  accentColor?: string;
  title?: string;
  subtitle?: string;
  evidenceDomain?: string;
}

export function RiskSimulationPanel({
  scenario,
  iterations = 5000,
  accentColor = TERRA_ACCENT,
  title,
  subtitle,
  evidenceDomain = "terra",
}: RiskSimulationPanelProps) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [iterCount, setIterCount] = useState<number>(iterations);
  const [running, setRunning] = useState<boolean>(true);
  const [progress, setProgress] = useState<SimulationProgressState | null>(null);
  const [runKey, setRunKey] = useState<number>(0);
  const requestIdRef = useRef<number>(0);
  const [tweaks, setTweaks] = useState<Record<string, DriverTweak>>({});
  const [showTweaks, setShowTweaks] = useState<boolean>(false);
  const [appliedTweaks, setAppliedTweaks] = useState<Record<string, DriverTweak>>({});
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);

  useEffect(() => {
    setTweaks({});
    setAppliedTweaks({});
    setBaseline(null);
  }, [scenario.id]);

  const modifiedIds = useMemo(
    () => new Set(Object.keys(appliedTweaks).filter((id) => !isIdentityTweak(appliedTweaks[id]))),
    [appliedTweaks],
  );

  const effectiveScenario = useMemo<ScenarioDefinition>(() => {
    if (modifiedIds.size === 0) return scenario;
    const inputs = tweakedInputs(scenario.inputs, appliedTweaks);
    return { ...scenario, inputs };
  }, [scenario, appliedTweaks, modifiedIds]);

  useEffect(() => {
    setRunning(true);
    setProgress(null);
    const requestId = ++requestIdRef.current;
    const tweaksActive = modifiedIds.size > 0;
    let cancelled = false;

    // Workers only know registered scenarios by id and cannot apply
    // user-supplied driver tweaks, so we fall back to a synchronous run
    // on the main thread whenever overrides are in effect.
    if (!tweaksActive) {
      let workerCreationFailed = false;
      try {
        // Probe the worker constructor; if it throws we'll fall through
        // to the synchronous path below.
        new RiskSimulationWorker().terminate();
      } catch {
        workerCreationFailed = true;
      }
      if (!workerCreationFailed) {
        runScenarioInPool({
          scenario: effectiveScenario,
          iterations: iterCount,
          workerFactory: () => new RiskSimulationWorker(),
          onProgress: (p) => {
            if (cancelled || requestId !== requestIdRef.current) return;
            setProgress({ completed: p.completed, total: p.total });
          },
        })
          .then((r) => {
            if (cancelled || requestId !== requestIdRef.current) return;
            setResult(r);
            setProgress(null);
            setRunning(false);
          })
          .catch((err) => {
            if (cancelled || requestId !== requestIdRef.current) return;
            // eslint-disable-next-line no-console
            console.warn("[risk-simulation] worker pool error, falling back:", err);
            try {
              const r = runScenarioSimulationSync(effectiveScenario, iterCount);
              if (requestId === requestIdRef.current) setResult(r);
            } finally {
              if (requestId === requestIdRef.current) {
                setProgress(null);
                setRunning(false);
              }
            }
          });
        return () => {
          cancelled = true;
        };
      }
    }

    // Fallback: synchronous run via setTimeout if workers are unavailable
    // or if driver tweaks are active.
    const handle = window.setTimeout(() => {
      try {
        const r = runScenarioSimulationSync(effectiveScenario, iterCount);
        if (requestId === requestIdRef.current) setResult(r);
      } finally {
        if (requestId === requestIdRef.current) {
          setProgress(null);
          setRunning(false);
        }
      }
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [effectiveScenario, scenario.id, iterCount, runKey, modifiedIds]);

  const pendingChanges = useMemo(() => {
    const ids = new Set([...Object.keys(tweaks), ...Object.keys(appliedTweaks)]);
    for (const id of ids) {
      const a = tweaks[id] ?? IDENTITY_TWEAK;
      const b = appliedTweaks[id] ?? IDENTITY_TWEAK;
      if (Math.abs(a.meanMultiplier - b.meanMultiplier) > 1e-9) return true;
      if (Math.abs(a.spreadMultiplier - b.spreadMultiplier) > 1e-9) return true;
    }
    return false;
  }, [tweaks, appliedTweaks]);

  const updateTweak = (id: string, patch: Partial<DriverTweak>) => {
    setTweaks((prev) => {
      const current = prev[id] ?? IDENTITY_TWEAK;
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };
  const resetInput = (id: string) => {
    setTweaks((prev) => ({ ...prev, [id]: { ...IDENTITY_TWEAK } }));
  };
  const resetAll = () => {
    setTweaks({});
    setAppliedTweaks({});
  };
  const applyAndRun = () => {
    setAppliedTweaks({ ...tweaks });
    setRunKey((k) => k + 1);
  };
  const captureBaseline = () => {
    if (!result) return;
    setBaseline({ result, capturedAt: Date.now(), tweakCount: modifiedIds.size });
  };
  const clearBaseline = () => setBaseline(null);
  const loadPresetTweaks = (preset: Record<string, DriverTweak>) => {
    setTweaks(preset);
    setAppliedTweaks(preset);
    setRunKey((k) => k + 1);
  };

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
    const vals = metricRows.map((r) => Math.abs(r.stat?.p95 ?? 0));
    if (baseline) {
      for (const o of scenario.outputs) {
        const m = baseline.result.metrics[o.id];
        if (m) vals.push(Math.abs(m.p95));
      }
    }
    return Math.max(...vals, 0.0001);
  }, [metricRows, baseline, scenario]);

  const baselineCapturedLabel = useMemo(() => {
    if (!baseline) return null;
    const t = new Date(baseline.capturedAt);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    const ss = String(t.getSeconds()).padStart(2, "0");
    const tweakDesc = baseline.tweakCount === 0
      ? "no tweaks"
      : `${baseline.tweakCount} tweak${baseline.tweakCount === 1 ? "" : "s"}`;
    return `Baseline captured ${hh}:${mm}:${ss} · ${tweakDesc}`;
  }, [baseline]);

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
            <option value={50000}>50,000 iter</option>
            <option value={100000}>100,000 iter</option>
          </select>
          <button
            onClick={() => setShowTweaks((s) => !s)}
            className="flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors text-white/80 hover:text-white"
            style={{ background: modifiedIds.size > 0 ? `${accentColor}20` : "rgba(255,255,255,0.04)", border: `1px solid ${modifiedIds.size > 0 ? `${accentColor}40` : "rgba(255,255,255,0.1)"}` }}
            aria-label="Toggle driver tweaks"
            aria-expanded={showTweaks}
          >
            <Sliders className="w-3 h-3" />
            Tweak Drivers
            {modifiedIds.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: accentColor, color: "#000" }}>
                {modifiedIds.size}
              </span>
            )}
            {showTweaks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setRunKey(k => k + 1)}
            disabled={running}
            className="flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
            style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            aria-label="Re-run simulation"
          >
            <RefreshCw className={`w-3 h-3 ${running ? "animate-spin" : ""}`} />
            {running
              ? progress
                ? `Running ${Math.round((progress.completed / progress.total) * 100)}%`
                : "Running…"
              : "Re-run"}
          </button>
          {baseline ? (
            <button
              onClick={clearBaseline}
              className="flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors text-white/80 hover:text-white"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Clear saved baseline"
            >
              <X className="w-3 h-3" />
              Clear baseline
            </button>
          ) : (
            <button
              onClick={captureBaseline}
              disabled={running || !result}
              className="flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors text-white/80 hover:text-white disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Capture current run as baseline"
            >
              <BookmarkPlus className="w-3 h-3" />
              Capture baseline
            </button>
          )}
          <SaveRiskRunButton
            domain={evidenceDomain}
            accentColor={accentColor}
            disabled={running || !result}
            build={() => {
              if (!result) return null;
              const payload: Omit<SavedRiskRun, "evidenceId" | "savedAt"> = {
                scenarioId: scenario.id,
                scenarioVersion: scenario.version,
                scenarioTitle: title ?? scenario.title,
                domain: scenario.domain,
                iterations: result.iterations,
                validIterations: result.validIterations,
                durationMs: result.durationMs,
                metrics: scenario.outputs
                  .map(o => {
                    const m = result.metrics[o.id];
                    if (!m) return null;
                    return {
                      id: o.id,
                      label: m.label,
                      format: m.format,
                      mean: m.mean,
                      p5: m.p5,
                      p25: m.p25,
                      p50: m.p50,
                      p75: m.p75,
                      p95: m.p95,
                      min: m.min,
                      max: m.max,
                      stdDev: m.stdDev,
                    };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null),
                sensitivities: result.inputSensitivity.map(s => ({ inputId: s.inputId, label: s.label, impact: s.impact })),
                inputs: effectiveScenario.inputs.map(inp => ({
                  id: inp.id,
                  label: inp.label,
                  unit: inp.unit,
                  format: inp.format,
                  distribution: inp.distribution,
                })),
              };
              return payload;
            }}
          />
        </div>
      </div>

      {showTweaks && (
        <DriverTweaksPanel
          inputs={scenario.inputs}
          tweaks={tweaks}
          accentColor={accentColor}
          onChange={updateTweak}
          onResetInput={resetInput}
          onResetAll={resetAll}
          onApply={applyAndRun}
          pendingChanges={pendingChanges}
          modifiedIds={modifiedIds}
          running={running}
          presetScopeKey={`${evidenceDomain}:${scenario.id}`}
          onLoadPreset={loadPresetTweaks}
        />
      )}

      <div className="rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Iterations</div>
          <div className="text-sm font-mono text-white">
            {running && progress
              ? `${progress.completed.toLocaleString()} / ${progress.total.toLocaleString()}`
              : result?.iterations.toLocaleString() ?? "—"}
          </div>
          {running && progress && (
            <div
              className="mt-1.5 h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
              role="progressbar"
              aria-label="Simulation progress"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.completed}
            >
              <div
                className="h-full rounded-full transition-[width] duration-200 ease-out"
                style={{
                  width: `${Math.min(100, (progress.completed / progress.total) * 100)}%`,
                  background: accentColor,
                }}
              />
            </div>
          )}
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
        {baselineCapturedLabel && (
          <div
            className="flex items-center justify-between gap-3 mb-3 px-2.5 py-1.5 rounded-md text-[10px] font-mono"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: "rgba(255,255,255,0.35)" }} />
              {baselineCapturedLabel}
            </span>
            <span className="flex items-center gap-2" style={{ color: accentColor }}>
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: accentColor }} />
              current run
            </span>
          </div>
        )}
        <div className="space-y-4">
          {metricRows.map(({ id, label, format, stat }, rowIdx) => {
            if (!stat) return null;
            const baseStat = baseline?.result.metrics[id];
            const p95 = Math.abs(stat.p95);
            const p5 = Math.abs(stat.p5);
            const mean = Math.abs(stat.mean);
            const p95Pct = maxP95 > 0 ? Math.min(100, (p95 / maxP95) * 100) : 0;
            const p5Pct = maxP95 > 0 ? Math.min(100, (p5 / maxP95) * 100) : 0;
            const iqrPct = Math.max(0, p95Pct - p5Pct);
            const meanPct = maxP95 > 0 ? Math.min(100, (mean / maxP95) * 100) : 0;
            const delay = rowIdx * 0.1;
            const meanDelta = baseStat ? stat.mean - baseStat.mean : 0;
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-white">{label}</span>
                  <span className="text-sm font-bold text-white flex items-baseline gap-2">
                    {formatValue(stat.mean, format)}{" "}
                    <span className="text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>(mean)</span>
                    {baseStat && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: accentColor,
                          background: `${accentColor}15`,
                          border: `1px solid ${accentColor}30`,
                        }}
                        title={`Baseline mean ${formatValue(baseStat.mean, format)}`}
                      >
                        Δ {formatSignedValue(meanDelta, format)} ({formatPctDelta(stat.mean, baseStat.mean)})
                      </span>
                    )}
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
                {baseStat && (() => {
                  const bP95 = Math.abs(baseStat.p95);
                  const bP5 = Math.abs(baseStat.p5);
                  const bMean = Math.abs(baseStat.mean);
                  const bP95Pct = maxP95 > 0 ? Math.min(100, (bP95 / maxP95) * 100) : 0;
                  const bP5Pct = maxP95 > 0 ? Math.min(100, (bP5 / maxP95) * 100) : 0;
                  const bIqrPct = Math.max(0, bP95Pct - bP5Pct);
                  const bMeanPct = maxP95 > 0 ? Math.min(100, (bMean / maxP95) * 100) : 0;
                  return (
                    <div className="relative h-3 rounded-md overflow-hidden mt-1" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div
                        className="absolute top-0 left-0 h-full rounded-md"
                        style={{ background: "rgba(255,255,255,0.10)", width: `${bP95Pct}%` }}
                      />
                      <div
                        className="absolute top-0.5 bottom-0.5 rounded-sm"
                        style={{ background: "rgba(255,255,255,0.25)", left: `${bP5Pct}%`, width: `${bIqrPct}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{ background: "rgba(255,255,255,0.6)", left: `${bMeanPct}%` }}
                      />
                    </div>
                  );
                })()}
                <div className="flex justify-between text-[9px] mt-1 font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>P5: {formatValue(stat.p5, format)}</span>
                  <span>P25: {formatValue(stat.p25, format)}</span>
                  <span>P50: {formatValue(stat.p50, format)}</span>
                  <span>P75: {formatValue(stat.p75, format)}</span>
                  <span>P95: {formatValue(stat.p95, format)}</span>
                </div>
                {baseStat && (
                  <div className="flex justify-between text-[9px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <span>base P5: {formatValue(baseStat.p5, format)}</span>
                    <span>P25: {formatValue(baseStat.p25, format)}</span>
                    <span>P50: {formatValue(baseStat.p50, format)}</span>
                    <span>P75: {formatValue(baseStat.p75, format)}</span>
                    <span>P95: {formatValue(baseStat.p95, format)}</span>
                  </div>
                )}
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
                <span className="text-[11px] w-44 truncate flex-shrink-0 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {item.label}
                  {modifiedIds.has(item.inputId) && (
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider" style={{ background: `${accentColor}30`, color: accentColor }}>
                      tweaked
                    </span>
                  )}
                </span>
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
          {primary && primaryMetric && (() => {
            const basePrimary = baseline?.result.metrics[primary.id];
            const renderDelta = (curr: number, base: number | undefined) => {
              if (base === undefined || !isFinite(base)) return null;
              return (
                <span
                  className="ml-2 text-[9px] font-mono px-1 py-0.5 rounded"
                  style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                >
                  Δ {formatSignedValue(curr - base, primary.format)} ({formatPctDelta(curr, base)})
                </span>
              );
            };
            const baseLine = (text: string) => (
              <div className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                base · {text}
              </div>
            );
            return (
              <>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Standard Deviation</div>
                  <div className="text-sm font-bold text-white flex items-center flex-wrap">
                    {formatValue(primaryMetric.stdDev, primary.format)}
                    {renderDelta(primaryMetric.stdDev, basePrimary?.stdDev)}
                  </div>
                  {basePrimary && baseLine(formatValue(basePrimary.stdDev, primary.format))}
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>90% Confidence Band</div>
                  <div className="text-sm font-semibold text-white flex items-center flex-wrap">
                    {formatValue(primaryMetric.p5, primary.format)} – {formatValue(primaryMetric.p95, primary.format)}
                    {renderDelta(primaryMetric.p95 - primaryMetric.p5, basePrimary ? basePrimary.p95 - basePrimary.p5 : undefined)}
                  </div>
                  {basePrimary && baseLine(`${formatValue(basePrimary.p5, primary.format)} – ${formatValue(basePrimary.p95, primary.format)}`)}
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>50% Interquartile</div>
                  <div className="text-sm font-semibold text-white flex items-center flex-wrap">
                    {formatValue(primaryMetric.p25, primary.format)} – {formatValue(primaryMetric.p75, primary.format)}
                    {renderDelta(primaryMetric.p75 - primaryMetric.p25, basePrimary ? basePrimary.p75 - basePrimary.p25 : undefined)}
                  </div>
                  {basePrimary && baseLine(`${formatValue(basePrimary.p25, primary.format)} – ${formatValue(basePrimary.p75, primary.format)}`)}
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Range</div>
                  <div className="text-sm font-mono text-white">
                    {formatValue(primaryMetric.min, primary.format)} → {formatValue(primaryMetric.max, primary.format)}
                  </div>
                  {basePrimary && baseLine(`${formatValue(basePrimary.min, primary.format)} → ${formatValue(basePrimary.max, primary.format)}`)}
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Mean</div>
                  <div className="text-sm font-bold text-white flex items-center flex-wrap">
                    {formatValue(primaryMetric.mean, primary.format)}
                    {renderDelta(primaryMetric.mean, basePrimary?.mean)}
                  </div>
                  {basePrimary && baseLine(formatValue(basePrimary.mean, primary.format))}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

interface DriverTweaksPanelProps {
  inputs: InputVariable[];
  tweaks: Record<string, DriverTweak>;
  accentColor: string;
  onChange: (id: string, patch: Partial<DriverTweak>) => void;
  onResetInput: (id: string) => void;
  onResetAll: () => void;
  onApply: () => void;
  pendingChanges: boolean;
  modifiedIds: Set<string>;
  running: boolean;
  presetScopeKey: string;
  onLoadPreset: (tweaks: Record<string, DriverTweak>) => void;
}

function formatDriverValue(value: number, format?: string): string {
  if (!isFinite(value)) return "—";
  if (format === "currency") {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  if (format === "percentage") return `${(value * 100).toFixed(1)}%`;
  if (format === "years") return `${value.toFixed(1)}y`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function DriverTweaksPanel({
  inputs,
  tweaks,
  accentColor,
  onChange,
  onResetInput,
  onResetAll,
  onApply,
  pendingChanges,
  modifiedIds,
  running,
  presetScopeKey,
  onLoadPreset,
}: DriverTweaksPanelProps) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
            Driver Assumptions — override before re-running
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DriverTweakPresets
            scopeKey={presetScopeKey}
            accentColor={accentColor}
            currentTweaks={tweaks}
            onLoad={onLoadPreset}
          />
          <button
            onClick={onResetAll}
            className="flex items-center gap-1 text-[10px] font-medium rounded-md px-2 py-1 transition-colors text-white/70 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            aria-label="Reset all drivers to baseline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to baseline
          </button>
          <button
            onClick={onApply}
            disabled={running || !pendingChanges}
            className="flex items-center gap-1 text-[10px] font-semibold rounded-md px-2.5 py-1 transition-colors disabled:opacity-40"
            style={{ background: accentColor, color: "#000" }}
            aria-label="Apply tweaks and re-run simulation"
          >
            <RefreshCw className={`w-3 h-3 ${running ? "animate-spin" : ""}`} />
            {pendingChanges ? "Apply & re-run" : "No changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
        {inputs.map((inp) => {
          const t = tweaks[inp.id] ?? IDENTITY_TWEAK;
          const baseline = tweakSummary(inp.distribution);
          const projectedCenter = baseline.center * t.meanMultiplier;
          const projectedSpread = baseline.spread * t.spreadMultiplier;
          const supportsSpread = distributionSupportsSpread(inp.distribution);
          const isModified = modifiedIds.has(inp.id) || !isIdentityTweak(t);
          return (
            <div key={inp.id} className="rounded-md p-2.5" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${isModified ? `${accentColor}40` : "rgba(255,255,255,0.06)"}` }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium text-white truncate">{inp.label}</span>
                  {isModified && (
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono uppercase" style={{ background: `${accentColor}30`, color: accentColor }}>
                      modified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onResetInput(inp.id)}
                  className="text-[9px] text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
                  aria-label={`Reset ${inp.label}`}
                >
                  reset
                </button>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span>baseline {formatDriverValue(baseline.center, inp.format)}{supportsSpread && baseline.spread > 0 ? ` ± ${formatDriverValue(baseline.spread, inp.format)}` : ""}</span>
                <span style={{ color: isModified ? accentColor : "rgba(255,255,255,0.5)" }}>
                  → {formatDriverValue(projectedCenter, inp.format)}{supportsSpread && projectedSpread > 0 ? ` ± ${formatDriverValue(projectedSpread, inp.format)}` : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider w-12 flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>Mean</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    value={t.meanMultiplier}
                    onChange={(e) => onChange(inp.id, { meanMultiplier: Number(e.target.value) })}
                    className="flex-1 accent-current"
                    style={{ accentColor }}
                    aria-label={`${inp.label} mean multiplier`}
                  />
                  <span className="text-[10px] font-mono w-12 text-right" style={{ color: Math.abs(t.meanMultiplier - 1) > 1e-9 ? accentColor : "rgba(255,255,255,0.6)" }}>
                    {(t.meanMultiplier * 100).toFixed(0)}%
                  </span>
                </div>
                {supportsSpread && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider w-12 flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>Spread</span>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.05}
                      value={t.spreadMultiplier}
                      onChange={(e) => onChange(inp.id, { spreadMultiplier: Number(e.target.value) })}
                      className="flex-1"
                      style={{ accentColor }}
                      aria-label={`${inp.label} spread multiplier`}
                    />
                    <span className="text-[10px] font-mono w-12 text-right" style={{ color: Math.abs(t.spreadMultiplier - 1) > 1e-9 ? accentColor : "rgba(255,255,255,0.6)" }}>
                      {t.spreadMultiplier.toFixed(2)}×
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

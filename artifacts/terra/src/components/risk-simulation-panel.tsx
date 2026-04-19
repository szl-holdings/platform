import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  runScenarioSimulation as runScenarioSimulationSync,
  type MonteCarloResult,
} from "@szl-holdings/monte-carlo/scenario-simulation";
import type { ScenarioDefinition } from "@szl-holdings/monte-carlo/schema";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { SaveRiskRunButton, type SavedRiskRun } from "@szl-holdings/shared-ui/risk-evidence";
import { Activity, BarChart3, Layers, RefreshCw } from "lucide-react";
import RiskSimulationWorker from "@/workers/risk-simulation.worker?worker";

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

export type { MonteCarloResult };
export { runScenarioSimulationSync as runScenarioSimulation };

interface WorkerRequest {
  requestId: number;
  scenarioId: string;
  iterations: number;
}
type WorkerResponse =
  | { requestId: number; ok: true; result: MonteCarloResult }
  | { requestId: number; ok: false; error: string };

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
  const [runKey, setRunKey] = useState<number>(0);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new RiskSimulationWorker();
      workerRef.current = worker;
    } catch {
      workerRef.current = null;
    }
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    setRunning(true);
    const requestId = ++requestIdRef.current;
    const worker = workerRef.current;

    if (worker) {
      const handler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.requestId !== requestId) return;
        worker.removeEventListener("message", handler);
        if (event.data.ok) {
          setResult(event.data.result);
          setRunning(false);
        } else {
          // Worker reported an error (e.g. unknown scenario id) — fall
          // back to a synchronous run on the main thread so the panel
          // still shows results instead of getting stuck.
          // eslint-disable-next-line no-console
          console.warn("[risk-simulation] worker error, falling back:", event.data.error);
          try {
            const r = runScenarioSimulationSync(scenario, iterCount);
            if (requestId === requestIdRef.current) setResult(r);
          } finally {
            if (requestId === requestIdRef.current) setRunning(false);
          }
        }
      };
      worker.addEventListener("message", handler);
      const req: WorkerRequest = { requestId, scenarioId: scenario.id, iterations: iterCount };
      worker.postMessage(req);
      return () => {
        worker.removeEventListener("message", handler);
      };
    }

    // Fallback: synchronous run via setTimeout if worker is unavailable
    const handle = window.setTimeout(() => {
      try {
        const r = runScenarioSimulationSync(scenario, iterCount);
        if (requestId === requestIdRef.current) setResult(r);
      } finally {
        if (requestId === requestIdRef.current) setRunning(false);
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
            <option value={50000}>50,000 iter</option>
            <option value={100000}>100,000 iter</option>
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
                inputs: scenario.inputs.map(inp => ({
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

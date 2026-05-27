import { useEffect, useMemo, useRef, useState } from "react";
import { reasoningApi, type TemporalForecast, type LambdaReceipt } from "@/lib/api";
import { ReceiptCard } from "./Planner";
import type { WorkerInput, WorkerProgress } from "@/workers/ising-solver.worker";

interface FusedSolution {
  spins: number[];
  energy: number;
  ms: number;
  iterations: number;
  trace: number[];
  bias: number[];
  baselineEnergy: number;
}

type Mode = "synthetic" | "non-monotonic";

function syntheticSeries(): { t: number; v: number }[] {
  const start = Date.now() - 60 * 60_000;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i < 80; i++) {
    const breach = i > 55 && i < 68;
    out.push({ t: start + i * 60_000, v: 10 + Math.sin(i / 6) * 0.6 + (breach ? 5 : 0) });
  }
  return out;
}

function nonMonotonicSeries(): { t: number; v: number }[] {
  const s = syntheticSeries();
  // swap two indices to introduce a causal-prior violation
  [s[40], s[10]] = [s[10], s[40]];
  return s;
}

export default function Temporal() {
  const [mode, setMode] = useState<Mode>("synthetic");
  const [allowNonMonotonic, setAllow] = useState(false);
  const [forecast, setForecast] = useState<TemporalForecast | null>(null);
  const [receipt, setReceipt] = useState<LambdaReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fused, setFused] = useState<FusedSolution | null>(null);
  const [fuseBusy, setFuseBusy] = useState(false);
  const [fuseProgress, setFuseProgress] = useState<{ sweep: number; sweeps: number; bestEnergy: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const series = useMemo(() => (mode === "synthetic" ? syntheticSeries() : nonMonotonicSeries()), [mode]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  async function run() {
    setBusy(true);
    setError(null);
    setFused(null);
    setFuseProgress(null);
    try {
      const out = await reasoningApi.temporal({
        series,
        seriesId: `ui-${mode}`,
        baselineBuckets: 5,
        allowNonMonotonic,
      });
      setForecast(out.forecast);
      setReceipt(out.receipt);
    } catch (e) {
      setError(String(e));
      setForecast(null);
      setReceipt(null);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Fuse the Time-R1 forecast into a small Ising decision problem and solve
   * it in the browser worker. The bucket drift z-scores become a temporal
   * bias on h: spins biased toward -1 are "investigate"; +1 are "auto-clear".
   * The descent trace below is rendered live, so operators can see the
   * optimizer pull toward the same anomaly the temporal kernel flagged.
   */
  function runFusedIsing() {
    if (!forecast) return;
    workerRef.current?.terminate();
    setFuseBusy(true);
    setFuseProgress(null);
    setFused(null);

    const n = Math.min(forecast.buckets.length, 16);
    const bias: number[] = forecast.buckets.slice(0, n).map((b) => b.driftScore * 0.4);
    // Couple adjacent buckets so a run of drift biases neighbours together.
    const J: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (j === i + 1 ? -0.6 : 0)),
    );
    const h: number[] = new Array(n).fill(0);

    // Baseline (no temporal fusion) — compute deterministically for comparison.
    const baselineEnergy = -h.reduce((acc, hi) => acc + Math.abs(hi), 0);

    const worker = new Worker(new URL("../workers/ising-solver.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (ev: MessageEvent<WorkerProgress>) => {
      const msg = ev.data;
      if (msg.kind === "progress") {
        setFuseProgress({ sweep: msg.sweep, sweeps: msg.sweeps, bestEnergy: msg.bestEnergy });
      } else if (msg.kind === "done") {
        setFused({
          spins: msg.spins,
          energy: msg.energy,
          ms: msg.ms,
          iterations: msg.iterations,
          trace: msg.trace,
          bias,
          baselineEnergy,
        });
        setFuseBusy(false);
        worker.terminate();
        workerRef.current = null;
      } else {
        setError(`Ising worker error: ${msg.message}`);
        setFuseBusy(false);
        worker.terminate();
        workerRef.current = null;
      }
    };
    const input: WorkerInput = { J, h, seed: 7, sweeps: 240, tStart: 1.6, tEnd: 0.02, temporalBias: bias };
    worker.postMessage(input);
  }

  return (
    <div className="space-y-8" data-testid="page-temporal">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">time-R1 · anomaly.time-r1.v1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Bucket drift with a causal prior.</h1>
        <p className="text-muted-foreground max-w-3xl">
          The engine refuses to score a series whose timestamps are non-monotonic — effect-before-cause is rejected by
          default. Override only when you understand the contract you're loosening.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">series mode</span>
            <select
              data-testid="select-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="bg-background border border-border rounded px-3 py-1.5 text-sm"
            >
              <option value="synthetic">synthetic — monotonic w/ breach window</option>
              <option value="non-monotonic">non-monotonic — causal-prior violation</option>
            </select>
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              data-testid="checkbox-allow"
              type="checkbox"
              checked={allowNonMonotonic}
              onChange={(e) => setAllow(e.target.checked)}
            />
            <span>allow non-monotonic (override)</span>
          </label>
          <button
            data-testid="button-run-temporal"
            onClick={run}
            disabled={busy}
            className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {busy ? "scoring…" : "▶ Score series"}
          </button>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{series.length} points · span={Math.round((series[series.length - 1].t - series[0].t) / 60_000)} min</div>
      </section>

      {error && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-mono text-destructive" data-testid="temporal-error">
          {error}
        </section>
      )}

      {forecast && (
        <section className="space-y-4" data-testid="temporal-result">
          <div className="grid md:grid-cols-4 gap-3">
            <Stat label="buckets" value={forecast.bucketCount} sub={`window ${forecast.bucketWindowMs}ms`} />
            <Stat label="peak drift" value={forecast.peakBucket ? forecast.peakBucket.driftScore.toFixed(2) + "σ" : "—"} sub={`bucket ${forecast.peakBucket?.bucketIndex ?? "—"}`} />
            <Stat label="forecast nextMean" value={forecast.forecast.nextMean.toFixed(3)} sub={`conf ${(forecast.forecast.confidence * 100).toFixed(0)}%`} />
            <Stat label="causal violations" value={forecast.causalPriorViolations.length} sub="indices flagged" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-3">drift per bucket</div>
            <div className="flex items-end gap-1 h-32" data-testid="drift-bars">
              {forecast.buckets.map((b) => {
                const h = Math.max(2, Math.min(100, Math.abs(b.driftScore) * 18));
                const isPeak = forecast.peakBucket?.bucketIndex === b.bucketIndex;
                return (
                  <div
                    key={b.bucketIndex}
                    title={`bucket ${b.bucketIndex} · z=${b.driftScore.toFixed(2)} · n=${b.count}`}
                    className={`flex-1 ${isPeak ? "bg-primary" : "bg-primary/30"} rounded-sm`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">synthesis</div>
            {forecast.synthesis}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3" data-testid="fused-ising">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">fused decision · time-r1 ⨁ ising</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  Use the bucket-drift z-scores as a temporal bias on the Ising local field.
                  The browser worker runs a simulated-annealing descent so the optimizer pulls
                  toward the anomaly the temporal kernel flagged — fused space + time in one call.
                </p>
              </div>
              <button
                data-testid="button-fuse-ising"
                onClick={runFusedIsing}
                disabled={fuseBusy}
                className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {fuseBusy ? "annealing…" : "▶ Fuse + solve"}
              </button>
            </div>
            {fuseProgress && !fused && (
              <div className="text-xs font-mono text-muted-foreground" data-testid="fuse-progress">
                sweep {fuseProgress.sweep}/{fuseProgress.sweeps} · best E={fuseProgress.bestEnergy.toFixed(3)}
              </div>
            )}
            {fused && (
              <div className="space-y-3" data-testid="fuse-result">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Stat label="final energy" value={fused.energy.toFixed(3)} sub={`baseline ${fused.baselineEnergy.toFixed(3)}`} />
                  <Stat label="iterations" value={fused.iterations.toString()} sub={`${fused.ms.toFixed(0)} ms`} />
                  <Stat label="spins" value={fused.spins.filter((s) => s < 0).length + " ↓"} sub={fused.spins.filter((s) => s > 0).length + " ↑ (auto-clear)"} />
                </div>
                <div className="flex items-end gap-1 h-16" data-testid="spins-bar">
                  {fused.spins.map((s, i) => (
                    <div
                      key={i}
                      title={`bucket ${i} · bias=${fused.bias[i].toFixed(2)} · spin=${s}`}
                      className={`flex-1 ${s < 0 ? "bg-destructive" : "bg-primary/40"} rounded-sm`}
                      style={{ height: `${Math.max(10, Math.min(100, Math.abs(fused.bias[i]) * 35 + 10))}%` }}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  ↓ buckets = investigate / hold-fire · ↑ buckets = auto-clear
                </div>
              </div>
            )}
          </div>

          {receipt && <ReceiptCard receipt={receipt} />}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{sub}</div>
    </div>
  );
}

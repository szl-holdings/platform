import { useMemo, useState } from "react";
import { reasoningApi, type DroneOversightResponse, type TrajectoryPoint, type DetectedPeak } from "@/lib/api";
import { ReceiptCard } from "./Planner";

function TrajectoryViz({
  trajectory,
  telemetry,
  peaks,
}: {
  trajectory: TrajectoryPoint[];
  telemetry: DroneOversightResponse["telemetry"];
  peaks: DetectedPeak[];
}) {
  const W = 480;
  const H = 200;
  const path = useMemo(() => {
    if (trajectory.length === 0) return "";
    const xs = trajectory.map((p) => p.x);
    const ys = trajectory.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const sx = (x: number) => ((x - xMin) / Math.max(0.001, xMax - xMin)) * (W - 20) + 10;
    const sy = (y: number) => H - 10 - ((y - yMin) / Math.max(0.001, yMax - yMin)) * (H - 20);
    return trajectory.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  }, [trajectory]);
  const peakSet = new Set(peaks.map((p) => p.index));
  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="trajectory-viz">
      <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-3">
        sim-kit verlet trajectory · {trajectory.length} steps · {peaks.length} peaks
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" role="img" aria-label="drone trajectory">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/80" />
        {trajectory.map((p, i) => {
          const breach = telemetry[i] && !telemetry[i].inGeofence;
          const peak = peakSet.has(i);
          if (!breach && !peak) return null;
          const xs = trajectory.map((q) => q.x);
          const ys = trajectory.map((q) => q.y);
          const cx = ((p.x - Math.min(...xs)) / Math.max(0.001, Math.max(...xs) - Math.min(...xs))) * (W - 20) + 10;
          const cy = H - 10 - ((p.y - Math.min(...ys)) / Math.max(0.001, Math.max(...ys) - Math.min(...ys))) * (H - 20);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={peak ? 4 : 2.5}
              className={peak ? "fill-yellow-400" : "fill-destructive"}
            />
          );
        })}
      </svg>
      <div className="text-[10px] font-mono text-muted-foreground mt-2">
        red = geofence breach · yellow = peak-detector hit
      </div>
    </div>
  );
}

export default function DroneOversight() {
  const [seed, setSeed] = useState(7);
  const [result, setResult] = useState<DroneOversightResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const out = await reasoningApi.droneOversight({ seed, scenario: "default-perimeter" });
      setResult(out);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="page-drone-oversight">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">end-to-end demo · drone.oversight.v1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Drone oversight, end-to-end.</h1>
        <p className="text-muted-foreground max-w-3xl">
          Synthesises drone telemetry → plans a DAG → scores temporal drift → arbitrates a broadcast → seals four Λ-receipts.
          If the drift crosses the policy threshold a HITL approval lands in the operator inbox; otherwise the flight is
          auto-cleared.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 flex flex-wrap items-end gap-3">
        <label className="text-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">seed</span>
          <input
            data-testid="input-seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className="w-24 bg-background border border-border rounded px-3 py-1.5 text-sm"
          />
        </label>
        <button
          data-testid="button-run"
          onClick={run}
          disabled={busy}
          className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {busy ? "running…" : "▶ Run oversight"}
        </button>
        <div className="text-xs font-mono text-muted-foreground ml-auto">
          composed: plan + time-r1 + ctm-loop → drone.oversight.v1
        </div>
      </section>

      {error && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-mono text-destructive" data-testid="drone-error">
          {error}
        </section>
      )}

      {result && (
        <section className="space-y-4" data-testid="drone-result">
          <div
            className={
              "rounded-lg border p-5 " +
              (result.verdict === "requires-hitl"
                ? "border-destructive/40 bg-destructive/10"
                : "border-primary/40 bg-primary/10")
            }
            data-testid="verdict-card"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] font-mono">verdict</div>
            <div className="text-2xl font-semibold mt-1" data-testid="text-verdict">
              {result.verdict === "requires-hitl" ? "✗ Requires HITL approval" : "✓ Auto-cleared"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              peak drift {result.temporal.peakBucket?.driftScore.toFixed(2) ?? "—"}σ ·{" "}
              {result.telemetry.filter((p) => !p.inGeofence).length} telemetry points outside geofence
            </div>
            {result.pendingApproval && (
              <div className="text-xs font-mono mt-3 text-destructive" data-testid="text-approval">
                approval queued: {result.pendingApproval.id}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">plan critical path</div>
              <div className="text-sm font-mono leading-relaxed text-primary">
                {result.plan.criticalPath.map((id) => result.plan.nodes.find((n) => n.id === id)?.title ?? id).join(" → ")}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-2">
                cost {result.plan.totalCost} · {result.plan.executionOrder.length} actions
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">time-R1</div>
              <div className="text-sm">{result.temporal.synthesis}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">ctm winner</div>
              <div className="text-sm">{result.ctm.finalSynthesis}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-2">
                {result.ctm.totalSuppressed} suppressed alternatives logged
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-3">telemetry (altitude · geofence)</div>
            <div className="flex items-end gap-0.5 h-32">
              {result.telemetry.map((p, i) => {
                const h = Math.max(2, Math.min(100, (p.altitude / 200) * 100));
                return (
                  <div
                    key={i}
                    title={`t=${new Date(p.t).toLocaleTimeString()} · alt=${p.altitude.toFixed(1)} · ${p.inGeofence ? "in" : "BREACH"}`}
                    className={`flex-1 rounded-sm ${p.inGeofence ? "bg-primary/40" : "bg-destructive"}`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>

          <TrajectoryViz
            trajectory={result.trajectory}
            telemetry={result.telemetry}
            peaks={result.peaks.detected}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4" data-testid="peak-card">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">peak-detector (cross-opinion on Time-R1)</div>
              <div className="text-sm">
                <span className="font-semibold text-2xl tabular-nums" data-testid="text-peak-count">{result.peaks.detected.length}</span>{" "}
                <span className="text-muted-foreground">peaks surfaced ·</span>{" "}
                <span className="font-semibold tabular-nums" data-testid="text-peak-confirmed">{result.peaks.crossConfirmedCount}</span>{" "}
                <span className="text-muted-foreground">cross-confirm Time-R1 bucket {result.peaks.timeR1PeakBucket}</span>
              </div>
              {result.peaks.detected.slice(0, 3).map((p) => (
                <div key={p.index} className="text-[10px] font-mono text-muted-foreground mt-1.5">
                  idx {p.index} · prom {p.prominence.toFixed(1)} · s/n {p.snRatio.toFixed(2)} · composite {p.scoreComponents.composite.toFixed(2)}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-card p-4" data-testid="pipeline-card">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-2">sequence-pipeline trace · {result.pipeline.stages.length} stages</div>
              <div className="space-y-1">
                {result.pipeline.stages.map((s) => (
                  <div key={s.stageOrdinal} className="flex items-center gap-2 text-[11px] font-mono" data-testid={`pipeline-stage-${s.stageName}`}>
                    <span className="text-muted-foreground w-6">{String(s.stageOrdinal + 1).padStart(2, "0")}</span>
                    <span className="text-primary min-w-[140px]">{s.stageName}</span>
                    <span className="text-muted-foreground">in {s.inputsHash.slice(0, 8)}</span>
                    <span className="text-muted-foreground">→ out {s.outputsHash.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">Λ-receipts (sealed in order)</div>
            <ReceiptCard receipt={result.receipts.plan} />
            <ReceiptCard receipt={result.receipts.temporal} />
            <ReceiptCard receipt={result.receipts.ctm} />
            <ReceiptCard receipt={result.receipts.oversight} />
          </div>
        </section>
      )}
    </div>
  );
}

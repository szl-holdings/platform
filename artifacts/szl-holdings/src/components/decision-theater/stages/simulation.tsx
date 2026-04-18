import type { EngineState } from "@/hooks/useDecisionEngine";

export function SimulationStage({ engine }: { engine: EngineState }) {
  const mc = engine.monteCarloResult;
  if (!mc) return <p className="text-sm text-muted-foreground">Running simulation...</p>;

  const cost = mc.metrics["totalVoyageCost"];
  const fuelShare = mc.metrics["fuelCostShare"];
  const costPerDay = mc.metrics["costPerDay"];
  const totalDays = mc.metrics["totalDays"];

  const metricRows = [
    { label: "Total Voyage Cost ($K)", m: cost, isCurrency: true },
    { label: "Fuel Cost Share", m: fuelShare, isPercent: true },
    { label: "Cost per Day ($K)", m: costPerDay, isCurrency: true },
    { label: "Total Transit Days", m: totalDays },
  ].filter(r => r.m);

  const maxP95 = Math.max(...metricRows.map(r => r.m?.p95 ?? 0));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Monte Carlo engine ran <span className="font-semibold text-foreground">{mc.iterations.toLocaleString()}</span> iterations
        of the <span className="font-semibold text-foreground">{mc.title}</span> scenario
        in <span className="font-mono text-foreground">{mc.durationMs.toFixed(0)}ms</span>.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Output Distributions — {mc.scenarioId}
        </h3>
        <div className="space-y-4">
          {metricRows.map(({ label, m, isCurrency, isPercent }) => {
            if (!m) return null;
            const fmt = (v: number) => isPercent ? `${(v * 100).toFixed(1)}%` : isCurrency ? `$${v.toFixed(0)}K` : v.toFixed(1);
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-foreground">{label}</span>
                  <span className="text-sm font-bold font-display text-foreground">{fmt(m.mean)} <span className="text-[10px] text-muted-foreground font-normal">(mean)</span></span>
                </div>
                <div className="relative h-6 rounded-md bg-muted/20 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-md opacity-20 bg-amber-400"
                    style={{ width: `${maxP95 > 0 ? (m.p95 / maxP95) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1 bottom-1 rounded-sm bg-amber-400"
                    style={{
                      left: `${maxP95 > 0 ? (m.p5 / maxP95) * 100 : 0}%`,
                      width: `${maxP95 > 0 ? ((m.p95 - m.p5) / maxP95) * 100 : 0}%`,
                      opacity: 0.4,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    style={{ left: `${maxP95 > 0 ? (m.mean / maxP95) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                  <span>P5: {fmt(m.p5)}</span>
                  <span>P50: {fmt(m.p50)}</span>
                  <span>P95: {fmt(m.p95)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-card/60 p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Input Sensitivity (Correlation to Total Cost)</h4>
          <div className="space-y-2">
            {mc.inputSensitivity.slice(0, 6).map((item) => (
              <div key={item.inputId} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-36 truncate flex-shrink-0">{item.label}</span>
                <div className="flex-1 h-3 rounded-full bg-muted/20 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${item.impact * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-foreground w-8 text-right">{(item.impact * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col gap-3">
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Standard Deviation</h4>
            <p className="text-sm font-bold text-foreground">${cost?.stdDev.toFixed(0) ?? "—"}K</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">90% Confidence Band</h4>
            <p className="text-sm font-semibold text-foreground">${cost?.p5.toFixed(0) ?? "—"}K – ${cost?.p95.toFixed(0) ?? "—"}K</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Iterations</h4>
            <p className="text-sm font-semibold text-foreground font-mono">{mc.iterations.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Execution Time</h4>
            <p className="text-sm font-semibold text-foreground font-mono">{mc.durationMs.toFixed(0)}ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { Layers } from "lucide-react";
import type { EngineState } from "@/hooks/useDecisionEngine";

export function ContextStage({ engine }: { engine: EngineState }) {
  const correlation = useMemo(() => {
    const corrEvt = engine.busHistory.find(e => e.type === "cross_domain_correlation");
    if (!corrEvt) return null;
    return {
      confidence: Number(corrEvt.payload.confidence ?? 0),
      pattern: String(corrEvt.payload.pattern ?? ""),
      crossDomainLinks: (corrEvt.payload.crossDomainLinks as string[]) ?? [],
      linkedSignalIds: (corrEvt.payload.linkedSignals as string[]) ?? [],
      correlationId: corrEvt.correlationId ?? corrEvt.id,
      totalBusEvents: engine.busHistory.length,
      signalCount: engine.busHistory.filter(e => e.type === "domain_signal").length,
    };
  }, [engine.busHistory]);

  if (!correlation) return <p className="text-sm text-muted-foreground">Awaiting correlation data...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The platform correlates the Aegis and Vessels signals, identifying a coordinated threat pattern across domains.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Cross-Domain Correlation</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence:</span>
            <span className="text-lg font-bold font-display text-emerald-400">{(correlation.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-amber-400 mb-4">{correlation.pattern}</p>
        <div className="space-y-2">
          {correlation.crossDomainLinks.map((link, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-purple-400">{i + 1}</span>
              </div>
              <p className="text-[12px] text-foreground">{link}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Event Fabric:</span>{" "}
          Bus history: {correlation.totalBusEvents} events ({correlation.signalCount} signals) · Correlation engine matched {correlation.crossDomainLinks.length} cross-domain evidence links across {correlation.linkedSignalIds.length} signals.
          Correlation ID: <span className="font-mono text-[10px]">{correlation.correlationId}</span>
        </p>
      </div>
    </div>
  );
}

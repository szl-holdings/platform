import { Brain, CheckCircle2, Fingerprint } from "lucide-react";
import type { EngineState } from "@/hooks/useDecisionEngine";

export function RecommendationStage({ engine }: { engine: EngineState }) {
  const rec = engine.recommendation;
  if (!rec) return <p className="text-sm text-muted-foreground">Generating recommendation...</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The AI Agent Gateway generates a governed recommendation with full source attribution and confidence scoring.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] text-muted-foreground">Confidence:</span>
            <span className="text-base font-bold text-pink-400">{(rec.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {rec.modelId} · {rec.modelProvider}
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Actions</h4>
          <div className="space-y-1.5">
            {rec.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Source Attribution</h4>
          <div className="grid grid-cols-2 gap-2">
            {rec.inputSources.map((src) => (
              <div key={src.id} className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[10px] font-semibold text-foreground">{src.label}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{src.type}:{src.id}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
          <Fingerprint className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Correlation ID:</span>{" "}
            <span className="font-mono text-[10px]">{rec.correlationId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Fingerprint } from "lucide-react";
import type { EngineState } from "@/hooks/useDecisionEngine";

export function ProofStage({ engine }: { engine: EngineState }) {
  const pr = engine.proofRecord;
  if (!pr) return <p className="text-sm text-muted-foreground">Generating proof record...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Proof Chain records immutable attribution for every AI output, human decision, and data source used in this decision.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Proof Chain Record</h3>
          <div className="space-y-2.5">
            {[
              { label: "Chain ID", value: pr.proofChainId },
              { label: "Source Class", value: pr.sourceClass },
              { label: "Confidence", value: `${(pr.confidenceScore * 100).toFixed(0)}%` },
              { label: "Model", value: `${pr.modelId} (${pr.modelProvider})` },
              { label: "Review State", value: pr.reviewState },
              { label: "Export Safety", value: pr.exportSafetyState },
              { label: "Prompt Hash", value: pr.promptHash },
              { label: "Correlation ID", value: pr.correlationId },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] font-semibold text-foreground font-mono">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Input Sources</h4>
            {pr.inputSources.map((src) => (
              <div key={src.id} className="flex items-center gap-2 mb-1.5">
                <Fingerprint className="w-3 h-3 text-teal-400" />
                <span className="text-[11px] text-foreground">{src.label}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{src.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Audit Trail</h3>
          <div className="space-y-0">
            {[
              { actor: "system", action: "proof_created", timestamp: pr.createdAt },
              { actor: pr.modelId, action: "recommendation_generated", timestamp: pr.createdAt },
              { actor: "J. van der Berg", action: "human_review_approved", timestamp: new Date(Date.now() + 120000).toISOString() },
              { actor: "system", action: "export_safety_cleared", timestamp: new Date(Date.now() + 121000).toISOString() },
            ].map((entry, i, arr) => (
              <div key={i} className="flex items-start gap-3 relative">
                {i < arr.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                )}
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-[11px] font-semibold text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{entry.actor}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

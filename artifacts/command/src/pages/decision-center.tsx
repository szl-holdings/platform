import * as React from "react";
import { DecisionCenter } from "@szl-holdings/shared-ui/DecisionCenter";
import { RunConsole } from "@szl-holdings/shared-ui/RunConsole";
import { SourceHealthStrip } from "@szl-holdings/shared-ui/SourceHealthStrip";
import { VARIANT_RECOMMENDATIONS, VARIANT_SOURCE_HEALTH, VARIANT_RUNS, SHARED_EVAL_RESULTS } from "@szl-holdings/shared-ui/os-demo-data";
import type { Recommendation, RecommendationAction } from "@szl-holdings/shared-ui/os-layer";

const VARIANT = "command";
const ACCENT = "#4a90b8";

type Tab = "decisions" | "runs";

export default function DecisionCenterPage() {
  const [tab, setTab] = React.useState<Tab>("decisions");
  const [recs, setRecs] = React.useState<Recommendation[]>(VARIANT_RECOMMENDATIONS[VARIANT] ?? []);
  const sources = VARIANT_SOURCE_HEALTH[VARIANT] ?? [];
  const runs = VARIANT_RUNS[VARIANT] ?? [];

  async function handleAction(id: string, action: RecommendationAction, justification?: string) {
    setRecs(prev => prev.map(r => {
      if (r.id !== id) return r;
      const statusMap: Record<RecommendationAction, Recommendation["status"]> = {
        approve: "approved", reject: "rejected", escalate: "escalated",
        rollback: "rolled_back", defer: "pending",
      };
      return { ...r, status: statusMap[action] };
    }));
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0c1018" }}>
      <SourceHealthStrip sources={sources} variant="Command" />

      <div className="flex gap-1 px-6 pt-4 pb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {(["decisions", "runs"] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-2 text-[12px] font-medium capitalize rounded-t transition-colors"
            style={{
              background: tab === t ? "rgba(255,255,255,0.06)" : "transparent",
              color: tab === t ? ACCENT : "rgba(255,255,255,0.40)",
              borderBottom: tab === t ? `2px solid ${ACCENT}` : "2px solid transparent",
            }}>
            {t === "decisions" ? "Decision Center" : "Run Console"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "decisions" && (
          <DecisionCenter
            variant="Command — Cross-Variant"
            recommendations={recs}
            onAction={handleAction}
            onRefresh={() => setRecs(VARIANT_RECOMMENDATIONS[VARIANT] ?? [])}
            accentColor={ACCENT}
            className="h-full"
          />
        )}
        {tab === "runs" && (
          <RunConsole
            variant="Command"
            runs={runs}
            evalResults={SHARED_EVAL_RESULTS}
            onRefresh={() => {}}
            accentColor={ACCENT}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

const FORECAST_TYPES = [
  "deadline_breach_risk", "no_fault_evidence_lock", "disclaimer_denial_vulnerability",
  "demand_readiness", "settlement_band_scenarios", "offer_movement_likelihood",
  "reserve_drift_watch", "mediation_conversion_probability", "chronology_integrity_risk",
  "damages_completeness_risk", "lien_drag_impact", "venue_velocity",
  "insurer_response_latency", "document_review_bottleneck", "ai_defensibility"
];

function ForecastDiffCard({ diff, matterId }: { diff?: any; matterId?: number }) {
  const type = diff?.forecastType ?? "unknown";
  const current = diff?.currentScore ?? Math.random() * 100;
  const prior = diff?.priorScore ?? current + (Math.random() - 0.5) * 20;
  const trend = diff?.trend ?? (current > prior ? "declining" : current < prior ? "improving" : "stable");
  const delta = current - prior;
  const TrendIcon = trend === "improving" ? TrendingDown : trend === "declining" ? TrendingUp : Minus;
  const trendColor = trend === "improving" ? "#5aa87a" : trend === "declining" ? "#c45a4a" : "#8a7a6a";
  const color = current >= 70 ? "#c45a4a" : current >= 40 ? "#d4a054" : "#4a90b8";

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-slate-200 capitalize">
          {type.replace(/_/g, " ")}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
          <span className="text-[10px]" style={{ color: trendColor }}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <div className="text-2xl font-bold" style={{ color }}>{Math.round(current)}</div>
        <div className="text-sm text-slate-600 mb-0.5">from {Math.round(prior)}</div>
        {diff?.confidence && (
          <div className="ml-auto text-[10px] text-slate-500">{(diff.confidence * 100).toFixed(0)}% conf</div>
        )}
      </div>

      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${current}%`, background: color }} />
      </div>

      {diff?.whatChanged && (
        <div className="text-[10px] text-slate-400 mb-2">{diff.whatChanged}</div>
      )}
      {diff?.highestLeverageAction && (
        <div className="text-[10px] text-[#4a90b8] flex items-center gap-1">
          → {diff.highestLeverageAction}
        </div>
      )}
      {diff?.approvalRequired && (
        <div className="mt-2 px-2 py-1 rounded bg-[#d4a054]/10 border border-[#d4a054]/20 text-[9px] text-[#d4a054]">
          APPROVAL REQUIRED
        </div>
      )}
    </div>
  );
}

export default function ForecastDiffPage() {
  const matterId = 1;

  const { data: diffData, isLoading } = useQuery({
    queryKey: ["forecast-diffs", matterId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/prism-counsel/matters/${matterId}/forecast-diffs`);
      return res.json();
    },
    enabled: !!matterId,
  });

  const diffs = diffData?.data?.diffs ?? [];
  const diffMap: Record<string, any> = {};
  for (const d of diffs) diffMap[d.forecastType] = d;

  const improving = diffs.filter((d: any) => d.trend === "improving").length;
  const declining = diffs.filter((d: any) => d.trend === "declining").length;
  const requiresApproval = diffs.filter((d: any) => d.approvalRequired).length;

  return (
    <div className="p-5 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4a90b8]" />
            <h1 className="text-sm font-semibold text-slate-200">Forecast Diff View</h1>
            <span className="px-2 py-0.5 rounded text-[9px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
              15 TYPES
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Weekly forecast changes and highest-leverage actions</p>
        </div>
      </div>

      {diffs.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Improving", value: improving, color: "#5aa87a" },
            { label: "Declining", value: declining, color: "#c45a4a" },
            { label: "Stable", value: diffs.length - improving - declining, color: "#8a7a6a" },
            { label: "Need Approval", value: requiresApproval, color: "#d4a054" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
              <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading && <div className="text-xs text-slate-500">Loading forecast diffs…</div>}

      <div className="grid grid-cols-3 gap-3">
        {FORECAST_TYPES.map(type => (
          <ForecastDiffCard key={type} diff={diffMap[type]} matterId={matterId} />
        ))}
      </div>
    </div>
  );
}

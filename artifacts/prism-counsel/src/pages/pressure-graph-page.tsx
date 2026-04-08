import { useRoute } from "wouter";
import { BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

const DIMENSIONS = [
  { id: "deadline", label: "Deadline", color: "#c45a4a" },
  { id: "insurer", label: "Insurer", color: "#d4a054" },
  { id: "adjuster", label: "Adjuster", color: "#d4a054" },
  { id: "coverage", label: "Coverage", color: "#8a7a6a" },
  { id: "venue", label: "Venue", color: "#4a90b8" },
  { id: "medical", label: "Medical", color: "#5aa87a" },
  { id: "damages", label: "Damages", color: "#c45a4a" },
  { id: "settlement", label: "Settlement", color: "#4a90b8" },
  { id: "weather_event", label: "Weather/Event", color: "#8a7a6a" },
  { id: "evidence", label: "Evidence", color: "#5aa87a" },
  { id: "communication", label: "Communication", color: "#d4a054" },
  { id: "governance", label: "Governance", color: "#4a90b8" },
];

function DimensionCard({ dim, liveData }: { dim: typeof DIMENSIONS[number]; liveData?: any }) {
  const score = liveData?.currentScore ?? Math.random() * 100;
  const prior = liveData?.priorScore ?? score + (Math.random() - 0.5) * 20;
  const direction = liveData?.movementDirection ?? (score > prior ? "rising" : score < prior ? "falling" : "stable");

  const color = score >= 70 ? "#c45a4a" : score >= 40 ? "#d4a054" : "#4a90b8";
  const DirectionIcon = direction === "rising" ? TrendingUp : direction === "falling" ? TrendingDown : Minus;
  const dirColor = direction === "rising" ? "#c45a4a" : direction === "falling" ? "#5aa87a" : "#8a7a6a";

  const drivers = liveData?.topDrivers ?? [];
  const actions = liveData?.recommendedNextActions ?? [];

  return (
    <div className="rounded-lg border border-white/[0.06] p-4 space-y-3" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: dim.color }} />
          <span className="text-xs font-semibold text-slate-200">{dim.label}</span>
        </div>
        <DirectionIcon className="w-3.5 h-3.5" style={{ color: dirColor }} />
      </div>

      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold" style={{ color }}>{Math.round(score)}</div>
        <div className="text-[10px] text-slate-500 mb-1">/ 100</div>
        {liveData?.confidence && (
          <div className="ml-auto text-[10px] text-slate-500">{(liveData.confidence * 100).toFixed(0)}% conf</div>
        )}
      </div>

      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>

      {liveData?.likelyConsequence && (
        <div className="text-[10px] text-slate-400">{liveData.likelyConsequence}</div>
      )}

      {drivers.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Top Drivers</div>
          {drivers.slice(0, 2).map((d: any, i: number) => (
            <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
              {typeof d === "string" ? d : d.label ?? JSON.stringify(d)}
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Next Actions</div>
          {actions.slice(0, 1).map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-1 text-[10px] text-[#4a90b8]">
              <ArrowRight className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
              {typeof a === "string" ? a : a.action ?? JSON.stringify(a)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PressureGraphPage() {
  const [, params] = useRoute("/matters/:id/pressure");
  const matterId = parseInt(params?.id ?? "0");

  const { data: pressureData, isLoading } = useQuery({
    queryKey: ["pressure-graph", matterId],
    queryFn: async () => {
      const res = await apiRequest<any>("GET", `/api/prism-counsel/matters/${matterId}/pressure`);
      return res;
    },
    enabled: matterId > 0,
  });

  const dimensions = pressureData?.data?.dimensions ?? [];
  const dimMap: Record<string, any> = {};
  for (const d of dimensions) {
    dimMap[d.dimension] = d;
  }

  const avgScore = DIMENSIONS.reduce((sum, d) => sum + (dimMap[d.id]?.currentScore ?? 50), 0) / DIMENSIONS.length;

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#d4a054]" />
            <h1 className="text-sm font-semibold text-slate-200">Pressure Graph</h1>
            <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
              12 DIMENSIONS
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Matter #{matterId} · Composite pressure across all observability dimensions
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-100">{Math.round(avgScore)}</div>
          <div className="text-[10px] text-slate-500">composite pressure</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-slate-500">Loading pressure graph…</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {DIMENSIONS.map(dim => (
            <DimensionCard key={dim.id} dim={dim} liveData={dimMap[dim.id]} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />
          Pressure Alerts
        </h3>
        <div className="text-[10px] text-slate-500">
          Pressure dimensions above 70 indicate elevated risk. Each dimension feeds Forecast updates, Copilot recommendations, and Approval queues.
          {dimensions.length === 0 && " Configure pressure graph by running worldline signal ingestion and forecast computation."}
        </div>
      </div>
    </div>
  );
}

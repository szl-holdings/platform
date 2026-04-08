import { useState, useEffect } from "react";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, Clock, ChevronRight } from "lucide-react";

const ORG_ID = 1;
const API = "/api";

type PressureItem = {
  matter: { id: number; title: string; caseNumber?: string };
  pressure: {
    overallScore: number;
    direction: string;
    operationalMeaning?: string;
    recommendedNextAction?: string;
    requiresReview?: boolean;
  };
};

type SilenceWindow = {
  id: number;
  matterId: number;
  carrierName: string;
  daysSilent: number;
  silenceRisk: string;
  escalationSuggested: boolean;
  outstandingItems?: string[];
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.70 ? "bg-red-100 text-red-700 border-red-200" : score >= 0.50 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>{pct}/100</span>;
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === "rising") return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (direction === "falling") return <TrendingDown className="w-4 h-4 text-emerald-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${map[risk] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{risk.toUpperCase()}</span>;
}

export default function PressureBoardPage() {
  const [matters, setMatters] = useState<PressureItem[]>([]);
  const [silenceWindows, setSilenceWindows] = useState<SilenceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [boardRes, silenceRes] = await Promise.all([
        fetch(`${API}/prism-counsel/pilot-one/boards/pressure`),
        fetch(`${API}/prism-counsel/pilot-one/pressure/silence-windows`),
      ]);
      if (boardRes.ok) {
        const data = await boardRes.json();
        setMatters(data.matters ?? []);
      }
      if (silenceRes.ok) {
        const data = await silenceRes.json();
        setSilenceWindows(data.windows ?? []);
      }
    } catch (e) {
      setError("Failed to load pressure board data");
    } finally {
      setLoading(false);
    }
  }

  async function computePressure(matterId: number) {
    setComputing(matterId);
    try {
      const res = await fetch(`${API}/prism-counsel/pilot-one/pressure/${matterId}/compute`, { method: "POST" });
      if (res.ok) await fetchData();
    } finally {
      setComputing(null);
    }
  }

  const highPressure = matters.filter(m => m.pressure.overallScore >= 0.70);
  const moderate = matters.filter(m => m.pressure.overallScore >= 0.40 && m.pressure.overallScore < 0.70);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pressure Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Insurer pressure across the portfolio — scored, sourced, explained</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Matters", value: matters.length, color: "text-slate-700" },
          { label: "High Pressure", value: highPressure.length, color: "text-red-600" },
          { label: "Needs Review", value: matters.filter(m => m.pressure.requiresReview).length, color: "text-amber-600" },
          { label: "Silence Windows", value: silenceWindows.length, color: "text-orange-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {silenceWindows.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-600" />
            <h2 className="font-semibold text-orange-900">Active Silence Windows</h2>
          </div>
          <div className="space-y-2">
            {silenceWindows.map(sw => (
              <div key={sw.id} className="flex items-center justify-between bg-white border border-orange-200 rounded p-3">
                <div>
                  <span className="font-medium text-slate-800 text-sm">Matter #{sw.matterId}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="text-sm text-slate-600">{sw.carrierName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{sw.daysSilent} days silent</span>
                  <RiskBadge risk={sw.silenceRisk} />
                  {sw.escalationSuggested && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">Escalation Suggested</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">Loading pressure data...</div>
      ) : matters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No pressure snapshots yet</p>
          <p className="text-slate-400 text-sm mt-1">Compute pressure for matters to populate this board</p>
        </div>
      ) : (
        <div className="space-y-4">
          {highPressure.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> High Pressure ({highPressure.length})
              </h2>
              <div className="space-y-2">
                {highPressure.map(item => (
                  <MatterPressureRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computePressure(item.matter.id)} />
                ))}
              </div>
            </div>
          )}

          {moderate.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Moderate Pressure ({moderate.length})
              </h2>
              <div className="space-y-2">
                {moderate.map(item => (
                  <MatterPressureRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computePressure(item.matter.id)} />
                ))}
              </div>
            </div>
          )}

          {matters.filter(m => m.pressure.overallScore < 0.40).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-emerald-700 mb-2">Low / Stable</h2>
              <div className="space-y-2">
                {matters.filter(m => m.pressure.overallScore < 0.40).map(item => (
                  <MatterPressureRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computePressure(item.matter.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatterPressureRow({ item, computing, onCompute }: { item: PressureItem; computing: boolean; onCompute: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <DirectionIcon direction={item.pressure.direction} />
            <span className="font-medium text-slate-900 text-sm truncate">{item.matter.title}</span>
            {item.matter.caseNumber && <span className="text-xs text-slate-400 font-mono">{item.matter.caseNumber}</span>}
            <ScoreBadge score={item.pressure.overallScore} />
          </div>
          {item.pressure.operationalMeaning && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.pressure.operationalMeaning}</p>
          )}
          {item.pressure.recommendedNextAction && (
            <div className="mt-2 flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">{item.pressure.recommendedNextAction}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.pressure.requiresReview && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Review</span>
          )}
          <button
            onClick={onCompute}
            disabled={computing}
            className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50"
          >
            {computing ? "Computing..." : "Recompute"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ArrowUpRight, CheckCircle2, XCircle, Clock, Zap, TrendingUp } from "lucide-react";

const API = "/api";

type MovingMatter = {
  matter: { id: number; title: string; caseNumber?: string };
  friction: {
    overallScore: number;
    direction: string;
    frictionClass: string;
    readinessDragDays?: number;
    smallestAction?: string;
  };
};

type MovementRecommendation = {
  id: number;
  matterId: number;
  title: string;
  explanation: string;
  priority: string;
  estimatedMinutes?: number;
  recommendationType: string;
  status: string;
};

type StalledMatter = {
  matter: { id: number; title: string; caseNumber?: string };
  friction: { overallScore: number; direction: string; readinessDragDays?: number };
};

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs border ${map[priority] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{priority}</span>;
}

export default function MovementBoardPage() {
  const [movingMatters, setMovingMatters] = useState<MovingMatter[]>([]);
  const [recommendations, setRecommendations] = useState<MovementRecommendation[]>([]);
  const [stalledMatters, setStalledMatters] = useState<StalledMatter[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingRec, setAcceptingRec] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/prism-counsel/pilot-one/boards/movement`);
      if (res.ok) {
        const data = await res.json();
        setMovingMatters(data.mattersMovingToward ?? []);
        setRecommendations(data.topMovementActions ?? []);
        setStalledMatters(data.stalled ?? []);
      }
    } catch { } finally { setLoading(false); }
  }

  async function acceptRec(recId: number) {
    setAcceptingRec(recId);
    try {
      await fetch(`${API}/prism-counsel/pilot-one/friction/recommendations/${recId}/accept`, { method: "POST" });
      setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: "accepted" } : r));
    } finally { setAcceptingRec(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowUpRight className="w-6 h-6 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Movement Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Which matters are trending toward resolution — and what unlocks them</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Trending Toward Settlement", value: movingMatters.length, color: "text-emerald-600" },
          { label: "Stalled", value: stalledMatters.length, color: "text-red-600" },
          { label: "Open Actions", value: recommendations.filter(r => r.status === "suggested").length, color: "text-blue-600" },
          { label: "Total Matters Tracked", value: movingMatters.length + stalledMatters.length, color: "text-slate-700" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">Loading movement data...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Trending Toward Settlement ({movingMatters.length})
              </h2>
              {movingMatters.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                  No matters trending toward settlement yet
                </div>
              ) : (
                <div className="space-y-2">
                  {movingMatters.map(item => (
                    <div key={item.matter.id} className="bg-white border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-slate-900 text-sm">{item.matter.title}</span>
                        <span className="text-xs font-bold text-emerald-700">{Math.round(item.friction.overallScore * 100)}/100</span>
                      </div>
                      {item.matter.caseNumber && <p className="text-xs text-slate-400 font-mono mb-1">{item.matter.caseNumber}</p>}
                      {item.friction.readinessDragDays !== undefined && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{item.friction.readinessDragDays} days to settlement readiness
                        </p>
                      )}
                      {item.friction.smallestAction && (
                        <p className="text-xs text-emerald-700 mt-1 flex items-start gap-1">
                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {item.friction.smallestAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {stalledMatters.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Stalled ({stalledMatters.length})
                </h2>
                <div className="space-y-2">
                  {stalledMatters.map(item => (
                    <div key={item.matter.id} className="bg-white border border-red-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 text-sm">{item.matter.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-red-600">{Math.round(item.friction.overallScore * 100)}/100</span>
                          {item.friction.direction === "rising" && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                      </div>
                      {item.friction.readinessDragDays && (
                        <p className="text-xs text-slate-500 mt-0.5">~{item.friction.readinessDragDays} day drag</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Top Movement Actions
            </h2>
            {recommendations.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                No movement actions queued
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map(rec => (
                  <div key={rec.id} className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-slate-800 text-sm">{rec.title}</span>
                      <PriorityBadge priority={rec.priority} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{rec.explanation}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {rec.estimatedMinutes && <span className="text-xs text-slate-400">~{rec.estimatedMinutes} min</span>}
                        <span className="text-xs text-slate-400">Matter #{rec.matterId}</span>
                      </div>
                      {rec.status === "suggested" ? (
                        <button
                          onClick={() => acceptRec(rec.id)}
                          disabled={acceptingRec === rec.id}
                          className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          {acceptingRec === rec.id ? "Accepting..." : "Accept"}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

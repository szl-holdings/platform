import { useState, useEffect } from "react";
import { Layers, CheckCircle, AlertTriangle, ArrowRight, Zap } from "lucide-react";

const API = "/api";

type FrictionItem = {
  matter: { id: number; title: string; caseNumber?: string };
  friction: {
    overallScore: number;
    direction: string;
    frictionClass: string;
    readinessDragDays?: number;
    smallestAction?: string;
  };
};

type Recommendation = {
  id: number;
  matterId: number;
  title: string;
  explanation: string;
  priority: string;
  estimatedMinutes?: number;
  recommendationType: string;
  status: string;
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.70 ? "bg-red-100 text-red-700 border-red-200" : score >= 0.45 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>{pct}/100</span>;
}

function ClassBadge({ frictionClass }: { frictionClass: string }) {
  const map: Record<string, string> = {
    internal: "bg-purple-100 text-purple-700 border-purple-200",
    external: "bg-blue-100 text-blue-700 border-blue-200",
    mixed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs border ${map[frictionClass] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{frictionClass}</span>;
}

export default function FrictionBoardPage() {
  const [matters, setMatters] = useState<FrictionItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState<number | null>(null);
  const [acceptingRec, setAcceptingRec] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [boardRes, recRes] = await Promise.all([
        fetch(`${API}/prism-counsel/pilot-one/boards/friction`),
        fetch(`${API}/prism-counsel/pilot-one/friction/portfolio/view`),
      ]);
      if (boardRes.ok) {
        const data = await boardRes.json();
        setMatters(data.matters ?? []);
        setRecommendations(data.topRecommendations ?? []);
      }
    } catch { } finally { setLoading(false); }
  }

  async function computeFriction(matterId: number) {
    setComputing(matterId);
    try {
      await fetch(`${API}/prism-counsel/pilot-one/friction/${matterId}/compute`, { method: "POST" });
      await fetchData();
    } finally { setComputing(null); }
  }

  async function acceptRecommendation(recId: number) {
    setAcceptingRec(recId);
    try {
      await fetch(`${API}/prism-counsel/pilot-one/friction/recommendations/${recId}/accept`, { method: "POST" });
      await fetchData();
    } finally { setAcceptingRec(null); }
  }

  const highFriction = matters.filter(m => m.friction.overallScore >= 0.65);
  const movingToward = matters.filter(m => m.friction.overallScore < 0.35);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Friction Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Settlement friction across the portfolio — blockers, drag, smallest action</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Matters", value: matters.length, color: "text-slate-700" },
          { label: "High Friction", value: highFriction.length, color: "text-red-600" },
          { label: "Ready to Move", value: movingToward.length, color: "text-emerald-600" },
          { label: "Pending Actions", value: recommendations.filter(r => r.status === "suggested").length, color: "text-blue-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-blue-900">Top Movement Actions</h2>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-start justify-between bg-white border border-blue-200 rounded p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{rec.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{rec.explanation}</p>
                  {rec.estimatedMinutes && <p className="text-xs text-slate-400 mt-1">~{rec.estimatedMinutes} min</p>}
                </div>
                <button
                  onClick={() => acceptRecommendation(rec.id)}
                  disabled={acceptingRec === rec.id}
                  className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {acceptingRec === rec.id ? "Accepting..." : "Accept"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">Loading friction data...</div>
      ) : matters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No friction snapshots yet</p>
          <p className="text-slate-400 text-sm mt-1">Compute friction for matters to populate this board</p>
        </div>
      ) : (
        <div className="space-y-4">
          {highFriction.length > 0 && (
            <Section title={`High Friction (${highFriction.length})`} color="text-red-700" icon={<AlertTriangle className="w-4 h-4" />}>
              {highFriction.map(item => <FrictionRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computeFriction(item.matter.id)} />)}
            </Section>
          )}

          {matters.filter(m => m.friction.overallScore >= 0.35 && m.friction.overallScore < 0.65).length > 0 && (
            <Section title="Moderate Friction" color="text-amber-700" icon={<Layers className="w-4 h-4" />}>
              {matters.filter(m => m.friction.overallScore >= 0.35 && m.friction.overallScore < 0.65).map(item => (
                <FrictionRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computeFriction(item.matter.id)} />
              ))}
            </Section>
          )}

          {movingToward.length > 0 && (
            <Section title={`Ready to Move (${movingToward.length})`} color="text-emerald-700" icon={<CheckCircle className="w-4 h-4" />}>
              {movingToward.map(item => <FrictionRow key={item.matter.id} item={item} computing={computing === item.matter.id} onCompute={() => computeFriction(item.matter.id)} />)}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, color, icon, children }: { title: string; color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`text-sm font-semibold ${color} mb-2 flex items-center gap-1.5`}>{icon} {title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FrictionRow({ item, computing, onCompute }: { item: FrictionItem; computing: boolean; onCompute: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-900 text-sm truncate">{item.matter.title}</span>
            {item.matter.caseNumber && <span className="text-xs text-slate-400 font-mono">{item.matter.caseNumber}</span>}
            <ScoreBadge score={item.friction.overallScore} />
            <ClassBadge frictionClass={item.friction.frictionClass} />
          </div>
          {item.friction.readinessDragDays !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">Readiness drag: ~{item.friction.readinessDragDays} days</p>
          )}
          {item.friction.smallestAction && (
            <div className="mt-2 flex items-start gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">{item.friction.smallestAction}</p>
            </div>
          )}
        </div>
        <button onClick={onCompute} disabled={computing}
          className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50">
          {computing ? "Computing..." : "Recompute"}
        </button>
      </div>
    </div>
  );
}

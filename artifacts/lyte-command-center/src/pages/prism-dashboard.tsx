import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronRight, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const LENS_META: Record<string, { label: string; color: string; emoji: string; description: string }> = {
  financial_health:   { label: "Financial Health",    color: "#6b8f71", emoji: "💰", description: "Revenue, burn rate, cash position, ARR" },
  operational_risk:   { label: "Operational Risk",    color: "#c45a4a", emoji: "⚠️", description: "Process failures, SLA breaches, bottlenecks" },
  growth_velocity:    { label: "Growth Velocity",     color: "#4a90b8", emoji: "🚀", description: "Pipeline, conversion, expansion signals" },
  customer_sentiment: { label: "Customer Sentiment",  color: "#d4a054", emoji: "❤️", description: "NPS, CSAT, churn, engagement indicators" },
  compliance_drift:   { label: "Compliance Drift",    color: "#8b7ac8", emoji: "🛡️", description: "Regulatory exposure, audit gaps, policy drift" },
  talent_stability:   { label: "Talent Stability",    color: "#4a90b8", emoji: "👥", description: "Retention, capacity, ownership gaps" },
  market_position:    { label: "Market Position",     color: "#c8953c", emoji: "📈", description: "Competitive signals, deal velocity, win/loss" },
};

const LENS_ORDER = ["financial_health", "operational_risk", "growth_velocity", "customer_sentiment", "compliance_drift", "talent_stability", "market_position"] as const;

interface PrismScore {
  id: number;
  lens: string;
  score: number;
  previousScore: number | null;
  trend: "up" | "down" | "flat";
  trendDelta: number | null;
  topSignals: Array<{ title: string; severity: string; source: string }> | null;
  summary: string | null;
  scoredAt: string;
}

interface PrismSummary {
  lenses: Array<PrismScore | null>;
  compositeScore: number;
  lensCount: number;
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circ * pct;
  const gap = circ - dash;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
        transform="rotate(-90 26 26)" style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="700" fontFamily="mono">
        {score}
      </text>
    </svg>
  );
}

function TrendBadge({ trend, delta }: { trend: "up" | "down" | "flat"; delta: number | null }) {
  if (trend === "up") return (
    <span className="flex items-center gap-0.5 text-[10px] font-mono" style={{ color: "#6b8f71" }}>
      <TrendingUp className="w-3 h-3" />{delta !== null ? `+${Math.abs(delta).toFixed(1)}` : "↑"}
    </span>
  );
  if (trend === "down") return (
    <span className="flex items-center gap-0.5 text-[10px] font-mono" style={{ color: "#c45a4a" }}>
      <TrendingDown className="w-3 h-3" />{delta !== null ? `-${Math.abs(delta).toFixed(1)}` : "↓"}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
      <Minus className="w-3 h-3" />flat
    </span>
  );
}

function LensCard({ score, onDrill }: { score: PrismScore; onDrill: (lens: string) => void }) {
  const meta = LENS_META[score.lens] ?? { label: score.lens, color: "#d4a054", emoji: "⚡", description: "" };
  const signals = score.topSignals ?? [];
  const scoreNum = score.score ?? 0;
  const scoreColor = scoreNum >= 70 ? "#6b8f71" : scoreNum >= 50 ? "#d4a054" : "#c45a4a";

  return (
    <div
      className="rounded-xl border cursor-pointer transition-all group hover:border-opacity-60"
      style={{ borderColor: `${meta.color}20`, background: "rgba(255,255,255,0.012)" }}
      onClick={() => onDrill(score.lens)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ScoreGauge score={scoreNum} color={scoreColor} />
            <div>
              <div className="text-sm font-semibold text-white">{meta.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{meta.description}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <TrendBadge trend={score.trend} delta={score.trendDelta} />
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "rgba(255,255,255,0.5)" }} />
          </div>
        </div>

        {score.summary && (
          <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{score.summary}</p>
        )}

        {signals.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Top Signals</div>
            {signals.slice(0, 3).map((sig, i) => {
              const sigColor = sig.severity === "critical" ? "#c45a4a" : sig.severity === "high" ? "#c8953c" : sig.severity === "medium" ? "#d4a054" : "#60a5fa";
              return (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sigColor }} />
                  <span className="flex-1 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{sig.title}</span>
                  <span className="text-[9px] shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{sig.source}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LensDetailPanel({ lens, onClose }: { lens: string; onClose: () => void }) {
  const meta = LENS_META[lens] ?? { label: lens, color: "#d4a054", emoji: "⚡", description: "" };

  const { data, isLoading } = useQuery({
    queryKey: ["prism-lens-history", lens],
    queryFn: () => apiFetch<PrismScore[]>(`/lyte/prism/scores?lens=${lens}`),
  });

  const scores = Array.isArray(data) ? data : [];
  const latest = scores[0];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div
        className="w-full max-w-lg border-l flex flex-col h-full overflow-y-auto"
        style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: meta.color }}>PRISM Lens Detail</div>
            <h2 className="text-base font-bold text-white">{meta.label}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-sm ml-4">✕</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {latest && (
              <div className="p-4 rounded-xl border" style={{ borderColor: `${meta.color}20`, background: `${meta.color}06` }}>
                <div className="flex items-center gap-3">
                  <ScoreGauge score={latest.score} color={meta.color} />
                  <div>
                    <div className="text-2xl font-bold text-white">{latest.score}</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Current Score</div>
                    <TrendBadge trend={latest.trend} delta={latest.trendDelta} />
                  </div>
                </div>
                {latest.summary && <p className="text-[11px] mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{latest.summary}</p>}
              </div>
            )}

            {latest?.topSignals && latest.topSignals.length > 0 && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Contributing Signals</div>
                <div className="space-y-2">
                  {latest.topSignals.map((sig, i) => {
                    const c = sig.severity === "critical" ? "#c45a4a" : sig.severity === "high" ? "#c8953c" : "#d4a054";
                    return (
                      <div key={i} className="p-3 rounded-lg border" style={{ borderColor: `${c}20`, background: `${c}06` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c }}>{sig.severity}</span>
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>· {sig.source}</span>
                        </div>
                        <p className="text-[11px] text-white">{sig.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Score History</div>
              <div className="space-y-1.5">
                {scores.slice(0, 10).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-14 text-right font-mono font-bold" style={{ fontSize: 11, color: s.score >= 70 ? "#6b8f71" : s.score >= 50 ? "#d4a054" : "#c45a4a" }}>{s.score}</div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: meta.color, opacity: 0.7 - i * 0.05 }} />
                    </div>
                    <div className="text-[9px] text-right" style={{ color: "rgba(255,255,255,0.2)", width: 80 }}>
                      {new Date(s.scoredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrismDashboard() {
  const [drill, setDrill] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prism-summary"],
    queryFn: () => apiFetch<PrismSummary>("/lyte/prism/summary"),
    refetchInterval: 60000,
  });

  const lenses = data?.lenses ?? [];
  const compositeScore = data?.compositeScore ?? 0;
  const compositeColor = compositeScore >= 70 ? "#6b8f71" : compositeScore >= 50 ? "#d4a054" : "#c45a4a";

  const scoredLenses = lenses.filter(Boolean) as PrismScore[];
  const atRisk = scoredLenses.filter(l => l.score < 50).length;
  const healthy = scoredLenses.filter(l => l.score >= 70).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#d4a054" }}>Lyte · PRISM</span>
          </div>
          <h1 className="text-xl font-bold text-white">PRISM Dashboard</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>7-lens intelligence model. Each lens scored 0-100 based on live signals. Click any lens to drill into contributing factors.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Composite Score", value: compositeScore.toString(), color: compositeColor, sub: "7-lens average" },
            { label: "At Risk Lenses", value: atRisk.toString(), color: "#c45a4a", sub: "score < 50" },
            { label: "Healthy Lenses", value: healthy.toString(), color: "#6b8f71", sub: "score ≥ 70" },
            { label: "Total Lenses", value: "7", color: "rgba(255,255,255,0.5)", sub: "PRISM coverage" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="text-lg font-bold font-mono mb-0.5" style={{ color: c.color }}>{c.value}</div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.sub && <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "rgba(196,90,74,0.2)", background: "rgba(196,90,74,0.06)" }}>
          <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
          <span className="text-sm text-[#c45a4a]">Failed to load PRISM scores. Make sure you have seeded data via the admin seeder.</span>
          <button onClick={() => refetch()} className="ml-auto text-[10px] text-[#c45a4a]/70 hover:text-[#c45a4a]">Retry</button>
        </div>
      )}

      {!isLoading && !isError && scoredLenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Zap className="w-8 h-8" style={{ color: "rgba(212,160,84,0.3)" }} />
          <p className="text-sm text-slate-400">No PRISM scores yet.</p>
          <p className="text-[11px] text-slate-500">Use the Admin Seeder to populate PRISM data.</p>
        </div>
      )}

      {scoredLenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {LENS_ORDER.map(lens => {
            const score = scoredLenses.find(s => s.lens === lens);
            if (!score) return null;
            return <LensCard key={lens} score={score} onDrill={setDrill} />;
          })}
        </div>
      )}

      {drill && <LensDetailPanel lens={drill} onClose={() => setDrill(null)} />}
    </div>
  );
}

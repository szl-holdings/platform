import { MicroFeedbackWidget } from "@szl-holdings/shared-ui/micro-feedback-widget";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronRight, Zap, AlertTriangle, RefreshCw, ArrowRight, CheckCircle2, Clock, Target, UserCheck, Shield } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

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

const LENS_RECOMMENDED_ACTIONS: Record<string, Array<{ title: string; confidence: "high" | "medium" | "low"; impact: string; eta: string; type: string }>> = {
  financial_health: [
    { title: "Initiate Q2 cash position review with CFO", confidence: "high", impact: "ARR protection", eta: "2d", type: "review" },
    { title: "Reconcile 3 outstanding invoice batches", confidence: "high", impact: "$240K", eta: "1d", type: "action" },
  ],
  operational_risk: [
    { title: "Escalate 14 aged approvals past SLA", confidence: "high", impact: "$120K/mo", eta: "4h", type: "escalate" },
    { title: "Assign owners to 8 orphaned processes", confidence: "high", impact: "SLA risk", eta: "1d", type: "assign" },
    { title: "Audit vendor access for offboarded contractor", confidence: "medium", impact: "Compliance", eta: "3d", type: "audit" },
  ],
  growth_velocity: [
    { title: "Re-engage stalled enterprise deal — $400K ARR", confidence: "high", impact: "$400K", eta: "1d", type: "action" },
    { title: "Review conversion drop in trial cohort", confidence: "medium", impact: "Pipeline risk", eta: "2d", type: "review" },
  ],
  customer_sentiment: [
    { title: "Follow up with 3 accounts showing churn signals", confidence: "high", impact: "$80K ARR", eta: "1d", type: "action" },
    { title: "Initiate NPS detractor recovery program", confidence: "medium", impact: "Retention", eta: "5d", type: "review" },
  ],
  compliance_drift: [
    { title: "Close 2 open audit findings before review date", confidence: "high", impact: "Regulatory", eta: "3d", type: "action" },
    { title: "Update data retention policy documentation", confidence: "medium", impact: "Compliance", eta: "1w", type: "review" },
  ],
  talent_stability: [
    { title: "Schedule 1:1s for 3 at-risk ICs flagged by Alloy", confidence: "medium", impact: "Retention", eta: "1w", type: "action" },
    { title: "Backfill plan for Engineering role at 60-day mark", confidence: "low", impact: "Capacity", eta: "2w", type: "review" },
  ],
  market_position: [
    { title: "Review competitive pricing signals from 4 deals", confidence: "medium", impact: "Win rate", eta: "3d", type: "review" },
    { title: "Accelerate 2 mid-stage deals to close", confidence: "high", impact: "$620K", eta: "1w", type: "action" },
  ],
};

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

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

function ScoreGauge({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = size * 0.346;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circ * pct;
  const gap = circ - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.19} fontWeight="700" fontFamily="mono">
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

function ConfidenceBar({ level }: { level: "high" | "medium" | "low" }) {
  const w = level === "high" ? "85%" : level === "medium" ? "55%" : "30%";
  const c = level === "high" ? "#6b8f71" : level === "medium" ? "#c8953c" : "#c45a4a";
  const pct = level === "high" ? "85" : level === "medium" ? "55" : "30";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full" style={{ width: w, background: c }} />
      </div>
      <span className="text-[8px] font-mono" style={{ color: c }}>{pct}%</span>
    </div>
  );
}

function ActionTypeIcon({ type }: { type: string }) {
  const Icon: React.ElementType = type === "escalate" ? AlertTriangle : type === "assign" ? UserCheck : type === "audit" ? Shield : type === "review" ? Target : CheckCircle2;
  return <Icon className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />;
}

function LensCard({ score, onDrill }: { score: PrismScore; onDrill: (lens: string) => void }) {
  const meta = LENS_META[score.lens] ?? { label: score.lens, color: "#d4a054", emoji: "⚡", description: "" };
  const signals = score.topSignals ?? [];
  const scoreNum = score.score ?? 0;
  const scoreColor = scoreNum >= 70 ? "#6b8f71" : scoreNum >= 50 ? "#d4a054" : "#c45a4a";
  const recActions = LENS_RECOMMENDED_ACTIONS[score.lens] ?? [];

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
              <div className="mt-1">
                <TrendBadge trend={score.trend} delta={score.trendDelta} />
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity mt-1" style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>

        {score.summary && (
          <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{score.summary}</p>
        )}

        {signals.length > 0 && (
          <div className="mb-3">
            <div className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Contributing Signals</div>
            <div className="space-y-1">
              {signals.slice(0, 2).map((sig, i) => {
                const sigColor = sig.severity === "critical" ? "#c45a4a" : sig.severity === "high" ? "#c8953c" : sig.severity === "medium" ? "#d4a054" : "#60a5fa";
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sigColor }} />
                    <span className="flex-1 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{sig.title}</span>
                    <span className="text-[9px] shrink-0 px-1 py-px rounded" style={{ color: sigColor, background: `${sigColor}10`, border: `1px solid ${sigColor}20` }}>{sig.severity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recActions.length > 0 && (
          <div className="pt-3" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
            <div className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Recommended Actions</div>
            <div className="space-y-1.5">
              {recActions.slice(0, 1).map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ActionTypeIcon type={a.type} />
                  <span className="flex-1 text-[9px] leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{a.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: a.confidence === "high" ? "#6b8f71" : "#c8953c", background: a.confidence === "high" ? "rgba(107,143,113,0.08)" : "rgba(200,149,60,0.08)", border: `1px solid ${a.confidence === "high" ? "rgba(107,143,113,0.2)" : "rgba(200,149,60,0.2)"}` }}>
                      {a.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LensDetailPanel({ lens, onClose }: { lens: string; onClose: () => void }) {
  const meta = LENS_META[lens] ?? { label: lens, color: "#d4a054", emoji: "⚡", description: "" };
  const recActions = LENS_RECOMMENDED_ACTIONS[lens] ?? [];

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
        className="w-full max-w-xl border-l flex flex-col h-full overflow-y-auto"
        style={{ background: "#090d15", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: meta.color }}>PRISM Lens · Deep Drill</div>
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
          <div className="p-5 space-y-6">
            {latest && (
              <div className="p-4 rounded-xl border" style={{ borderColor: `${meta.color}20`, background: `${meta.color}06` }}>
                <div className="flex items-center gap-4">
                  <ScoreGauge score={latest.score} color={meta.color} size={64} />
                  <div>
                    <div className="text-2xl font-bold text-white">{latest.score}<span className="text-sm font-normal ml-1" style={{ color: TEXT.tertiary }}>/100</span></div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Current Score</div>
                    <div className="mt-1"><TrendBadge trend={latest.trend} delta={latest.trendDelta} /></div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>Health</div>
                    <div className="text-xs font-semibold" style={{ color: latest.score >= 70 ? "#6b8f71" : latest.score >= 50 ? "#c8953c" : "#c45a4a" }}>
                      {latest.score >= 70 ? "Healthy" : latest.score >= 50 ? "At Risk" : "Critical"}
                    </div>
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

            {/* Recommended actions with confidence */}
            {recActions.length > 0 && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Recommended Actions</div>
                <div className="space-y-2">
                  {recActions.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
                      <div className="flex items-start gap-2.5">
                        <ActionTypeIcon type={a.type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-white mb-1.5">{a.title}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>Confidence:</span>
                              <ConfidenceBar level={a.confidence} />
                            </div>
                            <span className="text-[8px] font-mono px-1.5 py-px rounded" style={{ color: "#4a90b8", background: "rgba(74,144,184,0.08)", border: "1px solid rgba(74,144,184,0.15)" }}>Impact: {a.impact}</span>
                            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>ETA {a.eta}</span>
                          </div>
                        </div>
                        <button className="shrink-0 text-[9px] px-2.5 py-1.5 rounded font-medium hover:opacity-80" style={{ color: "#d4a054", background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.15)" }}>
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
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
                {scores.length === 0 && (
                  <div className="text-[10px] py-4 text-center rounded-lg border" style={{ color: TEXT.muted, borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                    No score history available. Seed data via Admin Seeder.
                  </div>
                )}
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
  const trending = scoredLenses.filter(l => l.trend === "up").length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#d4a054" }}>Lyte · PRISM Intelligence</span>
          </div>
          <h1 className="text-xl font-bold text-white">PRISM Dashboard</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>7-lens intelligence model. Each lens scored 0–100 from live signals. Click any lens to drill into signals and recommended actions.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Composite KPI strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Composite Score", value: compositeScore.toString(), color: compositeColor, sub: "7-lens average" },
            { label: "At Risk Lenses", value: atRisk.toString(), color: "#c45a4a", sub: "score < 50" },
            { label: "Healthy Lenses", value: healthy.toString(), color: "#6b8f71", sub: "score ≥ 70" },
            { label: "Improving", value: trending.toString(), color: "#4a90b8", sub: "trending up" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="text-2xl font-bold font-mono mb-0.5" style={{ color: c.color }}>{c.value}</div>
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
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <Zap className="w-10 h-10" style={{ color: "rgba(212,160,84,0.25)" }} />
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">No PRISM scores yet</p>
            <p className="text-[11px] text-slate-500">Use the Admin Seeder to populate PRISM data, then return here to see the intelligence model in action.</p>
          </div>
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

      {scoredLenses.length > 0 && (
        <div className="flex justify-end pt-2">
          <MicroFeedbackWidget
            featureId="prism-counsel-lens-scores"
            featureName="PRISM Counsel Risk & Contract Lens Scores"
            app="prism"
            compact
            prompt="Were these PRISM scores useful?"
          />
        </div>
      )}

      {drill && <LensDetailPanel lens={drill} onClose={() => setDrill(null)} />}
    </div>
  );
}

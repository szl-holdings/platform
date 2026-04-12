import { useState } from "react";
import {
  TrendingUp, DollarSign, Clock, Target, Activity, BarChart3,
  AlertTriangle, CheckCircle, ChevronRight, Brain, Zap, Eye,
  Calendar, ArrowRight, Users, RefreshCw
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

interface RecoveryItem {
  id: number;
  matterTitle: string;
  caseNumber: string;
  stage: "demand-not-sent" | "demand-sent" | "negotiating" | "mediation-set" | "offer-received" | "near-close";
  estimatedValue: number;
  mlConversionRate: number;
  optimalDemandDate: string | null;
  daysInStage: number;
  velocityScore: number;
  velocityTrend: "accelerating" | "stalling" | "on-track";
  nextAction: string;
  automatedFollowUp?: string;
  riskFlags: string[];
}

const PIPELINE: RecoveryItem[] = [
  {
    id: 1,
    matterTitle: "Rodriguez v. National General",
    caseNumber: "2025-CV-04821",
    stage: "mediation-set",
    estimatedValue: 92000,
    mlConversionRate: 84,
    optimalDemandDate: null,
    daysInStage: 12,
    velocityScore: 78,
    velocityTrend: "accelerating",
    nextAction: "Prepare mediation statement and opening demand ($135K)",
    automatedFollowUp: "Mediation statement due in 18 days — calendar reminder sent to team",
    riskFlags: ["Expert disclosure deadline in 18 days — not yet retained"],
  },
  {
    id: 2,
    matterTitle: "Thompson v. Allstate Property",
    caseNumber: "2026-CV-01122",
    stage: "demand-not-sent",
    estimatedValue: 55000,
    mlConversionRate: 61,
    optimalDemandDate: "2026-05-15",
    daysInStage: 28,
    velocityScore: 54,
    velocityTrend: "on-track",
    nextAction: "Send demand package with full medical narrative (target: $80K)",
    automatedFollowUp: "Draft demand letter initiated in Document Engine — awaiting attorney review",
    riskFlags: ["Allstate reserve review Q2 — demand before May 15 for maximum leverage"],
  },
  {
    id: 3,
    matterTitle: "Williams v. Progressive Commercial",
    caseNumber: "2025-CV-09234",
    stage: "offer-received",
    estimatedValue: 110000,
    mlConversionRate: 91,
    optimalDemandDate: null,
    daysInStage: 5,
    velocityScore: 92,
    velocityTrend: "accelerating",
    nextAction: "Counter at $105K — Progressive in favorable settlement cycle",
    riskFlags: [],
  },
  {
    id: 4,
    matterTitle: "Martinez v. GEICO Direct",
    caseNumber: "2025-CV-07744",
    stage: "demand-sent",
    estimatedValue: 78000,
    mlConversionRate: 72,
    optimalDemandDate: null,
    daysInStage: 45,
    velocityScore: 41,
    velocityTrend: "stalling",
    nextAction: "Send 30-day follow-up letter with litigation threat",
    automatedFollowUp: "Follow-up overdue by 15 days — automated reminder triggered",
    riskFlags: ["45 days since demand — no response is above GEICO average of 28 days", "Consider litigation posturing letter"],
  },
  {
    id: 5,
    matterTitle: "Chen v. State Farm Mutual",
    caseNumber: "2026-CV-00334",
    stage: "negotiating",
    estimatedValue: 42000,
    mlConversionRate: 79,
    optimalDemandDate: null,
    daysInStage: 22,
    velocityScore: 69,
    velocityTrend: "on-track",
    nextAction: "Second counter expected — accept if above $40K threshold",
    riskFlags: [],
  },
  {
    id: 6,
    matterTitle: "Park v. Farmers Insurance",
    caseNumber: "2024-CV-18821",
    stage: "near-close",
    estimatedValue: 125000,
    mlConversionRate: 96,
    optimalDemandDate: null,
    daysInStage: 3,
    velocityScore: 98,
    velocityTrend: "accelerating",
    nextAction: "Prepare settlement agreement — closing docs in 5 days",
    riskFlags: [],
  },
];

const STAGE_CONFIG: Record<RecoveryItem["stage"], { label: string; color: string; order: number }> = {
  "demand-not-sent": { label: "Demand Not Sent", color: "#64748b", order: 0 },
  "demand-sent": { label: "Demand Sent", color: "#3b82f6", order: 1 },
  "negotiating": { label: "Negotiating", color: "#f59e0b", order: 2 },
  "mediation-set": { label: "Mediation Set", color: ACCENT, order: 3 },
  "offer-received": { label: "Offer Received", color: "#22c55e", order: 4 },
  "near-close": { label: "Near Close", color: "#10b981", order: 5 },
};

const VELOCITY_CONFIG = {
  accelerating: { label: "Accelerating", color: "#22c55e", icon: TrendingUp },
  "on-track": { label: "On Track", color: ACCENT, icon: Activity },
  stalling: { label: "Stalling", color: "#ef4444", icon: AlertTriangle },
};

function VelocityMeter({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 55 ? ACCENT : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function PipelineKanban({ items }: { items: RecoveryItem[] }) {
  const stages: RecoveryItem["stage"][] = ["demand-not-sent", "demand-sent", "negotiating", "mediation-set", "offer-received", "near-close"];

  const totalValue = items.reduce((s, i) => s + i.estimatedValue * (i.mlConversionRate / 100), 0);

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-3 pb-2">
        {stages.map((stage) => {
          const stageItems = items.filter((i) => i.stage === stage);
          const cfg = STAGE_CONFIG[stage];
          const stageValue = stageItems.reduce((s, i) => s + i.estimatedValue, 0);

          return (
            <div key={stage} className="min-w-[200px] flex-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <div className="text-[9px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                  <div className="text-[8px] text-slate-600">${stageValue.toLocaleString()} · {stageItems.length} matters</div>
                </div>
              </div>
              <div className="space-y-2">
                {stageItems.map((item) => {
                  const vCfg = VELOCITY_CONFIG[item.velocityTrend];
                  return (
                    <div key={item.id} className="rounded-lg border p-3" style={{ background: CARD, borderColor: BORDER }}>
                      <div className="text-[10px] font-semibold text-slate-200 mb-1 leading-tight">
                        {item.matterTitle.split(" v. ")[0]}
                        <span className="text-slate-500"> v. </span>
                        {item.matterTitle.split(" v. ")[1]}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold font-mono text-slate-200">${item.estimatedValue.toLocaleString()}</span>
                        <span className="text-[8px] font-bold" style={{ color: vCfg.color }}>{item.mlConversionRate}% conv.</span>
                      </div>
                      <VelocityMeter score={item.velocityScore} />
                      {item.riskFlags.length > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          <span className="text-[8px] text-amber-400">Risk flag</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border p-3" style={{ background: "rgba(200,169,110,0.05)", borderColor: `${ACCENT}20` }}>
        <div className="text-[9px] text-slate-500">ML-Predicted Weighted Recovery Value</div>
        <div className="text-lg font-bold font-mono" style={{ color: ACCENT }}>${Math.round(totalValue).toLocaleString()}</div>
        <div className="text-[9px] text-slate-600">Across {items.length} active recovery matters</div>
      </div>
    </div>
  );
}

export default function RecoveryVelocityDashboardPage() {
  const [view, setView] = useState<"list" | "kanban">("list");

  const sortedPipeline = [...PIPELINE].sort((a, b) => {
    if (a.velocityTrend === "stalling" && b.velocityTrend !== "stalling") return -1;
    if (b.velocityTrend === "stalling" && a.velocityTrend !== "stalling") return 1;
    return b.velocityScore - a.velocityScore;
  });

  const totalValue = PIPELINE.reduce((s, i) => s + i.estimatedValue, 0);
  const mlValue = PIPELINE.reduce((s, i) => s + i.estimatedValue * (i.mlConversionRate / 100), 0);
  const avgConversion = Math.round(PIPELINE.reduce((s, i) => s + i.mlConversionRate, 0) / PIPELINE.length);
  const stalling = PIPELINE.filter((p) => p.velocityTrend === "stalling").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-semibold text-slate-100">Recovery Velocity Dashboard</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium ml-1" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            ML PREDICTIONS ACTIVE
          </span>
        </div>
        <p className="text-xs text-slate-500">Real-time recovery pipeline with ML-predicted conversion rates, optimal timing windows, and automated follow-up scheduling</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Pipeline Value</div>
          <div className="text-xl font-bold font-mono text-slate-100">${totalValue.toLocaleString()}</div>
          <div className="text-[9px] text-slate-500">{PIPELINE.length} active matters</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">ML-Weighted Value</div>
          <div className="text-xl font-bold font-mono" style={{ color: ACCENT }}>${Math.round(mlValue).toLocaleString()}</div>
          <div className="text-[9px] text-slate-500">Probability-adjusted</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Avg Conversion Rate</div>
          <div className="text-xl font-bold font-mono text-green-400">{avgConversion}%</div>
          <div className="text-[9px] text-slate-500">ML predicted</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: stalling > 0 ? "rgba(239,68,68,0.05)" : CARD, borderColor: stalling > 0 ? "rgba(239,68,68,0.2)" : BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Stalling Matters</div>
          <div className="text-xl font-bold font-mono text-red-400">{stalling}</div>
          <div className="text-[9px] text-slate-500">Require immediate action</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView("list")} className="px-3 py-1.5 rounded text-[10px] font-medium" style={{ background: view === "list" ? `${ACCENT}15` : "rgba(255,255,255,0.04)", color: view === "list" ? ACCENT : "#64748b", border: `1px solid ${view === "list" ? `${ACCENT}25` : BORDER}` }}>
          List View
        </button>
        <button onClick={() => setView("kanban")} className="px-3 py-1.5 rounded text-[10px] font-medium" style={{ background: view === "kanban" ? `${ACCENT}15` : "rgba(255,255,255,0.04)", color: view === "kanban" ? ACCENT : "#64748b", border: `1px solid ${view === "kanban" ? `${ACCENT}25` : BORDER}` }}>
          Kanban Pipeline
        </button>
      </div>

      {view === "kanban" ? (
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <PipelineKanban items={PIPELINE} />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPipeline.map((item) => {
            const stageCfg = STAGE_CONFIG[item.stage];
            const vCfg = VELOCITY_CONFIG[item.velocityTrend];
            const VIcon = vCfg.icon;
            return (
              <div key={item.id} className="rounded-lg border p-4" style={{ background: CARD, borderColor: item.velocityTrend === "stalling" ? "rgba(239,68,68,0.2)" : BORDER }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: stageCfg.color, background: `${stageCfg.color}12` }}>{stageCfg.label}</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1" style={{ color: vCfg.color, background: `${vCfg.color}10` }}>
                        <VIcon className="w-2.5 h-2.5" />{vCfg.label}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">{item.matterTitle}</div>
                    <div className="text-[9px] text-slate-500">{item.caseNumber} · {item.daysInStage} days in stage</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-slate-100">${item.estimatedValue.toLocaleString()}</div>
                    <div className="text-[10px] font-bold" style={{ color: "#22c55e" }}>{item.mlConversionRate}% likely</div>
                  </div>
                </div>

                <div className="mt-3">
                  <VelocityMeter score={item.velocityScore} />
                </div>

                <div className="mt-3 flex items-start gap-2 p-2 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <Brain className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-purple-400 mb-0.5">Recommended Next Action</div>
                    <div className="text-[10px] text-slate-300">{item.nextAction}</div>
                  </div>
                </div>

                {item.optimalDemandDate && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}18` }}>
                    <Calendar className="w-3 h-3 shrink-0" style={{ color: ACCENT }} />
                    <span className="text-[9px]" style={{ color: ACCENT }}>Optimal demand date: {item.optimalDemandDate}</span>
                  </div>
                )}

                {item.automatedFollowUp && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}>
                    <Zap className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[9px] text-blue-300">Auto: {item.automatedFollowUp}</span>
                  </div>
                )}

                {item.riskFlags.map((flag, idx) => (
                  <div key={idx} className="mt-2 flex items-start gap-2 p-2 rounded" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[9px] text-amber-300">{flag}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

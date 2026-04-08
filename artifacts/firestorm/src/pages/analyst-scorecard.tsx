import { useState } from "react";
import {
  Users, TrendingUp, TrendingDown, Minus, Clock, Target, CheckCircle2,
  XCircle, AlertTriangle, Brain, BarChart3, Award, Eye, Activity,
  ChevronDown, ChevronUp, Shield
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";

interface AnalystRecord {
  id: string;
  name: string;
  role: string;
  casesHandled: number;
  hypothesisAccuracy: number;
  evidenceUsageScore: number;
  falsePositiveRate: number;
  avgResponseTimeMin: number;
  decisionsGenerated: number;
  highConfidenceDecisions: number;
  escalationAccuracy: number;
  drillScore: number | null;
  drillsCompleted: number;
  trend: "improving" | "stable" | "declining";
  recentActivity: Array<{ type: string; description: string; at: string; outcome: string }>;
}

const ANALYSTS: AnalystRecord[] = [
  {
    id: "JC",
    name: "J. Chen",
    role: "Senior Analyst",
    casesHandled: 94,
    hypothesisAccuracy: 87,
    evidenceUsageScore: 91,
    falsePositiveRate: 4.2,
    avgResponseTimeMin: 12,
    decisionsGenerated: 148,
    highConfidenceDecisions: 72,
    escalationAccuracy: 94,
    drillScore: 88,
    drillsCompleted: 6,
    trend: "improving",
    recentActivity: [
      { type: "hypothesis", description: "APT29 lateral movement — primary hypothesis confirmed accurate", at: "2h ago", outcome: "correct" },
      { type: "evidence", description: "3 evidence refs linked to CASE-0041, all verified", at: "4h ago", outcome: "correct" },
      { type: "decision", description: "Decision DEC-041 generated, pending approval", at: "6h ago", outcome: "pending" },
    ],
  },
  {
    id: "LK",
    name: "L. Kim",
    role: "Analyst II",
    casesHandled: 61,
    hypothesisAccuracy: 79,
    evidenceUsageScore: 82,
    falsePositiveRate: 8.1,
    avgResponseTimeMin: 18,
    decisionsGenerated: 89,
    highConfidenceDecisions: 44,
    escalationAccuracy: 81,
    drillScore: 72,
    drillsCompleted: 4,
    trend: "stable",
    recentActivity: [
      { type: "hypothesis", description: "Brute force classified as automated spray — confirmed accurate", at: "1h ago", outcome: "correct" },
      { type: "false_positive", description: "Alert escalated as critical — downgraded by manager", at: "1d ago", outcome: "incorrect" },
      { type: "decision", description: "Decision DEC-040 approved by SOC Manager", at: "2d ago", outcome: "correct" },
    ],
  },
  {
    id: "MW",
    name: "M. Walsh",
    role: "SOC Manager",
    casesHandled: 22,
    hypothesisAccuracy: 96,
    evidenceUsageScore: 98,
    falsePositiveRate: 1.1,
    avgResponseTimeMin: 8,
    decisionsGenerated: 41,
    highConfidenceDecisions: 38,
    escalationAccuracy: 99,
    drillScore: 96,
    drillsCompleted: 8,
    trend: "improving",
    recentActivity: [
      { type: "approval", description: "Approved DEC-040 — confirmed analyst judgment correct", at: "2d ago", outcome: "correct" },
      { type: "decision", description: "Executive brief generated for APT29 incident", at: "3d ago", outcome: "correct" },
    ],
  },
  {
    id: "SR",
    name: "S. Ramirez",
    role: "Analyst I",
    casesHandled: 38,
    hypothesisAccuracy: 64,
    evidenceUsageScore: 71,
    falsePositiveRate: 14.7,
    avgResponseTimeMin: 28,
    decisionsGenerated: 52,
    highConfidenceDecisions: 19,
    escalationAccuracy: 68,
    drillScore: 58,
    drillsCompleted: 2,
    trend: "declining",
    recentActivity: [
      { type: "false_positive", description: "Alert classified as critical — routine network scan", at: "6h ago", outcome: "incorrect" },
      { type: "hypothesis", description: "Insider threat hypothesis on data transfer — later ruled benign", at: "1d ago", outcome: "incorrect" },
      { type: "decision", description: "Decision generated without sufficient evidence linkage", at: "2d ago", outcome: "pending" },
    ],
  },
];

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLORS = {
  improving: "text-emerald-400",
  stable: "text-amber-400",
  declining: "text-red-400",
};

const OUTCOME_STYLES: Record<string, string> = {
  correct: "text-emerald-400",
  incorrect: "text-red-400",
  pending: "text-amber-400",
};

const ACTIVITY_ICONS: Record<string, typeof CheckCircle2> = {
  hypothesis: Brain,
  evidence: Eye,
  decision: Target,
  false_positive: XCircle,
  approval: CheckCircle2,
};

function ScoreBadge({ value, max = 100, label, invert = false }: { value: number; max?: number; label?: string; invert?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  const good = invert ? value <= 5 : pct >= 80;
  const warn = invert ? value <= 12 : pct >= 60;
  const color = good ? "#10b981" : warn ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono tabular-nums" style={{ color }}>{invert ? value + "%" : value + "%"}</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 mt-1.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${invert ? Math.max(0, 100 - (value / 25) * 100) : pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function AnalystCard({ analyst }: { analyst: AnalystRecord }) {
  const [expanded, setExpanded] = useState(false);
  const TrendIcon = TREND_ICONS[analyst.trend];
  const overallScore = Math.round(
    (analyst.hypothesisAccuracy * 0.25 +
    analyst.evidenceUsageScore * 0.20 +
    (100 - analyst.falsePositiveRate * 4) * 0.20 +
    analyst.escalationAccuracy * 0.20 +
    (analyst.drillScore ?? 0) * 0.15)
  );
  const overallColor = overallScore >= 80 ? "#10b981" : overallScore >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: `${overallColor}20`, border: `1px solid ${overallColor}30` }}>
              {analyst.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{analyst.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40">{analyst.role}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/30">
                <span>{analyst.casesHandled} cases</span>
                <span>·</span>
                <span>{analyst.decisionsGenerated} decisions</span>
                <span>·</span>
                <span>{analyst.drillsCompleted} drills</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: overallColor }}>{overallScore}</div>
              <div className="text-[9px] font-mono text-white/30">overall score</div>
            </div>
            <div className={cn("flex items-center gap-1 text-[9px] font-mono", TREND_COLORS[analyst.trend])}>
              <TrendIcon size={11} />
              <span className="capitalize">{analyst.trend}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <ScoreBadge value={analyst.hypothesisAccuracy} label="Hypothesis Accuracy" />
          <ScoreBadge value={analyst.evidenceUsageScore} label="Evidence Usage" />
          <ScoreBadge value={analyst.falsePositiveRate} label="False Positive Rate" invert max={25} />
          <ScoreBadge value={analyst.escalationAccuracy} label="Escalation Accuracy" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Avg Response Time</div>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-base font-bold font-mono tabular-nums", analyst.avgResponseTimeMin <= 15 ? "text-emerald-400" : analyst.avgResponseTimeMin <= 25 ? "text-amber-400" : "text-red-400")}>
                {analyst.avgResponseTimeMin}m
              </span>
              <span className="text-[9px] text-white/30">avg</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Drill Score</div>
            <div className="flex items-baseline gap-1">
              {analyst.drillScore !== null ? (
                <span className={cn("text-base font-bold font-mono tabular-nums", analyst.drillScore >= 80 ? "text-emerald-400" : analyst.drillScore >= 65 ? "text-amber-400" : "text-red-400")}>
                  {analyst.drillScore}%
                </span>
              ) : (
                <span className="text-base font-bold font-mono text-white/20">—</span>
              )}
              <span className="text-[9px] text-white/30">({analyst.drillsCompleted} drills)</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-white/30 hover:text-white/50 transition-colors border-t border-white/5"
      >
        {expanded ? <><ChevronUp size={11} /> Hide Activity</> : <><ChevronDown size={11} /> Recent Activity</>}
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-2 border-t border-white/5 space-y-2">
          {analyst.recentActivity.map((act, i) => {
            const Icon = ACTIVITY_ICONS[act.type] || Activity;
            return (
              <div key={i} className="flex items-start gap-3 py-2">
                <Icon size={12} className={cn("shrink-0 mt-0.5", OUTCOME_STYLES[act.outcome])} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70">{act.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/30">
                    <Clock size={9} />
                    <span>{act.at}</span>
                    <span>·</span>
                    <span className={OUTCOME_STYLES[act.outcome]}>{act.outcome}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnalystScorecardPage() {
  const [sortBy, setSortBy] = useState<"overall" | "accuracy" | "fp_rate" | "response_time">("overall");

  const sortedAnalysts = [...ANALYSTS].sort((a, b) => {
    const scoreA = Math.round((a.hypothesisAccuracy * 0.25 + a.evidenceUsageScore * 0.20 + (100 - a.falsePositiveRate * 4) * 0.20 + a.escalationAccuracy * 0.20 + (a.drillScore ?? 0) * 0.15));
    const scoreB = Math.round((b.hypothesisAccuracy * 0.25 + b.evidenceUsageScore * 0.20 + (100 - b.falsePositiveRate * 4) * 0.20 + b.escalationAccuracy * 0.20 + (b.drillScore ?? 0) * 0.15));
    if (sortBy === "overall") return scoreB - scoreA;
    if (sortBy === "accuracy") return b.hypothesisAccuracy - a.hypothesisAccuracy;
    if (sortBy === "fp_rate") return a.falsePositiveRate - b.falsePositiveRate;
    if (sortBy === "response_time") return a.avgResponseTimeMin - b.avgResponseTimeMin;
    return 0;
  });

  const teamAvgHypothesis = Math.round(ANALYSTS.reduce((a, b) => a + b.hypothesisAccuracy, 0) / ANALYSTS.length);
  const teamAvgFP = (ANALYSTS.reduce((a, b) => a + b.falsePositiveRate, 0) / ANALYSTS.length).toFixed(1);
  const teamAvgDrill = Math.round(ANALYSTS.filter(a => a.drillScore !== null).reduce((a, b) => a + (b.drillScore ?? 0), 0) / ANALYSTS.filter(a => a.drillScore !== null).length);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: BG, color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <h1 className="text-sm font-bold text-white">Analyst Tradecraft Scorecard</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/5 text-violet-400/70">TRADECRAFT</span>
          </div>
          <div className="flex gap-1">
            {([
              { id: "overall", label: "Overall" },
              { id: "accuracy", label: "Accuracy" },
              { id: "fp_rate", label: "FP Rate" },
              { id: "response_time", label: "Speed" },
            ] as const).map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={cn("px-2.5 py-1 rounded text-[10px] font-mono transition-all", sortBy === s.id ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "text-white/40 hover:text-white/70")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Team summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Team Hypothesis Accuracy</div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: teamAvgHypothesis >= 80 ? "#10b981" : "#f59e0b" }}>{teamAvgHypothesis}%</div>
            <div className="text-[9px] text-white/25 mt-1">avg across {ANALYSTS.length} analysts</div>
          </div>
          <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Team False Positive Rate</div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: parseFloat(teamAvgFP) <= 5 ? "#10b981" : parseFloat(teamAvgFP) <= 10 ? "#f59e0b" : "#ef4444" }}>{teamAvgFP}%</div>
            <div className="text-[9px] text-white/25 mt-1">target: &lt;5%</div>
          </div>
          <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Team Drill Average</div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: teamAvgDrill >= 80 ? "#10b981" : "#f59e0b" }}>{teamAvgDrill}%</div>
            <div className="text-[9px] text-white/25 mt-1">across completed drills</div>
          </div>
        </div>

        {/* Metric legend */}
        <div className="mb-4 flex flex-wrap gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><Brain size={10} className="text-violet-400" /> Hypothesis Accuracy (25%)</span>
          <span className="flex items-center gap-1"><Eye size={10} className="text-blue-400" /> Evidence Usage (20%)</span>
          <span className="flex items-center gap-1"><XCircle size={10} className="text-red-400" /> False Positive Rate (20%)</span>
          <span className="flex items-center gap-1"><Shield size={10} className="text-emerald-400" /> Escalation Accuracy (20%)</span>
          <span className="flex items-center gap-1"><Award size={10} className="text-amber-400" /> Drill Score (15%)</span>
        </div>

        <div className="space-y-3">
          {sortedAnalysts.map(analyst => (
            <AnalystCard key={analyst.id} analyst={analyst} />
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.015] text-[10px] text-white/30 leading-relaxed">
          <span className="text-white/20 block mb-1 font-mono uppercase tracking-widest text-[9px]">Methodology Note</span>
          Scorecard weights: Hypothesis Accuracy (25%), Evidence Usage Quality (20%), False Positive Rate (20%), Escalation Decision Accuracy (20%), Resilience Drill Performance (15%). 
          Scores reflect 30-day rolling window. FP Rate inverted — lower is better. Data is scenario-seeded for demonstration; live data ingests from tradecraft decision engine.
        </div>
      </div>
    </div>
  );
}

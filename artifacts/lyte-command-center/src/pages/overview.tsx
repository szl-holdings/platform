import { useState } from "react";
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, ArrowRight, Brain, Zap, Users, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import {
  overviewMetrics, overviewSummary, signalItems, decisionRecommendations, workflowItems,
  type OverviewMetric, type SignalItem, type DecisionRecommendation, type WorkflowItem,
} from "@/data/seed";

function MetricCard({ m }: { m: OverviewMetric }) {
  const trendIcon = m.trend === "up" ? <TrendingUp className="w-3 h-3" /> : m.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
  const trendGood = m.trend === m.good;
  const trendColor = trendGood ? "text-emerald-400" : m.trend === "flat" ? "text-amber-400/50" : "text-red-400";
  const sevBorder = m.severity === "critical" ? "border-red-500/30" : m.severity === "high" ? "border-amber-500/30" : "border-amber-500/10";

  return (
    <div className={`cockpit-panel p-4 border ${sevBorder}`}>
      <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-wider mb-2">{m.label}</p>
      <p className="text-2xl font-mono font-bold text-amber-300">{m.value}</p>
      {m.delta && (
        <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
          {trendIcon}
          <span className="text-[10px] font-mono">{m.delta}</span>
        </div>
      )}
      <p className="text-[10px] text-amber-400/40 mt-2 leading-snug">{m.context}</p>
    </div>
  );
}

const SEV_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/8 border-red-500/25",
  high: "text-orange-400 bg-orange-500/8 border-orange-500/25",
  medium: "text-amber-400 bg-amber-500/8 border-amber-500/25",
  low: "text-sky-400 bg-sky-500/8 border-sky-500/25",
};

function SignalRow({ sig }: { sig: SignalItem }) {
  const cfg = SEV_COLORS[sig.severity];
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-amber-500/3 rounded-md transition-colors cursor-pointer border border-transparent hover:border-amber-500/10">
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${cfg}`}>{sig.severity.toUpperCase()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-100 leading-snug truncate">{sig.title}</p>
        <p className="text-[10px] text-amber-400/40 mt-0.5 font-mono">{sig.source} · {new Date(sig.detectedAt).toLocaleDateString()}</p>
      </div>
      <span className="proof-badge text-[9px] shrink-0">
        <Shield className="w-2 h-2" />
        {sig.proofRef}
      </span>
    </div>
  );
}

function RecRow({ rec }: { rec: DecisionRecommendation }) {
  const urgColor = rec.urgency === "critical" ? "text-red-400" : rec.urgency === "urgent" ? "text-orange-400" : "text-amber-400";
  const approvalColor = rec.approvalState === "pending" ? "text-amber-400" : rec.approvalState === "approved" ? "text-emerald-400" : "text-amber-400/40";
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-amber-500/3 rounded-md transition-colors cursor-pointer border border-transparent hover:border-amber-500/10">
      <Brain className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${urgColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-100 leading-snug">{rec.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-[10px] font-mono ${urgColor}`}>{rec.urgency.toUpperCase()}</span>
          <span className="text-[10px] text-amber-400/40 font-mono">·</span>
          <span className={`text-[10px] font-mono ${approvalColor}`}>{rec.approvalState}</span>
          <span className="text-[10px] text-amber-400/40 font-mono">·</span>
          <span className="text-[10px] text-amber-400/40">{Math.round(rec.confidence * 100)}% confidence</span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-amber-400/30 shrink-0">{rec.proofRef}</span>
    </div>
  );
}

function WorkflowRow({ wf }: { wf: WorkflowItem }) {
  const statusColor = wf.status === "blocked" ? "text-red-400" : wf.status === "stalled" ? "text-red-300" : wf.status === "at_risk" ? "text-orange-400" : wf.status === "on_track" ? "text-emerald-400" : "text-amber-400/50";
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-amber-500/3 rounded-md transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-100 truncate">{wf.name}</p>
        <p className="text-[10px] text-amber-400/40 mt-0.5">{wf.owner}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {wf.slaBreach && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-red-400 bg-red-500/8 border-red-500/20">SLA</span>}
        {wf.valueAtRiskUsd && <span className="text-[10px] font-mono text-orange-400">${(wf.valueAtRiskUsd / 1e6).toFixed(1)}M</span>}
        <span className={`text-[10px] font-mono ${statusColor}`}>{wf.status.replace("_", " ").toUpperCase()}</span>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const criticalSignals = signalItems.filter(s => s.severity === "critical").slice(0, 5);
  const criticalRecs = decisionRecommendations.filter(r => r.urgency === "critical" || r.urgency === "urgent");
  const atRiskWorkflows = workflowItems.filter(w => w.status !== "on_track" && w.status !== "complete").slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Overview</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">Decision operations snapshot — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="proof-badge">
            <Shield className="w-2.5 h-2.5" />
            {overviewSummary.proofRef}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="cockpit-panel p-5 border border-amber-500/15">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-mono text-amber-400/40 uppercase">Lyte Intelligence Summary</p>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/8 border-emerald-500/20">{Math.round(overviewSummary.confidence * 100)}% confidence</span>
            </div>
            <p className="text-sm font-semibold text-amber-100 mb-2">{overviewSummary.headline}</p>
            <p className={`text-xs text-amber-100/65 leading-relaxed ${summaryExpanded ? "" : "line-clamp-2"}`}>{overviewSummary.body}</p>
            <button onClick={() => setSummaryExpanded(v => !v)} className="text-[10px] text-amber-400/50 hover:text-amber-300 mt-1 transition-colors">
              {summaryExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {overviewMetrics.map(m => <MetricCard key={m.id} m={m} />)}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical Signals */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs font-semibold text-amber-100">Critical Signals</p>
            </div>
            <Link href="/signals" className="flex items-center gap-1 text-[10px] text-amber-400/50 hover:text-amber-300 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {criticalSignals.map(sig => <SignalRow key={sig.id} sig={sig} />)}
          </div>
        </div>

        {/* Decision Backlog */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-semibold text-amber-100">Decision Backlog</p>
            </div>
            <Link href="/decisions" className="flex items-center gap-1 text-[10px] text-amber-400/50 hover:text-amber-300 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {criticalRecs.map(rec => <RecRow key={rec.id} rec={rec} />)}
          </div>
        </div>

        {/* Workflow Health */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-semibold text-amber-100">At-Risk Workflows</p>
            </div>
            <Link href="/workflow-health" className="flex items-center gap-1 text-[10px] text-amber-400/50 hover:text-amber-300 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {atRiskWorkflows.map(wf => <WorkflowRow key={wf.id} wf={wf} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

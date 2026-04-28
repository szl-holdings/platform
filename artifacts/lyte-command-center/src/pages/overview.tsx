import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ChevronRight,
  Compass,
  FileText,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  type DecisionRecommendation,
  decisionRecommendations,
  type OverviewMetric,
  overviewMetrics,
  overviewSummary,
  type SignalItem,
  signalItems,
  type WorkflowItem,
  workflowItems,
} from '@/data/seed';
import { isOnboardingComplete } from '@/pages/onboarding';

function MetricCard({ m }: { m: OverviewMetric }) {
  const trendIcon =
    m.trend === 'up' ? (
      <TrendingUp className="w-3 h-3" />
    ) : m.trend === 'down' ? (
      <TrendingDown className="w-3 h-3" />
    ) : (
      <Minus className="w-3 h-3" />
    );
  const trendGood = m.trend === m.good;
  const trendColor = trendGood
    ? 'text-[#8a8a8a]'
    : m.trend === 'flat'
      ? 'text-[#8a8a8a]'
      : 'text-[#8a8a8a]';
  const sevBorder =
    m.severity === 'critical'
      ? 'border-white/[0.12]'
      : m.severity === 'high'
        ? 'border-white/[0.12]'
        : 'border-white/[0.04]';

  return (
    <div className={`cockpit-panel p-4 border ${sevBorder}`}>
      <p className="text-[10px] font-mono text-[#5e5e5e] uppercase tracking-wider mb-2">
        {m.label}
      </p>
      <p className="text-2xl font-mono font-bold text-[#f5f5f5]">{m.value}</p>
      {m.delta && (
        <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
          {trendIcon}
          <span className="text-[10px] font-mono">{m.delta}</span>
        </div>
      )}
      <p className="text-[10px] text-[#5e5e5e] mt-2 leading-snug">{m.context}</p>
    </div>
  );
}

const SEV_COLORS: Record<string, string> = {
  critical: 'text-[#8a8a8a] bg-white/[0.03] border-white/[0.1]',
  high: 'text-[var(--gi-accent-amber)] bg-white/[0.03] border-white/[0.1]',
  medium: 'text-[var(--gi-accent-amber)] bg-white/[0.03] border-amber-500/25',
  low: 'text-[#5e5e5e] bg-white/[0.03] border-white/[0.1]',
};

function SignalRow({ sig }: { sig: SignalItem }) {
  const cfg = SEV_COLORS[sig.severity];
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-white/[0.015] rounded-md transition-colors cursor-pointer border border-transparent hover:border-white/[0.04]">
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${cfg}`}>
        {sig.severity.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#f5f5f5] leading-snug truncate">{sig.title}</p>
        <p className="text-[10px] text-[#5e5e5e] mt-0.5 font-mono">
          {sig.source} · {new Date(sig.detectedAt).toLocaleDateString()}
        </p>
      </div>
      <span className="proof-badge text-[9px] shrink-0">
        <Shield className="w-2 h-2" />
        {sig.proofRef}
      </span>
    </div>
  );
}

function RecRow({ rec }: { rec: DecisionRecommendation }) {
  const urgColor =
    rec.urgency === 'critical'
      ? 'text-[#8a8a8a]'
      : rec.urgency === 'urgent'
        ? 'text-[var(--gi-accent-amber)]'
        : 'text-[var(--gi-accent-amber)]';
  const approvalColor =
    rec.approvalState === 'pending'
      ? 'text-[var(--gi-accent-amber)]'
      : rec.approvalState === 'approved'
        ? 'text-[#8a8a8a]'
        : 'text-[#5e5e5e]';
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-white/[0.015] rounded-md transition-colors cursor-pointer border border-transparent hover:border-white/[0.04]">
      <Brain className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${urgColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#f5f5f5] leading-snug">{rec.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-[10px] font-mono ${urgColor}`}>{rec.urgency.toUpperCase()}</span>
          <span className="text-[10px] text-[#5e5e5e] font-mono">·</span>
          <span className={`text-[10px] font-mono ${approvalColor}`}>{rec.approvalState}</span>
          <span className="text-[10px] text-[#5e5e5e] font-mono">·</span>
          <span className="text-[10px] text-[#5e5e5e]">
            {Math.round(rec.confidence * 100)}% confidence
          </span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-[#5e5e5e] shrink-0">{rec.proofRef}</span>
    </div>
  );
}

function WorkflowRow({ wf }: { wf: WorkflowItem }) {
  const statusColor =
    wf.status === 'blocked'
      ? 'text-[#8a8a8a]'
      : wf.status === 'stalled'
        ? 'text-[#8a8a8a]'
        : wf.status === 'at_risk'
          ? 'text-[var(--gi-accent-amber)]'
          : wf.status === 'on_track'
            ? 'text-[#8a8a8a]'
            : 'text-[#8a8a8a]';
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-white/[0.015] rounded-md transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#f5f5f5] truncate">{wf.name}</p>
        <p className="text-[10px] text-[#5e5e5e] mt-0.5">{wf.owner}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {wf.slaBreach && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-[#8a8a8a] bg-white/[0.03] border-white/[0.08]">
            SLA
          </span>
        )}
        {wf.valueAtRiskUsd && (
          <span className="text-[10px] font-mono text-[var(--gi-accent-amber)]">
            ${(wf.valueAtRiskUsd / 1e6).toFixed(1)}M
          </span>
        )}
        <span className={`text-[10px] font-mono ${statusColor}`}>
          {wf.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  useEffect(() => {
    setShowOnboardingBanner(!isOnboardingComplete());
  }, []);
  const criticalSignals = signalItems.filter((s) => s.severity === 'critical').slice(0, 5);
  const criticalRecs = decisionRecommendations.filter(
    (r) => r.urgency === 'critical' || r.urgency === 'urgent',
  );
  const atRiskWorkflows = workflowItems
    .filter((w) => w.status !== 'on_track' && w.status !== 'complete')
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {showOnboardingBanner && (
        <Link
          href="/onboarding"
          data-testid="onboarding-banner"
          className="cockpit-panel block p-4 border border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#f5f5f5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#f5f5f5]">
                Set up your workspace in 4 steps
              </p>
              <p className="text-[11px] text-[#5e5e5e] mt-0.5">
                Configure your org, seed demo data, and walk a governed decision loop — no engineer
                required.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#8a8a8a] inline-flex items-center gap-1 shrink-0">
              Start <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#f5f5f5] font-display">Overview</h1>
          <p className="text-xs text-[#8a8a8a] mt-0.5">
            Decision operations snapshot —{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/brief"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <FileText className="w-3 h-3 text-[#5e5e5e]" />
            <span className="text-[10px] text-[#5e5e5e] font-mono">Differentiation Brief</span>
          </Link>
          <span className="proof-badge">
            <Shield className="w-2.5 h-2.5" />
            {overviewSummary.proofRef}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.08] bg-white/[0.02]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
            <span className="text-[10px] text-[#8a8a8a] font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="cockpit-panel p-5 border border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-[var(--gi-accent-amber)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-mono text-[#5e5e5e] uppercase">
                KORA Intelligence Summary
              </p>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-[#8a8a8a] bg-white/[0.03] border-white/[0.08]">
                {Math.round(overviewSummary.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm font-semibold text-[#f5f5f5] mb-2">{overviewSummary.headline}</p>
            <p
              className={`text-xs text-[#f5f5f5]/65 leading-relaxed ${summaryExpanded ? '' : 'line-clamp-2'}`}
            >
              {overviewSummary.body}
            </p>
            <button
              onClick={() => setSummaryExpanded((v) => !v)}
              className="text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] mt-1 transition-colors"
            >
              {summaryExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {overviewMetrics.map((m) => (
          <MetricCard key={m.id} m={m} />
        ))}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical Signals */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8a8a8a]" />
              <p className="text-xs font-semibold text-[#f5f5f5]">Critical Signals</p>
            </div>
            <Link
              href="/signals"
              className="flex items-center gap-1 text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
            >
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {criticalSignals.map((sig) => (
              <SignalRow key={sig.id} sig={sig} />
            ))}
          </div>
        </div>

        {/* Decision Backlog */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
              <p className="text-xs font-semibold text-[#f5f5f5]">Decision Backlog</p>
            </div>
            <Link
              href="/decisions"
              className="flex items-center gap-1 text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
            >
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {criticalRecs.map((rec) => (
              <RecRow key={rec.id} rec={rec} />
            ))}
          </div>
        </div>

        {/* Workflow Health */}
        <div className="cockpit-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
              <p className="text-xs font-semibold text-[#f5f5f5]">At-Risk Workflows</p>
            </div>
            <Link
              href="/workflow-health"
              className="flex items-center gap-1 text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
            >
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2 space-y-0.5">
            {atRiskWorkflows.map((wf) => (
              <WorkflowRow key={wf.id} wf={wf} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

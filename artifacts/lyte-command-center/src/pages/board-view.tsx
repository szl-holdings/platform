import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { useBoardView } from '@/data/api';
import { bootstrapInterventions, useInterventions } from '@/data/interventions';
import { type BoardMetric, type BoardRisk, debtItems, driftItems } from '@/data/seed';

function MetricCard({ metric }: { metric: BoardMetric }) {
  const trendIcon =
    metric.trend === 'up' ? (
      <TrendingUp className="w-3 h-3" />
    ) : metric.trend === 'down' ? (
      <TrendingDown className="w-3 h-3" />
    ) : (
      <Minus className="w-3 h-3" />
    );
  const trendColor =
    metric.trend === metric.good
      ? 'text-emerald-400'
      : metric.trend === 'flat'
        ? 'text-amber-400/50'
        : 'text-red-400';

  return (
    <div className="cockpit-panel p-4">
      <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-2">{metric.label}</p>
      <p className="text-2xl font-mono font-bold text-amber-300">{metric.value}</p>
      <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
        {trendIcon}
        <span className="text-[10px] font-mono">{metric.delta}</span>
      </div>
      <p className="text-[10px] text-amber-400/40 mt-2 leading-snug">{metric.context}</p>
    </div>
  );
}

const SEVERITY_CONFIG = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/25',
    label: 'CRITICAL',
  },
  high: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/25',
    label: 'HIGH',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/25',
    label: 'MEDIUM',
  },
};

function RiskCard({ risk }: { risk: BoardRisk }) {
  const cfg = SEVERITY_CONFIG[risk.severity];
  return (
    <div
      className={`cockpit-panel p-5 border ${cfg.border} ${risk.severity === 'critical' ? 'border-l-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border} mt-0.5`}
        >
          <AlertTriangle className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-amber-100">{risk.title}</p>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[10px] font-mono text-amber-400/40 mb-2">{risk.domain}</p>

          {/* Signal */}
          <div className="rounded bg-amber-500/4 border border-amber-500/12 p-2.5 mb-2">
            <p className="text-[9px] font-mono text-amber-400/40 mb-1">SIGNAL</p>
            <p className="text-[11px] text-amber-100/65 leading-relaxed">{risk.signal}</p>
          </div>

          {/* Recommendation */}
          <div className="rounded bg-emerald-500/5 border border-emerald-500/15 p-2.5 mb-3">
            <p className="text-[9px] font-mono text-emerald-400/50 mb-1">
              RECOMMENDED INTERVENTION
            </p>
            <p className="text-[11px] text-amber-100/70 leading-relaxed">{risk.recommendation}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-amber-400/50">
                <Users className="w-3 h-3" />
                <span className="font-mono">{risk.interventionOwner}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400/50">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{risk.deadline}</span>
              </div>
            </div>
            <span className="proof-badge text-[9px]">
              <Shield className="w-2 h-2" />
              {risk.proofRef}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BoardViewPage() {
  useEffect(() => {
    void bootstrapInterventions();
  }, []);

  const { data, isLoading, error } = useBoardView();
  if (isLoading) {
    return <div className="p-6 text-xs font-mono text-amber-400/50">Loading board view…</div>;
  }
  if (error || !data) {
    return (
      <div className="p-6 text-xs font-mono text-red-400/70">Failed to load board view data.</div>
    );
  }
  const boardMetrics = data.metrics;
  const boardRisks = data.risks;
  const critical = boardRisks.filter((r) => r.severity === 'critical');
  const high = boardRisks.filter((r) => r.severity === 'high');
  const medium = boardRisks.filter((r) => r.severity === 'medium');

  const { drift, debt, log } = useInterventions();
  const totalItems = driftItems.length + debtItems.length;
  const driftClaimed = driftItems.filter((d) => drift[d.id]?.claimedBy).length;
  const driftResolved = driftItems.filter((d) => drift[d.id]?.resolvedBy).length;
  const debtReassigned = debtItems.filter((d) => debt[d.id]?.reassignedTo).length;
  const debtAddressed = debtItems.filter((d) => debt[d.id]?.addressedBy).length;
  const itemsWithIntervention =
    driftItems.filter((d) => drift[d.id]).length + debtItems.filter((d) => debt[d.id]).length;
  const interventionRate =
    totalItems > 0 ? Math.round((itemsWithIntervention / totalItems) * 100) : 0;
  const closedItems = driftResolved + debtAddressed;
  const closureRate = totalItems > 0 ? Math.round((closedItems / totalItems) * 100) : 0;

  const interventionMetric: BoardMetric = {
    label: 'Intervention Rate',
    value: `${interventionRate}%`,
    delta: `${log.length} action${log.length === 1 ? '' : 's'} logged`,
    trend: interventionRate > 0 ? 'up' : 'flat',
    context: `${itemsWithIntervention} of ${totalItems} drift+debt items have an operator action — ${closureRate}% closed.`,
    good: 'up',
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <h1 className="text-xl font-display font-bold text-amber-50">Board View</h1>
          </div>
          <p className="text-sm text-amber-100/50">
            Evidence-backed executive brief — risks, interventions, and operational health.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="proof-badge">
            <Shield className="w-2.5 h-2.5" />
            ALLOY-PROOF
          </span>
          <span className="text-[10px] font-mono text-amber-400/40">Apr 18, 2026 · 09:00</span>
        </div>
      </div>

      {/* Executive summary */}
      <div className="cockpit-panel p-5 border-amber-500/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-100 mb-0.5">Executive Summary</p>
            <p className="text-[10px] font-mono text-amber-400/45">
              Generated by Alloy · Apr 18, 2026 · Proof: ALLOY-BRIEF-0418
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-amber-100/65 leading-relaxed">
          <p>
            The organisation is carrying{' '}
            <span className="text-amber-300 font-semibold">6 active ownership drift items</span>{' '}
            with a combined Action Debt score of{' '}
            <span className="text-amber-300 font-semibold">43</span> — both metrics at their highest
            point in 7 weeks. Three items require board-level awareness today: the CloudPlatform
            vendor contract (expiry in 15 days with no ownership resolution), the Q2 revenue
            forecast impasse (blocking board deck assembly), and the Meridian Corp renewal ($180K
            ARR at risk with NPS proxy in decline).
          </p>
          <p>
            The primary risk driver is{' '}
            <span className="text-amber-300 font-semibold">cross-functional ownership gaps</span> —
            work where multiple parties are named but none are acting. Alloy has detected 3 circular
            dependency patterns in the last 14 days. The Customer Success escalation management
            workflow carries the{' '}
            <span className="text-amber-300 font-semibold">
              highest pressure score in the organisation at 88/100
            </span>
            , driven by 8 escalated items and a team approaching capacity.
          </p>
          <p>
            Total at-risk ARR attributable to drift-path items is{' '}
            <span className="text-red-400 font-semibold">$600K</span> — $420K from the Q1 enterprise
            launch delay and $180K from the Meridian renewal. Series B due diligence is also at risk
            with the investor call on April 20 and the data room incomplete.
          </p>
          <p className="text-amber-100/45 text-[11px]">
            Lyte recommendation: COO to convene a 30-minute triage session today to assign single
            decision authority on CloudPlatform and Meridian. All other items are addressed in the
            intervention schedule below.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-3">
          Operational Health Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {boardMetrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
          <div data-testid="metric-intervention-rate">
            <MetricCard metric={interventionMetric} />
          </div>
        </div>
      </div>

      {/* Intervention activity */}
      <div className="cockpit-panel p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-100 mb-0.5">
                Operator Intervention Activity
              </p>
              <p className="text-[10px] font-mono text-amber-400/45">
                Live count of claims, reassigns, and closures from the dashboard
              </p>
            </div>
          </div>
          <span className="proof-badge">
            <Shield className="w-2.5 h-2.5" />
            ALLOY-INT
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Claims',
              value: driftClaimed,
              color: 'text-amber-300',
              testId: 'stat-claims',
            },
            {
              label: 'Drift Resolved',
              value: driftResolved,
              color: 'text-emerald-300',
              testId: 'stat-drift-resolved',
            },
            {
              label: 'Debt Reassigned',
              value: debtReassigned,
              color: 'text-sky-300',
              testId: 'stat-debt-reassigned',
            },
            {
              label: 'Debt Addressed',
              value: debtAddressed,
              color: 'text-emerald-300',
              testId: 'stat-debt-addressed',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded border border-amber-500/12 bg-amber-500/4 p-3"
              data-testid={s.testId}
            >
              <p className="text-[10px] font-mono text-amber-400/45 uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        {log.length === 0 && (
          <p className="text-[11px] text-amber-100/45 mt-3">
            No interventions logged yet. Use the Ownership Drift and Action Debt surfaces to claim,
            reassign, or close items — they will appear in Decision Replay.
          </p>
        )}
      </div>

      {/* Risk register */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase">Risk Register</p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/25 bg-red-500/8 text-red-400">
              {critical.length} CRITICAL
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-orange-500/25 bg-orange-500/8 text-orange-400">
              {high.length} HIGH
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/25 bg-amber-500/8 text-amber-400">
              {medium.length} MEDIUM
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Critical section */}
          {critical.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-red-400/60 uppercase tracking-widest mb-2">
                Critical — Act Today
              </p>
              <div className="space-y-2">
                {critical.map((r) => (
                  <RiskCard key={r.id} risk={r} />
                ))}
              </div>
            </div>
          )}

          {/* High section */}
          {high.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-orange-400/60 uppercase tracking-widest mb-2 mt-4">
                High — Act This Week
              </p>
              <div className="space-y-2">
                {high.map((r) => (
                  <RiskCard key={r.id} risk={r} />
                ))}
              </div>
            </div>
          )}

          {/* Medium section */}
          {medium.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-amber-400/50 uppercase tracking-widest mb-2 mt-4">
                Medium — Monitor
              </p>
              <div className="space-y-2">
                {medium.map((r) => (
                  <RiskCard key={r.id} risk={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links */}
      <div className="cockpit-panel p-4">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-3">
          Explore Detail Surfaces
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { href: '/ownership-drift', label: 'Ownership Drift', count: '6 items' },
            { href: '/pressure-map', label: 'Pressure Map', count: '88/100 max' },
            { href: '/action-debt', label: 'Action Debt', count: 'Score 43' },
            { href: '/decision-replay', label: 'Decision Replay', count: '2 scenarios' },
          ].map((l) => (
            <Link key={l.href} href={l.href}>
              <div className="flex items-center justify-between p-2.5 rounded border border-amber-500/12 hover:border-amber-500/25 hover:bg-amber-500/4 transition-all cursor-pointer group">
                <div>
                  <p className="text-[11px] font-medium text-amber-100/80 group-hover:text-amber-200">
                    {l.label}
                  </p>
                  <p className="text-[9px] font-mono text-amber-400/40">{l.count}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-amber-400/30 group-hover:text-amber-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cockpit-panel p-5 border-amber-500/20 bg-amber-500/4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-100 mb-1">
              Ready to deploy Lyte in your organisation?
            </p>
            <p className="text-[11px] text-amber-100/55 mb-3">
              Lyte onboards in 2 weeks with a read-only Alloy connector. See your first Ownership
              Drift report within 48 hours.
            </p>
            <a
              href="mailto:inquiries@szlholdings.com?subject=Lyte Pilot Programme"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-amber-950 text-xs font-semibold hover:bg-amber-400 transition-colors"
            >
              Request a Pilot <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

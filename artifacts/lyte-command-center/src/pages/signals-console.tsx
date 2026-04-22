import {
  DECISION_TWIN_ACTION_LABELS,
  DECISION_TWIN_ENGINE_VERSION,
  deltaLabel,
  getBestScenario,
  type PRISMDimension,
  runAllDecisionTwinScenarios,
  type SignalProfile,
} from '@workspace/simulation';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  Search,
  Shield,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { type Severity, type SignalItem, signalItems } from '@/data/seed';

const SEV_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: {
    label: 'CRITICAL',
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/25',
  },
  high: {
    label: 'HIGH',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/25',
  },
  medium: {
    label: 'MEDIUM',
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/25',
  },
  low: { label: 'LOW', color: 'text-sky-400', bg: 'bg-sky-500/8', border: 'border-sky-500/25' },
};

const POLICY_COLORS: Record<string, string> = {
  cleared: 'text-emerald-400',
  conditional: 'text-amber-400',
  blocked: 'text-red-400',
  flagged: 'text-orange-400',
  pending: 'text-sky-400',
};

const FRESHNESS_COLORS: Record<string, string> = {
  live: 'text-emerald-400',
  recent: 'text-amber-400',
  stale: 'text-orange-400',
  expired: 'text-red-400',
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  approval_chain_stall: 'Approval Chain Stall',
  revenue_risk: 'Revenue Risk',
  deliverable_overdue: 'Deliverable Overdue',
  ownership_gap: 'Ownership Gap',
  buyer_engagement_decay: 'Buyer Engagement Decay',
  workflow_bottleneck: 'Workflow Bottleneck',
  policy_violation: 'Policy Violation',
  escalation_blocked: 'Escalation Blocked',
  stakeholder_churn: 'Stakeholder Churn',
  budget_leakage: 'Budget Leakage',
};

function toSignalProfile(sig: SignalItem): SignalProfile {
  const stalledDays =
    sig.type === 'approval_chain_stall'
      ? 47
      : sig.type === 'deliverable_overdue'
        ? 22
        : sig.type === 'ownership_gap'
          ? 28
          : undefined;
  const financialExposureUsd =
    sig.type === 'revenue_risk'
      ? 4_200_000
      : sig.type === 'workflow_bottleneck'
        ? 7_800_000
        : sig.type === 'policy_violation'
          ? 3_400_000
          : sig.type === 'budget_leakage'
            ? 340_000
            : sig.type === 'approval_chain_stall'
              ? 1_800_000
              : undefined;
  return {
    id: sig.id,
    severity: sig.severity,
    type: sig.type,
    confidence: sig.confidence,
    hasOwnershipGap: sig.type === 'ownership_gap' || sig.type === 'approval_chain_stall',
    isPolicyBlocked: sig.policyState === 'blocked',
    hasBuyerEngagementRisk: sig.type === 'buyer_engagement_decay',
    isSecurityRelated: sig.type === 'policy_violation' || sig.type === 'escalation_blocked',
    ...(stalledDays !== undefined ? { stalledDays } : {}),
    ...(financialExposureUsd !== undefined ? { financialExposureUsd } : {}),
    affectedStakeholders: 3,
  };
}

const PRISM_DIMS = [
  'revenue',
  'staffing',
  'infrastructure',
  'security',
  'market_timing',
] as PRISMDimension[];

function PRISMImpactMini({ sig }: { sig: SignalItem }) {
  const profile = useMemo(() => toSignalProfile(sig), [sig]);
  const scenarios = useMemo(() => runAllDecisionTwinScenarios(profile), [profile]);
  const best = useMemo(() => getBestScenario(scenarios), [scenarios]);

  if (!best) return null;

  return (
    <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3 h-3 text-amber-400/50" />
          <p className="text-[9px] font-mono text-amber-400/40 uppercase">
            PRISM Impact Simulation
          </p>
          <span className="text-[8px] font-mono text-amber-400/20">
            v{DECISION_TWIN_ENGINE_VERSION}
          </span>
          {sig.confidence < 0.85 && (
            <span className="text-[8px] font-mono px-1 py-0.5 rounded border text-amber-400/35 bg-amber-500/5 border-amber-500/12">
              DEMO
            </span>
          )}
        </div>
        <Link
          href={`/decision-twin?signal=${sig.id}`}
          className="flex items-center gap-1 text-[9px] font-mono text-amber-400/40 hover:text-amber-300 transition-colors"
        >
          Full Analysis <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {scenarios.map((s) => {
          const d = deltaLabel(s.overallDelta);
          const isBest = best.action === s.action;
          return (
            <div
              key={s.action}
              className={`rounded border p-2 ${
                isBest
                  ? 'border-emerald-500/25 bg-emerald-500/5'
                  : s.action === 'delay'
                    ? 'border-red-500/15 bg-red-500/3'
                    : 'border-amber-500/10 bg-amber-500/3'
              }`}
            >
              <p
                className={`text-[9px] font-mono mb-0.5 ${isBest ? 'text-emerald-400' : 'text-amber-400/40'}`}
              >
                {DECISION_TWIN_ACTION_LABELS[s.action]}
                {isBest && ' ★'}
              </p>
              <p className={`text-[10px] font-mono font-semibold ${d.color}`}>{d.label}</p>
              <p className="text-[8px] text-amber-400/25 mt-0.5">
                {s.overallRiskBefore}→{s.overallRiskAfter}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {PRISM_DIMS.map((dim) => {
          const bestImpact = best.prismImpacts.find((i) => i.dimension === dim);
          if (!bestImpact) return null;
          const d = deltaLabel(bestImpact.delta);
          return (
            <div key={dim} className="text-center">
              <p className="text-[7px] font-mono text-amber-400/25 truncate mb-0.5">
                {dim.replace('_', ' ').toUpperCase().slice(0, 6)}
              </p>
              <p className={`text-[9px] font-mono font-semibold ${d.color}`}>{d.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-amber-400/30">
        <span>
          Recommended:{' '}
          <span className="text-emerald-400">{DECISION_TWIN_ACTION_LABELS[best.action]}</span>
        </span>
        <span>Impact: {best.timeToImpact}</span>
        <span>Confidence: {Math.round(best.overallConfidence.mid * 100)}%</span>
      </div>
    </div>
  );
}

function SignalCard({
  sig,
  expanded,
  onToggle,
}: {
  sig: SignalItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = SEV_CONFIG[sig.severity];
  return (
    <div
      className={`cockpit-panel border ${cfg.border} ${sig.severity === 'critical' ? 'border-l-2' : ''}`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={onToggle}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}
        >
          <AlertTriangle className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-amber-100 leading-snug">{sig.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}
              >
                {cfg.label}
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-amber-400/40">
              {SIGNAL_TYPE_LABELS[sig.type] ?? sig.type}
            </span>
            <span className={`text-[10px] font-mono ${FRESHNESS_COLORS[sig.freshness]}`}>
              {sig.freshness.toUpperCase()}
            </span>
            <span className={`text-[10px] font-mono ${POLICY_COLORS[sig.policyState]}`}>
              {sig.policyState}
            </span>
            <span className="text-[10px] font-mono text-amber-400/30">
              {Math.round(sig.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-[10px] text-amber-400/40 mt-1 font-mono">
            {sig.source} ·{' '}
            {new Date(sig.detectedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
            <p className="text-[9px] font-mono text-amber-400/40 mb-1">SIGNAL DETAIL</p>
            <p className="text-xs text-amber-100/70 leading-relaxed">{sig.body}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
              <p className="text-[9px] font-mono text-amber-400/40 mb-1">LINKED ENTITY</p>
              <p className="text-xs text-amber-100/80">{sig.linkedEntityLabel}</p>
              <p className="text-[10px] font-mono text-amber-400/40">{sig.linkedEntityType}</p>
            </div>
            <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
              <p className="text-[9px] font-mono text-amber-400/40 mb-1">TAGS</p>
              <div className="flex flex-wrap gap-1">
                {sig.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15 text-amber-400/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <PRISMImpactMini sig={sig} />

          <div className="flex items-center justify-between">
            <span className="proof-badge">
              <Shield className="w-2 h-2" />
              {sig.proofRef}
            </span>
            <Link
              href={`/decision-twin?signal=${sig.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-300 text-[10px] font-mono hover:bg-amber-500/12 transition-colors"
            >
              <GitBranch className="w-3 h-3" />
              Open Decision Twin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const NL_EXAMPLES = [
  'show revenue risk signals escalated this week',
  'which signals have ownership gaps over 30 days?',
  'list policy violations with critical severity',
  'workflows with budget leakage above $500K',
];

function NLSignalQueryBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [active, setActive] = useState(false);
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
    >
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-amber-400/50" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400/40">
          Signal Intelligence Query
        </span>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.15)',
            color: '#fbbf24',
          }}
        >
          NL-powered
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          placeholder="Ask in plain English — e.g. 'show revenue risk signals escalated this week'"
          className="flex-1 bg-transparent text-xs text-amber-100/70 placeholder:text-amber-400/20 outline-none"
          style={{
            background: 'rgba(245,158,11,0.025)',
            border: `1px solid ${active ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.08)'}`,
            borderRadius: 8,
            padding: '7px 12px',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          className="px-3 py-2 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-colors"
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#fbbf24',
          }}
        >
          Query
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {NL_EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onChange(ex)}
            className="text-[8px] font-mono text-amber-400/30 hover:text-amber-300 transition-colors px-2 py-1 rounded"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SignalsConsolePage() {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('sig-001');

  const filtered = useMemo(() => {
    return signalItems.filter((s) => {
      if (filterSeverity !== 'all' && s.severity !== filterSeverity) return false;
      if (
        search &&
        !s.title.toLowerCase().includes(search.toLowerCase()) &&
        !s.body.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [search, filterSeverity]);

  const counts = useMemo(
    () => ({
      critical: signalItems.filter((s) => s.severity === 'critical').length,
      high: signalItems.filter((s) => s.severity === 'high').length,
      medium: signalItems.filter((s) => s.severity === 'medium').length,
      low: signalItems.filter((s) => s.severity === 'low').length,
    }),
    [],
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Signals Console</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">
            {signalItems.length} active signals across all workflows — sorted by severity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/decision-twin"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/12 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Decision Twin
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/70 font-mono">LIVE FEED</span>
          </div>
        </div>
      </div>

      <NLSignalQueryBar value={search} onChange={setSearch} />

      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const count = sev === 'all' ? signalItems.length : counts[sev];
          const active = filterSeverity === sev;
          const cfg = sev !== 'all' ? SEV_CONFIG[sev] : null;
          return (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-all ${
                active
                  ? cfg
                    ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                    : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                  : 'text-amber-400/50 bg-transparent border-amber-500/15 hover:border-amber-500/30 hover:text-amber-300'
              }`}
            >
              {sev === 'all' ? 'ALL' : SEV_CONFIG[sev].label}
              <span
                className={`text-[10px] px-1 rounded ${active && cfg ? cfg.bg : 'bg-amber-500/8'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/30" />
        <input
          type="text"
          placeholder="Search signals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-amber-500/5 border border-amber-500/15 rounded-md text-xs text-amber-100 placeholder-amber-400/30 focus:outline-none focus:border-amber-500/40"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="cockpit-panel p-8 text-center">
            <p className="text-sm text-amber-400/40">No signals match your filters.</p>
          </div>
        )}
        {filtered.map((sig) => (
          <SignalCard
            key={sig.id}
            sig={sig}
            expanded={expandedId === sig.id}
            onToggle={() => setExpandedId(expandedId === sig.id ? null : sig.id)}
          />
        ))}
      </div>
    </div>
  );
}

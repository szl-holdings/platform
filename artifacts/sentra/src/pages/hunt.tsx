import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Clock,
  RefreshCcw,
  Search,
  ShieldAlert,
  Siren,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { HUNTS, type Hunt } from '@/data/hunt-data';

const SEVERITY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    glow: 'shadow-red-500/10',
  },
  high: {
    label: 'HIGH',
    dot: 'bg-orange-400',
    badge: 'bg-orange-400/10 border-orange-400/30 text-orange-300',
    glow: 'shadow-orange-400/10',
  },
  medium: {
    label: 'MEDIUM',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300',
    glow: '',
  },
  low: {
    label: 'LOW',
    dot: 'bg-slate-400',
    badge: 'bg-slate-400/10 border-slate-400/30 text-slate-400',
    glow: '',
  },
};

const STATUS_CONFIG: Record<Hunt['status'], { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'text-[#c9b787]' },
  active: { label: 'Active Hunt', color: 'text-sky-400' },
  completed: { label: 'Completed', color: 'text-emerald-400' },
  dismissed: { label: 'Dismissed', color: 'text-slate-500' },
};

function FpMeter({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct <= 5 ? '#4ade80' : pct <= 15 ? '#c9b787' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
        {pct}% FP
      </span>
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? '#4ade80' : pct >= 75 ? '#c9b787' : '#94a3b8';
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
      style={{ color, borderColor: `${color}30`, background: `${color}08` }}
    >
      {pct}% confidence
    </span>
  );
}

function HuntCard({ hunt }: { hunt: Hunt }) {
  const sev = SEVERITY_CONFIG[hunt.severity];
  const sta = STATUS_CONFIG[hunt.status];
  const relativeTime = (() => {
    const diffMs = Date.now() - new Date(hunt.proposedAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  })();

  return (
    <Link href={`/hunt/${hunt.id}`}>
      <div
        className={cn(
          'sentra-panel p-5 cursor-pointer transition-all hover:border-[#f5f5f5]/20 group shadow-lg',
          sev.glow,
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', sev.dot)} />
            <h3 className="text-sm font-semibold text-slate-100 leading-snug group-hover:text-white transition-colors">
              {hunt.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider',
                sev.badge,
              )}
            >
              {sev.label}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mb-4 line-clamp-2">
          {hunt.hypothesis}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {hunt.mitreIds.map((id) => (
            <span
              key={id}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase"
            >
              {id}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1 text-slate-500">
            <Activity className="w-3 h-3" />
            <span className="font-mono">{hunt.signalCount} signals</span>
          </div>
          <ConfidenceBadge score={hunt.confidenceScore} />
          <FpMeter rate={hunt.falsePositiveRate} />
          <div className="flex items-center gap-1 text-slate-600 ml-auto">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{relativeTime}</span>
          </div>
          <span className={cn('font-mono font-medium', sta.color)}>{sta.label}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HuntPage() {
  const [filter, setFilter] = useState<'all' | Hunt['severity']>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = filter === 'all' ? HUNTS : HUNTS.filter((h) => h.severity === filter);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const criticalCount = HUNTS.filter((h) => h.severity === 'critical').length;
  const totalSignals = HUNTS.reduce((s, h) => s + h.signalCount, 0);
  const avgFp = Math.round((HUNTS.reduce((s, h) => s + h.falsePositiveRate, 0) / HUNTS.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-[#f5f5f5]/60" />
            <h1 className="text-2xl font-display font-bold text-slate-100">Threat Hunt</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] uppercase tracking-wider">
              Agentic Proposer
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Autonomously proposed hunts based on signal correlation, MITRE patterns, and ontology traversal
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCcw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          Refresh Hunts
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Hunts', value: HUNTS.length, icon: Target, color: 'text-[#f5f5f5]' },
          {
            label: 'Critical Findings',
            value: criticalCount,
            icon: Siren,
            color: 'text-red-400',
          },
          { label: 'Signals Correlated', value: totalSignals, icon: Activity, color: 'text-sky-400' },
          { label: 'Avg FP Rate', value: `${avgFp}%`, icon: Search, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="sentra-panel px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            </div>
            <div className={cn('text-xl font-mono font-bold', color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="sentra-panel p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#c9b787] shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-mono text-[#c9b787] uppercase tracking-wider mb-1">
            Agent Reasoning — Daily Hunt Brief
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Today's hunt queue was generated at 06:00 UTC by correlating 53 signals across EDR telemetry,
            Mesh Drift monitor, and DLP sensors. Priority weighting favors OT-adjacent lateral movement
            chains and supply chain integrity deviations — both elevated after the Volt Typhoon advisory
            (CISA AA24-038A). Estimated combined blast radius if all hunts confirm:{' '}
            <span className="text-red-400 font-mono font-bold">$29.5M</span>.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'critical', 'high', 'medium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'text-[10px] font-mono px-2.5 py-1 rounded border uppercase tracking-wider transition-colors',
              filter === f
                ? 'bg-[#f5f5f5]/10 border-[#f5f5f5]/30 text-[#f5f5f5]'
                : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-400',
            )}
          >
            {f === 'all' ? `All (${HUNTS.length})` : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="sentra-panel p-12 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hunts match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hunt) => (
            <HuntCard key={hunt.id} hunt={hunt} />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-600 font-mono pt-2">
        <AlertTriangle className="w-3 h-3 inline mr-1" />
        Hunt proposals are AI-generated. Analyst review required before escalation.
      </div>
    </div>
  );
}

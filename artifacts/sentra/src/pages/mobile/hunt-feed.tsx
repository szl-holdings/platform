import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Crosshair,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  approveHunt,
  dismissHunt,
  listHunts,
  type HuntListItem,
} from '@/lib/sentra-api';
import {
  classifyLambda,
  computeFrustumVolume,
  computeLutarInvariant,
  deriveHuntAxes,
  TIER_BG,
  TIER_COLORS,
} from '@/lib/ouroboros-compute';
import { usePullToRefresh } from './use-pull-to-refresh';

const SEVERITY_COLORS: Record<string, { dot: string; badge: string; text: string }> = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
  high: { dot: 'bg-orange-400', badge: 'bg-orange-400/10 border-orange-400/30', text: 'text-orange-300' },
  medium: { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 border-yellow-400/30', text: 'text-yellow-300' },
  low: { dot: 'bg-slate-400', badge: 'bg-slate-400/10 border-slate-400/30', text: 'text-slate-400' },
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'text-[#c9b787]' },
  active: { label: 'Active', color: 'text-sky-400' },
  completed: { label: 'Completed', color: 'text-emerald-400' },
  dismissed: { label: 'Dismissed', color: 'text-slate-500' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? 'bg-emerald-400' : pct >= 75 ? 'bg-[#c9b787]' : 'bg-slate-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-white/30 tabular-nums">{pct}%</span>
    </div>
  );
}

function HuntCard({
  hunt,
  onApprove,
  onDismiss,
  busy,
  expanded,
  onToggle,
}: {
  hunt: HuntListItem;
  onApprove: () => void;
  onDismiss: () => void;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sev = SEVERITY_COLORS[hunt.severity] ?? SEVERITY_COLORS.low;
  const sta = STATUS_STYLES[hunt.status] ?? STATUS_STYLES.proposed;

  const huntAxes = deriveHuntAxes({
    confidenceScore: hunt.confidenceScore,
    falsePositiveRate: hunt.falsePositiveRate,
    signalCount: hunt.signalCount,
    severity: hunt.severity,
  });
  const huntLutar = computeLutarInvariant(huntAxes);
  const huntAdr = classifyLambda(huntLutar.lambda);
  const lambdaPct = Math.round(huntLutar.lambda * 100);

  const blastM = hunt.blastRadiusCost / 1_000_000;
  const entityCount = hunt.affectedBusinessEntities.length;
  const frustumVol = computeFrustumVolume(
    blastM,
    entityCount,
    hunt.signalCount,
  );

  const isLowTrust = huntLutar.lambda < 0.65;

  return (
    <div className={cn('rounded-xl border border-white/6 bg-white/[0.025] overflow-hidden', busy && 'opacity-50')}>
      <button onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-start gap-2.5">
          <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', sev.dot)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={cn('text-[9px] font-mono uppercase px-1 py-px rounded border', sev.badge, sev.text)}>
                {hunt.severity}
              </span>
              <span className={cn('text-[9px] font-mono', sta.color)}>{sta.label}</span>
              <span className={cn('text-[8px] font-mono px-1 py-px rounded border', TIER_BG[huntAdr.tier], TIER_COLORS[huntAdr.tier])}>
                Λ {lambdaPct}%
              </span>
            </div>
            <div className="text-[13px] text-white/90 font-medium leading-tight">{hunt.title}</div>
            <div className="flex items-center gap-3 mt-1.5">
              <ConfidenceBar score={hunt.confidenceScore} />
              <span className="text-[9px] text-white/20 font-mono">{hunt.signalCount} signals</span>
              <span className="text-[9px] text-white/20 font-mono">{relativeTime(hunt.proposedAt)}</span>
            </div>
          </div>
          <ChevronDown className={cn('w-3.5 h-3.5 text-white/20 shrink-0 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/4 pt-2.5 animate-fade-in">
          <div className="rounded-lg p-2 border border-white/6 bg-white/[0.02]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[8px] font-mono text-white/30 uppercase">Lutar Invariant Assessment</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-1.5">
              {(['cleanliness', 'horizon', 'resonance', 'frustum'] as const).map(axis => (
                <div key={axis} className="text-center">
                  <div className="text-[10px] font-bold text-white/60 tabular-nums">{(huntLutar.axes[axis] * 100).toFixed(0)}</div>
                  <div className="text-[7px] font-mono text-white/20 uppercase">{axis[0]}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded border', TIER_BG[huntAdr.tier], TIER_COLORS[huntAdr.tier])}>
                ADR: {huntAdr.tier.toUpperCase()} · {huntAdr.passes}×pass · {huntAdr.costMultiplier}x cost
              </div>
            </div>
          </div>

          <div>
            <span className="text-[9px] font-mono text-white/30 uppercase">Hypothesis</span>
            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{hunt.hypothesis}</p>
          </div>
          {hunt.reasoning && (
            <div>
              <span className="text-[9px] font-mono text-white/30 uppercase">Reasoning</span>
              <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{hunt.reasoning}</p>
            </div>
          )}
          {hunt.mitreTactics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hunt.mitreTactics.map((t) => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/40 font-mono">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg p-2 border border-white/6 bg-white/[0.02]">
              <span className="text-[8px] font-mono text-white/25 uppercase">Blast Radius</span>
              <div className="text-[12px] text-white/70 font-mono mt-0.5">
                ${blastM.toFixed(1)}M
              </div>
            </div>
            <div className="rounded-lg p-2 border border-white/6 bg-white/[0.02]">
              <span className="text-[8px] font-mono text-white/25 uppercase">FP Rate</span>
              <div className="text-[12px] text-white/70 font-mono mt-0.5">
                {Math.round(hunt.falsePositiveRate * 100)}%
              </div>
            </div>
            <div className="rounded-lg p-2 border border-white/6 bg-white/[0.02]">
              <span className="text-[8px] font-mono text-white/25 uppercase">Frustum V</span>
              <div className="text-[12px] text-white/70 font-mono mt-0.5">
                {frustumVol.toFixed(1)}
              </div>
              <div className="text-[6px] font-mono text-white/15 mt-0.5">h/3·(a²+ab+b²)</div>
            </div>
          </div>

          {(hunt.status === 'proposed' || hunt.status === 'active') && (
            <div className="space-y-1.5 pt-1">
              {isLowTrust && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/15">
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="text-[9px] font-mono text-red-400">
                    Low trust (Λ={lambdaPct}%) — requires frontier 3-pass verification
                  </span>
                </div>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={onApprove}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono active:bg-emerald-500/20 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> APPROVE
                </button>
                <button
                  onClick={onDismiss}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono active:bg-red-500/20 disabled:opacity-50"
                >
                  <X className="w-3 h-3" /> DISMISS
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HuntFeed() {
  const [hunts, setHunts] = useState<HuntListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | HuntListItem['status']>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listHunts();
      setHunts(result.hunts);
    } catch {
      setError('Failed to load hunt data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ptr = usePullToRefresh(handleRefresh);

  const filtered = hunts
    .filter((h) => statusFilter === 'all' || h.status === statusFilter)
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const s = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
      if (s !== 0) return s;
      return new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime();
    });

  const proposedCount = hunts.filter((h) => h.status === 'proposed').length;
  const activeCount = hunts.filter((h) => h.status === 'active').length;

  const handleApprove = async (hunt: HuntListItem) => {
    setBusyIds((prev) => new Set(prev).add(hunt.id));
    const res = await approveHunt(hunt.id, {
      huntTitle: hunt.title,
      severity: hunt.severity,
      blastRadiusCost: hunt.blastRadiusCost,
      affectedBusinessEntities: hunt.affectedBusinessEntities,
      approvedBy: 'mobile-operator',
    });
    if (res.ok) {
      setHunts((prev) => prev.map((h) => (h.id === hunt.id ? { ...h, status: 'active' as const } : h)));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(hunt.id); return n; });
  };

  const handleDismiss = async (hunt: HuntListItem) => {
    setBusyIds((prev) => new Set(prev).add(hunt.id));
    const res = await dismissHunt(hunt.id, { dismissedBy: 'mobile-operator' });
    if (res.ok) {
      setHunts((prev) => prev.map((h) => (h.id === hunt.id ? { ...h, status: 'dismissed' as const } : h)));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(hunt.id); return n; });
  };

  return (
    <div
      ref={ptr.containerRef}
      className="px-4 py-4 space-y-4 overflow-auto h-full"
      onTouchStart={ptr.handleTouchStart}
      onTouchMove={ptr.handleTouchMove}
      onTouchEnd={ptr.handleTouchEnd}
    >
      {(ptr.pullDistance > 0 || ptr.isRefreshing) && (
        <div className="flex items-center justify-center" style={{ height: ptr.pullDistance || 30 }}>
          <RefreshCw className={cn('w-4 h-4 text-white/40', ptr.isRefreshing && 'animate-spin')} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white/90">Threat Hunt Feed</h2>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            {loading ? 'Loading...' : `${proposedCount} proposed · ${activeCount} active`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['all', 'proposed', 'active', 'completed', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'text-[9px] font-mono px-2 py-1 rounded-lg border whitespace-nowrap transition-colors',
              statusFilter === s ? 'bg-white/10 border-white/20 text-white/80' : 'bg-white/3 border-white/6 text-white/30',
            )}
          >
            {s === 'all' ? 'ALL' : s.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400/40 mx-auto mb-2" />
          <div className="text-[13px] text-red-400/60">{error}</div>
          <button onClick={handleRefresh} className="text-[11px] text-white/40 mt-2 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Crosshair className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <div className="text-[13px] text-white/30">No hunts match filter</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((hunt) => (
            <HuntCard
              key={hunt.id}
              hunt={hunt}
              onApprove={() => handleApprove(hunt)}
              onDismiss={() => handleDismiss(hunt)}
              busy={busyIds.has(hunt.id)}
              expanded={expandedId === hunt.id}
              onToggle={() => setExpandedId(expandedId === hunt.id ? null : hunt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  EyeOff,
  Radio,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createIncident,
  getMLDriftStatus,
  getThreatFeedHealth,
  listAlerts,
  listIncidents,
  updateAlert,
  updateIncident,
  type FeedHealthResponse,
  type Incident,
  type IncidentSeverity,
  type SentraAlert,
} from '@/lib/sentra-api';
import {
  classifyLambda,
  computeLutarInvariant,
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

const DRIFT_COLORS: Record<string, string> = {
  nominal: 'text-emerald-400',
  minor: 'text-amber-400',
  major: 'text-red-400',
};

const FRESHNESS_COLORS: Record<string, string> = {
  live: 'text-emerald-400',
  cached: 'text-amber-400',
  stale: 'text-red-400',
  error: 'text-red-400',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

type TriageItem = {
  type: 'alert' | 'incident';
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  source: string;
  detectedAt: string;
  description: string;
  affectedAssetCount: number;
  mitreStage: string;
};

interface DriftModel {
  modelId: string;
  driftStatus: string;
  psiScore: number;
  lastEvaluated: string;
}

function deriveTriageAxes(item: TriageItem) {
  const sevMap: Record<string, number> = { critical: 0.3, high: 0.55, medium: 0.75, low: 0.9 };
  const C = sevMap[item.severity] ?? 0.5;
  const H = item.type === 'incident' ? 0.7 : 0.85;
  const assetRatio = Math.max(0.3, 1 - (item.affectedAssetCount * 0.1));
  const R = Math.min(1, assetRatio);
  const F = item.mitreStage ? 0.65 : 0.8;
  return { cleanliness: C, horizon: H, resonance: R, frustum: F };
}

function FeedHealthBanner({ feedHealth }: { feedHealth: FeedHealthResponse }) {
  const feeds = feedHealth.feeds;
  const live = feeds.filter(f => f.freshness === 'live').length;
  const stale = feeds.filter(f => f.freshness === 'stale').length;
  const error = feeds.filter(f => f.freshness === 'error').length;

  return (
    <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Radio className="w-3 h-3 text-white/40" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Threat Feed Health</span>
      </div>
      <div className="flex gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400">{live} live</span>
        </div>
        {stale > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-mono text-amber-400">{stale} stale</span>
          </div>
        )}
        {error > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-mono text-red-400">{error} error</span>
          </div>
        )}
        <span className="text-[9px] font-mono text-white/20 ml-auto">{feeds.length} feeds</span>
      </div>
    </div>
  );
}

function DriftBanner({ models }: { models: DriftModel[] }) {
  const worstDrift = models.reduce((worst, m) => {
    const order: Record<string, number> = { major: 2, minor: 1, nominal: 0 };
    return (order[m.driftStatus] ?? 0) > (order[worst.driftStatus] ?? 0) ? m : worst;
  }, models[0]);

  if (!worstDrift) return null;

  return (
    <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap className="w-3 h-3 text-white/40" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">ML Model Drift</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {models.slice(0, 4).map(m => (
          <div key={m.modelId} className="flex items-center gap-1">
            <div className={cn('w-1.5 h-1.5 rounded-full', m.driftStatus === 'nominal' ? 'bg-emerald-400' : m.driftStatus === 'minor' ? 'bg-amber-400' : 'bg-red-400')} />
            <span className={cn('text-[9px] font-mono', DRIFT_COLORS[m.driftStatus])}>
              {m.modelId.split('-').pop()} PSI={m.psiScore.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SwipeableCard({
  item,
  onAcknowledge,
  onEscalate,
  onSuppress,
  busy,
}: {
  item: TriageItem;
  onAcknowledge: () => void;
  onEscalate: () => void;
  onSuppress: () => void;
  busy: boolean;
}) {
  const sev = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.low;
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const axes = deriveTriageAxes(item);
  const lutar = computeLutarInvariant(axes);
  const adr = classifyLambda(lutar.lambda);
  const lambdaPct = Math.round(lutar.lambda * 100);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
    const dx = currentX.current - startX.current;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${Math.max(-80, Math.min(80, dx))}px)`;
    }
  };
  const handleTouchEnd = () => {
    const dx = currentX.current - startX.current;
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0)';
    }
    if (dx > 60) {
      onAcknowledge();
    } else if (dx < -60) {
      onEscalate();
    }
    startX.current = 0;
    currentX.current = 0;
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-2">
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-emerald-500/20 flex items-center pl-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 ml-1 font-mono">ACK</span>
        </div>
        <div className="flex-1 bg-red-500/20 flex items-center justify-end pr-4">
          <span className="text-[10px] text-red-400 mr-1 font-mono">ESCALATE</span>
          <ArrowUpRight className="w-4 h-4 text-red-400" />
        </div>
      </div>
      <div
        ref={cardRef}
        className={cn(
          'relative z-10 p-3 border border-white/6 bg-[#0f0f12] transition-transform rounded-xl',
          busy && 'opacity-50 pointer-events-none',
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', sev.dot)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={cn('text-[9px] font-mono uppercase px-1 py-px rounded border', sev.badge, sev.text)}>
                {item.severity}
              </span>
              <span className="text-[9px] font-mono text-white/20 uppercase">{item.type}</span>
              <span className={cn('text-[8px] font-mono px-1 py-px rounded border', TIER_BG[adr.tier], TIER_COLORS[adr.tier])}>
                Λ {lambdaPct}%
              </span>
            </div>
            <div className="text-[13px] text-white/90 font-medium leading-tight">{item.title}</div>
            <div className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{item.description}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-white/25 font-mono">{item.source}</span>
              <span className="text-[10px] text-white/15">·</span>
              <span className="text-[10px] text-white/25 font-mono">{relativeTime(item.detectedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2.5 border-t border-white/4 pt-2">
          <button
            onClick={onAcknowledge}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono active:bg-emerald-500/20"
          >
            <Check className="w-3 h-3" /> ACK
          </button>
          <button
            onClick={onEscalate}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono active:bg-red-500/20"
          >
            <ArrowUpRight className="w-3 h-3" /> ESCALATE
          </button>
          {item.type === 'alert' && (
            <button
              onClick={onSuppress}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 border border-white/8 text-white/40 text-[10px] font-mono active:bg-white/10"
            >
              <EyeOff className="w-3 h-3" /> SUPPRESS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncidentTriage() {
  const [alerts, setAlerts] = useState<SentraAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [feedHealth, setFeedHealth] = useState<FeedHealthResponse | null>(null);
  const [driftModels, setDriftModels] = useState<DriftModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sevFilter, setSevFilter] = useState<'all' | IncidentSeverity>('all');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [alertRes, incRes, feedRes, driftRes] = await Promise.all([
        listAlerts(),
        listIncidents(),
        getThreatFeedHealth().catch(() => null),
        getMLDriftStatus().catch(() => null),
      ]);
      setAlerts(alertRes.alerts);
      setIncidents(incRes.incidents);
      if (feedRes) setFeedHealth(feedRes);
      if (driftRes) setDriftModels(driftRes.models ?? []);
    } catch {
      setError('Failed to load triage data');
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

  const items: TriageItem[] = [
    ...alerts.filter((a) => a.status === 'open').map((a) => ({
      type: 'alert' as const,
      id: a.id,
      title: a.title,
      severity: a.severity,
      status: a.status,
      source: a.source,
      detectedAt: a.detectedAt,
      description: a.description,
      affectedAssetCount: a.asset ? 1 : 0,
      mitreStage: '',
    })),
    ...incidents.filter((i) => i.status === 'open' || i.status === 'triaging').map((i) => ({
      type: 'incident' as const,
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      source: i.mitreStage,
      detectedAt: i.detectedAt,
      description: i.description,
      affectedAssetCount: i.affectedAssets.length,
      mitreStage: i.mitreStage,
    })),
  ]
    .filter((i) => sevFilter === 'all' || i.severity === sevFilter)
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const s = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
      if (s !== 0) return s;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });

  const handleAck = async (item: TriageItem) => {
    setBusyIds((prev) => new Set(prev).add(item.id));
    if (item.type === 'alert') {
      const res = await updateAlert(item.id, 'acknowledged');
      if (res.ok) setAlerts((prev) => prev.map((a) => (a.id === item.id ? res.alert : a)));
    } else {
      const res = await updateIncident(item.id, { status: 'triaging', actor: 'mobile-operator' });
      if (res.ok) setIncidents((prev) => prev.map((i) => (i.id === item.id ? res.incident : i)));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  const handleEscalate = async (item: TriageItem) => {
    setBusyIds((prev) => new Set(prev).add(item.id));
    if (item.type === 'alert') {
      const alert = alerts.find((a) => a.id === item.id);
      await createIncident({
        title: alert?.title ?? item.title,
        description: alert?.description ?? `Escalated from alert: ${item.title}`,
        severity: (item.severity as IncidentSeverity) ?? 'medium',
        tags: ['escalated-from-alert'],
      });
      await updateAlert(item.id, 'acknowledged');
    }
    if (item.type === 'incident') {
      await updateIncident(item.id, { status: 'escalated', actor: 'mobile-operator', note: 'Escalated from mobile triage' });
    }
    await load();
    setBusyIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  const handleSuppress = async (item: TriageItem) => {
    if (item.type !== 'alert') return;
    setBusyIds((prev) => new Set(prev).add(item.id));
    const res = await updateAlert(item.id, 'suppressed');
    if (res.ok) setAlerts((prev) => prev.map((a) => (a.id === item.id ? res.alert : a)));
    setBusyIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  return (
    <div
      ref={ptr.containerRef}
      className="px-4 py-4 space-y-3 overflow-auto h-full"
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
          <h2 className="text-base font-semibold text-white/90">Incident Triage</h2>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            Swipe right to acknowledge · left to escalate
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

      {!loading && !error && (
        <>
          {feedHealth && <FeedHealthBanner feedHealth={feedHealth} />}
          {driftModels.length > 0 && <DriftBanner models={driftModels} />}
        </>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-1 text-[10px] font-mono text-white/40 px-2 py-1 rounded-lg bg-white/5 border border-white/8"
        >
          {sevFilter === 'all' ? 'All Severities' : sevFilter.toUpperCase()}
          <ChevronDown className="w-3 h-3" />
        </button>
        {filterOpen && (
          <div className="flex gap-1">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSevFilter(s); setFilterOpen(false); }}
                className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors',
                  sevFilter === s ? 'bg-white/10 border-white/20 text-white/80' : 'bg-white/3 border-white/6 text-white/30',
                )}
              >
                {s === 'all' ? 'ALL' : s.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <span className="text-[10px] font-mono text-white/20 ml-auto">{items.length} items</span>
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
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <div className="text-[13px] text-white/30">No open items to triage</div>
        </div>
      ) : (
        items.map((item) => (
          <SwipeableCard
            key={`${item.type}-${item.id}`}
            item={item}
            onAcknowledge={() => handleAck(item)}
            onEscalate={() => handleEscalate(item)}
            onSuppress={() => handleSuppress(item)}
            busy={busyIds.has(item.id)}
          />
        ))
      )}
    </div>
  );
}

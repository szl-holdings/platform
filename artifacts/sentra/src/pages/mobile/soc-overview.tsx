import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  Cpu,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getHardwareTrustSummary,
  getSentraSummary,
  listAgents,
  listIncidents,
  type Agent,
  type HardwareTrustSummary,
  type Incident,
  type SentraSummary,
} from '@/lib/sentra-api';
import {
  agentStatesToPhases,
  classifyLambda,
  COHERENCE_COLORS,
  computeKuramoto,
  computeLutarInvariant,
  deriveSocAxes,
  TIER_BG,
  TIER_COLORS,
  type ADRDecision,
  type KuramotoResult,
  type LutarResult,
} from '@/lib/ouroboros-compute';
import { usePullToRefresh } from './use-pull-to-refresh';

const SEVERITY_COLORS: Record<string, { dot: string; badge: string; text: string }> = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
  high: { dot: 'bg-orange-400', badge: 'bg-orange-400/10 border-orange-400/30', text: 'text-orange-300' },
  medium: { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 border-yellow-400/30', text: 'text-yellow-300' },
  low: { dot: 'bg-slate-400', badge: 'bg-slate-400/10 border-slate-400/30', text: 'text-slate-400' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Shield; color?: string }) {
  return (
    <div className="rounded-xl p-3 border border-white/6" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn('w-3.5 h-3.5', color ?? 'text-white/40')} />
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <div className={cn('text-xl font-bold tabular-nums', color ?? 'text-white/90')}>{value}</div>
    </div>
  );
}

function LambdaGauge({ result, adr }: { result: LutarResult; adr: ADRDecision }) {
  const pct = Math.round(result.lambda * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - result.lambda);

  return (
    <div className="rounded-xl p-4 border border-white/6" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-[#c9b787]" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Lutar Invariant Λ</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={pct >= 85 ? '#34d399' : pct >= 65 ? '#c9b787' : '#f87171'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums text-white/90">{pct}</span>
            <span className="text-[8px] font-mono text-white/30">/ 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="text-[9px] font-mono text-white/25">{result.formula}</div>
          {(['cleanliness', 'horizon', 'resonance', 'frustum'] as const).map(axis => (
            <div key={axis} className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-white/30 uppercase w-6">{axis[0]}</span>
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#c9b787] transition-all"
                  style={{ width: `${Math.round(result.axes[axis] * 100)}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-white/40 tabular-nums w-7 text-right">
                {(result.axes[axis] * 100).toFixed(0)}
              </span>
            </div>
          ))}
          <div className={cn('flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded border text-[8px] font-mono w-fit', TIER_BG[adr.tier])}>
            <span className={TIER_COLORS[adr.tier]}>ADR: {adr.tier.toUpperCase()}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/30">{adr.passes}×pass · {adr.costMultiplier}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoherenceCard({ kuramoto }: { kuramoto: KuramotoResult }) {
  const rPct = Math.round(kuramoto.r * 100);
  return (
    <div className="rounded-xl p-3 border border-white/6" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Kuramoto Coherence</span>
        </div>
        <span className={cn('text-[9px] font-mono font-bold', COHERENCE_COLORS[kuramoto.status])}>
          {kuramoto.status}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-2xl font-bold tabular-nums', COHERENCE_COLORS[kuramoto.status])}>
          {rPct}%
        </span>
        <div className="flex-1">
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', kuramoto.r >= 0.85 ? 'bg-emerald-400' : kuramoto.r >= 0.4 ? 'bg-amber-400' : 'bg-red-400')}
              style={{ width: `${rPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[7px] font-mono text-white/20">0</span>
            <span className="text-[7px] font-mono text-white/20">r = |1/N Σ e^(iθ_k)|</span>
            <span className="text-[7px] font-mono text-white/20">1</span>
          </div>
        </div>
      </div>
      <div className="text-[8px] font-mono text-white/20 mt-1">
        {kuramoto.phaseCount} agents · threshold r ≥ 0.85
      </div>
    </div>
  );
}

function IncidentRow({ incident, onTap }: { incident: Incident; onTap: () => void }) {
  const sev = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS.low;
  return (
    <button onClick={onTap} className="w-full text-left">
      <div className="flex items-center gap-3 py-3 px-1 border-b border-white/4 active:bg-white/5 transition-colors">
        <div className={cn('w-2 h-2 rounded-full shrink-0', sev.dot)} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white/90 font-medium truncate">{incident.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-[10px] font-mono uppercase', sev.text)}>{incident.severity}</span>
            <span className="text-[10px] text-white/25">·</span>
            <span className="text-[10px] text-white/40 capitalize">{incident.status}</span>
            <span className="text-[10px] text-white/25">·</span>
            <span className="text-[10px] text-white/30 font-mono">{relativeTime(incident.detectedAt)} ago</span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
      </div>
    </button>
  );
}

function IncidentDetail({ incident, onBack }: { incident: Incident; onBack: () => void }) {
  const sev = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS.low;
  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      <button onClick={onBack} className="text-[11px] text-white/40 hover:text-white/60 transition-colors">
        ← Back to SOC
      </button>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border', sev.badge, sev.text)}>
            {incident.severity}
          </span>
          <span className="text-[10px] font-mono text-white/40 uppercase">{incident.status}</span>
        </div>
        <h2 className="text-base font-semibold text-white/90">{incident.title}</h2>
        <p className="text-[12px] text-white/50 mt-1">{incident.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2.5 border border-white/6 bg-white/[0.02]">
          <span className="text-[9px] font-mono text-white/30 uppercase">MITRE Stage</span>
          <div className="text-[12px] text-white/70 mt-0.5 font-mono">{incident.mitreStage}</div>
        </div>
        <div className="rounded-lg p-2.5 border border-white/6 bg-white/[0.02]">
          <span className="text-[9px] font-mono text-white/30 uppercase">Detected</span>
          <div className="text-[12px] text-white/70 mt-0.5 font-mono">{relativeTime(incident.detectedAt)} ago</div>
        </div>
      </div>
      {incident.affectedAssets.length > 0 && (
        <div>
          <span className="text-[10px] font-mono text-white/30 uppercase">Affected Assets</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {incident.affectedAssets.map((a) => (
              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/60 font-mono">{a}</span>
            ))}
          </div>
        </div>
      )}
      {incident.timeline.length > 0 && (
        <div>
          <span className="text-[10px] font-mono text-white/30 uppercase mb-2 block">Timeline</span>
          <div className="space-y-0">
            {incident.timeline.map((entry, i) => (
              <div key={entry.id} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-white/20 mt-1.5 shrink-0" />
                  {i < incident.timeline.length - 1 && <div className="w-px flex-1 bg-white/8" />}
                </div>
                <div className="pb-3 min-w-0">
                  <div className="text-[11px] text-white/70">{entry.message}</div>
                  <div className="text-[9px] text-white/30 font-mono mt-0.5">
                    {entry.actor} · {relativeTime(entry.timestamp)} ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocOverview() {
  const [summary, setSummary] = useState<SentraSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [hwTrust, setHwTrust] = useState<HardwareTrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sumResult, incResult, agResult, hwResult] = await Promise.all([
        getSentraSummary(),
        listIncidents(),
        listAgents(),
        getHardwareTrustSummary().catch(() => null),
      ]);
      setSummary(sumResult);
      setIncidents(incResult.incidents);
      setAgents(agResult.agents);
      setHwTrust(hwResult);
    } catch {
      setError('Failed to load SOC data');
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

  if (selectedIncident) {
    return <IncidentDetail incident={selectedIncident} onBack={() => setSelectedIncident(null)} />;
  }

  const healthyAgents = agents.filter((a) => a.status === 'healthy').length;
  const staleAgents = agents.filter((a) => a.status === 'stale').length;
  const isolatedAgents = agents.filter((a) => a.status === 'isolated').length;
  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 5);

  const phases = agentStatesToPhases(agents.map(a => a.status));
  const kuramoto = computeKuramoto(phases);

  const socAxes = deriveSocAxes({
    verifiedAnchors: hwTrust?.verifiedAnchors ?? Math.round(healthyAgents * 0.95),
    totalAnchors: hwTrust?.totalAnchors ?? Math.max(1, agents.length),
    recoveryPosture: summary ? Math.round(100 - (summary.activeIncidents * 5)) : 85,
    healthyAgents,
    totalAgents: agents.length,
    reconciledViews: Math.max(1, agents.length - isolatedAgents),
    totalViews: Math.max(1, agents.length),
  });

  const lutarResult = computeLutarInvariant(socAxes);
  const adrDecision = classifyLambda(lutarResult.lambda);

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
          <h2 className="text-base font-semibold text-white/90">SOC Overview</h2>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            {loading ? 'Loading...' : `Updated ${summary?.lastUpdated ? relativeTime(summary.lastUpdated) + ' ago' : 'now'}`}
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
      ) : (
        <>
          <LambdaGauge result={lutarResult} adr={adrDecision} />

          <CoherenceCard kuramoto={kuramoto} />

          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Active Incidents" value={summary?.activeIncidents ?? incidents.filter((i) => i.status !== 'resolved').length} icon={ShieldAlert} color="text-red-400" />
            <StatCard label="Critical Alerts" value={summary?.criticalAlerts ?? 0} icon={AlertTriangle} color="text-orange-400" />
            <StatCard label="Total Alerts" value={summary?.totalAlerts ?? 0} icon={Activity} />
            <StatCard label="Agent Fleet" value={`${healthyAgents}/${agents.length}`} icon={Server} color={healthyAgents === agents.length ? 'text-emerald-400' : 'text-yellow-400'} />
          </div>

          <div className="rounded-xl border border-white/6 p-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Fleet Health</span>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-white/60">{healthyAgents} healthy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-[11px] text-white/60">{staleAgents} stale</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[11px] text-white/60">{isolatedAgents} isolated</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Recent Incidents</span>
              <span className="text-[10px] text-white/20 font-mono">{recentIncidents.length} of {incidents.length}</span>
            </div>
            {recentIncidents.length === 0 ? (
              <div className="text-center py-8 text-white/20 text-[12px]">No incidents found</div>
            ) : (
              recentIncidents.map((inc) => (
                <IncidentRow key={inc.id} incident={inc} onTap={() => setSelectedIncident(inc)} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

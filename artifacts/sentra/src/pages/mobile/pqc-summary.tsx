import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Cpu,
  Key,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getHardwareTrustSummary,
  getPqcReadinessScore,
  listMigrationPhases,
  listPqcStandards,
  type HardwareTrustSummary,
  type MigrationPhaseItem,
  type PqcReadinessScore,
  type PqcStandardItem,
} from '@/lib/sentra-api';
import {
  classifyLambda,
  computeLutarInvariant,
  derivePqcAxes,
  TIER_BG,
  TIER_COLORS,
} from '@/lib/ouroboros-compute';
import { usePullToRefresh } from './use-pull-to-refresh';

type AlgorithmStatus = 'deployed' | 'in-progress' | 'planned' | 'not-started';

const STATUS_CONFIG: Record<AlgorithmStatus, { label: string; icon: typeof Check; color: string; bg: string }> = {
  deployed: { label: 'Deployed', icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  planned: { label: 'Planned', icon: ArrowRight, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  'not-started': { label: 'Not Started', icon: X, color: 'text-white/25', bg: 'bg-white/3 border-white/6' },
};

function StatusBadge({ status }: { status: AlgorithmStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['not-started'];
  const Icon = cfg.icon;
  return (
    <span className={cn('flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border', cfg.bg, cfg.color)}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

export default function PqcSummary() {
  const [standards, setStandards] = useState<PqcStandardItem[]>([]);
  const [phases, setPhases] = useState<MigrationPhaseItem[]>([]);
  const [readiness, setReadiness] = useState<PqcReadinessScore | null>(null);
  const [hwSummary, setHwSummary] = useState<HardwareTrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [stdRes, phaseRes, readinessRes, hwRes] = await Promise.all([
        listPqcStandards(),
        listMigrationPhases(),
        getPqcReadinessScore(),
        getHardwareTrustSummary(),
      ]);
      setStandards(stdRes);
      setPhases(phaseRes);
      setReadiness(readinessRes);
      setHwSummary(hwRes);
    } catch {
      setError('Failed to load PQC data');
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

  const deployedStandards = standards.filter((s) => s.status === 'deployed').length;
  const inProgressStandards = standards.filter((s) => s.status === 'in-progress').length;
  const completedPhases = phases.filter((p) => p.status === 'deployed').length;

  const pqcAxes = derivePqcAxes({
    verifiedAnchors: hwSummary?.verifiedAnchors ?? 0,
    totalAnchors: hwSummary?.totalAnchors ?? 1,
    deployedStandards,
    totalStandards: Math.max(1, standards.length),
    attestedComponents: hwSummary?.attestedComponents ?? 0,
    totalComponents: hwSummary?.totalComponents ?? 1,
    completedPhases,
    totalPhases: Math.max(1, phases.length),
  });
  const pqcLutar = computeLutarInvariant(pqcAxes);
  const pqcAdr = classifyLambda(pqcLutar.lambda);
  const lambdaPct = Math.round(pqcLutar.lambda * 100);

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
          <h2 className="text-base font-semibold text-white/90">PQC & Hardware Readiness</h2>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            {loading ? 'Loading...' : 'Post-Quantum Cryptography migration overview'}
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
          <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-[#c9b787]" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">PQC Lutar Invariant Λ</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold tabular-nums text-[#c9b787]">
                {lambdaPct}
                <span className="text-sm text-white/30 ml-0.5">%</span>
              </div>
              <div className="flex-1 space-y-1">
                {([
                  { key: 'cleanliness' as const, label: 'C · Anchors' },
                  { key: 'horizon' as const, label: 'H · Standards' },
                  { key: 'resonance' as const, label: 'R · Attestation' },
                  { key: 'frustum' as const, label: 'F · Phases' },
                ]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-[7px] font-mono text-white/25 w-16 truncate">{label}</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#c9b787]" style={{ width: `${Math.round(pqcLutar.axes[key] * 100)}%` }} />
                    </div>
                    <span className="text-[7px] font-mono text-white/30 tabular-nums w-6 text-right">{(pqcLutar.axes[key] * 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={cn('flex items-center gap-1.5 mt-2 px-1.5 py-0.5 rounded border text-[8px] font-mono w-fit', TIER_BG[pqcAdr.tier])}>
              <span className={TIER_COLORS[pqcAdr.tier]}>ADR: {pqcAdr.tier.toUpperCase()}</span>
              <span className="text-white/20">·</span>
              <span className="text-white/30">{pqcAdr.rationale.split('.')[0]}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-emerald-400 tabular-nums">{readiness?.deployed ?? deployedStandards}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">Deployed</div>
            </div>
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-amber-400 tabular-nums">{readiness?.inProgress ?? inProgressStandards}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">In Progress</div>
            </div>
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-blue-400 tabular-nums">{completedPhases}/{phases.length}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">Phases</div>
            </div>
          </div>

          {readiness && (
            <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/40 uppercase">Readiness Score</span>
                <span className="text-sm font-bold text-[#c9b787]">{readiness.score}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#c9b787] transition-all"
                  style={{ width: `${readiness.score}%` }}
                />
              </div>
            </div>
          )}

          {standards.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 block">
                PQC Standards
              </span>
              <div className="space-y-2">
                {standards.map((std) => (
                  <div key={std.id} className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-[13px] text-white/90 font-medium">{std.name}</span>
                          <span className="text-[10px] text-white/25 font-mono">{std.fips}</span>
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5">{std.purpose}</div>
                      </div>
                      <StatusBadge status={std.status} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] text-white/30 font-mono">{std.deployedCount} deployed</span>
                      <span className="text-[10px] text-white/30 font-mono">{std.plannedCount} planned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phases.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 block">
                Migration Progress
              </span>
              <div className="space-y-1">
                {phases.map((phase) => {
                  const cfg = STATUS_CONFIG[phase.status] ?? STATUS_CONFIG['not-started'];
                  const Icon = cfg.icon;
                  return (
                    <div key={phase.id} className="flex items-center gap-2.5 py-2 border-b border-white/4 last:border-0">
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center border', cfg.bg)}>
                        <Icon className={cn('w-3 h-3', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-white/70 truncate">{phase.phase}</div>
                        <div className="text-[9px] text-white/25 font-mono">{phase.taskCount} tasks</div>
                      </div>
                      <span className={cn('text-[9px] font-mono', cfg.color)}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hwSummary && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Hardware Trust Summary
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <Cpu className="w-3.5 h-3.5 text-white/30 mb-1" />
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">{hwSummary.verifiedAnchors}/{hwSummary.totalAnchors}</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase">Verified Anchors</div>
                </div>
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <Cpu className="w-3.5 h-3.5 text-white/30 mb-1" />
                  <div className="text-lg font-bold text-blue-400 tabular-nums">{hwSummary.avgIntegrity}%</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase">Avg Integrity</div>
                </div>
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <Cpu className="w-3.5 h-3.5 text-white/30 mb-1" />
                  <div className="text-lg font-bold text-amber-400 tabular-nums">{hwSummary.attestedComponents}/{hwSummary.totalComponents}</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase">Attested Components</div>
                </div>
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <Cpu className="w-3.5 h-3.5 text-white/30 mb-1" />
                  <div className="text-lg font-bold text-[#c9b787] tabular-nums">{hwSummary.cheriCompartments}</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase">CHERI Compartments</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Bot,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldOff,
  Unlock,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  composeSigil,
  getMeshSummary,
  patchMcpServerTrustState,
  patchMeshRuntimeTrustState,
  listMeshExposures,
  listMeshMcpServers,
  listMeshResilience,
  listMeshRuntimes,
  type MeshExposureItem,
  type MeshMcpServer,
  type MeshResilienceItem,
  type MeshRuntime,
  type MeshSummary,
  type SigilReport,
} from '@/lib/sentra-api';
import {
  classifyLambda,
  computeImpedance,
  computeLutarInvariant,
  computeQFactor,
  deriveMeshAxes,
  Q_COLORS,
  TIER_BG,
  TIER_COLORS,
  type ImpedanceResult,
  type QFactorResult,
} from '@/lib/ouroboros-compute';
import { usePullToRefresh } from './use-pull-to-refresh';

type TrustState = 'trusted' | 'unverified' | 'quarantined';

const TRUST_STYLES: Record<TrustState, { color: string; bg: string; icon: typeof Shield }> = {
  trusted: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: Shield },
  unverified: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: AlertTriangle },
  quarantined: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: ShieldOff },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-slate-400',
};

function ImpedanceIndicator({ imp }: { imp: ImpedanceResult }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[8px] font-mono text-white/25">Z={imp.Z.toFixed(2)}</span>
      <span className="text-[8px] font-mono text-white/25">|Γ|={imp.gamma.toFixed(3)}</span>
      <span className={cn('text-[8px] font-mono', imp.matched ? 'text-emerald-400' : imp.gamma >= 0.5 ? 'text-red-400' : 'text-amber-400')}>
        {imp.matched ? 'MATCHED' : imp.gamma >= 0.5 ? 'DENY' : 'WARN'}
      </span>
      <span className="text-[8px] font-mono text-white/25">η={Math.round(imp.eta * 100)}%</span>
    </div>
  );
}

function RuntimeCard({
  runtime,
  exposures,
  onQuarantine,
  onRelease,
  busy,
}: {
  runtime: MeshRuntime;
  exposures: MeshExposureItem[];
  onQuarantine: () => void;
  onRelease: () => void;
  busy: boolean;
}) {
  const trust = TRUST_STYLES[runtime.trustState];
  const TrustIcon = trust.icon;

  const boundaryEvents = exposures.length + (runtime.trustState === 'quarantined' ? 3 : 0);
  const successfulHandoffs = runtime.activeAgentIds.length;
  const imp = computeImpedance(boundaryEvents, successfulHandoffs);

  return (
    <div className={cn('rounded-xl p-3 border', trust.bg)}>
      <div className="flex items-start gap-2.5">
        <Bot className={cn('w-4 h-4 mt-0.5 shrink-0', trust.color)} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white/90 font-medium truncate">{runtime.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <TrustIcon className={cn('w-3 h-3', trust.color)} />
            <span className={cn('text-[10px] font-mono uppercase', trust.color)}>{runtime.trustState}</span>
            <span className="text-[10px] text-white/25">·</span>
            <span className="text-[10px] text-white/30 font-mono">v{runtime.version}</span>
          </div>
          <ImpedanceIndicator imp={imp} />
          {exposures.length > 0 && (
            <div className="mt-2 space-y-1">
              {exposures.slice(0, 2).map((exp) => (
                <div key={exp.id} className="flex items-center gap-1.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[exp.severity])} />
                  <span className="text-[10px] text-white/50 truncate">{exp.title}</span>
                </div>
              ))}
              {exposures.length > 2 && (
                <span className="text-[9px] text-white/25 font-mono">+{exposures.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 mt-2.5 border-t border-white/6 pt-2">
        {runtime.trustState === 'quarantined' ? (
          <button
            onClick={onRelease}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono active:bg-emerald-500/20 disabled:opacity-50"
          >
            <Unlock className="w-3 h-3" /> RELEASE
          </button>
        ) : (
          <button
            onClick={onQuarantine}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono active:bg-red-500/20 disabled:opacity-50"
          >
            <Lock className="w-3 h-3" /> QUARANTINE
          </button>
        )}
      </div>
    </div>
  );
}

function McpCard({
  server,
  exposures,
  onQuarantine,
  onRelease,
  busy,
  actionResult,
}: {
  server: MeshMcpServer;
  exposures: MeshExposureItem[];
  onQuarantine: () => void;
  onRelease: () => void;
  busy: boolean;
  actionResult?: { ok: boolean; msg: string };
}) {
  const trust = TRUST_STYLES[server.trustState];
  const TrustIcon = trust.icon;

  return (
    <div className={cn('rounded-xl p-3 border', trust.bg)}>
      <div className="flex items-start gap-2.5">
        <Server className={cn('w-4 h-4 mt-0.5 shrink-0', trust.color)} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white/90 font-medium truncate">{server.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <TrustIcon className={cn('w-3 h-3', trust.color)} />
            <span className={cn('text-[10px] font-mono uppercase', trust.color)}>{server.trustState}</span>
            <span className="text-[10px] text-white/25">·</span>
            <span className="text-[10px] text-white/30 font-mono">v{server.version}</span>
          </div>
          {server.detectedEgressDomains.length > server.allowedEgressDomains.length && (
            <div className="mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-mono">
                {server.detectedEgressDomains.length - server.allowedEgressDomains.length} unauthorized egress
              </span>
            </div>
          )}
          {exposures.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {exposures.slice(0, 2).map((exp) => (
                <div key={exp.id} className="flex items-center gap-1.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[exp.severity])} />
                  <span className="text-[10px] text-white/50 truncate">{exp.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {actionResult && (
        <div className={cn('mt-2 text-[10px] font-mono text-center py-1 rounded', actionResult.ok ? 'text-emerald-400' : 'text-red-400')}>
          {actionResult.msg}
        </div>
      )}
      <div className="flex gap-1.5 mt-2.5 border-t border-white/6 pt-2">
        {server.trustState === 'quarantined' ? (
          <button
            onClick={onRelease}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono active:bg-emerald-500/20 disabled:opacity-50"
          >
            <Unlock className="w-3 h-3" /> RELEASE
          </button>
        ) : (
          <button
            onClick={onQuarantine}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono active:bg-red-500/20 disabled:opacity-50"
          >
            <Lock className="w-3 h-3" /> QUARANTINE
          </button>
        )}
      </div>
    </div>
  );
}

export default function MeshHealth() {
  const [runtimes, setRuntimes] = useState<MeshRuntime[]>([]);
  const [mcpServers, setMcpServers] = useState<MeshMcpServer[]>([]);
  const [exposures, setExposures] = useState<MeshExposureItem[]>([]);
  const [summary, setSummary] = useState<MeshSummary | null>(null);
  const [resilience, setResilience] = useState<MeshResilienceItem | null>(null);
  const [sigilReport, setSigilReport] = useState<SigilReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [actionResults, setActionResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [tab, setTab] = useState<'runtimes' | 'mcp'>('runtimes');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [rt, mcp, exp, sum, res] = await Promise.all([
        listMeshRuntimes(),
        listMeshMcpServers(),
        listMeshExposures(),
        getMeshSummary(),
        listMeshResilience(),
      ]);
      setRuntimes(rt);
      setMcpServers(mcp);
      setExposures(exp);
      setSummary(sum);
      setResilience(res);

      if (res) {
        const sigil = await composeSigil({
          provenance: res.secretHygiene / 100,
          containment: res.egressContainment / 100,
          coherence: res.supplyChain / 100,
          convergence: res.permissionSurface / 100,
        });
        setSigilReport(sigil);
      }
    } catch {
      setError('Failed to load mesh data');
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

  const runtimeExposures = (id: string) =>
    exposures.filter((e) => e.affectedAgentIds.includes(id));
  const mcpExposures = (id: string) =>
    exposures.filter((e) => e.affectedMcpIds.includes(id));

  const handleQuarantine = async (runtime: MeshRuntime) => {
    setBusyIds((prev) => new Set(prev).add(runtime.id));
    const res = await patchMeshRuntimeTrustState(runtime.id, 'quarantined');
    if (res.ok) {
      setActionResults((prev) => ({ ...prev, [runtime.id]: { ok: true, msg: 'Quarantined' } }));
      await load();
    } else {
      setActionResults((prev) => ({ ...prev, [runtime.id]: { ok: false, msg: res.error } }));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(runtime.id); return n; });
    setTimeout(() => setActionResults((prev) => { const n = { ...prev }; delete n[runtime.id]; return n; }), 3000);
  };

  const handleRelease = async (runtime: MeshRuntime) => {
    setBusyIds((prev) => new Set(prev).add(runtime.id));
    const res = await patchMeshRuntimeTrustState(runtime.id, 'trusted');
    if (res.ok) {
      setActionResults((prev) => ({ ...prev, [runtime.id]: { ok: true, msg: 'Released' } }));
      await load();
    } else {
      setActionResults((prev) => ({ ...prev, [runtime.id]: { ok: false, msg: res.error } }));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(runtime.id); return n; });
    setTimeout(() => setActionResults((prev) => { const n = { ...prev }; delete n[runtime.id]; return n; }), 3000);
  };

  const handleMcpQuarantine = async (server: MeshMcpServer) => {
    setBusyIds((prev) => new Set(prev).add(server.id));
    const res = await patchMcpServerTrustState(server.id, 'quarantined');
    if (res.ok) {
      setActionResults((prev) => ({ ...prev, [server.id]: { ok: true, msg: 'Quarantined' } }));
      await load();
    } else {
      setActionResults((prev) => ({ ...prev, [server.id]: { ok: false, msg: res.error } }));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(server.id); return n; });
    setTimeout(() => setActionResults((prev) => { const n = { ...prev }; delete n[server.id]; return n; }), 3000);
  };

  const handleMcpRelease = async (server: MeshMcpServer) => {
    setBusyIds((prev) => new Set(prev).add(server.id));
    const res = await patchMcpServerTrustState(server.id, 'trusted');
    if (res.ok) {
      setActionResults((prev) => ({ ...prev, [server.id]: { ok: true, msg: 'Released' } }));
      await load();
    } else {
      setActionResults((prev) => ({ ...prev, [server.id]: { ok: false, msg: res.error } }));
    }
    setBusyIds((prev) => { const n = new Set(prev); n.delete(server.id); return n; });
    setTimeout(() => setActionResults((prev) => { const n = { ...prev }; delete n[server.id]; return n; }), 3000);
  };

  const trustedCount = summary?.trustedRuntimes ?? runtimes.filter((r) => r.trustState === 'trusted').length;
  const quarantinedCount = summary?.quarantinedRuntimes ?? runtimes.filter((r) => r.trustState === 'quarantined').length;
  const criticalExposures = summary?.criticalExposures ?? exposures.filter((e) => e.severity === 'critical').length;

  const meshAxes = resilience ? deriveMeshAxes({
    secretHygiene: resilience.secretHygiene,
    permissionSurface: resilience.permissionSurface,
    egressContainment: resilience.egressContainment,
    supplyChain: resilience.supplyChain,
  }) : null;
  const meshLutar = meshAxes ? computeLutarInvariant(meshAxes) : null;
  const meshAdr = meshLutar ? classifyLambda(meshLutar.lambda) : null;

  const meshQFactor = resilience ? computeQFactor(
    trustedCount,
    quarantinedCount + criticalExposures,
  ) : null;

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
          <h2 className="text-base font-semibold text-white/90">Agent Mesh Health</h2>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            {loading ? 'Loading...' : `${runtimes.length} runtimes · ${mcpServers.length} MCP servers`}
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
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-emerald-400 tabular-nums">{trustedCount}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">Trusted</div>
            </div>
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-red-400 tabular-nums">{quarantinedCount}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">Quarantined</div>
            </div>
            <div className="rounded-xl p-2.5 border border-white/6 bg-white/[0.025] text-center">
              <div className="text-lg font-bold text-orange-400 tabular-nums">{criticalExposures}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase">Critical</div>
            </div>
          </div>

          {meshLutar && meshAdr && (
            <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-[#c9b787]" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Mesh Λ Invariant</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold tabular-nums text-[#c9b787]">
                  {Math.round(meshLutar.lambda * 100)}
                  <span className="text-sm text-white/30 ml-0.5">%</span>
                </div>
                <div className="flex-1 space-y-1">
                  {(['cleanliness', 'horizon', 'resonance', 'frustum'] as const).map(axis => (
                    <div key={axis} className="flex items-center gap-1.5">
                      <span className="text-[7px] font-mono text-white/25 uppercase w-5">{axis[0]}</span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#c9b787]" style={{ width: `${Math.round(meshLutar.axes[axis] * 100)}%` }} />
                      </div>
                      <span className="text-[7px] font-mono text-white/30 tabular-nums w-6 text-right">{(meshLutar.axes[axis] * 100).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn('flex items-center gap-1.5 mt-2 px-1.5 py-0.5 rounded border text-[8px] font-mono w-fit', TIER_BG[meshAdr.tier])}>
                <span className={TIER_COLORS[meshAdr.tier]}>ADR: {meshAdr.tier.toUpperCase()}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/30">{meshAdr.passes}×pass</span>
              </div>
            </div>
          )}

          {(meshQFactor || sigilReport) && (
            <div className="grid grid-cols-2 gap-2">
              {meshQFactor && (
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <span className="text-[9px] font-mono text-white/30 uppercase block mb-1">Q-Factor</span>
                  <div className={cn('text-xl font-bold tabular-nums', Q_COLORS[meshQFactor.status])}>
                    {meshQFactor.Q.toFixed(2)}
                  </div>
                  <div className={cn('text-[8px] font-mono', Q_COLORS[meshQFactor.status])}>
                    {meshQFactor.status}
                  </div>
                  <div className="text-[7px] font-mono text-white/20 mt-1">Q = W_useful / W_lost</div>
                </div>
              )}
              {sigilReport && (
                <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
                  <span className="text-[9px] font-mono text-white/30 uppercase block mb-1">SIGIL Σ</span>
                  <div className="text-xl font-bold tabular-nums text-[#c9b787]">
                    {(sigilReport.sigma * 100).toFixed(1)}%
                  </div>
                  <div className="text-[8px] font-mono text-white/25">
                    floor {(sigilReport.proof.minAxis * 100).toFixed(0)}% · ceil {(sigilReport.proof.maxAxis * 100).toFixed(0)}%
                  </div>
                  <div className="text-[7px] font-mono text-white/20 mt-1">Σ = P·K·Φ·C composition</div>
                </div>
              )}
            </div>
          )}

          {resilience && (
            <div className="rounded-xl p-3 border border-white/6 bg-white/[0.025]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Resilience Index</span>
                <span className="text-sm font-bold text-[#c9b787]">{resilience.grade}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#c9b787] transition-all"
                  style={{ width: `${resilience.overall}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[
                  { label: 'Secret', value: resilience.secretHygiene },
                  { label: 'Perm', value: resilience.permissionSurface },
                  { label: 'Supply', value: resilience.supplyChain },
                  { label: 'Egress', value: resilience.egressContainment },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-[10px] font-bold text-white/60 tabular-nums">{value}</div>
                    <div className="text-[7px] font-mono text-white/20 uppercase">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1 bg-white/3 rounded-lg p-0.5 border border-white/6">
            <button
              onClick={() => setTab('runtimes')}
              className={cn(
                'flex-1 py-1.5 rounded-md text-[10px] font-mono uppercase transition-colors',
                tab === 'runtimes' ? 'bg-white/10 text-white/90' : 'text-white/30',
              )}
            >
              Runtimes ({runtimes.length})
            </button>
            <button
              onClick={() => setTab('mcp')}
              className={cn(
                'flex-1 py-1.5 rounded-md text-[10px] font-mono uppercase transition-colors',
                tab === 'mcp' ? 'bg-white/10 text-white/90' : 'text-white/30',
              )}
            >
              MCP Servers ({mcpServers.length})
            </button>
          </div>

          {runtimes.length === 0 && mcpServers.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <div className="text-[13px] text-white/30">No mesh nodes found</div>
            </div>
          ) : tab === 'runtimes' ? (
            <div className="space-y-2">
              {runtimes.map((r) => (
                <div key={r.id}>
                  <RuntimeCard
                    runtime={r}
                    exposures={runtimeExposures(r.id)}
                    onQuarantine={() => handleQuarantine(r)}
                    onRelease={() => handleRelease(r)}
                    busy={busyIds.has(r.id)}
                  />
                  {actionResults[r.id] && (
                    <div className={cn(
                      'text-[10px] font-mono mt-1 px-2 py-1 rounded',
                      actionResults[r.id].ok ? 'text-emerald-400 bg-emerald-400/5' : 'text-red-400 bg-red-400/5',
                    )}>
                      {actionResults[r.id].msg}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mcpServers.map((s) => (
                <McpCard
                  key={s.id}
                  server={s}
                  exposures={mcpExposures(s.id)}
                  onQuarantine={() => handleMcpQuarantine(s)}
                  onRelease={() => handleMcpRelease(s)}
                  busy={busyIds.has(s.id)}
                  actionResult={actionResults[s.id]}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

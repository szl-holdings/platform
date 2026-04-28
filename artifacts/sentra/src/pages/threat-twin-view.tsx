import { ConfidenceMeter, ProofEnvelope } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Network,
  RefreshCw,
  Server,
  Shield,
  Target,
  XCircle,
} from 'lucide-react';
import {
  affectedSystems,
  containmentWorkflow,
  phantomClusterActor,
  phantomIndicators,
  threatTwins,
} from '../data/threat-twin';
import { api } from '../lib/api';

interface TopologyNode {
  id: string;
  name: string;
  type: string;
  zone: string;
  syncState: 'synced' | 'drifted' | 'offline';
  vulnerabilities: number;
  criticalVulnerabilities: number;
  riskScore: number;
  hasActiveIncident: boolean;
  lastSyncLabel: string;
}

const SYNC_COLORS: Record<string, string> = {
  synced: '#c9b787',
  drifted: '#c9b787',
  offline: '#64748b',
};

export default function ThreatTwinView() {
  const actor = phantomClusterActor;
  const auditTrail = threatTwins[0].auditTrail.slice(0, 3);

  const {
    data: topoData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['threat-twin-topology'],
    queryFn: () => api.digitalTwin.topology(),
    refetchInterval: 30000,
    select: (res: { data?: { nodes?: TopologyNode[]; syncedCount?: number; driftedCount?: number; offlineCount?: number; totalVulns?: number; fidelity?: string } }) => res?.data,
  });

  const nodes = topoData?.nodes ?? [];
  const syncedCount = topoData?.syncedCount ?? 0;
  const driftedCount = topoData?.driftedCount ?? 0;
  const _offlineCount = topoData?.offlineCount ?? 0;
  const totalVulns = topoData?.totalVulns ?? 0;
  const fidelity = topoData?.fidelity ?? '—';

  const driftedNodes = nodes.filter((n) => n.syncState !== 'synced').slice(0, 6);
  const displayNodes = driftedNodes.length > 0 ? driftedNodes : nodes.slice(0, 6);

  return (
    <div className="p-6 space-y-6 bg-[#080510] min-h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-2 tracking-tight">
            <Shield className="w-6 h-6" />
            Threat Digital Twin
          </h1>
          <p className="text-[#f5f5f5]/50 text-sm mt-1">
            Real-time synchronization with active adversary profiles and indicator meshes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded font-mono uppercase border"
            style={{ background: 'rgba(201,183,135,0.08)', borderColor: 'rgba(201,183,135,0.25)', color: '#c9b787' }}
          >
            <Database className="w-2.5 h-2.5" />
            {isLoading ? 'Loading…' : isError ? 'API Error' : `Live · ${nodes.length} assets`}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded text-[#f5f5f5]/40 hover:text-[#f5f5f5] transition-colors"
            aria-label="Refresh topology"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
          <div className="px-3 py-1 rounded-full bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f5f5f5] animate-pulse" />
            <span className="text-[10px] font-bold text-[#f5f5f5] uppercase tracking-wider">
              Active Monitoring
            </span>
          </div>
        </div>
      </div>

      {/* Live topology summary */}
      {(nodes.length > 0 || isLoading) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Assets Monitored', value: nodes.length, color: '#c9b787', sub: 'digital twin nodes' },
            { label: 'Twin Fidelity', value: fidelity, color: '#c9b787', sub: 'assets in sync' },
            { label: 'Synced', value: syncedCount, color: '#c9b787', sub: 'up to date' },
            { label: 'Drifted', value: driftedCount, color: '#c9b787', sub: 'need resync' },
            { label: 'Total Vulns', value: totalVulns, color: '#f5f5f5', sub: 'open findings' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/8 bg-white/3 p-3 text-center"
            >
              <div
                className="text-xl font-bold tabular-nums"
                style={{ color: m.color }}
              >
                {isLoading ? '—' : m.value}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.label}</div>
              <div className="text-[9px] text-zinc-600">{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Live asset nodes from digital twin */}
      {displayNodes.length > 0 && (
        <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f5f5f5]/10 flex items-center justify-between bg-[#f5f5f5]/5">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#f5f5f5]" />
              <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider">
                Asset Twin Sync State
              </h3>
            </div>
            <span className="text-[10px] text-[#f5f5f5]/60 font-mono">
              Source: PARAGON Asset Inventory
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
            {displayNodes.map((node) => (
              <div
                key={node.id}
                className="rounded-lg p-3 border"
                style={{
                  background: node.hasActiveIncident
                    ? 'rgba(245,245,245,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  borderColor: node.hasActiveIncident
                    ? 'rgba(245,245,245,0.2)'
                    : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-white truncate">{node.name}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: SYNC_COLORS[node.syncState] }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span
                    className="px-1 py-0.5 rounded font-mono uppercase"
                    style={{
                      background: `${SYNC_COLORS[node.syncState]}15`,
                      color: SYNC_COLORS[node.syncState],
                    }}
                  >
                    {node.syncState}
                  </span>
                  <span className="text-zinc-600">{node.zone}</span>
                  {node.criticalVulnerabilities > 0 && (
                    <span className="text-[#f5f5f5] font-mono">
                      {node.criticalVulnerabilities} critical
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-zinc-600 mt-1">
                  Risk: {node.riskScore.toFixed(1)} · {node.lastSyncLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 px-4 py-3 text-xs text-[#c9b787] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Digital Twin API unavailable — showing threat actor profile from scenario library
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Actor Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="w-24 h-24 text-[#f5f5f5]" />
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-[#f5f5f5]">{actor.alias}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5f5f5]/20 text-[#f5f5f5] border border-[#f5f5f5]/30 uppercase">
                    {actor.name}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase border"
                    style={{ background: 'rgba(201,183,135,0.08)', borderColor: 'rgba(201,183,135,0.25)', color: '#c9b787' }}
                  >
                    Scenario Library
                  </span>
                </div>
                <p className="text-[#f5f5f5]/70 text-sm max-w-xl">{actor.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold tracking-widest mb-1">
                  Confidence Score
                </p>
                <ConfidenceMeter value={actor.confidence} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-[#f5f5f5]/5 border border-[#f5f5f5]/10">
                <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold mb-1">Affiliation</p>
                <p className="text-sm font-medium text-[#f5f5f5]">{actor.affiliation}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#f5f5f5]/5 border border-[#f5f5f5]/10">
                <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold mb-1">Motivation</p>
                <p className="text-sm font-medium text-[#f5f5f5]">{actor.motivation}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#f5f5f5]/5 border border-[#f5f5f5]/10">
                <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold mb-1">Last Active</p>
                <p className="text-sm font-medium text-[#f5f5f5]">
                  {new Date(actor.lastActivityAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#f5f5f5]/5 border border-[#f5f5f5]/10">
                <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold mb-1">Impact Level</p>
                <p className="text-sm font-medium text-[#f5f5f5]">Critical</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#f5f5f5]/40 uppercase font-bold tracking-widest mb-3">
                Associated TTPs (MITRE ATT&CK)
              </p>
              <div className="flex flex-wrap gap-2">
                {actor.ttps.map((ttp, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-[#1a1125] border border-[#f5f5f5]/10 text-[11px] text-[#f5f5f5]/80"
                  >
                    {ttp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Indicator Feed */}
          <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f5f5f5]/10 flex items-center justify-between bg-[#f5f5f5]/5">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#f5f5f5]" />
                <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider">
                  Indicator Mesh Feed
                </h3>
              </div>
              <span className="text-[10px] text-[#f5f5f5]/60 font-mono">TLP: AMBER/RED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f5f5]/5 border-b border-[#f5f5f5]/10">
                    <th className="px-5 py-3 text-[10px] font-bold text-[#f5f5f5]/40 uppercase tracking-widest">
                      Indicator
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#f5f5f5]/40 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#f5f5f5]/40 uppercase tracking-widest">
                      TLP
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#f5f5f5]/40 uppercase tracking-widest">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-500/10">
                  {phantomIndicators.map((ioc) => (
                    <tr key={ioc.id} className="hover:bg-[#f5f5f5]/5 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-[#f5f5f5] group-hover:text-[#f5f5f5] transition-colors">
                            {ioc.value}
                          </span>
                          <span className="text-[10px] text-[#f5f5f5]/40 mt-0.5">
                            {ioc.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold text-[#f5f5f5]/60 uppercase">
                          {ioc.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[9px] font-bold uppercase border',
                            ioc.tlp === 'red'
                              ? 'bg-[#f5f5f5]/20 text-[#f5f5f5] border-[#f5f5f5]/30'
                              : ioc.tlp === 'amber'
                                ? 'bg-[#c9b787]/20 text-[#c9b787] border-[#c9b787]/30'
                                : 'bg-[#c9b787]/20 text-[#c9b787] border-[#c9b787]/30',
                          )}
                        >
                          TLP:{ioc.tlp}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-[#f5f5f5]/60">
                        {new Date(ioc.lastSeenAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Affected Systems */}
          <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#f5f5f5]" />
              Target Surface Sync
            </h3>
            <div className="space-y-3">
              {affectedSystems.map((system, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#f5f5f5]/5 border border-[#f5f5f5]/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-[#f5f5f5]">{system.name}</p>
                    <p className="text-[10px] text-[#f5f5f5]/50 uppercase">{system.type}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase mb-1',
                        system.status === 'compromised'
                          ? 'text-[#f5f5f5]'
                          : system.status === 'at_risk'
                            ? 'text-[#c9b787]'
                            : 'text-[#c9b787]',
                      )}
                    >
                      {system.status.replace('_', ' ')}
                    </span>
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          system.status === 'compromised'
                            ? 'bg-[#f5f5f5] w-full'
                            : system.status === 'at_risk'
                              ? 'bg-[#c9b787] w-2/3'
                              : 'bg-[#c9b787] w-1/3',
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Containment Workflow */}
          <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl overflow-hidden shadow-2xl shadow-red-500/5">
            <div className="px-5 py-4 border-b border-[#f5f5f5]/10 bg-[#f5f5f5]/5">
              <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider">
                Containment Workflow
              </h3>
            </div>
            <div className="p-5">
              <ProofEnvelope
                confidence={0.91}
                timestamp={new Date().toISOString()}
                evidence={[]}
                autonomyMode="recommend"
                policyState="requires-approval"
              >
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#f5f5f5]">AI RECOMMENDED ACTIONS</h4>
                    <span className="text-[10px] text-[#f5f5f5]/50 font-mono">WF-2891-B</span>
                  </div>
                  <div className="space-y-2">
                    {containmentWorkflow.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f5f5f5] shadow-[0_0_8px_rgba(245,245,245,0.5)]" />
                          {i < containmentWorkflow.steps.length - 1 && (
                            <div className="w-px h-full bg-[#f5f5f5]/20 my-1" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-[#f5f5f5]">
                            <span className="text-[#f5f5f5] uppercase mr-1">{step.action}:</span>{' '}
                            {step.target}
                          </p>
                          <p className="text-[10px] text-[#f5f5f5]/60 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#f5f5f5] text-white text-[11px] font-bold hover:bg-[#f5f5f5] transition-colors shadow-lg shadow-red-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve All
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-white/5 text-[#f5f5f5] border border-[#f5f5f5]/20 text-[11px] font-bold hover:bg-white/10 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              </ProofEnvelope>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-[#09060e] border border-[#f5f5f5]/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f5f5f5]" />
              Containment Audit
            </h3>
            <div className="space-y-4 relative">
              <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-[#f5f5f5]/10" />
              {auditTrail.map((entry, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#09060e] border-2 border-[#f5f5f5]/30 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#f5f5f5]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#f5f5f5] leading-tight">
                      {entry.action.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-[10px] text-[#f5f5f5]/50 mt-0.5">
                      {entry.actor} ({entry.actorRole})
                    </p>
                    <p className="text-[9px] text-[#f5f5f5]/40 mt-1 font-mono">
                      {new Date(entry.at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

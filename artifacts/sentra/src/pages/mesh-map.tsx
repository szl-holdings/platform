import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronRight,
  Filter,
  Key,
  RefreshCw,
  Server,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { MESH_AGENT_DISPLAY_NAMES, useAgentMesh } from '@/data/agent-mesh';

type FilterChip = 'all' | 'critical' | 'secrets' | 'outbound' | 'cross-agent';

const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-sky-400',
  C: 'text-amber-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const GRADE_BG: Record<string, string> = {
  A: 'border-emerald-500/40 bg-emerald-500/10',
  B: 'border-sky-500/40 bg-sky-500/10',
  C: 'border-amber-500/40 bg-amber-500/10',
  D: 'border-orange-500/40 bg-orange-500/10',
  F: 'border-red-500/40 bg-red-500/10',
};

const TRUST_COLORS: Record<string, string> = {
  trusted: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  unverified: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  quarantined: 'text-red-400 border-red-500/30 bg-red-500/10',
};

function SubIndexBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 45 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-[10px] text-slate-500 font-mono uppercase truncate">{label}</div>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-[10px] font-mono text-slate-400 w-6 text-right">{value}</div>
    </div>
  );
}

export default function MeshMap() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { state, source, loading, refresh, scannedFiles } = useAgentMesh();
  const { runtimes, mcpServers, secrets, exposures, resilienceIndex } = state;

  const criticalExposureIds = new Set(
    exposures
      .filter((e) => e.severity === 'critical')
      .flatMap((e) => [...e.affectedAgentIds, ...e.affectedMcpIds, ...e.affectedSecretIds]),
  );

  const filters: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'All Nodes' },
    { id: 'critical', label: 'Critical Only' },
    { id: 'secrets', label: 'Secrets' },
    { id: 'outbound', label: 'Outbound' },
    { id: 'cross-agent', label: 'Cross-Agent' },
  ];

  const filteredRuntimes =
    activeFilter === 'critical'
      ? runtimes.filter((r) => r.activeAgentIds.some((id) => criticalExposureIds.has(id)))
      : runtimes;

  const filteredSecrets =
    activeFilter === 'secrets' || activeFilter === 'all' || activeFilter === 'critical'
      ? activeFilter === 'critical'
        ? secrets.filter((s) => criticalExposureIds.has(s.id))
        : secrets
      : [];

  const filteredMcpServers =
    activeFilter === 'outbound'
      ? mcpServers.filter((m) => m.detectedEgressDomains.length > m.allowedEgressDomains.length)
      : activeFilter === 'critical'
        ? mcpServers.filter((m) => criticalExposureIds.has(m.id))
        : mcpServers;

  const selectedExposures = selectedNodeId
    ? exposures.filter(
        (e) =>
          e.affectedAgentIds.includes(selectedNodeId) ||
          e.affectedMcpIds.includes(selectedNodeId) ||
          e.affectedSecretIds.includes(selectedNodeId),
      )
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Mesh Map</h1>
          <p className="text-slate-400 mt-1">
            Agent runtime → secret/token → MCP server → egress topology
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              void refresh();
            }}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded border text-[11px] font-mono uppercase font-bold transition-colors',
              loading
                ? 'border-slate-700 bg-slate-800 text-slate-500 cursor-wait'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-red-500/40 hover:text-red-300',
            )}
            title="Re-run telemetry scan against configured MCP config files"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
          <div
            className={cn(
              'flex items-center gap-4 px-5 py-3 rounded-lg border',
              GRADE_BG[resilienceIndex.grade],
            )}
          >
            <div className="text-center">
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-0.5 flex items-center justify-center gap-1.5">
                Mesh Resilience Index
                <span
                  className={cn(
                    'text-[8px] px-1 py-0.5 rounded border font-mono',
                    source === 'live'
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-slate-600 text-slate-400 bg-slate-800/40',
                  )}
                >
                  {source === 'live' ? 'LIVE' : 'SEED'}
                </span>
              </div>
              <div
                className={cn(
                  'text-3xl font-display font-bold',
                  GRADE_COLOR[resilienceIndex.grade],
                )}
              >
                {resilienceIndex.grade} · {resilienceIndex.overall}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div className="text-[10px] text-slate-500 font-mono">
              <div>Computed {new Date(resilienceIndex.computedAt).toLocaleTimeString()}</div>
              <div className="mt-1">
                {exposures.filter((e) => e.status === 'open').length} open exposures
              </div>
              {source === 'live' && scannedFiles.length > 0 && (
                <div className="mt-1 text-emerald-400/80">
                  {scannedFiles.length} file{scannedFiles.length === 1 ? '' : 's'} scanned
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="sentra-panel p-4">
        <div className="text-[10px] text-slate-500 font-mono uppercase mb-3">Sub-Indices</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
          <SubIndexBar label="Secret Hygiene" value={resilienceIndex.secretHygiene} />
          <SubIndexBar label="Permission Surface" value={resilienceIndex.permissionSurface} />
          <SubIndexBar label="Supply Chain" value={resilienceIndex.supplyChain} />
          <SubIndexBar label="Egress Containment" value={resilienceIndex.egressContainment} />
          <SubIndexBar label="Schedule Hygiene" value={resilienceIndex.scheduleHygiene} />
          <SubIndexBar label="Instr. Tampering" value={resilienceIndex.instructionTamperingRisk} />
          <SubIndexBar label="Cross-Agent Blast" value={resilienceIndex.crossAgentBlastRadius} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              'px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors',
              activeFilter === f.id
                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0 sentra-panel overflow-hidden">
        <div className="border-r border-slate-800 p-5">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-4 flex items-center gap-2">
            <Bot className="w-3 h-3" />
            Agent Runtimes
          </div>
          <div className="space-y-3">
            {filteredRuntimes.map((rt) => {
              const agentId = rt.activeAgentIds[0];
              const hasCritical = rt.activeAgentIds.some((id) => criticalExposureIds.has(id));
              return (
                <button
                  key={rt.id}
                  onClick={() => setSelectedNodeId(selectedNodeId === agentId ? null : agentId)}
                  className={cn(
                    'w-full text-left p-3 rounded border transition-all',
                    selectedNodeId === agentId
                      ? 'border-red-500/50 bg-red-500/10'
                      : hasCritical
                        ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/30'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          hasCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500',
                        )}
                      />
                      <span className="text-xs font-bold text-slate-200">{rt.name}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase',
                        TRUST_COLORS[rt.trustState],
                      )}
                    >
                      {rt.trustState}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">v{rt.version}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {rt.configFiles.length} config file{rt.configFiles.length > 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-r border-slate-800 p-5">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-4 flex items-center gap-2">
            <Key className="w-3 h-3" />
            Secrets & Tokens
          </div>
          <div className="space-y-3">
            {filteredSecrets.map((sec) => {
              const hasCritical = criticalExposureIds.has(sec.id);
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedNodeId(selectedNodeId === sec.id ? null : sec.id)}
                  className={cn(
                    'w-full text-left p-3 rounded border transition-all',
                    selectedNodeId === sec.id
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-red-500/20 bg-red-500/5 hover:border-red-500/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={cn('w-3 h-3', hasCritical ? 'text-red-400' : 'text-amber-400')}
                    />
                    <span className="text-xs font-bold text-red-300 font-mono">{sec.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {sec.format.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {sec.foundInFile.split('/').slice(-1)[0]}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {sec.reachableByAgentIds.map((id) => (
                      <span
                        key={id}
                        className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono"
                      >
                        {MESH_AGENT_DISPLAY_NAMES[id] ?? id}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
            {filteredSecrets.length === 0 && (
              <div className="text-[11px] text-slate-600 text-center py-8">
                No secrets match filter
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Config Files
            </div>
            <div className="space-y-2">
              {[
                'claude_desktop_config.json',
                'mcp.json',
                'settings.json',
                'CLAUDE.md',
                '.gitconfig',
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-[10px] font-mono text-slate-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-4 flex items-center gap-2">
            <Server className="w-3 h-3" />
            MCP Servers & Services
          </div>
          <div className="space-y-3">
            {filteredMcpServers.map((mcp) => {
              const hasOutboundViolation = mcp.detectedEgressDomains.some(
                (d) => !mcp.allowedEgressDomains.includes(d),
              );
              return (
                <button
                  key={mcp.id}
                  onClick={() => setSelectedNodeId(selectedNodeId === mcp.id ? null : mcp.id)}
                  className={cn(
                    'w-full text-left p-3 rounded border transition-all',
                    selectedNodeId === mcp.id
                      ? 'border-red-500/50 bg-red-500/10'
                      : mcp.trustState === 'quarantined'
                        ? 'border-red-500/30 bg-red-500/8'
                        : hasOutboundViolation
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          mcp.trustState === 'quarantined'
                            ? 'bg-red-500'
                            : mcp.trustState === 'unverified'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500',
                        )}
                      />
                      <span className="text-xs font-bold text-slate-200 font-mono">{mcp.name}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase',
                        TRUST_COLORS[mcp.trustState],
                      )}
                    >
                      {mcp.trustState}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">v{mcp.version}</div>
                  {!mcp.pinned && (
                    <div className="text-[10px] text-amber-500/70 mt-0.5">Unpinned</div>
                  )}
                  {hasOutboundViolation && (
                    <div className="text-[10px] text-red-400/80 mt-0.5">
                      Unallowed egress:{' '}
                      {mcp.detectedEgressDomains
                        .filter((d) => !mcp.allowedEgressDomains.includes(d))
                        .join(', ')}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {mcp.runtimeIds.length} runtime{mcp.runtimeIds.length > 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedNodeId && selectedExposures.length > 0 && (
        <div className="sentra-panel p-6 border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-bold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {selectedExposures.length} Exposure{selectedExposures.length > 1 ? 's' : ''} on
              Selected Node
            </h3>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <div className="space-y-3">
            {selectedExposures.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded bg-slate-900/60 border border-slate-700/60 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-bold',
                        exp.severity === 'critical'
                          ? 'text-red-400 border-red-500/30 bg-red-500/10'
                          : 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                      )}
                    >
                      {exp.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{exp.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{exp.owaspRef}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sentra-panel p-4">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Scan History
          </div>
          <span>Last scan: {new Date(resilienceIndex.computedAt).toLocaleTimeString()}</span>
        </div>
        <div className="mt-3 flex items-end gap-1 h-12">
          {[38, 42, 35, 38, 40, 36, 38].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div
                className={cn('rounded-t', i === 6 ? 'bg-red-500' : 'bg-red-500/30')}
                style={{ height: `${(v / 60) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
          <span>7D AGO</span>
          <span>
            NOW: {resilienceIndex.overall} ({resilienceIndex.grade})
          </span>
        </div>
      </div>
    </div>
  );
}

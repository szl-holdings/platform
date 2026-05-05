import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Pin,
  Server,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { type TrustState, type McpServer, type AgentRuntime, agentMesh as fallbackMesh } from '@/data/agent-mesh';
import { listMcpServers, listAgentRuntimes } from '@/lib/sentra-api';
import { SourceBadge, useApiQuery } from '@/lib/use-api-query';

const TRUST_STYLES: Record<TrustState, string> = {
  trusted: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  unverified: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  quarantined: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

const TRUST_DOT: Record<TrustState, string> = {
  trusted: 'bg-[#c9b787]',
  unverified: 'bg-[#c9b787]',
  quarantined: 'bg-[#f5f5f5] animate-pulse',
};

function TrustStateBadge({ state }: { state: TrustState }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-bold',
        TRUST_STYLES[state],
      )}
    >
      {state}
    </span>
  );
}

export default function MeshConnectors() {
  const serverFetcher = useCallback(() => listMcpServers(), []);
  const runtimeFetcher = useCallback(() => listAgentRuntimes(), []);
  const { data: mcpServers, source } = useApiQuery<McpServer[]>(serverFetcher, 'servers', fallbackMesh.mcpServers);
  const { data: runtimes } = useApiQuery<AgentRuntime[]>(runtimeFetcher, 'runtimes', fallbackMesh.runtimes);

  const [selectedMcp, setSelectedMcp] = useState<string | null>('mcp-unknown-ext');

  const selectedServer = mcpServers.find((m) => m.id === selectedMcp);

  const trustedCount = mcpServers.filter((m) => m.trustState === 'trusted').length;
  const unverifiedCount = mcpServers.filter((m) => m.trustState === 'unverified').length;
  const quarantinedCount = mcpServers.filter((m) => m.trustState === 'quarantined').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-slate-100">Connectors</h1>
          <SourceBadge source={source} />
        </div>
        <p className="text-slate-400 mt-1">
          Inventory of every detected agent runtime and MCP server with trust classification
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Trusted</div>
          <div className="text-3xl font-display font-bold text-[#c9b787]">{trustedCount}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Unverified</div>
          <div className="text-3xl font-display font-bold text-[#c9b787]">{unverifiedCount}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Quarantined</div>
          <div className="text-3xl font-display font-bold text-[#f5f5f5]">{quarantinedCount}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-200 flex items-center gap-2">
          <Bot className="w-5 h-5 text-slate-400" />
          Agent Runtimes
        </h2>
        <div className="sentra-panel overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-[#f5f5f5]/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-5 py-3 font-medium">Runtime</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Config Files</th>
                <th className="px-5 py-3 font-medium">Last Seen</th>
                <th className="px-5 py-3 font-medium">Trust State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {runtimes.map((rt) => (
                <tr key={rt.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-1.5 h-1.5 rounded-full', TRUST_DOT[rt.trustState])} />
                      <span className="text-sm font-bold text-slate-200">{rt.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-slate-400">v{rt.version}</td>
                  <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                    {rt.sourceRegistry}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {rt.configFiles.length} file{rt.configFiles.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(rt.lastSeen).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <TrustStateBadge state={rt.trustState} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-200 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-400" />
          MCP Servers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 sentra-panel overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-800/50 border-b border-[#f5f5f5]/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  <th className="px-5 py-3 font-medium">Server</th>
                  <th className="px-5 py-3 font-medium">Package</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium">Pin</th>
                  <th className="px-5 py-3 font-medium">Runtimes</th>
                  <th className="px-5 py-3 font-medium">Trust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mcpServers.map((mcp) => (
                  <tr
                    key={mcp.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedMcp === mcp.id ? 'bg-slate-800/50' : 'hover:bg-slate-800/20',
                    )}
                    onClick={() => setSelectedMcp(selectedMcp === mcp.id ? null : mcp.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn('w-1.5 h-1.5 rounded-full', TRUST_DOT[mcp.trustState])}
                        />
                        <span className="text-sm font-bold text-slate-200 font-mono">
                          {mcp.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[11px] font-mono text-slate-500">
                      {mcp.packageRef}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">v{mcp.version}</td>
                    <td className="px-5 py-4">
                      {mcp.pinned ? (
                        <div className="flex items-center gap-1 text-[#c9b787] text-[11px]">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#c9b787]/80 text-[11px]">
                          <AlertTriangle className="w-3 h-3" />
                          Floating
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{mcp.runtimeIds.length}</td>
                    <td className="px-5 py-4">
                      <TrustStateBadge state={mcp.trustState} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sentra-panel p-5">
            {selectedServer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">
                      Selected Server
                    </div>
                    <div className="text-base font-bold text-slate-100 font-mono">
                      {selectedServer.name}
                    </div>
                  </div>
                  <TrustStateBadge state={selectedServer.trustState} />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Package</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {selectedServer.packageRef}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version</span>
                    <span className="font-mono text-slate-300">v{selectedServer.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registry</span>
                    <span className="font-mono text-slate-300">
                      {selectedServer.sourceRegistry}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Seen</span>
                    <span className="font-mono text-slate-300">
                      {new Date(selectedServer.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pinned</span>
                    <span className={selectedServer.pinned ? 'text-[#c9b787]' : 'text-[#c9b787]'}>
                      {selectedServer.pinned ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">
                    Allowed Egress
                  </div>
                  {selectedServer.allowedEgressDomains.length > 0 ? (
                    selectedServer.allowedEgressDomains.map((d) => (
                      <div
                        key={d}
                        className="text-[11px] font-mono text-[#c9b787] flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {d}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] font-mono text-[#c9b787]">
                      None (fully contained)
                    </div>
                  )}
                </div>

                {selectedServer.detectedEgressDomains.some(
                  (d) => !selectedServer.allowedEgressDomains.includes(d),
                ) && (
                  <div className="pt-3 border-t border-[#f5f5f5]/20">
                    <div className="text-[10px] text-[#f5f5f5] font-mono uppercase mb-2">
                      Unexpected Egress
                    </div>
                    {selectedServer.detectedEgressDomains
                      .filter((d) => !selectedServer.allowedEgressDomains.includes(d))
                      .map((d) => (
                        <div
                          key={d}
                          className="text-[11px] font-mono text-[#f5f5f5] flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {d}
                        </div>
                      ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">
                    Active On Runtimes
                  </div>
                  {selectedServer.runtimeIds.map((id) => (
                    <div key={id} className="text-[11px] font-mono text-slate-400">
                      {runtimes.find((r) => r.id === id)?.name ?? id}
                    </div>
                  ))}
                </div>

                {selectedServer.trustState === 'quarantined' && (
                  <div className="pt-3 border-t border-[#f5f5f5]/20">
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 rounded bg-[#f5f5f5]/20 border border-[#f5f5f5]/30 text-xs text-[#f5f5f5] font-bold hover:bg-[#f5f5f5]/30 transition-colors">
                        Revoke & Remove
                      </button>
                      <button className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:border-slate-600 transition-colors">
                        Review Evidence
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div>
                  <Server className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <div className="text-xs text-slate-500">Select a server to inspect</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

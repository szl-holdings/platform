import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Copy,
  Cpu,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ShieldOff,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DataProvenance,
  PageHeader,
  StatusChip,
} from '@/lib/data-provenance';
import {
  type Agent,
  type AgentAction,
  type AgentOS,
  type InstallSnippets,
  agentAction,
  deleteAgent,
  enrollAgent,
  listAgents,
} from '@/lib/sentra-api';

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

const STATUS_STYLES: Record<Agent['status'], string> = {
  healthy: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  stale: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  isolated: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
  uninstalled: 'bg-slate-600/10 text-slate-400 border-slate-600/30',
};

const OS_LABELS: Record<AgentOS, string> = {
  linux: 'Linux',
  windows: 'Windows',
  macos: 'macOS',
};

interface DeployModalProps {
  onClose: () => void;
  onDeployed: () => void;
}

function DeployAgentModal({ onClose, onDeployed }: DeployModalProps) {
  const [step, setStep] = useState<'config' | 'token' | 'waiting'>('config');
  const [tenantId, setTenantId] = useState('default');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [activeOs, setActiveOs] = useState<AgentOS>('linux');
  const [snippets, setSnippets] = useState<InstallSnippets | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connected, setConnected] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    const result = await enrollAgent({ tenantId, tags });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSnippets(result.installSnippets);
    setToken(result.token.token);
    setStep('token');
  };

  const startWaiting = () => {
    setStep('waiting');
    pollRef.current = setInterval(async () => {
      const { agents } = await listAgents();
      const found = agents.some((a) => a.enrollmentToken === token);
      if (found) {
        clearInterval(pollRef.current!);
        setConnected(true);
        setTimeout(() => {
          onDeployed();
          onClose();
        }, 1500);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const copySnippet = () => {
    if (!snippets) return;
    void navigator.clipboard.writeText(snippets[activeOs]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-xl border bg-slate-900 shadow-2xl"
        style={{ borderColor: 'rgba(197,183,135,0.2)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#c9b787]" />
            Deploy Agent
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'config' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
                Tenant ID
              </label>
              <input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
                Tags (optional)
              </label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. prod, linux, web-tier"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40"
                />
                <button onClick={addTag} className="px-3 py-2 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600">
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-slate-600 hover:text-slate-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <div className="text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">{error}</div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 border border-slate-700">Cancel</button>
              <button
                onClick={() => { void generate(); }}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-[#d4c49a]"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Generate Token & Snippet
              </button>
            </div>
          </div>
        )}

        {step === 'token' && snippets && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-[#c9b787]/5 border border-[#c9b787]/20">
              <div className="text-[10px] text-[#c9b787] font-mono uppercase mb-1">Enrollment Token</div>
              <div className="font-mono text-xs text-slate-300 break-all">{token}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">OS</div>
              <div className="flex gap-2 mb-3">
                {(['linux', 'windows', 'macos'] as AgentOS[]).map((os) => (
                  <button
                    key={os}
                    onClick={() => setActiveOs(os)}
                    className={cn(
                      'px-3 py-1.5 rounded text-[11px] font-mono border transition-colors',
                      activeOs === os
                        ? 'border-[#c9b787]/50 bg-[#c9b787]/15 text-[#c9b787]'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600',
                    )}
                  >
                    {OS_LABELS[os]}
                  </button>
                ))}
              </div>
              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-[11px] text-[#c9b787] font-mono whitespace-pre-wrap break-all">
                  {snippets[activeOs]}
                </pre>
                <button
                  onClick={copySnippet}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                  title="Copy"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#c9b787]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 border border-slate-700">Close</button>
              <button
                onClick={startWaiting}
                className="px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold flex items-center gap-2 hover:bg-[#d4c49a]"
              >
                <Activity className="w-3 h-3" />
                Wait for First Heartbeat
              </button>
            </div>
          </div>
        )}

        {step === 'waiting' && (
          <div className="p-10 text-center space-y-4">
            {connected ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-[#c9b787] mx-auto" />
                <p className="text-sm font-bold text-slate-200">Agent Connected!</p>
                <p className="text-xs text-slate-500">Redirecting to agent list…</p>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 text-[#c9b787] mx-auto animate-spin" />
                <p className="text-sm font-bold text-slate-200">Waiting for First Heartbeat…</p>
                <p className="text-xs text-slate-500">Run the install snippet on your endpoint to connect.</p>
                <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentRowMenuProps {
  agent: Agent;
  onAction: (action: AgentAction) => void;
  onDelete: () => void;
}

function AgentRowMenu({ agent, onAction, onDelete }: AgentRowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-10">
          {agent.status !== 'isolated' && agent.status !== 'uninstalled' && (
            <button
              onClick={() => { onAction('isolate'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#f5f5f5] hover:bg-slate-700 rounded-t-lg"
            >
              <ShieldOff className="w-3.5 h-3.5" /> Isolate
            </button>
          )}
          {agent.status === 'isolated' && (
            <button
              onClick={() => { onAction('release'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#c9b787] hover:bg-slate-700 rounded-t-lg"
            >
              <Zap className="w-3.5 h-3.5" /> Release
            </button>
          )}
          <button
            onClick={() => { onAction('rotate-token'); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Rotate Token
          </button>
          {agent.status !== 'uninstalled' && (
            <button
              onClick={() => { onAction('uninstall'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5" /> Uninstall
            </button>
          )}
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#f5f5f5] hover:bg-slate-700 rounded-b-lg border-t border-slate-700"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function EndpointMesh() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [source, setSource] = useState<'live' | 'seed'>('seed');
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const result = await listAgents();
    setAgents(result.agents);
    setSource(result.source);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (agentId: string, action: AgentAction) => {
    setActionLoading(agentId);
    const result = await agentAction(agentId, action);
    if (result.ok) {
      setAgents((prev) => prev.map((a) => (a.id === result.agent.id ? result.agent : a)));
    }
    setActionLoading(null);
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Delete this agent record?')) return;
    await deleteAgent(agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const healthyCount = agents.filter((a) => a.status === 'healthy').length;
  const staleCount = agents.filter((a) => a.status === 'stale').length;
  const isolatedCount = agents.filter((a) => a.status === 'isolated').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Endpoint Mesh"
        subtitle="Enrolled EDR agents — heartbeat, lifecycle, and isolation state"
        provenance={loading ? 'loading' : source}
        actions={
          <button
            onClick={() => setShowDeploy(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold hover:bg-[#d4c49a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Deploy Agent
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents', value: agents.length },
          { label: 'Healthy', value: healthyCount, accent: '#c9b787' },
          { label: 'Stale', value: staleCount, accent: staleCount > 0 ? '#c9b787' : undefined },
          { label: 'Isolated', value: isolatedCount, accent: isolatedCount > 0 ? '#f5f5f5' : undefined },
        ].map(({ label, value, accent }) => (
          <div key={label} className="sentra-panel p-5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">{label}</div>
            <div
              className="text-2xl font-display font-bold mt-1"
              style={{ color: accent ?? '#94a3b8' }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && !loading ? (
        <div className="sentra-panel p-16 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">No agents enrolled yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Click <strong className="text-slate-400">Deploy Agent</strong> to generate an enrollment token and install snippet.
            </p>
          </div>
        </div>
      ) : (
        <div className="sentra-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-[#c9b787]/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-5 py-3 font-medium">Hostname</th>
                <th className="px-5 py-3 font-medium">OS</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Tags</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Heartbeat</th>
                <th className="px-5 py-3 font-medium w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-[#c9b787]/3 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          agent.status === 'healthy' ? 'bg-[#c9b787] animate-pulse' :
                          agent.status === 'isolated' ? 'bg-[#f5f5f5]' :
                          agent.status === 'stale' ? 'bg-[#c9b787]/50' :
                          'bg-slate-600',
                        )}
                      />
                      <span className="text-xs font-bold text-slate-200 font-mono">{agent.hostname}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5 ml-3.5">{agent.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">{OS_LABELS[agent.os]}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">v{agent.version}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-400 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase',
                        STATUS_STYLES[agent.status],
                      )}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                    {relativeTime(agent.lastHeartbeatAt)}
                  </td>
                  <td className="px-5 py-3">
                    {actionLoading === agent.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <AgentRowMenu
                        agent={agent}
                        onAction={(action) => void handleAction(agent.id, action)}
                        onDelete={() => void handleDelete(agent.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeploy && (
        <DeployAgentModal
          onClose={() => setShowDeploy(false)}
          onDeployed={() => { void load(); }}
        />
      )}
    </div>
  );
}

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const API = '/api/nexus-mcp';

interface ExternalServer {
  id: string;
  name: string;
  endpointUrl: string;
  authMethod: string;
  healthStatus: string;
  latencyMs: number | null;
  enabled: boolean;
  discoveredTools: Array<{
    name: string;
    description: string;
    riskLevel: string;
  }>;
  lastHealthCheck: string | null;
  lastToolDiscovery: string | null;
  createdAt: string;
}

interface GovernedWorkflow {
  id: number;
  name: string;
  description: string;
  triggerType: string;
  status: string;
  createdBy: string;
  createdAt: string;
  steps: Array<{ toolName: string; toolSource: string; requiresApproval: boolean }>;
}

interface Stats {
  activeSessions: number;
  toolCallsPerMinute: number;
  avgLatencyMs: number;
  pendingApprovals: number;
  policyViolationsLastHour: number;
  unacknowledgedAnomalies: number;
  activeExternalServers: number;
}

const ACCENT = '#22d3ee';

function healthColor(status: string): string {
  if (status === 'healthy') return '#22c55e';
  if (status === 'degraded') return '#f59e0b';
  return '#ef4444';
}

function riskColor(level: string): string {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: healthColor(status) }}
    />
  );
}

function AddServerModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    endpointUrl: '',
    authMethod: 'none',
    apiKey: '',
    headerName: '',
    headerValue: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.name.trim() || !form.endpointUrl.trim()) {
      setError('Name and endpoint URL are required');
      return;
    }
    setSaving(true);
    setError('');
    const authConfig: Record<string, string> = {};
    if (form.authMethod === 'api_key') authConfig.apiKey = form.apiKey;
    if (form.authMethod === 'header') {
      authConfig.headerName = form.headerName;
      authConfig.headerValue = form.headerValue;
    }
    try {
      const res = await fetch(`${API}/servers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, endpointUrl: form.endpointUrl, authMethod: form.authMethod, authConfig }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Failed to register server');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-xl border overflow-hidden"
        style={{ background: 'hsl(214,12%,8%)', borderColor: 'hsla(0,0%,100%,0.12)' }}
      >
        <div
          className="flex items-center gap-3 px-6 py-4 border-b"
          style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,10%)' }}
        >
          <Globe className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold">Register External MCP Server</span>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Anthropic MCP Bridge"
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Endpoint URL *
            </label>
            <input
              type="url"
              value={form.endpointUrl}
              onChange={(e) => setForm((f) => ({ ...f, endpointUrl: e.target.value }))}
              placeholder="https://mcp.example.com/rpc"
              className="w-full text-sm rounded-lg px-3 py-2 font-mono"
              style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Authentication
            </label>
            <select
              value={form.authMethod}
              onChange={(e) => setForm((f) => ({ ...f, authMethod: e.target.value }))}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
            >
              <option value="none">None</option>
              <option value="api_key">API Key (Bearer)</option>
              <option value="header">Custom Header</option>
            </select>
          </div>
          {form.authMethod === 'api_key' && (
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                API Key
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full text-sm rounded-lg px-3 py-2 font-mono"
                style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              />
            </div>
          )}
          {form.authMethod === 'header' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                  Header Name
                </label>
                <input
                  type="text"
                  value={form.headerName}
                  onChange={(e) => setForm((f) => ({ ...f, headerName: e.target.value }))}
                  placeholder="X-API-Key"
                  className="w-full text-sm rounded-lg px-3 py-2 font-mono"
                  style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                  Header Value
                </label>
                <input
                  type="password"
                  value={form.headerValue}
                  onChange={(e) => setForm((f) => ({ ...f, headerValue: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 py-2 font-mono"
                  style={{ background: 'hsl(214,12%,12%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
                />
              </div>
            </div>
          )}
          <p className="text-[10px]" style={{ color: 'hsl(214,7%,35%)' }}>
            After saving, tool discovery will run automatically against the endpoint.
          </p>
        </div>
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            style={{ color: 'hsl(214,7%,55%)' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-80 transition-colors disabled:opacity-50"
            style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Registering…' : 'Register & Discover'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServerCard({
  server,
  onDelete,
  onTest,
  onToggle,
}: {
  server: ExternalServer;
  onDelete: () => void;
  onTest: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTest();
    setTesting(false);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: server.enabled
          ? `${healthColor(server.healthStatus)}30`
          : 'hsla(0,0%,100%,0.06)',
        background: 'hsl(214,12%,7%)',
        opacity: server.enabled ? 1 : 0.6,
      }}
    >
      <div
        className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-white/3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mt-0.5">
          <StatusDot status={server.healthStatus} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{server.name}</span>
            {!server.enabled && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'hsla(0,0%,100%,0.06)', color: 'hsl(214,7%,45%)' }}
              >
                DISABLED
              </span>
            )}
          </div>
          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'hsl(214,7%,45%)' }}>
            {server.endpointUrl}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: `${healthColor(server.healthStatus)}15`,
                color: healthColor(server.healthStatus),
              }}
            >
              {server.healthStatus.toUpperCase()}
            </span>
            {server.latencyMs !== null && (
              <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
                {server.latencyMs}ms
              </span>
            )}
            <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
              {server.discoveredTools.length} tools
            </span>
            <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
              auth: {server.authMethod}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleTest(); }}
            disabled={testing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors hover:opacity-80"
            style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, color: ACCENT }}
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Test
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="px-2.5 py-1 rounded-md text-xs transition-colors hover:opacity-80"
            style={{
              background: server.enabled ? '#22c55e15' : 'hsla(0,0%,100%,0.06)',
              color: server.enabled ? '#22c55e' : 'hsl(214,7%,45%)',
            }}
          >
            {server.enabled ? 'Enabled' : 'Enable'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-md transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          </button>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" style={{ color: 'hsl(214,7%,35%)' }} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'hsl(214,7%,35%)' }} />
          )}
        </div>
      </div>

      {expanded && server.discoveredTools.length > 0 && (
        <div
          className="border-t px-5 pb-4"
          style={{ borderColor: 'hsla(0,0%,100%,0.06)', background: 'hsla(0,0%,100%,0.02)' }}
        >
          <p className="text-[9px] font-mono uppercase tracking-wider mt-3 mb-2" style={{ color: 'hsl(214,7%,35%)' }}>
            Discovered Tools ({server.discoveredTools.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {server.discoveredTools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'hsl(214,12%,9%)' }}
              >
                <Wrench className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: riskColor(tool.riskLevel) }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono truncate">{tool.name}</span>
                    <span
                      className="text-[8px] font-mono px-1 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${riskColor(tool.riskLevel)}15`, color: riskColor(tool.riskLevel) }}
                    >
                      {tool.riskLevel}
                    </span>
                  </div>
                  {tool.description && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'hsl(214,7%,45%)' }}>
                      {tool.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {server.lastHealthCheck && (
            <p className="text-[9px] mt-3" style={{ color: 'hsl(214,7%,30%)' }}>
              Last health check: {new Date(server.lastHealthCheck).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowRow({ workflow }: { workflow: GovernedWorkflow }) {
  const highRiskSteps = workflow.steps.filter((s) => !s.requiresApproval);
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 border-b"
      style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{workflow.name}</span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: workflow.status === 'active' ? '#22c55e20' : 'hsla(0,0%,100%,0.06)',
              color: workflow.status === 'active' ? '#22c55e' : 'hsl(214,7%,45%)',
            }}
          >
            {workflow.status.toUpperCase()}
          </span>
        </div>
        {workflow.description && (
          <p className="text-xs mt-1" style={{ color: 'hsl(214,7%,45%)' }}>
            {workflow.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
            {workflow.steps.length} steps
          </span>
          <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
            trigger: {workflow.triggerType}
          </span>
          {highRiskSteps.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: '#f59e0b' }}>
              <AlertTriangle className="w-3 h-3" />
              {highRiskSteps.length} unapproved step{highRiskSteps.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'hsl(214,7%,35%)' }}>
            by {workflow.createdBy}
          </span>
        </div>
      </div>
      <a
        href="/command/substrate/observatory/compose"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors hover:opacity-80"
        style={{ background: `${ACCENT}10`, color: ACCENT }}
      >
        <ExternalLink className="w-3 h-3" />
        Edit
      </a>
    </div>
  );
}

export default function PRAXISMcpAdminPage() {
  const [servers, setServers] = useState<ExternalServer[]>([]);
  const [workflows, setWorkflows] = useState<GovernedWorkflow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'servers' | 'workflows'>('servers');

  const load = useCallback(async () => {
    try {
      const [serversRes, workflowsRes, statsRes] = await Promise.all([
        fetch(`${API}/servers`, { credentials: 'include' }),
        fetch(`${API}/workflows`, { credentials: 'include' }),
        fetch(`${API}/stats`, { credentials: 'include' }),
      ]);
      if (serversRes.ok) {
        const d = await serversRes.json() as { data: ExternalServer[] };
        setServers(d.data ?? []);
      }
      if (workflowsRes.ok) {
        const d = await workflowsRes.json() as { data: GovernedWorkflow[] };
        setWorkflows(d.data ?? []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json() as { data: Stats };
        setStats(d.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this external MCP server?')) return;
    await fetch(`${API}/servers/${id}`, { method: 'DELETE', credentials: 'include' });
    setServers((s) => s.filter((srv) => srv.id !== id));
  };

  const handleTest = async (id: string) => {
    const res = await fetch(`${API}/servers/${id}/test`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      await load();
    }
  };

  const handleToggle = async (server: ExternalServer) => {
    await fetch(`${API}/servers/${server.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !server.enabled }),
    });
    setServers((prev) =>
      prev.map((s) => (s.id === server.id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(216,14%,5%)', color: 'hsl(38,8%,92%)' }}>
      {showAddModal && (
        <AddServerModal onClose={() => setShowAddModal(false)} onSaved={load} />
      )}

      <div
        className="border-b px-8 py-5"
        style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(216,14%,7%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${ACCENT}15` }}
              >
                <Server className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">MCP Control Plane</h1>
                <p className="text-xs" style={{ color: 'hsl(214,7%,45%)' }}>
                  Bidirectional governed MCP control plane · External server registry
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/command/substrate/observatory"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background: 'hsla(0,0%,100%,0.06)', color: 'hsl(214,7%,65%)' }}
            >
              <ExternalLink className="w-3 h-3" />
              Open Observatory
            </a>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Server
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-5">
            {[
              { label: 'Active Sessions', value: stats.activeSessions, color: ACCENT, icon: Zap },
              { label: 'Tool Calls/Min', value: stats.toolCallsPerMinute, color: '#8b5cf6', icon: Wrench },
              {
                label: 'Pending Approvals',
                value: stats.pendingApprovals,
                color: stats.pendingApprovals > 0 ? '#f59e0b' : '#22c55e',
                icon: Shield,
              },
              {
                label: 'Anomalies',
                value: stats.unacknowledgedAnomalies,
                color: stats.unacknowledgedAnomalies > 0 ? '#ef4444' : '#22c55e',
                icon: AlertTriangle,
              },
            ].map(({ label, value, color, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg px-4 py-3 border"
                style={{ background: 'hsl(214,12%,8%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(214,7%,45%)' }}>
                    {label}
                  </span>
                  <Icon className="w-3 h-3" style={{ color }} />
                </div>
                <span className="text-xl font-bold font-mono" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-8 py-6">
        <div className="flex items-center gap-1 mb-6">
          {(['servers', 'workflows'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
              style={{
                background: activeTab === tab ? `${ACCENT}15` : 'transparent',
                color: activeTab === tab ? ACCENT : 'hsl(214,7%,55%)',
                border: `1px solid ${activeTab === tab ? `${ACCENT}30` : 'transparent'}`,
              }}
            >
              {tab === 'servers' ? `External Servers (${servers.length})` : `Governed Workflows (${workflows.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
          </div>
        ) : activeTab === 'servers' ? (
          <div>
            {servers.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed"
                style={{ borderColor: 'hsla(0,0%,100%,0.1)' }}
              >
                <Globe className="w-10 h-10 mb-4" style={{ color: 'hsl(214,7%,20%)' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(214,7%,45%)' }}>
                  No external MCP servers registered
                </p>
                <p className="text-xs mt-1 mb-4" style={{ color: 'hsl(214,7%,30%)' }}>
                  Add a server to enable bidirectional MCP tool calls
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ background: `${ACCENT}15`, color: ACCENT }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register First Server
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onDelete={() => handleDelete(server.id)}
                    onTest={() => handleTest(server.id)}
                    onToggle={() => handleToggle(server)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,7%)' }}
          >
            {workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Zap className="w-10 h-10 mb-4" style={{ color: 'hsl(214,7%,20%)' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(214,7%,45%)' }}>
                  No governed workflows
                </p>
                <p className="text-xs mt-1 mb-4" style={{ color: 'hsl(214,7%,30%)' }}>
                  Build workflows in the Workflow Composer
                </p>
                <a
                  href="/command/substrate/observatory/compose"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ background: `${ACCENT}15`, color: ACCENT }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Composer
                </a>
              </div>
            ) : (
              workflows.map((wf) => <WorkflowRow key={wf.id} workflow={wf} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

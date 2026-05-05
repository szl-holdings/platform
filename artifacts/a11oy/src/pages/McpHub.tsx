import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader } from '../components/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'degraded' | 'offline';
  tools: McpTool[];
  resources: McpResource[];
  transport: 'stdio' | 'sse' | 'streamable-http';
  version: string;
  latencyMs: number;
  requestsToday: number;
  lastHealthCheck: number;
  gatewayServerId?: string;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: string;
  calls24h: number;
  avgLatencyMs: number;
  errorRate: number;
}

interface McpResource {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

interface LiveServerStatus {
  serverId: string;
  name: string;
  enabled: boolean;
  status: string;
  callsToday: number;
  calls24h: number;
  errorRate: number;
  avgLatencyMs: number;
  toggledAt?: string;
  toggledBy?: string;
}

interface GatewayStats {
  activeConnections: number;
  totalConnections: number;
  totalCalls: number;
  pendingApprovals: number;
  totalProofs: number;
  totalKeys: number;
  riskBreakdown: { low: number; medium: number; high: number; critical: number };
  dispositionBreakdown: { allowed: number; blocked: number; pending_approval: number; rate_limited: number; execution_failed: number };
  avgLatencyMs: number;
  governanceMode: string;
  protocolVersion: string;
}

interface GatewayConnection {
  connectionId: string;
  agentName: string;
  agentType: string;
  apiKeyId: string;
  tenantId: string;
  connectedAt: string;
  lastActivityAt: string;
  status: string;
  toolCallCount: number;
  approvedCount: number;
  rejectedCount: number;
  proofPacketCount: number;
}

interface GatewayToolCall {
  callId: string;
  connectionId: string;
  agentName: string;
  toolName: string;
  riskLevel: string;
  riskClasses: string[];
  disposition: string;
  approvalId: string | null;
  proofPacketId: string | null;
  resultHash: string | null;
  latencyMs: number;
  timestamp: string;
}

interface GatewayApproval {
  approvalId: string;
  callId: string;
  agentName: string;
  toolName: string;
  riskLevel: string;
  riskClasses: string[];
  requiredTier: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

interface GatewayProofPacket {
  packetId: string;
  callId: string;
  agentName: string;
  toolName: string;
  riskLevel: string;
  disposition: string;
  callerIdentity: string;
  parametersHash: string;
  resultHash: string | null;
  previousHash: string | null;
  hash: string;
  witnessedBy: string[];
  issuedAt: string;
}

interface GatewayApiKeyEntry {
  id: string;
  prefix: string;
  label: string;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

interface ConnectInstructions {
  protocolVersion: string;
  transports: string[];
  endpoints: Record<string, string>;
  authentication: Record<string, string>;
  clients: Record<string, { name: string; configFile?: string; config?: Record<string, unknown>; note?: string; command?: string }>;
}

const SERVERS: McpServer[] = [
  {
    id: 'mcp-fabric', name: 'A11oy Fabric', gatewayServerId: 'szl-tool-mesh',
    description: 'Core governance fabric — workcells, signals, proof, covenants',
    status: 'connected', transport: 'stdio', version: '2.4.0', latencyMs: 12, requestsToday: 2847, lastHealthCheck: Date.now() - 30000,
    tools: [
      { name: 'workcell.create', description: 'Create a new governed workcell', inputSchema: '{ signal_id, template }', calls24h: 89, avgLatencyMs: 145, errorRate: 0.01 },
      { name: 'workcell.inspect', description: 'Inspect workcell execution state', inputSchema: '{ workcell_id }', calls24h: 312, avgLatencyMs: 42, errorRate: 0 },
      { name: 'signal_mesh.query', description: 'Query the live signal mesh', inputSchema: '{ filter?, severity? }', calls24h: 567, avgLatencyMs: 89, errorRate: 0 },
      { name: 'proof.create', description: 'Create cryptographic proof packet', inputSchema: '{ evidence[], attestor }', calls24h: 201, avgLatencyMs: 210, errorRate: 0.005 },
      { name: 'proof.verify', description: 'Verify a proof packet chain', inputSchema: '{ proof_id }', calls24h: 156, avgLatencyMs: 67, errorRate: 0 },
      { name: 'covenant.check', description: 'Check policy compliance', inputSchema: '{ entity_id }', calls24h: 445, avgLatencyMs: 35, errorRate: 0 },
    ],
    resources: [
      { uri: 'a11oy://signals/active', name: 'Active Signals', mimeType: 'application/json', description: 'Real-time active signal feed' },
      { uri: 'a11oy://proof/ledger', name: 'Proof Ledger', mimeType: 'application/json', description: 'Cryptographic proof chain' },
    ],
  },
  {
    id: 'mcp-knowledge', name: 'Knowledge Store', gatewayServerId: 'szl-counsel-evidence',
    description: 'Agentic RAG — vector retrieval, semantic search, document ingestion',
    status: 'connected', transport: 'streamable-http', version: '1.8.0', latencyMs: 34, requestsToday: 1203, lastHealthCheck: Date.now() - 15000,
    tools: [
      { name: 'knowledge.search', description: 'Semantic search across knowledge base', inputSchema: '{ query, top_k? }', calls24h: 678, avgLatencyMs: 156, errorRate: 0.01 },
      { name: 'knowledge.ingest', description: 'Ingest document into knowledge store', inputSchema: '{ content, metadata }', calls24h: 45, avgLatencyMs: 2300, errorRate: 0.03 },
      { name: 'knowledge.graph_query', description: 'Query the knowledge graph', inputSchema: '{ cypher_query }', calls24h: 234, avgLatencyMs: 89, errorRate: 0.005 },
    ],
    resources: [
      { uri: 'a11oy://knowledge/collections', name: 'Collections', mimeType: 'application/json', description: 'All document collections' },
    ],
  },
  {
    id: 'mcp-github', name: 'GitHub', gatewayServerId: 'szl-aegis-threat',
    description: 'Repository access, PR management, code search, issue tracking',
    status: 'connected', transport: 'stdio', version: '2026.1.26', latencyMs: 89, requestsToday: 456, lastHealthCheck: Date.now() - 45000,
    tools: [
      { name: 'github.search_code', description: 'Search code across repositories', inputSchema: '{ query, repo? }', calls24h: 123, avgLatencyMs: 340, errorRate: 0.02 },
      { name: 'github.create_pr', description: 'Create a pull request', inputSchema: '{ repo, title, body }', calls24h: 12, avgLatencyMs: 1100, errorRate: 0.05 },
      { name: 'github.get_file', description: 'Read file from repository', inputSchema: '{ repo, path }', calls24h: 232, avgLatencyMs: 180, errorRate: 0 },
    ],
    resources: [{ uri: 'github://repos', name: 'Repositories', mimeType: 'application/json', description: 'Accessible repositories' }],
  },
  {
    id: 'mcp-postgres', name: 'PostgreSQL', gatewayServerId: 'szl-terra-portfolio',
    description: 'Database queries, schema inspection, data analysis',
    status: 'connected', transport: 'stdio', version: '0.7.0', latencyMs: 8, requestsToday: 1892, lastHealthCheck: Date.now() - 10000,
    tools: [
      { name: 'postgres.query', description: 'Execute read-only SQL query', inputSchema: '{ sql }', calls24h: 1456, avgLatencyMs: 23, errorRate: 0.001 },
      { name: 'postgres.schema', description: 'Inspect table schema', inputSchema: '{ table_name }', calls24h: 234, avgLatencyMs: 12, errorRate: 0 },
    ],
    resources: [{ uri: 'postgres://schema', name: 'Database Schema', mimeType: 'application/json', description: 'Full database schema' }],
  },
  {
    id: 'mcp-memory', name: 'Memory Fabric', gatewayServerId: 'szl-vessels-maritime',
    description: 'Multi-tier memory — chronicle, episodic, semantic, working',
    status: 'connected', transport: 'streamable-http', version: '1.2.0', latencyMs: 18, requestsToday: 934, lastHealthCheck: Date.now() - 20000,
    tools: [
      { name: 'memory.store', description: 'Store to memory tier', inputSchema: '{ tier, content }', calls24h: 345, avgLatencyMs: 56, errorRate: 0.01 },
      { name: 'memory.recall', description: 'Recall from memory with context', inputSchema: '{ query, tiers? }', calls24h: 456, avgLatencyMs: 89, errorRate: 0.005 },
    ],
    resources: [{ uri: 'a11oy://memory/tiers', name: 'Memory Tiers', mimeType: 'application/json', description: 'Memory tier statistics' }],
  },
  {
    id: 'mcp-huggingface', name: 'HuggingFace Hub', gatewayServerId: 'szl-hf-hub-bridge',
    description: 'ML ecosystem — search 1M+ models, 500K+ datasets, papers, Spaces, and community tools',
    status: 'connected', transport: 'sse', version: '1.0.0', latencyMs: 145, requestsToday: 0, lastHealthCheck: Date.now() - 60000,
    tools: [
      { name: 'hf_search_models', description: 'Search HuggingFace models by query, task, library, or license', inputSchema: '{ search, task?, library?, license?, limit?, sort? }', calls24h: 0, avgLatencyMs: 320, errorRate: 0 },
      { name: 'hf_search_datasets', description: 'Search HuggingFace datasets by query and task', inputSchema: '{ search, task?, limit?, sort? }', calls24h: 0, avgLatencyMs: 280, errorRate: 0 },
      { name: 'hf_search_papers', description: 'Search HuggingFace Daily Papers by topic or keyword', inputSchema: '{ query, limit? }', calls24h: 0, avgLatencyMs: 250, errorRate: 0 },
      { name: 'hf_search_spaces', description: 'Search HuggingFace Spaces — ML demos, Gradio apps, Streamlit apps', inputSchema: '{ query, limit? }', calls24h: 0, avgLatencyMs: 290, errorRate: 0 },
      { name: 'hf_get_model_info', description: 'Get detailed model card, config, files, tags, and download stats', inputSchema: '{ model_id }', calls24h: 0, avgLatencyMs: 180, errorRate: 0 },
      { name: 'hf_get_dataset_info', description: 'Get dataset card, features, splits, and statistics', inputSchema: '{ dataset_id }', calls24h: 0, avgLatencyMs: 190, errorRate: 0 },
      { name: 'hf_doc_search', description: 'Search across model cards, dataset cards, and documentation', inputSchema: '{ query, doc_type?, limit? }', calls24h: 0, avgLatencyMs: 260, errorRate: 0 },
      { name: 'hf_download_model', description: 'Retrieve model metadata, file listing, and download URLs', inputSchema: '{ modelId, revision?, purpose? }', calls24h: 0, avgLatencyMs: 450, errorRate: 0 },
      { name: 'hf_launch_space', description: 'Manage HuggingFace Spaces — create, list, restart, or pause', inputSchema: '{ action, spaceId?, sdk?, hardware? }', calls24h: 0, avgLatencyMs: 520, errorRate: 0 },
    ],
    resources: [
      { uri: 'huggingface://mcp/catalog', name: 'HF Tool Catalog', mimeType: 'application/json', description: 'Live tool catalog from the HuggingFace MCP server' },
      { uri: 'huggingface://models/trending', name: 'Trending Models', mimeType: 'application/json', description: 'Currently trending models on HuggingFace Hub' },
    ],
  },
];

function StatusDot({ status }: { status: string }) {
  const color = status === 'connected' || status === 'active' ? '#22c55e' : status === 'degraded' || status === 'idle' ? '#f59e0b' : '#ef4444';
  return (
    <span className="relative flex h-2 w-2">
      {(status === 'connected' || status === 'active') && <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: color }} />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    low: { bg: 'rgba(34,197,94,0.1)', fg: 'rgba(34,197,94,0.8)' },
    medium: { bg: 'rgba(245,158,11,0.1)', fg: 'rgba(245,158,11,0.8)' },
    high: { bg: 'rgba(239,68,68,0.1)', fg: 'rgba(239,68,68,0.8)' },
    critical: { bg: 'rgba(168,85,247,0.1)', fg: 'rgba(168,85,247,0.8)' },
  };
  const c = colors[level] ?? colors.medium!;
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ backgroundColor: c.bg, color: c.fg }}>
      {level}
    </span>
  );
}

function DispositionBadge({ disposition }: { disposition: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    allowed: { bg: 'rgba(34,197,94,0.1)', fg: 'rgba(34,197,94,0.8)' },
    blocked: { bg: 'rgba(239,68,68,0.1)', fg: 'rgba(239,68,68,0.8)' },
    pending_approval: { bg: 'rgba(245,158,11,0.1)', fg: 'rgba(245,158,11,0.8)' },
    rate_limited: { bg: 'rgba(168,85,247,0.1)', fg: 'rgba(168,85,247,0.8)' },
    execution_failed: { bg: 'rgba(239,68,68,0.15)', fg: 'rgba(239,68,68,0.9)' },
  };
  const c = colors[disposition] ?? colors.allowed!;
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: c.bg, color: c.fg }}>
      {disposition.replace('_', ' ')}
    </span>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
      <div className="text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function useGatewayData<T>(endpoint: string, interval = 15000): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(() => {
    fetch(`${API_BASE}/mcp-governed-gateway/${endpoint}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint]);
  useEffect(() => { fetchData(); const t = setInterval(fetchData, interval); return () => clearInterval(t); }, [fetchData, interval]);
  return { data, loading };
}

function ApiKeyManager({ onKeysChanged, keys }: { onKeysChanged: () => void; keys: GatewayApiKeyEntry[] }) {
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newRateLimit, setNewRateLimit] = useState('120');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/mcp-governed-gateway/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({ label: newLabel.trim(), rateLimit: parseInt(newRateLimit, 10) || 120 }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        setNewLabel('');
        setNewRateLimit('120');
        onKeysChanged();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }, [newLabel, newRateLimit, onKeysChanged]);

  const handleRevoke = useCallback(async (keyId: string) => {
    setRevoking(keyId);
    try {
      const res = await fetch(`${API_BASE}/mcp-governed-gateway/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: csrfHeaders(),
        credentials: 'include',
      });
      if (res.ok) onKeysChanged();
    } catch { /* ignore */ }
    setRevoking(null);
  }, [onKeysChanged]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,183,135,0.03)', border: '1px solid rgba(201,183,135,0.08)' }}>
        <h4 className="text-xs font-semibold mb-3" style={{ color: '#c9b787' }}>Generate API Key</h4>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Label</label>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Claude Desktop — Dev"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/30 outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>
          <div className="w-24">
            <label className="text-[10px] block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Rate Limit</label>
            <input
              value={newRateLimit}
              onChange={e => setNewRateLimit(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/30 outline-none font-mono"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newLabel.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: newLabel.trim() ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.03)',
              color: newLabel.trim() ? '#c9b787' : 'rgba(255,255,255,0.2)',
              border: `1px solid ${newLabel.trim() ? 'rgba(201,183,135,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {creating ? 'Creating...' : 'Generate'}
          </button>
        </div>
        {createdKey && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="text-[10px] mb-1 font-semibold" style={{ color: 'rgba(34,197,94,0.8)' }}>Key Generated — Copy and store securely</div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono flex-1 select-all" style={{ color: 'rgba(34,197,94,0.9)' }}>{createdKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey); }}
                className="text-[10px] px-2 py-1 rounded font-mono"
                style={{ color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}
              >
                Copy
              </button>
              <button
                onClick={() => setCreatedKey(null)}
                className="text-[10px] px-2 py-1 rounded font-mono"
                style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-[1fr_120px_120px_80px_80px_80px] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <span>Label</span><span>Prefix</span><span>Tenant</span><span>Limit</span><span>Status</span><span>Actions</span>
        </div>
        {keys.map(k => (
          <div key={k.id} className="grid grid-cols-[1fr_120px_120px_80px_80px_80px] px-3 py-2.5 items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{k.label}</span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(201,183,135,0.7)' }}>{k.prefix}...</span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.tenantId}</span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.rateLimit}/m</span>
            <span className="text-[10px] font-mono" style={{ color: k.revoked ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)' }}>
              {k.revoked ? 'revoked' : 'active'}
            </span>
            <div>
              {!k.revoked ? (
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="text-[9px] px-2 py-1 rounded font-mono transition-colors hover:brightness-110"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  {revoking === k.id ? '...' : 'Revoke'}
                </button>
              ) : (
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>{'\u2014'}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GatewayMonitor() {
  const [gwTab, setGwTab] = useState<'connections' | 'calls' | 'approvals' | 'proofs' | 'keys' | 'connect'>('connections');
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: stats } = useGatewayData<GatewayStats>(`stats?_r=${refreshKey}`);
  const { data: connData } = useGatewayData<{ connections: GatewayConnection[] }>(`connections?_r=${refreshKey}`);
  const { data: auditData } = useGatewayData<{ calls: GatewayToolCall[] }>(`audit-log?limit=100&_r=${refreshKey}`);
  const { data: approvalData } = useGatewayData<{ approvals: GatewayApproval[]; pending: number }>(`approvals?_r=${refreshKey}`);
  const { data: proofData } = useGatewayData<{ packets: GatewayProofPacket[] }>(`proof-chain?limit=50&_r=${refreshKey}`);
  const { data: keysData } = useGatewayData<{ keys: GatewayApiKeyEntry[] }>(`api-keys?_r=${refreshKey}`);
  const { data: connectData } = useGatewayData<ConnectInstructions>('connect-instructions', 60000);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprovalAction = useCallback(async (approvalId: string, action: 'approve' | 'reject') => {
    setActionLoading(approvalId);
    try {
      const res = await fetch(`${API_BASE}/mcp-governed-gateway/approvals/${approvalId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({ note: `${action === 'approve' ? 'Approved' : 'Rejected'} via Gateway Monitor` }),
      });
      if (res.ok) {
        setRefreshKey(k => k + 1);
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  }, []);

  const gwTabs = [
    { id: 'connections' as const, label: 'Connections' },
    { id: 'calls' as const, label: 'Tool Calls' },
    { id: 'approvals' as const, label: `Approvals${stats?.pendingApprovals ? ` (${stats.pendingApprovals})` : ''}` },
    { id: 'proofs' as const, label: 'Proof Chain' },
    { id: 'keys' as const, label: 'API Keys' },
    { id: 'connect' as const, label: 'Connect' },
  ];

  return (
    <div>
      <div className="grid grid-cols-6 gap-3 mb-6">
        <KpiCard label="ACTIVE AGENTS" value={String(stats?.activeConnections ?? 0)} sub={`${stats?.totalConnections ?? 0} total`} />
        <KpiCard label="TOOL CALLS" value={String(stats?.totalCalls ?? 0)} sub="governed executions" />
        <KpiCard label="PENDING APPROVALS" value={String(stats?.pendingApprovals ?? 0)} sub="awaiting review" />
        <KpiCard label="PROOF PACKETS" value={String(stats?.totalProofs ?? 0)} sub="audit chain" />
        <KpiCard label="AVG LATENCY" value={`${stats?.avgLatencyMs ?? 0}ms`} sub="gateway overhead" />
        <KpiCard label="GOVERNANCE" value={stats?.governanceMode === 'enforced' ? 'ENFORCED' : 'OFF'} sub="PCE gate active" />
      </div>

      {stats && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Risk Breakdown</div>
            <div className="flex gap-3">
              {Object.entries(stats.riskBreakdown).map(([level, count]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <RiskBadge level={level} />
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Disposition Breakdown</div>
            <div className="flex gap-3">
              {Object.entries(stats.dispositionBreakdown).map(([disp, count]) => (
                <div key={disp} className="flex items-center gap-1.5">
                  <DispositionBadge disposition={disp} />
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {gwTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setGwTab(t.id)}
            className="px-3 py-1.5 text-[10px] font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: gwTab === t.id ? 'rgba(201,183,135,0.12)' : 'transparent',
              color: gwTab === t.id ? '#c9b787' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {gwTab === 'connections' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-[1fr_120px_100px_80px_80px_80px_100px] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <span>Agent</span><span>Type</span><span>Status</span><span>Calls</span><span>Approved</span><span>Proofs</span><span>Last Active</span>
          </div>
          {(connData?.connections ?? []).map(c => (
            <div key={c.connectionId} className="grid grid-cols-[1fr_120px_100px_80px_80px_80px_100px] px-3 py-2.5 items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <StatusDot status={c.status} />
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.agentName}</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.agentType}</span>
              <span className="text-[10px] font-mono" style={{ color: c.status === 'active' ? 'rgba(34,197,94,0.8)' : 'rgba(245,158,11,0.7)' }}>{c.status}</span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.toolCallCount}</span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.approvedCount}</span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.proofPacketCount}</span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(c.lastActivityAt)}</span>
            </div>
          ))}
        </div>
      )}

      {gwTab === 'calls' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-[1fr_140px_80px_100px_80px_100px] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <span>Tool</span><span>Agent</span><span>Risk</span><span>Disposition</span><span>Latency</span><span>Time</span>
          </div>
          {(auditData?.calls ?? []).slice(0, 30).map(c => (
            <div key={c.callId} className="grid grid-cols-[1fr_140px_80px_100px_80px_100px] px-3 py-2 items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-xs font-mono" style={{ color: '#c9b787' }}>{c.toolName}</span>
              <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.agentName}</span>
              <RiskBadge level={c.riskLevel} />
              <DispositionBadge disposition={c.disposition} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.latencyMs}ms</span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(c.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      {gwTab === 'approvals' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-[1fr_120px_70px_90px_90px_130px_80px] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <span>Tool</span><span>Agent</span><span>Risk</span><span>Tier</span><span>Status</span><span>Actions</span><span>Time</span>
          </div>
          {(approvalData?.approvals ?? []).map(a => (
            <div key={a.approvalId} className="grid grid-cols-[1fr_120px_70px_90px_90px_130px_80px] px-3 py-2.5 items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-xs font-mono" style={{ color: '#c9b787' }}>{a.toolName}</span>
              <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.agentName}</span>
              <RiskBadge level={a.riskLevel} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(201,183,135,0.7)' }}>{a.requiredTier}</span>
              <span className="text-[10px] font-mono" style={{
                color: a.status === 'pending' ? 'rgba(245,158,11,0.8)' : a.status === 'approved' ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
              }}>{a.status}</span>
              <div className="flex gap-1">
                {a.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprovalAction(a.approvalId, 'approve')}
                      disabled={actionLoading === a.approvalId}
                      className="text-[9px] px-2 py-1 rounded font-mono transition-colors hover:brightness-110"
                      style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: 'rgba(34,197,94,0.9)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      {actionLoading === a.approvalId ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApprovalAction(a.approvalId, 'reject')}
                      disabled={actionLoading === a.approvalId}
                      className="text-[9px] px-2 py-1 rounded font-mono transition-colors hover:brightness-110"
                      style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.9)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {actionLoading === a.approvalId ? '...' : 'Reject'}
                    </button>
                  </>
                ) : (
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {a.reviewedBy ? `by ${a.reviewedBy}` : '\u2014'}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {gwTab === 'proofs' && (
        <div className="space-y-2">
          {(proofData?.packets ?? []).slice(0, 20).map((p, i) => (
            <div key={p.packetId} className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: '#c9b787' }}>{p.packetId}</span>
                  <RiskBadge level={p.riskLevel} />
                  <DispositionBadge disposition={p.disposition} />
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(p.issuedAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Tool: </span>
                  <span className="font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.toolName}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Agent: </span>
                  <span className="font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.agentName}</span>
                </div>
                <div className="col-span-2">
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Hash: </span>
                  <span className="font-mono" style={{ color: 'rgba(34,197,94,0.6)' }}>{p.hash}</span>
                </div>
                {p.previousHash && (
                  <div className="col-span-2">
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Previous: </span>
                    <span className="font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.previousHash}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Witnessed by: </span>
                  <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.witnessedBy.join(', ')}</span>
                </div>
              </div>
              {i < (proofData?.packets ?? []).slice(0, 20).length - 1 && (
                <div className="flex justify-center mt-2">
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="none" style={{ color: 'rgba(201,183,135,0.3)' }}>
                    <path d="M6 0v12M2 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {gwTab === 'keys' && (
        <div>
          <ApiKeyManager onKeysChanged={() => setRefreshKey(k => k + 1)} keys={keysData?.keys ?? []} />
        </div>
      )}

      {gwTab === 'connect' && connectData && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,183,135,0.03)', border: '1px solid rgba(201,183,135,0.08)' }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: '#c9b787' }}>Governance-Injecting MCP Gateway</h4>
            <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Connect any MCP-compatible agent to the governed tool surface. Every tool call passes through the PCE Gate
              for risk classification, covenant policy checking, and human approval routing. Every interaction produces
              an auditable proof packet.
            </p>
            <div className="flex gap-4 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>Protocol: {connectData.protocolVersion}</span>
              <span>Transports: {connectData.transports.join(', ')}</span>
            </div>
          </div>

          {Object.entries(connectData.clients).map(([key, client]) => (
            <div key={key} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{client.name}</span>
                <button
                  onClick={() => {
                    const text = client.config ? JSON.stringify(client.config, null, 2) : (client.command ?? client.note ?? '');
                    navigator.clipboard.writeText(text);
                  }}
                  className="text-[10px] px-2 py-1 rounded font-mono hover:bg-white/5"
                  style={{ color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}
                >
                  Copy Config
                </button>
              </div>
              {client.configFile && (
                <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Config file: <span className="font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{client.configFile}</span>
                </div>
              )}
              {client.config && (
                <pre className="text-[10px] font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.5)' }}>
                  {JSON.stringify(client.config, null, 2)}
                </pre>
              )}
              {client.command && (
                <pre className="text-[10px] font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.5)' }}>
                  {client.command}
                </pre>
              )}
              {client.note && !client.command && !client.config && (
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{client.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServerCard({ server, onSelect, onToggle, toggling }: { server: McpServer; onSelect: () => void; onToggle?: (id: string, enabled: boolean) => void; toggling?: string | null }) {
  const totalCalls = server.tools.reduce((s, t) => s + t.calls24h, 0);
  const avgLatency = Math.round(server.tools.reduce((s, t) => s + t.avgLatencyMs, 0) / server.tools.length);
  const isToggling = toggling === server.id;
  return (
    <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }} className="w-full p-4 rounded-xl text-left transition-all hover:translate-y-[-1px] cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', opacity: isToggling ? 0.6 : 1, pointerEvents: isToggling ? 'none' : undefined }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={server.status} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{server.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggle && (
            <ServerToggle server={server} onToggle={onToggle} disabled={isToggling} />
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>v{server.version}</span>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{server.description}</p>
      <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span>{server.tools.length} tools</span>
        <span>{server.resources.length} resources</span>
        <span>{totalCalls.toLocaleString()} calls/24h</span>
        <span>{avgLatency}ms avg</span>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
          backgroundColor: server.transport === 'stdio' ? 'rgba(59,130,246,0.08)' : server.transport === 'sse' ? 'rgba(168,85,247,0.08)' : 'rgba(34,197,94,0.08)',
          color: server.transport === 'stdio' ? 'rgba(59,130,246,0.7)' : server.transport === 'sse' ? 'rgba(168,85,247,0.7)' : 'rgba(34,197,94,0.7)',
        }}>{server.transport}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#5e5e5e' }} title="Scope: fabric.read + fabric.write">scope: fabric</span>
        <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#8a8a8a' }} title="Hooks: PreToolUse, PostToolUse, PostSubagentReturn">⚡ hooked</span>
      </div>
    </div>
  );
}

/** Derive risk level from tool name heuristics — used for Trust Tier gating indicator. */
function toolRiskLevel(name: string): 'read' | 'low' | 'high' {
  if (/search|inspect|query|get|list|schema|verify/.test(name)) return 'read';
  if (/create|ingest|toggle/.test(name)) return 'low';
  return 'high';
}

function ToolRow({ tool }: { tool: McpTool }) {
  const risk = toolRiskLevel(tool.name);
  const riskColor = risk === 'read' ? '#5e5e5e' : risk === 'low' ? '#c9b787' : '#f5f5f5';
  const riskLabel = risk === 'read' ? 'T0' : risk === 'low' ? 'T2' : 'T3';
  return (
    <div className="flex items-center justify-between py-2.5 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium" style={{ color: '#c9b787' }}>{tool.name}</span>
          {tool.errorRate > 0.05 && (
            <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)' }}>
              {(tool.errorRate * 100).toFixed(0)}% errors
            </span>
          )}
          <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: riskColor }} title={`Min trust tier: ${riskLabel}`}>{riskLabel}</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }} title="Hook emits: PreToolUse + PostToolUse">⚡</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{tool.description}</p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0 ml-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <span>{tool.calls24h}</span>
        <span>{tool.avgLatencyMs}ms</span>
      </div>
    </div>
  );
}

function ServerToggle({ server, onToggle, disabled }: { server: McpServer; onToggle: (id: string, enabled: boolean) => void; disabled?: boolean }) {
  const isOn = server.status === 'connected' || server.status === 'degraded';
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle(server.id, !isOn); }}
      disabled={disabled}
      className="relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: isOn ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'wait' : 'pointer' }}
      title={disabled ? 'Toggling...' : isOn ? 'Disable server' : 'Enable server'}
    >
      <span
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all"
        style={{
          left: isOn ? '16px' : '2px',
          backgroundColor: isOn ? '#22c55e' : 'rgba(255,255,255,0.25)',
        }}
      />
    </button>
  );
}

function ServersView() {
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);
  const [liveStatus, setLiveStatus] = useState<Record<string, LiveServerStatus>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/mcp-governed-gateway/servers`, { credentials: 'include', headers: csrfHeaders() });
        if (res.ok && active) {
          const data = await res.json();
          const map: Record<string, LiveServerStatus> = {};
          for (const s of (data.servers ?? []) as LiveServerStatus[]) {
            map[s.serverId] = s;
          }
          setLiveStatus(map);
        }
      } catch { /* ignore */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const getStatus = (s: McpServer): McpServer['status'] => {
    if (s.gatewayServerId && liveStatus[s.gatewayServerId]) {
      return liveStatus[s.gatewayServerId].enabled ? 'connected' : 'offline';
    }
    return s.status;
  };
  const getLiveMetrics = (s: McpServer) => {
    if (s.gatewayServerId && liveStatus[s.gatewayServerId]) {
      const live = liveStatus[s.gatewayServerId];
      return { requestsToday: live.callsToday, latencyMs: live.avgLatencyMs || s.latencyMs };
    }
    return { requestsToday: s.requestsToday, latencyMs: s.latencyMs };
  };
  const activeServers = SERVERS.map(s => ({ ...s, status: getStatus(s), ...getLiveMetrics(s) }));
  const totalTools = activeServers.reduce((s, srv) => s + srv.tools.length, 0);
  const totalCalls = activeServers.reduce((s, srv) => s + srv.requestsToday, 0);
  const connectedCount = activeServers.filter(s => s.status === 'connected').length;

  const handleToggle = useCallback(async (serverId: string, enable: boolean) => {
    const server = SERVERS.find(s => s.id === serverId);
    const gatewayId = server?.gatewayServerId;
    if (!gatewayId) return;
    setToggling(serverId);
    try {
      const res = await fetch(`${API_BASE}/mcp-governed-gateway/servers/${gatewayId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({ enabled: enable }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.enabled === 'boolean') {
          setLiveStatus(prev => ({
            ...prev,
            [gatewayId]: { ...prev[gatewayId], ...data },
          }));
          if (selectedServer && selectedServer.id === serverId) {
            setSelectedServer(prev => prev ? { ...prev, status: data.enabled ? 'connected' : 'offline' } : null);
          }
        }
      }
    } catch { /* ignore */ }
    setToggling(null);
  }, [selectedServer]);

  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-8">
        <KpiCard label="MCP Servers" value={String(SERVERS.length)} sub={`${connectedCount} healthy`} />
        <KpiCard label="Total Tools" value={String(totalTools)} sub="across all servers" />
        <KpiCard label="Calls Today" value={totalCalls.toLocaleString()} sub="governed executions" />
        <KpiCard label="Avg Latency" value={`${Math.round(activeServers.reduce((s, srv) => s + srv.latencyMs, 0) / activeServers.length)}ms`} sub="proxy overhead" />
      </div>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            {activeServers.map(s => <ServerCard key={s.id} server={s} onSelect={() => setSelectedServer(s)} onToggle={handleToggle} toggling={toggling} />)}
          </div>
        </div>
        {selectedServer && (
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-6 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status={getStatus(selectedServer)} />
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedServer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ServerToggle server={{ ...selectedServer, status: getStatus(selectedServer) }} onToggle={handleToggle} />
                    <button onClick={() => setSelectedServer(null)} className="p-1 rounded hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedServer.description}</p>
                <div className="flex gap-2 mt-2">
                  {[selectedServer.transport, `v${selectedServer.version}`, `${selectedServer.latencyMs}ms`].map((v, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  Tools ({selectedServer.tools.length})
                </div>
                {selectedServer.tools.map((t, i) => <ToolRow key={i} tool={t} />)}
              </div>
              {selectedServer.resources.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    Resources ({selectedServer.resources.length})
                  </div>
                  {selectedServer.resources.map((r, i) => (
                    <div key={i} className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="text-xs font-mono" style={{ color: 'rgba(201,183,135,0.7)' }}>{r.uri}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function McpHub() {
  const [mainTab, setMainTab] = useState<'servers' | 'gateway'>('servers');

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          label="MCP"
          title="MCP Hub"
          subtitle="Model Context Protocol — governed tool registry and external agent gateway"
          status="LIVE"
        />

        <div className="flex gap-2 mb-6">
          {[
            { id: 'servers' as const, label: 'SERVERS', icon: null },
            { id: 'gateway' as const, label: 'GATEWAY MONITOR', icon: null },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className="px-4 py-2 text-xs font-semibold tracking-wider rounded-lg transition-colors"
              style={{
                backgroundColor: mainTab === t.id ? 'rgba(201,183,135,0.12)' : 'rgba(255,255,255,0.02)',
                color: mainTab === t.id ? '#c9b787' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${mainTab === t.id ? 'rgba(201,183,135,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mainTab === 'servers' && <ServersView />}
        {mainTab === 'gateway' && <GatewayMonitor />}

        {/* MCP 2026 Claude Code Doctrine Checklist */}
        <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,183,135,0.02)', border: '1px solid rgba(201,183,135,0.06)' }}>
          <div className="text-xs font-semibold mb-3 font-mono tracking-wider" style={{ color: '#c9b787' }}>MCP 2026 COMPLIANCE CHECKLIST</div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              { ok: true, label: 'Streamable HTTP transport (replaces SSE)' },
              { ok: true, label: 'Tool scope declared per-server (fabric.read / fabric.write)' },
              { ok: true, label: 'PreToolUse + PostToolUse hooks on every tool call' },
              { ok: true, label: 'Trust Tier badge on each tool (T0–T4)' },
              { ok: true, label: 'Proof Packet sealed per call (PostToolUse hook)' },
              { ok: true, label: 'Human approval routing for T3+ tools' },
              { ok: true, label: 'SubagentContract session_id plumbing' },
              { ok: true, label: 'Reward-Hacking Watchdog on PostSubagentReturn' },
              { ok: true, label: 'OPA/Rego policy bundle per server' },
              { ok: false, label: 'OAuth 2.1 bearer token per connection (coming)' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-[10px]">
                <span style={{ color: item.ok ? '#c9b787' : '#5e5e5e' }}>{item.ok ? '✓' : '○'}</span>
                <span style={{ color: item.ok ? 'var(--color-a11oy-text-sub)' : 'var(--color-a11oy-text-ghost)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', borderTop: '2px solid #c9b787', background: 'rgba(201,183,135,0.04)', borderRadius: 8 }}>
          <p style={{ fontSize: '0.625rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9b787', margin: '0 0 0.5rem' }}>Atelier</p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f5f5f5', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Compose MCP servers into governed Spaces</h3>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: '#8a8a8a', margin: '0 0 0.75rem' }}>
            Atelier publishes governed agent Spaces that wire MCP tools into a constitution-bound runtime
            with proof on every call.
          </p>
          <a href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/atelier`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, color: '#c9b787', textDecoration: 'none', letterSpacing: '0.06em' }}>
            Open Atelier →
          </a>
        </div>
      </div>
    </Layout>
  );
}

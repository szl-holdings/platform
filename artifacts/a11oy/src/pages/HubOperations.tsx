import { useState, useEffect, useCallback } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

interface HubOperation {
  operationId: string;
  type: string;
  governance: {
    riskLevel: string;
    costEstimateUsd: number;
    pceResult: { allowed: boolean; blockedReason?: string; contract?: { contractId: string } };
    proofPacketId?: string;
  };
  hubRecord: {
    id: string;
    type: string;
    riskLevel: string;
    agentId?: string;
    tenantId?: string;
    resourceUri: string;
    purpose?: string;
    costEstimateUsd: number;
    status: string;
    createdAt: string;
    completedAt?: string;
    durationMs?: number;
  };
  result?: unknown;
  error?: string;
  timestamp: string;
}

interface CostDashboard {
  totalCostUsd: number;
  byOperation: Record<string, number>;
  byAgent: Record<string, number>;
  operationCount: number;
  governedOperations: number;
  blockedOperations: number;
  complianceRate: number;
}

interface SearchResult {
  id: string;
  modelId?: string;
  downloads: number;
  likes: number;
  pipeline_tag?: string;
  library_name?: string;
  author?: string;
  tags: string[];
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  failed: 'bg-red-500/20 text-red-400',
  blocked: 'bg-red-500/20 text-red-300',
};

const OP_LABELS: Record<string, string> = {
  search_models: 'Search Models',
  search_datasets: 'Search Datasets',
  download_model: 'Download Model',
  upload_model: 'Upload Model',
  manage_bucket: 'Manage Bucket',
  launch_space: 'Launch Space',
  get_model_card: 'Model Card',
  get_dataset_info: 'Dataset Info',
};

function relativeTime(iso?: string): string {
  if (!iso) return '\u2014';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

type TabId = 'operations' | 'search' | 'manage' | 'costs';

export function HubOperations() {
  const [tab, setTab] = useState<TabId>('operations');
  const [operations, setOperations] = useState<HubOperation[]>([]);
  const [costs, setCosts] = useState<CostDashboard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<'models' | 'datasets'>('models');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manageAction, setManageAction] = useState<string>('');
  const [manageResult, setManageResult] = useState<string>('');
  const [managePending, setManagePending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [opsData, costsData] = await Promise.all([
        apiFetch<{ operations: HubOperation[] }>('/a11oy/hub-operations'),
        apiFetch<CostDashboard>('/a11oy/hub-operations/costs'),
      ]);
      setOperations(opsData.operations ?? []);
      setCosts(costsData);
    } catch {
      setOperations(DEMO_OPERATIONS);
      setCosts(DEMO_COSTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const iv = setInterval(refresh, 15_000);
    return () => clearInterval(iv);
  }, [refresh]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      if (searchType === 'models') {
        const data = await apiFetch<{ models: SearchResult[] }>('/a11oy/hub-operations/search-models', {
          method: 'POST',
          body: JSON.stringify({ search: searchQuery, limit: 20 }),
        });
        setSearchResults(data.models ?? []);
      } else {
        const data = await apiFetch<{ datasets: SearchResult[] }>('/a11oy/hub-operations/search-datasets', {
          method: 'POST',
          body: JSON.stringify({ search: searchQuery, limit: 20 }),
        });
        setSearchResults(data.datasets ?? []);
      }
      void refresh();
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (modelId: string) => {
    try {
      await apiFetch('/a11oy/hub-operations/download-model', {
        method: 'POST',
        body: JSON.stringify({ modelId, purpose: 'Inspect model metadata, file listing, and download URLs' }),
      });
      void refresh();
    } catch { /* handled by refresh */ }
  };

  const handleUpload = async (repoId: string, purpose: string, files: Array<{ path: string; content: string }>) => {
    setManagePending(true);
    setManageResult('');
    try {
      const data = await apiFetch<{ governance: HubOperation }>('/a11oy/hub-operations/upload-model', {
        method: 'POST',
        body: JSON.stringify({ repoId, purpose, repoType: 'model', files }),
      });
      const status = data.governance?.governance?.pceResult?.allowed ? 'Approved' : 'Blocked by PCE Gate';
      const fileCount = files.length;
      setManageResult(`Upload ${repoId} (${fileCount} file${fileCount !== 1 ? 's' : ''}): ${status}`);
      void refresh();
    } catch {
      setManageResult('Upload request failed — authentication required');
    } finally {
      setManagePending(false);
    }
  };

  const handleBucket = async (action: string, bucketName: string) => {
    setManagePending(true);
    setManageResult('');
    try {
      const data = await apiFetch<{ governance: HubOperation }>('/a11oy/hub-operations/manage-bucket', {
        method: 'POST',
        body: JSON.stringify({ action, bucketName }),
      });
      const status = data.governance?.governance?.pceResult?.allowed ? 'Approved' : 'Blocked by PCE Gate';
      setManageResult(`Bucket ${action} "${bucketName}": ${status}`);
      void refresh();
    } catch {
      setManageResult('Bucket operation failed — authentication required');
    } finally {
      setManagePending(false);
    }
  };

  const handleSpace = async (action: string, spaceId: string, sdk?: string) => {
    setManagePending(true);
    setManageResult('');
    try {
      const data = await apiFetch<{ governance: HubOperation }>('/a11oy/hub-operations/manage-space', {
        method: 'POST',
        body: JSON.stringify({ action, spaceId, sdk }),
      });
      const status = data.governance?.governance?.pceResult?.allowed ? 'Approved' : 'Blocked by PCE Gate';
      setManageResult(`Space ${action} "${spaceId}": ${status}`);
      void refresh();
    } catch {
      setManageResult('Space operation failed — authentication required');
    } finally {
      setManagePending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d14] text-[#e2e8f0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin border-[#1a2436] border-t-[#c9b787]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-[#e2e8f0] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#64748b] mb-1">
            A11OY {'\u00b7'} HF HUB {'\u00b7'} GOVERNED OPERATIONS
          </p>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[11px] font-bold text-black">HF</span>
            Hub Operations
          </h1>
          <p className="text-xs text-[#64748b] mt-1">Governed HuggingFace Hub access — search, download, upload with full audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#64748b]">
            {costs ? `${costs.governedOperations} ops \u00b7 $${costs.totalCostUsd.toFixed(4)}` : '\u2014'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Ops', value: costs?.governedOperations ?? 0, color: 'text-cyan-400' },
          { label: 'Blocked', value: costs?.blockedOperations ?? 0, color: 'text-red-400' },
          { label: 'Compliance', value: `${(costs?.complianceRate ?? 100).toFixed(0)}%`, color: 'text-emerald-400' },
          { label: 'Cost (USD)', value: `$${(costs?.totalCostUsd ?? 0).toFixed(4)}`, color: 'text-amber-400' },
          { label: 'Agents', value: Object.keys(costs?.byAgent ?? {}).length || 1, color: 'text-violet-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#64748b]">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-[#1a2436] pb-px">
        {([
          { id: 'operations' as TabId, label: 'Audit Log' },
          { id: 'search' as TabId, label: 'Model Search' },
          { id: 'manage' as TabId, label: 'Upload / Manage' },
          { id: 'costs' as TabId, label: 'Cost Dashboard' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-[#0e1520] text-[#e2e8f0] border-b-2 border-cyan-400'
                : 'text-[#64748b] hover:text-[#94a3b8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'operations' && (
        <div className="rounded-xl border border-[#1a2436] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a2436] text-[#64748b]">
                <th className="text-left p-3 font-medium">Operation</th>
                <th className="text-left p-3 font-medium">Resource</th>
                <th className="text-left p-3 font-medium">Risk</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Cost</th>
                <th className="text-left p-3 font-medium">PCE</th>
                <th className="text-left p-3 font-medium">Proof</th>
                <th className="text-right p-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-[#64748b]">No hub operations recorded yet. Use Model Search to begin.</td>
                </tr>
              )}
              {operations.map((op) => (
                <tr key={op.operationId} className="border-b border-[#1a2436]/60 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3">
                    <span className="font-mono text-[#e2e8f0]">{OP_LABELS[op.type] ?? op.type}</span>
                    {op.hubRecord.agentId && (
                      <span className="block text-[9px] text-[#64748b] font-mono mt-0.5">{op.hubRecord.agentId}</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[#94a3b8] max-w-[200px] truncate">{op.hubRecord.resourceUri}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${RISK_COLORS[op.hubRecord.riskLevel] ?? RISK_COLORS.low}`}>
                      {op.hubRecord.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[op.hubRecord.status] ?? STATUS_COLORS.pending}`}>
                      {op.hubRecord.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-amber-400">${op.governance.costEstimateUsd.toFixed(4)}</td>
                  <td className="p-3">
                    {op.governance.pceResult.allowed ? (
                      <span className="text-emerald-400 text-[10px] font-semibold">PASS</span>
                    ) : (
                      <span className="text-red-400 text-[10px] font-semibold">BLOCKED</span>
                    )}
                  </td>
                  <td className="p-3">
                    {op.governance.proofPacketId ? (
                      <span className="text-cyan-400 text-[10px] font-mono">{op.governance.proofPacketId.slice(0, 10)}</span>
                    ) : (
                      <span className="text-[#4a5568] text-[10px]">{'\u2014'}</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-[#64748b]">{relativeTime(op.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex bg-[#0c1220] rounded-lg border border-[#1a2436] overflow-hidden">
              {(['models', 'datasets'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setSearchType(t); setSearchResults([]); }}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    searchType === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-[#64748b] hover:text-[#94a3b8]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search HF ${searchType}...`}
              className="flex-1 bg-[#0c1220] border border-[#1a2436] rounded-lg px-4 py-2 text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <p className="text-[10px] text-[#64748b] font-mono">
            Every search is a governed operation {'\u2014'} PCE gate evaluates risk, proof chain records provenance
          </p>

          {searchResults.length > 0 && (
            <div className="grid gap-3">
              {searchResults.map((m) => {
                const displayId = m.modelId ?? m.id;
                return (
                  <div key={displayId} className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-4 flex items-start justify-between hover:border-[#2a3446] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-[#e2e8f0] truncate">{displayId}</span>
                        {m.pipeline_tag && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-400 font-mono">{m.pipeline_tag}</span>
                        )}
                        {searchType === 'datasets' && m.author && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-400 font-mono">{m.author}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#64748b] font-mono">
                        <span>{'\u2193'} {m.downloads?.toLocaleString() ?? 0}</span>
                        <span>{'\u2665'} {m.likes?.toLocaleString() ?? 0}</span>
                        {m.library_name && <span>{m.library_name}</span>}
                        {m.tags?.slice(0, 3).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 text-[#94a3b8]">{t}</span>
                        ))}
                      </div>
                    </div>
                    {searchType === 'models' && (
                      <button
                        onClick={() => handleDownload(displayId)}
                        className="ml-3 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/30 transition-colors border border-amber-500/20"
                      >
                        Inspect Model
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'manage' && (
        <div className="space-y-6">
          <p className="text-[10px] text-[#64748b] font-mono">
            High-risk operations {'\u2014'} PCE gate enforces approval tiers, proof chain records all actions
          </p>

          {manageResult && (
            <div className={`rounded-lg border px-4 py-3 text-xs font-mono ${
              manageResult.includes('Approved') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
              manageResult.includes('Blocked') ? 'border-red-500/30 bg-red-500/10 text-red-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {manageResult}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <UploadPanel onUpload={handleUpload} pending={managePending} />
            <BucketPanel onBucket={handleBucket} pending={managePending} />
            <SpacePanel onSpace={handleSpace} pending={managePending} />
          </div>
        </div>
      )}

      {tab === 'costs' && costs && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-3">Cost by Operation Type</p>
              {Object.entries(costs.byOperation).length === 0 ? (
                <p className="text-[#4a5568] text-xs">No cost data yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(costs.byOperation).map(([op, cost]) => (
                    <div key={op} className="flex items-center justify-between">
                      <span className="text-xs text-[#94a3b8]">{OP_LABELS[op] ?? op}</span>
                      <span className="font-mono text-xs text-amber-400">${cost.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-3">Cost by Agent</p>
              {Object.entries(costs.byAgent).length === 0 ? (
                <p className="text-[#4a5568] text-xs">No agent cost data yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(costs.byAgent).map(([agent, cost]) => (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-xs text-[#94a3b8] font-mono">{agent}</span>
                      <span className="font-mono text-xs text-amber-400">${cost.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-3">Governance Summary</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">Governed Ops</span>
                  <span className="font-mono text-xs text-cyan-400">{costs.governedOperations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">Blocked</span>
                  <span className="font-mono text-xs text-red-400">{costs.blockedOperations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">Compliance</span>
                  <span className="font-mono text-xs text-emerald-400">{costs.complianceRate.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">Total Cost</span>
                  <span className="font-mono text-xs text-amber-400">${costs.totalCostUsd.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadPanel({ onUpload, pending }: { onUpload: (repoId: string, purpose: string, files: Array<{ path: string; content: string }>) => void; pending: boolean }) {
  const [repoId, setRepoId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [filePath, setFilePath] = useState('README.md');
  const [fileContent, setFileContent] = useState('');
  const [files, setFiles] = useState<Array<{ path: string; content: string }>>([]);

  const addFile = () => {
    if (!filePath || !fileContent) return;
    setFiles((prev) => [...prev, { path: filePath, content: fileContent }]);
    setFilePath('');
    setFileContent('');
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5 space-y-3">
      <p className="text-xs font-semibold text-[#e2e8f0] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        Upload Model
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 ml-auto">HIGH RISK</span>
      </p>
      <input
        type="text"
        value={repoId}
        onChange={(e) => setRepoId(e.target.value)}
        placeholder="Repo ID (e.g. org/model-name)"
        className="w-full bg-[#080d14] border border-[#1a2436] rounded px-3 py-1.5 text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
      />
      <input
        type="text"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose (audit trail)"
        className="w-full bg-[#080d14] border border-[#1a2436] rounded px-3 py-1.5 text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
      />
      <div className="border border-[#1a2436] rounded p-2 space-y-2">
        <p className="text-[10px] text-[#8892a4]">Files to upload:</p>
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] text-[#8892a4]">
            <span className="truncate flex-1 font-mono">{f.path}</span>
            <span className="text-[#4a5568]">({f.content.length} chars)</span>
            <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">x</button>
          </div>
        ))}
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="File path (e.g. config.json)"
          className="w-full bg-[#080d14] border border-[#1a2436] rounded px-2 py-1 text-[10px] text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
        />
        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          placeholder="File content"
          rows={3}
          className="w-full bg-[#080d14] border border-[#1a2436] rounded px-2 py-1 text-[10px] text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
        />
        <button
          onClick={addFile}
          disabled={!filePath || !fileContent}
          className="w-full px-2 py-1 rounded bg-[#1a2436] text-[#8892a4] text-[10px] hover:bg-[#1e2a3e] transition-colors disabled:opacity-40"
        >
          + Add File
        </button>
      </div>
      <button
        onClick={() => repoId && files.length > 0 && onUpload(repoId, purpose, files)}
        disabled={!repoId || files.length === 0 || pending}
        className="w-full px-3 py-1.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30 transition-colors border border-red-500/20 disabled:opacity-40"
      >
        {pending ? 'Processing...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''} (PCE Gated)`}
      </button>
    </div>
  );
}

function BucketPanel({ onBucket, pending }: { onBucket: (action: string, name: string) => void; pending: boolean }) {
  const [bucketName, setBucketName] = useState('');
  const [action, setAction] = useState<'create' | 'list' | 'get' | 'delete'>('list');
  return (
    <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5 space-y-3">
      <p className="text-xs font-semibold text-[#e2e8f0] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        Manage Buckets
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 ml-auto">HIGH RISK</span>
      </p>
      <div className="flex gap-1">
        {(['list', 'create', 'get', 'delete'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-2 py-1 rounded text-[10px] capitalize transition-colors ${
              action === a ? 'bg-cyan-500/20 text-cyan-400' : 'text-[#64748b] hover:text-[#94a3b8] bg-white/5'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={bucketName}
        onChange={(e) => setBucketName(e.target.value)}
        placeholder="Bucket name"
        className="w-full bg-[#080d14] border border-[#1a2436] rounded px-3 py-1.5 text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
      />
      <button
        onClick={() => onBucket(action, bucketName)}
        disabled={pending}
        className="w-full px-3 py-1.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30 transition-colors border border-red-500/20 disabled:opacity-40"
      >
        {pending ? 'Processing...' : `${action.charAt(0).toUpperCase() + action.slice(1)} Bucket (PCE Gated)`}
      </button>
    </div>
  );
}

function SpacePanel({ onSpace, pending }: { onSpace: (action: string, spaceId: string, sdk?: string) => void; pending: boolean }) {
  const [spaceId, setSpaceId] = useState('');
  const [action, setAction] = useState<'list' | 'create' | 'get' | 'restart' | 'pause'>('list');
  const [sdk, setSdk] = useState<'gradio' | 'streamlit' | 'docker' | 'static'>('gradio');
  return (
    <div className="rounded-xl border border-[#1a2436] bg-[#0c1220]/60 p-5 space-y-3">
      <p className="text-xs font-semibold text-[#e2e8f0] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        Manage Spaces
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 ml-auto">HIGH RISK</span>
      </p>
      <div className="flex gap-1 flex-wrap">
        {(['list', 'create', 'get', 'restart', 'pause'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-2 py-1 rounded text-[10px] capitalize transition-colors ${
              action === a ? 'bg-cyan-500/20 text-cyan-400' : 'text-[#64748b] hover:text-[#94a3b8] bg-white/5'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={spaceId}
        onChange={(e) => setSpaceId(e.target.value)}
        placeholder="Space ID (e.g. org/space-name)"
        className="w-full bg-[#080d14] border border-[#1a2436] rounded px-3 py-1.5 text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50"
      />
      {action === 'create' && (
        <div className="flex gap-1">
          {(['gradio', 'streamlit', 'docker', 'static'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSdk(s)}
              className={`px-2 py-1 rounded text-[10px] capitalize transition-colors ${
                sdk === s ? 'bg-violet-500/20 text-violet-400' : 'text-[#64748b] hover:text-[#94a3b8] bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => onSpace(action, spaceId, action === 'create' ? sdk : undefined)}
        disabled={pending}
        className="w-full px-3 py-1.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30 transition-colors border border-red-500/20 disabled:opacity-40"
      >
        {pending ? 'Processing...' : `${action.charAt(0).toUpperCase() + action.slice(1)} Space (PCE Gated)`}
      </button>
    </div>
  );
}

const DEMO_OPERATIONS: HubOperation[] = [
  {
    operationId: 'hub-demo-001',
    type: 'search_models',
    governance: { riskLevel: 'low', costEstimateUsd: 0.0001, pceResult: { allowed: true, contract: { contractId: 'pce-demo-1' } }, proofPacketId: 'pp-a1b2c3d4' },
    hubRecord: { id: 'hub-demo-001', type: 'search_models', riskLevel: 'low', resourceUri: 'hf://models', purpose: 'search: legal NER', costEstimateUsd: 0.0001, status: 'completed', createdAt: new Date(Date.now() - 300_000).toISOString(), completedAt: new Date(Date.now() - 299_500).toISOString(), durationMs: 500 },
    result: { count: 12 },
    timestamp: new Date(Date.now() - 300_000).toISOString(),
  },
  {
    operationId: 'hub-demo-002',
    type: 'download_model',
    governance: { riskLevel: 'medium', costEstimateUsd: 0.005, pceResult: { allowed: true, contract: { contractId: 'pce-demo-2' } }, proofPacketId: 'pp-e5f6g7h8' },
    hubRecord: { id: 'hub-demo-002', type: 'download_model', riskLevel: 'medium', agentId: 'counsel-ner-agent', resourceUri: 'hf://models/dslim/bert-base-NER', purpose: 'Legal NER model evaluation', costEstimateUsd: 0.005, status: 'completed', createdAt: new Date(Date.now() - 120_000).toISOString(), completedAt: new Date(Date.now() - 118_000).toISOString(), durationMs: 2000 },
    result: { modelId: 'dslim/bert-base-NER', totalFiles: 8 },
    timestamp: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    operationId: 'hub-demo-003',
    type: 'upload_model',
    governance: { riskLevel: 'high', costEstimateUsd: 0.01, pceResult: { allowed: false, blockedReason: 'Approval required (tier: executive)' } },
    hubRecord: { id: 'hub-demo-003', type: 'upload_model', riskLevel: 'high', agentId: 'model-tuner-agent', resourceUri: 'hf://repos/szl/legal-ner-v2', purpose: 'Upload fine-tuned NER model', costEstimateUsd: 0.01, status: 'blocked', createdAt: new Date(Date.now() - 60_000).toISOString() },
    error: 'Approval required (tier: executive)',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
  },
];

const DEMO_COSTS: CostDashboard = {
  totalCostUsd: 0.0151,
  byOperation: { search_models: 0.0001, download_model: 0.005, upload_model: 0.01 },
  byAgent: { 'counsel-ner-agent': 0.005, 'model-tuner-agent': 0.01 },
  operationCount: 3,
  governedOperations: 3,
  blockedOperations: 1,
  complianceRate: 66.67,
};

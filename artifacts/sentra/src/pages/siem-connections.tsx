import { cn } from '@szl-holdings/shared-ui/utils';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/lib/data-provenance';
import {
  type SiemAdapterMeta,
  type SiemConnection,
  createSiemConnection,
  deleteSiemConnection,
  listSiemAdapters,
  listSiemConnections,
  testSiemConnection,
  toggleSiemConnection,
  updateSiemConnection,
} from '@/lib/sentra-api';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function ConfigFields({
  fields,
  config,
  onChange,
}: {
  fields: SiemAdapterMeta['configFields'];
  config: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Configuration</div>
      {fields.map((field) => (
        <div key={field.key}>
          <label className="text-[10px] text-slate-500 font-mono block mb-1">
            {field.key}
            {!field.optional && <span className="text-[#f5f5f5] ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-[9px] text-slate-600 mb-1">{field.description}</p>
          )}
          <input
            type={
              field.key.toLowerCase().includes('secret') ||
              field.key.toLowerCase().includes('token') ||
              field.key.toLowerCase().includes('password')
                ? 'password'
                : 'text'
            }
            value={config[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40"
          />
        </div>
      ))}
    </div>
  );
}

interface AddConnectionModalProps {
  adapters: SiemAdapterMeta[];
  onClose: () => void;
  onCreate: (conn: SiemConnection) => void;
}

function AddConnectionModal({ adapters, onClose, onCreate }: AddConnectionModalProps) {
  const [selectedAdapter, setSelectedAdapter] = useState<SiemAdapterMeta | null>(null);
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdapterSelect = (adapter: SiemAdapterMeta) => {
    setSelectedAdapter(adapter);
    const defaults: Record<string, string> = {};
    adapter.configFields.forEach((f) => { defaults[f.key] = ''; });
    setConfig(defaults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdapter || !name.trim()) {
      setError('Name and adapter type are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createSiemConnection({
      name: name.trim(),
      adapterId: selectedAdapter.id,
      config: Object.fromEntries(Object.entries(config).filter(([, v]) => v !== '')),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreate(result.connection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-xl border bg-slate-900 shadow-2xl"
        style={{ borderColor: 'rgba(197,183,135,0.2)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 font-display">Add SIEM Connection</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Connection Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Prod SOC Splunk"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2">Adapter Type *</label>
            <div className="space-y-2">
              {adapters.map((adapter) => (
                <button
                  key={adapter.id}
                  type="button"
                  onClick={() => handleAdapterSelect(adapter)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    selectedAdapter?.id === adapter.id
                      ? 'border-[#c9b787]/50 bg-[#c9b787]/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{adapter.displayName}</span>
                    {selectedAdapter?.id === adapter.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#c9b787]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{adapter.description}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedAdapter && (
            <ConfigFields
              fields={selectedAdapter.configFields}
              config={config}
              onChange={(k, v) => setConfig({ ...config, [k]: v })}
            />
          )}

          {error && (
            <div className="text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 border border-slate-700">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-[#d4c49a]"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditConnectionModalProps {
  connection: SiemConnection;
  adapter: SiemAdapterMeta | undefined;
  onClose: () => void;
  onSave: (conn: SiemConnection) => void;
}

function EditConnectionModal({ connection, adapter, onClose, onSave }: EditConnectionModalProps) {
  const [name, setName] = useState(connection.name);
  const [config, setConfig] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(connection.config ?? {}).map(([k, v]) => [k, String(v)])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Connection name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateSiemConnection(connection.id, {
      name: name.trim(),
      config: Object.fromEntries(Object.entries(config).filter(([, v]) => v !== '')),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSave(result.connection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-xl border bg-slate-900 shadow-2xl"
        style={{ borderColor: 'rgba(197,183,135,0.2)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 font-display">Edit Connection</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Connection Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40"
            />
          </div>

          {adapter && (
            <ConfigFields
              fields={adapter.configFields}
              config={config}
              onChange={(k, v) => setConfig({ ...config, [k]: v })}
            />
          )}

          {!adapter && (
            <div className="text-[10px] text-slate-500 font-mono">
              Adapter: <span className="text-slate-300">{connection.adapterId}</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 border border-slate-700">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-[#d4c49a]"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SampleAlert {
  id?: string;
  title?: string;
  severity?: string;
  source?: string;
  description?: string;
  [key: string]: unknown;
}

interface ConnectionCardProps {
  connection: SiemConnection;
  adapter: SiemAdapterMeta | undefined;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onTest: () => void;
  onEdit: () => void;
  testing: boolean;
  sampleAlerts: SampleAlert[] | null;
}

function ConnectionCard({
  connection,
  adapter,
  onToggle,
  onDelete,
  onTest,
  onEdit,
  testing,
  sampleAlerts,
}: ConnectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityColor = (s?: string) => {
    if (s === 'critical') return 'text-[#ef4444]';
    if (s === 'high') return 'text-[#f97316]';
    if (s === 'medium') return 'text-[#eab308]';
    return 'text-slate-400';
  };

  return (
    <div
      className={cn(
        'sentra-panel border transition-colors',
        connection.enabled ? 'border-[#c9b787]/20' : 'border-slate-800',
      )}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              connection.enabled ? 'bg-[#c9b787] animate-pulse' : 'bg-slate-600',
            )}
          />
          <div>
            <div className="text-sm font-bold text-slate-200">{connection.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500 font-mono">{connection.adapterId}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-600">{connection.alertsIngested} alerts ingested</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono border uppercase',
              connection.enabled
                ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10'
                : 'text-slate-500 border-slate-700 bg-slate-800',
            )}
          >
            {connection.enabled ? 'Active' : 'Disabled'}
          </span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          {connection.lastTestResult && (
            <div
              className={cn(
                'text-xs p-3 rounded border',
                connection.lastTestResult.ok
                  ? 'bg-[#c9b787]/5 border-[#c9b787]/20 text-[#c9b787]'
                  : 'bg-[#f5f5f5]/5 border-[#f5f5f5]/20 text-[#f5f5f5]',
              )}
            >
              Last test: {connection.lastTestResult.message}
              {connection.lastTestedAt && (
                <span className="text-slate-500 ml-2">({relativeTime(connection.lastTestedAt)})</span>
              )}
            </div>
          )}

          {sampleAlerts && sampleAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sample Normalized Alerts</div>
              {sampleAlerts.map((alert, i) => (
                <div key={alert.id ?? i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">{alert.title ?? 'Unknown Alert'}</span>
                    <span className={cn('text-[10px] font-mono uppercase shrink-0', severityColor(alert.severity))}>
                      {alert.severity ?? 'unknown'}
                    </span>
                  </div>
                  {alert.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2">{String(alert.description)}</p>
                  )}
                  {alert.source && (
                    <span className="text-[9px] text-slate-600 font-mono">{String(alert.source)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {connection.adapterId === 'generic-webhook' && (
            <div className="space-y-2">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Webhook Ingest URL</div>
                <code className="text-[11px] text-[#c9b787] font-mono break-all">
                  {window.location.origin}/api/sentra/siem/ingest/{connection.id}
                </code>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">HMAC-SHA256 Signature</div>
                <p className="text-[10px] text-slate-500 mb-2">
                  Sign the raw request body with your <code className="text-[#c9b787]">hmacSecret</code> and include as{' '}
                  <code className="text-[#c9b787]">X-Signature-SHA256: sha256=&lt;hex&gt;</code>
                </p>
                <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">{`# Node.js
const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

# Python
sig = 'sha256=' + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()`}</pre>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTest}
              disabled={testing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Test Connection
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => onToggle(!connection.enabled)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                connection.enabled
                  ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  : 'bg-[#c9b787] text-slate-900 hover:bg-[#d4c49a]',
              )}
            >
              <Power className="w-3 h-3" />
              {connection.enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-xs text-[#f5f5f5] hover:bg-[#f5f5f5]/20 ml-auto"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiemConnections() {
  const [connections, setConnections] = useState<SiemConnection[]>([]);
  const [adapters, setAdapters] = useState<SiemAdapterMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingConn, setEditingConn] = useState<SiemConnection | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [sampleAlertsByConn, setSampleAlertsByConn] = useState<Record<string, SampleAlert[]>>({});

  const load = async () => {
    const [conns, adps] = await Promise.all([listSiemConnections(), listSiemAdapters()]);
    setConnections(conns);
    setAdapters(adps);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    const result = await testSiemConnection(id);
    setTestingId(null);
    await load();
    if (result.ok && result.sample.length > 0) {
      setSampleAlertsByConn((prev) => ({ ...prev, [id]: result.sample as SampleAlert[] }));
    } else if (!result.ok) {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const result = await toggleSiemConnection(id, enabled);
    if (result.ok) {
      setConnections((prev) => prev.map((c) => (c.id === id ? result.connection : c)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SIEM connection?')) return;
    const result = await deleteSiemConnection(id);
    if (result.ok) {
      setConnections((prev) => prev.filter((c) => c.id !== id));
      setSampleAlertsByConn((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  const handleSaveEdit = (conn: SiemConnection) => {
    setConnections((prev) => prev.map((c) => (c.id === conn.id ? conn : c)));
    setEditingConn(null);
  };

  const activeCount = connections.filter((c) => c.enabled).length;
  const totalIngested = connections.reduce((acc, c) => acc + c.alertsIngested, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SIEM Connections"
        subtitle="Pluggable live alert ingestion from external SIEM platforms"
        provenance={loading ? 'loading' : connections.length > 0 ? 'live' : 'seed'}
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9b787] text-slate-900 text-xs font-bold hover:bg-[#d4c49a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Connection
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Connections', value: connections.length },
          { label: 'Active', value: activeCount, accent: activeCount > 0 ? '#c9b787' : undefined },
          { label: 'Alerts Ingested', value: totalIngested, accent: totalIngested > 0 ? '#c9b787' : undefined },
        ].map(({ label, value, accent }) => (
          <div key={label} className="sentra-panel p-5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">{label}</div>
            <div className="text-2xl font-display font-bold mt-1" style={{ color: accent ?? '#94a3b8' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="sentra-panel p-5">
        <div className="text-[10px] text-slate-500 font-mono uppercase mb-3">Available Adapters</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {adapters.map((adapter) => (
            <div key={adapter.id} className="p-3 rounded-lg border border-slate-700 bg-slate-800/30">
              <div className="text-xs font-bold text-slate-200">{adapter.displayName}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{adapter.description}</p>
            </div>
          ))}
        </div>
      </div>

      {connections.length === 0 && !loading ? (
        <div className="sentra-panel p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Zap className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">No SIEM connections configured</p>
            <p className="text-xs text-slate-600 mt-1">Add a connection to start ingesting live alerts from your SIEM.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              adapter={adapters.find((a) => a.id === conn.adapterId)}
              onToggle={(enabled) => void handleToggle(conn.id, enabled)}
              onDelete={() => void handleDelete(conn.id)}
              onTest={() => void handleTest(conn.id)}
              onEdit={() => setEditingConn(conn)}
              testing={testingId === conn.id}
              sampleAlerts={sampleAlertsByConn[conn.id] ?? null}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddConnectionModal
          adapters={adapters}
          onClose={() => setShowAdd(false)}
          onCreate={(conn) => {
            setConnections((prev) => [...prev, conn]);
            setShowAdd(false);
          }}
        />
      )}

      {editingConn && (
        <EditConnectionModal
          connection={editingConn}
          adapter={adapters.find((a) => a.id === editingConn.adapterId)}
          onClose={() => setEditingConn(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

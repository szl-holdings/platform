import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowUpRight, Check, Loader2, Plus, Power, Trash2, Upload, X } from 'lucide-react';

const BASE = (import.meta.env.BASE_URL ?? '/sentra/').replace(/\/$/, '');
const API = `${BASE}/api/sentra/siem-export`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

type ExportAdapter = {
  id: string;
  displayName: string;
  description: string;
  configFields: { key: string; description: string }[];
};

type ExportConnection = {
  connectionId: string;
  name: string;
  adapterId: string;
  enabled: string;
  totalExported: number;
  totalFailed: number;
  lastExportAt: string | null;
  createdAt: string;
  config: Record<string, unknown>;
};

type ExportEvent = {
  eventId: string;
  connectionId: string;
  findingId: string;
  format: string;
  status: string;
  exportedAt: string | null;
  createdAt: string;
};

const formatMap: Record<string, { label: string; color: string }> = {
  'splunk-cef': { label: 'Splunk CEF', color: '#22c55e' },
  'sentinel-asim': { label: 'Sentinel ASIM', color: '#3b82f6' },
  'chronicle-udm': { label: 'Chronicle UDM', color: '#a855f7' },
};

export default function SiemExportPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'connections' | 'events'>('connections');

  const adaptersQ = useQuery({
    queryKey: ['siem-export-adapters'],
    queryFn: () => fetchJson<{ adapters: ExportAdapter[] }>(`${API}/adapters`),
  });

  const connectionsQ = useQuery({
    queryKey: ['siem-export-connections'],
    queryFn: () => fetchJson<{ connections: ExportConnection[] }>(`${API}/connections`),
    refetchInterval: 8000,
  });

  const eventsQ = useQuery({
    queryKey: ['siem-export-events'],
    queryFn: () => fetchJson<{ events: ExportEvent[] }>(`${API}/events?limit=50`),
    refetchInterval: 10000,
  });

  const toggleMut = useMutation({
    mutationFn: (connectionId: string) =>
      fetchJson(`${API}/connections/${connectionId}/toggle`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['siem-export-connections'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (connectionId: string) =>
      fetchJson(`${API}/connections/${connectionId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['siem-export-connections'] }),
  });

  const connections = connectionsQ.data?.connections ?? [];
  const events = eventsQ.data?.events ?? [];

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: active ? '#c8a84b' : '#64748b',
    background: active ? '#c8a84b15' : 'transparent',
    border: `1px solid ${active ? '#c8a84b40' : 'transparent'}`,
    borderRadius: 6,
    cursor: 'pointer',
  });

  return (
    <div style={{ padding: '24px 32px', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
            SIEM EXPORT
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            Export Sentra findings to Splunk (CEF), Sentinel (ASIM), or Chronicle (UDM)
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            background: '#10b98120',
            color: '#10b981',
            border: '1px solid #10b98140',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> NEW CONNECTION
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.06em', marginBottom: 4 }}>CONNECTIONS</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{connections.length}</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.06em', marginBottom: 4 }}>TOTAL EXPORTED</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
            {connections.reduce((s, c) => s + c.totalExported, 0)}
          </div>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.06em', marginBottom: 4 }}>TOTAL FAILED</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
            {connections.reduce((s, c) => s + c.totalFailed, 0)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(tab === 'connections')} onClick={() => setTab('connections')}>
          CONNECTIONS
        </button>
        <button style={tabStyle(tab === 'events')} onClick={() => setTab('events')}>
          EXPORT HISTORY
        </button>
      </div>

      {tab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {connections.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <Upload size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No export connections configured</p>
              <p style={{ fontSize: 12 }}>Add a connection to start exporting findings to your SIEM.</p>
            </div>
          )}
          {connections.map((conn) => {
            const fm = formatMap[conn.adapterId] ?? { label: conn.adapterId, color: '#94a3b8' };
            return (
              <div
                key={conn.connectionId}
                style={{
                  background: '#111827',
                  border: `1px solid ${conn.enabled === 'true' ? '#1e293b' : '#7f1d1d40'}`,
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{conn.name}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        padding: '2px 8px',
                        background: `${fm.color}18`,
                        color: fm.color,
                        border: `1px solid ${fm.color}35`,
                        borderRadius: 4,
                      }}
                    >
                      {fm.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        background: conn.enabled === 'true' ? '#10b98118' : '#ef444418',
                        color: conn.enabled === 'true' ? '#10b981' : '#ef4444',
                        border: `1px solid ${conn.enabled === 'true' ? '#10b98135' : '#ef444435'}`,
                        borderRadius: 4,
                      }}
                    >
                      {conn.enabled === 'true' ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
                    <span>Exported: {conn.totalExported}</span>
                    <span>Failed: {conn.totalFailed}</span>
                    <span>Last: {conn.lastExportAt ? new Date(conn.lastExportAt).toLocaleString() : '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleMut.mutate(conn.connectionId)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#6366f120',
                      color: '#6366f1',
                      border: '1px solid #6366f140',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Power size={12} />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(conn.connectionId)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#ef444420',
                      color: '#ef4444',
                      border: '1px solid #ef444440',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <p style={{ fontSize: 14 }}>No export events yet</p>
            </div>
          )}
          {events.map((evt) => (
            <div
              key={evt.eventId}
              style={{
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: 6,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    background: evt.status === 'exported' ? '#10b98118' : '#ef444418',
                    color: evt.status === 'exported' ? '#10b981' : '#ef4444',
                    borderRadius: 3,
                  }}
                >
                  {evt.status.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: '#e2e8f0' }}>{evt.findingId.slice(0, 16)}…</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>{evt.format.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: 11, color: '#475569' }}>
                {new Date(evt.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateExportConnectionModal
          adapters={adaptersQ.data?.adapters ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['siem-export-connections'] });
          }}
        />
      )}
    </div>
  );
}

function CreateExportConnectionModal({
  adapters,
  onClose,
  onCreated,
}: {
  adapters: ExportAdapter[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [adapterId, setAdapterId] = useState(adapters[0]?.id ?? 'splunk-cef');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedAdapter = adapters.find((a) => a.id === adapterId);

  async function handleSave() {
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      await fetchJson(`${API}/connections`, {
        method: 'POST',
        body: JSON.stringify({ name, adapterId, config: configValues }),
      });
      onCreated();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#00000080', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: 500, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>NEW EXPORT CONNECTION</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>CONNECTION NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Splunk Production" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>SIEM ADAPTER</label>
            <select value={adapterId} onChange={(e) => { setAdapterId(e.target.value); setConfigValues({}); }} style={inputStyle}>
              {adapters.map((a) => (
                <option key={a.id} value={a.id}>{a.displayName}</option>
              ))}
            </select>
            {selectedAdapter && (
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{selectedAdapter.description}</p>
            )}
          </div>
          {selectedAdapter?.configFields.map((field) => (
            <div key={field.key}>
              <label style={labelStyle}>{field.key.toUpperCase().replace(/_/g, ' ')}</label>
              <input
                value={configValues[field.key] ?? ''}
                onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                placeholder={field.description}
                type={field.key.toLowerCase().includes('secret') || field.key.toLowerCase().includes('token') || field.key.toLowerCase().includes('key') ? 'password' : 'text'}
                style={inputStyle}
              />
              <p style={{ fontSize: 10, color: '#475569', margin: '2px 0 0' }}>{field.description}</p>
            </div>
          ))}
          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: '#47556920', color: '#475569', border: '1px solid #47556940', borderRadius: 4, cursor: 'pointer' }}>
            CANCEL
          </button>
          <button onClick={handleSave} disabled={!name || saving} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: '#10b98120', color: '#10b981', border: '1px solid #10b98140', borderRadius: 4, cursor: 'pointer', opacity: !name || saving ? 0.5 : 1 }}>
            {saving ? 'CREATING...' : 'CREATE CONNECTION'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

const API = '/api';

const GOLD = '#c9b787';
const ARTIFACT_TYPE_COLORS: Record<string, string> = {
  model: '#60a5fa',
  prompt: '#a78bfa',
  agent: '#34d399',
  dataset: '#fb923c',
  embedding: '#f472b6',
  report: '#facc15',
  bundle: '#94a3b8',
};

interface CatalogEntry {
  id: number;
  contentHash: string;
  covenantHash: string;
  artifactType: string;
  label: string;
  description: string | null;
  policyId: string;
  actor: string;
  tenant: string;
  doctrineRevision: string;
  sizeBytes: number;
  mimeType: string;
  proofReceiptId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function short(hash: string) {
  return hash.slice(0, 12) + '…';
}

function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function VaultBrowser() {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [lineage, setLineage] = useState<{ parents: string[]; children: string[] } | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/reliquary/catalog`);
      const j = await r.json();
      setEntries(j.data ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setSeeding(true);
    try {
      await fetch(`${API}/reliquary/seed`, { method: 'POST' });
      await load();
    } finally {
      setSeeding(false);
    }
  };

  const loadLineage = async (contentHash: string) => {
    setLineageLoading(true);
    try {
      const r = await fetch(`${API}/reliquary/lineage/${contentHash}`);
      const j = await r.json();
      setLineage(j.data);
    } finally {
      setLineageLoading(false);
    }
  };

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.label.toLowerCase().includes(search.toLowerCase()) || e.contentHash.includes(search);
    const matchType = typeFilter === 'all' || e.artifactType === typeFilter;
    return matchSearch && matchType;
  });

  const types = Array.from(new Set(entries.map(e => e.artifactType)));

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Reliquary
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Vault Browser</h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Content-addressed artifact store — {entries.length} blobs indexed
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={load}
                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
              >
                Refresh
              </button>
              <button
                onClick={seed}
                disabled={seeding}
                style={{ padding: '6px 14px', background: seeding ? 'rgba(201,183,135,0.1)' : 'rgba(201,183,135,0.15)', border: `1px solid ${GOLD}44`, borderRadius: 6, color: GOLD, fontSize: 12, cursor: seeding ? 'not-allowed' : 'pointer' }}
              >
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Blobs', value: entries.length },
            { label: 'Models', value: entries.filter(e => e.artifactType === 'model').length },
            { label: 'Agents', value: entries.filter(e => e.artifactType === 'agent').length },
            { label: 'Reports', value: entries.filter(e => e.artifactType === 'report').length },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by label or hash…"
            style={{ flex: 1, background: '#111', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: '#94a3b8', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
          <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Loading vault…</div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
                {error}
                <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>Start the API server and seed demo data to populate the Vault.</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                No artifacts found. Use "Seed Demo Data" to populate the Reliquary.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['Type', 'Label', 'Content Hash', 'Covenant Hash', 'Actor', 'Size', 'Age'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => (
                    <tr
                      key={entry.id}
                      onClick={() => { setSelected(selected?.id === entry.id ? null : entry); setLineage(null); }}
                      style={{
                        borderBottom: '1px solid #0f172a',
                        cursor: 'pointer',
                        background: selected?.id === entry.id ? 'rgba(201,183,135,0.05)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: `${ARTIFACT_TYPE_COLORS[entry.artifactType] ?? '#94a3b8'}22`,
                          color: ARTIFACT_TYPE_COLORS[entry.artifactType] ?? '#94a3b8',
                        }}>{entry.artifactType}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#f1f5f9', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{short(entry.contentHash)}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>{short(entry.covenantHash)}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{entry.actor}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{formatBytes(entry.sizeBytes)}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 11 }}>{timeSince(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 20, overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: `${ARTIFACT_TYPE_COLORS[selected.artifactType] ?? '#94a3b8'}22`,
                    color: ARTIFACT_TYPE_COLORS[selected.artifactType] ?? '#94a3b8',
                    marginBottom: 8, display: 'inline-block',
                  }}>{selected.artifactType}</span>
                  <h3 style={{ margin: '6px 0 4px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{selected.label}</h3>
                  {selected.description && <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{selected.description}</p>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>

              {[
                { label: 'Content Hash', value: selected.contentHash, mono: true },
                { label: 'Covenant Hash', value: selected.covenantHash, mono: true },
                { label: 'Policy', value: selected.policyId },
                { label: 'Actor', value: selected.actor },
                { label: 'Tenant', value: selected.tenant },
                { label: 'Doctrine Rev', value: selected.doctrineRevision },
                { label: 'MIME Type', value: selected.mimeType },
                { label: 'Size', value: formatBytes(selected.sizeBytes) },
                { label: 'Proof Receipt', value: selected.proofReceiptId ?? '—', mono: true },
                { label: 'Created', value: new Date(selected.createdAt).toLocaleString() },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #0f172a' }}>
                  <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: row.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{row.value}</div>
                </div>
              ))}

              {Object.keys(selected.metadata ?? {}).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Metadata</div>
                  <pre style={{ fontSize: 11, color: '#64748b', background: '#0a0a0a', padding: 10, borderRadius: 6, overflow: 'auto', margin: 0 }}>
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <button
                onClick={() => { if (!lineageLoading) loadLineage(selected.contentHash); }}
                style={{ width: '100%', padding: '8px 0', background: 'rgba(201,183,135,0.08)', border: `1px solid ${GOLD}33`, borderRadius: 6, color: GOLD, fontSize: 12, cursor: 'pointer' }}
              >
                {lineageLoading ? 'Loading lineage…' : 'Load Lineage'}
              </button>

              {lineage && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Lineage</div>
                  {lineage.parents.length === 0 && lineage.children.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#475569' }}>No edges recorded</div>
                  ) : (
                    <>
                      {lineage.parents.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Parents ({lineage.parents.length})</div>
                          {lineage.parents.map(h => <div key={h} style={{ fontSize: 11, fontFamily: 'monospace', color: '#60a5fa', marginBottom: 2 }}>← {short(h)}</div>)}
                        </div>
                      )}
                      {lineage.children.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Children ({lineage.children.length})</div>
                          {lineage.children.map(h => <div key={h} style={{ fontSize: 11, fontFamily: 'monospace', color: '#34d399', marginBottom: 2 }}>→ {short(h)}</div>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

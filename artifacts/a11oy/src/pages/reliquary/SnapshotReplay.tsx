// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useEffect, useCallback } from 'react';

const API = '/api';
const GOLD = '#c9b787';

interface SnapshotRow {
  id: number;
  snapshotHash: string;
  label: string;
  manifest: { label: string; entries: SnapshotEntry[]; capturedAt: string };
  proofReceiptId: string | null;
  createdAt: string;
}

interface SnapshotEntry {
  artifactId: string;
  contentHash: string;
  covenantHash: string;
  label: string;
  artifactType: string;
}

interface ReplayResult {
  snapshot: {
    snapshotHash: string;
    label: string;
    entries: SnapshotEntry[];
    createdAt: string;
  };
  artifacts: Array<{
    entry: SnapshotEntry;
    available: boolean;
    covenantHash: string;
  }>;
}

function short(hash: string) { return hash.slice(0, 12) + '…'; }
function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  model: '#60a5fa', prompt: '#a78bfa', agent: '#34d399',
  dataset: '#fb923c', embedding: '#f472b6', report: '#facc15', bundle: '#94a3b8',
};

export function SnapshotReplay() {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHash, setSelectedHash] = useState<string>('');
  const [replay, setReplay] = useState<ReplayResult | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/reliquary/snapshots`);
      const j = await r.json();
      setSnapshots(j.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  const createSnapshot = async () => {
    setCreating(true);
    try {
      const label = newLabel.trim() || `Snapshot ${new Date().toLocaleString()}`;
      await fetch(`${API}/reliquary/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      setNewLabel('');
      await loadSnapshots();
    } finally {
      setCreating(false);
    }
  };

  const loadReplay = useCallback(async (hash: string) => {
    setReplayLoading(true);
    setReplay(null);
    try {
      const r = await fetch(`${API}/reliquary/replay/${hash}`);
      const j = await r.json();
      setReplay(j.data);
    } finally {
      setReplayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedHash) loadReplay(selectedHash);
  }, [selectedHash, loadReplay]);

  const selectedSnapshot = snapshots.find(s => s.snapshotHash === selectedHash);
  const availableCount = replay?.artifacts.filter(a => a.available).length ?? 0;
  const totalCount = replay?.artifacts.length ?? 0;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Reliquary
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Snapshot Replay</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Time-travel into any Pillpintu snapshot — rehydrate the full governance context
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="New snapshot label (optional)…"
            style={{ flex: 1, background: '#111', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && createSnapshot()}
          />
          <button
            onClick={createSnapshot}
            disabled={creating}
            style={{ padding: '8px 16px', background: `rgba(201,183,135,0.12)`, border: `1px solid ${GOLD}44`, borderRadius: 6, color: GOLD, fontSize: 13, cursor: creating ? 'not-allowed' : 'pointer' }}
          >
            {creating ? 'Capturing…' : '+ New Snapshot'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', fontSize: 11, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
              Snapshots ({snapshots.length})
            </div>
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading…</div>
            ) : snapshots.length === 0 ? (
              <div style={{ padding: 20, color: '#475569', fontSize: 13 }}>
                No snapshots yet. Create one above or seed demo data in the Vault Browser.
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {snapshots.map(snap => (
                  <div
                    key={snap.snapshotHash}
                    onClick={() => setSelectedHash(snap.snapshotHash)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #0f172a',
                      cursor: 'pointer',
                      background: selectedHash === snap.snapshotHash ? 'rgba(201,183,135,0.06)' : 'transparent',
                      borderLeft: selectedHash === snap.snapshotHash ? `2px solid ${GOLD}` : '2px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{snap.label}</div>
                    <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginBottom: 4 }}>{short(snap.snapshotHash)}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {snap.manifest?.entries?.length ?? 0} artifacts
                      </span>
                      <span style={{ fontSize: 11, color: '#334155' }}>{timeSince(snap.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {!selectedHash && (
              <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 60, textAlign: 'center', color: '#475569' }}>
                Select a snapshot to replay its governance context
              </div>
            )}

            {selectedHash && replayLoading && (
              <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 60, textAlign: 'center', color: '#475569' }}>
                Rehydrating snapshot…
              </div>
            )}

            {replay && !replayLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total Artifacts', value: totalCount, color: GOLD },
                    { label: 'Available on Disk', value: availableCount, color: '#34d399' },
                    { label: 'Unavailable', value: totalCount - availableCount, color: totalCount - availableCount > 0 ? '#ef4444' : '#334155' },
                  ].map(k => (
                    <div key={k.label} style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Snapshot Identity</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8', wordBreak: 'break-all' }}>{replay.snapshot.snapshotHash}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Proof Receipt</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{selectedSnapshot?.proofReceiptId ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Captured At</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(replay.snapshot.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', fontSize: 11, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Bound Artifacts
                  </div>
                  {replay.artifacts.length === 0 ? (
                    <div style={{ padding: 20, color: '#475569', fontSize: 13 }}>No artifacts bound in this snapshot.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                          {['Type', 'Label', 'Content Hash', 'Covenant Hash', 'On Disk'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 500, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {replay.artifacts.map(({ entry, available, covenantHash }) => (
                          <tr key={entry.contentHash} style={{ borderBottom: '1px solid #0f172a' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                background: `${TYPE_COLORS[entry.artifactType] ?? '#94a3b8'}22`,
                                color: TYPE_COLORS[entry.artifactType] ?? '#94a3b8',
                              }}>{entry.artifactType}</span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#e2e8f0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>{short(entry.contentHash)}</td>
                            <td style={{ padding: '8px 12px', color: '#475569', fontFamily: 'monospace', fontSize: 10 }}>{short(covenantHash)}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                background: available ? '#34d39922' : '#ef444422',
                                color: available ? '#34d399' : '#ef4444',
                              }}>{available ? 'AVAILABLE' : 'MISSING'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {totalCount - availableCount > 0 && (
                  <div style={{ background: '#ef44441a', border: '1px solid #ef444433', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>⚠ Sovereign Mode Alert</div>
                    <div style={{ fontSize: 12, color: '#fca5a5' }}>
                      {totalCount - availableCount} artifact(s) are not available on local disk. In Sovereign mode, these would block execution.
                      Engaging Sovereign mode before verifying full local availability may interrupt operations.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

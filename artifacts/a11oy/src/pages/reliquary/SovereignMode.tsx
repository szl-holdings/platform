import { useState, useEffect, useCallback } from 'react';

const API = '/api';
const GOLD = '#c9b787';

interface SovereignStatus {
  active: boolean;
  activatedBy?: string | null;
  reason?: string | null;
  activatedAt?: string | null;
}

interface AttestationRow {
  id: number;
  merkleRoot: string;
  artifactCount: number;
  proofReceiptId: string | null;
  verifiedAt: string | null;
  verificationResult: string | null;
  createdAt: string;
}

interface VerifyResult {
  match: boolean;
  storedRoot: string;
  computedRoot: string;
}

function short(hash: string) { return hash.slice(0, 16) + '…'; }
function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SovereignMode() {
  const [status, setStatus] = useState<SovereignStatus | null>(null);
  const [attestations, setAttestations] = useState<AttestationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [reason, setReason] = useState('');
  const [verifyResults, setVerifyResults] = useState<Map<number, VerifyResult>>(new Map());
  const [verifying, setVerifying] = useState<number | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/reliquary/sovereign`);
      const j = await r.json();
      setStatus(j.data);
    } catch {}
  }, []);

  const loadAttestations = useCallback(async () => {
    try {
      const r = await fetch(`${API}/reliquary/attestations`);
      const j = await r.json();
      setAttestations(j.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStatus(), loadAttestations()]).finally(() => setLoading(false));
  }, [loadStatus, loadAttestations]);

  const toggleSovereign = async () => {
    if (!status) return;
    setToggling(true);
    try {
      await fetch(`${API}/reliquary/sovereign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !status.active,
          actor: 'operator',
          reason: reason || (status.active ? 'Operator deactivated' : 'Operator activated'),
        }),
      });
      setReason('');
      await loadStatus();
    } finally {
      setToggling(false);
    }
  };

  const runAttest = async () => {
    setAttesting(true);
    try {
      await fetch(`${API}/reliquary/attest`, { method: 'POST' });
      await loadAttestations();
    } finally {
      setAttesting(false);
    }
  };

  const verify = async (id: number) => {
    setVerifying(id);
    try {
      const r = await fetch(`${API}/reliquary/attest/${id}/verify`, { method: 'POST' });
      const j = await r.json();
      setVerifyResults(prev => new Map(prev).set(id, j.data));
      await loadAttestations();
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>
      {status?.active && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: '#7c2d12', borderBottom: '1px solid #c2410c',
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 14, color: '#fca5a5', fontWeight: 700 }}>⚡ SOVEREIGN MODE ACTIVE</span>
          <span style={{ fontSize: 12, color: '#fdba74' }}>
            Network fetches disabled — only doctrine-approved local revisions accessible
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fb923c' }}>
            Activated {status.activatedAt ? timeSince(status.activatedAt) : 'recently'} by {status.activatedBy ?? 'operator'}
          </span>
        </div>
      )}

      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Reliquary
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Sovereign Mode</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Air-gap governance control — restrict the platform to doctrine-approved local revisions only
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{
            background: '#111',
            border: `1px solid ${status?.active ? '#c2410c' : '#1e293b'}`,
            borderRadius: 8, padding: 24,
          }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Sovereign Status</div>

            {loading ? (
              <div style={{ color: '#475569', fontSize: 14 }}>Loading…</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: status?.active ? '#ef4444' : '#22c55e',
                    boxShadow: status?.active ? '0 0 8px #ef4444' : '0 0 8px #22c55e',
                  }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: status?.active ? '#fca5a5' : '#86efac' }}>
                    {status?.active ? 'SOVEREIGN ACTIVE' : 'ONLINE — CONNECTED'}
                  </span>
                </div>

                {status?.active && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#7c2d1233', borderRadius: 6, border: '1px solid #c2410c22' }}>
                    <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 4 }}>Reason: {status.reason ?? '—'}</div>
                    <div style={{ fontSize: 11, color: '#fb923c' }}>Activated by: {status.activatedBy ?? '—'}</div>
                    {status.activatedAt && <div style={{ fontSize: 11, color: '#f97316', marginTop: 2 }}>{timeSince(status.activatedAt)}</div>}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {status?.active ? 'Deactivation Reason' : 'Activation Reason'}
                  </label>
                  <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={status?.active ? 'Why deactivating sovereign mode…' : 'Why activating sovereign mode…'}
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0a', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <button
                  onClick={toggleSovereign}
                  disabled={toggling}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: status?.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${status?.active ? '#22c55e44' : '#ef444444'}`,
                    borderRadius: 6,
                    color: status?.active ? '#86efac' : '#fca5a5',
                    fontSize: 13, fontWeight: 600, cursor: toggling ? 'not-allowed' : 'pointer',
                  }}
                >
                  {toggling
                    ? (status?.active ? 'Deactivating…' : 'Activating…')
                    : (status?.active ? 'Deactivate Sovereign Mode' : 'Activate Sovereign Mode')}
                </button>

                <p style={{ fontSize: 11, color: '#334155', marginTop: 10, lineHeight: 1.6 }}>
                  {status?.active
                    ? 'Deactivating restores full network access and cloud model fetching. All artifact requests will resume normal resolution.'
                    : 'Activating sovereign mode blocks all network fetches. Only blobs present on local disk whose covenant chain is fully resolved will be served.'}
                </p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Attestations', value: attestations.length, color: GOLD },
              { label: 'Verified', value: attestations.filter(a => a.verificationResult === 'pass').length, color: '#34d399' },
              { label: 'Failed', value: attestations.filter(a => a.verificationResult === 'fail').length, color: '#ef4444' },
            ].map(k => (
              <div key={k.label} style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: '16px 20px', flex: 1 }}>
                <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
              Proof Ledger — Cache Attestations
            </div>
            <button
              onClick={runAttest}
              disabled={attesting}
              style={{ padding: '6px 14px', background: `rgba(201,183,135,0.12)`, border: `1px solid ${GOLD}44`, borderRadius: 6, color: GOLD, fontSize: 12, cursor: attesting ? 'not-allowed' : 'pointer' }}
            >
              {attesting ? 'Computing Merkle root…' : '+ New Attestation'}
            </button>
          </div>

          {attestations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>
              No attestations yet. Click "New Attestation" to compute and persist the current Merkle root.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['ID', 'Merkle Root', 'Artifacts', 'Proof Receipt', 'Verified', 'Created'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 500, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                  <th style={{ padding: '10px 14px' }} />
                </tr>
              </thead>
              <tbody>
                {attestations.map(att => {
                  const vr = verifyResults.get(att.id);
                  const result = vr?.match ?? (att.verificationResult === 'pass' ? true : att.verificationResult === 'fail' ? false : null);
                  return (
                    <tr key={att.id} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace' }}>#{att.id}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>{short(att.merkleRoot)}</td>
                      <td style={{ padding: '10px 14px', color: GOLD, fontWeight: 600 }}>{att.artifactCount}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontFamily: 'monospace', fontSize: 10 }}>{att.proofReceiptId ? short(att.proofReceiptId) : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {result === null ? (
                          <span style={{ color: '#475569', fontSize: 11 }}>Unverified</span>
                        ) : result ? (
                          <span style={{ color: '#34d399', fontWeight: 600, fontSize: 11 }}>✓ PASS</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 11 }}>✗ FAIL</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 11 }}>{timeSince(att.createdAt)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => verify(att.id)}
                          disabled={verifying === att.id}
                          style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 4, color: '#64748b', fontSize: 11, cursor: verifying === att.id ? 'not-allowed' : 'pointer' }}
                        >
                          {verifying === att.id ? 'Verifying…' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {verifyResults.size > 0 && (
          <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Latest Verification Detail</div>
            {Array.from(verifyResults.entries()).slice(-1).map(([id, vr]) => (
              <div key={id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>Stored Merkle Root</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', wordBreak: 'break-all' }}>{vr.storedRoot}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>Recomputed Merkle Root</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: vr.match ? '#34d399' : '#ef4444', wordBreak: 'break-all' }}>{vr.computedRoot}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 6, background: vr.match ? '#34d39911' : '#ef444411', border: `1px solid ${vr.match ? '#34d39933' : '#ef444433'}` }}>
                  <span style={{ fontSize: 12, color: vr.match ? '#34d399' : '#ef4444', fontWeight: 700 }}>
                    {vr.match ? '✓ Merkle root matches — cache integrity confirmed' : '✗ Merkle root mismatch — cache may have been modified'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

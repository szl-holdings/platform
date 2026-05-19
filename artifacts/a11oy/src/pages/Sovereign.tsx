/**
 * Sovereign Substrate — Public Catalog
 *
 * Lists FORGE artifacts published to HuggingFace Buckets, with their Proof
 * Packet trust tier, MirrorEval scorecard, and a client-side "Verify" button
 * that re-checks the packet signature against the published public key.
 */

import { useEffect, useMemo, useState } from 'react';
import { verifyPacket, type TrustedKey } from '@workspace/sovereign-substrate';

const API_BASE = '/api/sovereign';

interface SovereignArtifact {
  id: string;
  name: string;
  kind: 'model' | 'dataset' | 'eval-snapshot' | 'agent-skill';
  task: string | null;
  bucket: string;
  bucketUri: string;
  packetUri: string;
  contentHash: string;
  packetHash: string;
  trustTier: 'verified' | 'community' | 'experimental';
  visibility: string;
  biasScore: number | null;
  mirrorEvalScore: number | null;
  evalSummary: Record<string, number>;
  signerId: string;
  revocationUrl: string | null;
  verificationState: 'verified' | 'unverified' | 'failed' | 'revoked';
  lastVerifiedAt: string | null;
  publishedAt: string;
  license: string | null;
  isRevoked: boolean;
}

interface VerifyState {
  status: 'idle' | 'running' | 'ok' | 'fail';
  message?: string;
}

const TIER_BADGE: Record<SovereignArtifact['trustTier'], { label: string; color: string }> = {
  verified: { label: 'Verified', color: '#10b981' },
  community: { label: 'Community', color: '#3b82f6' },
  experimental: { label: 'Experimental', color: '#a78bfa' },
};

export function Sovereign(): JSX.Element {
  const [artifacts, setArtifacts] = useState<SovereignArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<Record<string, VerifyState>>({});
  const [trustedKeys, setTrustedKeys] = useState<TrustedKey[] | null>(null);
  const [filters, setFilters] = useState<{
    kind: string;
    trustTier: string;
    minMirrorEval: string;
  }>({ kind: '', trustTier: '', minMirrorEval: '' });

  useEffect(() => {
    fetch(`${API_BASE}/public-key`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`public-key endpoint returned ${r.status}`);
        return r.json();
      })
      .then((k: { keyId: string; publicKeyHex: string }) => {
        setTrustedKeys([{ publicKeyId: k.keyId, publicKeyHex: k.publicKeyHex }]);
      })
      .catch(() => setTrustedKeys([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.kind) params.set('kind', filters.kind);
    if (filters.trustTier) params.set('trustTier', filters.trustTier);
    if (filters.minMirrorEval) params.set('minMirrorEval', filters.minMirrorEval);
    setLoading(true);
    fetch(`${API_BASE}/artifacts?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`request failed (${r.status})`);
        return r.json();
      })
      .then((data: { artifacts: SovereignArtifact[] }) => {
        setArtifacts(data.artifacts);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const verify = async (a: SovereignArtifact) => {
    setVerifyState((s) => ({ ...s, [a.id]: { status: 'running' } }));
    try {
      if (!trustedKeys || !trustedKeys.length) {
        throw new Error(
          'no trusted platform key available — cannot verify (publisher signing is disabled)',
        );
      }
      const detail = await fetch(`${API_BASE}/artifacts/${a.id}`).then((r) => r.json());
      const packet = detail.packet;
      if (!packet) throw new Error('packet not reachable from HF');
      const artifactRes = await fetch(`${API_BASE}/artifacts/${a.id}/bytes`);
      if (!artifactRes.ok) {
        throw new Error(`could not download artifact bytes (${artifactRes.status})`);
      }
      const bytes = new Uint8Array(await artifactRes.arrayBuffer());
      const result = verifyPacket(packet, bytes, { trustedKeys });
      setVerifyState((s) => ({
        ...s,
        [a.id]: {
          status: result.ok ? 'ok' : 'fail',
          message: result.ok
            ? `signature OK (key ${trustedKeys[0].publicKeyId})`
            : (result.reason ?? 'failed'),
        },
      }));
    } catch (e) {
      setVerifyState((s) => ({
        ...s,
        [a.id]: { status: 'fail', message: (e as Error).message },
      }));
    }
  };

  const copyUri = (uri: string) => {
    void navigator.clipboard.writeText(uri);
  };

  const filterPanel = useMemo(
    () => (
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <FilterSelect
          label="Kind"
          value={filters.kind}
          onChange={(v) => setFilters((f) => ({ ...f, kind: v }))}
          options={[
            ['', 'All'],
            ['model', 'Models'],
            ['dataset', 'Datasets'],
            ['eval-snapshot', 'Eval snapshots'],
            ['agent-skill', 'Agent skills'],
          ]}
        />
        <FilterSelect
          label="Trust tier"
          value={filters.trustTier}
          onChange={(v) => setFilters((f) => ({ ...f, trustTier: v }))}
          options={[
            ['', 'Any'],
            ['verified', 'Verified'],
            ['community', 'Community'],
            ['experimental', 'Experimental'],
          ]}
        />
        <FilterSelect
          label="Min MirrorEval"
          value={filters.minMirrorEval}
          onChange={(v) => setFilters((f) => ({ ...f, minMirrorEval: v }))}
          options={[
            ['', 'Any'],
            ['0.5', '≥ 0.5'],
            ['0.7', '≥ 0.7'],
            ['0.9', '≥ 0.9'],
          ]}
        />
      </div>
    ),
    [filters],
  );

  return (
    <div style={{ padding: '32px 40px', color: '#e5e5e5', minHeight: '100vh', background: '#0a0a0a' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8 }}>Sovereign Substrate</h1>
        <p style={{ color: '#9ca3af', maxWidth: 720, lineHeight: 1.6 }}>
          Every fine-tuned model, training dataset, eval snapshot, and agent skill produced by
          FORGE is stored on HuggingFace under <code>betterwithage</code> and sealed in a
          cryptographic Proof Packet that binds the artifact to its provenance, evals, policy
          attestations, and trust tier. Anyone can verify a packet without our platform being
          online — see <a href="/docs/sovereign" style={{ color: '#c9b787' }}>docs</a> and the
          <code> hf-sovereign</code> CLI.
        </p>
      </header>

      {filterPanel}

      {loading && <div style={{ color: '#9ca3af' }}>Loading catalog…</div>}
      {error && <div style={{ color: '#f87171' }}>Error: {error}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        {artifacts.map((a) => {
          const v = verifyState[a.id] ?? { status: 'idle' };
          const badge = TIER_BADGE[a.trustTier];
          return (
            <article
              key={a.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: 20,
              }}
              data-testid={`sovereign-artifact-${a.id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{a.name}</h2>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: `${badge.color}22`,
                        color: badge.color,
                        border: `1px solid ${badge.color}55`,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{a.kind}</span>
                    {a.task && <span style={{ fontSize: 12, color: '#6b7280' }}>· {a.task}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, fontFamily: 'monospace' }}>
                    {a.bucketUri}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={`/sovereign/${a.id}`}
                    style={{ ...btn('#1f2937'), textDecoration: 'none', display: 'inline-block' }}
                    data-testid={`detail-${a.id}`}
                  >
                    Details
                  </a>
                  <button
                    onClick={() => copyUri(a.bucketUri)}
                    style={btn('#1f2937')}
                    data-testid={`copy-uri-${a.id}`}
                  >
                    Copy HF URI
                  </button>
                  <button
                    onClick={() => verify(a)}
                    style={btn('#312e81')}
                    disabled={v.status === 'running'}
                    data-testid={`verify-${a.id}`}
                  >
                    {v.status === 'running' ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 13, flexWrap: 'wrap' }}>
                <Metric label="MirrorEval" value={fmtScore(a.mirrorEvalScore)} />
                <Metric label="Bias score" value={fmtScore(a.biasScore)} />
                <Metric label="Storage" value={`${a.bucket} · ${a.verificationState}`} />
                <Metric label="Packet hash" value={a.packetHash.slice(0, 18) + '…'} mono />
                <Metric label="Signer" value={a.signerId} mono />
                <Metric label="Published" value={new Date(a.publishedAt).toLocaleDateString()} />
                {a.license && <Metric label="License" value={a.license} />}
              </div>

              {v.status !== 'idle' && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color:
                      v.status === 'ok' ? '#10b981' : v.status === 'fail' ? '#f87171' : '#9ca3af',
                  }}
                >
                  {v.status === 'ok' && '✓ packet signature verifies'}
                  {v.status === 'fail' && `✗ ${v.message}`}
                  {v.status === 'running' && 'verifying signature…'}
                </div>
              )}
            </article>
          );
        })}
        {!loading && !artifacts.length && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 12,
              color: '#6b7280',
            }}
          >
            No artifacts published yet. Publish via the FORGE pipeline or the
            <code> POST /api/sovereign/publish</code> endpoint.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#e5e5e5', fontFamily: mono ? 'monospace' : undefined, fontSize: 13 }}>
        {value}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#9ca3af' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#111',
          color: '#e5e5e5',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '6px 8px',
          minWidth: 140,
        }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#e5e5e5',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };
}

function fmtScore(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(3);
}

export default Sovereign;

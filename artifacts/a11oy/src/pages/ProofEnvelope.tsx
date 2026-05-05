import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const GOLD = '#c9b787';

interface RationaleEnvelope {
  envelopeId: string;
  contentHash: string;
  signer: string;
  timestamp: string;
  nonce: string;
  rationale: Record<string, unknown>;
  structural: true;
}

export default function ProofEnvelope() {
  const [match, params] = useRoute<{ envelopeId: string }>(`${BASE}/proof/envelope/:envelopeId`);
  const envelopeId = match ? params.envelopeId : '';
  const [envelope, setEnvelope] = useState<RationaleEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!envelopeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/a11oy/proof/envelope/${encodeURIComponent(envelopeId)}`)
      .then(r => r.json())
      .then((j: { ok: boolean; data?: RationaleEnvelope; error?: { message: string } }) => {
        if (cancelled) return;
        if (j.ok && j.data) setEnvelope(j.data);
        else setError(j.error?.message ?? 'Envelope not found');
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [envelopeId]);

  return (
    <Layout>
      <PageHeader
        label="RATIONALE ENVELOPE"
        title="Structural Attestation Envelope"
        subtitle="Deterministic content-addressed wrapper around a rationale node. Linkable, hash-verifiable, and labelled — but not cryptographically signed."
        status="STRUCTURAL"
      />

      <div
        className="mb-6 px-4 py-3 rounded-lg flex items-start gap-3"
        style={{ background: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.25)' }}
      >
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: GOLD }}>NOTICE</div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Structural attestation only — no key material this phase. The envelope carries a deterministic SHA-256 content hash and a labelled
          SPIFFE-style signer string, but no signature is computed and no signature can be verified. Treat this surface as a wiring spec for
          the cryptographic layer, not as a proof of authenticity.
        </div>
      </div>

      <div className="mb-4">
        <Link
          href={`${BASE}/proof`}
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--color-a11oy-text-ghost)' }}
        >
          ← Back to Proof Ledger
        </Link>
      </div>

      {loading && (
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: GOLD }}>Loading envelope…</div>
      )}

      {error && !loading && (
        <Card>
          <div className="text-sm font-mono" style={{ color: '#ef4444' }}>
            Could not load envelope <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{envelopeId}</span>: {error}
          </div>
        </Card>
      )}

      {envelope && !loading && (
        <>
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Envelope ID</div>
                <div className="font-mono break-all" style={{ color: 'var(--color-a11oy-text)' }}>{envelope.envelopeId}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Signer (label only)</div>
                <div className="font-mono break-all" style={{ color: GOLD }}>{envelope.signer}</div>
              </div>
              <div className="md:col-span-2">
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Content Hash (SHA-256, deterministic)</div>
                <div className="font-mono break-all" style={{ color: '#22c55e' }}>{envelope.contentHash}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Timestamp</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{envelope.timestamp}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Nonce</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{envelope.nonce}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Structural Flag</div>
                <div className="font-mono" style={{ color: GOLD }}>structural: true (no signature field)</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Algorithm</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>sha256 (content) · ed25519 (label only)</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>Rationale Payload</div>
            <pre
              className="text-xs leading-relaxed overflow-x-auto p-3 rounded"
              style={{ background: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
{JSON.stringify(envelope.rationale, null, 2)}
            </pre>
          </Card>
        </>
      )}
    </Layout>
  );
}

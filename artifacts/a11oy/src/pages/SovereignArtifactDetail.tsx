/**
 * Sovereign Substrate — Artifact Detail
 *
 * Shows the full Proof Packet body, signature block, storage location, and
 * a one-click "Re-verify" action that downloads the artifact bytes from the
 * HF bucket and runs verifyPacket() entirely in the browser against the
 * pinned platform key.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import {
  verifyPacket,
  type ProofPacket,
  type TrustedKey,
} from '@workspace/sovereign-substrate';

const API_BASE = '/api/sovereign';

interface DetailResponse {
  artifact: {
    id: string;
    name: string;
    kind: string;
    bucket: string;
    bucketUri: string;
    packetUri: string;
    contentHash: string;
    packetHash: string;
    trustTier: 'verified' | 'community' | 'experimental';
    signerId: string;
    publishedAt: string;
    license: string | null;
    verificationState: string;
    lastVerifiedAt: string | null;
  };
  packet: ProofPacket | null;
  packetError: string | null;
}

export function SovereignArtifactDetail(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<DetailResponse | null>(null);
  const [trustedKeys, setTrustedKeys] = useState<TrustedKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/public-key`)
      .then((r) => r.json())
      .then((k: { keyId: string; publicKeyHex: string }) => {
        setTrustedKeys([{ publicKeyId: k.keyId, publicKeyHex: k.publicKeyHex }]);
      })
      .catch(() => setTrustedKeys([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/artifacts/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`request failed (${r.status})`);
        return r.json();
      })
      .then((d: DetailResponse) => setData(d))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const reverify = async () => {
    if (!data?.packet || !trustedKeys?.length) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const bytesRes = await fetch(`${API_BASE}/artifacts/${id}/bytes`);
      if (!bytesRes.ok) throw new Error(`bytes endpoint returned ${bytesRes.status}`);
      const bytes = new Uint8Array(await bytesRes.arrayBuffer());
      const result = verifyPacket(data.packet, bytes, { trustedKeys });
      // Emit a server-side audit entry for this verification action so
      // the Proof Chain reflects every verify call, including the ones
      // executed entirely in the browser. Best-effort; ignored on error.
      void fetch(`${API_BASE}/artifacts/${id}/verify`, { method: 'POST' }).catch(() => undefined);
      setVerifyMsg(
        result.ok
          ? `✓ packet verifies against pinned key ${trustedKeys[0].publicKeyId}`
          : `✗ ${result.reason ?? 'verification failed'}`,
      );
    } catch (e) {
      setVerifyMsg(`✗ ${(e as Error).message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (error) return <Wrap><div style={{ color: '#f87171' }}>{error}</div></Wrap>;
  if (!data) return <Wrap><div style={{ color: '#9ca3af' }}>Loading…</div></Wrap>;

  const a = data.artifact;
  return (
    <Wrap>
      <a href="/sovereign" style={{ color: '#c9b787', fontSize: 13 }}>← back to catalog</a>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: '12px 0 4px' }}>{a.name}</h1>
      <div style={{ color: '#9ca3af', fontSize: 13 }}>
        {a.kind} · {a.trustTier} · signer <code>{a.signerId}</code>
      </div>

      <Section title="Storage">
        <KV k="HF bucket" v={a.bucket} />
        <KV k="Bucket URI" v={a.bucketUri} mono />
        <KV k="Packet URI" v={a.packetUri} mono />
        <KV k="Content hash" v={a.contentHash} mono />
        <KV k="Packet hash" v={a.packetHash} mono />
      </Section>

      <Section title="Verification">
        <KV k="State" v={a.verificationState} />
        <KV k="Last verified" v={a.lastVerifiedAt ?? '—'} />
        <button
          onClick={reverify}
          disabled={verifying || !data.packet || !trustedKeys?.length}
          style={{
            marginTop: 12,
            background: '#312e81',
            color: '#e5e5e5',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
          data-testid="reverify-button"
        >
          {verifying ? 'Verifying…' : 'Re-verify in browser'}
        </button>
        {verifyMsg && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: verifyMsg.startsWith('✓') ? '#10b981' : '#f87171',
            }}
          >
            {verifyMsg}
          </div>
        )}
      </Section>

      <Section title="Proof Packet">
        {data.packetError && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
            packet fetch error: {data.packetError}
          </div>
        )}
        <pre
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            color: '#d1d5db',
            overflow: 'auto',
            maxHeight: 480,
          }}
          data-testid="packet-json"
        >
          {data.packet ? JSON.stringify(data.packet, null, 2) : '(packet not available)'}
        </pre>
      </Section>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ padding: '32px 40px', color: '#e5e5e5', minHeight: '100vh', background: '#0a0a0a' }}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#c9b787', marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 4 }}>
      <div style={{ color: '#6b7280', minWidth: 140 }}>{k}</div>
      <div style={{ color: '#e5e5e5', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>
        {v}
      </div>
    </div>
  );
}

export default SovereignArtifactDetail;

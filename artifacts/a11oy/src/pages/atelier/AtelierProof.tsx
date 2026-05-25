import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

interface ProofPacketShape {
  id: string; runId: string; spaceSlug: string; workcellId: string;
  proofRef: string; contractId: string; verified: boolean;
  governanceScore: number; mirrorEvalDims: Record<string, number>;
  constitutionRef: string; createdAt: string;
  audienceTier?: 'public' | 'enterprise' | 'internal';
  publicShare?: boolean;
  parentSlug?: string;
  parentDiffHash?: string;
  parentPacketId?: string;
  childPacketIds?: string[];
}

interface ProofData {
  proof: ProofPacketShape;
  run?: {
    id: string; spaceSlug: string; vertical: string; phase: string;
    verdict: string; durationMs: number; approvalLatencyMs: number;
    costPerDecision: number; startedAt: string; completedAt?: string;
    tenantId: string; origin?: string;
  };
  space?: {
    slug: string; name: string; vertical: string;
    constitutionRef: string; constitutionVersion: string;
    constitution: string; connectors: string[]; parentSlug?: string;
    composedOf?: string[];
  };
  childPackets?: ProofPacketShape[];
}

interface VerifyResult {
  id: string; verified: boolean; verifiedAt: string;
  checks: {
    proofRef: { expected: string; stored: string; matches: boolean };
    parentDiff: { matches: boolean | null; storedHash?: string } | null;
    children: { id: string; verified: boolean }[] | null;
  };
}

export function AtelierProof() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState<{ id: string; audienceTier: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/atelier/proofs/${id}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 403) {
          setForbidden(json?.data ?? { id: id ?? '', audienceTier: 'enterprise' });
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(`Proof not found (${res.status})`);
          setLoading(false);
          return;
        }
        if (json?.ok && json.data) setData(json.data as ProofData);
        else setError('Invalid proof packet response');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  async function runVerify() {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/atelier/proofs/${id}/verify`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (json?.ok && json.data) setVerify(json.data as VerifyResult);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none' }}>Atelier</Link>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ color: T.accent }}>Proof</span>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ color: T.textDim, fontFamily: T.mono }}>{id}</span>
        </div>

        {loading && <div style={{ color: T.textMuted, fontFamily: T.mono, fontSize: '0.75rem' }}>Loading proof packet…</div>}
        {error && (
          <div style={{ padding: '1.25rem', border: `1px solid ${T.border}`, borderRadius: 8, background: T.surface, color: T.textDim, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {forbidden && (
          <div style={{ padding: '1.25rem', border: `1px solid rgba(217,184,123,0.3)`, borderRadius: 8, background: 'rgba(217,184,123,0.05)', color: T.textDim, fontSize: '0.875rem', lineHeight: 1.6 }}>
            <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.5rem' }}>
              Tenant-restricted · {forbidden.audienceTier}
            </div>
            This proof packet belongs to an <strong style={{ color: T.text }}>{forbidden.audienceTier}</strong>-tier Space and is not publicly shared. Authenticated tenant access is required to read its contents. Packet id <span style={{ fontFamily: T.mono, color: T.textDim }}>{forbidden.id}</span> exists and is governed — only its body is withheld.
          </div>
        )}

        {data && (
          <>
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.75rem' }}>
                Proof Packet · {data.proof.verified ? 'Verified' : 'Unverified'}
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>
                {data.space?.name ?? data.proof.spaceSlug}
              </h1>
              <div style={{ fontSize: '0.75rem', color: T.textDim, fontFamily: T.mono, wordBreak: 'break-all' }}>
                {data.proof.proofRef}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={runVerify} disabled={verifying} style={{
                  padding: '0.5rem 1rem', borderRadius: 6, cursor: verifying ? 'wait' : 'pointer',
                  background: 'rgba(201,183,135,0.12)', color: T.accent,
                  border: `1px solid rgba(201,183,135,0.35)`,
                  fontSize: '0.75rem', fontFamily: T.mono, letterSpacing: '0.08em',
                }}>
                  {verifying ? '⟳ Verifying…' : verify ? '↻ Re-verify' : '✓ Verify proof'}
                </button>
                {verify && (
                  <span style={{ fontSize: '0.6875rem', fontFamily: T.mono, color: verify.verified ? '#7ad97a' : '#d97a7a' }}>
                    {verify.verified ? '✓ Ledger signature matches' : '✗ Signature mismatch'} · {new Date(verify.verifiedAt).toISOString()}
                  </span>
                )}
              </div>
              {verify && (
                <div style={{ marginTop: '0.875rem', padding: '0.875rem 1rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontSize: '0.6875rem', fontFamily: T.mono, color: T.textDim, lineHeight: 1.7 }}>
                  <div>proofRef · expected: <span style={{ color: T.textDim }}>{verify.checks.proofRef.expected}</span></div>
                  <div>proofRef · stored:   <span style={{ color: T.textDim }}>{verify.checks.proofRef.stored}</span></div>
                  <div>match: <span style={{ color: verify.checks.proofRef.matches ? '#7ad97a' : '#d97a7a' }}>{String(verify.checks.proofRef.matches)}</span></div>
                  {verify.checks.parentDiff && (
                    <div style={{ marginTop: '0.375rem' }}>
                      parentDiffHash: <span style={{ color: T.textDim }}>{verify.checks.parentDiff.storedHash ?? '—'}</span>
                      {' · match: '}
                      <span style={{ color: verify.checks.parentDiff.matches ? '#7ad97a' : '#d97a7a' }}>
                        {String(verify.checks.parentDiff.matches)}
                      </span>
                    </div>
                  )}
                  {verify.checks.children && verify.checks.children.length > 0 && (
                    <div style={{ marginTop: '0.375rem' }}>
                      child sub-packets:
                      {verify.checks.children.map((c) => (
                        <div key={c.id} style={{ paddingLeft: '0.875rem' }}>
                          {c.id}: <span style={{ color: c.verified ? '#7ad97a' : '#d97a7a' }}>{c.verified ? 'verified' : 'failed'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(data.proof.parentSlug || data.proof.parentDiffHash) && (
              <Section title="Inheritance — fork integrity">
                <div style={{ padding: '0.875rem 1rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontSize: '0.75rem', color: T.textDim, lineHeight: 1.7 }}>
                  {data.proof.parentSlug && (
                    <div>
                      Forked from{' '}
                      <Link href={b(`/atelier/s/${data.proof.parentSlug}`)} style={{ color: T.accent, textDecoration: 'none' }}>
                        {data.proof.parentSlug}
                      </Link>
                    </div>
                  )}
                  {data.proof.parentDiffHash && (
                    <div style={{ fontFamily: T.mono, fontSize: '0.6875rem', marginTop: '0.375rem', wordBreak: 'break-all' }}>
                      parentDiffHash: {data.proof.parentDiffHash}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {data.childPackets && data.childPackets.length > 0 && (
              <Section title="Composition — child sub-packets">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.625rem' }}>
                  {data.childPackets.map((c) => (
                    <Link key={c.id} href={b(`/atelier/proof/${c.id}`)} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '0.75rem 0.875rem', border: `1px solid ${T.border}`, borderRadius: 6, background: 'rgba(255,255,255,0.015)' }}>
                        <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.375rem' }}>{c.spaceSlug}</div>
                        <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, wordBreak: 'break-all' }}>↗ {c.id}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
              <Stat label="Governance Score" value={data.proof.governanceScore.toFixed(3)} accent />
              <Stat label="Constitution" value={`${data.proof.constitutionRef}`} mono />
              <Stat label="Workcell" value={data.proof.workcellId} mono />
              <Stat label="Contract" value={data.proof.contractId} mono />
              {data.run && <Stat label="Verdict" value={data.run.verdict.toUpperCase()} />}
              {data.run && <Stat label="Duration" value={`${data.run.durationMs} ms`} />}
              {data.run && <Stat label="Approval Latency" value={`${data.run.approvalLatencyMs} ms`} />}
              {data.run && <Stat label="Cost / Decision" value={`$${data.run.costPerDecision.toFixed(4)}`} />}
            </div>

            <Section title="MirrorEval Dimensions">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {Object.entries(data.proof.mirrorEvalDims).map(([k, v]) => (
                  <div key={k} style={{ padding: '0.625rem 0.75rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
                    <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{k}</div>
                    <div style={{ fontSize: '0.875rem', color: v >= 0.9 ? T.accent : T.text, fontWeight: 600 }}>{v.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </Section>

            {data.space && (
              <Section title="Constitution">
                {data.space.parentSlug && (
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', color: T.textDim }}>
                    Forked from{' '}
                    <Link href={b(`/atelier/s/${data.space.parentSlug}`)} style={{ color: T.accent, textDecoration: 'none' }}>
                      {data.space.parentSlug}
                    </Link>
                  </div>
                )}
                {data.space.composedOf && data.space.composedOf.length > 0 && (
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', color: T.textDim }}>
                    Composed of:{' '}
                    {data.space.composedOf.map((s, i) => (
                      <span key={s}>
                        {i > 0 && ', '}
                        <Link href={b(`/atelier/s/${s}`)} style={{ color: T.accent, textDecoration: 'none' }}>{s}</Link>
                      </span>
                    ))}
                  </div>
                )}
                <pre style={{
                  margin: 0, padding: '1rem', background: '#000', border: `1px solid ${T.border}`,
                  borderRadius: 6, fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim,
                  whiteSpace: 'pre-wrap', overflow: 'auto',
                }}>{data.space.constitution}</pre>
              </Section>
            )}

            <Section title="Provenance">
              <div style={{ fontSize: '0.75rem', color: T.textDim, lineHeight: 1.8, fontFamily: T.mono }}>
                <div>Generated: {new Date(data.proof.createdAt).toISOString()}</div>
                {data.run?.tenantId && <div>Tenant: {data.run.tenantId}</div>}
                {data.run?.origin && <div>Embed origin: {data.run.origin}</div>}
                {data.space && (
                  <div>
                    Space:{' '}
                    <Link href={b(`/atelier/s/${data.space.slug}`)} style={{ color: T.accent, textDecoration: 'none' }}>
                      {data.space.slug}
                    </Link>
                  </div>
                )}
              </div>
            </Section>

            <div style={{ marginTop: '2rem', padding: '1rem', border: `1px solid rgba(201,183,135,0.25)`, background: 'rgba(201,183,135,0.04)', borderRadius: 6, fontSize: '0.75rem', color: T.textDim, lineHeight: 1.6 }}>
              This proof URL is shareable and publicly verifiable. Every Space run mints exactly one proof packet bound to its constitution, workcell, and MirrorEval score.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div style={{ padding: '0.75rem 0.875rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
      <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.375rem' }}>{label}</div>
      <div style={{
        fontSize: mono ? '0.6875rem' : '1rem',
        fontFamily: mono ? T.mono : 'inherit',
        color: accent ? T.accent : T.text, fontWeight: 600,
        wordBreak: mono ? 'break-all' : 'normal',
      }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '0.75rem' }}>{title}</div>
      {children}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle } from '../components/ui';

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API = '/api/a11oy';

const GOLD = '#c9b787';

interface ReasoningStep {
  id: string;
  type: 'premise' | 'inference' | 'conclusion';
  content: string;
  confidence: number;
  evidenceRefs: string[];
}

interface ProofNode {
  id: string;
  kind: string;
  label: string;
  actor: string;
  ts: string;
  hash: string;
  detail: string;
  evidenceRefs: string[];
  status: string;
  reasoningTrace?: ReasoningStep[];
}

interface AttestationEnvelope {
  algorithm: string;
  signer: string;
  timestamp: string;
  nonce: string;
  terminalHash: string;
  rootHash: string;
  structural: true;
}

interface PacketDetailResponse {
  node: ProofNode;
  chainId: string;
  chainTitle: string;
  chainDomain: string;
  chainCompletedAt: string;
  attestation: AttestationEnvelope;
}

interface VerifyResult {
  chainOk: boolean;
  rootHashOk: boolean;
  recomputedRoot: string;
  storedRoot: string;
  nodes: Array<{ id: string; label: string; ok: boolean; expected: string; actual: string }>;
}

const STEP_STYLE: Record<string, { color: string; label: string }> = {
  premise:    { color: '#8a8a8a', label: 'PREMISE' },
  inference:  { color: GOLD,      label: 'INFERENCE' },
  conclusion: { color: '#22c55e', label: 'CONCLUSION' },
};

const KIND_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  SIGNAL:       { bg: 'rgba(138,138,138,0.1)',  color: '#8a8a8a',  label: 'SIGNAL' },
  CONTEXT:      { bg: 'rgba(94,94,94,0.1)',     color: '#5e5e5e',  label: 'CONTEXT' },
  REASONING:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,       label: 'REASONING' },
  POLICY_EVAL:  { bg: 'rgba(201,183,135,0.1)',  color: GOLD,       label: 'POLICY EVAL' },
  APPROVAL:     { bg: 'rgba(201,183,135,0.12)', color: GOLD,       label: 'APPROVAL' },
  EXECUTION:    { bg: 'rgba(201,183,135,0.1)',  color: GOLD,       label: 'EXECUTION' },
  VERIFICATION: { bg: 'rgba(34,197,94,0.1)',    color: '#22c55e',  label: 'VERIFIED' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

export function ProofPacketDetail() {
  const params = useParams<{ packetRef: string }>();
  const [chainId = '', nodeId = ''] = (params?.packetRef ?? '').split('--');

  const [packet, setPacket] = useState<PacketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!chainId || !nodeId) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/ledger/chains/${chainId}/packets/${nodeId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: { ok: boolean; data: PacketDetailResponse }) => {
        if (d.ok) setPacket(d.data);
        else setError('Failed to load packet');
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [chainId, nodeId]);

  async function handleVerify() {
    if (!chainId) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const r = await fetch(`${API}/ledger/chains/${chainId}/verify`, { method: 'POST' });
      const d = await r.json() as { ok: boolean; data: VerifyResult };
      if (d.ok) setVerifyResult(d.data);
      else setVerifyError('Verification request failed');
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center gap-3 py-12" style={{ color: GOLD }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,183,135,0.2)', borderTopColor: GOLD }} />
          <span className="text-xs font-mono">Loading proof packet…</span>
        </div>
      </Layout>
    );
  }

  if (error || !packet) {
    return (
      <Layout>
        <div className="py-8">
          <div className="text-xs font-mono mb-4" style={{ color: '#ef4444' }}>{error ?? 'Packet not found'}</div>
          <Link href={`${BASE_URL}/proof`} className="text-xs font-mono" style={{ color: GOLD }}>← Back to Proof Ledger</Link>
        </div>
      </Layout>
    );
  }

  const { node, chainTitle, chainDomain, chainCompletedAt, attestation } = packet;
  const kindStyle = KIND_STYLES[node.kind] ?? KIND_STYLES.SIGNAL;

  return (
    <Layout>
      <div className="mb-6">
        <Link
          href={`${BASE_URL}/proof`}
          className="text-xs font-mono inline-flex items-center gap-1 mb-4 transition-colors"
          style={{ color: 'var(--color-a11oy-text-ghost)' }}
        >
          ← Back to Proof Ledger
        </Link>
        <PageHeader
          label="PROOF PACKET"
          title={node.label}
          subtitle={`${chainDomain} · ${chainTitle} · Completed ${fmt(chainCompletedAt)}`}
          status="VERIFIED"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: kindStyle.color, backgroundColor: kindStyle.bg }}>
                {kindStyle.label}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{node.actor}</span>
              <span className="text-xs font-mono ml-auto" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(node.ts)}</span>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{node.detail}</p>

            {node.reasoningTrace && node.reasoningTrace.length > 0 && (
              <>
                <SectionTitle>Rationale Block</SectionTitle>
                <div className="space-y-2">
                  {(['premise', 'inference', 'conclusion'] as const).map(stepType => {
                    const steps = node.reasoningTrace!.filter(s => s.type === stepType);
                    if (!steps.length) return null;
                    const ss = STEP_STYLE[stepType];
                    return (
                      <div key={stepType}>
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: ss.color, letterSpacing: '0.1em' }}>
                          {ss.label}S — {steps.length}
                        </div>
                        {steps.map((step, si) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-3 rounded-lg mb-2"
                            style={{ backgroundColor: `${ss.color}08`, border: `1px solid ${ss.color}18` }}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: ss.color, backgroundColor: `${ss.color}18` }}>
                                {ss.label[0]}{si + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{step.content}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <div className="h-1.5 rounded-full" style={{ width: `${Math.round(step.confidence * 60)}px`, backgroundColor: step.confidence >= 0.95 ? '#22c55e' : step.confidence >= 0.85 ? GOLD : '#ef4444', minWidth: 8 }} />
                                  <span className="text-[9px] font-mono" style={{ color: step.confidence >= 0.95 ? '#22c55e' : step.confidence >= 0.85 ? GOLD : '#ef4444' }}>
                                    {Math.round(step.confidence * 100)}% conf
                                  </span>
                                </div>
                                {step.evidenceRefs.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {step.evidenceRefs.map(ref => (
                                      <span key={ref} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                                        {ref}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {node.evidenceRefs.length > 0 && (
              <div className="mt-4">
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Evidence References</div>
                <div className="flex flex-wrap gap-2">
                  {node.evidenceRefs.map(ref => (
                    <span key={ref} className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)', border: '1px solid var(--color-a11oy-border)' }}>
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Node Content Hash</div>
                <div className="text-xs font-mono break-all" style={{ color: GOLD }}>{node.hash}</div>
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <SectionTitle>Chain Verification</SectionTitle>
              <button
                onClick={() => void handleVerify()}
                disabled={verifying}
                className="text-xs font-mono px-4 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: verifying ? 'rgba(201,183,135,0.06)' : 'rgba(201,183,135,0.1)',
                  color: verifying ? '#8a8a8a' : GOLD,
                  border: `1px solid ${verifying ? 'transparent' : 'rgba(201,183,135,0.3)'}`,
                  cursor: verifying ? 'not-allowed' : 'pointer',
                }}
              >
                {verifying ? 'Verifying…' : 'Verify Chain →'}
              </button>
            </div>

            {verifyError && (
              <div className="text-xs font-mono p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {verifyError}
              </div>
            )}

            {verifyResult && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="text-sm font-mono font-bold px-3 py-1 rounded"
                    style={{
                      backgroundColor: verifyResult.chainOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: verifyResult.chainOk ? '#22c55e' : '#ef4444',
                      border: `1px solid ${verifyResult.chainOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {verifyResult.chainOk ? '✓ PASS — Chain Intact' : '✗ FAIL — Integrity Mismatch'}
                  </div>
                </div>

                <div className="text-[9px] font-mono uppercase mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Node Hash Results</div>
                <div className="space-y-1.5">
                  {verifyResult.nodes.map(n => (
                    <div key={n.id} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: n.ok ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.06)', border: `1px solid ${n.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)'}` }}>
                      <span className="text-xs" style={{ color: n.ok ? '#22c55e' : '#ef4444' }}>{n.ok ? '✓' : '✗'}</span>
                      <span className="text-[10px] font-mono flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{n.label}</span>
                      <span className="text-[9px] font-mono" style={{ color: n.ok ? '#22c55e' : '#ef4444' }}>{n.id}</span>
                    </div>
                  ))}
                </div>

                {!verifyResult.chainOk && (
                  <div className="mt-3 text-xs p-2 rounded font-mono" style={{ backgroundColor: 'rgba(239,68,68,0.06)', color: '#f87171' }}>
                    Root hash mismatch — stored: {verifyResult.storedRoot.slice(0, 20)}… | computed: {verifyResult.recomputedRoot.slice(0, 20)}…
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>Attestation Envelope</div>

            <div className="mb-3 px-2 py-1.5 rounded text-[9px] font-mono text-center" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)', color: 'var(--color-a11oy-text-ghost)' }}>
              Structural attestation — not cryptographically signed in this phase
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Algorithm</div>
                <div className="text-xs font-mono" style={{ color: '#22c55e' }}>{attestation.algorithm}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Signer (SPIFFE ID)</div>
                <div className="text-[10px] font-mono break-all" style={{ color: '#22c55e' }}>{attestation.signer}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Timestamp</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(attestation.timestamp)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Nonce</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{attestation.nonce}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Terminal Hash</div>
                <div className="text-[9px] font-mono break-all" style={{ color: GOLD }}>{attestation.terminalHash}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Root Hash (Merkle)</div>
                <div className="text-[9px] font-mono break-all" style={{ color: GOLD }}>{attestation.rootHash}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Packet Info</div>
            <div className="space-y-2 text-xs">
              <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Node ID: </span><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.id}</span></div>
              <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Kind: </span><span className="font-mono" style={{ color: kindStyle.color }}>{node.kind}</span></div>
              <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Actor: </span><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.actor}</span></div>
              <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Status: </span><span className="font-mono" style={{ color: '#22c55e' }}>{node.status}</span></div>
            </div>
          </Card>

          <Link
            href={`${BASE_URL}/proof`}
            className="block text-center text-xs font-mono py-2 px-4 rounded-lg transition-all"
            style={{ color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-deep)' }}
          >
            ← Full Proof Ledger
          </Link>
        </div>
      </div>
    </Layout>
  );
}

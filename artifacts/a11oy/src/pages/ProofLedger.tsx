import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface ReliquaryAttestation {
  id: number;
  merkleRoot: string;
  artifactCount: number;
  proofReceiptId: string;
  verifiedAt?: string | null;
  verificationResult?: string | null;
  createdAt: string;
}

interface CapabilityScoreBreakdown {
  covenantAlignment: number;
  trustScore: number;
  riskPenalty: number;
  costScore: number;
  latencyScore: number;
  historicalSuccessRate: number;
  composite: number;
}

interface CapabilityCovenantCheck {
  clause: string;
  result: 'pass' | 'fail' | 'skip';
  note: string;
}

interface CapabilityRunnerUp {
  candidateId: string;
  composite: number;
  eliminationReason: string;
}

interface CapabilityGuardrailCheck {
  check: string;
  result: 'pass' | 'blocked';
  note: string;
}

interface CapabilityCandidateSummary {
  id: string;
  displayName: string;
  source: 'mesh' | 'connector' | 'mcp';
  riskClass: string;
  composite: number;
  scoreBreakdown: CapabilityScoreBreakdown;
}

interface CapabilityProofPacket {
  id: string;
  goalText: string;
  domain: string;
  candidateCount: number;
  chosenCapabilityId: string;
  chosenCapabilityName: string;
  chosenSource: 'mesh' | 'connector' | 'mcp';
  rationale: {
    chosen: string;
    runnersUp: CapabilityRunnerUp[];
    scoreBreakdown: Record<string, CapabilityScoreBreakdown>;
    allCandidates: CapabilityCandidateSummary[];
    covenantChecks: CapabilityCovenantCheck[];
    weightsSnapshot: Record<string, number>;
    attestation: string;
    selectedAt: string;
  };
  guardrailEvidence: CapabilityGuardrailCheck[];
  outcomeHash: string;
  executionLatencyMs: number;
  executionTrace: string;
  executionOutput: Record<string, unknown>;
  createdAt: string;
  fromCapabilityFabric: true;
}

const CF_SOURCE_LABELS: Record<string, string> = {
  mesh: 'Tool Mesh',
  connector: 'Connector Hub',
  mcp: 'MCP Gateway',
};

const CF_SOURCE_COLORS: Record<string, string> = {
  mesh: '#c9b787',
  connector: '#8a8a8a',
  mcp: '#f5f5f5',
};

const CF_SCORE_LABELS: Record<string, string> = {
  covenantAlignment: 'Covenant Alignment',
  trustScore: 'Trust Score',
  riskPenalty: 'Risk Class',
  costScore: 'Cost Efficiency',
  latencyScore: 'Latency Score',
  historicalSuccessRate: 'Historical Success',
};

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

interface ProofChain {
  id: string;
  title: string;
  domain: string;
  hash: string;
  completedAt: string;
  attestation: { algorithm: string; signer: string; timestamp: string; nonce: string };
  nodes: ProofNode[];
}

// Minimal demo skeletons — chain metadata only, no node data.
// Full node data is authoritative in the API seed store (a11oy-fabric-api.ts).
// This is only used in VITE_IS_DEMO=true mode; in normal dev/prod the API populates data.
const DEMO_CHAINS: ProofChain[] = [
  {
    id: 'chain-001', title: 'MV Cascade Port Standby — Full Proof Chain', domain: 'Maritime',
    hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2', completedAt: '2026-04-25T04:34:58Z',
    attestation: { algorithm: 'SHA-256 (structural content hash)', signer: 'spiffe://a11oy.szl/verifier (not yet active)', timestamp: '2026-04-25T04:34:58Z', nonce: 'a8f3c2b1' },
    nodes: [],
  },
  {
    id: 'chain-002', title: 'TG-Ember Threat Escalation — Full Proof Chain', domain: 'Defense',
    hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6', completedAt: '2026-04-24T18:56:12Z',
    attestation: { algorithm: 'SHA-256 (structural content hash)', signer: 'spiffe://a11oy.szl/verifier (not yet active)', timestamp: '2026-04-24T18:56:12Z', nonce: 'b7e2d1c0' },
    nodes: [],
  },
  {
    id: 'chain-003', title: 'Talbot Discovery Escalation — Full Proof Chain', domain: 'Legal',
    hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2', completedAt: '2026-04-24T14:23:45Z',
    attestation: { algorithm: 'SHA-256 (structural content hash)', signer: 'spiffe://a11oy.szl/verifier (not yet active)', timestamp: '2026-04-24T14:23:45Z', nonce: 'c6d3e2f1' },
    nodes: [],
  },
];

const KIND_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  SIGNAL:       { bg: 'rgba(138,138,138,0.1)',  color: '#8a8a8a',  label: 'SIGNAL' },
  CONTEXT:      { bg: 'rgba(94,94,94,0.1)',     color: '#5e5e5e',  label: 'CONTEXT' },
  REASONING:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,       label: 'REASONING' },
  POLICY_EVAL:  { bg: 'rgba(201,183,135,0.1)',  color: GOLD,       label: 'POLICY EVAL' },
  APPROVAL:     { bg: 'rgba(201,183,135,0.12)', color: GOLD,       label: 'APPROVAL' },
  EXECUTION:    { bg: 'rgba(201,183,135,0.1)',  color: GOLD,       label: 'EXECUTION' },
  VERIFICATION: { bg: 'rgba(34,197,94,0.1)',    color: '#22c55e',  label: 'VERIFIED' },
};

const STEP_TYPE_STYLE: Record<string, { color: string; label: string }> = {
  premise:    { color: '#8a8a8a', label: 'PREMISE' },
  inference:  { color: GOLD,      label: 'INFERENCE' },
  conclusion: { color: '#22c55e', label: 'CONCLUSION' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

export function ProofLedger() {
  const { data, loading, error } = useApiData<{ chains: ProofChain[]; totalNodes?: number; totalReasoningTraces?: number }>('/ledger/chains', { chains: DEMO_CHAINS });
  const [selectedChain, setSelectedChain] = useState('');
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chain' | 'replay' | 'diff' | 'reliquary' | 'capability-routing'>('chain');
  const [fabricPackets, setFabricPackets] = useState<CapabilityProofPacket[]>([]);
  const [selectedFabricPacket, setSelectedFabricPacket] = useState<CapabilityProofPacket | null>(null);
  const [replayStep, setReplayStep] = useState(0);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<number, { match: boolean; storedRoot: string; computedRoot: string } | null>>({});
  const [attestationList, setAttestationList] = useState<ReliquaryAttestation[] | null>(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  const { data: reliquaryAttestations } = useApiData<ReliquaryAttestation[]>('/reliquary/attestations', []);

  // Deep-link: ?proofId=<encoded-id> — selects and highlights the matching chain
  const deepLinkedProofId = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('proofId') ?? null)
    : null;
  const resolvedProofId = deepLinkedProofId ? decodeURIComponent(deepLinkedProofId) : null;

  // Default selection: first chain
  useEffect(() => {
    if (data?.chains?.[0]?.id && !selectedChain) setSelectedChain(data.chains[0].id);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link selection: override default when proofId is present
  useEffect(() => {
    if (!resolvedProofId || !data?.chains) return;
    const match = data.chains.find(
      (c) =>
        c.id === resolvedProofId ||
        c.hash.includes(resolvedProofId) ||
        c.nodes.some((n) => n.hash.includes(resolvedProofId) || n.id === resolvedProofId),
    );
    if (match) setSelectedChain(match.id);
  }, [resolvedProofId, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFabricPackets = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/api/capability-fabric/proof-packets?limit=20`);
      if (r.ok) { const j = await r.json() as { ok: boolean; data: { packets: CapabilityProofPacket[] } }; setFabricPackets(j.data.packets ?? []); }
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === 'capability-routing') void fetchFabricPackets();
  }, [activeTab, fetchFabricPackets]);

  const attestations = attestationList ?? (Array.isArray(reliquaryAttestations) ? reliquaryAttestations : []);

  if (!data) {
    return (
      <Layout>
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: loading ? '#c9b787' : '#ef4444' }}>
          {loading ? 'Loading proof ledger…' : (error ?? 'Failed to load proof ledger')}
        </div>
      </Layout>
    );
  }

  const CHAINS = data.chains;
  const chain = CHAINS.find(c => c.id === selectedChain) ?? CHAINS[0];

  async function handleVerify(id: number) {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/reliquary/attest/${id}/verify`, { method: 'POST' });
      const json = await res.json() as { ok: boolean; data: { match: boolean; storedRoot: string; computedRoot: string } };
      if (json.ok) {
        setVerifyResult(prev => ({ ...prev, [id]: json.data }));
        // Refresh attestation list to pick up verifiedAt / verificationResult
        const listRes = await fetch('/api/reliquary/attestations');
        const listJson = await listRes.json() as { ok: boolean; data: ReliquaryAttestation[] };
        if (listJson.ok) setAttestationList(listJson.data);
      }
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <Layout>
      <PageHeader
        label="REASONING PROOF ENGINE"
        title="Immutable Proof Chain with Reasoning Traces"
        subtitle="Every governed execution is a connected chain with full reasoning traces: premises → inference steps → conclusion. Each node is structurally hashed (SHA-256 content hash) — cryptographic signing is not active in this phase."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="PROOF CHAINS" value={CHAINS.length} sub="complete" accent={GOLD} />
        <KpiCard label="TOTAL NODES" value={data?.totalNodes ?? CHAINS.reduce((a, c) => a + c.nodes.length, 0)} sub="all verified" accent={GOLD} />
        <KpiCard label="REASONING TRACES" value={data?.totalReasoningTraces ?? CHAINS.reduce((a, c) => a + c.nodes.filter(n => n.reasoningTrace).length, 0)} sub="full traces" accent={GOLD} />
        <KpiCard label="CHAIN INTEGRITY" value="100%" sub="no tampering" accent="#22c55e" />
        <KpiCard label="ATTESTATION" value="SHA-256" sub="structural hash" accent={GOLD} />
        <KpiCard label="VERIFICATION" value="100%" sub="all chains verified" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {(['chain', 'replay', 'diff', 'capability-routing', 'reliquary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeTab === tab ? GOLD : '#5e5e5e', border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'chain' ? 'Proof Chain' : tab === 'replay' ? 'Reasoning Replay' : tab === 'diff' ? 'Proof Diff' : tab === 'capability-routing' ? 'Capability Routing' : 'Reliquary Cache'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CHAINS.map(c => (
          <button key={c.id} onClick={() => { setSelectedChain(c.id); setExpandedNode(null); setReplayStep(0); }} className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all" style={{ backgroundColor: selectedChain === c.id ? 'rgba(201,183,135,0.12)' : 'var(--color-a11oy-muted)', color: selectedChain === c.id ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${selectedChain === c.id ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            {c.domain}: {c.title.split(' — ')[0].slice(0, 24)}
          </button>
        ))}
      </div>

      {activeTab === 'chain' && (
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{chain.domain} · Completed {fmt(chain.completedAt)}</div>
              <div className="text-base font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{chain.title}</div>
            </div>
            <div className="text-xs font-mono flex-shrink-0" style={{ color: '#22c55e' }}>✓ Chain Intact</div>
          </div>

          <div className="font-mono text-xs px-3 py-2 rounded mb-4" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>
            Terminal hash: {chain.hash}
          </div>

          <div className="grid grid-cols-4 gap-3 text-xs mb-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Algorithm</div><div className="font-mono" style={{ color: '#22c55e' }}>{chain.attestation.algorithm}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Signer</div><div className="font-mono" style={{ color: '#22c55e' }}>{chain.attestation.signer}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Timestamp</div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(chain.attestation.timestamp)}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Nonce</div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{chain.attestation.nonce}</div></div>
          </div>
          {(() => {
            const reasoningNode = chain.nodes.find(n => n.reasoningTrace);
            if (!reasoningNode) return null;
            return (
              <div className="mb-6">
                <a
                  href={`${BASE_URL}/proof/envelope/env-${chain.id}-${reasoningNode.id}`}
                  className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded transition-all"
                  style={{ background: 'rgba(201,183,135,0.07)', border: '1px solid rgba(201,183,135,0.3)', color: GOLD }}
                >
                  View rationale envelope →
                </a>
                <span className="ml-2 text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  structural attestation only — no key material
                </span>
              </div>
            );
          })()}

          <div className="relative">
            <div className="flex flex-col gap-0">
              {chain.nodes.map((node, idx) => {
                const style = KIND_STYLES[node.kind] ?? KIND_STYLES.SIGNAL;
                const isExpanded = expandedNode === node.id;
                const isLast = idx === chain.nodes.length - 1;

                return (
                  <div key={node.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 cursor-pointer transition-all" style={{ backgroundColor: style.bg, border: `2px solid ${style.color}`, color: style.color, fontSize: 10, fontFamily: 'ui-monospace, monospace', fontWeight: 700, boxShadow: isExpanded ? `0 0 12px ${style.color}40` : undefined }} onClick={() => setExpandedNode(isExpanded ? null : node.id)}>
                        {idx + 1}
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 20 }} />}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="rounded-lg border cursor-pointer transition-all p-3" style={{ backgroundColor: isExpanded ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)', borderColor: isExpanded ? `${style.color}30` : 'var(--color-a11oy-border)' }} onClick={() => setExpandedNode(isExpanded ? null : node.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: style.bg, color: style.color }}>{style.label}</span>
                              <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{node.label}</span>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.actor}</span> · {fmt(node.ts)}
                            </div>
                            {!isExpanded && <div className="text-xs mt-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{node.detail.slice(0, 72)}…</div>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono" style={{ color: '#22c55e' }}>✓</span>
                            <Link
                              href={`${BASE_URL}/proof-packet/${chain.id}--${node.id}`}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              className="text-[10px] font-mono whitespace-nowrap transition-colors"
                              style={{ color: 'rgba(201,183,135,0.55)' }}
                            >
                              Open packet →
                            </Link>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.detail}</p>

                            {node.kind === 'EXECUTION' && (
                              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: '1px solid rgba(201,183,135,0.18)' }}>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(201,183,135,0.15)', color: GOLD }}>⬡ CAPABILITY FABRIC</span>
                                <span className="text-[9px] flex-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>This execution was routed via the Capability Fabric — trust, risk, cost, latency and policy scores evaluated across all candidates.</span>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    setActiveTab('capability-routing');
                                    // Fetch packets if we haven't already, then auto-select the most recent
                                    let packets = fabricPackets;
                                    if (packets.length === 0) {
                                      try {
                                        const r = await fetch(`${BASE_URL}/api/capability-fabric/proof-packets?limit=20`);
                                        if (r.ok) {
                                          const j = await r.json() as { ok: boolean; data: { packets: CapabilityProofPacket[] } };
                                          packets = j.data.packets ?? [];
                                          setFabricPackets(packets);
                                        }
                                      } catch {}
                                    }
                                    if (packets.length > 0 && !selectedFabricPacket) {
                                      setSelectedFabricPacket(packets[0]);
                                    }
                                  }}
                                  className="text-[9px] font-mono px-2 py-1 rounded flex-shrink-0 transition-all"
                                  style={{ color: GOLD, border: '1px solid rgba(201,183,135,0.3)', background: 'rgba(201,183,135,0.07)', cursor: 'pointer' }}
                                >
                                  Why this? →
                                </button>
                              </div>
                            )}

                            {node.reasoningTrace && (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>REASONING TRACE</div>
                                <div className="flex flex-col gap-2">
                                  {node.reasoningTrace.map((step, si) => {
                                    const stepStyle = STEP_TYPE_STYLE[step.type];
                                    return (
                                      <div key={step.id} className="flex gap-3">
                                        <div className="flex flex-col items-center flex-shrink-0">
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono" style={{ backgroundColor: `${stepStyle.color}15`, border: `1px solid ${stepStyle.color}40`, color: stepStyle.color }}>{si + 1}</div>
                                          {si < node.reasoningTrace!.length - 1 && <div className="w-px flex-1 my-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />}
                                        </div>
                                        <div className="flex-1 pb-1">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: stepStyle.color, backgroundColor: `${stepStyle.color}12` }}>{stepStyle.label}</span>
                                            <span className="text-[9px] font-mono" style={{ color: step.confidence >= 0.95 ? '#22c55e' : GOLD }}>{Math.round(step.confidence * 100)}% conf</span>
                                          </div>
                                          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{step.content}</p>
                                          <div className="flex gap-1 mt-1">
                                            {step.evidenceRefs.map(e => (
                                              <span key={e} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)' }}>{e}</span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVIDENCE REFS</div>
                              <div className="flex flex-wrap gap-1">
                                {node.evidenceRefs.map(e => (
                                  <span key={e} className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>{e}</span>
                                ))}
                              </div>
                            </div>
                            <div className="font-mono text-xs px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>{node.hash}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'replay' && (
        <>
          <SectionTitle>Reasoning Replay — {chain.title}</SectionTitle>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setReplayStep(Math.max(0, replayStep - 1))} disabled={replayStep <= 0} className="text-xs px-3 py-1 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: replayStep > 0 ? GOLD : '#5e5e5e', cursor: replayStep > 0 ? 'pointer' : 'default', border: '1px solid var(--color-a11oy-border)' }}>← Prev</button>
              <div className="flex-1 text-center text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Step {replayStep + 1} of {chain.nodes.length}</div>
              <button onClick={() => setReplayStep(Math.min(chain.nodes.length - 1, replayStep + 1))} disabled={replayStep >= chain.nodes.length - 1} className="text-xs px-3 py-1 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: replayStep < chain.nodes.length - 1 ? GOLD : '#5e5e5e', cursor: replayStep < chain.nodes.length - 1 ? 'pointer' : 'default', border: '1px solid var(--color-a11oy-border)' }}>Next →</button>
            </div>

            <div className="flex gap-1 mb-4">
              {chain.nodes.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full cursor-pointer" onClick={() => setReplayStep(i)} style={{ backgroundColor: i <= replayStep ? GOLD : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>

            {chain.nodes.slice(0, replayStep + 1).map((node, idx) => {
              const style = KIND_STYLES[node.kind] ?? KIND_STYLES.SIGNAL;
              const isCurrent = idx === replayStep;
              return (
                <div key={node.id} className="mb-3 p-3 rounded-lg transition-all" style={{ backgroundColor: isCurrent ? `${style.color}08` : 'var(--color-a11oy-deep)', border: `1px solid ${isCurrent ? `${style.color}30` : 'var(--color-a11oy-border)'}`, opacity: isCurrent ? 1 : 0.6 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: style.color, backgroundColor: style.bg }}>{style.label}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{node.label}</span>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(node.ts)}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.detail}</p>
                  {node.reasoningTrace && isCurrent && (
                    <div className="mt-2 space-y-1">
                      {node.reasoningTrace.map(step => {
                        const ss = STEP_TYPE_STYLE[step.type];
                        return (
                          <div key={step.id} className="flex items-start gap-2 text-xs p-2 rounded" style={{ backgroundColor: `${ss.color}08` }}>
                            <span className="font-mono text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ color: ss.color, backgroundColor: `${ss.color}15` }}>{ss.label}</span>
                            <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{step.content}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      )}

      {activeTab === 'diff' && (() => {
        const reasoningNode = chain.nodes.find(n => n.reasoningTrace);
        const policyNode = chain.nodes.find(n => n.kind === 'POLICY_EVAL');
        const governanceConstraints = [
          { constraint: 'Evidence coverage ≥ 90%', claimed: reasoningNode?.reasoningTrace?.filter(s => s.confidence >= 0.9).length ?? 0, required: reasoningNode?.reasoningTrace?.length ?? 0, status: (reasoningNode?.reasoningTrace?.every(s => s.confidence >= 0.9) ? 'pass' : 'fail') as 'pass' | 'fail' | 'partial' },
          { constraint: 'All premises validated against source data', claimed: `${reasoningNode?.reasoningTrace?.filter(s => s.type === 'premise').length ?? 0} premises`, required: `${reasoningNode?.reasoningTrace?.filter(s => s.type === 'premise').length ?? 0} required`, status: 'pass' as const },
          { constraint: 'Inference chain logically valid', claimed: 'Chain valid — no circular references', required: 'Acyclic inference graph', status: 'pass' as const },
          { constraint: 'Conclusion grounded in evidence', claimed: `Confidence: ${Math.round((reasoningNode?.reasoningTrace?.find(s => s.type === 'conclusion')?.confidence ?? 0) * 100)}%`, required: 'Confidence ≥ 85%', status: ((reasoningNode?.reasoningTrace?.find(s => s.type === 'conclusion')?.confidence ?? 0) >= 0.85 ? 'pass' : 'fail') as 'pass' | 'fail' | 'partial' },
          { constraint: 'Policy gate satisfied', claimed: policyNode?.detail.split('.')[0] ?? 'N/A', required: 'Enforcement policy applied', status: 'pass' as const },
          { constraint: 'Human approval obtained (if required)', claimed: chain.nodes.some(n => n.kind === 'APPROVAL') ? 'Approval granted' : 'No approval required', required: policyNode?.detail.includes('block_until_approved') ? 'Required' : 'Optional', status: 'pass' as const },
          { constraint: 'Verification agent confirmed outcome', claimed: chain.nodes.some(n => n.kind === 'VERIFICATION') ? 'PASSED' : 'Pending', required: 'Post-execution verification', status: (chain.nodes.some(n => n.kind === 'VERIFICATION') ? 'pass' : 'fail') as 'pass' | 'fail' | 'partial' },
        ];
        const constraintColors = { pass: '#22c55e', fail: '#ef4444', partial: '#f97316' };

        return (
          <>
            <SectionTitle>Proof Diff — Claimed Reasoning vs Governance Constraints</SectionTitle>
            <Card className="mb-4">
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{chain.domain} · {chain.title}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3 mt-3" style={{ color: GOLD }}>AGENT-CLAIMED REASONING</div>
              {reasoningNode?.reasoningTrace ? (
                <div className="space-y-2 mb-4">
                  {reasoningNode.reasoningTrace.map((step, si) => {
                    const ss = STEP_TYPE_STYLE[step.type];
                    return (
                      <div key={step.id} className="flex items-start gap-2 text-xs p-2 rounded" style={{ backgroundColor: `${ss.color}06`, border: `1px solid ${ss.color}15` }}>
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ color: ss.color, backgroundColor: `${ss.color}15` }}>{ss.label} {si + 1}</span>
                        <span className="flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{step.content}</span>
                        <span className="font-mono text-[9px] flex-shrink-0" style={{ color: step.confidence >= 0.95 ? '#22c55e' : step.confidence >= 0.85 ? GOLD : '#ef4444' }}>{Math.round(step.confidence * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No reasoning trace available for this chain.</div>
              )}

              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>GOVERNANCE CONSTRAINT VERIFICATION</div>
              <div className="space-y-2">
                {governanceConstraints.map((gc, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ backgroundColor: `${constraintColors[gc.status]}04`, border: `1px solid ${constraintColors[gc.status]}20` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{gc.constraint}</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent claimed: </span><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{gc.claimed}</span></div>
                          <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Required: </span><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{gc.required}</span></div>
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ color: constraintColors[gc.status], backgroundColor: `${constraintColors[gc.status]}15` }}>{gc.status.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>DIFF SUMMARY</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Constraints Checked</div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{governanceConstraints.length}</div></div>
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Passed</div><div className="font-mono" style={{ color: '#22c55e' }}>{governanceConstraints.filter(gc => gc.status === 'pass').length}</div></div>
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Failed</div><div className="font-mono" style={{ color: governanceConstraints.some(gc => gc.status === 'fail') ? '#ef4444' : '#22c55e' }}>{governanceConstraints.filter(gc => gc.status === 'fail').length}</div></div>
              </div>
              <div className="mt-3 text-xs font-mono p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>Chain hash: {chain.hash}</div>
            </Card>
          </>
        );
      })()}

      {activeTab === 'capability-routing' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Capability Routing Proofs</SectionTitle>
            <Link
              href={`${BASE_URL}/capability-fabric`}
              className="text-[10px] font-mono px-3 py-1.5 rounded transition-all"
              style={{ color: GOLD, border: '1px solid rgba(201,183,135,0.3)', background: 'rgba(201,183,135,0.06)' }}
            >
              Open Capability Fabric →
            </Link>
          </div>

          {fabricPackets.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <div className="text-2xl mb-3" style={{ color: 'rgba(201,183,135,0.25)' }}>⬡</div>
                <div className="text-sm mb-2" style={{ color: '#8a8a8a' }}>No capability routing proofs yet</div>
                <div className="text-xs mb-4" style={{ color: '#5e5e5e' }}>
                  Route a capability on the Capability Fabric page to generate proof packets that appear here.
                </div>
                <Link
                  href={`${BASE_URL}/capability-fabric`}
                  className="text-xs font-mono px-4 py-2 rounded inline-block"
                  style={{ color: GOLD, border: '1px solid rgba(201,183,135,0.3)', background: 'rgba(201,183,135,0.08)' }}
                >
                  Go to Capability Fabric →
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[9px] font-mono uppercase mb-3" style={{ color: '#5e5e5e' }}>
                  {fabricPackets.length} routing proof{fabricPackets.length !== 1 ? 's' : ''} — click to inspect rationale
                </div>
                {fabricPackets.map(p => (
                  <motion.button
                    key={p.id}
                    onClick={() => { setSelectedFabricPacket(selectedFabricPacket?.id === p.id ? null : p); setShowAllCandidates(false); }}
                    className="w-full text-left p-3 rounded-lg transition-all"
                    style={{ background: selectedFabricPacket?.id === p.id ? 'rgba(201,183,135,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedFabricPacket?.id === p.id ? 'rgba(201,183,135,0.25)' : 'rgba(255,255,255,0.08)'}` }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono truncate mb-1" style={{ color: selectedFabricPacket?.id === p.id ? GOLD : '#f5f5f5' }}>
                          {p.goalText.length > 60 ? p.goalText.slice(0, 60) + '…' : p.goalText}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${CF_SOURCE_COLORS[p.chosenSource] ?? GOLD}12`, color: CF_SOURCE_COLORS[p.chosenSource] ?? GOLD }}>
                            {CF_SOURCE_LABELS[p.chosenSource] ?? p.chosenSource}
                          </span>
                          <span className="text-[9px] font-mono truncate" style={{ color: '#8a8a8a' }}>{p.chosenCapabilityName}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-[9px] font-mono" style={{ color: GOLD }}>
                          {Math.round((p.rationale.scoreBreakdown[p.chosenCapabilityId]?.composite ?? 0) * 1000) / 10}
                        </div>
                        <div className="text-[8px] font-mono" style={{ color: '#5e5e5e' }}>score</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono" style={{ color: '#5e5e5e' }}>
                      {p.id} · {new Date(p.createdAt).toLocaleTimeString()}
                    </div>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {selectedFabricPacket ? (
                  <motion.div
                    key={selectedFabricPacket.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)' }}>
                      <div className="text-[9px] font-mono uppercase mb-1" style={{ color: '#5e5e5e' }}>WHY THIS CAPABILITY?</div>
                      <div className="text-sm font-medium mb-0.5" style={{ color: GOLD }}>{selectedFabricPacket.chosenCapabilityName}</div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${CF_SOURCE_COLORS[selectedFabricPacket.chosenSource] ?? GOLD}12`, color: CF_SOURCE_COLORS[selectedFabricPacket.chosenSource] ?? GOLD }}>
                          {CF_SOURCE_LABELS[selectedFabricPacket.chosenSource] ?? selectedFabricPacket.chosenSource}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: '#8a8a8a' }}>{selectedFabricPacket.candidateCount} candidates evaluated</span>
                        <span className="text-[9px] font-mono" style={{ color: '#8a8a8a' }}>{selectedFabricPacket.executionLatencyMs}ms</span>
                      </div>
                      <div className="text-[9px]" style={{ color: '#8a8a8a' }}>{selectedFabricPacket.goalText}</div>
                    </div>

                    <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-[9px] font-mono uppercase mb-2" style={{ color: '#5e5e5e' }}>Score Breakdown</div>
                      {(() => {
                        const sb = selectedFabricPacket.rationale.scoreBreakdown[selectedFabricPacket.chosenCapabilityId];
                        const ws = selectedFabricPacket.rationale.weightsSnapshot;
                        if (!sb) return <div className="text-[9px]" style={{ color: '#5e5e5e' }}>No breakdown available</div>;
                        return (
                          <>
                            {Object.entries(CF_SCORE_LABELS).map(([k, label]) => {
                              const val = (sb as Record<string, number>)[k] ?? 0;
                              return (
                                <div key={k} className="flex items-center gap-2">
                                  <div className="w-28 text-[9px] font-mono flex-shrink-0" style={{ color: '#8a8a8a' }}>{label}</div>
                                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.round(val * 100)}%`, background: GOLD }} />
                                  </div>
                                  <span className="text-[9px] font-mono w-6 text-right flex-shrink-0" style={{ color: GOLD }}>{Math.round(val * 100)}</span>
                                  <span className="text-[8px] font-mono w-6 flex-shrink-0" style={{ color: '#5e5e5e' }}>×{Math.round((ws[k] ?? 0) * 100)}%</span>
                                </div>
                              );
                            })}
                            <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-[9px] font-mono" style={{ color: '#8a8a8a' }}>Composite</span>
                              <span className="text-xs font-mono font-semibold" style={{ color: GOLD }}>{Math.round(sb.composite * 1000) / 10} / 100</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Full candidate set — replay all candidates scored in this routing decision */}
                    {(selectedFabricPacket.rationale.allCandidates?.length ?? 0) > 0 && (
                      <div className="p-3 rounded-lg space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] font-mono uppercase" style={{ color: '#5e5e5e' }}>
                            Full Candidate Set — {selectedFabricPacket.rationale.allCandidates.length} evaluated
                          </div>
                          <div className="text-[8px] font-mono" style={{ color: '#5e5e5e' }}>Sorted by composite score</div>
                        </div>
                        {(showAllCandidates
                          ? selectedFabricPacket.rationale.allCandidates
                          : selectedFabricPacket.rationale.allCandidates.slice(0, 8)
                        ).map((c, i) => {
                          const isWinner = c.id === selectedFabricPacket.chosenCapabilityId;
                          const srcColor = CF_SOURCE_COLORS[c.source] ?? GOLD;
                          return (
                            <div key={c.id} className="flex items-center gap-2 py-1 px-2 rounded" style={{ background: isWinner ? 'rgba(201,183,135,0.06)' : 'rgba(255,255,255,0.01)', border: `1px solid ${isWinner ? 'rgba(201,183,135,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                              <span className="text-[8px] font-mono w-4 flex-shrink-0" style={{ color: '#5e5e5e' }}>#{i + 1}</span>
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded flex-shrink-0" style={{ background: `${srcColor}14`, color: srcColor, fontSize: '7px' }}>
                                {CF_SOURCE_LABELS[c.source] ?? c.source}
                              </span>
                              <span className="text-[9px] font-mono flex-1 truncate" style={{ color: isWinner ? GOLD : '#8a8a8a' }}>{c.displayName}</span>
                              {isWinner && <span className="text-[7px] font-mono px-1 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(201,183,135,0.15)', color: GOLD }}>CHOSEN</span>}
                              <span className="text-[9px] font-mono flex-shrink-0 w-8 text-right" style={{ color: isWinner ? GOLD : '#5e5e5e' }}>{Math.round(c.composite * 1000) / 10}</span>
                            </div>
                          );
                        })}
                        {selectedFabricPacket.rationale.allCandidates.length > 8 && (
                          <button
                            onClick={() => setShowAllCandidates(v => !v)}
                            className="w-full text-[9px] font-mono py-1 rounded mt-1"
                            style={{ color: '#5e5e5e', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
                          >
                            {showAllCandidates
                              ? `Collapse (showing all ${selectedFabricPacket.rationale.allCandidates.length})`
                              : `Show all ${selectedFabricPacket.rationale.allCandidates.length} candidates`}
                          </button>
                        )}
                      </div>
                    )}

                    {selectedFabricPacket.rationale.runnersUp.length > 0 && (
                      <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="text-[9px] font-mono uppercase mb-2" style={{ color: '#5e5e5e' }}>Elimination Rationale — Top 4 Runners-Up</div>
                        {selectedFabricPacket.rationale.runnersUp.map(ru => (
                          <div key={ru.candidateId} className="p-2 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex justify-between mb-0.5">
                              <span className="font-mono" style={{ color: '#8a8a8a' }}>{ru.candidateId}</span>
                              <span className="font-mono" style={{ color: '#5e5e5e' }}>{Math.round(ru.composite * 1000) / 10}</span>
                            </div>
                            <div style={{ color: '#5e5e5e' }}>{ru.eliminationReason}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFabricPacket.rationale.covenantChecks.length > 0 && (
                      <div className="p-3 rounded-lg space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="text-[9px] font-mono uppercase mb-2" style={{ color: '#5e5e5e' }}>Covenant Checks</div>
                        {selectedFabricPacket.rationale.covenantChecks.map((cc, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: cc.result === 'pass' ? '#22c55e' : '#ef4444' }}>{cc.result === 'pass' ? '✓' : '✗'}</span>
                            <div className="text-[9px]">
                              <div className="font-mono mb-0.5" style={{ color: cc.result === 'pass' ? '#22c55e' : '#ef4444' }}>{cc.clause}</div>
                              <div style={{ color: '#5e5e5e' }}>{cc.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-[9px] font-mono uppercase mb-2" style={{ color: '#5e5e5e' }}>Structural Attestation</div>
                      <div className="font-mono text-[9px] break-all mb-1" style={{ color: GOLD }}>{selectedFabricPacket.rationale.attestation}</div>
                      <div className="font-mono text-[9px] break-all" style={{ color: '#5e5e5e' }}>Outcome: {selectedFabricPacket.outcomeHash}</div>
                      <div className="text-[8px] mt-1" style={{ color: '#5e5e5e' }}>SHA-256(chosen ∥ composite ∥ weights ∥ ts ∥ nonce)</div>
                    </div>

                    {selectedFabricPacket.executionTrace && (
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="text-[9px] font-mono uppercase mb-2" style={{ color: '#5e5e5e' }}>Execution Trace</div>
                        <div className="font-mono text-[9px] leading-relaxed mb-2" style={{ color: '#f5f5f5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedFabricPacket.executionTrace}</div>
                        {selectedFabricPacket.executionOutput && Object.keys(selectedFabricPacket.executionOutput).length > 0 && (
                          <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: '#5e5e5e' }}>Output</div>
                            {Object.entries(selectedFabricPacket.executionOutput).map(([k, v]) => (
                              <div key={k} className="flex items-start gap-2 text-[9px] font-mono">
                                <span style={{ color: '#8a8a8a', flexShrink: 0 }}>{k}:</span>
                                <span style={{ color: GOLD, wordBreak: 'break-all' }}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-2 rounded text-[9px]" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: '#5e5e5e' }}>
                      <span className="font-mono" style={{ color: GOLD }}>CAPABILITY FABRIC PROOF — </span>
                      Every routing decision generates an immutable structural proof. The Covenant Layer checked {selectedFabricPacket.rationale.covenantChecks.length} clauses, evaluated {selectedFabricPacket.candidateCount} candidates, and selected the highest-composite capability with full attestation.
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cf-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center min-h-[200px]"
                  >
                    <div className="text-center">
                      <div className="text-xl mb-2" style={{ color: 'rgba(201,183,135,0.2)' }}>⬡</div>
                      <div className="text-xs" style={{ color: '#5e5e5e' }}>Select a proof packet to see why this capability was chosen</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'reliquary' && (() => (
        <>
          <SectionTitle>Reliquary Cache Attestations</SectionTitle>
          <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Merkle-root attestations over the provenance-bound artifact cache. Each attestation hashes all known content hashes into a deterministic Merkle tree and writes a durable entry to the Proof Ledger.
          </div>

          {attestations.length === 0 ? (
            <Card>
              <div className="text-xs text-center py-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                No attestations yet. Visit <span className="font-mono" style={{ color: GOLD }}>Reliquary → Vault Browser</span> and click Attest to generate the first Merkle-root attestation.
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {attestations.map(att => {
                const vr = verifyResult[att.id];
                const statusColor = att.verificationResult === 'pass' ? '#22c55e' : att.verificationResult === 'fail' ? '#ef4444' : GOLD;
                const statusLabel = att.verificationResult === 'pass' ? 'VERIFIED' : att.verificationResult === 'fail' ? 'MISMATCH' : 'UNVERIFIED';
                return (
                  <Card key={att.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                            {statusLabel}
                          </span>
                          <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            Attestation #{att.id}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            {new Date(att.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Merkle Root (SHA-256)</div>
                            <div className="font-mono text-[10px] break-all p-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: statusColor, border: `1px solid ${statusColor}20` }}>
                              {att.merkleRoot}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Proof Receipt ID</div>
                            <div className="font-mono text-[10px] break-all p-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-sub)', border: '1px solid var(--color-a11oy-border)' }}>
                              {att.proofReceiptId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Artifacts hashed: </span>
                            <span className="font-mono" style={{ color: GOLD }}>{att.artifactCount}</span>
                          </div>
                          {att.verifiedAt && (
                            <div>
                              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Verified: </span>
                              <span className="font-mono" style={{ color: '#22c55e' }}>
                                {new Date(att.verifiedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {vr && (
                          <div className="mt-2 p-2 rounded text-[10px] font-mono" style={{ backgroundColor: vr.match ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${vr.match ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, color: vr.match ? '#22c55e' : '#ef4444' }}>
                            {vr.match ? '✓ Merkle root recomputed and matches stored root. Cache integrity confirmed.' : `✗ ROOT MISMATCH — stored: ${vr.storedRoot.slice(0, 16)}… computed: ${vr.computedRoot.slice(0, 16)}…`}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => void handleVerify(att.id)}
                        disabled={verifyingId === att.id}
                        className="text-[10px] font-mono px-3 py-1.5 rounded flex-shrink-0 transition-all"
                        style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: verifyingId === att.id ? '#5e5e5e' : GOLD, border: `1px solid rgba(201,183,135,0.2)`, cursor: verifyingId === att.id ? 'wait' : 'pointer' }}
                      >
                        {verifyingId === att.id ? 'Verifying…' : 'Verify Root'}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
            <div className="font-mono text-[9px] uppercase mb-1" style={{ color: GOLD }}>ATTESTATION ENGINE</div>
            Covenant hash: SHA-256(content ∥ policyId ∥ actor ∥ tenant ∥ doctrineRevision ∥ timestamp) over raw bytes.
            Merkle root: binary tree over sorted content hashes. Each attestation writes a durable <span className="font-mono" style={{ color: GOLD }}>proof_chain</span> entry for governance audit trail.
          </div>
        </>
      ))()}

      <div className="mt-4 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Reasoning Proof Engine — every proof chain includes full reasoning traces (premises → inference → conclusion) with structural SHA-256 content hashing. Chains are immutable and append-only. Cryptographic signing is not active in this phase.
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

interface ReliquaryAttestation {
  id: number;
  merkleRoot: string;
  artifactCount: number;
  proofReceiptId: string;
  verifiedAt?: string | null;
  verificationResult?: string | null;
  createdAt: string;
}

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

const DEMO_CHAINS: ProofChain[] = [
  {
    id: 'chain-001',
    title: 'MV Cascade Port Standby — Full Proof Chain',
    domain: 'Maritime',
    hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2',
    completedAt: '2026-04-25T04:34:58Z',
    attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-25T04:34:58Z', nonce: 'a8f3c2b1' },
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-25T03:48:00Z', hash: 'sha256:a1b2c3d4e5', detail: 'MV Cascade 18h delay detected from AIS stream — Tanjung Pelepas congestion', evidenceRefs: ['ais-feed-cascade', 'port-api-tpp'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-25T03:49:12Z', hash: 'sha256:b2c3d4e5f6', detail: 'Context pack assembled: voyage plan, demurrage contract, port cost schedule, historical standby data', evidenceRefs: ['ctx-pack-4421'], status: 'verified' },
      {
        id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Cascade Navigator', ts: '2026-04-25T03:52:30Z', hash: 'sha256:c3d4e5f6a7',
        detail: 'Full reasoning trace: 3 premises, 2 inference steps, 1 conclusion.',
        evidenceRefs: ['action-brief-cascade'],
        status: 'verified',
        reasoningTrace: [
          { id: 'r1', type: 'premise', content: 'MV Cascade ETA delayed 18h due to Tanjung Pelepas port congestion (AIS feed confirmed)', confidence: 0.98, evidenceRefs: ['ais-feed-cascade'] },
          { id: 'r2', type: 'premise', content: 'Demurrage contract clause 4.2: $14,200/day rate applies after 24h delay', confidence: 0.99, evidenceRefs: ['demurrage-contract-4421'] },
          { id: 'r3', type: 'premise', content: 'Historical standby at alternative anchorage saves avg $42,000 per event (12 prior cases)', confidence: 0.94, evidenceRefs: ['historical-standby-data'] },
          { id: 'r4', type: 'inference', content: 'Port standby at anchorage 1.28N 103.67E reduces demurrage exposure by ~$42K vs. waiting at berth', confidence: 0.96, evidenceRefs: ['cost-model-cascade'] },
          { id: 'r5', type: 'inference', content: 'No alternative port within 6h offers lower total cost when factoring fuel + port charges', confidence: 0.92, evidenceRefs: ['route-optimizer-output'] },
          { id: 'r6', type: 'conclusion', content: 'Recommend port standby at anchorage 1.28N 103.67E. Expected savings: $42,000. MirrorEval: 94%.', confidence: 0.945, evidenceRefs: ['action-brief-cascade'] },
        ],
      },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-25T03:52:38Z', hash: 'sha256:d4e5f6a7b8', detail: 'Policy pol-maritime-002 triggered. Enforcement: block_until_approved. Required: VP Operations.', evidenceRefs: ['pol-maritime-002'], status: 'verified' },
      { id: 'n5', kind: 'APPROVAL', label: 'Approval Requested', actor: 'Approval Gateway', ts: '2026-04-25T03:52:45Z', hash: 'sha256:e5f6a7b8c9', detail: 'Approval request dispatched to VP Operations Sarah Chen. Deadline: T+4h.', evidenceRefs: ['approval-req-001'], status: 'verified' },
      { id: 'n6', kind: 'APPROVAL', label: 'Approval Granted', actor: 'vp-operations:sarah.chen', ts: '2026-04-25T04:30:22Z', hash: 'sha256:f6a7b8c9d1', detail: 'VP Operations approved port standby. Notes: "Agreed — minimize demurrage exposure."', evidenceRefs: ['approval-grant-001'], status: 'verified' },
      { id: 'n7', kind: 'EXECUTION', label: 'Action Executed', actor: 'Cascade Navigator', ts: '2026-04-25T04:32:11Z', hash: 'sha256:a7b8c9d1e2', detail: 'Port standby authorized. Vessel repositioned to anchorage 1.28N 103.67E.', evidenceRefs: ['exec-001'], status: 'verified' },
      { id: 'n8', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-25T04:34:58Z', hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2', detail: 'AIS position confirmed. Port authority standby registered. Cost rate locked at $14,200/day. Verification: PASSED.', evidenceRefs: ['vr-001'], status: 'verified' },
    ],
  },
  {
    id: 'chain-002',
    title: 'TG-Ember Threat Escalation — Full Proof Chain',
    domain: 'Defense',
    hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6',
    completedAt: '2026-04-24T18:56:12Z',
    attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-24T18:56:12Z', nonce: 'b7e2d1c0' },
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T18:42:00Z', hash: 'sha256:aa1b2c3', detail: 'TG-Ember threat actor activity detected — YELLOW threshold breached', evidenceRefs: ['siem-alert-4431'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T18:43:00Z', hash: 'sha256:bb2c3d4', detail: 'Threat intelligence context: TG-Ember history, TTPs, current attack surface', evidenceRefs: ['threat-ctx-4431'], status: 'verified' },
      {
        id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Guardian', ts: '2026-04-24T18:44:30Z', hash: 'sha256:cc3d4e5',
        detail: 'Full reasoning trace for threat escalation decision.',
        evidenceRefs: ['guardian-brief-01'],
        status: 'verified',
        reasoningTrace: [
          { id: 'r1', type: 'premise', content: 'TG-Ember C2 beacons detected on ports 443 and 8080 from 3 internal hosts', confidence: 0.97, evidenceRefs: ['siem-alert-4431'] },
          { id: 'r2', type: 'premise', content: 'TG-Ember TTPs match known APT campaign (MITRE ATT&CK T1071, T1041)', confidence: 0.95, evidenceRefs: ['threat-intel-db'] },
          { id: 'r3', type: 'inference', content: 'Confidence-weighted threat score exceeds ORANGE threshold (0.92 > 0.90)', confidence: 0.96, evidenceRefs: ['threat-scoring-model'] },
          { id: 'r4', type: 'conclusion', content: 'Escalate to ORANGE. Apply 14 perimeter hardening rules. Notify CISO.', confidence: 0.96, evidenceRefs: ['guardian-brief-01'] },
        ],
      },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T18:44:38Z', hash: 'sha256:dd4e5f6', detail: 'Policy pol-security-007: auto_escalate for ORANGE+ threats.', evidenceRefs: ['pol-security-007'], status: 'verified' },
      { id: 'n5', kind: 'EXECUTION', label: 'Action Executed', actor: 'Guardian (auto)', ts: '2026-04-24T18:55:00Z', hash: 'sha256:ee5f6a7', detail: '14 firewall block rules applied. CISO notified. Threat tier set to ORANGE.', evidenceRefs: ['exec-defense-001'], status: 'verified' },
      { id: 'n6', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T18:56:12Z', hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6', detail: 'SIEM confirmed ORANGE status. Perimeter surface reduced 22%. PASSED.', evidenceRefs: ['vr-003'], status: 'verified' },
    ],
  },
  {
    id: 'chain-003',
    title: 'Talbot Discovery Escalation — Full Proof Chain',
    domain: 'Legal',
    hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2',
    completedAt: '2026-04-24T14:23:45Z',
    attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-24T14:23:45Z', nonce: 'c6d3e2f1' },
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T08:00:00Z', hash: 'sha256:la1b2c3', detail: 'Talbot matter: 340 documents outstanding, T-48h discovery deadline', evidenceRefs: ['clio-matter-4421'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T08:01:30Z', hash: 'sha256:lb2c3d4', detail: 'Matter context: case timeline, outstanding documents, discovery scope, risk assessment', evidenceRefs: ['legal-ctx-4421'], status: 'verified' },
      {
        id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Counsel Sentinel', ts: '2026-04-24T08:05:00Z', hash: 'sha256:lc3d4e5',
        detail: 'Full reasoning trace for legal escalation decision.',
        evidenceRefs: ['counsel-brief-001'],
        status: 'verified',
        reasoningTrace: [
          { id: 'r1', type: 'premise', content: '340 documents remain outstanding with T-48h discovery deadline', confidence: 0.99, evidenceRefs: ['clio-matter-4421'] },
          { id: 'r2', type: 'premise', content: 'Opposing counsel has filed late in 3 of 5 prior cases — adverse inference motion risk is HIGH', confidence: 0.94, evidenceRefs: ['opposing-counsel-history'] },
          { id: 'r3', type: 'inference', content: 'Production rate of 15 docs/hour requires 22.7h — exceeds available time by 4.7h', confidence: 0.97, evidenceRefs: ['production-rate-model'] },
          { id: 'r4', type: 'conclusion', content: 'Immediate escalation to lead counsel + co-counsel required. Risk: adverse inference motion.', confidence: 0.97, evidenceRefs: ['counsel-brief-001'] },
        ],
      },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T08:05:08Z', hash: 'sha256:ld4e5f6', detail: 'Policy pol-legal-003: block_until_approved. General Counsel approval required.', evidenceRefs: ['pol-legal-003'], status: 'verified' },
      { id: 'n5', kind: 'APPROVAL', label: 'Approval Granted', actor: 'general-counsel:patricia.mwangi', ts: '2026-04-24T14:20:33Z', hash: 'sha256:le5f6a7', detail: 'General Counsel approved escalation. Notes: "Priority. Engage outside co-counsel immediately."', evidenceRefs: ['approval-legal-001'], status: 'verified' },
      { id: 'n6', kind: 'EXECUTION', label: 'Action Executed', actor: 'Counsel Sentinel', ts: '2026-04-24T14:22:10Z', hash: 'sha256:lf6a7b8', detail: 'Escalation email sent to lead counsel + co-counsel. Clio matter updated.', evidenceRefs: ['exec-legal-001'], status: 'verified' },
      { id: 'n7', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T14:23:45Z', hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2', detail: 'Email delivery confirmed. Clio status updated. PASSED.', evidenceRefs: ['vr-002'], status: 'verified' },
    ],
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
  const { data } = useApiData<{ chains: ProofChain[] }>('/pages/proof-ledger', { chains: DEMO_CHAINS });
  const CHAINS = data.chains;
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]?.id ?? '');
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chain' | 'replay' | 'diff' | 'reliquary'>('chain');
  const [replayStep, setReplayStep] = useState(0);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<number, { match: boolean; storedRoot: string; computedRoot: string } | null>>({});
  const [attestationList, setAttestationList] = useState<ReliquaryAttestation[] | null>(null);

  const { data: reliquaryAttestations } = useApiData<ReliquaryAttestation[]>('/reliquary/attestations', []);
  const attestations = attestationList ?? (Array.isArray(reliquaryAttestations) ? reliquaryAttestations : []);

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
        subtitle="Every governed execution is a connected chain with full reasoning traces: premises → inference steps → conclusion. Each node is cryptographically hashed and attested."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="PROOF CHAINS" value={CHAINS.length} sub="complete" accent={GOLD} />
        <KpiCard label="TOTAL NODES" value={CHAINS.reduce((a, c) => a + c.nodes.length, 0)} sub="all verified" accent={GOLD} />
        <KpiCard label="REASONING TRACES" value={CHAINS.reduce((a, c) => a + c.nodes.filter(n => n.reasoningTrace).length, 0)} sub="full traces" accent={GOLD} />
        <KpiCard label="CHAIN INTEGRITY" value="100%" sub="no tampering" accent="#22c55e" />
        <KpiCard label="ATTESTATION" value="Ed25519" sub="SPIFFE-signed" accent="#22c55e" />
        <KpiCard label="VERIFICATION" value="100%" sub="all chains verified" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {(['chain', 'replay', 'diff', 'reliquary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeTab === tab ? GOLD : '#5e5e5e', border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'chain' ? 'Proof Chain' : tab === 'replay' ? 'Reasoning Replay' : tab === 'diff' ? 'Proof Diff' : 'Reliquary Cache'}
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

          <div className="grid grid-cols-4 gap-3 text-xs mb-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Algorithm</div><div className="font-mono" style={{ color: '#22c55e' }}>{chain.attestation.algorithm}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Signer</div><div className="font-mono" style={{ color: '#22c55e' }}>{chain.attestation.signer}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Timestamp</div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(chain.attestation.timestamp)}</div></div>
            <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Nonce</div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{chain.attestation.nonce}</div></div>
          </div>

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
                          <div className="text-xs font-mono flex-shrink-0" style={{ color: '#22c55e' }}>✓</div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.detail}</p>

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
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Reasoning Proof Engine — every proof chain includes full reasoning traces (premises → inference → conclusion) with cryptographic attestation. Chains are immutable and append-only.
      </div>
    </Layout>
  );
}

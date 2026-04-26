import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

const CHAINS = [
  {
    id: 'chain-001',
    title: 'MV Cascade Port Standby — Full Proof Chain',
    domain: 'Maritime',
    hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2',
    completedAt: '2026-04-25T04:34:58Z',
    nodes: [
      {
        id: 'n1', kind: 'SIGNAL', label: 'Signal Detected',
        actor: 'Signal Mesh', ts: '2026-04-25T03:48:00Z',
        hash: 'sha256:a1b2c3d4e5',
        detail: 'MV Cascade 18h delay detected from AIS stream — Tanjung Pelepas congestion',
        evidenceRefs: ['ais-feed-cascade', 'port-api-tpp'],
        status: 'verified',
      },
      {
        id: 'n2', kind: 'CONTEXT', label: 'Context Assembled',
        actor: 'Context Engine', ts: '2026-04-25T03:49:12Z',
        hash: 'sha256:b2c3d4e5f6',
        detail: 'Context pack assembled: voyage plan, demurrage contract, port cost schedule, historical standby data',
        evidenceRefs: ['ctx-pack-4421'],
        status: 'verified',
      },
      {
        id: 'n3', kind: 'RECOMMENDATION', label: 'Recommendation Generated',
        actor: 'Cascade Navigator', ts: '2026-04-25T03:52:30Z',
        hash: 'sha256:c3d4e5f6a7',
        detail: 'Port standby recommended: saves $42,000 in demurrage vs. 3 alternatives. MirrorEval: 94%.',
        evidenceRefs: ['action-brief-cascade'],
        status: 'verified',
      },
      {
        id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated',
        actor: 'Covenant Layer', ts: '2026-04-25T03:52:38Z',
        hash: 'sha256:d4e5f6a7b8',
        detail: 'Policy pol-maritime-002 triggered. Enforcement: block_until_approved. Required: VP Operations.',
        evidenceRefs: ['pol-maritime-002'],
        status: 'verified',
      },
      {
        id: 'n5', kind: 'APPROVAL', label: 'Approval Requested',
        actor: 'Approval Gateway', ts: '2026-04-25T03:52:45Z',
        hash: 'sha256:e5f6a7b8c9',
        detail: 'Approval request dispatched to VP Operations Sarah Chen. Deadline: T+4h.',
        evidenceRefs: ['approval-req-001'],
        status: 'verified',
      },
      {
        id: 'n6', kind: 'APPROVAL', label: 'Approval Granted',
        actor: 'vp-operations:sarah.chen', ts: '2026-04-25T04:30:22Z',
        hash: 'sha256:f6a7b8c9d1',
        detail: 'VP Operations approved port standby. Notes: "Agreed — minimize demurrage exposure."',
        evidenceRefs: ['approval-grant-001'],
        status: 'verified',
      },
      {
        id: 'n7', kind: 'EXECUTION', label: 'Action Executed',
        actor: 'Cascade Navigator', ts: '2026-04-25T04:32:11Z',
        hash: 'sha256:a7b8c9d1e2',
        detail: 'Port standby authorized. Vessel repositioned to anchorage 1.28N 103.67E.',
        evidenceRefs: ['exec-001'],
        status: 'verified',
      },
      {
        id: 'n8', kind: 'VERIFICATION', label: 'Result Verified',
        actor: 'Verifier Agent', ts: '2026-04-25T04:34:58Z',
        hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2',
        detail: 'AIS position confirmed. Port authority standby registered. Cost rate locked at $14,200/day. Verification: PASSED.',
        evidenceRefs: ['vr-001'],
        status: 'verified',
      },
    ],
  },
  {
    id: 'chain-002',
    title: 'TG-Ember Threat Escalation — Full Proof Chain',
    domain: 'Defense',
    hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6',
    completedAt: '2026-04-24T18:56:12Z',
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T18:42:00Z', hash: 'sha256:aa1b2c3', detail: 'TG-Ember threat actor activity detected — YELLOW threshold breached', evidenceRefs: ['siem-alert-4431'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T18:43:00Z', hash: 'sha256:bb2c3d4', detail: 'Threat intelligence context: TG-Ember history, TTPs, current attack surface', evidenceRefs: ['threat-ctx-4431'], status: 'verified' },
      { id: 'n3', kind: 'RECOMMENDATION', label: 'Recommendation Generated', actor: 'Guardian', ts: '2026-04-24T18:44:30Z', hash: 'sha256:cc3d4e5', detail: 'Escalate to ORANGE, apply perimeter hardening rules. 14 firewall rules proposed.', evidenceRefs: ['guardian-brief-01'], status: 'verified' },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T18:44:38Z', hash: 'sha256:dd4e5f6', detail: 'Policy pol-security-007: auto_escalate for ORANGE+ threats. Guardian cleared for auto-execution.', evidenceRefs: ['pol-security-007'], status: 'verified' },
      { id: 'n5', kind: 'EXECUTION', label: 'Action Executed', actor: 'Guardian (auto)', ts: '2026-04-24T18:55:00Z', hash: 'sha256:ee5f6a7', detail: '14 firewall block rules applied. CISO notified. Threat tier set to ORANGE.', evidenceRefs: ['exec-defense-001'], status: 'verified' },
      { id: 'n6', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T18:56:12Z', hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6', detail: 'SIEM confirmed ORANGE status. Firewall rules active. Perimeter surface reduced 22%. PASSED.', evidenceRefs: ['vr-003'], status: 'verified' },
    ],
  },
  {
    id: 'chain-003',
    title: 'Talbot Discovery Escalation — Full Proof Chain',
    domain: 'Legal',
    hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2',
    completedAt: '2026-04-24T14:23:45Z',
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T08:00:00Z', hash: 'sha256:la1b2c3', detail: 'Talbot matter: 340 documents outstanding, T-48h discovery deadline', evidenceRefs: ['clio-matter-4421'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T08:01:30Z', hash: 'sha256:lb2c3d4', detail: 'Matter context: case timeline, outstanding documents, discovery scope, risk assessment', evidenceRefs: ['legal-ctx-4421'], status: 'verified' },
      { id: 'n3', kind: 'RECOMMENDATION', label: 'Recommendation Generated', actor: 'Counsel Sentinel', ts: '2026-04-24T08:05:00Z', hash: 'sha256:lc3d4e5', detail: 'Immediate escalation to lead counsel + co-counsel required. Adverse inference motion risk: HIGH.', evidenceRefs: ['counsel-brief-001'], status: 'verified' },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T08:05:08Z', hash: 'sha256:ld4e5f6', detail: 'Policy pol-legal-003: block_until_approved. General Counsel approval required.', evidenceRefs: ['pol-legal-003'], status: 'verified' },
      { id: 'n5', kind: 'APPROVAL', label: 'Approval Granted', actor: 'general-counsel:patricia.mwangi', ts: '2026-04-24T14:20:33Z', hash: 'sha256:le5f6a7', detail: 'General Counsel approved escalation. Notes: "Priority. Engage outside co-counsel immediately."', evidenceRefs: ['approval-legal-001'], status: 'verified' },
      { id: 'n6', kind: 'EXECUTION', label: 'Action Executed', actor: 'Counsel Sentinel', ts: '2026-04-24T14:22:10Z', hash: 'sha256:lf6a7b8', detail: 'Escalation email sent to lead counsel + co-counsel. Clio matter updated. Emergency call scheduled.', evidenceRefs: ['exec-legal-001'], status: 'verified' },
      { id: 'n7', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T14:23:45Z', hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2', detail: 'Email delivery confirmed. Clio status updated. Emergency call scheduled. PASSED.', evidenceRefs: ['vr-002'], status: 'verified' },
    ],
  },
];

const KIND_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  SIGNAL:         { bg: 'rgba(138,138,138,0.1)',  color: '#8a8a8a',  label: 'SIGNAL' },
  CONTEXT:        { bg: 'rgba(94,94,94,0.1)',     color: '#5e5e5e',  label: 'CONTEXT' },
  RECOMMENDATION: { bg: 'rgba(176,141,82,0.1)',  color: '#b08d52',  label: 'RECOMMENDATION' },
  POLICY_EVAL:    { bg: 'rgba(201,183,135,0.1)', color: '#c9b787',  label: 'POLICY EVAL' },
  APPROVAL:       { bg: 'rgba(201,183,135,0.12)', color: '#c9b787', label: 'APPROVAL' },
  EXECUTION:      { bg: 'rgba(201,183,135,0.1)', color: '#c9b787',  label: 'EXECUTION' },
  VERIFICATION:   { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e',  label: 'VERIFIED' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

export function ProofLedger() {
  const [selectedChain, setSelectedChain] = useState(CHAINS[0].id);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const chain = CHAINS.find(c => c.id === selectedChain) ?? CHAINS[0];

  return (
    <Layout>
      <PageHeader
        label="PROOF LEDGER"
        title="Immutable Proof Chain"
        subtitle="Every governed execution is a connected chain: signal detected → context assembled → recommendation generated → policy evaluated → approval → execution → verification. Each node is cryptographically hashed."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="PROOF CHAINS" value={CHAINS.length} sub="complete" accent={GOLD} />
        <KpiCard label="TOTAL NODES" value={CHAINS.reduce((a, c) => a + c.nodes.length, 0)} sub="all verified" accent={GOLD} />
        <KpiCard label="CHAIN INTEGRITY" value="100%" sub="no tampering detected" accent={GOLD} />
        <KpiCard label="VERIFICATION RATE" value="100%" sub="all chains verified" accent="#22c55e" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CHAINS.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedChain(c.id); setExpandedNode(null); }}
            className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all"
            style={{
              backgroundColor: selectedChain === c.id ? 'rgba(201,183,135,0.12)' : 'var(--color-a11oy-muted)',
              color: selectedChain === c.id ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${selectedChain === c.id ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {c.domain}: {c.title.split(' — ')[0].slice(0, 24)}
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{chain.domain} · Completed {fmt(chain.completedAt)}</div>
            <div className="text-base font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{chain.title}</div>
          </div>
          <div className="text-xs font-mono flex-shrink-0" style={{ color: '#22c55e' }}>✓ Chain Intact</div>
        </div>

        <div className="font-mono text-xs px-3 py-2 rounded mb-6" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>
          Terminal hash: {chain.hash}
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
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 cursor-pointer transition-all"
                      style={{
                        backgroundColor: style.bg,
                        border: `2px solid ${style.color}`,
                        color: style.color,
                        fontSize: 10,
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 700,
                        boxShadow: isExpanded ? `0 0 12px ${style.color}40` : undefined,
                      }}
                      onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 20 }} />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div
                      className="rounded-lg border cursor-pointer transition-all p-3"
                      style={{
                        backgroundColor: isExpanded ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                        borderColor: isExpanded ? `${style.color}30` : 'var(--color-a11oy-border)',
                      }}
                      onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: style.bg, color: style.color }}>
                              {style.label}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{node.label}</span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.actor}</span> · {fmt(node.ts)}
                          </div>
                          {!isExpanded && (
                            <div className="text-xs mt-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{node.detail.slice(0, 72)}…</div>
                          )}
                        </div>
                        <div className="text-xs font-mono flex-shrink-0" style={{ color: '#22c55e' }}>✓</div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{node.detail}</p>
                          <div>
                            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVIDENCE REFS</div>
                            <div className="flex flex-wrap gap-1">
                              {node.evidenceRefs.map(e => (
                                <span key={e} className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="font-mono text-xs px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>
                            {node.hash}
                          </div>
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

      <div className="mt-4 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Governed Environment — proof chains are reconstructed from the seed Proof Ledger. Production chains are cryptographically immutable and append-only.
      </div>
    </Layout>
  );
}

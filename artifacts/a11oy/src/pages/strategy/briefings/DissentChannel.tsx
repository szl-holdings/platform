import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

interface DissentEntry {
  id: string;
  briefRef: string;
  signalHeadline: string;
  dissenter: string;
  role: string;
  dissent: string;
  proofChainRef: string;
  status: 'open' | 'resolved' | 'escalated';
  ts: string;
  resolution?: string;
}

const DISSENTS: DissentEntry[] = [
  { id: 'd1', briefRef: 'br-001', signalHeadline: 'Tanjung Pelepas port standby recommended', dissenter: 'Sarah Chen', role: 'VP Operations', dissent: 'The port congestion score of 8.2 is within historical norms for Q2. I recommend continuing to the port and reassessing in 6h rather than ordering standby now.', proofChainRef: 'chain-044', status: 'resolved', ts: '2026-05-05T04:45Z', resolution: 'Dissent reviewed by alignment-review. Agent re-ran with extended horizon. Standby confirmed at 04:52 UTC based on updated 18h delay forecast.' },
  { id: 'd2', briefRef: 'br-038', signalHeadline: 'Contract force majeure clause invoked', dissenter: 'James Liu', role: 'General Counsel', dissent: 'The agent assessment of force majeure applicability is overly broad. Port congestion alone does not meet the "Acts of God" standard in Clause 4.2 of this contract. Recommend legal counsel review before invocation.', proofChainRef: 'chain-041', status: 'escalated', ts: '2026-05-04T14:22Z' },
  { id: 'd3', briefRef: 'br-042', signalHeadline: 'Guardian NOC: auto-remediation approved', dissenter: 'Alex Park', role: 'CISO', dissent: 'The auto-remediation scope was broader than the Covenant Policy allows. Action included network policy changes that should require human approval per Constitution C-HUMAN-OVERSIGHT.', proofChainRef: 'chain-035', status: 'open', ts: '2026-05-04T09:15Z' },
];

const STATUS_COLORS = { open: GOLD, resolved: '#22c55e', escalated: '#f87171' };

export function DissentChannel() {
  const [showNew, setShowNew] = useState(false);
  const [newBrief, setNewBrief] = useState('');
  const [newDissent, setNewDissent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!newDissent.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setShowNew(false); setSubmitted(false); setNewBrief(''); setNewDissent(''); }, 2500);
  }

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / DISSENT"
        title="Dissent Channel"
        subtitle="Record formal disagreements with agent assessments. Every dissent is linked to a Proof Chain node and reviewed during alignment audits. Dissents cannot be deleted — only resolved or escalated."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="OPEN DISSENTS" value={String(DISSENTS.filter(d => d.status === 'open').length)} sub="awaiting review" accent={GOLD} />
        <KpiCard label="ESCALATED" value={String(DISSENTS.filter(d => d.status === 'escalated').length)} sub="alignment review" accent="#f87171" />
        <KpiCard label="RESOLVED" value={String(DISSENTS.filter(d => d.status === 'resolved').length)} sub="with resolution" accent="#22c55e" />
        <KpiCard label="IMMUTABLE RECORD" value="All dissents" sub="preserved forever" accent={GOLD} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Dissent Register</div>
        <button type="button" onClick={() => setShowNew(true)}
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
          style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
          + File Dissent
        </button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>File a Formal Dissent</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>BRIEF / SIGNAL REFERENCE</label>
              <input type="text" value={newBrief} onChange={e => setNewBrief(e.target.value)} placeholder="e.g. br-045 or signal headline"
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
            </div>
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DISSENT STATEMENT</label>
              <textarea value={newDissent} onChange={e => setNewDissent(e.target.value)} placeholder="Describe your disagreement with the agent assessment. Be specific about which claim or recommendation you dispute, and provide your alternative assessment."
                rows={4}
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none resize-none"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
            </div>
            <div className="p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)' }}>
              <div style={{ color: GOLD }}>This dissent will be:</div>
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>• Linked to the Proof Chain of the referenced brief</div>
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>• Immutably recorded — cannot be deleted, only resolved or escalated</div>
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>• Reviewed during the next alignment audit</div>
            </div>
            <div className="flex gap-2">
              {!submitted ? (
                <button type="button" onClick={submit}
                  className="flex-1 py-2 rounded text-xs font-mono"
                  style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
                  File Dissent
                </button>
              ) : (
                <div className="flex-1 py-2 text-center text-xs font-mono" style={{ color: '#22c55e' }}>✓ Dissent filed and linked to Proof Chain</div>
              )}
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded text-xs font-mono"
                style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {DISSENTS.map(d => {
          const sc = STATUS_COLORS[d.status];
          return (
            <div key={d.id} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: d.status === 'escalated' ? 'rgba(248,113,113,0.2)' : 'var(--color-a11oy-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{d.dissenter}</span>
                    <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.role}</span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: GOLD }}>{d.briefRef} · {d.proofChainRef}</div>
                </div>
                <span className="text-xs font-mono" style={{ color: sc }}>{d.status.toUpperCase()}</span>
              </div>
              <div className="text-xs mb-2 italic" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Re: {d.signalHeadline}</div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{d.dissent}</p>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Filed: {new Date(d.ts).toLocaleString()}</div>
              {d.resolution && (
                <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="font-mono mb-1" style={{ color: '#22c55e' }}>Resolution</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.resolution}</div>
                </div>
              )}
              {d.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button type="button" className="px-3 py-1 rounded text-xs font-mono"
                    style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer' }}>
                    Resolve
                  </button>
                  <button type="button" className="px-3 py-1 rounded text-xs font-mono"
                    style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer' }}>
                    Escalate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

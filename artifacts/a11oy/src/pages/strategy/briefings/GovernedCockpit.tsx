import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, Card } from '../../../components/ui';

const GOLD = '#c9b787';

const PENDING_DECISIONS = [
  { id: 'dec-1', headline: 'Order port standby for MV Pacific Grace', domain: 'Maritime', urgency: 'high', confidence: 91, lift: 38000, expiry: '14:00 UTC', context: 'Port congestion at Port Klang at 9.1/10. Estimated delay: 22h. Alternative anchorage available 8nm NW. Demurrage rate: $24,000/day.' },
  { id: 'dec-2', headline: 'Invoke force majeure on Charter Party CP-2024-099', domain: 'Legal', urgency: 'high', confidence: 87, lift: 92000, expiry: '15:30 UTC', context: 'Clause 4.2 may apply given sustained port congestion >24h. Counsel Sentinel confidence: 87%. General Counsel dissent filed — recommend review.' },
  { id: 'dec-3', headline: 'Auto-approve escalated NOC alert for SLO remediation', domain: 'Security', urgency: 'medium', confidence: 96, lift: 28000, expiry: '16:00 UTC', context: 'P2 alert: memory exhaustion on compute-node-22. Auto-remediation would restart affected pods. 0 user impact expected. Guardian confidence: 96%.' },
];

export function GovernedCockpit() {
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const pending = PENDING_DECISIONS.filter(d => !approved.includes(d.id) && !rejected.includes(d.id));
  const URGENCY_COLORS = { high: '#f87171', medium: GOLD, low: '#22c55e' };

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / GOVERNED COCKPIT"
        title="Governed Briefing Cockpit"
        subtitle="Full-screen executive mode for time-sensitive decisions surfaced from intelligence briefs. Decisions include agent confidence, Covenant Lift $, Proof Chain reference, and an expiry window."
        status="LIVE"
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-400" /> <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>High urgency: {PENDING_DECISIONS.filter(d => d.urgency === 'high').length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} /> <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Medium: {PENDING_DECISIONS.filter(d => d.urgency === 'medium').length}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: '#22c55e' }}>✓ Approved: {approved.length}</span>
          <span className="text-xs" style={{ color: '#f87171' }}>✗ Rejected: {rejected.length}</span>
          <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>◎ Pending: {pending.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {PENDING_DECISIONS.map(dec => {
          const isApproved = approved.includes(dec.id);
          const isRejected = rejected.includes(dec.id);
          const uc = URGENCY_COLORS[dec.urgency as keyof typeof URGENCY_COLORS];
          return (
            <div key={dec.id} className="rounded-lg border transition-colors"
              style={{
                backgroundColor: isApproved ? 'rgba(34,197,94,0.04)' : isRejected ? 'rgba(248,113,113,0.04)' : 'var(--color-a11oy-card)',
                borderColor: isApproved ? 'rgba(34,197,94,0.2)' : isRejected ? 'rgba(248,113,113,0.2)' : dec.urgency === 'high' ? 'rgba(248,113,113,0.2)' : 'var(--color-a11oy-border)',
              }}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${uc}18`, color: uc }}>{dec.urgency.toUpperCase()}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{dec.domain}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Expires: {dec.expiry}</span>
                    </div>
                    <div className="text-base font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{dec.headline}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold" style={{ color: '#22c55e' }}>+${dec.lift.toLocaleString()}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Covenant Lift $</div>
                    <div className="text-xs mt-0.5" style={{ color: GOLD }}>⚡ {dec.confidence}% confidence</div>
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{dec.context}</p>

                {!isApproved && !isRejected ? (
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => setApproved(prev => [...prev, dec.id])}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer' }}>
                      ✓ Approve
                    </button>
                    <button type="button"
                      onClick={() => setRejected(prev => [...prev, dec.id])}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer' }}>
                      ✗ Reject
                    </button>
                    <button type="button"
                      className="px-4 py-3 rounded-lg text-sm transition-colors"
                      style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer' }}>
                      ⚖ Dissent
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-sm font-medium" style={{ color: isApproved ? '#22c55e' : '#f87171' }}>
                    {isApproved ? '✓ Approved — Proof Chain node recorded' : '✗ Rejected — Agent will not execute'}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-medium mb-1" style={{ color: '#22c55e' }}>All decisions actioned</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {approved.length} approved · {rejected.length} rejected · Total Covenant Lift $: ${PENDING_DECISIONS.filter(d => approved.includes(d.id)).reduce((s, d) => s + d.lift, 0).toLocaleString()}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

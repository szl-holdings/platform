import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

const BRIEF_DATE = 'May 5, 2026 · 06:00 UTC';

const SIGNALS = [
  { id: 's1', domain: 'Maritime', headline: 'Tanjung Pelepas port congestion elevated to 8.2/10 — avg delay 18h', priority: 'high', confidence: 94, source: 'MarineTraffic + Port Authority RSS', covenantLift: 42000, action: 'Port standby ordered for MV Cascade — approved by VP Ops 04:30 UTC' },
  { id: 's2', domain: 'Legal', headline: 'Charter Party CP-2024-088 laytime clause triggered — 72h free time expires 14:00 UTC', priority: 'high', confidence: 99, source: 'Counsel Sentinel contract parsing', covenantLift: 38000, action: 'Demurrage notice drafted — pending counsel review' },
  { id: 's3', domain: 'Compliance', headline: 'OFAC updated SDN list — 3 new maritime entities added. No exposure in current fleet.', priority: 'medium', confidence: 97, source: 'OFAC API · Sanctions screen auto-run', covenantLift: 180000, action: 'Fleet screened — clean. Next auto-screen: 06:00 UTC tomorrow.' },
  { id: 's4', domain: 'Security', headline: 'Guardian NOC: 18 P1 alerts auto-remediated — 99.97% SLO maintained', priority: 'low', confidence: 96, source: 'Guardian NOC telemetry', covenantLift: 28000, action: 'No human intervention required. 1 P2 alert under monitoring.' },
  { id: 's5', domain: 'Strategy', headline: 'Competitive Atlas: 2 maritime AI competitors announced funding rounds. DeepDive report queued.', priority: 'medium', confidence: 82, source: 'Competitive Atlas signal scan', covenantLift: 0, action: 'Full competitive analysis brief scheduled 12:00 UTC.' },
];

const PRIORITY_COLORS = { high: '#f87171', medium: GOLD, low: '#22c55e' };
const DOMAIN_COLORS: Record<string, string> = { Maritime: '#4d8fcc', Legal: '#9b7cc8', Compliance: GOLD, Security: '#f87171', Strategy: '#22c55e' };

export function TodaysBrief() {
  const [expanded, setExpanded] = useState<string | null>('s1');

  const totalLift = SIGNALS.reduce((s, sig) => s + sig.covenantLift, 0);
  const highPriority = SIGNALS.filter(s => s.priority === 'high').length;

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / TODAY"
        title="Today's Intelligence Brief"
        subtitle={BRIEF_DATE}
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SIGNALS" value={String(SIGNALS.length)} sub="today" accent={GOLD} />
        <KpiCard label="HIGH PRIORITY" value={String(highPriority)} sub="require attention" accent={highPriority > 0 ? '#f87171' : GOLD} />
        <KpiCard label="DECISIONS MADE" value="3" sub="from brief" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="from brief actions" accent="#22c55e" />
      </div>

      <div className="space-y-3">
        {SIGNALS.map(sig => {
          const pc = PRIORITY_COLORS[sig.priority as keyof typeof PRIORITY_COLORS];
          const dc = DOMAIN_COLORS[sig.domain] ?? GOLD;
          const isOpen = expanded === sig.id;

          return (
            <div key={sig.id} className="rounded-lg border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isOpen ? 'rgba(201,183,135,0.3)' : sig.priority === 'high' ? 'rgba(248,113,113,0.2)' : 'var(--color-a11oy-border)' }}
              onClick={() => setExpanded(isOpen ? null : sig.id)}>
              <div className="flex items-start gap-3 p-4">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: pc }} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: `${dc}18`, color: dc }}>{sig.domain}</span>
                      <span className="text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sig.headline}</span>
                    </div>
                    <div className="text-right shrink-0">
                      {sig.covenantLift > 0 && <div className="text-xs" style={{ color: '#22c55e' }}>+${sig.covenantLift.toLocaleString()}</div>}
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>⚡ {sig.confidence}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{ borderColor: 'var(--color-a11oy-border)' }}
                  onClick={e => e.stopPropagation()}>
                  <div>
                    <div className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Source</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{sig.source}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent Action</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{sig.action}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                      View Proof Chain
                    </button>
                    <button type="button" className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer' }}>
                      Record Dissent
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card className="mt-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Brief Summary — AI Synthesis</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Today's brief covers 5 signals across Maritime, Legal, Compliance, Security, and Strategy domains. Two high-priority items require immediate attention: MV Cascade port standby (already actioned, $42k lift) and Charter Party laytime expiry (pending counsel). Compliance confirms clean fleet against updated OFAC SDN list — $180k in prevented exposure. Overall Covenant Lift $: <span style={{ color: '#22c55e' }}>${(totalLift / 1000).toFixed(0)}k</span>.
        </p>
      </Card>
    </Layout>
  );
}

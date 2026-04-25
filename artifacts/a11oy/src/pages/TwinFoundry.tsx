import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const TWINS = [
  {
    id: 'twin-cascade', name: 'MV Cascade', type: 'Vessel', status: 'live', fidelity: 94,
    lastSync: '2m ago', signals: 12, activeWorkcells: 1,
    state: { location: 'Port Houston — Berth 7', cargo: '2,400 TEU', delay: '38h', nextETA: '2026-04-27T08:00Z' },
    domain: 'Maritime',
  },
  {
    id: 'twin-talbot', name: 'Talbot v. Meridian', type: 'Legal Matter', status: 'live', fidelity: 98,
    lastSync: '5m ago', signals: 8, activeWorkcells: 1,
    state: { phase: 'Discovery', deadline: '2026-04-27T23:59Z', docsOutstanding: 3, lead: 'Patricia Mwangi' },
    domain: 'Legal',
  },
  {
    id: 'twin-q2pipeline', name: 'Q2 Enterprise Pipeline', type: 'Revenue Portfolio', status: 'live', fidelity: 87,
    lastSync: '8m ago', signals: 18, activeWorkcells: 1,
    state: { totalDeals: 24, atRisk: 3, forecastedARR: '$4.2M', velocity: '-22%' },
    domain: 'Revenue',
  },
  {
    id: 'twin-plano', name: 'Plano Portfolio', type: 'Real Estate', status: 'live', fidelity: 91,
    lastSync: '15m ago', signals: 6, activeWorkcells: 0,
    state: { assets: 14, capRateAvg: '5.82%', capRateDelta: '+18bps', totalValue: '$127M' },
    domain: 'Terra',
  },
  {
    id: 'twin-ember', name: 'TG-Ember Threat Actor', type: 'Threat Intelligence', status: 'live', fidelity: 99,
    lastSync: '1m ago', signals: 9, activeWorkcells: 0,
    state: { tier: 'ORANGE', ttps: 12, lastActivity: '6h ago', posture: 'hardened' },
    domain: 'Defense',
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  Maritime: '#3b82f6', Legal: '#6366f1', Revenue: '#f59e0b',
  Terra: '#10b981', Defense: '#8b5cf6',
};

export function TwinFoundry() {
  return (
    <Layout>
      <PageHeader
        label="TWIN FOUNDRY"
        title="Digital Twin Registry"
        subtitle="Authoritative digital twins for every tracked entity. Each twin maintains current state, signal history, and workcell linkage in real time."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE TWINS" value="5" sub="Across 5 domains" accent="#10b981" />
        <KpiCard label="AVG FIDELITY" value="93.8%" sub="State accuracy" accent="#3b82f6" />
        <KpiCard label="TOTAL SIGNALS" value="53" sub="Across all twins" accent="#f59e0b" />
        <KpiCard label="LAST SYNC" value="< 2m" sub="Most recent" accent="#b08d52" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TWINS.map(twin => (
          <Card key={twin.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {twin.type} · {twin.domain}
                </div>
                <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{twin.name}</div>
              </div>
              <StatusPill status="LIVE" />
            </div>

            <div className="h-1 rounded-full mb-3" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${twin.fidelity}%`, backgroundColor: DOMAIN_COLORS[twin.domain] ?? '#9bacc4' }}
              />
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {twin.fidelity}% fidelity · synced {twin.lastSync}
            </div>

            <div className="space-y-1 text-xs mb-3">
              {Object.entries(twin.state).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k}</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              <span>{twin.signals} signals</span>
              <span>{twin.activeWorkcells} workcell{twin.activeWorkcells !== 1 ? 's' : ''}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Twin state is illustrative demo data. Real twins are maintained by live connector feeds.
      </div>
    </Layout>
  );
}

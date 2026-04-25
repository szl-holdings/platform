import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityDot, DemoBadge, VerticalBadge } from '../components/ui';

const VERTICALS = [
  { id: 'vessels', label: 'Vessels Maritime', color: '#3b82f6', signals: 12, active: 4, rate: '98.2%' },
  { id: 'counsel', label: 'Counsel Legal', color: '#6366f1', signals: 8, active: 2, rate: '99.1%' },
  { id: 'lyte', label: 'Lyte Revenue', color: '#f59e0b', signals: 18, active: 3, rate: '97.8%' },
  { id: 'terra', label: 'Terra Real Estate', color: '#10b981', signals: 6, active: 1, rate: '99.5%' },
  { id: 'aegis', label: 'Aegis Defense', color: '#8b5cf6', signals: 9, active: 2, rate: '99.9%' },
  { id: 'carlota', label: 'Carlota Jo', color: '#ec4899', signals: 4, active: 0, rate: '100%' },
  { id: 'core', label: 'Alloy Core', color: '#b08d52', signals: 5, active: 0, rate: '100%' },
];

const RECENT_SIGNALS = [
  { id: 'sig-0a1', severity: 'critical' as const, title: 'MV Cascade ETA deviation — 38h delay', domain: 'Vessels Maritime', color: '#3b82f6', ts: '04:12 UTC' },
  { id: 'sig-0b2', severity: 'high' as const, title: 'Discovery deadline breach risk — Talbot matter', domain: 'Counsel Legal', color: '#6366f1', ts: '02:45 UTC' },
  { id: 'sig-0c3', severity: 'high' as const, title: 'Revenue pipeline velocity —22%', domain: 'Lyte Revenue', color: '#f59e0b', ts: '01:30 UTC' },
  { id: 'sig-0d4', severity: 'medium' as const, title: 'Cap rate expansion — Plano portfolio', domain: 'Terra Real Estate', color: '#10b981', ts: '00:15 UTC' },
  { id: 'sig-0e5', severity: 'medium' as const, title: 'TG-Ember elevated to ORANGE posture', domain: 'Aegis Defense', color: '#8b5cf6', ts: 'yesterday' },
  { id: 'sig-0f6', severity: 'low' as const, title: 'Advisory deck review complete', domain: 'Carlota Jo', color: '#ec4899', ts: 'yesterday' },
];

const LAYERS = [
  { label: 'Ingestion', status: 'ok', latency: '12ms avg' },
  { label: 'Normalization', status: 'ok', latency: '8ms avg' },
  { label: 'Deduplication', status: 'ok', latency: '4ms avg' },
  { label: 'Routing', status: 'ok', latency: '3ms avg' },
  { label: 'Correlation', status: 'ok', latency: '22ms avg' },
];

export function SignalMesh() {
  return (
    <Layout>
      <PageHeader
        label="SIGNAL MESH"
        title="Signal Ingestion & Routing"
        subtitle="The fabric's sensory layer — ingests, normalizes, deduplicates, and routes business signals across all seven enterprise verticals."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="TOTAL SIGNALS" value="62" sub="Last 24h" accent="#3b82f6" />
        <KpiCard label="ACTIVE" value="12" sub="Unresolved" accent="#ef4444" />
        <KpiCard label="AVG LATENCY" value="49ms" sub="End-to-end" accent="#b08d52" />
        <KpiCard label="MESH HEALTH" value="99.2%" sub="Uptime" accent="#10b981" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Vertical Coverage</SectionTitle>
          <div className="flex flex-col gap-2">
            {VERTICALS.map(v => (
              <Card key={v.id}>
                <div className="flex items-center justify-between gap-4">
                  <VerticalBadge vertical={v.label} color={v.color} />
                  <div className="flex items-center gap-6 text-xs font-mono flex-shrink-0">
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{v.signals} signals</span>
                    <span style={{ color: v.active > 0 ? '#f59e0b' : '#10b981' }}>{v.active} active</span>
                    <span style={{ color: '#10b981' }}>{v.rate}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Processing Pipeline</SectionTitle>
          <div className="flex flex-col gap-2 mb-6">
            {LAYERS.map((l, i) => (
              <Card key={l.label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono w-5 text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{i + 1}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{l.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{l.latency}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.status === 'ok' ? '#10b981' : '#ef4444' }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle>Recent Signals</SectionTitle>
          <div className="flex flex-col gap-2">
            {RECENT_SIGNALS.map(s => (
              <div
                key={s.id}
                className="flex items-start gap-3 px-3 py-2 rounded border"
                style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}
              >
                <SeverityDot severity={s.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-2">
                    <VerticalBadge vertical={s.domain} color={s.color} />
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.ts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Signal data is seeded demo content representing illustrative cross-domain operational signals.
      </div>
    </Layout>
  );
}

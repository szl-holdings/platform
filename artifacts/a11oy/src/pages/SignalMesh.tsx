import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityDot, VerticalBadge, SeverityBadge } from '../components/ui';
import { SEED_SIGNALS } from '@workspace/a11oy-fabric';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Alloy Core',
};

const LAYERS = [
  { label: 'Ingestion', status: 'ok', latency: '12ms avg', throughput: '2,400/hr' },
  { label: 'Normalization', status: 'ok', latency: '8ms avg', throughput: '2,400/hr' },
  { label: 'Deduplication', status: 'ok', latency: '4ms avg', throughput: '2,200/hr' },
  { label: 'Routing', status: 'ok', latency: '3ms avg', throughput: '2,200/hr' },
  { label: 'Correlation', status: 'ok', latency: '22ms avg', throughput: '840 graphs/hr' },
];

const SOURCES = [
  { name: 'AIS Vessel Feed', domain: 'Maritime', status: 'demo', rate: '24/hr' },
  { name: 'Port Authority API', domain: 'Maritime', status: 'demo', rate: '8/hr' },
  { name: 'CRM Webhook', domain: 'Revenue', status: 'demo', rate: '36/hr' },
  { name: 'Matter Tracker', domain: 'Legal', status: 'demo', rate: '12/hr' },
  { name: 'OSINT Aggregator', domain: 'Defense', status: 'demo', rate: '48/hr' },
  { name: 'Cap Rate Feed', domain: 'Real Estate', status: 'demo', rate: '4/hr' },
];

export function SignalMesh() {
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = SEED_SIGNALS.filter(s =>
    (filterVertical === 'all' || s.vertical === filterVertical) &&
    (filterSeverity === 'all' || s.severity === filterSeverity)
  );

  const active = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
  const critical = SEED_SIGNALS.filter(s => s.severity === 'critical');

  return (
    <Layout>
      <PageHeader
        label="SIGNAL MESH"
        title="Signal Ingestion & Routing"
        subtitle={`The fabric's sensory layer — ingesting, normalizing, deduplicating, and routing ${SEED_SIGNALS.length} business signals across all 7 enterprise verticals.`}
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL SIGNALS" value={SEED_SIGNALS.length} sub="in mesh" accent="#3b82f6" />
        <KpiCard label="ACTIVE" value={active.length} sub="unresolved" accent="#ef4444" />
        <KpiCard label="CRITICAL" value={critical.length} sub="requires attention" accent="#ef4444" />
        <KpiCard label="MESH HEALTH" value="99.2%" sub="uptime" accent="#10b981" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Vertical coverage + pipeline */}
        <div className="flex flex-col gap-6">
          {/* Vertical Coverage */}
          <div>
            <SectionTitle>Vertical Coverage</SectionTitle>
            <div className="flex flex-col gap-2">
              {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
                const sigs = SEED_SIGNALS.filter(s => s.vertical === id);
                const activeSigs = sigs.filter(s => s.status === 'active' || s.status === 'escalated');
                const color = VERTICAL_COLORS[id] ?? '#9bacc4';
                return (
                  <button
                    key={id}
                    onClick={() => setFilterVertical(filterVertical === id ? 'all' : id)}
                    className="text-left rounded border p-2.5 transition-all"
                    style={{
                      backgroundColor: filterVertical === id ? `${color}08` : 'var(--color-a11oy-card)',
                      borderColor: filterVertical === id ? color : 'var(--color-a11oy-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <VerticalBadge vertical={label} color={color} />
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sigs.length}</span>
                        <span style={{ color: activeSigs.length > 0 ? '#f59e0b' : '#10b981' }}>{activeSigs.length} active</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Processing Pipeline */}
          <div>
            <SectionTitle>Processing Pipeline</SectionTitle>
            <div className="flex flex-col gap-2">
              {LAYERS.map((l, i) => (
                <Card key={l.label}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono w-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{i + 1}</span>
                      <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{l.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{l.latency}</span>
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{l.throughput}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.status === 'ok' ? '#10b981' : '#ef4444' }} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Signal Sources */}
          <div>
            <SectionTitle>Signal Sources</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {SOURCES.map(s => (
                <Card key={s.name} className="text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{s.name}</div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.domain}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono" style={{ color: '#f59e0b' }}>{s.status}</div>
                      <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.rate}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Signal table */}
        <div className="lg:col-span-2">
          {/* Severity filter */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Severity:</span>
            {['all', 'critical', 'high', 'medium', 'low', 'info'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: filterSeverity === s ? 'rgba(59,130,246,0.15)' : 'var(--color-a11oy-muted)',
                  color: filterSeverity === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
            <span className="ml-auto text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} signals</span>
          </div>

          <SectionTitle>Signal Registry ({filtered.length})</SectionTitle>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Sev', 'Vertical', 'Signal', 'Owner', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                    <td className="px-3 py-2"><SeverityDot severity={s.severity} /></td>
                    <td className="px-3 py-2"><VerticalBadge vertical={VERTICAL_LABELS[s.vertical] ?? s.vertical} color={VERTICAL_COLORS[s.vertical] ?? '#9bacc4'} /></td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text)', maxWidth: 220 }}><div className="truncate">{s.title}</div></td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.owner}</td>
                    <td className="px-3 py-2"><SeverityBadge severity={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No signals match the current filter.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

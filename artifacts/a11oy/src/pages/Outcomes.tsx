import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SEED_OUTCOMES, SEED_SIGNALS, SEED_WORKCELLS } from '@workspace/a11oy-fabric';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell,
  BarChart, Bar, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

const GOLD = '#c9b787';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787', 'vessels-maritime': '#8a8a8a', 'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5', 'prism-counsel': '#8a8a8a', 'carlota-jo': '#c9b787', 'alloy-core': '#8a8a8a',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Revenue', 'vessels-maritime': 'Maritime', 'terra-real-estate': 'Real Estate',
  'aegis-defense': 'Defense', 'prism-counsel': 'Legal', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Core',
};
const STATUS_COLORS: Record<string, string> = {
  achieved: '#22c55e', missed: '#ef4444', blocked: '#f97316', in_progress: GOLD, at_risk: '#f97316',
};

const STATUSES = ['all', 'achieved', 'in_progress', 'at_risk', 'blocked', 'missed'];

const KPI_OUTCOMES = [
  { kpi: 'Revenue Impact', a11oy: 840000, label: '$840K recovered ARR', vertical: 'lyte-revenue', action: 'Executive outreach — Meridian, Apex, NovaTech', status: 'in_progress' },
  { kpi: 'Risk Delta', a11oy: -2100000, label: '$2.1M risk exposure reduced', vertical: 'prism-counsel', action: 'Talbot discovery escalation', status: 'achieved' },
  { kpi: 'SLA Adherence', a11oy: 18, label: '18h ETA improvement', vertical: 'vessels-maritime', action: 'Port standby authorization', status: 'achieved' },
  { kpi: 'Cost Efficiency', a11oy: 42000, label: '$42K demurrage avoided', vertical: 'vessels-maritime', action: 'Port standby authorization', status: 'achieved' },
  { kpi: 'Compliance Score', a11oy: 22, label: '22% attack surface reduced', vertical: 'aegis-defense', action: 'TG-Ember perimeter hardening', status: 'achieved' },
  { kpi: 'Cycle Time', a11oy: -65, label: '65% faster review cycle', vertical: 'prism-counsel', action: 'Matter deadline monitoring', status: 'in_progress' },
];

const KPI_RADAR_DATA = KPI_OUTCOMES.map(k => ({
  dimension: k.kpi,
  score: Math.abs(k.a11oy) > 1000000 ? 90 : Math.abs(k.a11oy) > 100000 ? 80 : Math.abs(k.a11oy) > 10000 ? 70 : 60,
}));

const SCATTER_DATA = SEED_OUTCOMES.map((o, i) => ({
  id: o.id,
  title: o.title.slice(0, 32),
  x: 20 + (i * 13) % 70,
  y: 15 + (i * 17) % 75,
  status: o.status,
  vertical: o.vertical,
  owner: o.owner,
}));

function OutcomeScatter({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="x" type="number" domain={[0, 100]} tick={{ fill: '#5e5e5e', fontSize: 9 }} name="Timeline" />
        <YAxis dataKey="y" type="number" domain={[0, 100]} tick={{ fill: '#5e5e5e', fontSize: 9 }} name="Impact" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0]?.payload as (typeof SCATTER_DATA)[0];
            return (
              <div style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, marginBottom: 2 }}>{d.title}</div>
                <div style={{ fontSize: 10, color: '#8a8a8a' }}>{VERTICAL_LABELS[d.vertical] ?? d.vertical} · {d.status.replace(/_/g, ' ')}</div>
              </div>
            );
          }}
        />
        <Scatter
          data={SCATTER_DATA}
          onClick={d => onSelect((d as typeof SCATTER_DATA[0]).id)}
        >
          {SCATTER_DATA.map((d, i) => (
            <Cell key={i} fill={STATUS_COLORS[d.status] ?? GOLD} fillOpacity={0.7} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function KpiRadar() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={KPI_RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5e5e5e', fontSize: 9, fontFamily: 'ui-monospace' }} />
        <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Outcomes() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'graph'>('graph');

  const filtered = SEED_OUTCOMES.filter(o =>
    (filterStatus === 'all' || o.status === filterStatus) &&
    (filterVertical === 'all' || o.vertical === filterVertical)
  );

  const achieved = SEED_OUTCOMES.filter(o => o.status === 'achieved');
  const atRisk = SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'missed');
  const inProgress = SEED_OUTCOMES.filter(o => o.status === 'in_progress');

  const selectedOutcome = selected ? SEED_OUTCOMES.find(o => o.id === selected) : null;

  return (
    <Layout>
      <PageHeader
        label="OUTCOME GRAPH"
        title="Enterprise Outcome Intelligence"
        subtitle="Actions mapped to business KPIs across 6 dimensions: revenue impact, risk delta, SLA adherence, cost efficiency, compliance score, and cycle time."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL OUTCOMES" value={SEED_OUTCOMES.length} sub="in registry" accent={GOLD} />
        <KpiCard label="ACHIEVED" value={achieved.length} sub="confirmed" accent="#22c55e" />
        <KpiCard label="AT RISK" value={atRisk.length} sub="blocked or missed" accent="#f97316" />
        <KpiCard label="IN PROGRESS" value={inProgress.length} sub="active" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          <button onClick={() => setView('graph')} className="text-xs px-3 py-1.5 rounded-l font-mono" style={{ backgroundColor: view === 'graph' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)', color: view === 'graph' ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${view === 'graph' ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            Graph View
          </button>
          <button onClick={() => setView('list')} className="text-xs px-3 py-1.5 rounded-r font-mono" style={{ backgroundColor: view === 'list' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)', color: view === 'list' ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${view === 'list' ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            List View
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-2.5 py-1 rounded font-mono"
              style={{
                backgroundColor: filterStatus === s ? `${STATUS_COLORS[s] ?? GOLD}18` : 'var(--color-a11oy-muted)',
                color: filterStatus === s ? (STATUS_COLORS[s] ?? GOLD) : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${filterStatus === s ? (STATUS_COLORS[s] ?? GOLD) + '30' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {view === 'graph' ? (
            <Card>
              <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OUTCOME POSITIONING MAP — X: Timeline · Y: Business Impact</div>
              <div className="flex gap-3 mb-3 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              <OutcomeScatter onSelect={id => setSelected(id === selected ? null : id)} />
              <div className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Click any point to view outcome details</div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(o => {
                const statusColor = STATUS_COLORS[o.status] ?? GOLD;
                const color = VERTICAL_COLORS[o.vertical] ?? GOLD;
                const isSelected = o.id === selected;
                return (
                  <div
                    key={o.id}
                    className="rounded-lg border cursor-pointer p-4 transition-all"
                    onClick={() => setSelected(isSelected ? null : o.id)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(201,183,135,0.04)' : 'var(--color-a11oy-card)',
                      borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                      borderLeft: `3px solid ${statusColor}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>{o.status.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-mono" style={{ color }}>{VERTICAL_LABELS[o.vertical] ?? o.vertical}</span>
                        </div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{o.title}</div>
                      </div>
                      <div className="text-xs flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.owner}</div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.description}</p>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Metric: <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.successMetric}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {selectedOutcome ? (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OUTCOME DETAIL</div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${STATUS_COLORS[selectedOutcome.status] ?? GOLD}18`, color: STATUS_COLORS[selectedOutcome.status] ?? GOLD }}>{selectedOutcome.status.replace(/_/g, ' ')}</span>
                <span className="text-xs font-mono" style={{ color: VERTICAL_COLORS[selectedOutcome.vertical] ?? GOLD }}>{VERTICAL_LABELS[selectedOutcome.vertical]}</span>
              </div>
              <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{selectedOutcome.title}</div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedOutcome.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Owner</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedOutcome.owner}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Deadline</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedOutcome.targetDate ?? '—'}</div>
                </div>
                <div className="col-span-2">
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Success Metric</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedOutcome.successMetric}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED SIGNALS</div>
                {SEED_SIGNALS.filter(s => selectedOutcome.linkedSignalIds.includes(s.id)).slice(0, 3).map(s => (
                  <div key={s.id} className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>• {s.title.slice(0, 52)}</div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>STATUS BREAKDOWN</div>
              {STATUSES.filter(s => s !== 'all').map(s => {
                const count = SEED_OUTCOMES.filter(o => o.status === s).length;
                const pct = SEED_OUTCOMES.length > 0 ? (count / SEED_OUTCOMES.length) * 100 : 0;
                const color = STATUS_COLORS[s] ?? GOLD;
                return (
                  <div key={s} className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.replace(/_/g, ' ')}</span>
                      <span className="font-mono" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <div>
            <SectionTitle>KPI Impact Radar</SectionTitle>
            <Card style={{ padding: 8 }}>
              <KpiRadar />
            </Card>
          </div>

          <div>
            <SectionTitle>Outcome Scorecard</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {KPI_OUTCOMES.slice(0, 4).map(k => (
                <div key={k.kpi} className="rounded-lg border p-2.5 text-xs" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}>{k.kpi.toUpperCase()}</div>
                  <div className="font-semibold" style={{ color: VERTICAL_COLORS[k.vertical] ?? GOLD }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

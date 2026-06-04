import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityDot, VerticalBadge, SeverityBadge } from '../components/ui';
import { SEED_SIGNALS } from '@workspace/a11oy-fabric';

const GOLD = '#c9b787';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787', 'vessels-maritime': '#8a8a8a', 'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5', 'prism-counsel': '#8a8a8a', 'carlota-jo': '#c9b787', 'alloy-core': '#8a8a8a',
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
  { label: 'Knowledge Graph', status: 'ok', latency: '18ms avg', throughput: '840 entities/hr' },
];

const SOURCES = [
  { name: 'AIS Vessel Feed', domain: 'Maritime', status: 'demo', rate: '24/hr' },
  { name: 'Port Authority API', domain: 'Maritime', status: 'demo', rate: '8/hr' },
  { name: 'CRM Webhook', domain: 'Revenue', status: 'demo', rate: '36/hr' },
  { name: 'Matter Tracker', domain: 'Legal', status: 'demo', rate: '12/hr' },
  { name: 'OSINT Aggregator', domain: 'Defense', status: 'demo', rate: '48/hr' },
  { name: 'Cap Rate Feed', domain: 'Real Estate', status: 'demo', rate: '4/hr' },
];

interface KGEntity {
  id: string;
  label: string;
  type: string;
  vertical: string;
  properties: Record<string, string>;
  connections: { target: string; relation: string; strength: number }[];
}

const KG_ENTITIES: KGEntity[] = [
  {
    id: 'kg-cascade', label: 'MV Cascade', type: 'Vessel', vertical: 'vessels-maritime',
    properties: { IMO: '9876543', Flag: 'Singapore', DWT: '82,000', Status: 'En Route' },
    connections: [
      { target: 'Tanjung Pelepas Port', relation: 'SCHEDULED_AT', strength: 0.95 },
      { target: 'Demurrage Contract #4421', relation: 'GOVERNED_BY', strength: 0.99 },
      { target: 'SZL Holdings', relation: 'OWNED_BY', strength: 1.0 },
      { target: 'TG-Ember Campaign', relation: 'SANCTIONS_CHECKED', strength: 0.88 },
    ],
  },
  {
    id: 'kg-talbot', label: 'Talbot v. Meridian', type: 'Legal Matter', vertical: 'prism-counsel',
    properties: { Case: 'CV-2026-1847', Court: 'S.D.N.Y.', Status: 'Active Discovery', Risk: 'HIGH' },
    connections: [
      { target: 'Patricia Mwangi (GC)', relation: 'ASSIGNED_TO', strength: 1.0 },
      { target: 'Meridian Holdings', relation: 'OPPOSING_PARTY', strength: 1.0 },
      { target: 'MV Cascade', relation: 'DEMURRAGE_RELATED', strength: 0.72 },
    ],
  },
  {
    id: 'kg-tgember', label: 'TG-Ember Campaign', type: 'Threat Actor', vertical: 'aegis-defense',
    properties: { ATT_CK: 'T1071, T1041', Tier: 'ORANGE', Origin: 'Eastern Europe', Active: 'Yes' },
    connections: [
      { target: 'SZL Holdings Network', relation: 'TARGETING', strength: 0.92 },
      { target: 'Mandiant Threat Intel', relation: 'PROFILED_BY', strength: 0.88 },
      { target: 'Guardian Agent', relation: 'MONITORED_BY', strength: 0.99 },
    ],
  },
  {
    id: 'kg-meridian', label: 'Meridian Holdings', type: 'Account', vertical: 'lyte-revenue',
    properties: { Pipeline: '$2.4M', Stage: 'Negotiation', Churn_Risk: '18%', Industry: 'Logistics' },
    connections: [
      { target: 'Pipeline Oracle', relation: 'MONITORED_BY', strength: 0.95 },
      { target: 'Talbot v. Meridian', relation: 'PARTY_TO', strength: 1.0 },
      { target: 'Counsel Sentinel', relation: 'CONTRACT_REVIEWED', strength: 0.85 },
    ],
  },
  {
    id: 'kg-plano', label: 'Plano Office Portfolio', type: 'Property', vertical: 'terra-real-estate',
    properties: { Cap_Rate: '6.2%', Trend: '+18bps/30d', Market: 'DFW Metro', Class: 'A' },
    connections: [
      { target: 'Terra Analyst', relation: 'MONITORED_BY', strength: 0.95 },
      { target: 'SZL Holdings', relation: 'OWNED_BY', strength: 1.0 },
    ],
  },
];

const SEMANTIC_RESULTS = [
  { query: 'What entities are connected to MV Cascade?', results: ['Tanjung Pelepas Port', 'Demurrage Contract #4421', 'SZL Holdings', 'TG-Ember Campaign'] },
  { query: 'Cross-domain connections involving legal and maritime?', results: ['Talbot v. Meridian ↔ MV Cascade (demurrage-related)', 'Meridian Holdings ↔ Counsel Sentinel (contract reviewed)'] },
  { query: 'Threat actors targeting SZL infrastructure?', results: ['TG-Ember Campaign → SZL Holdings Network (targeting, strength: 0.92)'] },
];

const REL_COLORS: Record<string, string> = {
  SCHEDULED_AT: '#8a8a8a', GOVERNED_BY: GOLD, OWNED_BY: '#22c55e', SANCTIONS_CHECKED: '#f97316',
  ASSIGNED_TO: GOLD, OPPOSING_PARTY: '#ef4444', DEMURRAGE_RELATED: '#8a8a8a',
  TARGETING: '#ef4444', PROFILED_BY: '#8a8a8a', MONITORED_BY: '#22c55e',
  PARTY_TO: GOLD, CONTRACT_REVIEWED: GOLD,
};

export function SignalMesh() {
  const [activeView, setActiveView] = useState<'signals' | 'knowledge' | 'search'>('signals');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<KGEntity | null>(null);

  const filtered = SEED_SIGNALS.filter(s =>
    (filterVertical === 'all' || s.vertical === filterVertical) &&
    (filterSeverity === 'all' || s.severity === filterSeverity)
  );

  const active = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
  const critical = SEED_SIGNALS.filter(s => s.severity === 'critical');

  return (
    <Layout>
      <PageHeader
        label="SIGNAL MESH + KNOWLEDGE GRAPH"
        title="Signal Ingestion, Routing & Knowledge Graph"
        subtitle={`The fabric's sensory layer — ingesting, normalizing, and routing ${SEED_SIGNALS.length} business signals, with a semantic knowledge graph for cross-domain entity relationships and discovery.`}
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="TOTAL SIGNALS" value={SEED_SIGNALS.length} sub="in mesh" accent={GOLD} />
        <KpiCard label="ACTIVE" value={active.length} sub="unresolved" accent="#f5f5f5" />
        <KpiCard label="CRITICAL" value={critical.length} sub="attention" accent="#f5f5f5" />
        <KpiCard label="KG ENTITIES" value={KG_ENTITIES.length} sub="cross-domain" accent={GOLD} />
        <KpiCard label="RELATIONSHIPS" value={KG_ENTITIES.reduce((a, e) => a + e.connections.length, 0)} sub="mapped" accent={GOLD} />
        <KpiCard label="MESH HEALTH" value="99.2%" sub="uptime" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['signals', 'knowledge', 'search'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveView(tab)} className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: activeView === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeView === tab ? GOLD : '#5e5e5e', border: `1px solid ${activeView === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'signals' ? 'Signal Registry' : tab === 'knowledge' ? 'Knowledge Graph' : 'Semantic Search'}
          </button>
        ))}
      </div>

      {activeView === 'signals' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-6">
            <div>
              <SectionTitle>Vertical Coverage</SectionTitle>
              <div className="flex flex-col gap-2">
                {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
                  const sigs = SEED_SIGNALS.filter(s => s.vertical === id);
                  const activeSigs = sigs.filter(s => s.status === 'active' || s.status === 'escalated');
                  const color = VERTICAL_COLORS[id] ?? '#5e5e5e';
                  return (
                    <button key={id} onClick={() => setFilterVertical(filterVertical === id ? 'all' : id)} className="text-left rounded border p-2.5 transition-all" style={{ backgroundColor: filterVertical === id ? `${color}08` : 'var(--color-a11oy-card)', borderColor: filterVertical === id ? color : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
                      <div className="flex items-center justify-between">
                        <VerticalBadge vertical={label} color={color} />
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sigs.length}</span>
                          <span style={{ color: GOLD }}>{activeSigs.length} active</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.status === 'ok' ? '#22c55e' : '#ef4444' }} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

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
                        <div className="font-mono" style={{ color: GOLD }}>{s.status}</div>
                        <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.rate}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Severity:</span>
              {['all', 'critical', 'high', 'medium', 'low', 'info'].map(s => (
                <button key={s} onClick={() => setFilterSeverity(s)} className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: filterSeverity === s ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)', color: filterSeverity === s ? GOLD : 'var(--color-a11oy-text-ghost)', border: 'none', cursor: 'pointer' }}>
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
                      <td className="px-3 py-2"><VerticalBadge vertical={VERTICAL_LABELS[s.vertical] ?? s.vertical} color={VERTICAL_COLORS[s.vertical] ?? '#5e5e5e'} /></td>
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
      )}

      {activeView === 'knowledge' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionTitle>Knowledge Graph Entities ({KG_ENTITIES.length})</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              {KG_ENTITIES.map(entity => {
                const vColor = VERTICAL_COLORS[entity.vertical] ?? '#5e5e5e';
                const isSelected = selectedEntity?.id === entity.id;
                return (
                  <div key={entity.id} className="rounded-xl border p-4 cursor-pointer transition-all" onClick={() => setSelectedEntity(isSelected ? null : entity)} style={{ backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)', borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{entity.label}</div>
                        <div className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{entity.type}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: vColor, backgroundColor: `${vColor}15` }}>{VERTICAL_LABELS[entity.vertical]?.split(' ')[0]}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(entity.properties).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{k}: {v}</span>
                      ))}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{entity.connections.length} connections</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {selectedEntity ? (
              <>
                <SectionTitle>Entity — {selectedEntity.label}</SectionTitle>
                <Card>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selectedEntity.label}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selectedEntity.type} · {VERTICAL_LABELS[selectedEntity.vertical]}</div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROPERTIES</div>
                      <div className="space-y-1">
                        {Object.entries(selectedEntity.properties).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k}</span>
                            <span className="font-mono" style={{ color: GOLD }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RELATIONSHIPS</div>
                      <div className="space-y-1">
                        {selectedEntity.connections.map((c, i) => {
                          const relColor = REL_COLORS[c.relation] ?? '#8a8a8a';
                          return (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                              <span className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ color: relColor, backgroundColor: `${relColor}12` }}>{c.relation}</span>
                              <span className="flex-1 truncate" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.target}</span>
                              <span className="font-mono text-[9px]" style={{ color: c.strength >= 0.9 ? '#22c55e' : GOLD }}>{Math.round(c.strength * 100)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <SectionTitle>Relationship Types</SectionTitle>
                <Card>
                  <div className="space-y-2 text-xs">
                    {Object.entries(REL_COLORS).map(([rel, color]) => (
                      <div key={rel} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{rel}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {activeView === 'search' && (
        <>
          <SectionTitle>Semantic Search — Knowledge Graph Queries</SectionTitle>
          <div className="flex flex-col gap-4">
            {SEMANTIC_RESULTS.map((sr, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: `${GOLD}12` }}>QUERY</span>
                  <span className="text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sr.query}</span>
                </div>
                <div className="space-y-1">
                  {sr.results.map((r, ri) => (
                    <div key={ri} className="flex items-center gap-2 text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>KNOWLEDGE GRAPH ENGINE</div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Entity Types', value: '5 (Vessel, Legal Matter, Threat Actor, Account, Property)' },
                { label: 'Relationship Types', value: `${Object.keys(REL_COLORS).length} semantic edge types` },
                { label: 'Cross-Domain Links', value: '8 connections across verticals' },
                { label: 'Update Frequency', value: 'Real-time from Signal Mesh ingestion' },
                { label: 'Provenance', value: 'Every entity/edge has source signal reference' },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.label}</span>
                  <span className="font-mono" style={{ color: GOLD }}>{p.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </Layout>
  );
}

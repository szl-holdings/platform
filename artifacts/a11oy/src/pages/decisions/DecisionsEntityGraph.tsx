import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const ENTITIES = [
  { id: 'e1', name: 'MV Cascade', type: 'Vessel', domain: 'Maritime', connections: ['e3', 'e4', 'e6'], risk: 'low', attrs: { Flag: 'Marshall Islands', IMO: '9812341', Owner: 'SZL Maritime', Status: 'At anchor (Tanjung Pelepas)' } },
  { id: 'e2', name: 'SZL Maritime Ltd', type: 'Entity', domain: 'Maritime', connections: ['e1', 'e5'], risk: 'low', attrs: { Type: 'Shipowner', Jurisdiction: 'Singapore', 'OFAC Status': 'Clean', 'UN Sanctions': 'Clean' } },
  { id: 'e3', name: 'Tanjung Pelepas Port', type: 'Port', domain: 'Maritime', connections: ['e1', 'e4'], risk: 'medium', attrs: { Country: 'Malaysia', 'Congestion Score': '8.2/10', 'Port State Control': 'Active', 'Avg Delay': '18h' } },
  { id: 'e4', name: 'Charter Party CP-2024-088', type: 'Contract', domain: 'Legal', connections: ['e1', 'e2', 'e5'], risk: 'low', attrs: { Type: 'BIMCO Gencon', Laytime: '72h free time', 'Force Majeure': 'Port congestion included', Status: 'Active' } },
  { id: 'e5', name: 'Coastal Grain Corp', type: 'Entity', domain: 'Trade', connections: ['e2', 'e4'], risk: 'low', attrs: { Type: 'Cargo owner', Jurisdiction: 'Brazil', 'OFAC Status': 'Clean', 'UBO Status': 'Verified' } },
  { id: 'e6', name: 'AIS Signal AIS-88421', type: 'Signal', domain: 'Maritime', connections: ['e1', 'e3'], risk: 'low', attrs: { Source: 'MarineTraffic', Position: '1.28N 103.67E', Speed: '0 kn', Course: '182°' } },
  { id: 'e7', name: 'Watchlist Entry WL-4421', type: 'Alert', domain: 'Compliance', connections: ['e3'], risk: 'high', attrs: { Source: 'IMO ASR', Issue: 'Port authority overlap claim', Status: 'Under review', Priority: 'HIGH' } },
];

const TYPE_COLORS: Record<string, string> = { Vessel: '#4d8fcc', Entity: GOLD, Port: '#9b7cc8', Contract: '#22c55e', Signal: '#8a8a8a', Alert: '#f87171', Trade: '#fb923c' };
const RISK_COLORS: Record<string, string> = { low: '#22c55e', medium: GOLD, high: '#f87171' };

export function DecisionsEntityGraph() {
  const [selected, setSelected] = useState<string | null>('e1');
  const [search, setSearch] = useState('');

  const entity = selected ? ENTITIES.find(e => e.id === selected) : null;
  const connected = entity ? ENTITIES.filter(e => entity.connections.includes(e.id)) : [];

  const filtered = ENTITIES.filter(e =>
    search === '' || [e.name, e.type, e.domain].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        label="DECISIONS / ENTITY GRAPH"
        title="Entity Knowledge Graph"
        subtitle="Connected knowledge graph of entities, vessels, contracts, signals, and alerts. Built by the Entity Graph Builder primitive from unstructured intelligence sources. Anomaly detection surfaces unexpected connections."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="ENTITIES" value={String(ENTITIES.length)} sub="indexed" accent={GOLD} />
        <KpiCard label="CONNECTIONS" value={String(ENTITIES.reduce((s, e) => s + e.connections.length, 0))} sub="relationships" accent={GOLD} />
        <KpiCard label="HIGH RISK" value={String(ENTITIES.filter(e => e.risk === 'high').length)} sub="entities flagged" accent="#f87171" />
        <KpiCard label="ANOMALIES" value="1" sub="detected" accent={GOLD} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entities…"
            className="w-full px-3 py-2 rounded border text-xs bg-transparent outline-none mb-3"
            style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />

          <div className="space-y-2">
            {filtered.map(e => {
              const tc = TYPE_COLORS[e.type] ?? GOLD;
              const rc = RISK_COLORS[e.risk];
              return (
                <div key={e.id} className="rounded-lg border p-3 cursor-pointer transition-colors"
                  style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: selected === e.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
                  onClick={() => setSelected(selected === e.id ? null : e.id)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tc}18`, color: tc }}>{e.type}</span>
                    <span className="text-xs font-mono" style={{ color: rc }}>● {e.risk}</span>
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{e.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.domain} · {e.connections.length} connections</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {entity ? (
            <>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded mb-2 inline-block" style={{ backgroundColor: `${TYPE_COLORS[entity.type] ?? GOLD}18`, color: TYPE_COLORS[entity.type] ?? GOLD }}>{entity.type}</span>
                    <div className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{entity.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{entity.domain}</div>
                  </div>
                  <span className="text-xs font-mono" style={{ color: RISK_COLORS[entity.risk] }}>● {entity.risk} risk</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(entity.attrs).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k}</span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Connected Entities ({connected.length})</div>
                <div className="space-y-2">
                  {connected.map(ce => (
                    <div key={ce.id} className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      onClick={() => setSelected(ce.id)}>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${TYPE_COLORS[ce.type] ?? GOLD}18`, color: TYPE_COLORS[ce.type] ?? GOLD }}>{ce.type}</span>
                      <span className="text-xs flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{ce.name}</span>
                      <span className="text-xs font-mono" style={{ color: RISK_COLORS[ce.risk] }}>● {ce.risk}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-8">
                <div className="text-2xl mb-2">🕸</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select an entity to inspect its attributes and connected relationships.</div>
              </div>
            </Card>
          )}

          {ENTITIES.filter(e => e.risk === 'high').map(alert => (
            <div key={alert.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: '#f87171' }}>⚠</span>
                <span className="text-xs font-medium" style={{ color: '#f87171' }}>Anomaly Detected: {alert.name}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{alert.attrs['Issue'] ?? 'Unknown issue'} — {alert.attrs['Status']}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Entity Graph absorbs the Lyte Dashboard entity view and the PRAXIS Passport Registry. One graph, cross-domain, with anomaly detection and risk scoring.
      </div>
    </Layout>
  );
}

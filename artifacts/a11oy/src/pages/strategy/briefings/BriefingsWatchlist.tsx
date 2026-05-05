import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

interface WatchEntry {
  id: string;
  type: 'Entity' | 'Signal' | 'Threshold';
  label: string;
  domain: string;
  trigger: string;
  cadence: string;
  active: boolean;
  alertsLast7d: number;
}

const SEED: WatchEntry[] = [
  { id: 'w-1', type: 'Entity', label: 'IMO 9456321 — MV Andean Crest', domain: 'Maritime', trigger: 'Position deviation > 8nm OR sanctions hit', cadence: 'Real-time', active: true, alertsLast7d: 4 },
  { id: 'w-2', type: 'Signal', label: 'OFAC SDN list updates', domain: 'Compliance', trigger: 'Any addition matching portfolio counterparties', cadence: 'Hourly', active: true, alertsLast7d: 2 },
  { id: 'w-3', type: 'Threshold', label: 'Counsel matter exposure > $250k', domain: 'Legal', trigger: 'New filing crosses threshold', cadence: '15 min', active: true, alertsLast7d: 1 },
  { id: 'w-4', type: 'Entity', label: 'Counterparty: Helios Maritime LLC', domain: 'Maritime', trigger: 'Beneficial-ownership change OR PEP hit', cadence: 'Daily', active: true, alertsLast7d: 0 },
  { id: 'w-5', type: 'Signal', label: 'Sentra critical alerts (P1)', domain: 'Security', trigger: 'Severity ≥ critical AND blast-radius > 1 service', cadence: 'Real-time', active: true, alertsLast7d: 7 },
  { id: 'w-6', type: 'Threshold', label: 'Terra portfolio cap-rate < 5.5%', domain: 'Real Estate', trigger: 'Weekly composite drops below threshold', cadence: 'Weekly', active: false, alertsLast7d: 0 },
  { id: 'w-7', type: 'Entity', label: 'Vendor: Northwind Logistics', domain: 'Strategy', trigger: 'Material adverse news OR rating action', cadence: 'Daily', active: true, alertsLast7d: 1 },
];

export function BriefingsWatchlist() {
  const [items, setItems] = useState<WatchEntry[]>(SEED);
  const [filter, setFilter] = useState<'All' | 'Entity' | 'Signal' | 'Threshold'>('All');

  const filtered = items.filter(i => filter === 'All' || i.type === filter);
  const activeCount = items.filter(i => i.active).length;
  const totalAlerts = items.reduce((s, i) => s + i.alertsLast7d, 0);

  function toggle(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  }

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / WATCHLIST"
        title="Watchlist"
        subtitle="Entities, signals, and thresholds you are actively monitoring. Hits surface in Today's Brief, Dissent Channel, and the relevant domain console."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="WATCH ITEMS" value={String(items.length)} sub="configured" accent={GOLD} />
        <KpiCard label="ACTIVE" value={String(activeCount)} sub="firing rules" accent="#22c55e" />
        <KpiCard label="ALERTS · 7D" value={String(totalAlerts)} sub="surfaced in briefs" accent={GOLD} />
        <KpiCard label="DOMAINS" value={String(new Set(items.map(i => i.domain)).size)} sub="covered" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['All', 'Entity', 'Signal', 'Threshold'] as const).map(t => (
          <button key={t} type="button" onClick={() => setFilter(t)}
            className="px-3 py-2 rounded text-xs font-mono transition-colors"
            style={{
              background: filter === t ? 'rgba(201,183,135,0.12)' : 'transparent',
              color: filter === t ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filter === t ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
              cursor: 'pointer',
            }}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: 'rgba(201,183,135,0.08)', color: GOLD }}>{item.type}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.domain}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}>· {item.cadence}</span>
                </div>
                <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{item.label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.trigger}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium" style={{ color: item.alertsLast7d > 0 ? '#f59e0b' : 'var(--color-a11oy-text-ghost)' }}>
                  {item.alertsLast7d} alerts
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>last 7d</div>
                <button type="button" onClick={() => toggle(item.id)}
                  className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors"
                  style={{
                    background: item.active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.08)',
                    color: item.active ? '#22c55e' : 'var(--color-a11oy-text-ghost)',
                    border: `1px solid ${item.active ? 'rgba(34,197,94,0.3)' : 'var(--color-a11oy-border)'}`,
                    cursor: 'pointer',
                  }}>{item.active ? 'Active' : 'Paused'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default BriefingsWatchlist;

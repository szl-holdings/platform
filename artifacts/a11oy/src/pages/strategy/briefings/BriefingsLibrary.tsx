import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

const BRIEFS = [
  { id: 'br-001', title: 'Maritime Risk Digest — May 5', date: '2026-05-05', domain: 'Maritime', author: 'Cascade Navigator', signals: 14, decisions: 3, lift: 42000, confidence: 94 },
  { id: 'br-002', title: 'Legal Matter Digest — May 5', date: '2026-05-05', domain: 'Legal', author: 'Counsel Sentinel', signals: 8, decisions: 2, lift: 125000, confidence: 99 },
  { id: 'br-003', title: 'Security NOC Brief — May 5', date: '2026-05-05', domain: 'Security', author: 'Guardian', signals: 42, decisions: 12, lift: 280000, confidence: 96 },
  { id: 'br-004', title: 'Weekly Strategic Review — May 4', date: '2026-05-04', domain: 'Strategy', author: 'Strategy AI', signals: 28, decisions: 7, lift: 195000, confidence: 88 },
  { id: 'br-005', title: 'Sanctions Screen Report — May 4', date: '2026-05-04', domain: 'Compliance', author: 'Cascade Navigator', signals: 3, decisions: 1, lift: 180000, confidence: 97 },
  { id: 'br-006', title: 'Maritime Risk Digest — May 4', date: '2026-05-04', domain: 'Maritime', author: 'Cascade Navigator', signals: 11, decisions: 2, lift: 35000, confidence: 92 },
  { id: 'br-007', title: 'Terra Property Analysis — May 3', date: '2026-05-03', domain: 'Real Estate', author: 'Terra Analyst', signals: 6, decisions: 1, lift: 8000, confidence: 85 },
  { id: 'br-008', title: 'Legal Matter Digest — May 3', date: '2026-05-03', domain: 'Legal', author: 'Counsel Sentinel', signals: 5, decisions: 1, lift: 92000, confidence: 87 },
];

const DOMAINS = ['All', 'Maritime', 'Legal', 'Security', 'Compliance', 'Strategy', 'Real Estate'];

export function BriefingsLibrary() {
  const [filterDomain, setFilterDomain] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'lift'>('date');

  const filtered = BRIEFS
    .filter(b => filterDomain === 'All' || b.domain === filterDomain)
    .filter(b => search === '' || b.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'date' ? b.date.localeCompare(a.date) : b.lift - a.lift);

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / LIBRARY"
        title="Brief Library"
        subtitle="Searchable archive of all published intelligence briefs. Every brief links to its Proof Chain, signal sources, and decisions made."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="TOTAL BRIEFS" value={String(BRIEFS.length)} sub="in archive" accent={GOLD} />
        <KpiCard label="DOMAINS" value={String(new Set(BRIEFS.map(b => b.domain)).size)} sub="covered" accent={GOLD} />
        <KpiCard label="TOTAL LIFT $" value={`$${(BRIEFS.reduce((s, b) => s + b.lift, 0) / 1000).toFixed(0)}k`} sub="from brief actions" accent="#22c55e" />
        <KpiCard label="TOTAL DECISIONS" value={String(BRIEFS.reduce((s, b) => s + b.decisions, 0))} sub="made" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs…"
          className="flex-1 min-w-48 px-3 py-2 rounded border text-xs bg-transparent outline-none"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
        {DOMAINS.map(d => (
          <button key={d} type="button" onClick={() => setFilterDomain(d)}
            className="px-3 py-2 rounded text-xs font-mono transition-colors"
            style={{ background: filterDomain === d ? 'rgba(201,183,135,0.12)' : 'transparent', color: filterDomain === d ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterDomain === d ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>{d}</button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'lift')}
          className="px-3 py-2 rounded border text-xs bg-transparent outline-none"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
          <option value="date">Sort: Date</option>
          <option value="lift">Sort: Lift $</option>
        </select>
      </div>

      <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Showing {filtered.length} briefs</div>

      <div className="space-y-2">
        {filtered.map(br => (
          <div key={br.id} className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{br.title}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {br.domain} · {br.author} · {br.date} · ⚡ {br.confidence}% confidence
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {br.signals} signals · {br.decisions} decisions
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: '#22c55e' }}>+${br.lift.toLocaleString()}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>lift</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

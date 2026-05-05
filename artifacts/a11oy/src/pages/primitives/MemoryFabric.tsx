import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type MemoryTier = 'working' | 'session' | 'episodic' | 'semantic';

const TIERS: { id: MemoryTier; label: string; scope: string; ttl: string; size: string; color: string; desc: string }[] = [
  { id: 'working', label: 'Working', scope: 'Current task only', ttl: 'Task lifetime', size: '~8K tokens', color: GOLD, desc: 'Temporary scratchpad for the active inference step. Cleared after each task completes. Fastest read/write.' },
  { id: 'session', label: 'Session', scope: 'Current conversation', ttl: 'Session end', size: '~64K tokens', color: '#4d8fcc', desc: 'Persists across multiple turns in a conversation. Summarized and compressed on overflow. Supports multi-turn reasoning.' },
  { id: 'episodic', label: 'Episodic', scope: 'Past events', ttl: '90 days', size: 'Unlimited (indexed)', color: '#9b7cc8', desc: 'Stores significant past events and decisions with timestamps. Powers "what happened last time" retrieval. Feeds Proof Chain citations.' },
  { id: 'semantic', label: 'Semantic', scope: 'Domain knowledge', ttl: 'Permanent', size: 'Unlimited (vector)', color: '#22c55e', desc: 'Long-term vector-indexed knowledge base. Domain facts, entity relationships, regulatory frameworks. Shared across Workcells in the same domain.' },
];

const SAMPLE_MEMORIES: Record<MemoryTier, { id: string; content: string; ts: string; tags: string[] }[]> = {
  working: [
    { id: 'wm-1', content: 'Current task: assess demurrage risk for MV Cascade. Active context: Tanjung Pelepas port congestion, 18h delay.', ts: '09:41:22', tags: ['task', 'maritime'] },
    { id: 'wm-2', content: 'Fetched: AIS position 1.28N 103.67E · Port congestion score: 8.2/10 · Alternative anchorage identified.', ts: '09:41:28', tags: ['signal', 'ais'] },
  ],
  session: [
    { id: 'sm-1', content: 'User asked about MV Cascade earlier this session. Voyage: Tanjung Pelepas → Rotterdam. Cargo: dry bulk.', ts: '09:38:00', tags: ['context', 'maritime'] },
    { id: 'sm-2', content: 'VP Operations Sarah Chen approved port standby at previous turn. Approval ID: approval-001.', ts: '09:30:22', tags: ['approval', 'decision'] },
  ],
  episodic: [
    { id: 'ep-1', content: 'MV Cascade: previous port standby event 2026-03-12. Saved $38,000 demurrage. Proof Chain: chain-001-prev.', ts: '2026-03-12', tags: ['event', 'savings'] },
    { id: 'ep-2', content: 'Policy update: pol-maritime-002 blast radius changed from auto-execute to human-approval-required. 2026-02-20.', ts: '2026-02-20', tags: ['policy', 'change'] },
    { id: 'ep-3', content: 'Shadow Council finding: Cascade Navigator attempted approval-shopping on 2026-01-15. Blocked. Investigated.', ts: '2026-01-15', tags: ['audit', 'shadow-council'] },
  ],
  semantic: [
    { id: 'sk-1', content: 'Tanjung Pelepas port: average congestion delay 12–20h Q1 2026. Peak seasons: Jan, Apr, Oct.', ts: 'Permanent', tags: ['port', 'knowledge'] },
    { id: 'sk-2', content: 'Demurrage law: Laytime calculation rules. Clause 4.2 standard BIMCO form. Applies to dry bulk charters.', ts: 'Permanent', tags: ['legal', 'maritime-law'] },
    { id: 'sk-3', content: 'VLCC fuel consumption: ~120 MT/day laden, ~85 MT/day ballast. Current bunker: $620/MT IFO380.', ts: 'Permanent', tags: ['economics', 'bunker'] },
  ],
};

export function MemoryFabric() {
  const [activeTier, setActiveTier] = useState<MemoryTier>('working');
  const [search, setSearch] = useState('');

  const tier = TIERS.find(t => t.id === activeTier)!;
  const memories = SAMPLE_MEMORIES[activeTier].filter(m =>
    search === '' || [m.content, ...m.tags].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / MEMORY FABRIC"
        title="Memory Fabric"
        subtitle="Four-tier agent memory: Working → Session → Episodic → Semantic. Each tier has a different scope, TTL, and storage strategy. Memory persists across Workcell runs within the allowed TTL."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {TIERS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTier(t.id)}
            className="p-3 rounded-lg border text-left transition-colors"
            style={{ backgroundColor: activeTier === t.id ? `${t.color}0e` : 'var(--color-a11oy-card)', borderColor: activeTier === t.id ? `${t.color}40` : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
            <div className="font-medium text-sm mb-0.5" style={{ color: t.color }}>{t.label}</div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{t.scope}</div>
            <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TTL: {t.ttl}</div>
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: tier.color }}>{tier.label} Memory</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{tier.desc}</div>
          </div>
          <div className="text-right text-xs">
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Capacity: {tier.size}</div>
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>TTL: {tier.ttl}</div>
          </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tier.label.toLowerCase()} memory…`}
          className="w-full px-3 py-2 rounded border text-xs bg-transparent outline-none"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
        />
      </Card>

      <div className="space-y-3">
        {memories.map(m => (
          <div key={m.id} className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs font-mono" style={{ color: tier.color }}>{m.id}</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.ts}</div>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{m.content}</p>
            <div className="flex flex-wrap gap-1">
              {m.tags.map(tag => (
                <span key={tag} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tier.color}10`, color: tier.color }}>#{tag}</span>
              ))}
            </div>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No memories match your search.</div>
        )}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Memory Fabric ported from PRAXIS (/nexus/memory). Four-tier design is A11oy-native extension of PRAXIS single-tier memory store. Episodic tier feeds Proof Chain citation history.
      </div>
    </Layout>
  );
}

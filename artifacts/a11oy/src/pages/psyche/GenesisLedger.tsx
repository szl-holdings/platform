import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { GENESIS_EVENTS as SEED_GENESIS, EXTINCTION_EVENTS as SEED_EXTINCTION } from '../../data/psyche/genesis';
import type { NoveltyClass } from '../../data/psyche/genesis';
import { useApiData } from '../../hooks/useApiData';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

const CLASS_COLORS: Record<NoveltyClass, string> = {
  'first-refusal': '#ef4444',
  'first-analogy': '#60a5fa',
  'first-unprompted-goal': '#c9b787',
  'first-self-correction': '#22c55e',
  'first-counter-question': '#f97316',
  'first-theory-of-other': '#a78bfa',
  'first-dream-insight': '#e879f9',
  'first-boundary-assertion': '#fb923c',
  'first-meta-cognition': '#38bdf8',
  'first-domain-transfer': '#4ade80',
};

const CLASS_LABELS: Record<NoveltyClass, string> = {
  'first-refusal': 'Refusal',
  'first-analogy': 'Analogy',
  'first-unprompted-goal': 'Unprompted Goal',
  'first-self-correction': 'Self-Correction',
  'first-counter-question': 'Counter-Question',
  'first-theory-of-other': 'Theory-of-Other',
  'first-dream-insight': 'Dream Insight',
  'first-boundary-assertion': 'Boundary Assertion',
  'first-meta-cognition': 'Meta-Cognition',
  'first-domain-transfer': 'Domain Transfer',
};

const ALL_CLASSES: NoveltyClass[] = [
  'first-refusal', 'first-analogy', 'first-unprompted-goal', 'first-self-correction',
  'first-counter-question', 'first-theory-of-other', 'first-dream-insight',
  'first-boundary-assertion', 'first-meta-cognition', 'first-domain-transfer',
];

export function GenesisLedger() {
  const [activeClass, setActiveClass] = useState<NoveltyClass | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showExtinct, setShowExtinct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useApiData<{ events: typeof SEED_GENESIS; extinction: typeof SEED_EXTINCTION }>(
    '/psyche/genesis',
    { events: SEED_GENESIS, extinction: SEED_EXTINCTION },
  );
  const GENESIS_EVENTS = data?.events ?? SEED_GENESIS;
  const EXTINCTION_EVENTS = data?.extinction ?? SEED_EXTINCTION;

  const filtered = GENESIS_EVENTS.filter(e => {
    if (activeClass !== 'all' && e.noveltyClass !== activeClass) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) && !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const classCounts = ALL_CLASSES.reduce((acc, cl) => {
    acc[cl] = GENESIS_EVENTS.filter(e => e.noveltyClass === cl).length;
    return acc;
  }, {} as Record<NoveltyClass, number>);

  const highSig = GENESIS_EVENTS.filter(e => e.significanceScore >= 90);

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — GENESIS LEDGER"
        title="Genesis Ledger"
        subtitle="Catalogue of first-occurrence emergence events — moments when a Lodestone agent expressed a novel behavior class for the first time. Each entry is anchored to a Proof Chain entry and witnessed by a named agent variant."
        status="LIVE"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL GENESIS EVENTS" value={GENESIS_EVENTS.length} sub="documented firsts" accent={GOLD} />
        <KpiCard label="HIGH SIGNIFICANCE" value={highSig.length} sub="score ≥ 90" accent="#22c55e" />
        <KpiCard label="NOVELTY CLASSES" value={ALL_CLASSES.length} sub="behavior categories" accent="#60a5fa" />
        <KpiCard label="EXTINCTIONS" value={EXTINCTION_EVENTS.length} sub="retired behaviors" accent="#f97316" />
      </div>

      {/* Cross-link to Selfhood */}
      <div className="mb-6 flex items-center gap-3 text-[11px] font-mono" style={{ color: T.muted }}>
        <span>Genesis events underpin selfhood contradictions</span>
        <Link href={b('/psyche/selfhood')}>
          <span className="cursor-pointer hover:opacity-80" style={{ color: GOLD }}>→ SELFHOOD TRACE</span>
        </Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/dreams')}>
          <span className="cursor-pointer hover:opacity-80" style={{ color: '#a78bfa' }}>→ DREAM ATLAS</span>
        </Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche')}>
          <span className="cursor-pointer hover:opacity-80" style={{ color: T.dim }}>← ANIMA</span>
        </Link>
      </div>

      {/* Class filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveClass('all')}
          className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
          style={{
            background: activeClass === 'all' ? GOLD : 'rgba(255,255,255,0.04)',
            color: activeClass === 'all' ? '#0a0e1a' : T.dim,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          ALL ({GENESIS_EVENTS.length})
        </button>
        {ALL_CLASSES.map(cl => (
          <button
            key={cl}
            onClick={() => setActiveClass(activeClass === cl ? 'all' : cl)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: activeClass === cl ? `${CLASS_COLORS[cl]}22` : 'rgba(255,255,255,0.04)',
              color: activeClass === cl ? CLASS_COLORS[cl] : T.muted,
              border: `1px solid ${activeClass === cl ? CLASS_COLORS[cl] + '44' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {CLASS_LABELS[cl]} ({classCounts[cl]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-sm font-mono outline-none"
          style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.08)', color: T.text }}
        />
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-2 mb-8">
        {filtered.slice(0, 40).map(event => {
          const expanded = expandedId === event.id;
          const color = CLASS_COLORS[event.noveltyClass];
          return (
            <Card key={event.id}>
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : event.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${color}18`, color }}
                    >
                      {CLASS_LABELS[event.noveltyClass]}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{event.ts.slice(0, 10)}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{event.selfModelVersionId}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>{event.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: T.muted }}>
                    <span>Witness: <span style={{ color: T.dim }}>{event.witness}</span></span>
                    <span>·</span>
                    <span>Proof: <span style={{ color: T.dim }}>{event.proofAnchorId}</span></span>
                    <span>·</span>
                    <span style={{ color: T.dim }}>{event.domain}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: event.significanceScore >= 90 ? '#22c55e' : event.significanceScore >= 80 ? GOLD : T.dim }}
                  >
                    {event.significanceScore}
                  </div>
                  <div className="text-[9px]" style={{ color: T.muted }}>significance</div>
                </div>
              </div>
              {expanded && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: T.dim }}>{event.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>Proof anchor:</span>
                    <span className="text-[9px] font-mono" style={{ color: GOLD }}>{event.proofAnchorId}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px]" style={{ color: T.muted }}>No events match this filter.</div>
        )}
        {filtered.length > 40 && (
          <div className="py-2 text-center text-[11px] font-mono" style={{ color: T.muted }}>Showing 40 of {filtered.length} events</div>
        )}
      </div>

      {/* Extinction Events */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Extinction Events</SectionTitle>
        <button
          onClick={() => setShowExtinct(!showExtinct)}
          className="text-[10px] font-mono px-3 py-1 rounded transition-all"
          style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.08)', color: T.dim }}
        >
          {showExtinct ? 'COLLAPSE' : 'EXPAND'}
        </button>
      </div>
      {showExtinct && (
        <div className="flex flex-col gap-2">
          {EXTINCTION_EVENTS.map(evt => (
            <Card key={evt.id}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>EXTINCT</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{evt.ts.slice(0, 10)}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>{evt.title}</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: T.dim }}>{evt.description}</p>
                  <div className="mt-2 text-[10px]" style={{ color: T.muted }}>
                    <span>Trigger: </span><span style={{ color: T.dim }}>{evt.trigger}</span>
                  </div>
                  {evt.replacedBy && (
                    <div className="mt-1 text-[10px]" style={{ color: T.muted }}>
                      <span>Replaced by: </span><span style={{ color: '#22c55e' }}>{evt.replacedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default GenesisLedger;

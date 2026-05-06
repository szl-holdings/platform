import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierCard,
  FrontierCitationBanner,
  FrontierMonoBadge,
  FrontierSectionLabel,
  FrontierCrossLinks,
} from './FrontierPrimitives';

const API = '/api/a11oy/frontier';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE, MONO } = FRONTIER_TOKENS;

type SignalKind = 'capability' | 'market' | 'threat' | 'regulation' | 'vendor' | 'benchmark';

interface Signal {
  id: string;
  kind: SignalKind;
  title: string;
  summary: string;
  soWhat: string;
  sourceUrl: string;
  sourceName: string;
  confidence: number;
  impactScore: number;
  entities: string[];
  claims: string[];
  affectedAgents: string[];
  createdAt: string;
  scanner: string;
}

const KIND_COLOR: Record<SignalKind, string> = {
  capability: '#6b8de3',
  market: '#8de3b5',
  threat: '#e36b6b',
  regulation: '#e3d36b',
  vendor: '#e3a66b',
  benchmark: '#c9b787',
};

function buildCitationsFromSignals(signals: Signal[]): Citation[] {
  const seen = new Set<string>();
  return signals
    .filter(s => s.sourceUrl && s.sourceName)
    .filter(s => {
      if (seen.has(s.sourceUrl)) return false;
      seen.add(s.sourceUrl);
      return true;
    })
    .map(s => ({
      id: s.id,
      lab: s.sourceName,
      kind: (s.kind === 'vendor' ? 'company' : s.kind === 'regulation' ? 'standard' : 'lab') as Citation['kind'],
      title: s.title,
      sourceUrl: s.sourceUrl,
      sourceName: s.sourceName,
      excerpt: s.summary.slice(0, 160) + (s.summary.length > 160 ? '…' : ''),
      date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));
}

function KindBadge({ kind }: { kind: SignalKind }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: KIND_COLOR[kind], background: `${KIND_COLOR[kind]}18`,
      border: `1px solid ${KIND_COLOR[kind]}40`,
      padding: '2px 7px', borderRadius: 3,
    }}>
      {kind}
    </span>
  );
}

function ConfBar({ value, color = GOLD }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 48, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: DIM }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function FrontierFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '50' });
    if (kindFilter !== 'all') params.set('kind', kindFilter);
    if (search.trim()) params.set('q', search.trim());

    fetch(`${API}/signals?${params}`)
      .then(r => r.json())
      .then(d => {
        const loaded: Signal[] = d.signals ?? [];
        setSignals(loaded);
        setTotal(d.total ?? 0);
        setCitations(buildCitationsFromSignals(loaded));
      })
      .catch(() => setError('Feed unavailable'))
      .finally(() => setLoading(false));
  }, [kindFilter, search]);

  const kinds: SignalKind[] = ['capability', 'market', 'threat', 'regulation', 'vendor', 'benchmark'];

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Signal Feed"
          title="Signal Feed"
          description="Live intelligence from arXiv, vendor announcements, market research, and regulatory bodies — ingested by A11oy's scanner network."
        />

        <FrontierCitationBanner message="All external organisation names, product references, and research entities in this feed are cited sources — each appears in the Research Citation Panel below. Signal content is derived from public research sources; named entities are attributed in full in the Research Citation Panel." />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search signals…"
              style={{
                width: '100%', padding: '7px 12px', fontSize: 12,
                background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 6, color: '#f5f5f5', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', ...kinds].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                style={{
                  padding: '5px 10px', fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: kindFilter === k ? (k === 'all' ? GOLD : KIND_COLOR[k as SignalKind]) : 'transparent',
                  color: kindFilter === k ? '#0a0a0a' : DIM,
                  border: `1px solid ${kindFilter === k ? (k === 'all' ? GOLD : KIND_COLOR[k as SignalKind]) : BORDER}`,
                  borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {k}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
            {total} signals
          </span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading signals…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {signals.map((sig, idx) => {
              const isOpen = expanded === sig.id;
              const citationIdx = idx + 1;
              return (
                <div key={sig.id} style={{
                  border: `1px solid ${isOpen ? `${KIND_COLOR[sig.kind]}40` : BORDER}`,
                  borderRadius: 8, background: SURFACE,
                  transition: 'border-color 0.15s',
                  overflow: 'hidden',
                }}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : sig.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <KindBadge kind={sig.kind} />
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                            {sig.scanner}
                          </span>
                          <span style={{
                            fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
                            color: GOLD, background: `${GOLD}15`,
                            border: `1px solid ${GOLD}30`,
                            padding: '1px 5px', borderRadius: 3,
                          }}>
                            [{citationIdx}]
                          </span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginLeft: 'auto' }}>
                            {new Date(sig.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', lineHeight: 1.4 }}>{sig.title}</div>
                        {!isOpen && (
                          <div style={{ fontSize: 12, color: DIM, marginTop: 4, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                            {sig.summary}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                        <ConfBar value={sig.confidence} />
                        <ConfBar value={sig.impactScore} color="#8de3b5" />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER}` }}>
                      <div style={{ fontSize: 12, color: '#d5d5d5', lineHeight: 1.6, marginBottom: 12, paddingTop: 12 }}>
                        {sig.summary}
                      </div>

                      <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                          So what for A11oy
                        </div>
                        <div style={{ fontSize: 12, color: '#e0d0b0', lineHeight: 1.5 }}>{sig.soWhat}</div>
                      </div>

                      {sig.claims.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                            Key claims
                          </div>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {sig.claims.map((c, i) => (
                              <li key={i} style={{ fontSize: 12, color: DIM, display: 'flex', gap: 8 }}>
                                <span style={{ color: GOLD, flexShrink: 0 }}>·</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                            Affected agents
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {sig.affectedAgents.map(a => (
                              <span key={a} style={{
                                fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                                padding: '2px 7px', borderRadius: 3,
                                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                                color: DIM,
                              }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                            Full attribution in Research Citation Panel [{citationIdx}] below
                          </span>
                          <a
                            href={sig.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, color: GOLD, fontFamily: 'var(--font-mono, monospace)', textDecoration: 'none' }}
                          >
                            [{citationIdx}] →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <FrontierCrossLinks
          base={BASE}
          links={[
            { label: 'Recommendations', path: '/recommendations', desc: 'Frontier signals surface as scored inputs to the Recommendations workflow' },
            { label: 'Learning Loop', path: '/learning', desc: 'Capability benchmark signals feed the learning calibration pipeline' },
            { label: 'Self-Optimization', path: '/self-optimization', desc: 'New signals inform capability gap detection and optimization target selection' },
            { label: 'Constitution', path: '/constitution', desc: 'Dual-use signals are routed to the Constitution dual-use review queue' },
          ]}
        />
        <ResearchCitationPanel
          citations={citations}
          title="Signal source citations — all external names in this feed are cited sources"
        />
      </div>
    </Layout>
  );
}

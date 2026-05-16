import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierCitationBanner,
  FrontierCrossLinks,
} from './FrontierPrimitives';

const API = '/api/a11oy/frontier';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE } = FRONTIER_TOKENS;

interface RecalibrationMemo {
  id: string;
  weekOf: string;
  title: string;
  audit: string;
  blueprint: string;
  roadmap: string;
  signalCount: number;
  proposalCount: number;
  createdAt: string;
  status?: 'draft' | 'published';
  generated?: boolean;
}

const MEMO_CITATIONS: Citation[] = [
  {
    id: 'cit-memo-nist', lab: 'NIST', kind: 'standard',
    title: 'AI Risk Management Framework 2.0 — Govern Function',
    sourceUrl: 'https://airc.nist.gov',
    sourceName: 'NIST AIRC',
    excerpt: 'The Govern function of NIST AI RMF requires organizations to maintain living documentation of AI system changes and calibration events. Recalibration Memos fulfill this requirement.',
    date: 'May 2026',
  },
  {
    id: 'cit-memo-paul', lab: 'Paul Christiano / ARC', kind: 'academic',
    title: 'Scalable Oversight and the Role of Weekly System Reviews',
    sourceUrl: 'https://arc-evals.org',
    sourceName: 'ARC Evals',
    excerpt: 'Weekly calibration reviews are central to scalable oversight methodology — humans must stay informed about system drift before it compounds beyond interpretable thresholds.',
    date: 'May 2026',
  },
];

function MemoSection({ label, content }: { label: string; content: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#d5d5d5', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  );
}

export function RecalibrationMemos() {
  const [memos, setMemos] = useState<RecalibrationMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecalibrationMemo | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/memos`)
      .then(r => r.json())
      .then(d => {
        const list = d.memos ?? [];
        setMemos(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setError('Memos unavailable'))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const r = await fetch(`${API}/memos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookbackDays: 7, topN: 8 }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${r.status})`);
      }
      const data = await r.json();
      const memo = data.memo as RecalibrationMemo;
      setMemos(prev => [memo, ...prev.filter(m => m.id !== memo.id)]);
      setSelected(memo);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Recalibration Memos"
          title="Recalibration Memos"
          description="Weekly intelligence synthesis — distilled from signal ingestion into actionable recalibration blueprints and forward roadmap items for A11oy's capability stack."
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
            Synthesises the week's top signals into a draft memo for human review.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {generateError && (
              <span style={{ fontSize: 11, color: '#e36b6b', fontFamily: 'var(--font-mono, monospace)' }}>
                {generateError}
              </span>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 14px',
                border: `1px solid ${GOLD}80`,
                borderRadius: 6,
                background: generating ? 'transparent' : `${GOLD}14`,
                color: GOLD,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: generating ? 'wait' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {generating ? 'Synthesising…' : "Generate this week's memo"}
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading memos…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {memos.map(m => (
                <button key={m.id} type="button" onClick={() => setSelected(m)} style={{
                  textAlign: 'left', padding: '10px 12px',
                  border: `1px solid ${selected?.id === m.id ? `${GOLD}60` : BORDER}`,
                  borderRadius: 8, background: selected?.id === m.id ? `${GOLD}0a` : SURFACE,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginBottom: 4 }}>
                    Week of {new Date(m.weekOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selected?.id === m.id ? GOLD : '#e0e0e0', lineHeight: 1.3, marginBottom: 6 }}>
                    {m.title}
                  </div>
                  {m.status === 'draft' && (
                    <span style={{ display: 'inline-block', marginBottom: 6, padding: '1px 6px', fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: '#f0c674', border: '1px solid #f0c67460', borderRadius: 3, letterSpacing: '0.08em' }}>
                      DRAFT
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                      {m.signalCount} signals
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                      · {m.proposalCount} proposals
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '24px 28px' }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                  Week of {new Date(selected.weekOf).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                  {selected.title}
                </h2>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Signals ingested</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{selected.signalCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Proposals generated</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f5f5' }}>{selected.proposalCount}</div>
                  </div>
                </div>

                <MemoSection label="Audit" content={selected.audit} />
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                  <MemoSection label="Blueprint" content={selected.blueprint} />
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                  <MemoSection label="Roadmap implications" content={selected.roadmap} />
                </div>

                <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                    Generated {new Date(selected.createdAt).toLocaleString()} · ID: {selected.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <FrontierCrossLinks
          base={BASE}
          links={[
            { label: 'Recommendations', path: '/recommendations', desc: 'Memo blueprint items surface as scored recommendation actions' },
            { label: 'Self-Optimization', path: '/self-optimization', desc: 'Roadmap implications inform optimization target prioritisation' },
            { label: 'Approval Queue', path: '/approval-queue', desc: 'Promoted proposals from memo blueprints enter the governed approval workflow' },
            { label: 'Capability Proposals', path: '/frontier/proposals', desc: 'Memos generate structured capability upgrade proposals in this sub-route' },
          ]}
        />
        <ResearchCitationPanel citations={MEMO_CITATIONS} title="Calibration methodology references" />
      </div>
    </Layout>
  );
}

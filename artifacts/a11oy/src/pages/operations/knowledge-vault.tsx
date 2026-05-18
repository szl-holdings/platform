/**
 * Knowledge Vault — Searchable runbooks, decisions, doctrine, and lessons.
 *
 * Backed by `/api/a11oy/stubs/knowledge-vault` via `useApiData`.
 */

import { useMemo, useState } from 'react';
import { BookOpen, FileText, GitMerge, History, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import { DataStateBadge } from '../../components/ui/DataStateBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';

type Category = 'runbook' | 'decision' | 'doctrine' | 'lessons-learned' | 'reference';

interface KnowledgeEntry {
  id: string;
  title: string;
  category: Category;
  summary: string;
  tags: string[];
  owner: string;
  updatedAt: string;
  reads: number;
  citations: number;
  confidence: number;
}

interface Payload {
  entries: KnowledgeEntry[];
  totals: { total: number; matched: number; byCategory: Record<string, number> };
}

const CATEGORY_META: Record<Category, { color: string; icon: typeof FileText; label: string }> = {
  runbook:           { color: '#4d8fcc', icon: FileText,    label: 'Runbook' },
  decision:          { color: '#8b7ac8', icon: GitMerge,    label: 'Decision' },
  doctrine:          { color: '#d4a054', icon: ShieldCheck, label: 'Doctrine' },
  'lessons-learned': { color: '#22c55e', icon: History,     label: 'Lessons learned' },
  reference:         { color: '#9ca3af', icon: BookOpen,    label: 'Reference' },
};

export default function KnowledgeVaultPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category !== 'all') params.set('category', category);
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [q, category]);

  const { data, loading, error, source } = useApiData<Payload>(`/stubs/knowledge-vault${qs}`);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const badgeState = loading ? 'loading' : error ? 'error' : source === 'demo' ? 'demo' : 'live';

  const selected = data?.entries.find((e) => e.id === selectedId) ?? null;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <PageHeader
          breadcrumbs={[{ label: 'Operations' }, { label: 'Knowledge Vault' }]}
          title="Knowledge Vault"
          description="Curated, citable knowledge: runbooks, decisions, doctrine, lessons learned, and references."
        />
        <div style={{ paddingTop: 6 }}><DataStateBadge state={badgeState} /></div>
      </div>

      {error && (
        <div style={{ padding: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderRadius: 6, margin: '16px 0', fontSize: 13 }}>
          Failed to load knowledge entries: {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 20 }}>
            <KpiCard label="Total" value={data.totals.total} />
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <KpiCard key={c} label={CATEGORY_META[c].label} value={data.totals.byCategory[c] ?? 0} color={CATEGORY_META[c].color} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, summary, or tag…"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 4,
                  color: '#e5e7eb',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', ...Object.keys(CATEGORY_META)] as ('all' | Category)[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${category === c ? '#8b7ac8' : 'rgba(255,255,255,0.12)'}`,
                    background: category === c ? 'rgba(139,122,200,0.15)' : 'transparent',
                    color: category === c ? '#c4b5fd' : '#9ca3af',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {c === 'all' ? 'All' : CATEGORY_META[c as Category].label}
                </button>
              ))}
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
              {data.totals.matched} of {data.totals.total}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {data.entries.map((e) => {
                const meta = CATEGORY_META[e.category];
                const Icon = meta.icon;
                const isSel = selectedId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 6,
                      border: `1px solid ${isSel ? meta.color : 'rgba(255,255,255,0.08)'}`,
                      background: isSel ? `${meta.color}10` : 'rgba(255,255,255,0.025)',
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 4,
                      background: `${meta.color}18`, border: `1px solid ${meta.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, marginBottom: 8 }}>{e.summary}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {e.tags.map((t) => (
                          <span key={t} style={{ fontSize: 10, color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 2 }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#6b7280' }}>
                      <div>{e.reads} reads</div>
                      <div>{e.citations} citations</div>
                    </div>
                  </button>
                );
              })}
              {data.entries.length === 0 && (
                <Card>
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: 13 }}>
                    No knowledge entries match your filters.
                  </div>
                </Card>
              )}
            </div>

            <Card>
              {selected ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: CATEGORY_META[selected.category].color, textTransform: 'uppercase', marginBottom: 6 }}>
                    {CATEGORY_META[selected.category].label}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#e5e7eb', marginBottom: 10 }}>{selected.title}</div>
                  <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 14 }}>{selected.summary}</div>
                  <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                    <Row label="Owner" value={selected.owner} />
                    <Row label="Updated" value={new Date(selected.updatedAt).toLocaleDateString()} />
                    <Row label="Reads" value={String(selected.reads)} />
                    <Row label="Citations" value={String(selected.citations)} />
                    <Row
                      label="Confidence"
                      value={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={11} style={{ color: '#d4a054' }} />
                          {Math.round(selected.confidence * 100)}%
                        </span>
                      }
                    />
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                  Select an entry to view its details.
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
      <span style={{ color: '#9ca3af' }}>{label}</span>
      <span style={{ color: '#e5e7eb' }}>{value}</span>
    </div>
  );
}

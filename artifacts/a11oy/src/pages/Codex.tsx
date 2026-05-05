import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, KpiCard } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const GOLD = '#c9b787';

interface CodexEntry {
  id: string;
  kind: string;
  title: string;
  relativePath: string;
  bytes: number;
  modifiedAt: string;
  tags: string[];
  summary: string;
  snippet: string;
  weight: number;
}

interface Catalog {
  entries: CodexEntry[];
  total: number;
  byKind: Record<string, number>;
  lastBuiltAt: string | null;
}

const KIND_LABEL: Record<string, string> = {
  thesis: 'Thesis',
  ouroboros: 'Ouroboros',
  formula: 'Formula',
  'codex-payload': 'Codex Payload',
  doctrine: 'Doctrine',
  finding: 'Finding',
  audit: 'Audit',
  manifesto: 'Manifesto',
  'task-brief': 'Task Brief',
  payload: 'Payload',
  doc: 'Doc',
};

const KIND_COLOR: Record<string, string> = {
  thesis: '#a78bfa',
  ouroboros: '#22d3ee',
  formula: '#f59e0b',
  'codex-payload': '#c9b787',
  doctrine: '#8a8a8a',
  finding: '#ef4444',
  audit: '#fb923c',
  manifesto: '#e879f9',
  'task-brief': '#22c55e',
  payload: '#94a3b8',
  doc: '#6b7280',
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Codex() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeKind, setActiveKind] = useState<string | null>(null);
  const [results, setResults] = useState<CodexEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/a11oy/codex/catalog')
      .then(r => r.json())
      .then((j: { ok: boolean; data?: Catalog; error?: { message: string } }) => {
        if (cancelled) return;
        if (j.ok && j.data) setCatalog(j.data);
        else setError(j.error?.message ?? 'Failed to load codex.');
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q && !activeKind) { setResults(null); return; }
    let cancelled = false;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (activeKind) params.set('kind', activeKind);
    params.set('limit', '120');
    fetch(`/api/a11oy/codex/search?${params.toString()}`)
      .then(r => r.json())
      .then((j: { ok: boolean; data?: { results: CodexEntry[] } }) => {
        if (cancelled) return;
        if (j.ok && j.data) setResults(j.data.results);
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [query, activeKind]);

  const display = useMemo(() => {
    if (results !== null) return results;
    if (!catalog) return [];
    const top = catalog.entries.slice(0, 200);
    return top;
  }, [results, catalog]);

  const kindOrder = useMemo(() => {
    if (!catalog) return [] as Array<[string, number]>;
    return Object.entries(catalog.byKind).sort((a, b) => b[1] - a[1]);
  }, [catalog]);

  return (
    <Layout>
      <PageHeader
        label="A11OY CODEX"
        title="Operational Index of Theses, Formulas & Findings"
        subtitle="Every thesis revision, every codex payload, every formula audit, every doctrine and finding — indexed live from the repo and searchable in one place. This is the operational mouth of the ouroboros."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="ENTRIES" value={catalog?.total ?? '—'} sub="indexed" accent={GOLD} />
        <KpiCard label="THESES" value={catalog?.byKind.thesis ?? 0} sub="canonical + variants" accent="#a78bfa" />
        <KpiCard label="FORMULAS" value={catalog?.byKind.formula ?? 0} sub="documented" accent="#f59e0b" />
        <KpiCard label="OUROBOROS" value={catalog?.byKind.ouroboros ?? 0} sub="V1 → V9" accent="#22d3ee" />
        <KpiCard label="FINDINGS" value={(catalog?.byKind.finding ?? 0) + (catalog?.byKind.audit ?? 0)} sub="audit + gap" accent="#ef4444" />
      </div>

      <Card className="mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search formulas, thesis sections, codex payloads, doctrines, findings…"
            className="flex-1 px-3 py-2 rounded text-sm"
            style={{
              background: 'var(--color-a11oy-deep)',
              border: '1px solid var(--color-a11oy-border)',
              color: 'var(--color-a11oy-text)',
            }}
          />
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveKind(null)}
              className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded"
              style={{
                background: !activeKind ? GOLD : 'transparent',
                color: !activeKind ? '#0a0a0a' : 'var(--color-a11oy-text-sub)',
                border: '1px solid var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {kindOrder.map(([k, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => setActiveKind(k === activeKind ? null : k)}
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded"
                style={{
                  background: activeKind === k ? KIND_COLOR[k] ?? GOLD : 'transparent',
                  color: activeKind === k ? '#0a0a0a' : KIND_COLOR[k] ?? 'var(--color-a11oy-text-sub)',
                  border: `1px solid ${activeKind === k ? (KIND_COLOR[k] ?? GOLD) : 'var(--color-a11oy-border)'}`,
                  cursor: 'pointer',
                }}
              >
                {KIND_LABEL[k] ?? k} <span style={{ opacity: 0.6 }}>{n}</span>
              </button>
            ))}
          </div>
        </div>
        {catalog?.lastBuiltAt && (
          <div className="text-[10px] font-mono mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Index built {new Date(catalog.lastBuiltAt).toLocaleString()} · {catalog.total} entries · query/filter narrows live
          </div>
        )}
      </Card>

      {loading && (
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: GOLD }}>Building codex index…</div>
      )}
      {error && !loading && (
        <Card>
          <div className="text-sm font-mono" style={{ color: '#ef4444' }}>{error}</div>
        </Card>
      )}

      {!loading && (
        <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {results !== null
            ? `${display.length} match${display.length === 1 ? '' : 'es'}${query ? ` for "${query}"` : ''}${activeKind ? ` · kind=${KIND_LABEL[activeKind] ?? activeKind}` : ''}`
            : `Top ${display.length} of ${catalog?.total ?? 0} entries (priority-ranked)`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {display.map(entry => {
          const color = KIND_COLOR[entry.kind] ?? GOLD;
          return (
            <Link
              key={entry.id}
              href={`${BASE}/codex/${entry.id}`}
              className="block p-3 rounded-lg transition-all"
              style={{
                background: 'var(--color-a11oy-card)',
                border: '1px solid var(--color-a11oy-border)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${color}18`, color }}>
                    {KIND_LABEL[entry.kind] ?? entry.kind}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {fmtBytes(entry.bytes)}
                  </span>
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>
                  {entry.title}
                </div>
                <div className="text-[10px] font-mono mb-1.5 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {entry.relativePath}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  {entry.summary || entry.snippet.slice(0, 180) + '…'}
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.slice(0, 6).map(t => (
                      <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)' }}>{t}</span>
                    ))}
                  </div>
                )}
            </Link>
          );
        })}
      </div>

      {!loading && display.length === 0 && (
        <Card>
          <div className="text-sm font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            No matches. Try a broader query or clear the kind filter.
          </div>
        </Card>
      )}
    </Layout>
  );
}

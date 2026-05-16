import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle } from '../components/ui';

const GOLD = '#c9b787';
const MUTED = '#888';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';
const BORDER = 'var(--color-a11oy-border)';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

interface NamedEntry {
  id: string;
  name?: string;
  statement?: string;
  source?: string;
  description?: string;
  floor?: number;
  unit?: string;
  value?: string;
  current?: string;
  target?: string | null;
  confidence?: number;
}
interface LineageStep {
  id: string;
  title?: string;
  summary?: string;
  statement?: string;
  doi?: string | null;
  concept_doi?: string | null;
  year?: number;
  status?: string;
}
interface DoiEntry {
  doi: string;
  title?: string;
  kind?: string;
  year?: number;
  url?: string;
  status?: string;
  version?: string;
}
interface Publication {
  title?: string;
  version?: string;
  submittedAt?: string | null;
  url?: string | null;
  submission_status?: string;
  target_venue?: string;
}
interface ThesisPayload {
  generatedAt?: string;
  doctrine?: {
    version?: string;
    replayRoot?: string;
    byline?: string;
    orcid?: string;
    affiliation?: string;
    lambdaFloor?: number;
    byteIdenticalReplays?: number;
    licenseAllowlist?: string[];
  };
  lineage?: LineageStep[];
  axioms?: NamedEntry[];
  derivations?: NamedEntry[];
  theorems?: NamedEntry[];
  constants?: NamedEntry[];
  lambdaAxes?: NamedEntry[];
  forecastGauges?: NamedEntry[];
  doiLedger?: DoiEntry[];
  publications?: { arxiv?: Publication[]; zenodo?: Publication[] };
  _gaps?: string[];
}

type Tone = 'gold' | 'muted' | 'warn' | 'neutral';
function Chip({ children, tone = 'neutral', title }: { children: React.ReactNode; tone?: Tone; title?: string }) {
  const styles: Record<Tone, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'rgba(245,245,245,0.04)', color: '#ededed', border: 'rgba(245,245,245,0.12)' },
    gold:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,      border: 'rgba(201,183,135,0.30)' },
    muted:   { bg: 'rgba(136,136,136,0.10)', color: MUTED,     border: 'rgba(136,136,136,0.25)' },
    warn:    { bg: 'rgba(245,170,90,0.10)',  color: '#e0a868', border: 'rgba(245,170,90,0.28)' },
  };
  const s = styles[tone];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

type Tab = 'axioms' | 'derivations' | 'theorems' | 'constants';

function ExpandableCard({ entry }: { entry: NamedEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <Card onClick={() => setOpen(o => !o)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs" style={{ color: GOLD, fontFamily: MONO }}>{entry.id}</span>
        <span className="text-xs" style={{ color: TEXT }}>{entry.name ?? ''}</span>
      </div>
      <div
        className="text-xs"
        style={{
          color: SUB,
          display: '-webkit-box',
          WebkitLineClamp: open ? 99 : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.statement ?? '—'}
      </div>
      {entry.source && open && (
        <div className="text-xs mt-2" style={{ color: GHOST as string, fontFamily: MONO, wordBreak: 'break-all' }}>
          {entry.source}
        </div>
      )}
    </Card>
  );
}

export function ThesisAtlas() {
  const [data, setData] = useState<ThesisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('axioms');

  useEffect(() => {
    let alive = true;
    fetch('/api/szl/atlas/thesis')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => { if (alive) setData(j as ThesisPayload); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
  }, []);

  return (
    <Layout>
      <PageHeader
        label="ATLAS · THESIS"
        title="Thesis Atlas"
        subtitle="Doctrine V6 lineage, axioms, derivations, theorems, constants, Λ-axes, forecast gauges, and the DOI ledger."
      />

      {error && (
        <Card>
          <div className="text-xs" style={{ color: '#e0a868', fontFamily: MONO }}>Could not reach /api/szl/atlas/thesis — {error}</div>
        </Card>
      )}
      {!error && !data && (
        <Card>
          <div className="text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>Loading thesis atlas…</div>
        </Card>
      )}

      {data && (
        <>
          {/* Doctrine strip */}
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <Chip tone="gold">Doctrine {data.doctrine?.version ?? '—'}</Chip>
            <Chip tone="muted" title={data.doctrine?.replayRoot ?? ''}>
              replayRoot {data.doctrine?.replayRoot?.slice(0, 12) ?? '—'}…
            </Chip>
            <Chip tone="neutral">{data.doctrine?.byline ?? '—'}</Chip>
            <Chip tone="neutral">ORCID {data.doctrine?.orcid ?? '—'}</Chip>
            {typeof data.doctrine?.lambdaFloor === 'number' && (
              <Chip tone="muted">Λ floor {data.doctrine.lambdaFloor}</Chip>
            )}
            {typeof data.doctrine?.byteIdenticalReplays === 'number' && (
              <Chip tone="muted">replays {data.doctrine.byteIdenticalReplays}</Chip>
            )}
          </div>

          {/* Lineage */}
          <SectionTitle>Lineage TH1 → TH8</SectionTitle>
          <div className="mb-8 space-y-3">
            {(data.lineage ?? []).map((step, i, arr) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center" style={{ width: 32 }}>
                  <div
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      border: `1px solid ${GOLD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: GOLD, fontFamily: MONO, fontSize: 10,
                    }}
                  >{step.id}</div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: BORDER, marginTop: 4, minHeight: 24 }} />
                  )}
                </div>
                <Card style={{ flex: 1 }}>
                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                    <span className="text-sm" style={{ color: TEXT }}>{step.title ?? '—'}</span>
                    <div className="flex gap-1">
                      {step.year && <Chip tone="muted">{step.year}</Chip>}
                      {step.status && <Chip tone="neutral">{step.status}</Chip>}
                    </div>
                  </div>
                  {step.statement && (
                    <div
                      className="text-xs mt-2 pl-3"
                      style={{ color: SUB, borderLeft: `2px solid ${GOLD}`, fontStyle: 'italic' }}
                    >
                      {step.statement}
                    </div>
                  )}
                  {(step.doi || step.concept_doi) && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {step.doi && (
                        <a
                          href={`https://doi.org/${step.doi}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs"
                          style={{ color: GOLD, fontFamily: MONO }}
                        >doi:{step.doi}</a>
                      )}
                      {step.concept_doi && (
                        <a
                          href={`https://doi.org/${step.concept_doi}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs"
                          style={{ color: MUTED, fontFamily: MONO }}
                        >concept:{step.concept_doi}</a>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <SectionTitle>Formal index</SectionTitle>
          <div className="mb-3 flex gap-1 flex-wrap">
            {(['axioms', 'derivations', 'theorems', 'constants'] as Tab[]).map(t => {
              const active = tab === t;
              const count = ((data[t] as NamedEntry[] | undefined) ?? []).length;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  type="button"
                  className="px-3 py-1 rounded text-xs"
                  style={{
                    background: active ? 'rgba(201,183,135,0.12)' : 'transparent',
                    color: active ? GOLD : MUTED,
                    border: `1px solid ${active ? 'rgba(201,183,135,0.30)' : BORDER}`,
                    fontFamily: MONO,
                    cursor: 'pointer',
                  }}
                >
                  {t} · {count}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {((data[tab] as NamedEntry[] | undefined) ?? []).map(e => (
              <ExpandableCard key={e.id} entry={e} />
            ))}
          </div>

          {/* Λ-axes */}
          <SectionTitle>Λ-axes (9)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {(data.lambdaAxes ?? []).map(axis => (
              <Card key={axis.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs" style={{ color: GOLD, fontFamily: MONO }}>{axis.id}</span>
                  <span className="text-xs" style={{ color: TEXT }}>{axis.name}</span>
                  {typeof axis.floor === 'number' && (
                    <span className="ml-auto"><Chip tone="muted">floor {axis.floor}</Chip></span>
                  )}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: SUB,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >{axis.description ?? axis.statement ?? '—'}</div>
              </Card>
            ))}
          </div>

          {/* Forecast gauges */}
          <SectionTitle>Forecast gauges (12)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {(data.forecastGauges ?? []).map(g => (
              <Card key={g.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs" style={{ color: GOLD, fontFamily: MONO }}>{g.id}</span>
                  <span className="text-xs" style={{ color: TEXT }}>{g.name}</span>
                </div>
                <div className="text-xs mb-1" style={{ color: SUB }}>{g.description ?? ''}</div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <Chip tone="gold">current {g.current ?? '—'} {g.unit ?? ''}</Chip>
                  <Chip tone={g.target == null ? 'warn' : 'muted'}>target {g.target ?? '—'}</Chip>
                  {typeof g.confidence === 'number' && <Chip tone="muted">conf {g.confidence}</Chip>}
                </div>
              </Card>
            ))}
          </div>

          {/* DOI ledger */}
          <SectionTitle>DOI ledger ({(data.doiLedger ?? []).length})</SectionTitle>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, color: GHOST as string, fontFamily: MONO }}>
                    <th className="text-left py-2 pr-3">DOI</th>
                    <th className="text-left py-2 pr-3">Title</th>
                    <th className="text-left py-2 pr-3">Kind</th>
                    <th className="text-left py-2 pr-3">Year</th>
                    <th className="text-left py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.doiLedger ?? []).map(d => (
                    <tr key={d.doi} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="py-2 pr-3" style={{ fontFamily: MONO }}>
                        <a href={d.url ?? `https://doi.org/${d.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                          {d.doi}
                        </a>
                      </td>
                      <td className="py-2 pr-3" style={{ color: TEXT }}>{d.title ?? '—'}</td>
                      <td className="py-2 pr-3" style={{ color: SUB }}>{d.kind ?? '—'}</td>
                      <td className="py-2 pr-3" style={{ color: SUB }}>{d.year ?? '—'}</td>
                      <td className="py-2 pr-3" style={{ color: SUB }}>{d.status ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Publications */}
          <SectionTitle className="mt-8">Publications</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <Card>
              <div className="text-xs mb-2" style={{ color: GOLD, fontFamily: MONO }}>arXiv</div>
              {(data.publications?.arxiv ?? []).map((p, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="text-xs" style={{ color: TEXT }}>{p.title ?? '—'}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {p.version && <Chip tone="muted">{p.version}</Chip>}
                    {p.target_venue && <Chip tone="muted">{p.target_venue}</Chip>}
                    {p.submission_status && (
                      <Chip tone={p.submission_status.includes('READY') ? 'warn' : 'gold'}>
                        {p.submission_status}
                      </Chip>
                    )}
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <div className="text-xs mb-2" style={{ color: GOLD, fontFamily: MONO }}>Zenodo</div>
              {(data.publications?.zenodo ?? []).map((p, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="text-xs" style={{ color: TEXT }}>{p.title ?? '—'}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {p.version && <Chip tone="muted">{p.version}</Chip>}
                    {p.submission_status && (
                      <Chip tone={p.submission_status.includes('READY') ? 'warn' : 'gold'}>
                        {p.submission_status}
                      </Chip>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Gaps */}
          {(data._gaps ?? []).length > 0 && (
            <>
              <SectionTitle>Open gaps ({(data._gaps ?? []).length})</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {(data._gaps ?? []).map((g, i) => <Chip key={i} tone="warn">{g}</Chip>)}
              </div>
            </>
          )}

          <div className="mt-6 text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>
            generated · {data.generatedAt ?? '—'}
          </div>
        </>
      )}
    </Layout>
  );
}

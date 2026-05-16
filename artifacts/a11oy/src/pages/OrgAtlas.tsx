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

type Tone = 'neutral' | 'gold' | 'muted' | 'warn' | 'ok';

function Chip({ children, tone = 'neutral', title }: { children: React.ReactNode; tone?: Tone; title?: string }) {
  const styles: Record<Tone, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'rgba(245,245,245,0.04)', color: '#ededed', border: 'rgba(245,245,245,0.12)' },
    gold:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,      border: 'rgba(201,183,135,0.30)' },
    muted:   { bg: 'rgba(136,136,136,0.10)', color: MUTED,     border: 'rgba(136,136,136,0.25)' },
    warn:    { bg: 'rgba(245,170,90,0.10)',  color: '#e0a868', border: 'rgba(245,170,90,0.28)' },
    ok:      { bg: 'rgba(120,200,140,0.08)', color: '#9ec7a4', border: 'rgba(120,200,140,0.22)' },
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

interface RepoLatestCommit {
  sha?: string;
  shortSha?: string;
  message?: string;
  author?: string;
  date?: string;
}
interface Repo {
  name: string;
  fullName?: string;
  description?: string | null;
  topics?: string[];
  defaultBranch?: string;
  pushedAt?: string;
  stars?: number;
  openIssuesCount?: number;
  languages?: Record<string, number>;
  latestCommit?: RepoLatestCommit | null;
  latestTag?: { name?: string } | null;
  latestRelease?: { tagName?: string; name?: string; publishedAt?: string } | null;
  openPullRequests?: Array<{ number: number; title: string }>;
  ciStatus?: string;
  communityProfile?: { healthPercentage?: number } | null;
  workflows?: Array<{ name: string; state?: string }>;
}
interface GhPayload {
  generatedAt?: string;
  org?: string;
  summary?: {
    repoCount?: number;
    totalOpenPRs?: number;
    totalReleases?: number;
    languagesAggregate?: Record<string, number>;
    ciFailingRepos?: string[];
    openCodeScanningAlerts?: number;
    openDependabotHighCritical?: number;
  };
  repos?: Repo[];
  crossRepoFindings?: Record<string, any>;
  auditorVerdict?: string;
  _warnings?: string[];
}

function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const days = (Date.now() - t) / 86_400_000;
  if (days < 1) return 'today';
  if (days < 2) return '1d ago';
  if (days < 30) return `${Math.round(days)}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

function topLanguages(langs: Record<string, number> | undefined, n: number): Array<[string, number]> {
  if (!langs) return [];
  return Object.entries(langs)
    .filter(([, b]) => typeof b === 'number')
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function ciTone(status?: string): Tone {
  if (!status) return 'muted';
  const s = status.toLowerCase();
  if (s.includes('fail')) return 'warn';
  if (s.includes('pass') || s.includes('success') || s === 'ok') return 'ok';
  return 'neutral';
}

export function OrgAtlas() {
  const [data, setData] = useState<GhPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/szl/atlas/github')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(j => { if (alive) setData(j as GhPayload); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
  }, []);

  const repos = (data?.repos ?? [])
    .slice()
    .sort((a, b) => Date.parse(b.pushedAt ?? '') - Date.parse(a.pushedAt ?? ''));
  const summary = data?.summary;
  const cross = data?.crossRepoFindings ?? {};
  const missingCI: string[] = Array.isArray(cross?.missingCI) ? cross.missingCI : [];
  const lowHealth: Repo[] = repos.filter(r => {
    const h = r.communityProfile?.healthPercentage;
    return typeof h === 'number' && h < 80;
  });

  return (
    <Layout>
      <PageHeader
        label="ATLAS · ORG"
        title="Organization Atlas"
        subtitle="Cross-repository sweep of the szl-holdings GitHub org — commits, releases, CI, community health."
      />

      {error && (
        <Card>
          <div className="text-xs" style={{ color: '#e0a868', fontFamily: MONO }}>
            Could not reach /api/szl/atlas/github — {error}
          </div>
        </Card>
      )}

      {!error && !data && (
        <Card>
          <div className="text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>Loading org sweep…</div>
        </Card>
      )}

      {data && (
        <>
          {/* Summary chip strip */}
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <Chip tone="gold">{summary?.repoCount ?? repos.length} repos</Chip>
            <Chip tone="neutral">{summary?.totalOpenPRs ?? 0} open PRs</Chip>
            <Chip tone="neutral">{summary?.totalReleases ?? 0} releases</Chip>
            <Chip tone={summary?.ciFailingRepos?.length ? 'warn' : 'ok'}>
              CI failing: {(summary?.ciFailingRepos ?? []).join(', ') || 'none'}
            </Chip>
            {topLanguages(summary?.languagesAggregate, 5).map(([lang, bytes]) => (
              <Chip key={lang} tone="muted">{lang} · {(bytes / 1024).toFixed(0)}KB</Chip>
            ))}
          </div>

          {/* Repo grid */}
          <SectionTitle>Repositories ({repos.length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {repos.map(repo => {
              const langs = topLanguages(repo.languages, 2);
              const lc = repo.latestCommit ?? null;
              const release = repo.latestRelease?.tagName ?? repo.latestRelease?.name ?? repo.latestTag?.name ?? null;
              return (
                <Card key={repo.name}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate" style={{ color: GOLD, fontFamily: MONO }}>
                        {repo.name}
                      </div>
                      <div className="text-xs mt-1 line-clamp-2" style={{ color: SUB }}>
                        {repo.description ?? '—'}
                      </div>
                    </div>
                    <Chip tone={ciTone(repo.ciStatus)} title={`CI: ${repo.ciStatus ?? 'unknown'}`}>
                      {repo.ciStatus ?? 'n/a'}
                    </Chip>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center gap-2 text-xs" style={{ color: GHOST as string }}>
                      <span style={{ width: 76 }}>commit</span>
                      {lc ? (
                        <span
                          className="truncate"
                          title={lc.sha ?? ''}
                          style={{ color: TEXT, fontFamily: MONO }}
                        >
                          {lc.shortSha ?? lc.sha?.slice(0, 7) ?? '—'}
                          <span style={{ color: MUTED }}> · {lc.author ?? '—'} · {formatRelative(lc.date)}</span>
                        </span>
                      ) : <span style={{ color: MUTED }}>—</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: GHOST as string }}>
                      <span style={{ width: 76 }}>release</span>
                      <span style={{ color: TEXT, fontFamily: MONO }}>{release ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: GHOST as string }}>
                      <span style={{ width: 76 }}>open PRs</span>
                      <span style={{ color: TEXT }}>{repo.openPullRequests?.length ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: GHOST as string }}>
                      <span style={{ width: 76 }}>languages</span>
                      {langs.length === 0 && <span style={{ color: MUTED }}>—</span>}
                      {langs.map(([l]) => <Chip key={l} tone="muted">{l}</Chip>)}
                    </div>
                    {typeof repo.communityProfile?.healthPercentage === 'number' && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: GHOST as string }}>
                        <span style={{ width: 76 }}>community</span>
                        <span style={{ color: repo.communityProfile.healthPercentage < 80 ? '#e0a868' : TEXT }}>
                          {repo.communityProfile.healthPercentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Cross-repo findings */}
          <SectionTitle>Cross-repo findings</SectionTitle>
          <Card>
            <div className="space-y-3 text-xs">
              <div>
                <div className="mb-1" style={{ color: GHOST as string, fontFamily: MONO }}>missing CI</div>
                <div className="flex flex-wrap gap-2">
                  {missingCI.length === 0
                    ? <span style={{ color: MUTED }}>none flagged</span>
                    : missingCI.map(r => <Chip key={r} tone="warn">{r}</Chip>)}
                </div>
              </div>
              <div>
                <div className="mb-1" style={{ color: GHOST as string, fontFamily: MONO }}>community health &lt; 80%</div>
                <div className="flex flex-wrap gap-2">
                  {lowHealth.length === 0
                    ? <span style={{ color: MUTED }}>none flagged</span>
                    : lowHealth.map(r => (
                      <Chip key={r.name} tone="warn">
                        {r.name} · {r.communityProfile?.healthPercentage}%
                      </Chip>
                    ))}
                </div>
              </div>
              {Array.isArray(cross?.duplicateConfigs) && cross.duplicateConfigs.length > 0 && (
                <div>
                  <div className="mb-1" style={{ color: GHOST as string, fontFamily: MONO }}>duplicated workflow files</div>
                  <div className="flex flex-wrap gap-2">
                    {cross.duplicateConfigs.map((d: any, i: number) => (
                      <Chip key={i} tone="muted" title={(d.repos ?? []).join(', ')}>
                        {d.path} · {(d.repos ?? []).length} repos
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {data.auditorVerdict && (
            <div
              className="mt-6 p-4 rounded"
              style={{
                borderLeft: `3px solid ${GOLD}`,
                background: 'rgba(201,183,135,0.04)',
                color: SUB,
                fontStyle: 'italic',
                fontSize: '0.8125rem',
              }}
            >
              {data.auditorVerdict}
            </div>
          )}

          <div className="mt-6 text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>
            sweep · {data.generatedAt ?? '—'} · org: {data.org ?? '—'}
          </div>
        </>
      )}
    </Layout>
  );
}

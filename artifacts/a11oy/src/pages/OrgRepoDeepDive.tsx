import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { PageHeader } from '../components/ui/PageHeader';

/**
 * a11oy / Org Repo Deep-Dive — Round 7. Consumes
 * /api/org-intelligence/deep-dive/:slug (live GitHub API behind a 5-min
 * cache). Shows real meta, README excerpt, top-level tree, last 10
 * commits, open PRs, language byte-split, releases. No mocks; missing
 * fields render as honest empty states with the upstream HTTP code.
 *
 * Companion to /organism: clicking a repo card there links here.
 */

const T = {
  bg: '#0b0d12', surface: '#12151c', surfaceHi: '#1a1f2a',
  border: '#2a313e', text: '#e6e9ef', dim: '#8b94a6',
  green: '#4ade80', amber: '#fbbf24', red: '#f87171', blue: '#60a5fa', purple: '#c4b5fd',
};

interface DeepDive {
  slug: string;
  url: string;
  fetched_at: string;
  meta: {
    description: string | null; language: string | null; size_kb: number | null;
    pushed_at: string | null; default_branch: string | null; open_issues: number | null;
    license: string | null; stargazers: number; forks: number; topics: string[]; archived: boolean;
  };
  readme: { ok: boolean; length?: number; first_4000?: string; _error?: string };
  top_level: Array<{ name: string; type: string; size: number | null; url: string }> | { _error: string };
  recent_commits: Array<{ sha: string; url: string; author: string; when: string; subject: string }> | { _error: string };
  open_prs: Array<{ number: number; title: string; author: string; created_at: string; url: string; draft: boolean }> | { _error: string };
  languages_bytes: Record<string, number> | { _error: string };
  releases: Array<{ tag: string; name: string | null; published_at: string; url: string; draft: boolean; prerelease: boolean }> | { _error: string };
}

function relAge(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OrgRepoDeepDive() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [data, setData] = useState<DeepDive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fresh = refreshTick > 0 ? '?fresh=1' : '';
    fetch(`/api/org-intelligence/deep-dive/${slug}${fresh}`, { cache: 'no-store' })
      .then(async r => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) { setError((j as { error?: string }).error || `HTTP ${r.status}`); setLoading(false); return; }
        setData(j as DeepDive);
        setLoading(false);
      })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [slug, refreshTick]);

  const langTotal = data && !('_error' in data.languages_bytes)
    ? Object.values(data.languages_bytes).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', padding: 24 }}>
      <PageHeader title={`Repo deep-dive · ${slug ?? ''}`} subtitle="Live GitHub data, 5-min cache, no mocks. Round 7 surface — wired into our own software." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <a href={data?.url ?? `https://github.com/szl-holdings/${slug ?? ''}`} target="_blank" rel="noreferrer"
           style={{ color: T.blue, fontSize: 13, textDecoration: 'underline' }}>↗ open on github.com</a>
        <button onClick={() => setRefreshTick(t => t + 1)} disabled={loading}
                style={{ background: T.surfaceHi, color: T.text, border: `1px solid ${T.border}`, padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? 'refreshing…' : 'force refresh (skip cache)'}
        </button>
        {data && <span style={{ fontSize: 11, color: T.dim }}>fetched {relAge(data.fetched_at)}</span>}
      </div>

      {loading && !data && <div style={{ color: T.dim, padding: 32 }}>Loading deep-dive from GitHub…</div>}
      {error && (
        <div style={{ background: '#2a1015', border: `1px solid ${T.red}`, color: T.red, padding: 16, borderRadius: 6, marginBottom: 16 }}>
          <b>Deep-dive failed:</b> {error}
          <div style={{ color: T.dim, fontSize: 11, marginTop: 6 }}>
            This is honest. Most likely: token missing/expired, repo renamed, or rate-limited. Check
            <code style={{ color: T.amber, marginLeft: 4 }}>/api/org-intelligence/healthz</code>.
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Meta strip */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: T.text, marginBottom: 10 }}>{data.meta.description ?? <span style={{ color: T.dim }}>(no description)</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 12 }}>
              <Stat label="language" value={data.meta.language ?? '—'} />
              <Stat label="size" value={data.meta.size_kb ? `${data.meta.size_kb.toLocaleString()} KB` : '—'} />
              <Stat label="pushed" value={relAge(data.meta.pushed_at)} hint={data.meta.pushed_at ?? undefined} />
              <Stat label="default branch" value={data.meta.default_branch ?? '—'} />
              <Stat label="open issues" value={String(data.meta.open_issues ?? 0)} />
              <Stat label="license" value={data.meta.license ?? '—'} />
              <Stat label="stars" value={String(data.meta.stargazers)} />
              <Stat label="forks" value={String(data.meta.forks)} />
            </div>
            {data.meta.topics.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.meta.topics.map(t => (
                  <span key={t} style={{ background: T.surfaceHi, color: T.purple, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>#{t}</span>
                ))}
              </div>
            )}
            {data.meta.archived && <div style={{ marginTop: 10, color: T.amber, fontSize: 12 }}>⚠ Repository is archived</div>}
          </div>

          {/* Two-col layout: left = commits/prs/releases, right = tree/langs/readme */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
            {/* LEFT */}
            <div>
              {/* Open PRs */}
              <Section title={`Open PRs (${Array.isArray(data.open_prs) ? data.open_prs.length : 'err'})`}>
                {Array.isArray(data.open_prs) ? (
                  data.open_prs.length === 0 ? <Empty>No open PRs.</Empty> :
                  data.open_prs.map(pr => (
                    <div key={pr.number} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <a href={pr.url} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 13, textDecoration: 'none' }}>
                        #{pr.number} {pr.draft ? '(draft) ' : ''}{pr.title}
                      </a>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{pr.author} · opened {relAge(pr.created_at)}</div>
                    </div>
                  ))
                ) : <ErrorLine err={data.open_prs._error} />}
              </Section>

              {/* Recent commits */}
              <Section title={`Recent commits (${Array.isArray(data.recent_commits) ? data.recent_commits.length : 'err'})`}>
                {Array.isArray(data.recent_commits) ? (
                  data.recent_commits.map(c => (
                    <div key={c.sha} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 12 }}>
                        <a href={c.url} target="_blank" rel="noreferrer" style={{ color: T.amber, fontFamily: 'monospace', textDecoration: 'none' }}>{c.sha}</a>
                        <span style={{ color: T.text, marginLeft: 8 }}>{c.subject}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{c.author} · {relAge(c.when)}</div>
                    </div>
                  ))
                ) : <ErrorLine err={data.recent_commits._error} />}
              </Section>

              {/* Releases */}
              <Section title={`Releases (${Array.isArray(data.releases) ? data.releases.length : 'err'})`}>
                {Array.isArray(data.releases) ? (
                  data.releases.length === 0 ? <Empty>No releases yet.</Empty> :
                  data.releases.map(r => (
                    <div key={r.tag} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: T.green, fontSize: 13, textDecoration: 'none' }}>
                        {r.tag} {r.draft ? '(draft) ' : ''}{r.prerelease ? '(pre) ' : ''}
                      </a>
                      <span style={{ color: T.dim, fontSize: 11, marginLeft: 8 }}>{r.name ?? ''} · {relAge(r.published_at)}</span>
                    </div>
                  ))
                ) : <ErrorLine err={data.releases._error} />}
              </Section>
            </div>

            {/* RIGHT */}
            <div>
              {/* Languages */}
              <Section title="Languages (bytes)">
                {!('_error' in data.languages_bytes) ? (
                  Object.entries(data.languages_bytes).sort((a, b) => b[1] - a[1]).map(([lang, bytes]) => {
                    const pct = langTotal ? (bytes / langTotal) * 100 : 0;
                    return (
                      <div key={lang} style={{ padding: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span>{lang}</span>
                          <span style={{ color: T.dim }}>{fmtBytes(bytes)} · {pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 6, background: T.surfaceHi, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: T.blue }} />
                        </div>
                      </div>
                    );
                  })
                ) : <ErrorLine err={(data.languages_bytes as { _error: string })._error} />}
              </Section>

              {/* Top-level tree */}
              <Section title={`Top-level (${Array.isArray(data.top_level) ? data.top_level.length : 'err'})`}>
                {Array.isArray(data.top_level) ? (
                  <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {data.top_level.map(f => (
                      <div key={f.name} style={{ padding: '2px 0' }}>
                        <a href={f.url} target="_blank" rel="noreferrer" style={{ color: f.type === 'dir' ? T.amber : T.text, textDecoration: 'none' }}>
                          {f.type === 'dir' ? '📁' : '📄'} {f.name}
                        </a>
                        {f.type === 'file' && f.size != null && <span style={{ color: T.dim, marginLeft: 8 }}>{fmtBytes(f.size)}</span>}
                      </div>
                    ))}
                  </div>
                ) : <ErrorLine err={(data.top_level as { _error: string })._error} />}
              </Section>

              {/* README excerpt */}
              <Section title={`README (${data.readme.ok ? `${data.readme.length?.toLocaleString()} chars, first 4000 shown` : 'unreachable'})`}>
                {data.readme.ok && data.readme.first_4000 ? (
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: T.text, fontFamily: 'monospace', maxHeight: 500, overflow: 'auto', background: T.bg, padding: 10, borderRadius: 4 }}>
                    {data.readme.first_4000}
                  </pre>
                ) : <ErrorLine err={data.readme._error} />}
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: T.surfaceHi, padding: 8, borderRadius: 4 }} title={hint}>
      <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 13, color: T.text, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: T.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: T.dim, fontSize: 12, padding: 8 }}>{children}</div>;
}

function ErrorLine({ err }: { err?: string }) {
  return <div style={{ color: T.red, fontSize: 11, padding: 6 }}>upstream: {err ?? 'unknown'}</div>;
}

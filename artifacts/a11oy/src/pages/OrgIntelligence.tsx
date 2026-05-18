import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui';

/**
 * OrgIntelligence — live board of the six public SZL/Ouroboros org repos.
 *
 * Polls `/api/org-intelligence/snapshot` every 60s and renders one card per
 * repo with language, size, last-push age, open issues, default branch, the
 * last three commit subjects, and a color-coded `shipped_signals[]` badge
 * row (OPERATIONAL/DAYLIGHT/THEATER). The summary chip row is computed live
 * from the snapshot (never hardcoded — drift item from follow-up #5206).
 */

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHi: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  green: '#4ade80',
  amber: '#f59e0b',
  red: '#e05252',
  blue: '#60a5fa',
  gold: '#c9b787',
};

type Verdict = 'OPERATIONAL' | 'DAYLIGHT' | 'THEATER';

interface RecentCommit {
  sha?: string;
  message?: string;
  author?: string;
  date?: string;
  url?: string;
}

interface RepoEntry {
  slug: string;
  description?: string | null;
  language?: string | null;
  size_kb?: number;
  pushed_at?: string;
  default_branch?: string;
  open_issues?: number;
  recent_commits?: RecentCommit[];
  shipped_signals?: Array<{ verdict: Verdict; label: string; detail?: string }>;
  _error?: string;
  _http_code?: number;
}

interface Snapshot {
  generated_at?: string;
  ttl_seconds?: number;
  product?: { slug?: string; title?: string };
  anatomy_region?: { region?: string; quechua?: string; meaning?: string };
  author?: string;
  doctrine?: { version?: string };
  mechanisms?: unknown;
  doi_bindings?: Array<{ zenodo_id: string; label: string; url: string }>;
  b6_org_repos?: RepoEntry[];
}

function verdictColor(v: Verdict): string {
  if (v === 'OPERATIONAL') return T.green;
  if (v === 'DAYLIGHT') return T.amber;
  return T.red;
}

function formatAge(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function formatSize(kb?: number): string {
  if (kb === undefined || kb === null) return '—';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function OrgIntelligence() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const r = await fetch('/api/org-intelligence/snapshot', { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) {
            setError(`HTTP ${r.status}`);
            setLoading(false);
            setLastRefresh(Date.now());
          }
          return;
        }
        const data: Snapshot = await r.json();
        if (cancelled) return;
        setSnap(data);
        setError(null);
        setLoading(false);
        setLastRefresh(Date.now());
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
        setLastRefresh(Date.now());
      }
    }

    poll();
    const id = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const repos = snap?.b6_org_repos ?? [];
  const totalRepos = repos.length;
  const reachable = repos.filter((r) => !r._error).length;

  let operational = 0;
  let daylight = 0;
  let theater = 0;
  for (const r of repos) {
    const sigs = r.shipped_signals ?? [];
    if (sigs.length === 0) continue;
    // Worst verdict wins for repo-level tally.
    const verdicts = sigs.map((s) => s.verdict);
    if (verdicts.includes('THEATER')) theater += 1;
    else if (verdicts.includes('DAYLIGHT')) daylight += 1;
    else operational += 1;
  }

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', padding: '32px 24px' }}>
      <PageHeader
        eyebrow="A11OY · BRAIN STEM · uma"
        title="Org Intelligence"
        subtitle={`Live state of six public org repos · polling every 60s · last refresh ${new Date(lastRefresh).toLocaleTimeString()}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatTile
          label="Repos reachable"
          value={`${reachable} / ${totalRepos}`}
          accent={reachable === totalRepos && totalRepos > 0 ? T.green : T.amber}
        />
        <StatTile label="Operational" value={String(operational)} accent={T.green} />
        <StatTile label="Daylight" value={String(daylight)} accent={T.amber} />
        <StatTile label="Theater" value={String(theater)} accent={T.red} />
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                padding: 16,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                minHeight: 220,
                opacity: 0.5,
              }}
            >
              <div style={{ height: 14, width: '40%', background: T.surfaceHi, borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 10, width: '70%', background: T.surfaceHi, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 10, width: '60%', background: T.surfaceHi, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 10, width: '50%', background: T.surfaceHi, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && totalRepos === 0 && (
        <div
          style={{
            padding: 16,
            background: T.surface,
            border: `1px solid ${T.red}55`,
            borderRadius: 8,
            color: T.red,
            fontSize: 13,
          }}
        >
          <strong>Endpoint error:</strong> {error}
          <div style={{ marginTop: 6, color: T.dim, fontSize: 12 }}>
            <code style={{ color: T.text }}>/api/org-intelligence/snapshot</code> did not return a usable
            snapshot. Verify the GitHub integration token is configured and re-poll in 60s.
          </div>
        </div>
      )}

      {!loading && totalRepos > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          {repos.map((r) => (
            <RepoCard key={r.slug} repo={r} />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          fontSize: 12,
          color: T.dim,
          lineHeight: 1.6,
        }}
      >
        <div style={{ color: T.text, fontWeight: 600, marginBottom: 8 }}>About this board</div>
        Every card above is a live read of the corresponding public GitHub repo via
        <code style={{ color: T.text }}> /api/org-intelligence/snapshot</code>. Server-side cached
        ~30 minutes for rate-limit hygiene. The summary chips and per-card verdicts are computed
        live from the snapshot — never hardcoded. <code style={{ color: T.text }}>OPERATIONAL</code>{' '}
        means real code is present, <code style={{ color: T.text }}>DAYLIGHT</code> means docs-shell
        only, <code style={{ color: T.text }}>THEATER</code> means a claim outruns reality.
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 24, color: accent, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function RepoCard({ repo }: { repo: RepoEntry }) {
  const hasError = Boolean(repo._error);
  const commits = repo.recent_commits ?? [];
  const signals = repo.shipped_signals ?? [];

  return (
    <div
      style={{
        padding: 16,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        borderLeft: `3px solid ${hasError ? T.red : T.blue}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{repo.slug}</div>
        <div style={{ fontSize: 11, color: hasError ? T.red : T.green }}>
          {hasError ? `○ ${repo._http_code ?? 'err'}` : '● live'}
        </div>
      </div>

      {repo.description && (
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 12, lineHeight: 1.5 }}>
          {repo.description}
        </div>
      )}

      {hasError ? (
        <div style={{ fontSize: 11, color: T.red, marginTop: 8 }}>
          error: {repo._error}
          {repo._http_code !== undefined && <> · http {repo._http_code}</>}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6,
              fontSize: 11,
              color: T.dim,
              marginBottom: 12,
            }}
          >
            <div>
              <span style={{ color: T.muted }}>lang </span>
              <span style={{ color: T.gold }}>{repo.language ?? '—'}</span>
            </div>
            <div>
              <span style={{ color: T.muted }}>size </span>
              <span style={{ color: T.text }}>{formatSize(repo.size_kb)}</span>
            </div>
            <div>
              <span style={{ color: T.muted }}>pushed </span>
              <span style={{ color: T.text }}>{formatAge(repo.pushed_at)}</span>
            </div>
            <div>
              <span style={{ color: T.muted }}>issues </span>
              <span style={{ color: T.text }}>{repo.open_issues ?? 0}</span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: T.muted }}>branch </span>
              <span style={{ color: T.text }}>{repo.default_branch ?? '—'}</span>
            </div>
          </div>

          {signals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {signals.map((s, i) => (
                <span
                  key={`${s.label}-${i}`}
                  title={s.detail ?? s.label}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 7px',
                    borderRadius: 3,
                    color: verdictColor(s.verdict),
                    background: `${verdictColor(s.verdict)}1a`,
                    border: `1px solid ${verdictColor(s.verdict)}55`,
                  }}
                >
                  {s.verdict} · {s.label}
                </span>
              ))}
            </div>
          )}

          {commits.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Recent commits
              </div>
              {commits.slice(0, 3).map((c, i) => (
                <div key={c.sha ?? i} style={{ fontSize: 11, color: T.dim, marginBottom: 4, lineHeight: 1.4 }}>
                  <span style={{ color: T.gold, fontFamily: 'monospace' }}>
                    {c.sha ? c.sha.slice(0, 7) : '·······'}
                  </span>{' '}
                  <span style={{ color: T.text }}>{(c.message ?? '').split('\n')[0]}</span>
                  {c.date && <span style={{ color: T.muted }}> · {formatAge(c.date)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

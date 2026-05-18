// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Hash,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

/**
 * SZL Operational Core — live render of the master operational payload.
 *
 * Sections (mirror payload):
 *   A1 — 17 Zenodo DOIs, each with a live HEAD-status badge from doi.org
 *   A2 — 15 GitHub repos, each with live release / push / open-PR data
 *   A3 — the 6 machine-verified mechanisms (static doctrine, linked)
 *   A4 — the 36 open PRs in the unblock queue, each with live merge state
 *   A5 — 14 active crons (static, with cadence)
 *   A6 — 3 pending Zenodo mints (static, awaiting fresh token)
 *
 * Data source: GET /api/szl-ops/snapshot (server-side aggregator using the
 * Replit GitHub connector and parallel doi.org HEAD checks; 60s in-memory
 * cache). Nothing on this page is computed by the browser.
 *
 * Author byline canon: Stephen P. Lutar Jr. (Doctrine v6 bans "Stephen Paul").
 */

const API_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

type DoiStatus = 'live' | 'down' | 'unknown';
type PrStatus = 'open' | 'merged' | 'closed' | 'unknown' | 'unauth' | 'error';
type RepoStatus = 'ok' | 'unauth' | 'error';
type PrCategory = 'doctrine_fixes' | 'doi_backfills' | 'doctrine_sweeps' | 'features';

interface SnapshotDoi {
  zenodo_id: string;
  date: string;
  version: string;
  type: 'paper' | 'concept' | 'software';
  title: string;
  url: string;
  http_code: number;
  status: DoiStatus;
}

interface SnapshotRepo {
  name: string;
  url: string;
  latest_release_label: string;
  purpose: string;
  doi_in_citation: string;
  stars: number | null;
  open_pr_count: number | null;
  default_branch: string | null;
  pushed_at: string | null;
  html_url: string;
  status: RepoStatus;
}

interface SnapshotMechanism {
  num: string;
  title: string;
  location: string;
  url: string;
}

interface SnapshotPr {
  repo: string;
  num: number;
  category: PrCategory;
  label: string;
  state: string | null;
  merged: boolean | null;
  mergeable_state: string | null;
  title: string | null;
  html_url: string;
  draft: boolean | null;
  status: PrStatus;
}

interface SnapshotCron {
  id: string;
  schedule: string;
  task: string;
}

interface SnapshotPendingDoi {
  slug: string;
  release_url: string;
  kind: string;
}

interface Snapshot {
  generated_at: string;
  ttl_seconds: number;
  github_authenticated: boolean;
  author: { name: string; email: string; orcid: string; orcid_url: string };
  doctrine: { version: string; ban_list: string[]; byline_rule: string };
  org: { slug: string; repo_count: number; doi_count: number };
  a1_dois: SnapshotDoi[];
  a2_repos: SnapshotRepo[];
  a3_mechanisms: SnapshotMechanism[];
  a4_pr_queue: {
    total: number;
    by_category: Record<PrCategory, number>;
    items: SnapshotPr[];
  };
  a5_crons: SnapshotCron[];
  a6_pending_dois: SnapshotPendingDoi[];
}

const CATEGORY_LABEL: Record<PrCategory, string> = {
  doctrine_fixes: 'Doctrine fixes',
  doi_backfills: 'DOI backfills',
  doctrine_sweeps: 'Doctrine sweeps',
  features: 'Features',
};

function fmtAge(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function doiBadge(s: DoiStatus, code: number) {
  if (s === 'live')
    return (
      <span className="inline-flex items-center gap-1 text-emerald-300 text-[10px] font-mono">
        <CheckCircle2 className="w-3 h-3" /> {code}
      </span>
    );
  if (s === 'down')
    return (
      <span className="inline-flex items-center gap-1 text-red-300 text-[10px] font-mono">
        <XCircle className="w-3 h-3" /> {code}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-white/40 text-[10px] font-mono">
      <AlertCircle className="w-3 h-3" /> n/a
    </span>
  );
}

function prBadge(s: PrStatus) {
  const map: Record<PrStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    open:    { label: 'OPEN',    cls: 'text-blue-300 border-blue-500/30 bg-blue-500/10',     Icon: GitPullRequest },
    merged:  { label: 'MERGED',  cls: 'text-purple-300 border-purple-500/30 bg-purple-500/10', Icon: GitMerge },
    closed:  { label: 'CLOSED',  cls: 'text-white/40 border-white/10 bg-white/5',             Icon: XCircle },
    unknown: { label: '404',     cls: 'text-amber-300 border-amber-500/30 bg-amber-500/10',  Icon: AlertCircle },
    unauth:  { label: 'AUTH',    cls: 'text-amber-300 border-amber-500/30 bg-amber-500/10',  Icon: ShieldAlert },
    error:   { label: 'ERR',     cls: 'text-red-300 border-red-500/30 bg-red-500/10',        Icon: XCircle },
  };
  const { label, cls, Icon } = map[s];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[9px] font-mono ${cls}`}>
      <Icon className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

export default function SzlOperationalCore() {
  const q = useQuery<Snapshot>({
    queryKey: ['szl-ops-snapshot'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/szl-ops/snapshot`, { credentials: 'include' });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        let msg = `HTTP ${r.status}`;
        try {
          const j = JSON.parse(text);
          if (typeof j?.message === 'string') msg = j.message;
        } catch { /* keep */ }
        throw new Error(msg);
      }
      return (await r.json()) as Snapshot;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const snap = q.data;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SZL Operational Core</h1>
          <p className="text-sm text-white/60 mt-1 max-w-3xl">
            Live render of the SZL Holdings master operational payload — DOIs,
            repos, PRs, crons, and machine-verified mechanisms. Every status
            badge on this page is fetched from the source of truth (doi.org +
            GitHub) and cached in-process for 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {snap && (
            <span className="text-[10px] font-mono text-white/40">
              gen {fmtAge(snap.generated_at)}
              {snap.github_authenticated ? ' · gh auth' : ' · gh anon'}
            </span>
          )}
          <button
            type="button"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/15 rounded hover:bg-white/5 disabled:opacity-50"
            data-testid="szl-ops-refresh"
          >
            {q.isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
      </header>

      {q.isLoading && (
        <div className="text-sm text-white/50 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading snapshot…
        </div>
      )}

      {q.error && !snap && (
        <div className="border border-red-500/30 bg-red-500/5 rounded p-4 text-sm">
          <p className="font-semibold text-red-300">Snapshot fetch failed</p>
          <p className="text-xs text-red-200/70 mt-1">
            {q.error instanceof Error ? q.error.message : 'unknown'}
          </p>
        </div>
      )}

      {snap && (
        <>
          {/* Author + doctrine strip */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border border-white/10 rounded p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Author</p>
              <p className="font-semibold mt-1">{snap.author.name}</p>
              <p className="text-white/60">{snap.author.email}</p>
              <a className="text-[#c9b787] hover:underline inline-flex items-center gap-1 mt-1" href={snap.author.orcid_url} target="_blank" rel="noreferrer">
                ORCID {snap.author.orcid} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="border border-white/10 rounded p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Org · {snap.org.slug}</p>
              <p className="mt-1">
                <span className="text-2xl font-mono">{snap.org.repo_count}</span>
                <span className="text-white/40 text-[10px] ml-1">repos</span>
                <span className="text-2xl font-mono ml-3">{snap.org.doi_count}</span>
                <span className="text-white/40 text-[10px] ml-1">DOIs</span>
              </p>
              <p className="text-white/50 mt-1">76 packages · 1,220 tests</p>
            </div>
            <div className="border border-white/10 rounded p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                Doctrine {snap.doctrine.version} · ban-list
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {snap.doctrine.ban_list.map((b) => (
                  <span key={b} className="text-[10px] font-mono px-1.5 py-0.5 border border-red-500/30 bg-red-500/5 text-red-300 rounded">
                    {b}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/40 mt-2">{snap.doctrine.byline_rule}</p>
            </div>
          </section>

          {/* A1 DOI ledger */}
          <Section title="A1 · Canonical DOI Ledger" count={snap.a1_dois.length}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {snap.a1_dois.map((d) => (
                <a
                  key={d.zenodo_id}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/10 hover:border-white/25 rounded p-3 transition-colors"
                  data-testid={`doi-${d.zenodo_id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono text-white/40">
                      10.5281/zenodo.{d.zenodo_id} · {d.date} · {d.version} · {d.type}
                    </span>
                    {doiBadge(d.status, d.http_code)}
                  </div>
                  <p className="text-sm">{d.title}</p>
                </a>
              ))}
            </div>
          </Section>

          {/* A2 Repo inventory */}
          <Section title="A2 · Repo Inventory" count={snap.a2_repos.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {snap.a2_repos.map((r) => (
                <a
                  key={r.name}
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/10 hover:border-white/25 rounded p-3 transition-colors"
                  data-testid={`repo-${r.name}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-sm">{r.name}</p>
                    {r.status === 'ok' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : r.status === 'unauth' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-white/60">{r.purpose}</p>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono text-white/50">
                    <div>
                      <p className="text-white/30 uppercase text-[9px]">release</p>
                      <p>{r.latest_release_label}</p>
                    </div>
                    <div>
                      <p className="text-white/30 uppercase text-[9px]">stars</p>
                      <p>{r.stars ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/30 uppercase text-[9px]">pushed</p>
                      <p>{fmtAge(r.pushed_at)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-white/30 mt-1">
                    DOI {r.doi_in_citation} · open issues+PRs: {r.open_pr_count ?? '—'}
                  </p>
                </a>
              ))}
            </div>
          </Section>

          {/* A3 Mechanisms */}
          <Section title="A3 · Six Machine-Verified Mechanisms" count={snap.a3_mechanisms.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {snap.a3_mechanisms.map((m) => (
                <a
                  key={m.num}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 border border-white/10 hover:border-white/25 rounded p-3 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#c9b787] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">
                      <span className="font-mono text-white/40 mr-2">{m.num}</span>
                      {m.title}
                    </p>
                    <p className="text-[11px] text-white/50 font-mono mt-0.5">{m.location}</p>
                  </div>
                </a>
              ))}
            </div>
          </Section>

          {/* A4 PR Queue */}
          <Section title={`A4 · Open PR Unblock Queue`} count={snap.a4_pr_queue.total}>
            <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
              {(Object.keys(snap.a4_pr_queue.by_category) as PrCategory[]).map((c) => (
                <span key={c} className="px-2 py-0.5 border border-white/10 rounded font-mono">
                  {CATEGORY_LABEL[c]}: {snap.a4_pr_queue.by_category[c]}
                </span>
              ))}
              <span className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 rounded font-mono">
                merged: {snap.a4_pr_queue.items.filter((p) => p.status === 'merged').length}
              </span>
              <span className="px-2 py-0.5 border border-blue-500/30 bg-blue-500/5 text-blue-300 rounded font-mono">
                still open: {snap.a4_pr_queue.items.filter((p) => p.status === 'open').length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {snap.a4_pr_queue.items.map((p) => (
                <a
                  key={`${p.repo}#${p.num}`}
                  href={p.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/10 hover:border-white/25 rounded p-2.5 transition-colors"
                  data-testid={`pr-${p.repo}-${p.num}`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-mono text-[11px] truncate">
                      {p.repo}#{p.num}
                    </span>
                    {prBadge(p.status)}
                  </div>
                  <p className="text-xs text-white/70 truncate">{p.title ?? p.label}</p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {CATEGORY_LABEL[p.category]}
                    {p.mergeable_state ? ` · ${p.mergeable_state}` : ''}
                    {p.draft ? ' · draft' : ''}
                  </p>
                </a>
              ))}
            </div>
          </Section>

          {/* A5 Crons */}
          <Section title="A5 · Active Crons" count={snap.a5_crons.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {snap.a5_crons.map((c) => (
                <div key={c.id} className="flex items-start gap-3 border border-white/10 rounded p-3">
                  <Clock className="w-4 h-4 text-[#c9b787] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-white/40">{c.id}</span>
                      <span className="text-[10px] font-mono text-white/60">{c.schedule}</span>
                    </div>
                    <p className="text-sm mt-0.5">{c.task}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* A6 Pending DOIs */}
          <Section title="A6 · Pending Zenodo Mints" count={snap.a6_pending_dois.length}>
            <div className="border border-amber-500/30 bg-amber-500/5 rounded p-3 mb-3 text-xs text-amber-200/80">
              These mints are blocked on a fresh Zenodo token with{' '}
              <code className="font-mono">deposit:write</code> +{' '}
              <code className="font-mono">deposit:actions</code> scopes. Once
              provided, the mint sequence in payload §A6 runs end-to-end.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {snap.a6_pending_dois.map((p) => (
                <a
                  key={p.slug}
                  href={p.release_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/10 hover:border-white/25 rounded p-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3.5 h-3.5 text-white/40" />
                    <p className="font-mono text-xs text-white/40">{p.kind}</p>
                  </div>
                  <p className="text-sm">{p.slug}</p>
                  <p className="text-[10px] text-white/40 mt-1 truncate">
                    release tag live →
                  </p>
                </a>
              ))}
            </div>
          </Section>

          <footer className="text-[10px] font-mono text-white/30 text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2">
            <BookOpen className="w-3 h-3" />
            snapshot ttl {snap.ttl_seconds}s · generated {snap.generated_at}
            {!snap.github_authenticated && (
              <span className="text-amber-400 ml-2">⚠ GitHub anonymous — repo/PR data may be rate-limited</span>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2 sticky top-0 bg-[var(--color-a11oy-navy,#0a0a0a)] py-2 z-10 border-b border-white/5">
        {title}
        <span className="text-[10px] font-mono text-white/40">· {count}</span>
      </h2>
      {children}
    </section>
  );
}

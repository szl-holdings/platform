import { Router } from 'express';

/**
 * SZL Operational Core snapshot.
 *
 * Surfaces the master operational payload as live, queryable JSON for any
 * artifact UI (a11oy primarily). Every section is either:
 *   (a) live-fetched from the source of truth (DOI HEAD checks, GitHub REST
 *       for repo + PR state), or
 *   (b) static doctrine constants transcribed verbatim from the payload
 *       (six machine-verified mechanisms, 14 crons, pending Zenodo mints,
 *       author byline, ban-list).
 *
 * Doctrine byline canon: "Stephen P. Lutar Jr." — the v6 ban-list forbids
 * "Stephen Paul"; "Jr." is the canonical suffix.
 *
 * Cached in-process for 60s to stay well inside GitHub's authenticated
 * rate limit (5000/hr) even under heavy poll fan-out.
 */

const router: Router = Router();

// ---------------------------------------------------------------------------
// Static doctrine (transcribed from payload — single source of truth here)
// ---------------------------------------------------------------------------

const AUTHOR = {
  name: 'Stephen P. Lutar Jr.',
  email: 'stephen@szlholdings.com',
  orcid: '0009-0001-0110-4173',
  orcid_url: 'https://orcid.org/0009-0001-0110-4173',
} as const;

const DOCTRINE = {
  version: 'v6',
  ban_list: [
    'AlloyScape',
    'Glass Wing',
    'Glasswing',
    'Mythos',
    'Stephen Paul',
    'Perplexity Computer',
  ] as readonly string[],
  byline_rule: 'Use "Stephen P." — never "Stephen Paul". "Jr." is canonical.',
};

interface DoiSpec {
  zenodo_id: string;
  date: string;
  version: string;
  type: 'paper' | 'concept' | 'software';
  title: string;
}

const DOI_LEDGER: readonly DoiSpec[] = [
  { zenodo_id: '19867281', date: '2026-04-28', version: 'paper-v1',  type: 'paper',    title: 'The Loop Is the Product (v1) — Bounded Recursion as a System Primitive' },
  { zenodo_id: '19934129', date: '2026-04-30', version: 'paper-v2',  type: 'paper',    title: 'The Loop Is the Product (v2) — Empirical Companion' },
  { zenodo_id: '19944926', date: 'concept',     version: 'umbrella',  type: 'concept',  title: 'SZL Concept DOI — umbrella record for all thesis versions' },
  { zenodo_id: '19983066', date: '2026-05-02', version: 'paper-v3',  type: 'paper',    title: 'The Lutar Invariant (v3) — Axiomatic Trust Aggregator' },
  { zenodo_id: '20020841', date: '2026-05-04', version: 'paper-v4',  type: 'paper',    title: 'The Lutar Omega Formalism (v4) — Energy-Mass-Information Coupling' },
  { zenodo_id: '20020846', date: '2026-05-04', version: 'paper-v5',  type: 'paper',    title: 'Lineage-Aware RAG (v5) — Prisca-GraphRAG' },
  { zenodo_id: '20020845', date: '2026-05-04', version: 'paper-v6',  type: 'paper',    title: 'Sealed Constitutional Guardrails (v6)' },
  { zenodo_id: '20020848', date: '2026-05-04', version: 'paper-v7',  type: 'paper',    title: 'Tiered Continual Learning (v7) — Hopfield Retrieval' },
  { zenodo_id: '20020849', date: '2026-05-04', version: 'paper-v8',  type: 'paper',    title: 'Active Inference under Free-Energy Minimization (v8)' },
  { zenodo_id: '20053148', date: '2026-05-06', version: 'paper-v9',  type: 'paper',    title: 'Unified Operational Account of the Lutar Invariant Family (v9)' },
  { zenodo_id: '20053163', date: '2026-05-06', version: 'paper-v10', type: 'paper',    title: 'The Audit-Closure Operator Λ₁₀ (v10)' },
  { zenodo_id: '20119582', date: '2026-05-11', version: 'paper-v11', type: 'paper',    title: 'Applied Λ (v11) — Measured Per-Request Latency Overhead' },
  { zenodo_id: '20162352', date: '2026-05-13', version: 'v6.3.0',    type: 'software', title: 'Ouroboros Runtime — Bounded-Loop Audit-Closure System' },
  { zenodo_id: '20173912', date: '2026-05-14', version: 'v13',       type: 'paper',    title: 'v13 Master Thesis — Make-It-Real Audit + Doctrine v2' },
  { zenodo_id: '20173920', date: '2026-05-14', version: 'v12',       type: 'paper',    title: 'v12 Master Thesis — Λ-Invariant Stack' },
  { zenodo_id: '20174600', date: '2026-05-14', version: '2.0.0',     type: 'paper',    title: 'SZL Doctrine v2 — 9 Canonical Axes (Λ DOI)' },
  { zenodo_id: '20195368', date: '2026-05-14', version: 'v13',       type: 'paper',    title: 'v13 Master Thesis — Λ-Invariant Stack (final)' },
];

interface RepoSpec {
  name: string;
  latest_release_label: string;
  purpose: string;
  doi_in_citation: string;
}

const REPO_INVENTORY: readonly RepoSpec[] = [
  { name: 'ouroboros',         latest_release_label: 'v6.3.0',          purpose: 'Bounded-loop runtime kernel',           doi_in_citation: '19944926' },
  { name: 'ouroboros-thesis',  latest_release_label: 'paper-v12-1.0.0', purpose: 'Papers v1-v14 source',                  doi_in_citation: '19944926 (concept)' },
  { name: 'lutar-lean',        latest_release_label: 'v0.1.0',          purpose: 'Lean 4 formalization of Λ invariant',   doi_in_citation: '20053148 (pending refresh)' },
  { name: 'a11oy',             latest_release_label: 'v1.0.0-alpha',    purpose: 'Governed agentic execution fabric',     doi_in_citation: '19944926' },
  { name: 'amaru',             latest_release_label: 'v1.0.0-alpha',    purpose: 'Convergent multi-source data sync',     doi_in_citation: '19944926' },
  { name: 'sentra',            latest_release_label: 'v1.0.0-alpha',    purpose: 'Cyber resilience command',              doi_in_citation: '19944926' },
  { name: 'terra',             latest_release_label: 'v1.0.0-alpha',    purpose: 'Real estate intelligence',              doi_in_citation: '19944926' },
  { name: 'vessels',           latest_release_label: 'v1.0.0-alpha',    purpose: 'Maritime fleet intelligence',           doi_in_citation: '19944926' },
  { name: 'counsel',           latest_release_label: 'v1.0.0-alpha',    purpose: 'Legal matter command',                  doi_in_citation: '19944926' },
  { name: 'carlota-jo',        latest_release_label: 'v1.0.0-alpha',    purpose: 'Private advisory operations',           doi_in_citation: '19944926' },
  { name: 'szl-trust',         latest_release_label: '—',               purpose: 'Public trust portal',                   doi_in_citation: '—' },
  { name: 'szl-cookbook',      latest_release_label: '—',               purpose: 'Engineering cookbook',                  doi_in_citation: '—' },
  { name: 'szl-brand',         latest_release_label: '—',               purpose: 'Brand assets',                          doi_in_citation: '—' },
  { name: '.github',           latest_release_label: '—',               purpose: 'Org-wide reusable workflows',           doi_in_citation: '19944926' },
  { name: 'agi-forecast',      latest_release_label: '—',               purpose: 'Lutar-Forecast Gauge',                  doi_in_citation: '—' },
];

const MECHANISMS = [
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          location: 'lutar-lean/Lutar/Invariant.lean',                     url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', location: 'ouroboros v6.2 substrate',                            url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded admit)', location: 'Paper v11 §3.3 — DOI 20119582',                    url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     location: 'Paper v11 §3.4',                                      url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'V',   title: 'Witness diversity (Gauss class-number)',   location: 'Paper v12 §4 — DOI 20173920',                         url: 'https://doi.org/10.5281/zenodo.20173920' },
  { num: 'VI',  title: 'Reference-vector parity (bit-exact)',      location: 'lutar-lean/RefVectors.lean',                          url: 'https://github.com/szl-holdings/lutar-lean/blob/main/RefVectors.lean' },
] as const;

interface PrSpec {
  repo: string;
  num: number;
  category: 'doctrine_fixes' | 'doi_backfills' | 'doctrine_sweeps' | 'features';
  label: string;
}

const PR_QUEUE: readonly PrSpec[] = [
  // Doctrine fixes (15) — CITATION.cff `name-suffix "Jr."`
  { repo: 'amaru',            num: 27, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'a11oy',            num: 29, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'sentra',           num: 27, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'terra',            num: 27, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'vessels',          num: 27, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'counsel',          num: 26, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'carlota-jo',       num: 26, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'ouroboros',        num: 37, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'ouroboros-thesis', num: 55, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'ouroboros-thesis', num: 56, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'lutar-lean',       num: 21, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'szl-trust',        num: 17, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'szl-cookbook',     num: 16, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: 'szl-brand',        num: 19, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  { repo: '.github',          num: 39, category: 'doctrine_fixes', label: 'CITATION.cff name-suffix "Jr."' },
  // DOI backfills (10) — v13 DOI badge
  { repo: 'amaru',            num: 28, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'a11oy',            num: 30, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'sentra',           num: 28, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'terra',            num: 28, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'vessels',          num: 28, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'counsel',          num: 27, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'carlota-jo',       num: 27, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'ouroboros-thesis', num: 58, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: 'ouroboros-thesis', num: 60, category: 'doi_backfills',  label: 'v13 DOI badge' },
  { repo: '.github',          num: 40, category: 'doi_backfills',  label: 'v13 DOI badge' },
  // Doctrine sweeps (5)
  { repo: 'amaru',            num: 26, category: 'doctrine_sweeps', label: 'Doctrine sweep' },
  { repo: 'sentra',           num: 26, category: 'doctrine_sweeps', label: 'Doctrine sweep' },
  { repo: 'terra',            num: 26, category: 'doctrine_sweeps', label: 'Doctrine sweep' },
  { repo: 'vessels',          num: 26, category: 'doctrine_sweeps', label: 'Doctrine sweep' },
  { repo: 'carlota-jo',       num: 25, category: 'doctrine_sweeps', label: 'Doctrine sweep' },
  // Features (6)
  { repo: 'ouroboros-thesis', num: 54, category: 'features',        label: 'phd-ml-ai' },
  { repo: 'ouroboros-thesis', num: 57, category: 'features',        label: 'v14 arXiv submission' },
  { repo: 'ouroboros',        num: 38, category: 'features',        label: 'CWE-209 hardening' },
  { repo: 'ouroboros',        num: 39, category: 'features',        label: 'ClusterFuzzLite' },
  { repo: 'lutar-lean',       num: 22, category: 'features',        label: 'DOI badge' },
  { repo: 'agi-forecast',     num: 14, category: 'features',        label: 'Action SHA pins' },
];

const CRONS = [
  { id: '488505a8', schedule: 'Daily 11:00 UTC',     task: 'Daily health pulse (15 repos + 12 DOIs)' },
  { id: 'fff8f098', schedule: 'Mon 12:00 UTC',       task: 'Weekly Series A hygiene' },
  { id: 'f13b4d08', schedule: 'Mon 01:00 UTC',       task: 'Branch graveyard sweep' },
  { id: '6a09e1d2', schedule: 'Mon+Thu 13:00 UTC',   task: 'Scorecard remediate' },
  { id: 'cd08b398', schedule: 'Tue+Fri 13:00 UTC',   task: 'Scorecard verify' },
  { id: 'f3d53653', schedule: 'Wed 10:00 UTC',       task: 'DOI + arXiv health' },
  { id: '33bfcd6e', schedule: 'Thu 12:00 UTC',       task: 'Anatomy figure rebuild' },
  { id: '6bde5c42', schedule: 'Fri 12:00 UTC',       task: 'Competitor + AI market intel' },
  { id: '310ef0b6', schedule: 'Sun 14:00 UTC',       task: 'Audit-of-audits meta-cron' },
  { id: 'ab29919e', schedule: '1st 13:00 UTC',       task: 'Monthly Series A deep audit' },
  { id: 'c5efff90', schedule: '1st 14:00 UTC',       task: 'Monthly personal finance pulse' },
  { id: '8ea230bb', schedule: '1st Wed 13:00 UTC',   task: 'Monthly Action SHA-pin sweep' },
  { id: '0f116a2b', schedule: '1st Tue 13:00 UTC',   task: 'Monthly Lean + Mathlib drift' },
  { id: '42b01833', schedule: '1st Thu 11:00 UTC',   task: 'Monthly thesis citation audit' },
] as const;

const PENDING_DOIS = [
  { slug: 'lutar-lean v0.1.0',          release_url: 'https://github.com/szl-holdings/lutar-lean/releases/tag/v0.1.0',                        kind: 'software' },
  { slug: 'v13-exhaustive — Anatomy',   release_url: 'https://github.com/szl-holdings/ouroboros-thesis/releases/tag/paper-v13-exhaustive-1.0.0', kind: 'paper'    },
  { slug: 'v14 arXiv submission',       release_url: 'https://github.com/szl-holdings/ouroboros-thesis/releases/tag/paper-v14-1.0.0-draft',    kind: 'paper'    },
] as const;

// ---------------------------------------------------------------------------
// GitHub token via Replit Connectors (server-side)
// ---------------------------------------------------------------------------

interface GithubToken {
  token: string;
  fetched_at: number;
}
let _ghTokenCache: GithubToken | null = null;
const GH_TOKEN_TTL_MS = 5 * 60_000;

async function getGithubToken(): Promise<string | null> {
  if (_ghTokenCache && Date.now() - _ghTokenCache.fetched_at < GH_TOKEN_TTL_MS) {
    return _ghTokenCache.token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) return null;
  let auth: string | null = null;
  if (process.env.REPL_IDENTITY) auth = `repl ${process.env.REPL_IDENTITY}`;
  else if (process.env.WEB_REPL_RENEWAL) auth = `depl ${process.env.WEB_REPL_RENEWAL}`;
  if (!auth) return null;
  try {
    const r = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
      {
        headers: { Accept: 'application/json', X_REPLIT_TOKEN: auth },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: Array<{ settings?: { access_token?: string; oauth?: { credentials?: { access_token?: string } } } }> };
    const item = j.items?.[0];
    const token =
      item?.settings?.access_token ??
      item?.settings?.oauth?.credentials?.access_token ??
      null;
    if (token) _ghTokenCache = { token, fetched_at: Date.now() };
    return token;
  } catch {
    return null;
  }
}

async function ghFetch(path: string, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'szl-ops-snapshot',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(8_000),
  });
}

// ---------------------------------------------------------------------------
// Live status fetchers
// ---------------------------------------------------------------------------

async function checkDoi(zenodo_id: string): Promise<{ http_code: number; status: 'live' | 'down' | 'unknown' }> {
  try {
    const r = await fetch(`https://doi.org/10.5281/zenodo.${zenodo_id}`, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(6_000),
    });
    return {
      http_code: r.status,
      status: r.status >= 200 && r.status < 400 ? 'live' : 'down',
    };
  } catch {
    return { http_code: 0, status: 'unknown' };
  }
}

interface RepoLive {
  stars: number | null;
  open_pr_count: number | null;
  default_branch: string | null;
  pushed_at: string | null;
  html_url: string;
  status: 'ok' | 'unauth' | 'error';
}

async function fetchRepo(name: string, token: string | null): Promise<RepoLive> {
  const url = `https://github.com/szl-holdings/${name}`;
  try {
    const r = await ghFetch(`/repos/szl-holdings/${encodeURIComponent(name)}`, token);
    if (r.status === 404 || r.status === 401 || r.status === 403) {
      return { stars: null, open_pr_count: null, default_branch: null, pushed_at: null, html_url: url, status: r.status === 404 ? 'error' : 'unauth' };
    }
    if (!r.ok) return { stars: null, open_pr_count: null, default_branch: null, pushed_at: null, html_url: url, status: 'error' };
    const j = (await r.json()) as {
      stargazers_count?: number;
      open_issues_count?: number;
      default_branch?: string;
      pushed_at?: string;
      html_url?: string;
    };
    return {
      stars: j.stargazers_count ?? null,
      open_pr_count: j.open_issues_count ?? null, // close-enough; includes issues
      default_branch: j.default_branch ?? null,
      pushed_at: j.pushed_at ?? null,
      html_url: j.html_url ?? url,
      status: 'ok',
    };
  } catch {
    return { stars: null, open_pr_count: null, default_branch: null, pushed_at: null, html_url: url, status: 'error' };
  }
}

interface PrLive {
  state: string | null;
  merged: boolean | null;
  mergeable_state: string | null;
  title: string | null;
  html_url: string;
  draft: boolean | null;
  status: 'open' | 'merged' | 'closed' | 'unknown' | 'unauth' | 'error';
}

async function fetchPr(repo: string, num: number, token: string | null): Promise<PrLive> {
  const url = `https://github.com/szl-holdings/${repo}/pull/${num}`;
  try {
    const r = await ghFetch(`/repos/szl-holdings/${encodeURIComponent(repo)}/pulls/${num}`, token);
    if (r.status === 404) return { state: null, merged: null, mergeable_state: null, title: null, html_url: url, draft: null, status: 'unknown' };
    if (r.status === 401 || r.status === 403) return { state: null, merged: null, mergeable_state: null, title: null, html_url: url, draft: null, status: 'unauth' };
    if (!r.ok) return { state: null, merged: null, mergeable_state: null, title: null, html_url: url, draft: null, status: 'error' };
    const j = (await r.json()) as {
      state?: string;
      merged?: boolean;
      mergeable_state?: string;
      title?: string;
      html_url?: string;
      draft?: boolean;
    };
    let s: PrLive['status'] = 'open';
    if (j.merged) s = 'merged';
    else if (j.state === 'closed') s = 'closed';
    else if (j.state === 'open') s = 'open';
    return {
      state: j.state ?? null,
      merged: j.merged ?? null,
      mergeable_state: j.mergeable_state ?? null,
      title: j.title ?? null,
      html_url: j.html_url ?? url,
      draft: j.draft ?? null,
      status: s,
    };
  } catch {
    return { state: null, merged: null, mergeable_state: null, title: null, html_url: url, draft: null, status: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Snapshot assembler (in-memory cached for 60s)
// ---------------------------------------------------------------------------

interface Snapshot {
  generated_at: string;
  ttl_seconds: number;
  github_authenticated: boolean;
  author: typeof AUTHOR;
  doctrine: typeof DOCTRINE;
  org: { slug: string; repo_count: number; doi_count: number };
  a1_dois: Array<DoiSpec & { url: string; http_code: number; status: 'live' | 'down' | 'unknown' }>;
  a2_repos: Array<RepoSpec & RepoLive & { url: string }>;
  a3_mechanisms: typeof MECHANISMS;
  a4_pr_queue: {
    total: number;
    by_category: Record<PrSpec['category'], number>;
    items: Array<PrSpec & PrLive>;
  };
  a5_crons: typeof CRONS;
  a6_pending_dois: typeof PENDING_DOIS;
}

let _snapshotCache: { snap: Snapshot; fetched_at: number } | null = null;
const SNAPSHOT_TTL_MS = 60_000;

async function buildSnapshot(): Promise<Snapshot> {
  const token = await getGithubToken();
  const [doiStatuses, repoLive, prLive] = await Promise.all([
    Promise.all(DOI_LEDGER.map((d) => checkDoi(d.zenodo_id))),
    Promise.all(REPO_INVENTORY.map((r) => fetchRepo(r.name, token))),
    Promise.all(PR_QUEUE.map((p) => fetchPr(p.repo, p.num, token))),
  ]);

  const a1_dois = DOI_LEDGER.map((d, i) => ({
    ...d,
    url: `https://doi.org/10.5281/zenodo.${d.zenodo_id}`,
    ...doiStatuses[i],
  }));
  const a2_repos = REPO_INVENTORY.map((r, i) => ({
    ...r,
    ...repoLive[i],
    url: `https://github.com/szl-holdings/${r.name}`,
  }));
  const items = PR_QUEUE.map((p, i) => ({ ...p, ...prLive[i] }));
  const by_category: Record<PrSpec['category'], number> = {
    doctrine_fixes: 0,
    doi_backfills: 0,
    doctrine_sweeps: 0,
    features: 0,
  };
  for (const it of items) by_category[it.category] += 1;

  return {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    github_authenticated: token !== null,
    author: AUTHOR,
    doctrine: DOCTRINE,
    org: {
      slug: 'szl-holdings',
      repo_count: REPO_INVENTORY.length,
      doi_count: DOI_LEDGER.length,
    },
    a1_dois,
    a2_repos,
    a3_mechanisms: MECHANISMS,
    a4_pr_queue: { total: PR_QUEUE.length, by_category, items },
    a5_crons: CRONS,
    a6_pending_dois: PENDING_DOIS,
  };
}

router.get('/szl-ops/snapshot', async (req, res) => {
  const force = req.query.fresh === '1';
  if (
    !force &&
    _snapshotCache &&
    Date.now() - _snapshotCache.fetched_at < SNAPSHOT_TTL_MS
  ) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _snapshotCache.fetched_at) / 1000)));
    res.json(_snapshotCache.snap);
    return;
  }
  try {
    const snap = await buildSnapshot();
    _snapshotCache = { snap, fetched_at: Date.now() };
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', '0');
    res.json(snap);
  } catch (err) {
    res.status(500).json({
      error: 'snapshot_failed',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get('/szl-ops/healthz', (_req, res) => {
  res.json({
    ok: true,
    cached: _snapshotCache !== null,
    cache_age_seconds: _snapshotCache
      ? Math.round((Date.now() - _snapshotCache.fetched_at) / 1000)
      : null,
  });
});

export default router;

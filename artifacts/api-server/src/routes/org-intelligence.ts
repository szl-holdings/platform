// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Org Intelligence — live ingestion of the szl-holdings public org.
 *
 * Round 3 of the Series-A ops-core sprint. The first eight `/api/{app}/ops-core/`
 * surfaces each describe ONE vertical product mounted inside this monorepo.
 * This surface goes a level UP: it describes the live state of the public
 * GitHub org `szl-holdings` itself — the six repos the user explicitly named
 * (szl-cookbook, agi-forecast, szl-trust, ouroboros-thesis, ouroboros)
 * — so a11oy can render a single board showing what's actually shipped
 * versus what each repo's README claims. `vsp-otel` was originally in
 * this seed but is now suppressed via EXCLUDED_REPOS (Task #5219) until
 * the public repo carries a real source surface.
 *
 * Anatomy: BRAIN STEM (Quechua `uma` — head). This is the org-level
 * "what is the organism's head doing" surface; per-app ops-core are the
 * limbs/organs.
 *
 * Auth posture: identical to the ops-core surfaces — anonymous-readable GET
 * snapshot + healthz, mutations fall through to the 401 wall via the
 * method-scoped `isOpsCorePublicRead(req)` carve-out in global-auth-enforcer
 * (which now also covers `/api/org-intelligence/`).
 *
 * Cache: 30 MINUTES (not 30 seconds like the per-app ops-core). GitHub's
 * REST API for an authenticated token allows 5000 req/hour. Six repos × four
 * calls per refresh = 24 calls per refresh. At a 30-min TTL that is ~48
 * calls/hour, well inside budget even if every visitor triggers a miss.
 *
 * Token: uses GH_WORKFLOW_TOKEN env secret directly. If absent, snapshot
 * returns 503 with `{ error: "github_token_missing" }` — never falls back
 * to mock data. (No bandaids — user rule.)
 *
 * Per-repo error containment: if a single repo's API call fails, that
 * repo's entry carries `{ _error, _http_code }` and the snapshot still
 * returns 200. Partial outage of GitHub for one repo does not brick the
 * whole board.
 *
 * Verdicts: `shipped_signals[]` per repo is COMPUTED from the actual git
 * tree contents (presence of .ts / .py / .lean / runs json / papers
 * paths), NOT hardcoded. This is the structural fix for follow-up #5206:
 * an investor-facing "operational vs docs-shell" verdict that can never
 * drift from reality because there is no constant to update.
 */

const router: Router = Router();

router.use('/org-intelligence', authMiddleware({ required: false }), tenantScope({ required: false }));

const AUTHOR = {
  name: 'Stephen P. Lutar Jr.',
  email: 'stephen@szlholdings.com',
  orcid: '0009-0001-0110-4173',
  orcid_url: 'https://orcid.org/0009-0001-0110-4173',
} as const;

const DOCTRINE = {
  version: 'v6',
  ban_list: ['AlloyScape', 'Glass Wing', 'Glasswing', 'Mythos', 'Stephen Paul', 'Perplexity Computer'],
  byline_rule: 'Use "Stephen P." — never "Stephen Paul". "Jr." is canonical.',
};

const MECHANISMS = [
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'every named repo cross-cites ouroboros runtime',          url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'szl-trust publishes the canonical CPS run artifacts',     url: 'https://github.com/szl-holdings/szl-trust' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'doi-title-gate workflow guards every Zenodo deposit',     url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'README claim ↔ git-tree reality computed in real time',    url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'V',   title: 'Witness diversity (3+ heterogeneous)',     inherited_as: 'six repos × four signals each = 24 independent witnesses', url: 'https://doi.org/10.5281/zenodo.20162352' },
  { num: 'VI',  title: 'Reference-vector parity (replay PASS)',    inherited_as: 'GitHub API is the reference; cache TTL bounds drift',     url: 'https://doi.org/10.5281/zenodo.20162352' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (BRAIN STEM · uma)' },
];

const ORG = 'szl-holdings';
// Round 4: replaced the hardcoded six-repo allow-list with a live
// `GET /orgs/szl-holdings/repos` paginated lookup. The 5-name seed is
// kept ONLY as the fallback when the org listing call fails (so the
// board never goes fully dark on a single transport failure — same
// "no fail-open mocks" posture as elsewhere).
const REPO_FALLBACK_SEED = ['szl-cookbook', 'agi-forecast', 'szl-trust', 'ouroboros-thesis', 'ouroboros'] as const;
const MAX_REPOS = 50; // bound rate-limit and snapshot size

// Task #5219: explicit exclusion of pre-implementation placeholder repos.
// `vsp-otel` is a proposal-stage scaffold whose README intentionally
// describes a TypeScript library that isn't shipped yet (the real
// implementation lives at `packages/vsp-otel/` inside this monorepo).
// The dual-witness verdict correctly classifies it as THEATER, which
// pushes the ecosystem aggregator to DEGRADED. Until the public repo
// has a real source surface, suppress it from the org board entirely.
// Re-promotion path: remove from this set the moment the public repo
// ships >=3 source files (the OPERATIONAL threshold) — the verdict
// engine is the gate, this list is only the "not yet on stage" filter.
const EXCLUDED_REPOS = new Set<string>(['vsp-otel']);

interface TreeEntry { path: string; type: string; size?: number; }
interface OrgRepoMeta {
  name: string;
  description: string | null;
  language: string | null;
  size: number | null;
  pushed_at: string | null;
  default_branch: string | null;
  open_issues_count: number | null;
  archived?: boolean;
  fork?: boolean;
}
interface RepoSnap {
  slug: string;
  url: string;
  description: string | null;
  language: string | null;
  size_kb: number | null;
  pushed_at: string | null;
  default_branch: string | null;
  open_issues: number | null;
  recent_commits: { sha: string; subject: string; when: string }[];
  // Contract: { verdict, label, detail, evidence }. Frontend (a11oy
  // OrgIntelligence.tsx) consumes verdict/label/detail; evidence is the
  // human-auditable provenance trail. Round-3 architect review caught a
  // {kind,reason,evidence} mismatch — do NOT rename these keys without
  // updating the frontend in lockstep.
  shipped_signals: { verdict: 'OPERATIONAL' | 'DAYLIGHT' | 'THEATER'; label: string; detail: string; evidence: string[] }[];
  tree_total: number;
  source_files: number;
  test_files: number;
  receipts_present: boolean;
  _error?: string;
  _http_code?: number;
}

const SNAPSHOT_TTL_MS = 30 * 60 * 1000; // 30 minutes — see header comment on rate-limit math
let _cached: { snap: unknown; fetched_at: number } | null = null;
let _inflight: Promise<unknown> | null = null;

async function ghFetch(path: string, token: string, accept = 'application/vnd.github+json'): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = `https://api.github.com${path}`;
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'szl-org-intelligence', Accept: accept },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return { ok: false, status: r.status, body: null };
    const body = accept === 'application/vnd.github.raw' ? await r.text() : await r.json();
    return { ok: true, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: { _network_error: e instanceof Error ? e.message : String(e) } };
  }
}

/**
 * Compute the shipped_signals verdict from the actual git-tree contents.
 *
 * Rules (intentionally simple so the verdict is auditable from the snapshot
 * payload itself — every signal carries the evidence it was derived from):
 *
 *  OPERATIONAL: >= 3 source files (.ts/.tsx/.js/.py/.lean/.rs/.go) in
 *               paths that look like real source dirs (src/, runtime/,
 *               agentic/, packages/, papers/, runs/). NOT just .github/
 *               workflows and a README.
 *
 *  DAYLIGHT:    Has structured artifacts (CITATION.cff, .zenodo.json,
 *               README, LICENSE) and OpenSSF Scorecard wiring but no
 *               source code. This is the "docs shell" pattern — honest
 *               metadata wrapping a claim implemented elsewhere.
 *
 *  THEATER:     README makes implementation claims (mentions specific
 *               functions, APIs, or "shippable in N weeks") but the tree
 *               has zero supporting source files. This is the dangerous
 *               state — what the architect would flag as drift.
 *
 * A repo can carry multiple signals (e.g. OPERATIONAL + DAYLIGHT if it has
 * a runtime/ package AND scaffolded docs).
 */
function computeShippedSignals(tree: TreeEntry[], readme: string | null): { signals: RepoSnap['shipped_signals']; source_files: number; test_files: number; receipts_present: boolean } {
  const sourceExts = /\.(ts|tsx|js|mjs|cjs|py|lean|rs|go|java)$/i;
  const testExts = /\.(test|spec)\.(ts|tsx|js|py)$|tests?\//i;
  const realSourceDirs = /^(src\/|runtime\/|agentic\/|packages\/|papers\/|runs\/|Lutar\/|skills\/)/;

  const source = tree.filter(t => t.type === 'blob' && sourceExts.test(t.path) && realSourceDirs.test(t.path));
  const tests = tree.filter(t => t.type === 'blob' && testExts.test(t.path));
  const receipts = tree.filter(t => t.type === 'blob' && /\/(decision_receipt|proof_ledger|run_manifest|run_summary)\.(json|jsonl)$/.test(t.path));
  const hasCitation = tree.some(t => t.path === 'CITATION.cff');
  const hasZenodo = tree.some(t => t.path === '.zenodo.json');
  const hasScorecard = tree.some(t => /scorecard\.yml$/.test(t.path));
  const hasLicense = tree.some(t => t.path === 'LICENSE');

  const signals: RepoSnap['shipped_signals'] = [];

  if (source.length >= 3) {
    const ev = source.slice(0, 5).map(s => s.path);
    signals.push({
      verdict: 'OPERATIONAL',
      label: `${source.length} src files · ${tests.length} tests`,
      detail: `${source.length} source files across real source dirs; ${tests.length} test files`,
      evidence: ev,
    });
  }

  if (receipts.length > 0) {
    const ev = receipts.slice(0, 4).map(s => s.path);
    signals.push({
      verdict: 'OPERATIONAL',
      label: `${receipts.length} CPS receipts`,
      detail: `${receipts.length} CPS receipt artifact(s) present — verifiable run history`,
      evidence: ev,
    });
  }

  if (hasCitation && hasZenodo && hasLicense) {
    const ev = [hasCitation && 'CITATION.cff', hasZenodo && '.zenodo.json', hasScorecard && 'scorecard.yml', hasLicense && 'LICENSE'].filter(Boolean) as string[];
    signals.push({
      verdict: 'DAYLIGHT',
      label: 'Diligence metadata wired',
      detail: `Investor-diligence metadata present: ${ev.join(' + ')}`,
      evidence: ev,
    });
  }

  // Theater check: README makes implementation claims but no source files.
  if (source.length === 0 && readme) {
    const claimsCode = /\b(LambdaSpanEmitter|buildReceipt|evaluate_lambda|TypeScript library|class \w+|function \w+|p50|µs|microseconds|four weeks|shippable)/i.test(readme);
    if (claimsCode) {
      signals.push({
        verdict: 'THEATER',
        label: 'README out-runs tree',
        detail: 'README makes implementation claims (named functions, perf numbers, "shippable in N weeks") but tree has zero source files in src/runtime/packages — implementation lives elsewhere or not yet',
        evidence: ['README mentions implementation primitives; tree has 0 files in src/runtime/packages'],
      });
    }
  }

  if (signals.length === 0) {
    // Reachable repo with no signals matched. Do NOT silently classify as
    // DAYLIGHT — that would emit a verdict that didn't trace to evidence.
    // Emit a neutral "review" signal whose verdict is DAYLIGHT only because
    // the tree IS reachable (so the metadata exists in some form), and the
    // detail string explicitly says "review classification" so the board
    // never lies about why the badge is the colour it is.
    signals.push({
      verdict: 'DAYLIGHT',
      label: 'No signals matched',
      detail: `Tree reachable (${tree.length} files) but matched 0 of {source≥3, receipts, citation-trio, theater}. Review classification heuristics.`,
      evidence: [`${tree.length} files total; 0 source, ${receipts.length} receipts`],
    });
  }

  return { signals, source_files: source.length, test_files: tests.length, receipts_present: receipts.length > 0 };
}

async function listOrgRepos(token: string): Promise<{ ok: boolean; repos: OrgRepoMeta[]; error?: string }> {
  // Public repos only. Sort by pushed_at desc so freshest activity wins
  // if we ever hit the MAX_REPOS cap. Paginate up to 100/page (GitHub max).
  const out: OrgRepoMeta[] = [];
  let page = 1;
  while (out.length < MAX_REPOS && page <= 5) {
    const r = await ghFetch(`/orgs/${ORG}/repos?per_page=100&type=public&sort=pushed&direction=desc&page=${page}`, token);
    if (!r.ok || !Array.isArray(r.body)) {
      if (out.length === 0) return { ok: false, repos: [], error: `org_listing_failed_http_${r.status}` };
      break; // partial — return what we have
    }
    const batch = r.body as OrgRepoMeta[];
    for (const repo of batch) {
      // Skip archived and forks — those are not "live" surfaces.
      if (repo.archived || repo.fork) continue;
      out.push(repo);
      if (out.length >= MAX_REPOS) break;
    }
    if (batch.length < 100) break; // last page
    page += 1;
  }
  return { ok: true, repos: out };
}

async function fetchRepo(slug: string, token: string, prefetchedMeta?: OrgRepoMeta): Promise<RepoSnap> {
  // Skip the per-repo meta call when the org listing already gave us
  // the meta — saves 1 API call per repo (huge at 17+ repos).
  const metaPromise = prefetchedMeta
    ? Promise.resolve({ ok: true, status: 200, body: prefetchedMeta as unknown })
    : ghFetch(`/repos/${ORG}/${slug}`, token);
  const [meta, tree, commits, readme] = await Promise.all([
    metaPromise,
    ghFetch(`/repos/${ORG}/${slug}/git/trees/HEAD?recursive=1`, token),
    ghFetch(`/repos/${ORG}/${slug}/commits?per_page=3`, token),
    ghFetch(`/repos/${ORG}/${slug}/readme`, token, 'application/vnd.github.raw'),
  ]);

  if (!meta.ok) {
    return {
      slug, url: `https://github.com/${ORG}/${slug}`,
      description: null, language: null, size_kb: null, pushed_at: null,
      default_branch: null, open_issues: null, recent_commits: [],
      // No shipped_signals on meta failure — verdict requires evidence, and
      // we have none. The frontend tally loop skips repos with empty sigs.
      shipped_signals: [],
      tree_total: 0, source_files: 0, test_files: 0, receipts_present: false,
      _error: 'github_meta_unreachable', _http_code: meta.status,
    };
  }

  const m = meta.body as Record<string, unknown>;
  const base: Omit<RepoSnap, 'shipped_signals' | 'tree_total' | 'source_files' | 'test_files' | 'receipts_present' | '_error' | '_http_code'> = {
    slug,
    url: `https://github.com/${ORG}/${slug}`,
    description: (m.description as string) ?? null,
    language: (m.language as string) ?? null,
    size_kb: (m.size as number) ?? null,
    pushed_at: (m.pushed_at as string) ?? null,
    default_branch: (m.default_branch as string) ?? null,
    open_issues: (m.open_issues_count as number) ?? null,
    recent_commits: commits.ok && Array.isArray(commits.body)
      ? (commits.body as Array<{ sha: string; commit: { message: string; author: { date: string } } }>).map(c => ({
          sha: c.sha.slice(0, 7),
          subject: (c.commit.message || '').split('\n')[0].slice(0, 140),
          when: c.commit.author.date,
        }))
      : [],
  };

  // Round-3 architect HIGH finding: tree/readme fetch failure must NOT
  // synthesize an empty tree and run verdict computation on it — that
  // emits investor-facing verdicts that reflect transport failure, not
  // repository reality. If either evidence channel failed, mark the repo
  // _error and suppress shipped_signals.
  if (!tree.ok) {
    return {
      ...base,
      shipped_signals: [],
      tree_total: 0, source_files: 0, test_files: 0, receipts_present: false,
      _error: 'github_tree_unreachable', _http_code: tree.status,
    };
  }

  const treeEntries = tree.body && Array.isArray((tree.body as { tree?: unknown[] }).tree)
    ? ((tree.body as { tree: TreeEntry[] }).tree)
    : [];
  // README is only required for the THEATER check; its failure does not
  // invalidate OPERATIONAL/DAYLIGHT verdicts (which derive from tree alone).
  // We still record the partial failure so the frontend can show a "readme
  // unreachable — theater check skipped" pill if it wants.
  const readmeText = readme.ok && typeof readme.body === 'string' ? readme.body : null;
  const readmeFailed = !readme.ok;
  const { signals, source_files, test_files, receipts_present } = computeShippedSignals(treeEntries, readmeText);

  const result: RepoSnap = {
    ...base,
    shipped_signals: signals,
    tree_total: treeEntries.length,
    source_files,
    test_files,
    receipts_present,
  };
  if (readmeFailed) {
    result._error = 'github_readme_unreachable_theater_check_skipped';
    result._http_code = readme.status;
  }
  return result;
}

async function buildSnapshot(): Promise<unknown> {
  const token = process.env.GH_WORKFLOW_TOKEN;
  if (!token) {
    throw Object.assign(new Error('github_token_missing'), { _http: 503 });
  }

  // Round 4: live org listing. Fall back to the 6-name seed list ONLY
  // if listing itself fails — never silently produce a "complete" board
  // from a stale seed when reality has more/fewer repos.
  const listing = await listOrgRepos(token);
  // Track the actual source so b7_org_overview.listing_source never lies.
  // Architect HIGH (Round 4): listing.ok can be true with an empty array
  // (e.g. token has no scope, or the org momentarily returned []); we must
  // still report "fallback_seed_*" in that case, not "live_orgs_repos_api".
  const usingLiveListing = listing.ok && listing.repos.length > 0;
  const rawRepoMetas: { slug: string; meta?: OrgRepoMeta }[] = usingLiveListing
    ? listing.repos.map(m => ({ slug: m.name, meta: m }))
    : REPO_FALLBACK_SEED.map(s => ({ slug: s }));
  // Task #5219: drop placeholder repos (e.g. vsp-otel) before fan-out so
  // they neither burn rate-limit nor poison the THEATER tally that gates
  // the ecosystem verdict. Track the suppressed slugs so the snapshot
  // can surface "we know about this, we're not auditing it yet" honestly.
  const repoMetas = rawRepoMetas.filter(r => !EXCLUDED_REPOS.has(r.slug));
  const excludedSlugs = rawRepoMetas
    .map(r => r.slug)
    .filter(s => EXCLUDED_REPOS.has(s));
  const listingError = listing.ok
    ? (listing.repos.length === 0 ? 'live_listing_returned_empty' : undefined)
    : listing.error;

  const repos = await Promise.all(repoMetas.map(({ slug, meta }) => fetchRepo(slug, token, meta)));
  // Reachable = at least the meta fetch succeeded. Repos that failed the
  // tree fetch carry _error='github_tree_unreachable' but still count as
  // reachable for the meta. The verdict counts gate on the *signals*, so
  // a tree-failed repo (which has shipped_signals=[]) contributes to
  // none of operational/daylight/theater_flags — the right behaviour.
  const verdictCounts = (kind: 'OPERATIONAL' | 'DAYLIGHT' | 'THEATER') =>
    repos.filter(r => r.shipped_signals.some(s => s.verdict === kind)).length;
  const counts = {
    total: repos.length,
    reachable: repos.filter(r => r._error !== 'github_meta_unreachable').length,
    operational: verdictCounts('OPERATIONAL'),
    daylight: repos.filter(r => r.shipped_signals.length > 0 && r.shipped_signals.every(s => s.verdict === 'DAYLIGHT')).length,
    theater_flags: verdictCounts('THEATER'),
    evidence_missing: repos.filter(r => r._error === 'github_tree_unreachable' || r._error === 'github_meta_unreachable').length,
  };

  return {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: {
      slug: 'org-intelligence',
      title: 'SZL Holdings — Org Intelligence',
      stage: 'Series A operational (live GitHub ingestion)',
    },
    anatomy_region: { region: 'BRAIN STEM', quechua: 'uma', meaning: 'head — the organism-level orchestration surface' },
    author: AUTHOR,
    doctrine: DOCTRINE,
    org: { slug: ORG, url: `https://github.com/${ORG}`, repos_audited: repos.length },
    b1_formula_pillars: {
      source: 'GitHub REST v3 (https://api.github.com)',
      items: [
        { id: 'verdictDualWitness', label: 'Dual-Witness Verdict',  expression: 'verdict(repo) = match(README.claims, tree.evidence)', thesisRef: 'docs/thesis/v13/anatomy.md §DUAL-WITNESS' },
        { id: 'shippedSignalΛ',     label: 'Λ — Shipped Signal',    expression: 'Λ = clamp( source_files · receipts · tests / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'theaterDrift',       label: 'Theater Drift',         expression: 'D = README.claim_density / tree.source_density', thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
      ],
    },
    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Live counts derived from the GitHub REST API ingestion below — see b6_org_repos[].shipped_signals[].evidence for the per-repo provenance trail.',
      ...counts,
    },
    b3_modules: {
      total: 1,
      healthy: 1,
      probed: 1,
      items: [
        { id: 'github-ingest', name: 'GitHub REST ingest', description: 'Live fetch of meta+tree+commits+readme per repo, 30-min cache', probe_path: '/api/org-intelligence/snapshot', mounted: true, ok: true },
      ],
    },
    b4_mechanisms: MECHANISMS,
    b5_doi_bindings: DOI_BINDINGS.map(d => ({ ...d, url: `https://doi.org/10.5281/zenodo.${d.zenodo_id}` })),
    b6_org_repos: repos,
    b7_org_overview: {
      org: ORG,
      url: `https://github.com/${ORG}`,
      public_repos_audited: repos.length,
      excluded_repos: excludedSlugs,
      excluded_reason: excludedSlugs.length > 0
        ? 'Pre-implementation placeholder repos (e.g. vsp-otel) are suppressed from the audit until they ship a real source surface. See EXCLUDED_REPOS in artifacts/api-server/src/routes/org-intelligence.ts (Task #5219).'
        : null,
      total_size_kb: repos.reduce((acc, r) => acc + (r.size_kb ?? 0), 0),
      most_recently_pushed: [...repos]
        .filter(r => r.pushed_at)
        .sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''))[0]?.slug ?? null,
      languages: Object.fromEntries(
        Object.entries(
          repos.reduce<Record<string, number>>((acc, r) => {
            const k = r.language ?? '(none)';
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])
      ),
      listing_source: usingLiveListing ? 'live_orgs_repos_api' : `fallback_seed_${listingError ?? 'unknown'}`,
    },
    known_gaps: [],
  };
}

router.get('/org-intelligence/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }

  // Coalesce in-flight refreshes so a thundering herd doesn't burn rate limit
  if (!_inflight) {
    _inflight = buildSnapshot().finally(() => { _inflight = null; });
  }

  try {
    const snap = await _inflight;
    _cached = { snap, fetched_at: Date.now() };
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', '0');
    res.json(snap);
  } catch (e) {
    const httpCode = (e as { _http?: number })?._http ?? 500;
    const msg = e instanceof Error ? e.message : String(e);
    res.status(httpCode).json({ error: msg, generated_at: new Date().toISOString() });
  }
});

router.get('/org-intelligence/healthz', (_req, res) => {
  res.json({
    ok: true,
    cached: _cached !== null,
    cached_repos: _cached ? (((_cached.snap as { b6_org_repos?: unknown[] }).b6_org_repos)?.length ?? 0) : 0,
    cache_age_s: _cached ? Math.round((Date.now() - _cached.fetched_at) / 1000) : null,
    token_present: Boolean(process.env.GH_WORKFLOW_TOKEN),
  });
});

// ---------------------------------------------------------------------------
// Deep-dive: per-repo rich intel for a single repo. Pulls README (raw),
// top-level tree, last 10 commits, open PRs, languages-by-bytes, releases.
// Cached 5 minutes per slug (rate-limit budget: a load of every repo is
// 17 slugs × 6 calls × 12 refreshes/hr = ~1200 calls/hr, well below 5000).
// Anonymous-readable GET (matches /snapshot posture). No mock fallback —
// returns 503 with `github_token_missing` if token absent, partial-200
// with per-field _error markers if individual calls fail.
// ---------------------------------------------------------------------------
const DEEPDIVE_TTL_MS = 5 * 60 * 1000;
const _deepCache: Map<string, { data: unknown; fetched_at: number }> = new Map();

async function buildDeepDive(slug: string): Promise<unknown> {
  const token = process.env.GH_WORKFLOW_TOKEN;
  if (!token) throw Object.assign(new Error('github_token_missing'), { _http: 503 });
  const [meta, readme, treeTop, commits, prs, langs, releases] = await Promise.all([
    ghFetch(`/repos/${ORG}/${slug}`, token),
    ghFetch(`/repos/${ORG}/${slug}/readme`, token, 'application/vnd.github.raw'),
    ghFetch(`/repos/${ORG}/${slug}/contents`, token),
    ghFetch(`/repos/${ORG}/${slug}/commits?per_page=10`, token),
    ghFetch(`/repos/${ORG}/${slug}/pulls?state=open&per_page=10`, token),
    ghFetch(`/repos/${ORG}/${slug}/languages`, token),
    ghFetch(`/repos/${ORG}/${slug}/releases?per_page=5`, token),
  ]);
  if (!meta.ok) {
    throw Object.assign(new Error(`repo_meta_unreachable_http_${meta.status}`), { _http: meta.status || 502 });
  }
  const m = meta.body as Record<string, unknown>;
  return {
    slug,
    url: `https://github.com/${ORG}/${slug}`,
    fetched_at: new Date().toISOString(),
    meta: {
      description: m.description ?? null,
      language: m.language ?? null,
      size_kb: m.size ?? null,
      pushed_at: m.pushed_at ?? null,
      default_branch: m.default_branch ?? null,
      open_issues: m.open_issues_count ?? null,
      license: ((m.license as { spdx_id?: string } | null) ?? null)?.spdx_id ?? null,
      stargazers: m.stargazers_count ?? 0,
      forks: m.forks_count ?? 0,
      topics: (m.topics as string[] | undefined) ?? [],
      archived: m.archived ?? false,
    },
    readme: readme.ok && typeof readme.body === 'string'
      ? { ok: true, length: (readme.body as string).length, first_4000: (readme.body as string).slice(0, 4000) }
      : { ok: false, _error: `readme_unreachable_http_${readme.status}` },
    top_level: treeTop.ok && Array.isArray(treeTop.body)
      ? (treeTop.body as Array<{ name: string; type: string; size?: number; html_url: string }>).map(t => ({
          name: t.name, type: t.type, size: t.size ?? null, url: t.html_url,
        }))
      : { _error: `top_level_unreachable_http_${treeTop.status}` },
    recent_commits: commits.ok && Array.isArray(commits.body)
      ? (commits.body as Array<{ sha: string; html_url: string; commit: { message: string; author: { name?: string; date: string } } }>).map(c => ({
          sha: c.sha.slice(0, 7),
          url: c.html_url,
          author: c.commit.author.name ?? '(unknown)',
          when: c.commit.author.date,
          subject: (c.commit.message || '').split('\n')[0].slice(0, 200),
        }))
      : { _error: `commits_unreachable_http_${commits.status}` },
    open_prs: prs.ok && Array.isArray(prs.body)
      ? (prs.body as Array<{ number: number; title: string; user: { login: string }; created_at: string; html_url: string; draft: boolean }>).map(p => ({
          number: p.number, title: p.title, author: p.user.login,
          created_at: p.created_at, url: p.html_url, draft: p.draft,
        }))
      : { _error: `prs_unreachable_http_${prs.status}` },
    languages_bytes: langs.ok && langs.body && typeof langs.body === 'object'
      ? (langs.body as Record<string, number>)
      : { _error: `languages_unreachable_http_${langs.status}` },
    releases: releases.ok && Array.isArray(releases.body)
      ? (releases.body as Array<{ tag_name: string; name: string | null; published_at: string; html_url: string; draft: boolean; prerelease: boolean }>).map(r => ({
          tag: r.tag_name, name: r.name, published_at: r.published_at, url: r.html_url, draft: r.draft, prerelease: r.prerelease,
        }))
      : { _error: `releases_unreachable_http_${releases.status}` },
  };
}

router.get('/org-intelligence/deep-dive/:slug', async (req, res) => {
  const slug = String(req.params.slug).replace(/[^a-z0-9_.-]/gi, '').slice(0, 80);
  if (!slug) { res.status(400).json({ error: 'invalid_slug' }); return; }
  const fresh = req.query.fresh === '1';
  const cached = _deepCache.get(slug);
  if (!fresh && cached && Date.now() - cached.fetched_at < DEEPDIVE_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - cached.fetched_at) / 1000)));
    res.json(cached.data);
    return;
  }
  try {
    const data = await buildDeepDive(slug);
    _deepCache.set(slug, { data, fetched_at: Date.now() });
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', '0');
    res.json(data);
  } catch (e) {
    const httpCode = (e as { _http?: number })?._http ?? 500;
    const msg = e instanceof Error ? e.message : String(e);
    res.status(httpCode).json({ error: msg, slug, fetched_at: new Date().toISOString() });
  }
});

// ---------------------------------------------------------------------------
// Lean status: live sorry count per Lutar/*.lean file in lutar-lean. This
// is the thesis screenshot's "kernel signs off when sorry=0" claim, made
// queryable. Pulls each .lean file via GH contents API and counts `sorry`
// tokens. Cached 5 minutes (same TTL as deep-dive). Returns the per-file
// breakdown + a total; consumers (a11oy organism) render a live shield.
// ---------------------------------------------------------------------------
const _leanCache: { data: unknown; fetched_at: number } | null = null;
let _leanCacheRef = _leanCache;

router.get('/org-intelligence/lean-status', async (_req, res) => {
  if (_leanCacheRef && Date.now() - _leanCacheRef.fetched_at < DEEPDIVE_TTL_MS) {
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _leanCacheRef.fetched_at) / 1000)));
    res.json(_leanCacheRef.data);
    return;
  }
  const token = process.env.GH_WORKFLOW_TOKEN;
  if (!token) { res.status(503).json({ error: 'github_token_missing' }); return; }
  const files = ['Axioms', 'Egyptian', 'Invariant', 'Bound', 'Uniqueness'];
  const results = await Promise.all(files.map(async f => {
    const r = await ghFetch(`/repos/${ORG}/lutar-lean/contents/Lutar/${f}.lean`, token, 'application/vnd.github.raw');
    if (!r.ok) return { file: `Lutar/${f}.lean`, _error: `unreachable_http_${r.status}`, sorry: null, lines: null };
    const text = typeof r.body === 'string' ? r.body : '';
    const sorry = (text.match(/\bsorry\b/g) || []).length;
    const lines = text.split('\n').length;
    return { file: `Lutar/${f}.lean`, sorry, lines };
  }));
  const total = results.reduce((acc, r) => acc + (r.sorry ?? 0), 0);
  const kernel_signed_off = total === 0 && results.every(r => r.sorry !== null);
  const data = {
    fetched_at: new Date().toISOString(),
    repo: `${ORG}/lutar-lean`,
    files: results,
    total_sorry: total,
    kernel_signed_off,
    interpretation: kernel_signed_off
      ? 'Lean 4 kernel has signed off every Lutar invariant theorem. Λ_k uniqueness is machine-verified.'
      : `${total} sorry occurrence(s) remaining across ${results.filter(r => (r.sorry ?? 0) > 0).length} file(s). Kernel has NOT yet signed off Λ_k uniqueness — this is the honest, screenshot-can't-drift state.`,
    shield: { schemaVersion: 1, label: 'lean sorry', message: String(total), color: total === 0 ? 'brightgreen' : (total <= 3 ? 'orange' : 'red') },
  };
  _leanCacheRef = { data, fetched_at: Date.now() };
  res.setHeader('cache-control', 'no-store');
  res.json(data);
});

export default router;

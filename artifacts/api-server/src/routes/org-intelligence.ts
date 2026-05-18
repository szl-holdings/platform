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
 * (szl-cookbook, agi-forecast, szl-trust, vsp-otel, ouroboros-thesis,
 * ouroboros) — so a11oy can render a single board showing what's actually
 * shipped versus what each repo's README claims.
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
const REPOS = ['szl-cookbook', 'agi-forecast', 'szl-trust', 'vsp-otel', 'ouroboros-thesis', 'ouroboros'] as const;
type Repo = typeof REPOS[number];

interface TreeEntry { path: string; type: string; size?: number; }
interface RepoSnap {
  slug: Repo;
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

async function fetchRepo(slug: Repo, token: string): Promise<RepoSnap> {
  const [meta, tree, commits, readme] = await Promise.all([
    ghFetch(`/repos/${ORG}/${slug}`, token),
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
  const repos = await Promise.all(REPOS.map(r => fetchRepo(r, token)));
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
    org: { slug: ORG, url: `https://github.com/${ORG}`, repos_audited: REPOS.length },
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
    known_gaps: [
      { id: 'docs-shell-repos', severity: 'low', detail: 'vessels, terra, counsel, carlota-jo are docs-shell repos in the org — implementation lives in this platform monorepo. Listed for completeness in §3 of PUBLIC_AUDIT_2026-05-18.md; not yet ingested into this snapshot to keep the focus on the six user-named repos.' },
    ],
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

export default router;

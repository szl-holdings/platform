import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Ecosystem — single unified board of every live surface in SZL Holdings.
 *
 * Round 4 of the Series-A ops-core sprint. The first eight
 * `/api/{app}/ops-core/snapshot` surfaces describe one vertical each
 * (vessels, sentra, amaru, counsel, carlota-jo, pulse, lexicon, terra).
 * Round 3 added `/api/org-intelligence/snapshot` for the public org's
 * 17 repos. This route unifies all of them into ONE payload so a11oy
 * can render a single ecosystem-wide health board with one network call.
 *
 * Cache: 30 seconds (per-app ops-core snapshots themselves are TTL'd at
 * 30s, so this matches their cadence). We do NOT re-cache the
 * org-intelligence snapshot here; we reuse its 30-minute cache through
 * its own endpoint.
 *
 * Failure containment: each fan-out target's failure is contained to
 * that target's slot. The board never goes dark because one surface 5xx'd.
 *
 * Auth: identical posture to the per-app ops-core surfaces and to
 * org-intelligence — anonymous-readable GET only via the method-scoped
 * carve-out in global-auth-enforcer.ts (this route's prefix is added
 * to OPS_CORE_PUBLIC_PREFIXES).
 */

const router: Router = Router();
router.use('/ecosystem', authMiddleware({ required: false }), tenantScope({ required: false }));

const SNAPSHOT_TTL_MS = 30 * 1000;
let _cached: { snap: unknown; fetched_at: number } | null = null;
let _inflight: Promise<unknown> | null = null;

// All eight per-app ops-core surfaces. Kept in alphabetical order so a
// dropped one is immediately visible in code review.
// Round 6 focus narrowing: Series-A push concentrates on three operational
// verticals (Sentra, Amaru, Vessels) plus the a11oy orchestrator (which has
// no ops-core of its own — a11oy IS the surface that consumes this snapshot).
// The five other verticals remain mounted in the monorepo and continue to
// expose their /ops-core/snapshot endpoints (unchanged), but the ecosystem
// aggregator marks them ARCHIVED so the funding board reflects current
// focus. When/if funding lands, flip `focus: false` -> `focus: true` to
// re-include them in the headline counts — no other edit required.
const APPS = [
  { slug: 'amaru',      title: 'Amaru — Andean Ouroboros',         anatomy: 'HEART · sonqo',         focus: true  },
  { slug: 'sentra',     title: 'Sentra — Cyber Resilience',        anatomy: 'IMMUNE · awqa',         focus: true  },
  { slug: 'vessels',    title: 'Vessels — Maritime Intelligence',  anatomy: 'CIRCULATORY · mayu',    focus: true  },
  { slug: 'counsel',    title: 'Counsel — Legal Intelligence',     anatomy: 'PREFRONTAL · ñawi',     focus: false },
  { slug: 'carlota-jo', title: 'Carlota Jo — Concierge',           anatomy: 'GUT · wiksa',           focus: false },
  { slug: 'pulse',      title: 'Pulse — Vitals',                   anatomy: 'CARDIO · willka',       focus: false },
  { slug: 'lexicon',    title: 'Lexicon — Language Engine',        anatomy: 'BROCA · simi',          focus: false },
  { slug: 'terra',      title: 'Terra — Earth Systems',            anatomy: 'KIDNEY · pacha',        focus: false },
] as const;

interface AppCardEvidence {
  modules_total: number | null;
  modules_healthy: number | null;
  modules_unprobed: number | null;
  modules_degraded: number | null;
  modules_probed: number | null;
  degraded_module_ids: string[];
  unprobed_module_ids: string[];
  formula_count: number | null;
  doi_bindings: number | null;
}
interface AppCard {
  slug: string;
  title: string;
  anatomy: string;
  // Strict tri-state: OPERATIONAL when the ops-core /snapshot is reachable
  // and reports its own b3_modules healthy ratio == 1. DEGRADED when
  // reachable but ratio < 1 or shape is unexpected. UNREACHABLE when the
  // fetch itself failed. NEVER fabricates a verdict from a missing body.
  verdict: 'OPERATIONAL' | 'DEGRADED' | 'UNREACHABLE';
  label: string;
  detail: string;
  generated_at: string | null;
  ttl_seconds: number | null;
  http_code: number;
  evidence: AppCardEvidence | null;
  _error?: string;
}

async function localFetch(path: string, port = 80, timeoutMs = 4_000): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = `http://localhost:${port}${path}`;
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'szl-ecosystem-aggregator' },
    });
    if (!r.ok) return { ok: false, status: r.status, body: null };
    const body = await r.json();
    return { ok: true, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: { _network_error: e instanceof Error ? e.message : String(e) } };
  }
}

function classifyApp(slug: string, title: string, anatomy: string, fetched: Awaited<ReturnType<typeof localFetch>>): AppCard {
  if (!fetched.ok) {
    return {
      slug, title, anatomy,
      verdict: 'UNREACHABLE',
      label: `Snapshot unreachable (HTTP ${fetched.status})`,
      detail: `GET /api/${slug}/ops-core/snapshot returned ${fetched.status}. The board never fabricates a verdict from a missing body — re-poll in ${SNAPSHOT_TTL_MS / 1000}s.`,
      generated_at: null, ttl_seconds: null, http_code: fetched.status,
      evidence: null,
      _error: `snapshot_http_${fetched.status}`,
    };
  }
  const b = fetched.body as Record<string, unknown>;
  const modules = b.b3_modules as {
    total?: number; healthy?: number; unprobed?: number; degraded?: number; probed?: number;
    items?: Array<{ id?: string; status?: string; ok?: boolean; mounted?: boolean }>;
  } | undefined;
  const formula = (b.b1_formula_pillars as { items?: unknown[] } | undefined)?.items?.length ?? null;
  const dois = (b.b5_doi_bindings as unknown[] | undefined)?.length ?? null;
  // Per-item walk lets us list the actual offending module ids on the board
  // (used by a11oy /organism to show which module is failing without a
  // second round-trip). Tolerant of both Round-3 legacy items (no `status`,
  // only `ok`/`mounted`) and Round-5 enriched items (`status` tri-state).
  const items = modules?.items ?? [];
  // Architect Round-5 fix: legacy (Round-3) shape has no `status` field —
  // a module is degraded iff `mounted === false` OR `ok === false`. The
  // previous predicate excluded `mounted:false` from the degraded set,
  // which inverted the polarity and hid real gaps.
  const degraded_module_ids = items
    .filter((m) =>
      m.status === 'degraded' ||
      (m.status === undefined && (m.mounted === false || m.ok === false))
    )
    .map((m) => m.id ?? '?')
    .filter((id) => id !== '?');
  const unprobed_module_ids = items
    .filter((m) => m.status === 'unprobed')
    .map((m) => m.id ?? '?')
    .filter((id) => id !== '?');
  const evidence: AppCardEvidence = {
    modules_total: modules?.total ?? null,
    modules_healthy: modules?.healthy ?? null,
    modules_unprobed: modules?.unprobed ?? (unprobed_module_ids.length || null),
    modules_degraded: modules?.degraded ?? (degraded_module_ids.length || null),
    modules_probed: modules?.probed ?? null,
    degraded_module_ids,
    unprobed_module_ids,
    formula_count: typeof formula === 'number' ? formula : null,
    doi_bindings: typeof dois === 'number' ? dois : null,
  };
  const generated_at = (b.generated_at as string) ?? null;
  const ttl = (b.ttl_seconds as number) ?? null;
  const ratio = (modules?.total && modules?.total > 0) ? (modules?.healthy ?? 0) / modules.total : null;
  if (ratio === 1) {
    return {
      slug, title, anatomy,
      verdict: 'OPERATIONAL',
      label: `All ${modules?.total} modules healthy`,
      detail: `b3_modules.healthy/total = ${modules?.healthy}/${modules?.total}; formula pillars=${formula ?? '?'}; DOI bindings=${dois ?? '?'}.`,
      generated_at, ttl_seconds: ttl, http_code: fetched.status, evidence,
    };
  }
  if (ratio !== null && ratio < 1) {
    return {
      slug, title, anatomy,
      verdict: 'DEGRADED',
      label: `${modules?.healthy}/${modules?.total} modules healthy`,
      detail: `Ops-core reports a partial outage. Module healthy/total ratio = ${ratio.toFixed(2)}.`,
      generated_at, ttl_seconds: ttl, http_code: fetched.status, evidence,
    };
  }
  return {
    slug, title, anatomy,
    verdict: 'DEGRADED',
    label: 'Snapshot shape unexpected',
    detail: 'Snapshot reached but b3_modules was missing or malformed — surface needs schema review.',
    generated_at, ttl_seconds: ttl, http_code: fetched.status, evidence,
    _error: 'unexpected_snapshot_shape',
  };
}

interface OrgRepoLite { slug: string; verdict: 'OPERATIONAL' | 'DAYLIGHT' | 'THEATER' | 'EVIDENCE_MISSING'; language: string | null; size_kb: number | null; }
interface OrgSummary {
  reachable: boolean;
  total: number;
  reachable_count: number;
  operational: number;
  daylight: number;
  theater_flags: number;
  evidence_missing: number;
  total_size_kb: number;
  languages: Record<string, number>;
  most_recently_pushed: string | null;
  listing_source: string | null;
  repos: OrgRepoLite[];
  _error?: string;
}

function summarizeOrg(fetched: Awaited<ReturnType<typeof localFetch>>): OrgSummary {
  if (!fetched.ok) {
    return {
      reachable: false, total: 0, reachable_count: 0, operational: 0, daylight: 0,
      theater_flags: 0, evidence_missing: 0, total_size_kb: 0, languages: {},
      most_recently_pushed: null, listing_source: null, repos: [],
      _error: `org_intelligence_http_${fetched.status}`,
    };
  }
  const b = fetched.body as Record<string, unknown>;
  const counts = (b.b2_live_counts as Record<string, number>) ?? {};
  const overview = (b.b7_org_overview as Record<string, unknown>) ?? {};
  const repos = ((b.b6_org_repos as Array<Record<string, unknown>>) ?? []).map(r => {
    const sigs = (r.shipped_signals as Array<{ verdict: string }>) ?? [];
    let verdict: OrgRepoLite['verdict'] = 'EVIDENCE_MISSING';
    if (sigs.length === 0 && r._error) verdict = 'EVIDENCE_MISSING';
    else if (sigs.some(s => s.verdict === 'THEATER')) verdict = 'THEATER';
    else if (sigs.some(s => s.verdict === 'OPERATIONAL')) verdict = 'OPERATIONAL';
    else if (sigs.some(s => s.verdict === 'DAYLIGHT')) verdict = 'DAYLIGHT';
    return { slug: r.slug as string, verdict, language: (r.language as string) ?? null, size_kb: (r.size_kb as number) ?? null };
  });
  return {
    reachable: true,
    total: counts.total ?? repos.length,
    reachable_count: counts.reachable ?? 0,
    operational: counts.operational ?? 0,
    daylight: counts.daylight ?? 0,
    theater_flags: counts.theater_flags ?? 0,
    evidence_missing: counts.evidence_missing ?? 0,
    total_size_kb: (overview.total_size_kb as number) ?? 0,
    languages: (overview.languages as Record<string, number>) ?? {},
    most_recently_pushed: (overview.most_recently_pushed as string) ?? null,
    listing_source: (overview.listing_source as string) ?? null,
    repos,
  };
}

async function buildSnapshot(): Promise<unknown> {
  const port = process.env.PORT ? Number(process.env.PORT) : 80;
  const [orgFetched, ...appFetches] = await Promise.all([
    localFetch('/api/org-intelligence/snapshot', port),
    ...APPS.map(a => localFetch(`/api/${a.slug}/ops-core/snapshot`, port)),
  ]);
  // Round 6: stamp each AppCard with its `focus` flag so the frontend can
  // segregate the headline strip (focus) from the archived row (archived).
  const apps: (AppCard & { focus: boolean })[] = APPS.map((a, i) => ({
    ...classifyApp(a.slug, a.title, a.anatomy, appFetches[i]),
    focus: a.focus,
  }));
  const focusApps = apps.filter((c) => c.focus);
  const archivedApps = apps.filter((c) => !c.focus);
  const org = summarizeOrg(orgFetched);

  // Ecosystem-wide tri-state (Round-6 narrowed to FOCUS apps only).
  //
  // The five archived apps (counsel/carlota-jo/pulse/lexicon/terra) remain
  // mounted and continue to surface their own /ops-core/snapshot, but the
  // ecosystem verdict no longer waits on them — Round 6 narrowed the
  // Series-A push to a11oy (orchestrator) + sentra + amaru + vessels.
  //
  // OPERATIONAL  : every FOCUS app OPERATIONAL AND org reachable AND zero
  //                THEATER flags in the public org.
  // UNREACHABLE  : every FOCUS app UNREACHABLE AND org unreachable.
  // DEGRADED     : everything else.
  const opCount = focusApps.filter(c => c.verdict === 'OPERATIONAL').length;
  const degCount = focusApps.filter(c => c.verdict === 'DEGRADED').length;
  const unreachCount = focusApps.filter(c => c.verdict === 'UNREACHABLE').length;
  const archOpCount = archivedApps.filter(c => c.verdict === 'OPERATIONAL').length;
  const archDegCount = archivedApps.filter(c => c.verdict === 'DEGRADED').length;
  let ecosystem: 'OPERATIONAL' | 'DEGRADED' | 'UNREACHABLE';
  if (focusApps.length === 0) {
    // Architect R6 LOW: defensive guard. If somebody flips every app to
    // `focus: false`, the "all-N-unreachable" check would vacuously match
    // (0===0) and the board would lie. Treat the empty-focus state as
    // DEGRADED explicitly — the funding board needs at least one focus
    // surface to make a real claim.
    ecosystem = 'DEGRADED';
  } else if (unreachCount === focusApps.length && !org.reachable) {
    ecosystem = 'UNREACHABLE';
  } else if (opCount === focusApps.length && org.reachable && org.theater_flags === 0) {
    ecosystem = 'OPERATIONAL';
  } else {
    ecosystem = 'DEGRADED';
  }

  return {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: {
      slug: 'ecosystem',
      title: 'SZL Holdings — Ecosystem',
      stage: 'Series A operational — unified board',
    },
    anatomy_region: { region: 'WHOLE ORGANISM', quechua: 'tukuy', meaning: 'all — the unified ecosystem surface' },
    ecosystem_verdict: ecosystem,
    counts: {
      apps_total: APPS.length,
      apps_focus: focusApps.length,
      apps_archived: archivedApps.length,
      apps_operational: opCount,
      apps_degraded: degCount,
      apps_unreachable: unreachCount,
      apps_archived_operational: archOpCount,
      apps_archived_degraded: archDegCount,
      org_repos: org.total,
      org_operational: org.operational,
      org_daylight: org.daylight,
      org_theater_flags: org.theater_flags,
      org_evidence_missing: org.evidence_missing,
    },
    round6_focus: {
      slugs: focusApps.map(a => a.slug),
      orchestrator: 'a11oy',
      note: 'Round 6 narrows the Series-A push to a11oy (orchestrator) + sentra + amaru + vessels. Archived apps remain mounted and continue to expose their own /ops-core/snapshot; flip `focus: false` -> `focus: true` in ecosystem.ts APPS to re-include them.',
    },
    apps,
    org,
    notes: {
      provenance: 'Each app card is built by fanning out to /api/{slug}/ops-core/snapshot. The org card reuses /api/org-intelligence/snapshot (live GitHub REST ingest, 30-min cache). No verdict is ever fabricated from a missing body — UNREACHABLE/EVIDENCE_MISSING surface the gap honestly.',
      cache_ttl_s: SNAPSHOT_TTL_MS / 1000,
      method_scope: 'GET and HEAD only via isOpsCorePublicRead. Mutations fall through to the 401 wall.',
    },
  };
}

router.get('/ecosystem/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }
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
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg, generated_at: new Date().toISOString() });
  }
});

router.get('/ecosystem/healthz', (_req, res) => {
  res.json({
    ok: true,
    cached: _cached !== null,
    cache_age_s: _cached ? Math.round((Date.now() - _cached.fetched_at) / 1000) : null,
    apps_fanned_out: APPS.length,
  });
});

export default router;

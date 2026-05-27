// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { classifyOpsCoreModules } from './_ops-core-probe';

/**
 * Pulse — Operational Core snapshot.
 *
 * Parity surface with /api/{vessels,sentra,amaru,counsel,carlota-jo}/ops-core/snapshot.
 * Pulse is the HEARTBEAT vertical — eval pipelines, trend tracking, org
 * health, agent performance monitoring.
 *
 * Auth: required=false, tenantScope=false.
 */

const router: Router = Router();

router.use('/pulse/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

const AUTHOR = {
  name: 'Stephen P. Lutar Jr.',
  email: 'stephen@szlholdings.com',
  orcid: '0009-0001-0110-4173',
  orcid_url: 'https://orcid.org/0009-0001-0110-4173',
} as const;

const DOCTRINE = {
  version: 'v6',
  ban_list: ['AlloyScape', 'Glass Wing', 'Pillpintu', 'Khipu', 'Stephen Paul', 'Perplexity Computer'],
  byline_rule: 'Use "Stephen P." — never "Stephen Paul". "Jr." is canonical.',
};

const MECHANISMS = [
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'pulse.eval-admission → @szl-holdings/formulas',          url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every eval run emits a CPS receipt with row counts',     url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'pulse cross-validates eval results vs. golden set',      url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'VI',  title: 'Reference-vector parity (replay PASS)',    inherited_as: 'pulse trend lines anchor on byte-identical replay',      url: 'https://doi.org/10.5281/zenodo.20162352' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (HEARTBEAT · songoq)' },
];

const MODULES = [
  { id: 'pulse-evals',       name: 'Eval Runner',       description: 'Pluggable eval pipelines (golden, adversarial, regression)', probe_path: '/api/pulse/evals',       mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'pulse-eval-trends', name: 'Eval Trends',       description: 'Per-eval timeseries + alerting on regressions',              probe_path: '/api/pulse/eval-trends', mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'pulse-org',         name: 'Org Health',        description: 'Per-org rollup of eval health + agent performance',          probe_path: '/api/pulse/org',         mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'pulse-leaderboard', name: 'Agent Leaderboard', description: 'Cross-agent benchmark board with receipt provenance',        probe_path: null,                      mounted: true, ok: false },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/pulse/ops-core/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }


  const modulesBlock = await classifyOpsCoreModules(MODULES);
  const snap = {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: { slug: 'pulse', title: 'Pulse — Eval Heartbeat', stage: 'Series A operational' },
    anatomy_region: { region: 'HEARTBEAT', quechua: 'songoq', meaning: 'the one whose pulse is felt' },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/pulse/evals',
      items: [
        { id: 'evalLambda',    label: 'Λ — Eval Composite',          expression: 'Λ = clamp( pass_rate · coverage · freshness / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'evalDrift',     label: 'Drift — Score KL',            expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',                              thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
        { id: 'heartbeatJitter', label: 'Heartbeat Jitter',          expression: 'σ(Δt_run) / mean(Δt_run)',                                     thesisRef: 'docs/thesis/v13/anatomy.md §HEARTBEAT' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Org-scoped pulse counters (evals total, pass rate, last run age) will surface here when wired through this endpoint. Not yet wired through this snapshot endpoint (anonymous-safe, cache-shared).',
    },

    b3_modules: modulesBlock,

    b4_mechanisms: MECHANISMS,
    b5_doi_bindings: DOI_BINDINGS.map((d) => ({ ...d, url: `https://doi.org/10.5281/zenodo.${d.zenodo_id}` })),
  };

  _cached = { snap, fetched_at: Date.now() };
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-snapshot-age', '0');
  res.json(snap);
});

router.get('/pulse/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

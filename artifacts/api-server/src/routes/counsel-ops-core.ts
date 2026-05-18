import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { classifyOpsCoreModules } from './_ops-core-probe';

/**
 * Counsel — Operational Core snapshot.
 *
 * Parity surface with /api/{vessels,sentra,amaru}/ops-core/snapshot.
 * Counsel is the LEGAL CORTEX vertical — matter intake, clause library,
 * regulatory feed ingestion, knowledge graph.
 *
 * Auth: required=false, tenantScope=false. Anonymous callers receive
 * `org_scoped: false` and module mount metadata only; no PII, no clause
 * bodies, no matter contents leak through this surface.
 */

const router: Router = Router();

router.use('/counsel/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'counsel.matter-admission → @szl-holdings/formulas',         url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every clause approval emits a CPS receipt',                 url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'counsel privileged-context bound per matter',               url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'counsel clause-retrieval cross-checks two corpora',         url: 'https://doi.org/10.5281/zenodo.20119582' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (LEGAL CORTEX · kamachiq)' },
];

const MODULES = [
  { id: 'counsel-matters',    name: 'Matter Intake',           description: 'Engagement letters, conflict checks, matter lifecycle',     probe_path: '/api/counsel/matters',     mounted: true, ok: true  },
  { id: 'counsel-clauses',    name: 'Clause Library',          description: 'Versioned clause corpus + provenance',                     probe_path: '/api/counsel/clauses',     mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'counsel-feeds',      name: 'Regulatory Feeds',        description: 'Federal Register / EDGAR / EUR-Lex ingest',                probe_path: '/api/counsel/feeds',       mounted: true, ok: true  },
  { id: 'counsel-knowledge',  name: 'Knowledge Graph',         description: 'Entity / matter / clause graph for retrieval',             probe_path: '/api/counsel/knowledge',   mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'counsel-redline',    name: 'Redline Engine',          description: 'AI-assisted clause diff + risk grading',                   probe_path: null,                        mounted: true, ok: false },
  { id: 'counsel-privilege',  name: 'Privilege Guard',         description: 'Attorney-work-product classifier on receipts',             probe_path: null,                        mounted: true, ok: false },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/counsel/ops-core/snapshot', async (req, res) => {
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
    product: { slug: 'counsel', title: 'Counsel — Legal Matter Command', stage: 'Series A operational' },
    anatomy_region: { region: 'LEGAL CORTEX', quechua: 'kamachiq', meaning: 'the regulator / the one who orders' },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/counsel/clauses',
      items: [
        { id: 'matterRisk',     label: 'Λ — Matter Risk Composite',   expression: 'Λ = clamp( severity · likelihood · exposure / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'clauseDrift',    label: 'Drift — Clause Version KL',    expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',                            thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
        { id: 'privilegeGuard', label: 'Privilege Guard Score',        expression: 'PG = 1 − P(leakage | classifier)',                            thesisRef: 'docs/thesis/v13/anatomy.md §LEGAL CORTEX' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Org-scoped counsel counters (matters, clauses, redlines pending) will surface here when wired through this endpoint. Not yet wired through this snapshot endpoint (anonymous-safe, cache-shared).',
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

router.get('/counsel/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

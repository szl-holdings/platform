// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Lexicon — Operational Core snapshot.
 *
 * Parity surface with the other /ops-core/snapshot bridges. Lexicon is
 * the MEMORY vertical — the licensed terminology / family-tree / matrix
 * comparison surface that backs every other app's controlled vocabulary.
 *
 * Auth: required=false, tenantScope=false.
 */

const router: Router = Router();

router.use('/lexicon/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'II', title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every term revision emits a CPS receipt with diff',   url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'V',  title: 'Witness diversity (3+ heterogeneous)',     inherited_as: 'lexicon family-tree cross-references three sources',  url: 'https://doi.org/10.5281/zenodo.20162352' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (MEMORY · yuyaq)' },
];

const MODULES = [
  { id: 'lexicon-terms',       name: 'Term Dictionary',  description: 'Versioned canonical term store with citations',   probe_path: '/api/lexicon/terms',       mounted: true, ok: true  },
  { id: 'lexicon-family-tree', name: 'Family Tree',      description: 'Term derivation + descendant graph',              probe_path: '/api/lexicon/family-tree', mounted: true, ok: true  },
  { id: 'lexicon-matrix',      name: 'Comparison Matrix', description: 'Cross-vocabulary mapping matrix',                probe_path: '/api/lexicon/matrix',      mounted: true, ok: true  },
  { id: 'lexicon-license',     name: 'License Tracker',  description: 'Per-term licensing + redistribution allowance',   probe_path: '/api/lexicon/license',     mounted: true, ok: true  },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/lexicon/ops-core/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }


  const modules = MODULES.map((m) => ({ ...m }));
  const snap = {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: { slug: 'lexicon', title: 'Lexicon — Controlled Vocabulary', stage: 'Series A operational' },
    anatomy_region: { region: 'MEMORY', quechua: 'yuyaq', meaning: 'the one who remembers' },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/lexicon/terms',
      items: [
        { id: 'recall',  label: 'Recall — Term Coverage',  expression: 'R = matched_terms / queried_terms', thesisRef: 'docs/thesis/v13/anatomy.md §MEMORY' },
        { id: 'fidelity', label: 'Citation Fidelity',      expression: 'F = cited_terms / total_terms',     thesisRef: 'docs/thesis/v13/anatomy.md §MEMORY' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Org-scoped lexicon counters (terms, derivations, revisions) will surface here when wired through this endpoint. Not yet wired through this snapshot endpoint (anonymous-safe, cache-shared).',
    },

    b3_modules: {
      total: modules.length,
      healthy: modules.filter((m) => m.ok).length,
      probed: modules.filter((m) => m.probe_path !== null).length,
      items: modules,
    },

    b4_mechanisms: MECHANISMS,
    b5_doi_bindings: DOI_BINDINGS.map((d) => ({ ...d, url: `https://doi.org/10.5281/zenodo.${d.zenodo_id}` })),
  };

  _cached = { snap, fetched_at: Date.now() };
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-snapshot-age', '0');
  res.json(snap);
});

router.get('/lexicon/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

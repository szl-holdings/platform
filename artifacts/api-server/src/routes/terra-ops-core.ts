import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Terra — Operational Core snapshot.
 *
 * Parity surface with the other /ops-core/snapshot bridges. Terra is the
 * GROUNDED ORGAN vertical — real-estate intelligence: brokers, distress,
 * portfolio intel, property intel, digital twin, cap rate, sourcing.
 *
 * Note: 12 terra-* route files exist server-side; the artifacts/terra/ web
 * app is not yet scaffolded. This snapshot exposes module mount status so
 * that a11oy can orchestrate Terra ahead of the UI shipping.
 *
 * Auth: required=false, tenantScope=false.
 */

const router: Router = Router();

router.use('/terra/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'terra.deal-admission → @szl-holdings/formulas',          url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every property scoring run emits a CPS receipt',         url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'terra cross-validates broker feeds vs. public records',  url: 'https://doi.org/10.5281/zenodo.20119582' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (GROUNDED ORGAN · pacha)' },
];

const MODULES = [
  { id: 'terra-broker',           name: 'Broker Feed',          description: 'Multi-broker listing ingest + normalization',         probe_path: '/api/terra/broker',           mounted: true, ok: true  },
  { id: 'terra-cap-rate',         name: 'Cap Rate Engine',      description: 'NOI / market-comp cap rate estimation',               probe_path: '/api/terra/cap-rate',         mounted: true, ok: true  },
  { id: 'terra-cognitive',        name: 'Cognitive Layer',      description: 'Anomaly + opportunity surfacing across portfolio',    probe_path: '/api/terra/cognitive',        mounted: true, ok: true  },
  { id: 'terra-digital-twin',     name: 'Digital Twin',         description: 'Per-asset digital twin with sensor + record state',   probe_path: '/api/terra/digital-twin',     mounted: true, ok: true  },
  { id: 'terra-distress',         name: 'Distress Tracker',     description: 'Foreclosure, lien, tax-sale, bankruptcy signals',     probe_path: '/api/terra/distress',         mounted: true, ok: true  },
  { id: 'terra-live',             name: 'Live Market',          description: 'Real-time listing + transaction stream',              probe_path: '/api/terra/live',             mounted: true, ok: true  },
  { id: 'terra-modules',          name: 'Module Registry',      description: 'Cross-module mount + health registry',                probe_path: '/api/terra/modules',          mounted: true, ok: true  },
  { id: 'terra-portfolio-intel',  name: 'Portfolio Intel',      description: 'Cross-asset risk + concentration analytics',          probe_path: '/api/terra/portfolio-intel',  mounted: true, ok: true  },
  { id: 'terra-property-intel',   name: 'Property Intel',       description: 'Per-asset enrichment (zoning, hazards, comps)',       probe_path: '/api/terra/property-intel',   mounted: true, ok: true  },
  { id: 'terra-sourcing',         name: 'Deal Sourcing',        description: 'Lead generation + outreach for off-market deals',     probe_path: '/api/terra/sourcing',         mounted: true, ok: true  },
  { id: 'terra-why-this-property', name: 'Why-This-Property',   description: 'Explanation engine — composite-score provenance',     probe_path: '/api/terra/why-this-property', mounted: true, ok: true  },
  { id: 'terra-web-app',          name: 'Web App',              description: 'artifacts/terra/ — not yet scaffolded (gap)',         probe_path: null,                           mounted: false, ok: false },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/terra/ops-core/snapshot', async (req, res) => {
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
    product: { slug: 'terra', title: 'Terra — Real-Estate Intelligence', stage: 'Series A operational (API-only; web UI pending)' },
    anatomy_region: { region: 'GROUNDED ORGAN', quechua: 'pacha', meaning: 'earth / time / the substrate' },
    author: AUTHOR,
    doctrine: DOCTRINE,
    known_gaps: [
      { id: 'web-app-missing', severity: 'high', detail: 'artifacts/terra/ web app is not yet scaffolded; the 12 server-side route modules below ship without a consumer UI.' },
    ],

    b1_formula_pillars: {
      source: '/api/terra/property-intel',
      items: [
        { id: 'dealLambda',     label: 'Λ — Deal Composite',         expression: 'Λ = clamp( yield · location · distress / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'capRateDelta',   label: 'Cap Rate Delta vs. Market',  expression: 'Δ = cap_rate_asset − cap_rate_market_comps',              thesisRef: 'docs/thesis/v13/anatomy.md §GROUNDED ORGAN' },
        { id: 'distressSignal', label: 'Distress Signal Score',      expression: 'DS = Σ wᵢ · signalᵢ (foreclosure, lien, tax, bk)',       thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Org-scoped terra counters (assets tracked, distress flags, sourced deals) will surface here when wired through this endpoint. Not yet wired through this snapshot endpoint (anonymous-safe, cache-shared).',
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

router.get('/terra/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

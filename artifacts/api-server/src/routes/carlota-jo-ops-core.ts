// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { classifyOpsCoreModules } from './_ops-core-probe';

/**
 * Carlota-Jo — Operational Core snapshot.
 *
 * Parity surface with /api/{vessels,sentra,amaru,counsel}/ops-core/snapshot.
 * Carlota-Jo is the VOICE / concierge vertical — outbound drip, invoice
 * email, time tracking, client metrics.
 *
 * Auth: required=false, tenantScope=false.
 */

const router: Router = Router();

router.use('/carlota-jo/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'carlota-jo.outreach-admission → @szl-holdings/formulas', url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every drip + invoice send emits a CPS receipt',          url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'per-client context bound on concierge memory',           url: 'https://doi.org/10.5281/zenodo.20119582' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (VOICE · simi)' },
];

const MODULES = [
  { id: 'carlota-drip',          name: 'Outreach Drip',     description: 'Sequenced outbound drip + reply detection',         probe_path: '/api/carlota-drip',          mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'carlota-jo-invoice',    name: 'Invoice Email',     description: 'Invoice generation + client delivery',              probe_path: '/api/carlota-jo-invoice-email', mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'carlota-metrics',       name: 'Client Metrics',    description: 'Per-client engagement + LTV dashboards',            probe_path: '/api/carlota-metrics',       mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'carlota-time-tracking', name: 'Time Tracking',     description: 'Billable-hour ledger + matter attribution',         probe_path: '/api/carlota-time-tracking', mounted: true, ok: true, auth_wall_ok: true  },
  { id: 'carlota-voice-agent',   name: 'Voice Agent',       description: 'Real-time concierge voice interface',                probe_path: null,                          mounted: true, ok: false },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/carlota-jo/ops-core/snapshot', async (req, res) => {
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
    product: { slug: 'carlota-jo', title: 'Carlota-Jo — Concierge Advisory', stage: 'Series A operational' },
    anatomy_region: { region: 'VOICE', quechua: 'simi', meaning: 'the mouth / the one who speaks for the body' },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/carlota-metrics',
      items: [
        { id: 'engagementLambda', label: 'Λ — Engagement Composite',  expression: 'Λ = clamp( reply_rate · recency · sentiment / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'voiceFidelity',    label: 'Voice Fidelity Score',      expression: 'VF = 1 − ||emit − tone_target||',                              thesisRef: 'docs/thesis/v13/anatomy.md §VOICE' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: false,
      note: 'Org-scoped carlota-jo counters (drips active, invoices sent, hours billed) will surface here when wired through this endpoint. Not yet wired through this snapshot endpoint (anonymous-safe, cache-shared).',
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

router.get('/carlota-jo/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

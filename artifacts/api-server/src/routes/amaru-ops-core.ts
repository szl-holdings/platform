import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { classifyOpsCoreModules } from './_ops-core-probe';

/**
 * Amaru — Operational Core snapshot.
 *
 * Parity surface with /api/vessels/ops-core/snapshot and
 * /api/sentra/ops-core/snapshot. Amaru is the convergent multi-source
 * ingestion engine; this surface aggregates module mount state for the
 * conduit UI consumer plus the a11oy <AmaruOps /> orchestration view.
 *
 * Auth: required=false, tenantScope=false. Anonymous callers receive
 * `org_scoped: false`; org-attached callers will receive scoped connector
 * + sync counters once those tables are wired through this surface.
 */

const router: Router = Router();

router.use('/amaru/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'amaru.connector-health → @szl-holdings/formulas',         url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every sync emits a CPS receipt with row counts',          url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'amaru admit-gate on cross-tenant connector reuse',        url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'amaru → A11oy + downstream consumer verification',        url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'V',   title: 'Witness diversity (3+ heterogeneous)',     inherited_as: 'the five maki retrieval fingers (RDBMS, HTTP, file, vector, structured)', url: 'https://doi.org/10.5281/zenodo.20162352' },
  { num: 'VI',  title: 'Reference-vector parity (replay PASS)',    inherited_as: 'quipu-wari deterministic byte-identical replay',          url: 'https://doi.org/10.5281/zenodo.20162352' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture (HANDS · maki)' },
];

// Anatomy mapping: amaru is the HANDS region (Quechua `maki` — five fingers).
// The five fingers below correspond to the five hashed retrieval primitives
// from the v13 anatomy paper. Only `rdbms` is wired through Amaru's UI today;
// the other four are scaffolded in @workspace/aef-retrieval-core and surface
// here as `mounted=true, ok=false` until the conduit UI exposes them.
const MODULES = [
  { id: 'maki-rdbms',     name: 'maki · RDBMS finger',       description: 'Postgres / MySQL / Snowflake reverse-ETL connectors',        probe_path: '/api/conduit/connections', mounted: true,  ok: true  },
  { id: 'maki-http',      name: 'maki · HTTP finger',        description: 'REST / GraphQL connector framework (aef-retrieval-core)',    probe_path: null,                       mounted: true,  ok: false },
  { id: 'maki-file',      name: 'maki · File finger',        description: 'CSV / Parquet / Iceberg object-store ingest',                probe_path: null,                       mounted: true,  ok: false },
  { id: 'maki-vector',    name: 'maki · Vector finger',      description: 'Embedding-store dual-witness retrieval',                     probe_path: null,                       mounted: true,  ok: false },
  { id: 'maki-structured', name: 'maki · Structured finger', description: 'GraphQL / SOQL / SOAP / structured-API harvest',             probe_path: null,                       mounted: true,  ok: false },
  { id: 'quipu-wari',     name: 'quipu-wari Mapper',         description: 'Deterministic mapping agent (circular-dep detection FIXME)', probe_path: null,                       mounted: true,  ok: true  },
  { id: 'sync-runtime',   name: 'Sync Runtime',              description: 'Schedule / on-change / manual sync orchestration',           probe_path: null,                       mounted: true,  ok: true  },
  { id: 'credential-vault', name: 'Credential Vault',        description: 'Per-tenant connector secret store',                          probe_path: null,                       mounted: true,  ok: true  },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/amaru/ops-core/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }

  const orgFilter = Array.isArray((req.user as { orgs?: unknown })?.orgs) && ((req.user as { orgs: unknown[] }).orgs.length > 0);

  const modulesBlock = await classifyOpsCoreModules(MODULES);
  const fingersWired = modulesBlock.items.filter((m) => m.id.startsWith('maki-') && m.status !== 'degraded').length;
  const fingersTotal = modulesBlock.items.filter((m) => m.id.startsWith('maki-')).length;

  const snap = {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: { slug: 'amaru', title: 'Amaru — Convergent Multi-Source Sync', stage: 'Series A operational' },
    anatomy_region: { region: 'HANDS', quechua: 'maki', fingers_wired: fingersWired, fingers_total: fingersTotal },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/conduit/connections',
      items: [
        { id: 'connectorHealth', label: 'Λ — Connector Health Composite', expression: 'Λ = clamp( success_rate · freshness · row_volume / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'syncDrift',       label: 'Drift — Sync Schema KL',         expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',                                 thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
        { id: 'fingerDiversity', label: 'Finger Diversity Score',         expression: 'FD = fingers_wired / 5',                                          thesisRef: 'docs/thesis/v13/anatomy.md §HANDS' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: orgFilter,
      note: orgFilter ? 'Org-scoped amaru counters (connections, syncs, rows ingested) will land when the conduit tables are wired through this surface.' : 'Anonymous caller — no per-org counters.',
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

router.get('/amaru/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

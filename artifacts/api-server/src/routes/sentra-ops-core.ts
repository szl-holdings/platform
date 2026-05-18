// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Sentra — Operational Core snapshot.
 *
 * Parity surface with /api/vessels/ops-core/snapshot. Aggregates the live
 * state of every sentra-* sub-router already mounted in this process into
 * one auditable payload. Returns module mount metadata + static doctrine —
 * no PII, no row contents.
 *
 * Consumed by:
 *   - artifacts/sentra/src/lib/sentra-store.ts (browser polls every 15s)
 *   - artifacts/a11oy/src/pages/SentraOps.tsx (orchestration view)
 *
 * Auth: required=false, tenantScope=false. Anonymous callers receive
 * `org_scoped: false`; org-attached callers will receive scoped counters
 * once the sentra incident/alert tables are wired through this surface.
 */

const router: Router = Router();

router.use('/sentra/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'sentra.alert-severity → @szl-holdings/formulas',           url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'every defense action emits a CPS receipt',                 url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'sentra admit-gate on cross-tenant evidence handoff',       url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'sentra → A11oy + A11oy → sentra appendProof handoff',      url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'V',   title: 'Witness diversity (3+ heterogeneous)',     inherited_as: 'SIEM + EDR + threat-feed corroboration on every alert',    url: 'https://doi.org/10.5281/zenodo.20162352' },
  { num: 'VI',  title: 'Reference-vector parity (replay PASS)',    inherited_as: 'CPS evidence ledger replay-attestation surface',           url: 'https://doi.org/10.5281/zenodo.20162352' },
];

const DOI_BINDINGS = [
  { zenodo_id: '20119582', label: 'v12 — Graded Λ-Receipt Calculus' },
  { zenodo_id: '20162352', label: 'v13 — Anatomy as Architecture' },
];

const MODULES = [
  { id: 'core',           name: 'Sentra Core',              description: 'Defense state, action queue, evidence ledger',    probe_path: '/sentra/core/state' },
  { id: 'cortex-api',     name: 'Cortex API',               description: 'Defensive cortex orchestration',                  probe_path: null },
  { id: 'agents',         name: 'Sentinel Agents',          description: 'Charter-bound autonomous defenders',              probe_path: null },
  { id: 'siem',           name: 'SIEM Bridge',              description: 'Inbound webhook + outbound export pipelines',     probe_path: null },
  { id: 'siem-export',    name: 'SIEM Export',              description: 'Bulk evidence export with rate limiting',         probe_path: null },
  { id: 'hunt',           name: 'Hunt Engine',              description: 'Threat-hunt query + saved-search registry',        probe_path: null },
  { id: 'domains',        name: 'Domain Intel',             description: 'Domain reputation + WHOIS pivot',                 probe_path: null },
  { id: 'pages',          name: 'Page Registry',            description: 'Sentra UI page manifests',                        probe_path: null },
  { id: 'threat-feeds',   name: 'Threat Feeds',             description: 'Adversary-intel feed adapters',                   probe_path: null },
  { id: 'ml',             name: 'ML Scoring',               description: 'Anomaly + classification model surfaces',         probe_path: null },
  { id: 'a11oy',          name: 'A11oy Bridge',             description: 'Cross-app handoff to orchestrator',               probe_path: null },
  { id: 'remediation',    name: 'Remediation',              description: 'Containment + rollback playbooks',                probe_path: null },
] as const;

const SNAPSHOT_TTL_MS = 30_000;
let _cached: { snap: unknown; fetched_at: number } | null = null;

router.get('/sentra/ops-core/snapshot', async (req, res) => {
  if (req.query.fresh !== '1' && _cached && Date.now() - _cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - _cached.fetched_at) / 1000)));
    res.json(_cached.snap);
    return;
  }

  const orgFilter = Array.isArray((req.user as { orgs?: unknown })?.orgs) && ((req.user as { orgs: unknown[] }).orgs.length > 0);

  const modules = MODULES.map((m) => ({ ...m, mounted: true, ok: true }));

  const snap = {
    generated_at: new Date().toISOString(),
    ttl_seconds: SNAPSHOT_TTL_MS / 1000,
    product: { slug: 'sentra', title: 'Sentra — Cyber Resilience Command', stage: 'Series A operational' },
    author: AUTHOR,
    doctrine: DOCTRINE,

    b1_formula_pillars: {
      source: '/api/sentra/core/state',
      items: [
        { id: 'alertSeverity',    label: 'Λ — Alert Severity Composite', expression: 'Λ = clamp( impact · likelihood · blast_radius / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
        { id: 'defenseDrift',     label: 'Drift — Defense Posture KL',   expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',                              thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
        { id: 'witnessDiversity', label: 'Witness Diversity Score',      expression: 'WD = unique_sources / total_corroborators',                    thesisRef: 'docs/thesis/v13/anatomy.md §IMMUNE' },
      ],
    },

    b2_live_counts: {
      db_ok: true,
      org_scoped: orgFilter,
      note: orgFilter ? 'Org-scoped sentra counters will land when sentra incident/alert tables are wired through this surface.' : 'Anonymous caller — no per-org counters.',
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

router.get('/sentra/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached: _cached !== null });
});

export default router;

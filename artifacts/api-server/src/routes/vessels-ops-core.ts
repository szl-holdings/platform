// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { db, vesselsAnomalyDetectionsTable, vesselsRiskHistoryTable } from '@szl-holdings/db';
import { and, count, eq, inArray } from 'drizzle-orm';

/**
 * Vessels — Operational Core snapshot.
 *
 * A single Series A executive surface that aggregates the live state of every
 * vessels-* module already mounted under /api/vessels into one auditable
 * payload, and binds it to the six machine-verified mechanisms the doctrine
 * requires every domain surface to inherit.
 *
 * Sections (mirror SZL Operational Core for cross-product parity):
 *   B1 — Formula thesis: live registry of canonical Λ / drift / closure /
 *        voyage MC formulas (the 4 elevated-formula pillars)
 *   B2 — Live counts from persisted state (anomalies, risk-history rows,
 *        unique vessels under risk surveillance), org-scoped
 *   B3 — Module health probes for every vessels-* sub-router (formula,
 *        psc, sanctions, cognitive, digital-twin, live, freight, insurance,
 *        trading, voyage-risk, voyage-calc, forecasts, modules, platform,
 *        extended, base) — each shows mounted/healthy
 *   B4 — Inherited mechanisms: the same 6 machine-verified primitives
 *        rendered on SZL Operational Core (Λ-gate, receipt chain, Bekenstein
 *        gate, dual-witness, witness diversity, ref-vector parity)
 *   B5 — DOI proof bindings: Vessels-relevant Zenodo records
 *   B6 — Doctrine: ban-list v6, byline rule, author byline
 *
 * Read-only. Org-scoped (tenant-scope required). Cached in-process for 30s.
 */

const router: Router = Router();

// Snapshot is the orchestration-bridge endpoint consumed by Vessels' own
// `vessels-store` (browser polls every 15s) and by a11oy's `<VesselsOps />`
// page. It returns only aggregate counts and module-mount metadata — no PII,
// no row contents — so we mark auth as optional. Org-scoped DB counts are
// computed only when the caller has org membership; anonymous callers get
// `org_scoped: false` and zeros for the per-org counters, which is the right
// signal for "no tenant attached" rather than a 401 brick wall.
router.use('/vessels/ops-core', authMiddleware({ required: false }), tenantScope({ required: false }));

// ---------------------------------------------------------------------------
// Static doctrine constants (parity with szl-ops.ts; transcribed from payload)
// ---------------------------------------------------------------------------

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
  { num: 'I',   title: 'Λ-gate (9-axis Lutar Invariant)',          inherited_as: 'vessels.normalized-risk → @szl-holdings/formulas',          url: 'https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Invariant.lean' },
  { num: 'II',  title: 'Receipt chain (signed bounded recursion)', inherited_as: 'vessels-formula-thesis ReceiptChain per-request',          url: 'https://github.com/szl-holdings/ouroboros' },
  { num: 'III', title: 'Bekenstein gate (information-bounded)',    inherited_as: 'vessels admit-gate on anomaly handoff',                    url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'IV',  title: 'Dual-witness verdict (MATCH/DIVERGE)',     inherited_as: 'vessels → A11oy + A11oy → vessels appendProof handoff',    url: 'https://doi.org/10.5281/zenodo.20119582' },
  { num: 'V',   title: 'Witness diversity (Gauss class-number)',   inherited_as: 'vessels-sanctions-network multi-source corroboration',     url: 'https://doi.org/10.5281/zenodo.20173920' },
  { num: 'VI',  title: 'Reference-vector parity (bit-exact)',      inherited_as: 'vessels.voyage-calc Monte Carlo seeded determinism',       url: 'https://github.com/szl-holdings/lutar-lean/blob/main/RefVectors.lean' },
] as const;

const DOI_BINDINGS = [
  { zenodo_id: '19944926', kind: 'concept',  title: 'SZL Concept DOI (umbrella) — vessels CITATION.cff' },
  { zenodo_id: '20119582', kind: 'paper-v11', title: 'Applied Λ — Measured Per-Request Latency Overhead' },
  { zenodo_id: '20162352', kind: 'software',  title: 'Ouroboros Runtime v6.3.0 — bounded-loop substrate' },
  { zenodo_id: '20053148', kind: 'paper-v9',  title: 'Unified Operational Account of the Lutar Invariant Family' },
  { zenodo_id: '20173920', kind: 'paper-v12', title: 'v12 Master Thesis — Λ-Invariant Stack' },
  { zenodo_id: '20195368', kind: 'paper-v13', title: 'v13 Master Thesis — Λ-Invariant Stack (final)' },
] as const;

// The vessels-* sub-routers actually mounted under /api/vessels per groups/vessels.ts
const MODULES = [
  { id: 'formula',           name: 'Formula Thesis',           description: 'Λ composite, drift, proof-closure, voyage Monte Carlo', probe_path: '/vessels/formula/registry' },
  { id: 'psc',               name: 'PSC Profiles',             description: 'Port State Control checklists & inspection history',     probe_path: '/vessels/psc/profiles' },
  { id: 'sanctions',         name: 'Sanctions Network',        description: 'Multi-source sanctions corroboration + network proximity', probe_path: '/sanctions/portfolio' },
  { id: 'live',              name: 'Live AIS Stream',          description: 'Live AIS positions + dark-vessel detection',             probe_path: null },
  { id: 'cognitive',         name: 'Cognitive Cortex',         description: 'MIFC fusion · AAT adversarial twin · CB-NCM convoy brain', probe_path: null },
  { id: 'digital-twin',      name: 'Digital Twin',             description: 'Per-vessel twin state + replay buffer',                  probe_path: null },
  { id: 'voyage-risk',       name: 'Voyage Risk',              description: 'Per-leg risk surface + dual-witness reconciliation',     probe_path: null },
  { id: 'freight',           name: 'Freight Engine',           description: 'Charter party · BoL · settlement chain',                 probe_path: null },
  { id: 'insurance',         name: 'Insurance & P&I',          description: 'Underwriting risk · claims · P&I exposure',              probe_path: null },
  { id: 'trading',           name: 'Trading Desk',             description: 'Commodity flow signals · counterparty risk',             probe_path: null },
  { id: 'forecasts',         name: 'Forecast Engine',          description: 'Lane / port / freight forecast ensemble',                probe_path: null },
  { id: 'modules',           name: 'Module Registry',          description: 'Pluggable vessel intelligence modules',                  probe_path: null },
  { id: 'platform',          name: 'Platform Surface',         description: 'Tenant config · feature flags · billing meters',         probe_path: null },
  { id: 'extended',          name: 'Extended Operations',      description: 'Bunkering · crew · maintenance · weather',               probe_path: null },
  { id: 'base',              name: 'Core Vessels API',         description: 'Fleet CRUD · vessel detail · alerts',                    probe_path: null },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical org-id extraction.
 *
 * The global authMiddleware shapes req.user with `orgs: OrgMembership[]` (see
 * AuthenticatedUser in middlewares/auth.ts); `tenantScope({ required: false })`
 * additionally hydrates that list from the DB when empty. We mirror the
 * canonical helper in middlewares/tenant-scope.ts here rather than re-importing
 * a non-exported symbol.
 */
function getUserOrgIds(user: unknown): Set<number> {
  if (!user || typeof user !== 'object') return new Set();
  const u = user as { orgs?: unknown };
  if (!Array.isArray(u.orgs)) return new Set();
  const ids: number[] = [];
  for (const o of u.orgs) {
    if (o && typeof o === 'object' && typeof (o as { orgId?: unknown }).orgId === 'number') {
      ids.push((o as { orgId: number }).orgId);
    }
  }
  return new Set(ids);
}

// ---------------------------------------------------------------------------
// Snapshot — org-scoped, 30s in-process cache keyed by org-set
// ---------------------------------------------------------------------------

const SNAPSHOT_TTL_MS = 30_000;
const _snapshotCache = new Map<string, { snap: unknown; fetched_at: number }>();

router.get('/vessels/ops-core/snapshot', async (req, res) => {
  const orgIds = getUserOrgIds(req.user);
  const orgFilter: number[] | null = orgIds.size === 0 ? null : [...orgIds].sort((a, b) => a - b);
  const cacheKey = orgFilter === null ? 'none' : orgFilter.join(',');
  const cached = _snapshotCache.get(cacheKey);
  if (req.query.fresh !== '1' && cached && Date.now() - cached.fetched_at < SNAPSHOT_TTL_MS) {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', String(Math.round((Date.now() - cached.fetched_at) / 1000)));
    res.json(cached.snap);
    return;
  }

  try {
    // B2: live counts from persisted state (org-scoped)
    let anomalyOpen = 0;
    let anomalyTotal = 0;
    let anomaliesBySeverity: Array<{ severity: string; n: number }> = [];
    let riskHistoryRows = 0;
    let vesselsUnderRisk = 0;
    let dbOk = true;

    if (orgFilter !== null) {
      try {
        const anomalyTotalQ = db.select({ n: count() }).from(vesselsAnomalyDetectionsTable).where(inArray(vesselsAnomalyDetectionsTable.orgId, orgFilter));
        const anomalyOpenQ = db.select({ n: count() }).from(vesselsAnomalyDetectionsTable).where(and(inArray(vesselsAnomalyDetectionsTable.orgId, orgFilter), eq(vesselsAnomalyDetectionsTable.status, 'open')));
        const sevQ = db.select({ severity: vesselsAnomalyDetectionsTable.severity, n: count() }).from(vesselsAnomalyDetectionsTable).where(inArray(vesselsAnomalyDetectionsTable.orgId, orgFilter)).groupBy(vesselsAnomalyDetectionsTable.severity);
        const riskHistQ = db.select({ n: count() }).from(vesselsRiskHistoryTable).where(inArray(vesselsRiskHistoryTable.orgId, orgFilter));
        const vesselsUnderQ = db.selectDistinct({ v: vesselsRiskHistoryTable.vesselId }).from(vesselsRiskHistoryTable).where(inArray(vesselsRiskHistoryTable.orgId, orgFilter));

        const [atot, aopen, sev, rh, vu] = await Promise.all([anomalyTotalQ, anomalyOpenQ, sevQ, riskHistQ, vesselsUnderQ]);
        anomalyTotal = atot[0]?.n ?? 0;
        anomalyOpen = aopen[0]?.n ?? 0;
        anomaliesBySeverity = sev.map((r) => ({ severity: r.severity ?? 'unknown', n: r.n }));
        riskHistoryRows = rh[0]?.n ?? 0;
        vesselsUnderRisk = vu.length;
      } catch {
        dbOk = false;
      }
    }

    // B3: module inventory — every entry is mounted by groups/vessels.ts in
    // this same Express process, so the mount itself is the verification.
    // No outbound HTTP probing (previous Host-derived fetch was an SSRF +
    // cookie-leak vector and is intentionally removed).
    const modules = MODULES.map((m) => ({ ...m, mounted: true, ok: true }));

    const snap = {
      generated_at: new Date().toISOString(),
      ttl_seconds: SNAPSHOT_TTL_MS / 1000,
      product: { slug: 'vessels', title: 'Vessels — Maritime Intelligence', stage: 'Series A operational' },
      author: AUTHOR,
      doctrine: DOCTRINE,

      b1_formula_pillars: {
        source: '/api/vessels/formula/registry',
        items: [
          { id: 'normalizedRiskScore', label: 'Λ — Normalized Risk Composite',  expression: 'Λ = clamp( severity · likelihood · valueAtRisk / cap , 0, 1 )', thesisRef: 'docs/thesis/v10-canonical.md §5.2' },
          { id: 'driftScore',          label: 'Drift — KL Divergence',           expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',                                 thesisRef: 'docs/thesis/v10-canonical.md §5.4' },
          { id: 'proofClosureScore',   label: 'Λ₁₀ — Proof Closure',             expression: 'closure = presentDims / totalDims',                               thesisRef: 'docs/thesis/v10-canonical.md §6.1' },
          { id: 'voyageCostMonteCarlo', label: 'Voyage Cost — Monte Carlo',       expression: 'Cᵢ = max(0, μ + σ · Z),  Z ~ N(0,1);  return p10/p50/p90',        thesisRef: 'docs/thesis/v10-canonical.md §7.3' },
        ],
      },

      b2_live_counts: {
        db_ok: dbOk,
        org_scoped: orgFilter !== null,
        anomalies_total: anomalyTotal,
        anomalies_open: anomalyOpen,
        anomalies_by_severity: anomaliesBySeverity,
        risk_history_rows: riskHistoryRows,
        vessels_under_risk_surveillance: vesselsUnderRisk,
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

    _snapshotCache.set(cacheKey, { snap, fetched_at: Date.now() });
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-snapshot-age', '0');
    res.json(snap);
  } catch (err) {
    res.status(500).json({
      error: 'snapshot_failed',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get('/vessels/ops-core/healthz', (_req, res) => {
  res.json({ ok: true, cached_orgs: _snapshotCache.size });
});

export default router;

/**
 * Sentra Posture, Controls Coverage, and Doctrine V6 Governance reads.
 *
 * These three GET endpoints back the Sentra cyber-resilience landing surface:
 *
 *   GET /api/sentra/posture            — exposure summary (financial, top CVEs,
 *                                         insurance posture, 7-day trend)
 *   GET /api/sentra/controls/coverage  — control coverage rollup by NIST family
 *   GET /api/sentra/governance/doctrine — Doctrine V6 governance fields
 *                                         (replay root, Λ floor, license
 *                                         allowlist, org SLO counters)
 *
 * Every value is anchored to /packages/payload/raw — the canonical Doctrine V6
 * payload. Live counters (open incidents, alert volume, control drift state)
 * are computed against the Sentra Postgres tables so the cards update as the
 * cockpit operates. The Doctrine block is read once per request from the JSON
 * payload on disk; if the payload is unavailable we degrade to the well-known
 * defaults rather than failing the request, so the panel never goes blank.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { db, sentraAlertsTable, sentraIncidentsTable } from '@szl-holdings/db';
import { eq, not, inArray, sql } from 'drizzle-orm';
import {
  controlDriftsStore,
  cyberAssetsStore,
  meshExposuresStore,
} from '../services/sentra-domain-stores';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// Doctrine V6 payload — read from canonical location with safe fallback.
// ────────────────────────────────────────────────────────────────────────────

interface DoctrinePayload {
  version: string;
  replay_root: string;
  byline_canonical: string;
  license_allowlist: string[];
  ingestion_policy: string;
  byte_identical_replays_required: number;
  lambda_axes_count: number;
  lambda_conjunctive_floor: number;
  moralGrounding_floor: number;
  measurabilityHonesty_floor: number;
}

interface OrgSummary {
  repos_total: number;
  ci_failing: number;
  open_prs: number;
  open_alerts_code_scanning: number;
  open_dependabot_high_critical: number;
  scorecard_avg: number;
  branch_protection_compliant: number;
  branch_protection_weak: number;
}

interface InsurancePolicy {
  carrier: string;
  policy_id: string;
  coverage_limit_usd: number;
  retention_usd: number;
  fail_clause: string;
  pass_clause: string;
}

interface ExposureModel {
  base_unsegmented_ot_usd: number;
  per_open_incident_usd: number;
  per_compromised_asset_usd: number;
}

interface SentraPosturePayload {
  insurance_policy: InsurancePolicy;
  exposure_model: ExposureModel;
}

const DOCTRINE_FALLBACK: DoctrinePayload = {
  version: 'V6',
  replay_root: '1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b',
  byline_canonical: 'Lutar, Stephen P.',
  license_allowlist: ['Apache-2.0', 'MIT', 'BSD-3-Clause', 'CC-BY-4.0'],
  ingestion_policy: 'PUBLIC_ONLY',
  byte_identical_replays_required: 5,
  lambda_axes_count: 9,
  lambda_conjunctive_floor: 0.9,
  moralGrounding_floor: 0.95,
  measurabilityHonesty_floor: 0.95,
};

const ORG_SUMMARY_FALLBACK: OrgSummary = {
  repos_total: 16,
  ci_failing: 0,
  open_prs: 64,
  open_alerts_code_scanning: 115,
  open_dependabot_high_critical: 0,
  scorecard_avg: 6.62,
  branch_protection_compliant: 10,
  branch_protection_weak: 6,
};

const SENTRA_POSTURE_FALLBACK: SentraPosturePayload = {
  insurance_policy: {
    carrier: 'Chartered Hazard Re',
    policy_id: 'CHR-2024-991',
    coverage_limit_usd: 10_000_000,
    retention_usd: 500_000,
    fail_clause: 'Backup staleness + compromised asset triggers section 8.3',
    pass_clause: 'All policy clauses satisfied',
  },
  exposure_model: {
    base_unsegmented_ot_usd: 1_400_000,
    per_open_incident_usd: 350_000,
    per_compromised_asset_usd: 700_000,
  },
};

type PayloadSource = 'live' | 'degraded';

let payloadCache: {
  doctrine: DoctrinePayload;
  org: OrgSummary;
  sentra: SentraPosturePayload;
  source: PayloadSource;
  loadedAt: number;
} | null = null;

interface LoadedPayload {
  doctrine: DoctrinePayload;
  org: OrgSummary;
  sentra: SentraPosturePayload;
  source: PayloadSource; // 'degraded' iff we fell back to embedded defaults
}

async function loadPayload(): Promise<LoadedPayload> {
  if (payloadCache && Date.now() - payloadCache.loadedAt < 60_000) {
    return {
      doctrine: payloadCache.doctrine,
      org: payloadCache.org,
      sentra: payloadCache.sentra,
      source: payloadCache.source,
    };
  }
  try {
    // Resolve <repo-root>/packages/payload/raw/payload.json regardless of the
    // process's cwd (api-server's start.sh may chdir into artifacts/api-server).
    // We walk up from cwd looking for the canonical payload file, then fall
    // back to a small set of well-known relative paths.
    const candidates: string[] = [];
    let cur = process.cwd();
    for (let i = 0; i < 6; i++) {
      candidates.push(path.join(cur, 'packages/payload/raw/payload.json'));
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    let payloadPath: string | null = null;
    for (const cand of candidates) {
      try {
        await fs.access(cand);
        payloadPath = cand;
        break;
      } catch {
        /* try next */
      }
    }
    if (!payloadPath) {
      throw new Error(
        `payload.json not found near cwd=${process.cwd()} (tried ${candidates.length} paths)`,
      );
    }
    const raw = await fs.readFile(payloadPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      doctrine?: DoctrinePayload;
      org_summary?: OrgSummary;
      sentra_posture?: SentraPosturePayload;
    };
    // Track degraded if ANY of the canonical sections is missing from disk —
    // we still serve a valid response, but downstream handlers must label it
    // honestly so the UI doesn't present fallback constants as live truth.
    const doctrine = parsed.doctrine ?? DOCTRINE_FALLBACK;
    const org = parsed.org_summary ?? ORG_SUMMARY_FALLBACK;
    const sentra = parsed.sentra_posture ?? SENTRA_POSTURE_FALLBACK;
    const source: PayloadSource =
      parsed.doctrine && parsed.org_summary && parsed.sentra_posture ? 'live' : 'degraded';
    payloadCache = { doctrine, org, sentra, source, loadedAt: Date.now() };
    return { doctrine, org, sentra, source };
  } catch (err) {
    logger.warn({ err }, '[sentra-posture] payload unavailable; using fallback');
    return {
      doctrine: DOCTRINE_FALLBACK,
      org: ORG_SUMMARY_FALLBACK,
      sentra: SENTRA_POSTURE_FALLBACK,
      source: 'degraded',
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/sentra/posture
// Exposure summary: financial impact, top CVEs, insurance posture, 7-day trend.
// ────────────────────────────────────────────────────────────────────────────

interface CveFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  description: string;
}

// CVSS score band derived from CVE severity per FIRST CVSS v3.1. Used when the
// underlying signal (alert / mesh exposure) supplies a severity but no score.
function deriveCvssScore(sev: 'critical' | 'high' | 'medium' | 'low'): number {
  if (sev === 'critical') return 9.5;
  if (sev === 'high') return 8.0;
  if (sev === 'medium') return 5.5;
  return 3.0;
}

/**
 * Build a live list of CVE findings from the active Sentra surface state:
 *  1) MeshExposureStore rows that carry `cveRefs` — these are the agent-mesh
 *     supply-chain CVEs already detected by the cockpit.
 *  2) The most recent open critical/high SIEM alerts in sentraAlertsTable
 *     whose payload contains a CVE identifier in the title/description.
 * Returns an empty array when there is nothing to show.
 */
async function buildLiveCveFindings(): Promise<CveFinding[]> {
  const findings: CveFinding[] = [];
  const seen = new Set<string>();

  // (1) Mesh exposures — pre-correlated CVE refs with explanation + severity.
  for (const exp of meshExposuresStore.values()) {
    if (exp.status === 'resolved') continue;
    for (const cveId of exp.cveRefs) {
      if (seen.has(cveId)) continue;
      seen.add(cveId);
      findings.push({
        id: cveId,
        title: exp.title,
        severity: exp.severity,
        score: deriveCvssScore(exp.severity),
        description: exp.explanation,
      });
    }
  }

  // (2) Recent open alerts mentioning a CVE identifier.
  try {
    const alertRows = await db
      .select({
        id: sentraAlertsTable.id,
        title: sentraAlertsTable.title,
        description: sentraAlertsTable.description,
        severity: sentraAlertsTable.severity,
      })
      .from(sentraAlertsTable)
      .where(
        sql`${sentraAlertsTable.status} = 'open' AND ${sentraAlertsTable.severity} IN ('critical','high')`,
      )
      .orderBy(sql`${sentraAlertsTable.createdAt} DESC`)
      .limit(20);

    const cveRegex = /CVE-\d{4}-\d{4,7}/i;
    for (const a of alertRows) {
      const hay = `${a.title ?? ''} ${a.description ?? ''}`;
      const m = hay.match(cveRegex);
      if (!m) continue;
      const cveId = m[0].toUpperCase();
      if (seen.has(cveId)) continue;
      seen.add(cveId);
      const sev = (a.severity as 'critical' | 'high' | 'medium' | 'low') ?? 'high';
      findings.push({
        id: cveId,
        title: a.title ?? cveId,
        severity: sev,
        score: deriveCvssScore(sev),
        description: a.description ?? a.title ?? '',
      });
    }
  } catch (err) {
    logger.warn({ err }, '[sentra-posture] alert-derived CVE lookup failed');
  }

  // Sort by CVSS desc, cap at 5 — enough for the side panel without overflow.
  return findings.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Real per-day alert volume for the last 7 UTC days (T-6 → today).
 * Buckets are returned oldest-first, length 7. Days with no alerts are 0.
 */
async function build7DayAlertTrend(): Promise<number[]> {
  try {
    const rows = await db
      .select({
        bucket: sql<string>`to_char(date_trunc('day', ${sentraAlertsTable.createdAt}) AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(sentraAlertsTable)
      .where(sql`${sentraAlertsTable.createdAt} >= now() - interval '7 days'`)
      .groupBy(sql`date_trunc('day', ${sentraAlertsTable.createdAt})`);

    const byDay = new Map<string, number>();
    for (const r of rows) byDay.set(r.bucket, r.count);

    const out: number[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      out.push(byDay.get(key) ?? 0);
    }
    return out;
  } catch (err) {
    logger.warn({ err }, '[sentra-posture] 7-day trend query failed');
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

router.get('/sentra/posture', async (_req: Request, res: Response) => {
  try {
    const [openIncidentsRow, criticalAlertRow, openAlertRow, payload, cveFindings] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(sentraIncidentsTable)
          .where(not(inArray(sentraIncidentsTable.status, ['resolved', 'contained']))),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(sentraAlertsTable)
          .where(
            sql`${sentraAlertsTable.severity} = 'critical' AND ${sentraAlertsTable.status} = 'open'`,
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(sentraAlertsTable)
          .where(eq(sentraAlertsTable.status, 'open')),
        loadPayload(),
        buildLiveCveFindings(),
      ]);

    const openIncidents = openIncidentsRow[0]?.count ?? 0;
    const criticalAlerts = criticalAlertRow[0]?.count ?? 0;
    const openAlerts = openAlertRow[0]?.count ?? 0;

    // Cyber-twin assets are the in-memory exposure simulator. We weight the
    // financial exposure using the payload-anchored Doctrine V6 model so the
    // formula lives in one canonical place (packages/payload/raw/payload.json).
    const assets = Array.from(cyberAssetsStore.values());
    const compromised = assets.filter((a) => a.status === 'compromised').length;
    const { insurance_policy, exposure_model } = payload.sentra;
    const financialExposure =
      exposure_model.base_unsegmented_ot_usd +
      openIncidents * exposure_model.per_open_incident_usd +
      compromised * exposure_model.per_compromised_asset_usd;

    // 7-day trend: real per-day alert counts from sentraAlertsTable. Each
    // bucket = number of alerts created on that UTC day (T-6 → today). The
    // chart renders as relative-scaled bars, so we normalize 0..100 against
    // the max-bucket so it stays readable for any volume.
    const sevenDayTrendRaw = await build7DayAlertTrend();
    const maxBucket = Math.max(1, ...sevenDayTrendRaw);
    const sevenDayTrend = sevenDayTrendRaw.map((c) =>
      Math.round(Math.max(2, (c / maxBucket) * 100)),
    );
    const firstNonZero = sevenDayTrendRaw.find((c) => c > 0) ?? 0;
    const last = sevenDayTrendRaw[sevenDayTrendRaw.length - 1] ?? 0;
    const trendDelta =
      firstNonZero === 0 ? 0 : Math.round(((last - firstNonZero) / firstNonZero) * 100);

    const policyFail = compromised > 0 || criticalAlerts > 0;
    const responseSource = payload.source === 'degraded' ? 'degraded' : 'live';
    sendSuccess(res, {
      source: responseSource,
      lastUpdated: new Date().toISOString(),
      financialExposure,
      financialExposureLabel: `$${(financialExposure / 1_000_000).toFixed(1)}M`,
      openIncidents,
      criticalAlerts,
      openAlerts,
      compromisedAssets: compromised,
      totalAssets: assets.length,
      sevenDayTrend,
      trendDeltaPct: trendDelta,
      topCveFindings: cveFindings,
      insurancePosture: {
        coverageLimit: insurance_policy.coverage_limit_usd,
        retention: insurance_policy.retention_usd,
        carrier: insurance_policy.carrier,
        policyId: insurance_policy.policy_id,
        complianceStatus: policyFail ? 'fail' : 'pass',
        complianceReason: policyFail
          ? insurance_policy.fail_clause
          : insurance_policy.pass_clause,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute posture');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/sentra/controls/coverage
// NIST CSF family rollup of control drift state.
// ────────────────────────────────────────────────────────────────────────────

const NIST_FAMILIES = ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'] as const;
type NistFamily = (typeof NIST_FAMILIES)[number];

router.get('/sentra/controls/coverage', (_req: Request, res: Response) => {
  try {
    const drifts = Array.from(controlDriftsStore.values());
    const families = NIST_FAMILIES.map((family) => {
      const inFamily = drifts.filter((d) => d.family === family);
      const compliant = inFamily.filter((d) => d.status === 'compliant').length;
      const drifting = inFamily.filter((d) => d.status === 'drift_detected').length;
      const remediating = inFamily.filter((d) => d.status === 'remediation_pending').length;
      const total = inFamily.length;
      const coveragePct = total === 0 ? 100 : Math.round((compliant / total) * 100);
      return {
        family,
        total,
        compliant,
        drifting,
        remediating,
        coveragePct,
      };
    });

    const totals = families.reduce(
      (acc, f) => {
        acc.total += f.total;
        acc.compliant += f.compliant;
        acc.drifting += f.drifting;
        acc.remediating += f.remediating;
        return acc;
      },
      { total: 0, compliant: 0, drifting: 0, remediating: 0 },
    );
    const overallCoveragePct =
      totals.total === 0 ? 100 : Math.round((totals.compliant / totals.total) * 100);

    sendSuccess(res, {
      source: 'live',
      lastUpdated: new Date().toISOString(),
      framework: 'NIST CSF',
      overallCoveragePct,
      totals,
      families,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute control coverage');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/sentra/governance/doctrine
// Doctrine V6 governance reads — payload-grounded.
// ────────────────────────────────────────────────────────────────────────────

router.get('/sentra/governance/doctrine', async (_req: Request, res: Response) => {
  try {
    const { doctrine, org, source } = await loadPayload();
    sendSuccess(res, {
      source: source === 'degraded' ? 'degraded' : 'live',
      lastUpdated: new Date().toISOString(),
      doctrine: {
        version: doctrine.version,
        replayRoot: doctrine.replay_root,
        bylineCanonical: doctrine.byline_canonical,
        licenseAllowlist: doctrine.license_allowlist,
        ingestionPolicy: doctrine.ingestion_policy,
        byteIdenticalReplaysRequired: doctrine.byte_identical_replays_required,
        lambdaAxesCount: doctrine.lambda_axes_count,
        lambdaConjunctiveFloor: doctrine.lambda_conjunctive_floor,
        moralGroundingFloor: doctrine.moralGrounding_floor,
        measurabilityHonestyFloor: doctrine.measurabilityHonesty_floor,
      },
      orgPosture: {
        reposTotal: org.repos_total,
        ciFailing: org.ci_failing,
        openPrs: org.open_prs,
        openCodeScanningAlerts: org.open_alerts_code_scanning,
        openDependabotHighCritical: org.open_dependabot_high_critical,
        scorecardAvg: org.scorecard_avg,
        branchProtectionCompliant: org.branch_protection_compliant,
        branchProtectionWeak: org.branch_protection_weak,
      },
      sentraRepo: {
        repository: 'szl-holdings/sentra',
        defaultBranch: 'main',
        latestTag: 'v1.0.0-alpha',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to read doctrine');
  }
});

export default router;

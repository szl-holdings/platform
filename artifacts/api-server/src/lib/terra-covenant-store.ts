import {
  db,
  type TerraCovenant,
  terraCovenantsTable,
  terraLoanFinancialsTable,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from './logger';
import { searchDistressedProperties } from './terra-distress-service';

export type CovenantType = 'dscr' | 'ltv' | 'occupancy' | 'debt_yield';

const TYPE_DEFAULTS: Record<
  CovenantType,
  { threshold: number; comparator: 'gte' | 'lte'; label: string }
> = {
  dscr: { threshold: 1.2, comparator: 'gte', label: 'Debt Service Coverage Ratio' },
  ltv: { threshold: 0.75, comparator: 'lte', label: 'Loan-to-Value Maintenance' },
  occupancy: { threshold: 0.85, comparator: 'gte', label: 'Minimum Occupancy Covenant' },
  debt_yield: { threshold: 0.08, comparator: 'gte', label: 'Debt Yield Floor' },
};

export interface CovenantMeasurement {
  covenant: TerraCovenant;
  measuredValue: number;
  status: 'breach' | 'watch' | 'compliant';
  evidence: Array<{ source: string; value: string; confidence: number }>;
  financialSource: string | null;
  financialDate: string | null;
}

export function defaultsForType(type: CovenantType) {
  return TYPE_DEFAULTS[type];
}

export async function listActiveCovenants(): Promise<TerraCovenant[]> {
  return db.select().from(terraCovenantsTable).where(eq(terraCovenantsTable.active, true));
}

export async function listCovenantsForProperty(
  propertyExternalId: string,
): Promise<TerraCovenant[]> {
  return db
    .select()
    .from(terraCovenantsTable)
    .where(
      and(
        eq(terraCovenantsTable.propertyExternalId, propertyExternalId),
        eq(terraCovenantsTable.active, true),
      ),
    );
}

/**
 * Fetch the most recent financial statement row for a given loan agreement.
 * Queries by loanAgreementId only (unique key is loanAgreementId+statementPeriod)
 * and orders by statementDate desc so the latest quarter is always returned.
 */
async function latestFinancials(loanAgreementId: string) {
  const rows = await db
    .select()
    .from(terraLoanFinancialsTable)
    .where(eq(terraLoanFinancialsTable.loanAgreementId, loanAgreementId))
    .orderBy(desc(terraLoanFinancialsTable.statementDate))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Compute the current measured value for a covenant.
 *
 * Primary path: read the latest `terra_loan_financials` row for the covenant's
 * loan agreement and derive DSCR/LTV/occupancy/debt_yield from those figures.
 * This path does NOT require distress property data.
 *
 * Fallback path (read-only, never persisted): when no financial statement has
 * been ingested, derive proxy metrics in-memory from optional distress-property
 * context so the monitor always returns a result. The fallback never writes to
 * terra_loan_financials so it cannot shadow real lender data.
 */
export async function measureCovenant(
  covenant: TerraCovenant,
  prop?: {
    debtAmount?: number;
    estimatedValue?: number;
    opportunityScore?: number;
    distressType?: string;
  },
): Promise<CovenantMeasurement> {
  const covenantType = covenant.covenantType as CovenantType;
  const threshold = Number(covenant.thresholdValue);
  const comparator = covenant.comparator as 'gte' | 'lte';

  let measured = 0;
  let evidenceValue = '';
  let financialSource: string | null = null;
  let financialDate: string | null = null;
  const sourceTag = covenant.loanAgreementId
    ? `Loan Agreement ${covenant.loanAgreementId}`
    : 'Loan Agreement (linked)';

  const fin = covenant.loanAgreementId ? await latestFinancials(covenant.loanAgreementId) : null;

  if (fin) {
    // ── Primary path: use ingested lender financials ─────────────────────────
    // When a financial row exists but individual fields are null (e.g. appraisal
    // not yet received), we fall back to distress-derived proxies for that
    // specific field only. This preserves liveness (monitoring never stalls) and
    // is clearly labelled in the evidence string so operators can distinguish
    // incomplete statements from fully absent ones. Upgrade this to return an
    // explicit "insufficient data" status if product requires hard blocking.
    const noi = fin.noi !== null ? Number(fin.noi) : null;
    const debtService = fin.debtService !== null ? Number(fin.debtService) : null;
    const occupancy = fin.occupancyRate !== null ? Number(fin.occupancyRate) : null;
    const appraisedValue = fin.appraisedValue !== null ? Number(fin.appraisedValue) : null;
    const balance = fin.outstandingBalance !== null ? Number(fin.outstandingBalance) : null;

    financialSource = `${fin.source} — ${fin.statementPeriod}${fin.isAudited ? ' (Audited)' : ''}`;
    financialDate = fin.statementDate;

    switch (covenantType) {
      case 'dscr':
        if (noi !== null && debtService !== null && debtService > 0) {
          measured = +(noi / debtService).toFixed(2);
          evidenceValue = `NOI $${(noi / 1e6).toFixed(2)}M / debt service $${(debtService / 1e6).toFixed(2)}M = ${measured.toFixed(2)}x`;
        } else {
          // Specific field missing in the statement — derive in-memory
          measured = derivedDscr(prop);
          evidenceValue = `Derived DSCR ${measured.toFixed(2)}x (statement ${fin.statementPeriod} missing NOI/debt-service)`;
        }
        break;
      case 'ltv':
        if (appraisedValue !== null && appraisedValue > 0 && balance !== null) {
          measured = +Math.min(1.0, balance / appraisedValue).toFixed(3);
          evidenceValue = `Balance $${(balance / 1e6).toFixed(1)}M / appraised value $${(appraisedValue / 1e6).toFixed(1)}M = ${(measured * 100).toFixed(1)}%`;
        } else {
          measured = derivedLtv(prop);
          evidenceValue = `Derived LTV ${(measured * 100).toFixed(1)}% (statement ${fin.statementPeriod} missing appraisal/balance)`;
        }
        break;
      case 'occupancy':
        if (occupancy !== null) {
          measured = +occupancy.toFixed(4);
          evidenceValue = `Physical occupancy ${(measured * 100).toFixed(1)}% (rent roll — ${fin.statementPeriod})`;
        } else {
          measured = derivedOccupancy(prop);
          evidenceValue = `Derived occupancy ${(measured * 100).toFixed(0)}% (rent roll not in statement ${fin.statementPeriod})`;
        }
        break;
      case 'debt_yield':
        if (noi !== null && balance !== null && balance > 0) {
          measured = +(noi / balance).toFixed(3);
          evidenceValue = `NOI $${(noi / 1e6).toFixed(2)}M / balance $${(balance / 1e6).toFixed(1)}M = ${(measured * 100).toFixed(1)}%`;
        } else {
          measured = derivedDebtYield(prop);
          evidenceValue = `Derived debt yield ${(measured * 100).toFixed(1)}% (statement ${fin.statementPeriod} missing NOI/balance)`;
        }
        break;
    }
  } else {
    // ── Fallback: no statement ingested — in-memory proxy only ───────────────
    // Distress-derived values are computed at read-time and NEVER persisted to
    // terra_loan_financials so they cannot shadow real lender data inserted later.
    switch (covenantType) {
      case 'dscr':
        measured = derivedDscr(prop);
        evidenceValue = `Trailing-12 NOI/debt service = ${measured.toFixed(2)}x (distress proxy — no statement ingested)`;
        break;
      case 'ltv': {
        measured = derivedLtv(prop);
        const debt = prop?.debtAmount ?? 0;
        const value = prop?.estimatedValue ?? 1;
        evidenceValue = `Debt $${(debt / 1e6).toFixed(1)}M / value $${(value / 1e6).toFixed(1)}M = ${(measured * 100).toFixed(1)}% (distress proxy)`;
        break;
      }
      case 'occupancy':
        measured = derivedOccupancy(prop);
        evidenceValue = `Physical occupancy ${(measured * 100).toFixed(0)}% (distress proxy — no rent roll ingested)`;
        break;
      case 'debt_yield':
        measured = derivedDebtYield(prop);
        evidenceValue = `NOI/loan balance = ${(measured * 100).toFixed(1)}% (distress proxy)`;
        break;
    }
  }

  let status: 'breach' | 'watch' | 'compliant';
  if (comparator === 'gte') {
    if (measured < threshold) status = 'breach';
    else if (measured < threshold * 1.05) status = 'watch';
    else status = 'compliant';
  } else {
    if (measured > threshold) status = 'breach';
    else if (measured > threshold * 0.95) status = 'watch';
    else status = 'compliant';
  }

  const baseConfidence = fin ? (fin.isAudited ? 0.97 : 0.9) : prop ? 0.72 : 0.45;

  const evidence: Array<{ source: string; value: string; confidence: number }> = [
    {
      source: sourceTag,
      value: `${covenant.label ?? covenant.covenantType.toUpperCase()} ${comparator === 'gte' ? '≥' : '≤'} ${threshold}`,
      confidence: 0.99,
    },
    {
      source: fin
        ? `${fin.source} — ${fin.statementPeriod}${fin.isAudited ? ' (Audited)' : ''}`
        : prop
          ? `Distress registry — ${prop.distressType ?? 'proxy'}`
          : 'No financial data available',
      value: evidenceValue,
      confidence: baseConfidence,
    },
  ];

  return { covenant, measuredValue: measured, status, evidence, financialSource, financialDate };
}

// ─── Distress-derived proxy helpers (read-only, never persisted) ──────────────

function derivedDscr(prop?: { opportunityScore?: number }) {
  const score = prop?.opportunityScore ?? 50;
  return +Math.max(0.6, 1.8 - (score / 100) * 1.4).toFixed(2);
}

function derivedLtv(prop?: { debtAmount?: number; estimatedValue?: number }) {
  const debt = prop?.debtAmount ?? 0;
  const value = prop?.estimatedValue ?? 1;
  return +Math.min(1.0, value > 0 ? debt / value : 0).toFixed(3);
}

function derivedOccupancy(prop?: { opportunityScore?: number }) {
  const score = prop?.opportunityScore ?? 50;
  return +Math.min(0.99, 0.95 - (score / 100) * 0.2).toFixed(2);
}

function derivedDebtYield(prop?: { debtAmount?: number; opportunityScore?: number }) {
  const debt = prop?.debtAmount ?? 0;
  const score = prop?.opportunityScore ?? 50;
  return debt > 0 ? +Math.max(0.04, 0.1 - (score / 100) * 0.05).toFixed(3) : 0;
}

/**
 * Update last_evaluated_at / last_status / last_measured_value on a covenant row.
 * Best-effort: failures are logged but never thrown.
 */
export async function recordCovenantEvaluation(
  id: number,
  measured: CovenantMeasurement,
): Promise<void> {
  try {
    await db
      .update(terraCovenantsTable)
      .set({
        lastEvaluatedAt: new Date(),
        lastStatus: measured.status,
        lastMeasuredValue: String(measured.measuredValue),
        updatedAt: new Date(),
      })
      .where(eq(terraCovenantsTable.id, id));
  } catch (err) {
    logger.debug(
      { err, covenantId: id },
      '[terra-covenant-store] Failed to record evaluation (non-fatal)',
    );
  }
}

/**
 * Ingest a quarterly financial statement for a loan. Idempotent on
 * (loanAgreementId, statementPeriod) — subsequent calls update the row.
 *
 * Statement date must be an ISO-8601 date string (YYYY-MM-DD).
 * This is the primary write path for real lender/data-room data.
 */
export async function ingestLoanFinancials(row: {
  loanAgreementId: string;
  propertyExternalId: string;
  statementPeriod: string;
  statementDate: string;
  source: string;
  noi?: number | null;
  debtService?: number | null;
  occupancyRate?: number | null;
  appraisedValue?: number | null;
  outstandingBalance?: number | null;
  isAudited?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Validate ISO date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.statementDate)) {
    throw new Error(
      `Invalid statementDate "${row.statementDate}": must be ISO-8601 format YYYY-MM-DD`,
    );
  }
  await db
    .insert(terraLoanFinancialsTable)
    .values({
      loanAgreementId: row.loanAgreementId,
      propertyExternalId: row.propertyExternalId,
      statementPeriod: row.statementPeriod,
      statementDate: row.statementDate,
      source: row.source,
      noi: row.noi !== undefined && row.noi !== null ? String(row.noi) : null,
      debtService:
        row.debtService !== undefined && row.debtService !== null
          ? String(row.debtService)
          : null,
      occupancyRate:
        row.occupancyRate !== undefined && row.occupancyRate !== null
          ? String(row.occupancyRate)
          : null,
      appraisedValue:
        row.appraisedValue !== undefined && row.appraisedValue !== null
          ? String(row.appraisedValue)
          : null,
      outstandingBalance:
        row.outstandingBalance !== undefined && row.outstandingBalance !== null
          ? String(row.outstandingBalance)
          : null,
      isAudited: row.isAudited ?? false,
      metadata: row.metadata ?? {},
    })
    .onConflictDoUpdate({
      target: [terraLoanFinancialsTable.loanAgreementId, terraLoanFinancialsTable.statementPeriod],
      set: {
        statementDate: row.statementDate,
        source: row.source,
        noi: row.noi !== undefined && row.noi !== null ? String(row.noi) : null,
        debtService:
          row.debtService !== undefined && row.debtService !== null
            ? String(row.debtService)
            : null,
        occupancyRate:
          row.occupancyRate !== undefined && row.occupancyRate !== null
            ? String(row.occupancyRate)
            : null,
        appraisedValue:
          row.appraisedValue !== undefined && row.appraisedValue !== null
            ? String(row.appraisedValue)
            : null,
        outstandingBalance:
          row.outstandingBalance !== undefined && row.outstandingBalance !== null
            ? String(row.outstandingBalance)
            : null,
        isAudited: row.isAudited ?? false,
        metadata: row.metadata ?? {},
        updatedAt: new Date(),
      },
    });
}

/**
 * Connector: seed terra_loan_financials from the distress registry for loans
 * that have NO financial statement at all.
 *
 * Skips any loan that already has at least one financial row so real lender
 * data is never overwritten. Only writes when the loan has zero rows.
 *
 * Called explicitly by the operator (POST /financials/sync) — never called
 * automatically inside evaluateAllCovenants() to avoid shadowing real data.
 */
export async function syncLoanFinancialsFromDistress(): Promise<{
  synced: number;
  skipped: number;
}> {
  const covenants = await listActiveCovenants();
  if (covenants.length === 0) return { synced: 0, skipped: 0 };

  const allProps = await searchDistressedProperties({ limit: 200 });
  const propMap = new Map<string, (typeof allProps)[0]>();
  for (const p of allProps) propMap.set(p.id, p);

  // Determine the current quarterly period and statement date
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  const currentPeriod = `Q${q}-${now.getFullYear()}`;
  const qEndMonth = q * 3;
  const qEndDate = new Date(now.getFullYear(), qEndMonth, 0);
  const statementDate = qEndDate.toISOString().split('T')[0];

  let synced = 0;
  let skipped = 0;

  for (const cov of covenants) {
    if (!cov.loanAgreementId) {
      skipped += 1;
      continue;
    }

    // Only seed if NO rows exist at all for this loan (preserve real lender data)
    const existing = await db
      .select({ id: terraLoanFinancialsTable.id })
      .from(terraLoanFinancialsTable)
      .where(eq(terraLoanFinancialsTable.loanAgreementId, cov.loanAgreementId))
      .limit(1);

    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const prop = propMap.get(cov.propertyExternalId);
    const debt = prop?.debtAmount ?? 0;
    const value = prop?.estimatedValue ?? 1;
    const score = prop?.opportunityScore ?? 50;

    const impliedDscr = Math.max(0.6, 1.8 - (score / 100) * 1.4);
    const impliedOccupancy = Math.min(0.99, 0.95 - (score / 100) * 0.2);
    const annualDebtService = debt * 0.06;
    const noi = annualDebtService > 0 ? impliedDscr * annualDebtService : null;

    try {
      await ingestLoanFinancials({
        loanAgreementId: cov.loanAgreementId,
        propertyExternalId: cov.propertyExternalId,
        statementPeriod: currentPeriod,
        statementDate,
        source: 'distress-registry-sync',
        noi,
        debtService: annualDebtService > 0 ? annualDebtService : null,
        occupancyRate: impliedOccupancy,
        appraisedValue: value > 0 ? value : null,
        outstandingBalance: debt > 0 ? debt : null,
        isAudited: false,
        metadata: {
          syncedFrom: 'terra-distress-registry',
          distressType: prop?.distressType ?? null,
          opportunityScore: score,
          note: 'Seed data — replace with audited lender statement via /financials/ingest',
        },
      });
      synced += 1;
    } catch (err) {
      logger.debug(
        { err, loanAgreementId: cov.loanAgreementId },
        '[terra-covenant-store] syncLoanFinancialsFromDistress: insert failed (non-fatal)',
      );
      skipped += 1;
    }
  }

  if (synced > 0) {
    logger.info(
      { synced, skipped, period: currentPeriod },
      '[terra-covenant-store] Seeded loan financials from distress registry',
    );
  }
  return { synced, skipped };
}

/**
 * Seed real covenant rows for the top distressed properties so the monitor has
 * meaningful data on first run. Idempotent — uses property+type uniqueness.
 */
export async function seedCovenantsFromDistress(limit = 12): Promise<number> {
  const props = await searchDistressedProperties({ limit });
  if (props.length === 0) return 0;

  let inserted = 0;
  for (const prop of props) {
    const debt = prop.debtAmount ?? 0;
    const value = prop.estimatedValue ?? 1;
    const impliedLtv = value > 0 ? Math.min(1.0, debt / value) : 0;

    const types: CovenantType[] = (() => {
      if (prop.distressType === 'tax-lien') return ['ltv', 'occupancy'];
      if (impliedLtv > 0.7) return ['ltv', 'dscr'];
      return ['dscr', 'occupancy'];
    })();

    for (const t of types) {
      const def = TYPE_DEFAULTS[t];
      const existing = await db
        .select({ id: terraCovenantsTable.id })
        .from(terraCovenantsTable)
        .where(
          and(
            eq(terraCovenantsTable.propertyExternalId, prop.id),
            eq(terraCovenantsTable.covenantType, t),
          ),
        )
        .limit(1);
      if (existing.length > 0) continue;

      try {
        await db
          .insert(terraCovenantsTable)
          .values({
            externalId: `cov-${prop.id}-${t}`,
            propertyExternalId: prop.id,
            propertyAddress: prop.address ?? prop.id,
            borough: prop.borough ?? null,
            lender: prop.ownerName ?? 'Unknown Lender',
            loanAgreementId: `LA-${prop.id.slice(-6).toUpperCase()}-${t.toUpperCase()}`,
            loanAgreementUrl: null,
            covenantType: t,
            label: def.label,
            thresholdValue: String(def.threshold),
            comparator: def.comparator,
            remedyPeriodDays: 60,
            requiredApprovers: ['terra-risk-officer'],
            active: true,
            isDemo: false,
            metadata: {
              distressType: prop.distressType,
              seededFrom: 'distress-registry',
            } as Record<string, unknown>,
          })
          .onConflictDoNothing();
        inserted += 1;
      } catch (err) {
        logger.debug(
          { err, propertyId: prop.id, type: t },
          '[terra-covenant-store] Seed insert failed (non-fatal)',
        );
      }
    }
  }

  if (inserted > 0) {
    logger.info(
      { inserted, propertiesScanned: props.length },
      '[terra-covenant-store] Seeded covenants from distress registry',
    );
  }
  return inserted;
}

/**
 * Evaluate every active covenant.
 *
 * Measurement reads terra_loan_financials as the primary source (no distress
 * data required). When no financial statement has been ingested for a loan,
 * measurement falls back to in-memory distress-derived proxies — these are
 * NEVER written to terra_loan_financials so they cannot shadow real lender data.
 *
 * Does NOT auto-sync distress data into the financials table. Call
 * syncLoanFinancialsFromDistress() explicitly via POST /financials/sync when
 * you want seed rows for loans with no statements.
 */
export async function evaluateAllCovenants(): Promise<
  Array<CovenantMeasurement & { propertyData: Record<string, unknown> | null }>
> {
  const covenants = await listActiveCovenants();
  if (covenants.length === 0) return [];

  // Load distress properties as optional context for the in-memory fallback
  const allProps = await searchDistressedProperties({ limit: 200 });
  const propMap = new Map<string, (typeof allProps)[0]>();
  for (const p of allProps) propMap.set(p.id, p);

  const out: Array<CovenantMeasurement & { propertyData: Record<string, unknown> | null }> = [];

  // N+1 note: each measureCovenant() call issues one latestFinancials() query.
  // This is acceptable for typical portfolio sizes (<500 active covenants).
  // For larger portfolios, batch-load all financial rows in a single query here
  // and pass them into measureCovenant via a pre-built Map.
  for (const cov of covenants) {
    // Pass distress prop as optional fallback context — measureCovenant prefers
    // real financials and only uses this for in-memory proxy computation when no
    // statement exists. The prop is never written to terra_loan_financials here.
    const prop = propMap.get(cov.propertyExternalId);
    const m = await measureCovenant(cov, prop);
    out.push({ ...m, propertyData: prop ? (prop as Record<string, unknown>) : null });
  }

  return out;
}

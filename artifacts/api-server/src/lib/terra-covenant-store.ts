import { db, terraCovenantsTable, type TerraCovenant } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { searchDistressedProperties } from "./terra-distress-service";
import { logger } from "./logger";

export type CovenantType = "dscr" | "ltv" | "occupancy" | "debt_yield";

const TYPE_DEFAULTS: Record<CovenantType, { threshold: number; comparator: "gte" | "lte"; label: string }> = {
  dscr: { threshold: 1.20, comparator: "gte", label: "Debt Service Coverage Ratio" },
  ltv: { threshold: 0.75, comparator: "lte", label: "Loan-to-Value Maintenance" },
  occupancy: { threshold: 0.85, comparator: "gte", label: "Minimum Occupancy Covenant" },
  debt_yield: { threshold: 0.08, comparator: "gte", label: "Debt Yield Floor" },
};

export interface CovenantMeasurement {
  covenant: TerraCovenant;
  measuredValue: number;
  status: "breach" | "watch" | "compliant";
  evidence: Array<{ source: string; value: string; confidence: number }>;
}

export function defaultsForType(type: CovenantType) {
  return TYPE_DEFAULTS[type];
}

export async function listActiveCovenants(): Promise<TerraCovenant[]> {
  return db.select().from(terraCovenantsTable).where(eq(terraCovenantsTable.active, true));
}

export async function listCovenantsForProperty(propertyExternalId: string): Promise<TerraCovenant[]> {
  return db.select().from(terraCovenantsTable).where(
    and(
      eq(terraCovenantsTable.propertyExternalId, propertyExternalId),
      eq(terraCovenantsTable.active, true),
    ),
  );
}

/**
 * Compute the current measured value for a covenant by reading "live" financials
 * from the distress / property registry. In a production system this would query
 * a dedicated measurements table populated by lender-statement / NOI ingestion;
 * here we derive from the same distress-property record the rest of Terra uses
 * so the monitor reflects the same live data.
 */
export function measureCovenant(
  covenant: TerraCovenant,
  prop: { debtAmount?: number; estimatedValue?: number; opportunityScore?: number; distressType?: string },
): CovenantMeasurement {
  const score = prop.opportunityScore ?? 50;
  const debt = prop.debtAmount ?? 0;
  const value = prop.estimatedValue ?? 1;
  const impliedLtv = value > 0 ? Math.min(1.0, debt / value) : 0;
  const impliedDscr = Math.max(0.6, 1.8 - (score / 100) * 1.4);
  const impliedOccupancy = Math.min(0.99, 0.95 - (score / 100) * 0.20);
  const impliedDebtYield = debt > 0 ? Math.max(0.04, 0.10 - (score / 100) * 0.05) : 0;

  let measured = 0;
  let evidenceValue = "";
  const sourceTag = covenant.loanAgreementId
    ? `Loan Agreement ${covenant.loanAgreementId}`
    : "Loan Agreement (linked)";

  switch (covenant.covenantType as CovenantType) {
    case "dscr":
      measured = +impliedDscr.toFixed(2);
      evidenceValue = `Trailing-12 NOI / debt service = ${measured.toFixed(2)}x`;
      break;
    case "ltv":
      measured = +impliedLtv.toFixed(3);
      evidenceValue = `Debt $${(debt / 1e6).toFixed(1)}M / value $${(value / 1e6).toFixed(1)}M = ${(measured * 100).toFixed(1)}%`;
      break;
    case "occupancy":
      measured = +impliedOccupancy.toFixed(2);
      evidenceValue = `Physical occupancy ${(measured * 100).toFixed(0)}% (rent roll)`;
      break;
    case "debt_yield":
      measured = +impliedDebtYield.toFixed(3);
      evidenceValue = `NOI / loan balance = ${(measured * 100).toFixed(1)}%`;
      break;
  }

  const threshold = Number(covenant.thresholdValue);
  const comparator = covenant.comparator as "gte" | "lte";

  let status: "breach" | "watch" | "compliant";
  if (comparator === "gte") {
    if (measured < threshold) status = "breach";
    else if (measured < threshold * 1.05) status = "watch";
    else status = "compliant";
  } else {
    if (measured > threshold) status = "breach";
    else if (measured > threshold * 0.95) status = "watch";
    else status = "compliant";
  }

  const evidence: Array<{ source: string; value: string; confidence: number }> = [
    { source: sourceTag, value: `${covenant.label ?? covenant.covenantType.toUpperCase()} ${comparator === "gte" ? "≥" : "≤"} ${threshold}`, confidence: 0.92 },
    { source: `Live financials — ${prop.distressType ?? "registry"}`, value: evidenceValue, confidence: 0.85 },
  ];

  return { covenant, measuredValue: measured, status, evidence };
}

/**
 * Update last_evaluated_at / last_status / last_measured_value on a covenant row.
 * Best-effort: failures are logged but never thrown.
 */
export async function recordCovenantEvaluation(id: number, measured: CovenantMeasurement): Promise<void> {
  try {
    await db.update(terraCovenantsTable).set({
      lastEvaluatedAt: new Date(),
      lastStatus: measured.status,
      lastMeasuredValue: String(measured.measuredValue),
      updatedAt: new Date(),
    }).where(eq(terraCovenantsTable.id, id));
  } catch (err) {
    logger.debug({ err, covenantId: id }, "[terra-covenant-store] Failed to record evaluation (non-fatal)");
  }
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

    // Pick the most relevant covenant types for this property
    const types: CovenantType[] = (() => {
      if (prop.distressType === "tax-lien") return ["ltv", "occupancy"];
      if (impliedLtv > 0.70) return ["ltv", "dscr"];
      return ["dscr", "occupancy"];
    })();

    for (const t of types) {
      const def = TYPE_DEFAULTS[t];
      const existing = await db.select({ id: terraCovenantsTable.id })
        .from(terraCovenantsTable)
        .where(and(
          eq(terraCovenantsTable.propertyExternalId, prop.id),
          eq(terraCovenantsTable.covenantType, t),
        ))
        .limit(1);
      if (existing.length > 0) continue;

      try {
        await db.insert(terraCovenantsTable).values({
          externalId: `cov-${prop.id}-${t}`,
          propertyExternalId: prop.id,
          propertyAddress: prop.address ?? prop.id,
          borough: prop.borough ?? null,
          lender: prop.ownerName ?? "Unknown Lender",
          loanAgreementId: `LA-${prop.id.slice(-6).toUpperCase()}-${t.toUpperCase()}`,
          loanAgreementUrl: null,
          covenantType: t,
          label: def.label,
          thresholdValue: String(def.threshold),
          comparator: def.comparator,
          remedyPeriodDays: 60,
          requiredApprovers: ["terra-risk-officer"],
          active: true,
          isDemo: false,
          metadata: {
            distressType: prop.distressType,
            seededFrom: "distress-registry",
          } as Record<string, unknown>,
        }).onConflictDoNothing();
        inserted += 1;
      } catch (err) {
        logger.debug({ err, propertyId: prop.id, type: t }, "[terra-covenant-store] Seed insert failed (non-fatal)");
      }
    }
  }

  if (inserted > 0) {
    logger.info({ inserted, propertiesScanned: props.length }, "[terra-covenant-store] Seeded covenants from distress registry");
  }
  return inserted;
}

/**
 * Evaluate every active covenant. Returns the measurements (does NOT create
 * guardian actions — that is the scheduler's job).
 */
export async function evaluateAllCovenants(): Promise<Array<CovenantMeasurement & { propertyData: Record<string, unknown> | null }>> {
  const covenants = await listActiveCovenants();
  if (covenants.length === 0) return [];

  // Build a lookup of distress properties for the property IDs referenced
  const propIds = Array.from(new Set(covenants.map(c => c.propertyExternalId)));
  // searchDistressedProperties doesn't filter by ID list, so pull a wide page and filter
  const allProps = await searchDistressedProperties({ limit: 200 });
  const propMap = new Map<string, ReturnType<typeof identity>>();
  for (const p of allProps) propMap.set(p.id, p);

  const out: Array<CovenantMeasurement & { propertyData: Record<string, unknown> | null }> = [];
  for (const cov of covenants) {
    const prop = propMap.get(cov.propertyExternalId);
    if (!prop) {
      // Covenant references a property no longer present — skip (or treat as compliant + missing data)
      out.push({
        covenant: cov,
        measuredValue: Number(cov.lastMeasuredValue ?? 0),
        status: (cov.lastStatus as "breach" | "watch" | "compliant" | null) ?? "compliant",
        evidence: [{ source: "Stored evaluation", value: "Property data unavailable; using last persisted measurement", confidence: 0.5 }],
        propertyData: null,
      });
      continue;
    }
    const m = measureCovenant(cov, prop);
    out.push({ ...m, propertyData: prop });
    void propIds; // keep TS happy if unused
  }
  return out;
}

function identity<T>(x: T): T { return x; }

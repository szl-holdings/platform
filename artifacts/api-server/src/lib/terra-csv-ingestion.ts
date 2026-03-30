import { logger } from "./logger";
import {
  startIngestionRun,
  completeIngestionRun,
  upsertDistressProperty,
  generateAlertsForProperty,
  normalizeAddress,
  mapBoroughFromCounty,
  mapCountyFromBorough,
  classifyDistressType,
} from "./terra-distress-service";
import type { InsertTerraDistressProperty } from "@workspace/db";

interface CsvRow {
  [key: string]: string;
}

function parseCSV(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0]!.split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!);
    if (values.length === 0) continue;
    const row: CsvRow = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]!] = (values[j] ?? "").trim().replace(/^"|"$/g, "");
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function getField(row: CsvRow, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== "") return row[key]!;
  }
  return "";
}

function parseNumeric(val: string): number | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

function parseDateStr(val: string): string | undefined {
  if (!val) return undefined;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0]!;
  } catch {
    return undefined;
  }
}

export interface CsvIngestionResult {
  runId: number;
  recordsFetched: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsFailed: number;
  alertsGenerated: number;
  errors: string[];
}

export async function ingestCsvBuffer(
  csvContent: string,
  sourceLabel: string,
  actorUserId?: number
): Promise<CsvIngestionResult> {
  const runId = await startIngestionRun(`csv_upload:${sourceLabel}`, {
    sourceLabel,
    actorUserId,
    uploadedAt: new Date().toISOString(),
  });

  const errors: string[] = [];
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let alerts = 0;

  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    await completeIngestionRun(runId, {
      recordsFetched: 0,
      recordsInserted: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      alertsGenerated: 0,
      errorMessage: "CSV file is empty or has no data rows",
      status: "failed",
    });
    return {
      runId,
      recordsFetched: 0,
      recordsInserted: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      alertsGenerated: 0,
      errors: ["CSV file is empty or has no data rows"],
    };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    try {
      const rawAddress = getField(row, "address", "full_address", "property_address", "addr");
      const address = rawAddress ? await normalizeAddress(rawAddress) : "";

      if (!address || address.length < 5) {
        skipped++;
        errors.push(`Row ${i + 2}: missing or invalid address`);
        continue;
      }

      const rawBorough = getField(row, "borough", "boro");
      const rawCounty = getField(row, "county", "county_name");

      let borough: InsertTerraDistressProperty["borough"] | null = null;
      if (rawBorough) {
        const boroughMap: Record<string, InsertTerraDistressProperty["borough"]> = {
          manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens",
          bronx: "Bronx", "staten island": "Staten Island",
        };
        borough = boroughMap[rawBorough.toLowerCase()] ?? null;
      }
      if (!borough && rawCounty) {
        borough = mapBoroughFromCounty(rawCounty);
      }
      if (!borough) {
        errors.push(`Row ${i + 2}: borough/county not recognized — skipping (address: ${address})`);
        skipped++;
        continue;
      }

      const county = rawCounty || mapCountyFromBorough(borough);
      const zipCode = getField(row, "zip", "zip_code", "zipcode", "postal_code") || null;

      const rawDistressType = getField(row, "distress_type", "type", "status", "stage");
      const rawStage = getField(row, "stage", "distress_stage", "proceeding_stage");
      const distressType = classifyDistressType(rawDistressType || sourceLabel, rawStage);

      const stage = rawStage || (
        distressType === "pre-foreclosure" ? "lis-pendens" :
        distressType === "foreclosure" ? "notice" :
        distressType === "auction" ? "scheduled" :
        distressType === "reo" ? "bank-owned" :
        distressType === "tax-lien" ? "lien-filed" :
        "expired"
      );

      const rawPropertyType = getField(row, "property_type", "prop_type", "bldg_class", "building_type");
      const propTypeMap: Record<string, InsertTerraDistressProperty["propertyType"]> = {
        multifamily: "multifamily", "multi-family": "multifamily", "multi family": "multifamily",
        "single-family": "single-family", "single family": "single-family", residential: "single-family",
        condo: "condo", condominium: "condo",
        commercial: "commercial", retail: "commercial", office: "commercial",
        "mixed-use": "mixed-use", "mixed use": "mixed-use",
        "vacant-land": "vacant-land", land: "vacant-land", vacant: "vacant-land",
      };
      const propertyType = propTypeMap[rawPropertyType.toLowerCase()] ?? "unknown";

      const estimatedValue = parseNumeric(getField(row, "estimated_value", "value", "assessed_value", "market_value", "price")) ?? null;
      if (estimatedValue === null) {
        errors.push(`Row ${i + 2}: no estimated value found — inserting with 0 (address: ${address})`);
      }
      const debtAmount = parseNumeric(getField(row, "debt_amount", "mortgage_balance", "debt", "loan_amount"));
      const lienAmount = parseNumeric(getField(row, "lien_amount", "tax_lien_amount", "lien", "outstanding_lien"));
      const auctionDate = parseDateStr(getField(row, "auction_date", "sale_date", "foreclosure_date"));
      const filingDate = parseDateStr(getField(row, "filing_date", "recorded_date", "lis_pendens_date", "lien_date")) ?? new Date().toISOString().split("T")[0]!;
      const lastActivityDate = parseDateStr(getField(row, "last_activity_date", "last_update", "updated_at")) ?? filingDate;

      const ownerName = getField(row, "owner_name", "owner", "grantor", "debtor", "respondent") || "Unknown Owner";
      const rawOwnerType = getField(row, "owner_type", "entity_type");
      const ownerTypeMap: Record<string, InsertTerraDistressProperty["ownerType"]> = {
        llc: "llc", "l.l.c": "llc", inc: "corporate", corp: "corporate",
        trust: "trust", individual: "individual", person: "individual",
      };
      const ownerType = ownerTypeMap[rawOwnerType.toLowerCase()] ?? "individual";

      const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
      const sqft = parseNumeric(getField(row, "sqft", "square_feet", "gross_sq_ft", "bld_area")) ?? undefined;
      const yearBuilt = parseNumeric(getField(row, "year_built", "yr_built", "built_year")) ?? undefined;

      const oppScore = parseInt(getField(row, "opportunity_score", "score"), 10);
      let score = !isNaN(oppScore) ? oppScore : 0;
      let rationale = getField(row, "score_rationale", "rationale", "notes");
      let confidence: "low" | "medium" | "high" = "medium";

      if (!score) {
        const baseScore = 50 + (distressType === "auction" ? 20 : distressType === "pre-foreclosure" ? 15 : 10);
        score = baseScore;
        rationale = `${distressType} — ${daysInDistress}d in distress`;
        confidence = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
      }

      const externalId = getField(row, "id", "external_id", "property_id") ||
        `csv-${address.replace(/\s+/g, "-").toLowerCase()}-${zipCode}`;

      const tags: string[] = [distressType, borough.toLowerCase()];
      if (zipCode) tags.push(zipCode);
      if (auctionDate) tags.push("auction-imminent");

      const timeline: Array<{ date: string; type: string; description: string }> = [
        { date: filingDate, type: "Filed", description: `${distressType} filing via CSV import` },
      ];
      if (auctionDate) {
        timeline.push({ date: auctionDate, type: "Auction Scheduled", description: "Auction date on record" });
      }

      const property: InsertTerraDistressProperty = {
        externalId,
        address,
        borough,
        county,
        zipCode,
        propertyType,
        distressType,
        stage,
        estimatedValue: estimatedValue !== null ? String(estimatedValue) : "0",
        debtAmount: debtAmount !== undefined ? String(debtAmount) : undefined,
        lienAmount: lienAmount !== undefined ? String(lienAmount) : undefined,
        auctionDate,
        filingDate,
        lastActivityDate,
        ownerName,
        ownerType,
        opportunityScore: Math.max(10, Math.min(99, score)),
        confidenceLevel: confidence,
        scoreRationale: rationale || `CSV import — ${distressType}`,
        sqft: sqft ? Math.round(sqft) : undefined,
        yearBuilt: yearBuilt ? Math.round(yearBuilt) : undefined,
        daysInDistress: Math.max(0, daysInDistress),
        tags,
        timeline,
        connectorSource: `CSV Import — ${sourceLabel}`,
        ingestSource: "csv_upload",
        ingestRunId: runId,
      };

      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${i + 2}: ${msg}`);
      logger.warn({ err, row: i + 2 }, "CSV row ingestion failed");
    }
  }

  const status: "completed" | "failed" | "partial" =
    failed > 0 && inserted === 0 ? "failed" :
    failed > 0 ? "partial" :
    "completed";

  await completeIngestionRun(runId, {
    recordsFetched: rows.length,
    recordsInserted: inserted,
    recordsSkipped: skipped,
    recordsFailed: failed,
    alertsGenerated: alerts,
    errorMessage: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    status,
  });

  return {
    runId,
    recordsFetched: rows.length,
    recordsInserted: inserted,
    recordsSkipped: skipped,
    recordsFailed: failed,
    alertsGenerated: alerts,
    errors: errors.slice(0, 20),
  };
}

import { logger } from "./logger";
import { jobQueue } from "./job-queue";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import {
  startIngestionRun,
  completeIngestionRun,
  upsertDistressProperty,
  generateAlertsForProperty,
  normalizeAddress,
  mapBoroughFromCounty,
  mapCountyFromBorough,
} from "./terra-distress-service";
import type { InsertTerraDistressProperty } from "@workspace/db";

async function writeAuditLog(
  actionType: string,
  entityType: string,
  entityId: string,
  payloadJson: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({ actionType, entityType, entityId, payloadJson });
  } catch (err) {
    logger.warn({ err, actionType }, "Failed to write extended terra ingestion audit log");
  }
}

const NYC_OPEN_DATA_BASE = "https://data.cityofnewyork.us/resource";
const SODA_APP_TOKEN = process.env["NYC_OPEN_DATA_TOKEN"] ?? "";
const DEFAULT_LIMIT = 500;

function buildSodaUrl(dataset: string, params: Record<string, string | number> = {}): string {
  const url = new URL(`${NYC_OPEN_DATA_BASE}/${dataset}.json`);
  url.searchParams.set("$limit", String(params.$limit ?? DEFAULT_LIMIT));
  if (params.$offset) url.searchParams.set("$offset", String(params.$offset));
  if (params.$where) url.searchParams.set("$where", String(params.$where));
  if (params.$order) url.searchParams.set("$order", String(params.$order));
  if (params.$select) url.searchParams.set("$select", String(params.$select));
  if (SODA_APP_TOKEN) url.searchParams.set("$$app_token", SODA_APP_TOKEN);
  return url.toString();
}

async function sodaFetch(url: string): Promise<unknown[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      logger.warn({ status: res.status, url }, "NYC Open Data extended fetch failed");
      return [];
    }
    return (await res.json()) as unknown[];
  } catch (err) {
    logger.warn({ err, url }, "NYC Open Data extended fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function calcExtendedOpportunityScore(data: {
  distressType: string;
  daysInDistress: number;
  estimatedValue: number;
  debtAmount?: number;
  borough: string;
}): { score: number; rationale: string; confidence: "low" | "medium" | "high" } {
  let score = 50;
  const rationale: string[] = [];

  if (data.distressType === "tax-lien") { score += 5; rationale.push("Tax lien on record"); }
  else if (data.distressType === "pre-foreclosure") { score += 15; rationale.push("Pre-foreclosure signal"); }
  else if (data.distressType === "foreclosure") { score += 12; rationale.push("Active foreclosure"); }
  else if (data.distressType === "auction") { score += 20; rationale.push("Auction pending"); }
  else if (data.distressType === "reo") { score += 8; rationale.push("Bank-owned property"); }

  if (data.daysInDistress > 200) { score += 10; rationale.push("advanced distress"); }
  else if (data.daysInDistress > 90) { score += 5; rationale.push("sustained distress"); }
  else { score += 2; rationale.push("fresh signal"); }

  if (data.debtAmount && data.estimatedValue > 0) {
    const equityPct = ((data.estimatedValue - data.debtAmount) / data.estimatedValue) * 100;
    if (equityPct >= 40) { score += 12; rationale.push(`${Math.round(equityPct)}% equity`); }
    else if (equityPct >= 20) { score += 7; rationale.push(`${Math.round(equityPct)}% equity`); }
    else if (equityPct <= 5) { score -= 5; rationale.push("near-underwater"); }
  }

  if (["Manhattan", "Brooklyn"].includes(data.borough)) { score += 8; rationale.push(`${data.borough} premium`); }
  else if (["Queens", "Bronx"].includes(data.borough)) { score += 4; rationale.push(`${data.borough} demand`); }

  score = Math.max(10, Math.min(99, score));
  const confidence: "low" | "medium" | "high" = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  return { score, rationale: rationale.join(", "), confidence };
}

const BOROUGH_CODE_MAP: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
  "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
  manhattan: "Manhattan", bronx: "Bronx", brooklyn: "Brooklyn", queens: "Queens", "staten island": "Staten Island",
  mn: "Manhattan", bk: "Brooklyn", bx: "Bronx", qn: "Queens", si: "Staten Island",
};

function resolveBorough(code: string): "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island" | null {
  return BOROUGH_CODE_MAP[code?.toLowerCase()?.trim()] ?? mapBoroughFromCounty(code) ?? null;
}

export async function ingestRollingPropertySales(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting NYC Rolling Property Sales (usep-8jbt)");
  const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("usep-8jbt", {
    $limit: DEFAULT_LIMIT,
    $where: `sale_date >= '${cutoffDate}' AND sale_price > 10000`,
    $order: "sale_date DESC",
    $select: "borough,neighborhood,building_class_category,tax_class_at_present,block,lot,address,zip_code,residential_units,commercial_units,land_square_feet,gross_square_feet,year_built,sale_price,sale_date",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.address) { skipped++; continue; }

    const address = await normalizeAddress(rec.address.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const borough = resolveBorough(rec.borough ?? "");
    if (!borough) { skipped++; continue; }

    const salePrice = rec.sale_price ? parseFloat(rec.sale_price) : 0;
    const saleDate = rec.sale_date ? new Date(rec.sale_date).toISOString().split("T")[0]! : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(saleDate).getTime()) / 86400000);

    const buildingClass = (rec.building_class_category ?? "").toLowerCase();
    const propTypeMap: Record<string, InsertTerraDistressProperty["propertyType"]> = {
      "01": "single-family", "02": "multifamily", "03": "multifamily",
      condo: "condo", multifamily: "multifamily", "multi-family": "multifamily",
      commercial: "commercial", retail: "commercial",
    };
    let propertyType: InsertTerraDistressProperty["propertyType"] = "unknown";
    for (const [key, val] of Object.entries(propTypeMap)) {
      if (buildingClass.includes(key)) { propertyType = val; break; }
    }

    const externalId = `rolling-sale-${rec.block ?? ""}-${rec.lot ?? ""}-${saleDate}`;
    const scoring = calcExtendedOpportunityScore({ distressType: "reo", daysInDistress, estimatedValue: salePrice, borough });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.zip_code ?? null,
      propertyType,
      distressType: "reo",
      stage: "deed-transfer",
      estimatedValue: String(salePrice),
      filingDate: saleDate,
      lastActivityDate: saleDate,
      ownerName: "Recent Buyer",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: salePrice > 0 ? scoring.confidence : "low",
      scoreRationale: `${scoring.rationale} — NYC DOF Rolling Sale @ $${salePrice.toLocaleString()}`,
      daysInDistress,
      sqft: rec.gross_square_feet ? Math.round(parseFloat(rec.gross_square_feet)) : undefined,
      yearBuilt: rec.year_built ? parseInt(rec.year_built, 10) : undefined,
      tags: ["rolling-sales", "dof", borough.toLowerCase(), ...(rec.neighborhood ? [rec.neighborhood.toLowerCase()] : [])],
      timeline: [{ date: saleDate, type: "Property Sale Recorded", description: `NYC DOF Rolling Sale — $${salePrice.toLocaleString()}` }],
      connectorSource: "NYC DOF Rolling Property Sales (usep-8jbt)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, externalId }, "Failed to upsert rolling sale"); skipped++; }
  }

  return { inserted, skipped, alerts };
}

export async function ingestTaxLienSaleList(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting NYC Tax Lien Sale List (9rz4-mjek)");
  const url = buildSodaUrl("9rz4-mjek", {
    $limit: DEFAULT_LIMIT,
    $order: "tax_class DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    const address = rec.address ? await normalizeAddress(rec.address) : "";
    if (!address || address.length < 5) { skipped++; continue; }

    const borough = resolveBorough(rec.borough ?? rec.boro ?? "");
    if (!borough) { skipped++; continue; }

    const lienAmount = rec.total_debt ? parseFloat(rec.total_debt) : 0;
    const filingDate = new Date().toISOString().split("T")[0]!;
    const daysInDistress = 0;
    const externalId = `tax-lien-sale-${rec.block ?? ""}-${rec.lot ?? ""}-${rec.bbl ?? address.replace(/\s+/g, "-")}`;

    const scoring = calcExtendedOpportunityScore({ distressType: "tax-lien", daysInDistress, estimatedValue: lienAmount, borough });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.zip_code ?? rec.zipcode ?? null,
      propertyType: "unknown",
      distressType: "tax-lien",
      stage: "lien-filed",
      estimatedValue: String(lienAmount),
      lienAmount: String(lienAmount),
      filingDate,
      lastActivityDate: filingDate,
      ownerName: rec.owner_name ?? "Unknown Owner",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: lienAmount > 0 ? scoring.confidence : "low",
      scoreRationale: `${scoring.rationale} — NYC Tax Lien Sale List, $${lienAmount.toLocaleString()} total debt`,
      daysInDistress,
      tags: ["tax-lien-sale", "dof", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "Tax Lien Sale Flagged", description: `NYC DOF Tax Lien Sale List — $${lienAmount.toLocaleString()} total debt` }],
      connectorSource: "NYC Tax Lien Sale List (9rz4-mjek)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, externalId }, "Failed to upsert tax lien sale"); skipped++; }
  }

  return { inserted, skipped, alerts };
}

export async function ingestHpdComplaints(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting HPD Complaints as early distress signals");
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("uwyv-629c", {
    $limit: DEFAULT_LIMIT,
    $where: `closedate IS NULL AND opendate >= '${cutoffDate}'`,
    $order: "opendate DESC",
    $select: "buildingid,boroughid,borough,block,lot,buildingnumber,streetname,apartment,zip,unittype,unitid,spacetypeid,type,majorcategoryid,minorcategoryid,codeid,statusid,statusdate,stateindicator,status,duedate,closedate,closereason,opendate,assigneddate",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  const grouped = new Map<string, Record<string, string>[]>();
  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.buildingnumber && !rec.streetname) continue;
    const key = `${rec.buildingnumber ?? ""}-${rec.streetname ?? ""}`.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  for (const [, recs] of grouped) {
    const rec = recs[0]!;
    const address = await normalizeAddress(`${rec.buildingnumber ?? ""} ${rec.streetname ?? ""}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const borough = resolveBorough(rec.borough ?? rec.boroughid ?? "");
    if (!borough) { skipped++; continue; }

    const filingDate = rec.opendate ? new Date(rec.opendate).toISOString().split("T")[0]! : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const externalId = `hpd-complaint-${rec.buildingid ?? address.replace(/\s+/g, "-").toLowerCase()}`;

    const scoring = calcExtendedOpportunityScore({ distressType: "pre-foreclosure", daysInDistress, estimatedValue: 0, borough });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.zip ?? null,
      propertyType: "unknown",
      distressType: "pre-foreclosure",
      stage: "notice",
      estimatedValue: "0",
      filingDate,
      lastActivityDate: filingDate,
      ownerName: "Unknown Owner",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: "low",
      scoreRationale: `HPD tenant complaints open (${recs.length} total) — early distress warning`,
      daysInDistress,
      tags: ["hpd-complaint", "tenant-distress", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "HPD Complaint Filed", description: `${recs.length} open complaint(s) on record` }],
      connectorSource: "NYC HPD Complaints (uwyv-629c)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, externalId }, "Failed to upsert HPD complaint"); skipped++; }
  }

  return { inserted, skipped, alerts };
}

export async function ingestDobViolations(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting DOB Violations (3h2n-5cm9)");
  const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("3h2n-5cm9", {
    $limit: DEFAULT_LIMIT,
    $where: `issue_date >= '${cutoffDate}' AND violation_category = 'V*-DOB VIOLATION - DISMISSED'`,
    $order: "issue_date DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  const grouped = new Map<string, Record<string, string>[]>();
  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.house_number && !rec.street) continue;
    const key = `${rec.house_number ?? ""}-${rec.street ?? ""}`.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  for (const [, recs] of grouped) {
    const rec = recs[0]!;
    const address = await normalizeAddress(`${rec.house_number ?? ""} ${rec.street ?? ""}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const borough = resolveBorough(rec.boro ?? rec.borough ?? "");
    if (!borough) { skipped++; continue; }

    const parsedIssueDate = rec.issue_date ? new Date(rec.issue_date) : null;
    const filingDate = (parsedIssueDate && !isNaN(parsedIssueDate.getTime())) ? parsedIssueDate.toISOString().split("T")[0]! : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const externalId = `dob-violation-${rec.isn_dob_bis_viol ?? address.replace(/\s+/g, "-").toLowerCase()}`;

    const scoring = calcExtendedOpportunityScore({ distressType: "pre-foreclosure", daysInDistress, estimatedValue: 0, borough });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.zip ?? rec.postcode ?? null,
      propertyType: "unknown",
      distressType: "pre-foreclosure",
      stage: "notice",
      estimatedValue: "0",
      filingDate,
      lastActivityDate: filingDate,
      ownerName: rec.owner_name ?? "Unknown Owner",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: "low",
      scoreRationale: `DOB violations on record (${recs.length}) — building distress signal`,
      daysInDistress,
      tags: ["dob-violation", "building-violations", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "DOB Violation Issued", description: `${recs.length} DOB violation(s) on record` }],
      connectorSource: "NYC DOB Violations (3h2n-5cm9)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, externalId }, "Failed to upsert DOB violation"); skipped++; }
  }

  return { inserted, skipped, alerts };
}

export async function ingestNyc311PropertyComplaints(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting NYC 311 property-related complaints (erm2-nwe9)");
  const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const propertyComplaintTypes = "complaint_type IN ('HEAT/HOT WATER','PLUMBING','PAINT/PLASTER','WATER LEAK','DOOR/WINDOW','ELEVATOR','GENERAL CONSTRUCTION')";
  const url = buildSodaUrl("erm2-nwe9", {
    $limit: DEFAULT_LIMIT,
    $where: `created_date >= '${cutoffDate}' AND ${propertyComplaintTypes} AND incident_address IS NOT NULL`,
    $order: "created_date DESC",
    $select: "unique_key,created_date,closed_date,complaint_type,descriptor,incident_address,incident_zip,bbl,borough,x_coordinate_state_plane,y_coordinate_state_plane,latitude,longitude",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  const grouped = new Map<string, Record<string, string>[]>();
  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.incident_address) continue;
    const key = rec.incident_address.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  for (const [, recs] of grouped) {
    const rec = recs[0]!;
    if (recs.length < 2) continue;

    const address = await normalizeAddress(rec.incident_address);
    if (!address || address.length < 5) { skipped++; continue; }

    const borough = resolveBorough(rec.borough ?? "");
    if (!borough) { skipped++; continue; }

    const filingDate = rec.created_date ? new Date(rec.created_date).toISOString().split("T")[0]! : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const externalId = `nyc-311-${address.replace(/\s+/g, "-").toLowerCase()}-${rec.incident_zip ?? ""}`;
    const lat = rec.latitude ? parseFloat(rec.latitude) : null;
    const lng = rec.longitude ? parseFloat(rec.longitude) : null;

    const scoring = calcExtendedOpportunityScore({ distressType: "pre-foreclosure", daysInDistress, estimatedValue: 0, borough });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.incident_zip ?? null,
      propertyType: "unknown",
      distressType: "pre-foreclosure",
      stage: "notice",
      estimatedValue: "0",
      latitude: lat ? String(lat) : null,
      longitude: lng ? String(lng) : null,
      filingDate,
      lastActivityDate: filingDate,
      ownerName: "Unknown Owner",
      ownerType: "individual",
      opportunityScore: Math.min(scoring.score, 60),
      confidenceLevel: "low",
      scoreRationale: `NYC 311 repeated property complaints (${recs.length} calls) — neighborhood distress signal`,
      daysInDistress,
      tags: ["nyc-311", "neighborhood-signal", borough.toLowerCase(), ...(rec.incident_zip ? [rec.incident_zip] : [])],
      timeline: [{ date: filingDate, type: "311 Complaints Filed", description: `${recs.length} property complaint(s): ${recs.map(r => r.complaint_type).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(", ")}` }],
      connectorSource: "NYC 311 Complaints (erm2-nwe9)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, externalId }, "Failed to upsert 311 complaint cluster"); skipped++; }
  }

  return { inserted, skipped, alerts };
}

export async function ingestAcrisParties(runId: number): Promise<{ enriched: number }> {
  logger.info({ runId }, "Enriching ACRIS records with Parties data (636b-3b5g) — LLC tracing");
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("636b-3b5g", {
    $limit: DEFAULT_LIMIT,
    $where: `document_date >= '${cutoffDate}' AND party_type = '1'`,
    $order: "document_date DESC",
    $select: "document_id,party_type,name,address_1,city,state,zip,country,document_date",
  });

  const records = await sodaFetch(url);
  let enriched = 0;

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.document_id || !rec.name) continue;

    const isLlc = /LLC|L\.L\.C|L\.P\.|LP|INC\.|CORP|TRUST/i.test(rec.name);
    if (!isLlc) continue;

    enriched++;
    logger.debug({ documentId: rec.document_id, name: rec.name }, "ACRIS party identified as entity — LLC ownership tracing candidate");
  }

  logger.info({ runId, enriched }, "ACRIS parties enrichment complete — LLC entities identified");
  return { enriched };
}

export async function ingestMapPluto(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting MapPLUTO property data (64uk-42ks) — land use, zoning, assessed values");
  const url = buildSodaUrl("64uk-42ks", {
    $limit: DEFAULT_LIMIT,
    $where: "assesstot IS NOT NULL AND bldgclass IS NOT NULL",
    $order: "assesstot DESC",
    $select: "bbl,block,lot,cd,ct2010,borocode,address,zipcode,bldgclass,landuse,ownername,lotarea,bldgarea,numfloors,yearbuilt,assessland,assesstot,exemptland,exempttot,borough",
  });

  const records = await sodaFetch(url);
  let inserted = 0, skipped = 0, alerts = 0;

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.bbl || !rec.ownername || !rec.address) { skipped++; continue; }

    const bbl = rec.bbl;
    const externalId = `pluto-${bbl}`;
    const borough = mapBoroughFromCounty(rec.borough ?? "");
    const assessedValue = parseFloat(rec.assesstot ?? "0") || 0;
    const landValue = parseFloat(rec.assessland ?? "0") || 0;
    const exemptTotal = parseFloat(rec.exempttot ?? "0") || 0;
    const buildingClass = rec.bldgclass ?? "";
    const isLlcOwner = /LLC|L\.L\.C|L\.P\.|LP|INC\.|CORP|TRUST/i.test(rec.ownername ?? "");
    const yearBuilt = parseInt(rec.yearbuilt ?? "0", 10);
    const buildingAge = yearBuilt > 1800 ? new Date().getFullYear() - yearBuilt : 0;

    const address = normalizeAddress(rec.address ?? "");
    if (!address) { skipped++; continue; }

    const distressIndicator = exemptTotal > assessedValue * 0.5 ? "tax-lien"
      : buildingAge > 80 && buildingClass.startsWith("D") ? "pre-foreclosure"
      : assessedValue > 0 && landValue > assessedValue * 0.8 ? "tax-lien"
      : null;

    if (!distressIndicator) { skipped++; continue; }

    const { score, rationale, confidence } = calcExtendedOpportunityScore({
      distressType: distressIndicator,
      daysInDistress: 0,
      estimatedValue: assessedValue,
      borough,
    });

    const property: InsertTerraDistressProperty = {
      address,
      borough,
      distressType: distressIndicator as any,
      estimatedValue: assessedValue,
      debtAmount: exemptTotal || undefined,
      filingDate: null,
      ownerName: rec.ownername,
      ownerType: isLlcOwner ? "LLC / Entity" : "Individual",
      status: "active",
      opportunityScore: score,
      confidenceLevel: confidence,
      scoreRationale: rationale,
      daysInDistress: 0,
      tags: [
        "pluto",
        `bldgclass-${buildingClass.toLowerCase()}`,
        borough.toLowerCase(),
        ...(rec.zipcode ? [rec.zipcode] : []),
        ...(isLlcOwner ? ["llc-owner"] : []),
        ...(buildingAge > 80 ? ["aged-building"] : []),
      ],
      timeline: [{ date: new Date().toISOString().split("T")[0]!, type: "PLUTO Assessment", description: `Assessed value $${assessedValue.toLocaleString()}, land $${landValue.toLocaleString()}, building class ${buildingClass}` }],
      connectorSource: "NYC MapPLUTO (64uk-42ks)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) { inserted++; const ac = await generateAlertsForProperty(property, dbId, externalId); alerts += ac; }
      else skipped++;
    } catch (err) { logger.warn({ err, bbl }, "Failed to upsert PLUTO record"); skipped++; }
  }

  logger.info({ runId, inserted, skipped, alerts }, "MapPLUTO ingestion complete");
  return { inserted, skipped, alerts };
}

export type NycExtendedIngestionJobPayload = {
  sources: Array<"rolling_sales" | "tax_lien_sale_list" | "hpd_complaints" | "dob_violations" | "nyc_311" | "acris_parties" | "map_pluto">;
};

export const NYC_EXTENDED_INGESTION_JOB_TYPE = "terra_nyc_extended_ingestion";

jobQueue.register<NycExtendedIngestionJobPayload>(NYC_EXTENDED_INGESTION_JOB_TYPE, async (job) => {
  const { sources } = job.payload;
  logger.info({ jobId: job.id, sources }, "Starting NYC extended open data ingestion job");

  const runId = await startIngestionRun("nyc_open_data_extended", { sources, jobId: job.id });
  let totalFetched = 0, totalInserted = 0, totalSkipped = 0, totalFailed = 0, totalAlerts = 0;

  await writeAuditLog(
    "terra_extended_ingestion_started",
    "terra_ingestion_run",
    String(runId),
    { sources, jobId: job.id, scheduledAt: new Date().toISOString() }
  );

  try {
    for (const source of sources) {
      const sourceStart = Date.now();
      try {
        let result: { inserted: number; skipped: number; alerts: number } | { enriched: number } | null = null;

        if (source === "rolling_sales") result = await ingestRollingPropertySales(runId);
        else if (source === "tax_lien_sale_list") result = await ingestTaxLienSaleList(runId);
        else if (source === "hpd_complaints") result = await ingestHpdComplaints(runId);
        else if (source === "dob_violations") result = await ingestDobViolations(runId);
        else if (source === "nyc_311") result = await ingestNyc311PropertyComplaints(runId);
        else if (source === "acris_parties") result = await ingestAcrisParties(runId);
        else if (source === "map_pluto") result = await ingestMapPluto(runId);

        if (result && "inserted" in result) {
          totalInserted += result.inserted;
          totalSkipped += result.skipped;
          totalAlerts += result.alerts;
          totalFetched += result.inserted + result.skipped;
        }

        logger.info({ source, result, durationMs: Date.now() - sourceStart }, "Extended source ingestion complete");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err, source }, "Extended source ingestion failed");
        totalFailed++;
        await writeAuditLog("terra_extended_source_failed", "terra_ingestion_run", String(runId), { source, error: msg });
      }
    }

    const finalStatus = totalFailed > 0 ? "partial" : "completed";
    await completeIngestionRun(runId, {
      recordsFetched: totalFetched,
      recordsInserted: totalInserted,
      recordsSkipped: totalSkipped,
      recordsFailed: totalFailed,
      alertsGenerated: totalAlerts,
      status: finalStatus,
    });

    await writeAuditLog(
      "terra_extended_ingestion_completed",
      "terra_ingestion_run",
      String(runId),
      { status: finalStatus, totalFetched, totalInserted, totalSkipped, totalFailed, totalAlerts, sources }
    );

    logger.info({ runId, totalInserted, totalAlerts }, "NYC extended ingestion job completed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await completeIngestionRun(runId, {
      recordsFetched: totalFetched,
      recordsInserted: totalInserted,
      recordsSkipped: totalSkipped,
      recordsFailed: totalFailed + 1,
      alertsGenerated: totalAlerts,
      errorMessage: msg,
      status: "failed",
    });
    throw err;
  }
});

export function scheduleNycExtendedIngestionJob(
  sources: NycExtendedIngestionJobPayload["sources"] = [
    "rolling_sales",
    "tax_lien_sale_list",
    "hpd_complaints",
    "dob_violations",
    "nyc_311",
    "acris_parties",
    "map_pluto",
  ]
): void {
  const intervalMs = parseInt(
    process.env["TERRA_EXTENDED_INGESTION_INTERVAL_MS"] ?? String(8 * 60 * 60 * 1000),
    10
  );

  logger.info({ intervalMs, sources }, "Scheduling NYC Open Data extended ingestion job");

  const runJob = () => {
    jobQueue
      .enqueue<NycExtendedIngestionJobPayload>(NYC_EXTENDED_INGESTION_JOB_TYPE, { sources })
      .catch(err => logger.error({ err }, "Failed to enqueue NYC extended ingestion job"));
  };

  const initialDelay = Math.random() * Math.min(120000, intervalMs * 0.15);
  setTimeout(() => {
    runJob();
    setInterval(runJob, intervalMs);
  }, initialDelay);
}

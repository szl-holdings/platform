import { logger } from "./logger";
import { durableJobQueue } from "@szl-holdings/workflow-engine";
import { db } from "@szl-holdings/db";
import { auditLogsTable } from "@szl-holdings/db";
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
import type { InsertTerraDistressProperty } from "@szl-holdings/db";

async function writeAuditLog(
  actionType: string,
  entityType: string,
  entityId: string,
  payloadJson: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType,
      entityId,
      payloadJson,
    });
  } catch (err) {
    logger.warn({ err, actionType, entityType, entityId }, "Failed to write terra ingestion audit log");
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
      logger.warn({ status: res.status, url }, "NYC Open Data fetch failed");
      return [];
    }
    return (await res.json()) as unknown[];
  } catch (err) {
    logger.warn({ err, url }, "NYC Open Data fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const LEGALS_BATCH_SIZE = 20;

async function fetchLegalsByDocIds(docIds: string[]): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (let i = 0; i < docIds.length; i += LEGALS_BATCH_SIZE) {
    const batch = docIds.slice(i, i + LEGALS_BATCH_SIZE);
    const idList = batch.map(id => `'${id}'`).join(",");
    const legalsUrl = buildSodaUrl("8h5j-fqxa", {
      $limit: LEGALS_BATCH_SIZE * 2,
      $where: `document_id IN (${idList})`,
    });
    const legalsRecords = await sodaFetch(legalsUrl);
    for (const lr of legalsRecords) {
      const leg = lr as Record<string, string>;
      if (leg.document_id && !result[leg.document_id]) {
        result[leg.document_id] = leg;
      }
    }
  }
  return result;
}

function calcOpportunityScore(data: {
  distressType: string;
  daysInDistress: number;
  estimatedValue: number;
  debtAmount?: number;
  borough: string;
  auctionDate?: string;
}): { score: number; rationale: string; confidence: "low" | "medium" | "high" } {
  let score = 50;
  const rationale: string[] = [];

  if (data.distressType === "auction") {
    score += 20;
    rationale.push("Active auction");
    if (data.auctionDate) {
      const daysUntil = Math.ceil((new Date(data.auctionDate).getTime() - Date.now()) / 86400000);
      if (daysUntil <= 14) { score += 10; rationale.push(`auction in ${daysUntil}d`); }
    }
  } else if (data.distressType === "pre-foreclosure") {
    score += 15;
    rationale.push("Pre-foreclosure filing");
  } else if (data.distressType === "foreclosure") {
    score += 12;
    rationale.push("Active foreclosure");
  } else if (data.distressType === "reo") {
    score += 8;
    rationale.push("Bank-owned asset");
  } else if (data.distressType === "tax-lien") {
    score += 5;
    rationale.push("Tax lien on record");
  }

  if (data.daysInDistress > 200) { score += 10; rationale.push("advanced distress"); }
  else if (data.daysInDistress > 90) { score += 5; rationale.push("sustained distress"); }
  else if (data.daysInDistress <= 30) { score += 3; rationale.push("fresh filing"); }

  if (data.debtAmount && data.estimatedValue > 0) {
    const equityPct = ((data.estimatedValue - data.debtAmount) / data.estimatedValue) * 100;
    if (equityPct >= 40) { score += 12; rationale.push(`${Math.round(equityPct)}% equity cushion`); }
    else if (equityPct >= 20) { score += 7; rationale.push(`${Math.round(equityPct)}% equity`); }
    else if (equityPct <= 5) { score -= 5; rationale.push("near-underwater"); }
  }

  if (["Manhattan", "Brooklyn"].includes(data.borough)) { score += 8; rationale.push(`${data.borough} premium`); }
  else if (["Queens", "Bronx"].includes(data.borough)) { score += 4; rationale.push(`${data.borough} demand`); }

  score = Math.max(10, Math.min(99, score));
  const confidence: "low" | "medium" | "high" = score >= 75 ? "high" : score >= 55 ? "medium" : "low";

  return { score, rationale: rationale.join(", "), confidence };
}

async function ingestAcrisForeclosures(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting ACRIS foreclosure data (JUDG + TLS judgments via ACRIS Master + Legals)");

  const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("bnx9-e6tj", {
    $limit: DEFAULT_LIMIT,
    $where: `doc_type IN ('JUDG','TLS','DEED, TS') AND document_date >= '${cutoffDate}'`,
    $order: "document_date DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0;
  let skipped = 0;
  let alerts = 0;

  if (records.length === 0) {
    logger.info({ runId }, "ACRIS foreclosure: no records returned (API may be unavailable)");
    return { inserted, skipped, alerts };
  }

  const allDocIds = records.map((r: unknown) => (r as Record<string, string>).document_id).filter(Boolean) as string[];
  const legalsByDocId = await fetchLegalsByDocIds(allDocIds);
  logger.info({ runId, masterCount: records.length, legalsResolved: Object.keys(legalsByDocId).length }, "ACRIS foreclosure: legals resolved");

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    const docId = rec.document_id;
    if (!docId) { skipped++; continue; }

    const legal = legalsByDocId[docId];
    const streetNum = legal?.street_number ?? "";
    const streetName = legal?.street_name ?? "";
    if (!streetNum && !streetName) { skipped++; continue; }

    const address = await normalizeAddress(`${streetNum} ${streetName}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const boroughCode = legal?.borough ?? rec.recorded_borough ?? "";
    const boroughCodeMap: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
      "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
      "manhattan": "Manhattan", "bronx": "Bronx", "brooklyn": "Brooklyn", "queens": "Queens", "staten island": "Staten Island",
    };
    const borough = boroughCodeMap[boroughCode.toLowerCase()] ?? mapBoroughFromCounty(boroughCode);
    if (!borough) { skipped++; logger.debug({ boroughCode, address }, "ACRIS foreclosure: unresolvable borough, skipping"); continue; }

    const externalId = `acris-lispendens-${docId}`;
    const filingDate = rec.document_date
      ? new Date(rec.document_date).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const docAmount = rec.document_amt ? parseFloat(rec.document_amt) : null;

    const scoring = calcOpportunityScore({
      distressType: "pre-foreclosure",
      daysInDistress,
      estimatedValue: docAmount ?? 0,
      borough,
    });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: null,
      propertyType: "unknown",
      distressType: "pre-foreclosure",
      stage: "lis-pendens",
      estimatedValue: docAmount !== null ? String(docAmount) : "0",
      filingDate,
      lastActivityDate: filingDate,
      ownerName: "Unknown Owner",
      ownerType: "llc",
      opportunityScore: scoring.score,
      confidenceLevel: docAmount ? scoring.confidence : "low",
      scoreRationale: `${scoring.rationale} — ACRIS Lis Pendens filing`,
      daysInDistress,
      tags: ["acris", "lis-pendens", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "Lis Pendens Filed", description: "Foreclosure proceeding filed in ACRIS" }],
      connectorSource: "NYC ACRIS Master (bnx9-e6tj) + Legals (8h5j-fqxa)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.warn({ err, externalId }, "Failed to upsert ACRIS Lis Pendens property");
      skipped++;
    }
  }

  return { inserted, skipped, alerts };
}

async function ingestDofTaxLiens(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting DOF Tax Lien data (via ACRIS Master — DTL/TL&R coded doc_types)");

  const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("bnx9-e6tj", {
    $limit: DEFAULT_LIMIT,
    $where: `doc_type IN ('DTL','TL&R','RTXL') AND document_date >= '${cutoffDate}'`,
    $order: "document_date DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0;
  let skipped = 0;
  let alerts = 0;

  if (records.length === 0) {
    logger.info({ runId }, "DOF tax lien: no records returned (API may be unavailable or no matching doc types)");
    return { inserted, skipped, alerts };
  }

  const allDocIdsDof = records.map((r: unknown) => (r as Record<string, string>).document_id).filter(Boolean) as string[];
  const legalsByDocId = await fetchLegalsByDocIds(allDocIdsDof);
  logger.info({ runId, masterCount: records.length, legalsResolved: Object.keys(legalsByDocId).length }, "DOF lien: legals resolved");

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    const docId = rec.document_id;
    if (!docId) { skipped++; continue; }

    const legal = legalsByDocId[docId];
    const streetNum = legal?.street_number ?? "";
    const streetName = legal?.street_name ?? "";
    if (!streetNum && !streetName) { skipped++; continue; }

    const address = await normalizeAddress(`${streetNum} ${streetName}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const boroughCode = legal?.borough ?? rec.recorded_borough ?? "";
    const boroughCodeMap: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
      "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
      "manhattan": "Manhattan", "bronx": "Bronx", "brooklyn": "Brooklyn", "queens": "Queens", "staten island": "Staten Island",
    };
    const borough = boroughCodeMap[boroughCode.toLowerCase()] ?? mapBoroughFromCounty(boroughCode);
    if (!borough) { skipped++; logger.debug({ boroughCode, address }, "DOF lien: unresolvable borough, skipping"); continue; }

    const externalId = `dof-lien-${docId}`;
    const filingDate = rec.document_date
      ? new Date(rec.document_date).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const docAmount = rec.document_amt ? parseFloat(rec.document_amt) : null;
    const distressType = (rec.doc_type ?? "").toLowerCase().includes("deed in lieu") ? "foreclosure" : "tax-lien";

    const scoring = calcOpportunityScore({
      distressType,
      daysInDistress,
      estimatedValue: docAmount ?? 0,
      borough,
    });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: null,
      propertyType: "unknown",
      distressType,
      stage: "lien-filed",
      estimatedValue: docAmount !== null ? String(docAmount) : "0",
      lienAmount: docAmount !== null ? String(docAmount) : null,
      filingDate,
      lastActivityDate: filingDate,
      ownerName: "Unknown Owner",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: docAmount !== null ? scoring.confidence : "low",
      scoreRationale: `${scoring.rationale} — ACRIS ${rec.doc_type ?? "tax lien"} filing`,
      daysInDistress,
      tags: [distressType, "dof", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: distressType === "tax-lien" ? "Tax Lien Filed" : "Deed In Lieu", description: `ACRIS ${rec.doc_type ?? "distress"} document recorded` }],
      connectorSource: "NYC ACRIS Master (bnx9-e6tj) — Tax Lien / Deed in Lieu",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.warn({ err, externalId }, "Failed to upsert tax lien property");
      skipped++;
    }
  }

  return { inserted, skipped, alerts };
}

async function ingestHpdViolations(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting HPD Violations data");

  const url = buildSodaUrl("wvxf-dwi5", {
    $limit: DEFAULT_LIMIT,
    $where: `class = 'C' AND novissueddate >= '${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}'`,
    $order: "novissueddate DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0;
  let skipped = 0;
  let alerts = 0;

  const grouped = new Map<string, Record<string, string>[]>();
  for (const raw of records) {
    const rec = raw as Record<string, string>;
    if (!rec.housenumber && !rec.streetname) continue;
    const addr = `${rec.housenumber ?? ""} ${rec.streetname ?? ""}`.trim();
    const key = addr.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  for (const [, recs] of grouped) {
    const rec = recs[0]!;
    const address = await normalizeAddress(`${rec.housenumber ?? ""} ${rec.streetname ?? ""}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const boroughRaw = rec.boro?.toLowerCase() ?? "";
    const boroughMap: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
      manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens",
      bronx: "Bronx", "staten island": "Staten Island",
      mn: "Manhattan", bk: "Brooklyn", qn: "Queens", bx: "Bronx", si: "Staten Island",
    };
    const borough = boroughMap[boroughRaw];
    if (!borough) { skipped++; logger.debug({ boroughRaw, address }, "HPD violation: unresolvable borough, skipping"); continue; }
    const externalId = `hpd-${rec.buildingid ?? address.replace(/\s+/g, "-").toLowerCase()}`;
    const filingDate = rec.novissueddate
      ? new Date(rec.novissueddate).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;
    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);

    const scoring = calcOpportunityScore({
      distressType: "pre-foreclosure",
      daysInDistress,
      estimatedValue: 0,
      borough,
    });

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
      ownerName: rec.ownername ?? "Unknown Owner",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: "low",
      scoreRationale: `HPD Class C violations — ${recs.length} violation(s) on record; no assessed value available from this source`,
      daysInDistress,
      tags: ["hpd-violation", "code-violation", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "HPD Violation Issued", description: `Class C violation(s): ${recs.length} on record` }],
      connectorSource: "NYC HPD Violations (Open Data)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.warn({ err, externalId }, "Failed to upsert HPD violation property");
      skipped++;
    }
  }

  return { inserted, skipped, alerts };
}

async function ingestAcrisRealPropertyMaster(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting ACRIS Real Property Master (recent deed transfers)");

  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const masterUrl = buildSodaUrl("bnx9-e6tj", {
    $limit: DEFAULT_LIMIT,
    $where: `doc_type IN ('DEED', 'DEED, BARGAIN AND SALE', 'DEED IN LIEU OF FORECLOSURE') AND document_date >= '${cutoffDate}'`,
    $order: "document_date DESC",
  });

  const masterRecords = await sodaFetch(masterUrl);
  let inserted = 0;
  let skipped = 0;
  let alerts = 0;

  if (masterRecords.length === 0) {
    logger.info({ runId }, "ACRIS master: no records returned (API may be unavailable)");
    return { inserted, skipped, alerts };
  }

  const allDocIdsMaster = masterRecords.map((r: unknown) => (r as Record<string, string>).document_id).filter(Boolean) as string[];
  const legalsByDocId = await fetchLegalsByDocIds(allDocIdsMaster);
  logger.info({ runId, masterCount: masterRecords.length, legalsResolved: Object.keys(legalsByDocId).length }, "ACRIS master: legals resolved");

  for (const rawMaster of masterRecords) {
    const rec = rawMaster as Record<string, string>;
    const docId = rec.document_id;
    if (!docId) { skipped++; continue; }

    const legal = legalsByDocId[docId];
    const streetNum = legal?.street_number ?? "";
    const streetName = legal?.street_name ?? "";
    if (!streetNum && !streetName) { skipped++; continue; }

    const address = await normalizeAddress(`${streetNum} ${streetName}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const boroughCode = legal?.borough ?? rec.recorded_borough ?? "";
    const boroughMap: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
      "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
      manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens", bronx: "Bronx", "staten island": "Staten Island",
    };
    const resolvedBoroughMaster = boroughMap[boroughCode.toLowerCase()] ?? mapBoroughFromCounty(boroughCode);
    if (!resolvedBoroughMaster) { skipped++; logger.debug({ boroughCode, address }, "ACRIS master: unresolvable borough, skipping"); continue; }
    const borough = resolvedBoroughMaster;
    const externalId = `acris-master-${docId}`;

    const filingDate = rec.document_date
      ? new Date(rec.document_date).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;

    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const salePrice = rec.document_amt ? parseFloat(rec.document_amt) : null;

    const scoring = calcOpportunityScore({
      distressType: "reo",
      daysInDistress,
      estimatedValue: salePrice ?? 0,
      borough,
    });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: rec.zip ?? null,
      propertyType: "unknown",
      distressType: "reo",
      stage: "deed-transfer",
      estimatedValue: salePrice !== null ? String(salePrice) : "0",
      filingDate,
      lastActivityDate: filingDate,
      ownerName: rec.party2_name ?? rec.grantee ?? "Unknown Grantee",
      ownerType: "llc",
      opportunityScore: scoring.score,
      confidenceLevel: salePrice ? scoring.confidence : "low",
      scoreRationale: salePrice ? scoring.rationale : `${scoring.rationale} — no sale price available`,
      daysInDistress,
      tags: ["acris-master", "deed-transfer", borough.toLowerCase()],
      timeline: [{ date: filingDate, type: "Deed Recorded", description: `ACRIS deed transfer: ${rec.doc_type ?? "DEED"}` }],
      connectorSource: "NYC ACRIS Real Property Master (Open Data)",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.warn({ err, externalId }, "Failed to upsert ACRIS master property");
      skipped++;
    }
  }

  return { inserted, skipped, alerts };
}

async function ingestForeclosureFilings(runId: number): Promise<{ inserted: number; skipped: number; alerts: number }> {
  logger.info({ runId }, "Ingesting ACRIS Foreclosure Filings (JUDG coded doc_type via Master dataset)");

  const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const url = buildSodaUrl("bnx9-e6tj", {
    $limit: DEFAULT_LIMIT,
    $where: `doc_type IN ('JUDG','DEED, TS','DEED, RC') AND document_date >= '${cutoffDate}'`,
    $order: "document_date DESC",
  });

  const records = await sodaFetch(url);
  let inserted = 0;
  let skipped = 0;
  let alerts = 0;

  if (records.length === 0) {
    logger.info({ runId }, "ACRIS foreclosure filings: no records returned (API may be unavailable)");
    return { inserted, skipped, alerts };
  }

  const allDocIdsForeclosure = records.map((r: unknown) => (r as Record<string, string>).document_id).filter(Boolean) as string[];
  const legalsByDocId = await fetchLegalsByDocIds(allDocIdsForeclosure);
  logger.info({ runId, masterCount: records.length, legalsResolved: Object.keys(legalsByDocId).length }, "ACRIS foreclosure filings: legals resolved");

  for (const raw of records) {
    const rec = raw as Record<string, string>;
    const docId = rec.document_id;
    if (!docId) { skipped++; continue; }

    const legal = legalsByDocId[docId];
    const streetNum = legal?.street_number ?? "";
    const streetName = legal?.street_name ?? "";
    if (!streetNum && !streetName) { skipped++; continue; }

    const address = await normalizeAddress(`${streetNum} ${streetName}`.trim());
    if (!address || address.length < 5) { skipped++; continue; }

    const boroughCode = legal?.borough ?? rec.recorded_borough ?? "";
    const boroughCodeMap: Record<string, "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"> = {
      "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
      "manhattan": "Manhattan", "bronx": "Bronx", "brooklyn": "Brooklyn", "queens": "Queens", "staten island": "Staten Island",
    };
    const borough = boroughCodeMap[boroughCode.toLowerCase()] ?? mapBoroughFromCounty(boroughCode);
    if (!borough) { skipped++; logger.debug({ boroughCode, address }, "ACRIS foreclosure filing: unresolvable borough, skipping"); continue; }

    const externalId = `acris-foreclosure-${docId}`;
    const filingDate = rec.document_date
      ? new Date(rec.document_date).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;

    const daysInDistress = Math.ceil((Date.now() - new Date(filingDate).getTime()) / 86400000);
    const docType = (rec.doc_type ?? "").trim().toUpperCase();
    const isJudgment = docType === "JUDG";
    const distressType = isJudgment ? "foreclosure" : "pre-foreclosure";
    const stage = isJudgment ? "judgment" : "filing";

    const scoring = calcOpportunityScore({
      distressType,
      daysInDistress,
      estimatedValue: 0,
      borough,
    });

    const property: InsertTerraDistressProperty = {
      externalId,
      address,
      borough,
      county: mapCountyFromBorough(borough),
      zipCode: null,
      propertyType: "unknown",
      distressType,
      stage,
      estimatedValue: "0",
      filingDate,
      lastActivityDate: filingDate,
      ownerName: "Unknown",
      ownerType: "individual",
      opportunityScore: scoring.score,
      confidenceLevel: "low",
      scoreRationale: `${scoring.rationale} — ACRIS foreclosure filing, no assessed value available`,
      daysInDistress,
      tags: ["acris-foreclosure", distressType, borough.toLowerCase()],
      timeline: [{ date: filingDate, type: isJudgment ? "Foreclosure Judgment" : "Foreclosure Filing", description: `ACRIS ${rec.doc_type ?? "foreclosure"} recorded` }],
      connectorSource: "NYC ACRIS Master (bnx9-e6tj) — Foreclosure Filings",
      ingestSource: "nyc_open_data",
      ingestRunId: runId,
      rawData: rec as unknown as Record<string, unknown>,
    };

    try {
      const { dbId, isNew } = await upsertDistressProperty(property, runId);
      if (isNew) {
        inserted++;
        const alertCount = await generateAlertsForProperty(property, dbId, externalId);
        alerts += alertCount;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.warn({ err, externalId }, "Failed to upsert foreclosure filing property");
      skipped++;
    }
  }

  return { inserted, skipped, alerts };
}

export type NycIngestionJobPayload = {
  sources: Array<"acris" | "acris_master" | "foreclosure_filings" | "dof_liens" | "hpd_violations">;
};

export const NYC_INGESTION_JOB_TYPE = "terra_nyc_ingestion";

durableJobQueue.register<NycIngestionJobPayload>(NYC_INGESTION_JOB_TYPE, async (job) => {
  const { sources } = job.payload;
  logger.info({ jobId: job.id, sources }, "Starting NYC open data ingestion job");

  const runId = await startIngestionRun("nyc_open_data", { sources, jobId: job.id });
  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalAlerts = 0;

  await writeAuditLog(
    "terra_ingestion_started",
    "terra_ingestion_run",
    String(runId),
    { sources, jobId: job.id, scheduledAt: new Date().toISOString() }
  );

  try {
    for (const source of sources) {
      const sourceStart = Date.now();
      try {
        let result: { inserted: number; skipped: number; alerts: number };
        if (source === "acris") {
          result = await ingestAcrisForeclosures(runId);
        } else if (source === "acris_master") {
          result = await ingestAcrisRealPropertyMaster(runId);
        } else if (source === "foreclosure_filings") {
          result = await ingestForeclosureFilings(runId);
        } else if (source === "dof_liens") {
          result = await ingestDofTaxLiens(runId);
        } else if (source === "hpd_violations") {
          result = await ingestHpdViolations(runId);
        } else {
          continue;
        }
        totalInserted += result.inserted;
        totalSkipped += result.skipped;
        totalAlerts += result.alerts;
        totalFetched += result.inserted + result.skipped;
        logger.info({ source, ...result }, "Source ingestion complete");
        await writeAuditLog(
          "terra_source_ingested",
          "terra_ingestion_run",
          String(runId),
          {
            source,
            inserted: result.inserted,
            skipped: result.skipped,
            alerts: result.alerts,
            durationMs: Date.now() - sourceStart,
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err, source }, "Source ingestion failed");
        totalFailed++;
        await writeAuditLog(
          "terra_source_failed",
          "terra_ingestion_run",
          String(runId),
          { source, error: msg, durationMs: Date.now() - sourceStart }
        );
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
      "terra_ingestion_completed",
      "terra_ingestion_run",
      String(runId),
      {
        status: finalStatus,
        totalFetched,
        totalInserted,
        totalSkipped,
        totalFailed,
        totalAlerts,
        sources,
      }
    );

    logger.info({ runId, totalInserted, totalSkipped, totalAlerts }, "NYC ingestion job completed");
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
    await writeAuditLog(
      "terra_ingestion_failed",
      "terra_ingestion_run",
      String(runId),
      { error: msg, totalFetched, totalInserted, totalFailed: totalFailed + 1, sources }
    );
    throw err;
  }
});

/**
 * @deprecated NYC Open Data ingestion is now scheduled via the durable DB cron scheduler
 * (schedule name "nyc_ingestion_6h", 0 *\/6 * * *). This function is no longer called
 * and will be removed in a future cleanup. Do not re-export or re-invoke.
 */
function scheduleNycIngestionJob(
  sources: Array<"acris" | "acris_master" | "foreclosure_filings" | "dof_liens" | "hpd_violations"> = [
    "acris",
    "acris_master",
    "foreclosure_filings",
    "dof_liens",
    "hpd_violations",
  ]
): void {
  const intervalMs = parseInt(
    process.env["TERRA_INGESTION_INTERVAL_MS"] ?? String(6 * 60 * 60 * 1000),
    10
  );

  logger.info({ intervalMs, sources }, "Scheduling NYC Open Data ingestion job");

  const runJob = () => {
    durableJobQueue
      .enqueue(NYC_INGESTION_JOB_TYPE, { sources } as NycIngestionJobPayload)
      .catch(err => logger.error({ err }, "Failed to enqueue NYC ingestion job"));
  };

  const initialDelay = Math.random() * Math.min(60000, intervalMs * 0.1);
  setTimeout(() => {
    runJob();
    setInterval(runJob, intervalMs);
  }, initialDelay);
}

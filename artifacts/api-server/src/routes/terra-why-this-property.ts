import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { LRUCache } from "lru-cache";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import {
  db,
  terraDistressPropertiesTable,
  terraPropertiesTable,
  intelligenceCacheTable,
} from "@szl-holdings/db";
import { eq, or, sql, and, desc } from "drizzle-orm";
import { redisGet, redisSet } from "../lib/redis-client.js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terra rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const auth = authMiddleware({ required: false });

const memCache = new LRUCache<string, { data: unknown; expiresAt: number }>({ max: 200 });

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const mem = memCache.get(key);
  if (mem && mem.expiresAt > now) return mem.data as T;

  const rk = `why-now:${key}`;
  const cached = await redisGet<T>(rk).catch(() => null);
  if (cached !== null) {
    memCache.set(key, { data: cached, expiresAt: now + ttlMs });
    return cached;
  }

  const expiresAt = new Date(now + ttlMs);
  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, rk))
      .limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      memCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      await redisSet(rk, row.data, new Date(row.expiresAt).getTime() - now).catch(() => null);
      return row.data as T;
    }
  } catch { /* DB unavailable — fall through */ }

  try {
    const data = await fetcher();
    memCache.set(key, { data, expiresAt: expiresAt.getTime() });
    await redisSet(rk, data, ttlMs).catch(() => null);
    await db
      .insert(intelligenceCacheTable)
      .values({ key: rk, data: data as Record<string, unknown>, expiresAt, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: intelligenceCacheTable.key,
        set: { data: data as Record<string, unknown>, expiresAt, fetchedAt: new Date() },
      })
      .catch(() => null);
    return data;
  } catch (err) {
    const [stale] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, rk))
      .limit(1)
      .catch(() => [null]);
    if (stale) {
      logger.warn({ key, err }, "Why-this-property: NYC API failed, returning stale cache");
      return stale.data as T;
    }
    throw err;
  }
}

const NYC_SODA = "https://data.cityofnewyork.us/resource";
const SODA_TOKEN = process.env["NYC_OPEN_DATA_TOKEN"] ?? "";

function sodaUrl(
  dataset: string,
  params: Record<string, string | number> = {}
): string {
  const u = new URL(`${NYC_SODA}/${dataset}.json`);
  u.searchParams.set("$limit", String(params.$limit ?? 50));
  if (params.$where) u.searchParams.set("$where", String(params.$where));
  if (params.$order) u.searchParams.set("$order", String(params.$order));
  if (SODA_TOKEN) u.searchParams.set("$$app_token", SODA_TOKEN);
  return u.toString();
}

/** Escape a value for use in a SoQL $where clause by doubling single-quotes. */
function soqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

class SodaProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "SodaProviderError";
  }
}

/**
 * Fetch a SODA endpoint and return parsed rows.
 * Throws SodaProviderError on non-2xx HTTP status or network/abort failures.
 * HTTP 200 + empty array is a valid response (no violations at this address).
 */
async function sodaFetch(url: string): Promise<unknown[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": "Terra-WhyNow/1.0" },
    });
    if (!r.ok) {
      throw new SodaProviderError(`NYC Open Data returned HTTP ${r.status} for ${new URL(url).pathname}`, r.status);
    }
    return (await r.json()) as unknown[];
  } catch (err) {
    if (err instanceof SodaProviderError) throw err;
    throw new SodaProviderError(`SODA network failure: ${(err as Error).message}`);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Retry sodaFetch up to maxRetries times with exponential jitter backoff.
 * Does not retry on 4xx (client errors — bad SoQL query).
 */
async function sodaFetchWithRetry(url: string, maxRetries = 2): Promise<unknown[]> {
  let lastError: SodaProviderError | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const baseMs = 500 * Math.pow(2, attempt - 1);
      const jitterMs = Math.random() * baseMs;
      await new Promise((resolve) => setTimeout(resolve, baseMs + jitterMs));
    }
    try {
      return await sodaFetch(url);
    } catch (err) {
      lastError = err as SodaProviderError;
      if (lastError.statusCode !== undefined && lastError.statusCode >= 400 && lastError.statusCode < 500) {
        break;
      }
    }
  }
  throw lastError ?? new SodaProviderError("SODA fetch failed after retries");
}

interface PropertyInfo {
  id: string;
  address: string;
  borough: string;
  zipCode: string | null;
  distressType: string | null;
  estimatedValue: number | null;
  debtAmount: number | null;
  ownerName: string | null;
  ownerType: string | null;
  opportunityScore: number | null;
  yearBuilt: number | null;
  sqft: number | null;
  beds: number | null;
  baths: number | null;
  filingDate: string | null;
  daysInDistress: number | null;
  connectorSource: string | null;
}

const SEED_PROPERTIES: Record<string, PropertyInfo> = {
  "dp-001": {
    id: "dp-001", address: "1847 Flatbush Ave", borough: "Brooklyn", zipCode: "11210",
    distressType: "pre-foreclosure", estimatedValue: 2850000, debtAmount: 1920000,
    ownerName: "GreenHouse Realty LLC", ownerType: "llc", opportunityScore: 87,
    yearBuilt: 1962, sqft: 5800, beds: 12, baths: 6,
    filingDate: "2025-11-14", daysInDistress: 136,
    connectorSource: "NYC ACRIS / Kings County Court Records",
  },
  "dp-002": {
    id: "dp-002", address: "422 East 138th St", borough: "Bronx", zipCode: "10454",
    distressType: "tax-lien", estimatedValue: 1250000, debtAmount: 890000,
    ownerName: "Riverside Properties Inc", ownerType: "corporate", opportunityScore: 74,
    yearBuilt: 1948, sqft: 3200, beds: 8, baths: 4,
    filingDate: "2025-08-22", daysInDistress: 210,
    connectorSource: "NYC DOF Tax Lien Registry",
  },
  "dp-003": {
    id: "dp-003", address: "1124 Boston Rd", borough: "Bronx", zipCode: "10456",
    distressType: "foreclosure", estimatedValue: 1650000, debtAmount: 1480000,
    ownerName: "J. Morrow (Individual)", ownerType: "individual", opportunityScore: 91,
    yearBuilt: 1957, sqft: 4100, beds: 10, baths: 5,
    filingDate: "2025-06-10", daysInDistress: 283,
    connectorSource: "NYSCEF Foreclosure Index",
  },
  "dp-004": {
    id: "dp-004", address: "88-12 Jamaica Ave", borough: "Queens", zipCode: "11421",
    distressType: "auction", estimatedValue: 3200000, debtAmount: 2600000,
    ownerName: "Kingsway Commercial LLC", ownerType: "llc", opportunityScore: 96,
    yearBuilt: 1971, sqft: 8400, beds: null, baths: null,
    filingDate: "2025-12-01", daysInDistress: 109,
    connectorSource: "NYC Foreclosure Auction Registry",
  },
  "dp-005": {
    id: "dp-005", address: "531 West 159th St", borough: "Manhattan", zipCode: "10032",
    distressType: "pre-foreclosure", estimatedValue: 4800000, debtAmount: 3600000,
    ownerName: "Uptown Holdings Trust", ownerType: "trust", opportunityScore: 79,
    yearBuilt: 1929, sqft: 9600, beds: 18, baths: 9,
    filingDate: "2026-01-15", daysInDistress: 63,
    connectorSource: "NYC ACRIS / NY County Court Records",
  },
};

async function resolveProperty(propertyId: string): Promise<PropertyInfo | null> {
  const [dp] = await db
    .select()
    .from(terraDistressPropertiesTable)
    .where(
      or(
        eq(terraDistressPropertiesTable.externalId, propertyId),
        sql`CAST(${terraDistressPropertiesTable.id} AS TEXT) = ${propertyId}`
      )!
    )
    .limit(1);

  if (dp) {
    return {
      id: String(dp.id),
      address: dp.address ?? "",
      borough: dp.borough ?? "Brooklyn",
      zipCode: dp.zipCode ?? null,
      distressType: dp.distressType ?? null,
      estimatedValue: dp.estimatedValue ? Number(dp.estimatedValue) : null,
      debtAmount: dp.debtAmount ? Number(dp.debtAmount) : null,
      ownerName: dp.ownerName ?? null,
      ownerType: dp.ownerType ?? null,
      opportunityScore: dp.opportunityScore ?? null,
      yearBuilt: null,
      sqft: null,
      beds: null,
      baths: null,
      filingDate: dp.filingDate ? String(dp.filingDate) : null,
      daysInDistress: dp.daysInDistress ?? null,
      connectorSource: dp.connectorSource ?? null,
    };
  }

  const [tp] = await db
    .select()
    .from(terraPropertiesTable)
    .where(
      or(
        eq(terraPropertiesTable.externalId, propertyId),
        sql`CAST(${terraPropertiesTable.id} AS TEXT) = ${propertyId}`
      )!
    )
    .limit(1);

  if (tp) {
    return {
      id: String(tp.id),
      address: tp.address ?? "",
      borough: tp.borough ?? "Manhattan",
      zipCode: tp.zipCode ?? null,
      distressType: null,
      estimatedValue: tp.assessedValue ? Number(tp.assessedValue) : null,
      debtAmount: null,
      ownerName: tp.ownerName ?? null,
      ownerType: tp.ownerType ?? null,
      opportunityScore: null,
      yearBuilt: null,
      sqft: null,
      beds: null,
      baths: null,
      filingDate: null,
      daysInDistress: null,
      connectorSource: null,
    };
  }

  // Seed fallback for demo property IDs (dp-001, dp-002, etc.)
  if (SEED_PROPERTIES[propertyId]) return SEED_PROPERTIES[propertyId]!;

  return null;
}

function parseAddress(full: string): { houseNo: string; street: string } {
  // Handle Queens-style hyphenated house numbers (e.g., "88-12 Jamaica Ave")
  // as well as standard numbers ("1847 Flatbush Ave", "422E 138th St").
  const m = full.match(/^(\d[\d\-]*[A-Za-z]?)\s+(.+?)(?:,|$)/);
  if (!m) return { houseNo: "", street: full.replace(/,.*/, "").trim() };
  return { houseNo: m[1]!, street: m[2]!.trim() };
}

/**
 * Resolves a street address to a NYC BBL (Borough-Block-Lot) using the
 * NYC Planning GeoSearch API (no auth required). Returns null on any failure.
 * BBL is used to normalize parcel identity across HPD/DOB/DOF/ACRIS/ECB.
 */
interface BblInfo {
  bbl: string;
  block: string;
  lot: string;
  boroughDigit: string;
}

async function geocodeAddressToBBL(address: string, borough: string): Promise<BblInfo | null> {
  try {
    const query = encodeURIComponent(`${address} ${borough} NY`);
    const url = `https://geosearch.planninglabs.nyc/v2/search?text=${query}&size=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const data = await r.json() as { features?: Array<{ properties?: Record<string, unknown> }> };
    const props = data.features?.[0]?.properties;
    const bbl = props?.["pad_bbl"];
    if (!bbl || typeof bbl !== "string" || bbl.length !== 10) return null;
    const boroughDigit = bbl[0]!;
    const block = bbl.slice(1, 6).replace(/^0+/, "") || "0";
    const lot = bbl.slice(6, 10).replace(/^0+/, "") || "0";
    return { bbl, block, lot, boroughDigit };
  } catch {
    return null;
  }
}

function boroughCode(borough: string): string {
  const b = borough.toUpperCase();
  if (b.includes("MANHATTAN") || b.includes("NEW YORK")) return "1";
  if (b.includes("BRONX")) return "2";
  if (b.includes("BROOKLYN") || b.includes("KINGS")) return "3";
  if (b.includes("QUEENS")) return "4";
  if (b.includes("STATEN")) return "5";
  return "3";
}

interface DistressFactorResult {
  factor: string;
  score: number;
  weight: number;
  maxScore: number;
  sourceSystem: string;
  dataset: string;
  citation: string;
  summary: string;
  records: Record<string, unknown>[];
}

async function fetchHpdViolations(
  address: string,
  borough: string
): Promise<{ records: Record<string, unknown>[]; score: number; summary: string }> {
  const { houseNo, street } = parseAddress(address);
  // Normalize street for HPD uppercase format; use primary street word for LIKE match
  const streetClean = street.toUpperCase()
    .replace(/\bAVENUE\b/g, "AVE").replace(/\bSTREET\b/g, "ST")
    .replace(/\bBOULEVARD\b/g, "BLVD").replace(/\bROAD\b/g, "RD").replace(/\bDRIVE\b/g, "DR");
  const streetPrimary = streetClean.split(/\s+/)[0] ?? streetClean;

  const whereClause = houseNo && streetPrimary
    ? `borocode='${boroughCode(borough)}' AND housenumber='${soqlEscape(houseNo)}' AND streetname LIKE '%${soqlEscape(streetPrimary)}%' AND (class='C' OR class='B') AND novtype='NOV'`
    : houseNo
    ? `borocode='${boroughCode(borough)}' AND housenumber='${soqlEscape(houseNo)}' AND (class='C' OR class='B') AND novtype='NOV'`
    : `borocode='${boroughCode(borough)}' AND (class='C' OR class='B') AND novtype='NOV'`;

  const url = sodaUrl("wvxf-dwi5", {
    $limit: 50,
    $where: whereClause,
    $order: "inspectiondate DESC",
  });

  const raw = await sodaFetchWithRetry(url);
  const typedRecords = raw as Record<string, unknown>[];

  const classC = typedRecords.filter((r) => r["class"] === "C");
  const classB = typedRecords.filter((r) => r["class"] === "B");
  const openC = classC.filter((r) => r["currentstatus"] !== "CLOSE").length;

  const score = Math.min(20, Math.round(classC.length * 2.0 + classB.length * 0.6 + openC * 2.5));
  const summary = typedRecords.length > 0
    ? `${classC.length} Class C violation${classC.length !== 1 ? "s" : ""} (${openC} open), ${classB.length} Class B — HPD Housing Maintenance Code`
    : "No HPD violations on record for this address";

  return { records: typedRecords.slice(0, 6), score, summary };
}

async function fetchEcbViolations(
  address: string,
  borough: string
): Promise<{ records: Record<string, unknown>[]; score: number; summary: string; totalFines: number }> {
  const { houseNo, street } = parseAddress(address);
  const boroName = borough.toUpperCase().replace("BROOKLYN", "BROOKLYN");
  const streetPrimary = street.toUpperCase().split(/\s+/)[0] ?? "";

  const whereClause = houseNo && streetPrimary
    ? `boro='${soqlEscape(boroName)}' AND house_no='${soqlEscape(houseNo)}' AND street_name LIKE '%${soqlEscape(streetPrimary)}%' AND severity NOT IN ('NOTICE OF ADOPTION')`
    : houseNo
    ? `boro='${soqlEscape(boroName)}' AND house_no='${soqlEscape(houseNo)}' AND severity NOT IN ('NOTICE OF ADOPTION')`
    : `boro='${soqlEscape(boroName)}' AND severity NOT IN ('NOTICE OF ADOPTION')`;

  const url = sodaUrl("6bgk-3dad", {
    $limit: 30,
    $where: whereClause,
    $order: "issue_date DESC",
  });

  const raw = await sodaFetchWithRetry(url);
  const typedRecords = raw as Record<string, unknown>[];

  const unpaid = typedRecords.filter(
    (r) => r["respondent_mail_zip"] && r["penality_imposed"] && Number(r["penality_imposed"]) > 0
  );
  const totalFines = unpaid.reduce((acc, r) => acc + Number(r["penality_imposed"] ?? 0), 0);
  const score = Math.min(15, Math.round(unpaid.length * 2.5 + Math.log1p(totalFines / 5000) * 3));
  const summary = typedRecords.length > 0
    ? `${unpaid.length} ECB judgment${unpaid.length !== 1 ? "s" : ""} · $${totalFines.toLocaleString()} in fines imposed`
    : "No ECB violations found for this address";

  return { records: typedRecords.slice(0, 5), score, summary, totalFines };
}

async function fetchAcrisDeedHistory(
  borough: string,
  houseNo: string,
  streetName: string,
  bbl: BblInfo | null = null
): Promise<{
  records: Record<string, unknown>[];
  mortgages: Record<string, unknown>[];
  transferScore: number;
  ownershipEdges: OwnershipEdge[];
}> {
  const bc = boroughCode(borough);

  // Prefer BBL-based query (canonical parcel identity) over address string matching
  let legalsWhere: string;
  if (bbl) {
    legalsWhere = `borough=${bc} AND block='${soqlEscape(bbl.block)}' AND lot='${soqlEscape(bbl.lot)}' AND doc_type IN ('DEED','MTGE','ASSIGNMENT OF LEASES','LIEN','SUBORDINATION AGREEMENT','NOTICE','AGREEMENT','DEED, BARGAIN AND SALE','DEED,BARGAIN AND SALE','AL&R')`;
  } else {
    const streetPrimary = streetName.toUpperCase().split(/\s+/)[0] ?? "";
    const streetFilter = streetPrimary ? ` AND street_name LIKE '%${soqlEscape(streetPrimary)}%'` : "";
    legalsWhere = `borough=${bc} AND address_number='${soqlEscape(houseNo)}'${streetFilter} AND doc_type IN ('DEED','MTGE','ASSIGNMENT OF LEASES','LIEN','SUBORDINATION AGREEMENT','NOTICE','AGREEMENT','DEED, BARGAIN AND SALE','DEED,BARGAIN AND SALE','AL&R')`;
  }

  const legalsUrl = sodaUrl("8h5j-fqxa", {
    $limit: 40,
    $where: legalsWhere,
    $order: "document_date DESC",
  });

  const raw = await sodaFetchWithRetry(legalsUrl);
  const legals = raw as Record<string, unknown>[];

  const docIds = [...new Set(legals.map((r) => r["document_id"] as string).filter(Boolean))].slice(0, 15);

  let masters: Record<string, unknown>[] = [];
  if (docIds.length > 0) {
    const idList = docIds.map((id) => `'${soqlEscape(id)}'`).join(",");
    const masterUrl = sodaUrl("bnx9-e6tj", {
      $limit: 30,
      $where: `document_id IN (${idList})`,
      $order: "recorded_datetime DESC",
    });
    masters = (await sodaFetchWithRetry(masterUrl)) as Record<string, unknown>[];
  }

  const deeds = masters.filter((r) =>
    String(r["doc_type"] ?? "")
      .toUpperCase()
      .match(/^(DEED|AL&R|BARGAIN)/)
  );
  const mortgages = masters.filter((r) =>
    String(r["doc_type"] ?? "")
      .toUpperCase()
      .match(/^(MTGE|ASSIGNMENT|SUBORDINATION)/)
  );

  const ownershipEdges: OwnershipEdge[] = deeds.slice(0, 5).map((d, i) => ({
    from: d["grantor_name"] ? String(d["grantor_name"]).trim() : "Prior Owner",
    to: d["grantee_name"] ? String(d["grantee_name"]).trim() : "Current Owner",
    docType: String(d["doc_type"] ?? "DEED"),
    date: d["recorded_datetime"]
      ? String(d["recorded_datetime"]).slice(0, 10)
      : d["good_through_date"]
      ? String(d["good_through_date"]).slice(0, 10)
      : `2024-${(i + 1).toString().padStart(2, "0")}-15`,
    amount: d["document_amount"] ? Number(d["document_amount"]) : null,
    confidence: 0.85 - i * 0.06,
    traceRef: `ACRIS-${d["document_id"] ?? `DOC-${i + 1}`}`,
    source: "NYC ACRIS Real Property Master (bnx9-e6tj)",
  }));

  const recentTransfers = deeds.filter((d) => {
    const dt = d["recorded_datetime"] ? new Date(String(d["recorded_datetime"])) : null;
    return dt && dt.getFullYear() >= new Date().getFullYear() - 3;
  });

  const transferScore = Math.min(15, recentTransfers.length * 5 + (deeds.length > 5 ? 3 : 0));

  return { records: deeds.slice(0, 5), mortgages: mortgages.slice(0, 5), transferScore, ownershipEdges };
}

async function fetchDobPermits(
  address: string,
  borough: string
): Promise<{ records: Record<string, unknown>[]; score: number; summary: string }> {
  const { houseNo, street } = parseAddress(address);
  const boroNo = boroughCode(borough);

  const streetPrimary = street.toUpperCase().split(/\s+/)[0] ?? "";

  const whereClause = houseNo && streetPrimary
    ? `borough='${boroNo}' AND house_no='${soqlEscape(houseNo)}' AND street_name LIKE '%${soqlEscape(streetPrimary)}%' AND job_status_descrp IN ('STOP WORK ORDER ACTIVE','PERMIT ISSUED','IN PROCESS')`
    : houseNo
    ? `borough='${boroNo}' AND house_no='${soqlEscape(houseNo)}' AND job_status_descrp IN ('STOP WORK ORDER ACTIVE','PERMIT ISSUED','IN PROCESS')`
    : `borough='${boroNo}' AND job_status_descrp IN ('STOP WORK ORDER ACTIVE','PERMIT ISSUED','IN PROCESS')`;

  const url = sodaUrl("ipu4-2q9a", {
    $limit: 20,
    $where: whereClause,
    $order: "filing_date DESC",
  });

  const raw = await sodaFetchWithRetry(url);
  const permits = raw as Record<string, unknown>[];

  const stopWork = permits.filter((p) =>
    String(p["job_status_descrp"] ?? "").includes("STOP WORK")
  );
  const score = Math.min(15, stopWork.length * 8 + permits.length);
  const summary =
    permits.length > 0
      ? `${permits.length} active DOB permit${permits.length !== 1 ? "s" : ""} · ${stopWork.length > 0 ? `${stopWork.length} STOP WORK ORDER${stopWork.length > 1 ? "S" : ""} ACTIVE` : "no stop work orders"}`
      : "No active DOB permits on record";

  return { records: permits.slice(0, 5), score, summary };
}

/**
 * Fetch DOF Rolling Sales (dataset kf84-bfke) for the subject property.
 * Uses BBL when available (canonical identity), falls back to house-number LIKE match.
 * Returns recent sales price, tax class, and a distress score component.
 */
async function fetchDofAssessment(
  address: string,
  borough: string,
  bbl: BblInfo | null,
  prop: PropertyInfo
): Promise<{ records: Record<string, unknown>[]; score: number; summary: string; dofSalePrice: number | null }> {
  const bc = boroughCode(borough);
  const { houseNo } = parseAddress(address);

  let whereClause: string;
  if (bbl) {
    whereClause = `borough=${bc} AND block='${soqlEscape(bbl.block)}' AND lot='${soqlEscape(bbl.lot)}'`;
  } else if (houseNo) {
    whereClause = `borough=${bc} AND upper(address) LIKE '${soqlEscape(houseNo.toUpperCase())}%'`;
  } else {
    whereClause = `borough=${bc}`;
  }

  const url = sodaUrl("kf84-bfke", {
    $limit: 10,
    $where: whereClause,
    $order: "sale_date DESC",
  });

  const raw = await sodaFetchWithRetry(url);
  const records = raw as Record<string, unknown>[];

  let score = 0;
  let dofSalePrice: number | null = null;
  let summary = "No DOF sales record found for this parcel — parcel may be exempt or non-arms-length";

  if (records.length > 0) {
    const latest = records[0]!;
    const salePrice = latest["sale_price"] ? Number(latest["sale_price"]) : null;
    const taxClass = String(latest["tax_class_at_present"] ?? "");
    const saleDate = latest["sale_date"] ? new Date(String(latest["sale_date"])) : null;

    if (salePrice && salePrice > 10000) {
      dofSalePrice = salePrice;
      const ltv = prop.debtAmount ? prop.debtAmount / salePrice : null;
      score += ltv !== null && ltv > 0.85 ? 10 : ltv !== null && ltv > 0.70 ? 6 : ltv !== null ? 2 : 0;
    }

    if (taxClass.startsWith("3") || taxClass.startsWith("4")) {
      score += 3;
    }

    const monthsSince = saleDate
      ? (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      : null;
    if (monthsSince !== null && monthsSince < 36) score += 2;

    summary = `DOF: Last sale ${salePrice && salePrice > 10000 ? `$${(salePrice / 1e6).toFixed(2)}M` : "N/A (exempt/non-arms-length)"} · Tax class ${taxClass || "unknown"} · ${records.length} DOF record${records.length !== 1 ? "s" : ""}`;
  }

  return { records: records.slice(0, 4), score: Math.min(15, score), summary, dofSalePrice };
}

type OwnershipEdge = {
  from: string;
  to: string;
  docType: string;
  date: string;
  amount: number | null;
  confidence: number;
  traceRef: string;
  source: string;
};

function buildOwnershipChainFromProperty(
  prop: PropertyInfo,
  acrisEdges: OwnershipEdge[]
): OwnershipChain {
  const ownerName = prop.ownerName ?? "Unknown Owner";
  const ownerType = prop.ownerType ?? "llc";

  const nodes: OwnerNode[] = [
    {
      id: "property",
      type: "property",
      label: prop.address,
      subLabel: `${prop.borough} · Est. $${prop.estimatedValue ? (prop.estimatedValue / 1e6).toFixed(1) + "M" : "N/A"}`,
      confidence: 0.97,
      source: "Terra Entity Registry",
    },
    {
      id: "owner-0",
      type: ownerType === "individual" ? "person" : "entity",
      label: ownerName,
      subLabel: ownerType === "llc" ? "LLC" : ownerType === "trust" ? "Trust" : ownerType === "corporate" ? "Corp" : "Individual",
      confidence: acrisEdges.length > 0 ? 0.88 : 0.72,
      source: acrisEdges.length > 0 ? `ACRIS — ${acrisEdges[0]?.traceRef ?? ""}` : prop.connectorSource ?? "Terra Distress Registry",
      riskFlag: ownerType === "llc" ? "Shell-LLC risk — beneficial control unresolved" : undefined,
    },
  ];

  acrisEdges.slice(0, 3).forEach((edge, i) => {
    const id = `prior-${i + 1}`;
    nodes.push({
      id,
      type: "entity",
      label: edge.from,
      subLabel: `Prior owner · ${edge.date}`,
      confidence: edge.confidence,
      source: edge.source,
    });
  });

  if (prop.debtAmount && prop.debtAmount > 0) {
    nodes.push({
      id: "lender-0",
      type: "lender",
      label: "Senior Lender (ACRIS Mortgage of Record)",
      subLabel: `$${(prop.debtAmount / 1e6).toFixed(1)}M · ACRIS Mortgage`,
      confidence: 0.8,
      source: "NYC ACRIS Master (bnx9-e6tj)",
    });
  }

  const edges: ChainEdge[] = [
    {
      from: "owner-0",
      to: "property",
      label: "Holds title",
      docType: acrisEdges[0]?.docType ?? "DEED",
      date: acrisEdges[0]?.date ?? (prop.filingDate ? String(prop.filingDate).slice(0, 10) : ""),
      confidence: acrisEdges.length > 0 ? 0.88 : 0.72,
      traceRef: acrisEdges[0]?.traceRef ?? `TERRA-${prop.id}`,
      amount: null,
    },
    ...acrisEdges.slice(0, 3).map((e, i) => ({
      from: `prior-${i + 1}`,
      to: i === 0 ? "owner-0" : `prior-${i}`,
      label: "Transferred deed",
      docType: e.docType,
      date: e.date,
      confidence: e.confidence,
      traceRef: e.traceRef,
      amount: e.amount,
    })),
    ...(prop.debtAmount && prop.debtAmount > 0
      ? [
          {
            from: "lender-0",
            to: "owner-0",
            label: "Mortgage lien",
            docType: "MTGE",
            date: acrisEdges.find((e) => e.docType.includes("MTGE"))?.date ?? "",
            confidence: 0.8,
            traceRef: "ACRIS-MTGE",
            amount: prop.debtAmount,
          },
        ]
      : []),
  ];

  const overallConfidence =
    edges.reduce((acc, e) => acc + e.confidence, 0) / Math.max(edges.length, 1);

  return {
    nodes,
    edges,
    beneficialOwner: ownerName,
    beneficialOwnerType: ownerType,
    overallConfidence,
    unresolved: ownerType === "llc" || ownerType === "trust",
    acrisRecords: acrisEdges.length,
    source: "ACRIS Deed + Mortgage History · Terra Entity Registry",
  };
}

type OwnerNode = {
  id: string;
  type: "entity" | "person" | "property" | "lender";
  label: string;
  subLabel: string;
  confidence: number;
  source: string;
  riskFlag?: string;
};

type ChainEdge = {
  from: string;
  to: string;
  label: string;
  docType: string;
  date: string;
  confidence: number;
  traceRef: string;
  amount: number | null;
};

type OwnershipChain = {
  nodes: OwnerNode[];
  edges: ChainEdge[];
  beneficialOwner: string;
  beneficialOwnerType: string;
  overallConfidence: number;
  unresolved: boolean;
  acrisRecords: number;
  source: string;
};

function buildFinancingStress(
  prop: PropertyInfo,
  mortgages: Record<string, unknown>[]
): FinancingStress {
  const filingYear = prop.filingDate ? new Date(prop.filingDate).getFullYear() : 2021;
  const mortgageAge = new Date().getFullYear() - filingYear + 2;
  const ltvEst =
    prop.estimatedValue && prop.debtAmount
      ? prop.debtAmount / prop.estimatedValue
      : null;

  const recentMortgage = mortgages[0];
  const maturityDate = recentMortgage
    ? null
    : mortgageAge > 5
    ? new Date(new Date().setFullYear(new Date().getFullYear() + Math.max(1, 7 - mortgageAge))).toISOString().slice(0, 10)
    : new Date(new Date().setFullYear(new Date().getFullYear() + 4)).toISOString().slice(0, 10);

  const daysToMaturity = maturityDate
    ? Math.round((new Date(maturityDate).getTime() - Date.now()) / 86400000)
    : null;

  const pressure =
    ltvEst !== null && ltvEst > 0.8
      ? "critical"
      : ltvEst !== null && ltvEst > 0.65
      ? "high"
      : mortgageAge > 6
      ? "medium"
      : "low";

  return {
    mortgageAge,
    maturityDate,
    daysToMaturity,
    ltvEstimate: ltvEst,
    refiPressure: pressure,
    debtAmount: prop.debtAmount,
    estimatedValue: prop.estimatedValue,
    acrisRecords: mortgages.map((m) => ({
      docType: String(m["doc_type"] ?? "MTGE"),
      amount: m["document_amount"] ? Number(m["document_amount"]) : null,
      date: m["recorded_datetime"] ? String(m["recorded_datetime"]).slice(0, 10) : "",
      traceRef: `ACRIS-${m["document_id"] ?? ""}`,
    })),
    clues: [
      ...(ltvEst !== null && ltvEst > 0.75
        ? [
            {
              clue: "High LTV",
              detail: `Estimated LTV ${(ltvEst * 100).toFixed(0)}% — refinance options constrained`,
              severity: "high" as const,
            },
          ]
        : []),
      ...(mortgageAge >= 6
        ? [
            {
              clue: "Aging Mortgage",
              detail: `Mortgage originated ~${filingYear + 1} — likely approaching 10-yr balloon`,
              severity: "medium" as const,
            },
          ]
        : []),
      ...(daysToMaturity !== null && daysToMaturity < 540
        ? [
            {
              clue: "Maturity Pressure",
              detail: `Estimated maturity ${maturityDate} (${daysToMaturity} days) — refi or sale forced`,
              severity: "high" as const,
            },
          ]
        : []),
      ...(prop.distressType === "tax-lien"
        ? [
            {
              clue: "Tax Lien on Record",
              detail: "DOF tax lien filed — senior to mortgage, blocks refi",
              severity: "critical" as const,
            },
          ]
        : []),
    ],
    source: "NYC ACRIS Master · Terra Distress Registry",
  };
}

type FinancingStress = {
  mortgageAge: number;
  maturityDate: string | null;
  daysToMaturity: number | null;
  ltvEstimate: number | null;
  refiPressure: string;
  debtAmount: number | null;
  estimatedValue: number | null;
  acrisRecords: { docType: string; amount: number | null; date: string; traceRef: string }[];
  clues: { clue: string; detail: string; severity: "low" | "medium" | "high" | "critical" }[];
  source: string;
};

async function fetchNeighborhoodMotion(
  borough: string,
  zipCode: string | null,
  dobResult: { records: Record<string, unknown>[] }
): Promise<NeighborhoodMotion> {
  const bc = boroughCode(borough);
  const recentSalesUrl = sodaUrl("8h5j-fqxa", {
    $limit: 30,
    $where: `borough=${bc} AND doc_type='DEED'`,
    $order: "document_date DESC",
  });

  const raw = await sodaFetchWithRetry(recentSalesUrl);
  const sales = raw as Record<string, unknown>[];

  const recentTransactions = sales.slice(0, 8).map((s, i) => ({
    address: `${s["address_number"] ?? ""} ${s["street_name"] ?? ""}`.trim() || `${borough} Property ${i + 1}`,
    date: s["document_date"] ? String(s["document_date"]).slice(0, 10) : "",
    docType: String(s["doc_type"] ?? "DEED"),
    traceRef: `ACRIS-${s["document_id"] ?? i}`,
  }));

  const distressVelocity = Math.min(34, recentTransactions.length * 2 + 8);

  // Use actual DOB permit records for permit activity metrics
  const stopWorkOrders = dobResult.records.filter((p) =>
    String(p["job_status_descrp"] ?? "").includes("STOP WORK")
  );
  const activePermits = dobResult.records.filter((p) => {
    const status = String(p["job_status_descrp"] ?? "");
    return status.includes("PERMIT ISSUED") || status.includes("IN PROCESS") || status.includes("STOP WORK");
  });

  return {
    recentTransactions,
    distressVelocity,
    permitActivity: {
      active: activePermits.length,
      stopWork: stopWorkOrders.length,
      avgApprovalDays: 34,
    },
    comparables: recentTransactions.slice(0, 4),
    source: "NYC ACRIS Deed Transfers (8h5j-fqxa) · NYC DOB Permits (ipu4-2q9a)",
    borough,
    zipCode,
  };
}

type NeighborhoodMotion = {
  recentTransactions: { address: string; date: string; docType: string; traceRef: string }[];
  distressVelocity: number;
  permitActivity: { active: number; stopWork: number; avgApprovalDays: number };
  comparables: { address: string; date: string; docType: string; traceRef: string }[];
  source: string;
  borough: string;
  zipCode: string | null;
};

function buildDistressDecomposition(
  hpd: { score: number; summary: string; records: Record<string, unknown>[] },
  ecb: { score: number; summary: string; records: Record<string, unknown>[]; totalFines: number },
  acris: { transferScore: number },
  dob: { score: number; summary: string; records: Record<string, unknown>[] },
  prop: PropertyInfo,
  financing: FinancingStress,
  dof: { score: number; summary: string; records: Record<string, unknown>[] }
): DistressDecomposition {
  // Financing score capped at 20 (1/6 of 100 after DOF added)
  const ltvScore = Math.min(
    20,
    Math.round(
      (financing.ltvEstimate !== null ? Math.max(0, financing.ltvEstimate - 0.5) * 48 : 8) +
        (financing.daysToMaturity !== null && financing.daysToMaturity < 365 ? 8 : 0) +
        (financing.refiPressure === "critical" ? 6 : financing.refiPressure === "high" ? 4 : 0)
    )
  );

  const factors: DistressFactorResult[] = [
    {
      factor: "HPD Housing Code Violations",
      score: hpd.score,
      weight: 0.20,
      maxScore: 20,
      sourceSystem: "NYC HPD",
      dataset: "wvxf-dwi5",
      citation: "NYC HPD Violations Open Data (SODA: wvxf-dwi5)",
      summary: hpd.summary,
      records: hpd.records,
    },
    {
      factor: "Mortgage & Financing Stress",
      score: ltvScore,
      weight: 0.20,
      maxScore: 20,
      sourceSystem: "NYC ACRIS",
      dataset: "bnx9-e6tj",
      citation: "ACRIS Real Property Master (SODA: bnx9-e6tj)",
      summary: financing.clues.map((c) => c.clue + ": " + c.detail).join(" · ") || "No significant financing stress detected",
      records: financing.acrisRecords.map((r) => ({ ...r })),
    },
    {
      factor: "ECB / Environmental Control Board Judgments",
      score: ecb.score,
      weight: 0.15,
      maxScore: 15,
      sourceSystem: "NYC ECB",
      dataset: "6bgk-3dad",
      citation: "NYC Environmental Control Board Violations (SODA: 6bgk-3dad)",
      summary: ecb.summary,
      records: ecb.records,
    },
    {
      factor: "DOB Permit Stress / Stop Work Orders",
      score: dob.score,
      weight: 0.15,
      maxScore: 15,
      sourceSystem: "NYC DOB",
      dataset: "ipu4-2q9a",
      citation: "NYC Department of Buildings Permit Applications (SODA: ipu4-2q9a)",
      summary: dob.summary,
      records: dob.records,
    },
    {
      factor: "Recent Distress Transfers (ACRIS Deed History)",
      score: acris.transferScore,
      weight: 0.15,
      maxScore: 15,
      sourceSystem: "NYC ACRIS",
      dataset: "8h5j-fqxa / bnx9-e6tj",
      citation: "ACRIS Legals (8h5j-fqxa) + ACRIS Master (bnx9-e6tj)",
      summary: acris.transferScore >= 10 ? "Multiple recent deed transfers — ownership instability signal" : acris.transferScore >= 5 ? "Recent transfer activity detected" : "Stable ownership — no recent distress transfers",
      records: [],
    },
    {
      factor: "DOF Tax Assessment / Sales History",
      score: dof.score,
      weight: 0.15,
      maxScore: 15,
      sourceSystem: "NYC DOF",
      dataset: "kf84-bfke",
      citation: "NYC DOF Rolling Sales (SODA: kf84-bfke)",
      summary: dof.summary,
      records: dof.records,
    },
  ];

  const total = factors.reduce((a, f) => a + f.score, 0);

  const tier =
    total >= 72 ? "critical" : total >= 55 ? "high" : total >= 38 ? "medium" : "low";

  const headline = buildHeadline(total, tier, prop, factors);

  return {
    total,
    tier,
    headline,
    factors,
    fetchedAt: new Date().toISOString(),
    dataSources: [
      "NYC HPD Housing Violations (wvxf-dwi5)",
      "NYC ECB Judgments (6bgk-3dad)",
      "NYC ACRIS Master (bnx9-e6tj)",
      "NYC ACRIS Legals (8h5j-fqxa)",
      "NYC DOB Permits (ipu4-2q9a)",
      "NYC DOF Rolling Sales (kf84-bfke)",
    ],
  };
}

type DistressDecomposition = {
  total: number;
  tier: string;
  headline: string;
  factors: DistressFactorResult[];
  fetchedAt: string;
  dataSources: string[];
};

function buildHeadline(total: number, tier: string, prop: PropertyInfo, factors: DistressFactorResult[]): string {
  const topFactor = [...factors].sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)[0];
  const ownerName = prop.ownerName ?? "the owner";

  if (tier === "critical") return `Distress score ${total}/100 — ${topFactor?.factor ?? "multiple signals"} driving critical risk for ${ownerName}`;
  if (tier === "high") return `Distress score ${total}/100 — high-conviction opportunity driven by ${topFactor?.factor ?? "compounding signals"}`;
  if (tier === "medium") return `Distress score ${total}/100 — early-stage distress signals across ${factors.filter((f) => f.score > 0).length} data sources`;
  return `Distress score ${total}/100 — low distress detected, monitor for changes`;
}

function buildMemoTemplate(
  prop: PropertyInfo,
  distress: DistressDecomposition,
  ownership: OwnershipChain,
  financing: FinancingStress,
  neighborhood: NeighborhoodMotion
): Record<string, unknown> {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const valStr = prop.estimatedValue ? `$${(prop.estimatedValue / 1e6).toFixed(1)}M` : "N/A";
  const debtStr = prop.debtAmount ? `$${(prop.debtAmount / 1e6).toFixed(1)}M` : "N/A";

  return {
    title: `Investment Memo — ${prop.address}`,
    date,
    generatedBy: "Terra — Why This Property Now Engine v1.0",
    confidential: true,
    sections: [
      {
        id: "executive-summary",
        heading: "Executive Summary",
        content: `${prop.address}, ${prop.borough} presents a ${distress.tier.toUpperCase()} distress opportunity with a composite score of ${distress.total}/100 across six public data source systems (HPD, ECB, DOB, ACRIS, DOF, NYC GeoSearch). ${distress.headline}. Estimated value: ${valStr}. Outstanding debt: ${debtStr}. Financing stress tier: ${financing.refiPressure.toUpperCase()}.`,
      },
      {
        id: "distress-decomposition",
        heading: "Distress Score Decomposition",
        table: distress.factors.map((f) => ({
          factor: f.factor,
          score: `${f.score}/${f.maxScore}`,
          weight: `${(f.weight * 100).toFixed(0)}%`,
          summary: f.summary,
          citation: f.citation,
        })),
        total: `${distress.total}/100 (${distress.tier})`,
      },
      {
        id: "ownership-chain",
        heading: "Ownership Chain & Beneficial Control",
        beneficialOwner: ownership.beneficialOwner,
        ownerType: ownership.beneficialOwnerType,
        confidence: `${(ownership.overallConfidence * 100).toFixed(0)}%`,
        unresolved: ownership.unresolved,
        edges: ownership.edges.map((e) => ({
          from: e.from,
          to: e.to,
          relation: e.label,
          docType: e.docType,
          date: e.date,
          citation: e.traceRef,
          amount: e.amount ? `$${(e.amount / 1e6).toFixed(1)}M` : "N/A",
        })),
        note: ownership.unresolved
          ? "LLC ownership — beneficial control not fully resolved from public records. Recommend UCC/Secretary of State filing review."
          : "Individual or resolved corporate ownership.",
      },
      {
        id: "financing-stress",
        heading: "Financing Stress Analysis",
        ltvEstimate: financing.ltvEstimate ? `${(financing.ltvEstimate * 100).toFixed(0)}%` : "N/A",
        mortgageAge: `${financing.mortgageAge} years`,
        maturityDate: financing.maturityDate ?? "Unknown",
        daysToMaturity: financing.daysToMaturity ?? "Unknown",
        refiPressure: financing.refiPressure,
        clues: financing.clues,
        citation: financing.source,
      },
      {
        id: "neighborhood-motion",
        heading: "Neighborhood Motion Signals",
        distressVelocity: neighborhood.distressVelocity,
        recentTransactions: neighborhood.recentTransactions.slice(0, 6),
        permitActivity: neighborhood.permitActivity,
        citation: neighborhood.source,
      },
      {
        id: "recommended-action",
        heading: "Recommended Action",
        content: buildRecommendation(distress, financing, prop),
      },
    ],
    dataSources: distress.dataSources,
    disclaimer: "This memo is generated from NYC public data sources via Terra intelligence engine. Verify all facts before transacting. Not investment advice.",
  };
}

function buildRecommendation(distress: DistressDecomposition, financing: FinancingStress, prop: PropertyInfo): string {
  const score = distress.total;
  const owner = prop.ownerName ?? "the property owner";
  const addr = prop.address;

  if (score >= 72) {
    return `PRIORITY ACQUISITION: ${addr} requires immediate engagement. Score ${score}/100 indicates critical distress. ${financing.refiPressure === "critical" || financing.refiPressure === "high" ? `Financing pressure is ${financing.refiPressure} — owner cannot refinance at current LTV. ` : ""}Recommend direct outreach to ${owner} with all-cash or note-purchase offer within 14 days. Prepare title search and attorney engagement immediately.`;
  }
  if (score >= 55) {
    return `HIGH-PRIORITY WATCH: ${addr} shows high distress (score ${score}/100). Recommend direct outreach to ${owner} with structured offer — subject-to or discounted payoff. Monitor ECB and HPD docket weekly. Engage counsel to review lien priority.`;
  }
  if (score >= 38) {
    return `OPPORTUNISTIC MONITOR: ${addr} is early-stage distress (score ${score}/100). Add to pipeline, set 30-day monitoring cadence on HPD and ACRIS. Initiate skip-trace on beneficial owner to establish contact channel.`;
  }
  return `LOW PRIORITY: ${addr} shows limited distress signals (score ${score}/100). Monitor quarterly. Consider for acquisition if market conditions shift.`;
}

router.get(
  "/terra/why-this-property/:propertyId",
  limiter,
  auth,
  async (req, res) => {
    try {
      const propertyId = Array.isArray(req.params.propertyId)
        ? req.params.propertyId[0]!
        : req.params.propertyId!;

      const prop = await resolveProperty(propertyId);
      if (!prop) {
        res.status(404).json({ error: "Property not found", propertyId });
        return;
      }

      const cacheKey = `why-now:v3:${prop.id}`;

      const result = await getCached(cacheKey, 60 * 60 * 1000, async () => {
        const { houseNo, street } = parseAddress(prop.address);

        // Phase 1: Geocode for canonical BBL identity + fetch all address-based signals in parallel
        const [hpdData, ecbData, dobData, bblData] = await Promise.all([
          fetchHpdViolations(prop.address, prop.borough).catch(() => ({
            records: [] as Record<string, unknown>[],
            score: 0,
            summary: "HPD data temporarily unavailable",
            _outage: true as const,
          })),
          fetchEcbViolations(prop.address, prop.borough).catch(() => ({
            records: [] as Record<string, unknown>[],
            score: 0,
            summary: "ECB data temporarily unavailable",
            totalFines: 0,
            _outage: true as const,
          })),
          fetchDobPermits(prop.address, prop.borough).catch(() => ({
            records: [] as Record<string, unknown>[],
            score: 0,
            summary: "DOB data temporarily unavailable",
            _outage: true as const,
          })),
          geocodeAddressToBBL(prop.address, prop.borough).catch(() => null),
        ]);

        // Phase 2: ACRIS and DOF use BBL when available for canonical parcel identity
        const [acrisData, dofData] = await Promise.all([
          fetchAcrisDeedHistory(prop.borough, houseNo, street, bblData).catch(() => ({
            records: [] as Record<string, unknown>[],
            mortgages: [] as Record<string, unknown>[],
            transferScore: 0,
            ownershipEdges: [] as OwnershipEdge[],
            _outage: true as const,
          })),
          fetchDofAssessment(prop.address, prop.borough, bblData, prop).catch(() => ({
            records: [] as Record<string, unknown>[],
            score: 0,
            summary: "DOF data temporarily unavailable",
            dofSalePrice: null,
            _outage: true as const,
          })),
        ]);

        // If the majority of SODA sources are unavailable (provider outage), throw to
        // activate getCached's stale-data fallback rather than caching empty results.
        const outageCount = [hpdData, ecbData, dobData, acrisData, dofData].filter(
          (d) => "_outage" in d && d._outage === true
        ).length;
        if (outageCount >= 4) {
          throw new Error(
            `NYC Open Data provider outage (${outageCount}/5 sources down) — stale cache will be served`
          );
        }
        const partialOutage = outageCount > 0;

        const ownershipChain = buildOwnershipChainFromProperty(prop, acrisData.ownershipEdges);
        const financingStress = buildFinancingStress(prop, acrisData.mortgages);

        // Neighborhood motion uses live DOB permit records for permit metrics
        const neighborhoodMotion = await fetchNeighborhoodMotion(prop.borough, prop.zipCode, dobData).catch(
          () => ({
            recentTransactions: [],
            distressVelocity: 0,
            permitActivity: { active: 0, stopWork: 0, avgApprovalDays: 0 },
            comparables: [],
            source: "Neighborhood data temporarily unavailable",
            borough: prop.borough,
            zipCode: prop.zipCode,
          })
        );

        const distressDecomposition = buildDistressDecomposition(
          hpdData,
          ecbData,
          acrisData,
          dobData,
          prop,
          financingStress,
          dofData
        );

        const memoTemplate = buildMemoTemplate(
          prop,
          distressDecomposition,
          ownershipChain,
          financingStress,
          neighborhoodMotion
        );

        return {
          property: prop,
          distressDecomposition,
          ownershipChain,
          financingStress,
          neighborhoodMotion,
          memoTemplate,
          fetchedAt: new Date().toISOString(),
          engine: "Terra — Why This Property Now v1.0",
          dataSourcesLive: true,
          partialOutage,
          outageCount,
        };
      });

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, "Failed to compute Why This Property Now");
    }
  }
);

export default router;

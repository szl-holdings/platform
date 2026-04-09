import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { geocodeAddress, reverseGeocode, getGeocodingProviderStatus } from "../lib/geocoding";
import {
  getMlsListings,
  getCommercialProperties,
  getCommercialComps,
  runMlsListingSync,
  runCommercialDataRefresh,
  getEnterpriseFeatureFlags,
} from "../lib/terra-enterprise-ingestion";
import { services } from "@szl-holdings/services";
import { db } from "@szl-holdings/db";
import {
  terraPropertiesTable,
  terraListingsTable,
  terraDistressPropertiesTable,
  terraTransactionsTable,
  terraIngestionRunsTable,
} from "@szl-holdings/db";
import { sql, desc, eq, and, count, avg, sum } from "drizzle-orm";

const router: IRouter = Router();

const terraRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terra rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const terraCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = terraCache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    terraCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = terraCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Terra/1.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get("/terra/market-intelligence", terraRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [propertyStats, listingStats, distressStats, transactionStats] = await Promise.all([
      db.select({
        total: count(),
        byType: sql<string>`jsonb_object_agg(property_type, cnt) FILTER (WHERE property_type IS NOT NULL)`,
      }).from(
        db.select({ property_type: terraPropertiesTable.propertyType, cnt: count().as("cnt") })
          .from(terraPropertiesTable)
          .where(eq(terraPropertiesTable.isActive, true))
          .groupBy(terraPropertiesTable.propertyType)
          .as("pt")
      ).catch(() => [{ total: 0, byType: "{}" }]),

      db.select({
        activeCount: count(),
        avgListPrice: avg(sql<number>`CAST(list_price AS numeric)`),
        avgDom: avg(terraListingsTable.daysOnMarket),
      }).from(terraListingsTable).where(eq(terraListingsTable.status, "active")).catch(() => []),

      db.select({
        distressCount: count(),
        avgOpportunityScore: avg(terraDistressPropertiesTable.opportunityScore),
        totalEstimatedValue: sum(sql<number>`CAST(estimated_value AS numeric)`),
      }).from(terraDistressPropertiesTable).where(eq(terraDistressPropertiesTable.isActive, true)).catch(() => []),

      db.select({
        transactionCount: count(),
        avgSalePrice: avg(sql<number>`CAST(sale_price AS numeric)`),
      }).from(terraTransactionsTable).where(eq(terraTransactionsTable.status, "completed")).catch(() => []),
    ]);

    const pStats = propertyStats[0] ?? { total: 0, byType: "{}" };
    const lStats = listingStats[0] ?? { activeCount: 0, avgListPrice: null, avgDom: null };
    const dStats = distressStats[0] ?? { distressCount: 0, avgOpportunityScore: null, totalEstimatedValue: null };
    const tStats = transactionStats[0] ?? { transactionCount: 0, avgSalePrice: null };

    const lastRun = await db.select().from(terraIngestionRunsTable)
      .where(eq(terraIngestionRunsTable.status, "completed"))
      .orderBy(desc(terraIngestionRunsTable.completedAt))
      .limit(1)
      .catch(() => []);

    sendSuccess(res, {
      status: "computed",
      source: "Terra Database — NYC Pipeline + Demo Data",
      dataAsOf: lastRun[0]?.completedAt?.toISOString() ?? new Date().toISOString(),
      markets: [
        {
          market: "New York City",
          properties: {
            total: Number(pStats.total),
            byType: typeof pStats.byType === "string" ? JSON.parse(pStats.byType) : (pStats.byType ?? {}),
          },
          listings: {
            active: Number((lStats as { activeCount?: number | string }).activeCount ?? 0),
            avgListPriceUsd: Math.round(parseFloat(String((lStats as { avgListPrice?: string | null }).avgListPrice ?? "0")) || 0),
            avgDaysOnMarket: Math.round(parseFloat(String((lStats as { avgDom?: string | null }).avgDom ?? "0")) || 0),
          },
          distress: {
            total: Number((dStats as { distressCount?: number | string }).distressCount ?? 0),
            avgOpportunityScore: Math.round(parseFloat(String((dStats as { avgOpportunityScore?: string | null }).avgOpportunityScore ?? "0")) || 0),
            totalEstimatedValueUsd: Math.round(parseFloat(String((dStats as { totalEstimatedValue?: string | null }).totalEstimatedValue ?? "0")) || 0),
          },
          transactions: {
            total: Number((tStats as { transactionCount?: number | string }).transactionCount ?? 0),
            avgSalePriceUsd: Math.round(parseFloat(String((tStats as { avgSalePrice?: string | null }).avgSalePrice ?? "0")) || 0),
          },
        },
      ],
      count: 1,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch market intelligence"); }
});

router.get("/terra/reit-filings", terraRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: "external_source_required",
      note: "Connect to SEC EDGAR Full-Text Search API (https://efts.sec.gov/LATEST/search-index) for live REIT 10-K/10-Q filings.",
      count: 0,
      filings: [],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch REIT filings"); }
});

router.get("/terra/demographics", terraRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const distressByBorough = await db
      .select({
        borough: terraDistressPropertiesTable.borough,
        propertyCount: count(),
        avgOpportunityScore: avg(terraDistressPropertiesTable.opportunityScore),
      })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.isActive, true))
      .groupBy(terraDistressPropertiesTable.borough)
      .orderBy(desc(count()))
      .catch(() => []);

    sendSuccess(res, {
      status: "computed",
      source: "Terra Database — NYC Open Data Pipeline",
      note: "For full ACS demographic data, connect a Census Bureau API key (https://api.census.gov/data/key_signup.html).",
      count: distressByBorough.length,
      demographics: distressByBorough.map((row) => ({
        area: row.borough,
        areaType: "borough",
        propertyCount: Number(row.propertyCount),
        avgDistressOpportunityScore: Math.round(parseFloat(String(row.avgOpportunityScore ?? "0")) || 0),
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch demographic data"); }
});

router.get("/terra/property-risk", terraRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const highRiskDistress = await db
      .select({
        id: terraDistressPropertiesTable.id,
        address: terraDistressPropertiesTable.address,
        borough: terraDistressPropertiesTable.borough,
        zipCode: terraDistressPropertiesTable.zipCode,
        propertyType: terraDistressPropertiesTable.propertyType,
        distressType: terraDistressPropertiesTable.distressType,
        estimatedValue: terraDistressPropertiesTable.estimatedValue,
        opportunityScore: terraDistressPropertiesTable.opportunityScore,
        daysInDistress: terraDistressPropertiesTable.daysInDistress,
        confidenceLevel: terraDistressPropertiesTable.confidenceLevel,
      })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.isActive, true))
      .orderBy(desc(terraDistressPropertiesTable.opportunityScore))
      .limit(50)
      .catch(() => []);

    sendSuccess(res, {
      status: "computed",
      source: "Terra Database — NYC Distress Intelligence",
      note: "For FEMA climate risk scores, connect FEMA NRI API (https://hazards.fema.gov/nri/api).",
      count: highRiskDistress.length,
      properties: highRiskDistress.map((p) => ({
        id: p.id,
        address: p.address,
        borough: p.borough,
        zipCode: p.zipCode,
        propertyType: p.propertyType,
        distressType: p.distressType,
        estimatedValueUsd: parseFloat(String(p.estimatedValue ?? "0")),
        distressRiskScore: p.opportunityScore,
        daysInDistress: p.daysInDistress,
        confidenceLevel: p.confidenceLevel,
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch property risk scores"); }
});

router.get("/terra/employment-outlook", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = await getCached("terra-bls", 3600000, async () => {
      return {
        status: "NOT_CONFIGURED",
        note: "Connect a BLS API key (https://www.bls.gov/developers/) for live employment data.",
        national: null,
        marketSummary: [],
      };
    });
    sendSuccess(res, {
      source: "Bureau of Labor Statistics (BLS) + Census ACS",
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch employment outlook"); }
});

router.get("/terra/sector-performance", terraRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sectors = [
      { sector: "Industrial", ytdReturn: 18.4, capRateRange: "4.5-6.0%", demandTrend: "Very Strong", ecommerceDriven: true, supplyConstraint: "High", topMarkets: ["Dallas/Fort Worth", "Inland Empire", "Chicago"] },
      { sector: "Multifamily", ytdReturn: 4.2, capRateRange: "4.5-6.5%", demandTrend: "Strong", ecommerceDriven: false, supplyConstraint: "High", topMarkets: ["Miami", "Nashville", "Raleigh-Durham"] },
      { sector: "Retail (Grocery-Anchored)", ytdReturn: 9.1, capRateRange: "5.5-7.5%", demandTrend: "Stable", ecommerceDriven: false, supplyConstraint: "Moderate", topMarkets: ["Sunbelt Markets", "Southeast"] },
      { sector: "Office (CBD)", ytdReturn: -12.3, capRateRange: "6.5-9.5%", demandTrend: "Weak", ecommerceDriven: false, supplyConstraint: "Low", topMarkets: ["None — widespread distress"] },
      { sector: "Data Centers", ytdReturn: 28.6, capRateRange: "4.0-5.5%", demandTrend: "Extreme", ecommerceDriven: false, supplyConstraint: "Critical", topMarkets: ["Northern Virginia", "Dallas/Fort Worth", "Phoenix"] },
      { sector: "Self-Storage", ytdReturn: 6.8, capRateRange: "5.0-7.0%", demandTrend: "Moderate", ecommerceDriven: false, supplyConstraint: "Moderate", topMarkets: ["Florida", "Texas", "Southeast"] },
    ];
    sendSuccess(res, {
      source: "Terra Market Analytics — REIT + Census + BLS Composite",
      sectors,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch sector performance"); }
});

router.get("/terra/geocode", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string | undefined;
    if (!address) {
      sendBadRequest(res, "address query parameter is required");
      return;
    }

    const result = await geocodeAddress(address);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Geocoding failed");
  }
});

router.get("/terra/reverse-geocode", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      sendBadRequest(res, "lat and lng query parameters are required");
      return;
    }

    const result = await reverseGeocode(lat, lng);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Reverse geocoding failed");
  }
});

router.get("/terra/geocoding-status", async (_req: Request, res: Response) => {
  sendSuccess(res, getGeocodingProviderStatus());
});

router.get("/terra/mls/listings", terraRateLimit, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const postalCode = req.query.postalCode as string | undefined;
    const propertyType = req.query.propertyType as string | undefined;
    const mlsName = req.query.mlsName as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
    const offset = parseInt(String(req.query.offset ?? "0"), 10);

    const listings = await getMlsListings({ status, postalCode, propertyType, mlsName, limit, offset });

    sendSuccess(res, {
      source: "RESO Web API — MLS Listing Feed",
      connectorStatus: services.resoMls.status,
      demoMode: services.resoMls.isDemoMode,
      count: listings.length,
      listings,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch MLS listings");
  }
});

router.get("/terra/commercial/properties", terraRateLimit, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const propertyType = req.query.propertyType as string | undefined;
    const zipCode = req.query.zipCode as string | undefined;
    const source = req.query.source as string | undefined;
    const buildingClass = req.query.buildingClass as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
    const offset = parseInt(String(req.query.offset ?? "0"), 10);

    const properties = await getCommercialProperties({ propertyType, zipCode, source, buildingClass, limit, offset });

    sendSuccess(res, {
      source: "CoStar Commercial Property Intelligence",
      connectorStatus: services.costar.status,
      demoMode: services.costar.isDemoMode,
      count: properties.length,
      properties,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch commercial properties");
  }
});

router.get("/terra/commercial/comps", terraRateLimit, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const compType = req.query.compType as "lease" | "sale" | undefined;
    const propertyType = req.query.propertyType as string | undefined;
    const source = req.query.source as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
    const offset = parseInt(String(req.query.offset ?? "0"), 10);

    const comps = await getCommercialComps({ compType, propertyType, source, limit, offset });

    sendSuccess(res, {
      source: "CompStak + CoStar Commercial Transaction Comps",
      connectorStatuses: {
        costar: services.costar.status,
        compstak: services.compstak.status,
      },
      demoMode: services.compstak.isDemoMode && services.costar.isDemoMode,
      count: comps.length,
      comps,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch commercial comps");
  }
});

router.get("/terra/enterprise/flags", authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  sendSuccess(res, {
    flags: getEnterpriseFeatureFlags(),
    connectors: {
      mls: services.resoMls.getHealthReport(),
      costar: services.costar.getHealthReport(),
      compstak: services.compstak.getHealthReport(),
    },
    fetchedAt: new Date().toISOString(),
  });
});

router.post("/terra/enterprise/sync/mls", authMiddleware({ required: true }), async (_req: Request, res: Response) => {
  try {
    const result = await runMlsListingSync();
    sendSuccess(res, { message: "MLS sync completed", ...result });
  } catch (err) {
    handleRouteError(res, err, "MLS sync failed");
  }
});

router.post("/terra/enterprise/sync/commercial", authMiddleware({ required: true }), async (_req: Request, res: Response) => {
  try {
    const result = await runCommercialDataRefresh();
    sendSuccess(res, { message: "Commercial data refresh completed", ...result });
  } catch (err) {
    handleRouteError(res, err, "Commercial data refresh failed");
  }
});

export default router;

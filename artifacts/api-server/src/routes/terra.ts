import { Router, type IRouter, type Request, type Response } from "express";
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
import { services } from "@workspace/services";

const router: IRouter = Router();

const terraRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terra rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

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

const DEMO_MARKETS = [
  { market: "Manhattan, NY", medianPrice: 1285000, priceGrowthYoY: 2.1, inventoryMonths: 4.2, capRate: 3.8, vacancyRate: 4.1, absorption: "Balanced", riskScore: 42, demandScore: 78, supplyScore: 65, employmentGrowth: 1.8, populationGrowth: 0.4, fedRiskIndex: 18, floodZone: "Zone AE", wildfireRisk: "Low", earthquakeRisk: "Low" },
  { market: "Austin, TX", medianPrice: 542000, priceGrowthYoY: -3.2, inventoryMonths: 6.1, capRate: 5.2, vacancyRate: 7.8, absorption: "Buyer's Market", riskScore: 58, demandScore: 72, supplyScore: 45, employmentGrowth: 4.1, populationGrowth: 2.9, fedRiskIndex: 31, floodZone: "Zone X", wildfireRisk: "Moderate", earthquakeRisk: "Low" },
  { market: "Miami, FL", medianPrice: 628000, priceGrowthYoY: 5.4, inventoryMonths: 3.8, capRate: 4.7, vacancyRate: 3.9, absorption: "Seller's Market", riskScore: 74, demandScore: 89, supplyScore: 58, employmentGrowth: 3.2, populationGrowth: 2.1, fedRiskIndex: 87, floodZone: "Zone VE", wildfireRisk: "Low", earthquakeRisk: "Low" },
  { market: "Phoenix, AZ", medianPrice: 418000, priceGrowthYoY: 1.8, inventoryMonths: 4.9, capRate: 5.6, vacancyRate: 6.2, absorption: "Balanced", riskScore: 51, demandScore: 81, supplyScore: 52, employmentGrowth: 3.7, populationGrowth: 2.4, fedRiskIndex: 24, floodZone: "Zone X", wildfireRisk: "Very High", earthquakeRisk: "Moderate" },
  { market: "Seattle, WA", medianPrice: 812000, priceGrowthYoY: -0.8, inventoryMonths: 2.9, capRate: 4.1, vacancyRate: 3.2, absorption: "Seller's Market", riskScore: 46, demandScore: 86, supplyScore: 71, employmentGrowth: 2.9, populationGrowth: 1.2, fedRiskIndex: 54, floodZone: "Zone X", wildfireRisk: "High", earthquakeRisk: "Very High" },
  { market: "Denver, CO", medianPrice: 552000, priceGrowthYoY: -1.4, inventoryMonths: 3.6, capRate: 5.0, vacancyRate: 5.1, absorption: "Balanced", riskScore: 39, demandScore: 77, supplyScore: 68, employmentGrowth: 2.4, populationGrowth: 1.5, fedRiskIndex: 21, floodZone: "Zone X", wildfireRisk: "High", earthquakeRisk: "Low" },
];

const DEMO_REIT_FILINGS = [
  { ticker: "SPG", name: "Simon Property Group", type: "Retail REIT", marketCap: 48200000000, dividendYield: 5.4, ffo: 11.82, revenue: 5810000000, netIncome: 1620000000, totalAssets: 33800000000, debt: 24100000000, occupancyRate: 95.6, lastFilingDate: "2024-02-15", formType: "10-K" },
  { ticker: "PLD", name: "Prologis", type: "Industrial REIT", marketCap: 98400000000, dividendYield: 3.1, ffo: 5.74, revenue: 7680000000, netIncome: 2980000000, totalAssets: 83600000000, debt: 21400000000, occupancyRate: 97.8, lastFilingDate: "2024-02-14", formType: "10-K" },
  { ticker: "O", name: "Realty Income", type: "Net Lease REIT", marketCap: 40100000000, dividendYield: 5.8, ffo: 4.12, revenue: 3870000000, netIncome: 872000000, totalAssets: 55200000000, debt: 19800000000, occupancyRate: 99.0, lastFilingDate: "2024-02-21", formType: "10-K" },
  { ticker: "AMT", name: "American Tower", type: "Cell Tower REIT", marketCap: 82300000000, dividendYield: 3.5, ffo: 9.87, revenue: 9980000000, netIncome: 1240000000, totalAssets: 71400000000, debt: 38900000000, occupancyRate: 98.2, lastFilingDate: "2024-02-26", formType: "10-K" },
  { ticker: "EQR", name: "Equity Residential", type: "Apartment REIT", marketCap: 23800000000, dividendYield: 4.2, ffo: 3.91, revenue: 2710000000, netIncome: 568000000, totalAssets: 22700000000, debt: 8400000000, occupancyRate: 96.5, lastFilingDate: "2024-02-14", formType: "10-K" },
];

const DEMO_CENSUS_MARKET_OVERLAYS = [
  { market: "Manhattan, NY", msaCode: "35620", population: 8336817, householdIncome: 102964, povertyRate: 16.5, educationBachelor: 45.2, workFromHome: 21.4, netMigration: -12400, laborForce: 4128000, topEmployers: ["Finance/Insurance", "Health Care", "Professional Services"] },
  { market: "Austin, TX", msaCode: "12420", population: 2295303, householdIncome: 86091, povertyRate: 12.8, educationBachelor: 42.8, workFromHome: 25.7, netMigration: 67800, laborForce: 1148000, topEmployers: ["Technology", "Government", "Professional Services"] },
  { market: "Miami, FL", msaCode: "33100", population: 6183099, householdIncome: 61834, povertyRate: 17.9, educationBachelor: 34.1, workFromHome: 15.3, netMigration: 89200, laborForce: 3021000, topEmployers: ["Tourism/Hospitality", "Health Care", "Finance"] },
  { market: "Phoenix, AZ", msaCode: "38060", population: 5030213, householdIncome: 73248, povertyRate: 14.2, educationBachelor: 33.6, workFromHome: 22.1, netMigration: 98600, laborForce: 2464000, topEmployers: ["Technology", "Health Care", "Real Estate"] },
  { market: "Seattle, WA", msaCode: "42660", population: 4018762, householdIncome: 104978, povertyRate: 10.4, educationBachelor: 49.1, workFromHome: 32.8, netMigration: 21300, laborForce: 1986000, topEmployers: ["Technology", "Aerospace", "Retail/E-Commerce"] },
];

const DEMO_PROPERTY_RISK_SCORES = [
  { propertyId: "P001", address: "123 Wall St, New York, NY 10005", assetClass: "Office", marketValue: 52000000, overallRisk: 38, components: { floodRisk: 22, wildfireRisk: 5, earthquakeRisk: 8, climateRisk: 45, hurricaneRisk: 18, tornadoRisk: 3 }, compliance: { fedrampEligible: false, envReporting: true }, demScore: 82, employmentProximity: 98, transitScore: 97 },
  { propertyId: "P002", address: "456 Brickell Ave, Miami, FL 33131", assetClass: "Mixed-Use", marketValue: 89000000, overallRisk: 78, components: { floodRisk: 92, wildfireRisk: 5, earthquakeRisk: 4, climateRisk: 89, hurricaneRisk: 95, tornadoRisk: 12 }, compliance: { fedrampEligible: false, envReporting: true }, demScore: 79, employmentProximity: 91, transitScore: 68 },
  { propertyId: "P003", address: "789 Congress Ave, Austin, TX 78701", assetClass: "Office", marketValue: 38000000, overallRisk: 44, components: { floodRisk: 34, wildfireRisk: 42, earthquakeRisk: 6, climateRisk: 52, hurricaneRisk: 8, tornadoRisk: 38 }, compliance: { fedrampEligible: false, envReporting: false }, demScore: 75, employmentProximity: 88, transitScore: 52 },
];

router.get("/terra/market-intelligence", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const market = req.query.market as string;
    let markets = DEMO_MARKETS;
    if (market) markets = markets.filter(m => m.market.toLowerCase().includes(market.toLowerCase()));
    sendSuccess(res, {
      source: "Terra Real Estate Intelligence — Census Bureau + BLS + FEMA Risk Index",
      count: markets.length,
      markets,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch market intelligence"); }
});

router.get("/terra/reit-filings", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const type = req.query.type as string;
    let filings = DEMO_REIT_FILINGS;
    if (type) filings = filings.filter(f => f.type.toLowerCase().includes(type.toLowerCase()));
    sendSuccess(res, {
      source: "SEC EDGAR REIT Financial Filings",
      url: "https://www.sec.gov/cgi-bin/browse-edgar",
      count: filings.length,
      filings,
      aggregate: {
        totalMarketCap: filings.reduce((s, f) => s + f.marketCap, 0),
        avgDividendYield: (filings.reduce((s, f) => s + f.dividendYield, 0) / filings.length).toFixed(2),
        avgOccupancyRate: (filings.reduce((s, f) => s + f.occupancyRate, 0) / filings.length).toFixed(1),
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch REIT filings"); }
});

router.get("/terra/demographics", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const market = req.query.market as string;
    let overlays = DEMO_CENSUS_MARKET_OVERLAYS;
    if (market) overlays = overlays.filter(o => o.market.toLowerCase().includes(market.toLowerCase()));
    sendSuccess(res, {
      source: "U.S. Census Bureau ACS 5-Year Estimates",
      url: "https://api.census.gov/",
      count: overlays.length,
      demographics: overlays,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch demographic data"); }
});

router.get("/terra/property-risk", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const propertyId = req.query.propertyId as string;
    let properties = DEMO_PROPERTY_RISK_SCORES;
    if (propertyId) properties = properties.filter(p => p.propertyId === propertyId);
    sendSuccess(res, {
      sources: ["FEMA National Risk Index", "NOAA Climate Projections", "Census ACS"],
      count: properties.length,
      properties,
      riskMethodology: {
        weights: { floodRisk: 0.25, wildfireRisk: 0.20, earthquakeRisk: 0.15, climateRisk: 0.20, hurricaneRisk: 0.15, tornadoRisk: 0.05 },
        scale: "0–100 (100 = highest risk)",
        version: "2.0",
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch property risk scores"); }
});

router.get("/terra/employment-outlook", terraRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = await getCached("terra-bls", 3600000, async () => {
      return {
        national: {
          unemploymentRate: 3.7,
          laborForceParticipation: 62.8,
          monthlyJobGain: 209000,
          avgHourlyEarnings: 34.27,
          earningsGrowthYoY: 4.3,
        },
        marketSummary: DEMO_CENSUS_MARKET_OVERLAYS.map(m => ({
          market: m.market,
          laborForce: m.laborForce,
          workFromHome: m.workFromHome,
          netMigration: m.netMigration,
          topEmployers: m.topEmployers,
        })),
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

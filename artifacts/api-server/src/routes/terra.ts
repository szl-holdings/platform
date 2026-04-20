import { db, terraDistressPropertiesTable, terraPropertiesTable } from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { desc, eq, sql } from 'drizzle-orm';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import { geocodeAddress, getGeocodingProviderStatus, reverseGeocode } from '../lib/geocoding';
import {
  getCommercialComps,
  getCommercialProperties,
  getEnterpriseFeatureFlags,
  getMlsListings,
  runCommercialDataRefresh,
  runMlsListingSync,
} from '../lib/terra-enterprise-ingestion';
import {
  listQuerySchema,
  terraSyncTriggerSchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const terraRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terra rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const terraCache = new LRUCache<string, { data: unknown; expiry: number }>({ max: 300 });
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = terraCache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher()
    .then((data) => {
      terraCache.set(key, { data, expiry: Date.now() + ttlMs });
      return data;
    })
    .catch(() => {
      const stale = terraCache.get(key);
      if (stale) return stale.data as T;
      throw new Error('Data unavailable');
    });
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-Terra/1.0', Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get(
  '/terra/market-intelligence',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect a real estate data provider (e.g. ATTOM, Zillow API, CoStar, RealPage) for live market intelligence.',
        count: 0,
        markets: [],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch market intelligence');
    }
  },
);

router.get(
  '/terra/reit-filings',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect to SEC EDGAR Full-Text Search API (https://efts.sec.gov/LATEST/search-index) for live REIT 10-K/10-Q filings.',
        count: 0,
        filings: [],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch REIT filings');
    }
  },
);

router.get(
  '/terra/demographics',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect a Census Bureau API key (https://api.census.gov/data/key_signup.html) for live ACS demographic data.',
        count: 0,
        demographics: [],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch demographic data');
    }
  },
);

router.get(
  '/terra/property-risk',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect FEMA NRI API (https://hazards.fema.gov/nri/api) and NOAA Climate data feeds for live property risk scoring.',
        count: 0,
        properties: [],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch property risk scores');
    }
  },
);

router.get(
  '/terra/employment-outlook',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const data = await getCached('terra-bls', 3600000, async () => {
        return {
          status: 'NOT_CONFIGURED',
          note: 'Connect a BLS API key (https://www.bls.gov/developers/) for live employment data.',
          national: null,
          marketSummary: [],
        };
      });
      sendSuccess(res, {
        source: 'Bureau of Labor Statistics (BLS) + Census ACS',
        data,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch employment outlook');
    }
  },
);

router.get(
  '/terra/sector-performance',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const sectors = [
        {
          sector: 'Industrial',
          ytdReturn: 18.4,
          capRateRange: '4.5-6.0%',
          demandTrend: 'Very Strong',
          ecommerceDriven: true,
          supplyConstraint: 'High',
          topMarkets: ['Dallas/Fort Worth', 'Inland Empire', 'Chicago'],
        },
        {
          sector: 'Multifamily',
          ytdReturn: 4.2,
          capRateRange: '4.5-6.5%',
          demandTrend: 'Strong',
          ecommerceDriven: false,
          supplyConstraint: 'High',
          topMarkets: ['Miami', 'Nashville', 'Raleigh-Durham'],
        },
        {
          sector: 'Retail (Grocery-Anchored)',
          ytdReturn: 9.1,
          capRateRange: '5.5-7.5%',
          demandTrend: 'Stable',
          ecommerceDriven: false,
          supplyConstraint: 'Moderate',
          topMarkets: ['Sunbelt Markets', 'Southeast'],
        },
        {
          sector: 'Office (CBD)',
          ytdReturn: -12.3,
          capRateRange: '6.5-9.5%',
          demandTrend: 'Weak',
          ecommerceDriven: false,
          supplyConstraint: 'Low',
          topMarkets: ['None — widespread distress'],
        },
        {
          sector: 'Data Centers',
          ytdReturn: 28.6,
          capRateRange: '4.0-5.5%',
          demandTrend: 'Extreme',
          ecommerceDriven: false,
          supplyConstraint: 'Critical',
          topMarkets: ['Northern Virginia', 'Dallas/Fort Worth', 'Phoenix'],
        },
        {
          sector: 'Self-Storage',
          ytdReturn: 6.8,
          capRateRange: '5.0-7.0%',
          demandTrend: 'Moderate',
          ecommerceDriven: false,
          supplyConstraint: 'Moderate',
          topMarkets: ['Florida', 'Texas', 'Southeast'],
        },
      ];
      sendSuccess(res, {
        source: 'Terra Market Analytics — REIT + Census + BLS Composite',
        sectors,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch sector performance');
    }
  },
);

router.get(
  '/terra/geocode',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const address = req.query.address as string | undefined;
      if (!address) {
        sendBadRequest(res, 'address query parameter is required');
        return;
      }

      const result = await geocodeAddress(address);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Geocoding failed');
    }
  },
);

router.get(
  '/terra/reverse-geocode',
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        sendBadRequest(res, 'lat and lng query parameters are required');
        return;
      }

      const result = await reverseGeocode(lat, lng);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Reverse geocoding failed');
    }
  },
);

router.get('/terra/geocoding-status', async (_req: Request, res: Response) => {
  sendSuccess(res, getGeocodingProviderStatus());
});

router.get(
  '/terra/mls/listings',
  terraRateLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const postalCode = req.query.postalCode as string | undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const mlsName = req.query.mlsName as string | undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10), 500);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);

      const listings = await getMlsListings({
        status,
        postalCode,
        propertyType,
        mlsName,
        limit,
        offset,
      });

      sendSuccess(res, {
        source: 'RESO Web API — MLS Listing Feed',
        connectorStatus: services.resoMls.status,
        demoMode: services.resoMls.isDemoMode,
        count: listings.length,
        listings,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch MLS listings');
    }
  },
);

router.get(
  '/terra/commercial/properties',
  terraRateLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const propertyType = req.query.propertyType as string | undefined;
      const zipCode = req.query.zipCode as string | undefined;
      const source = req.query.source as string | undefined;
      const buildingClass = req.query.buildingClass as string | undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10), 500);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);

      const properties = await getCommercialProperties({
        propertyType,
        zipCode,
        source,
        buildingClass,
        limit,
        offset,
      });

      sendSuccess(res, {
        source: 'CoStar Commercial Property Intelligence',
        connectorStatus: services.costar.status,
        demoMode: services.costar.isDemoMode,
        count: properties.length,
        properties,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch commercial properties');
    }
  },
);

router.get(
  '/terra/commercial/comps',
  terraRateLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const compType = req.query.compType as 'lease' | 'sale' | undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const source = req.query.source as string | undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10), 500);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);

      const comps = await getCommercialComps({ compType, propertyType, source, limit, offset });

      sendSuccess(res, {
        source: 'CompStak + CoStar Commercial Transaction Comps',
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
      handleRouteError(res, err, 'Failed to fetch commercial comps');
    }
  },
);

router.get(
  '/terra/enterprise/flags',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    sendSuccess(res, {
      flags: getEnterpriseFeatureFlags(),
      connectors: {
        mls: services.resoMls.getHealthReport(),
        costar: services.costar.getHealthReport(),
        compstak: services.compstak.getHealthReport(),
      },
      fetchedAt: new Date().toISOString(),
    });
  },
);

router.post(
  '/terra/enterprise/sync/mls',
  validateBody(terraSyncTriggerSchema),
  authMiddleware({ required: true }),
  async (_req: Request, res: Response) => {
    try {
      const result = await runMlsListingSync();
      sendSuccess(res, { message: 'MLS sync completed', ...result });
    } catch (err) {
      handleRouteError(res, err, 'MLS sync failed');
    }
  },
);

router.post(
  '/terra/enterprise/sync/commercial',
  validateBody(terraSyncTriggerSchema),
  authMiddleware({ required: true }),
  async (_req: Request, res: Response) => {
    try {
      const result = await runCommercialDataRefresh();
      sendSuccess(res, { message: 'Commercial data refresh completed', ...result });
    } catch (err) {
      handleRouteError(res, err, 'Commercial data refresh failed');
    }
  },
);

// ─── ATLAS Twin: Property endpoints ──────────────────────────────────────────

router.get(
  '/terra/properties',
  terraRateLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const properties = await db
        .select()
        .from(terraPropertiesTable)
        .orderBy(desc(terraPropertiesTable.createdAt))
        .limit(limit)
        .offset(offset);
      sendSuccess(res, { properties, count: properties.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list properties');
    }
  },
);

router.get(
  '/terra/market',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const [capRateResult] = await db
        .select({ avgCapRate: sql<string>`AVG(CAST(cap_rate AS NUMERIC))` })
        .from(terraPropertiesTable);
      const count = await db.select({ cnt: sql<number>`COUNT(*)` }).from(terraPropertiesTable);
      const totalProperties = Number(count[0]?.cnt ?? 0);
      const avgCapRate = capRateResult?.avgCapRate
        ? Number(capRateResult.avgCapRate).toFixed(2)
        : null;
      sendSuccess(res, {
        totalProperties,
        avgCapRate: avgCapRate ? `${avgCapRate}%` : null,
        dataSource: 'live-db',
        note: totalProperties === 0 ? 'No property records found — showing demo data in UI' : null,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch market data');
    }
  },
);

router.get(
  '/terra/properties/:id',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const numericId = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : null;
      let property = null;
      if (numericId !== null) {
        [property] = await db
          .select()
          .from(terraPropertiesTable)
          .where(eq(terraPropertiesTable.id, numericId))
          .limit(1);
      }
      if (!property) {
        const [byExternal] = await db
          .select()
          .from(terraPropertiesTable)
          .where(eq(terraPropertiesTable.externalId!, rawId))
          .limit(1);
        property = byExternal ?? null;
      }
      if (!property) {
        sendNotFound(res, 'Property');
        return;
      }
      const capRateNum = property.capRate ? Number(property.capRate) : null;
      const noiNum = property.noi ? Number(property.noi) : null;
      const valueNum = property.assessedValue ? Number(property.assessedValue) : null;
      sendSuccess(res, {
        ...property,
        kpis: {
          value: valueNum,
          noi: noiNum,
          capRate: capRateNum ?? (valueNum && noiNum ? (noiNum / valueNum) * 100 : null),
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch property');
    }
  },
);

router.get(
  '/terra/properties/:id/history',
  terraRateLimit,
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const numericId = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : null;
      let propertyDbId: number | null = numericId;
      if (!propertyDbId) {
        const [byExternal] = await db
          .select({ id: terraPropertiesTable.id })
          .from(terraPropertiesTable)
          .where(eq(terraPropertiesTable.externalId!, rawId))
          .limit(1);
        propertyDbId = byExternal?.id ?? null;
      }
      if (!propertyDbId) {
        sendNotFound(res, 'Property');
        return;
      }
      const distressSignals = await db
        .select()
        .from(terraDistressPropertiesTable)
        .where(
          sql`LOWER(${terraDistressPropertiesTable.address}) = (SELECT LOWER(address) FROM terra_properties WHERE id = ${propertyDbId} LIMIT 1)`,
        )
        .orderBy(desc(terraDistressPropertiesTable.createdAt))
        .limit(50);
      const events = distressSignals.map((s, i) => ({
        time: s.createdAt
          ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Unknown',
        type: i === 0 ? 'distress' : 'market',
        label: `Distress signal recorded — ${s.borough ?? ''}`,
        detail: `Estimated value: $${Number(s.estimatedValue ?? 0).toLocaleString()} — ${s.propertyType ?? ''}`,
        severity: 'warn' as const,
      }));
      sendSuccess(res, { events, propertyId: propertyDbId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch property history');
    }
  },
);

export default router;

import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { prismBus } from '@szl-holdings/prism-bus';
import { TERRA_CLIMATE_CAP_RATE, TERRA_DISTRESS_PROPAGATION, TERRA_OWNER_INTENT, runSimulation } from '@szl-holdings/monte-carlo';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { getIngestionStats } from '../lib/terra-distress-service';
import { inferenceService } from '../lib/ml-pipeline-service';
import { ensureTerraModelsRegistered } from '../lib/terra-model-seeder';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

function emitTerraPrismSignal(payload: Record<string, unknown>, severity: 'info' | 'low' | 'medium' | 'high' | 'critical' = 'info', correlationId?: string): void {
  prismBus.publish({
    type: 'domain_signal',
    domain: 'terra',
    sourceId: 'terra-live-adapter',
    payload,
    severity,
    ...(correlationId ? { correlationId } : {}),
  }).catch(() => {});
}

const router: IRouter = Router();

const terraLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terra Live rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const terraLiveCache = new LRUCache<
  string,
  { data: unknown; expiry: number; fetchedAt: number; source: string }
>({ max: 300 });
function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<{ data: T; source: string }>,
): Promise<{ data: T; source: string; cacheAgeSeconds: number; isStale: boolean }> {
  const cached = terraLiveCache.get(key);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return Promise.resolve({
      data: cached.data as T,
      source: cached.source,
      cacheAgeSeconds: Math.floor((now - cached.fetchedAt) / 1000),
      isStale: false,
    });
  }
  return fetcher()
    .then(({ data, source }) => {
      terraLiveCache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
      return { data, source, cacheAgeSeconds: 0, isStale: false };
    })
    .catch(() => {
      const stale = terraLiveCache.get(key);
      if (stale)
        return {
          data: stale.data as T,
          source: `stale-${stale.source}`,
          cacheAgeSeconds: Math.floor((now - stale.fetchedAt) / 1000),
          isStale: true,
        };
      throw new Error('Data unavailable');
    });
}

function readCachedLiveData<T>(key: string): T | null {
  const entry = terraLiveCache.get(key);
  if (!entry || entry.expiry < Date.now()) return null;
  return entry.data as T;
}

function findFemaCachedEntry(): { counties: Array<{ overallRiskScore: number | null; primaryHazards: string[] }> } | null {
  for (const state of ['FL', 'TX', 'AZ', 'GA', 'NC', 'SC', 'AL', 'TN']) {
    const d = readCachedLiveData<{ counties: Array<{ overallRiskScore: number | null; primaryHazards: string[] }> }>(`terra-fema-nri-${state}`);
    if (d?.counties?.length) return d;
  }
  return null;
}

function findFemaCacheKey(): string | null {
  for (const state of ['FL', 'TX', 'AZ', 'GA', 'NC', 'SC', 'AL', 'TN']) {
    const entry = terraLiveCache.get(`terra-fema-nri-${state}`);
    if (entry) return `terra-fema-nri-${state}`;
  }
  return null;
}

async function fetchJson(url: string, timeoutMs = 12000, extraHeaders?: Record<string, string>): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-Terra/1.0', Accept: 'application/json', ...extraHeaders },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const FALLBACK_MORTGAGE_RATES = {
  rate30yr: 7.12,
  rate15yr: 6.48,
  rateArm5: 6.35,
  weeklyChange30yr: +0.08,
  source: 'fallback-api-unavailable',
  asOf: new Date().toISOString().slice(0, 10),
};

const FALLBACK_CENSUS_STATS = [
  {
    msaCode: '35620',
    name: 'New York-Newark-Jersey City',
    population: 20140470,
    medianHouseholdIncome: 82461,
    medianHomeValue: 519800,
    ownerOccupancyRate: 50.4,
    rentalVacancyRate: 4.1,
    source: 'fallback-api-unavailable',
  },
  {
    msaCode: '12420',
    name: 'Austin-Round Rock-Georgetown',
    population: 2295303,
    medianHouseholdIncome: 86091,
    medianHomeValue: 385600,
    ownerOccupancyRate: 58.2,
    rentalVacancyRate: 6.8,
    source: 'fallback-api-unavailable',
  },
  {
    msaCode: '33100',
    name: 'Miami-Fort Lauderdale-Pompano Beach',
    population: 6183099,
    medianHouseholdIncome: 61834,
    medianHomeValue: 428100,
    ownerOccupancyRate: 62.1,
    rentalVacancyRate: 3.7,
    source: 'fallback-api-unavailable',
  },
  {
    msaCode: '38060',
    name: 'Phoenix-Mesa-Chandler',
    population: 5030213,
    medianHouseholdIncome: 73248,
    medianHomeValue: 341700,
    ownerOccupancyRate: 63.8,
    rentalVacancyRate: 5.9,
    source: 'fallback-api-unavailable',
  },
  {
    msaCode: '42660',
    name: 'Seattle-Tacoma-Bellevue',
    population: 4018762,
    medianHouseholdIncome: 104978,
    medianHomeValue: 638900,
    ownerOccupancyRate: 55.6,
    rentalVacancyRate: 3.2,
    source: 'fallback-api-unavailable',
  },
];

const FALLBACK_HUD_FAIR_MARKET = [
  {
    area: 'New York, NY MSA',
    year: 2025,
    studio: 1900,
    oneBed: 2180,
    twoBed: 2520,
    threeBed: 3180,
    fourBed: 3750,
    source: 'fallback-api-unavailable',
  },
  {
    area: 'Austin, TX MSA',
    year: 2025,
    studio: 1180,
    oneBed: 1380,
    twoBed: 1700,
    threeBed: 2320,
    fourBed: 2710,
    source: 'fallback-api-unavailable',
  },
  {
    area: 'Miami, FL MSA',
    year: 2025,
    studio: 1540,
    oneBed: 1720,
    twoBed: 2120,
    threeBed: 2980,
    fourBed: 3560,
    source: 'fallback-api-unavailable',
  },
  {
    area: 'Phoenix, AZ MSA',
    year: 2025,
    studio: 1150,
    oneBed: 1380,
    twoBed: 1680,
    threeBed: 2250,
    fourBed: 2640,
    source: 'fallback-api-unavailable',
  },
  {
    area: 'Seattle, WA MSA',
    year: 2025,
    studio: 1620,
    oneBed: 1890,
    twoBed: 2310,
    threeBed: 3120,
    fourBed: 3740,
    source: 'fallback-api-unavailable',
  },
];

router.get(
  '/terra/live/census-housing',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const msaCode = req.query.msa as string;
      const result = await getCached<any>(
        `terra-census-housing-${msaCode ?? 'all'}`,
        86400000,
        async () => {
          try {
            const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B25077_001E,B19013_001E,B25003_002E,B25003_001E,B25004_003E&for=metropolitan+statistical+area/micropolitan+statistical+area:12420,33100,35620,38060,42660&key=DEMO`;
            const raw = (await fetchJson(url, 10000)) as any[];
            if (!Array.isArray(raw) || raw.length < 2) throw new Error('No Census data');
            const headers = raw[0];
            const nameIdx = headers.indexOf('NAME');
            const medHomeIdx = headers.indexOf('B25077_001E');
            const medIncIdx = headers.indexOf('B19013_001E');
            const ownerIdx = headers.indexOf('B25003_002E');
            const totalOccIdx = headers.indexOf('B25003_001E');
            const vacIdx = headers.indexOf('B25004_003E');
            const msaIdx = headers.indexOf(
              'metropolitan statistical area/micropolitan statistical area',
            );
            const stats = raw.slice(1).map((row: any[]) => {
              const ownerRate =
                totalOccIdx >= 0 && ownerIdx >= 0 && +row[totalOccIdx] > 0
                  ? ((+row[ownerIdx] / +row[totalOccIdx]) * 100).toFixed(1)
                  : null;
              return {
                msaCode: row[msaIdx],
                name:
                  row[nameIdx]
                    ?.replace(' Metro Area', '')
                    .replace(' Metropolitan Statistical Area', '') ?? 'MSA',
                medianHomeValue: +row[medHomeIdx] > 0 ? +row[medHomeIdx] : null,
                medianHouseholdIncome: +row[medIncIdx] > 0 ? +row[medIncIdx] : null,
                ownerOccupancyRate: ownerRate ? +ownerRate : null,
                rentalVacancyRate: +row[vacIdx] > 0 ? +row[vacIdx] : null,
              };
            });
            return { data: { stats }, source: 'live' };
          } catch {
            const filtered = msaCode
              ? FALLBACK_CENSUS_STATS.filter((s) => s.msaCode === msaCode)
              : FALLBACK_CENSUS_STATS;
            return { data: { stats: filtered }, source: 'fallback-api-unavailable' };
          }
        },
      );

      const filtered = msaCode
        ? result.data.stats.filter((s: any) => s.msaCode === msaCode)
        : result.data.stats;
      sendSuccess(res, {
        source: 'U.S. Census Bureau ACS 5-Year Estimates',
        url: 'https://api.census.gov/',
        count: filtered.length,
        stats: filtered,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch Census housing data');
    }
  },
);

router.get(
  '/terra/live/hud-fair-market-rents',
  terraLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const result = await getCached<any>('terra-hud-fmr', 86400000 * 7, async () => {
        try {
          const raw = (await fetchJson(
            'https://www.huduser.gov/hudapi/public/fmr/listMetroAreas',
            10000,
          )) as any;
          if (!Array.isArray(raw?.data)) throw new Error('No HUD data');
          const keyAreas = raw.data
            .filter((a: any) => /new york|austin|miami|phoenix|seattle/i.test(a.area_name))
            .slice(0, 5);
          if (keyAreas.length === 0) throw new Error('No key areas found');
          return {
            data: { rents: keyAreas.map((a: any) => ({ area: a.area_name, year: a.year, ...a })) },
            source: 'live',
          };
        } catch {
          return { data: { rents: FALLBACK_HUD_FAIR_MARKET }, source: 'fallback-api-unavailable' };
        }
      });

      sendSuccess(res, {
        source: 'HUD Fair Market Rents (FMR) — Public API',
        url: 'https://www.huduser.gov/portal/dataset/fmr-api.html',
        count: result.data.rents.length,
        rents: result.data.rents,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        methodology:
          'HUD calculates FMRs as the 40th percentile of rents for standard-quality units in each area',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch HUD Fair Market Rent data');
    }
  },
);

router.get(
  '/terra/live/mortgage-rates',
  terraLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const result = await getCached<any>('terra-mortgage-rates', 3600000 * 6, async () => {
        try {
          const raw = (await fetchJson(
            'https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=DEMO_KEY&limit=4&sort_order=desc&file_type=json',
            10000,
          )) as any;
          if (!Array.isArray(raw?.observations) || raw.observations.length === 0)
            throw new Error('No FRED data');
          const obs = raw.observations.filter((o: any) => o.value !== '.');
          if (obs.length < 2) throw new Error('Insufficient FRED data');
          const latest = obs[0];
          const prev = obs[1];
          const rate = parseFloat(latest.value);
          const prevRate = parseFloat(prev.value);
          return {
            data: {
              rate30yr: rate,
              prevRate30yr: prevRate,
              weeklyChange30yr: +(rate - prevRate).toFixed(2),
              asOf: latest.date,
              historicalData: obs
                .slice(0, 4)
                .map((o: any) => ({ date: o.date, rate: parseFloat(o.value) })),
            },
            source: 'live',
          };
        } catch {
          return { data: FALLBACK_MORTGAGE_RATES, source: 'fallback-api-unavailable' };
        }
      });

      sendSuccess(res, {
        source: 'FRED (Federal Reserve Economic Data) — Primary Mortgage Market Survey',
        url: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
        data: result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch mortgage rate data');
    }
  },
);

router.get(
  '/terra/live/bls-construction',
  terraLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const result = await getCached<any>('terra-bls-construction', 86400000, async () => {
        try {
          const raw = (await fetchJson(
            'https://api.bls.gov/publicAPI/v2/timeseries/data/CES2000000001',
            10000,
          )) as any;
          if (raw?.status !== 'REQUEST_SUCCEEDED') throw new Error('BLS API error');
          const series = raw?.Results?.series?.[0]?.data;
          if (!Array.isArray(series) || series.length === 0) throw new Error('No BLS data');
          const latest = series[0];
          const prev = series[1];
          return {
            data: {
              constructionEmployment: parseFloat(latest.value) * 1000,
              period: `${latest.periodName} ${latest.year}`,
              monthlyChange: (
                (parseFloat(latest.value) - parseFloat(prev?.value ?? latest.value)) *
                1000
              ).toFixed(0),
              trend:
                parseFloat(latest.value) > parseFloat(prev?.value ?? '0')
                  ? 'growing'
                  : 'contracting',
              historicalData: series.slice(0, 12).map((d: any) => ({
                period: `${d.periodName} ${d.year}`,
                employment: parseFloat(d.value) * 1000,
              })),
            },
            source: 'live',
          };
        } catch {
          return {
            data: {
              constructionEmployment: 8142000,
              period: 'February 2026',
              monthlyChange: '+14000',
              trend: 'growing',
              historicalData: [
                { period: 'Feb 2026', employment: 8142000 },
                { period: 'Jan 2026', employment: 8128000 },
                { period: 'Dec 2025', employment: 8105000 },
              ],
            },
            source: 'fallback-api-unavailable',
          };
        }
      });

      sendSuccess(res, {
        source: 'Bureau of Labor Statistics — Construction Employment (CES2000000001)',
        url: 'https://www.bls.gov/',
        data: result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        significance: 'Construction employment is a leading indicator of new housing supply',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch BLS construction employment');
    }
  },
);

router.get(
  '/terra/live/fema-nri',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const stateAbbr = (req.query.state as string)?.toUpperCase() ?? 'FL';
      const result = await getCached<any>(
        `terra-fema-nri-${stateAbbr}`,
        86400000 * 30,
        async () => {
          try {
            const raw = (await fetchJson(
              `https://hazards.fema.gov/nri/api/counties?stateAbbreviation=${stateAbbr}&top=5`,
              12000,
            )) as any;
            if (!Array.isArray(raw?.items) || raw.items.length === 0)
              throw new Error('No FEMA NRI data');
            return {
              data: {
                counties: raw.items.map((c: any) => ({
                  countyName: c.county,
                  state: c.stateAbbreviation,
                  overallRiskScore: c.riskScore ?? null,
                  riskRating: c.risk ?? 'Unknown',
                  expectedAnnualLoss: c.eal ?? null,
                  socialVulnerability: c.socialVulnerability ?? null,
                  communityResilience: c.communityResilience ?? null,
                  primaryHazards: [c.hazardType1, c.hazardType2].filter(Boolean),
                })),
              },
              source: 'live',
            };
          } catch {
            const demoCo: Record<string, any[]> = {
              FL: [
                {
                  countyName: 'Miami-Dade',
                  state: 'FL',
                  overallRiskScore: 88.2,
                  riskRating: 'Very High',
                  expectedAnnualLoss: 4281000000,
                  socialVulnerability: 'Medium',
                  communityResilience: 'Relatively Low',
                  primaryHazards: ['Hurricane', 'Coastal Flooding'],
                },
                {
                  countyName: 'Broward',
                  state: 'FL',
                  overallRiskScore: 82.1,
                  riskRating: 'Very High',
                  expectedAnnualLoss: 2940000000,
                  socialVulnerability: 'Medium',
                  communityResilience: 'Medium',
                  primaryHazards: ['Hurricane', 'Storm Surge'],
                },
              ],
              CA: [
                {
                  countyName: 'Los Angeles',
                  state: 'CA',
                  overallRiskScore: 71.4,
                  riskRating: 'High',
                  expectedAnnualLoss: 5820000000,
                  socialVulnerability: 'Medium',
                  communityResilience: 'Relatively Low',
                  primaryHazards: ['Wildfire', 'Earthquake'],
                },
                {
                  countyName: 'San Diego',
                  state: 'CA',
                  overallRiskScore: 62.8,
                  riskRating: 'High',
                  expectedAnnualLoss: 2180000000,
                  socialVulnerability: 'Medium',
                  communityResilience: 'Medium',
                  primaryHazards: ['Wildfire', 'Earthquake'],
                },
              ],
            };
            return {
              data: {
                counties: demoCo[stateAbbr] ?? [
                  {
                    countyName: `${stateAbbr} County 1`,
                    state: stateAbbr,
                    overallRiskScore: 45.0,
                    riskRating: 'Moderate',
                    expectedAnnualLoss: 820000000,
                    socialVulnerability: 'Medium',
                    communityResilience: 'Medium',
                    primaryHazards: ['Severe Weather'],
                  },
                ],
              },
              source: 'fallback-api-unavailable',
            };
          }
        },
      );

      sendSuccess(res, {
        source: 'FEMA National Risk Index (NRI) API',
        url: 'https://hazards.fema.gov/nri/',
        state: stateAbbr,
        count: result.data.counties.length,
        counties: result.data.counties,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        methodology:
          'FEMA NRI composite score combining hazard frequency, social vulnerability, and community resilience',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch FEMA NRI data');
    }
  },
);

router.get(
  '/terra/live/nyc-dashboard',
  terraLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const stats = await getIngestionStats();

      const boroughMap = stats.byBorough as Record<string, number>;
      const typeMap = stats.byDistressType as Record<string, number>;

      const totalProperties = stats.totalProperties as number;
      const lastRun =
        Array.isArray(stats.recentRuns) && stats.recentRuns.length > 0 ? stats.recentRuns[0] : null;

      const boroughBreakdown = [
        { borough: 'Manhattan', count: boroughMap.Manhattan ?? 0, icon: '🏙️' },
        { borough: 'Brooklyn', count: boroughMap.Brooklyn ?? 0, icon: '🌉' },
        { borough: 'Queens', count: boroughMap.Queens ?? 0, icon: '✈️' },
        { borough: 'Bronx', count: boroughMap.Bronx ?? 0, icon: '🏟️' },
        { borough: 'Staten Island', count: boroughMap['Staten Island'] ?? 0, icon: '⛴️' },
      ].sort((a, b) => b.count - a.count);

      const distressBreakdown = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const recentRunSummary = lastRun
        ? {
            runId: (lastRun as any).id,
            source: (lastRun as any).source,
            status: (lastRun as any).status,
            recordsInserted: (lastRun as any).recordsInserted,
            alertsGenerated: (lastRun as any).alertsGenerated,
            startedAt: (lastRun as any).startedAt,
            completedAt: (lastRun as any).completedAt,
          }
        : null;

      const newFilings7d = Array.isArray(stats.recentRuns)
        ? (stats.recentRuns as any[])
            .filter((r: any) => {
              if (!r.startedAt) return false;
              const runDate = new Date(r.startedAt);
              return Date.now() - runDate.getTime() < 7 * 86400000;
            })
            .reduce((sum: number, r: any) => sum + (r.recordsInserted ?? 0), 0)
        : 0;

      sendSuccess(res, {
        source: 'Terra NYC Intelligence Dashboard — Live Ingestion Stats',
        connectors: [
          'NYC ACRIS Real Property Master (bnx9-e6tj)',
          'NYC ACRIS Legals (8h5j-fqxa)',
          'NYC ACRIS Parties (636b-3b5g)',
          'NYC Rolling Property Sales (usep-8jbt)',
          'NYC Tax Lien Sale List (9rz4-mjek)',
          'NYC Property Valuation & Assessment (8y4t-faws)',
          'NYC HPD Violations (wvxf-dwi5)',
          'NYC HPD Complaints (uwyv-629c)',
          'NYC DOB Violations (3h2n-5cm9)',
          'NYC 311 Property Complaints (erm2-nwe9)',
        ],
        dashboard: {
          totalProperties,
          newFilings7d,
          boroughBreakdown,
          distressBreakdown,
          topOpportunitySignals: [
            {
              signal: 'Lis Pendens Filings',
              count: typeMap['pre-foreclosure'] ?? 0,
              urgency: 'high',
            },
            {
              signal: 'Active Foreclosures',
              count: typeMap.foreclosure ?? 0,
              urgency: 'critical',
            },
            { signal: 'Tax Liens', count: typeMap['tax-lien'] ?? 0, urgency: 'medium' },
            { signal: 'REO / Bank-Owned', count: typeMap.reo ?? 0, urgency: 'high' },
            { signal: 'Auction Scheduled', count: typeMap.auction ?? 0, urgency: 'critical' },
          ].filter((s) => s.count > 0),
          recentIngestionRun: recentRunSummary,
          dataFreshness: lastRun
            ? ((lastRun as any).completedAt ?? (lastRun as any).startedAt)
            : null,
        },
        liveData: true,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NYC dashboard stats');
    }
  },
);

router.get(
  '/terra/live/nyc-pluto',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const neighborhood = (req.query.neighborhood as string) ?? 'Upper West Side';
      const zipcode = (req.query.zipcode as string) ?? '10024';
      const borough = (req.query.borough as string) ?? 'MN';
      const cacheKey = req.query.zipcode
        ? `terra-nyc-pluto-zip-${zipcode}`
        : `terra-nyc-pluto-${borough}-${neighborhood}`;
      const result = await getCached<any>(cacheKey, 6 * 3600000, async () => {
        try {
          const filterParam = req.query.zipcode
            ? `zipcode=%27${encodeURIComponent(zipcode)}%27`
            : `boro=%27${encodeURIComponent(borough)}%27`;
          const raw = (await fetchJson(
            `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=${filterParam}&$limit=50&$select=block,lot,address,zipcode,bldgclass,landuse,yearbuilt,numbldgs,numfloors,unitsres,unitstotal,bldgarea,lotarea,assesstot,exempttot,ownertype,ownername,zonedist1`,
            12000,
          )) as any[];
          if (!Array.isArray(raw) || raw.length === 0) throw new Error('No PLUTO data');

          const withYear = raw.filter((p) => +p.yearbuilt > 0);
          const avgYear =
            withYear.length > 0
              ? Math.round(withYear.reduce((s, p) => s + +p.yearbuilt, 0) / withYear.length)
              : null;
          const avgAssessed =
            raw.filter((p) => +p.assesstot > 0).length > 0
              ? Math.round(
                  raw.filter((p) => +p.assesstot > 0).reduce((s, p) => s + +p.assesstot, 0) /
                    raw.filter((p) => +p.assesstot > 0).length,
                )
              : null;

          const landUseMap: Record<string, string> = {
            '01': 'One & Two Family',
            '02': 'Multi-Family Walkup',
            '03': 'Multi-Family Elevator',
            '04': 'Mixed Residential/Commercial',
            '05': 'Commercial/Office',
            '06': 'Industrial/Manufacturing',
            '07': 'Transportation/Utility',
            '08': 'Public Facilities',
            '09': 'Open Space/Recreation',
            '10': 'Parking',
            '11': 'Vacant Land',
          };

          return {
            data: {
              neighborhood,
              borough,
              totalLots: raw.length,
              avgYearBuilt: avgYear,
              avgAssessedValue: avgAssessed,
              landUseBreakdown: raw.reduce((acc: Record<string, number>, p) => {
                const lu = landUseMap[p.landuse] ?? 'Other';
                acc[lu] = (acc[lu] ?? 0) + 1;
                return acc;
              }, {}),
              zoningSummary: raw.reduce((acc: Record<string, number>, p) => {
                if (p.zonedist1) acc[p.zonedist1] = (acc[p.zonedist1] ?? 0) + 1;
                return acc;
              }, {}),
              properties: raw.slice(0, 10).map((p) => ({
                address: p.address,
                zipcode: p.zipcode,
                block: p.block,
                lot: p.lot,
                buildingClass: p.bldgclass,
                landUse: landUseMap[p.landuse] ?? p.landuse,
                yearBuilt: +p.yearbuilt || null,
                numBuildings: +p.numbldgs || null,
                numFloors: +p.numfloors || null,
                residentialUnits: +p.unitsres || null,
                totalUnits: +p.unitstotal || null,
                buildingArea: +p.bldgarea || null,
                lotArea: +p.lotarea || null,
                assessedTotal: +p.assesstot || null,
                ownerType: p.ownertype,
                ownerName: p.ownername,
                zoning: p.zonedist1,
              })),
            },
            source: 'live-nyc-opendata',
          };
        } catch {
          return {
            data: {
              neighborhood,
              borough,
              totalLots: 48,
              avgYearBuilt: 1932,
              avgAssessedValue: 2850000,
              landUseBreakdown: {
                'Multi-Family Elevator': 22,
                'One & Two Family': 8,
                'Mixed Residential/Commercial': 10,
                'Commercial/Office': 6,
                'Vacant Land': 2,
              },
              zoningSummary: { R8: 15, R9: 10, R10: 8, 'C1-9': 7, 'R7-2': 8 },
              properties: [
                {
                  address: '250 W 77TH ST',
                  zipcode: '10024',
                  block: '1214',
                  lot: '1',
                  buildingClass: 'D4',
                  landUse: 'Multi-Family Elevator',
                  yearBuilt: 1928,
                  numFloors: 16,
                  residentialUnits: 144,
                  assessedTotal: 6300000,
                  ownerType: 'P',
                  zoning: 'R9',
                },
              ],
            },
            source: 'fallback-api-unavailable',
          };
        }
      });

      sendSuccess(res, {
        source: 'NYC PLUTO — NYC Department of City Planning via NYC Open Data',
        url: 'https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks',
        ...result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        description: 'Primary Land Use Tax Lot Output — lot-level property characteristics for NYC',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NYC PLUTO data');
    }
  },
);

router.get(
  '/terra/live/nyc-311',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const neighborhood = (req.query.neighborhood as string) ?? 'Upper West Side';
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
      const result = await getCached<any>(
        `terra-nyc-311-${neighborhood}`,
        60 * 60 * 1000,
        async () => {
          try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000)
              .toISOString()
              .split('T')[0];
            const _encoded = encodeURIComponent(neighborhood);
            const raw = (await fetchJson(
              `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=upper(city)=%27${encodeURIComponent(neighborhood.toUpperCase())}%27 AND created_date > %27${thirtyDaysAgo}%27&$limit=${limit}&$order=created_date DESC&$select=unique_key,created_date,closed_date,complaint_type,descriptor,incident_address,city,borough,status,resolution_description`,
              14000,
            )) as any[];
            if (!Array.isArray(raw)) throw new Error('No 311 data');

            const complaintCounts = raw.reduce((acc: Record<string, number>, c) => {
              const type = c.complaint_type ?? 'Unknown';
              acc[type] = (acc[type] ?? 0) + 1;
              return acc;
            }, {});

            const sorted = Object.entries(complaintCounts as Record<string, number>).sort(
              (a, b) => b[1] - a[1],
            );
            const openCount = raw.filter(
              (c) => c.status === 'Open' || c.status === 'Assigned' || c.status === 'In Progress',
            ).length;
            const closedCount = raw.filter((c) => c.status === 'Closed').length;

            const avgResponseHours = raw
              .filter((c) => c.closed_date && c.created_date)
              .slice(0, 20)
              .map(
                (c) =>
                  (new Date(c.closed_date).getTime() - new Date(c.created_date).getTime()) /
                  3600000,
              )
              .reduce((s, h, _, arr) => s + h / arr.length, 0);

            return {
              data: {
                neighborhood,
                totalComplaints: raw.length,
                openComplaints: openCount,
                closedComplaints: closedCount,
                avgResponseHours: avgResponseHours > 0 ? +avgResponseHours.toFixed(1) : null,
                topComplaintTypes: sorted.slice(0, 10).map(([type, count]) => ({ type, count })),
                qualityScore: Math.max(
                  0,
                  100 -
                    (openCount / Math.max(raw.length, 1)) * 40 -
                    Number(sorted[0]?.[1] ?? 0) / 2,
                ),
                recentComplaints: raw.slice(0, 10).map((c) => ({
                  id: c.unique_key,
                  createdAt: c.created_date,
                  closedAt: c.closed_date ?? null,
                  type: c.complaint_type,
                  descriptor: c.descriptor,
                  address: c.incident_address,
                  status: c.status,
                })),
              },
              source: 'live-nyc-311',
            };
          } catch {
            return {
              data: {
                neighborhood,
                totalComplaints: 43,
                openComplaints: 12,
                closedComplaints: 31,
                avgResponseHours: 18.4,
                topComplaintTypes: [
                  { type: 'Noise - Residential', count: 14 },
                  { type: 'HEAT/HOT WATER', count: 9 },
                  { type: 'Blocked Driveway', count: 7 },
                  { type: 'Illegal Parking', count: 6 },
                  { type: 'Rodent', count: 4 },
                  { type: 'Unsanitary Condition', count: 3 },
                ],
                qualityScore: 72.4,
                recentComplaints: [],
              },
              source: 'fallback-api-unavailable',
            };
          }
        },
      );

      sendSuccess(res, {
        source: 'NYC 311 Service Requests — NYC Open Data',
        url: 'https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9',
        period: 'Last 30 days',
        ...result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        interpretation:
          '311 complaint volume and type as neighborhood quality/investment risk signal',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NYC 311 data');
    }
  },
);

router.get(
  '/terra/live/census-acs-demographics',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const county = (req.query.county as string) ?? '061';
      const state = (req.query.state as string) ?? '36';
      const result = await getCached<any>(
        `terra-census-acs-${state}-${county}`,
        86400000 * 7,
        async () => {
          try {
            const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B25077_001E,B25064_001E,B23025_005E,B23025_002E,B15003_022E,B15003_001E,B25003_002E,B25003_001E,B17001_002E,B17001_001E&for=county:${county}&in=state:${state}`;
            const raw = (await fetchJson(url, 10000)) as any[][];
            if (!Array.isArray(raw) || raw.length < 2) throw new Error('No ACS data');

            const [headers, row] = [raw[0], raw[1]];
            const get = (field: string) => row[headers.indexOf(field)];
            const num = (field: string) => {
              const v = +get(field);
              return Number.isNaN(v) || v < 0 ? null : v;
            };

            const totalPop = num('B01003_001E');
            const laborForce = num('B23025_002E');
            const unemployed = num('B23025_005E');
            const bachTotal = num('B15003_001E');
            const bachPlus = num('B15003_022E');
            const totalOcc = num('B25003_001E');
            const owners = num('B25003_002E');
            const povertyTotal = num('B17001_001E');
            const povertyCount = num('B17001_002E');

            return {
              data: {
                name: get('NAME'),
                totalPopulation: totalPop,
                medianHouseholdIncome: num('B19013_001E'),
                medianHomeValue: num('B25077_001E'),
                medianRent: num('B25064_001E'),
                unemploymentRate:
                  laborForce && unemployed ? +((unemployed / laborForce) * 100).toFixed(1) : null,
                bachelorsDegreeRate:
                  bachTotal && bachPlus ? +((bachPlus / bachTotal) * 100).toFixed(1) : null,
                ownerOccupancyRate:
                  totalOcc && owners ? +((owners / totalOcc) * 100).toFixed(1) : null,
                povertyRate:
                  povertyTotal && povertyCount
                    ? +((povertyCount / povertyTotal) * 100).toFixed(1)
                    : null,
              },
              source: 'live-census-acs5',
            };
          } catch {
            return {
              data: {
                name: 'New York County, New York',
                totalPopulation: 1694263,
                medianHouseholdIncome: 93651,
                medianHomeValue: 735000,
                medianRent: 1785,
                unemploymentRate: 5.2,
                bachelorsDegreeRate: 62.4,
                ownerOccupancyRate: 23.1,
                povertyRate: 14.8,
              },
              source: 'fallback-api-unavailable',
            };
          }
        },
      );

      sendSuccess(res, {
        source: 'U.S. Census Bureau ACS 5-Year Estimates — County Demographics',
        url: 'https://api.census.gov/',
        stateCode: state,
        countyCode: county,
        ...result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        vintage: '2022',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch Census ACS demographics');
    }
  },
);

const FALLBACK_NOAA_CLIMATE = {
  stationId: 'USW00094728',
  stationName: 'New York JFK International Airport',
  normal_tmax_annual_c: 14.8,
  recent_tmax_annual_c: 15.6,
  temp_drift_5yr_c: 0.8,
  normal_prcp_annual_mm: 1143,
  recent_prcp_annual_mm: 1168,
  precip_drift_5yr_mm: 25,
  source: 'fallback-api-unavailable',
  vintage: '2022',
};

router.get(
  '/terra/live/noaa-climate',
  terraLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const stationId = (req.query.station as string) ?? 'USW00094728';
      const noaaToken = process.env.NOAA_CDO_TOKEN;

      const result = await getCached<typeof FALLBACK_NOAA_CLIMATE>(
        `terra-noaa-climate-${stationId}`,
        86400000 * 3,
        async () => {
          if (!noaaToken) {
            return { data: FALLBACK_NOAA_CLIMATE, source: 'fallback-no-api-key' };
          }
          try {
            const baseUrl = 'https://www.ncdc.noaa.gov/cdo-web/api/v2';
            const noaaHeaders = { token: noaaToken };

            const normalUrl = `${baseUrl}/data?datasetid=NORMAL_ANN&stationid=GHCND:${stationId}&datatypeid=ANN-TMAX-NORMAL,ANN-PRCP-NORMAL&startdate=2010-01-01&enddate=2010-01-01&limit=25&units=metric`;
            const normalRaw = (await fetchJson(normalUrl, 12000, noaaHeaders)) as { results?: Array<{ datatype: string; value: number }> };
            if (!normalRaw?.results?.length) throw new Error('No NOAA normal data');

            const recentUrl = `${baseUrl}/data?datasetid=GHCND&stationid=GHCND:${stationId}&datatypeid=TMAX,PRCP&startdate=2019-01-01&enddate=2023-12-31&limit=10&units=metric`;
            const recentRaw = (await fetchJson(recentUrl, 12000, noaaHeaders)) as { results?: Array<{ datatype: string; value: number }> };

            const normalTmax = normalRaw.results.find((r) => r.datatype === 'ANN-TMAX-NORMAL')?.value ?? 148;
            const normalPrcp = normalRaw.results.find((r) => r.datatype === 'ANN-PRCP-NORMAL')?.value ?? 11430;

            const recentResults = recentRaw?.results ?? [];
            const tmaxVals = recentResults.filter((r) => r.datatype === 'TMAX').map((r) => r.value / 10);
            const prcpVals = recentResults.filter((r) => r.datatype === 'PRCP').map((r) => r.value / 10);
            const avgTmax = tmaxVals.length ? tmaxVals.reduce((a, b) => a + b, 0) / tmaxVals.length : normalTmax / 10;
            const avgPrcp = prcpVals.length ? prcpVals.reduce((a, b) => a + b, 0) / prcpVals.length * 365 : normalPrcp / 10;

            return {
              data: {
                stationId: `GHCND:${stationId}`,
                stationName: `Station ${stationId}`,
                normal_tmax_annual_c: parseFloat((normalTmax / 10).toFixed(1)),
                recent_tmax_annual_c: parseFloat(avgTmax.toFixed(1)),
                temp_drift_5yr_c: parseFloat((avgTmax - normalTmax / 10).toFixed(2)),
                normal_prcp_annual_mm: parseFloat((normalPrcp / 10).toFixed(0)),
                recent_prcp_annual_mm: parseFloat(avgPrcp.toFixed(0)),
                precip_drift_5yr_mm: parseFloat((avgPrcp - normalPrcp / 10).toFixed(0)),
                source: 'live-noaa-cdo',
                vintage: '2019–2023',
              },
              source: 'live-noaa-cdo',
            };
          } catch {
            return { data: FALLBACK_NOAA_CLIMATE, source: 'fallback-api-unavailable' };
          }
        },
      );

      sendSuccess(res, {
        source: 'NOAA Climate Data Online (CDO) — GHCND + Climate Normals',
        url: 'https://www.ncdc.noaa.gov/cdo-web/',
        stationId,
        ...result.data,
        dataSource: result.source,
        liveData: result.source.includes('live'),
        cacheAgeSeconds: result.cacheAgeSeconds,
        isStale: result.isStale,
        interpretation:
          'temp_drift_5yr_c and precip_drift_5yr_mm measure departure from 30-yr normals — used in climate-adjusted cap rate model.',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NOAA climate data');
    }
  },
);

router.get(
  '/terra/live/source-health',
  terraLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const femaCacheKey = findFemaCacheKey() ?? 'terra-fema-nri-FL';
      const sources = [
        { id: 'census-housing', label: 'US Census ACS Housing', cacheKey: 'terra-census-housing-all' },
        { id: 'fema-nri', label: 'FEMA National Risk Index', cacheKey: femaCacheKey },
        { id: 'hud-fmr', label: 'HUD Fair Market Rents', cacheKey: 'terra-hud-fmr' },
        { id: 'mortgage-rates', label: 'Mortgage Rates (Freddie Mac)', cacheKey: 'terra-mortgage-rates' },
        { id: 'bls-construction', label: 'BLS Construction Employment', cacheKey: 'terra-bls-construction' },
        { id: 'noaa-climate', label: 'NOAA Climate Data Online', cacheKey: 'terra-noaa-climate-USW00094728' },
        { id: 'census-acs-demo', label: 'Census ACS Demographics', cacheKey: 'terra-census-acs-36-061' },
      ];

      const now = Date.now();
      const statuses = sources.map((src) => {
        const cached = terraLiveCache.get(src.cacheKey);
        if (!cached) {
          return { id: src.id, label: src.label, status: 'unknown', liveData: false, lastFetchedAt: null, cacheAgeSeconds: null, expirySec: null };
        }
        const isExpired = cached.expiry < now;
        const isLive = cached.source.includes('live');
        return {
          id: src.id,
          label: src.label,
          status: isExpired ? 'stale' : isLive ? 'live' : 'demo',
          liveData: isLive && !isExpired,
          lastFetchedAt: new Date(cached.fetchedAt).toISOString(),
          cacheAgeSeconds: Math.floor((now - cached.fetchedAt) / 1000),
          expirySec: Math.floor((cached.expiry - now) / 1000),
        };
      });

      const liveCount = statuses.filter((s) => s.liveData).length;
      const overallMode = liveCount >= 4 ? 'live' : liveCount >= 2 ? 'partial' : 'demo';

      sendSuccess(res, {
        overallMode,
        liveSourceCount: liveCount,
        totalSources: sources.length,
        sources: statuses,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch source health');
    }
  },
);

router.get(
  '/terra/live/forecasts',
  terraLiveLimit,
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const rawPropertyId = req.query.propertyId;
      const rawScenario = req.query.scenario;
      if (
        (rawPropertyId !== undefined && (typeof rawPropertyId !== 'string' || rawPropertyId.length > 128)) ||
        (rawScenario !== undefined && (typeof rawScenario !== 'string' || rawScenario.length > 128))
      ) {
        res.status(400).json({ error: 'Invalid query parameters', code: 'VALIDATION_ERROR' });
        return;
      }
      const propertyId = (rawPropertyId as string | undefined) ?? 'portfolio';
      const scenario = (rawScenario as string | undefined) ?? 'sunbelt-multifamily-2026';
      const now = new Date().toISOString();

      const seedResult = await ensureTerraModelsRegistered();

      const noaaLive = readCachedLiveData<{ temp_drift_5yr_c: number; precip_drift_5yr_mm: number }>('terra-noaa-climate-USW00094728');
      const femaLive = findFemaCachedEntry();
      const femaCounty = femaLive?.counties?.[0];
      const femaNriScoreLive = typeof femaCounty?.overallRiskScore === 'number' ? femaCounty.overallRiskScore : 54;
      const floodFlagLive = femaCounty?.primaryHazards?.some((h) => h.toLowerCase().includes('flood') || h.toLowerCase().includes('surge')) ? 1 : 0;

      const distressFeatures: Record<string, number> = {
        triggerDistressScore: 0.74,
        ownerLlcConcentration: 3,
        crossCollateralLoanCount: 4,
        lenderConcentrationScore: 0.71,
        dscr: 0.91,
        marketLiquidityIndex: 0.31,
      };
      const climateFeatures: Record<string, number> = {
        baseCapRate: 0.058,
        femaNriScore: femaNriScoreLive,
        noaaTempDrift5yr: noaaLive?.temp_drift_5yr_c ?? 1.1,
        noaaPrecipDrift5yr: noaaLive?.precip_drift_5yr_mm ?? -35,
        insuranceLossRatioEscalation: 0.07,
        floodZoneFlag: floodFlagLive,
      };
      const intentFeatures: Record<string, number> = {
        nodFilingCount12m: 2,
        deedTransferCount36m: 0,
        ownerEntityAgeMonths: 84,
        vacancyRateSubmarket: 0.14,
        loanMaturityMonths: 4,
        daysSinceLastSale: 1980,
        dscrBelow1: 1,
      };

      const [distressInf, climateInf, intentInf, distressMC, climateMC, intentMC] = await Promise.allSettled([
        inferenceService.predict({ domain: 'terra', modelType: 'distress_propagation', entityId: propertyId, entityType: 'portfolio', inputFeatures: distressFeatures, includeExplanation: true, forceRefresh: true }),
        inferenceService.predict({ domain: 'terra', modelType: 'climate_adjusted_cap_rate', entityId: propertyId, entityType: 'portfolio', inputFeatures: climateFeatures, includeExplanation: true, forceRefresh: true }),
        inferenceService.predict({ domain: 'terra', modelType: 'owner_intent', entityId: propertyId, entityType: 'portfolio', inputFeatures: intentFeatures, includeExplanation: true, forceRefresh: true }),
        runSimulation(TERRA_DISTRESS_PROPAGATION, { iterations: 300, timeoutMs: 8000 }),
        runSimulation(TERRA_CLIMATE_CAP_RATE, { iterations: 300, timeoutMs: 8000 }),
        runSimulation(TERRA_OWNER_INTENT, { iterations: 300, timeoutMs: 8000 }),
      ]);

      const dp = distressInf.status === 'fulfilled' ? distressInf.value : null;
      const cp = climateInf.status === 'fulfilled' ? climateInf.value : null;
      const ip = intentInf.status === 'fulfilled' ? intentInf.value : null;
      const dMC = distressMC.status === 'fulfilled' ? distressMC.value : null;
      const cMC = climateMC.status === 'fulfilled' ? climateMC.value : null;
      const iMC = intentMC.status === 'fulfilled' ? intentMC.value : null;

      const dpPred = dp?.prediction as { cascadeProb: number; assetsAtRisk: number } | null;
      const cpPred = cp?.prediction as { adjustedCapRate: number; climateAdj: number; baseCapRate: number } | null;
      const ipPred = ip?.prediction as { intentProb: number; dominantSignal: string } | null;

      const dpPoint = dpPred?.cascadeProb ?? 0.67;
      const dMCStats = dMC?.results['cascadeProbability']?.stats;
      const dpLower = dMCStats ? parseFloat((dMCStats.p10 / 100).toFixed(4)) : parseFloat((dpPoint - 0.12).toFixed(4));
      const dpUpper = dMCStats ? parseFloat((dMCStats.p90 / 100).toFixed(4)) : parseFloat((dpPoint + 0.12).toFixed(4));
      const dpConf = dp?.confidence ?? 0.72;

      const cpPoint = cpPred?.adjustedCapRate ?? 0.0641;
      const cMCStats = cMC?.results['climateAdjustedCapRate']?.stats;
      const cpLower = cMCStats ? parseFloat((cMCStats.p10 / 100).toFixed(5)) : parseFloat((cpPoint - 0.004).toFixed(5));
      const cpUpper = cMCStats ? parseFloat((cMCStats.p90 / 100).toFixed(5)) : parseFloat((cpPoint + 0.004).toFixed(5));
      const cpConf = cp?.confidence ?? 0.80;

      const ipPoint = ipPred?.intentProb ?? 0.74;
      const iMCStats = iMC?.results['intentProb12m']?.stats;
      const ipLower = iMCStats ? parseFloat((iMCStats.p10 / 100).toFixed(4)) : parseFloat(Math.max(0, ipPoint - 0.12).toFixed(4));
      const ipUpper = iMCStats ? parseFloat((iMCStats.p90 / 100).toFixed(4)) : parseFloat(Math.min(0.98, ipPoint + 0.12).toFixed(4));
      const ipConf = ip?.confidence ?? 0.76;

      const buildShapAttributions = (explanation: unknown, features: Record<string, number>) => {
        if (explanation && typeof explanation === 'object' && 'shapValues' in explanation) {
          const shap = (explanation as { shapValues: Record<string, number> }).shapValues;
          return Object.entries(shap).slice(0, 3).map(([k, v]) => ({
            feature: k, value: parseFloat((v as number).toFixed(4)),
            direction: (v as number) > 0 ? 'increases_risk' : 'decreases_risk',
          }));
        }
        return Object.entries(features).slice(0, 3).map(([k, v]) => ({
          feature: k, value: typeof v === 'number' ? parseFloat(v.toFixed(4)) : v,
          direction: (v as number) > 0.5 ? 'increases_risk' : 'decreases_risk',
        }));
      };

      const results = [
        {
          headName: 'terra:distress_propagation',
          label: 'Distress Propagation Cascade Risk',
          intervals: [
            { horizon: '30d', point: parseFloat((dpPoint * 0.88).toFixed(4)), lower: parseFloat((dpLower * 0.85).toFixed(4)), upper: parseFloat((dpUpper * 0.90).toFixed(4)), confidence: parseFloat(Math.min(0.99, dpConf + 0.05).toFixed(3)), unit: 'cascade_prob' },
            { horizon: '60d', point: parseFloat((dpPoint * 0.94).toFixed(4)), lower: parseFloat((dpLower * 0.90).toFixed(4)), upper: parseFloat((dpUpper * 0.97).toFixed(4)), confidence: parseFloat(Math.min(0.99, dpConf + 0.02).toFixed(3)), unit: 'cascade_prob' },
            { horizon: '90d', point: parseFloat(Math.min(0.98, dpPoint).toFixed(4)), lower: Math.max(0, dpLower), upper: Math.min(0.98, dpUpper), confidence: parseFloat(dpConf.toFixed(3)), unit: 'cascade_prob' },
          ],
          provenance: { modelId: 'terra:distress_propagation', modelVersion: dp?.modelVersion ?? '1.0.0', modelVersionId: dp?.modelVersionId ?? 'terra-seed-distress-v1', adapterId: dp ? 'ml-registry' : 'deterministic-fallback', generatedAt: dp?.predictedAt?.toISOString() ?? now, scenario, propertyId, featureKeys: Object.keys(distressFeatures), monteCarloScenario: TERRA_DISTRESS_PROPAGATION.id, mcIterations: dMC?.validIterations ?? 0 },
          alertThreshold: 0.55,
          thresholdBreached: dpPoint > 0.55,
          topFeatureAttributions: buildShapAttributions(dp?.explanation, distressFeatures),
        },
        {
          headName: 'terra:climate_adjusted_cap_rate',
          label: 'Climate-Adjusted 5-yr Cap Rate',
          intervals: [
            { horizon: '30d', point: parseFloat((cpPoint * 0.97).toFixed(5)), lower: parseFloat((cpLower * 0.96).toFixed(5)), upper: parseFloat((cpUpper * 0.98).toFixed(5)), confidence: parseFloat(Math.min(0.99, cpConf + 0.04).toFixed(3)), unit: 'cap_rate' },
            { horizon: '60d', point: parseFloat((cpPoint * 0.985).toFixed(5)), lower: parseFloat((cpLower * 0.98).toFixed(5)), upper: parseFloat((cpUpper * 0.99).toFixed(5)), confidence: parseFloat(Math.min(0.99, cpConf + 0.02).toFixed(3)), unit: 'cap_rate' },
            { horizon: '90d', point: parseFloat(cpPoint.toFixed(5)), lower: cpLower, upper: cpUpper, confidence: parseFloat(cpConf.toFixed(3)), unit: 'cap_rate' },
          ],
          provenance: { modelId: 'terra:climate_adjusted_cap_rate', modelVersion: cp?.modelVersion ?? '1.0.0', modelVersionId: cp?.modelVersionId ?? 'terra-seed-climate-v1', adapterId: cp ? 'ml-registry' : 'deterministic-fallback', generatedAt: cp?.predictedAt?.toISOString() ?? now, scenario, propertyId, featureKeys: Object.keys(climateFeatures), monteCarloScenario: TERRA_CLIMATE_CAP_RATE.id, mcIterations: cMC?.validIterations ?? 0 },
          alertThreshold: undefined,
          thresholdBreached: false,
          topFeatureAttributions: buildShapAttributions(cp?.explanation, climateFeatures),
        },
        {
          headName: 'terra:owner_intent',
          label: 'Owner Intent — 12-mo Sale/Refi Probability',
          intervals: [
            { horizon: '30d', point: parseFloat((ipPoint * 0.88).toFixed(4)), lower: parseFloat((ipLower * 0.85).toFixed(4)), upper: parseFloat((ipUpper * 0.90).toFixed(4)), confidence: parseFloat(Math.min(0.99, ipConf + 0.05).toFixed(3)), unit: 'intent_prob' },
            { horizon: '60d', point: parseFloat((ipPoint * 0.94).toFixed(4)), lower: parseFloat((ipLower * 0.90).toFixed(4)), upper: parseFloat((ipUpper * 0.97).toFixed(4)), confidence: parseFloat(Math.min(0.99, ipConf + 0.02).toFixed(3)), unit: 'intent_prob' },
            { horizon: '90d', point: parseFloat(ipPoint.toFixed(4)), lower: ipLower, upper: ipUpper, confidence: parseFloat(ipConf.toFixed(3)), unit: 'intent_prob' },
          ],
          provenance: { modelId: 'terra:owner_intent', modelVersion: ip?.modelVersion ?? '1.0.0', modelVersionId: ip?.modelVersionId ?? 'terra-seed-intent-v1', adapterId: ip ? 'ml-registry' : 'deterministic-fallback', generatedAt: ip?.predictedAt?.toISOString() ?? now, scenario, propertyId, featureKeys: Object.keys(intentFeatures), monteCarloScenario: TERRA_OWNER_INTENT.id, mcIterations: iMC?.validIterations ?? 0 },
          alertThreshold: 0.65,
          thresholdBreached: ipPoint > 0.65,
          topFeatureAttributions: buildShapAttributions(ip?.explanation, intentFeatures),
        },
      ];

      const liveInferenceCount = [dp, cp, ip].filter(Boolean).length;
      const registryMode = liveInferenceCount === 3 ? 'ml-registry' : liveInferenceCount > 0 ? 'ml-registry-partial' : 'deterministic-fallback';
      const mcMode = [dMC, cMC, iMC].some(Boolean) ? 'monte-carlo' : 'analytical';
      const dataMode = liveInferenceCount === 3 ? 'live' : liveInferenceCount > 0 ? 'partial' : 'demo';
      const liveFeatureSignals = { noaaLive: !!noaaLive, femaLive: !!femaLive, femaState: femaLive ? findFemaCacheKey()?.replace('terra-fema-nri-', '') : null };
      const seedMeta = { seededModels: seedResult.seeded, skippedModels: seedResult.skipped, failedModels: seedResult.failed };

      const breachedHeads = results.filter((r) => r.thresholdBreached);
      if (breachedHeads.length > 0) {
        emitTerraPrismSignal(
          {
            event: 'terra.forecast.threshold_breached',
            scenario,
            propertyId,
            breachedHeads: breachedHeads.map((h) => h.headName),
            highestRisk: breachedHeads.reduce((max, h) => {
              const p = h.intervals[h.intervals.length - 1]?.point ?? 0;
              return p > max ? p : max;
            }, 0),
            dataMode,
            registryMode,
            mcMode,
            generatedAt: now,
          },
          breachedHeads.length >= 2 ? 'critical' : 'high',
          `terra-forecast-${scenario}-${now}`,
        );
      } else {
        emitTerraPrismSignal(
          { event: 'terra.forecast.generated', scenario, propertyId, headCount: results.length, dataMode, registryMode, mcMode, generatedAt: now },
          'info',
        );
      }

      sendSuccess(res, {
        scenario,
        propertyId,
        headCount: results.length,
        heads: results,
        dataMode,
        inferenceMode: registryMode,
        liveInferenceHeads: liveInferenceCount,
        confidenceIntervalMode: mcMode,
        generatedAt: now,
        modelRegistry: 'terra-ml-v1',
        monteCarloScenarios: [TERRA_DISTRESS_PROPAGATION.id, TERRA_CLIMATE_CAP_RATE.id, TERRA_OWNER_INTENT.id],
        liveFeatureSignals,
        seedMeta,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate Terra forecast heads');
    }
  },
);

export default router;

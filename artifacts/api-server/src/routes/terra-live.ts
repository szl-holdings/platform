import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { getIngestionStats } from '../lib/terra-distress-service';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

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
          source: 'stale-' + stale.source,
          cacheAgeSeconds: Math.floor((now - stale.fetchedAt) / 1000),
          isStale: true,
        };
      throw new Error('Data unavailable');
    });
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-Terra/1.0', Accept: 'application/json' },
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
        { borough: 'Manhattan', count: boroughMap['Manhattan'] ?? 0, icon: '🏙️' },
        { borough: 'Brooklyn', count: boroughMap['Brooklyn'] ?? 0, icon: '🌉' },
        { borough: 'Queens', count: boroughMap['Queens'] ?? 0, icon: '✈️' },
        { borough: 'Bronx', count: boroughMap['Bronx'] ?? 0, icon: '🏟️' },
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
              count: typeMap['foreclosure'] ?? 0,
              urgency: 'critical',
            },
            { signal: 'Tax Liens', count: typeMap['tax-lien'] ?? 0, urgency: 'medium' },
            { signal: 'REO / Bank-Owned', count: typeMap['reo'] ?? 0, urgency: 'high' },
            { signal: 'Auction Scheduled', count: typeMap['auction'] ?? 0, urgency: 'critical' },
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
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const result = await getCached<any>(
        `terra-nyc-311-${neighborhood}`,
        60 * 60 * 1000,
        async () => {
          try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000)
              .toISOString()
              .split('T')[0];
            const encoded = encodeURIComponent(neighborhood);
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
              return isNaN(v) || v < 0 ? null : v;
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

export default router;

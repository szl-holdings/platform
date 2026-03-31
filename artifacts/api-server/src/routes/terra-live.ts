import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { getIngestionStats } from "../lib/terra-distress-service";

const router: IRouter = Router();

const terraLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terra Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const terraLiveCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = terraLiveCache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    terraLiveCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = terraLiveCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Terra/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const DEMO_MORTGAGE_RATES = {
  rate30yr: 7.12,
  rate15yr: 6.48,
  rateArm5: 6.35,
  weeklyChange30yr: +0.08,
  source: "demo",
  asOf: new Date().toISOString().slice(0, 10),
};

const DEMO_CENSUS_STATS = [
  { msaCode: "35620", name: "New York-Newark-Jersey City", population: 20140470, medianHouseholdIncome: 82461, medianHomeValue: 519800, ownerOccupancyRate: 50.4, rentalVacancyRate: 4.1, source: "demo" },
  { msaCode: "12420", name: "Austin-Round Rock-Georgetown", population: 2295303, medianHouseholdIncome: 86091, medianHomeValue: 385600, ownerOccupancyRate: 58.2, rentalVacancyRate: 6.8, source: "demo" },
  { msaCode: "33100", name: "Miami-Fort Lauderdale-Pompano Beach", population: 6183099, medianHouseholdIncome: 61834, medianHomeValue: 428100, ownerOccupancyRate: 62.1, rentalVacancyRate: 3.7, source: "demo" },
  { msaCode: "38060", name: "Phoenix-Mesa-Chandler", population: 5030213, medianHouseholdIncome: 73248, medianHomeValue: 341700, ownerOccupancyRate: 63.8, rentalVacancyRate: 5.9, source: "demo" },
  { msaCode: "42660", name: "Seattle-Tacoma-Bellevue", population: 4018762, medianHouseholdIncome: 104978, medianHomeValue: 638900, ownerOccupancyRate: 55.6, rentalVacancyRate: 3.2, source: "demo" },
];

const DEMO_HUD_FAIR_MARKET = [
  { area: "New York, NY MSA", year: 2025, studio: 1900, oneBed: 2180, twoBed: 2520, threeBed: 3180, fourBed: 3750, source: "demo" },
  { area: "Austin, TX MSA", year: 2025, studio: 1180, oneBed: 1380, twoBed: 1700, threeBed: 2320, fourBed: 2710, source: "demo" },
  { area: "Miami, FL MSA", year: 2025, studio: 1540, oneBed: 1720, twoBed: 2120, threeBed: 2980, fourBed: 3560, source: "demo" },
  { area: "Phoenix, AZ MSA", year: 2025, studio: 1150, oneBed: 1380, twoBed: 1680, threeBed: 2250, fourBed: 2640, source: "demo" },
  { area: "Seattle, WA MSA", year: 2025, studio: 1620, oneBed: 1890, twoBed: 2310, threeBed: 3120, fourBed: 3740, source: "demo" },
];

router.get("/terra/live/census-housing", terraLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const msaCode = req.query.msa as string;
    const data = await getCached(`terra-census-housing-${msaCode ?? "all"}`, 86400000, async () => {
      try {
        const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B25077_001E,B19013_001E,B25003_002E,B25003_001E,B25004_003E&for=metropolitan+statistical+area/micropolitan+statistical+area:12420,33100,35620,38060,42660&key=DEMO`;
        const raw = await fetchJson(url, 10000) as any[];
        if (!Array.isArray(raw) || raw.length < 2) throw new Error("No Census data");
        const headers = raw[0];
        const nameIdx = headers.indexOf("NAME");
        const medHomeIdx = headers.indexOf("B25077_001E");
        const medIncIdx = headers.indexOf("B19013_001E");
        const ownerIdx = headers.indexOf("B25003_002E");
        const totalOccIdx = headers.indexOf("B25003_001E");
        const vacIdx = headers.indexOf("B25004_003E");
        const msaIdx = headers.indexOf("metropolitan statistical area/micropolitan statistical area");
        const stats = raw.slice(1).map((row: any[]) => {
          const ownerRate = totalOccIdx >= 0 && ownerIdx >= 0 && +row[totalOccIdx] > 0
            ? ((+row[ownerIdx] / +row[totalOccIdx]) * 100).toFixed(1)
            : null;
          return {
            msaCode: row[msaIdx],
            name: row[nameIdx]?.replace(" Metro Area", "").replace(" Metropolitan Statistical Area", "") ?? "MSA",
            medianHomeValue: +row[medHomeIdx] > 0 ? +row[medHomeIdx] : null,
            medianHouseholdIncome: +row[medIncIdx] > 0 ? +row[medIncIdx] : null,
            ownerOccupancyRate: ownerRate ? +ownerRate : null,
            rentalVacancyRate: +row[vacIdx] > 0 ? +row[vacIdx] : null,
            source: "live",
          };
        });
        return { stats, source: "live" };
      } catch {
        const filtered = msaCode ? DEMO_CENSUS_STATS.filter(s => s.msaCode === msaCode) : DEMO_CENSUS_STATS;
        return { stats: filtered, source: "demo" };
      }
    }) as any;

    const filtered = msaCode ? data.stats.filter((s: any) => s.msaCode === msaCode) : data.stats;
    sendSuccess(res, {
      source: "U.S. Census Bureau ACS 5-Year Estimates",
      url: "https://api.census.gov/",
      count: filtered.length,
      stats: filtered,
      dataSource: data.source,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Census housing data"); }
});

router.get("/terra/live/hud-fair-market-rents", terraLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("terra-hud-fmr", 86400000 * 7, async () => {
      try {
        const raw = await fetchJson("https://www.huduser.gov/hudapi/public/fmr/listMetroAreas", 10000) as any;
        if (!Array.isArray(raw?.data)) throw new Error("No HUD data");
        const keyAreas = raw.data.filter((a: any) =>
          /new york|austin|miami|phoenix|seattle/i.test(a.area_name)
        ).slice(0, 5);
        if (keyAreas.length === 0) throw new Error("No key areas found");
        return { rents: keyAreas.map((a: any) => ({ area: a.area_name, year: a.year, ...a, source: "live" })), source: "live" };
      } catch {
        return { rents: DEMO_HUD_FAIR_MARKET, source: "demo" };
      }
    }) as any;

    sendSuccess(res, {
      source: "HUD Fair Market Rents (FMR) — Public API",
      url: "https://www.huduser.gov/portal/dataset/fmr-api.html",
      count: data.rents.length,
      rents: data.rents,
      dataSource: data.source,
      liveData: data.source === "live",
      methodology: "HUD calculates FMRs as the 40th percentile of rents for standard-quality units in each area",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch HUD Fair Market Rent data"); }
});

router.get("/terra/live/mortgage-rates", terraLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("terra-mortgage-rates", 3600000 * 6, async () => {
      try {
        const raw = await fetchJson(
          "https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=DEMO_KEY&limit=4&sort_order=desc&file_type=json",
          10000,
        ) as any;
        if (!Array.isArray(raw?.observations) || raw.observations.length === 0) throw new Error("No FRED data");
        const obs = raw.observations.filter((o: any) => o.value !== ".");
        if (obs.length < 2) throw new Error("Insufficient FRED data");
        const latest = obs[0];
        const prev = obs[1];
        const rate = parseFloat(latest.value);
        const prevRate = parseFloat(prev.value);
        return {
          rate30yr: rate,
          prevRate30yr: prevRate,
          weeklyChange30yr: +(rate - prevRate).toFixed(2),
          asOf: latest.date,
          historicalData: obs.slice(0, 4).map((o: any) => ({ date: o.date, rate: parseFloat(o.value) })),
          source: "live",
        };
      } catch {
        return DEMO_MORTGAGE_RATES;
      }
    }) as any;

    sendSuccess(res, {
      source: "FRED (Federal Reserve Economic Data) — Primary Mortgage Market Survey",
      url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
      data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch mortgage rate data"); }
});

router.get("/terra/live/bls-construction", terraLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("terra-bls-construction", 86400000, async () => {
      try {
        const raw = await fetchJson(
          "https://api.bls.gov/publicAPI/v2/timeseries/data/CES2000000001",
          10000,
        ) as any;
        if (raw?.status !== "REQUEST_SUCCEEDED") throw new Error("BLS API error");
        const series = raw?.Results?.series?.[0]?.data;
        if (!Array.isArray(series) || series.length === 0) throw new Error("No BLS data");
        const latest = series[0];
        const prev = series[1];
        return {
          constructionEmployment: parseFloat(latest.value) * 1000,
          period: `${latest.periodName} ${latest.year}`,
          monthlyChange: ((parseFloat(latest.value) - parseFloat(prev?.value ?? latest.value)) * 1000).toFixed(0),
          trend: parseFloat(latest.value) > parseFloat(prev?.value ?? "0") ? "growing" : "contracting",
          historicalData: series.slice(0, 12).map((d: any) => ({
            period: `${d.periodName} ${d.year}`,
            employment: parseFloat(d.value) * 1000,
          })),
          source: "live",
        };
      } catch {
        return {
          constructionEmployment: 8142000,
          period: "February 2026",
          monthlyChange: "+14000",
          trend: "growing",
          historicalData: [
            { period: "Feb 2026", employment: 8142000 },
            { period: "Jan 2026", employment: 8128000 },
            { period: "Dec 2025", employment: 8105000 },
          ],
          source: "demo",
        };
      }
    }) as any;

    sendSuccess(res, {
      source: "Bureau of Labor Statistics — Construction Employment (CES2000000001)",
      url: "https://www.bls.gov/",
      data,
      liveData: data.source === "live",
      significance: "Construction employment is a leading indicator of new housing supply",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch BLS construction employment"); }
});

router.get("/terra/live/fema-nri", terraLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const stateAbbr = (req.query.state as string)?.toUpperCase() ?? "FL";
    const data = await getCached(`terra-fema-nri-${stateAbbr}`, 86400000 * 30, async () => {
      try {
        const raw = await fetchJson(
          `https://hazards.fema.gov/nri/api/counties?stateAbbreviation=${stateAbbr}&top=5`,
          12000,
        ) as any;
        if (!Array.isArray(raw?.items) || raw.items.length === 0) throw new Error("No FEMA NRI data");
        return {
          counties: raw.items.map((c: any) => ({
            countyName: c.county,
            state: c.stateAbbreviation,
            overallRiskScore: c.riskScore ?? null,
            riskRating: c.risk ?? "Unknown",
            expectedAnnualLoss: c.eal ?? null,
            socialVulnerability: c.socialVulnerability ?? null,
            communityResilience: c.communityResilience ?? null,
            primaryHazards: [c.hazardType1, c.hazardType2].filter(Boolean),
          })),
          source: "live",
        };
      } catch {
        const demoData: Record<string, any> = {
          FL: {
            counties: [
              { countyName: "Miami-Dade", state: "FL", overallRiskScore: 88.2, riskRating: "Very High", expectedAnnualLoss: 4281000000, socialVulnerability: "Medium", communityResilience: "Relatively Low", primaryHazards: ["Hurricane", "Coastal Flooding"] },
              { countyName: "Broward", state: "FL", overallRiskScore: 82.1, riskRating: "Very High", expectedAnnualLoss: 2940000000, socialVulnerability: "Medium", communityResilience: "Medium", primaryHazards: ["Hurricane", "Storm Surge"] },
            ],
            source: "demo",
          },
          CA: {
            counties: [
              { countyName: "Los Angeles", state: "CA", overallRiskScore: 71.4, riskRating: "High", expectedAnnualLoss: 5820000000, socialVulnerability: "Medium", communityResilience: "Relatively Low", primaryHazards: ["Wildfire", "Earthquake"] },
              { countyName: "San Diego", state: "CA", overallRiskScore: 62.8, riskRating: "High", expectedAnnualLoss: 2180000000, socialVulnerability: "Medium", communityResilience: "Medium", primaryHazards: ["Wildfire", "Earthquake"] },
            ],
            source: "demo",
          },
        };
        return demoData[stateAbbr] ?? {
          counties: [
            { countyName: `${stateAbbr} County 1`, state: stateAbbr, overallRiskScore: 45.0, riskRating: "Moderate", expectedAnnualLoss: 820000000, socialVulnerability: "Medium", communityResilience: "Medium", primaryHazards: ["Severe Weather"] },
          ],
          source: "demo",
        };
      }
    }) as any;

    sendSuccess(res, {
      source: "FEMA National Risk Index (NRI) API",
      url: "https://hazards.fema.gov/nri/",
      state: stateAbbr,
      count: data.counties.length,
      counties: data.counties,
      dataSource: data.source,
      liveData: data.source === "live",
      methodology: "FEMA NRI composite score combining hazard frequency, social vulnerability, and community resilience",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch FEMA NRI data"); }
});

router.get("/terra/live/nyc-dashboard", terraLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const stats = await getIngestionStats();

    const boroughMap = stats.byBorough as Record<string, number>;
    const typeMap = stats.byDistressType as Record<string, number>;

    const totalProperties = stats.totalProperties as number;
    const lastRun = Array.isArray(stats.recentRuns) && stats.recentRuns.length > 0 ? stats.recentRuns[0] : null;

    const boroughBreakdown = [
      { borough: "Manhattan", count: boroughMap["Manhattan"] ?? 0, icon: "🏙️" },
      { borough: "Brooklyn", count: boroughMap["Brooklyn"] ?? 0, icon: "🌉" },
      { borough: "Queens", count: boroughMap["Queens"] ?? 0, icon: "✈️" },
      { borough: "Bronx", count: boroughMap["Bronx"] ?? 0, icon: "🏟️" },
      { borough: "Staten Island", count: boroughMap["Staten Island"] ?? 0, icon: "⛴️" },
    ].sort((a, b) => b.count - a.count);

    const distressBreakdown = Object.entries(typeMap).map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const recentRunSummary = lastRun ? {
      runId: (lastRun as any).id,
      source: (lastRun as any).source,
      status: (lastRun as any).status,
      recordsInserted: (lastRun as any).recordsInserted,
      alertsGenerated: (lastRun as any).alertsGenerated,
      startedAt: (lastRun as any).startedAt,
      completedAt: (lastRun as any).completedAt,
    } : null;

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
      source: "Terra NYC Intelligence Dashboard — Live Ingestion Stats",
      connectors: [
        "NYC ACRIS Real Property Master (bnx9-e6tj)",
        "NYC ACRIS Legals (8h5j-fqxa)",
        "NYC ACRIS Parties (636b-3b5g)",
        "NYC Rolling Property Sales (usep-8jbt)",
        "NYC Tax Lien Sale List (9rz4-mjek)",
        "NYC Property Valuation & Assessment (8y4t-faws)",
        "NYC HPD Violations (wvxf-dwi5)",
        "NYC HPD Complaints (uwyv-629c)",
        "NYC DOB Violations (3h2n-5cm9)",
        "NYC 311 Property Complaints (erm2-nwe9)",
      ],
      dashboard: {
        totalProperties,
        newFilings7d,
        boroughBreakdown,
        distressBreakdown,
        topOpportunitySignals: [
          { signal: "Lis Pendens Filings", count: typeMap["pre-foreclosure"] ?? 0, urgency: "high" },
          { signal: "Active Foreclosures", count: typeMap["foreclosure"] ?? 0, urgency: "critical" },
          { signal: "Tax Liens", count: typeMap["tax-lien"] ?? 0, urgency: "medium" },
          { signal: "REO / Bank-Owned", count: typeMap["reo"] ?? 0, urgency: "high" },
          { signal: "Auction Scheduled", count: typeMap["auction"] ?? 0, urgency: "critical" },
        ].filter(s => s.count > 0),
        recentIngestionRun: recentRunSummary,
        dataFreshness: lastRun ? (lastRun as any).completedAt ?? (lastRun as any).startedAt : null,
      },
      liveData: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NYC dashboard stats"); }
});

export default router;

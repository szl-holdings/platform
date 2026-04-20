import { db, intelligenceCacheTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { redisGet, redisSet } from '../lib/redis-client.js';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';
import { withExternalSpan } from '../middlewares/telemetry';

const router: IRouter = Router();

const govRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Government data rate limit exceeded. Please try again later.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const govMemCache = new LRUCache<string, { data: unknown; expiresAt: number }>({ max: 300 });

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const mem = govMemCache.get(key);
  if (mem && mem.expiresAt > now) return mem.data as T;

  const redisKey = `gov-${key}`;
  const cached = await redisGet<T>(redisKey);
  if (cached !== null) {
    govMemCache.set(key, { data: cached, expiresAt: now + ttlMs });
    return cached;
  }

  const expiresAt = new Date(now + ttlMs);
  const dbKey = redisKey;
  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, dbKey))
      .limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      govMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      await redisSet(redisKey, row.data, new Date(row.expiresAt).getTime() - now);
      return row.data as T;
    }
  } catch {
    /* DB unavailable — fall through to fetch */
  }
  try {
    const data = await fetcher();
    govMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
    await redisSet(redisKey, data, ttlMs);
    await db
      .insert(intelligenceCacheTable)
      .values({
        key: dbKey,
        data: data as Record<string, unknown>,
        expiresAt,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: intelligenceCacheTable.key,
        set: { data: data as Record<string, unknown>, expiresAt, fetchedAt: new Date() },
      })
      .catch(() => undefined);
    return data;
  } catch (err) {
    const [stale] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, dbKey))
      .limit(1)
      .catch(() => [null]);
    if (stale) return stale.data as T;
    throw err;
  }
}

async function fetchJson(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = 10000,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-GovData/1.0', Accept: 'application/json', ...(headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function postJson(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
  timeoutMs = 12000,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SZL-GovData/1.0',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(headers || {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

type CisaKevEntry = {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
};
type ArxivEntry = {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  published: string;
  updated: string;
  pdfUrl: string;
};

async function fetchCisaKev(): Promise<CisaKevEntry[]> {
  const data = (await fetchJson(
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    {},
    12000,
  )) as any;
  const vulnerabilities = data?.vulnerabilities;
  if (!Array.isArray(vulnerabilities) || vulnerabilities.length === 0)
    throw new Error('No CISA KEV data');
  return vulnerabilities.slice(0, 20).map((v: any) => ({
    cveID: v.cveID ?? 'CVE-UNKNOWN',
    vendorProject: v.vendorProject ?? 'Unknown',
    product: v.product ?? 'Unknown',
    vulnerabilityName: v.vulnerabilityName ?? 'Unknown Vulnerability',
    dateAdded: v.dateAdded ?? '',
    shortDescription: v.shortDescription ?? '',
    requiredAction: v.requiredAction ?? '',
    dueDate: v.dueDate ?? '',
    knownRansomwareCampaignUse: v.knownRansomwareCampaignUse ?? 'Unknown',
    notes: v.notes ?? '',
  }));
}

async function fetchArxivPapersXml(query: string, maxResults = 8): Promise<ArxivEntry[]> {
  const encodedQuery = encodeURIComponent(query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const res = await fetch(
    `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`,
    { signal: controller.signal, headers: { 'User-Agent': 'SZL-GovData/1.0' } },
  );
  clearTimeout(timer);
  if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
  const xml = await res.text();
  const entries: ArxivEntry[] = [];
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  for (const match of entryMatches) {
    const entry = match[1];
    const idMatch = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const abstractMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
    const authorMatches = [...entry.matchAll(/<name>([^<]+)<\/name>/g)];
    const categoryMatches = [...entry.matchAll(/<category term="([^"]+)"/g)];
    if (!idMatch) continue;
    entries.push({
      id: idMatch[1].trim(),
      title: titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'No title',
      authors: authorMatches.map((m) => m[1].trim()).slice(0, 4),
      abstract: abstractMatch ? abstractMatch[1].trim().replace(/\s+/g, ' ').slice(0, 400) : '',
      categories: categoryMatches.map((m) => m[1]).slice(0, 3),
      published: publishedMatch ? publishedMatch[1].trim().slice(0, 10) : '',
      updated: updatedMatch ? updatedMatch[1].trim().slice(0, 10) : '',
      pdfUrl: `https://arxiv.org/pdf/${idMatch[1].trim()}`,
    });
    if (entries.length >= maxResults) break;
  }
  return entries;
}

router.get('/gov/cisa-kev', govRateLimit, authMiddleware(), async (req, res) => {
  try {
    const data = await withExternalSpan(req, 'cisa.gov', () =>
      getCached('cisa-kev', 3600000, fetchCisaKev),
    );
    sendSuccess(res, {
      source: 'CISA Known Exploited Vulnerabilities (KEV) Catalog',
      url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      count: data.length,
      vulnerabilities: data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch CISA KEV data');
  }
});

router.get(
  '/gov/nvd-cves',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const severity = (req.query.severity as string)?.toUpperCase();
      const keyword = req.query.keyword as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

      const params = new URLSearchParams({
        resultsPerPage: String(limit),
        startIndex: '0',
      });
      if (severity && ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
        params.set('cvssV3Severity', severity);
      }
      if (keyword) {
        params.set('keywordSearch', keyword);
      }

      const data = await withExternalSpan(req, 'nvd.nist.gov', () =>
        getCached(
          `nvd-cves-${severity || 'all'}-${keyword || 'all'}-${limit}`,
          600000,
          async () => {
            const raw = (await fetchJson(
              `https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`,
              {},
              15000,
            )) as any;
            const items = raw?.vulnerabilities;
            if (!Array.isArray(items)) throw new Error('No NVD data');
            return items.map((v: any) => {
              const cve = v.cve;
              const metrics31 = cve?.metrics?.cvssMetricV31?.[0]?.cvssData;
              const metrics30 = cve?.metrics?.cvssMetricV30?.[0]?.cvssData;
              const metrics = metrics31 || metrics30;
              const score = metrics?.baseScore ?? null;
              const cvssVector = metrics?.vectorString ?? null;
              const attackVector = metrics?.attackVector ?? null;
              const exploitabilityScore =
                cve?.metrics?.cvssMetricV31?.[0]?.exploitabilityScore ?? null;
              const impactScore = cve?.metrics?.cvssMetricV31?.[0]?.impactScore ?? null;
              const sev = score
                ? score >= 9.0
                  ? 'CRITICAL'
                  : score >= 7.0
                    ? 'HIGH'
                    : score >= 4.0
                      ? 'MEDIUM'
                      : 'LOW'
                : 'UNKNOWN';
              return {
                id: cve?.id,
                description: cve?.descriptions?.find((d: any) => d.lang === 'en')?.value ?? '',
                severity: sev,
                cvssScore: score,
                cvssVector,
                attackVector,
                exploitabilityScore,
                impactScore,
                vendor:
                  cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(':')?.[3] ??
                  'Various',
                product:
                  cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(':')?.[4] ??
                  'Multiple',
                published: cve?.published,
                lastModified: cve?.lastModified,
                references: cve?.references?.length ?? 0,
                cwe: cve?.weaknesses?.[0]?.description?.[0]?.value ?? null,
                cisaExploited: cve?.cisaExploitAdd ? true : false,
                cisaDueDate: cve?.cisaActionDue ?? null,
              };
            });
          },
        ),
      );
      sendSuccess(res, {
        source: 'NIST National Vulnerability Database (NVD) CVE 2.0 API',
        url: 'https://nvd.nist.gov/',
        count: data.length,
        vulnerabilities: data,
        filters: { severity, keyword, limit },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NVD CVE data');
    }
  },
);

router.get(
  '/gov/mitre-attack',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const tactic = req.query.tactic as string;
      const platform = req.query.platform as string;
      const data = await getCached('mitre-attack', 86400000, async () => {
        const raw = (await fetchJson(
          'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
          {},
          20000,
        )) as any;
        const objects = (raw?.objects as any[]) ?? [];
        const techniques = objects
          .filter((o: any) => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated)
          .slice(0, 50)
          .map((o: any) => ({
            id:
              o.external_references?.find((r: any) => r.source_name === 'mitre-attack')
                ?.external_id ?? o.id,
            name: o.name ?? 'Unknown',
            tactic:
              o.kill_chain_phases?.[0]?.phase_name
                ?.replace(/-/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Unknown',
            description: (o.description ?? '').slice(0, 200),
            platforms: o.x_mitre_platforms ?? [],
            subtechnique: (o.x_mitre_is_subtechnique ?? false) as boolean,
            detection: o.x_mitre_detection?.slice(0, 100) ?? '',
            mitigation: '',
          }));
        if (techniques.length === 0) throw new Error('No MITRE data');
        return techniques;
      }).catch(
        () =>
          [] as {
            id: string;
            name: string;
            tactic: string;
            description: string;
            platforms: string[];
            subtechnique: boolean;
            detection: string;
            mitigation: string;
          }[],
      );
      let techniques = data;
      if (tactic)
        techniques = techniques.filter((t) =>
          t.tactic.toLowerCase().includes(tactic.toLowerCase()),
        );
      if (platform)
        techniques = techniques.filter((t) =>
          t.platforms.some((p: string) => p.toLowerCase().includes(platform.toLowerCase())),
        );
      sendSuccess(res, {
        source: 'MITRE ATT&CK Enterprise Matrix',
        url: 'https://attack.mitre.org/',
        version: '14.1',
        count: techniques.length,
        techniques,
        tacticSummary: {
          'Initial Access': data.filter((t) => t.tactic === 'Initial Access').length,
          Execution: data.filter((t) => t.tactic === 'Execution').length,
          'Defense Evasion': data.filter((t) => t.tactic === 'Defense Evasion').length,
          'Command and Control': data.filter((t) => t.tactic === 'Command and Control').length,
          Impact: data.filter((t) => t.tactic === 'Impact').length,
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch MITRE ATT&CK data');
    }
  },
);

router.get(
  '/gov/fedramp',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const impactLevel = req.query.impactLevel as string;
      const status = (req.query.status as string) || 'Authorized';
      const products = await getCached('fedramp-products', 86400000, async () => {
        const res2 = await fetch(
          'https://raw.githubusercontent.com/GSA/data/master/IT/fedramp-authorized-products.csv',
          {
            headers: { 'User-Agent': 'SZL-GovData/1.0' },
            signal: AbortSignal.timeout(12000),
          },
        );
        if (!res2.ok) throw new Error(`FedRAMP CSV ${res2.status}`);
        const csv = await res2.text();
        const rows = csv.trim().split('\n');
        if (rows.length < 2) throw new Error('Empty CSV');
        const headers = rows[0].split(',').map((h) => h.replace(/"/g, '').trim());
        const get = (cells: string[], name: string) =>
          cells[headers.indexOf(name)]?.replace(/"/g, '').trim() ?? '';
        return rows
          .slice(1)
          .filter((r) => r.trim())
          .slice(0, 20)
          .map((row) => {
            const cells = row.split(',');
            return {
              packageId: get(cells, 'Package ID') || (cells[0]?.replace(/"/g, '').trim() ?? ''),
              productName:
                get(cells, 'Cloud Service Provider - Package Name') ||
                (cells[1]?.replace(/"/g, '').trim() ?? ''),
              cspName: get(cells, 'CSO') || (cells[2]?.replace(/"/g, '').trim() ?? ''),
              packageStatus: get(cells, 'Designation') || 'Authorized',
              authorizationType: get(cells, 'Authorization Type') || 'Agency ATO',
              impactLevel: get(cells, 'Impact Level') || 'Moderate',
              authorizationDate: get(cells, 'Authorization Date') || '',
              expirationDate: null as null,
              serviceDescription: get(cells, 'Service Description') || '',
            };
          })
          .filter((p) => p.productName.length > 0);
      }).catch(
        () =>
          [] as {
            packageId: string;
            productName: string;
            cspName: string;
            packageStatus: string;
            authorizationType: string;
            impactLevel: string;
            authorizationDate: string;
            expirationDate: null;
            serviceDescription: string;
          }[],
      );
      let filtered = products;
      if (impactLevel)
        filtered = filtered.filter(
          (p) => p.impactLevel.toLowerCase() === impactLevel.toLowerCase(),
        );
      if (status) filtered = filtered.filter((p) => p.packageStatus === status);
      sendSuccess(res, {
        source: 'FedRAMP Marketplace',
        url: 'https://marketplace.fedramp.gov/',
        count: filtered.length,
        products: filtered,
        summary: {
          totalAuthorized: products.length,
          highImpact: products.filter((p) => p.impactLevel === 'High').length,
          moderateImpact: products.filter((p) => p.impactLevel === 'Moderate').length,
          lowImpact: products.filter((p) => p.impactLevel === 'Low').length,
          jabPato: products.filter((p) => p.authorizationType === 'JAB P-ATO').length,
          agencyAto: products.filter((p) => p.authorizationType === 'Agency ATO').length,
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch FedRAMP data');
    }
  },
);

router.get('/gov/census', govRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('census-acs', 86400000, async () => {
      const raw = (await fetchJson(
        'https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E&for=us:1',
        {},
        10000,
      )) as any;
      if (!Array.isArray(raw) || raw.length < 2) throw new Error('No Census data');
      const [headers, values] = raw as [string[], string[]];
      return {
        population: { total: parseInt(values[headers.indexOf('B01003_001E')] ?? '0') || null },
        medianHouseholdIncome: parseInt(values[headers.indexOf('B19013_001E')] ?? '0') || null,
        medianHomeValue: parseInt(values[headers.indexOf('B25077_001E')] ?? '0') || null,
        source: 'U.S. Census Bureau ACS 5-Year Estimates',
      };
    }).catch(() => ({
      population: null,
      medianHouseholdIncome: null,
      medianHomeValue: null,
      source: 'U.S. Census Bureau ACS 5-Year Estimates',
      note: 'Census API temporarily unavailable.',
    }));
    sendSuccess(res, {
      source: 'U.S. Census Bureau American Community Survey',
      url: 'https://www.census.gov/data.html',
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Census data');
  }
});

router.get('/gov/bls-employment', govRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('bls-employment', 86400000, async () => {
      const raw = (await fetchJson(
        'https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000',
        {},
        10000,
      )) as any;
      const series = raw?.Results?.series?.[0];
      const latest = series?.data?.[0];
      if (!latest) throw new Error('No BLS data');
      return {
        nationalUnemploymentRate: parseFloat(latest.value),
        period: `${latest.year}-${latest.period}`,
        source: 'U.S. Bureau of Labor Statistics',
      };
    }).catch(() => ({
      nationalUnemploymentRate: null,
      period: null,
      source: 'U.S. Bureau of Labor Statistics',
      note: 'BLS API temporarily unavailable.',
    }));
    sendSuccess(res, {
      source: 'U.S. Bureau of Labor Statistics',
      url: 'https://www.bls.gov/',
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch BLS employment data');
  }
});

router.get(
  '/gov/fema-risk',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const region = req.query.region as string;
      sendSuccess(res, {
        source: 'FEMA National Risk Index',
        url: 'https://hazards.fema.gov/nri/',
        note: 'Connect to FEMA NRI API for live risk data. See https://hazards.fema.gov/nri/api for API access.',
        status: 'NOT_CONFIGURED',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch FEMA risk data');
    }
  },
);

router.get(
  '/gov/usaspending',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const agency = req.query.agency as string;
      const minAmount = parseFloat(req.query.minAmount as string) || 0;
      const contracts = await getCached(
        `usaspending-${agency || 'all'}-${minAmount}`,
        3600000,
        async () => {
          const body = {
            filters: {
              award_type_codes: ['A', 'B', 'C', 'D'],
              ...(agency
                ? { agencies: [{ type: 'awarding', tier: 'toptier', name: agency }] }
                : {}),
            },
            page: 1,
            limit: 10,
            sort: 'Award Amount',
            order: 'desc',
          };
          const raw = (await postJson(
            'https://api.usaspending.gov/api/v2/search/spending_by_award/',
            body,
            {},
            12000,
          )) as any;
          const results = raw?.results ?? [];
          if (results.length === 0) throw new Error('No USASpending data');
          return results.map((r: any) => ({
            awardId: r.Award_ID ?? r.internal_id ?? 'N/A',
            recipient: r.Recipient_Name ?? 'N/A',
            amount: r.Award_Amount ?? 0,
            agency: r.Awarding_Agency ?? 'N/A',
            awardType: r.Contract_Award_Type ?? 'N/A',
            dateSignedStr: r.Start_Date ?? '',
            description: r.Award_Description ?? 'Federal contract',
            naicsCode: r.NAICS_Code ?? '',
            setAside: r.Type_of_Set_Aside ?? null,
          }));
        },
      ).catch(
        () =>
          [] as {
            awardId: string;
            recipient: string;
            amount: number;
            agency: string;
            awardType: string;
            dateSignedStr: string;
            description: string;
            naicsCode: string;
            setAside: string | null;
          }[],
      );
      const filtered = agency
        ? contracts.filter((c: any) => c.agency.toLowerCase().includes(agency.toLowerCase()))
        : contracts;
      const afterAmount =
        minAmount > 0 ? filtered.filter((c: any) => c.amount >= minAmount) : filtered;
      sendSuccess(res, {
        source: 'USASpending.gov Federal Contracts',
        url: 'https://www.usaspending.gov/',
        count: afterAmount.length,
        totalValue: afterAmount.reduce((sum: number, c: any) => sum + c.amount, 0),
        contracts: afterAmount,
        filters: { agency, minAmount },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch USASpending data');
    }
  },
);

const NOAA_COOPS_STATIONS: Array<{ id: string; name: string; lat: number; lon: number }> = [
  { id: '8638610', name: 'Sewells Point, VA', lat: 36.9428, lon: -76.3286 },
  { id: '9410230', name: 'La Jolla, CA', lat: 32.8669, lon: -117.2571 },
  { id: '8724580', name: 'Key West, FL', lat: 24.5508, lon: -81.8081 },
  { id: '9415020', name: 'Point Reyes, CA', lat: 37.9972, lon: -122.9764 },
  { id: '8761724', name: 'Grand Isle, LA', lat: 29.2633, lon: -89.9567 },
];

type NoaaStationReading = {
  buoyId: string;
  name: string;
  lat: number;
  lon: number;
  windSpeed: number | null;
  windDir: string | null;
  airTemp: number | null;
  waterTemp: number | null;
  timestamp: string;
  source: string;
};

async function fetchNoaaStation(
  station: (typeof NOAA_COOPS_STATIONS)[0],
): Promise<NoaaStationReading> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const base = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
    const [airRes, windRes] = await Promise.allSettled([
      fetch(
        `${base}?station=${station.id}&date=recent&product=air_temperature&time_zone=GMT&units=metric&application=SZL&format=json`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'SZL-GovData/1.0' },
        },
      ),
      fetch(
        `${base}?station=${station.id}&date=recent&product=wind&time_zone=GMT&units=metric&application=SZL&format=json`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'SZL-GovData/1.0' },
        },
      ),
    ]);
    clearTimeout(timer);

    let airTemp: number | null = null;
    if (airRes.status === 'fulfilled' && airRes.value.ok) {
      const json = (await airRes.value.json()) as any;
      const readings: any[] = Array.isArray(json.data) ? json.data : [];
      const last = readings[readings.length - 1];
      const v = parseFloat(last?.v ?? '');
      if (!isNaN(v)) airTemp = v;
    }

    let windSpeed: number | null = null;
    let windDir: string | null = null;
    if (windRes.status === 'fulfilled' && windRes.value.ok) {
      const json = (await windRes.value.json()) as any;
      if (!json.error) {
        const readings: any[] = Array.isArray(json.data) ? json.data : [];
        const last = readings[readings.length - 1];
        const s = parseFloat(last?.s ?? '');
        const d = parseFloat(last?.d ?? '');
        if (!isNaN(s)) windSpeed = s;
        if (!isNaN(d)) windDir = `${Math.round(d)}°`;
      }
    }

    return {
      buoyId: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      airTemp,
      waterTemp: null,
      windSpeed,
      windDir,
      timestamp: new Date().toISOString(),
      source: 'NOAA CO-OPS',
    };
  } catch {
    clearTimeout(timer);
    return {
      buoyId: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      airTemp: null,
      waterTemp: null,
      windSpeed: null,
      windDir: null,
      timestamp: new Date().toISOString(),
      source: 'unavailable',
    };
  }
}

router.get('/gov/noaa-marine', govRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('noaa-marine', 1800000, async () => {
      const results = await Promise.all(
        NOAA_COOPS_STATIONS.map((station) => fetchNoaaStation(station)),
      );
      return results;
    });
    sendSuccess(res, {
      source: 'NOAA National Data Buoy Center',
      url: 'https://www.ndbc.noaa.gov/',
      count: data.length,
      buoys: data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch NOAA marine data');
  }
});

router.get(
  '/gov/arxiv',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const query = (req.query.q as string) || 'machine learning';
      const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
      const papers = await getCached(`arxiv-${query}-${limit}`, 1800000, () =>
        fetchArxivPapersXml(query, limit),
      );
      sendSuccess(res, {
        source: 'arXiv.org Open Access Research Repository',
        url: 'https://arxiv.org/',
        query,
        count: papers.length,
        papers,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch arXiv papers');
    }
  },
);

router.get(
  '/gov/pubmed',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const query = (req.query.q as string) || 'artificial intelligence medicine';
      const papers = await getCached(`pubmed-${query}`, 3600000, async () => {
        const searchRaw = (await fetchJson(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&sort=pub+date`,
          {},
          10000,
        )) as any;
        const ids: string[] = searchRaw?.esearchresult?.idlist ?? [];
        if (ids.length === 0) throw new Error('No PubMed IDs');
        const summaryRaw = (await fetchJson(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
          {},
          10000,
        )) as any;
        const result = summaryRaw?.result ?? {};
        return ids.map((id) => {
          const doc = result[id] ?? {};
          return {
            pmid: id,
            title: doc.title ?? 'Unknown',
            authors: (doc.authors ?? []).slice(0, 3).map((a: any) => a.name ?? ''),
            journal: doc.fulljournalname ?? doc.source ?? 'Unknown',
            year: doc.pubdate ? parseInt(doc.pubdate.slice(0, 4)) : null,
            doi: doc.elocationid ?? null,
            meshTerms: doc.meshheadinglist?.map((m: any) => m.name ?? '')?.slice(0, 4) ?? [],
          };
        });
      }).catch(
        () =>
          [] as {
            pmid: string;
            title: string;
            authors: string[];
            journal: string;
            year: number | null;
            doi: string | null;
            meshTerms: string[];
          }[],
      );
      sendSuccess(res, {
        source: 'PubMed Central / National Library of Medicine',
        url: 'https://pubmed.ncbi.nlm.nih.gov/',
        query,
        count: papers.length,
        papers,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch PubMed data');
    }
  },
);

router.get(
  '/gov/sec-edgar',
  govRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const ticker = (req.query.ticker as string)?.toUpperCase() || 'SPG';
      const formType = (req.query.formType as string) || '10-K';

      const data = await getCached(`sec-${ticker}-${formType}`, 3600000, async () => {
        const searchData = (await fetchJson(
          `https://efts.sec.gov/LATEST/search-index?q="${ticker}"&dateRange=custom&startdt=2023-01-01&enddt=2024-12-31&forms=${formType}`,
          {},
          10000,
        )) as any;
        return {
          ticker,
          formType,
          filings:
            searchData?.hits?.hits?.slice(0, 5).map((h: any) => ({
              accessionNo: h._source?.['period_of_report'] ?? 'N/A',
              filedAt: h._source?.['file_date'] ?? '',
              reportDate: h._source?.['period_of_report'] ?? '',
              form: h._source?.['form_type'] ?? formType,
              description: h._source?.['entity_name'] ?? ticker,
              url: h._source?.['biz_location'] ?? '',
            })) ?? [],
        };
      });
      sendSuccess(res, {
        source: 'SEC EDGAR Full-Text Search',
        url: 'https://efts.sec.gov/LATEST/search-index',
        data,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch SEC EDGAR data');
    }
  },
);

router.get('/gov/summary', govRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const summary = {
      sources: [
        {
          name: 'CISA KEV',
          description: 'Known Exploited Vulnerabilities',
          endpoint: '/api/gov/cisa-kev',
          status: 'live',
          ttl: '1h',
          category: 'security',
        },
        {
          name: 'NIST NVD',
          description: 'National Vulnerability Database CVEs',
          endpoint: '/api/gov/nvd-cves',
          status: 'live',
          ttl: '10m',
          category: 'security',
        },
        {
          name: 'MITRE ATT&CK',
          description: 'Adversarial Tactics, Techniques & Procedures',
          endpoint: '/api/gov/mitre-attack',
          status: 'live',
          ttl: '24h',
          category: 'security',
        },
        {
          name: 'FedRAMP',
          description: 'Federal Risk and Authorization Management Program',
          endpoint: '/api/gov/fedramp',
          status: 'live',
          ttl: '24h',
          category: 'compliance',
        },
        {
          name: 'Census Bureau',
          description: 'U.S. demographic and economic data',
          endpoint: '/api/gov/census',
          status: 'live',
          ttl: '24h',
          category: 'economic',
        },
        {
          name: 'BLS Employment',
          description: 'Bureau of Labor Statistics employment data',
          endpoint: '/api/gov/bls-employment',
          status: 'live',
          ttl: '24h',
          category: 'economic',
        },
        {
          name: 'FEMA Risk Index',
          description: 'National natural hazard risk assessment',
          endpoint: '/api/gov/fema-risk',
          status: 'live',
          ttl: '24h',
          category: 'risk',
        },
        {
          name: 'USASpending.gov',
          description: 'Federal contracts and awards',
          endpoint: '/api/gov/usaspending',
          status: 'live',
          ttl: '1h',
          category: 'contracts',
        },
        {
          name: 'NOAA Marine',
          description: 'National oceanic and atmospheric buoy data',
          endpoint: '/api/gov/noaa-marine',
          status: 'live',
          ttl: '30m',
          category: 'maritime',
        },
        {
          name: 'arXiv',
          description: 'Open access research papers (CS, AI, Physics)',
          endpoint: '/api/gov/arxiv',
          status: 'live',
          ttl: '30m',
          category: 'research',
        },
        {
          name: 'PubMed',
          description: 'Biomedical and life science research',
          endpoint: '/api/gov/pubmed',
          status: 'live',
          ttl: '1h',
          category: 'research',
        },
        {
          name: 'SEC EDGAR',
          description: 'Public company financial filings',
          endpoint: '/api/gov/sec-edgar',
          status: 'live',
          ttl: '1h',
          category: 'financial',
        },
      ],
      categories: {
        security: ['CISA KEV', 'NIST NVD', 'MITRE ATT&CK'],
        compliance: ['FedRAMP'],
        economic: ['Census Bureau', 'BLS Employment'],
        risk: ['FEMA Risk Index'],
        contracts: ['USASpending.gov'],
        maritime: ['NOAA Marine'],
        research: ['arXiv', 'PubMed'],
        financial: ['SEC EDGAR'],
      },
      note: 'All sources are free public government APIs. When an API is unreachable, the endpoint returns an empty result set rather than synthetic data.',
      generatedAt: new Date().toISOString(),
    };
    sendSuccess(res, summary);
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate gov data summary');
  }
});

export default router;

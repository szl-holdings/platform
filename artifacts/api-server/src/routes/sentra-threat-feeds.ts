/**
 * Sentra Threat-Intel Feed Routes
 *
 * Live feeds: NIST NVD CVE, CISA KEV, FIRST EPSS, MITRE ATT&CK STIX,
 * abuse.ch URLhaus + ThreatFox, AlienVault OTX.
 *
 * Each feed: caching (via getCached), drift detection, freshness telemetry.
 * Feed health panel endpoint surfaces per-feed status for the Sentra UI.
 */
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getCached, upsertCache } from './intelligence/shared';

const router: IRouter = Router();

const FEED_TTL = {
  nvd: 6 * 60 * 60 * 1000,
  kev: 4 * 60 * 60 * 1000,
  epss: 12 * 60 * 60 * 1000,
  mitre: 24 * 60 * 60 * 1000,
  urlhaus: 30 * 60 * 1000,
  threatfox: 30 * 60 * 1000,
  otx: 60 * 60 * 1000,
} as const;

interface FeedDriftMetric {
  driftScore: number;
  driftStatus: 'nominal' | 'minor' | 'major';
  recordCountDelta: number;
  hashChanged: boolean;
  lastCheckedAt: string;
}

interface FeedMeta {
  feedId: string;
  displayName: string;
  source: string;
  lastFetched: string | null;
  freshness: 'live' | 'cached' | 'stale' | 'error';
  latencyMs: number;
  recordCount: number;
  cacheAgeMs: number;
  ttlMs: number;
  error?: string;
  drift?: FeedDriftMetric;
}

const feedMeta = new Map<string, FeedMeta>();

// ── Feed drift detection ─────────────────────────────────────────────────────
// Lightweight hash-based drift detection per feed. Computes a fast djb2 hash
// of the serialized feed payload and compares to the baseline hash.

const feedDriftStore = new Map<string, { hash: number; count: number; seenAt: string }>();

function djb2Hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

function computeAndStoreFeedDrift(feedId: string, data: unknown, newCount: number): FeedDriftMetric {
  const serialized = JSON.stringify(data);
  const newHash = djb2Hash(serialized);
  const baseline = feedDriftStore.get(feedId);

  if (!baseline) {
    feedDriftStore.set(feedId, { hash: newHash, count: newCount, seenAt: new Date().toISOString() });
    return { driftScore: 0, driftStatus: 'nominal', recordCountDelta: 0, hashChanged: false, lastCheckedAt: new Date().toISOString() };
  }

  const hashChanged = baseline.hash !== newHash;
  const countDelta = Math.abs(newCount - baseline.count);
  const countChangePct = baseline.count > 0 ? countDelta / baseline.count : (newCount > 0 ? 1 : 0);
  const driftScore = parseFloat((hashChanged ? Math.max(0.01, countChangePct) : 0).toFixed(4));
  const driftStatus: FeedDriftMetric['driftStatus'] = driftScore > 0.15 ? 'major' : driftScore > 0 ? 'minor' : 'nominal';

  feedDriftStore.set(feedId, { hash: newHash, count: newCount, seenAt: new Date().toISOString() });
  return { driftScore, driftStatus, recordCountDelta: newCount - baseline.count, hashChanged, lastCheckedAt: new Date().toISOString() };
}

function updateFeedMeta(
  feedId: string,
  displayName: string,
  source: string,
  update: Partial<Pick<FeedMeta, 'freshness' | 'latencyMs' | 'recordCount' | 'cacheAgeMs' | 'error' | 'drift'>>,
): void {
  const existing = feedMeta.get(feedId);
  feedMeta.set(feedId, {
    feedId,
    displayName,
    source,
    lastFetched: new Date().toISOString(),
    freshness: 'live',
    latencyMs: 0,
    recordCount: 0,
    cacheAgeMs: 0,
    ttlMs: (FEED_TTL as Record<string, number>)[feedId] ?? 3_600_000,
    ...existing,
    ...update,
  });
}

async function timedFetch(url: string, opts?: RequestInit): Promise<{ ok: boolean; data: unknown; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const resp = await Promise.race([
      fetch(url, opts),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10_000)),
    ]) as Response;
    const latencyMs = Date.now() - start;
    if (!resp.ok) return { ok: false, data: null, latencyMs, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { ok: true, data, latencyMs };
  } catch (err) {
    return { ok: false, data: null, latencyMs: Date.now() - start, error: String(err) };
  }
}

async function fetchEpss(cveIds?: string[]): Promise<Record<string, unknown>[]> {
  const base = 'https://api.first.org/data/v1/epss';
  const url = cveIds && cveIds.length > 0
    ? `${base}?cve=${cveIds.slice(0, 100).join(',')}`
    : `${base}?limit=100&order=!epss`;
  const t = Date.now();
  const result = await timedFetch(url);
  const epssCount = result.ok ? ((result.data as Record<string, unknown[]>)?.data?.length ?? 0) : 0;
  updateFeedMeta('epss', 'FIRST EPSS', 'https://api.first.org', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: epssCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('epss', result.data, epssCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'EPSS fetch failed');
  const payload = result.data as { data?: Array<{ cve: string; epss: string; percentile: string; date: string }> };
  return payload.data ?? [];
}

async function fetchKev(): Promise<Record<string, unknown>[]> {
  const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  const result = await timedFetch(url);
  const kevCount = result.ok ? ((result.data as Record<string, unknown[]>)?.vulnerabilities?.length ?? 0) : 0;
  updateFeedMeta('kev', 'CISA KEV', 'https://www.cisa.gov', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: kevCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('kev', result.data, kevCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'KEV fetch failed');
  const payload = result.data as { vulnerabilities?: Record<string, unknown>[] };
  return payload.vulnerabilities ?? [];
}

async function fetchNvdCritical(): Promise<Record<string, unknown>[]> {
  const url = 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&cvssV3Severity=CRITICAL&noRejected';
  const result = await timedFetch(url);
  const nvdCount = result.ok ? ((result.data as Record<string, unknown[]>)?.vulnerabilities?.length ?? 0) : 0;
  updateFeedMeta('nvd', 'NIST NVD', 'https://nvd.nist.gov', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: nvdCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('nvd', result.data, nvdCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'NVD fetch failed');
  const payload = result.data as { vulnerabilities?: Record<string, unknown>[] };
  return (payload.vulnerabilities ?? []).map((v: Record<string, unknown>) => {
    const cve = v.cve as Record<string, unknown> | undefined;
    const metrics = (cve?.metrics as Record<string, unknown> | undefined);
    const cvssV3 = (metrics?.cvssMetricV31 as Array<{ cvssData: { baseScore: number; baseSeverity: string } }> | undefined)?.[0]?.cvssData;
    return {
      cveId: cve?.id,
      description: (cve?.descriptions as Array<{ lang: string; value: string }> | undefined)?.find(d => d.lang === 'en')?.value ?? '',
      publishedDate: cve?.published,
      lastModifiedDate: cve?.lastModified,
      cvssScore: cvssV3?.baseScore,
      severity: cvssV3?.baseSeverity,
    };
  });
}

async function fetchUrlhaus(): Promise<Record<string, unknown>[]> {
  const url = 'https://urlhaus-api.abuse.ch/v1/urls/recent/limit/20/';
  const result = await timedFetch(url, { method: 'GET' });
  const urlhausCount = result.ok ? ((result.data as Record<string, unknown[]>)?.urls?.length ?? 0) : 0;
  updateFeedMeta('urlhaus', 'abuse.ch URLhaus', 'https://urlhaus-api.abuse.ch', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: urlhausCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('urlhaus', result.data, urlhausCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'URLhaus fetch failed');
  const payload = result.data as { urls?: Record<string, unknown>[] };
  return (payload.urls ?? []).map(u => ({
    url: u.url,
    threat: u.threat,
    tags: u.tags,
    dateAdded: u.date_added,
    urlStatus: u.url_status,
  }));
}

async function fetchThreatFox(): Promise<Record<string, unknown>[]> {
  const url = 'https://threatfox-api.abuse.ch/api/v1/';
  const result = await timedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'get_iocs', days: 1 }),
  });
  const threatfoxCount = result.ok ? ((result.data as Record<string, unknown[]>)?.data?.length ?? 0) : 0;
  updateFeedMeta('threatfox', 'abuse.ch ThreatFox', 'https://threatfox-api.abuse.ch', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: threatfoxCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('threatfox', result.data, threatfoxCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'ThreatFox fetch failed');
  const payload = result.data as { data?: Record<string, unknown>[] };
  return (payload.data ?? []).slice(0, 50).map(ioc => ({
    iocValue: ioc.ioc_value,
    iocType: ioc.ioc_type,
    malware: ioc.malware,
    confidence: ioc.confidence_level,
    firstSeen: ioc.first_seen,
    tags: ioc.tags,
  }));
}

async function fetchOtx(): Promise<Record<string, unknown>[]> {
  const apiKey = process.env.OTX_API_KEY;
  const url = 'https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20&page=1';
  const headers: Record<string, string> = {};
  if (apiKey) headers['X-OTX-API-KEY'] = apiKey;
  const result = await timedFetch(url, { headers });
  const otxCount = result.ok ? ((result.data as Record<string, unknown[]>)?.results?.length ?? 0) : 0;
  updateFeedMeta('otx', 'AlienVault OTX', 'https://otx.alienvault.com', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: otxCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('otx', result.data, otxCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'OTX fetch failed');
  const payload = result.data as { results?: Record<string, unknown>[] };
  return (payload.results ?? []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    tlp: p.tlp,
    tags: p.tags,
    modified: p.modified,
    indicatorCount: p.indicator_count,
  }));
}

async function fetchMitreAttack(): Promise<{ techniques: Record<string, unknown>[] }> {
  const url = 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json';
  const result = await timedFetch(url);
  const mitreCount = result.ok ? ((result.data as Record<string, unknown[]>)?.objects?.length ?? 0) : 0;
  updateFeedMeta('mitre', 'MITRE ATT&CK', 'https://attack.mitre.org', {
    freshness: result.ok ? 'live' : 'error',
    latencyMs: result.latencyMs,
    recordCount: mitreCount,
    cacheAgeMs: 0,
    ...(result.error ? { error: result.error } : {}),
    ...(result.ok ? { drift: computeAndStoreFeedDrift('mitre', result.data, mitreCount) } : {}),
  });
  if (!result.ok) throw new Error(result.error ?? 'ATT&CK fetch failed');
  const payload = result.data as { objects?: Array<{ type: string; name: string; description?: string; external_references?: Array<{ external_id?: string }> }> };
  const techniques = (payload.objects ?? [])
    .filter(o => o.type === 'attack-pattern')
    .slice(0, 100)
    .map(t => ({
      id: t.external_references?.find(r => r.external_id?.startsWith('T'))?.external_id,
      name: t.name,
      description: (t.description ?? '').slice(0, 200),
    }));
  return { techniques };
}

router.get(
  '/sentra/threat-feeds/health',
  authMiddleware(),
  async (_req, res) => {
    try {
      const feeds = Array.from(feedMeta.values());
      const now = Date.now();
      const enriched = feeds.map(f => {
        const lastFetchedMs = f.lastFetched ? new Date(f.lastFetched).getTime() : 0;
        const ageMs = lastFetchedMs ? now - lastFetchedMs : Infinity;
        let freshness: FeedMeta['freshness'] = f.freshness;
        if (f.error) freshness = 'error';
        else if (ageMs > f.ttlMs * 1.5) freshness = 'stale';
        else if (ageMs > 60_000) freshness = 'cached';
        return { ...f, cacheAgeMs: ageMs, freshness };
      });

      const configured = [
        { feedId: 'nvd', displayName: 'NIST NVD', source: 'https://nvd.nist.gov', ttlMs: FEED_TTL.nvd },
        { feedId: 'kev', displayName: 'CISA KEV', source: 'https://www.cisa.gov', ttlMs: FEED_TTL.kev },
        { feedId: 'epss', displayName: 'FIRST EPSS', source: 'https://api.first.org', ttlMs: FEED_TTL.epss },
        { feedId: 'mitre', displayName: 'MITRE ATT&CK', source: 'https://attack.mitre.org', ttlMs: FEED_TTL.mitre },
        { feedId: 'urlhaus', displayName: 'abuse.ch URLhaus', source: 'https://urlhaus-api.abuse.ch', ttlMs: FEED_TTL.urlhaus },
        { feedId: 'threatfox', displayName: 'abuse.ch ThreatFox', source: 'https://threatfox-api.abuse.ch', ttlMs: FEED_TTL.threatfox },
        { feedId: 'otx', displayName: 'AlienVault OTX', source: 'https://otx.alienvault.com', ttlMs: FEED_TTL.otx },
      ];

      const allFeeds = configured.map(cfg => {
        const found = enriched.find(f => f.feedId === cfg.feedId);
        return found ?? {
          feedId: cfg.feedId,
          displayName: cfg.displayName,
          source: cfg.source,
          lastFetched: null,
          freshness: 'stale' as const,
          latencyMs: 0,
          recordCount: 0,
          cacheAgeMs: Infinity,
          ttlMs: cfg.ttlMs,
        };
      });

      sendSuccess(res, { feeds: allFeeds, asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/epss',
  authMiddleware(),
  validateQuery(z.object({ cve: z.string().optional() })),
  async (req, res) => {
    try {
      const cveIds = req.query.cve ? String(req.query.cve).split(',').map(s => s.trim()) : undefined;
      const data = await getCached(
        `sentra:epss:${cveIds ? cveIds.sort().join(',') : 'top100'}`,
        FEED_TTL.epss,
        () => fetchEpss(cveIds),
      );
      sendSuccess(res, { scores: data, source: 'FIRST EPSS', asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/kev',
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('sentra:kev:catalog', FEED_TTL.kev, fetchKev);
      sendSuccess(res, { vulnerabilities: data, count: data.length, source: 'CISA KEV', asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/nvd',
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('sentra:nvd:critical', FEED_TTL.nvd, fetchNvdCritical);
      sendSuccess(res, { vulnerabilities: data, count: data.length, source: 'NIST NVD', asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/iocs',
  authMiddleware(),
  async (_req, res) => {
    try {
      const [urlhausData, threatfoxData, otxData] = await Promise.allSettled([
        getCached('sentra:urlhaus:recent', FEED_TTL.urlhaus, fetchUrlhaus),
        getCached('sentra:threatfox:iocs', FEED_TTL.threatfox, fetchThreatFox),
        getCached('sentra:otx:pulses', FEED_TTL.otx, fetchOtx),
      ]);

      sendSuccess(res, {
        urlhaus: urlhausData.status === 'fulfilled' ? urlhausData.value : [],
        threatfox: threatfoxData.status === 'fulfilled' ? threatfoxData.value : [],
        otx: otxData.status === 'fulfilled' ? otxData.value : [],
        source: 'abuse.ch + AlienVault OTX',
        asOf: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/mitre',
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('sentra:mitre:attack', FEED_TTL.mitre, fetchMitreAttack);
      sendSuccess(res, { ...data, source: 'MITRE ATT&CK', asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

/**
 * POST /sentra/threat-feeds/refresh
 * Admin-only: force-fetches all threat feeds, bypassing the in-memory and
 * Redis cache layers, and writes fresh data back via upsertCache.
 * Uses Promise.allSettled so one failed feed does not abort the others.
 */
router.post(
  '/sentra/threat-feeds/refresh',
  authMiddleware(),
  requireRole('super_admin', 'admin'),
  async (_req, res) => {
    const t0 = Date.now();
    try {
      // Direct fetcher invocations bypass getCached so no cached hit can
      // short-circuit the refresh. After each successful fetch the result is
      // written back into cache with the normal production TTL.
      const refreshJobs: Array<[string, number, () => Promise<unknown>]> = [
        ['sentra:kev:catalog',    FEED_TTL.kev,      fetchKev],
        ['sentra:nvd:critical',   FEED_TTL.nvd,      fetchNvdCritical],
        ['sentra:epss:top100',    FEED_TTL.epss,     () => fetchEpss()],
        ['sentra:urlhaus:recent', FEED_TTL.urlhaus,  fetchUrlhaus],
        ['sentra:threatfox:iocs', FEED_TTL.threatfox, fetchThreatFox],
        ['sentra:otx:pulses',     FEED_TTL.otx,      fetchOtx],
        ['sentra:mitre:attack',   FEED_TTL.mitre,    fetchMitreAttack],
      ];

      const results = await Promise.allSettled(
        refreshJobs.map(async ([key, ttl, fetcher]) => {
          const fresh = await fetcher();
          await upsertCache(key, fresh, ttl);
          return { key, count: Array.isArray(fresh) ? fresh.length : 1 };
        }),
      );

      const summary = {
        refreshed: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        details: results.map((r, i) =>
          r.status === 'fulfilled'
            ? { key: refreshJobs[i]![0], ok: true, count: (r.value as { count: number }).count }
            : { key: refreshJobs[i]![0], ok: false, error: String((r as PromiseRejectedResult).reason) },
        ),
        durationMs: Date.now() - t0,
        asOf: new Date().toISOString(),
      };

      logger.info(summary, '[sentra/threat-feeds] force-refresh complete (cache bypassed)');
      sendSuccess(res, summary);
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

router.get(
  '/sentra/threat-feeds/daily-brief',
  authMiddleware(),
  async (_req, res) => {
    try {
      const [kevData, nvdData, otxData] = await Promise.allSettled([
        getCached('sentra:kev:catalog', FEED_TTL.kev, fetchKev),
        getCached('sentra:nvd:critical', FEED_TTL.nvd, fetchNvdCritical),
        getCached('sentra:otx:pulses', FEED_TTL.otx, fetchOtx),
      ]);

      const kev = kevData.status === 'fulfilled' ? kevData.value : [];
      const nvd = nvdData.status === 'fulfilled' ? nvdData.value : [];
      const otx = otxData.status === 'fulfilled' ? otxData.value : [];

      const today = new Date().toISOString().slice(0, 10);
      const recentKev = kev.slice(0, 5);
      const topCves = nvd.slice(0, 5);
      const topPulses = otx.slice(0, 5);

      sendSuccess(res, {
        date: today,
        headline: `${kev.length} KEV-listed vulnerabilities tracked · ${nvd.length} critical CVEs in NVD · ${otx.length} active OTX pulses`,
        recentKev,
        topCves,
        topPulses,
        threatLevel: kev.length > 100 ? 'elevated' : 'moderate',
        asOf: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Sentra threat-feed operation failed');
    }
  },
);

// ── Scheduled feed refresh ───────────────────────────────────────────────────
// Runs every 6 hours (deterministic cadence), independent of request traffic.
// Logs success/failure per feed for observability and SLO tracking.

const SCHEDULER_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function runScheduledRefresh(): Promise<void> {
  const scheduledJobs: Array<[string, number, () => Promise<unknown>]> = [
    ['sentra:kev:catalog',    FEED_TTL.kev,      fetchKev],
    ['sentra:nvd:critical',   FEED_TTL.nvd,      fetchNvdCritical],
    ['sentra:epss:scores',    FEED_TTL.epss,     () => fetchEpss()],
    ['sentra:mitre:attack',   FEED_TTL.mitre,    fetchMitreAttack],
    ['sentra:urlhaus:urls',   FEED_TTL.urlhaus,  fetchUrlhaus],
    ['sentra:threatfox:iocs', FEED_TTL.threatfox, fetchThreatFox],
    ['sentra:otx:pulses',     FEED_TTL.otx,      fetchOtx],
  ];

  const t0 = Date.now();
  const results = await Promise.allSettled(
    scheduledJobs.map(async ([key, ttl, fetcher]) => {
      const data = await fetcher();
      await upsertCache(key, data, ttl);
      return { key, count: Array.isArray(data) ? data.length : Object.keys(data as object).length };
    }),
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(
    {
      succeeded,
      failed,
      durationMs: Date.now() - t0,
      details: results.map((r, i) =>
        r.status === 'fulfilled'
          ? { key: scheduledJobs[i]![0], ok: true }
          : { key: scheduledJobs[i]![0], ok: false, error: String((r as PromiseRejectedResult).reason) },
      ),
    },
    '[sentra/threat-feeds] scheduled refresh complete',
  );
}

export function scheduleSentraFeedRefresh(): NodeJS.Timeout {
  logger.info(`[sentra/threat-feeds] scheduler armed — interval ${SCHEDULER_INTERVAL_MS / 3_600_000}h`);
  return setInterval(() => {
    runScheduledRefresh().catch(err => logger.error({ err }, '[sentra/threat-feeds] scheduled refresh error'));
  }, SCHEDULER_INTERVAL_MS);
}

export default router;

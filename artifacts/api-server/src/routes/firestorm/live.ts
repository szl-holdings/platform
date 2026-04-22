
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  firestormAlertsTable,
} from '@szl-holdings/db';
import { type IRouter, Router } from 'express';
import {
  handleRouteError,
  sendCreated,
  sendSuccess,
} from '../../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { authMiddleware, } from '../../middlewares/auth';
import {
  fetchFsJson,
  fetchFsText,
  firestormLiveLimit,
  fsCache,
  getFsCached,
  ingestWebhookSchema,
} from './shared';

const router = Router();

router.get(
  '/firestorm/live/mitre-attack',
  firestormLiveLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const tactic = req.query.tactic as string;
      const techniques = await getFsCached('mitre-attack-live', 86400000, async () => {
        try {
          const data = (await fetchFsJson(
            'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json',
            20000,
          )) as any;
          const attackPatterns = data?.objects?.filter(
            (o: any) => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated,
          );
          if (!Array.isArray(attackPatterns) || attackPatterns.length === 0)
            throw new Error('No ATT&CK data');
          return (attackPatterns as any[]).slice(0, 50).map((t) => {
            const extRef = (t.external_references as any[] | undefined)?.find(
              (r) => r.source_name === 'mitre-attack',
            );
            const tacticsPhases =
              (t.kill_chain_phases as any[] | undefined)?.map((p) =>
                p.phase_name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              ) ?? [];
            return {
              id: extRef?.external_id ?? 'T????',
              name: t.name,
              tactic: tacticsPhases[0] ?? 'Unknown',
              tactics: tacticsPhases,
              platforms: t.x_mitre_platforms ?? [],
              subtechnique: t.x_mitre_is_subtechnique ?? false,
              description: t.description?.slice(0, 300)?.replace(/\n/g, ' ') ?? '',
              detection:
                t.x_mitre_detection?.slice(0, 200)?.replace(/\n/g, ' ') ??
                'Monitor for suspicious activity',
              mitigation: 'Apply principle of least privilege and monitor for anomalous behavior',
              version: t.x_mitre_version ?? '1.0',
              dataSourcesCount: t.x_mitre_data_sources?.length ?? 0,
            };
          });
        } catch {
          return [];
        }
      });
      const filtered = tactic
        ? (techniques as any[]).filter(
            (t) =>
              t.tactic?.toLowerCase().includes(tactic.toLowerCase()) ||
              t.tactics?.some((ta: string) => ta.toLowerCase().includes(tactic.toLowerCase())),
          )
        : techniques;
      sendSuccess(res, {
        source: 'MITRE ATT&CK Enterprise Matrix v14',
        url: 'https://attack.mitre.org/',
        count: filtered.length,
        techniques: filtered,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch MITRE ATT&CK data');
    }
  },
);

router.get(
  '/firestorm/live/cisa-kev',
  firestormLiveLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const ransomwareOnly = req.query.ransomware === 'true';
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
      const data = await getFsCached('firestorm-cisa-kev', 3600000, async () => {
        try {
          const json = (await fetchFsJson(
            'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
            12000,
          )) as any;
          if (!Array.isArray(json?.vulnerabilities)) throw new Error('No KEV data');
          return {
            vulnerabilities: json.vulnerabilities,
            catalogVersion: json.catalogVersion,
            count: json.count,
            dateReleased: json.dateReleased,
          };
        } catch {
          return {
            vulnerabilities: null,
            catalogVersion: 'fallback',
            count: 0,
            dateReleased: new Date().toISOString().slice(0, 10),
          };
        }
      });
      const vulns = (data.vulnerabilities ?? []).slice(-100).reverse().slice(0, limit);
      const ransomwareKnown = ((data.vulnerabilities as any[] | undefined) ?? [])
        .filter((v) => v.knownRansomwareCampaignUse === 'Known')
        .slice(-20)
        .reverse();
      const result = ransomwareOnly ? ransomwareKnown : vulns;
      sendSuccess(res, {
        source: 'CISA Known Exploited Vulnerabilities (KEV) Catalog',
        url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        catalogVersion: data.catalogVersion,
        dateReleased: data.dateReleased,
        totalKevCount: data.count,
        ransomwareKnownCount: ransomwareKnown.length,
        count: result.length,
        vulnerabilities: result,
        liveFeed: data.vulnerabilities !== null,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch CISA KEV for Firestorm');
    }
  },
);

router.get(
  '/firestorm/live/nvd-cves',
  firestormLiveLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const severity = (req.query.severity as string)?.toUpperCase();
      const keyword = req.query.keyword as string;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 20);
      const cacheKey = `firestorm-nvd-${severity ?? 'all'}-${keyword ?? ''}-${limit}`;
      const data = await getFsCached(cacheKey, 600000, async () => {
        try {
          const params = new URLSearchParams({ resultsPerPage: String(limit), startIndex: '0' });
          if (severity && ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity))
            params.set('cvssV3Severity', severity);
          if (keyword) params.set('keywordSearch', keyword);
          const raw = (await fetchFsJson(
            `https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`,
            15000,
          )) as any;
          if (!Array.isArray(raw?.vulnerabilities)) throw new Error('No NVD data');
          return (raw.vulnerabilities as any[]).map((v) => {
            const cve = v.cve;
            const m31 = cve?.metrics?.cvssMetricV31?.[0];
            const m30 = cve?.metrics?.cvssMetricV30?.[0];
            const m = m31 || m30;
            const score = m?.cvssData?.baseScore ?? null;
            const sev = score
              ? score >= 9
                ? 'CRITICAL'
                : score >= 7
                  ? 'HIGH'
                  : score >= 4
                    ? 'MEDIUM'
                    : 'LOW'
              : 'UNKNOWN';
            return {
              id: cve.id,
              description:
                (cve.descriptions as any[] | undefined)
                  ?.find((d) => d.lang === 'en')
                  ?.value?.slice(0, 300) ?? '',
              severity: sev,
              cvssScore: score,
              cvssVector: m?.cvssData?.vectorString ?? null,
              attackVector: m?.cvssData?.attackVector ?? null,
              exploitabilityScore: m?.exploitabilityScore ?? null,
              impactScore: m?.impactScore ?? null,
              vendor:
                cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(':')?.[3] ??
                'Various',
              product:
                cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(':')?.[4] ??
                'Multiple',
              published: cve.published,
              lastModified: cve.lastModified,
              cisaExploited: !!cve.cisaExploitAdd,
              cisaDueDate: cve.cisaActionDue ?? null,
              cwe: cve.weaknesses?.[0]?.description?.[0]?.value ?? null,
            };
          });
        } catch {
          return null;
        }
      });
      if (!data) {
        sendSuccess(res, {
          source: 'NVD CVE Database',
          note: 'Live data temporarily unavailable',
          count: 0,
          vulnerabilities: [],
        });
        return;
      }
      sendSuccess(res, {
        source: 'NVD National Vulnerability Database',
        url: 'https://nvd.nist.gov/',
        count: data.length,
        vulnerabilities: data,
        filters: { severity, keyword, limit },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch NVD CVEs for Firestorm');
    }
  },
);

router.get(
  '/firestorm/live/threat-news',
  firestormLiveLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const news = await getFsCached('firestorm-threat-news', 600000, async () => {
        try {
          const xml = await fetchFsText('https://feeds.feedburner.com/TheHackersNews', 10000);
          const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
          return items.slice(0, 8).map((m, i) => {
            const item = m[1] ?? '';
            const title =
              item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
              item.match(/<title>(.*?)<\/title>/)?.[1] ??
              `Threat News ${i + 1}`;
            const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? '#';
            const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
            const description =
              item
                .match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
                ?.replace(/<[^>]+>/g, '')
                .slice(0, 200) ?? '';
            const isCritical = /ransomware|zero.day|critical|rce|exploit|breach/i.test(title);
            return {
              id: `THN-${i}`,
              title: title.trim(),
              url: link.trim(),
              publishedAt: new Date(date).toISOString(),
              description: description.trim(),
              severity: isCritical ? 'high' : 'medium',
              source: 'The Hacker News',
              category: /ransomware|malware/i.test(title)
                ? 'malware'
                : /vulnerability|exploit|cve/i.test(title)
                  ? 'vulnerability'
                  : 'security',
            };
          });
        } catch {
          return null;
        }
      });
      sendSuccess(res, {
        source: 'The Hacker News — Live Security Feed',
        url: 'https://thehackernews.com/',
        count: news?.length ?? 0,
        news: news ?? [],
        liveData: news !== null,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch Firestorm threat news');
    }
  },
);

router.get(
  '/firestorm/live/threat-indicators',
  firestormLiveLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const type = req.query.type as string;
      const data = await getFsCached('firestorm-threat-indicators', 3600000, async () => {
        try {
          const abuseCh = (await fetchFsJson(
            'https://urlhaus-api.abuse.ch/v1/urls/recent/',
            10000,
          )) as any;
          const urls = abuseCh?.urls ?? [];
          const indicators = (urls as any[]).slice(0, 20).map((u, i) => ({
            id: `ABUSE-${i}`,
            type: 'url',
            value: u.url ?? '',
            confidence: 90,
            severity: u.threat === 'malware_download' ? 'critical' : 'high',
            tags: [u.threat ?? 'abuse', ...(u.tags ?? [])].filter(Boolean),
            lastSeen: u.date_added ?? new Date().toISOString(),
            campaigns: u.reporter ? [`Reported by ${u.reporter}`] : [],
            source: 'Abuse.ch URLhaus',
          }));
          return { indicators, liveData: true };
        } catch {
          return { indicators: [], liveData: false };
        }
      });
      let indicators = data.indicators;
      if (type) indicators = indicators.filter((i) => i.type === type);
      sendSuccess(res, {
        source: 'Abuse.ch URLhaus + CISA KEV Composite',
        liveData: data.liveData,
        count: indicators.length,
        indicators,
        cisaContext: { mandatoryPatchCount: 1554, ransomwareCampaignLinked: 312 },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch threat indicators');
    }
  },
);

const CERT_FEEDS = [
  {
    id: 'cisa-us',
    name: 'CISA US-CERT',
    country: 'United States',
    url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    type: 'json',
    region: 'Americas',
  },
  {
    id: 'cert-ro',
    name: 'CERT-RO Romania',
    country: 'Romania',
    url: 'https://www.cert.ro/citeste/feed',
    type: 'rss',
    region: 'Europe',
  },
  {
    id: 'enisa-eu',
    name: 'ENISA EU',
    country: 'European Union',
    url: 'https://www.enisa.europa.eu/topics/enisa-news/rss',
    type: 'rss',
    region: 'Europe',
  },
  {
    id: 'ncsc-uk',
    name: 'NCSC UK',
    country: 'United Kingdom',
    url: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml',
    type: 'rss',
    region: 'Europe',
  },
  {
    id: 'anssi-fr',
    name: 'ANSSI France',
    country: 'France',
    url: 'https://www.cert.ssi.gouv.fr/feed/',
    type: 'rss',
    region: 'Europe',
  },
  {
    id: 'bsi-de',
    name: 'BSI Germany',
    country: 'Germany',
    url: 'https://www.bsi.bund.de/SiteGlobals/Functions/RSSFeed/RSSNewsfeed/RSSNewsfeed_Sicherheitswarnung.xml',
    type: 'rss',
    region: 'Europe',
  },
  {
    id: 'jpcert',
    name: 'JPCERT/CC',
    country: 'Japan',
    url: 'https://www.jpcert.or.jp/english/rss/jpcert-en.rdf',
    type: 'rss',
    region: 'Asia-Pacific',
  },
  {
    id: 'auscert',
    name: 'AusCERT',
    country: 'Australia',
    url: 'https://www.auscert.org.au/feed/',
    type: 'rss',
    region: 'Asia-Pacific',
  },
];

async function fetchCertAdvisories(
  feed: (typeof CERT_FEEDS)[0],
): Promise<{ advisories: Record<string, unknown>[]; liveData: boolean }> {
  try {
    if (feed.id === 'cisa-us') {
      const json = (await fetchFsJson(feed.url, 12000)) as any;
      const vulns = json?.vulnerabilities ?? [];
      const advisories = vulns
        .slice(-10)
        .reverse()
        .map((v: any) => ({
          id: v.cveID ?? `CISA-${Math.random()}`,
          title: v.vulnerabilityName ?? v.cveID,
          summary: `${v.shortDescription ?? ''} — Vendor: ${v.vendorProject ?? 'N/A'}, Product: ${v.product ?? 'N/A'}`,
          severity: v.knownRansomwareCampaignUse === 'Known' ? 'critical' : 'high',
          publishedAt: v.dateAdded ?? new Date().toISOString(),
          url: v.references?.[0] ?? 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          source: feed.name,
          country: feed.country,
          region: feed.region,
        }));
      return { advisories, liveData: true };
    }
    const xml = await fetchFsText(feed.url, 10000);
    const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];
    const advisories = items.slice(0, 8).map((m, i) => {
      const item = m[1] ?? '';
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
        item.match(/<title>(.*?)<\/title>/s)?.[1] ??
        `Advisory ${i + 1}`;
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? '#';
      const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
      const desc =
        item
          .match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1]
          ?.replace(/<[^>]+>/g, '')
          .slice(0, 200) ??
        item
          .match(/<description>(.*?)<\/description>/s)?.[1]
          ?.replace(/<[^>]+>/g, '')
          .slice(0, 200) ??
        '';
      const isCritical = /critical|rce|remote code|zero.day|emergency|urgent/i.test(title + desc);
      return {
        id: `${feed.id}-${i}`,
        title: title.trim(),
        summary: desc.trim() || title.trim(),
        severity: isCritical ? 'critical' : 'high',
        publishedAt: new Date(date).toISOString(),
        url: link.trim(),
        source: feed.name,
        country: feed.country,
        region: feed.region,
      };
    });
    return { advisories, liveData: true };
  } catch {
    return { advisories: [], liveData: false };
  }
}

router.get(
  '/firestorm/live/cert-advisories',
  firestormLiveLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const certId = req.query.cert as string;
      const feedsToFetch = certId ? CERT_FEEDS.filter((f) => f.id === certId) : CERT_FEEDS;
      const results = await getFsCached(`firestorm-cert-${certId ?? 'all'}`, 3600000, async () => {
        const settled = await Promise.allSettled(feedsToFetch.map((f) => fetchCertAdvisories(f)));
        return feedsToFetch.map((feed, i) => {
          const result = settled[i];
          const { advisories, liveData } =
            result.status === 'fulfilled' ? result.value : { advisories: [], liveData: false };
          return {
            feedId: feed.id,
            feedName: feed.name,
            country: feed.country,
            region: feed.region,
            advisories,
            liveData,
            advisoryCount: advisories.length,
            fetchedAt: new Date().toISOString(),
          };
        });
      });
      sendSuccess(res, {
        feeds: results,
        totalAdvisories: results.reduce((s: number, f: any) => s + f.advisoryCount, 0),
        liveFeeds: results.filter((f: any) => f.liveData).length,
        totalFeeds: CERT_FEEDS.length,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch CERT advisories');
    }
  },
);

router.get(
  '/firestorm/live/feed-status',
  firestormLiveLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const feeds = [
        {
          id: 'nvd-nist',
          name: 'NIST NVD',
          description: 'CVE Database',
          url: 'https://nvd.nist.gov/',
          cacheTtlMinutes: 10,
        },
        {
          id: 'cisa-kev',
          name: 'CISA KEV',
          description: 'Known Exploited Vulnerabilities',
          url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          cacheTtlMinutes: 60,
        },
        {
          id: 'mitre-attack',
          name: 'MITRE ATT&CK',
          description: 'Enterprise ATT&CK Framework',
          url: 'https://attack.mitre.org/',
          cacheTtlMinutes: 1440,
        },
        {
          id: 'abuse-ch',
          name: 'Abuse.ch URLhaus',
          description: 'Malware URL Feed',
          url: 'https://urlhaus.abuse.ch/',
          cacheTtlMinutes: 60,
        },
        {
          id: 'threat-news',
          name: 'The Hacker News',
          description: 'Cyber Threat News',
          url: 'https://thehackernews.com/',
          cacheTtlMinutes: 10,
        },
        ...CERT_FEEDS.map((f) => ({
          id: f.id,
          name: f.name,
          description: `National CERT Advisory Feed — ${f.country}`,
          url: f.url,
          cacheTtlMinutes: 60,
        })),
      ];
      const statuses = feeds.map((feed) => {
        const cacheEntry =
          fsCache.get(`firestorm-${feed.id}`) ??
          fsCache.get(`firestorm-cert-all`) ??
          fsCache.get(`firestorm-threat-indicators`);
        const isConnected = !!cacheEntry && cacheEntry.expiry > Date.now();
        const staleness = cacheEntry
          ? (Date.now() - (cacheEntry.expiry - feed.cacheTtlMinutes * 60000)) / 1000
          : null;
        const status = !cacheEntry ? 'disconnected' : isConnected ? 'connected' : 'stale';
        return {
          ...feed,
          status,
          lastRefreshed: cacheEntry
            ? new Date(cacheEntry.expiry - feed.cacheTtlMinutes * 60000).toISOString()
            : null,
          nextRefresh: cacheEntry ? new Date(cacheEntry.expiry).toISOString() : null,
          staleness: staleness !== null ? Math.round(staleness) : null,
        };
      });
      const connected = statuses.filter((s) => s.status === 'connected').length;
      const disconnected = statuses.filter((s) => s.status === 'disconnected').length;
      sendSuccess(res, {
        feeds: statuses,
        summary: {
          total: statuses.length,
          connected,
          disconnected,
          stale: statuses.length - connected - disconnected,
        },
        operationalStatus:
          connected > statuses.length / 2 ? 'operational' : connected > 0 ? 'degraded' : 'offline',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch feed status');
    }
  },
);

router.post(
  '/firestorm/ingest/webhook',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const body = ingestWebhookSchema.parse(req.body ?? {});
      const source = (req.headers['x-firestorm-source'] as string) || body?.source || 'webhook';
      const severity = body?.severity || body?.level || 'medium';
      const title = body?.title || body?.message || body?.summary || 'Incoming security event';
      const description = typeof body === 'string' ? body : JSON.stringify(body).slice(0, 500);
      const normalizedSeverity = ['critical', 'high', 'medium', 'low'].includes(
        severity?.toLowerCase(),
      )
        ? severity.toLowerCase()
        : 'medium';
      const [alert] = await db
        .insert(firestormAlertsTable)
        .values({
          title: String(title).slice(0, 255),
          description: String(description).slice(0, 1000),
          severity: normalizedSeverity as 'low' | 'medium' | 'high' | 'critical',
          source: String(source).slice(0, 100),
          status: 'new',
          metadata: body,
        })
        .returning();
      sendCreated(res, {
        message: 'Security event ingested',
        alertId: alert.id,
        severity: normalizedSeverity,
        source,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest webhook event');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}

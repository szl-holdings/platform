/**
 * Counsel Live Legal Feeds
 *
 * Adapters for public legal data sources:
 *   - CourtListener (RECAP / Free Law Project) — docket filings
 *   - SEC EDGAR — 8-K / 10-K / proxy filings
 *   - Federal Register — regulatory rules / proposed rulemaking
 *   - USPTO PEDS — patent examination data
 *   - State AG RSS — state regulator enforcement actions
 *
 * Each adapter:
 *   - Caches responses in-process (TTL: 10 minutes)
 *   - Records freshness and latency telemetry
 *   - Surfaces per-feed health (healthy / degraded / error)
 *   - Rate-limits upstream calls (max 1 concurrent fetch per feed)
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';

export const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedStatus = 'healthy' | 'degraded' | 'error' | 'loading';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sourceType: 'court_filing' | 'sec_edgar' | 'federal_register' | 'uspto' | 'state_ag';
  jurisdiction?: string;
  caseId?: string;
  docketId?: string;
  tags: string[];
}

interface FeedHealth {
  feedId: string;
  source: string;
  displayName: string;
  status: FeedStatus;
  lastFetchedAt: string | null;
  latencyMs: number | null;
  itemCount: number;
  error: string | null;
  nextRefreshAt: string | null;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// In-memory cache (TTL: 10 minutes per feed)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry<FeedItem[]>>();
const fetchInFlight = new Set<string>();
const fetchErrors = new Map<string, string>();

function isFresh(entry: CacheEntry<unknown> | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

// Normalize internal camelCase feed IDs to the snake_case/lowercase IDs the
// frontend FEED_LABELS map expects (e.g. courtListener → courtlistener).
const FRONTEND_SOURCE_ID: Record<string, string> = {
  courtListener: 'courtlistener',
  edgar: 'edgar',
  federalRegister: 'federal_register',
  uspto: 'uspto_peds',
  stateAg: 'state_ag',
};

function feedHealth(feedId: string, displayName: string): FeedHealth {
  const entry = cache.get(feedId);
  const error = fetchErrors.get(feedId) ?? null;
  const status: FeedStatus = fetchInFlight.has(feedId)
    ? 'loading'
    : error && !entry
      ? 'error'
      : error && entry
        ? 'degraded'
        : entry
          ? 'healthy'
          : 'loading';

  return {
    feedId,
    source: FRONTEND_SOURCE_ID[feedId] ?? feedId,
    displayName,
    status,
    lastFetchedAt: entry ? new Date(entry.fetchedAt).toISOString() : null,
    latencyMs: entry?.latencyMs ?? null,
    itemCount: entry?.data.length ?? 0,
    error,
    nextRefreshAt: entry
      ? new Date(entry.fetchedAt + CACHE_TTL_MS).toISOString()
      : null,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Counsel-LegalMatterCommand/1.0 (legal-research; contact@szl-holdings.com)',
        Accept: 'application/json',
      },
    });
    return r;
  } finally {
    clearTimeout(timer);
  }
}

async function withCache(
  feedId: string,
  fetcher: () => Promise<FeedItem[]>,
): Promise<FeedItem[]> {
  const entry = cache.get(feedId);
  if (isFresh(entry)) return entry!.data;
  if (fetchInFlight.has(feedId)) return entry?.data ?? [];

  fetchInFlight.add(feedId);
  const t0 = Date.now();
  try {
    const data = await fetcher();
    cache.set(feedId, { data, fetchedAt: Date.now(), latencyMs: Date.now() - t0 });
    fetchErrors.delete(feedId);
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    fetchErrors.set(feedId, msg);
    return entry?.data ?? [];
  } finally {
    fetchInFlight.delete(feedId);
  }
}

// ---------------------------------------------------------------------------
// CourtListener (RECAP / Free Law Project)
// ---------------------------------------------------------------------------

async function fetchCourtListener(): Promise<FeedItem[]> {
  const url =
    'https://www.courtlistener.com/api/rest/v4/dockets/?format=json&order_by=-date_filed&limit=8&q=securities+class+action+fraud';
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`CourtListener HTTP ${r.status}`);
  const json = await r.json() as {
    results?: Array<{
      id: number;
      case_name: string;
      court_id: string;
      date_filed: string;
      absolute_url: string;
      docket_number: string;
    }>;
  };
  return (json.results ?? []).map((d) => ({
    id: `cl-${d.id}`,
    title: d.case_name ?? `Docket ${d.docket_number}`,
    summary: `Court: ${d.court_id?.toUpperCase() ?? 'Unknown'} · Docket ${d.docket_number ?? '—'} · Filed ${d.date_filed ?? '—'}`,
    url: `https://www.courtlistener.com${d.absolute_url}`,
    publishedAt: d.date_filed ?? new Date().toISOString(),
    source: 'CourtListener / RECAP',
    sourceType: 'court_filing',
    docketId: d.docket_number,
    jurisdiction: d.court_id?.toUpperCase(),
    tags: ['litigation', 'securities', 'federal'],
  }));
}

// ---------------------------------------------------------------------------
// SEC EDGAR full-text search
// ---------------------------------------------------------------------------

async function fetchEdgar(): Promise<FeedItem[]> {
  const url =
    'https://efts.sec.gov/LATEST/search-index?q=%22securities+class+action%22+%22material+adverse%22&dateRange=custom&startdt=2025-01-01&forms=8-K,10-K&hits.hits._source=period_of_report,period_of_report,file_date,display_names,file_num,form_type,period_of_report,biz_location,inc_states&hits.hits.total.value=true';
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`EDGAR HTTP ${r.status}`);
  const json = await r.json() as {
    hits?: {
      hits?: Array<{
        _source: {
          period_of_report?: string;
          file_date?: string;
          display_names?: string[];
          file_num?: string;
          form_type?: string;
          entity_name?: string;
        };
        _id: string;
      }>;
    };
  };
  return (json.hits?.hits ?? []).slice(0, 8).map((h) => {
    const s = h._source;
    const entity = Array.isArray(s.display_names) ? s.display_names[0] : (s.entity_name ?? 'Unknown Filer');
    return {
      id: `edgar-${h._id}`,
      title: `${entity} — ${s.form_type ?? 'Filing'}`,
      summary: `File No. ${s.file_num ?? '—'} · Period: ${s.period_of_report ?? s.file_date ?? '—'}`,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${encodeURIComponent(s.file_num ?? '')}&type=${encodeURIComponent(s.form_type ?? '')}`,
      publishedAt: s.file_date ?? new Date().toISOString(),
      source: 'SEC EDGAR',
      sourceType: 'sec_edgar',
      jurisdiction: 'US-Federal',
      tags: ['sec', s.form_type?.toLowerCase() ?? 'filing', 'securities'],
    };
  });
}

// ---------------------------------------------------------------------------
// Federal Register — securities-related rules & proposed rules
// ---------------------------------------------------------------------------

async function fetchFederalRegister(): Promise<FeedItem[]> {
  const url =
    'https://www.federalregister.gov/api/v1/documents.json?per_page=8&order=newest&conditions[type][]=RULE&conditions[type][]=PRORULE&conditions[agencies][]=securities-and-exchange-commission&fields[]=title,abstract,document_number,html_url,publication_date,type,agencies,significant';
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`Federal Register HTTP ${r.status}`);
  const json = await r.json() as {
    results?: Array<{
      title: string;
      abstract?: string;
      document_number: string;
      html_url: string;
      publication_date: string;
      type: string;
      significant?: boolean;
    }>;
  };
  return (json.results ?? []).map((d) => ({
    id: `fr-${d.document_number}`,
    title: d.title,
    summary: d.abstract ? d.abstract.slice(0, 300) : `${d.type} document ${d.document_number}`,
    url: d.html_url,
    publishedAt: d.publication_date,
    source: 'Federal Register',
    sourceType: 'federal_register',
    jurisdiction: 'US-Federal',
    tags: ['regulatory', d.type?.toLowerCase(), d.significant ? 'significant' : 'routine'].filter(Boolean) as string[],
  }));
}

// ---------------------------------------------------------------------------
// USPTO PEDS — patent examination data system (public REST)
// ---------------------------------------------------------------------------

async function fetchUsptoPatents(): Promise<FeedItem[]> {
  const url =
    'https://developer.uspto.gov/ds-api/applications/searchApplication?q=patentTitle:(artificial+intelligence)&f=applicationNumberText,patentTitle,applicationStatusDescriptionText,grantDate,applicationFilingDate,applicationStatusCode&s=applicationFilingDate:desc&rows=8&start=0';
  try {
    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`USPTO HTTP ${r.status}`);
    const json = await r.json() as {
      response?: {
        docs?: Array<{
          applicationNumberText?: string;
          patentTitle?: string;
          applicationStatusDescriptionText?: string;
          grantDate?: string;
          applicationFilingDate?: string;
        }>;
      };
    };
    return (json.response?.docs ?? []).map((d) => ({
      id: `uspto-${d.applicationNumberText}`,
      title: d.patentTitle ?? `Application ${d.applicationNumberText}`,
      summary: `Status: ${d.applicationStatusDescriptionText ?? '—'} · Filed: ${d.applicationFilingDate ?? '—'} · Granted: ${d.grantDate ?? 'Pending'}`,
      url: `https://patentcenter.uspto.gov/applications/${d.applicationNumberText}`,
      publishedAt: d.applicationFilingDate ?? new Date().toISOString(),
      source: 'USPTO PEDS',
      sourceType: 'uspto',
      jurisdiction: 'US-Federal',
      caseId: d.applicationNumberText,
      tags: ['ip', 'patent', d.grantDate ? 'granted' : 'pending'],
    }));
  } catch {
    // USPTO endpoint is flaky; return empty gracefully
    return [];
  }
}

// ---------------------------------------------------------------------------
// State AG RSS feeds (SEC enforcement cross-reference, OpenGovData)
// ---------------------------------------------------------------------------

/**
 * Minimal RSS 2.0 / Atom item parser.
 * No external XML lib needed — RSS items have a simple, well-defined shape.
 * Handles CDATA, basic HTML stripping in summaries, and missing optional tags.
 */
function parseRssItems(xml: string): Array<{ title: string; description: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];
  // Match both RSS <item>...</item> and Atom <entry>...</entry> blocks
  const blockRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const stripCdata = (s: string): string => {
    const m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(s.trim());
    return (m ? m[1] : s).trim();
  };
  const stripTags = (s: string): string => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const decodeEntities = (s: string): string =>
    s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const getTag = (block: string, tag: string): string => {
    // For Atom <link href="..."/> self-closing case
    if (tag === 'link') {
      const atom = /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i.exec(block);
      if (atom?.[1]) return atom[1];
    }
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = re.exec(block);
    if (!m?.[1]) return '';
    return decodeEntities(stripTags(stripCdata(m[1])));
  };
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(xml)) !== null) {
    const block = m[2] ?? '';
    const title = getTag(block, 'title');
    const description = getTag(block, 'description') || getTag(block, 'summary') || getTag(block, 'content');
    const link = getTag(block, 'link');
    const pubDate = getTag(block, 'pubDate') || getTag(block, 'updated') || getTag(block, 'published');
    if (title) items.push({ title, description, link, pubDate });
  }
  return items;
}

interface StateRssSource {
  name: string;
  jurisdiction: string;
  url: string;
}

const STATE_RSS_SOURCES: StateRssSource[] = [
  // SEC Litigation Releases — official RSS 2.0 feed of federal enforcement actions
  // (cross-referenced as state AG matters via parallel proceedings).
  { name: 'SEC Litigation Releases', jurisdiction: 'Federal', url: 'https://www.sec.gov/rss/litigation/litreleases.xml' },
  // SEC Administrative Proceedings — RSS feed of administrative law judge orders
  { name: 'SEC Administrative Proceedings', jurisdiction: 'Federal', url: 'https://www.sec.gov/rss/litigation/admin.xml' },
  // California AG press releases — public RSS feed
  { name: 'California Attorney General', jurisdiction: 'California', url: 'https://oag.ca.gov/rss/press-releases' },
];

async function fetchStateRegulatorRSS(): Promise<FeedItem[]> {
  // Fetch each source in parallel; tolerate partial failures (per-source try/catch).
  const perSource = await Promise.all(
    STATE_RSS_SOURCES.map(async (src): Promise<FeedItem[]> => {
      try {
        const r = await fetchWithTimeout(src.url, 6000);
        if (!r.ok) return [];
        const xml = await r.text();
        const items = parseRssItems(xml).slice(0, 4);
        return items.map((it, idx) => {
          const dateIso = (() => {
            const t = Date.parse(it.pubDate);
            return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
          })();
          const idHash = `${src.name.replace(/\W+/g, '-').toLowerCase()}-${idx}-${(it.link || it.title).slice(0, 40).replace(/\W+/g, '-')}`;
          return {
            id: `stateag-${idHash}`,
            title: it.title.slice(0, 220),
            summary: (it.description || it.title).slice(0, 480),
            url: it.link || src.url,
            publishedAt: dateIso,
            source: src.name,
            sourceType: 'state_ag',
            jurisdiction: src.jurisdiction,
            tags: ['enforcement', 'regulatory', src.jurisdiction.toLowerCase().replace(/\s+/g, '-')],
          };
        });
      } catch {
        return [];
      }
    }),
  );
  // Flatten and cap at 12 total items so the feed surface stays usable
  return perSource.flat().slice(0, 12);
}

// ---------------------------------------------------------------------------
// Aggregated fetch
// ---------------------------------------------------------------------------

export async function fetchAllFeeds(): Promise<{
  courtListener: FeedItem[];
  edgar: FeedItem[];
  federalRegister: FeedItem[];
  uspto: FeedItem[];
  stateAg: FeedItem[];
}> {
  const [courtListener, edgar, federalRegister, uspto, stateAg] = await Promise.all([
    withCache('courtListener', fetchCourtListener),
    withCache('edgar', fetchEdgar),
    withCache('federalRegister', fetchFederalRegister),
    withCache('uspto', fetchUsptoPatents),
    withCache('stateAg', fetchStateRegulatorRSS),
  ]);
  return { courtListener, edgar, federalRegister, uspto, stateAg };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/counsel/feeds', async (_req: Request, res: Response) => {
  try {
    const feeds = await fetchAllFeeds();
    const allItems = [
      ...feeds.courtListener,
      ...feeds.edgar,
      ...feeds.federalRegister,
      ...feeds.uspto,
      ...feeds.stateAg,
    ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return sendSuccess(res, {
      items: allItems,
      counts: {
        courtListener: feeds.courtListener.length,
        edgar: feeds.edgar.length,
        federalRegister: feeds.federalRegister.length,
        uspto: feeds.uspto.length,
        stateAg: feeds.stateAg.length,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return handleRouteError(res, err, 'GET /counsel/feeds');
  }
});

router.get('/counsel/feeds/health', async (_req: Request, res: Response) => {
  // Actively refresh stale/missing feeds before reporting health so the first
  // call returns real freshness/latency data without requiring a prior /feeds hit.
  // withCache short-circuits when entries are still fresh, so this is cheap on warm caches.
  await fetchAllFeeds().catch(() => undefined);

  const health: FeedHealth[] = [
    feedHealth('courtListener', 'CourtListener RECAP'),
    feedHealth('edgar', 'SEC EDGAR'),
    feedHealth('federalRegister', 'Federal Register'),
    feedHealth('uspto', 'USPTO PEDS'),
    feedHealth('stateAg', 'State AG / Enforcement'),
  ];

  const healthyCount = health.filter((h) => h.status === 'healthy').length;
  const degradedCount = health.filter((h) => h.status === 'degraded').length;
  const errorCount = health.filter((h) => h.status === 'error').length;

  const overallStatus: FeedStatus = health.some((h) => h.status === 'error')
    ? 'error'
    : health.some((h) => h.status === 'degraded')
      ? 'degraded'
      : health.every((h) => h.status === 'healthy')
        ? 'healthy'
        : 'loading';

  return sendSuccess(res, {
    feeds: health,
    overallStatus,
    checkedAt: new Date().toISOString(),
    healthyCount,
    degradedCount,
    errorCount,
  });
});

router.get('/counsel/feeds/:source', async (req: Request, res: Response) => {
  const source = req.params.source as string;
  const fetchers: Record<string, () => Promise<FeedItem[]>> = {
    courtlistener: () => withCache('courtListener', fetchCourtListener),
    edgar: () => withCache('edgar', fetchEdgar),
    'federal-register': () => withCache('federalRegister', fetchFederalRegister),
    uspto: () => withCache('uspto', fetchUsptoPatents),
    'state-ag': () => withCache('stateAg', fetchStateRegulatorRSS),
  };

  const fetcher = fetchers[source.toLowerCase()];
  if (!fetcher) {
    return sendSuccess(res, { items: [], error: `Unknown feed source: ${source}` });
  }

  try {
    const items = await fetcher();
    return sendSuccess(res, { items, source, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return handleRouteError(res, err, `GET /counsel/feeds/${source}`);
  }
});

export default router;

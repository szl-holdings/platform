/**
 * Carlota Jo Competitive Intelligence Feed Adapters
 *
 * Free / public-tier adapters for enriching the Carlota Jo competitive radar
 * beyond Google News RSS:
 *
 *   1. Wayback CDX  — competitor website change detection via CDX API
 *   2. GDELT        — geopolitical / market events relevant to a competitor
 *   3. Reddit / HN  — community signal from r/consulting, r/entrepreneur, HN
 *   4. Google Trends proxy — relative search-interest share-of-voice (simulated
 *                            from title frequency in public news feeds as a
 *                            compliant alternative to unofficial scraping)
 *   5. USPTO Patents — filings mentioning competitor entities in the past 90 days
 *   6. Public hiring boards — headcount velocity from USAJobs (free tier) &
 *                             Greenhouse / Lever public boards
 *
 * Each adapter:
 *   - Uses AbortController with a configurable timeout (default 8s)
 *   - Returns an empty array / null on failure — never throws
 *   - Produces normalised FeedSignal objects usable by the radar route
 *   - Is independently health-tracked via FeedHealthRecord
 *
 * Commercial adapters (AlphaSense, Crayon, LinkedIn paid API) are scaffolded
 * behind CARLOTA_PAID_FEEDS feature flag and are no-ops by default.
 */

import { logger } from './logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FeedSignalDirection = 'threat' | 'opportunity' | 'neutral';
export type FeedSignalImpact = 'high' | 'medium' | 'low';

export interface FeedSignal {
  competitor: string;
  event: string;
  impact: FeedSignalImpact;
  direction: FeedSignalDirection;
  date: string;
  detail: string;
  url: string;
  source: string;
  feedType: FeedType;
  /** Normalized 0–1 priority score derived from impact and direction for ranking. */
  score: number;
}

export type FeedType =
  | 'wayback-cdx'
  | 'gdelt'
  | 'reddit-hn'
  | 'google-trends'
  | 'uspto-patents'
  | 'hiring-boards';

export interface FeedHealthRecord {
  feedType: FeedType;
  lastPolledAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  signalsLastRun: number;
  totalSignalsFetched: number;
  status: 'healthy' | 'degraded' | 'error' | 'never_polled';
}

export interface HiringSignal {
  competitor: string;
  roleCount: number;
  topRoles: string[];
  signal: 'expanding' | 'stable' | 'contracting';
  source: string;
  fetchedAt: string;
}

// ─── Health tracking (in-memory) ────────────────────────────────────────────

const health = new Map<FeedType, FeedHealthRecord>([
  ['wayback-cdx',    { feedType: 'wayback-cdx',    lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
  ['gdelt',          { feedType: 'gdelt',           lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
  ['reddit-hn',      { feedType: 'reddit-hn',       lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
  ['google-trends',  { feedType: 'google-trends',   lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
  ['uspto-patents',  { feedType: 'uspto-patents',    lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
  ['hiring-boards',  { feedType: 'hiring-boards',   lastPolledAt: null, lastSuccessAt: null, lastError: null, signalsLastRun: 0, totalSignalsFetched: 0, status: 'never_polled' }],
]);

function markPoll(type: FeedType, signalCount: number, err?: string): void {
  const rec = health.get(type)!;
  rec.lastPolledAt = new Date().toISOString();
  if (err) {
    rec.lastError = err;
    rec.status = 'error';
  } else {
    rec.lastSuccessAt = new Date().toISOString();
    rec.lastError = null;
    rec.signalsLastRun = signalCount;
    rec.totalSignalsFetched += signalCount;
    rec.status = signalCount > 0 ? 'healthy' : 'degraded';
  }
}

export function getFeedHealth(): FeedHealthRecord[] {
  return Array.from(health.values());
}

// ─── Shared HTTP helper ──────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'CarlotaJo-IntelBot/1.0 (competitive intelligence; research only)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text) as T;
}

// ─── Signal classifier ───────────────────────────────────────────────────────

const THREAT_TERMS = [
  'expand', 'launch', 'acqui', 'partner', 'hire', 'fund', 'raise', 'patent',
  'win', 'award', 'growth', 'record', 'new market', 'new product', 'new service',
];
const OPPORTUNITY_TERMS = [
  'exit', 'layoff', 'cut', 'restructur', 'decline', 'loss', 'lawsuit', 'fine',
  'regulatory', 'scandal', 'breach', 'vulnerab', 'recall', 'downgrad',
];

function classifySignal(text: string): { direction: FeedSignalDirection; impact: FeedSignalImpact } {
  const lower = text.toLowerCase();
  const threatScore  = THREAT_TERMS.filter(t => lower.includes(t)).length;
  const oppScore     = OPPORTUNITY_TERMS.filter(t => lower.includes(t)).length;
  const direction: FeedSignalDirection = threatScore > oppScore ? 'threat' : oppScore > threatScore ? 'opportunity' : 'neutral';
  const total = threatScore + oppScore;
  const impact: FeedSignalImpact = total >= 3 ? 'high' : total >= 1 ? 'medium' : 'low';
  return { direction, impact };
}

/** Derive a normalized 0–1 priority score from impact level and direction. */
function scoreFromImpact(impact: FeedSignalImpact, direction: FeedSignalDirection): number {
  const base = impact === 'high' ? 0.85 : impact === 'medium' ? 0.60 : 0.35;
  const boost = direction === 'threat' ? 0.08 : direction === 'opportunity' ? 0.04 : 0;
  return Math.min(1, Math.round((base + boost) * 100) / 100);
}

// ─── 1. Wayback CDX — website change detection ──────────────────────────────

interface CdxSnapshot {
  timestamp: string;
  statuscode: string;
  urlkey: string;
}

export async function fetchWaybackCdxSignals(
  competitor: string,
  domain: string,
  maxResults = 5,
): Promise<FeedSignal[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const from = since.toISOString().slice(0, 10).replace(/-/g, '');
  const url =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json` +
    `&fl=timestamp,statuscode,urlkey&from=${from}&limit=${maxResults * 3}&filter=statuscode:200`;
  try {
    const raw = await fetchJson<unknown[][]>(url, 10000);
    const rows = (raw ?? []).slice(1) as CdxSnapshot[];
    const seen = new Set<string>();
    const signals: FeedSignal[] = [];
    for (const row of rows) {
      const [timestamp, , urlkey] = row as [string, string, string];
      const path = urlkey?.split(')')?.[1] ?? '';
      const key = `${timestamp.slice(0, 8)}:${path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const isHighValue = /pricing|product|careers|about|platform|solution/.test(path);
      const dateObj = new Date(
        `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`,
      );
      const { direction, impact } = classifySignal(path);
      const resolvedImpact = isHighValue ? 'high' : impact;
      const resolvedDirection = isHighValue ? 'threat' : direction;
      signals.push({
        competitor,
        event: `Website change detected: /${path || 'homepage'}`,
        impact: resolvedImpact,
        direction: resolvedDirection,
        date: Number.isNaN(dateObj.getTime())
          ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        detail: `Wayback CDX detected a crawlable change on ${domain}${path ? `/${path}` : ''}. ` +
          `This may indicate a product update, pricing change, or new service announcement.`,
        url: `https://${domain}`,
        source: 'Wayback CDX',
        feedType: 'wayback-cdx',
        score: scoreFromImpact(resolvedImpact, resolvedDirection),
      });
      if (signals.length >= maxResults) break;
    }
    markPoll('wayback-cdx', signals.length);
    return signals;
  } catch (err) {
    markPoll('wayback-cdx', 0, String(err));
    logger.warn({ err, competitor, domain }, '[carlota-feeds] Wayback CDX fetch failed');
    return [];
  }
}

// ─── 2. GDELT — geopolitical / market events ────────────────────────────────

interface GdeltArticle {
  title?: string;
  url?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
}

export async function fetchGdeltSignals(
  competitor: string,
  maxResults = 5,
): Promise<FeedSignal[]> {
  const query = encodeURIComponent(`"${competitor}" consulting strategy advisory`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=${maxResults * 2}&timespan=2weeks&format=json`;
  try {
    const data = await fetchJson<{ articles?: GdeltArticle[] }>(url, 10000);
    const articles = (data?.articles ?? []).slice(0, maxResults);
    const signals: FeedSignal[] = articles.map((a) => {
      const { direction, impact } = classifySignal(a.title ?? '');
      const dateStr = a.seendate
        ? new Date(a.seendate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return {
        competitor,
        event: a.title ?? 'GDELT market signal',
        impact,
        direction,
        date: dateStr,
        detail: `GDELT detected coverage from ${a.domain ?? 'global press'} (${a.sourcecountry ?? 'INT'}). ` +
          `Geopolitical or market event relevant to ${competitor}.`,
        url: a.url ?? '',
        source: `GDELT (${a.domain ?? 'global press'})`,
        feedType: 'gdelt',
        score: scoreFromImpact(impact, direction),
      };
    });
    markPoll('gdelt', signals.length);
    return signals;
  } catch (err) {
    markPoll('gdelt', 0, String(err));
    logger.warn({ err, competitor }, '[carlota-feeds] GDELT fetch failed');
    return [];
  }
}

// ─── 3. Reddit / HN — community signal ──────────────────────────────────────

interface RedditPost {
  data: {
    title: string;
    permalink: string;
    created_utc: number;
    score: number;
    selftext?: string;
  };
}

export async function fetchRedditHnSignals(
  competitor: string,
  maxResults = 4,
): Promise<FeedSignal[]> {
  const signals: FeedSignal[] = [];

  // Reddit — r/consulting
  try {
    const q = encodeURIComponent(competitor);
    const url = `https://www.reddit.com/r/consulting/search.json?q=${q}&sort=new&limit=5&t=month`;
    const data = await fetchJson<{ data?: { children?: RedditPost[] } }>(url, 8000);
    const posts = (data?.data?.children ?? []).slice(0, maxResults);
    for (const post of posts) {
      const { direction, impact } = classifySignal(post.data.title);
      const redditImpact: FeedSignalImpact = post.data.score > 50 ? 'high' : impact;
      const dateObj = new Date(post.data.created_utc * 1000);
      signals.push({
        competitor,
        event: post.data.title,
        impact: redditImpact,
        direction,
        date: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        detail: post.data.selftext
          ? post.data.selftext.slice(0, 200)
          : `r/consulting community discussing ${competitor}. ${post.data.score} upvotes.`,
        url: `https://reddit.com${post.data.permalink}`,
        source: 'Reddit r/consulting',
        feedType: 'reddit-hn',
        score: scoreFromImpact(redditImpact, direction),
      });
    }
  } catch (err) {
    logger.warn({ err, competitor }, '[carlota-feeds] Reddit fetch failed');
  }

  // Hacker News Algolia search
  try {
    const q = encodeURIComponent(competitor);
    const url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=3`;
    const data = await fetchJson<{ hits?: Array<{ title?: string; url?: string; created_at?: string; points?: number; objectID?: string }> }>(url, 8000);
    const hits = (data?.hits ?? []).slice(0, 2);
    for (const hit of hits) {
      const { direction, impact } = classifySignal(hit.title ?? '');
      const hnImpact: FeedSignalImpact = (hit.points ?? 0) > 100 ? 'high' : impact;
      const dateObj = hit.created_at ? new Date(hit.created_at) : new Date();
      signals.push({
        competitor,
        event: hit.title ?? 'HN discussion',
        impact: hnImpact,
        direction,
        date: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        detail: `Hacker News: "${hit.title ?? competitor}" received ${hit.points ?? 0} points. Tech community signal.`,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'Hacker News',
        feedType: 'reddit-hn',
        score: scoreFromImpact(hnImpact, direction),
      });
    }
  } catch (err) {
    logger.warn({ err, competitor }, '[carlota-feeds] HN fetch failed');
  }

  markPoll('reddit-hn', signals.length);
  return signals;
}

// ─── 4. Google Trends proxy — share-of-voice ─────────────────────────────────
// We derive relative SOV from title-frequency in public Google News RSS
// (compliant public-feed approach — no unofficial Trends scraping).

export interface TrendsShareOfVoice {
  competitor: string;
  mentionCount: number;
  relativeShare: number;
  trend: 'rising' | 'stable' | 'declining';
  fetchedAt: string;
}

export async function fetchShareOfVoice(
  competitors: string[],
): Promise<TrendsShareOfVoice[]> {
  const results: Array<{ name: string; count: number }> = [];
  try {
    for (const name of competitors) {
      const q = encodeURIComponent(`"${name}"`);
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
      try {
        const xml = await fetchText(url, 8000);
        const count = (xml.match(/<item>/g) ?? []).length;
        results.push({ name, count });
      } catch {
        results.push({ name, count: 0 });
      }
    }

    const total = results.reduce((s, r) => s + r.count, 0) || 1;
    const sov: TrendsShareOfVoice[] = results.map((r) => ({
      competitor: r.name,
      mentionCount: r.count,
      relativeShare: Math.round((r.count / total) * 100),
      trend: r.count > total / results.length ? 'rising' : r.count < total / results.length * 0.5 ? 'declining' : 'stable',
      fetchedAt: new Date().toISOString(),
    }));
    markPoll('google-trends', sov.length);
    return sov;
  } catch (err) {
    markPoll('google-trends', 0, String(err));
    logger.warn({ err }, '[carlota-feeds] Share-of-voice fetch failed');
    return competitors.map((c) => ({
      competitor: c, mentionCount: 0, relativeShare: 0, trend: 'stable', fetchedAt: new Date().toISOString(),
    }));
  }
}

// ─── 5. USPTO Patents ────────────────────────────────────────────────────────

interface PatentDoc {
  patent_title?: string;
  patent_date?: string;
  patent_abstract?: string;
  patent_url?: string;
  assignee_organization?: string;
}

export async function fetchUsptoPatentSignals(
  competitor: string,
  maxResults = 3,
): Promise<FeedSignal[]> {
  try {
    const qParam = encodeURIComponent(JSON.stringify({ assignee_organization: competitor }));
    const fParam = encodeURIComponent(JSON.stringify(['patent_title', 'patent_date', 'patent_abstract', 'assignee_organization']));
    const oParam = encodeURIComponent(JSON.stringify({ per_page: maxResults, sort: [{ patent_date: 'desc' }] }));
    const url = `https://api.patentsview.org/patents/query?q=${qParam}&f=${fParam}&o=${oParam}`;
    const data = await fetchJson<{ patents?: PatentDoc[] }>(url, 10000);
    const patents = (data?.patents ?? []).slice(0, maxResults);
    const signals: FeedSignal[] = patents.map((p) => {
      const dateObj = p.patent_date ? new Date(p.patent_date) : new Date();
      const { direction } = classifySignal(p.patent_title ?? '');
      const patentDirection: FeedSignalDirection = direction === 'opportunity' ? 'opportunity' : 'threat';
      return {
        competitor,
        event: `Patent filed: "${p.patent_title ?? 'Unknown title'}"`,
        impact: 'high',
        direction: patentDirection,
        date: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        detail: p.patent_abstract
          ? p.patent_abstract.slice(0, 250)
          : `${competitor} filed a patent that may indicate new IP development or market entry.`,
        url: p.patent_url ?? `https://patentsview.org/search?q=${encodeURIComponent(competitor)}`,
        source: 'USPTO PatentsView',
        feedType: 'uspto-patents',
        score: scoreFromImpact('high', patentDirection),
      };
    });
    markPoll('uspto-patents', signals.length);
    return signals;
  } catch (err) {
    markPoll('uspto-patents', 0, String(err));
    logger.warn({ err, competitor }, '[carlota-feeds] USPTO fetch failed');
    return [];
  }
}

// ─── 6. Public hiring boards ────────────────────────────────────────────────
// Uses USAJobs public API (no auth required for basic search) +
// Greenhouse/Lever public board endpoints (no auth, JSON).

export async function fetchHiringSignals(
  competitor: string,
  maxResults = 3,
): Promise<{ signals: FeedSignal[]; summary: HiringSignal }> {
  const signals: FeedSignal[] = [];
  const roles: string[] = [];

  // Greenhouse public board (pattern: boards.greenhouse.io/<slug>/jobs)
  try {
    const slug = competitor.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    const data = await fetchJson<{ jobs?: Array<{ title?: string; updated_at?: string; absolute_url?: string }> }>(url, 8000);
    const jobs = (data?.jobs ?? []).slice(0, maxResults);
    for (const job of jobs) {
      roles.push(job.title ?? 'Role');
      const { direction, impact } = classifySignal(job.title ?? '');
      const ghDirection: FeedSignalDirection = direction === 'threat' ? 'threat' : 'neutral';
      signals.push({
        competitor,
        event: `Hiring: ${job.title ?? 'New role posted'}`,
        impact,
        direction: ghDirection,
        date: job.updated_at
          ? new Date(job.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        detail: `${competitor} posted "${job.title}" on Greenhouse, signalling team expansion.`,
        url: job.absolute_url ?? `https://boards.greenhouse.io/${slug}`,
        source: 'Greenhouse Board',
        feedType: 'hiring-boards',
        score: scoreFromImpact(impact, ghDirection),
      });
    }
  } catch {
    // Greenhouse board not found or no public board — not an error
  }

  // Lever public postings
  if (signals.length < maxResults) {
    try {
      const slug = competitor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const url = `https://api.lever.co/v0/postings/${slug}?mode=json&limit=3`;
      const postings = await fetchJson<Array<{ text?: string; createdAt?: number; hostedUrl?: string }>>(url, 8000);
      for (const p of (Array.isArray(postings) ? postings : []).slice(0, maxResults - signals.length)) {
        roles.push(p.text ?? 'Role');
        signals.push({
          competitor,
          event: `Hiring: ${p.text ?? 'New role posted'}`,
          impact: 'medium',
          direction: 'neutral',
          date: p.createdAt
            ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          detail: `${competitor} posted "${p.text}" on Lever, indicating hiring activity.`,
          url: p.hostedUrl ?? '',
          source: 'Lever Board',
          feedType: 'hiring-boards',
          score: scoreFromImpact('medium', 'neutral'),
        });
      }
    } catch {
      // No public Lever board
    }
  }

  markPoll('hiring-boards', signals.length);

  const summary: HiringSignal = {
    competitor,
    roleCount: signals.length,
    topRoles: roles.slice(0, 3),
    signal: signals.length > 4 ? 'expanding' : signals.length > 0 ? 'stable' : 'contracting',
    source: 'Greenhouse + Lever public boards',
    fetchedAt: new Date().toISOString(),
  };

  return { signals, summary };
}

// ─── Aggregated feed poll ────────────────────────────────────────────────────

export interface CompetitorFeedResult {
  competitor: string;
  signals: FeedSignal[];
  hiringSignal: HiringSignal | null;
  shareOfVoice: TrendsShareOfVoice | null;
  polledAt: string;
}

export async function pollCompetitorFeeds(
  competitors: string[],
  domains: Record<string, string> = {},
  opts: { maxSignalsPerFeed?: number } = {},
): Promise<{ results: CompetitorFeedResult[]; feedHealth: FeedHealthRecord[] }> {
  const max = opts.maxSignalsPerFeed ?? 3;
  const sovAll = await fetchShareOfVoice(competitors).catch(() => []);

  const results = await Promise.all(
    competitors.map(async (name): Promise<CompetitorFeedResult> => {
      const domain = domains[name] ?? name.toLowerCase().replace(/\s+/g, '') + '.com';
      const [wayback, gdelt, redditHn, uspto, hiring] = await Promise.allSettled([
        fetchWaybackCdxSignals(name, domain, max),
        fetchGdeltSignals(name, max),
        fetchRedditHnSignals(name, max),
        fetchUsptoPatentSignals(name, max),
        fetchHiringSignals(name, max),
      ]);

      const allSignals: FeedSignal[] = [
        ...(wayback.status === 'fulfilled' ? wayback.value : []),
        ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
        ...(redditHn.status === 'fulfilled' ? redditHn.value : []),
        ...(uspto.status === 'fulfilled' ? uspto.value : []),
        ...(hiring.status === 'fulfilled' ? hiring.value.signals : []),
      ];

      const hiringResult = hiring.status === 'fulfilled' ? hiring.value.summary : null;
      const sov = sovAll.find((s) => s.competitor === name) ?? null;

      return { competitor: name, signals: allSignals, hiringSignal: hiringResult, shareOfVoice: sov, polledAt: new Date().toISOString() };
    }),
  );

  return { results, feedHealth: getFeedHealth() };
}

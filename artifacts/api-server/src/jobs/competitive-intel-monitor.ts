/**
 * Competitive Intel Monitor
 *
 * Polls product blogs / RSS feeds for the champions tracked in the SZL
 * Competitive Atlas (CrowdStrike, Clio, CoStar, Windward, Palantir,
 * ThoughtSpot, etc.) and surfaces "major feature ship" events as Intel
 * Update alerts that render on the Atlas page.
 *
 * Persistence:
 *   - Backed by Postgres (`competitive_intel_feeds`, `competitive_intel_alerts`,
 *     `competitive_intel_state` in `@szl-holdings/db`) so dismiss state, feed
 *     config, and feed health survive restarts and unify across api-server
 *     replicas. The previous JSON file at `.data/competitive-intel.json` is
 *     auto-migrated on first boot, then left in place as `.bak` for safety.
 *   - Network-tolerant: feed fetches use AbortController timeouts and any
 *     failure on a single feed is logged + skipped, never throws.
 *   - Always demoable: ships with a seeded alert per lane so the UI is rich
 *     on first boot even before the first poll succeeds.
 *   - Classification: a lightweight keyword heuristic flags entries as
 *     "major feature" announcements and recommends an SZL response
 *     (adopt / counter / monitor).
 */

import {
  competitiveIntelAlertsTable,
  competitiveIntelFeedsTable,
  competitiveIntelStateTable,
  type CompetitiveIntelAlert as DbAlert,
  type CompetitiveIntelFeed as DbFeed,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Recommendation = 'adopt' | 'counter' | 'monitor';

export interface ChampionFeed {
  id: string;
  laneId: string;
  champion: string;
  feedUrl: string;
  homeUrl: string;
  paused?: boolean;
  recommendationHint?: Recommendation;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntelAlert {
  id: string;
  laneId: string;
  champion: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  detectedAt: string;
  recommendation: Recommendation;
  recommendationReason: string;
  dismissed: boolean;
  dismissedAt?: string;
  source: 'rss' | 'seed';
  /**
   * ISO timestamp when this alert was pushed to Slack/email. Set the first
   * time `notifyNewAlerts` includes the alert in a dispatch so we never
   * re-notify on subsequent poll cycles even if the alert is later
   * dismissed and undismissed. Persisted on the alerts row.
   */
  notifiedAt?: string;
}

export interface LaneInfo {
  laneId: string;
  champions: string[];
  muted: boolean;
}

export interface FeedHealth {
  feedId: string;
  champion: string;
  laneId: string;
  lastPolledAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemsSeen: number;
  alertsCreated: number;
}

interface PollResult {
  polledFeeds: number;
  successfulFeeds: number;
  newAlerts: number;
  durationMs: number;
}

// ─── Champion feeds (defaults — seeded into DB on first boot) ────────────────

export const DEFAULT_CHAMPION_FEEDS: ChampionFeed[] = [
  // Cyber Resilience
  {
    id: 'crowdstrike-blog',
    laneId: 'cyber',
    champion: 'CrowdStrike',
    feedUrl: 'https://www.crowdstrike.com/blog/feed/',
    homeUrl: 'https://www.crowdstrike.com/blog/',
  },
  {
    id: 'darktrace-blog',
    laneId: 'cyber',
    champion: 'Darktrace',
    feedUrl: 'https://darktrace.com/blog/rss.xml',
    homeUrl: 'https://darktrace.com/blog',
  },
  // Legal Matter Command
  {
    id: 'clio-blog',
    laneId: 'legal',
    champion: 'Clio',
    feedUrl: 'https://www.clio.com/blog/feed/',
    homeUrl: 'https://www.clio.com/blog/',
  },
  // Real Estate Intelligence
  {
    id: 'costar-news',
    laneId: 'real-estate',
    champion: 'CoStar',
    feedUrl: 'https://www.costar.com/rss/news.xml',
    homeUrl: 'https://www.costar.com/news',
  },
  // Maritime Intelligence
  {
    id: 'windward-blog',
    laneId: 'maritime',
    champion: 'Windward',
    feedUrl: 'https://windward.ai/feed/',
    homeUrl: 'https://windward.ai/blog/',
  },
  // Executive Briefing
  {
    id: 'palantir-blog',
    laneId: 'executive-briefing',
    champion: 'Palantir',
    feedUrl: 'https://blog.palantir.com/feed',
    homeUrl: 'https://blog.palantir.com/',
  },
  // Decision Intelligence
  {
    id: 'thoughtspot-blog',
    laneId: 'decision-intelligence',
    champion: 'ThoughtSpot',
    feedUrl: 'https://www.thoughtspot.com/blog/rss.xml',
    homeUrl: 'https://www.thoughtspot.com/blog',
  },
  // Holdings Strategy
  {
    id: 'palantir-foundry-blog',
    laneId: 'holdings-strategy',
    champion: 'Palantir Foundry',
    feedUrl: 'https://blog.palantir.com/feed',
    homeUrl: 'https://blog.palantir.com/',
  },
];

/**
 * Live, mutable list of champion feeds — kept in sync with the DB after every
 * mutation. Exists for backward compatibility with consumers (routes, tests)
 * that import `CHAMPION_FEEDS` directly. Reads from this array are best-effort
 * snapshots; callers wanting the authoritative list should use `listFeeds()`.
 */
export const CHAMPION_FEEDS: ChampionFeed[] = [];

// ─── Mappers between DB rows and API shapes ──────────────────────────────────

function feedFromRow(row: DbFeed): ChampionFeed {
  return {
    id: row.id,
    laneId: row.laneId,
    champion: row.champion,
    feedUrl: row.feedUrl,
    homeUrl: row.homeUrl,
    paused: row.paused,
    recommendationHint: row.recommendationHint ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function healthFromRow(row: DbFeed): FeedHealth {
  return {
    feedId: row.id,
    champion: row.champion,
    laneId: row.laneId,
    lastPolledAt: row.lastPolledAt ? row.lastPolledAt.toISOString() : null,
    lastSuccessAt: row.lastSuccessAt ? row.lastSuccessAt.toISOString() : null,
    lastError: row.lastError ?? null,
    itemsSeen: row.itemsSeen,
    alertsCreated: row.alertsCreated,
  };
}

function alertFromRow(row: DbAlert): IntelAlert {
  return {
    id: row.id,
    laneId: row.laneId,
    champion: row.champion,
    title: row.title,
    summary: row.summary,
    link: row.link,
    publishedAt: row.publishedAt.toISOString(),
    detectedAt: row.detectedAt.toISOString(),
    recommendation: row.recommendation,
    recommendationReason: row.recommendationReason,
    dismissed: row.dismissed,
    dismissedAt: row.dismissedAt ? row.dismissedAt.toISOString() : undefined,
    source: row.source,
    notifiedAt: row.notifiedAt ? row.notifiedAt.toISOString() : undefined,
  };
}

// ─── Bootstrap / migration ───────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'competitive-intel.json');

/** Legacy on-disk shape — only used during one-shot migration. */
interface PersistedState {
  alerts?: IntelAlert[];
  feedHealth?: Record<string, FeedHealth>;
  lastFullPollAt?: string | null;
  pollRunCount?: number;
  seededAt?: string | null;
  feeds?: ChampionFeed[];
  feedsSeededAt?: string | null;
  /**
   * Per-lane mute switches inherited from the legacy file. Migrated into
   * `competitive_intel_state.meta.mutedLanes` on first boot.
   */
  mutedLanes?: Record<string, boolean>;
}

/**
 * In-process cache of per-lane mute switches. Loaded from
 * `competitive_intel_state.meta.mutedLanes` during `ensureLoaded`, kept in
 * sync by `setLaneMute`. Backed by Postgres so the cache is rebuilt on every
 * restart from the authoritative state row. Exists so `isLaneMuted` (called
 * from synchronous notification predicates) does not have to await a query.
 */
const _mutedLanesCache: Record<string, boolean> = {};

let _loaded = false;
let _loadingPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (_loaded) return;
  if (_loadingPromise) return _loadingPromise;
  _loadingPromise = (async () => {
    try {
      await ensureStateRow();
      await migrateLegacyJsonIfPresent();
      await seedFeedsIfEmpty();
      await seedAlertsIfNeeded();
      await refreshFeedsCache();
      await refreshMutedLanesCache();
      _loaded = true;
    } finally {
      _loadingPromise = null;
    }
  })();
  return _loadingPromise;
}

async function ensureStateRow(): Promise<void> {
  await db
    .insert(competitiveIntelStateTable)
    .values({ id: 1, pollRunCount: 0 })
    .onConflictDoNothing();
}

async function getState() {
  const rows = await db
    .select()
    .from(competitiveIntelStateTable)
    .where(eq(competitiveIntelStateTable.id, 1))
    .limit(1);
  return rows[0];
}

async function refreshFeedsCache(): Promise<void> {
  const rows = await db.select().from(competitiveIntelFeedsTable);
  CHAMPION_FEEDS.length = 0;
  for (const r of rows) CHAMPION_FEEDS.push(feedFromRow(r));
}

async function seedFeedsIfEmpty(): Promise<void> {
  const state = await getState();
  if (state?.feedsSeededAt) return;
  const existing = await db
    .select({ id: competitiveIntelFeedsTable.id })
    .from(competitiveIntelFeedsTable);
  if (existing.length === 0) {
    const now = new Date();
    for (const f of DEFAULT_CHAMPION_FEEDS) {
      await db
        .insert(competitiveIntelFeedsTable)
        .values({
          id: f.id,
          laneId: f.laneId,
          champion: f.champion,
          feedUrl: f.feedUrl,
          homeUrl: f.homeUrl,
          paused: f.paused === true,
          recommendationHint: f.recommendationHint ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }
  await db
    .update(competitiveIntelStateTable)
    .set({ feedsSeededAt: new Date() })
    .where(eq(competitiveIntelStateTable.id, 1));
}

async function seedAlertsIfNeeded(): Promise<void> {
  const state = await getState();
  if (state?.alertsSeededAt) return;
  const seeds = buildSeedAlerts();
  if (seeds.length > 0) {
    await db.insert(competitiveIntelAlertsTable).values(seeds).onConflictDoNothing();
  }
  await db
    .update(competitiveIntelStateTable)
    .set({ alertsSeededAt: new Date() })
    .where(eq(competitiveIntelStateTable.id, 1));
}

/**
 * One-shot migration of `.data/competitive-intel.json` into Postgres. Runs at
 * most once: after a successful import we stamp `json_migrated_at` and rename
 * the file to `.bak` so a second boot is a no-op even if the marker is lost.
 */
async function migrateLegacyJsonIfPresent(): Promise<void> {
  const state = await getState();
  if (state?.jsonMigratedAt) return;
  let raw: string;
  try {
    raw = await fs.readFile(STATE_FILE, 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return; // nothing to migrate
    logger.warn({ err }, '[competitive-intel] Failed to read legacy JSON for migration');
    return;
  }
  let parsed: PersistedState;
  try {
    parsed = JSON.parse(raw) as PersistedState;
  } catch (err) {
    logger.warn({ err }, '[competitive-intel] Legacy JSON is malformed — skipping migration');
    return;
  }

  let migratedFeeds = 0;
  let migratedAlerts = 0;

  if (Array.isArray(parsed.feeds) && parsed.feeds.length > 0) {
    for (const f of parsed.feeds) {
      const health = parsed.feedHealth?.[f.id];
      const createdAt = f.createdAt ? new Date(f.createdAt) : new Date();
      const updatedAt = f.updatedAt ? new Date(f.updatedAt) : createdAt;
      await db
        .insert(competitiveIntelFeedsTable)
        .values({
          id: f.id,
          laneId: f.laneId,
          champion: f.champion,
          feedUrl: f.feedUrl,
          homeUrl: f.homeUrl,
          paused: f.paused === true,
          recommendationHint: f.recommendationHint ?? null,
          lastPolledAt: health?.lastPolledAt ? new Date(health.lastPolledAt) : null,
          lastSuccessAt: health?.lastSuccessAt ? new Date(health.lastSuccessAt) : null,
          lastError: health?.lastError ?? null,
          itemsSeen: health?.itemsSeen ?? 0,
          alertsCreated: health?.alertsCreated ?? 0,
          createdAt,
          updatedAt,
        })
        .onConflictDoNothing();
      migratedFeeds++;
    }
  }

  if (Array.isArray(parsed.alerts) && parsed.alerts.length > 0) {
    for (const a of parsed.alerts) {
      try {
        await db
          .insert(competitiveIntelAlertsTable)
          .values({
            id: a.id,
            laneId: a.laneId,
            champion: a.champion,
            title: a.title,
            summary: a.summary,
            link: a.link,
            publishedAt: new Date(a.publishedAt),
            detectedAt: a.detectedAt ? new Date(a.detectedAt) : new Date(),
            recommendation: a.recommendation,
            recommendationReason: a.recommendationReason,
            dismissed: a.dismissed === true,
            dismissedAt: a.dismissedAt ? new Date(a.dismissedAt) : null,
            source: a.source,
            notifiedAt: a.notifiedAt ? new Date(a.notifiedAt) : null,
          })
          .onConflictDoNothing();
        migratedAlerts++;
      } catch (err) {
        logger.warn({ err, alertId: a.id }, '[competitive-intel] Skipping malformed legacy alert');
      }
    }
  }

  const meta: Record<string, unknown> = {};
  if (parsed.mutedLanes && typeof parsed.mutedLanes === 'object') {
    meta.mutedLanes = parsed.mutedLanes;
  }

  await db
    .update(competitiveIntelStateTable)
    .set({
      jsonMigratedAt: new Date(),
      lastFullPollAt: parsed.lastFullPollAt ? new Date(parsed.lastFullPollAt) : null,
      pollRunCount: typeof parsed.pollRunCount === 'number' ? parsed.pollRunCount : 0,
      alertsSeededAt: parsed.seededAt ? new Date(parsed.seededAt) : null,
      feedsSeededAt: parsed.feedsSeededAt ? new Date(parsed.feedsSeededAt) : null,
      meta: Object.keys(meta).length > 0 ? meta : null,
    })
    .where(eq(competitiveIntelStateTable.id, 1));

  // Rename the legacy file so this branch is a strict no-op on subsequent
  // boots, even if the marker row is wiped.
  try {
    await fs.rename(STATE_FILE, `${STATE_FILE}.bak`);
  } catch (err) {
    logger.debug({ err }, '[competitive-intel] Could not rename legacy JSON to .bak');
  }

  logger.info(
    { migratedFeeds, migratedAlerts },
    '[competitive-intel] Migrated legacy JSON store into Postgres',
  );
}

// ─── Seed alerts ─────────────────────────────────────────────────────────────

function buildSeedAlerts(): Array<typeof competitiveIntelAlertsTable.$inferInsert> {
  const now = Date.now();
  const detectedAt = new Date();
  const seeds: Array<{
    id: string;
    laneId: string;
    champion: string;
    title: string;
    summary: string;
    link: string;
    publishedAt: Date;
    recommendation: Recommendation;
    recommendationReason: string;
  }> = [
    {
      id: 'seed-crowdstrike-charlotte-actions',
      laneId: 'cyber',
      champion: 'CrowdStrike',
      title: 'Charlotte AI Detection Actions — agentic triage now GA',
      summary:
        'CrowdStrike opened the Charlotte AI agentic triage capability to all Falcon customers, letting analysts hand off triage of low-severity detections to an autonomous agent with audit trail.',
      link: 'https://www.crowdstrike.com/blog/',
      publishedAt: new Date(now - 4 * 24 * 3600_000),
      recommendation: 'counter',
      recommendationReason:
        'Sentra already wraps every action in a governed proof envelope — counter by emphasising approver identity and reversibility on the Incident Commander surface.',
    },
    {
      id: 'seed-clio-matter-stages-mobile',
      laneId: 'legal',
      champion: 'Clio',
      title: 'Matter Stages now available in Clio Mobile',
      summary:
        'Clio extended its visual Matter Stages pipeline to the iOS and Android apps so attorneys can advance matters from anywhere.',
      link: 'https://www.clio.com/blog/',
      publishedAt: new Date(now - 2 * 24 * 3600_000),
      recommendation: 'adopt',
      recommendationReason:
        'PRISM Counsel already mirrors Matter Stages on the desktop — extending the rail to the SZL Holdings mobile shell would close the parity gap.',
    },
    {
      id: 'seed-costar-loan-overlay',
      laneId: 'real-estate',
      champion: 'CoStar',
      title: 'CoStar adds CMBS loan overlay directly on the property pin',
      summary:
        'CoStar shipped a loan-data overlay so brokers can see active CMBS terms, maturity, and DSCR without leaving the property card.',
      link: 'https://www.costar.com/news',
      publishedAt: new Date(now - 6 * 24 * 3600_000),
      recommendation: 'adopt',
      recommendationReason:
        'Terra has the data via CRED iQ — wire a Loan Overlay strip onto the property card so analysts stop tab-switching.',
    },
    {
      id: 'seed-windward-rf-fusion',
      laneId: 'maritime',
      champion: 'Windward',
      title: 'Windward fuses RF GEOINT signals into Predictive Intelligence',
      summary:
        "Windward's Maritime AI now ingests commercial RF GEOINT alongside AIS and SAR, sharpening dark-vessel detection in chokepoints.",
      link: 'https://windward.ai/blog/',
      publishedAt: new Date(now - 9 * 24 * 3600_000),
      recommendation: 'monitor',
      recommendationReason:
        'Vessels already shows Intelligence Sources fusion badges — monitor RF coverage gaps and prioritise an RF data partner if customers ask.',
    },
    {
      id: 'seed-palantir-aip-now',
      laneId: 'executive-briefing',
      champion: 'Palantir',
      title: 'AIP Now — daily executive briefing template kit',
      summary:
        'Palantir released a packaged template for executive daily briefings inside AIP, including sourcing strips and recommendation cards.',
      link: 'https://blog.palantir.com/',
      publishedAt: new Date(now - 1 * 24 * 3600_000),
      recommendation: 'counter',
      recommendationReason:
        "Pulse already ships Today's Brief with provenance + dissent — counter with a side-by-side comparison demo emphasising cross-domain consensus.",
    },
    {
      id: 'seed-thoughtspot-spotter',
      laneId: 'decision-intelligence',
      champion: 'ThoughtSpot',
      title: 'ThoughtSpot Spotter — agentic analytics in the same chat thread',
      summary:
        'ThoughtSpot introduced Spotter, an agentic analytics assistant that returns answers, charts, and follow-up questions in a single conversation.',
      link: 'https://www.thoughtspot.com/blog',
      publishedAt: new Date(now - 5 * 24 * 3600_000),
      recommendation: 'adopt',
      recommendationReason:
        "Lyte's Signals Console NL bar should grow follow-up question chips so it matches Spotter's conversational loop.",
    },
    {
      id: 'seed-palantir-foundry-warp',
      laneId: 'holdings-strategy',
      champion: 'Palantir Foundry',
      title: 'Foundry Warp Speed — ontology-driven app generation',
      summary:
        'Foundry shipped Warp Speed, letting non-engineers spin up ontology-grounded apps from a prompt with full lineage preserved.',
      link: 'https://blog.palantir.com/',
      publishedAt: new Date(now - 7 * 24 * 3600_000),
      recommendation: 'monitor',
      recommendationReason:
        'Command already exposes ontology via the Worldline Registry — monitor enterprise reactions before investing in a builder surface.',
    },
  ];
  return seeds.map((s) => ({
    ...s,
    detectedAt,
    dismissed: false,
    source: 'seed' as const,
  }));
}

// ─── RSS parser (tiny, dependency-free) ──────────────────────────────────────

interface ParsedItem {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
  guid: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)));
}

function stripHtml(s: string): string {
  return decodeEntities(
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function pickTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return null;
  const inner = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  return inner;
}

function pickAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"[^>]*/?>`, 'i');
  const m = block.match(re);
  return m ? m[1] : null;
}

function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const blockRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const matches = xml.match(blockRe) ?? [];
  for (const block of matches) {
    const title = stripHtml(pickTag(block, 'title') ?? '');
    let link = pickTag(block, 'link') ?? '';
    if (!link || /<link\b/i.test(`<link${link}`)) {
      link = pickAttr(block, 'link', 'href') ?? link;
    }
    link = stripHtml(link);
    const summary = stripHtml(
      pickTag(block, 'description') ?? pickTag(block, 'summary') ?? pickTag(block, 'content') ?? '',
    );
    const pubDate = stripHtml(
      pickTag(block, 'pubDate') ?? pickTag(block, 'published') ?? pickTag(block, 'updated') ?? '',
    );
    const guid = stripHtml(pickTag(block, 'guid') ?? pickTag(block, 'id') ?? link);
    if (title && link) {
      items.push({ title, link, summary: summary.slice(0, 600), pubDate, guid });
    }
  }
  return items;
}

// ─── Classification ──────────────────────────────────────────────────────────

const MAJOR_FEATURE_KEYWORDS = [
  'introducing',
  'introduces',
  'announces',
  'announcing',
  'now available',
  'general availability',
  ' ga ',
  'launches',
  'launching',
  'launched',
  'release',
  'released',
  'ships',
  'shipping',
  'new feature',
  'unveils',
  'rolls out',
  'rolling out',
  'extends',
  'expands',
  'powered by',
  'agent',
  'copilot',
  'ai-native',
];

function isMajorFeatureAnnouncement(title: string, summary: string): boolean {
  const hay = `${title} ${summary}`.toLowerCase();
  return MAJOR_FEATURE_KEYWORDS.some((k) => hay.includes(k));
}

const ADOPT_HINTS = [
  'mobile',
  'kanban',
  'pipeline',
  'overlay',
  'dashboard',
  'chart',
  'template',
  'matter',
  'comp',
  'loan',
];
const COUNTER_HINTS = [
  'agent',
  'copilot',
  'agentic',
  'autonomous',
  'ai-native',
  'natural language',
  'generative',
];

function classifyRecommendation(
  title: string,
  summary: string,
): { rec: Recommendation; reason: string } {
  const hay = `${title} ${summary}`.toLowerCase();
  if (COUNTER_HINTS.some((k) => hay.includes(k))) {
    return {
      rec: 'counter',
      reason:
        'Touches our Governed Autonomy moat — counter by emphasising approver identity, reversibility, and proof chain on the matching SZL surface.',
    };
  }
  if (ADOPT_HINTS.some((k) => hay.includes(k))) {
    return {
      rec: 'adopt',
      reason:
        'Looks like a UX or workflow pattern we can reinterpret in our voice — log into the Steal-This board for triage.',
    };
  }
  return {
    rec: 'monitor',
    reason:
      'No immediate action — keep the alert for trend tracking and revisit on next Atlas review.',
  };
}

// ─── Polling ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SZL-Competitive-Intel/1.0 (+https://szlholdings.com)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function alertIdFor(feedId: string, item: ParsedItem): string {
  const basis = item.guid || item.link;
  let h = 0;
  for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) | 0;
  return `${feedId}-${Math.abs(h).toString(36)}`;
}

async function pollFeed(feed: DbFeed): Promise<{ created: number; ok: boolean }> {
  if (feed.paused) {
    await db
      .update(competitiveIntelFeedsTable)
      .set({ lastPolledAt: new Date(), lastError: 'paused', updatedAt: new Date() })
      .where(eq(competitiveIntelFeedsTable.id, feed.id));
    return { created: 0, ok: false };
  }

  const polledAt = new Date();
  let xml: string;
  try {
    xml = await fetchWithTimeout(feed.feedUrl);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db
      .update(competitiveIntelFeedsTable)
      .set({ lastPolledAt: polledAt, lastError: errMsg, updatedAt: new Date() })
      .where(eq(competitiveIntelFeedsTable.id, feed.id));
    logger.debug({ feedId: feed.id, err: errMsg }, '[competitive-intel] Feed fetch failed');
    return { created: 0, ok: false };
  }

  let items: ParsedItem[] = [];
  try {
    items = parseFeed(xml);
  } catch (err) {
    const errMsg = `parse: ${err instanceof Error ? err.message : String(err)}`;
    await db
      .update(competitiveIntelFeedsTable)
      .set({ lastPolledAt: polledAt, lastError: errMsg, updatedAt: new Date() })
      .where(eq(competitiveIntelFeedsTable.id, feed.id));
    return { created: 0, ok: false };
  }

  const cutoff = Date.now() - 30 * 24 * 3600_000;
  const candidates: Array<typeof competitiveIntelAlertsTable.$inferInsert> = [];

  for (const item of items.slice(0, 25)) {
    if (!isMajorFeatureAnnouncement(item.title, item.summary)) continue;
    const pub = Date.parse(item.pubDate);
    if (Number.isFinite(pub) && pub < cutoff) continue;
    const id = alertIdFor(feed.id, item);
    const auto = classifyRecommendation(item.title, item.summary);
    const rec: Recommendation = feed.recommendationHint ?? auto.rec;
    const reason = feed.recommendationHint
      ? `Analyst hint for ${feed.champion}: treat as ${feed.recommendationHint}.`
      : auto.reason;
    candidates.push({
      id,
      laneId: feed.laneId,
      champion: feed.champion,
      title: item.title.slice(0, 240),
      summary: item.summary || `${feed.champion} announcement.`,
      link: item.link,
      publishedAt: Number.isFinite(pub) ? new Date(pub) : new Date(),
      detectedAt: new Date(),
      recommendation: rec,
      recommendationReason: reason,
      dismissed: false,
      source: 'rss',
    });
  }

  let created = 0;
  let inserted: DbAlert[] = [];
  if (candidates.length > 0) {
    const ids = candidates.map((c) => c.id!);
    const existing = await db
      .select({ id: competitiveIntelAlertsTable.id })
      .from(competitiveIntelAlertsTable)
      .where(inArray(competitiveIntelAlertsTable.id, ids));
    const existingIds = new Set(existing.map((e) => e.id));
    const fresh = candidates.filter((c) => !existingIds.has(c.id!));
    if (fresh.length > 0) {
      inserted = await db
        .insert(competitiveIntelAlertsTable)
        .values(fresh)
        .onConflictDoNothing()
        .returning();
      created = inserted.length;
    }
  }

  await db
    .update(competitiveIntelFeedsTable)
    .set({
      lastPolledAt: polledAt,
      lastSuccessAt: polledAt,
      lastError: null,
      itemsSeen: feed.itemsSeen + items.length,
      alertsCreated: feed.alertsCreated + created,
      updatedAt: new Date(),
    })
    .where(eq(competitiveIntelFeedsTable.id, feed.id));

  return { created, ok: true, newAlerts: inserted.map(alertFromRow) };
}

export async function pollAllFeeds(): Promise<PollResult> {
  await ensureLoaded();
  const start = Date.now();
  const feeds = await db
    .select()
    .from(competitiveIntelFeedsTable)
    .where(eq(competitiveIntelFeedsTable.paused, false));

  let success = 0;
  let newAlerts = 0;
  const justCreated: IntelAlert[] = [];

  await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const { created, ok, newAlerts: createdAlerts } = await pollFeed(feed);
        newAlerts += created;
        if (ok) success++;
        if (createdAlerts && createdAlerts.length > 0) {
          justCreated.push(...createdAlerts);
        }
      } catch (err) {
        logger.warn({ err, feedId: feed.id }, '[competitive-intel] pollFeed threw');
      }
    }),
  );

  // Also include recent alerts whose previous notification attempt failed
  // (notified_at is still NULL). Capped at 7 days so a permanently-broken
  // webhook can't grow the retry batch unbounded.
  const RETRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const retryCutoff = new Date(Date.now() - RETRY_WINDOW_MS);
  const justCreatedIds = new Set(justCreated.map((a) => a.id));
  const retryRows = await db
    .select()
    .from(competitiveIntelAlertsTable)
    .where(
      and(
        sql`${competitiveIntelAlertsTable.notifiedAt} is null`,
        eq(competitiveIntelAlertsTable.dismissed, false),
        eq(competitiveIntelAlertsTable.source, 'rss'),
        sql`${competitiveIntelAlertsTable.detectedAt} >= ${retryCutoff}`,
      ) as any,
    );
  const retries = retryRows.map(alertFromRow).filter((a) => !justCreatedIds.has(a.id));
  const toNotify = [...justCreated, ...retries];

  // Notify Slack/email for high-confidence, non-muted, non-dismissed alerts.
  // Errors are swallowed so a flaky webhook never breaks the poll cycle.
  if (toNotify.length > 0) {
    try {
      const { notifyNewAlerts } = await import('../lib/competitive-intel-notifications');
      await notifyNewAlerts(toNotify);
    } catch (err) {
      logger.warn({ err }, '[competitive-intel] notifyNewAlerts failed');
    }
  }

  // Cap alert history per lane so the table stays bounded. Keep newest 50 by
  // publishedAt; delete the rest.
  await trimAlertHistoryPerLane(50);

  await db
    .update(competitiveIntelStateTable)
    .set({
      lastFullPollAt: new Date(),
      pollRunCount: sql`${competitiveIntelStateTable.pollRunCount} + 1`,
    })
    .where(eq(competitiveIntelStateTable.id, 1));

  await refreshFeedsCache();

  const result: PollResult = {
    polledFeeds: feeds.length,
    successfulFeeds: success,
    newAlerts,
    durationMs: Date.now() - start,
  };
  logger.info(result, '[competitive-intel] Poll cycle complete');
  return result;
}

async function trimAlertHistoryPerLane(maxPerLane: number): Promise<void> {
  // For each lane, find the IDs of alerts ranked > maxPerLane by publishedAt
  // (newest first) and delete them.
  const lanes = await db
    .selectDistinct({ laneId: competitiveIntelAlertsTable.laneId })
    .from(competitiveIntelAlertsTable);
  for (const { laneId } of lanes) {
    const rows = await db
      .select({ id: competitiveIntelAlertsTable.id })
      .from(competitiveIntelAlertsTable)
      .where(eq(competitiveIntelAlertsTable.laneId, laneId))
      .orderBy(desc(competitiveIntelAlertsTable.publishedAt));
    const toDelete = rows.slice(maxPerLane).map((r) => r.id);
    if (toDelete.length > 0) {
      await db
        .delete(competitiveIntelAlertsTable)
        .where(inArray(competitiveIntelAlertsTable.id, toDelete));
    }
  }
}

// ─── Public store API ────────────────────────────────────────────────────────

export async function listAlerts(opts?: {
  laneId?: string;
  includeDismissed?: boolean;
}): Promise<IntelAlert[]> {
  await ensureLoaded();
  const conds = [];
  if (opts?.laneId) conds.push(eq(competitiveIntelAlertsTable.laneId, opts.laneId));
  if (!opts?.includeDismissed) conds.push(eq(competitiveIntelAlertsTable.dismissed, false));
  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);
  const rows = await db
    .select()
    .from(competitiveIntelAlertsTable)
    .where(where as any)
    .orderBy(desc(competitiveIntelAlertsTable.publishedAt));
  return rows.map(alertFromRow);
}

export async function dismissAlert(id: string, actor?: string): Promise<IntelAlert | null> {
  await ensureLoaded();
  const updated = await db
    .update(competitiveIntelAlertsTable)
    .set({ dismissed: true, dismissedAt: new Date(), dismissedBy: actor ?? null })
    .where(eq(competitiveIntelAlertsTable.id, id))
    .returning();
  if (updated.length === 0) return null;
  logger.info({ alertId: id, actor }, '[competitive-intel] Alert dismissed');
  return alertFromRow(updated[0]);
}

/**
 * Reload the in-memory mute cache from `competitive_intel_state.meta.mutedLanes`.
 * Called on bootstrap and after every `setLaneMute` write so `isLaneMuted` can
 * stay synchronous for use inside the notifier predicate.
 */
async function refreshMutedLanesCache(): Promise<void> {
  const row = await getState();
  for (const k of Object.keys(_mutedLanesCache)) delete _mutedLanesCache[k];
  const meta = (row?.meta ?? null) as { mutedLanes?: Record<string, boolean> } | null;
  if (meta?.mutedLanes && typeof meta.mutedLanes === 'object') {
    for (const [laneId, muted] of Object.entries(meta.mutedLanes)) {
      if (muted) _mutedLanesCache[laneId] = true;
    }
  }
}

export async function listLanes(): Promise<LaneInfo[]> {
  await ensureLoaded();
  const byLane = new Map<string, Set<string>>();
  for (const f of CHAMPION_FEEDS) {
    const set = byLane.get(f.laneId) ?? new Set<string>();
    set.add(f.champion);
    byLane.set(f.laneId, set);
  }
  return Array.from(byLane.entries())
    .map(([laneId, champs]) => ({
      laneId,
      champions: Array.from(champs).sort(),
      muted: !!_mutedLanesCache[laneId],
    }))
    .sort((a, b) => a.laneId.localeCompare(b.laneId));
}

/**
 * Synchronous mute lookup backed by the in-process cache loaded from
 * Postgres at boot. Used by the notifier's `shouldNotify` predicate.
 */
export function isLaneMuted(laneId: string): boolean {
  return !!_mutedLanesCache[laneId];
}

export async function setLaneMute(laneId: string, muted: boolean): Promise<LaneInfo | null> {
  await ensureLoaded();
  const known = CHAMPION_FEEDS.some((f) => f.laneId === laneId);
  if (!known) return null;

  // Read-modify-write the meta JSON so we don't clobber other meta keys.
  const row = await getState();
  const currentMeta = (row?.meta ?? null) as Record<string, unknown> | null;
  const mutedLanes: Record<string, boolean> = {
    ...((currentMeta?.mutedLanes as Record<string, boolean> | undefined) ?? {}),
  };
  if (muted) mutedLanes[laneId] = true;
  else delete mutedLanes[laneId];
  const nextMeta = { ...currentMeta, mutedLanes };

  await db
    .update(competitiveIntelStateTable)
    .set({ meta: nextMeta })
    .where(eq(competitiveIntelStateTable.id, 1));

  await refreshMutedLanesCache();
  logger.info({ laneId, muted }, '[competitive-intel] Lane mute updated');
  const lanes = await listLanes();
  return lanes.find((l) => l.laneId === laneId) ?? null;
}

/**
 * Mark the given alert IDs as notified so the next poll cycle does not
 * dispatch them again. Caller (notifier) decides which IDs were actually
 * pushed to Slack/email. Persisted on the alerts row in Postgres.
 */
export async function markAlertsNotified(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await ensureLoaded();
  await db
    .update(competitiveIntelAlertsTable)
    .set({ notifiedAt: new Date() })
    .where(
      and(
        inArray(competitiveIntelAlertsTable.id, ids),
        sql`${competitiveIntelAlertsTable.notifiedAt} is null`,
      ) as any,
    );
}

export async function getMonitorStatus(): Promise<{
  feeds: FeedHealth[];
  lastFullPollAt: string | null;
  pollRunCount: number;
  totalAlerts: number;
  activeAlerts: number;
}> {
  await ensureLoaded();
  const [feedRows, state, totalRows, activeRows] = await Promise.all([
    db.select().from(competitiveIntelFeedsTable),
    getState(),
    db.select({ c: sql<number>`count(*)::int` }).from(competitiveIntelAlertsTable),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(competitiveIntelAlertsTable)
      .where(eq(competitiveIntelAlertsTable.dismissed, false)),
  ]);
  return {
    feeds: feedRows.map(healthFromRow),
    lastFullPollAt: state?.lastFullPollAt ? state.lastFullPollAt.toISOString() : null,
    pollRunCount: state?.pollRunCount ?? 0,
    totalAlerts: Number(totalRows[0]?.c ?? 0),
    activeAlerts: Number(activeRows[0]?.c ?? 0),
  };
}

// ─── Feed management (admin) ─────────────────────────────────────────────────

const VALID_RECOMMENDATIONS: Recommendation[] = ['adopt', 'counter', 'monitor'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueFeedId(base: string): Promise<string> {
  const root = slugify(base) || 'feed';
  const existing = await db
    .select({ id: competitiveIntelFeedsTable.id })
    .from(competitiveIntelFeedsTable)
    .where(like(competitiveIntelFeedsTable.id, `${root}%`));
  const taken = new Set(existing.map((r) => r.id));
  if (!taken.has(root)) return root;
  let i = 2;
  while (taken.has(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

export interface FeedInput {
  champion: string;
  laneId: string;
  feedUrl: string;
  homeUrl?: string;
  paused?: boolean;
  recommendationHint?: Recommendation | null;
}

export interface FeedUpdate {
  champion?: string;
  laneId?: string;
  feedUrl?: string;
  homeUrl?: string;
  paused?: boolean;
  recommendationHint?: Recommendation | null;
}

function validateUrl(value: string, field: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) throw new Error(`${field} is required`);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${field} must use http or https`);
  }
  return trimmed;
}

export async function listFeeds(): Promise<ChampionFeed[]> {
  await ensureLoaded();
  const rows = await db.select().from(competitiveIntelFeedsTable);
  return rows.map(feedFromRow);
}

export async function addFeed(input: FeedInput, actor?: string): Promise<ChampionFeed> {
  await ensureLoaded();
  const champion = String(input.champion ?? '').trim();
  const laneId = String(input.laneId ?? '').trim();
  if (!champion) throw new Error('champion is required');
  if (!laneId) throw new Error('laneId is required');
  const feedUrl = validateUrl(input.feedUrl, 'feedUrl');
  const homeUrl = input.homeUrl ? validateUrl(input.homeUrl, 'homeUrl') : feedUrl;
  if (input.recommendationHint && !VALID_RECOMMENDATIONS.includes(input.recommendationHint)) {
    throw new Error('recommendationHint must be adopt | counter | monitor');
  }
  // Check for duplicate (laneId, feedUrl) — case-insensitive on URL.
  const dupes = await db
    .select({ id: competitiveIntelFeedsTable.id })
    .from(competitiveIntelFeedsTable)
    .where(
      and(
        eq(competitiveIntelFeedsTable.laneId, laneId),
        sql`lower(${competitiveIntelFeedsTable.feedUrl}) = lower(${feedUrl})`,
      ),
    );
  if (dupes.length > 0) {
    throw new Error('A feed with this URL already exists in this lane');
  }
  const id = await uniqueFeedId(`${laneId}-${champion}`);
  const now = new Date();
  const inserted = await db
    .insert(competitiveIntelFeedsTable)
    .values({
      id,
      laneId,
      champion,
      feedUrl,
      homeUrl,
      paused: input.paused === true,
      recommendationHint: input.recommendationHint ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  await refreshFeedsCache();
  logger.info({ feedId: id, actor }, '[competitive-intel] Feed added');
  return feedFromRow(inserted[0]);
}

export async function updateFeed(
  id: string,
  patch: FeedUpdate,
  actor?: string,
): Promise<ChampionFeed | null> {
  await ensureLoaded();
  const existing = await db
    .select()
    .from(competitiveIntelFeedsTable)
    .where(eq(competitiveIntelFeedsTable.id, id))
    .limit(1);
  if (existing.length === 0) return null;
  const current = existing[0];

  const next: Partial<typeof competitiveIntelFeedsTable.$inferInsert> = {};

  if (patch.champion !== undefined) {
    const v = String(patch.champion).trim();
    if (!v) throw new Error('champion cannot be empty');
    next.champion = v;
  }
  if (patch.laneId !== undefined) {
    const v = String(patch.laneId).trim();
    if (!v) throw new Error('laneId cannot be empty');
    next.laneId = v;
  }
  if (patch.feedUrl !== undefined) next.feedUrl = validateUrl(patch.feedUrl, 'feedUrl');
  if (patch.homeUrl !== undefined) next.homeUrl = validateUrl(patch.homeUrl, 'homeUrl');
  if (patch.paused !== undefined) next.paused = patch.paused === true;
  if (patch.recommendationHint !== undefined) {
    if (patch.recommendationHint === null) {
      next.recommendationHint = null;
    } else if (VALID_RECOMMENDATIONS.includes(patch.recommendationHint)) {
      next.recommendationHint = patch.recommendationHint;
    } else {
      throw new Error('recommendationHint must be adopt | counter | monitor');
    }
  }

  // Reject (laneId, feedUrl) collisions with another feed (mirrors addFeed).
  if (next.feedUrl !== undefined || next.laneId !== undefined) {
    const checkLane = next.laneId ?? current.laneId;
    const checkUrl = next.feedUrl ?? current.feedUrl;
    const dupes = await db
      .select({ id: competitiveIntelFeedsTable.id })
      .from(competitiveIntelFeedsTable)
      .where(
        and(
          eq(competitiveIntelFeedsTable.laneId, checkLane),
          sql`lower(${competitiveIntelFeedsTable.feedUrl}) = lower(${checkUrl})`,
        ),
      );
    if (dupes.some((d) => d.id !== id)) {
      throw new Error('A feed with this URL already exists in this lane');
    }
  }

  next.updatedAt = new Date();
  const updated = await db
    .update(competitiveIntelFeedsTable)
    .set(next)
    .where(eq(competitiveIntelFeedsTable.id, id))
    .returning();
  await refreshFeedsCache();
  logger.info({ feedId: id, actor }, '[competitive-intel] Feed updated');
  return updated.length > 0 ? feedFromRow(updated[0]) : null;
}

export async function removeFeed(id: string, actor?: string): Promise<boolean> {
  await ensureLoaded();
  const deleted = await db
    .delete(competitiveIntelFeedsTable)
    .where(eq(competitiveIntelFeedsTable.id, id))
    .returning({ id: competitiveIntelFeedsTable.id });
  if (deleted.length === 0) return false;
  // Drop alerts owned by the removed feed so the UI doesn't show orphans.
  // Alerts use ids like `${feedId}-${hash}` (or `seed-${champion}-...` for
  // seeds) — match by the same prefix convention.
  await db
    .delete(competitiveIntelAlertsTable)
    .where(like(competitiveIntelAlertsTable.id, `${id}-%`));
  await refreshFeedsCache();
  logger.info({ feedId: id, actor }, '[competitive-intel] Feed removed');
  return true;
}

// ─── Daily timer (in-process fallback) ───────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 24 * 3600_000;

export function startCompetitiveIntelMonitor(): void {
  if (_timer) return;
  ensureLoaded().catch((err) => logger.warn({ err }, '[competitive-intel] initial load failed'));
  _timer = setInterval(() => {
    pollAllFeeds().catch((err) =>
      logger.error({ err }, '[competitive-intel] scheduled poll failed'),
    );
  }, POLL_INTERVAL_MS);
  logger.info({ intervalMs: POLL_INTERVAL_MS }, '[competitive-intel] Monitor started');
}

export function stopCompetitiveIntelMonitor(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

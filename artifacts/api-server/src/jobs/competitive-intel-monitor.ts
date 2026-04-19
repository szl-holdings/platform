/**
 * Competitive Intel Monitor
 *
 * Polls product blogs / RSS feeds for the champions tracked in the SZL
 * Competitive Atlas (CrowdStrike, Clio, CoStar, Windward, Palantir,
 * ThoughtSpot, etc.) and surfaces "major feature ship" events as Intel
 * Update alerts that render on the Atlas page.
 *
 * Design notes:
 *   - Self-contained: in-memory store with JSON-file persistence so dismiss
 *     state and the dedup index survive api-server restarts. No DB migration
 *     required.
 *   - Network-tolerant: feed fetches use AbortController timeouts and any
 *     failure on a single feed is logged + skipped, never throws.
 *   - Always demoable: ships with a seeded alert per lane so the UI is rich
 *     on first boot even before the first poll succeeds.
 *   - Classification: a lightweight keyword heuristic flags entries as
 *     "major feature" announcements and recommends an SZL response
 *     (adopt / counter / monitor).
 */

import { promises as fs } from "fs";
import path from "path";
import { logger } from "../lib/logger";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Recommendation = "adopt" | "counter" | "monitor";

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
  source: "rss" | "seed";
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

// ─── Champion feeds ──────────────────────────────────────────────────────────

export const DEFAULT_CHAMPION_FEEDS: ChampionFeed[] = [
  // Cyber Resilience
  {
    id: "crowdstrike-blog",
    laneId: "cyber",
    champion: "CrowdStrike",
    feedUrl: "https://www.crowdstrike.com/blog/feed/",
    homeUrl: "https://www.crowdstrike.com/blog/",
  },
  {
    id: "darktrace-blog",
    laneId: "cyber",
    champion: "Darktrace",
    feedUrl: "https://darktrace.com/blog/rss.xml",
    homeUrl: "https://darktrace.com/blog",
  },
  // Legal Matter Command
  {
    id: "clio-blog",
    laneId: "legal",
    champion: "Clio",
    feedUrl: "https://www.clio.com/blog/feed/",
    homeUrl: "https://www.clio.com/blog/",
  },
  // Real Estate Intelligence
  {
    id: "costar-news",
    laneId: "real-estate",
    champion: "CoStar",
    feedUrl: "https://www.costar.com/rss/news.xml",
    homeUrl: "https://www.costar.com/news",
  },
  // Maritime Intelligence
  {
    id: "windward-blog",
    laneId: "maritime",
    champion: "Windward",
    feedUrl: "https://windward.ai/feed/",
    homeUrl: "https://windward.ai/blog/",
  },
  // Executive Briefing
  {
    id: "palantir-blog",
    laneId: "executive-briefing",
    champion: "Palantir",
    feedUrl: "https://blog.palantir.com/feed",
    homeUrl: "https://blog.palantir.com/",
  },
  // Decision Intelligence
  {
    id: "thoughtspot-blog",
    laneId: "decision-intelligence",
    champion: "ThoughtSpot",
    feedUrl: "https://www.thoughtspot.com/blog/rss.xml",
    homeUrl: "https://www.thoughtspot.com/blog",
  },
  // Holdings Strategy
  {
    id: "palantir-foundry-blog",
    laneId: "holdings-strategy",
    champion: "Palantir Foundry",
    feedUrl: "https://blog.palantir.com/feed",
    homeUrl: "https://blog.palantir.com/",
  },
];

// ─── Persistence ─────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "competitive-intel.json");

interface PersistedState {
  alerts: IntelAlert[];
  feedHealth: Record<string, FeedHealth>;
  lastFullPollAt: string | null;
  pollRunCount: number;
  seededAt: string | null;
  feeds: ChampionFeed[];
  feedsSeededAt: string | null;
}

const state: PersistedState = {
  alerts: [],
  feedHealth: {},
  lastFullPollAt: null,
  pollRunCount: 0,
  seededAt: null,
  feeds: [],
  feedsSeededAt: null,
};

/**
 * Live, mutable list of champion feeds. Backed by `state.feeds` which is
 * persisted to disk so analyst-managed additions/removals survive restart.
 * Exposed as an export so existing callers (routes, tests, jobs) keep working.
 */
export const CHAMPION_FEEDS: ChampionFeed[] = state.feeds;

let _loaded = false;
let _writePending: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (_loaded) return;
  _loaded = true;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (Array.isArray(parsed.alerts)) state.alerts = parsed.alerts;
    if (parsed.feedHealth && typeof parsed.feedHealth === "object") {
      state.feedHealth = parsed.feedHealth as Record<string, FeedHealth>;
    }
    if (typeof parsed.lastFullPollAt === "string" || parsed.lastFullPollAt === null) {
      state.lastFullPollAt = parsed.lastFullPollAt ?? null;
    }
    if (typeof parsed.pollRunCount === "number") state.pollRunCount = parsed.pollRunCount;
    if (typeof parsed.seededAt === "string" || parsed.seededAt === null) {
      state.seededAt = parsed.seededAt ?? null;
    }
    if (Array.isArray(parsed.feeds)) {
      // Mutate in place so the exported CHAMPION_FEEDS reference stays valid
      state.feeds.length = 0;
      state.feeds.push(...parsed.feeds);
    }
    if (typeof parsed.feedsSeededAt === "string" || parsed.feedsSeededAt === null) {
      state.feedsSeededAt = parsed.feedsSeededAt ?? null;
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      logger.warn({ err }, "[competitive-intel] Failed to load persisted state — starting fresh");
    }
  }
  // Seed defaults the first time we load (or if persisted feed list is empty)
  if (!state.feedsSeededAt || state.feeds.length === 0) {
    const now = new Date().toISOString();
    for (const f of DEFAULT_CHAMPION_FEEDS) {
      if (!state.feeds.some(existing => existing.id === f.id)) {
        state.feeds.push({ ...f, createdAt: now, updatedAt: now });
      }
    }
    state.feedsSeededAt = now;
    await persistSoon();
  }
  ensureFeedHealth();
  if (!state.seededAt) {
    seedInitialAlerts();
    state.seededAt = new Date().toISOString();
    await persistSoon();
  }
}

function ensureFeedHealth(): void {
  for (const feed of state.feeds) {
    if (!state.feedHealth[feed.id]) {
      state.feedHealth[feed.id] = {
        feedId: feed.id,
        champion: feed.champion,
        laneId: feed.laneId,
        lastPolledAt: null,
        lastSuccessAt: null,
        lastError: null,
        itemsSeen: 0,
        alertsCreated: 0,
      };
    }
  }
}

async function persistSoon(): Promise<void> {
  if (_writePending) return _writePending;
  _writePending = (async () => {
    await new Promise(r => setTimeout(r, 50));
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    } catch (err) {
      logger.warn({ err }, "[competitive-intel] Failed to persist state");
    } finally {
      _writePending = null;
    }
  })();
  return _writePending;
}

// ─── Seed alerts ─────────────────────────────────────────────────────────────

function seedInitialAlerts(): void {
  const now = Date.now();
  const seeds: Array<Omit<IntelAlert, "detectedAt" | "dismissed" | "source">> = [
    {
      id: "seed-crowdstrike-charlotte-actions",
      laneId: "cyber",
      champion: "CrowdStrike",
      title: "Charlotte AI Detection Actions — agentic triage now GA",
      summary: "CrowdStrike opened the Charlotte AI agentic triage capability to all Falcon customers, letting analysts hand off triage of low-severity detections to an autonomous agent with audit trail.",
      link: "https://www.crowdstrike.com/blog/",
      publishedAt: new Date(now - 4 * 24 * 3600_000).toISOString(),
      recommendation: "counter",
      recommendationReason: "Sentra already wraps every action in a governed proof envelope — counter by emphasising approver identity and reversibility on the Incident Commander surface.",
    },
    {
      id: "seed-clio-matter-stages-mobile",
      laneId: "legal",
      champion: "Clio",
      title: "Matter Stages now available in Clio Mobile",
      summary: "Clio extended its visual Matter Stages pipeline to the iOS and Android apps so attorneys can advance matters from anywhere.",
      link: "https://www.clio.com/blog/",
      publishedAt: new Date(now - 2 * 24 * 3600_000).toISOString(),
      recommendation: "adopt",
      recommendationReason: "PRISM Counsel already mirrors Matter Stages on the desktop — extending the rail to the SZL Holdings mobile shell would close the parity gap.",
    },
    {
      id: "seed-costar-loan-overlay",
      laneId: "real-estate",
      champion: "CoStar",
      title: "CoStar adds CMBS loan overlay directly on the property pin",
      summary: "CoStar shipped a loan-data overlay so brokers can see active CMBS terms, maturity, and DSCR without leaving the property card.",
      link: "https://www.costar.com/news",
      publishedAt: new Date(now - 6 * 24 * 3600_000).toISOString(),
      recommendation: "adopt",
      recommendationReason: "Terra has the data via CRED iQ — wire a Loan Overlay strip onto the property card so analysts stop tab-switching.",
    },
    {
      id: "seed-windward-rf-fusion",
      laneId: "maritime",
      champion: "Windward",
      title: "Windward fuses RF GEOINT signals into Predictive Intelligence",
      summary: "Windward's Maritime AI now ingests commercial RF GEOINT alongside AIS and SAR, sharpening dark-vessel detection in chokepoints.",
      link: "https://windward.ai/blog/",
      publishedAt: new Date(now - 9 * 24 * 3600_000).toISOString(),
      recommendation: "monitor",
      recommendationReason: "Vessels already shows Intelligence Sources fusion badges — monitor RF coverage gaps and prioritise an RF data partner if customers ask.",
    },
    {
      id: "seed-palantir-aip-now",
      laneId: "executive-briefing",
      champion: "Palantir",
      title: "AIP Now — daily executive briefing template kit",
      summary: "Palantir released a packaged template for executive daily briefings inside AIP, including sourcing strips and recommendation cards.",
      link: "https://blog.palantir.com/",
      publishedAt: new Date(now - 1 * 24 * 3600_000).toISOString(),
      recommendation: "counter",
      recommendationReason: "Pulse already ships Today's Brief with provenance + dissent — counter with a side-by-side comparison demo emphasising cross-domain consensus.",
    },
    {
      id: "seed-thoughtspot-spotter",
      laneId: "decision-intelligence",
      champion: "ThoughtSpot",
      title: "ThoughtSpot Spotter — agentic analytics in the same chat thread",
      summary: "ThoughtSpot introduced Spotter, an agentic analytics assistant that returns answers, charts, and follow-up questions in a single conversation.",
      link: "https://www.thoughtspot.com/blog",
      publishedAt: new Date(now - 5 * 24 * 3600_000).toISOString(),
      recommendation: "adopt",
      recommendationReason: "Lyte's Signals Console NL bar should grow follow-up question chips so it matches Spotter's conversational loop.",
    },
    {
      id: "seed-palantir-foundry-warp",
      laneId: "holdings-strategy",
      champion: "Palantir Foundry",
      title: "Foundry Warp Speed — ontology-driven app generation",
      summary: "Foundry shipped Warp Speed, letting non-engineers spin up ontology-grounded apps from a prompt with full lineage preserved.",
      link: "https://blog.palantir.com/",
      publishedAt: new Date(now - 7 * 24 * 3600_000).toISOString(),
      recommendation: "monitor",
      recommendationReason: "Command already exposes ontology via the Worldline Registry — monitor enterprise reactions before investing in a builder surface.",
    },
  ];
  for (const s of seeds) {
    state.alerts.push({
      ...s,
      detectedAt: new Date().toISOString(),
      dismissed: false,
      source: "seed",
    });
  }
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)));
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function pickTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  const inner = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  return inner;
}

function pickAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=\"([^\"]+)\"[^>]*/?>`, "i");
  const m = block.match(re);
  return m ? m[1] : null;
}

function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const blockRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const matches = xml.match(blockRe) ?? [];
  for (const block of matches) {
    const title = stripHtml(pickTag(block, "title") ?? "");
    let link = pickTag(block, "link") ?? "";
    if (!link || /<link\b/i.test(`<link${link}`)) {
      // Atom: <link href="..." />
      link = pickAttr(block, "link", "href") ?? link;
    }
    link = stripHtml(link);
    const summary = stripHtml(pickTag(block, "description") ?? pickTag(block, "summary") ?? pickTag(block, "content") ?? "");
    const pubDate = stripHtml(pickTag(block, "pubDate") ?? pickTag(block, "published") ?? pickTag(block, "updated") ?? "");
    const guid = stripHtml(pickTag(block, "guid") ?? pickTag(block, "id") ?? link);
    if (title && link) {
      items.push({ title, link, summary: summary.slice(0, 600), pubDate, guid });
    }
  }
  return items;
}

// ─── Classification ──────────────────────────────────────────────────────────

const MAJOR_FEATURE_KEYWORDS = [
  "introducing", "introduces", "announces", "announcing", "now available",
  "general availability", " ga ", "launches", "launching", "launched",
  "release", "released", "ships", "shipping", "new feature", "unveils",
  "rolls out", "rolling out", "extends", "expands", "powered by",
  "agent", "copilot", "ai-native",
];

function isMajorFeatureAnnouncement(title: string, summary: string): boolean {
  const hay = `${title} ${summary}`.toLowerCase();
  return MAJOR_FEATURE_KEYWORDS.some(k => hay.includes(k));
}

const ADOPT_HINTS = ["mobile", "kanban", "pipeline", "overlay", "dashboard", "chart", "template", "matter", "comp", "loan"];
const COUNTER_HINTS = ["agent", "copilot", "agentic", "autonomous", "ai-native", "natural language", "generative"];

function classifyRecommendation(title: string, summary: string): { rec: Recommendation; reason: string } {
  const hay = `${title} ${summary}`.toLowerCase();
  if (COUNTER_HINTS.some(k => hay.includes(k))) {
    return {
      rec: "counter",
      reason: "Touches our Governed Autonomy moat — counter by emphasising approver identity, reversibility, and proof chain on the matching SZL surface.",
    };
  }
  if (ADOPT_HINTS.some(k => hay.includes(k))) {
    return {
      rec: "adopt",
      reason: "Looks like a UX or workflow pattern we can reinterpret in our voice — log into the Steal-This board for triage.",
    };
  }
  return {
    rec: "monitor",
    reason: "No immediate action — keep the alert for trend tracking and revisit on next Atlas review.",
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
        "User-Agent": "SZL-Competitive-Intel/1.0 (+https://szlholdings.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
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
  // simple hash so the id stays short and stable
  let h = 0;
  for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) | 0;
  return `${feedId}-${Math.abs(h).toString(36)}`;
}

async function pollFeed(feed: ChampionFeed): Promise<number> {
  const health = state.feedHealth[feed.id];
  if (!health) return 0;
  if (feed.paused) {
    health.lastPolledAt = new Date().toISOString();
    health.lastError = "paused";
    return 0;
  }
  health.lastPolledAt = new Date().toISOString();
  let xml: string;
  try {
    xml = await fetchWithTimeout(feed.feedUrl);
  } catch (err) {
    health.lastError = err instanceof Error ? err.message : String(err);
    logger.debug({ feedId: feed.id, err: health.lastError }, "[competitive-intel] Feed fetch failed");
    return 0;
  }

  let items: ParsedItem[] = [];
  try {
    items = parseFeed(xml);
  } catch (err) {
    health.lastError = `parse: ${err instanceof Error ? err.message : String(err)}`;
    return 0;
  }

  health.lastError = null;
  health.lastSuccessAt = new Date().toISOString();
  health.itemsSeen += items.length;

  let created = 0;
  const cutoff = Date.now() - 30 * 24 * 3600_000; // ignore items older than 30d

  for (const item of items.slice(0, 25)) {
    if (!isMajorFeatureAnnouncement(item.title, item.summary)) continue;
    const pub = Date.parse(item.pubDate);
    if (Number.isFinite(pub) && pub < cutoff) continue;
    const id = alertIdFor(feed.id, item);
    if (state.alerts.some(a => a.id === id)) continue;
    const auto = classifyRecommendation(item.title, item.summary);
    const rec: Recommendation = feed.recommendationHint ?? auto.rec;
    const reason = feed.recommendationHint
      ? `Analyst hint for ${feed.champion}: treat as ${feed.recommendationHint}.`
      : auto.reason;
    state.alerts.push({
      id,
      laneId: feed.laneId,
      champion: feed.champion,
      title: item.title.slice(0, 240),
      summary: item.summary || `${feed.champion} announcement.`,
      link: item.link,
      publishedAt: Number.isFinite(pub) ? new Date(pub).toISOString() : new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      recommendation: rec,
      recommendationReason: reason,
      dismissed: false,
      source: "rss",
    });
    created++;
    health.alertsCreated++;
  }

  return created;
}

export async function pollAllFeeds(): Promise<PollResult> {
  await ensureLoaded();
  ensureFeedHealth();
  const start = Date.now();
  let success = 0;
  let newAlerts = 0;
  const activeFeeds = state.feeds.filter(f => !f.paused);

  await Promise.allSettled(
    activeFeeds.map(async feed => {
      try {
        const created = await pollFeed(feed);
        newAlerts += created;
        if (state.feedHealth[feed.id]?.lastError == null) success++;
      } catch (err) {
        logger.warn({ err, feedId: feed.id }, "[competitive-intel] pollFeed threw");
      }
    }),
  );

  // Cap total alert history per lane to keep state file bounded
  const MAX_PER_LANE = 50;
  const byLane = new Map<string, IntelAlert[]>();
  for (const a of state.alerts) {
    const arr = byLane.get(a.laneId) ?? [];
    arr.push(a);
    byLane.set(a.laneId, arr);
  }
  const trimmed: IntelAlert[] = [];
  for (const [, arr] of byLane) {
    arr.sort((x, y) => Date.parse(y.publishedAt) - Date.parse(x.publishedAt));
    trimmed.push(...arr.slice(0, MAX_PER_LANE));
  }
  state.alerts = trimmed;

  state.lastFullPollAt = new Date().toISOString();
  state.pollRunCount += 1;
  await persistSoon();

  const result: PollResult = {
    polledFeeds: activeFeeds.length,
    successfulFeeds: success,
    newAlerts,
    durationMs: Date.now() - start,
  };
  logger.info(result, "[competitive-intel] Poll cycle complete");
  return result;
}

// ─── Public store API ────────────────────────────────────────────────────────

export async function listAlerts(opts?: { laneId?: string; includeDismissed?: boolean }): Promise<IntelAlert[]> {
  await ensureLoaded();
  let alerts = state.alerts.slice();
  if (opts?.laneId) alerts = alerts.filter(a => a.laneId === opts.laneId);
  if (!opts?.includeDismissed) alerts = alerts.filter(a => !a.dismissed);
  alerts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return alerts;
}

export async function dismissAlert(id: string, actor?: string): Promise<IntelAlert | null> {
  await ensureLoaded();
  const alert = state.alerts.find(a => a.id === id);
  if (!alert) return null;
  alert.dismissed = true;
  alert.dismissedAt = new Date().toISOString();
  await persistSoon();
  logger.info({ alertId: id, actor }, "[competitive-intel] Alert dismissed");
  return alert;
}

export async function getMonitorStatus(): Promise<{
  feeds: FeedHealth[];
  lastFullPollAt: string | null;
  pollRunCount: number;
  totalAlerts: number;
  activeAlerts: number;
}> {
  await ensureLoaded();
  return {
    feeds: Object.values(state.feedHealth),
    lastFullPollAt: state.lastFullPollAt,
    pollRunCount: state.pollRunCount,
    totalAlerts: state.alerts.length,
    activeAlerts: state.alerts.filter(a => !a.dismissed).length,
  };
}

// ─── Feed management (admin) ─────────────────────────────────────────────────

const VALID_RECOMMENDATIONS: Recommendation[] = ["adopt", "counter", "monitor"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uniqueFeedId(base: string): string {
  const root = slugify(base) || "feed";
  if (!state.feeds.some(f => f.id === root)) return root;
  let i = 2;
  while (state.feeds.some(f => f.id === `${root}-${i}`)) i++;
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
  const trimmed = String(value ?? "").trim();
  if (!trimmed) throw new Error(`${field} is required`);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${field} must use http or https`);
  }
  return trimmed;
}

export async function listFeeds(): Promise<ChampionFeed[]> {
  await ensureLoaded();
  return state.feeds.map(f => ({ ...f }));
}

export async function addFeed(input: FeedInput, actor?: string): Promise<ChampionFeed> {
  await ensureLoaded();
  const champion = String(input.champion ?? "").trim();
  const laneId = String(input.laneId ?? "").trim();
  if (!champion) throw new Error("champion is required");
  if (!laneId) throw new Error("laneId is required");
  const feedUrl = validateUrl(input.feedUrl, "feedUrl");
  const homeUrl = input.homeUrl ? validateUrl(input.homeUrl, "homeUrl") : feedUrl;
  if (input.recommendationHint && !VALID_RECOMMENDATIONS.includes(input.recommendationHint)) {
    throw new Error("recommendationHint must be adopt | counter | monitor");
  }
  if (state.feeds.some(f => f.feedUrl.toLowerCase() === feedUrl.toLowerCase() && f.laneId === laneId)) {
    throw new Error("A feed with this URL already exists in this lane");
  }
  const now = new Date().toISOString();
  const feed: ChampionFeed = {
    id: uniqueFeedId(`${laneId}-${champion}`),
    laneId,
    champion,
    feedUrl,
    homeUrl,
    paused: input.paused === true,
    recommendationHint: input.recommendationHint ?? undefined,
    createdAt: now,
    updatedAt: now,
  };
  state.feeds.push(feed);
  ensureFeedHealth();
  await persistSoon();
  logger.info({ feedId: feed.id, actor }, "[competitive-intel] Feed added");
  return { ...feed };
}

export async function updateFeed(id: string, patch: FeedUpdate, actor?: string): Promise<ChampionFeed | null> {
  await ensureLoaded();
  const feed = state.feeds.find(f => f.id === id);
  if (!feed) return null;
  if (patch.champion !== undefined) {
    const v = String(patch.champion).trim();
    if (!v) throw new Error("champion cannot be empty");
    feed.champion = v;
  }
  if (patch.laneId !== undefined) {
    const v = String(patch.laneId).trim();
    if (!v) throw new Error("laneId cannot be empty");
    feed.laneId = v;
  }
  if (patch.feedUrl !== undefined) feed.feedUrl = validateUrl(patch.feedUrl, "feedUrl");
  if (patch.homeUrl !== undefined) feed.homeUrl = validateUrl(patch.homeUrl, "homeUrl");
  // Reject (laneId, feedUrl) collisions with another feed (mirrors addFeed behavior)
  if (patch.feedUrl !== undefined || patch.laneId !== undefined) {
    if (state.feeds.some(f => f.id !== feed.id && f.laneId === feed.laneId && f.feedUrl.toLowerCase() === feed.feedUrl.toLowerCase())) {
      throw new Error("A feed with this URL already exists in this lane");
    }
  }
  if (patch.paused !== undefined) feed.paused = patch.paused === true;
  if (patch.recommendationHint !== undefined) {
    if (patch.recommendationHint === null) {
      delete feed.recommendationHint;
    } else if (VALID_RECOMMENDATIONS.includes(patch.recommendationHint)) {
      feed.recommendationHint = patch.recommendationHint;
    } else {
      throw new Error("recommendationHint must be adopt | counter | monitor");
    }
  }
  feed.updatedAt = new Date().toISOString();
  // Reflect new champion/laneId on health record
  const health = state.feedHealth[feed.id];
  if (health) {
    health.champion = feed.champion;
    health.laneId = feed.laneId;
  }
  await persistSoon();
  logger.info({ feedId: id, actor }, "[competitive-intel] Feed updated");
  return { ...feed };
}

export async function removeFeed(id: string, actor?: string): Promise<boolean> {
  await ensureLoaded();
  const idx = state.feeds.findIndex(f => f.id === id);
  if (idx < 0) return false;
  state.feeds.splice(idx, 1);
  delete state.feedHealth[id];
  // Drop alerts owned by the removed feed so the UI doesn't show orphans
  state.alerts = state.alerts.filter(a => !a.id.startsWith(`${id}-`));
  await persistSoon();
  logger.info({ feedId: id, actor }, "[competitive-intel] Feed removed");
  return true;
}

// ─── Daily timer (in-process fallback) ───────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 24 * 3600_000;

export function startCompetitiveIntelMonitor(): void {
  if (_timer) return;
  ensureLoaded().catch(err => logger.warn({ err }, "[competitive-intel] initial load failed"));
  _timer = setInterval(() => {
    pollAllFeeds().catch(err => logger.error({ err }, "[competitive-intel] scheduled poll failed"));
  }, POLL_INTERVAL_MS);
  logger.info({ intervalMs: POLL_INTERVAL_MS, feeds: state.feeds.length }, "[competitive-intel] Monitor started");
}

export function stopCompetitiveIntelMonitor(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

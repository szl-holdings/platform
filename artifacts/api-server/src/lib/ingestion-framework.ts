import { logger } from "./logger";
import { db, auditEventsTable, streamDataSourcesTable, streamIngestedEventsTable } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { publish, WS_CHANNELS } from "./websocket";
import { randomUUID } from "crypto";

export interface StreamEvent {
  id: string;
  type: string;
  source: string;
  category: "siem" | "market" | "ais";
  severity?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  normalized: boolean;
  sourceId?: number;
}

export type StreamCategory = "siem" | "market" | "ais";

const BUFFER_CAPACITY = 500;

const buffers: Record<StreamCategory, StreamEvent[]> = {
  siem: [],
  market: [],
  ais: [],
};

const subscriberSets: Record<StreamCategory, Set<(evt: StreamEvent) => void>> = {
  siem: new Set(),
  market: new Set(),
  ais: new Set(),
};

const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_PER_WINDOW = 50;

const rateLimitCounters: Record<string, { count: number; windowStart: number }> = {};

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitCounters[key];
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitCounters[key] = { count: 1, windowStart: now };
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_PER_WINDOW) {
    return true;
  }
  entry.count++;
  return false;
}

function pushToBuffer(category: StreamCategory, event: StreamEvent): void {
  const buf = buffers[category];
  buf.push(event);
  if (buf.length > BUFFER_CAPACITY) {
    buf.splice(0, buf.length - BUFFER_CAPACITY);
  }
  for (const subscriber of subscriberSets[category]) {
    try {
      subscriber(event);
    } catch {
    }
  }
  const wsChannel = category === "siem"
    ? WS_CHANNELS.AEGIS_INCIDENTS
    : category === "ais"
      ? WS_CHANNELS.VESSEL_POSITIONS
      : WS_CHANNELS.LYTE_METRICS;

  publish(wsChannel, event.type, event);
}

export function subscribeToBuffer(category: StreamCategory, cb: (evt: StreamEvent) => void): () => void {
  subscriberSets[category].add(cb);
  return () => subscriberSets[category].delete(cb);
}

export function getBufferSnapshot(category: StreamCategory, limit = 50): StreamEvent[] {
  const buf = buffers[category];
  return buf.slice(-Math.min(limit, buf.length));
}

async function persistEvent(event: StreamEvent, sourceId?: number): Promise<void> {
  try {
    await db.insert(streamIngestedEventsTable).values({
      externalId: event.id,
      sourceId: sourceId ?? null,
      category: event.category,
      type: event.type,
      source: event.source,
      severity: event.severity ?? null,
      payload: event.payload,
      eventTs: new Date(event.timestamp),
    });
  } catch (err) {
    logger.debug({ err }, "[ingestion] Failed to persist event (non-fatal)");
  }
}

async function logIngestionAudit(source: string, count: number): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: "stream.ingestion",
      entityType: "stream",
      entityId: source,
      newValues: { source, count, ingestedAt: new Date().toISOString() },
    });
  } catch {
  }
}

export function ingestEvent(event: Omit<StreamEvent, "id" | "normalized"> & { id?: string }, sourceId?: number): StreamEvent {
  if (isRateLimited(`ingest:${event.category}`)) {
    logger.debug({ category: event.category }, "[ingestion] Rate limit hit, dropping event");
    throw new Error("Rate limit exceeded");
  }

  const full: StreamEvent = {
    ...event,
    id: event.id ?? `${event.category}_${Date.now()}_${randomUUID().slice(0, 8)}`,
    normalized: true,
    sourceId,
  };

  pushToBuffer(event.category, full);
  void persistEvent(full, sourceId);
  return full;
}

export async function ingestBatch(
  events: Array<Omit<StreamEvent, "normalized">>,
  sourceId?: number
): Promise<{ ingested: number; dropped: number }> {
  let ingested = 0;
  let dropped = 0;

  for (const evt of events) {
    try {
      ingestEvent(evt, sourceId);
      ingested++;
    } catch {
      dropped++;
    }
  }

  if (ingested > 0) {
    const source = events[0]?.source ?? "unknown";
    void logIngestionAudit(source, ingested);
  }

  return { ingested, dropped };
}

export interface DataSourceConfig {
  id: number;
  name: string;
  type: "webhook" | "polling";
  category: StreamCategory;
  endpoint?: string;
  authToken?: string;
  pollingIntervalMs: number;
  enabled: boolean;
  status: string;
  eventsIngested: number;
}

const activePollers = new Map<number, NodeJS.Timeout>();
const sourceRegistry = new Map<number, DataSourceConfig>();

export async function loadDataSourcesFromDb(): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(streamDataSourcesTable)
      .orderBy(desc(streamDataSourcesTable.createdAt));

    for (const row of rows) {
      const config: DataSourceConfig = {
        id: row.id,
        name: row.name,
        type: row.type as "webhook" | "polling",
        category: row.category as StreamCategory,
        endpoint: row.endpoint ?? undefined,
        authToken: (row.authConfig as Record<string, string> | null)?.token,
        pollingIntervalMs: row.pollingIntervalMs ?? 30000,
        enabled: row.enabled,
        status: row.status,
        eventsIngested: row.eventsIngested,
      };
      sourceRegistry.set(row.id, config);
      if (config.enabled && config.type === "polling") {
        void startPollingSource(config);
      }
    }
    logger.info({ count: rows.length }, "[ingestion] Loaded data sources from DB");
  } catch (err) {
    logger.warn({ err }, "[ingestion] Could not load data sources from DB");
  }
}

export async function registerDataSource(config: Omit<DataSourceConfig, "id" | "eventsIngested" | "status">): Promise<DataSourceConfig> {
  const [row] = await db.insert(streamDataSourcesTable).values({
    name: config.name,
    type: config.type,
    category: config.category,
    endpoint: config.endpoint,
    authConfig: config.authToken ? { token: config.authToken } : null,
    pollingIntervalMs: config.pollingIntervalMs,
    enabled: config.enabled,
    status: "idle",
  }).returning();

  const full: DataSourceConfig = {
    id: row!.id,
    name: row!.name,
    type: row!.type as "webhook" | "polling",
    category: row!.category as StreamCategory,
    endpoint: row!.endpoint ?? undefined,
    authToken: config.authToken,
    pollingIntervalMs: row!.pollingIntervalMs ?? 30000,
    enabled: row!.enabled,
    status: row!.status,
    eventsIngested: 0,
  };

  sourceRegistry.set(full.id, full);

  if (full.enabled && full.type === "polling") {
    void startPollingSource(full);
  }

  logger.info({ id: full.id, name: full.name, type: full.type, category: full.category }, "[ingestion] Registered new data source");
  return full;
}

export async function pauseDataSource(id: number): Promise<void> {
  stopPollingSource(id);
  const config = sourceRegistry.get(id);
  if (config) config.status = "paused";
  await db.update(streamDataSourcesTable).set({ status: "paused", enabled: false, updatedAt: new Date() }).where(eq(streamDataSourcesTable.id, id));
  logger.info({ id }, "[ingestion] Data source paused");
}

export async function resumeDataSource(id: number): Promise<void> {
  const config = sourceRegistry.get(id);
  if (!config) throw new Error(`Data source ${id} not found`);
  config.enabled = true;
  config.status = "active";
  await db.update(streamDataSourcesTable).set({ status: "active", enabled: true, updatedAt: new Date() }).where(eq(streamDataSourcesTable.id, id));
  if (config.type === "polling") {
    void startPollingSource(config);
  }
}

export function listDataSources(): DataSourceConfig[] {
  return Array.from(sourceRegistry.values());
}

export function getDataSource(id: number): DataSourceConfig | undefined {
  return sourceRegistry.get(id);
}

async function updateSourceHealth(id: number, ok: boolean, error?: string): Promise<void> {
  const config = sourceRegistry.get(id);
  if (config) {
    config.status = ok ? "active" : "error";
  }
  try {
    await db.update(streamDataSourcesTable).set({
      status: ok ? "active" : "error",
      lastHealthAt: ok ? new Date() : undefined,
      lastErrorAt: ok ? undefined : new Date(),
      lastError: ok ? null : error ?? null,
      updatedAt: new Date(),
    }).where(eq(streamDataSourcesTable.id, id));
  } catch {
  }
}

async function incrementSourceCounter(id: number, count: number): Promise<void> {
  const config = sourceRegistry.get(id);
  if (config) config.eventsIngested += count;
  try {
    await db.update(streamDataSourcesTable).set({
      eventsIngested: (config?.eventsIngested ?? 0),
      updatedAt: new Date(),
    }).where(eq(streamDataSourcesTable.id, id));
  } catch {
  }
}

function startPollingSource(config: DataSourceConfig): void {
  if (activePollers.has(config.id)) return;

  const poll = getPollerForSource(config);
  if (!poll) {
    logger.warn({ id: config.id, name: config.name }, "[ingestion] No poller found for source");
    return;
  }

  const run = async () => {
    try {
      const events = await poll(config);
      if (events.length > 0) {
        const { ingested } = await ingestBatch(events, config.id);
        await incrementSourceCounter(config.id, ingested);
      }
      await updateSourceHealth(config.id, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ id: config.id, name: config.name, err: msg }, "[ingestion] Polling error");
      await updateSourceHealth(config.id, false, msg);
    }
  };

  void run();
  const timer = setInterval(run, config.pollingIntervalMs);
  activePollers.set(config.id, timer);
  logger.info({ id: config.id, name: config.name, intervalMs: config.pollingIntervalMs }, "[ingestion] Polling started");
}

function stopPollingSource(id: number): void {
  const timer = activePollers.get(id);
  if (timer) {
    clearInterval(timer);
    activePollers.delete(id);
  }
}

type PollerFn = (config: DataSourceConfig) => Promise<Array<Omit<StreamEvent, "normalized">>>;

function getPollerForSource(config: DataSourceConfig): PollerFn | null {
  if (config.category === "market") return pollCoinGecko;
  if (config.category === "ais") return pollAisVessels;
  if (config.category === "siem") return pollSiemWebhookQueue;
  return null;
}

async function pollCoinGecko(_config: DataSourceConfig): Promise<Array<Omit<StreamEvent, "normalized">>> {
  const COINS = ["bitcoin", "ethereum", "solana", "chainlink", "avalanche-2"];
  const ids = COINS.join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);

  const data = await res.json() as Record<string, {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
  }>;

  const TICKER_MAP: Record<string, string> = {
    bitcoin: "BTC-USD",
    ethereum: "ETH-USD",
    solana: "SOL-USD",
    chainlink: "LINK-USD",
    "avalanche-2": "AVAX-USD",
  };

  return Object.entries(data).map(([coinId, info]) => {
    const ticker = TICKER_MAP[coinId] ?? coinId.toUpperCase();
    const change = info.usd_24h_change ?? 0;
    const severity = Math.abs(change) > 10 ? "high" : Math.abs(change) > 5 ? "medium" : "low";
    return {
      id: `mkt_${coinId}_${Date.now()}`,
      type: Math.abs(change) > 5 ? "price_alert" : "price_update",
      source: "coingecko",
      category: "market" as StreamCategory,
      severity,
      payload: {
        ticker,
        price: info.usd,
        change24h: parseFloat(change.toFixed(2)),
        volume24h: info.usd_24h_vol ?? 0,
      },
      timestamp: new Date().toISOString(),
    };
  });
}

let aisVesselPositions = [
  { mmsi: "123456001", name: "MV PACIFIC STAR", lat: 23.4, lon: 118.7, speed: 14.2, course: 45, status: "underway" },
  { mmsi: "123456002", name: "MV ATLAS", lat: 35.1, lon: -12.3, speed: 18.5, course: 270, status: "underway" },
  { mmsi: "123456003", name: "MV HORIZON", lat: -4.2, lon: 39.8, speed: 11.0, course: 180, status: "underway" },
  { mmsi: "123456004", name: "MV LIBERTY", lat: 51.5, lon: 1.2, speed: 8.3, course: 90, status: "underway" },
  { mmsi: "123456005", name: "MV CORSAIR", lat: 14.6, lon: 120.9, speed: 12.1, course: 315, status: "underway" },
];

async function pollAisVessels(_config: DataSourceConfig): Promise<Array<Omit<StreamEvent, "normalized">>> {
  let liveData: typeof aisVesselPositions | null = null;
  try {
    const res = await fetch("https://api.vesselfinder.com/vessels?userkey=demo&lat=0&lng=0&radius=6371", {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      liveData = await res.json() as typeof aisVesselPositions;
    }
  } catch {
  }

  const vessels = liveData ?? aisVesselPositions;
  aisVesselPositions = aisVesselPositions.map(v => ({
    ...v,
    lat: v.lat + (Math.random() - 0.5) * 0.02,
    lon: v.lon + (Math.random() - 0.5) * 0.02,
    speed: Math.max(0, v.speed + (Math.random() - 0.5) * 0.5),
    course: (v.course + (Math.random() - 0.5) * 5 + 360) % 360,
  }));

  return vessels.slice(0, 5).map(vessel => ({
    id: `ais_${vessel.mmsi}_${Date.now()}`,
    type: "position_update",
    source: "ais_feed",
    category: "ais" as StreamCategory,
    severity: undefined,
    payload: {
      mmsi: vessel.mmsi,
      vessel: vessel.name,
      lat: parseFloat((vessel.lat).toFixed(4)),
      lon: parseFloat((vessel.lon).toFixed(4)),
      speed: parseFloat((vessel.speed).toFixed(1)),
      course: Math.round(vessel.course),
      status: vessel.status ?? "underway",
    },
    timestamp: new Date().toISOString(),
  }));
}

const webhookEventQueues: Record<StreamCategory, StreamEvent[]> = {
  siem: [],
  market: [],
  ais: [],
};

export function enqueueWebhookEvent(category: StreamCategory, event: StreamEvent): void {
  webhookEventQueues[category].push(event);
  if (webhookEventQueues[category].length > 200) {
    webhookEventQueues[category].splice(0, webhookEventQueues[category].length - 200);
  }
}

async function pollSiemWebhookQueue(_config: DataSourceConfig): Promise<Array<Omit<StreamEvent, "normalized">>> {
  const drained = webhookEventQueues.siem.splice(0);
  if (drained.length > 0) return drained;
  return [];
}

export function normalizeSiemPayload(raw: Record<string, unknown>, sourceHint?: string): Omit<StreamEvent, "normalized"> {
  const now = new Date().toISOString();
  return {
    id: `siem_wh_${Date.now()}_${randomUUID().slice(0, 6)}`,
    type: (raw["event_type"] ?? raw["type"] ?? raw["action"] ?? "siem_event") as string,
    source: (raw["source"] ?? raw["product"] ?? sourceHint ?? "webhook") as string,
    category: "siem",
    severity: ((raw["severity"] ?? raw["priority"] ?? "medium") as string).toLowerCase() as string,
    payload: raw,
    timestamp: (raw["timestamp"] ?? raw["event_time"] ?? raw["time"] ?? now) as string,
  };
}

export function normalizeAisNmea(sentence: string, sourceId?: number): Omit<StreamEvent, "normalized"> | null {
  const VDMVDO = /^\$AIVDM,\d+,\d+,[^,]*,[AB],(.+),\d\*[0-9A-F]{2}$/;
  const match = sentence.match(VDMVDO);
  if (!match) return null;
  const payload = match[1]!;
  return {
    id: `ais_nmea_${Date.now()}`,
    type: "position_update",
    source: "ais_nmea",
    category: "ais",
    payload: { raw: payload, sentence },
    timestamp: new Date().toISOString(),
    sourceId,
  };
}

const BUILT_IN_SOURCES: Array<Omit<DataSourceConfig, "id" | "eventsIngested" | "status">> = [
  {
    name: "CoinGecko Market Feed",
    type: "polling",
    category: "market",
    endpoint: "https://api.coingecko.com/api/v3",
    pollingIntervalMs: 30000,
    enabled: true,
  },
  {
    name: "AIS Vessel Tracker",
    type: "polling",
    category: "ais",
    endpoint: "internal://ais-simulator",
    pollingIntervalMs: 8000,
    enabled: true,
  },
];

let frameworkInitialized = false;

export async function initIngestionFramework(): Promise<void> {
  if (frameworkInitialized) return;
  frameworkInitialized = true;

  await loadDataSourcesFromDb();

  const existingSources = listDataSources();

  for (const builtIn of BUILT_IN_SOURCES) {
    const existing = existingSources.find(
      s => s.name === builtIn.name && s.category === builtIn.category
    );
    if (!existing) {
      try {
        await registerDataSource(builtIn);
      } catch (err) {
        logger.warn({ err, name: builtIn.name }, "[ingestion] Failed to register built-in source");
      }
    } else if (existing.enabled && existing.type === "polling" && !activePollers.has(existing.id)) {
      startPollingSource(existing);
    }
  }

  logger.info("[ingestion] Framework initialized");
}

export function getIngestionStats(): {
  bufferSizes: Record<StreamCategory, number>;
  activePollersCount: number;
  sources: DataSourceConfig[];
} {
  return {
    bufferSizes: {
      siem: buffers.siem.length,
      market: buffers.market.length,
      ais: buffers.ais.length,
    },
    activePollersCount: activePollers.size,
    sources: listDataSources(),
  };
}

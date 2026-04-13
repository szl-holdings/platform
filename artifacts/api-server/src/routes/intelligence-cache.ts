import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { services } from "@szl-holdings/services";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export const memCache = new Map<string, { data: unknown; expiresAt: number }>();
const refreshing = new Set<string>();

export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const mem = memCache.get(key);
  if (mem && mem.expiresAt > now) return mem.data as T;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, key)).limit(1);
    if (row && new Date(row.expiresAt).getTime() > now) {
      const data = row.data as T;
      memCache.set(key, { data, expiresAt: new Date(row.expiresAt).getTime() });
      if (!refreshing.has(key) && new Date(row.expiresAt).getTime() - now < ttlMs * 0.25) {
        refreshing.add(key);
        fetcher().then(async (fresh) => { await upsertCache(key, fresh, ttlMs); }).catch(() => {}).finally(() => refreshing.delete(key));
      }
      return data;
    }
  } catch {}
  const fresh = await fetcher().catch(async () => {
    const [stale] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, key)).limit(1).catch(() => [null]);
    if (stale) return stale.data as T;
    if (mem) return mem.data as T;
    throw new Error("Data unavailable");
  });
  await upsertCache(key, fresh, ttlMs);
  return fresh;
}

export async function upsertCache<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs);
  memCache.set(key, { data, expiresAt: expiresAt.getTime() });
  try {
    await db.insert(intelligenceCacheTable).values({ key, data, expiresAt, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: intelligenceCacheTable.key, set: { data, expiresAt, fetchedAt: new Date() } });
  } catch {}
}

export const intelRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Intelligence rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI inference rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

export async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Intelligence/1.0", Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export type CveItem = { id: string; description: string; severity: string; score: number; vendor: string; product: string; published: string; references: number };

export async function fetchNvdCves(): Promise<CveItem[]> {
  const raw = await fetchJson("https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=8&startIndex=0", 10000);
  const data = raw as { vulnerabilities?: { cve: { id?: string; descriptions?: { lang: string; value: string }[]; metrics?: { cvssMetricV31?: { cvssData?: { baseScore?: number } }[] }; configurations?: { nodes?: { cpeMatch?: { criteria?: string }[] }[] }[]; published?: string; references?: unknown[] } }[] } };
  const items = data?.vulnerabilities;
  if (!Array.isArray(items) || items.length === 0) throw new Error("No NVD data");
  return items.map((v, idx: number) => {
    const cve = v.cve;
    const metrics = cve?.metrics?.cvssMetricV31?.[0]?.cvssData;
    const score = metrics?.baseScore ?? (9.0 - idx * 0.5);
    const severity = score >= 9.0 ? "CRITICAL" : score >= 7.0 ? "HIGH" : score >= 4.0 ? "MEDIUM" : "LOW";
    return { id: cve?.id ?? `CVE-UNKNOWN-${idx}`, description: cve?.descriptions?.find((d) => d.lang === "en")?.value ?? "No description available", severity, score, vendor: cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[3] ?? "Various", product: cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[4] ?? "Multiple Products", published: cve?.published ?? new Date().toISOString(), references: cve?.references?.length ?? 0 };
  });
}

export type NewsItem = { id: string; title: string; source: string; category: string; url: string; publishedAt: string; sentiment: string; sentimentScore: number };

export async function fetchRssNews(): Promise<NewsItem[]> {
  const raw = await fetchJson("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.feedburner.com%2FTheHackersNews&count=8", 8000);
  const rssData = raw as { items?: { title?: string; author?: string; link?: string; pubDate?: string }[] };
  const items = rssData?.items;
  if (!Array.isArray(items) || items.length === 0) throw new Error("No RSS data");
  return items.map((item, idx: number) => ({ id: `RSS-${idx}`, title: item.title ?? "Untitled", source: item.author || "The Hacker News", category: "security", url: item.link ?? "#", publishedAt: item.pubDate ?? new Date().toISOString(), sentiment: "neutral", sentimentScore: 0.5 }));
}

export type MarineWeatherItem = { region: string; lat: number; lon: number; windSpeed: number; windDirection: string | undefined; waveHeight: number; seaTemp: number; visibility: string; condition: string; warning: string | null };

export async function fetchOpenMeteoMarineWeather(): Promise<MarineWeatherItem[]> {
  const regions = [
    { region: "Western Black Sea (Constanta)", lat: 43.8, lon: 28.6 },
    { region: "North Atlantic", lat: 45.0, lon: -30.0 },
    { region: "Bosporus & Sea of Marmara", lat: 41.0, lon: 29.0 },
    { region: "Eastern Mediterranean", lat: 35.0, lon: 28.0 },
    { region: "South China Sea", lat: 12.0, lon: 115.0 },
    { region: "Strait of Hormuz / AG", lat: 26.0, lon: 56.0 },
    { region: "Indian Ocean (Monsoon)", lat: -5.0, lon: 72.0 },
    { region: "Barents Sea (NSR)", lat: 69.0, lon: 33.0 },
  ];
  const lats = regions.map(r => r.lat).join(",");
  const lons = regions.map(r => r.lon).join(",");
  const raw = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=UTC`, 10000);
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const dataArr = Array.isArray(raw) ? raw : [raw];
  return regions.map((r, i) => {
    const entry = dataArr[i] as { current?: { temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number } } | undefined;
    const current = entry?.current;
    const windSpeed = Math.round(current?.wind_speed_10m ?? 15);
    const windDir = dirs[Math.round((current?.wind_direction_10m ?? 0) / 45) % 8];
    const waveHeight = +(Math.max(0.3, windSpeed * 0.15)).toFixed(1);
    const condition = windSpeed > 30 ? "Rough seas" : windSpeed > 20 ? "Moderate seas" : windSpeed > 10 ? "Slight seas" : "Calm";
    const warning = windSpeed > 30 ? "High wind advisory" : windSpeed > 25 ? "Gale warning" : null;
    return { region: r.region, lat: r.lat, lon: r.lon, windSpeed, windDirection: windDir, waveHeight, seaTemp: current?.temperature_2m ?? 20, visibility: windSpeed > 25 ? "Poor" : windSpeed > 15 ? "Moderate" : "Good", condition, warning };
  });
}

export type GeoEvent = { id: string; title: string; region: string; severity: string | undefined; category: string; timestamp: string; source: string; impact: string };

export async function fetchGdeltGeopolitical(): Promise<GeoEvent[]> {
  const raw = await fetchJson("https://api.gdeltproject.org/api/v2/doc/doc?query=cybersecurity%20OR%20maritime%20OR%20sanctions&mode=ArtList&maxrecords=6&format=json&timespan=24h", 5000);
  const gdelt = raw as { articles?: { title?: string; url?: string; socialimage?: string; seendate?: string; sourcecountry?: string; domain?: string }[] };
  const articles = gdelt?.articles;
  if (!Array.isArray(articles) || articles.length === 0) throw new Error("No GDELT data");
  const categoryMap: Record<string, string> = { cyber: "cyber_operations", military: "military", regulation: "regulatory", infrastructure: "infrastructure", sanction: "sanctions" };
  return articles.slice(0, 6).map((a, idx: number) => {
    const titleLower = (a.title ?? "").toLowerCase();
    let cat = "cyber_operations";
    for (const [key, val] of Object.entries(categoryMap)) { if (titleLower.includes(key)) { cat = val; break; } }
    return { id: `GDELT-${idx}`, title: (a.title ?? "").slice(0, 120), region: a.sourcecountry ?? "Global", severity: ["critical", "high", "medium"][idx % 3], category: cat, timestamp: a.seendate ?? new Date().toISOString(), source: a.domain ?? "GDELT", impact: `Source: ${a.domain ?? "unknown"} — ${(a.title ?? "").slice(0, 60)}` };
  });
}

export type MaritimeVessel = { mmsi: string; name: string; type: string; lat: number; lon: number; speed: number; course: number; heading: number; destination: string; status: string; flag: string; length: number; timestamp: string };

export async function fetchLiveMaritimeVessels(): Promise<MaritimeVessel[]> {
  const raw = await fetchJson("https://meri.digitraffic.fi/api/ais/v1/locations/latest?from=0&to=100", 8000);
  type AisFeature = { properties?: { mmsi?: string | number; sog?: number; cog?: number; heading?: number; navStat?: number; timestampExternal?: number }; geometry?: { coordinates?: [number, number] } };
  const aisData = raw as { features?: AisFeature[] };
  const features = aisData?.features;
  if (!Array.isArray(features) || features.length === 0) throw new Error("No AIS data");
  const typeNames = ["Cargo", "Tanker", "Container", "Bulk Carrier", "Passenger", "Fishing"];
  return features.slice(0, 8).map((f, idx: number) => {
    const props = f.properties ?? {};
    const coords = f.geometry?.coordinates ?? [25.0, 60.0];
    return { mmsi: String(props.mmsi ?? `FIN${idx}`), name: `VESSEL-${props.mmsi ?? idx}`, type: typeNames[idx % typeNames.length], lat: coords[1], lon: coords[0], speed: +(props.sog ?? 0).toFixed(1), course: Math.round(props.cog ?? 0), heading: Math.round(props.heading ?? props.cog ?? 0), destination: "In Transit", status: props.navStat === 0 ? "Under way using engine" : "At anchor", flag: "FI", length: 150, timestamp: props.timestampExternal ? new Date(props.timestampExternal).toISOString() : new Date().toISOString() };
  });
}

export type ThreatItem = { id: string; type: string; name: string; severity: string | undefined; source: string; country: string; targetSector: string; description: string; lat: number; lon: number; timestamp: string; indicators: number };

export async function fetchOtxThreats(): Promise<ThreatItem[]> {
  const raw = await fetchJson("https://otx.alienvault.com/api/v1/pulses/subscribed?limit=8&page=1", 8000);
  type OtxPulse = { id?: string | number; name?: string; adversary?: string; targeted_countries?: string[]; references?: string[]; tags?: string[]; industries?: string[]; description?: string; created?: string; indicator_count?: number };
  const otxData = raw as { results?: OtxPulse[] };
  const pulses = otxData?.results;
  if (!Array.isArray(pulses) || pulses.length === 0) throw new Error("No OTX data");
  const severityMap = ["critical", "high", "medium", "low"];
  return pulses.map((p, idx: number) => ({ id: `OTX-${p.id ?? idx}`, type: p.adversary ? "apt" : "malware", name: p.name?.slice(0, 60) ?? "Unknown Threat", severity: severityMap[Math.min(idx, 3)], source: "AlienVault OTX", country: p.targeted_countries?.[0] ?? "Unknown", targetSector: p.industries?.[0] ?? "General", description: p.description?.slice(0, 200) ?? "No description available", lat: 40, lon: 20, timestamp: p.created ?? new Date().toISOString(), indicators: p.indicator_count ?? 0 }));
}

type SanctionVessel = { name: string; imo: string; flag: string; status: string; reason: string; listedDate: string; source: string; entities: { entity: string; word: string; score: number; start: number; end: number }[]; aiEnriched: boolean };

async function fetchOfacSdnVessels(): Promise<{ name: string; imo: string; flag: string; status: string; reason: string; listedDate: string; source: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://www.treasury.gov/ofac/downloads/sdn_mini.xml", { signal: controller.signal, headers: { "User-Agent": "SZL-IntelPlatform/1.0", Accept: "application/xml,text/xml" } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OFAC HTTP ${res.status}`);
    const xml = await res.text();
    const vesselMatches: { name: string; imo: string; flag: string; status: string; reason: string; listedDate: string; source: string }[] = [];
    const sdnEntries = xml.split(/<sdnEntry>/).slice(1);
    for (const entry of sdnEntries.slice(0, 200)) {
      const sdnType = (entry.match(/<sdnType>([^<]+)<\/sdnType>/) ?? [])[1] ?? "";
      if (sdnType !== "Vessel") continue;
      const name = (entry.match(/<lastName>([^<]+)<\/lastName>/) ?? [])[1] ?? "";
      const flag = (entry.match(/<citizenship>([^<]+)<\/citizenship>/) ?? [])[1] ?? "Unknown";
      const listedDate = (entry.match(/<publishDate>([^<]+)<\/publishDate>/) ?? [])[1] ?? "";
      let imo = "";
      const imoMatch = entry.match(/imo\s+(?:no\.?|number)\s*[:\s]*([0-9]{7})/i);
      if (imoMatch) imo = imoMatch[1];
      const programMatch = entry.match(/<program>([^<]+)<\/program>/);
      const reason = programMatch ? programMatch[1] : "OFAC SDN designation";
      if (name) vesselMatches.push({ name, imo, flag, status: "Sanctioned", reason, listedDate, source: "OFAC SDN" });
    }
    return vesselMatches;
  } catch { clearTimeout(timer); return []; }
}

export async function fetchAndEnrichSanctions(): Promise<SanctionVessel[]> {
  const raw = await fetchOfacSdnVessels();
  if (raw.length === 0) return [];
  return Promise.all(raw.slice(0, 50).map(async (vessel) => {
    try {
      const ner = await services.huggingface.namedEntityRecognition(`${vessel.name} flagged under ${vessel.flag} for ${vessel.reason}`);
      return { ...vessel, entities: ner.entities.slice(0, 5), aiEnriched: true };
    } catch { return { ...vessel, entities: [], aiEnriched: false }; }
  }));
}

export async function computeIntelligenceBriefing(): Promise<Record<string, unknown>> {
  const [threats, cves, geopolitical] = await Promise.allSettled([
    getCached("threats", 300000, fetchOtxThreats),
    getCached("cves", 600000, fetchNvdCves),
    getCached("geopolitical", 600000, fetchGdeltGeopolitical),
  ]);
  const t = threats.status === "fulfilled" ? threats.value : [];
  const c = cves.status === "fulfilled" ? cves.value : [];
  const g = geopolitical.status === "fulfilled" ? geopolitical.value : [];
  return {
    computedAt: new Date().toISOString(),
    threatCount: t.length,
    criticalThreats: t.filter((x: Record<string, unknown>) => x.severity === "critical").length,
    cveCount: c.length,
    criticalCves: c.filter((x: Record<string, unknown>) => x.severity === "CRITICAL").length,
    geopoliticalEvents: g.length,
    topThreats: t.slice(0, 3),
    topCves: c.slice(0, 3),
    riskLevel: t.some((x: Record<string, unknown>) => x.severity === "critical") ? "critical" : t.length > 10 ? "high" : "medium",
    dataSource: "OTX AlienVault + NIST NVD + GDELT",
  };
}

export async function prewarmIntelligenceCache(): Promise<void> {
  const prewarm = async (key: string, ttlMs: number, fetcher: () => Promise<unknown>) => {
    try {
      const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, key)).limit(1);
      if (row && new Date(row.expiresAt).getTime() > Date.now()) return;
      const data = await fetcher();
      await upsertCache(key, data, ttlMs);
    } catch {}
  };
  await Promise.allSettled([
    prewarm("threats", 300000, fetchOtxThreats),
    prewarm("marine-weather", 1800000, fetchOpenMeteoMarineWeather),
    prewarm("geopolitical", 600000, fetchGdeltGeopolitical),
    prewarm("maritime-vessels", 120000, fetchLiveMaritimeVessels),
    prewarm("cves", 600000, fetchNvdCves),
    prewarm("sanctions-enriched", 3600000, fetchAndEnrichSanctions),
    prewarm("briefing", 300000, computeIntelligenceBriefing),
  ]);
}

export function scheduleIntelligenceRefresh(): NodeJS.Timeout {
  return setInterval(async () => {
    const jobs: [string, number, () => Promise<unknown>][] = [
      ["threats", 300000, fetchOtxThreats],
      ["marine-weather", 1800000, fetchOpenMeteoMarineWeather],
      ["geopolitical", 600000, fetchGdeltGeopolitical],
      ["maritime-vessels", 120000, fetchLiveMaritimeVessels],
      ["cves", 600000, fetchNvdCves],
      ["sanctions-enriched", 3600000, fetchAndEnrichSanctions],
      ["briefing", 300000, computeIntelligenceBriefing],
    ];
    for (const [key, ttlMs, fetcher] of jobs) {
      if (refreshing.has(key)) continue;
      const mem = memCache.get(key);
      if (mem && mem.expiresAt > Date.now() + ttlMs * 0.25) continue;
      refreshing.add(key);
      fetcher().then((data) => upsertCache(key, data, ttlMs)).catch(() => {}).finally(() => refreshing.delete(key));
    }
  }, 60000);
}

memCache.set("threats", { data: [
  { id: "DEMO-1", type: "apt", name: "Storm-0558 Phishing Campaign", severity: "critical", source: "SZL Intel (demo)", country: "CN", targetSector: "Government", description: "Advanced persistent threat targeting government and defense email infrastructure via forged authentication tokens.", lat: 39.9, lon: 116.4, timestamp: new Date(Date.now() - 3600000).toISOString(), indicators: 42 },
  { id: "DEMO-2", type: "malware", name: "BlackCat Ransomware Variant", severity: "high", source: "SZL Intel (demo)", country: "RU", targetSector: "Critical Infrastructure", description: "New ransomware variant targeting OT/ICS environments with double-extortion model and 72-hour payment demands.", lat: 55.7, lon: 37.6, timestamp: new Date(Date.now() - 7200000).toISOString(), indicators: 28 },
], expiresAt: Date.now() + 300000 });

memCache.set("geopolitical", { data: [
  { id: "GEO-DEMO-1", title: "Sanctions Package Extended — Russia Energy Sector", region: "Russia", severity: "high", category: "sanctions", timestamp: new Date(Date.now() - 1800000).toISOString(), source: "SZL Intel (demo)", impact: "EU extends energy sanctions — additional 47 entities listed under Russia SDN" },
  { id: "GEO-DEMO-2", title: "South China Sea Patrol Incident — Taiwan Strait", region: "CN", severity: "critical", category: "military", timestamp: new Date(Date.now() - 3600000).toISOString(), source: "SZL Intel (demo)", impact: "PLAN naval exercises reported within 12nm — maritime routing advisories issued" },
], expiresAt: Date.now() + 600000 });

memCache.set("maritime-vessels", { data: [
  { mmsi: "636091402", name: "NORDIC CROWN", type: "Container", lat: 51.9, lon: 4.1, speed: 12.4, course: 270, heading: 268, destination: "Rotterdam", status: "Under way using engine", flag: "LR", length: 294, timestamp: new Date().toISOString() },
  { mmsi: "477213600", name: "OCEAN PIONEER", type: "Tanker", lat: 25.1, lon: 56.3, speed: 8.7, course: 315, heading: 312, destination: "Abu Dhabi", status: "Under way using engine", flag: "HK", length: 330, timestamp: new Date().toISOString() },
], expiresAt: Date.now() + 120000 });

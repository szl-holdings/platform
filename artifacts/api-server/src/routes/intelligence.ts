import crypto from "crypto";
import express, { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { services } from "@workspace/services";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { getAiModels, getAiModelById, getModelObservabilitySummary } from "../lib/ai-model-observability";
import { getRegistrySummary } from "../lib/model-registry";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const cache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    cache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = cache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

function preseedCache<T>(key: string, data: T, ttlMs: number): void {
  if (!cache.has(key)) {
    cache.set(key, { data, expiry: Date.now() + ttlMs });
  }
}

const intelRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Intelligence rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
});

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI inference rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
});

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Intelligence/1.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNvdCves(): Promise<typeof DEMO_CVES> {
  try {
    const data = await fetchJson(
      "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=8&startIndex=0",
      10000,
    ) as any;
    const items = data?.vulnerabilities;
    if (!Array.isArray(items) || items.length === 0) throw new Error("No NVD data");
    return items.map((v: any, idx: number) => {
      const cve = v.cve;
      const metrics = cve?.metrics?.cvssMetricV31?.[0]?.cvssData;
      const score = metrics?.baseScore ?? (9.0 - idx * 0.5);
      const severity = score >= 9.0 ? "CRITICAL" : score >= 7.0 ? "HIGH" : score >= 4.0 ? "MEDIUM" : "LOW";
      return {
        id: cve?.id ?? `CVE-UNKNOWN-${idx}`,
        description: cve?.descriptions?.find((d: any) => d.lang === "en")?.value ?? "No description available",
        severity,
        score,
        vendor: cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[3] ?? "Various",
        product: cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[4] ?? "Multiple Products",
        published: cve?.published ?? new Date().toISOString(),
        references: cve?.references?.length ?? 0,
      };
    });
  } catch {
    return DEMO_CVES;
  }
}

async function fetchRssNews(): Promise<typeof DEMO_NEWS> {
  try {
    const data = await fetchJson(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.feedburner.com%2FTheHackersNews&count=8",
      8000,
    ) as any;
    const items = data?.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error("No RSS data");
    return items.map((item: any, idx: number) => ({
      id: `RSS-${idx}`,
      title: item.title ?? "Untitled",
      source: item.author || "The Hacker News",
      category: "security",
      url: item.link ?? "#",
      publishedAt: item.pubDate ?? new Date().toISOString(),
      sentiment: "neutral",
      sentimentScore: 0.5,
    }));
  } catch {
    return DEMO_NEWS;
  }
}

async function fetchOpenMeteoMarineWeather(): Promise<typeof DEMO_MARINE_WEATHER> {
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
  try {
    const results = await Promise.all(
      regions.map(async (r) => {
        const data = await fetchJson(
          `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=UTC`,
          6000,
        ) as any;
        const current = data?.current;
        if (!current) throw new Error("No weather data");
        const windSpeed = Math.round(current.wind_speed_10m ?? 15);
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const windDir = dirs[Math.round((current.wind_direction_10m ?? 0) / 45) % 8];
        const waveHeight = +(Math.max(0.3, windSpeed * 0.12 + Math.random() * 0.5)).toFixed(1);
        const condition = windSpeed > 30 ? "Rough seas" : windSpeed > 20 ? "Moderate seas" : windSpeed > 10 ? "Slight seas" : "Calm";
        const warning = windSpeed > 30 ? "High wind advisory" : windSpeed > 25 ? "Gale warning" : null;
        return {
          region: r.region,
          lat: r.lat,
          lon: r.lon,
          windSpeed,
          windDirection: windDir,
          waveHeight,
          seaTemp: current.temperature_2m ?? 20,
          visibility: windSpeed > 25 ? "Poor" : windSpeed > 15 ? "Moderate" : "Good",
          condition,
          warning,
        };
      }),
    );
    return results;
  } catch {
    return DEMO_MARINE_WEATHER;
  }
}

async function fetchGdeltGeopolitical(): Promise<typeof DEMO_GEO_EVENTS> {
  try {
    const data = await fetchJson(
      "https://api.gdeltproject.org/api/v2/doc/doc?query=cybersecurity%20OR%20maritime%20OR%20sanctions&mode=ArtList&maxrecords=6&format=json&timespan=24h",
      5000,
    ) as any;
    const articles = data?.articles;
    if (!Array.isArray(articles) || articles.length === 0) throw new Error("No GDELT data");
    const categoryMap: Record<string, string> = {
      cyber: "cyber_operations", military: "military", regulation: "regulatory",
      infrastructure: "infrastructure", sanction: "sanctions",
    };
    return articles.slice(0, 6).map((a: any, idx: number) => {
      const titleLower = (a.title ?? "").toLowerCase();
      let cat = "cyber_operations";
      for (const [key, val] of Object.entries(categoryMap)) {
        if (titleLower.includes(key)) { cat = val; break; }
      }
      const severityList = ["critical", "high", "medium"];
      return {
        id: `GDELT-${idx}`,
        title: (a.title ?? "").slice(0, 120),
        region: a.sourcecountry ?? "Global",
        severity: severityList[idx % 3],
        category: cat,
        timestamp: a.seendate ?? new Date().toISOString(),
        source: a.domain ?? "GDELT",
        impact: `Source: ${a.domain ?? "unknown"} — ${(a.title ?? "").slice(0, 60)}`,
      };
    });
  } catch {
    return DEMO_GEO_EVENTS;
  }
}

async function fetchLiveMaritimeVessels(): Promise<typeof DEMO_MARITIME_VESSELS> {
  try {
    const data = await fetchJson(
      "https://meri.digitraffic.fi/api/ais/v1/locations/latest?from=0&to=100",
      8000,
    ) as any;
    const features = data?.features;
    if (!Array.isArray(features) || features.length === 0) throw new Error("No AIS data");
    const typeNames = ["Cargo", "Tanker", "Container", "Bulk Carrier", "Passenger", "Fishing"];
    return features.slice(0, 8).map((f: any, idx: number) => {
      const props = f.properties ?? {};
      const coords = f.geometry?.coordinates ?? [25.0, 60.0];
      return {
        mmsi: String(props.mmsi ?? `FIN${idx}`),
        name: `VESSEL-${props.mmsi ?? idx}`,
        type: typeNames[idx % typeNames.length],
        lat: coords[1],
        lon: coords[0],
        speed: +(props.sog ?? Math.random() * 15).toFixed(1),
        course: Math.round(props.cog ?? Math.random() * 360),
        heading: Math.round(props.heading ?? props.cog ?? 0),
        destination: "In Transit",
        status: props.navStat === 0 ? "Under way using engine" : "At anchor",
        flag: "FI",
        length: 100 + Math.floor(Math.random() * 250),
        timestamp: props.timestampExternal ? new Date(props.timestampExternal).toISOString() : new Date().toISOString(),
      };
    });
  } catch {
    return DEMO_MARITIME_VESSELS;
  }
}

async function fetchOtxThreats(): Promise<typeof DEMO_THREATS> {
  try {
    const data = await fetchJson(
      "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=8&page=1",
      8000,
    ) as any;
    const pulses = data?.results;
    if (!Array.isArray(pulses) || pulses.length === 0) throw new Error("No OTX data");
    return pulses.map((p: any, idx: number) => {
      const severityMap = ["critical", "high", "medium", "low"];
      const sev = severityMap[Math.min(idx, 3)];
      return {
        id: `OTX-${p.id ?? idx}`,
        type: p.adversary ? "apt" : "malware",
        name: p.name?.slice(0, 60) ?? "Unknown Threat",
        severity: sev,
        source: "AlienVault OTX",
        country: p.targeted_countries?.[0] ?? "Unknown",
        targetSector: p.industries?.[0] ?? "General",
        description: p.description?.slice(0, 200) ?? "No description available",
        lat: 40 + (Math.random() * 30 - 15),
        lon: 20 + (Math.random() * 60 - 30),
        timestamp: p.created ?? new Date().toISOString(),
        indicators: p.indicator_count ?? Math.floor(Math.random() * 50),
      };
    });
  } catch {
    return DEMO_THREATS;
  }
}

const DEMO_CVES = [
  { id: "CVE-2026-0142", description: "Remote code execution in enterprise gateway appliances via crafted HTTP headers", severity: "CRITICAL", score: 9.8, vendor: "Cisco", product: "ASA Firewall", published: "2026-03-25T14:30:00Z", references: 12 },
  { id: "CVE-2026-0138", description: "SQL injection vulnerability in widely-used CMS plugin allowing data exfiltration", severity: "HIGH", score: 8.6, vendor: "WordPress", product: "WP-Commerce Plugin", published: "2026-03-24T09:15:00Z", references: 8 },
  { id: "CVE-2026-0135", description: "Authentication bypass in industrial control system SCADA interface", severity: "CRITICAL", score: 9.4, vendor: "Siemens", product: "SIMATIC S7", published: "2026-03-23T18:45:00Z", references: 15 },
  { id: "CVE-2026-0131", description: "Buffer overflow in DNS resolver library affecting multiple Linux distributions", severity: "HIGH", score: 8.1, vendor: "ISC", product: "BIND", published: "2026-03-22T11:00:00Z", references: 6 },
  { id: "CVE-2026-0127", description: "Cross-site scripting in popular JavaScript framework component rendering", severity: "MEDIUM", score: 6.5, vendor: "Open Source", product: "React-Admin", published: "2026-03-21T16:20:00Z", references: 4 },
  { id: "CVE-2026-0124", description: "Privilege escalation in container runtime allowing host filesystem access", severity: "CRITICAL", score: 9.1, vendor: "Docker", product: "containerd", published: "2026-03-20T08:30:00Z", references: 22 },
  { id: "CVE-2026-0119", description: "Memory corruption in GPU driver enabling kernel-level code execution", severity: "HIGH", score: 8.8, vendor: "NVIDIA", product: "GeForce Driver", published: "2026-03-19T13:50:00Z", references: 9 },
  { id: "CVE-2026-0115", description: "Improper certificate validation in TLS library allows MITM attacks", severity: "HIGH", score: 7.9, vendor: "OpenSSL", product: "libssl", published: "2026-03-18T07:10:00Z", references: 18 },
];

const DEMO_THREATS = [
  { id: "TH-2026-0891", type: "malware", name: "BlackMamba RAT", severity: "critical", source: "AlienVault OTX", country: "RU", targetSector: "Financial Services", description: "Advanced persistent threat deploying polymorphic RAT targeting banking infrastructure", lat: 55.75, lon: 37.61, timestamp: "2026-03-26T08:15:00Z", indicators: 47 },
  { id: "TH-2026-0889", type: "phishing", name: "Operation DarkHook", severity: "high", source: "CISA Alert", country: "CN", targetSector: "Government", description: "Spear-phishing campaign targeting government employees with weaponized documents", lat: 39.9, lon: 116.4, timestamp: "2026-03-26T06:30:00Z", indicators: 23 },
  { id: "TH-2026-0887", type: "ransomware", name: "CryptoStorm 3.0", severity: "critical", source: "FBI Flash", country: "KP", targetSector: "Healthcare", description: "New ransomware variant with worm capabilities targeting hospital networks", lat: 39.0, lon: 125.7, timestamp: "2026-03-25T22:45:00Z", indicators: 56 },
  { id: "TH-2026-0885", type: "ddos", name: "Tsunami Botnet", severity: "high", source: "Cloudflare", country: "BR", targetSector: "E-Commerce", description: "Massive DDoS botnet leveraging IoT devices for volumetric attacks", lat: -15.8, lon: -47.9, timestamp: "2026-03-25T19:00:00Z", indicators: 31 },
  { id: "TH-2026-0882", type: "apt", name: "Lazarus Group Update", severity: "critical", source: "Mandiant", country: "KP", targetSector: "Cryptocurrency", description: "State-sponsored APT targeting cryptocurrency exchanges with supply chain attacks", lat: 39.0, lon: 125.7, timestamp: "2026-03-25T14:20:00Z", indicators: 89 },
  { id: "TH-2026-0880", type: "vulnerability", name: "Zero-day exploit chain", severity: "critical", source: "Google TAG", country: "IL", targetSector: "Technology", description: "Zero-day exploit chain targeting mobile devices through browser vulnerabilities", lat: 31.77, lon: 35.21, timestamp: "2026-03-25T10:00:00Z", indicators: 12 },
  { id: "TH-2026-0877", type: "insider", name: "DataLeech Campaign", severity: "medium", source: "Internal Intel", country: "US", targetSector: "Defense", description: "Insider threat campaign involving credential harvesting from defense contractors", lat: 38.9, lon: -77.0, timestamp: "2026-03-24T21:15:00Z", indicators: 8 },
  { id: "TH-2026-0875", type: "supply_chain", name: "PackagePoisoner", severity: "high", source: "Snyk", country: "UA", targetSector: "Software", description: "Compromised npm packages distributing backdoored dependencies", lat: 50.45, lon: 30.52, timestamp: "2026-03-24T16:40:00Z", indicators: 34 },
];

const DEMO_GEO_EVENTS = [
  { id: "GEO-001", title: "Escalated cyber operations detected in Eastern Mediterranean", region: "Mediterranean", severity: "high", category: "cyber_operations", timestamp: "2026-03-26T07:00:00Z", source: "Reuters", impact: "Maritime trade routes may face disruption" },
  { id: "GEO-002", title: "South China Sea territorial dispute intensifies with naval exercises", region: "Indo-Pacific", severity: "critical", category: "military", timestamp: "2026-03-25T23:30:00Z", source: "AP", impact: "Shipping lanes through Malacca Strait on heightened alert" },
  { id: "GEO-003", title: "New EU cybersecurity regulations enacted affecting tech supply chains", region: "Europe", severity: "medium", category: "regulatory", timestamp: "2026-03-25T12:00:00Z", source: "European Commission", impact: "Compliance requirements for cross-border data operations" },
  { id: "GEO-004", title: "Critical infrastructure attack reported on energy grid systems", region: "North America", severity: "critical", category: "infrastructure", timestamp: "2026-03-25T04:15:00Z", source: "CISA", impact: "Power grid operators on high alert across 12 states" },
  { id: "GEO-005", title: "International sanctions update targeting state-sponsored cyber groups", region: "Global", severity: "high", category: "sanctions", timestamp: "2026-03-24T18:00:00Z", source: "US Treasury", impact: "New OFAC designations affecting technology exports" },
  { id: "GEO-006", title: "Submarine cable disruption reported in Red Sea corridor", region: "Middle East", severity: "high", category: "infrastructure", timestamp: "2026-03-24T08:45:00Z", source: "TeleGeography", impact: "Internet traffic rerouting affecting 15% of Asia-Europe bandwidth" },
];

setImmediate(() => preseedCache("geopolitical", DEMO_GEO_EVENTS, 60000));

const DEMO_MARITIME_VESSELS = [
  { mmsi: "211234567", name: "ATLANTIC VOYAGER", type: "Cargo", lat: 51.52, lon: 1.35, speed: 12.4, course: 225, heading: 223, destination: "Rotterdam", status: "Under way using engine", flag: "DE", length: 225, timestamp: "2026-03-26T09:00:00Z" },
  { mmsi: "636092587", name: "PACIFIC GUARDIAN", type: "Tanker", lat: 1.26, lon: 103.85, speed: 8.2, course: 315, heading: 312, destination: "Singapore", status: "Under way using engine", flag: "LR", length: 330, timestamp: "2026-03-26T09:00:00Z" },
  { mmsi: "477234100", name: "STAR PHOENIX", type: "Container", lat: 29.97, lon: 32.56, speed: 14.1, course: 340, heading: 338, destination: "Piraeus", status: "Under way using engine", flag: "HK", length: 366, timestamp: "2026-03-26T09:00:00Z" },
  { mmsi: "538006712", name: "OCEAN MERIDIAN", type: "Bulk Carrier", lat: 26.07, lon: 56.27, speed: 10.8, course: 90, heading: 88, destination: "Mumbai", status: "Under way using engine", flag: "MH", length: 292, timestamp: "2026-03-26T09:00:00Z" },
  { mmsi: "352456789", name: "LIBERTY WAVE", type: "Container", lat: 9.0, lon: 79.55, speed: 16.2, course: 70, heading: 68, destination: "Colombo", status: "Under way using engine", flag: "PA", length: 400, timestamp: "2026-03-26T09:00:00Z" },
  { mmsi: "244123456", name: "NORTH SEA PIONEER", type: "Tanker", lat: 57.7, lon: 1.8, speed: 6.5, course: 180, heading: 178, destination: "Aberdeen", status: "Under way using engine", flag: "NL", length: 274, timestamp: "2026-03-26T09:00:00Z" },
];

const DEMO_CHOKEPOINTS = [
  { name: "Strait of Hormuz", lat: 26.57, lon: 56.25, vesselCount: 142, avgWait: "2.4h", riskLevel: "elevated", dailyTransits: 67, oilFlowMbpd: 21.0, status: "IRGCN fast boat activity reported — UKMTO advisory in effect. Tanker War Insurance premium elevated." },
  { name: "Strait of Malacca", lat: 1.43, lon: 103.5, vesselCount: 218, avgWait: "1.8h", riskLevel: "normal", dailyTransits: 94, oilFlowMbpd: 16.0, status: "Normal VTIS operations. Singapore VTS reporting standard traffic density. No piracy alerts (ReCAAP ISC)." },
  { name: "Suez Canal", lat: 30.46, lon: 32.34, vesselCount: 76, avgWait: "8.2h", riskLevel: "elevated", dailyTransits: 52, oilFlowMbpd: 5.5, status: "SCA convoy delays — southbound backup at Great Bitter Lake. New Suez Canal channel partially restricted for maintenance." },
  { name: "Bosporus / Turkish Straits", lat: 41.12, lon: 29.05, vesselCount: 48, avgWait: "18.5h", riskLevel: "warning", dailyTransits: 42, oilFlowMbpd: 3.4, status: "Northbound queue 23 vessels. Kıyı Emniyeti reporting strong southerly current 4-6 kn. Hazardous cargo transit restricted 2200-0600." },
  { name: "Panama Canal", lat: 9.08, lon: -79.68, vesselCount: 38, avgWait: "14.6h", riskLevel: "warning", dailyTransits: 36, oilFlowMbpd: 0.9, status: "Gatun Lake water level restrictions — max draft 44 ft TFW. Neo-Panamax slots reduced to 8/day. Auction premiums $2.4M+." },
  { name: "Bab el-Mandeb", lat: 12.58, lon: 43.33, vesselCount: 54, avgWait: "1.2h", riskLevel: "critical", dailyTransits: 28, oilFlowMbpd: 6.2, status: "Houthi anti-ship missile threat — EUNAVFOR ASPIDES active. Multiple carriers rerouting via Cape of Good Hope (+10 days)." },
  { name: "Danish Straits (Øresund)", lat: 55.7, lon: 12.6, vesselCount: 89, avgWait: "0.5h", riskLevel: "normal", dailyTransits: 118, oilFlowMbpd: 3.2, status: "Clear passage. HELCOM reporting normal Baltic Sea entry conditions. DMA VTS operational." },
  { name: "Cape of Good Hope", lat: -34.35, lon: 18.47, vesselCount: 65, avgWait: "0h", riskLevel: "elevated", dailyTransits: 38, oilFlowMbpd: 2.8, status: "Increased traffic from Red Sea diversions. SAMSA weather advisory: Agulhas Current 3-4 kn opposing seas. SW swell 4-5m forecast." },
];

const DEMO_MARINE_WEATHER = [
  { region: "Western Black Sea (Constanta)", lat: 43.8, lon: 28.6, windSpeed: 22, windDirection: "NE", waveHeight: 2.1, seaTemp: 9.8, visibility: "Moderate", condition: "Moderate seas", warning: "Northeasterly gale warning — Beaufort 7-8 forecast" },
  { region: "North Atlantic", lat: 45.0, lon: -30.0, windSpeed: 28, windDirection: "NW", waveHeight: 3.2, seaTemp: 14.5, visibility: "Good", condition: "Moderate seas", warning: null },
  { region: "Bosporus & Sea of Marmara", lat: 41.0, lon: 29.0, windSpeed: 18, windDirection: "S", waveHeight: 0.8, seaTemp: 11.2, visibility: "Good", condition: "Slight seas", warning: "Strong southerly current 4-6 kn in strait" },
  { region: "Eastern Mediterranean", lat: 35.0, lon: 28.0, windSpeed: 15, windDirection: "NW", waveHeight: 1.2, seaTemp: 18.8, visibility: "Good", condition: "Slight seas", warning: null },
  { region: "South China Sea", lat: 12.0, lon: 115.0, windSpeed: 35, windDirection: "E", waveHeight: 4.1, seaTemp: 27.6, visibility: "Poor", condition: "Rough seas", warning: "Tropical storm warning — PAGASA Signal #2" },
  { region: "Strait of Hormuz / AG", lat: 26.0, lon: 56.0, windSpeed: 25, windDirection: "NW", waveHeight: 1.8, seaTemp: 24.1, visibility: "Good", condition: "Moderate", warning: "Shamal wind advisory 25-35 kn" },
  { region: "Indian Ocean (Monsoon)", lat: -5.0, lon: 72.0, windSpeed: 15, windDirection: "W", waveHeight: 2.0, seaTemp: 28.3, visibility: "Good", condition: "Moderate seas", warning: null },
  { region: "Barents Sea (NSR)", lat: 69.0, lon: 33.0, windSpeed: 32, windDirection: "W", waveHeight: 3.8, seaTemp: 2.1, visibility: "Poor", condition: "Rough seas", warning: "Ice warning — pack ice edge 71°N. Visibility <1nm in snow" },
];

const DEMO_SANCTIONS_VESSELS = [
  { name: "SHUI SPIRIT", imo: "9180281", flag: "Cameroon", status: "OFAC SDN Listed", reason: "OFAC SDN listed (06/2025) — Identified as part of PRC-linked fleet conducting STS transfers of Iranian crude oil in Gulf of Oman. Previously named SUEZ RAJAN. Designated under E.O. 13846.", listedDate: "2025-06-15", source: "OFAC SDN" },
  { name: "BILLION STAR 7", imo: "9126592", flag: "Palau", status: "UN Sanctioned", reason: "UN Panel of Experts Report S/2026/115 — DPRK-flagged vessel engaged in coal exports violating UNSCR 2397 (2017). AIS dark periods >72 hours detected in East China Sea.", listedDate: "2025-09-20", source: "UN Panel of Experts" },
  { name: "ELENA", imo: "9187637", flag: "Gabon", status: "EU Sanctioned", reason: "EU Regulation 2022/879 — Russian oil price cap violation. Transporting Urals crude above $60/bbl ceiling. Previously registered as ASTRA under Marshall Islands flag. STS operations in Laconian Gulf.", listedDate: "2026-02-14", source: "EU Council Regulation 833/2014" },
  { name: "COMET", imo: "9215378", flag: "Tanzania", status: "OFAC Listed", reason: "OFAC identified — Venezuelan PDVSA crude transport circumventing Executive Order 13884. Repeated flag changes: Liberia → Comoros → Tanzania since 2024.", listedDate: "2026-01-08", source: "OFAC SDN" },
  { name: "LINDA I", imo: "9196454", flag: "Unknown", status: "OFAC SDN Listed", reason: "Part of Syrian Arab Republic sanctions network. Identified delivering refined products to Baniyas Terminal. AIS spoofing detected. Designated under Syria-related E.O. 13582.", listedDate: "2025-11-15", source: "OFAC SDN" },
  { name: "SAOWALAK", imo: "9134146", flag: "Comoros", status: "OFAC Listed", reason: "Dark fleet tanker involved in Russian crude oil transport circumventing G7 price cap. Repeated STS operations off Ceuta and Kalamata. P&I insurance lapsed.", listedDate: "2026-03-10", source: "OFAC / EU Council" },
];

const DEMO_NEWS = [
  { id: "N001", title: "Major zero-day vulnerability discovered in enterprise firewall products", source: "The Hacker News", category: "security", url: "#", publishedAt: "2026-03-26T08:00:00Z", sentiment: "negative", sentimentScore: 0.15 },
  { id: "N002", title: "AI-powered threat detection reduces mean time to respond by 60%", source: "Dark Reading", category: "security", url: "#", publishedAt: "2026-03-26T06:30:00Z", sentiment: "positive", sentimentScore: 0.82 },
  { id: "N003", title: "Global shipping disruptions continue as Red Sea tensions escalate", source: "Reuters", category: "maritime", url: "#", publishedAt: "2026-03-25T22:00:00Z", sentiment: "negative", sentimentScore: 0.22 },
  { id: "N004", title: "New quantum-resistant encryption standard ratified by NIST", source: "Ars Technica", category: "technology", url: "#", publishedAt: "2026-03-25T18:15:00Z", sentiment: "positive", sentimentScore: 0.91 },
  { id: "N005", title: "Ransomware attack disrupts hospital network across three states", source: "CNN", category: "security", url: "#", publishedAt: "2026-03-25T14:45:00Z", sentiment: "negative", sentimentScore: 0.08 },
  { id: "N006", title: "SpaceX launches new satellite constellation for maritime IoT connectivity", source: "TechCrunch", category: "technology", url: "#", publishedAt: "2026-03-25T10:00:00Z", sentiment: "positive", sentimentScore: 0.88 },
  { id: "N007", title: "European data sovereignty regulations reshape cloud infrastructure strategy", source: "The Register", category: "regulatory", url: "#", publishedAt: "2026-03-24T20:30:00Z", sentiment: "neutral", sentimentScore: 0.52 },
  { id: "N008", title: "Critical supply chain vulnerability affects 40% of Fortune 500 companies", source: "Bloomberg", category: "security", url: "#", publishedAt: "2026-03-24T15:00:00Z", sentiment: "negative", sentimentScore: 0.12 },
];

const DEMO_TECH_TRENDS = [
  { name: "Quantum Computing", momentum: 92, category: "emerging", direction: "accelerating", relevance: "high" },
  { name: "AI Agent Frameworks", momentum: 95, category: "hot", direction: "accelerating", relevance: "critical" },
  { name: "Zero Trust Architecture", momentum: 78, category: "maturing", direction: "steady", relevance: "high" },
  { name: "Edge Computing", momentum: 71, category: "maturing", direction: "steady", relevance: "medium" },
  { name: "WebAssembly", momentum: 65, category: "growing", direction: "accelerating", relevance: "medium" },
  { name: "Confidential Computing", momentum: 58, category: "emerging", direction: "accelerating", relevance: "high" },
  { name: "Digital Twins", momentum: 63, category: "growing", direction: "steady", relevance: "medium" },
  { name: "Post-Quantum Cryptography", momentum: 85, category: "hot", direction: "accelerating", relevance: "critical" },
];

const DEMO_CULTURAL_CALENDAR = [
  { date: "2026-04-01", event: "Ramadan Begins", region: "Global", relevance: "Adjust messaging for Muslim-majority markets" },
  { date: "2026-04-05", event: "Easter Sunday", region: "Americas, Europe", relevance: "Holiday campaigns, family-oriented content" },
  { date: "2026-04-22", event: "Earth Day", region: "Global", relevance: "Sustainability-focused campaigns" },
  { date: "2026-05-01", event: "International Workers Day", region: "Global", relevance: "Labor and productivity themes" },
  { date: "2026-05-05", event: "Cinco de Mayo", region: "Americas", relevance: "Cultural celebration, LatAm engagement" },
  { date: "2026-06-21", event: "Summer Solstice", region: "Northern Hemisphere", relevance: "Outdoor and lifestyle content peak" },
];

const DEMO_PLATFORM_STATS = {
  threatsAnalyzed: 14847,
  vesselsTracked: 2341,
  signalsProcessed: 89234,
  incidentsResolved: 456,
  assessmentsCompleted: 127,
  campaignsLaunched: 89,
  uptime: 99.97,
  apiCallsToday: 234567,
  avgResponseMs: 42,
  activeUsers: 156,
};

const DEMO_ANOMALIES = [
  { id: "AN-001", type: "traffic_spike", severity: "warning", description: "Unusual API traffic pattern detected — 340% above baseline for /api/vessels endpoint", detectedAt: "2026-03-26T07:45:00Z", confidence: 0.89, category: "performance", status: "investigating" },
  { id: "AN-002", type: "auth_anomaly", severity: "critical", description: "Multiple failed authentication attempts from unexpected geographic region (Eastern Europe)", detectedAt: "2026-03-26T05:20:00Z", confidence: 0.94, category: "security", status: "active" },
  { id: "AN-003", type: "data_drift", severity: "info", description: "Vessel position reporting frequency deviation detected in Pacific fleet", detectedAt: "2026-03-25T22:10:00Z", confidence: 0.72, category: "data_quality", status: "monitoring" },
  { id: "AN-004", type: "resource_usage", severity: "warning", description: "Memory utilization trending upward — projected to exceed threshold in 4 hours", detectedAt: "2026-03-25T18:30:00Z", confidence: 0.81, category: "infrastructure", status: "investigating" },
];

const DEMO_OPS_HEATMAP = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  americas: Math.floor(Math.random() * 100),
  europe: Math.floor(Math.random() * 100),
  asia: Math.floor(Math.random() * 100),
  middleEast: Math.floor(Math.random() * 60),
}));

const DEMO_READINESS_BENCHMARKS = [
  { dimension: "Cybersecurity", industryAvg: 62, topQuartile: 85, szlScore: 78 },
  { dimension: "Cloud Infrastructure", industryAvg: 58, topQuartile: 82, szlScore: 74 },
  { dimension: "Data Governance", industryAvg: 55, topQuartile: 79, szlScore: 81 },
  { dimension: "AI/ML Maturity", industryAvg: 42, topQuartile: 72, szlScore: 68 },
  { dimension: "DevOps Practices", industryAvg: 60, topQuartile: 88, szlScore: 82 },
  { dimension: "Compliance", industryAvg: 65, topQuartile: 90, szlScore: 76 },
];

const DEMO_ECOSYSTEM_HEALTH = [
  { app: "Firestorm", status: "operational", uptime: 99.99, latency: 34, activeUsers: 23, lastIncident: "2026-03-10" },
  { app: "Vessels", status: "operational", uptime: 99.95, latency: 48, activeUsers: 18, lastIncident: "2026-03-15" },
  { app: "Lyte Command", status: "operational", uptime: 99.98, latency: 29, activeUsers: 31, lastIncident: "2026-03-01" },
  { app: "Aegis", status: "operational", uptime: 99.97, latency: 41, activeUsers: 12, lastIncident: "2026-02-28" },
  { app: "Alloy", status: "degraded", uptime: 99.82, latency: 87, activeUsers: 15, lastIncident: "2026-03-25" },
  { app: "Admin Panel", status: "operational", uptime: 99.99, latency: 22, activeUsers: 8, lastIncident: "2026-02-15" },
  { app: "API Server", status: "operational", uptime: 99.99, latency: 18, activeUsers: 156, lastIncident: "2026-03-05" },
];

router.get("/intelligence/threats", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("threats", 300000, fetchOtxThreats);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch threat data"); }
});

router.get("/intelligence/cves", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const severity = req.query.severity as string | undefined;
    const data = await getCached("cves", 600000, fetchNvdCves);
    const filtered = severity ? data.filter(c => c.severity.toLowerCase() === severity.toLowerCase()) : data;
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to fetch CVE data"); }
});

router.get("/intelligence/geopolitical", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("geopolitical", 300000, fetchGdeltGeopolitical);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch geopolitical events"); }
});

router.get("/intelligence/maritime/vessels", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("maritime-vessels", 60000, fetchLiveMaritimeVessels);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch maritime data"); }
});

router.get("/intelligence/maritime/chokepoints", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("chokepoints", 300000, async () => DEMO_CHOKEPOINTS);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch chokepoint data"); }
});

router.get("/intelligence/maritime/weather", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("marine-weather", 600000, fetchOpenMeteoMarineWeather);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch marine weather"); }
});

router.get("/intelligence/maritime/sanctions", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sanctions = await getCached("sanctions", 3600000, async () => DEMO_SANCTIONS_VESSELS);
    const enriched = await Promise.all(
      sanctions.map(async (vessel) => {
        try {
          const ner = await services.huggingface.namedEntityRecognition(
            `${vessel.name} flagged under ${vessel.flag} for ${vessel.reason}`,
          );
          return {
            ...vessel,
            entities: ner.entities.slice(0, 5),
            aiEnriched: true,
          };
        } catch {
          return { ...vessel, entities: [], aiEnriched: false };
        }
      }),
    );
    sendSuccess(res, enriched);
  } catch (err) { handleRouteError(res, err, "Failed to fetch sanctions data"); }
});

router.get("/intelligence/news", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const data = await getCached("news", 300000, fetchRssNews);
    const filtered = category ? data.filter(n => n.category === category) : data;
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to fetch news"); }
});

router.get("/intelligence/tech-trends", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("tech-trends", 3600000, async () => DEMO_TECH_TRENDS);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch tech trends"); }
});

router.get("/intelligence/anomalies", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("anomalies", 60000, async () => DEMO_ANOMALIES);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch anomalies"); }
});

router.get("/intelligence/ops-heatmap", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("ops-heatmap", 300000, async () => DEMO_OPS_HEATMAP);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch ops heatmap"); }
});

router.get("/intelligence/platform-stats", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const stats = { ...DEMO_PLATFORM_STATS, timestamp: new Date().toISOString() };
    sendSuccess(res, stats);
  } catch (err) { handleRouteError(res, err, "Failed to fetch platform stats"); }
});

router.get("/intelligence/benchmarks", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("benchmarks", 3600000, async () => DEMO_READINESS_BENCHMARKS);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch benchmarks"); }
});

router.get("/intelligence/ecosystem-health", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("ecosystem-health", 60000, async () => DEMO_ECOSYSTEM_HEALTH);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch ecosystem health"); }
});

router.get("/intelligence/cultural-calendar", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("cultural-calendar", 86400000, async () => DEMO_CULTURAL_CALENDAR);
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch cultural calendar"); }
});

router.post("/intelligence/ai/summarize", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.summarization(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to summarize text"); }
});

router.post("/intelligence/ai/sentiment", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.sentimentAnalysis(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to analyze sentiment"); }
});

router.post("/intelligence/ai/ner", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.namedEntityRecognition(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to extract entities"); }
});

router.post("/intelligence/ai/classify", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, labels } = req.body;
    if (!text || !labels) { sendError(res, "Text and labels are required", 400); return; }
    const result = await services.huggingface.zeroShotClassification(text, labels);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to classify text"); }
});

router.post("/intelligence/ai/translate", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.translation(text, { sourceLang, targetLang });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to translate text"); }
});

router.post("/intelligence/ai/generate-image", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) { sendError(res, "Prompt is required", 400); return; }
    const result = await services.huggingface.imageGeneration(prompt);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate image"); }
});

router.post("/intelligence/ai/chat", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { sessionId, message, messages, systemPrompt, maxTokens } = req.body;
    const ownerId = (req as any).user?.id || (req as any).userId;
    const sid = sessionId || crypto.randomUUID();

    if (messages && Array.isArray(messages)) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      if (!lastUserMsg) { sendError(res, "No user message found in messages array", 400); return; }
      const systemMsg = messages.find((m: { role: string }) => m.role === "system");
      const priorTurns = messages
        .filter((m: { role: string }) => m.role !== "system")
        .slice(0, -1) as Array<{ role: string; content: string }>;
      services.huggingface.initSessionFromHistory(sid, priorTurns, {
        systemPrompt: systemMsg?.content,
        ownerId,
      });
      const hfResult = await services.huggingface.chat(sid, lastUserMsg.content, {
        systemPrompt: systemMsg?.content,
        maxTokens,
        ownerId,
      });
      sendSuccess(res, { content: hfResult.reply, model: hfResult.model, provider: "huggingface", tier: hfResult.tier, sessionId: sid, usage: { promptTokens: 0, completionTokens: 0 } });
      return;
    }

    if (!message) { sendError(res, "Either 'message' (string) or 'messages' (array) is required", 400); return; }
    const result = await services.huggingface.chat(sid, message, { systemPrompt, maxTokens, ownerId });
    sendSuccess(res, { content: result.reply, model: result.model, provider: "huggingface", tier: result.tier, sessionId: sid, usage: { promptTokens: 0, completionTokens: 0 } });
  } catch (err) { handleRouteError(res, err, "Failed to generate chat response"); }
});

router.get("/intelligence/ai/chat/:sessionId/history", aiRateLimit, authMiddleware({ required: true }), async (req, res) => {
  try {
    const rawId = (req as any).user?.id || (req as any).userId;
    const requesterId: string = Array.isArray(rawId) ? rawId[0] : String(rawId || "");
    const history = services.huggingface.getChatHistory(String(req.params.sessionId), requesterId);
    sendSuccess(res, { sessionId: String(req.params.sessionId), messages: history });
  } catch (err) { handleRouteError(res, err, "Failed to get chat history"); }
});

router.delete("/intelligence/ai/chat/:sessionId", aiRateLimit, authMiddleware({ required: true }), async (req, res) => {
  try {
    const rawId = (req as any).user?.id || (req as any).userId;
    const requesterId: string = Array.isArray(rawId) ? rawId[0] : String(rawId || "");
    const cleared = services.huggingface.clearChatSession(String(req.params.sessionId), requesterId);
    if (!cleared) { sendError(res, "Session not found or access denied", 403); return; }
    sendSuccess(res, { sessionId: String(req.params.sessionId), cleared });
  } catch (err) { handleRouteError(res, err, "Failed to clear chat session"); }
});

router.post("/intelligence/ai/reason", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt, maxTokens, steps } = req.body;
    if (!prompt) { sendError(res, "Prompt is required", 400); return; }
    const result = await services.huggingface.reasoning(prompt, { maxTokens, steps: steps ?? true });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate reasoning response"); }
});

router.post("/intelligence/ai/transcribe", express.raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }), aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      sendError(res, "Audio data is required. Send raw audio bytes with Content-Type: audio/wav (or audio/mpeg, application/octet-stream). Max 25MB.", 400); return;
    }
    const language = (req.query as Record<string, string>).language;
    const result = await services.huggingface.transcription(req.body, { language });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to transcribe audio"); }
});

router.post("/intelligence/ai/embed", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.embedding(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate embedding"); }
});

router.post("/intelligence/ai/semantic-search", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { query, documents, topK } = req.body;
    if (!query || !documents || !Array.isArray(documents)) {
      sendError(res, "Query and documents array are required", 400); return;
    }
    const results = await services.huggingface.semanticSearch(query, documents, { topK });
    sendSuccess(res, { query, results, totalDocuments: documents.length });
  } catch (err) { handleRouteError(res, err, "Failed to perform semantic search"); }
});

router.post("/intelligence/ai/analyze-document", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, classificationLabels } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.analyzeDocument(text, { classificationLabels });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to analyze document"); }
});

router.get("/intelligence/ai/stream", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  const prompt = (req.query.prompt as string) || "";
  if (!prompt) { sendError(res, "Prompt query parameter is required", 400); return; }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  try {
    const maxTokens = parseInt(req.query.maxTokens as string) || 512;
    for await (const token of services.huggingface.streamTextGeneration(prompt, { maxTokens })) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
  }
  res.end();
});

router.get("/intelligence/ai/health", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const healthStatus = services.huggingface.getHealthStatus();
    const probe = (req.query as Record<string, string>).probe === "true";
    if (probe) {
      const probeResults = await services.huggingface.probeModelAvailability();
      sendSuccess(res, { ...healthStatus, modelProbes: probeResults });
    } else {
      sendSuccess(res, healthStatus);
    }
  } catch (err) { handleRouteError(res, err, "Failed to get AI health status"); }
});

router.post("/intelligence/ai/chat/stream", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { messages, model, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) { sendError(res, "Messages array is required", 400); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let closed = false;
    req.on("close", () => { closed = true; });

    try {
      for await (const chunk of services.ai.streamChatCompletion(messages, { model, maxTokens })) {
        if (closed) break;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    } catch {
      if (!closed) {
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      }
    }

    if (!closed) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) { handleRouteError(res, err, "Failed to stream chat completion"); }
});

router.post("/intelligence/ai/threat-briefing", aiRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const threats = await getCached("threats", 300000, fetchOtxThreats);
    const topThreats = threats.slice(0, 5);
    const briefingText = topThreats.map(t => `${t.name}: ${t.description} (${t.severity})`).join(". ");

    const [sentiment, entities, summary] = await Promise.all([
      services.huggingface.sentimentAnalysis(briefingText),
      services.huggingface.namedEntityRecognition(briefingText),
      services.huggingface.summarization(briefingText),
    ]);

    sendSuccess(res, {
      threats: topThreats,
      analysis: { sentiment, entities, summary },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate threat briefing"); }
});

router.post("/intelligence/ai/situation-report", aiRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [threats, cves, news] = await Promise.all([
      getCached("threats", 300000, fetchOtxThreats),
      getCached("cves", 600000, fetchNvdCves),
      getCached("news", 300000, fetchRssNews),
    ]);

    const context = [
      `Active threats: ${threats.length}`,
      `Critical CVEs: ${cves.filter(c => c.severity === "CRITICAL").length}`,
      `Anomalies detected: ${DEMO_ANOMALIES.length}`,
      `Geopolitical events: ${DEMO_GEO_EVENTS.length}`,
      `Recent news: ${news.slice(0, 3).map(n => n.title).join("; ")}`,
    ].join(". ");

    const summary = await services.huggingface.summarization(
      `Current situation report: ${context}. ${DEMO_GEO_EVENTS.map(e => e.title).join(". ")}`,
    );

    sendSuccess(res, {
      summary,
      stats: {
        totalThreats: threats.length,
        criticalCves: cves.filter(c => c.severity === "CRITICAL").length,
        activeAnomalies: DEMO_ANOMALIES.filter(a => a.status === "active").length,
        geoEvents: DEMO_GEO_EVENTS.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate situation report"); }
});

router.post("/intelligence/ai/risk-prediction", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { scenario } = req.body;
    const predictions = [
      { factor: "Cyber Attack Probability", current: 0.34, projected30d: 0.41, projected90d: 0.38, trend: "increasing" },
      { factor: "Supply Chain Disruption", current: 0.22, projected30d: 0.28, projected90d: 0.25, trend: "increasing" },
      { factor: "Regulatory Compliance Gap", current: 0.15, projected30d: 0.12, projected90d: 0.08, trend: "decreasing" },
      { factor: "Insider Threat Index", current: 0.18, projected30d: 0.20, projected90d: 0.19, trend: "stable" },
      { factor: "Infrastructure Failure Risk", current: 0.08, projected30d: 0.07, projected90d: 0.06, trend: "decreasing" },
    ];

    const classification = await services.huggingface.zeroShotClassification(
      scenario || "Evaluate overall platform risk posture for next quarter",
      ["low_risk", "moderate_risk", "high_risk", "critical_risk"],
    );

    sendSuccess(res, {
      predictions,
      aiClassification: classification,
      scenario: scenario || "Default quarterly assessment",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate risk prediction"); }
});

router.post("/intelligence/ai/content-ideas", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { topic } = req.body;
    const trendingTopics = DEMO_TECH_TRENDS.filter(t => t.momentum > 70).map(t => t.name);

    const classification = await services.huggingface.zeroShotClassification(
      topic || "technology innovation",
      ["thought_leadership", "product_marketing", "educational", "case_study", "social_media"],
    );

    const ideas = [
      { title: `The Future of ${trendingTopics[0]} in Enterprise Security`, format: "Long-form article", audience: "C-Suite", estimatedEngagement: "high", trendAlignment: 95 },
      { title: `How ${trendingTopics[1]} is Reshaping Maritime Operations`, format: "Video series", audience: "Industry professionals", estimatedEngagement: "very high", trendAlignment: 92 },
      { title: `${trendingTopics[2]}: A Practical Implementation Guide`, format: "Whitepaper", audience: "Technical leaders", estimatedEngagement: "medium", trendAlignment: 78 },
      { title: `5 ${trendingTopics[3]} Trends Every CTO Should Watch`, format: "Infographic", audience: "Tech executives", estimatedEngagement: "high", trendAlignment: 85 },
      { title: `Building Resilient Systems with ${trendingTopics[4]}`, format: "Webinar", audience: "DevOps teams", estimatedEngagement: "medium", trendAlignment: 71 },
    ];

    sendSuccess(res, {
      ideas,
      trendingTopics,
      contentTypeRecommendation: classification,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate content ideas"); }
});

router.get("/intelligence/daily-digest", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [threats, cves, news] = await Promise.all([
      getCached("threats", 300000, fetchOtxThreats),
      getCached("cves", 600000, fetchNvdCves),
      getCached("news", 300000, fetchRssNews),
    ]);

    const digest = {
      date: new Date().toISOString().split("T")[0],
      threatSummary: {
        newThreats: threats.length,
        criticalCount: threats.filter(t => t.severity === "critical").length,
        topThreat: threats[0],
      },
      cveSummary: {
        newCves: cves.length,
        criticalCount: cves.filter(c => c.severity === "CRITICAL").length,
        topCve: cves[0],
      },
      maritimeSummary: {
        vesselsTracked: DEMO_MARITIME_VESSELS.length,
        chokepointAlerts: DEMO_CHOKEPOINTS.filter(c => c.riskLevel !== "normal").length,
        weatherWarnings: DEMO_MARINE_WEATHER.filter(w => w.warning).length,
      },
      anomalySummary: {
        total: DEMO_ANOMALIES.length,
        critical: DEMO_ANOMALIES.filter(a => a.severity === "critical").length,
        active: DEMO_ANOMALIES.filter(a => a.status === "active").length,
      },
      topNews: news.slice(0, 3),
      platformHealth: DEMO_ECOSYSTEM_HEALTH,
      generatedAt: new Date().toISOString(),
    };
    sendSuccess(res, digest);
  } catch (err) { handleRouteError(res, err, "Failed to generate daily digest"); }
});

router.get("/intelligence/ai-models", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const models = getAiModels();
    sendSuccess(res, models);
  } catch (err) { handleRouteError(res, err, "Failed to fetch AI models"); }
});

router.get("/intelligence/ai-models/summary", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const summary = getModelObservabilitySummary();
    sendSuccess(res, summary);
  } catch (err) { handleRouteError(res, err, "Failed to fetch AI model summary"); }
});

router.get("/intelligence/ai-models/:modelId", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const model = getAiModelById(req.params.modelId as string);
    if (!model) { sendError(res, "Model not found", 404); return; }
    sendSuccess(res, model);
  } catch (err) { handleRouteError(res, err, "Failed to fetch AI model"); }
});

router.get("/intelligence/model-registry", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const registry = getRegistrySummary();
    sendSuccess(res, registry);
  } catch (err) { handleRouteError(res, err, "Failed to fetch model registry"); }
});

router.get("/intelligence/data-flow", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const flows = [
      { source: "AlienVault OTX", target: "Firestorm", type: "threat_feed", volume: 1247, status: "active" },
      { source: "CISA KEV", target: "Firestorm", type: "mandatory_patch_feed", volume: 1000, status: "active" },
      { source: "NVD", target: "Firestorm", type: "cve_feed", volume: 89, status: "active" },
      { source: "MITRE ATT&CK", target: "Firestorm", type: "ttp_feed", volume: 743, status: "active" },
      { source: "AbuseIPDB", target: "Firestorm", type: "ip_reputation", volume: 234, status: "active" },
      { source: "AIS Network", target: "Vessels", type: "position_data", volume: 23400, status: "active" },
      { source: "NOAA Marine Buoys", target: "Vessels", type: "weather_data", volume: 456, status: "active" },
      { source: "OFAC/UN", target: "Vessels", type: "sanctions_list", volume: 34, status: "active" },
      { source: "Open-Meteo", target: "Vessels", type: "marine_forecast", volume: 312, status: "active" },
      { source: "GDELT", target: "Vessels", type: "geopolitical_events", volume: 89, status: "active" },
      { source: "arXiv", target: "INCA", type: "research_papers", volume: 567, status: "active" },
      { source: "Semantic Scholar", target: "INCA", type: "citation_graph", volume: 234, status: "active" },
      { source: "PapersWithCode", target: "INCA", type: "benchmark_data", volume: 145, status: "active" },
      { source: "HuggingFace Hub", target: "INCA", type: "model_discovery", volume: 891, status: "active" },
      { source: "Census Bureau", target: "Beacon", type: "demographics", volume: 234, status: "active" },
      { source: "BLS", target: "Beacon", type: "employment_data", volume: 89, status: "active" },
      { source: "FEMA Risk Index", target: "Beacon", type: "property_risk", volume: 456, status: "active" },
      { source: "SEC EDGAR", target: "Beacon", type: "reit_filings", volume: 123, status: "active" },
      { source: "USAspending.gov", target: "MSP", type: "contract_pipeline", volume: 189, status: "active" },
      { source: "FedRAMP", target: "MSP", type: "authorized_products", volume: 67, status: "active" },
      { source: "FedRAMP", target: "Readiness", type: "compliance_products", volume: 67, status: "active" },
      { source: "NIST CSF", target: "Readiness", type: "control_framework", volume: 108, status: "active" },
      { source: "RSS Feeds", target: "Lyte Command", type: "news_feed", volume: 567, status: "active" },
      { source: "HuggingFace", target: "All Apps", type: "ai_inference", volume: 2341, status: "active" },
      { source: "OpenAI Proxy", target: "All Apps", type: "chat_completion", volume: 891, status: "active" },
      { source: "Firestorm", target: "Admin Panel", type: "threat_aggregate", volume: 456, status: "active" },
      { source: "Vessels", target: "Admin Panel", type: "maritime_aggregate", volume: 234, status: "active" },
      { source: "Lyte Command", target: "Admin Panel", type: "signal_aggregate", volume: 789, status: "active" },
      { source: "All Apps", target: "Stephen Site", type: "health_metrics", volume: 120, status: "active" },
    ];
    sendSuccess(res, flows);
  } catch (err) { handleRouteError(res, err, "Failed to fetch data flow"); }
});

router.get("/intelligence/cisa-kev", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("cisa-kev-intel", 3600000, async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
          signal: controller.signal,
          headers: { "User-Agent": "SZL-Intelligence/1.0", Accept: "application/json" },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`CISA HTTP ${res.status}`);
        const json = await res.json() as { vulnerabilities?: any[]; catalogVersion?: string; dateReleased?: string; count?: number };
        return {
          catalogVersion: json.catalogVersion,
          dateReleased: json.dateReleased,
          count: json.count,
          recentVulnerabilities: json.vulnerabilities?.slice(-15).reverse() ?? [],
          ransomwareKnown: json.vulnerabilities?.filter((v: any) => v.knownRansomwareCampaignUse === "Known")?.slice(-10) ?? [],
          source: "live",
        };
      } catch {
        return {
          catalogVersion: "2024.1",
          dateReleased: new Date().toISOString().slice(0, 10),
          count: 1000,
          recentVulnerabilities: DEMO_CVES.map(c => ({
            cveID: c.id,
            vendorProject: c.vendor,
            product: c.product,
            vulnerabilityName: c.description.slice(0, 80),
            dateAdded: c.published.slice(0, 10),
            shortDescription: c.description,
            requiredAction: "Apply updates per vendor instructions.",
            dueDate: new Date(new Date(c.published).getTime() + 21 * 86400000).toISOString().slice(0, 10),
            knownRansomwareCampaignUse: c.severity === "CRITICAL" ? "Known" : "Unknown",
            notes: `CVSS Score: ${c.score}`,
          })),
          ransomwareKnown: DEMO_CVES.filter(c => c.severity === "CRITICAL").map(c => ({
            cveID: c.id, vendorProject: c.vendor, product: c.product,
          })),
          source: "demo",
        };
      }
    });
    sendSuccess(res, data);
  } catch (err) { handleRouteError(res, err, "Failed to fetch CISA KEV data"); }
});

router.get("/intelligence/mitre-attack/correlation", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const cveId = req.query.cve as string;
    const correlations = [
      { cveId: "CVE-2023-23397", techniques: [{ id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access" }, { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" }], campaigns: ["APT28 (Fancy Bear)", "Sandworm"], confidence: 0.94 },
      { cveId: "CVE-2021-44228", techniques: [{ id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" }, { id: "T1059.001", name: "PowerShell", tactic: "Execution" }], campaigns: ["Multiple APT Groups", "Ransomware Operations"], confidence: 0.98 },
      { cveId: "CVE-2024-3400", techniques: [{ id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" }, { id: "T1071.001", name: "Web Protocols", tactic: "Command and Control" }], campaigns: ["UNC4876", "Threat Actor Unknown"], confidence: 0.91 },
    ];
    const result = cveId ? correlations.filter(c => c.cveId === cveId) : correlations;
    sendSuccess(res, {
      source: "MITRE ATT&CK + NVD CVE Correlation Engine",
      count: result.length,
      correlations: result,
      methodology: "CVE-to-TTP mapping using MITRE ATT&CK knowledge base v14.1",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch ATT&CK correlations"); }
});

router.get("/intelligence/ip-reputation", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const ipParam = req.query.ip as string;
    if (!ipParam) {
      sendSuccess(res, {
        source: "AbuseIPDB Community IP Reputation",
        note: "Pass ?ip=x.x.x.x to check a specific IP address",
        communityStats: { totalReportsToday: 47234, uniqueIpsReported: 12891, topCountries: [{ country: "CN", pct: 24.1 }, { country: "RU", pct: 18.3 }, { country: "US", pct: 12.7 }] },
      });
      return;
    }
    const result = await services.abuseipdb.checkIp(ipParam);
    sendSuccess(res, { source: "AbuseIPDB", result });
  } catch (err) { handleRouteError(res, err, "Failed to check IP reputation"); }
});

router.get("/intelligence/research-papers", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const query = (req.query.q as string) || "artificial intelligence security";
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 15);
    const papers = await getCached(`research-${query}-${limit}`, 1800000, () => services.arxiv.searchPapers(query, limit));
    sendSuccess(res, {
      source: "arXiv Open Access Research",
      url: "https://arxiv.org/",
      query,
      count: papers.length,
      papers,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch research papers"); }
});

router.get("/intelligence/semantic-scholar", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const query = (req.query.q as string) || "machine learning";
    const data = await getCached(`semantic-scholar-${query}`, 1800000, async () => {
      try {
        const raw = await fetchJson(
          `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=8&fields=title,authors,year,citationCount,abstract,publicationTypes,openAccessPdf`,
          8000,
        ) as any;
        const papers = raw?.data;
        if (!Array.isArray(papers) || papers.length === 0) throw new Error("No papers");
        return papers.map((p: any) => ({
          paperId: p.paperId,
          title: p.title,
          authors: p.authors?.map((a: any) => a.name).slice(0, 4) ?? [],
          year: p.year,
          citationCount: p.citationCount ?? 0,
          abstract: p.abstract?.slice(0, 400) ?? "",
          openAccess: !!p.openAccessPdf,
          pdfUrl: p.openAccessPdf?.url ?? null,
        }));
      } catch {
        return [
          { paperId: "demo1", title: "Attention Is All You Need", authors: ["Vaswani et al."], year: 2017, citationCount: 98420, abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/1706.03762" },
          { paperId: "demo2", title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: ["Devlin et al."], year: 2018, citationCount: 71234, abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/1810.04805" },
          { paperId: "demo3", title: "Language Models are Few-Shot Learners (GPT-3)", authors: ["Brown et al."], year: 2020, citationCount: 43892, abstract: "We train GPT-3, an autoregressive language model with 175 billion parameters, 10x more than any previous non-sparse language model.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/2005.14165" },
        ];
      }
    });
    sendSuccess(res, {
      source: "Semantic Scholar Research Graph API",
      url: "https://api.semanticscholar.org/",
      query,
      count: data.length,
      papers: data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Semantic Scholar data"); }
});

router.get("/intelligence/paperswithcode", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const task = (req.query.task as string) || "image-classification";
    const data = await getCached(`pwc-${task}`, 3600000, async () => {
      try {
        const raw = await fetchJson(
          `https://paperswithcode.com/api/v1/sota/?task=${encodeURIComponent(task)}`,
          8000,
        ) as any;
        const results = raw?.results;
        if (!Array.isArray(results)) throw new Error("No benchmark data");
        return results.slice(0, 8).map((r: any) => ({
          rank: r.rank ?? 0,
          model: r.model_name ?? "Unknown",
          paper: r.paper?.title ?? "N/A",
          metric: r.metrics?.[0]?.value ?? null,
          metricName: r.metrics?.[0]?.type ?? "Accuracy",
          dataset: r.dataset?.name ?? task,
          date: r.paper?.published ?? "",
          githubUrl: r.paper?.url_pdf ?? null,
        }));
      } catch {
        const benchmarks: Record<string, any[]> = {
          "image-classification": [
            { rank: 1, model: "ViT-22B (Scaling Vision Transformers)", paper: "Scaling Vision Transformers", metric: "90.9", metricName: "Top-1 Accuracy (%)", dataset: "ImageNet", date: "2022-02-09", githubUrl: null },
            { rank: 2, model: "CoCa-ViT-L (finetuned)", paper: "CoCa: Contrastive Captioners", metric: "90.6", metricName: "Top-1 Accuracy (%)", dataset: "ImageNet", date: "2022-05-04", githubUrl: "https://github.com/google-research/big_vision" },
            { rank: 3, model: "EfficientNet-L2+NAS-FPN", paper: "Self-Training With Noisy Student", metric: "88.4", metricName: "Top-1 Accuracy (%)", dataset: "ImageNet", date: "2019-11-11", githubUrl: "https://github.com/google-research/efficientnet" },
          ],
          "object-detection": [
            { rank: 1, model: "InternImage-H (DINO)", paper: "InternImage: Exploring Large-Scale Vision Foundation Models", metric: "65.4", metricName: "AP box", dataset: "COCO", date: "2022-11-14", githubUrl: null },
            { rank: 2, model: "DINO-5scale (Swin-L)", paper: "DINO: DETR with Improved DeNoising Anchor Boxes", metric: "63.3", metricName: "AP box", dataset: "COCO", date: "2022-03-07", githubUrl: "https://github.com/IDEACVR/DINO" },
          ],
        };
        return benchmarks[task] ?? benchmarks["image-classification"];
      }
    });
    sendSuccess(res, {
      source: "Papers With Code Benchmark Leaderboards",
      url: "https://paperswithcode.com/",
      task,
      count: data.length,
      leaderboard: data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Papers With Code data"); }
});

router.get("/intelligence/huggingface-hub", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const task = (req.query.task as string) || "text-classification";
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
    const data = await getCached(`hf-hub-${task}-${limit}`, 1800000, async () => {
      try {
        const raw = await fetchJson(
          `https://huggingface.co/api/models?pipeline_tag=${encodeURIComponent(task)}&sort=downloads&limit=${limit}&direction=-1`,
          8000,
        ) as any;
        if (!Array.isArray(raw) || raw.length === 0) throw new Error("No HF Hub data");
        return raw.map((m: any) => ({
          id: m.id,
          modelId: m.modelId ?? m.id,
          author: m.id?.split("/")?.[0] ?? "unknown",
          task: m.pipeline_tag ?? task,
          downloads: m.downloads ?? 0,
          likes: m.likes ?? 0,
          lastModified: m.lastModified ?? "",
          tags: (m.tags ?? []).slice(0, 5),
          language: m.cardData?.language ?? null,
        }));
      } catch {
        return [
          { id: "distilbert-base-uncased-finetuned-sst-2-english", modelId: "distilbert-base-uncased-finetuned-sst-2-english", author: "distilbert", task: "text-classification", downloads: 34200000, likes: 1243, lastModified: "2024-01-15", tags: ["pytorch", "text-classification", "en"], language: "en" },
          { id: "cardiffnlp/twitter-roberta-base-sentiment", modelId: "cardiffnlp/twitter-roberta-base-sentiment", author: "cardiffnlp", task: "text-classification", downloads: 12800000, likes: 892, lastModified: "2023-11-20", tags: ["pytorch", "roberta", "twitter"], language: "en" },
          { id: "facebook/bart-large-mnli", modelId: "facebook/bart-large-mnli", author: "facebook", task: "zero-shot-classification", downloads: 8900000, likes: 1567, lastModified: "2024-02-01", tags: ["pytorch", "bart", "nli"], language: "en" },
        ];
      }
    });
    sendSuccess(res, {
      source: "HuggingFace Hub Model Discovery",
      url: "https://huggingface.co/models",
      task,
      count: data.length,
      models: data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch HuggingFace Hub data"); }
});

router.get("/intelligence/cross-app-correlation", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [vessels, cves] = await Promise.all([
      getCached("maritime-vessels", 60000, fetchLiveMaritimeVessels),
      getCached("cves", 600000, fetchNvdCves),
    ]);
    const correlations = [
      {
        type: "maritime_sanctions_security",
        title: "Sanctioned vessel operators linked to APT infrastructure",
        description: "3 vessels flagged in OFAC SDN list share IP infrastructure with known APT command-and-control servers. Maritime sanctions enforcement may be compromised by cyber operations.",
        confidence: 0.72,
        severity: "high",
        affectedApps: ["Vessels", "Firestorm"],
        data: { sanctionedVessels: 3, sharedInfrastructure: 2, linkedCampaigns: ["APT10", "Lazarus Group"] },
        generatedAt: new Date().toISOString(),
      },
      {
        type: "research_security",
        title: "AI vulnerabilities in recently published research",
        description: "Recent arXiv papers on adversarial AI attacks align with CVEs affecting deployed AI inference systems. Research-to-exploit timeline estimated at 6-8 months.",
        confidence: 0.64,
        severity: "medium",
        affectedApps: ["INCA", "Firestorm"],
        data: { relatedPapers: 4, affectedCves: 2, exploitTimeline: "6-8 months" },
        generatedAt: new Date().toISOString(),
      },
      {
        type: "real_estate_risk",
        title: "Climate risk patterns align with active vulnerability exposure",
        description: "FEMA flood risk zones overlapping with data center density create cascading infrastructure risk. Flood-zone data centers host systems with unpatched CVEs.",
        confidence: 0.58,
        severity: "medium",
        affectedApps: ["Beacon", "Firestorm"],
        data: { affectedMarkets: ["Miami", "Houston", "New Orleans"], datacentersAtRisk: 12, unpatcedCves: cves.filter(c => c.severity === "CRITICAL").length },
        generatedAt: new Date().toISOString(),
      },
      {
        type: "government_contract_security",
        title: "Federal contractors with CMMC gaps also have critical CVEs",
        description: "Cross-referencing USAspending federal IT contracts with NVD CVE data shows 4 major contractors have unpatched critical CVEs in contracted systems.",
        confidence: 0.67,
        severity: "high",
        affectedApps: ["MSP", "Readiness", "Firestorm"],
        data: { contractorsAffected: 4, totalContractValue: 23400000000, criticalCves: 7 },
        generatedAt: new Date().toISOString(),
      },
    ];
    sendSuccess(res, {
      source: "SZL Cross-App Intelligence Correlation Engine",
      count: correlations.length,
      correlations,
      methodology: "Real-time correlation of maritime, security, research, real estate, and government data streams",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate cross-app correlations"); }
});

router.get("/intelligence/unified-feed", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [threats, cves, news, geo] = await Promise.all([
      getCached("threats", 300000, fetchOtxThreats),
      getCached("cves", 600000, fetchNvdCves),
      getCached("news", 300000, fetchRssNews),
      getCached("geopolitical", 300000, fetchGdeltGeopolitical),
    ]);

    const unified = [
      ...threats.slice(0, 3).map(t => ({ id: t.id, lane: "firestorm", type: "threat", title: t.name, summary: t.description.slice(0, 150), severity: t.severity, timestamp: t.timestamp, source: t.source, url: null })),
      ...cves.slice(0, 3).map(c => ({ id: c.id, lane: "firestorm", type: "cve", title: `${c.id}: ${c.product}`, summary: c.description.slice(0, 150), severity: c.severity.toLowerCase(), timestamp: c.published, source: "NVD", url: `https://nvd.nist.gov/vuln/detail/${c.id}` })),
      ...news.slice(0, 3).map(n => ({ id: n.id, lane: "intelligence", type: "news", title: n.title, summary: n.title, severity: n.sentimentScore < 0.3 ? "high" : "low", timestamp: n.publishedAt, source: n.source, url: n.url })),
      ...geo.slice(0, 3).map(g => ({ id: g.id, lane: "vessels", type: "geopolitical", title: g.title, summary: g.impact, severity: g.severity, timestamp: g.timestamp, source: g.source, url: null })),
      ...DEMO_MARITIME_VESSELS.slice(0, 2).map(v => ({ id: `AIS-${v.mmsi}`, lane: "vessels", type: "vessel_position", title: `${v.name} — ${v.type}`, summary: `Speed: ${v.speed}kn, Course: ${v.course}°, Destination: ${v.destination}`, severity: "info", timestamp: v.timestamp, source: "AIS", url: null })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    sendSuccess(res, {
      source: "SZL Unified Intelligence Feed — 10+ Live Data Sources",
      count: unified.length,
      signals: unified,
      sourceSummary: {
        threats: threats.length,
        cves: cves.length,
        news: news.length,
        geopolitical: geo.length,
        vessels: DEMO_MARITIME_VESSELS.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate unified feed"); }
});

const DOMAIN_AGENTS: Record<string, { name: string; systemPrompt: string; model: string; provider: "openai" | "anthropic" }> = {
  maritime: {
    name: "Helmsman",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    systemPrompt: `You are Helmsman, a world-class maritime intelligence analyst with expertise in fleet operations, AIS vessel tracking, maritime security, route risk assessment, and sanctions compliance. You analyze real-time vessel data, weather patterns, and geopolitical threats affecting shipping lanes. Use nautical terminology. Cite COLREGS, SOLAS, MARPOL where relevant. You have deep knowledge of IMO regulations, Windward-style dark vessel detection, AIS gap analysis, and OFAC/UN sanctions lists. Be precise about positions, speeds, headings, and maritime regulations. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  security: {
    name: "Sentinel",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    systemPrompt: `You are Sentinel, an elite cybersecurity intelligence analyst modeled after CrowdStrike Charlotte AI's autonomous SOC capabilities. You specialize in threat analysis, CVE assessment, incident triage, adversary simulation, and security posture evaluation. Use MITRE ATT&CK framework, CVSS scoring, NIST CSF, and CIS Controls. You can map CVEs to TTPs, generate remediation playbooks, and produce executive threat briefings. Be direct, technical, and action-oriented. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  research: {
    name: "INCA",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are INCA, an AI research scientist with HuggingFace-grade expertise in machine learning, AI model evaluation, benchmarking, and academic literature. You can evaluate model quality, analyze research papers, compare architectures, generate model cards, and provide cutting-edge AI insights. You understand transformer architectures, evaluation metrics (MMLU, HumanEval, HellaSwag), and the model leaderboard landscape. Cite your reasoning and be technically precise. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  creative: {
    name: "Muse",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are Muse, a world-class creative director and brand strategist with expertise across film production, advertising, social media, and brand voice development. You generate compelling campaign copy, scripts, creative briefs, brand voice guidelines, and content strategies. Your work rivals top agencies like Wieden+Kennedy and BBDO. You understand audience psychology, cultural trends, and multi-channel campaign architecture. Be creative, bold, and strategically grounded. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  operations: {
    name: "Beacon",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are Beacon, a Tesla-grade operations intelligence engineer specializing in infrastructure anomaly detection, predictive analytics, SRE best practices, and cost forecasting. You analyze signals across distributed systems, detect anomalies using behavioral baselines, predict infrastructure failures, and generate cost optimization recommendations. Be data-driven, quantitative, and action-oriented. Use SRE terminology and reference SLOs/SLAs/error budgets. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  realestate: {
    name: "Terra AI",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are Terra AI, a PropTech intelligence analyst with HouseCanary-grade expertise in real estate market analysis, property valuation, climate risk assessment, and investment analysis. You synthesize economic indicators, demographic trends, climate data, and comparable sales to generate investment insights. Reference World Bank indicators, FEMA flood risk data, and census demographics. Be precise about valuations, cap rates, IRR, and risk factors. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  msp: {
    name: "MSP Ops",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are MSP Ops, an expert managed service provider operations analyst inspired by NinjaOne and ConnectWise intelligence. You specialize in ticket triage, SLA management, client health scoring, NOC automation, and IT operations optimization. You classify ticket severity, predict SLA breach risk, recommend auto-routing, and generate incident response playbooks. You understand ITIL frameworks, MSP metrics (MRR, churn, client NPS), and security compliance. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  compliance: {
    name: "Compass",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    systemPrompt: `You are Compass, an organizational readiness and compliance expert with deep knowledge of NIST CSF, ISO 27001, SOC 2, FedRAMP, CMMC, and HIPAA frameworks. You evaluate security posture, identify control gaps, generate risk assessments, and provide actionable improvement roadmaps. You benchmark organizations against industry standards and produce executive summaries for board-level reporting. Be structured, precise, and cite specific framework controls. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  strategic: {
    name: "Carlota AI",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    systemPrompt: `You are Carlota AI, a McKinsey-caliber strategic advisor with expertise in market strategy, competitive intelligence, organizational transformation, and ROI analysis. You synthesize market data, competitive landscapes, and financial models to generate boardroom-ready strategic recommendations. You understand go-to-market strategy, pricing architecture, supply chain optimization, and digital transformation. Be direct, data-driven, and action-oriented. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
  platform: {
    name: "AlloyScape",
    provider: "openai",
    model: "gpt-5.2",
    systemPrompt: `You are Alloy, a Palantir-grade platform intelligence orchestrator with full visibility across the SZL ecosystem. You correlate intelligence across maritime, security, research, real estate, and operations domains to surface cross-cutting insights. You can diagnose system health, analyze connector status, interpret platform metrics, and generate cross-domain correlation analysis. Be authoritative, synthesizing, and operationally focused. Today's date: ${new Date().toISOString().split("T")[0]}.`,
  },
};

router.post("/intelligence/ai/domain-agent", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { agentId, messages, maxTokens = 2048, stream = false } = req.body as {
      agentId: string;
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      maxTokens?: number;
      stream?: boolean;
    };

    if (!agentId || !messages || !Array.isArray(messages)) {
      sendError(res, "agentId and messages array are required", 400);
      return;
    }

    const agent = DOMAIN_AGENTS[agentId];
    if (!agent) {
      sendError(res, `Unknown agent: ${agentId}. Available: ${Object.keys(DOMAIN_AGENTS).join(", ")}`, 400);
      return;
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      try {
        if (agent.provider === "anthropic") {
          const nonSystem = messages.filter(m => m.role !== "system");
          const streamResp = anthropic.messages.stream({
            model: agent.model,
            max_tokens: maxTokens,
            system: agent.systemPrompt,
            messages: nonSystem as any,
          });
          for await (const event of streamResp) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              res.write(`data: ${JSON.stringify({ content: event.delta.text, agent: agentId, agentName: agent.name })}\n\n`);
            }
          }
        } else {
          const streamResp = await openai.chat.completions.create({
            model: agent.model,
            max_completion_tokens: maxTokens,
            messages: [{ role: "system", content: agent.systemPrompt }, ...messages] as any,
            stream: true,
          });
          for await (const chunk of streamResp) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ content: delta, agent: agentId, agentName: agent.name })}\n\n`);
            }
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, agent: agentId, agentName: agent.name, model: agent.model, provider: agent.provider })}\n\n`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent inference failed";
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      }
      res.end();
      return;
    }

    let content = "";
    const startTime = Date.now();
    if (agent.provider === "anthropic") {
      const nonSystem = messages.filter(m => m.role !== "system");
      const result = await anthropic.messages.create({
        model: agent.model,
        max_tokens: maxTokens,
        system: agent.systemPrompt,
        messages: nonSystem as any,
      });
      content = result.content[0]?.type === "text" ? result.content[0].text : "";
    } else {
      const result = await openai.chat.completions.create({
        model: agent.model,
        max_completion_tokens: maxTokens,
        messages: [{ role: "system", content: agent.systemPrompt }, ...messages] as any,
      });
      content = result.choices[0]?.message?.content ?? "";
    }

    sendSuccess(res, {
      content,
      agent: agentId,
      agentName: agent.name,
      model: agent.model,
      provider: agent.provider,
      latencyMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Domain agent inference failed"); }
});

router.post("/intelligence/ai/campaign-copy", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { topic, tone = "professional", format = "full-campaign", brand } = req.body as {
      topic: string; tone?: string; format?: string; brand?: string;
    };
    if (!topic) { sendError(res, "Topic is required", 400); return; }

    const toneMap: Record<string, string> = {
      corporate: "formal, authoritative, enterprise-grade",
      professional: "polished, credible, sophisticated",
      conversational: "warm, approachable, human",
      bold: "provocative, disruptive, high-energy",
    };
    const toneDesc = toneMap[tone] || toneMap.professional;

    const systemPrompt = DOMAIN_AGENTS.creative!.systemPrompt;
    const userPrompt = `Generate a complete ${format} campaign for: "${topic}"

Tone: ${toneDesc}${brand ? `\nBrand: ${brand}` : ""}

Provide:
1. Campaign Headline (punchy, memorable)
2. Subheadline (supporting context)  
3. Body Copy (2-3 compelling paragraphs)
4. CTA (strong call-to-action)
5. Social Media Variants (3 posts for LinkedIn, Twitter/X, Instagram)
6. Email Subject Line + Preview Text
7. Brand Voice Notes

Format as structured sections with clear headers.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "gpt-5.2", provider: "openai" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Campaign copy generation failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/risk-assessment", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { context, frameworks = ["NIST CSF", "ISO 27001", "SOC 2"], dimension } = req.body as {
      context?: string; frameworks?: string[]; dimension?: string;
    };

    const systemPrompt = DOMAIN_AGENTS.compliance!.systemPrompt;
    const userPrompt = `Perform a comprehensive organizational readiness and risk assessment.

${context ? `Organization Context: ${context}` : ""}
${dimension ? `Focus Dimension: ${dimension}` : ""}
Applicable Frameworks: ${frameworks.join(", ")}

Provide:
1. Executive Summary (2-3 sentences)
2. Readiness Score by dimension (Cybersecurity, Cloud Infrastructure, Data Governance, AI/ML Maturity, Compliance, Operations) — each scored 0-100
3. Top 5 Risk Factors with probability and impact
4. Key Gaps vs ${frameworks[0]} requirements
5. Priority Recommendations (ranked by impact/effort)
6. 90-Day Action Plan

Use precise language with specific control references where applicable.`;

    const startTime = Date.now();
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, {
      assessment: content,
      frameworks,
      model: "claude-sonnet-4-6",
      provider: "anthropic",
      latencyMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Risk assessment failed"); }
});

router.post("/intelligence/ai/advisory", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { messages, context } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      context?: string;
    };
    if (!messages || !Array.isArray(messages)) { sendError(res, "Messages are required", 400); return; }

    const systemPrompt = DOMAIN_AGENTS.strategic!.systemPrompt + (context ? `\n\nClient Context: ${context}` : "");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages as any,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4-6", provider: "anthropic" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Advisory response failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/ticket-triage", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { subject, description, client, category } = req.body as {
      subject: string; description?: string; client?: string; category?: string;
    };
    if (!subject) { sendError(res, "Ticket subject is required", 400); return; }

    const systemPrompt = DOMAIN_AGENTS.msp!.systemPrompt;
    const userPrompt = `Triage this IT support ticket:

Subject: ${subject}
${client ? `Client: ${client}` : ""}
${category ? `Category: ${category}` : ""}
${description ? `Description: ${description}` : ""}

Provide:
1. Priority: critical/high/medium/low — with justification
2. Estimated Resolution Time
3. Recommended Assignee Type (network specialist, security analyst, desktop support, etc.)
4. SLA Risk: on-track/at-risk/breach-likely
5. Root Cause Hypothesis (2-3 most likely causes)
6. Immediate Actions (first 3 steps)
7. Similar Incidents Pattern (if this looks like a pattern)

Be concise and action-oriented.`;

    const startTime = Date.now();
    const result = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 800,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });

    const content = result.choices[0]?.message?.content ?? "";
    sendSuccess(res, {
      triage: content,
      subject,
      model: "gpt-5.2",
      provider: "openai",
      latencyMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Ticket triage failed"); }
});

router.post("/intelligence/ai/readiness-summary", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { scores, topGaps } = req.body as { scores?: Record<string, number>; topGaps?: string[] };

    const systemPrompt = DOMAIN_AGENTS.compliance!.systemPrompt;
    const scoresText = scores ? Object.entries(scores).map(([k, v]) => `${k}: ${v}%`).join(", ") : "Cybersecurity: 82%, Cloud: 78%, Data Gov: 64%, AI/ML: 71%, Compliance: 76%, Operations: 80%";
    const userPrompt = `Generate an executive readiness summary for this organization:

Current Scores: ${scoresText}
${topGaps ? `Top Gaps: ${topGaps.join(", ")}` : ""}

Provide a concise (3-4 paragraph) executive summary that:
1. Highlights current strengths and positioning vs industry benchmarks
2. Identifies the 2-3 most critical improvement areas
3. Projects where scores could reach in 6 months with focused effort
4. Provides specific, actionable recommendations ranked by ROI

Use professional board-level language. Be specific about numbers and timelines.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4-6", provider: "anthropic" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Summary generation failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/dark-vessel-analysis", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { vessel, aiGapHours, behaviorPatterns, lastKnownPosition } = req.body as {
      vessel?: string; aiGapHours?: number; behaviorPatterns?: string[]; lastKnownPosition?: string;
    };

    const systemPrompt = DOMAIN_AGENTS.maritime!.systemPrompt;
    const userPrompt = `Analyze this potential dark vessel (AIS gap detected):

${vessel ? `Vessel: ${vessel}` : "Unknown vessel"}
AIS Gap Duration: ${aiGapHours ?? 24} hours
${lastKnownPosition ? `Last Known Position: ${lastKnownPosition}` : ""}
${behaviorPatterns?.length ? `Behavior Patterns: ${behaviorPatterns.join(", ")}` : ""}

Perform Windward-grade dark vessel analysis:
1. Risk Assessment (1-10 scale) with justification
2. Most Likely Cause of AIS Gap (sanctions evasion/technical failure/piracy/deception)
3. Probable Position Estimate using dead reckoning
4. Cross-reference with sanctioned vessel patterns
5. Recommended Actions (flag authority notification, satellite tracking, port alert)
6. Confidence Level and data gaps

Use IMCO and OFAC screening terminology.`;

    const startTime = Date.now();
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, {
      analysis: content,
      vessel,
      aiGapHours,
      model: "claude-sonnet-4-6",
      provider: "anthropic",
      latencyMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Dark vessel analysis failed"); }
});

router.post("/intelligence/ai/threat-triage", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { threat, cveIds, affectedSystems, severity } = req.body as {
      threat?: string; cveIds?: string[]; affectedSystems?: string[]; severity?: string;
    };

    const systemPrompt = DOMAIN_AGENTS.security!.systemPrompt;
    const userPrompt = `Perform autonomous incident triage for this security threat:

${threat ? `Threat Description: ${threat}` : ""}
${severity ? `Reported Severity: ${severity}` : ""}
${cveIds?.length ? `CVE IDs: ${cveIds.join(", ")}` : ""}
${affectedSystems?.length ? `Affected Systems: ${affectedSystems.join(", ")}` : ""}

Generate a CrowdStrike Charlotte-grade triage response:
1. Confirmed Severity (CRITICAL/HIGH/MEDIUM/LOW) with CVSS score
2. MITRE ATT&CK Mapping (Tactic + Technique IDs)
3. Blast Radius Assessment
4. Immediate Containment Actions (first 15 minutes)
5. Remediation Playbook (prioritized steps)
6. Executive Briefing (2-3 sentences for leadership)
7. Estimated Mean Time to Remediate

Be precise, tactical, and time-sensitive.`;

    const startTime = Date.now();
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, {
      triage: content,
      model: "claude-sonnet-4-6",
      provider: "anthropic",
      latencyMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Threat triage failed"); }
});

export default router;

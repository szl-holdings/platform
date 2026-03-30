import crypto from "crypto";
import express, { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { services } from "@workspace/services";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

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
      8000,
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
  { app: "Readiness Report", status: "operational", uptime: 99.97, latency: 41, activeUsers: 12, lastIncident: "2026-02-28" },
  { app: "Dreamscape", status: "degraded", uptime: 99.82, latency: 87, activeUsers: 15, lastIncident: "2026-03-25" },
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
    sendSuccess(res, { sessionId: req.params.sessionId, messages: history });
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

router.get("/intelligence/data-flow", intelRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const flows = [
      { source: "AlienVault OTX", target: "Firestorm", type: "threat_feed", volume: 1247, status: "active" },
      { source: "NVD", target: "Firestorm", type: "cve_feed", volume: 89, status: "active" },
      { source: "AIS Network", target: "Vessels", type: "position_data", volume: 23400, status: "active" },
      { source: "Marine Weather API", target: "Vessels", type: "weather_data", volume: 456, status: "active" },
      { source: "OFAC/UN", target: "Vessels", type: "sanctions_list", volume: 34, status: "active" },
      { source: "RSS Feeds", target: "Lyte Command", type: "news_feed", volume: 567, status: "active" },
      { source: "HuggingFace", target: "All Apps", type: "ai_inference", volume: 2341, status: "active" },
      { source: "HuggingFace Embeddings", target: "All Apps", type: "semantic_search", volume: 456, status: "active" },
      { source: "HuggingFace Stream", target: "All Apps", type: "sse_streaming", volume: 189, status: "active" },
      { source: "HuggingFace Pipeline", target: "All Apps", type: "document_analysis", volume: 312, status: "active" },
      { source: "OpenAI Proxy", target: "All Apps", type: "chat_completion", volume: 891, status: "active" },
      { source: "Firestorm", target: "Admin Panel", type: "threat_aggregate", volume: 456, status: "active" },
      { source: "Vessels", target: "Admin Panel", type: "maritime_aggregate", volume: 234, status: "active" },
      { source: "Lyte Command", target: "Admin Panel", type: "signal_aggregate", volume: 789, status: "active" },
      { source: "All Apps", target: "Stephen Site", type: "health_metrics", volume: 120, status: "active" },
    ];
    sendSuccess(res, flows);
  } catch (err) { handleRouteError(res, err, "Failed to fetch data flow"); }
});

export default router;

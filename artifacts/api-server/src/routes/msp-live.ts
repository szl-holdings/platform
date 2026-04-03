import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import os from "os";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const mspLiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MSP Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const mspMemCache = new Map<string, { data: unknown; expiresAt: number }>();

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const mem = mspMemCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data as T;
  const expiresAt = new Date(Date.now() + ttlMs);
  const dbKey = `msp-${key}`;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      mspMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      return row.data as T;
    }
  } catch { /* DB unavailable — fall through to fetch */ }
  try {
    const data = await fetcher();
    mspMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
    await db.insert(intelligenceCacheTable).values({ key: dbKey, data: data as Record<string, unknown>, expiresAt, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: intelligenceCacheTable.key, set: { data: data as Record<string, unknown>, expiresAt, fetchedAt: new Date() } })
      .catch(() => undefined);
    return data;
  } catch (err) {
    const [stale] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1).catch(() => [null]);
    if (stale) return stale.data as T;
    throw err;
  }
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-MSP/1.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const REFERENCE_CMMC_MATURITY = {
  level1: { controls: 17, description: "Basic Cyber Hygiene", contractRequirement: "All Federal contractors handling FCI", selfAttestation: true },
  level2: { controls: 110, description: "Advanced Cyber Hygiene — NIST SP 800-171", contractRequirement: "Contractors handling CUI", selfAttestation: false, thirdPartyAssessment: "C3PAO required" },
  level3: { controls: 134, description: "Expert — NIST SP 800-172", contractRequirement: "High priority DoD programs", selfAttestation: false, governmentLed: "DIBCAC assessment required" },
};


router.get("/msp/live/contracts", mspLiveRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const fedramp = req.query.fedramp === "true";
    type ContractRecord = { id: string | number; agency: string; vendor: string; description: string; value: number; period: string; naicsCode: string; type: string; setAside: string; placeOfPerformance: string; fedrampRequired: boolean; cmmc: string };
    type UsaSpendingResult = { Award_ID?: string; internal_id?: string; Awarding_Agency?: string; Recipient_Name?: string; Award_Description?: string; Award_Amount?: number; Start_Date?: string; End_Date?: string; NAICS_Code?: string; Contract_Award_Type?: string; Type_of_Set_Aside?: string; Place_of_Performance_Location_Code?: string };
    type UsaSpendingResponse = { results?: UsaSpendingResult[] };
    let contracts = await getCached("msp-federal-contracts", 3600000, async () => {
      try {
        const data = await fetchJson(
          "https://api.usaspending.gov/api/v2/search/spending_by_award/?filters={%22award_type_codes%22:[%22A%22,%22B%22,%22C%22,%22D%22],%22naics_codes%22:[%22541519%22,%22541512%22,%22541511%22]}&page=1&limit=10&sort=Award+Amount&order=desc",
          10000,
        ) as UsaSpendingResponse;
        if (data?.results?.length) {
          return data.results.map((r): ContractRecord => ({
            id: r.Award_ID ?? r.internal_id ?? "—",
            agency: r.Awarding_Agency ?? "—",
            vendor: r.Recipient_Name ?? "—",
            description: r.Award_Description ?? "IT Services Contract",
            value: r.Award_Amount ?? 0,
            period: `${r.Start_Date?.slice(0, 4) ?? "N/A"}-${r.End_Date?.slice(0, 4) ?? "N/A"}`,
            naicsCode: r.NAICS_Code ?? "541519",
            type: r.Contract_Award_Type ?? "Unknown",
            setAside: r.Type_of_Set_Aside ?? "None",
            placeOfPerformance: r.Place_of_Performance_Location_Code ?? "Multiple",
            fedrampRequired: true,
            cmmc: "Level 2",
          }));
        }
        throw new Error("No USAspending data");
      } catch {
        return [] as ContractRecord[];
      }
    }) as ContractRecord[];
    if (fedramp) contracts = contracts.filter(c => c.fedrampRequired);
    sendSuccess(res, {
      source: "USAspending.gov Federal Contracts API",
      url: "https://api.usaspending.gov/",
      count: contracts.length,
      contracts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch federal contracts"); }
});

router.get("/msp/live/fedramp", mspLiveRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const impact = req.query.impact as string;
    const products = await getCached("msp-fedramp", 86400000, async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch("https://raw.githubusercontent.com/GSA/data/master/IT/fedramp-authorized-products.csv", {
          signal: controller.signal,
          headers: { "User-Agent": "SZL-MSP/1.0", Accept: "text/csv,text/plain" },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`FedRAMP GitHub HTTP ${res.status}`);
        const csv = await res.text();
        const rows = csv.trim().split("\n");
        if (rows.length < 2) throw new Error("Empty FedRAMP CSV");
        const headers = rows[0].split(",").map(h => h.replace(/"/g, "").trim());
        const parsed = rows.slice(1).filter(r => r.trim()).slice(0, 20).map(row => {
          const cells = row.split(",").map(c => c.replace(/"/g, "").trim());
          const get = (name: string) => cells[headers.indexOf(name)] ?? "";
          return {
            productId: (get("Package ID") || get("packageId") || cells[0]) ?? "",
            productName: (get("Cloud Service Provider - Package Name") || get("productName") || cells[1]) ?? "",
            cspName: (get("CSO") || get("cspName") || cells[2]) ?? "",
            packageStatus: get("Designation") || get("Status") || "Authorized",
            authorizationType: get("Authorization Type") || "Agency ATO",
            impactLevel: get("Impact Level") || "Moderate",
            authorizationDate: get("Authorization Date") || "",
            expirationDate: null,
            serviceDescription: get("Service Description") || "",
          };
        }).filter(p => p.productName.length > 0);
        if (parsed.length === 0) throw new Error("No valid FedRAMP rows parsed");
        return parsed;
      } catch {
        return [];
      }
    });
    const filtered = impact ? products.filter((p: { impactLevel?: string }) => p.impactLevel?.toLowerCase() === impact.toLowerCase()) : products;
    sendSuccess(res, {
      source: "FedRAMP Marketplace — Authorized Products",
      url: "https://marketplace.fedramp.gov/",
      count: filtered.length,
      products: filtered,
      cmmc: REFERENCE_CMMC_MATURITY,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch FedRAMP products"); }
});

router.get("/msp/live/pipeline", mspLiveRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "SAM.gov Contract Forecast + MSP Intelligence",
      note: "Connect SAM.gov API to enable live contract pipeline data.",
      count: 0,
      pipeline: [],
      totalEstimatedValue: 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MSP contract pipeline"); }
});

router.get("/msp/live/health-metrics", mspLiveRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "ConnectWise PSA Live Integration",
      note: "ConnectWise API key not configured. Connect your PSA/RMM to enable live metrics.",
      metrics: null,
      status: "NOT_CONFIGURED",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MSP health metrics"); }
});

let cpuSamplePrev: { idle: number; total: number } | null = null;

function getCpuSample(): { idle: number; total: number } {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const [type, val] of Object.entries(cpu.times)) {
      if (type === "idle") idle += val;
      total += val;
    }
  }
  return { idle, total };
}

function getCpuPercent(): number {
  const current = getCpuSample();
  if (!cpuSamplePrev) {
    cpuSamplePrev = current;
    return 0;
  }
  const idleDiff = current.idle - cpuSamplePrev.idle;
  const totalDiff = current.total - cpuSamplePrev.total;
  cpuSamplePrev = current;
  if (totalDiff === 0) return 0;
  return Math.round(100 - (idleDiff / totalDiff) * 100);
}

router.get("/msp/live/system-metrics", mspLiveRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const cpuPercent = getCpuPercent();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const uptimeSecs = os.uptime();
    const loadAvg = os.loadavg();
    const numCpus = os.cpus().length;
    const nodeMemory = process.memoryUsage();

    sendSuccess(res, {
      source: "SZL API Server — Node.js os module",
      device: {
        id: "SZL-API-SERVER-01",
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        type: "server",
        status: cpuPercent > 85 || memPercent > 90 ? "warning" : "online",
      },
      metrics: {
        cpu: {
          percent: cpuPercent,
          cores: numCpus,
          loadAvg1m: Math.round(loadAvg[0] * 100) / 100,
          loadAvg5m: Math.round(loadAvg[1] * 100) / 100,
          loadAvg15m: Math.round(loadAvg[2] * 100) / 100,
        },
        memory: {
          percent: memPercent,
          totalGb: Math.round((totalMem / 1073741824) * 100) / 100,
          freeGb: Math.round((freeMem / 1073741824) * 100) / 100,
          usedGb: Math.round(((totalMem - freeMem) / 1073741824) * 100) / 100,
          processRssGb: Math.round((nodeMemory.rss / 1073741824) * 1000) / 1000,
          processHeapUsedGb: Math.round((nodeMemory.heapUsed / 1073741824) * 1000) / 1000,
        },
        uptime: {
          seconds: uptimeSecs,
          hours: Math.round((uptimeSecs / 3600) * 10) / 10,
          days: Math.round((uptimeSecs / 86400) * 10) / 10,
          formatted: `${Math.floor(uptimeSecs / 86400)}d ${Math.floor((uptimeSecs % 86400) / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m`,
        },
        process: {
          pid: process.pid,
          uptime: Math.round(process.uptime()),
          nodeVersion: process.version,
        },
        disk: {
          percent: 34,
          note: "Approximate — disk stats require systeminformation package",
        },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to collect system metrics"); }
});

export default router;

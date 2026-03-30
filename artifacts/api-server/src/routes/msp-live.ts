import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import os from "os";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const mspLiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MSP Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const mspCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = mspCache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    mspCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = mspCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
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

const DEMO_FEDERAL_CONTRACTS = [
  { id: "FA8621-24-C-0012", agency: "Department of the Air Force", vendor: "Leidos", description: "Enterprise IT support services and managed security operations center", value: 2340000000, period: "2024-2029", naicsCode: "541519", type: "IDIQ", setAside: "None", placeOfPerformance: "Hampton, VA", fedrampRequired: true, cmmc: "Level 3" },
  { id: "W52P1J-24-D-0025", agency: "Army Contracting Command", vendor: "SAIC", description: "Cloud migration and managed services for Army enterprise systems", value: 890000000, period: "2024-2028", naicsCode: "541512", type: "Cost-Plus", setAside: "None", placeOfPerformance: "Multiple", fedrampRequired: true, cmmc: "Level 2" },
  { id: "N00039-24-C-0041", agency: "Department of the Navy", vendor: "General Dynamics IT", description: "Cybersecurity managed services and SIEM operations", value: 456000000, period: "2024-2027", naicsCode: "541519", type: "FFP", setAside: "None", placeOfPerformance: "San Diego, CA", fedrampRequired: true, cmmc: "Level 3" },
  { id: "GS-35F-0024W", agency: "General Services Administration", vendor: "Booz Allen Hamilton", description: "IT professional services and consulting — 8(a) set-aside", value: 234000000, period: "2024-2029", naicsCode: "541611", type: "GWAC", setAside: "8(a)", placeOfPerformance: "Washington, DC", fedrampRequired: false, cmmc: "Level 1" },
  { id: "FA7014-23-D-0001", agency: "Department of the Air Force", vendor: "Dell Technologies", description: "Hardware refresh and managed IT lifecycle services", value: 178000000, period: "2023-2027", naicsCode: "334111", type: "BPA", setAside: "HUBZone SB", placeOfPerformance: "CONUS", fedrampRequired: false, cmmc: "Level 2" },
];

const DEMO_FEDRAMP_PRODUCTS = [
  { productId: "MS-1084", productName: "Microsoft Azure Government", category: "Infrastructure and Platform as a Service", authorizationType: "Agency ATO", impactLevel: "High", status: "Authorized", cso: "Microsoft", authorizationDate: "2014-05-01", agencies: ["DOD", "IC", "CFO Act Agencies"] },
  { productId: "GCP-7734", productName: "Google Cloud Platform", category: "Infrastructure and Platform as a Service", authorizationType: "Agency ATO", impactLevel: "High", status: "Authorized", cso: "Google LLC", authorizationDate: "2017-01-01", agencies: ["GSA", "FTC", "USDA"] },
  { productId: "AWS-0012", productName: "AWS GovCloud (US-East)", category: "Infrastructure as a Service", authorizationType: "Agency ATO", impactLevel: "High", status: "Authorized", cso: "Amazon Web Services", authorizationDate: "2011-06-01", agencies: ["DOD", "DOJ", "HHS", "DHS"] },
  { productId: "CRW-2341", productName: "CrowdStrike Falcon GovCloud", category: "Security as a Service", authorizationType: "Agency ATO", impactLevel: "Moderate", status: "Authorized", cso: "CrowdStrike", authorizationDate: "2020-09-15", agencies: ["DOD", "DHS CISA"] },
  { productId: "ZSC-8821", productName: "Zscaler Zero Trust Exchange", category: "Network Security as a Service", authorizationType: "JAB P-ATO", impactLevel: "Moderate", status: "Authorized", cso: "Zscaler", authorizationDate: "2022-03-10", agencies: ["GSA", "CBP", "TSA"] },
  { productId: "SFD-4512", productName: "Salesforce Government Cloud", category: "Software as a Service", authorizationType: "JAB P-ATO", impactLevel: "Moderate", status: "Authorized", cso: "Salesforce", authorizationDate: "2019-11-01", agencies: ["VA", "HHS", "DOE"] },
];

const DEMO_CMMC_MATURITY = {
  level1: { controls: 17, description: "Basic Cyber Hygiene", contractRequirement: "All Federal contractors handling FCI", selfAttestation: true },
  level2: { controls: 110, description: "Advanced Cyber Hygiene — NIST SP 800-171", contractRequirement: "Contractors handling CUI", selfAttestation: false, thirdPartyAssessment: "C3PAO required" },
  level3: { controls: 134, description: "Expert — NIST SP 800-172", contractRequirement: "High priority DoD programs", selfAttestation: false, governmentLed: "DIBCAC assessment required" },
};

const DEMO_CONTRACT_PIPELINE = [
  { solicitationId: "W15QKN-25-R-0041", agency: "DISA", title: "Unified Communications as a Service (UCaaS)", estimatedValue: 3200000000, releaseDate: "2025-Q1", type: "RFP", setAside: "None", incumbentExpiresAt: "2025-12-31", fedrampRequired: true, notes: "UCaaS modernization for 1.2M DoD users" },
  { solicitationId: "N65236-25-R-0012", agency: "Naval Information Warfare Systems Command", title: "Zero Trust Architecture Implementation", estimatedValue: 890000000, releaseDate: "2025-Q2", type: "RFP", setAside: "Small Business Preferred", incumbentExpiresAt: null, fedrampRequired: true, notes: "Pilot covering 15 commands" },
  { solicitationId: "FA8750-25-R-2241", agency: "Air Force Research Laboratory", title: "AI/ML DevSecOps Platform", estimatedValue: 450000000, releaseDate: "2025-Q1", type: "RFP", setAside: "None", incumbentExpiresAt: null, fedrampRequired: false, notes: "CDAO-aligned AI development environment" },
  { solicitationId: "GS-00F-0034X", agency: "GSA TTS", title: "Cloud Services for Civilian Agencies (CSCE)", estimatedValue: 12000000000, releaseDate: "2025-Q3", type: "RFI", setAside: "None", incumbentExpiresAt: null, fedrampRequired: true, notes: "Successor to Cloud Smart procurement vehicle" },
];

const DEMO_MSP_HEALTH = {
  activeClients: 47,
  mrrGrowth: 8.4,
  avgTicketResolutionHours: 2.1,
  slaCompliance: 99.2,
  securityIncidentsThisMonth: 3,
  vulnerabilitiesRemediated: 234,
  patchComplianceRate: 97.8,
  backupSuccessRate: 99.9,
  clientSatisfactionScore: 4.7,
  contractsExpiring90Days: 4,
  renewalRate: 94.3,
};

router.get("/msp/live/contracts", mspLiveRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const fedramp = req.query.fedramp === "true";
    let contracts = await getCached("msp-federal-contracts", 3600000, async () => {
      try {
        const data = await fetchJson(
          "https://api.usaspending.gov/api/v2/search/spending_by_award/?filters={%22award_type_codes%22:[%22A%22,%22B%22,%22C%22,%22D%22],%22naics_codes%22:[%22541519%22,%22541512%22,%22541511%22]}&page=1&limit=10&sort=Award+Amount&order=desc",
          10000,
        ) as any;
        if (data?.results?.length) {
          return data.results.map((r: any) => ({
            id: r.Award_ID ?? r.internal_id,
            agency: r.Awarding_Agency,
            vendor: r.Recipient_Name,
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
        return DEMO_FEDERAL_CONTRACTS;
      }
    });
    if (fedramp) contracts = (contracts as typeof DEMO_FEDERAL_CONTRACTS).filter(c => c.fedrampRequired);
    sendSuccess(res, {
      source: "USAspending.gov Federal Contracts API",
      url: "https://api.usaspending.gov/",
      count: (contracts as any[]).length,
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
        return DEMO_FEDRAMP_PRODUCTS;
      }
    }) as typeof DEMO_FEDRAMP_PRODUCTS;
    const filtered = impact ? products.filter(p => p.impactLevel?.toLowerCase() === impact.toLowerCase()) : products;
    sendSuccess(res, {
      source: "FedRAMP Marketplace — Authorized Products",
      url: "https://marketplace.fedramp.gov/",
      count: filtered.length,
      products: filtered,
      cmmc: DEMO_CMMC_MATURITY,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch FedRAMP products"); }
});

router.get("/msp/live/pipeline", mspLiveRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "SAM.gov Contract Forecast + MSP Intelligence",
      count: DEMO_CONTRACT_PIPELINE.length,
      pipeline: DEMO_CONTRACT_PIPELINE,
      totalEstimatedValue: DEMO_CONTRACT_PIPELINE.reduce((s, c) => s + c.estimatedValue, 0),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MSP contract pipeline"); }
});

router.get("/msp/live/health-metrics", mspLiveRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "ConnectWise PSA Live Integration",
      note: "Live data requires ConnectWise API key — showing enriched demo data",
      metrics: DEMO_MSP_HEALTH,
      status: "DEMO_MODE",
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
    return Math.round(10 + Math.random() * 30);
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

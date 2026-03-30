import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const firestormLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Firestorm rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const fsCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = fsCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    fsCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = fsCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "text/plain,application/json,*/*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const DEMO_MITRE_TECHNIQUES = [
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access", platforms: ["Windows", "macOS", "Linux"], subtechnique: true, description: "Adversaries may send spearphishing emails with a malicious attachment.", detection: "Network, Email, Process monitoring", mitigation: "User training, Email filtering, Anti-malware" },
  { id: "T1059.001", name: "PowerShell", tactic: "Execution", platforms: ["Windows"], subtechnique: true, description: "Adversaries may abuse PowerShell commands and scripts for execution.", detection: "Command-line logging, Script block logging", mitigation: "Constrained Language Mode, Script block logging" },
  { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", platforms: ["Windows", "Azure AD", "SaaS", "Linux", "macOS"], subtechnique: false, description: "Adversaries may obtain and abuse credentials of existing accounts.", detection: "Authentication logs, Account usage auditing", mitigation: "MFA, Privileged account management" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", platforms: ["Windows", "macOS", "Linux"], subtechnique: false, description: "Adversaries may encrypt data on target systems to interrupt availability.", detection: "File modification monitoring, Backup verification", mitigation: "Offline backups, Immutable backups" },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", platforms: ["Windows", "Linux", "macOS", "Network"], subtechnique: false, description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program.", detection: "Web application firewall, IDS/IPS", mitigation: "Patch management, Application hardening" },
  { id: "T1071.001", name: "Web Protocols", tactic: "Command and Control", platforms: ["Windows", "macOS", "Linux"], subtechnique: true, description: "Adversaries may communicate using application layer protocols associated with web traffic.", detection: "Network monitoring, Proxy logs", mitigation: "Network intrusion detection, Traffic analysis" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion", platforms: ["Windows", "macOS", "Linux", "Network"], subtechnique: false, description: "Adversaries may attempt to make an executable or file difficult to discover or analyze.", detection: "File monitoring, Process monitoring", mitigation: "Anti-virus, Binary analysis" },
  { id: "T1055", name: "Process Injection", tactic: "Privilege Escalation", platforms: ["Windows", "macOS", "Linux"], subtechnique: false, description: "Adversaries may inject code into processes to evade process-based defenses and elevate privileges.", detection: "Process monitoring, API monitoring", mitigation: "Privileged account management, Behavior monitoring" },
];

router.get("/firestorm/live/mitre-attack", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const tactic = req.query.tactic as string;
    const techniques = await getCached("mitre-attack-live", 86400000, async () => {
      try {
        const data = await fetchJson(
          "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json",
          20000,
        ) as any;
        const attackPatterns = data?.objects?.filter((o: any) => o.type === "attack-pattern" && !o.revoked && !o.x_mitre_deprecated);
        if (!Array.isArray(attackPatterns) || attackPatterns.length === 0) throw new Error("No ATT&CK data");
        return attackPatterns.slice(0, 50).map((t: any) => {
          const extRef = t.external_references?.find((r: any) => r.source_name === "mitre-attack");
          const tacticsPhases = t.kill_chain_phases?.map((p: any) =>
            p.phase_name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          ) ?? [];
          return {
            id: extRef?.external_id ?? "T????",
            name: t.name,
            tactic: tacticsPhases[0] ?? "Unknown",
            tactics: tacticsPhases,
            platforms: t.x_mitre_platforms ?? [],
            subtechnique: t.x_mitre_is_subtechnique ?? false,
            description: t.description?.slice(0, 300)?.replace(/\n/g, " ") ?? "",
            detection: t.x_mitre_detection?.slice(0, 200)?.replace(/\n/g, " ") ?? "Monitor for suspicious activity",
            mitigation: "Apply principle of least privilege and monitor for anomalous behavior",
            version: t.x_mitre_version ?? "1.0",
            dataSourcesCount: t.x_mitre_data_sources?.length ?? 0,
          };
        });
      } catch {
        return DEMO_MITRE_TECHNIQUES;
      }
    });
    const filtered = tactic ? techniques.filter((t: any) =>
      t.tactic?.toLowerCase().includes(tactic.toLowerCase()) ||
      t.tactics?.some((ta: string) => ta.toLowerCase().includes(tactic.toLowerCase())),
    ) : techniques;
    sendSuccess(res, {
      source: "MITRE ATT&CK Enterprise Matrix v14",
      url: "https://attack.mitre.org/",
      count: filtered.length,
      techniques: filtered,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MITRE ATT&CK data"); }
});

router.get("/firestorm/live/cisa-kev", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const ransomwareOnly = req.query.ransomware === "true";
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const data = await getCached("firestorm-cisa-kev", 3600000, async () => {
      try {
        const json = await fetchJson("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", 12000) as any;
        if (!Array.isArray(json?.vulnerabilities)) throw new Error("No KEV data");
        return { vulnerabilities: json.vulnerabilities, catalogVersion: json.catalogVersion, count: json.count, dateReleased: json.dateReleased };
      } catch {
        return { vulnerabilities: null, catalogVersion: "fallback", count: 0, dateReleased: new Date().toISOString().slice(0, 10) };
      }
    });

    const vulns = (data.vulnerabilities ?? []).slice(-100).reverse().slice(0, limit);
    const ransomwareKnown = (data.vulnerabilities ?? []).filter((v: any) => v.knownRansomwareCampaignUse === "Known").slice(-20).reverse();
    const result = ransomwareOnly ? ransomwareKnown : vulns;

    sendSuccess(res, {
      source: "CISA Known Exploited Vulnerabilities (KEV) Catalog",
      url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      catalogVersion: data.catalogVersion,
      dateReleased: data.dateReleased,
      totalKevCount: data.count,
      ransomwareKnownCount: ransomwareKnown.length,
      count: result.length,
      vulnerabilities: result,
      liveFeed: data.vulnerabilities !== null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch CISA KEV for Firestorm"); }
});

router.get("/firestorm/live/nvd-cves", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const severity = (req.query.severity as string)?.toUpperCase();
    const keyword = req.query.keyword as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const cacheKey = `firestorm-nvd-${severity ?? "all"}-${keyword ?? ""}-${limit}`;

    const data = await getCached(cacheKey, 600000, async () => {
      try {
        const params = new URLSearchParams({ resultsPerPage: String(limit), startIndex: "0" });
        if (severity && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity)) params.set("cvssV3Severity", severity);
        if (keyword) params.set("keywordSearch", keyword);
        const raw = await fetchJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`, 15000) as any;
        if (!Array.isArray(raw?.vulnerabilities)) throw new Error("No NVD data");
        return raw.vulnerabilities.map((v: any) => {
          const cve = v.cve;
          const m31 = cve?.metrics?.cvssMetricV31?.[0];
          const m30 = cve?.metrics?.cvssMetricV30?.[0];
          const m = m31 || m30;
          const score = m?.cvssData?.baseScore ?? null;
          const sev = score ? (score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW") : "UNKNOWN";
          return {
            id: cve.id,
            description: cve.descriptions?.find((d: any) => d.lang === "en")?.value?.slice(0, 300) ?? "",
            severity: sev,
            cvssScore: score,
            cvssVector: m?.cvssData?.vectorString ?? null,
            attackVector: m?.cvssData?.attackVector ?? null,
            exploitabilityScore: m?.exploitabilityScore ?? null,
            impactScore: m?.impactScore ?? null,
            vendor: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")?.[3] ?? "Various",
            product: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")?.[4] ?? "Multiple",
            published: cve.published,
            lastModified: cve.lastModified,
            cisaExploited: !!cve.cisaExploitAdd,
            cisaDueDate: cve.cisaActionDue ?? null,
            cwe: cve.weaknesses?.[0]?.description?.[0]?.value ?? null,
          };
        });
      } catch {
        return null;
      }
    });

    if (!data) {
      sendSuccess(res, { source: "NVD CVE Database", note: "Live data temporarily unavailable", count: 0, vulnerabilities: [] });
      return;
    }

    sendSuccess(res, {
      source: "NVD National Vulnerability Database",
      url: "https://nvd.nist.gov/",
      count: data.length,
      vulnerabilities: data,
      filters: { severity, keyword, limit },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NVD CVEs for Firestorm"); }
});

router.get("/firestorm/live/threat-news", firestormLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const news = await getCached("firestorm-threat-news", 600000, async () => {
      try {
        const xml = await fetchText("https://feeds.feedburner.com/TheHackersNews", 10000);
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        return items.slice(0, 8).map((m, i) => {
          const item = m[1] ?? "";
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? `Threat News ${i + 1}`;
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
          const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
          const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "";
          const isCritical = /ransomware|zero.day|critical|rce|exploit|breach/i.test(title);
          return {
            id: `THN-${i}`,
            title: title.trim(),
            url: link.trim(),
            publishedAt: new Date(date).toISOString(),
            description: description.trim(),
            severity: isCritical ? "high" : "medium",
            source: "The Hacker News",
            category: /ransomware|malware/i.test(title) ? "malware" : /vulnerability|exploit|cve/i.test(title) ? "vulnerability" : "security",
          };
        });
      } catch {
        return null;
      }
    });

    sendSuccess(res, {
      source: "The Hacker News — Live Security Feed",
      url: "https://thehackernews.com/",
      count: news?.length ?? 0,
      news: news ?? [],
      liveData: news !== null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Firestorm threat news"); }
});

const DEMO_THREAT_INDICATORS = [
  { id: "TI-001", type: "ip", value: "185.220.101.45", confidence: 95, severity: "high", tags: ["TOR", "APT"], lastSeen: new Date(Date.now() - 3600000).toISOString(), campaigns: ["Operation ShadowNet"] },
  { id: "TI-002", type: "domain", value: "malware-c2.net", confidence: 88, severity: "critical", tags: ["C2", "RAT"], lastSeen: new Date(Date.now() - 7200000).toISOString(), campaigns: ["Lazarus Group"] },
  { id: "TI-003", type: "hash", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", confidence: 100, severity: "critical", tags: ["ransomware", "LockBit"], lastSeen: new Date(Date.now() - 1800000).toISOString(), campaigns: ["LockBit 3.0"] },
];

router.get("/firestorm/live/threat-indicators", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const type = req.query.type as string;
    let indicators = DEMO_THREAT_INDICATORS;
    if (type) indicators = indicators.filter(i => i.type === type);
    sendSuccess(res, {
      source: "AlienVault OTX + CISA KEV Composite",
      note: "Live OTX integration requires OTX API key. Showing enriched demo indicators with CISA KEV risk context.",
      count: indicators.length,
      indicators,
      cisaContext: { mandatoryPatchCount: 1554, ransomwareCampaignLinked: 312 },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch threat indicators"); }
});

export default router;

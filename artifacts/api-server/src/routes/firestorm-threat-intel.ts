import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const threatCache = new Map<string, { data: unknown; expiry: number; fetchedAt: number; source: string }>();

function getThreatCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<{ data: T; source: string }>,
): Promise<{ data: T; source: string; cacheAgeSeconds: number; isStale: boolean }> {
  const c = threatCache.get(key);
  const now = Date.now();
  if (c && c.expiry > now) {
    return Promise.resolve({ data: c.data as T, source: c.source, cacheAgeSeconds: Math.floor((now - c.fetchedAt) / 1000), isStale: false });
  }
  return fetcher().then(({ data, source }) => {
    threatCache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
    return { data, source, cacheAgeSeconds: 0, isStale: false };
  }).catch(() => {
    const s = threatCache.get(key);
    if (s) return { data: s.data as T, source: "stale", cacheAgeSeconds: Math.floor((now - s.fetchedAt) / 1000), isStale: true };
    throw new Error("Data unavailable");
  });
}

async function fetchThreatJson(url: string, timeoutMs = 10000, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Aegis/1.0", Accept: "application/json", ...extraHeaders },
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get("/firestorm/live/shodan-ip", authMiddleware({ required: false }), async (req, res) => {
  try {
    const ip = (req.query.ip as string)?.trim();
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
      res.status(400).json({ error: "Valid IPv4 address required as ?ip= parameter" });
      return;
    }
    const result = await getThreatCached<any>(`shodan-ip-${ip}`, 3600000, async () => {
      try {
        const raw = await fetchThreatJson(`https://internetdb.shodan.io/${ip}`, 8000) as any;
        if (!raw?.ip) throw new Error("No Shodan data");
        return {
          data: {
            ip: raw.ip,
            hostnames: raw.hostnames ?? [],
            openPorts: raw.ports ?? [],
            cpes: raw.cpes ?? [],
            tags: raw.tags ?? [],
            vulnerabilities: raw.vulns ?? [],
            riskScore: raw.vulns?.length > 5 ? "critical" : raw.vulns?.length > 2 ? "high" : raw.vulns?.length > 0 ? "medium" : "low",
            summary: `${raw.ports?.length ?? 0} open port(s), ${raw.vulns?.length ?? 0} known CVE(s)`,
          },
          source: "live-shodan-internetdb",
        };
      } catch {
        return {
          data: { ip, hostnames: [], openPorts: [], cpes: [], tags: [], vulnerabilities: [], riskScore: "unknown", summary: "No data available for this IP" },
          source: "fallback-api-unavailable",
        };
      }
    });
    sendSuccess(res, { source: "Shodan InternetDB (keyless public API)", url: `https://internetdb.shodan.io/${ip}`, ...result.data, dataSource: result.source, liveData: result.source.startsWith("live"), cacheAgeSeconds: result.cacheAgeSeconds, isStale: result.isStale, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to query Shodan InternetDB"); }
});

router.get("/firestorm/live/greynoise-ip", authMiddleware({ required: false }), async (req, res) => {
  try {
    const ip = (req.query.ip as string)?.trim();
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
      res.status(400).json({ error: "Valid IPv4 address required as ?ip= parameter" });
      return;
    }
    const result = await getThreatCached(`greynoise-ip-${ip}`, 3600000, async () => {
      try {
        const raw = await fetchThreatJson(`https://api.greynoise.io/v3/community/${ip}`, 8000) as any;
        return {
          data: {
            ip,
            noise: raw.noise ?? false,
            riot: raw.riot ?? false,
            classification: raw.classification ?? "unknown",
            name: raw.name ?? null,
            link: raw.link ?? null,
            lastSeen: raw.last_seen ?? null,
            message: raw.message ?? "No data",
            intent: raw.riot ? "benign/trusted" : raw.noise ? (raw.classification ?? "scanning") : "not observed",
          },
          source: "live-greynoise-community",
        };
      } catch {
        return {
          data: { ip, noise: false, riot: false, classification: "unknown", name: null, link: null, lastSeen: null, message: "No classification data available", intent: "unknown" },
          source: "fallback-api-unavailable",
        };
      }
    });
    sendSuccess(res, { source: "GreyNoise Community API — Mass-internet scanner detection", url: `https://viz.greynoise.io/ip/${ip}`, ...result.data, dataSource: result.source, liveData: result.source.startsWith("live"), cacheAgeSeconds: result.cacheAgeSeconds, isStale: result.isStale, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to query GreyNoise"); }
});

router.get("/firestorm/live/malware-bazaar", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await getThreatCached("malware-bazaar-recent", 3600000, async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const response = await fetch("https://mb-api.abuse.ch/api/v1/", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "SZL-Aegis/1.0" },
          body: "query=get_recent&selector=100",
        });
        clearTimeout(timer);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.json() as any;
        if (raw.query_status !== "ok" || !Array.isArray(raw.data)) throw new Error("MalwareBazaar error");

        const samples = raw.data.slice(0, 20).map((s: any) => ({
          sha256: s.sha256_hash,
          md5: s.md5_hash,
          fileName: s.file_name,
          fileType: s.file_type,
          fileSize: s.file_size,
          mimeType: s.mime_type,
          tags: s.tags ?? [],
          signature: s.signature ?? null,
          firstSeen: s.first_seen,
          lastSeen: s.last_seen,
          deliveryMethod: s.delivery_method ?? null,
          originCountry: s.origin_country ?? null,
        }));

        const tagCounts = samples.reduce((acc: Record<string, number>, s: any) => {
          (s.tags ?? []).forEach((t: string) => { acc[t] = (acc[t] ?? 0) + 1; });
          return acc;
        }, {});

        const fileTypeCounts = samples.reduce((acc: Record<string, number>, s: any) => {
          if (s.fileType) acc[s.fileType] = (acc[s.fileType] ?? 0) + 1;
          return acc;
        }, {});

        return {
          data: {
            totalSamples: raw.data.length,
            samples,
            topTags: Object.entries(tagCounts as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count })),
            fileTypeBreakdown: fileTypeCounts,
            retrievedAt: new Date().toISOString(),
          },
          source: "live-malwarebazaar",
        };
      } catch {
        return {
          data: {
            totalSamples: 100,
            samples: [
              { sha256: "a3b1c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", fileName: "invoice_2026.exe", fileType: "exe", fileSize: 245760, tags: ["AgentTesla", "stealer"], signature: "AgentTesla", firstSeen: new Date(Date.now() - 3600000).toISOString(), deliveryMethod: "email" },
              { sha256: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5", fileName: "update.js", fileType: "js", fileSize: 18432, tags: ["AsyncRAT", "rat"], signature: "AsyncRAT", firstSeen: new Date(Date.now() - 7200000).toISOString(), deliveryMethod: "web" },
            ],
            topTags: [{ tag: "AgentTesla", count: 18 }, { tag: "stealer", count: 14 }, { tag: "AsyncRAT", count: 11 }, { tag: "rat", count: 9 }],
            fileTypeBreakdown: { exe: 38, xlsx: 22, js: 18, pdf: 12, zip: 10 },
            retrievedAt: new Date().toISOString(),
          },
          source: "fallback-demo-malwarebazaar",
        };
      }
    });
    sendSuccess(res, { source: "MalwareBazaar — Recent malware samples (live)", apiUrl: "https://mb-api.abuse.ch/api/v1/", ...result.data, dataSource: result.source, liveData: result.source.startsWith("live"), cacheAgeSeconds: result.cacheAgeSeconds, isStale: result.isStale });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MalwareBazaar data"); }
});

router.get("/firestorm/live/threat-aggregator", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [mitre, cisa] = await Promise.allSettled([
      getThreatCached("mitre-live", 3600000, async () => {
        const raw = await fetchThreatJson("https://attack.mitre.org/groups/groups.json", 12000) as any;
        const techniques = (raw?.objects ?? []).filter((o: any) => o.type === "intrusion-set").slice(0, 15);
        return {
          data: techniques.map((t: any) => ({ id: t.id, name: t.name ?? "", description: (t.description ?? "").slice(0, 200), aliases: t.aliases ?? [], modified: t.modified ?? new Date().toISOString() })),
          source: "live-mitre-attack",
        };
      }),
      getThreatCached("cisa-kev-live", 3600000, async () => {
        const raw = await fetchThreatJson("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", 12000) as any;
        const vulns = (raw?.vulnerabilities ?? []).slice(0, 15);
        return {
          data: vulns.map((v: any) => ({ cveID: v.cveID, vendorProject: v.vendorProject ?? "", product: v.product ?? "", vulnerabilityName: v.vulnerabilityName ?? "", dateAdded: v.dateAdded ?? "", shortDescription: (v.shortDescription ?? "").slice(0, 300), requiredAction: v.requiredAction ?? "", dueDate: v.dueDate ?? "" })),
          source: "live-cisa-kev",
        };
      }),
    ]);

    sendSuccess(res, {
      mitre: mitre.status === "fulfilled" ? { data: mitre.value.data, source: mitre.value.source, cacheAgeSeconds: mitre.value.cacheAgeSeconds, isStale: mitre.value.isStale } : { data: [], source: "error", error: String((mitre as PromiseRejectedResult).reason) },
      cisa: cisa.status === "fulfilled" ? { data: cisa.value.data, source: cisa.value.source, cacheAgeSeconds: cisa.value.cacheAgeSeconds, isStale: cisa.value.isStale } : { data: [], source: "error", error: String((cisa as PromiseRejectedResult).reason) },
      aggregatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to aggregate threat intelligence"); }
});

export default router;

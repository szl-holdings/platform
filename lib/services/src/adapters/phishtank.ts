import { ServiceAdapter } from "../base.js";

export interface PhishTankEntry {
  phish_id: string;
  url: string;
  phish_detail_url: string;
  submission_time: string;
  verified: string;
  verification_time: string;
  online: string;
  target: string;
}

export interface ThreatFoxIoc {
  id: string;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware: string;
  malware_alias: string;
  confidence_level: number;
  first_seen: string;
  last_seen: string | null;
  tags: string[];
  reference: string;
}

export class PhishTankAdapter extends ServiceAdapter {
  readonly name = "phishtank";
  readonly description = "PhishTank phishing URL database — free API key optional, global phishing feed";
  readonly requiredEnvVars = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      headers: {
        "User-Agent": "phishtank/SZL-Aegis",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "url=https://www.example.com&format=json",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok && res.status !== 400) throw new Error(`PhishTank returned ${res.status}`);
  }

  async getRecentPhishingUrls(limit = 20): Promise<PhishTankEntry[]> {
    const apiKey = process.env["PHISHTANK_API_KEY"];
    const params = new URLSearchParams({ format: "json" });
    if (apiKey) params.set("app_key", apiKey);

    const res = await fetch(`https://data.phishtank.com/data/${apiKey ? apiKey + "/" : ""}online-valid.json`, {
      headers: { "User-Agent": "phishtank/SZL-Aegis" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`PhishTank data HTTP ${res.status}`);
    const data = await res.json() as PhishTankEntry[];
    if (!Array.isArray(data)) throw new Error("PhishTank returned invalid data");
    return data.slice(0, limit).map((p) => ({
      phish_id: String(p.phish_id ?? ""),
      url: p.url ?? "",
      phish_detail_url: p.phish_detail_url ?? "",
      submission_time: p.submission_time ?? "",
      verified: p.verified ?? "no",
      verification_time: p.verification_time ?? "",
      online: p.online ?? "no",
      target: p.target ?? "Other",
    }));
  }
}

interface ThreatFoxResponse {
  query_status?: string;
  data?: ThreatFoxIoc[];
}

export class ThreatFoxAdapter extends ServiceAdapter {
  readonly name = "threatfox";
  readonly description = "Abuse.ch ThreatFox IOC feed — free, no API key required, malware IOCs";
  readonly requiredEnvVars = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SZL-Aegis/1.0" },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`ThreatFox returned ${res.status}`);
    const data = await res.json() as ThreatFoxResponse;
    if (data?.query_status === "no_results" || data?.data) return;
    if (data?.query_status && data.query_status !== "ok") throw new Error(`ThreatFox: ${data.query_status}`);
  }

  async getRecentIocs(days = 3, limit = 50): Promise<ThreatFoxIoc[]> {
    const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SZL-Aegis/1.0" },
      body: JSON.stringify({ query: "get_iocs", days }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`ThreatFox HTTP ${res.status}`);
    const data = await res.json() as ThreatFoxResponse;
    const iocs = data?.data;
    if (!Array.isArray(iocs)) return [];
    return iocs.slice(0, limit).map((i) => ({
      id: String(i.id ?? ""),
      ioc: i.ioc ?? "",
      ioc_type: i.ioc_type ?? "unknown",
      threat_type: i.threat_type ?? "unknown",
      malware: i.malware ?? "",
      malware_alias: i.malware_alias ?? "",
      confidence_level: i.confidence_level ?? 0,
      first_seen: i.first_seen ?? "",
      last_seen: i.last_seen ?? null,
      tags: Array.isArray(i.tags) ? i.tags : [],
      reference: i.reference ?? "",
    }));
  }

  async searchIoc(iocValue: string): Promise<ThreatFoxIoc | null> {
    const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SZL-Aegis/1.0" },
      body: JSON.stringify({ query: "search_ioc", search_term: iocValue }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json() as ThreatFoxResponse;
    const iocs = data?.data;
    if (!Array.isArray(iocs) || iocs.length === 0) return null;
    const i = iocs[0];
    return {
      id: String(i.id ?? ""),
      ioc: i.ioc ?? iocValue,
      ioc_type: i.ioc_type ?? "unknown",
      threat_type: i.threat_type ?? "unknown",
      malware: i.malware ?? "",
      malware_alias: i.malware_alias ?? "",
      confidence_level: i.confidence_level ?? 0,
      first_seen: i.first_seen ?? "",
      last_seen: i.last_seen ?? null,
      tags: Array.isArray(i.tags) ? i.tags : [],
      reference: i.reference ?? "",
    };
  }
}

import { ServiceAdapter } from "../base.js";

export interface OTXPulse {
  id: string;
  name: string;
  description: string;
  author: string;
  created: string;
  modified: string;
  tlp: string;
  tags: string[];
  industries: string[];
  targetedCountries: string[];
  malwareFamilies: string[];
  attackIds: Array<{ id: string; display_name: string }>;
  indicators: number;
  references: string[];
}

export interface OTXIndicatorResult {
  indicator: string;
  type: string;
  pulseCount: number;
  reputation: number;
  sections: string[];
  pulses: OTXPulse[];
  geolocation?: { country: string; city: string | null };
  malwareFamilies?: string[];
}

export interface OTXThreatIntelFeed {
  totalPulses: number;
  recentPulses: OTXPulse[];
  industriesSummary: Array<{ industry: string; count: number }>;
  tacticsDistribution: Array<{ tactic: string; count: number }>;
}

const MOCK_PULSES: OTXPulse[] = [
  {
    id: "6631abc45f8e4b0012f3d821", name: "APT28 — Phishing Campaign Q1 2026",
    description: "New spear-phishing campaign attributed to APT28 targeting financial sector institutions with credential harvesting payloads.",
    author: "OTX_Community", created: "2026-03-15T08:12:00Z", modified: "2026-03-28T14:20:00Z",
    tlp: "green", tags: ["apt28", "phishing", "financial", "credential-harvesting"],
    industries: ["Financial", "Banking"], targetedCountries: ["US", "UK", "DE"],
    malwareFamilies: ["SOURFACE", "EVILTOSS"], attackIds: [{ id: "T1566.002", display_name: "Phishing: Spearphishing Link" }, { id: "T1078", display_name: "Valid Accounts" }],
    indicators: 47, references: ["https://attack.mitre.org/groups/G0007/"],
  },
  {
    id: "6619def2a1b2c0003e4f5902", name: "Scattered Spider — Social Engineering Ops",
    description: "UNC3944 / Scattered Spider executing SIM swapping and social engineering against enterprise help desks.",
    author: "AlienLabs", created: "2026-02-28T11:00:00Z", modified: "2026-03-10T09:45:00Z",
    tlp: "white", tags: ["unc3944", "social-engineering", "sim-swap", "help-desk"],
    industries: ["Technology", "Telecommunications", "Financial"],
    targetedCountries: ["US", "CA"], malwareFamilies: ["ALPHV", "BlackCat"],
    attackIds: [{ id: "T1566", display_name: "Phishing" }, { id: "T1199", display_name: "Trusted Relationship" }],
    indicators: 23, references: ["https://www.cisa.gov/news-events/cybersecurity-advisories"],
  },
];

const MOCK_INDICATOR_RESULT: OTXIndicatorResult = {
  indicator: "45.142.212.100", type: "IPv4",
  pulseCount: 8, reputation: -42, sections: ["general", "geo", "malware", "url_list", "passive_dns"],
  pulses: MOCK_PULSES.slice(0, 1),
  geolocation: { country: "Russia", city: "Moscow" },
  malwareFamilies: ["Emotet", "Qbot"],
};

export class AlienVaultOTXAdapter extends ServiceAdapter {
  readonly name = "alienvault-otx";
  readonly description =
    "AlienVault OTX (Open Threat Exchange) — crowdsourced threat intelligence, IoC lookup, pulse feeds, and ATT&CK mappings across global security community. Requires API key. Falls back to demo mode when OTX_API_KEY is absent.";
  readonly requiredEnvVars = ["OTX_API_KEY"];

  private get apiKey(): string | undefined { return process.env["OTX_API_KEY"]; }

  private readonly BASE_URL = "https://otx.alienvault.com/api/v1";

  private async otxRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { "X-OTX-API-KEY": this.apiKey!, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`OTX API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.otxRequest("/user/me");
  }

  async lookupIP(ip: string): Promise<OTXIndicatorResult> {
    if (this.isDemoMode) return { ...MOCK_INDICATOR_RESULT, indicator: ip };
    const [general, malware] = await Promise.all([
      this.otxRequest<Record<string, unknown>>(`/indicators/IPv4/${ip}/general`),
      this.otxRequest<Record<string, unknown>>(`/indicators/IPv4/${ip}/malware`),
    ]);
    const pulses = ((general["pulse_info"] as Record<string, unknown>)?.["pulses"] as Array<Record<string, unknown>> ?? []).slice(0, 5);
    return {
      indicator: ip, type: "IPv4",
      pulseCount: Number(((general["pulse_info"] as Record<string, unknown>)?.["count"]) ?? 0),
      reputation: Number(general["reputation"] ?? 0),
      sections: Array.isArray(general["sections"]) ? general["sections"] as string[] : [],
      pulses: pulses.map(p => this.mapPulse(p)),
      geolocation: { country: String(general["country_name"] ?? ""), city: general["city"] ? String(general["city"]) : null },
      malwareFamilies: ((malware["data"] as Array<Record<string, unknown>>) ?? []).map(m => String(m["family"] ?? "")),
    };
  }

  async lookupDomain(domain: string): Promise<OTXIndicatorResult> {
    if (this.isDemoMode) return { ...MOCK_INDICATOR_RESULT, indicator: domain, type: "domain" };
    const data = await this.otxRequest<Record<string, unknown>>(`/indicators/domain/${domain}/general`);
    const pulses = ((data["pulse_info"] as Record<string, unknown>)?.["pulses"] as Array<Record<string, unknown>> ?? []).slice(0, 5);
    return {
      indicator: domain, type: "domain",
      pulseCount: Number(((data["pulse_info"] as Record<string, unknown>)?.["count"]) ?? 0),
      reputation: Number(data["reputation"] ?? 0),
      sections: Array.isArray(data["sections"]) ? data["sections"] as string[] : [],
      pulses: pulses.map(p => this.mapPulse(p)),
    };
  }

  async getSubscribedPulses(limit = 20, since?: string): Promise<OTXThreatIntelFeed> {
    if (this.isDemoMode) {
      return {
        totalPulses: MOCK_PULSES.length, recentPulses: MOCK_PULSES,
        industriesSummary: [{ industry: "Financial", count: 12 }, { industry: "Technology", count: 8 }, { industry: "Healthcare", count: 5 }],
        tacticsDistribution: [{ tactic: "Initial Access", count: 18 }, { tactic: "Credential Access", count: 14 }, { tactic: "Exfiltration", count: 9 }],
      };
    }
    const params: Record<string, string> = { limit: String(limit), modified_since: since ?? new Date(Date.now() - 7 * 86400000).toISOString() };
    const data = await this.otxRequest<{ results: Array<Record<string, unknown>>; count: number }>("/pulses/subscribed", params);
    return {
      totalPulses: data.count ?? 0, recentPulses: (data.results ?? []).map(p => this.mapPulse(p)),
      industriesSummary: [], tacticsDistribution: [],
    };
  }

  private mapPulse(p: Record<string, unknown>): OTXPulse {
    return {
      id: String(p["id"] ?? ""), name: String(p["name"] ?? ""), description: String(p["description"] ?? ""),
      author: String((p["author"] as Record<string, unknown>)?.["username"] ?? p["author_name"] ?? ""),
      created: String(p["created"] ?? ""), modified: String(p["modified"] ?? ""),
      tlp: String(p["tlp"] ?? "white"), tags: Array.isArray(p["tags"]) ? p["tags"] as string[] : [],
      industries: Array.isArray(p["industries"]) ? p["industries"] as string[] : [],
      targetedCountries: Array.isArray(p["targeted_countries"]) ? p["targeted_countries"] as string[] : [],
      malwareFamilies: Array.isArray(p["malware_families"]) ? (p["malware_families"] as Array<Record<string, string>>).map(m => m["display_name"] ?? "") : [],
      attackIds: Array.isArray(p["attack_ids"]) ? p["attack_ids"] as Array<{ id: string; display_name: string }> : [],
      indicators: Number(p["indicator_count"] ?? 0),
      references: Array.isArray(p["references"]) ? p["references"] as string[] : [],
    };
  }

  getMockPulses(): OTXPulse[] { return MOCK_PULSES; }
}

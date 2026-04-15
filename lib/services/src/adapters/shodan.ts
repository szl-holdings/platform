import { ServiceAdapter } from "../base.js";

export interface ShodanHostInfo {
  ip: string;
  ipStr: string;
  org: string;
  isp: string;
  country: string;
  city: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  asn: string;
  ports: number[];
  hostnames: string[];
  domains: string[];
  tags: string[];
  vulns: string[];
  lastUpdate: string;
  services: Array<{
    port: number;
    protocol: string;
    banner: string;
    product: string | null;
    version: string | null;
    cpe: string[];
    vulns: string[];
  }>;
}

export interface ShodanSearchResult {
  total: number;
  matches: ShodanHostInfo[];
  facets: Record<string, Array<{ value: string; count: number }>>;
}

export interface ShodanExploit {
  id: string;
  description: string;
  author: string | null;
  type: string;
  platform: string;
  datePublished: string;
  cve: string[];
  cwe: string | null;
  verified: boolean;
}

const MOCK_HOST: ShodanHostInfo = {
  ip: "45.142.212.100", ipStr: "45.142.212.100", org: "REG.RU-AS",
  isp: "LLC Reg.Ru", country: "Russia", city: "Moscow", region: "Moscow City",
  latitude: 55.7522, longitude: 37.6156, asn: "AS197695",
  ports: [22, 80, 443, 3306, 6379],
  hostnames: [], domains: [],
  tags: ["self-signed", "eol-product"],
  vulns: ["CVE-2023-44487", "CVE-2022-26134"],
  lastUpdate: new Date().toISOString(),
  services: [
    { port: 22, protocol: "tcp", banner: "SSH-2.0-OpenSSH_7.4", product: "OpenSSH", version: "7.4", cpe: ["cpe:/a:openbsd:openssh:7.4"], vulns: ["CVE-2023-38408"] },
    { port: 80, protocol: "tcp", banner: "HTTP/1.1 200 OK\nServer: nginx/1.14.2", product: "nginx", version: "1.14.2", cpe: ["cpe:/a:nginx:nginx:1.14.2"], vulns: ["CVE-2019-20372"] },
    { port: 3306, protocol: "tcp", banner: "MySQL 5.6.49 Community Server", product: "MySQL", version: "5.6.49", cpe: ["cpe:/a:mysql:mysql:5.6.49"], vulns: ["CVE-2020-14765"] },
  ],
};

export class ShodanAdapter extends ServiceAdapter {
  readonly name = "shodan";
  readonly description =
    "Shodan — internet-wide host discovery, port scanning intelligence, vulnerability enumeration, banner grabbing, and attack surface mapping. Requires API key. Falls back to demo mode when SHODAN_API_KEY is absent.";
  readonly requiredEnvVars = ["SHODAN_API_KEY"];

  private get apiKey(): string | undefined { return process.env["SHODAN_API_KEY"]; }

  private readonly BASE_URL = "https://api.shodan.io";

  private async shodanRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    url.searchParams.set("key", this.apiKey!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Shodan API error: HTTP ${res.status} — ${path}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.shodanRequest("/api-info");
  }

  async getHostInfo(ip: string): Promise<ShodanHostInfo> {
    if (this.isDemoMode) return { ...MOCK_HOST, ip, ipStr: ip };
    const data = await this.shodanRequest<Record<string, unknown>>(`/shodan/host/${ip}`);
    const services = (data["data"] as Array<Record<string, unknown>> ?? []).map(s => ({
      port: Number(s["port"] ?? 0), protocol: String(s["transport"] ?? "tcp"),
      banner: String(s["data"] ?? ""), product: s["product"] ? String(s["product"]) : null,
      version: s["version"] ? String(s["version"]) : null,
      cpe: Array.isArray(s["cpe"]) ? (s["cpe"] as string[]) : [],
      vulns: s["vulns"] ? Object.keys(s["vulns"] as object) : [],
    }));
    return {
      ip, ipStr: ip, org: String(data["org"] ?? ""), isp: String(data["isp"] ?? ""),
      country: String(data["country_name"] ?? ""), city: data["city"] ? String(data["city"]) : null,
      region: data["region_code"] ? String(data["region_code"]) : null,
      latitude: Number(data["latitude"] ?? 0), longitude: Number(data["longitude"] ?? 0),
      asn: String(data["asn"] ?? ""), ports: Array.isArray(data["ports"]) ? data["ports"] as number[] : [],
      hostnames: Array.isArray(data["hostnames"]) ? data["hostnames"] as string[] : [],
      domains: Array.isArray(data["domains"]) ? data["domains"] as string[] : [],
      tags: Array.isArray(data["tags"]) ? data["tags"] as string[] : [],
      vulns: data["vulns"] ? Object.keys(data["vulns"] as object) : [],
      lastUpdate: String(data["last_update"] ?? ""), services,
    };
  }

  async search(query: string, limit = 20): Promise<ShodanSearchResult> {
    if (this.isDemoMode) {
      return { total: 1, matches: [MOCK_HOST], facets: {} };
    }
    const data = await this.shodanRequest<{ total: number; matches: Array<Record<string, unknown>> }>("/shodan/host/search", { query, limit: String(limit) });
    return {
      total: data.total ?? 0, facets: {},
      matches: (data.matches ?? []).map(m => ({
        ip: String(m["ip_str"] ?? ""), ipStr: String(m["ip_str"] ?? ""),
        org: String(m["org"] ?? ""), isp: String(m["isp"] ?? ""),
        country: String(m["country_name"] ?? ""), city: m["city"] ? String(m["city"]) : null,
        region: m["region_code"] ? String(m["region_code"]) : null,
        latitude: Number(m["latitude"] ?? 0), longitude: Number(m["longitude"] ?? 0),
        asn: String(m["asn"] ?? ""), ports: Array.isArray(m["ports"]) ? m["ports"] as number[] : [],
        hostnames: Array.isArray(m["hostnames"]) ? m["hostnames"] as string[] : [],
        domains: Array.isArray(m["domains"]) ? m["domains"] as string[] : [],
        tags: [], vulns: [], lastUpdate: String(m["timestamp"] ?? ""), services: [],
      })),
    };
  }

  async getExploits(query: string, limit = 10): Promise<ShodanExploit[]> {
    if (this.isDemoMode) {
      return [{ id: "edb-45621", description: `Remote Code Execution in ${query}`, author: "anonymous", type: "remote", platform: "linux", datePublished: "2024-08-15", cve: ["CVE-2024-1234"], cwe: "CWE-78", verified: true }];
    }
    const data = await this.shodanRequest<{ matches: Array<Record<string, unknown>> }>("/api/exploits/search", { query, size: String(limit) });
    return (data.matches ?? []).map(e => ({
      id: String(e["id"] ?? ""), description: String(e["description"] ?? ""),
      author: e["author"] ? String(e["author"]) : null, type: String(e["type"] ?? ""),
      platform: String(e["platform"] ?? ""), datePublished: String(e["date"] ?? ""),
      cve: Array.isArray(e["cve"]) ? e["cve"] as string[] : [],
      cwe: e["cwe"] ? String(e["cwe"]) : null, verified: Boolean(e["verified"]),
    }));
  }

  getMockHostInfo(): ShodanHostInfo { return MOCK_HOST; }
}

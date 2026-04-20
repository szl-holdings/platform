import { ServiceAdapter } from '../base.js';

export interface VTFileScan {
  sha256: string;
  sha1: string;
  md5: string;
  name: string;
  size: number;
  type: string;
  positives: number;
  total: number;
  permalink: string;
  scanDate: string;
  detectedEngines: Array<{ engine: string; result: string; category: string }>;
  firstSubmission: string;
  lastSubmission: string;
  timesSubmitted: number;
  reputation: number;
}

export interface VTUrlScan {
  url: string;
  positives: number;
  total: number;
  scanDate: string;
  permalink: string;
  categories: string[];
  malicious: boolean;
  reputation: number;
}

export interface VTIPReport {
  ip: string;
  country: string;
  asn: number;
  asOwner: string;
  reputation: number;
  positives: number;
  total: number;
  maliciousEngines: string[];
  lastAnalysisDate: string;
  whois: string | null;
  detectedUrls: Array<{ url: string; positives: number; total: number; scanDate: string }>;
  detectedCommunicatingSamples: number;
  network: string | null;
}

const MOCK_IP_REPORT: VTIPReport = {
  ip: '45.142.212.100',
  country: 'RU',
  asn: 197695,
  asOwner: 'REG.RU-AS',
  reputation: -42,
  positives: 8,
  total: 94,
  maliciousEngines: [
    'Forcepoint ThreatSeeker',
    'Webroot',
    'Kaspersky',
    'G-Data',
    'BitDefender',
    'ESET',
    'Avast',
    'Sophos',
  ],
  lastAnalysisDate: new Date().toISOString(),
  whois: 'inetnum: 45.142.212.0/24',
  detectedUrls: [
    { url: 'http://45.142.212.100/gate.php', positives: 12, total: 86, scanDate: '2026-03-28' },
    { url: 'http://45.142.212.100/login.php', positives: 7, total: 84, scanDate: '2026-02-14' },
  ],
  detectedCommunicatingSamples: 23,
  network: '45.142.212.0/24',
};

const MOCK_URL_SCAN: VTUrlScan = {
  url: 'https://phishing-example.com/login',
  positives: 6,
  total: 86,
  scanDate: new Date().toISOString(),
  permalink: 'https://www.virustotal.com/gui/url/abc123',
  categories: ['phishing', 'malware distribution'],
  malicious: true,
  reputation: -18,
};

export class VirusTotalAdapter extends ServiceAdapter {
  readonly name = 'virustotal';
  readonly description =
    'VirusTotal API — file hash scanning, URL reputation, IP/domain threat intelligence across 70+ antivirus engines. Requires API key. Falls back to demo mode when VIRUSTOTAL_API_KEY is absent.';
  readonly requiredEnvVars = ['VIRUSTOTAL_API_KEY'];

  private get apiKey(): string | undefined {
    return process.env['VIRUSTOTAL_API_KEY'];
  }

  private readonly BASE_URL = 'https://www.virustotal.com/api/v3';

  private async vtRequest<T>(path: string): Promise<T> {
    const res = await fetch(`${this.BASE_URL}${path}`, {
      headers: { 'x-apikey': this.apiKey!, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`VirusTotal API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.vtRequest('/urls/68b329da9893e34099c7d8ad5cb9c940');
  }

  async scanIPAddress(ip: string): Promise<VTIPReport> {
    if (this.isDemoMode) return { ...MOCK_IP_REPORT, ip };
    const data = await this.vtRequest<{ data: { attributes: Record<string, unknown> } }>(
      `/ip_addresses/${ip}`,
    );
    const attrs = data.data?.attributes ?? {};
    const stats = (attrs['last_analysis_stats'] as Record<string, number>) ?? {};
    const results =
      (attrs['last_analysis_results'] as Record<string, Record<string, string>>) ?? {};
    const maliciousEngines = Object.entries(results)
      .filter(([, v]) => v['category'] === 'malicious')
      .map(([engine]) => engine);
    return {
      ip,
      country: String(attrs['country'] ?? ''),
      asn: Number(attrs['asn'] ?? 0),
      asOwner: String(attrs['as_owner'] ?? ''),
      reputation: Number(attrs['reputation'] ?? 0),
      positives: stats['malicious'] ?? 0,
      total: Object.keys(results).length,
      maliciousEngines,
      lastAnalysisDate: String(attrs['last_analysis_date'] ?? ''),
      whois: attrs['whois'] ? String(attrs['whois']) : null,
      detectedUrls: [],
      detectedCommunicatingSamples: 0,
      network: null,
    };
  }

  async scanUrl(url: string): Promise<VTUrlScan> {
    if (this.isDemoMode) return { ...MOCK_URL_SCAN, url };
    const encoded = btoa(url).replace(/=/g, '');
    const data = await this.vtRequest<{ data: { attributes: Record<string, unknown> } }>(
      `/urls/${encoded}`,
    );
    const attrs = data.data?.attributes ?? {};
    const stats = (attrs['last_analysis_stats'] as Record<string, number>) ?? {};
    const categories = Object.values((attrs['categories'] as Record<string, string>) ?? {});
    return {
      url,
      positives: stats['malicious'] ?? 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      scanDate: String(attrs['last_analysis_date'] ?? ''),
      permalink: `https://www.virustotal.com/gui/url/${encoded}`,
      categories: [...new Set(categories)],
      malicious: (stats['malicious'] ?? 0) > 0,
      reputation: Number(attrs['reputation'] ?? 0),
    };
  }

  async scanHash(hash: string): Promise<Partial<VTFileScan>> {
    if (this.isDemoMode) {
      return {
        sha256: hash,
        positives: 0,
        total: 72,
        scanDate: new Date().toISOString(),
        name: 'unknown',
        reputation: 0,
      };
    }
    const data = await this.vtRequest<{ data: { attributes: Record<string, unknown> } }>(
      `/files/${hash}`,
    );
    const attrs = data.data?.attributes ?? {};
    const stats = (attrs['last_analysis_stats'] as Record<string, number>) ?? {};
    return {
      sha256: String(attrs['sha256'] ?? ''),
      sha1: String(attrs['sha1'] ?? ''),
      md5: String(attrs['md5'] ?? ''),
      name: String((attrs['meaningful_name'] as string) ?? ''),
      size: Number(attrs['size'] ?? 0),
      type: String(attrs['type_description'] ?? ''),
      positives: stats['malicious'] ?? 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      permalink: `https://www.virustotal.com/gui/file/${hash}`,
      scanDate: String(attrs['last_analysis_date'] ?? ''),
      reputation: Number(attrs['reputation'] ?? 0),
      firstSubmission: String(attrs['first_submission_date'] ?? ''),
      lastSubmission: String(attrs['last_submission_date'] ?? ''),
      timesSubmitted: Number(attrs['times_submitted'] ?? 0),
      detectedEngines: [],
    };
  }

  getMockIPReport(): VTIPReport {
    return MOCK_IP_REPORT;
  }
}

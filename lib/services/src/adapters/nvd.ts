import { ServiceAdapter } from "../base.js";

export class NVDAdapter extends ServiceAdapter {
  readonly name = "nvd";
  readonly description = "NIST National Vulnerability Database — CVE data, CVSS scores, and exploit status. Free, no key required.";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1&cvssV3Severity=CRITICAL",
      { signal: AbortSignal.timeout(12000), headers: { "User-Agent": "SZL/1.0" } },
    );
    if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);
    const json = await res.json() as any;
    if (!json.totalResults) throw new Error("NVD returned no results");
  }
}

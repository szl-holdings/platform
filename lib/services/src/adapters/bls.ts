import { ServiceAdapter } from "../base.js";

export class BLSAdapter extends ServiceAdapter {
  readonly name = "bls";
  readonly description = "Bureau of Labor Statistics Public API — US unemployment rate, CPI, payroll data. Free, no key required (limited).";
  readonly requiredEnvVars: string[] = [];

  protected override async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000",
      { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "SZL/1.0", Accept: "application/json" } },
    );
    if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
    const json = await res.json() as any;
    if (json.status !== "REQUEST_SUCCEEDED") throw new Error(`BLS status: ${json.status}`);
  }
}

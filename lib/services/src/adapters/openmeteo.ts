import { ServiceAdapter } from "../base.js";

export class OpenMeteoAdapter extends ServiceAdapter {
  readonly name = "openmeteo";
  readonly description = "Open-Meteo Marine & Weather API — Wave height, swell, ocean conditions. Free, no key required.";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://marine-api.open-meteo.com/v1/marine?latitude=24.5&longitude=56.3&current=wave_height&timezone=UTC",
      { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "SZL/1.0" } },
    );
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const json = await res.json() as any;
    if (!json.current) throw new Error("Open-Meteo returned no current data");
  }
}

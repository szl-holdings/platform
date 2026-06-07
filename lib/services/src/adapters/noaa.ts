import { ServiceAdapter } from '../base.js';

export class NOAAAdapter extends ServiceAdapter {
  readonly name = 'noaa';
  readonly description =
    'NOAA CO-OPS Station API — Live air temperature and wind data from coastal stations. Free, no key required.';
  readonly requiredEnvVars: string[] = [];

  protected override async performHealthCheck(): Promise<void> {
    const res = await fetch(
      'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=8638610&date=recent&product=air_temperature&time_zone=GMT&units=metric&application=SZL&format=json',
      { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'SZL/1.0' } },
    );
    if (!res.ok) throw new Error(`NOAA HTTP ${res.status}`);
    const json = (await res.json()) as any;
    if (json.error) throw new Error(json.error.message ?? 'NOAA error');
  }
}

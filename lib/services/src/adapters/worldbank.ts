import { ServiceAdapter } from '../base.js';

export class WorldBankAdapter extends ServiceAdapter {
  readonly name = 'worldbank';
  readonly description =
    'World Bank Open Data API — GDP growth, population, inflation and 14,000+ economic indicators. Free, no key required.';
  readonly requiredEnvVars: string[] = [];

  protected override async performHealthCheck(): Promise<void> {
    const res = await fetch(
      'https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.KD.ZG?mrv=1&format=json',
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'SZL/1.0' } },
    );
    if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);
    const json = (await res.json()) as any;
    const entries = json?.[1];
    if (!Array.isArray(entries) || entries.length === 0)
      throw new Error('World Bank returned no data');
  }
}

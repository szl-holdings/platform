import { ServiceAdapter } from '../base.js';

export class GDELTAdapter extends ServiceAdapter {
  readonly name = 'gdelt';
  readonly description =
    'GDELT Project — Global event monitoring, geopolitical signals, media analysis. Free, no key required.';
  readonly requiredEnvVars: string[] = [];

  protected override async performHealthCheck(): Promise<void> {
    const res = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=maritime+shipping&mode=artlist&format=json&maxrecords=1&sourcelang=eng',
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'SZL/1.0' } },
    );
    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    const json = (await res.json()) as any;
    if (!json.articles) throw new Error('GDELT returned no articles');
  }
}

import { ServiceAdapter } from '../base.js';

export class MITREAdapter extends ServiceAdapter {
  readonly name = 'mitre';
  readonly description =
    'MITRE ATT&CK Enterprise Matrix — Tactics, Techniques & Procedures (TTPs). Free, no key required. Hosted on GitHub.';
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json',
      { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'SZL/1.0' } },
    );
    if (!res.ok) throw new Error(`MITRE ATT&CK HTTP ${res.status}`);
    const json = (await res.json()) as any;
    const patterns = json?.objects?.filter((o: any) => o.type === 'attack-pattern');
    if (!Array.isArray(patterns) || patterns.length === 0)
      throw new Error('MITRE ATT&CK returned no techniques');
  }
}

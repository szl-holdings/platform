import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { logger } from '../../lib/logger';

export const cefExportConfigSchema = z.object({
  hecUrl: z.string().url().describe('Splunk HEC endpoint URL (e.g. https://splunk.example.com:8088/services/collector)'),
  hecToken: z.string().min(8).describe('Splunk HTTP Event Collector token'),
  index: z.string().default('main').describe('Splunk index to write events to'),
  sourceType: z.string().default('cef').describe('Splunk sourcetype for ingested events'),
  verifySsl: z.boolean().default(true).describe('Verify TLS certificate'),
});

export type CefExportConfig = z.infer<typeof cefExportConfigSchema>;

export interface SentraFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  source: string;
  asset?: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  detectedAt: string;
  rawPayload?: unknown;
}

const SEVERITY_MAP: Record<string, number> = {
  critical: 10,
  high: 8,
  medium: 5,
  low: 3,
  info: 1,
};

function escapeCef(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/=/g, '\\=');
}

export function toCef(finding: SentraFinding): string {
  const severity = SEVERITY_MAP[finding.severity] ?? 5;
  const timestamp = new Date(finding.detectedAt).getTime();

  const extensions = [
    `rt=${timestamp}`,
    `msg=${escapeCef(finding.description.slice(0, 500))}`,
    `src=${escapeCef(finding.source)}`,
    `cat=${escapeCef(finding.category)}`,
    finding.asset ? `dst=${escapeCef(finding.asset)}` : '',
    finding.mitreTactic ? `cs1=${escapeCef(finding.mitreTactic)} cs1Label=MitreTactic` : '',
    finding.mitreTechnique ? `cs2=${escapeCef(finding.mitreTechnique)} cs2Label=MitreTechnique` : '',
    `externalId=${finding.id}`,
  ]
    .filter(Boolean)
    .join(' ');

  return `CEF:0|SZL|Sentra|1.0|${finding.category}|${escapeCef(finding.title)}|${severity}|${extensions}`;
}

export async function exportToSplunkHec(
  config: CefExportConfig,
  findings: SentraFinding[],
): Promise<{ exported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let exported = 0;
  let failed = 0;

  for (const finding of findings) {
    try {
      const cefLine = toCef(finding);
      const event = {
        event: cefLine,
        sourcetype: config.sourceType,
        index: config.index,
        time: Math.floor(new Date(finding.detectedAt).getTime() / 1000),
      };

      const resp = await fetch(config.hecUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${config.hecToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (resp.ok) {
        exported++;
      } else {
        const body = await resp.text().catch(() => '');
        errors.push(`Finding ${finding.id}: Splunk HEC ${resp.status} — ${body.slice(0, 200)}`);
        failed++;
      }
    } catch (err) {
      errors.push(`Finding ${finding.id}: ${String(err)}`);
      failed++;
    }
  }

  logger.info({ exported, failed }, '[siem-export/cef] batch complete');
  return { exported, failed, errors };
}

export const cefExportAdapter = {
  id: 'splunk-cef' as const,
  displayName: 'Splunk CEF Export',
  description: 'Exports Sentra findings to Splunk via HTTP Event Collector in CEF format.',
  configSchema: cefExportConfigSchema,

  validate(config: Record<string, unknown>) {
    const result = cefExportConfigSchema.safeParse(config);
    if (!result.success) return { ok: false as const, errors: result.error.errors.map((e) => e.message) };
    return { ok: true as const };
  },

  async testConnection(config: Record<string, unknown>) {
    const parsed = cefExportConfigSchema.safeParse(config);
    if (!parsed.success) return { ok: false as const, error: parsed.error.errors[0]?.message ?? 'Invalid config' };
    try {
      const resp = await fetch(parsed.data.hecUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${parsed.data.hecToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: 'CEF:0|SZL|Sentra|1.0|test|Connection Test|1|msg=test' }),
      });
      if (!resp.ok) return { ok: false as const, error: `Splunk returned ${resp.status}` };
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: String(err) };
    }
  },

  async export(config: Record<string, unknown>, findings: SentraFinding[]) {
    const parsed = cefExportConfigSchema.parse(config);
    return exportToSplunkHec(parsed, findings);
  },
};

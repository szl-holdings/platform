import { z } from 'zod';
import { logger } from '../../lib/logger';
import type { SentraFinding } from './cef-export';

export const sentinelAsimConfigSchema = z.object({
  workspaceId: z.string().min(1).describe('Microsoft Sentinel Log Analytics Workspace ID'),
  sharedKey: z.string().min(1).describe('Log Analytics Workspace Primary or Secondary Key'),
  logType: z.string().default('SentraFindings').describe('Custom log type name in Sentinel'),
});

export type SentinelAsimConfig = z.infer<typeof sentinelAsimConfigSchema>;

const SEVERITY_MAP: Record<string, string> = {
  critical: 'High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
};

export function toAsim(finding: SentraFinding): Record<string, unknown> {
  return {
    TimeGenerated: finding.detectedAt,
    EventType: 'SecurityAlert',
    EventSeverity: SEVERITY_MAP[finding.severity] ?? 'Medium',
    EventProduct: 'Sentra',
    EventVendor: 'SZL Holdings',
    EventSchema: 'SecurityAlert',
    EventSchemaVersion: '0.1',
    AlertName: finding.title,
    AlertDescription: finding.description,
    AlertSeverity: SEVERITY_MAP[finding.severity] ?? 'Medium',
    AlertCategory: finding.category,
    AlertSource: finding.source,
    TargetHostname: finding.asset ?? '',
    ThreatCategory: finding.category,
    MitreTactic: finding.mitreTactic ?? '',
    MitreTechnique: finding.mitreTechnique ?? '',
    AdditionalFields: JSON.stringify(finding.rawPayload ?? {}),
    ExternalId: finding.id,
  };
}

async function buildSignature(
  date: string,
  contentLength: number,
  method: string,
  contentType: string,
  resource: string,
  sharedKey: string,
): Promise<string> {
  const stringToSign = `${method}\n${contentLength}\n${contentType}\nx-ms-date:${date}\n${resource}`;
  const { createHmac } = await import('node:crypto');
  const sig = createHmac('sha256', Buffer.from(sharedKey, 'base64'))
    .update(stringToSign, 'utf8')
    .digest('base64');
  return sig;
}

export async function exportToSentinel(
  config: SentinelAsimConfig,
  findings: SentraFinding[],
): Promise<{ exported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];

  if (findings.length === 0) return { exported: 0, failed: 0, errors: [] };

  const records = findings.map(toAsim);
  const body = JSON.stringify(records);
  const dateString = new Date().toUTCString();
  const contentType = 'application/json';
  const resource = '/api/logs';
  const url = `https://${config.workspaceId}.ods.opinsights.azure.com${resource}?api-version=2016-04-01`;

  try {
    const signature = await buildSignature(
      dateString,
      Buffer.byteLength(body),
      'POST',
      contentType,
      resource,
      config.sharedKey,
    );

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Log-Type': config.logType,
        'x-ms-date': dateString,
        'Authorization': `SharedKey ${config.workspaceId}:${signature}`,
        'time-generated-field': 'TimeGenerated',
      },
      body,
    });

    if (resp.ok || resp.status === 200) {
      logger.info({ count: findings.length }, '[siem-export/sentinel] batch exported');
      return { exported: findings.length, failed: 0, errors: [] };
    }

    const respBody = await resp.text().catch(() => '');
    errors.push(`Sentinel returned ${resp.status}: ${respBody.slice(0, 200)}`);
    return { exported: 0, failed: findings.length, errors };
  } catch (err) {
    errors.push(String(err));
    return { exported: 0, failed: findings.length, errors };
  }
}

export const sentinelAsimAdapter = {
  id: 'sentinel-asim' as const,
  displayName: 'Microsoft Sentinel ASIM Export',
  description: 'Exports Sentra findings to Microsoft Sentinel via Log Analytics Data Collector API in ASIM format.',
  configSchema: sentinelAsimConfigSchema,

  validate(config: Record<string, unknown>) {
    const result = sentinelAsimConfigSchema.safeParse(config);
    if (!result.success) return { ok: false as const, errors: result.error.errors.map((e) => e.message) };
    return { ok: true as const };
  },

  async testConnection(config: Record<string, unknown>) {
    const parsed = sentinelAsimConfigSchema.safeParse(config);
    if (!parsed.success) return { ok: false as const, error: parsed.error.errors[0]?.message ?? 'Invalid config' };
    return { ok: true as const };
  },

  async export(config: Record<string, unknown>, findings: SentraFinding[]) {
    const parsed = sentinelAsimConfigSchema.parse(config);
    return exportToSentinel(parsed, findings);
  },
};

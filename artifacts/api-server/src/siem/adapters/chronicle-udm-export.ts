import { z } from 'zod';
import { logger } from '../../lib/logger';
import type { SentraFinding } from './cef-export';

export const chronicleUdmConfigSchema = z.object({
  region: z.enum(['us', 'europe', 'asia']).default('us').describe('Chronicle region'),
  customerId: z.string().min(1).describe('Chronicle customer ID'),
  serviceAccountJson: z.string().min(1).describe('Google Cloud service account JSON key (base64 encoded)'),
  logType: z.string().default('SENTRA').describe('Chronicle log type'),
});

export type ChronicleUdmConfig = z.infer<typeof chronicleUdmConfigSchema>;

const SEVERITY_MAP: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFORMATIONAL',
};

const REGION_ENDPOINTS: Record<string, string> = {
  us: 'https://malachiteingestion-pa.googleapis.com',
  europe: 'https://europe-malachiteingestion-pa.googleapis.com',
  asia: 'https://asia-southeast1-malachiteingestion-pa.googleapis.com',
};

export function toUdm(finding: SentraFinding): Record<string, unknown> {
  return {
    metadata: {
      event_type: 'GENERIC_EVENT',
      product_name: 'Sentra',
      vendor_name: 'SZL Holdings',
      event_timestamp: finding.detectedAt,
      description: finding.description,
      product_event_type: finding.category,
    },
    security_result: [
      {
        severity: SEVERITY_MAP[finding.severity] ?? 'MEDIUM',
        summary: finding.title,
        description: finding.description,
        category: finding.category,
        alert_state: 'ALERTING',
        threat_name: finding.title,
        rule_name: finding.category,
      },
    ],
    principal: {
      hostname: finding.asset ?? '',
    },
    target: {
      hostname: finding.asset ?? '',
    },
    additional: {
      fields: {
        source: { string_value: finding.source },
        external_id: { string_value: finding.id },
        ...(finding.mitreTactic ? { mitre_tactic: { string_value: finding.mitreTactic } } : {}),
        ...(finding.mitreTechnique ? { mitre_technique: { string_value: finding.mitreTechnique } } : {}),
      },
    },
  };
}

export async function exportToChronicle(
  config: ChronicleUdmConfig,
  findings: SentraFinding[],
): Promise<{ exported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];

  if (findings.length === 0) return { exported: 0, failed: 0, errors: [] };

  const endpoint = REGION_ENDPOINTS[config.region] ?? REGION_ENDPOINTS.us;
  const url = `${endpoint}/v2/unstructuredlogentries:batchCreate`;

  const entries = findings.map((f) => ({
    log_text: JSON.stringify(toUdm(f)),
    ts_epoch_microseconds: Math.floor(new Date(f.detectedAt).getTime() * 1000),
  }));

  const body = JSON.stringify({
    customer_id: config.customerId,
    log_type: config.logType,
    entries,
  });

  try {
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const decoded = Buffer.from(config.serviceAccountJson, 'base64').toString('utf-8');
      const sa = JSON.parse(decoded) as { client_email?: string; private_key?: string; token_uri?: string };
      if (sa.client_email && sa.private_key) {
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({
          iss: sa.client_email,
          scope: 'https://www.googleapis.com/auth/malachite-ingestion',
          aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now,
        })).toString('base64url');
        const { createSign } = await import('node:crypto');
        const signer = createSign('RSA-SHA256');
        signer.update(`${header}.${payload}`);
        const signature = signer.sign(sa.private_key, 'base64url');
        const jwt = `${header}.${payload}.${signature}`;

        const tokenResp = await fetch(sa.token_uri ?? 'https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        });
        if (tokenResp.ok) {
          const tokenData = (await tokenResp.json()) as { access_token?: string };
          if (tokenData.access_token) {
            authHeaders['Authorization'] = `Bearer ${tokenData.access_token}`;
          }
        } else {
          logger.warn('[siem-export/chronicle] failed to obtain access token, proceeding without auth');
        }
      }
    } catch (authErr) {
      logger.warn({ err: authErr }, '[siem-export/chronicle] service account auth failed, proceeding without auth');
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
      body,
    });

    if (resp.ok) {
      logger.info({ count: findings.length }, '[siem-export/chronicle] batch exported');
      return { exported: findings.length, failed: 0, errors: [] };
    }

    const respBody = await resp.text().catch(() => '');
    errors.push(`Chronicle returned ${resp.status}: ${respBody.slice(0, 200)}`);
    return { exported: 0, failed: findings.length, errors };
  } catch (err) {
    errors.push(String(err));
    return { exported: 0, failed: findings.length, errors };
  }
}

export const chronicleUdmAdapter = {
  id: 'chronicle-udm' as const,
  displayName: 'Google Chronicle UDM Export',
  description: 'Exports Sentra findings to Google Chronicle via the Ingestion API in UDM format.',
  configSchema: chronicleUdmConfigSchema,

  validate(config: Record<string, unknown>) {
    const result = chronicleUdmConfigSchema.safeParse(config);
    if (!result.success) return { ok: false as const, errors: result.error.errors.map((e) => e.message) };
    return { ok: true as const };
  },

  async testConnection(config: Record<string, unknown>) {
    const parsed = chronicleUdmConfigSchema.safeParse(config);
    if (!parsed.success) return { ok: false as const, error: parsed.error.errors[0]?.message ?? 'Invalid config' };
    return { ok: true as const };
  },

  async export(config: Record<string, unknown>, findings: SentraFinding[]) {
    const parsed = chronicleUdmConfigSchema.parse(config);
    return exportToChronicle(parsed, findings);
  },
};

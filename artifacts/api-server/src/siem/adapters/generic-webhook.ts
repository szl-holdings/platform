import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { SiemAdapter, SiemConnectionConfig, NormalizedAlert } from '../adapter-interface';

const configSchema = z.object({
  hmacSecret: z
    .string()
    .min(8)
    .describe('HMAC-SHA256 secret used to verify incoming webhook signatures'),
  signatureHeader: z
    .string()
    .default('X-Signature-SHA256')
    .describe('HTTP header containing the signature'),
  severityField: z
    .string()
    .default('severity')
    .describe('JSON field path mapping to alert severity'),
});

export type GenericWebhookConfig = z.infer<typeof configSchema>;

export function verifyWebhookSignature(
  body: Buffer | string,
  secret: string,
  signature: string,
): boolean {
  const raw = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const expectedBuf = Buffer.from(`sha256=${expected}`, 'utf8');
  const sigBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}

export function normalizeWebhookPayload(
  payload: unknown,
  connectionId: string,
  connectionName: string,
): NormalizedAlert {
  const p = (payload ?? {}) as Record<string, unknown>;
  const severityRaw = String(p.severity ?? p.level ?? p.priority ?? 'medium').toLowerCase();
  const severityMap: Record<string, NormalizedAlert['severity']> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    warn: 'medium',
    warning: 'medium',
    info: 'low',
  };
  const severity: NormalizedAlert['severity'] = severityMap[severityRaw] ?? 'medium';

  return {
    id: `siem-wh-${connectionId}-${randomUUID().slice(0, 8)}`,
    title: String(p.title ?? p.name ?? p.alert ?? p.message ?? 'Webhook Alert'),
    severity,
    source: `webhook · ${connectionName}`,
    description: String(p.description ?? p.details ?? p.body ?? JSON.stringify(p).slice(0, 200)),
    asset: p.host
      ? String(p.host)
      : p.asset
        ? String(p.asset)
        : p.hostname
          ? String(p.hostname)
          : undefined,
    rawPayload: p,
    detectedAt: String(p.timestamp ?? p.time ?? p.detectedAt ?? new Date().toISOString()),
  };
}

const genericWebhookAdapter: SiemAdapter = {
  id: 'generic-webhook',
  displayName: 'Generic Webhook',
  description:
    'Receives JSON alerts pushed from any SIEM via HTTP POST with optional HMAC-SHA256 verification.',
  configSchema,

  validate(config: SiemConnectionConfig) {
    const result = configSchema.safeParse(config);
    if (!result.success) {
      return { ok: false, errors: result.error.errors.map((e) => e.message) };
    }
    return { ok: true };
  },

  async testConnection(config: SiemConnectionConfig) {
    const result = configSchema.safeParse(config);
    if (!result.success) {
      return { ok: false, error: 'Invalid configuration: ' + result.error.errors[0]?.message };
    }
    const sample: NormalizedAlert = normalizeWebhookPayload(
      {
        title: 'Test — Webhook Connection Verified',
        severity: 'low',
        description:
          'This is a synthetic test event confirming the webhook configuration is valid.',
        timestamp: new Date().toISOString(),
      },
      'test',
      'test-connection',
    );
    return { ok: true, sample: [sample] };
  },

  start(
    _connectionId: string,
    _config: SiemConnectionConfig,
    _onAlert: (a: NormalizedAlert) => void,
  ) {
    // Webhook adapters are inbound-push; the ingest route calls onAlert directly
  },

  stop(_connectionId: string) {
    // Nothing to tear down for webhook adapter
  },
};

export default genericWebhookAdapter;

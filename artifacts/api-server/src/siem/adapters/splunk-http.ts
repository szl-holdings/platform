import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { logger } from '../../lib/logger';
import type { SiemAdapter, SiemConnectionConfig, NormalizedAlert } from '../adapter-interface';

const configSchema = z.object({
  baseUrl: z.string().url().describe('Splunk instance base URL (e.g. https://splunk.example.com:8089)'),
  token: z.string().min(8).describe('Splunk bearer token (HEC or saved-search token)'),
  savedSearch: z.string().default('notable').describe('Name of the saved search or notable event index to poll'),
  pollingIntervalSeconds: z.coerce.number().int().min(30).max(3600).default(60).describe('How often to poll for new results (seconds)'),
  maxResults: z.coerce.number().int().min(1).max(100).default(10).describe('Maximum results per poll'),
  verifySsl: z.boolean().default(true).describe('Verify TLS certificate on Splunk server'),
});

export type SplunkHttpConfig = z.infer<typeof configSchema>;

const activePollers: Map<string, ReturnType<typeof setInterval>> = new Map();

function normalizeSplunkEvent(
  event: unknown,
  connectionId: string,
  connectionName: string,
): NormalizedAlert {
  const e = (event ?? {}) as Record<string, unknown>;
  const urgencyMap: Record<string, NormalizedAlert['severity']> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    informational: 'low',
  };
  const raw = String(e.urgency ?? e.severity ?? e.risk_score ?? 'medium').toLowerCase();
  const severity: NormalizedAlert['severity'] = urgencyMap[raw] ?? 'medium';

  return {
    id: `siem-splunk-${connectionId}-${randomUUID().slice(0, 8)}`,
    title: String(e.rule_name ?? e.title ?? e.name ?? e._raw ?? 'Splunk Alert'),
    severity,
    source: `splunk · ${connectionName}`,
    description: String(e.description ?? e.rule_description ?? e._raw ?? JSON.stringify(e).slice(0, 200)),
    asset: e.dest ? String(e.dest) : e.src ? String(e.src) : undefined,
    rawPayload: e,
    detectedAt: String(e.event_time ?? e._time ?? new Date().toISOString()),
  };
}

async function pollSplunk(
  connectionId: string,
  connectionName: string,
  config: SplunkHttpConfig,
  onAlert: (alert: NormalizedAlert) => void,
): Promise<void> {
  try {
    const url = `${config.baseUrl}/servicesNS/admin/search/saved/searches/${encodeURIComponent(config.savedSearch)}/history?output_mode=json&count=${config.maxResults}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      logger.warn({ connectionId, status: response.status }, '[siem/splunk] poll failed');
      return;
    }
    const body = (await response.json()) as { entry?: Array<{ content?: unknown }> };
    const entries = body.entry ?? [];
    for (const entry of entries) {
      const alert = normalizeSplunkEvent(entry.content ?? entry, connectionId, connectionName);
      onAlert(alert);
    }
  } catch (err) {
    logger.warn({ connectionId, err }, '[siem/splunk] poll error');
  }
}

const splunkHttpAdapter: SiemAdapter = {
  id: 'splunk-http',
  displayName: 'Splunk HTTP Poller',
  description: 'Polls a Splunk saved-search endpoint on a configurable interval using a bearer token.',
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
    const parsed = result.data;
    try {
      const url = `${parsed.baseUrl}/services/authentication/current-context?output_mode=json`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${parsed.token}` },
      });
      if (!response.ok) {
        return { ok: false, error: `Splunk returned ${response.status} — check URL and token` };
      }
      const sample: NormalizedAlert = normalizeSplunkEvent(
        {
          rule_name: 'Test — Splunk Connection Verified',
          urgency: 'low',
          description: 'Synthetic test confirming Splunk connectivity.',
          _time: new Date().toISOString(),
        },
        'test',
        'test-connection',
      );
      return { ok: true, sample: [sample] };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' };
    }
  },

  start(
    connectionId: string,
    config: SiemConnectionConfig,
    onAlert: (alert: NormalizedAlert) => void,
  ) {
    const result = configSchema.safeParse(config);
    if (!result.success) return;
    const parsed = result.data;
    const connectionName = String(config.connectionName ?? connectionId);

    // Guard against duplicate pollers if start() is called while already running
    const existing = activePollers.get(connectionId);
    if (existing) {
      clearInterval(existing);
      activePollers.delete(connectionId);
    }

    const interval = setInterval(() => {
      void pollSplunk(connectionId, connectionName, parsed, onAlert);
    }, parsed.pollingIntervalSeconds * 1000);

    activePollers.set(connectionId, interval);
    void pollSplunk(connectionId, connectionName, parsed, onAlert);
  },

  stop(connectionId: string) {
    const interval = activePollers.get(connectionId);
    if (interval) {
      clearInterval(interval);
      activePollers.delete(connectionId);
    }
  },
};

export default splunkHttpAdapter;

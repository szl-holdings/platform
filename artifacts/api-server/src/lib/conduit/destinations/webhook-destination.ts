import type { DestinationConnector, ConnectionCheckResult, ObjectDescriptor, FieldDescriptor, WriteBatchResult } from '../connector-protocol';
import * as dns from 'dns';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '::1',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
]);

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('127.')) return true;
  if (ip === '0.0.0.0') return true;
  if (ip.startsWith('169.254.')) return true;
  if (ip.startsWith('::1') || ip === '::') return true;
  if (ip.toLowerCase().startsWith('fe80:')) return true;
  if (ip.toLowerCase().startsWith('fd')) return true;
  if (ip.toLowerCase().startsWith('fc')) return true;

  const parts = ip.split('.');
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 100 && second >= 64 && second <= 127) return true;
  }
  return false;
}

async function resolveAndValidateHost(hostname: string): Promise<void> {
  const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Webhook URL must not target private/internal networks');
    }
    return;
  }

  const addresses: string[] = [];
  let resolveError: Error | null = null;
  try {
    const ipv4 = await dns.promises.resolve4(hostname);
    addresses.push(...ipv4);
  } catch (err) {
    resolveError = err instanceof Error ? err : new Error(String(err));
  }
  try {
    const ipv6 = await dns.promises.resolve6(hostname);
    addresses.push(...ipv6);
  } catch { /* no AAAA records is ok if we have A records */ }

  if (addresses.length === 0) {
    throw new Error(`Webhook URL hostname could not be resolved: ${hostname}${resolveError ? ` (${resolveError.message})` : ''}`);
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error(`Webhook URL resolves to a private/internal IP address`);
    }
  }
}

async function validateWebhookUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Webhook URL must use HTTP or HTTPS');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error(`Webhook URL hostname is not allowed: ${hostname}`);
  }

  if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error(`Webhook URL must not target internal domains`);
  }

  await resolveAndValidateHost(hostname);
}

async function httpRequest(url: string, method: string, body?: unknown, headers?: Record<string, string>): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Conduit-SyncEngine/1.0',
        ...headers,
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timeout);
    let responseBody: unknown;
    try { responseBody = await res.json(); } catch { responseBody = await res.text().catch(() => ''); }
    return { status: res.status, body: responseBody };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function fetchWithRetry(
  url: string,
  method: string,
  body: unknown,
  headers?: Record<string, string>,
  maxRetries = 3,
): Promise<{ status: number; body: unknown }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await httpRequest(url, method, body, headers);
      if (result.status === 429 || result.status >= 500) {
        if (attempt < maxRetries) {
          const backoff = Math.min(1000 * Math.pow(2, attempt), 16000);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
      }
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 16000);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  throw lastError ?? new Error('Request failed after retries');
}

function rateDelayMs(rps: number): number {
  return Math.ceil(1000 / rps);
}

export const webhookDestination: DestinationConnector = {
  type: 'webhook',
  maxRequestsPerSecond: 50,

  async checkConnection(credentials: Record<string, unknown>): Promise<ConnectionCheckResult> {
    const url = (credentials.apiKey as string) || (credentials.url as string) || '';
    if (!url) return { success: false, message: 'Webhook URL is required', latencyMs: 0 };
    const start = Date.now();
    try {
      await validateWebhookUrl(url);
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Invalid URL', latencyMs: Date.now() - start };
    }
    try {
      let result: { status: number };
      try {
        result = await httpRequest(url, 'OPTIONS');
      } catch {
        result = await httpRequest(url, 'HEAD');
      }
      const latencyMs = Date.now() - start;
      if (result.status < 500) {
        return { success: true, message: `Webhook endpoint reachable (HTTP ${result.status})`, latencyMs };
      }
      return { success: false, message: `Webhook returned HTTP ${result.status}`, latencyMs };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Connection failed', latencyMs: Date.now() - start };
    }
  },

  async discover(credentials: Record<string, unknown>): Promise<{ objects: ObjectDescriptor[]; fields: Record<string, FieldDescriptor[]> }> {
    const payloadFields = credentials.payloadFields as Array<{ name: string; label?: string; type?: string }> | undefined;
    const fields: FieldDescriptor[] = payloadFields && payloadFields.length > 0
      ? payloadFields.map(f => ({
          name: f.name,
          label: f.label || f.name,
          type: f.type || 'string',
          required: false,
          updateable: true,
        }))
      : [
          { name: 'data', label: 'Payload Data', type: 'json', required: false, updateable: true },
        ];

    return {
      objects: [
        { name: 'payload', label: 'Webhook Payload', description: 'HTTP POST payload to your webhook URL' },
      ],
      fields: {
        payload: fields,
      },
    };
  },

  async writeBatch(credentials: Record<string, unknown>, _objectType: string, records: Array<Record<string, unknown>>): Promise<WriteBatchResult> {
    const url = (credentials.apiKey as string) || (credentials.url as string) || '';
    await validateWebhookUrl(url);

    const authHeader = credentials.authHeader as string | undefined;
    const batchMode = credentials.batchMode as boolean | undefined;
    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const delayMs = rateDelayMs(this.maxRequestsPerSecond ?? 50);

    if (batchMode) {
      try {
        const result = await fetchWithRetry(url, 'POST', records, headers);
        const success = result.status >= 200 && result.status < 300;
        return {
          rowResults: records.map((_, i) => ({
            rowIndex: i,
            success,
            errorMessage: success ? undefined : `HTTP ${result.status}`,
            responseData: { status: result.status },
          })),
          successCount: success ? records.length : 0,
          failureCount: success ? 0 : records.length,
        };
      } catch (err) {
        return {
          rowResults: records.map((_, i) => ({
            rowIndex: i,
            success: false,
            errorMessage: err instanceof Error ? err.message : 'Request failed',
          })),
          successCount: 0,
          failureCount: records.length,
        };
      }
    }

    const rowResults = [];
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < records.length; i++) {
      if (i > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
      try {
        const result = await fetchWithRetry(url, 'POST', records[i], headers);
        const success = result.status >= 200 && result.status < 300;
        rowResults.push({
          rowIndex: i,
          success,
          errorMessage: success ? undefined : `HTTP ${result.status}`,
          responseData: { status: result.status, body: result.body },
        });
        if (success) successCount++; else failureCount++;
      } catch (err) {
        rowResults.push({
          rowIndex: i,
          success: false,
          errorMessage: err instanceof Error ? err.message : 'Request failed',
        });
        failureCount++;
      }
    }
    return { rowResults, successCount, failureCount };
  },
};

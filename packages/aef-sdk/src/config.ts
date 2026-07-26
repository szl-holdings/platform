export interface AefClientConfig {
  gatewayUrl: string;
  apiKey: string;
  tenantId: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  traceHeaderName?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;

function getEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val) return val;
  }
  const viteEnv = (
    import.meta as ImportMeta & {
      readonly env?: Readonly<Record<string, string | undefined>>;
    }
  ).env;
  if (viteEnv) {
    const viteKey = `VITE_${key}`;
    return viteEnv[viteKey] ?? viteEnv[key] ?? '';
  }
  return '';
}

export function resolveConfig(overrides: Partial<AefClientConfig> = {}): AefClientConfig {
  const gatewayUrl = overrides.gatewayUrl ?? getEnv('AEF_GATEWAY_URL');
  const apiKey = overrides.apiKey ?? getEnv('AEF_API_KEY');
  const tenantId = overrides.tenantId ?? (getEnv('AEF_TENANT_ID') || 'szl-holdings');

  if (!gatewayUrl) {
    throw new Error(
      'AEF SDK: gatewayUrl is required. Set AEF_GATEWAY_URL (server) or VITE_AEF_GATEWAY_URL (browser) in your environment. See docs/aef/RUNBOOK.md.',
    );
  }
  if (!apiKey) {
    throw new Error(
      'AEF SDK: apiKey is required. Set AEF_API_KEY (server) or VITE_AEF_API_KEY (browser) in your environment. See docs/aef/RUNBOOK.md.',
    );
  }

  return {
    gatewayUrl: gatewayUrl.replace(/\/$/, ''),
    apiKey,
    tenantId,
    timeoutMs: overrides.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: overrides.maxRetries ?? DEFAULT_MAX_RETRIES,
    retryDelayMs: overrides.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
    traceHeaderName: overrides.traceHeaderName ?? 'x-trace-id',
  };
}

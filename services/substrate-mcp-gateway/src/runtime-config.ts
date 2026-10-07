const SIGNING_KEY_PATTERN = /^[0-9a-f]{64}$/i;
const VALID_RUNTIME_MODES = new Set(['local-dev', 'internal-preview', 'demo', 'production']);

export function isProductionRuntime(): boolean {
  const runtimeMode = process.env.RUNTIME_MODE?.trim().toLowerCase();
  if (runtimeMode && !VALID_RUNTIME_MODES.has(runtimeMode)) {
    throw new Error('RUNTIME_MODE must be one of local-dev, internal-preview, demo, production');
  }
  return [
    process.env.RUNTIME_MODE,
    process.env.NODE_ENV,
    process.env.APP_ENV,
    process.env.SZL_ENV,
    process.env.SUBSTRATE_PYTHON_WORKER_ENV,
  ].some((value) => ['prod', 'production'].includes(value?.trim().toLowerCase() ?? ''));
}

export function getExecutionCapabilityStatus(): {
  ready: boolean;
  mutationAllowed: boolean;
  status: 'held' | 'development-simulation';
  qualifiedAdapters: false;
  durableRunStore: false;
  reason: string;
} {
  const production = isProductionRuntime();
  return {
    ready: !production,
    mutationAllowed: !production,
    status: production ? 'held' : 'development-simulation',
    qualifiedAdapters: false,
    durableRunStore: false,
    reason: production
      ? 'Production execution is held: only no-op development adapters and an in-process run store are available.'
      : 'Execution uses development/simulation adapters and must not be treated as production evidence.',
  };
}

export function getGatewayApiKey(): string | undefined {
  return process.env.SUBSTRATE_GATEWAY_API_KEY?.trim() || undefined;
}

export function getGatewayTenantId(): string | undefined {
  return process.env.SUBSTRATE_GATEWAY_TENANT_ID?.trim() || undefined;
}

export function getSubstrateSigningKey(): string | undefined {
  return process.env.SUBSTRATE_SIGNING_KEY?.trim() || undefined;
}

export function assertProductionGatewayConfig(): void {
  if (!isProductionRuntime()) return;

  if (!getGatewayApiKey()) {
    throw new Error('SUBSTRATE_GATEWAY_API_KEY is required in production and must not be blank');
  }

  if (!getGatewayTenantId()) {
    throw new Error('SUBSTRATE_GATEWAY_TENANT_ID is required in production and must not be blank');
  }

  const signingKey = getSubstrateSigningKey();
  if (!signingKey) {
    throw new Error('SUBSTRATE_SIGNING_KEY is required in production and must not be blank');
  }
  if (!SIGNING_KEY_PATTERN.test(signingKey)) {
    throw new Error('SUBSTRATE_SIGNING_KEY must be exactly 64 hexadecimal characters (32 bytes)');
  }
}

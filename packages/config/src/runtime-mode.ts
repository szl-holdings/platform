/**
 * Runtime Mode — SZL Holdings Platform
 *
 * Defines the formal runtime mode model and environment-based feature flags
 * for demo/mock behavior gating. This is the canonical source of truth for
 * what changes across execution contexts.
 *
 * Mode resolution order:
 *   RUNTIME_MODE env var (explicit override)
 *   → APP_ENV + NODE_ENV (derived)
 *   → fallback: local-dev
 *
 * Usage (server-side):
 *   import { getRuntimeMode, isProductionMode, isDemoMode } from "@szl-holdings/config/runtime-mode";
 *
 * Usage (client-side Vite):
 *   import { getClientRuntimeMode, clientFlags } from "@szl-holdings/config/runtime-mode";
 */

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

export const RUNTIME_MODES = [
  'local-dev',
  'internal-preview',
  'sandbox',
  'demo',
  'production',
] as const;
export type RuntimeMode = (typeof RUNTIME_MODES)[number];

/**
 * Characterizes what is true in each runtime mode.
 * These are the axes that change across modes — each module consults these
 * to decide whether to serve real data, mock data, or a "not activated" state.
 */
export interface RuntimeModeProfile {
  mode: RuntimeMode;
  label: string;
  auth: 'full' | 'dev-oidc' | 'bypass-allowed';
  allowSeedData: boolean;
  allowConnectorFallback: boolean;
  allowAiFallback: boolean;
  billingActive: boolean;
  notificationsActive: boolean;
  analyticsActive: boolean;
  verboseErrors: boolean;
  destructiveOpsAllowed: boolean;
  requireDemoLabels: boolean;
}

export const RUNTIME_MODE_PROFILES: Record<RuntimeMode, RuntimeModeProfile> = {
  sandbox: {
    mode: 'sandbox',
    label: 'Sandbox',
    auth: 'dev-oidc',
    allowSeedData: true,
    allowConnectorFallback: true,
    allowAiFallback: true,
    billingActive: false,
    notificationsActive: false,
    analyticsActive: true,
    verboseErrors: true,
    destructiveOpsAllowed: true,
    requireDemoLabels: true,
  },
  'local-dev': {
    mode: 'local-dev',
    label: 'Local Dev',
    auth: 'dev-oidc',
    allowSeedData: true,
    allowConnectorFallback: true,
    allowAiFallback: true,
    billingActive: false,
    notificationsActive: false,
    analyticsActive: false,
    verboseErrors: true,
    destructiveOpsAllowed: true,
    requireDemoLabels: false,
  },
  'internal-preview': {
    mode: 'internal-preview',
    label: 'Internal Preview',
    auth: 'dev-oidc',
    allowSeedData: true,
    allowConnectorFallback: true,
    allowAiFallback: true,
    billingActive: false,
    notificationsActive: false,
    analyticsActive: true,
    verboseErrors: true,
    destructiveOpsAllowed: false,
    requireDemoLabels: true,
  },
  demo: {
    mode: 'demo',
    label: 'Demo',
    auth: 'dev-oidc',
    allowSeedData: true,
    allowConnectorFallback: true,
    allowAiFallback: true,
    billingActive: false,
    notificationsActive: false,
    analyticsActive: true,
    verboseErrors: false,
    destructiveOpsAllowed: false,
    requireDemoLabels: true,
  },
  production: {
    mode: 'production',
    label: 'Production',
    auth: 'full',
    allowSeedData: false,
    allowConnectorFallback: false,
    allowAiFallback: false,
    billingActive: true,
    notificationsActive: true,
    analyticsActive: true,
    verboseErrors: false,
    destructiveOpsAllowed: true,
    requireDemoLabels: false,
  },
};

// ---------------------------------------------------------------------------
// Mode resolution (server-side — reads process.env)
// ---------------------------------------------------------------------------

export function resolveRuntimeMode(): RuntimeMode {
  const explicit = process.env.RUNTIME_MODE;
  if (explicit) {
    if (!RUNTIME_MODES.includes(explicit as RuntimeMode)) {
      const msg =
        `[runtime-mode] Invalid RUNTIME_MODE value: "${explicit}". ` +
        `Valid values: ${RUNTIME_MODES.join(', ')}. ` +
        `Unset RUNTIME_MODE or correct it to a valid value before starting the server.`;
      throw new Error(msg);
    }
    return explicit as RuntimeMode;
  }

  const appMode = (process.env.APP_MODE ?? '').toLowerCase().trim();
  if (appMode === 'demo') return 'demo';
  if (appMode === 'sandbox') return 'sandbox';
  if (appMode === 'production') return 'production';

  const demoMode = process.env.DEMO_MODE;
  if (demoMode === 'true' || demoMode === '1') {
    return 'demo';
  }

  const enableDemoSeed = process.env.ENABLE_DEMO_SEED;
  if (enableDemoSeed === 'true' || enableDemoSeed === '1') {
    return 'demo';
  }

  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV;

  if (appEnv === 'demo') return 'demo';
  if (appEnv === 'sandbox') return 'sandbox';
  if (appEnv === 'production' || nodeEnv === 'production') return 'production';
  if (appEnv === 'staging' || appEnv === 'internal-preview') return 'internal-preview';

  return 'local-dev';
}

export function getRuntimeModeProfile(): RuntimeModeProfile {
  return RUNTIME_MODE_PROFILES[resolveRuntimeMode()];
}

export function getRuntimeMode(): RuntimeMode {
  return resolveRuntimeMode();
}

// ---------------------------------------------------------------------------
// Convenience predicates (server-side)
// ---------------------------------------------------------------------------

export function isProductionMode(): boolean {
  return resolveRuntimeMode() === 'production';
}

export function isDemoMode(): boolean {
  return resolveRuntimeMode() === 'demo';
}

export function isInternalPreviewMode(): boolean {
  return resolveRuntimeMode() === 'internal-preview';
}

export function isLocalDevMode(): boolean {
  return resolveRuntimeMode() === 'local-dev';
}

export function isSandboxMode(): boolean {
  return resolveRuntimeMode() === 'sandbox';
}

export function isSeedDataAllowed(): boolean {
  return getRuntimeModeProfile().allowSeedData;
}

export function isConnectorFallbackAllowed(): boolean {
  return getRuntimeModeProfile().allowConnectorFallback;
}

export function isBillingActive(): boolean {
  return getRuntimeModeProfile().billingActive;
}

export function areNotificationsActive(): boolean {
  return getRuntimeModeProfile().notificationsActive;
}

export function areVerboseErrorsEnabled(): boolean {
  return getRuntimeModeProfile().verboseErrors;
}

export function areDemoLabelsRequired(): boolean {
  return getRuntimeModeProfile().requireDemoLabels;
}

// ---------------------------------------------------------------------------
// Client-side mode resolution (Vite — reads import.meta.env)
// ---------------------------------------------------------------------------

export function getClientRuntimeMode(env: Record<string, string | undefined>): RuntimeMode {
  const explicit = env.VITE_RUNTIME_MODE ?? env.VITE_APP_MODE;
  if (explicit) {
    if (!RUNTIME_MODES.includes(explicit as RuntimeMode)) {
    } else {
      return explicit as RuntimeMode;
    }
  }

  const demoMode = env.VITE_DEMO_MODE;
  if (demoMode === 'true' || demoMode === '1') {
    return 'demo';
  }

  const appEnv = env.VITE_APP_ENV;
  const mode = env.MODE;

  if (appEnv === 'demo') return 'demo';
  if (appEnv === 'sandbox') return 'sandbox';
  if (appEnv === 'production' || mode === 'production') return 'production';
  if (appEnv === 'staging' || appEnv === 'internal-preview') return 'internal-preview';

  return 'local-dev';
}

export function getClientRuntimeModeProfile(
  env: Record<string, string | undefined>,
): RuntimeModeProfile {
  return RUNTIME_MODE_PROFILES[getClientRuntimeMode(env)];
}

// ---------------------------------------------------------------------------
// Connector activation helpers
// ---------------------------------------------------------------------------

export interface ConnectorStatus {
  active: boolean;
  reason: 'live' | 'mock-fallback' | 'not-activated';
  label: string;
}

export function resolveConnectorStatus(
  _connectorName: string,
  credentialKeys: string[],
  envGetter: (key: string) => string | undefined = (k) => process.env[k],
): ConnectorStatus {
  const hasAllKeys = credentialKeys.every((k) => {
    const val = envGetter(k);
    return val !== undefined && val.trim() !== '';
  });

  if (hasAllKeys) {
    return { active: true, reason: 'live', label: 'Live' };
  }

  const profile = getRuntimeModeProfile();

  if (profile.allowConnectorFallback) {
    return {
      active: false,
      reason: 'mock-fallback',
      label: 'Demo',
    };
  }

  return {
    active: false,
    reason: 'not-activated',
    label: 'Not Activated',
  };
}

// ---------------------------------------------------------------------------
// Assertions for production safety
// ---------------------------------------------------------------------------

export function assertNotProductionOrThrow(context: string): void {
  if (isProductionMode()) {
    throw new Error(
      `[runtime-mode] Attempted to serve mock/seed data in production mode — context: ${context}. ` +
        `Check your code path: mock data must be gated behind isSeedDataAllowed() or isDemoMode().`,
    );
  }
}

export function assertNotificationsAllowedOrThrow(context: string): void {
  if (!areNotificationsActive()) {
    throw new Error(
      `[runtime-mode] External notifications are suppressed in ${getRuntimeMode()} mode — context: ${context}. ` +
        `Check areNotificationsActive() before sending.`,
    );
  }
}

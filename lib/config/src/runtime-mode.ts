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
  /** Human-readable label for UI display (e.g., "Demo" badge) */
  label: string;
  /** Auth enforcement level */
  auth: 'full' | 'dev-oidc' | 'bypass-allowed';
  /** Whether seeded/demo data may be served instead of live DB records */
  allowSeedData: boolean;
  /** Whether connector adapters may fall back to mock responses when keys are absent */
  allowConnectorFallback: boolean;
  /** Whether AI providers may fall back to a Replit proxy or stub responses */
  allowAiFallback: boolean;
  /** Whether Stripe billing flows are active */
  billingActive: boolean;
  /** Whether external notifications (Slack, email, Twilio, Teams) are sent */
  notificationsActive: boolean;
  /** Whether PostHog/analytics events are emitted to the live endpoint */
  analyticsActive: boolean;
  /** Whether full stack traces are surfaced in API error responses */
  verboseErrors: boolean;
  /** Whether destructive operations (delete, bulk-purge) are permitted */
  destructiveOpsAllowed: boolean;
  /** Whether demo/simulated labels must be shown in UI for non-live data */
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

/**
 * Resolves the current runtime mode from environment variables.
 *
 * Resolution order:
 * 1. RUNTIME_MODE — explicit override (must be a valid RuntimeMode value)
 * 2. DEMO_MODE=true — forces "demo"
 * 3. APP_ENV=demo — forces "demo"
 * 4. APP_ENV=production or NODE_ENV=production — "production"
 * 5. APP_ENV=staging or APP_ENV=internal-preview — "internal-preview"
 * 6. Default — "local-dev"
 */
export function resolveRuntimeMode(): RuntimeMode {
  const explicit = process.env['RUNTIME_MODE'];
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

  const appMode = (process.env['APP_MODE'] ?? '').toLowerCase().trim();
  if (appMode === 'demo') return 'demo';
  if (appMode === 'sandbox') return 'sandbox';
  if (appMode === 'production') return 'production';

  const demoMode = process.env['DEMO_MODE'];
  if (demoMode === 'true' || demoMode === '1') {
    return 'demo';
  }

  const enableDemoSeed = process.env['ENABLE_DEMO_SEED'];
  if (enableDemoSeed === 'true' || enableDemoSeed === '1') {
    return 'demo';
  }

  const appEnv = process.env['APP_ENV'];
  const nodeEnv = process.env['NODE_ENV'];

  if (appEnv === 'demo') return 'demo';
  if (appEnv === 'sandbox') return 'sandbox';
  if (appEnv === 'production' || nodeEnv === 'production') return 'production';
  if (appEnv === 'staging' || appEnv === 'internal-preview') return 'internal-preview';

  return 'local-dev';
}

/**
 * Returns the full profile for the current runtime mode.
 */
export function getRuntimeModeProfile(): RuntimeModeProfile {
  return RUNTIME_MODE_PROFILES[resolveRuntimeMode()];
}

/**
 * Returns the current RuntimeMode value.
 */
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

/** True when the mode allows seeded/demo data to masquerade as live records. */
export function isSeedDataAllowed(): boolean {
  return getRuntimeModeProfile().allowSeedData;
}

/** True when connector adapters may silently fall back to mock responses. */
export function isConnectorFallbackAllowed(): boolean {
  return getRuntimeModeProfile().allowConnectorFallback;
}

/** True when billing flows are active and Stripe charges are real. */
export function isBillingActive(): boolean {
  return getRuntimeModeProfile().billingActive;
}

/** True when external notifications (Slack, email, Twilio) should be sent. */
export function areNotificationsActive(): boolean {
  return getRuntimeModeProfile().notificationsActive;
}

/** True when full error stack traces may be included in API responses. */
export function areVerboseErrorsEnabled(): boolean {
  return getRuntimeModeProfile().verboseErrors;
}

/** True when the UI must label simulated/seeded data with Demo badges. */
export function areDemoLabelsRequired(): boolean {
  return getRuntimeModeProfile().requireDemoLabels;
}

// ---------------------------------------------------------------------------
// Client-side mode resolution (Vite — reads import.meta.env)
// ---------------------------------------------------------------------------

/**
 * Resolves the runtime mode on the client side using Vite's import.meta.env.
 * Vite must expose the relevant vars via VITE_ prefix or define().
 *
 * Expected Vite env vars:
 *   VITE_RUNTIME_MODE — explicit override
 *   VITE_DEMO_MODE    — "true" forces demo
 *   VITE_APP_ENV      — mirrors APP_ENV
 *   MODE              — Vite's built-in mode (development | production)
 */
export function getClientRuntimeMode(env: Record<string, string | undefined>): RuntimeMode {
  const explicit = env['VITE_RUNTIME_MODE'] ?? env['VITE_APP_MODE'];
  if (explicit) {
    if (!RUNTIME_MODES.includes(explicit as RuntimeMode)) {
      console.error(
        `[runtime-mode] Invalid VITE_RUNTIME_MODE/VITE_APP_MODE value: "${explicit}". ` +
          `Valid values: ${RUNTIME_MODES.join(', ')}. Falling back to derived mode.`,
      );
    } else {
      return explicit as RuntimeMode;
    }
  }

  const demoMode = env['VITE_DEMO_MODE'];
  if (demoMode === 'true' || demoMode === '1') {
    return 'demo';
  }

  const appEnv = env['VITE_APP_ENV'];
  const mode = env['MODE'];

  if (appEnv === 'demo') return 'demo';
  if (appEnv === 'sandbox') return 'sandbox';
  if (appEnv === 'production' || mode === 'production') return 'production';
  if (appEnv === 'staging' || appEnv === 'internal-preview') return 'internal-preview';

  return 'local-dev';
}

/**
 * Returns the full profile for the given client env map.
 * Typical usage in a Vite app:
 *   const profile = getClientRuntimeModeProfile(import.meta.env);
 */
export function getClientRuntimeModeProfile(
  env: Record<string, string | undefined>,
): RuntimeModeProfile {
  return RUNTIME_MODE_PROFILES[getClientRuntimeMode(env)];
}

// ---------------------------------------------------------------------------
// Connector activation helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether a connector is considered "active" (i.e., has real credentials
 * configured) or whether it is running in mock/demo fallback mode.
 *
 * In production mode: missing keys = connector is inactive, surface a clean
 * "not activated" state. Never silently serve mock data.
 *
 * In non-production modes: missing keys = connector falls back to demo/mock
 * responses with a visible label.
 */
export interface ConnectorStatus {
  active: boolean;
  reason: 'live' | 'mock-fallback' | 'not-activated';
  /** Display label for the UI connector status pill */
  label: string;
}

export function resolveConnectorStatus(
  connectorName: string,
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

/**
 * Throws if mock/demo data is about to be served in production mode.
 * Call this at the start of any route or service that might serve seed data.
 *
 * @param context - A short label identifying the caller (e.g., "vessels/fleet-list")
 */
export function assertNotProductionOrThrow(context: string): void {
  if (isProductionMode()) {
    throw new Error(
      `[runtime-mode] Attempted to serve mock/seed data in production mode — context: ${context}. ` +
        `Check your code path: mock data must be gated behind isSeedDataAllowed() or isDemoMode().`,
    );
  }
}

/**
 * Throws if an external notification would be sent from a non-production context
 * without explicit opt-in. Prevents accidental spam during demos or local dev.
 */
export function assertNotificationsAllowedOrThrow(context: string): void {
  if (!areNotificationsActive()) {
    throw new Error(
      `[runtime-mode] External notifications are suppressed in ${getRuntimeMode()} mode — context: ${context}. ` +
        `Check areNotificationsActive() before sending.`,
    );
  }
}

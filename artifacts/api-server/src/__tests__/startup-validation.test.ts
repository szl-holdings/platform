/**
 * Startup Validation Tests
 *
 * Verifies that `validateStartupConfig` and `failFastOnInvalidConfig`:
 *
 *  1. Pass cleanly when all required vars are set
 *  2. Emit errors for missing required vars in production
 *  3. Emit warnings (not errors) for missing optional vars in development
 *  4. Fail fast (process.exit(1)) when errors are present
 *  5. Auto-generate ALLOY_INTERNAL_TOKEN and OAUTH_STATE_SECRET in development
 *  6. Reject known dev-tier placeholder values in production
 *  7. Reject SESSION_SECRET shorter than 32 chars in production
 *  8. Reject malformed CONNECTOR_ENCRYPTION_KEY in production
 *  9. Reject ALLOY_REQUIRE_APPROVAL_CRITICAL=false in production
 * 10. ENV_SPECS covers every key documented in .env.example
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before the module under test is imported
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/config', () => ({
  isProductionMode: vi.fn(() => false),
  isDemoMode: vi.fn(() => false),
  resolveRuntimeMode: vi.fn(() => 'local-dev'),
  isSeedDataAllowed: vi.fn(() => true),
}));

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

import { isProductionMode } from '@szl-holdings/config';
import { ENV_SPECS, failFastOnInvalidConfig, validateStartupConfig } from '../lib/startup-validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Snapshot and restore process.env around each test */
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  vi.mocked(isProductionMode).mockReturnValue(false);
});

afterEach(() => {
  // Restore original env, removing any keys the test added
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
  vi.clearAllMocks();
});

const MIN_PROD_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
  SESSION_SECRET: 'a'.repeat(64),
  ALLOY_INTERNAL_TOKEN: 'b'.repeat(64),
  CONNECTOR_ENCRYPTION_KEY: 'a'.repeat(64),
  MFA_SECRET_ENCRYPTION_KEY: 'c'.repeat(64),
  ALPHA_VANTAGE_API_KEY: 'test-alpha-vantage-key-prod-validation',
  UNSUBSCRIBE_SECRET: 'd'.repeat(32),
  RESEND_WEBHOOK_SECRET: 'whsec_' + 'e'.repeat(32),
  SENDGRID_WEBHOOK_SECRET: 'f'.repeat(32),
  // Required in production after hardcoded values were removed from .replit
  SUBSTRATE_SIGNING_KEY: 'a'.repeat(64),
  SUBSTRATE_GATEWAY_API_KEY: 'szl_gw_test-prod-validation-key',
  ADMIN_PIN: 'test-admin-pin-prod',
};

/**
 * Known-dev placeholder values — must be cleared when simulating production
 * so the dev-placeholder checks don't block otherwise-valid prod env tests.
 */
const KNOWN_DEV_KEYS_TO_CLEAR = [
  'SUBSTRATE_SIGNING_KEY',
  'SUBSTRATE_GATEWAY_API_KEY',
];

function setProductionEnv(overrides: NodeJS.ProcessEnv = {}) {
  vi.mocked(isProductionMode).mockReturnValue(true);
  for (const key of KNOWN_DEV_KEYS_TO_CLEAR) {
    delete process.env[key];
  }
  Object.assign(process.env, { ...MIN_PROD_ENV, ...overrides });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateStartupConfig — development mode', () => {
  it('passes when no vars are set (dev mode is permissive)', () => {
    delete process.env.DATABASE_URL;
    delete process.env.SESSION_SECRET;
    delete process.env.ALLOY_INTERNAL_TOKEN;

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('emits a warning when DATABASE_URL is absent in dev', () => {
    delete process.env.DATABASE_URL;

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('DATABASE_URL'))).toBe(true);
  });

  it('emits a warning when SESSION_SECRET is absent in dev', () => {
    delete process.env.SESSION_SECRET;

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('SESSION_SECRET'))).toBe(true);
  });

  it('auto-generates ALLOY_INTERNAL_TOKEN when absent in dev', () => {
    delete process.env.ALLOY_INTERNAL_TOKEN;

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('ALLOY_INTERNAL_TOKEN'))).toBe(true);
    expect(process.env.ALLOY_INTERNAL_TOKEN).toBeTruthy();
    expect(process.env.ALLOY_INTERNAL_TOKEN!.length).toBeGreaterThanOrEqual(32);
  });

  it('auto-generates OAUTH_STATE_SECRET when absent', () => {
    delete process.env.OAUTH_STATE_SECRET;

    validateStartupConfig();
    expect(process.env.OAUTH_STATE_SECRET).toBeTruthy();
    expect(process.env.OAUTH_STATE_SECRET!.length).toBeGreaterThanOrEqual(32);
  });

  it('emits warning for known dev-tier ALLOY_INTERNAL_TOKEN placeholder', () => {
    process.env.ALLOY_INTERNAL_TOKEN = 'dev-3e8122992689a527adcf8ba067ccabfae77b81f3e52aa713';

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('ALLOY_INTERNAL_TOKEN'))).toBe(true);
  });

  it('rejects an explicit RUNTIME_MODE that is not a recognized value', () => {
    process.env.RUNTIME_MODE = 'bogus-mode';

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('RUNTIME_MODE'))).toBe(true);

    delete process.env.RUNTIME_MODE;
  });

  it('returns a structured envSummary grouped by category', () => {
    const result = validateStartupConfig();
    expect(Array.isArray(result.envSummary)).toBe(true);
    expect(result.envSummary.length).toBeGreaterThan(0);
    for (const group of result.envSummary) {
      expect(typeof group.group).toBe('string');
      expect(Array.isArray(group.vars)).toBe(true);
    }
  });
});

describe('validateStartupConfig — production mode', () => {
  it('passes with all required production vars set', () => {
    setProductionEnv();

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when DATABASE_URL is absent in production', () => {
    setProductionEnv({ DATABASE_URL: undefined as unknown as string });
    delete process.env.DATABASE_URL;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('errors when SESSION_SECRET is absent in production', () => {
    setProductionEnv({ SESSION_SECRET: undefined as unknown as string });
    delete process.env.SESSION_SECRET;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SESSION_SECRET'))).toBe(true);
  });

  it('errors when SESSION_SECRET is shorter than 32 chars in production', () => {
    setProductionEnv({ SESSION_SECRET: 'short' });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SESSION_SECRET'))).toBe(true);
  });

  it('errors when ALLOY_INTERNAL_TOKEN is absent in production', () => {
    setProductionEnv({ ALLOY_INTERNAL_TOKEN: undefined as unknown as string });
    delete process.env.ALLOY_INTERNAL_TOKEN;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ALLOY_INTERNAL_TOKEN'))).toBe(true);
  });

  it('errors when ALLOY_INTERNAL_TOKEN is shorter than 32 chars in production', () => {
    setProductionEnv({ ALLOY_INTERNAL_TOKEN: 'tooshort' });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ALLOY_INTERNAL_TOKEN'))).toBe(true);
  });

  it('errors when known dev-tier ALLOY_INTERNAL_TOKEN is used in production', () => {
    setProductionEnv({
      ALLOY_INTERNAL_TOKEN: 'dev-3e8122992689a527adcf8ba067ccabfae77b81f3e52aa713',
    });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ALLOY_INTERNAL_TOKEN'))).toBe(true);
  });

  it('errors when CONNECTOR_ENCRYPTION_KEY is absent in production', () => {
    setProductionEnv({ CONNECTOR_ENCRYPTION_KEY: undefined as unknown as string });
    delete process.env.CONNECTOR_ENCRYPTION_KEY;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('CONNECTOR_ENCRYPTION_KEY'))).toBe(true);
  });

  it('errors when CONNECTOR_ENCRYPTION_KEY is not 64 hex chars in production', () => {
    setProductionEnv({ CONNECTOR_ENCRYPTION_KEY: 'not-hex-and-wrong-length' });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('CONNECTOR_ENCRYPTION_KEY'))).toBe(true);
  });

  it('errors when MFA_SECRET_ENCRYPTION_KEY is absent in production', () => {
    setProductionEnv({ MFA_SECRET_ENCRYPTION_KEY: undefined as unknown as string });
    delete process.env.MFA_SECRET_ENCRYPTION_KEY;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('MFA_SECRET_ENCRYPTION_KEY'))).toBe(true);
  });

  it('errors when MFA_SECRET_ENCRYPTION_KEY has invalid format in production', () => {
    setProductionEnv({ MFA_SECRET_ENCRYPTION_KEY: 'invalid-format-key' });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('MFA_SECRET_ENCRYPTION_KEY'))).toBe(true);
  });

  it('errors when ALPHA_VANTAGE_API_KEY is absent in production (fail-fast)', () => {
    setProductionEnv({ ALPHA_VANTAGE_API_KEY: undefined as unknown as string });
    delete process.env.ALPHA_VANTAGE_API_KEY;

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ALPHA_VANTAGE_API_KEY'))).toBe(true);
  });

  it('errors when ALLOY_REQUIRE_APPROVAL_CRITICAL is false in production', () => {
    setProductionEnv({ ALLOY_REQUIRE_APPROVAL_CRITICAL: 'false' });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ALLOY_REQUIRE_APPROVAL_CRITICAL'))).toBe(true);
  });

  it('errors when known dev SUBSTRATE_SIGNING_KEY is used in production', () => {
    setProductionEnv({
      SUBSTRATE_SIGNING_KEY: '5228884b12bc50c3be1c0f8345d5f5475baf5bc2ccb265d5e9bc02674c04258a',
    });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SUBSTRATE_SIGNING_KEY'))).toBe(true);
  });

  it('errors when known dev SUBSTRATE_GATEWAY_API_KEY is used in production', () => {
    setProductionEnv({
      SUBSTRATE_GATEWAY_API_KEY: 'szl_dev_9b77bf02c5939ec060f07d87ad02542a2561330d0c9ae5fc',
    });

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SUBSTRATE_GATEWAY_API_KEY'))).toBe(true);
  });
});

describe('failFastOnInvalidConfig', () => {
  it('does not call process.exit when config is valid', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => failFastOnInvalidConfig()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();

    exitSpy.mockRestore();
  });

  it('calls process.exit(1) when required vars are missing in production', () => {
    vi.mocked(isProductionMode).mockReturnValue(true);
    delete process.env.DATABASE_URL;
    delete process.env.SESSION_SECRET;
    delete process.env.ALLOY_INTERNAL_TOKEN;

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit(1)');
    }) as never);

    expect(() => failFastOnInvalidConfig()).toThrow('process.exit(1)');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});

describe('ENV_SPECS — coverage of .env.example', () => {
  /**
   * Parse `.env.example` at test runtime so this test can never drift from
   * the file itself. Any key added to .env.example will automatically surface
   * as a missing-from-ENV_SPECS failure without needing a manual list update.
   *
   * Parser rules:
   *  - Skip blank lines and comment-only lines (lines starting with #).
   *  - Extract the KEY from lines matching KEY=... (value may be empty).
   */
  function parseEnvExampleKeys(): string[] {
    const envExamplePath = resolve(__dirname, '../../.env.example');
    const content = readFileSync(envExamplePath, 'utf-8');
    const keys: string[] = [];
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      if (/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Keys that exist in ENV_SPECS but intentionally are NOT in .env.example
   * (internal-only or runtime-injected variables). Listing them here makes
   * the asymmetry explicit and reviewable rather than silently ignored.
   */
  const SPEC_EXTRAS_NOT_IN_ENV_EXAMPLE = new Set([
    'APP_ENV',
    'RUNTIME_MODE',
    'AUTH_PROVIDER_URL',
    'AUTH_PROVIDER_KEY',
    'MFA_SECRET_ENCRYPTION_KEY',
    'ELEVENLABS_API_KEY',
    'DEFAULT_OBJECT_STORAGE_BUCKET_ID',
    'ATLAS_DOMAIN_PACK_ENFORCE',
    'ATLAS_EVENT_BUS_ENABLED',
    'ATLAS_CROSS_DOMAIN_TELEMETRY',
    'ENABLE_DEMO_SEED',
    'UPTIME_MONITOR_ID',
    'DEMO_MODE',
    'HF_API_BASE',
  ]);

  it('has no duplicate keys in ENV_SPECS', () => {
    const keys = ENV_SPECS.map((s) => s.key);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(duplicates).toHaveLength(0);
  });

  it('covers every key listed in .env.example (parsed dynamically)', () => {
    const envExampleKeys = parseEnvExampleKeys();
    const specKeys = new Set(ENV_SPECS.map((s) => s.key));
    const missing = envExampleKeys.filter((k) => !specKeys.has(k));
    expect(missing).toHaveLength(0);
  });

  it('documents intentional ENV_SPECS extras not in .env.example', () => {
    const envExampleKeys = new Set(parseEnvExampleKeys());
    const specOnlyKeys = ENV_SPECS.map((s) => s.key).filter((k) => !envExampleKeys.has(k));
    const undocumentedExtras = specOnlyKeys.filter((k) => !SPEC_EXTRAS_NOT_IN_ENV_EXAMPLE.has(k));
    expect(
      undocumentedExtras,
      'These ENV_SPECS keys are not in .env.example and not listed in SPEC_EXTRAS_NOT_IN_ENV_EXAMPLE. ' +
        'Either add them to .env.example or add them to SPEC_EXTRAS_NOT_IN_ENV_EXAMPLE with a comment explaining why.',
    ).toHaveLength(0);
  });

  it('every spec has a non-empty description', () => {
    const missingDesc = ENV_SPECS.filter((s) => !s.description || s.description.trim() === '');
    expect(missingDesc.map((s) => s.key)).toHaveLength(0);
  });
});

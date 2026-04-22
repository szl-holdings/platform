import {
  API_RATE_LIMITS,
  APP_INTEGRATIONS,
  APP_NAME,
  APP_VERSION,
  getOptionalEnv,
  getRequiredEnv,
  PAGINATION_DEFAULTS,
  PLATFORM_APPS,
  ROLES,
  SESSION_DURATION_MS,
} from '@workspace/config';
import { afterEach, describe, expect, it } from 'vitest';

describe('@szl-holdings/config', () => {
  describe('constants', () => {
    it('exports APP_NAME', () => {
      expect(APP_NAME).toBe('SZL Holdings Platform');
    });

    it('exports APP_VERSION as semver', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('PLATFORM_APPS has required fields', () => {
      expect(PLATFORM_APPS.length).toBeGreaterThan(0);
      for (const app of PLATFORM_APPS) {
        expect(app).toHaveProperty('slug');
        expect(app).toHaveProperty('name');
        expect(app).toHaveProperty('icon');
        expect(app).toHaveProperty('color');
        expect(app.slug).toBeTruthy();
        expect(app.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('PLATFORM_APPS has unique slugs', () => {
      const slugs = PLATFORM_APPS.map((a) => a.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe('ROLES', () => {
    it('includes super_admin role', () => {
      const names = ROLES.map((r) => r.name);
      expect(names).toContain('super_admin');
    });

    it('all roles have name and description', () => {
      for (const role of ROLES) {
        expect(role.name).toBeTruthy();
        expect(role.description).toBeTruthy();
      }
    });

    it('role names are unique', () => {
      const names = ROLES.map((r) => r.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('defaults', () => {
    it('SESSION_DURATION_MS is 30 days', () => {
      expect(SESSION_DURATION_MS).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('PAGINATION_DEFAULTS has valid values', () => {
      expect(PAGINATION_DEFAULTS.page).toBe(1);
      expect(PAGINATION_DEFAULTS.limit).toBeGreaterThan(0);
      expect(PAGINATION_DEFAULTS.maxLimit).toBeGreaterThanOrEqual(PAGINATION_DEFAULTS.limit);
    });

    it('API_RATE_LIMITS has valid values', () => {
      expect(API_RATE_LIMITS.windowMs).toBeGreaterThan(0);
      expect(API_RATE_LIMITS.maxRequests).toBeGreaterThan(0);
    });
  });

  describe('getRequiredEnv', () => {
    const TEST_KEY = '__CONFIG_TEST_REQUIRED__';

    afterEach(() => {
      delete process.env[TEST_KEY];
    });

    it('returns value when set', () => {
      process.env[TEST_KEY] = 'test-value';
      expect(getRequiredEnv(TEST_KEY)).toBe('test-value');
    });

    it('throws when missing', () => {
      expect(() => getRequiredEnv(TEST_KEY)).toThrow(/Missing required environment variable/);
    });
  });

  describe('getOptionalEnv', () => {
    const TEST_KEY = '__CONFIG_TEST_OPTIONAL__';

    afterEach(() => {
      delete process.env[TEST_KEY];
    });

    it('returns value when set', () => {
      process.env[TEST_KEY] = 'present';
      expect(getOptionalEnv(TEST_KEY)).toBe('present');
    });

    it('returns fallback when missing', () => {
      expect(getOptionalEnv(TEST_KEY, 'default')).toBe('default');
    });

    it('returns empty string as default fallback', () => {
      expect(getOptionalEnv(TEST_KEY)).toBe('');
    });
  });

  describe('APP_INTEGRATIONS', () => {
    it('has connectors for core apps', () => {
      expect(APP_INTEGRATIONS.vessels).toBeDefined();
      expect(APP_INTEGRATIONS.vessels.connectors.length).toBeGreaterThan(0);
    });

    it('each integration has description', () => {
      for (const [_key, integration] of Object.entries(APP_INTEGRATIONS)) {
        expect(integration.description).toBeTruthy();
        expect(integration.connectors).toBeInstanceOf(Array);
      }
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  CorsConfigurationError,
  isCorsOriginAllowed,
  resolveCorsAllowedOrigins,
} from '../middleware/cors-policy.js';

describe('embedding API CORS policy', () => {
  it('rejects wildcard and malformed allowlist entries in production', () => {
    expect(() =>
      resolveCorsAllowedOrigins({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: '*' }),
    ).toThrowError(/does not permit wildcard origins in production/);

    for (const origin of [
      'not-a-url',
      'file:///tmp/socket',
      'https://user:password@example.test',
      'https://example.test/path',
      'https://example.test?query=1',
    ]) {
      expect(() =>
        resolveCorsAllowedOrigins({
          NODE_ENV: 'production',
          CORS_ALLOWED_ORIGINS: origin,
        }),
      ).toThrowError(CorsConfigurationError);
    }
  });

  it('normalizes and admits only exact configured origins', () => {
    const origins = resolveCorsAllowedOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: ' https://console.example.test/,http://localhost:5173 ',
    });

    expect([...origins]).toEqual(['https://console.example.test', 'http://localhost:5173']);
    expect(isCorsOriginAllowed('https://console.example.test', origins)).toBe(true);
    expect(isCorsOriginAllowed('https://attacker.example.test', origins)).toBe(false);
    expect(isCorsOriginAllowed('null', origins)).toBe(false);
  });

  it('permits the explicit wildcard only outside production', () => {
    const origins = resolveCorsAllowedOrigins({
      NODE_ENV: 'development',
      CORS_ALLOWED_ORIGINS: '*',
    });
    expect(isCorsOriginAllowed('https://local.example.test', origins)).toBe(true);
  });
});

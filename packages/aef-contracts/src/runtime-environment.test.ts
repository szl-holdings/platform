import { describe, expect, it } from 'vitest';
import { isDevelopmentOrTestRuntime, isProductionRuntime } from './runtime-environment.js';

describe('runtime environment safety boundary', () => {
  it.each([
    'local-dev',
    'internal-preview',
    'demo',
  ])('accepts non-production RUNTIME_MODE=%s without promotion', (mode) => {
    expect(isProductionRuntime({ RUNTIME_MODE: mode })).toBe(false);
  });

  it('accepts production and treats blank RUNTIME_MODE as unset', () => {
    expect(isProductionRuntime({ RUNTIME_MODE: 'production' })).toBe(true);
    expect(isProductionRuntime({ RUNTIME_MODE: '   ', NODE_ENV: 'test' })).toBe(false);
  });

  it.each(['stagin', 'prod', 'sandbox'])('rejects invalid explicit RUNTIME_MODE=%s', (mode) => {
    expect(() => isProductionRuntime({ RUNTIME_MODE: mode })).toThrow(/Invalid RUNTIME_MODE/);
  });

  it.each([
    'RUNTIME_MODE',
    'APP_ENV',
    'NODE_ENV',
    'SZL_ENV',
  ])('treats %s=production as dominant over NODE_ENV=test', (name) => {
    expect(isProductionRuntime({ NODE_ENV: 'test', [name]: 'production' })).toBe(true);
    expect(isDevelopmentOrTestRuntime({ NODE_ENV: 'test', [name]: 'production' })).toBe(false);
  });

  it('honors caller-declared service markers and production aliases', () => {
    expect(
      isProductionRuntime({ NODE_ENV: 'test', EXAMPLE_SERVICE_ENV: 'prod' }, [
        'EXAMPLE_SERVICE_ENV',
      ]),
    ).toBe(true);
  });
});

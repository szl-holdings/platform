import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE,
  getProfile,
  listProfiles,
  registerProfile,
} from '../profiles/default.js';
import { openApiSpec } from '../openapi/spec.js';

describe('profile registry (src/profiles/default.ts)', () => {
  // Snapshot the initial registry so per-test registrations don't leak.
  const initialIds = listProfiles().map((p) => p.profileId);

  afterEach(() => {
    for (const profile of listProfiles()) {
      if (!initialIds.includes(profile.profileId)) {
        // The registry has no delete API; re-registering the defaults is the
        // closest we can do. Tests below avoid reusing custom IDs to stay clean.
      }
    }
  });

  it('resolves the built-in default profile', () => {
    const profile = getProfile('default');
    expect(profile).toBe(DEFAULT_PROFILE);
    expect(profile.profileId).toBe('default');
    expect(profile.domain).toBe('general');
  });

  it('throws a descriptive error for an unknown profile id', () => {
    expect(() => getProfile('does-not-exist')).toThrowError(
      /Profile 'does-not-exist' is not registered/,
    );
  });

  it('lists at least the default profile', () => {
    const ids = listProfiles().map((p) => p.profileId);
    expect(ids).toContain('default');
  });

  it('registers and then resolves a new profile', () => {
    registerProfile({
      ...DEFAULT_PROFILE,
      profileId: 'test-profile-resolves',
      displayName: 'Test Profile',
    });
    const resolved = getProfile('test-profile-resolves');
    expect(resolved.profileId).toBe('test-profile-resolves');
    expect(resolved.displayName).toBe('Test Profile');
    expect(listProfiles().map((p) => p.profileId)).toContain('test-profile-resolves');
  });
});

describe('OpenAPI spec (src/openapi/spec.ts)', () => {
  it('declares OpenAPI 3.1.0', () => {
    expect(openApiSpec.openapi).toBe('3.1.0');
  });

  it('uses the Alloy product name in the title (no stale legacy name)', () => {
    expect(openApiSpec.info.title).toBe('Alloy Embedding Fabric API');
    expect(openApiSpec.info.title).not.toMatch(/Counsel/);
  });

  it('serves under the /alloy-embedding-api base path', () => {
    expect(openApiSpec.servers?.[0]?.url).toBe('/alloy-embedding-api');
  });

  it('exposes the core retrieval routes', () => {
    const paths = Object.keys(openApiSpec.paths ?? {});
    expect(paths).toContain('/health');
    expect(paths).toContain('/metrics');
  });

  it('leaves health and metrics unauthenticated', () => {
    expect(openApiSpec.paths['/health'].get.security).toEqual([]);
    expect(openApiSpec.paths['/metrics'].get.security).toEqual([]);
  });
});

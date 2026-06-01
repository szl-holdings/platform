import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashIp } from './ip-hash.js';

function sha256Prefix(salt: string, ip: string): string {
  return (
    'sha256:' +
    crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 40)
  );
}

describe('hashIp', () => {
  const originalSalt = process.env.IP_HASH_SALT;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    if (originalSalt === undefined) {
      delete process.env.IP_HASH_SALT;
    } else {
      process.env.IP_HASH_SALT = originalSalt;
    }
  });

  it('returns null for null input', () => {
    expect(hashIp(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(hashIp(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(hashIp('')).toBeNull();
  });

  it('returns a sha256:-prefixed string for a valid IPv4 address', () => {
    process.env.IP_HASH_SALT = 'test-salt';
    const result = hashIp('192.168.1.1');
    expect(result).toMatch(/^sha256:[0-9a-f]{40}$/);
  });

  it('returns a sha256:-prefixed string for a valid IPv6 address', () => {
    process.env.IP_HASH_SALT = 'test-salt';
    const result = hashIp('::1');
    expect(result).toMatch(/^sha256:[0-9a-f]{40}$/);
  });

  it('produces the expected deterministic hash with a known salt', () => {
    process.env.IP_HASH_SALT = 'known-salt';
    const expected = sha256Prefix('known-salt', '10.0.0.1');
    expect(hashIp('10.0.0.1')).toBe(expected);
  });

  it('produces different hashes for different IPs with the same salt', () => {
    process.env.IP_HASH_SALT = 'same-salt';
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('5.6.7.8'));
  });

  it('produces different hashes for the same IP with different salts', () => {
    process.env.IP_HASH_SALT = 'salt-a';
    const hashA = hashIp('1.2.3.4');
    process.env.IP_HASH_SALT = 'salt-b';
    const hashB = hashIp('1.2.3.4');
    expect(hashA).not.toBe(hashB);
  });

  it('is deterministic — same inputs always produce the same hash', () => {
    process.env.IP_HASH_SALT = 'stable-salt';
    expect(hashIp('203.0.113.42')).toBe(hashIp('203.0.113.42'));
  });

  it('falls back to empty-string salt when IP_HASH_SALT is unset', () => {
    delete process.env.IP_HASH_SALT;
    const expected = sha256Prefix('', '1.2.3.4');
    expect(hashIp('1.2.3.4')).toBe(expected);
  });

  describe('migration-script compatibility (backfill scenario)', () => {
    it('already-hashed values (sha256: prefix) can be detected by callers', () => {
      process.env.IP_HASH_SALT = 'test-salt';
      const hashed = hashIp('10.10.10.10')!;
      expect(hashed.startsWith('sha256:')).toBe(true);
    });

    it('produces a hash identical to the migration script algorithm', () => {
      const salt = 'migration-test-salt';
      const ip = '172.16.0.5';
      process.env.IP_HASH_SALT = salt;
      const libHash = hashIp(ip);
      const scriptHash = sha256Prefix(salt, ip);
      expect(libHash).toBe(scriptHash);
    });
  });
});

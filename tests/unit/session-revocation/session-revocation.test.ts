/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumeSessionRevocationReason,
  detectSessionRevocationCode,
  extractServerMessage,
  notifySessionRevoked,
  onSessionRevoked,
  SESSION_REVOCATION_EVENT,
  SESSION_REVOCATION_FLAG_KEY,
} from '../../../lib/shared-ui/src/session-revocation';

let clock = 0;
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.getElementById('szl-session-revoked-banner')?.remove();
  // Step the wall clock past the helper's 5s coalescing window every test.
  clock += 60_000;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(clock));
});

describe('detectSessionRevocationCode', () => {
  it('recognises SESSION_REVOKED at the top level', () => {
    expect(detectSessionRevocationCode({ code: 'SESSION_REVOKED' })).toBe('SESSION_REVOKED');
  });
  it('recognises REFRESH_TOKEN_REPLAY', () => {
    expect(detectSessionRevocationCode({ code: 'REFRESH_TOKEN_REPLAY' })).toBe(
      'REFRESH_TOKEN_REPLAY',
    );
  });
  it('returns null for unrelated codes and bad shapes', () => {
    expect(detectSessionRevocationCode({ code: 'UNAUTHORIZED' })).toBeNull();
    expect(detectSessionRevocationCode(null)).toBeNull();
    expect(detectSessionRevocationCode('x')).toBeNull();
  });
  it('looks inside nested error / data containers', () => {
    expect(detectSessionRevocationCode({ error: { code: 'SESSION_REVOKED' } })).toBe(
      'SESSION_REVOKED',
    );
    expect(detectSessionRevocationCode({ data: { code: 'REFRESH_TOKEN_REPLAY' } })).toBe(
      'REFRESH_TOKEN_REPLAY',
    );
  });
});

describe('extractServerMessage', () => {
  it('prefers a string error', () => {
    expect(extractServerMessage({ error: 'boom' })).toBe('boom');
  });
  it('falls back to error.message', () => {
    expect(extractServerMessage({ error: { message: 'nested' } })).toBe('nested');
  });
  it('falls back to message', () => {
    expect(extractServerMessage({ message: 'plain' })).toBe('plain');
  });
});

describe('notifySessionRevoked', () => {
  it('clears known token keys, persists the reason, and dispatches an event', () => {
    window.localStorage.setItem('cortex_auth_token', 'abc');
    window.localStorage.setItem('refresh_token', 'rrr');
    window.localStorage.setItem('unrelated', 'keep me');

    const handler = vi.fn();
    const off = onSessionRevoked(handler);
    const eventSpy = vi.fn();
    window.addEventListener(SESSION_REVOCATION_EVENT, eventSpy);

    notifySessionRevoked('SESSION_REVOKED', { redirect: false });

    expect(window.localStorage.getItem('cortex_auth_token')).toBeNull();
    expect(window.localStorage.getItem('refresh_token')).toBeNull();
    expect(window.localStorage.getItem('unrelated')).toBe('keep me');

    const stored = window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.code).toBe('SESSION_REVOKED');
    expect(typeof parsed.message).toBe('string');
    expect(parsed.message.length).toBeGreaterThan(0);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].code).toBe('SESSION_REVOKED');
    expect(eventSpy).toHaveBeenCalledTimes(1);

    off();
  });

  it('uses the security-specific copy for refresh-token replay', () => {
    notifySessionRevoked('REFRESH_TOKEN_REPLAY', { redirect: false });
    const reason = consumeSessionRevocationReason();
    expect(reason?.code).toBe('REFRESH_TOKEN_REPLAY');
    expect(reason?.message).toMatch(/security/i);
  });

  it('paints a fallback DOM banner for users', () => {
    notifySessionRevoked('SESSION_REVOKED', { redirect: false });
    const banner = document.getElementById('szl-session-revoked-banner');
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute('role')).toBe('status');
  });
});

describe('consumeSessionRevocationReason', () => {
  it('returns null when nothing is stored', () => {
    expect(consumeSessionRevocationReason()).toBeNull();
  });
  it('returns and clears the stored reason', () => {
    notifySessionRevoked('SESSION_REVOKED', { redirect: false });
    const first = consumeSessionRevocationReason();
    expect(first).not.toBeNull();
    expect(consumeSessionRevocationReason()).toBeNull();
  });
});

// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeSessionRevocationReason,
  detectSessionRevocationCode,
  extractServerMessage,
  notifySessionRevoked,
  onSessionRevoked,
  REFRESH_TOKEN_REPLAY_CODE,
  SESSION_REVOCATION_EVENT,
  SESSION_REVOCATION_FLAG_KEY,
  SESSION_REVOKED_CODE,
} from './session-revocation';

const KNOWN_AUTH_TOKEN_KEYS = [
  'cortex_auth_token',
  'szl_auth_token',
  'auth_token',
  'access_token',
  'refresh_token',
  'refreshToken',
  'szl:refresh-token',
  'pulse-demo-token',
];

describe('detectSessionRevocationCode', () => {
  it('detects SESSION_REVOKED at the body root', () => {
    expect(detectSessionRevocationCode({ code: SESSION_REVOKED_CODE })).toBe(SESSION_REVOKED_CODE);
  });

  it('detects REFRESH_TOKEN_REPLAY at the body root', () => {
    expect(detectSessionRevocationCode({ code: REFRESH_TOKEN_REPLAY_CODE })).toBe(
      REFRESH_TOKEN_REPLAY_CODE,
    );
  });

  it('detects revocation codes nested under error', () => {
    expect(detectSessionRevocationCode({ error: { code: SESSION_REVOKED_CODE } })).toBe(
      SESSION_REVOKED_CODE,
    );
  });

  it('detects revocation codes nested under data', () => {
    expect(detectSessionRevocationCode({ data: { code: REFRESH_TOKEN_REPLAY_CODE } })).toBe(
      REFRESH_TOKEN_REPLAY_CODE,
    );
  });

  it('returns null for unrelated codes', () => {
    expect(detectSessionRevocationCode({ code: 'SOMETHING_ELSE' })).toBeNull();
    expect(detectSessionRevocationCode({})).toBeNull();
    expect(detectSessionRevocationCode(null)).toBeNull();
    expect(detectSessionRevocationCode('not an object')).toBeNull();
  });
});

describe('extractServerMessage', () => {
  it('reads top-level error string', () => {
    expect(extractServerMessage({ error: 'nope' })).toBe('nope');
  });

  it('reads nested error.message', () => {
    expect(extractServerMessage({ error: { message: 'nested' } })).toBe('nested');
  });

  it('falls back to top-level message', () => {
    expect(extractServerMessage({ message: 'top' })).toBe('top');
  });

  it('returns null when nothing is available', () => {
    expect(extractServerMessage({})).toBeNull();
    expect(extractServerMessage(null)).toBeNull();
  });
});

describe('notifySessionRevoked', () => {
  let assignSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;
  let testCounter = 0;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const key of KNOWN_AUTH_TOKEN_KEYS) {
      window.localStorage.setItem(key, 'present');
    }
    // Reset the module-level coalescing window between tests by walking the
    // simulated clock far past the 5s window for every test.
    testCounter += 1;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 0, 1, 0, 0, testCounter * 60));
    assignSpy = vi.fn();
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignSpy,
        pathname: '/dashboard',
        search: '',
      },
    });
  });

  afterEach(() => {
    // Drop any banner injected by the fallback path while fake timers are
    // still active so document.body cleanup is deterministic.
    document.getElementById('szl-session-revoked-banner')?.remove();
    document.querySelectorAll('[data-szl-session-toast]').forEach((el) => el.remove());
    vi.useRealTimers();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('clears every known auth token key from localStorage', () => {
    notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
    for (const key of KNOWN_AUTH_TOKEN_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  });

  it('dispatches the session-revoked event with code and message', () => {
    const handler = vi.fn();
    const off = onSessionRevoked(handler);
    try {
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false, message: 'Custom reason' });
    } finally {
      off();
    }
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toEqual({
      code: SESSION_REVOKED_CODE,
      message: 'Custom reason',
    });
  });

  it('persists the revocation reason to sessionStorage so /login can read it', () => {
    notifySessionRevoked(REFRESH_TOKEN_REPLAY_CODE, { redirect: false });
    const raw = window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.code).toBe(REFRESH_TOKEN_REPLAY_CODE);
    expect(typeof parsed.message).toBe('string');
    expect(parsed.message).toMatch(/security|sign in/i);
    expect(typeof parsed.at).toBe('string');
  });

  it('consumeSessionRevocationReason returns and clears the flag', () => {
    notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
    const first = consumeSessionRevocationReason();
    expect(first?.code).toBe(SESSION_REVOKED_CODE);
    expect(window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY)).toBeNull();
    expect(consumeSessionRevocationReason()).toBeNull();
  });

  it('schedules a redirect to /login by default', () => {
    notifySessionRevoked(SESSION_REVOKED_CODE);
    expect(assignSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('honours a custom loginPath and skips redirect when already on it', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, pathname: '/auth/sign-in', assign: assignSpy },
    });
    notifySessionRevoked(SESSION_REVOKED_CODE, { loginPath: '/auth/sign-in' });
    vi.advanceTimersByTime(2000);
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('shows the fallback DOM banner when no in-app toast marker is mounted', () => {
    notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
    const banner = document.getElementById('szl-session-revoked-banner');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.textContent).toMatch(/sign in/i);
  });

  it('suppresses the fallback banner when an app-level toast marker is mounted', () => {
    const marker = document.createElement('div');
    marker.setAttribute('data-szl-session-toast', 'true');
    document.body.appendChild(marker);
    try {
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
      expect(document.getElementById('szl-session-revoked-banner')).toBeNull();
    } finally {
      marker.remove();
    }
  });

  it('coalesces repeat calls within a 5s window', () => {
    const handler = vi.fn();
    const off = onSessionRevoked(handler);
    try {
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
    } finally {
      off();
    }
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatches the documented event name', () => {
    expect(SESSION_REVOCATION_EVENT).toBe('szl:session-revoked');
    const listener = vi.fn();
    window.addEventListener(SESSION_REVOCATION_EVENT, listener);
    try {
      notifySessionRevoked(SESSION_REVOKED_CODE, { redirect: false });
    } finally {
      window.removeEventListener(SESSION_REVOCATION_EVENT, listener);
    }
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

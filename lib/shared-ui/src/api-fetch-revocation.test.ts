// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from './api-fetch';
import {
  onSessionRevoked,
  REFRESH_TOKEN_REPLAY_CODE,
  SESSION_REVOCATION_FLAG_KEY,
  SESSION_REVOKED_CODE,
} from './session-revocation';

/**
 * Web integration test: when the API returns a 401 with `{ code: SESSION_REVOKED }`,
 * the shared `apiFetch` helper must (a) surface the friendly toast/banner to the
 * user, (b) persist the reason for the login screen, and (c) deterministically
 * redirect the browser to /login.
 */
describe('apiFetch session revocation handling', () => {
  let assignSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;
  let testCounter = 0;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();

    testCounter += 1;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2031, 0, 1, 0, 0, testCounter * 60));

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
    document.getElementById('szl-session-revoked-banner')?.remove();
    document.querySelectorAll('[data-szl-session-toast]').forEach((el) => el.remove());
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  function mockFetchOnce(body: unknown, status = 401): void {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  }

  it('shows the revocation notice (event + banner) and redirects on 401 SESSION_REVOKED', async () => {
    mockFetchOnce({
      code: SESSION_REVOKED_CODE,
      error: 'An administrator updated your access — please sign in again.',
    });

    const eventHandler = vi.fn();
    const off = onSessionRevoked(eventHandler);

    await expect(apiFetch('/me', { retries: 0 })).rejects.toBeInstanceOf(ApiError);

    off();

    // 1. Toast/banner: the event fires (toast subscribers see it) AND the
    //    fallback DOM banner appears for app shells without a toast mount.
    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(eventHandler.mock.calls[0]?.[0]).toMatchObject({ code: SESSION_REVOKED_CODE });
    expect(eventHandler.mock.calls[0]?.[0]?.message).toMatch(/sign in/i);

    const banner = document.getElementById('szl-session-revoked-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toMatch(/sign in/i);

    // 2. Persisted reason: the login screen reads this on next render.
    const persisted = window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY);
    expect(persisted).toBeTruthy();
    expect(JSON.parse(persisted as string).code).toBe(SESSION_REVOKED_CODE);

    // 3. Redirect: scheduled via setTimeout, fires on advance.
    expect(assignSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('shows the revocation notice on 401 REFRESH_TOKEN_REPLAY (nested under error)', async () => {
    mockFetchOnce({
      error: { code: REFRESH_TOKEN_REPLAY_CODE, message: 'Refresh replay' },
    });

    const eventHandler = vi.fn();
    const off = onSessionRevoked(eventHandler);

    await expect(apiFetch('/me', { retries: 0 })).rejects.toBeInstanceOf(ApiError);

    off();

    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(eventHandler.mock.calls[0]?.[0]).toMatchObject({ code: REFRESH_TOKEN_REPLAY_CODE });
    expect(window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY)).toBeTruthy();
  });

  it('does not fire the revocation notice on a plain 401 with no revocation code', async () => {
    mockFetchOnce({ error: 'Not authorized' });

    const eventHandler = vi.fn();
    const off = onSessionRevoked(eventHandler);

    await expect(apiFetch('/me', { retries: 0 })).rejects.toBeInstanceOf(ApiError);

    off();

    expect(eventHandler).not.toHaveBeenCalled();
    expect(document.getElementById('szl-session-revoked-banner')).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_REVOCATION_FLAG_KEY)).toBeNull();
    vi.advanceTimersByTime(2000);
    expect(assignSpy).not.toHaveBeenCalled();
  });
});

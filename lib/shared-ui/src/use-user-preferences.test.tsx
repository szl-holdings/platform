// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { setUserPreference, useUserPreferences } from './use-user-preferences';

const LS_KEY = 'szl-ui-preferences';

function dispatchStorage(newValue: string | null): void {
  // happy-dom supports the StorageEvent constructor.
  const event = new StorageEvent('storage', {
    key: LS_KEY,
    newValue,
    oldValue: null,
    storageArea: window.localStorage,
    url: window.location.href,
  });
  window.dispatchEvent(event);
}

describe('useUserPreferences cross-tab sync', () => {
  beforeEach(() => {
    // Reset the singleton store back to defaults between tests by simulating
    // another tab clearing the key, then clear our own storage.
    act(() => {
      dispatchStorage(null);
    });
    window.localStorage.clear();
  });

  it('updates hook state when another tab writes new preferences via a storage event', () => {
    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.prefs.sidebar_collapsed).toBe(false);
    expect(result.current.prefs.notification_sound).toBe(true);

    act(() => {
      dispatchStorage(
        JSON.stringify({
          sidebar_collapsed: true,
          notification_sound: false,
          accent_color: '#abcdef',
          density: 'compact',
          time_zone: null,
        }),
      );
    });

    expect(result.current.prefs.sidebar_collapsed).toBe(true);
    expect(result.current.prefs.notification_sound).toBe(false);
    expect(result.current.prefs.accent_color).toBe('#abcdef');
    expect(result.current.prefs.density).toBe('compact');
  });

  it('ignores malformed JSON in storage events and keeps the existing prefs', () => {
    const { result } = renderHook(() => useUserPreferences());

    // Seed a known good state from "another tab" first.
    act(() => {
      dispatchStorage(JSON.stringify({ sidebar_collapsed: true, notification_sound: false }));
    });
    expect(result.current.prefs.sidebar_collapsed).toBe(true);
    expect(result.current.prefs.notification_sound).toBe(false);

    // Now dispatch malformed JSON — handler must swallow the parse error and
    // leave the singleton store untouched.
    act(() => {
      dispatchStorage('{not-valid-json');
    });

    expect(result.current.prefs.sidebar_collapsed).toBe(true);
    expect(result.current.prefs.notification_sound).toBe(false);
  });

  it('drops invalid field values from storage events but keeps the valid ones', () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      dispatchStorage(
        JSON.stringify({
          sidebar_collapsed: 'yes-please', // invalid: not a boolean
          notification_sound: false, // valid
          accent_color: 'not-a-hex-color', // invalid
          density: 'ultra-compact', // invalid
        }),
      );
    });

    // Invalid fields fall back to defaults via mergePrefs(DEFAULTS, sanitized).
    expect(result.current.prefs.sidebar_collapsed).toBe(false);
    expect(result.current.prefs.notification_sound).toBe(false);
    expect(result.current.prefs.accent_color).toBeNull();
    expect(result.current.prefs.density).toBe('comfortable');
  });

  it('resets to defaults when another tab clears the storage key', () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      setUserPreference('sidebar_collapsed', true);
      setUserPreference('notification_sound', false);
    });
    expect(result.current.prefs.sidebar_collapsed).toBe(true);
    expect(result.current.prefs.notification_sound).toBe(false);

    act(() => {
      dispatchStorage(null);
    });

    expect(result.current.prefs.sidebar_collapsed).toBe(false);
    expect(result.current.prefs.notification_sound).toBe(true);
  });
});

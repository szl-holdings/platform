/**
 * useUserPreferences — mobile counterpart of the web
 * `lib/shared-ui/src/use-user-preferences.ts` store.
 *
 * Strategy:
 *  1. Read from AsyncStorage on app startup so preferences survive cold launches.
 *  2. After mount, fetch from the API (`/api/preferences`) using an injected
 *     fetcher so authentication/auth-token/baseUrl concerns stay in the host
 *     app. API wins on conflict.
 *  3. On change: write to AsyncStorage immediately AND debounce a PATCH so we
 *     don't hammer the server on rapid toggles.
 *  4. Falls back gracefully when the user is unauthenticated or offline —
 *     AsyncStorage remains the source of truth.
 *  5. Module-level singleton store so all hook consumers share state and
 *     non-React helpers (e.g. shared time formatters) can read the current
 *     value synchronously.
 *
 * Currently only `time_zone` is wired through here; other web preferences
 * (density, accent colour, etc.) are not used by the native shell.
 */

import { useCallback, useEffect, useState } from 'react';

let AsyncStorage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
} | null = null;
try {
  // Optional peer dependency — gracefully degrade in environments without it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

export interface UserPreferences {
  /** IANA time zone identifier (e.g. "America/New_York"), or null for the device default. */
  time_zone: string | null;
}

const DEFAULTS: UserPreferences = {
  time_zone: null,
};

const STORAGE_KEY = 'szl-mobile-user-preferences';
const DEBOUNCE_MS = 800;
const API_PATH = '/api/preferences';

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function isValidTimeZone(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isValidPreference<K extends keyof UserPreferences>(
  key: K,
  value: unknown,
): value is UserPreferences[K] {
  switch (key) {
    case 'time_zone':
      return isValidTimeZone(value);
    default:
      return false;
  }
}

function sanitizePartial(input: Record<string, unknown>): Partial<UserPreferences> {
  const out: Partial<UserPreferences> = {};
  for (const key of Object.keys(DEFAULTS) as Array<keyof UserPreferences>) {
    if (!(key in input)) continue;
    const candidate = input[key];
    if (isValidPreference(key, candidate)) {
      (out as Record<string, unknown>)[key] = candidate;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton store
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (prefs: UserPreferences) => void;

let _prefs: UserPreferences = { ...DEFAULTS };
let _isLoaded = false;
let _hydrationStarted = false;
let _hydrationDone = false;
let _hydrationPromise: Promise<void> | null = null;
let _apiFetchStarted = false;
const _listeners = new Set<Listener>();
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notifyListeners() {
  for (const listener of _listeners) {
    listener(_prefs);
  }
}

function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API fetcher injection — keeps auth/baseUrl concerns in the host app.
// ─────────────────────────────────────────────────────────────────────────────

export type PreferencesApiFetcher = (
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<Record<string, unknown> | null>;

let _apiFetcher: PreferencesApiFetcher | null = null;

/**
 * Provide an authenticated fetcher used to GET / PATCH `/api/preferences`.
 * The host app should wire this up at boot (see `_layout.tsx`) so the
 * preferences store can round-trip with the web app.
 *
 * The API fetch is intentionally deferred until AsyncStorage hydration has
 * completed so the local snapshot can't overwrite a fresher server value
 * (server always wins). Hydration starts here so we don't depend on a React
 * mount happening before the first server reconciliation.
 */
export function setUserPreferencesApiFetcher(fetcher: PreferencesApiFetcher | null): void {
  _apiFetcher = fetcher;
  if (fetcher) {
    ensureHydrated().then(() => ensureApiFetch());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────

async function readAsyncStorage(): Promise<Partial<UserPreferences>> {
  if (!AsyncStorage) return {};
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return sanitizePartial(parsed);
  } catch {
    return {};
  }
}

async function writeAsyncStorage(prefs: UserPreferences): Promise<void> {
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

async function fetchApiPreferences(): Promise<Partial<UserPreferences>> {
  if (!_apiFetcher) return {};
  try {
    const json = await _apiFetcher(API_PATH);
    if (!json) return {};
    const data: Record<string, unknown> = (json.data as Record<string, unknown>) ?? json;
    return sanitizePartial(data);
  } catch {
    return {};
  }
}

async function patchApiPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): Promise<void> {
  if (!_apiFetcher) return;
  try {
    await _apiFetcher(API_PATH, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  } catch {
    // non-fatal: AsyncStorage is the source of truth on failure
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hydration
// ─────────────────────────────────────────────────────────────────────────────

function ensureHydrated(): Promise<void> {
  if (_hydrationPromise) return _hydrationPromise;
  _hydrationStarted = true;
  _hydrationPromise = readAsyncStorage().then((stored) => {
    _prefs = { ..._prefs, ...stored };
    _hydrationDone = true;
    _isLoaded = true;
    notifyListeners();
  });
  // Always queue the API reconciliation behind hydration so the server has
  // the final say when both sources resolve.
  _hydrationPromise.then(() => ensureApiFetch());
  return _hydrationPromise;
}

function ensureApiFetch() {
  if (_apiFetchStarted || !_apiFetcher) return;
  if (!_hydrationDone) {
    // Defer until hydration completes. ensureHydrated() will retrigger us.
    ensureHydrated();
    return;
  }
  _apiFetchStarted = true;
  fetchApiPreferences().then((apiPrefs) => {
    if (Object.keys(apiPrefs).length === 0) return;
    // Server wins on conflict — overwrite even if local has a stale value.
    _prefs = { ..._prefs, ...apiPrefs };
    writeAsyncStorage(_prefs);
    _isLoaded = true;
    notifyListeners();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Synchronous accessors for non-React code (e.g. shared time formatters)
// ─────────────────────────────────────────────────────────────────────────────

export function getUserPreferencesSync(): UserPreferences {
  return _prefs;
}

/**
 * Returns the user's chosen IANA time zone, or `undefined` if no preference
 * is set. `undefined` is the right sentinel for `Intl.DateTimeFormat` — the
 * formatter falls back to the runtime's default zone.
 */
export function getUserTimeZone(): string | undefined {
  return _prefs.time_zone ?? undefined;
}

export function subscribeUserPreferences(listener: Listener): () => void {
  return subscribe(listener);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation
// ─────────────────────────────────────────────────────────────────────────────

export function setUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): void {
  if (!isValidPreference(key, value)) return;
  _prefs = { ..._prefs, [key]: value };
  writeAsyncStorage(_prefs);
  notifyListeners();

  const existing = _debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    patchApiPreference(key, value);
    _debounceTimers.delete(key);
  }, DEBOUNCE_MS);
  _debounceTimers.set(key, timer);
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseUserPreferencesResult {
  prefs: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  isLoaded: boolean;
}

export function useUserPreferences(): UseUserPreferencesResult {
  const [prefs, setPrefs] = useState<UserPreferences>(_prefs);
  const [isLoaded, setIsLoaded] = useState(_isLoaded);

  useEffect(() => {
    ensureHydrated();
    const unsub = subscribe((updated) => {
      setPrefs({ ...updated });
      setIsLoaded(true);
    });
    return unsub;
  }, []);

  const setPreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setUserPreference(key, value);
    },
    [],
  );

  return { prefs, setPreference, isLoaded };
}

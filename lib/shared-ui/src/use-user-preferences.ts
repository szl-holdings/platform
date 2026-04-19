/**
 * useUserPreferences — persisted user UI preference store
 *
 * Strategy:
 *  1. Read from localStorage synchronously so preferences are applied before
 *     the first React paint (no FOUC for sidebar state, sounds, etc.)
 *  2. After mount, fetch from the API and merge (API wins on conflict)
 *  3. On change: write to localStorage immediately AND debounce an API write
 *     so we don't hammer the server on rapid toggles
 *  4. When the user is unauthenticated (API returns 401), localStorage is the
 *     sole persistence layer — no errors are surfaced to the user
 *  5. Module-level singleton store so all hook consumers share the same state
 *     and updates propagate across all mounted components without a Provider
 *
 * Namespace: szl.ui.preferences
 * Keys defined in UserPreferences below.
 */

import { useState, useEffect, useCallback } from "react";

export interface UserPreferences {
  sidebar_collapsed: boolean;
  notification_sound: boolean;
}

const DEFAULTS: UserPreferences = {
  sidebar_collapsed: false,
  notification_sound: true,
};

const LS_KEY = "szl-ui-preferences";
const NAMESPACE = "szl.ui.preferences";
const DEBOUNCE_MS = 800;

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton store — shared across all hook consumers in one app
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (prefs: UserPreferences) => void;

let _prefs: UserPreferences = mergePrefs(DEFAULTS, readLocalStorageSync());
let _isLoaded = false;
const _listeners = new Set<Listener>();
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notifyListeners() {
  for (const listener of _listeners) {
    listener(_prefs);
  }
}

function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function readLocalStorageSync(): Partial<UserPreferences> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<UserPreferences>;
  } catch {
    return {};
  }
}

function writeLocalStorage(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

function mergePrefs(base: UserPreferences, patch: Partial<UserPreferences>): UserPreferences {
  return { ...base, ...patch } as UserPreferences;
}

async function fetchApiPreferences(): Promise<Partial<UserPreferences>> {
  try {
    const res = await fetch("/api/preferences", { credentials: "include" });
    if (!res.ok) return {};
    const json = await res.json();
    const data: Record<string, unknown> = json.data ?? json;
    const out: Partial<UserPreferences> = {};
    for (const key of Object.keys(DEFAULTS) as Array<keyof UserPreferences>) {
      if (key in data && data[key] !== undefined && data[key] !== null) {
        (out as Record<string, unknown>)[key] = data[key];
      }
    }
    return out;
  } catch {
    return {};
  }
}

async function patchApiPreference(key: keyof UserPreferences, value: boolean): Promise<void> {
  try {
    await fetch("/api/preferences", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ [key]: value }),
    });
  } catch {
    // non-fatal: localStorage is the source of truth on failure
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton API fetch — only fires once per app lifecycle
// ─────────────────────────────────────────────────────────────────────────────

let _fetchStarted = false;

function ensureApiFetch(): void {
  if (_fetchStarted || typeof window === "undefined") return;
  _fetchStarted = true;
  fetchApiPreferences().then((apiPrefs) => {
    _prefs = mergePrefs(_prefs, apiPrefs);
    writeLocalStorage(_prefs);
    _isLoaded = true;
    notifyListeners();
  });
}

// Cross-tab synchronization via storage events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== LS_KEY) return;
    if (e.newValue == null) {
      // Key was removed/cleared in another tab — reset to defaults
      _prefs = { ...DEFAULTS };
      notifyListeners();
      return;
    }
    try {
      const updated = JSON.parse(e.newValue) as Partial<UserPreferences>;
      _prefs = mergePrefs(DEFAULTS, updated);
      notifyListeners();
    } catch {
      // ignore malformed storage events
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared setter — can also be called outside React (e.g. from an event handler)
// ─────────────────────────────────────────────────────────────────────────────

export function setUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): void {
  _prefs = { ..._prefs, [key]: value };
  writeLocalStorage(_prefs);
  notifyListeners();

  const existingTimer = _debounceTimers.get(key);
  if (existingTimer) clearTimeout(existingTimer);
  const timer = setTimeout(() => {
    patchApiPreference(key as keyof UserPreferences, value as boolean);
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
    // Stay in sync with the singleton store
    const unsub = subscribe((updated) => {
      setPrefs({ ...updated });
      setIsLoaded(true);
    });
    // Trigger the API fetch if not already done
    ensureApiFetch();
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

export { NAMESPACE as PREFERENCES_NAMESPACE };

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
 *  6. Visual preferences (density, accent color) are applied to the document
 *     element on every change so all workspaces pick them up automatically
 *
 * Namespace: szl.ui.preferences
 * Keys defined in UserPreferences below.
 */

import { useCallback, useEffect, useState } from 'react';

export type UiDensity = 'comfortable' | 'compact';

export interface UserPreferences {
  sidebar_collapsed: boolean;
  notification_sound: boolean;
  /** Hex color (#RRGGBB) overriding the workspace's default accent, or null to use the default. */
  accent_color: string | null;
  /** Global UI density. Affects root font-size which cascades through tailwind rem-based spacing. */
  density: UiDensity;
  /** IANA time zone identifier (e.g. "America/New_York"), or null for the browser default. */
  time_zone: string | null;
}

const DEFAULTS: UserPreferences = {
  sidebar_collapsed: false,
  notification_sound: true,
  accent_color: null,
  density: 'comfortable',
  time_zone: null,
};

const LS_KEY = 'szl-ui-preferences';
const NAMESPACE = 'szl.ui.preferences';
const DEBOUNCE_MS = 800;

// ─────────────────────────────────────────────────────────────────────────────
// Validation — keep client and API in lockstep so a malformed value is dropped
// instead of corrupting the singleton store.
// ─────────────────────────────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function isValidPreference<K extends keyof UserPreferences>(
  key: K,
  value: unknown,
): value is UserPreferences[K] {
  switch (key) {
    case 'sidebar_collapsed':
    case 'notification_sound':
      return typeof value === 'boolean';
    case 'accent_color':
      return value === null || (typeof value === 'string' && HEX_COLOR_RE.test(value));
    case 'density':
      return value === 'comfortable' || value === 'compact';
    case 'time_zone':
      if (value === null) return true;
      if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false;
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton store — shared across all hook consumers in one app
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (prefs: UserPreferences) => void;

let _prefs: UserPreferences = mergePrefs(DEFAULTS, readLocalStorageSync());
let _isLoaded = false;
const _listeners = new Set<Listener>();
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notifyListeners() {
  applyPreferencesToDocument(_prefs);
  for (const listener of _listeners) {
    listener(_prefs);
  }
}

function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// ─────────────────────────────────────────────────────────────────────────────
// Document-level application of visual preferences
//
// We expose two hooks for downstream stylesheets:
//   - `data-szl-density` attribute on <html> ("comfortable" | "compact")
//   - `--szl-user-accent` CSS variable on :root (set when user has overridden)
//
// We also inject a baseline stylesheet once that maps density to root
// font-size so tailwind's rem-based spacing automatically tightens / relaxes.
// ─────────────────────────────────────────────────────────────────────────────

let _baselineStyleInjected = false;

function ensureBaselineStyle() {
  if (_baselineStyleInjected || typeof document === 'undefined') return;
  _baselineStyleInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-szl-preferences', 'baseline');
  // Density rules:
  //   - Root font-size shifts so all rem-based Tailwind spacing (p-*, gap-*,
  //     etc.) tightens proportionally — this carries shell, header, and
  //     content padding for free without overriding workspace-specific values.
  //   - Table cells tighten globally — every workspace renders dense tables
  //     and benefits from the row-height reduction.
  //   - Opt-in `[data-szl-density-card]` and `[data-szl-density-card-stack]`
  //     selectors let workspaces tighten card spacing where they want it.
  //   - `[data-szl-shell-main]` is a marker hook for the primary scrolling
  //     container so future per-workspace tweaks (or future global rules) can
  //     target it without each workspace having to wire up a class. We do not
  //     set padding from here — that would regress shells whose <main> has no
  //     base padding by adding spacing instead of tightening it.
  style.textContent = `
html[data-szl-density="comfortable"] { font-size: 16px; }
html[data-szl-density="compact"] { font-size: 14px; }

html[data-szl-density="compact"] table th,
html[data-szl-density="compact"] table td {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  line-height: 1.25;
}

html[data-szl-density="compact"] [data-szl-density-card] {
  padding: 0.625rem;
}
html[data-szl-density="compact"] [data-szl-density-card-stack] > * + * {
  margin-top: 0.5rem;
}
`.trim();
  document.head.appendChild(style);
}

function applyPreferencesToDocument(prefs: UserPreferences) {
  if (typeof document === 'undefined') return;
  ensureBaselineStyle();
  const root = document.documentElement;
  root.dataset.szlDensity = prefs.density;
  if (prefs.accent_color) {
    root.style.setProperty('--szl-user-accent', prefs.accent_color);
  } else {
    root.style.removeProperty('--szl-user-accent');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : '';
}

function readLocalStorageSync(): Partial<UserPreferences> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return sanitizePartial(parsed);
  } catch {
    return {};
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

function writeLocalStorage(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
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
    const res = await fetch('/api/preferences', { credentials: 'include' });
    if (!res.ok) return {};
    const json = await res.json();
    const data: Record<string, unknown> = json.data ?? json;
    return sanitizePartial(data);
  } catch {
    return {};
  }
}

async function patchApiPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): Promise<void> {
  try {
    await fetch('/api/preferences', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
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
  if (_fetchStarted || typeof window === 'undefined') return;
  _fetchStarted = true;
  fetchApiPreferences().then((apiPrefs) => {
    _prefs = mergePrefs(_prefs, apiPrefs);
    writeLocalStorage(_prefs);
    _isLoaded = true;
    notifyListeners();
  });
}

// Apply persisted prefs to the document as soon as the module loads so the
// first paint already reflects the user's saved density / accent.
applyPreferencesToDocument(_prefs);

// Cross-tab synchronization via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== LS_KEY) return;
    if (e.newValue == null) {
      // Key was removed/cleared in another tab — reset to defaults
      _prefs = { ...DEFAULTS };
      notifyListeners();
      return;
    }
    try {
      const updated = sanitizePartial(JSON.parse(e.newValue) as Record<string, unknown>);
      _prefs = mergePrefs(DEFAULTS, updated);
      notifyListeners();
    } catch {
      // ignore malformed storage events
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Synchronous accessors — let non-React code (e.g. shared formatting helpers)
// read the current preference snapshot without subscribing.
// ─────────────────────────────────────────────────────────────────────────────

export function getUserPreferencesSync(): UserPreferences {
  return _prefs;
}

/**
 * Returns the user's chosen IANA time zone, or `undefined` if no preference is
 * set. `undefined` is the right sentinel for `Intl.DateTimeFormat({ timeZone })`
 * — the formatter falls back to the runtime's default zone.
 */
export function getUserTimeZone(): string | undefined {
  return _prefs.time_zone ?? undefined;
}

/**
 * Subscribe to preference changes from non-React code. Returns an unsubscribe.
 */
export function subscribeUserPreferences(listener: Listener): () => void {
  return subscribe(listener);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared setter — can also be called outside React (e.g. from an event handler)
// ─────────────────────────────────────────────────────────────────────────────

export function setUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): void {
  if (!isValidPreference(key, value)) return;
  _prefs = { ..._prefs, [key]: value };
  writeLocalStorage(_prefs);
  notifyListeners();

  const existingTimer = _debounceTimers.get(key);
  if (existingTimer) clearTimeout(existingTimer);
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

// ─────────────────────────────────────────────────────────────────────────────
// Workspace personalization helpers
//
// Pattern for new workspaces:
//   1. Pick a brand-default accent (e.g. `LANE_ACCENT_HEX.terra.primary`).
//   2. In your layout, derive the chrome accent with `useEffectiveAccent(brand)`.
//      Pass that value into <SidebarNav accentColor={...} />, focus rings,
//      action buttons, and selection highlights so the user's `accent_color`
//      preference travels through. Keep brand-identity surfaces (logo lockup,
//      hero gradients) on the brand color so the workspace stays recognisable.
//   3. Mark the scrolling content element with `data-szl-shell-main` as a
//      future-proof hook so global rules can target it later. Compact mode
//      already tightens any rem-based padding on that element via the root
//      font-size shift — no per-workspace work needed.
//      Use `data-szl-density-card` on cards (or `data-szl-density-card-stack`
//      on a parent that vertically stacks cards) when you want compact mode
//      to tighten card padding/spacing too.
//   4. Tables get tighter row heights for free under compact mode.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the user's chosen accent color, falling back to the workspace brand
 * when no override is set. Subscribes to preference changes so the hook re-runs
 * when the user picks a new color in Settings.
 */
export function useEffectiveAccent(brandFallback: string): string {
  const { prefs } = useUserPreferences();
  return prefs.accent_color ?? brandFallback;
}

/**
 * Synchronous accessor for the effective accent — useful in non-React code
 * (event handlers, formatting helpers) that already has the brand fallback.
 */
export function getEffectiveAccent(brandFallback: string): string {
  return _prefs.accent_color ?? brandFallback;
}

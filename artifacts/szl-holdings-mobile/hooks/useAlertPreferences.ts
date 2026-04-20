import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/lib/apiClient";

export interface AlertPreferences {
  alerts_approvals_enabled: boolean;
  alerts_run_failures_enabled: boolean;
  alerts_quiet_hours_enabled: boolean;
  alerts_quiet_hours_start: string;
  alerts_quiet_hours_end: string;
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  alerts_approvals_enabled: true,
  alerts_run_failures_enabled: true,
  alerts_quiet_hours_enabled: false,
  alerts_quiet_hours_start: "22:00",
  alerts_quiet_hours_end: "07:00",
};

const CACHE_KEY = "cortex_alert_preferences_v1";

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function sanitize(raw: Partial<AlertPreferences> | null | undefined): AlertPreferences {
  const out: AlertPreferences = { ...DEFAULT_ALERT_PREFERENCES };
  if (!raw || typeof raw !== "object") return out;
  if (typeof raw.alerts_approvals_enabled === "boolean") out.alerts_approvals_enabled = raw.alerts_approvals_enabled;
  if (typeof raw.alerts_run_failures_enabled === "boolean") out.alerts_run_failures_enabled = raw.alerts_run_failures_enabled;
  if (typeof raw.alerts_quiet_hours_enabled === "boolean") out.alerts_quiet_hours_enabled = raw.alerts_quiet_hours_enabled;
  if (typeof raw.alerts_quiet_hours_start === "string" && HHMM_RE.test(raw.alerts_quiet_hours_start)) {
    out.alerts_quiet_hours_start = raw.alerts_quiet_hours_start;
  }
  if (typeof raw.alerts_quiet_hours_end === "string" && HHMM_RE.test(raw.alerts_quiet_hours_end)) {
    out.alerts_quiet_hours_end = raw.alerts_quiet_hours_end;
  }
  return out;
}

function parseHHMM(s: string): number {
  const m = HHMM_RE.exec(s);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/**
 * True when `now` falls inside the quiet-hours window [start, end).
 * The window may wrap past midnight (e.g. 22:00 → 07:00).
 */
export function isQuietHoursActive(prefs: AlertPreferences, now: Date = new Date()): boolean {
  if (!prefs.alerts_quiet_hours_enabled) return false;
  const start = parseHHMM(prefs.alerts_quiet_hours_start);
  const end = parseHHMM(prefs.alerts_quiet_hours_end);
  if (start === end) return false;
  const minute = now.getHours() * 60 + now.getMinutes();
  if (start < end) return minute >= start && minute < end;
  // Wrap-around window: active if after start OR before end.
  return minute >= start || minute < end;
}

interface CachedPrefs {
  prefs: AlertPreferences;
  loaded: boolean;
  saving: boolean;
  setPrefs: (next: Partial<AlertPreferences>) => Promise<void>;
  reload: () => Promise<void>;
}

let memoryCache: AlertPreferences | null = null;
const subscribers = new Set<(p: AlertPreferences) => void>();

function publish(p: AlertPreferences) {
  memoryCache = p;
  subscribers.forEach((cb) => cb(p));
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(p)).catch(() => {});
}

async function loadFromCache(): Promise<AlertPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function loadFromServer(): Promise<AlertPreferences | null> {
  try {
    const data = await apiFetch<Partial<AlertPreferences> & Record<string, unknown>>("/api/preferences");
    return sanitize(data);
  } catch {
    return null;
  }
}

export function useAlertPreferences(): CachedPrefs {
  const [prefs, setLocalPrefs] = useState<AlertPreferences>(memoryCache ?? DEFAULT_ALERT_PREFERENCES);
  const [loaded, setLoaded] = useState(memoryCache !== null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (p: AlertPreferences) => setLocalPrefs(p);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  const reload = useCallback(async () => {
    if (memoryCache === null) {
      const cached = await loadFromCache();
      if (cached) {
        setLocalPrefs(cached);
        memoryCache = cached;
        setLoaded(true);
      }
    }
    const server = await loadFromServer();
    if (server) {
      publish(server);
      setLoaded(true);
    } else if (memoryCache === null) {
      // Neither cache nor server — surface defaults so UI renders.
      memoryCache = DEFAULT_ALERT_PREFERENCES;
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setPrefs = useCallback(async (next: Partial<AlertPreferences>) => {
    const merged = sanitize({ ...(memoryCache ?? DEFAULT_ALERT_PREFERENCES), ...next });
    publish(merged);
    setSaving(true);
    try {
      await apiFetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {
      // Local cache + memory still hold the optimistic value; the next reload
      // will reconcile if the server rejected the change.
    } finally {
      setSaving(false);
    }
  }, []);

  return { prefs, loaded, saving, setPrefs, reload };
}

/**
 * Snapshot accessor for use outside React (e.g. inside a notifier callback).
 * Returns the most recently observed preferences, or defaults if unloaded.
 */
export function getAlertPreferencesSnapshot(): AlertPreferences {
  return memoryCache ?? DEFAULT_ALERT_PREFERENCES;
}

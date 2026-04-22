import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cortex_fusion_history_v1';
export const MAX_HISTORY = 10;
const MIN_QUERY_LENGTH = 3;

function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

export function dedupeHistory(next: string, existing: string[]): string[] {
  const trimmed = next.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return existing;
  const key = trimmed.toLowerCase();
  const filtered = existing.filter((q) => q.toLowerCase() !== key);
  return [trimmed, ...filtered].slice(0, MAX_HISTORY);
}

export function useFusionHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          setHistory(sanitize(JSON.parse(raw)));
        }
      } catch {
        // ignore corrupt cache
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addQuery = useCallback((query: string) => {
    setHistory((prev) => {
      const next = dedupeHistory(query, prev);
      if (next === prev) return prev;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([])).catch(() => {});
  }, []);

  return { history, hydrated, addQuery, clearHistory };
}

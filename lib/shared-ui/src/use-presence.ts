import { useState, useEffect, useRef, useCallback } from "react";

export interface PresenceUser {
  userId: string;
  since: number;
}

export interface PresenceState {
  count: number;
  users: PresenceUser[];
}

export interface UsePresenceOptions {
  apiBaseUrl?: string;
  pollIntervalMs?: number;
}

export interface UsePresenceResult {
  presence: PresenceState;
  isLoading: boolean;
  refresh: () => void;
}

const DEFAULT_POLL_MS = 30_000;

export function usePresence(
  channel: string,
  options: UsePresenceOptions = {},
): UsePresenceResult {
  const { apiBaseUrl = "/api", pollIntervalMs = DEFAULT_POLL_MS } = options;

  const [presence, setPresence] = useState<PresenceState>({ count: 0, users: [] });
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const channelRef = useRef(channel);

  useEffect(() => { channelRef.current = channel; }, [channel]);

  const fetchPresence = useCallback(async () => {
    try {
      const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      const res = await fetch(`${base}/realtime/presence/${encodeURIComponent(channelRef.current)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number; users: PresenceUser[] };
      if (mountedRef.current) {
        setPresence({ count: data.count, users: data.users });
        setIsLoading(false);
      }
    } catch {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [apiBaseUrl]);

  const refresh = useCallback(() => { void fetchPresence(); }, [fetchPresence]);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    void fetchPresence();

    const interval = setInterval(() => {
      if (mountedRef.current) void fetchPresence();
    }, pollIntervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [channel, fetchPresence, pollIntervalMs]);

  return { presence, isLoading, refresh };
}

export function useRealtimePresence(
  channel: string,
  wsMessages: Array<{ type?: string; channel?: string; data?: { count?: number; users?: PresenceUser[] } }>,
): PresenceState {
  const [presence, setPresence] = useState<PresenceState>({ count: 0, users: [] });

  useEffect(() => {
    for (const msg of wsMessages) {
      if ((msg as { type?: string }).type === "presence" && (msg as { channel?: string }).channel === channel) {
        const data = (msg as { data?: { count?: number; users?: PresenceUser[] } }).data;
        if (data) {
          setPresence({ count: data.count ?? 0, users: data.users ?? [] });
        }
      }
    }
  }, [channel, wsMessages]);

  return presence;
}

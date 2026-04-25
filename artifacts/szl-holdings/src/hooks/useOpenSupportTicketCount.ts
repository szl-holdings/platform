import { useEffect, useRef, useState } from 'react';

export interface SupportTicketsResponse {
  tickets?: Array<unknown>;
}

export function parseOpenTicketCount(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const tickets = (data as SupportTicketsResponse).tickets;
  return Array.isArray(tickets) ? tickets.length : 0;
}

export const OPEN_TICKETS_POLL_INTERVAL_MS = 60_000;
export const OPEN_TICKETS_ENDPOINT = '/api/support/tickets?status=open';

export interface OpenTicketCountResult {
  count: number;
}

export interface UseOpenSupportTicketCountOptions {
  /**
   * Skip polling when the caller is not in an authenticated/unlocked state.
   * Defaults to true. Setting to false avoids unnecessary 401 traffic while
   * the admin PIN gate is locked.
   */
  enabled?: boolean;
}

export function useOpenSupportTicketCount(
  opts: UseOpenSupportTicketCountOptions = {},
): OpenTicketCountResult {
  const enabled = opts.enabled ?? true;
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    mountedRef.current = true;
    const controller = new AbortController();

    async function fetchCount() {
      try {
        const res = await fetch(OPEN_TICKETS_ENDPOINT, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok) {
          if (mountedRef.current) setCount(0);
          return;
        }
        const json: unknown = await res.json();
        if (mountedRef.current) setCount(parseOpenTicketCount(json));
      } catch {
        // Ignore network/abort errors — badge simply does not render.
      }
    }

    void fetchCount();
    const intervalId = setInterval(() => {
      void fetchCount();
    }, OPEN_TICKETS_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [enabled]);

  return { count };
}

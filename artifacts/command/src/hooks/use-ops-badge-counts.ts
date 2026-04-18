import { useEffect, useState } from "react";

export interface OpsBadgeCounts {
  alerts: number | null;
  slaBreaches: number | null;
  governancePending: number | null;
}

const POLL_INTERVAL_MS = 30_000;

async function safeFetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useOpsBadgeCounts(): OpsBadgeCounts {
  const [counts, setCounts] = useState<OpsBadgeCounts>({
    alerts: null,
    slaBreaches: null,
    governancePending: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [alertsRes, slaRes, govRes] = await Promise.all([
        safeFetchJson<{ counts?: { active?: number } }>("/api/command/alerts"),
        safeFetchJson<{ summary?: { breaching?: number } }>("/api/command/sla"),
        safeFetchJson<{ summary?: { pendingApprovals?: number } }>("/api/command/governance"),
      ]);
      if (cancelled) return;
      setCounts({
        alerts: typeof alertsRes?.counts?.active === "number" ? alertsRes.counts.active : null,
        slaBreaches: typeof slaRes?.summary?.breaching === "number" ? slaRes.summary.breaching : null,
        governancePending:
          typeof govRes?.summary?.pendingApprovals === "number" ? govRes.summary.pendingApprovals : null,
      });
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return counts;
}

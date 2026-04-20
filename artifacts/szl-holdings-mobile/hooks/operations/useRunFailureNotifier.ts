import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { scheduleLocalAlert } from "@/lib/notifications";

interface WorkflowRun {
  id: number;
  state: "pending" | "running" | "completed" | "failed" | "cancelled" | string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

const STUCK_THRESHOLD_MS = 10 * 60 * 1000;

/**
 * App-level watcher that polls the runs endpoint and fires a local push
 * notification whenever a run newly transitions to "failed" or has been
 * "running" past the stuck threshold. Runs in the root layout so alerts fire
 * regardless of which screen the user is on. Tap-handler in `_layout.tsx`
 * routes the user to /(shell)/intelligence/run-review via the `kind` /
 * `deepLink` data on the notification payload.
 */
export function useRunFailureNotifier(): void {
  const seenFailedRef = useRef<Set<number>>(new Set());
  const seenStuckRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const runsQuery = useQuery<{ data: WorkflowRun[] } | WorkflowRun[]>({
    queryKey: ["app-run-failure-notifier"],
    queryFn: () =>
      apiFetch<{ data: WorkflowRun[] } | WorkflowRun[]>("/api/alloy/runs?limit=30"),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });

  useEffect(() => {
    const raw = runsQuery.data;
    if (raw === undefined) return;
    const allRuns: WorkflowRun[] = Array.isArray(raw)
      ? raw
      : ((raw as { data: WorkflowRun[] }).data ?? []);

    const now = Date.now();
    const failed = allRuns.filter((r) => r.state === "failed");
    const stuck = allRuns.filter((r) => {
      if (r.state !== "running" || !r.startedAt) return false;
      return now - new Date(r.startedAt).getTime() > STUCK_THRESHOLD_MS;
    });

    // Prime baseline on the first response (even if empty) so we only notify
    // for events observed after startup, but a first-ever event still fires.
    if (!initializedRef.current) {
      failed.forEach((r) => seenFailedRef.current.add(r.id));
      stuck.forEach((r) => seenStuckRef.current.add(r.id));
      initializedRef.current = true;
      return;
    }

    failed.forEach((r) => {
      if (seenFailedRef.current.has(r.id)) return;
      seenFailedRef.current.add(r.id);
      void scheduleLocalAlert({
        title: "Agent run failed",
        body: `Run #${r.id}${r.errorMessage ? `: ${r.errorMessage.slice(0, 80)}` : ""}`,
        data: {
          kind: "run_failed",
          runId: r.id,
          deepLink: "/(shell)/intelligence/run-review",
        },
      });
    });

    stuck.forEach((r) => {
      if (seenStuckRef.current.has(r.id)) return;
      seenStuckRef.current.add(r.id);
      void scheduleLocalAlert({
        title: "Agent run stuck",
        body: `Run #${r.id} has been running over 10 minutes`,
        data: {
          kind: "run_stuck",
          runId: r.id,
          deepLink: "/(shell)/intelligence/run-review",
        },
      });
    });
  }, [runsQuery.data]);
}

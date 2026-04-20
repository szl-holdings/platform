import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { scheduleLocalAlert } from "@/lib/notifications";
import {
  getAlertPreferencesSnapshot,
  isQuietHoursActive,
  useAlertPreferences,
} from "@/hooks/useAlertPreferences";

interface Approval {
  id: number;
  title: string;
  priority: string;
}

/**
 * App-level watcher that polls escalated approvals and fires a local push
 * notification when a new critical/high escalation appears. This is a
 * fallback for the server-side push (POST /approvals/:id/escalate fans out
 * via expo-push) so users still get an alert if the device push registration
 * is missing or the server push is delayed. Mounted in the root layout so it
 * fires regardless of active screen.
 */
export function useEscalatedApprovalNotifier(): void {
  // Subscribe so a settings change re-renders this watcher and the
  // preference snapshot read inside the effect picks up the new value.
  useAlertPreferences();
  const seenRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const escalationsQuery = useQuery<{ data: Approval[] } | Approval[]>({
    queryKey: ["app-escalated-approval-notifier"],
    queryFn: () =>
      apiFetch<{ data: Approval[] } | Approval[]>("/api/approvals?status=escalated"),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });

  useEffect(() => {
    const raw = escalationsQuery.data;
    if (raw === undefined) return;
    const escalations: Approval[] = Array.isArray(raw)
      ? raw
      : ((raw as { data: Approval[] }).data ?? []);

    // Prime baseline on the first response (even if empty) so a first
    // escalation observed after startup still fires.
    if (!initializedRef.current) {
      escalations.forEach((a) => seenRef.current.add(a.id));
      initializedRef.current = true;
      return;
    }

    const prefs = getAlertPreferencesSnapshot();
    if (!prefs.alerts_approvals_enabled) return;
    const quiet = isQuietHoursActive(prefs);

    escalations
      .filter((a) => a.priority === "critical" || a.priority === "high")
      .forEach((a) => {
        if (seenRef.current.has(a.id)) return;
        seenRef.current.add(a.id);
        // Critical approvals always wake the user. Non-critical ones (high)
        // are suppressed during quiet hours.
        if (quiet && a.priority !== "critical") return;
        void scheduleLocalAlert({
          title: "Approval escalated",
          body: a.title,
          data: {
            kind: "approval_escalated",
            approvalId: a.id,
            deepLink: "/(shell)/intelligence/approval-inbox",
          },
        });
      });
  }, [escalationsQuery.data]);
}

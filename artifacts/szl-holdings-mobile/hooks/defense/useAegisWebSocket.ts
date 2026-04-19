import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@szl-holdings/mobile-shared";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

interface IncidentSnapshot {
  id: number;
  title: string;
  severity: string;
  status: string;
  location: string;
  assignedTo: string | null;
  timestamp: string;
}

interface IncidentEvent {
  type: "incident_created" | "incident_updated" | "incident_closed";
  incident?: IncidentSnapshot;
}

export function useAegisWebSocket() {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
          if (!cancelled) setToken(t);
          return;
        }
        const SecureStore = (await import("expo-secure-store")).default;
        const t = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (!cancelled) setToken(t);
      } catch {
        if (!cancelled) setToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const url = domain
    ? `wss://${domain}/api/aegis/ws`
    : "";

  const handleMessage = useCallback(
    (data: unknown) => {
      const event = data as IncidentEvent;
      if (!event?.type) return;

      if (event.type === "incident_created" && event.incident) {
        const snapshot = event.incident;
        qc.setQueryData<IncidentSnapshot[]>(
          ["aegis-incidents"],
          (prev) => {
            if (!prev) return [snapshot];
            const exists = prev.some((i) => i.id === snapshot.id);
            return exists ? prev : [snapshot, ...prev];
          }
        );
      } else if (
        (event.type === "incident_updated" || event.type === "incident_closed") &&
        event.incident
      ) {
        const snapshot = event.incident;
        qc.setQueryData<IncidentSnapshot[]>(
          ["aegis-incidents"],
          (prev) => {
            if (!prev) return prev;
            return prev.map((i) =>
              i.id === snapshot.id ? { ...i, ...snapshot } : i
            );
          }
        );
      }

      qc.invalidateQueries({ queryKey: ["aegis-incidents"] });
    },
    [qc]
  );

  return useWebSocket({
    url,
    channel: "aegis-incidents",
    token: token ?? undefined,
    onMessage: handleMessage,
    enabled: token !== undefined && url !== "",
  });
}

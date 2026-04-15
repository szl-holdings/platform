import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@szl-holdings/mobile-shared";

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("vessels_auth_token");
    }
    const { default: SecureStore } = await import("expo-secure-store");
    return SecureStore.getItemAsync("vessels_auth_token");
  } catch {
    return null;
  }
}

export interface VesselPositionEvent {
  vesselId: number;
  mmsi?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  status?: string;
  timestamp: string;
}

export function useVesselsWebSocket() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = domain && Platform.OS !== "web" ? `wss://${domain}/ws` : null;

  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  const handleMessage = useCallback((event: VesselPositionEvent) => {
    qcRef.current.setQueryData<{ id: number; latitude?: string; longitude?: string; speed?: string; status?: string }[]>(
      ["vessels-roster"],
      (old) => {
        if (!old) return old;
        return old.map((v) =>
          v.id === event.vesselId
            ? {
                ...v,
                latitude: event.latitude?.toString() ?? v.latitude,
                longitude: event.longitude?.toString() ?? v.longitude,
                speed: event.speed?.toString() ?? v.speed,
                status: event.status ?? v.status,
              }
            : v
        );
      }
    );
    qcRef.current.invalidateQueries({ queryKey: ["vessels-roster"] });
  }, []);

  const handleInvalidate = useCallback(() => {
    qcRef.current.invalidateQueries({ queryKey: ["vessels-roster"] });
  }, []);

  const { status } = useWebSocket<VesselPositionEvent>({
    url,
    channel: "vessel-positions",
    token: token ?? undefined,
    onMessage: handleMessage,
    onInvalidate: handleInvalidate,
    enabled: token !== undefined && Platform.OS !== "web",
  });

  return { wsStatus: status };
}

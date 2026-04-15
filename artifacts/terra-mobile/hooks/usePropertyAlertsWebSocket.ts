import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@szl-holdings/mobile-shared";

export interface PropertyAlertEvent {
  propertyId: number;
  alertType: "price-change" | "status-change" | "new-listing" | "offer" | "close";
  title: string;
  body?: string;
  price?: number;
  status?: string;
  timestamp: string;
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("terra_auth_token");
    }
    const { default: SecureStore } = await import("expo-secure-store");
    return SecureStore.getItemAsync("terra_auth_token");
  } catch {
    return null;
  }
}

export function usePropertyAlertsWebSocket() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = domain && Platform.OS !== "web" ? `wss://${domain}/ws` : null;

  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  const handleMessage = useCallback((alert: PropertyAlertEvent) => {
    qcRef.current.setQueriesData<{ properties?: { id: number; price?: string; status?: string }[] }>(
      { queryKey: ["terra-properties"] },
      (old) => {
        if (!old) return old;
        const properties = old.properties ?? [];
        return {
          ...old,
          properties: properties.map((p) =>
            p.id === alert.propertyId
              ? {
                  ...p,
                  price: alert.price?.toString() ?? p.price,
                  status: alert.status ?? p.status,
                }
              : p
          ),
        };
      }
    );
    qcRef.current.invalidateQueries({ queryKey: ["terra-properties"] });
  }, []);

  const handleInvalidate = useCallback(() => {
    qcRef.current.invalidateQueries({ queryKey: ["terra-properties"] });
  }, []);

  const { status } = useWebSocket<PropertyAlertEvent>({
    url,
    channel: "property-alerts",
    token: token ?? undefined,
    onMessage: handleMessage,
    onInvalidate: handleInvalidate,
    enabled: token !== undefined && Platform.OS !== "web",
  });

  return { wsStatus: status };
}

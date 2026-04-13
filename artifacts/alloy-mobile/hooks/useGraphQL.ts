import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { scheduleLocalNotification } from "@/hooks/usePushNotifications";

async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export interface AlloyWorkflowEvent {
  id: string | number;
  workflowId?: number | null;
  state: string;
}

interface WsMessage {
  type: string;
  channel?: string;
  event?: string;
  data?: AlloyWorkflowEvent;
  clientId?: string;
  timestamp?: number;
  code?: string;
  message?: string;
}

export function useWorkflowEventSubscription() {
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    if (Platform.OS === "web") return;
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;

    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let alive = true;

    const connect = async () => {
      const token = await getAuthToken();
      try {
        ws = new WebSocket(`wss://${domain}/ws`);

        ws.onopen = () => {
          if (!ws || !alive) return;
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel: "workflow-runs",
              token: token ?? undefined,
            }),
          );
          pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (!alive) return;
          try {
            const msg = JSON.parse(event.data as string) as WsMessage;

            if (msg.type === "message" && msg.channel === "workflow-runs") {
              const run = msg.data;
              if (run) {
                qcRef.current.invalidateQueries({ queryKey: ["alloy-runs"] });
                qcRef.current.invalidateQueries({ queryKey: ["alloy-agents"] });

                if (run.state === "waiting_approval") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
                    (err) => { console.warn("[WS] Haptics failed:", err); },
                  );
                  scheduleLocalNotification(
                    "Approval Required",
                    `Workflow run #${run.id} needs your approval`,
                    { type: "approval_request", runId: run.id }
                  ).catch((err) => { console.warn("[WS] Push notification failed:", err); });
                }

                if (run.state === "failed") {
                  qcRef.current.invalidateQueries({ queryKey: ["alloy-approvals-pending"] });
                }
              }
            } else if (msg.type === "error") {
              console.warn("[WS] workflow-runs error:", msg.code, msg.message);
            }
          } catch (parseErr) {
            console.warn("[WS] Failed to parse message:", parseErr);
          }
        };

        ws.onerror = (err) => {
          console.warn("[WS] WebSocket error:", err);
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
        };
      } catch (err) {
        console.warn("[WS] Failed to connect:", err);
      }
    };

    connect().catch((err) => {
      console.warn("[WS] Async connect failed:", err);
    });

    return () => {
      alive = false;
      if (pingInterval) clearInterval(pingInterval);
      ws?.close();
    };
  }, []);
}

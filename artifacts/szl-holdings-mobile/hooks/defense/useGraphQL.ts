import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AUTH_TOKEN_KEY } from '@/context/AuthContext';
import { sendCriticalIncidentNotification } from '@/hooks/usePushNotifications';

async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export interface AegisIncidentEvent {
  id: string | number;
  title: string;
  severity: string;
  status: string;
  detectedAt?: string;
  createdAt?: string;
}

interface WsMessage {
  type: string;
  channel?: string;
  event?: string;
  data?: AegisIncidentEvent;
  clientId?: string;
  timestamp?: number;
  code?: string;
  message?: string;
}

export function useIncidentSubscription() {
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    if (Platform.OS === 'web') return;
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
              type: 'subscribe',
              channel: 'aegis-incidents',
              token: token ?? undefined,
            }),
          );
          pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (!alive) return;
          try {
            const msg = JSON.parse(event.data as string) as WsMessage;

            if (msg.type === 'message' && msg.channel === 'aegis-incidents') {
              const incident = msg.data;
              if (incident) {
                qcRef.current.invalidateQueries({ queryKey: ['aegis-incidents'] });
                qcRef.current.invalidateQueries({
                  queryKey: ['aegis-incident', String(incident.id)],
                });
                qcRef.current.invalidateQueries({ queryKey: ['aegis-threat-summary'] });

                const sev = (incident.severity ?? '').toLowerCase();
                if (sev === 'critical' || sev === 'high') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
                    (_err) => {
                    },
                  );
                  sendCriticalIncidentNotification(incident.title, incident.severity).catch(
                    (_err) => {
                    },
                  );
                }
              }
            } else if (msg.type === 'error') {
            }
          } catch (_parseErr) {
          }
        };

        ws.onerror = (_err) => {
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
        };
      } catch (_err) {
      }
    };

    connect().catch((_err) => {
    });

    return () => {
      alive = false;
      if (pingInterval) clearInterval(pingInterval);
      ws?.close();
    };
  }, []);
}

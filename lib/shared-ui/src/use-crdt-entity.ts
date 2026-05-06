import { useCallback, useEffect, useRef, useState } from 'react';

export interface FieldSchema {
  conflictReview?: boolean;
}

export interface EntitySchema {
  entityType: string;
  fields: Record<string, FieldSchema>;
}

export interface CrdtMergeEvent {
  actorId: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  requiresReview: boolean;
}

export interface UseCrdtEntityOptions {
  apiBaseUrl?: string;
  actorId?: string;
  schema?: EntitySchema;
  onMerge?: (events: CrdtMergeEvent[]) => void;
}

export interface UseCrdtEntityResult {
  fields: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
  isConnected: boolean;
  pendingMerges: CrdtMergeEvent[];
  clearMerges: () => void;
}

interface LwwField {
  value: unknown;
  timestamp: number;
  actorId: string;
  clock: Record<string, number>;
}

interface CrdtDeltaMsg {
  type: 'crdt:delta';
  room: string;
  entityType: string;
  entityId: string;
  actorId: string;
  timestamp: number;
  delta: Record<string, LwwField>;
  clock: Record<string, number>;
}

function lwwWins(a: LwwField, b: LwwField): LwwField {
  if (a.timestamp > b.timestamp) return a;
  if (b.timestamp > a.timestamp) return b;
  return a.actorId >= b.actorId ? a : b;
}

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

export function useCrdtEntity(
  entityType: string,
  entityId: string,
  initialValues: Record<string, unknown> = {},
  options: UseCrdtEntityOptions = {},
): UseCrdtEntityResult {
  const { apiBaseUrl = '/api', actorId = 'anon', schema, onMerge } = options;
  const room = `${entityType}:${entityId}`;

  const [fields, setFields] = useState<Record<string, unknown>>(initialValues);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingMerges, setPendingMerges] = useState<CrdtMergeEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const clockRef = useRef<Record<string, number>>({});
  const fieldStatesRef = useRef<Record<string, LwwField>>({});
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    for (const [key, value] of Object.entries(initialValues)) {
      if (!fieldStatesRef.current[key]) {
        fieldStatesRef.current[key] = {
          value,
          timestamp: 0,
          actorId: '__initial__',
          clock: {},
        };
      }
    }
  }, [initialValues]);

  const connect = useCallback(() => {
    const url = getWsUrl();
    if (!url || !mountedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ type: 'crdt:subscribe', room }));
      setIsConnected(true);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(ev.data as string) as {
          type: string;
          room?: string;
          delta?: Record<string, LwwField>;
          entityType?: string;
          entityId?: string;
          actorId?: string;
          ts?: number;
          clock?: Record<string, number>;
        };
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }
        if (msg.type !== 'crdt:delta' || msg.room !== room) return;

        const delta = msg.delta ?? {};
        const mergeEvents: CrdtMergeEvent[] = [];

        setFields((prev) => {
          const next = { ...prev };
          for (const [key, incoming] of Object.entries(delta)) {
            // Defend against prototype pollution from untrusted WebSocket peers.
            // CodeQL js/remote-property-injection.
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            const existing = fieldStatesRef.current[key];
            if (!existing) {
              fieldStatesRef.current[key] = incoming;
              next[key] = incoming.value;
            } else {
              const winner = lwwWins(existing, incoming);
              if (winner.value !== existing.value && msg.actorId && msg.actorId !== actorId) {
                const fieldSchema = schema?.fields[key];
                mergeEvents.push({
                  actorId: msg.actorId,
                  fieldKey: key,
                  oldValue: existing.value,
                  newValue: winner.value,
                  requiresReview: fieldSchema?.conflictReview ?? false,
                });
              }
              fieldStatesRef.current[key] = winner;
              next[key] = winner.value;
            }
          }

          if (msg.clock) {
            for (const [actor, tick] of Object.entries(msg.clock)) {
              if (actor === '__proto__' || actor === 'constructor' || actor === 'prototype') continue;
              clockRef.current[actor] = Math.max(clockRef.current[actor] ?? 0, tick);
            }
          }

          return next;
        });

        if (mergeEvents.length > 0) {
          setPendingMerges((prev) => [...prev, ...mergeEvents]);
          onMerge?.(mergeEvents);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [room, actorId, schema, onMerge]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const setField = useCallback(
    (key: string, value: unknown) => {
      const myTick = (clockRef.current[actorId] ?? 0) + 1;
      clockRef.current[actorId] = myTick;

      const newClock = { ...clockRef.current };
      const timestamp = Date.now();
      const field: LwwField = { value, timestamp, actorId, clock: newClock };

      fieldStatesRef.current[key] = field;
      setFields((prev) => ({ ...prev, [key]: value }));

      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'crdt:delta',
            room,
            entityType,
            entityId,
            actorId,
            delta: { [key]: field },
            clock: newClock,
          }),
        );
      } else {
        fetch(`${apiBaseUrl}/changes`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            entityId,
            actorId,
            delta: { [key]: field },
            crdtClock: newClock,
          }),
        }).catch(() => {
          /* ignore */
        });
      }
    },
    [room, entityType, entityId, actorId, apiBaseUrl],
  );

  const clearMerges = useCallback(() => setPendingMerges([]), []);

  return { fields, setField, isConnected, pendingMerges, clearMerges };
}

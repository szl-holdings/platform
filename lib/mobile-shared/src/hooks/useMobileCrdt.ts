import { useCallback, useEffect, useRef, useState } from 'react';
import { getDomainBaseUrl } from '../env';
import {
  applyDeltaToReplica,
  enqueueOutbox,
  getLocalReplica,
  getOutbox,
  getStoredCursor,
  removeFromOutbox,
  saveStoredCursor,
} from '../offline-persistence';
import { useApiStatus } from './useApiStatus';

const API_BASE = getDomainBaseUrl();

export interface MobileCrdtMergeEvent {
  actorId: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface UseMobileCrdtResult {
  fields: Record<string, unknown>;
  setField: (key: string, value: unknown) => Promise<void>;
  isReady: boolean;
  pendingCount: number;
  mergeEvents: MobileCrdtMergeEvent[];
  clearMergeEvents: () => void;
  syncNow: () => Promise<void>;
}

interface LwwField {
  value: unknown;
  timestamp: number;
  actorId: string;
  clock: Record<string, number>;
}

export function useMobileCrdt(
  entityType: string,
  entityId: string,
  actorId: string,
  initialValues: Record<string, unknown> = {},
): UseMobileCrdtResult {
  const { isOffline } = useApiStatus();
  const [fields, setFields] = useState<Record<string, unknown>>(initialValues);
  const [isReady, setIsReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mergeEvents, setMergeEvents] = useState<MobileCrdtMergeEvent[]>([]);
  const clockRef = useRef<Record<string, number>>({});
  const fieldStatesRef = useRef<Record<string, LwwField>>({});

  useEffect(() => {
    let cancelled = false;
    getLocalReplica(entityType, entityId).then((replica) => {
      if (cancelled) return;
      if (replica) {
        setFields(replica.fields);
        fieldStatesRef.current = replica.fieldStates as Record<string, LwwField>;
      } else {
        setFields(initialValues);
        for (const [k, v] of Object.entries(initialValues)) {
          fieldStatesRef.current[k] = {
            value: v,
            timestamp: 0,
            actorId: '__initial__',
            clock: {},
          };
        }
      }
      setIsReady(true);
    });

    getOutbox().then((outbox) => {
      if (!cancelled) setPendingCount(outbox.length);
    });

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, initialValues]);

  const setField = useCallback(
    async (key: string, value: unknown) => {
      const myTick = (clockRef.current[actorId] ?? 0) + 1;
      clockRef.current[actorId] = myTick;
      const clock = { ...clockRef.current };
      const timestamp = Date.now();
      const field: LwwField = { value, timestamp, actorId, clock };

      fieldStatesRef.current[key] = field;
      setFields((prev) => ({ ...prev, [key]: value }));

      const delta = { [key]: field };

      await applyDeltaToReplica(entityType, entityId, delta, actorId);

      if (isOffline || !API_BASE) {
        await enqueueOutbox({ entityType, entityId, actorId, delta, clock });
        setPendingCount((n) => n + 1);
      } else {
        try {
          await fetch(`${API_BASE}/api/changes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType,
              entityId,
              actorId,
              delta,
              crdtClock: clock,
              appSource: 'mobile',
            }),
          });
        } catch {
          await enqueueOutbox({ entityType, entityId, actorId, delta, clock });
          setPendingCount((n) => n + 1);
        }
      }
    },
    [entityType, entityId, actorId, isOffline],
  );

  const syncNow = useCallback(async () => {
    if (isOffline || !API_BASE) return;

    const outbox = await getOutbox();
    if (outbox.length === 0) {
      await pollRemoteChangesRef.current?.();
      return;
    }

    const flushed: string[] = [];
    for (const entry of outbox) {
      try {
        const res = await fetch(`${API_BASE}/api/changes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: entry.entityType,
            entityId: entry.entityId,
            actorId: entry.actorId,
            delta: entry.delta,
            crdtClock: entry.clock,
            appSource: 'mobile',
          }),
        });
        if (res.ok) flushed.push(entry.id);
      } catch {
        /* retry next time */
      }
    }

    if (flushed.length > 0) {
      await removeFromOutbox(flushed);
      const remaining = await getOutbox();
      setPendingCount(remaining.length);
    }

    await pollRemoteChangesRef.current?.();
  }, [isOffline]);

  const pollRemoteChangesRef = useRef<(() => Promise<void>) | null>(null);

  const pollRemoteChanges = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const cursor = await getStoredCursor();
      const url = `${API_BASE}/api/changes?cursor=${cursor}&entity=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&limit=100`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) return;

      const body = (await res.json()) as {
        events: Array<{
          cursor: number;
          entityType: string;
          entityId: string;
          actorId: string;
          delta: Record<string, LwwField>;
          crdtClock: Record<string, number>;
        }>;
        cursor: number;
        hasMore: boolean;
      };

      const events = body.events ?? [];
      const newCursor = body.cursor ?? cursor;

      const newMerges: MobileCrdtMergeEvent[] = [];

      for (const event of events) {
        if (event.actorId === actorId) continue;
        if (event.entityType !== entityType || event.entityId !== entityId) continue;

        const replica = await applyDeltaToReplica(
          event.entityType,
          event.entityId,
          event.delta,
          event.actorId,
        );

        setFields((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(replica.fields)) {
            if (v !== prev[k]) {
              newMerges.push({
                actorId: event.actorId,
                fieldKey: k,
                oldValue: prev[k],
                newValue: v,
              });
            }
            next[k] = v;
          }
          return next;
        });
      }

      if (newMerges.length > 0) {
        setMergeEvents((prev) => [...prev, ...newMerges]);
      }

      if (newCursor > cursor) {
        await saveStoredCursor(newCursor);
      }
    } catch {
      /* ignore */
    }
  }, [entityType, entityId, actorId]);

  useEffect(() => {
    pollRemoteChangesRef.current = pollRemoteChanges;
  }, [pollRemoteChanges]);

  useEffect(() => {
    if (!isOffline && isReady) {
      syncNow();
    }
  }, [isOffline, isReady, syncNow]);

  useEffect(() => {
    if (isOffline || !isReady) return;
    const interval = setInterval(syncNow, 30_000);
    return () => clearInterval(interval);
  }, [isOffline, isReady, syncNow]);

  const clearMergeEvents = useCallback(() => setMergeEvents([]), []);

  return {
    fields,
    setField,
    isReady,
    pendingCount,
    mergeEvents,
    clearMergeEvents,
    syncNow,
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const OUTBOX_KEY = 'crdt_outbox';
const REPLICA_PREFIX = 'crdt_replica:';
const CURSOR_KEY = 'crdt_cursor';

export interface OutboxEntry {
  id: string;
  entityType: string;
  entityId: string;
  actorId: string;
  delta: Record<string, unknown>;
  clock: Record<string, number>;
  queuedAt: number;
  attempts: number;
}

export interface LocalReplica {
  entityType: string;
  entityId: string;
  fields: Record<string, unknown>;
  fieldStates: Record<
    string,
    { value: unknown; timestamp: number; actorId: string; clock: Record<string, number> }
  >;
  updatedAt: number;
}

async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export async function getOutbox(): Promise<OutboxEntry[]> {
  return (await loadJson<OutboxEntry[]>(OUTBOX_KEY)) ?? [];
}

export async function enqueueOutbox(
  entry: Omit<OutboxEntry, 'id' | 'queuedAt' | 'attempts'>,
): Promise<void> {
  const outbox = await getOutbox();
  const newEntry: OutboxEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    queuedAt: Date.now(),
    attempts: 0,
  };
  outbox.push(newEntry);
  await saveJson(OUTBOX_KEY, outbox);
}

export async function removeFromOutbox(ids: string[]): Promise<void> {
  const outbox = await getOutbox();
  const idSet = new Set(ids);
  await saveJson(
    OUTBOX_KEY,
    outbox.filter((e) => !idSet.has(e.id)),
  );
}

export async function incrementOutboxAttempts(id: string): Promise<void> {
  const outbox = await getOutbox();
  const entry = outbox.find((e) => e.id === id);
  if (entry) {
    entry.attempts++;
    await saveJson(OUTBOX_KEY, outbox);
  }
}

export async function getLocalReplica(
  entityType: string,
  entityId: string,
): Promise<LocalReplica | null> {
  return loadJson<LocalReplica>(`${REPLICA_PREFIX}${entityType}:${entityId}`);
}

export async function saveLocalReplica(replica: LocalReplica): Promise<void> {
  await saveJson(`${REPLICA_PREFIX}${replica.entityType}:${replica.entityId}`, replica);
}

export async function applyDeltaToReplica(
  entityType: string,
  entityId: string,
  delta: Record<
    string,
    { value: unknown; timestamp: number; actorId: string; clock: Record<string, number> }
  >,
  _actorId: string,
): Promise<LocalReplica> {
  const existing = (await getLocalReplica(entityType, entityId)) ?? {
    entityType,
    entityId,
    fields: {},
    fieldStates: {},
    updatedAt: 0,
  };

  for (const [key, incoming] of Object.entries(delta)) {
    const current = existing.fieldStates[key];
    if (
      !current ||
      incoming.timestamp > current.timestamp ||
      (incoming.timestamp === current.timestamp && incoming.actorId >= current.actorId)
    ) {
      existing.fieldStates[key] = incoming;
      existing.fields[key] = incoming.value;
    }
  }
  existing.updatedAt = Date.now();

  await saveLocalReplica(existing);
  return existing;
}

export async function getStoredCursor(): Promise<number> {
  const val = await loadJson<number>(CURSOR_KEY);
  return val ?? 0;
}

export async function saveStoredCursor(cursor: number): Promise<void> {
  await saveJson(CURSOR_KEY, cursor);
}

export async function clearLocalData(entityType?: string, entityId?: string): Promise<void> {
  if (entityType && entityId) {
    await AsyncStorage.removeItem(`${REPLICA_PREFIX}${entityType}:${entityId}`);
  } else {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(
      (k) => k.startsWith(REPLICA_PREFIX) || k === OUTBOX_KEY || k === CURSOR_KEY,
    );
    await AsyncStorage.multiRemove(toRemove);
  }
}

import type {
  CrdtDelta,
  CrdtState,
  EntitySchema,
  LwwField,
  MergeResult,
  UpdateCallback,
  VectorClock,
} from './types.js';

function clockDominates(a: VectorClock, b: VectorClock): boolean {
  for (const [actor, tick] of Object.entries(b)) {
    if ((a[actor] ?? 0) < tick) return false;
  }
  return true;
}

function mergeClock(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = { ...a };
  for (const [actor, tick] of Object.entries(b)) {
    merged[actor] = Math.max(merged[actor] ?? 0, tick);
  }
  return merged;
}

function lwwWins(a: LwwField, b: LwwField): LwwField {
  if (a.timestamp > b.timestamp) return a;
  if (b.timestamp > a.timestamp) return b;
  return a.actorId >= b.actorId ? a : b;
}

export class CrdtDoc {
  private state: CrdtState;
  private schema: EntitySchema | null;
  private subscribers: Set<UpdateCallback> = new Set();

  constructor(entityType: string, entityId: string, schema?: EntitySchema) {
    this.schema = schema ?? null;
    this.state = {
      docId: `${entityType}:${entityId}`,
      entityType,
      entityId,
      clock: {},
      fields: {},
      updatedAt: 0,
    };
  }

  getState(): CrdtState {
    return { ...this.state, fields: { ...this.state.fields } };
  }

  getFieldValues(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(this.state.fields)) {
      result[key] = field.value;
    }
    return result;
  }

  setField(actorId: string, fieldKey: string, value: unknown): CrdtDelta {
    const timestamp = Date.now();
    const newClock: VectorClock = {
      ...this.state.clock,
      [actorId]: (this.state.clock[actorId] ?? 0) + 1,
    };
    const field: LwwField = { value, timestamp, actorId, clock: { ...newClock } };
    const delta: CrdtDelta = {
      docId: this.state.docId,
      entityType: this.state.entityType,
      entityId: this.state.entityId,
      actorId,
      timestamp,
      clock: newClock,
      fields: { [fieldKey]: field },
    };
    this.applyDelta(delta, false);
    return delta;
  }

  applyDelta(delta: CrdtDelta, remote = true): MergeResult {
    const conflicts: string[] = [];
    let anyMerged = false;

    for (const [key, incoming] of Object.entries(delta.fields)) {
      const existing = this.state.fields[key];
      if (!existing) {
        this.state.fields[key] = incoming;
        anyMerged = true;
      } else {
        const winner = lwwWins(existing, incoming);
        if (winner !== existing) {
          const fieldSchema = this.schema?.fields[key];
          if (fieldSchema?.conflictReview && remote && existing.actorId !== incoming.actorId) {
            conflicts.push(key);
          }
          this.state.fields[key] = winner;
          anyMerged = true;
        } else if (
          winner === existing &&
          remote &&
          existing.actorId !== incoming.actorId &&
          Math.abs(existing.timestamp - incoming.timestamp) < 100
        ) {
          const fieldSchema = this.schema?.fields[key];
          if (fieldSchema?.conflictReview) {
            conflicts.push(key);
          }
        }
      }
    }

    this.state.clock = mergeClock(this.state.clock, delta.clock);
    this.state.updatedAt = Math.max(this.state.updatedAt, delta.timestamp);

    const result: MergeResult = { delta, merged: anyMerged, conflicts };

    if (remote && anyMerged) {
      for (const cb of this.subscribers) {
        try {
          cb(delta, true);
        } catch {
          /* ignore */
        }
      }
    }

    return result;
  }

  onUpdate(callback: UpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  serializeDoc(): string {
    return JSON.stringify(this.state);
  }

  static deserializeDoc(serialized: string, schema?: EntitySchema): CrdtDoc {
    const state = JSON.parse(serialized) as CrdtState;
    const doc = new CrdtDoc(state.entityType, state.entityId, schema);
    doc.state = state;
    return doc;
  }

  hasCausalHistory(delta: CrdtDelta): boolean {
    return clockDominates(this.state.clock, delta.clock);
  }
}

const docRegistry = new Map<string, CrdtDoc>();

export function getOrCreateDoc(
  entityType: string,
  entityId: string,
  schema?: EntitySchema,
): CrdtDoc {
  const key = `${entityType}:${entityId}`;
  let doc = docRegistry.get(key);
  if (!doc) {
    doc = new CrdtDoc(entityType, entityId, schema);
    docRegistry.set(key, doc);
  }
  return doc;
}

export function evictDoc(entityType: string, entityId: string): void {
  docRegistry.delete(`${entityType}:${entityId}`);
}

export function getDocRegistry(): Map<string, CrdtDoc> {
  return docRegistry;
}

const MAX_REGISTRY_SIZE = 200;
export function pruneRegistry(): void {
  if (docRegistry.size > MAX_REGISTRY_SIZE) {
    const keys = Array.from(docRegistry.keys());
    for (let i = 0; i < keys.length - MAX_REGISTRY_SIZE; i++) {
      docRegistry.delete(keys[i]!);
    }
  }
}

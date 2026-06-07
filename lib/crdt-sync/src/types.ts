export interface VectorClock {
  [actorId: string]: number;
}

export interface LwwField {
  value: unknown;
  timestamp: number;
  actorId: string;
  clock: VectorClock;
}

export interface CrdtDelta {
  docId: string;
  entityType: string;
  entityId: string;
  actorId: string;
  timestamp: number;
  clock: VectorClock;
  fields: Record<string, LwwField>;
}

export interface CrdtState {
  docId: string;
  entityType: string;
  entityId: string;
  clock: VectorClock;
  fields: Record<string, LwwField>;
  updatedAt: number;
}

export interface EntitySchema {
  entityType: string;
  fields: Record<string, FieldSchema>;
}

export interface FieldSchema {
  conflictReview?: boolean;
}

export type UpdateCallback = (delta: CrdtDelta, merged: boolean) => void;

export interface MergeResult {
  delta: CrdtDelta;
  merged: boolean;
  conflicts: string[];
}

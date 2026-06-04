import { z } from 'zod';

export const ReplaySnapshotSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  label: z.string(),
  domain: z.string(),
  snapshotType: z.enum(['incident', 'flow', 'decision', 'audit']),
  historicalContext: z.record(z.unknown()),
  agentInputs: z.array(z.record(z.unknown())),
  groundTruth: z.record(z.unknown()).optional(),
  sanitized: z.boolean().default(true),
  createdAt: z.string().datetime(),
  version: z.string().default('1.0'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type ReplaySnapshot = z.infer<typeof ReplaySnapshotSchema>;

const snapshotStore = new Map<string, ReplaySnapshot>();

export function createSnapshot(
  data: Omit<ReplaySnapshot, 'createdAt' | 'sanitized'>,
): ReplaySnapshot {
  const snapshot: ReplaySnapshot = {
    ...data,
    sanitized: true,
    createdAt: new Date().toISOString(),
  };
  snapshotStore.set(snapshot.id, snapshot);
  return snapshot;
}

export function getSnapshot(id: string): ReplaySnapshot | undefined {
  return snapshotStore.get(id);
}

export function listSnapshots(filter?: {
  domain?: string;
  snapshotType?: string;
  tags?: string[];
}): ReplaySnapshot[] {
  const all = Array.from(snapshotStore.values());
  return all.filter((s) => {
    if (filter?.domain && s.domain !== filter.domain) return false;
    if (filter?.snapshotType && s.snapshotType !== filter.snapshotType) return false;
    if (filter?.tags?.length) {
      const hasAll = filter.tags.every((t) => s.tags.includes(t));
      if (!hasAll) return false;
    }
    return true;
  });
}

export function deleteSnapshot(id: string): boolean {
  return snapshotStore.delete(id);
}

export function redactPII(
  snapshot: ReplaySnapshot,
  sensitiveKeys: string[] = ['email', 'phone', 'ssn', 'name', 'address', 'ip'],
): ReplaySnapshot {
  function deepRedact(obj: unknown, keys: string[]): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => deepRedact(item, keys));
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const shouldRedact = keys.some((key) => k.toLowerCase().includes(key.toLowerCase()));
      result[k] = shouldRedact ? '[REDACTED]' : deepRedact(v, keys);
    }
    return result;
  }

  return {
    ...snapshot,
    historicalContext: deepRedact(snapshot.historicalContext, sensitiveKeys) as Record<
      string,
      unknown
    >,
    agentInputs: snapshot.agentInputs.map(
      (i) => deepRedact(i, sensitiveKeys) as Record<string, unknown>,
    ),
    groundTruth: snapshot.groundTruth
      ? (deepRedact(snapshot.groundTruth, sensitiveKeys) as Record<string, unknown>)
      : undefined,
    sanitized: true,
  };
}

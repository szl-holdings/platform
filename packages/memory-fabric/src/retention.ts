import type { MemoryEntry, MemoryType, SensitivityLevel } from "./types.js";

const DEFAULT_TTL_BY_TYPE: Record<MemoryType, number | null> = {
  "working": 0.042,
  "session": 1,
  "episodic": 90,
  "semantic": null,
  "workflow": 7,
  "entity": 90,
  "artifact": 365,
  "operator-feedback": 730,
  "executive": 180,
  "skill": null,
};

const SENSITIVITY_LEVELS: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];

function sensitivityIdx(level: SensitivityLevel): number {
  return SENSITIVITY_LEVELS.indexOf(level);
}

export function applyRetentionDefaults(entry: MemoryEntry): MemoryEntry {
  const ttlDays = DEFAULT_TTL_BY_TYPE[entry.tier];
  if (!ttlDays || entry.retention.expiresAt) return entry;

  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  return {
    ...entry,
    retention: {
      ...entry.retention,
      maxAgeDays: ttlDays,
      expiresAt: expiresAt.toISOString(),
    },
  };
}

export function isExpired(entry: MemoryEntry): boolean {
  if (!entry.retention.expiresAt) return false;
  return new Date(entry.retention.expiresAt) < new Date();
}

export function markStale(entry: MemoryEntry): MemoryEntry {
  return {
    ...entry,
    freshness: { ...entry.freshness, isStale: true },
  };
}

export function checkSensitivity(
  entry: MemoryEntry,
  requesterSensitivityLevel: SensitivityLevel
): boolean {
  return sensitivityIdx(requesterSensitivityLevel) >= sensitivityIdx(entry.sensitivity);
}

export function redactEntry(
  entry: MemoryEntry,
  requesterSensitivityLevel: SensitivityLevel
): MemoryEntry | null {
  const entryIdx = sensitivityIdx(entry.sensitivity);
  const requesterIdx = sensitivityIdx(requesterSensitivityLevel);

  if (requesterIdx >= entryIdx) {
    return entry;
  }

  const gap = entryIdx - requesterIdx;

  if (gap >= 2) {
    return null;
  }

  return {
    ...entry,
    value: "[REDACTED]",
    summary: entry.summary ? "[REDACTED]" : undefined,
    metadata: {},
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
  };
}

export function isLowValue(entry: MemoryEntry): boolean {
  return entry.confidence < 0.3 && !entry.retention.pinned;
}

export function isProvenPlaybook(entry: MemoryEntry): boolean {
  return entry.tier === "skill" && entry.confidence >= 0.8;
}

export function getTTLByType(): Record<MemoryType, number | null> {
  return { ...DEFAULT_TTL_BY_TYPE };
}

import type { MemoryEntry, MemoryTier } from "./types.js";

const DEFAULT_TTL_BY_TIER: Record<MemoryTier, number | null> = {
  "session": 1,
  "workflow": 7,
  "entity": 90,
  "artifact": 365,
  "executive": 180,
  "domain": null,
  "operator-feedback": 730,
  "long-term": null,
};

export function applyRetentionDefaults(entry: MemoryEntry): MemoryEntry {
  const ttlDays = DEFAULT_TTL_BY_TIER[entry.tier];
  if (!ttlDays || entry.retention.expiresAt) return entry;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

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
  requesterSensitivityLevel: MemoryEntry["sensitivity"]
): boolean {
  const levels: MemoryEntry["sensitivity"][] = ["public", "internal", "confidential", "restricted"];
  const entryIdx = levels.indexOf(entry.sensitivity);
  const requesterIdx = levels.indexOf(requesterSensitivityLevel);
  return requesterIdx >= entryIdx;
}

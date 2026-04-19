/**
 * Lookup index that maps a stable narrative id (e.g. "sentra-ransomware",
 * "counsel-deadline") to the live identifiers produced when
 * `seedSignalMesh()` published the narrative into the running signal mesh.
 *
 * Consumers (such as the public `/api/narratives/:id` route) read the
 * recommendation, evidence items, and signals back out of the live mesh
 * stores via these ids — so payloads reflect the current mesh state
 * (decisions applied, status updates, freshness derived from the actual
 * publish timestamps) rather than re-running the narrative builders.
 */

export interface NarrativeMeshEntry {
  narrativeId: string;
  recommendationId: string;
  signalIds: string[];
  evidenceItemIds: string[];
  seededAt: string;
}

const index = new Map<string, NarrativeMeshEntry>();

export function registerNarrativeMeshEntry(entry: NarrativeMeshEntry): void {
  index.set(entry.narrativeId, entry);
}

export function getNarrativeMeshEntry(
  narrativeId: string,
): NarrativeMeshEntry | undefined {
  return index.get(narrativeId);
}

export function listNarrativeMeshEntries(): NarrativeMeshEntry[] {
  return Array.from(index.values());
}

export function clearNarrativeMeshIndex(): void {
  index.clear();
}

/**
 * Primitive 45 — Shadow registry
 *
 * Jung: the disowned, repressed, or unintegrated parts of the
 * psyche must still be named to be operational. The shadow
 * registry forces every system to enumerate states it does NOT
 * accept (failure modes, refusals, hidden assumptions) so they
 * cannot act unconsciously.
 */

export interface ShadowEntry {
  id: string;
  description: string;
  declaredAt: string; // ISO-8601
  acknowledged: boolean;
}

export class ShadowRegistry {
  private entries = new Map<string, ShadowEntry>();

  declare(entry: Omit<ShadowEntry, "acknowledged">): ShadowEntry {
    const e: ShadowEntry = { ...entry, acknowledged: false };
    this.entries.set(entry.id, e);
    return e;
  }

  acknowledge(id: string): boolean {
    const e = this.entries.get(id);
    if (!e) return false;
    e.acknowledged = true;
    return true;
  }

  list(): ShadowEntry[] {
    return [...this.entries.values()];
  }

  unacknowledged(): ShadowEntry[] {
    return this.list().filter((e) => !e.acknowledged);
  }

  /** A registry is integrated when every declared shadow is acknowledged. */
  isIntegrated(): boolean {
    return this.unacknowledged().length === 0 && this.entries.size > 0;
  }

  size(): number {
    return this.entries.size;
  }
}

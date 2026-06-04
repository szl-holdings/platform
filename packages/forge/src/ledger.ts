import type { ActionLedgerWriter, LedgerEntry } from './types.js';

export class InMemoryActionLedger implements ActionLedgerWriter {
  private readonly entries = new Map<string, LedgerEntry[]>();

  record(entry: LedgerEntry): void {
    const list = this.entries.get(entry.runId) ?? [];
    list.push({ ...entry, metadata: { ...entry.metadata } });
    this.entries.set(entry.runId, list);
  }

  getEntries(runId: string): LedgerEntry[] {
    return (this.entries.get(runId) ?? []).map((e) => ({ ...e, metadata: { ...e.metadata } }));
  }

  allEntries(): LedgerEntry[] {
    return Array.from(this.entries.values())
      .flat()
      .map((e) => ({ ...e, metadata: { ...e.metadata } }));
  }
}

export function makeLedgerEntry(
  runId: string,
  type: LedgerEntry['type'],
  description: string,
  opts: Partial<Omit<LedgerEntry, 'entryId' | 'runId' | 'type' | 'description' | 'timestamp'>> = {},
): LedgerEntry {
  return {
    entryId: `ledger-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    runId,
    type,
    description,
    timestamp: new Date().toISOString(),
    metadata: {},
    ...opts,
  };
}

export const defaultLedger = new InMemoryActionLedger();

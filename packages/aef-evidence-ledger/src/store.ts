import type { EvidenceEntry, LedgerQueryOptions } from './types.js';

export interface LedgerStore {
  append(entry: EvidenceEntry): void;
  get(entryId: string): EvidenceEntry | undefined;
  query(options: LedgerQueryOptions): EvidenceEntry[];
  count(): number;
  clear(): void;
}

function matchesQuery(entry: EvidenceEntry, options: LedgerQueryOptions): boolean {
  if (options.requestId !== undefined && entry.requestId !== options.requestId) return false;
  if (options.tenantId !== undefined && entry.tenantId !== options.tenantId) return false;
  if (options.profileId !== undefined && entry.profileId !== options.profileId) return false;
  if (options.sourceId !== undefined && entry.sourceId !== options.sourceId) return false;
  if (options.policyAllow !== undefined && entry.policyAllow !== options.policyAllow) return false;
  if (options.after !== undefined && entry.requestedAt < options.after) return false;
  if (options.before !== undefined && entry.requestedAt > options.before) return false;
  return true;
}

export class InMemoryLedgerStore implements LedgerStore {
  private readonly entries = new Map<string, EvidenceEntry>();
  private readonly insertOrder: string[] = [];

  append(entry: EvidenceEntry): void {
    if (this.entries.has(entry.entryId)) {
      throw new Error(`Ledger entry already exists: ${entry.entryId}`);
    }
    this.entries.set(entry.entryId, { ...entry });
    this.insertOrder.push(entry.entryId);
  }

  get(entryId: string): EvidenceEntry | undefined {
    return this.entries.get(entryId);
  }

  query(options: LedgerQueryOptions): EvidenceEntry[] {
    const { limit = 100, offset = 0 } = options;

    const matched: EvidenceEntry[] = [];
    for (const id of this.insertOrder) {
      const entry = this.entries.get(id);
      if (entry && matchesQuery(entry, options)) {
        matched.push(entry);
      }
    }

    return matched.slice(offset, offset + limit);
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
    this.insertOrder.length = 0;
  }
}

export class MutableLedgerStore implements LedgerStore {
  private backend: LedgerStore;

  constructor(initial: LedgerStore = new InMemoryLedgerStore()) {
    this.backend = initial;
  }

  setBackend(store: LedgerStore): void {
    this.backend = store;
  }

  getBackend(): LedgerStore {
    return this.backend;
  }

  append(entry: EvidenceEntry): void {
    this.backend.append(entry);
  }
  get(entryId: string): EvidenceEntry | undefined {
    return this.backend.get(entryId);
  }
  query(options: LedgerQueryOptions): EvidenceEntry[] {
    return this.backend.query(options);
  }
  count(): number {
    return this.backend.count();
  }
  clear(): void {
    this.backend.clear();
  }
}

export const defaultLedgerStore: MutableLedgerStore = new MutableLedgerStore();

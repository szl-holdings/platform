import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { EvidenceEntry, LedgerQueryOptions } from "./types.js";
import type { LedgerStore } from "./store.js";

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

export class FilesystemLedgerStore implements LedgerStore {
  private readonly filePath: string;
  private readonly index = new Map<string, number>();

  constructor(filePath: string) {
    this.filePath = filePath;
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (!existsSync(filePath)) {
      writeFileSync(filePath, "", "utf8");
    }
    this.buildIndex();
  }

  private buildIndex(): void {
    const content = readFileSync(this.filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as EvidenceEntry;
        if (typeof entry.entryId === "string") {
          this.index.set(entry.entryId, this.index.size);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  private readAll(): EvidenceEntry[] {
    const content = readFileSync(this.filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const entries: EvidenceEntry[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as EvidenceEntry;
        entries.push(entry);
      } catch {
        // skip malformed lines
      }
    }
    return entries;
  }

  append(entry: EvidenceEntry): void {
    if (this.index.has(entry.entryId)) {
      throw new Error(`Ledger entry already exists: ${entry.entryId}`);
    }
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf8");
    this.index.set(entry.entryId, this.index.size);
  }

  get(entryId: string): EvidenceEntry | undefined {
    if (!this.index.has(entryId)) return undefined;
    return this.readAll().find((e) => e.entryId === entryId);
  }

  query(options: LedgerQueryOptions): EvidenceEntry[] {
    const { limit = 100, offset = 0 } = options;
    const all = this.readAll();
    const matched = all.filter((e) => matchesQuery(e, options));
    return matched.slice(offset, offset + limit);
  }

  count(): number {
    return this.index.size;
  }

  clear(): void {
    writeFileSync(this.filePath, "", "utf8");
    this.index.clear();
  }
}

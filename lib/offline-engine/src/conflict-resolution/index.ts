import type { StorageAdapter } from "../storage/interface";

export type ConflictSeverity = "low" | "medium" | "high" | "critical";
export type ConflictResolution = "auto-local" | "auto-server" | "pending-review";

export interface ConflictRecord {
  id: string;
  domain: string;
  entityType: string;
  entityId: string;
  commandId: string;
  localTimestamp: number;
  serverTimestamp: number;
  localValue: unknown;
  serverValue: unknown;
  severity: ConflictSeverity;
  resolution: ConflictResolution;
  resolvedAt?: number;
  resolvedBy?: string;
  createdAt: number;
}

export interface ConflictDetectionOptions {
  storage: StorageAdapter;
  storeName?: string;
  autoResolveSeverities?: ConflictSeverity[];
}

const STORE_NAME = "conflict-queue";

export class ConflictResolver {
  private storage: StorageAdapter;
  private storeName: string;
  private autoResolveSeverities: Set<ConflictSeverity>;

  constructor(options: ConflictDetectionOptions) {
    this.storage = options.storage;
    this.storeName = options.storeName ?? STORE_NAME;
    this.autoResolveSeverities = new Set(
      options.autoResolveSeverities ?? ["low", "medium"]
    );
  }

  async detect(params: {
    domain: string;
    entityType: string;
    entityId: string;
    commandId: string;
    localTimestamp: number;
    serverTimestamp: number;
    localValue: unknown;
    serverValue: unknown;
    severity?: ConflictSeverity;
  }): Promise<ConflictRecord | null> {
    if (params.localTimestamp >= params.serverTimestamp) {
      return null;
    }

    const severity = params.severity ?? "medium";
    const isAutoResolvable = this.autoResolveSeverities.has(severity);
    const resolution: ConflictResolution = isAutoResolvable
      ? "auto-server"
      : "pending-review";

    const conflict: ConflictRecord = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      domain: params.domain,
      entityType: params.entityType,
      entityId: params.entityId,
      commandId: params.commandId,
      localTimestamp: params.localTimestamp,
      serverTimestamp: params.serverTimestamp,
      localValue: params.localValue,
      serverValue: params.serverValue,
      severity,
      resolution,
      createdAt: Date.now(),
    };

    if (resolution === "pending-review") {
      await this.storage.put(this.storeName, conflict.id, conflict);
    } else {
      conflict.resolvedAt = Date.now();
    }

    return conflict;
  }

  async getPendingConflicts(domain?: string): Promise<ConflictRecord[]> {
    const all = await this.storage.getAll<ConflictRecord>(this.storeName);
    return domain
      ? all.filter((c) => c.domain === domain && !c.resolvedAt)
      : all.filter((c) => !c.resolvedAt);
  }

  async resolve(
    conflictId: string,
    resolution: "local" | "server",
    resolvedBy?: string
  ): Promise<ConflictRecord | null> {
    const conflict = await this.storage.get<ConflictRecord>(this.storeName, conflictId);
    if (!conflict) return null;

    const updated: ConflictRecord = {
      ...conflict,
      resolution: resolution === "local" ? "auto-local" : "auto-server",
      resolvedAt: Date.now(),
      resolvedBy,
    };

    await this.storage.delete(this.storeName, conflictId);
    return updated;
  }

  async getConflictCount(domain?: string): Promise<number> {
    const pending = await this.getPendingConflicts(domain);
    return pending.length;
  }
}

import type { ConflictResolver } from '../conflict-resolution/index';
import type { StorageAdapter } from '../storage/interface';

export type CommandMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type CommandPriority = 'critical' | 'high' | 'normal' | 'low';

export interface OfflineCommand {
  id: string;
  domain: string;
  type: string;
  method: CommandMethod;
  url: string;
  body?: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: CommandPriority;
  metadata?: Record<string, unknown>;
}

export interface CommandQueueOptions {
  storage: StorageAdapter;
  maxCommands?: number;
  maxRetries?: number;
  storeName?: string;
  conflictResolver?: ConflictResolver;
}

export interface CommandReplayResult {
  replayed: number;
  failed: number;
  conflicts: number;
  commands: OfflineCommand[];
}

const STORE_NAME = 'offline-commands';

export class CommandQueue {
  private storage: StorageAdapter;
  private maxCommands: number;
  private maxRetries: number;
  private storeName: string;
  private conflictResolver?: ConflictResolver | undefined;

  constructor(options: CommandQueueOptions) {
    this.storage = options.storage;
    this.maxCommands = options.maxCommands ?? 200;
    this.maxRetries = options.maxRetries ?? 5;
    this.storeName = options.storeName ?? STORE_NAME;
    this.conflictResolver = options.conflictResolver;
  }

  async enqueue(
    command: Omit<OfflineCommand, 'id' | 'timestamp' | 'retries'>,
  ): Promise<OfflineCommand> {
    const count = await this.storage.count(this.storeName);
    if (count >= this.maxCommands) {
      const all = await this.getAll();
      const lowPriority = all.filter((c) => c.priority === 'low');
      if (lowPriority.length > 0) {
        await this.storage.delete(this.storeName, lowPriority[0]!.id);
      } else {
        throw new Error('Offline command queue is full');
      }
    }

    const entry: OfflineCommand = {
      ...command,
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: command.maxRetries ?? this.maxRetries,
    };

    await this.storage.put(this.storeName, entry.id, entry);
    return entry;
  }

  async dequeue(id: string): Promise<void> {
    await this.storage.delete(this.storeName, id);
  }

  async getAll(domain?: string): Promise<OfflineCommand[]> {
    const all = await this.storage.getAll<OfflineCommand>(this.storeName);
    if (domain) return all.filter((c) => c.domain === domain);
    return all.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.timestamp - b.timestamp;
    });
  }

  async count(domain?: string): Promise<number> {
    if (!domain) return this.storage.count(this.storeName);
    const all = await this.getAll(domain);
    return all.length;
  }

  async replay(
    getHeaders: () => Promise<Record<string, string>>,
    domain?: string,
  ): Promise<CommandReplayResult> {
    const queue = await this.getAll(domain);
    if (queue.length === 0) return { replayed: 0, failed: 0, conflicts: 0, commands: [] };

    const headers = await getHeaders();
    const failedCommands: OfflineCommand[] = [];
    let replayed = 0;
    let conflictCount = 0;

    for (const command of queue) {
      try {
        const res = await fetch(command.url, {
          method: command.method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          ...(command.body !== undefined && { body: JSON.stringify(command.body) }),
        });

        if (res.ok) {
          await this.dequeue(command.id);
          replayed++;
        } else if (res.status === 409 && this.conflictResolver) {
          let serverValue: unknown = null;
          try {
            serverValue = await res.json();
          } catch {}
          await this.conflictResolver.detect({
            domain: command.domain,
            entityType: command.type,
            entityId: String((command.body as Record<string, unknown>)?.id ?? command.id),
            commandId: command.id,
            localTimestamp: command.timestamp,
            serverTimestamp: Date.now(),
            localValue: command.body,
            serverValue,
            severity:
              command.priority === 'critical' || command.priority === 'high' ? 'high' : 'medium',
          });
          conflictCount++;
          await this.dequeue(command.id);
        } else if (res.status === 401 || res.status === 403) {
          const updated = { ...command, retries: command.retries + 1 };
          if (updated.retries > updated.maxRetries) {
            await this.dequeue(command.id);
          } else {
            await this.storage.put(this.storeName, command.id, updated);
            failedCommands.push(updated);
          }
        } else if (res.status === 422) {
          await this.dequeue(command.id);
        } else if (res.status >= 400 && res.status < 500) {
          await this.dequeue(command.id);
        } else {
          const updated = { ...command, retries: command.retries + 1 };
          if (updated.retries > updated.maxRetries) {
            await this.dequeue(command.id);
          } else {
            await this.storage.put(this.storeName, command.id, updated);
            failedCommands.push(updated);
          }
        }
      } catch {
        const updated = { ...command, retries: command.retries + 1 };
        if (updated.retries > updated.maxRetries) {
          await this.dequeue(command.id);
        } else {
          await this.storage.put(this.storeName, command.id, updated);
          failedCommands.push(updated);
        }
      }
    }

    return {
      replayed,
      failed: failedCommands.length,
      conflicts: conflictCount,
      commands: failedCommands,
    };
  }

  async clear(domain?: string): Promise<void> {
    if (!domain) {
      await this.storage.clear(this.storeName);
      return;
    }
    const all = await this.getAll(domain);
    for (const cmd of all) {
      await this.dequeue(cmd.id);
    }
  }
}

import type { EmbeddingBackend } from './backends/interface.js';

export interface WarmPoolEntry {
  backendId: string;
  lastUsedAt: number;
  healthy: boolean;
  latencyMs?: number;
}

export class WarmPool {
  private readonly entries = new Map<string, WarmPoolEntry>();
  private readonly backends: EmbeddingBackend[];
  private pingIntervalId: ReturnType<typeof setInterval> | undefined = undefined;

  constructor(backends: EmbeddingBackend[], keepAliveIntervalMs = 30_000) {
    this.backends = backends;

    for (const b of backends) {
      this.entries.set(b.descriptor.backendId, {
        backendId: b.descriptor.backendId,
        lastUsedAt: 0,
        healthy: false,
      });
    }

    this.pingIntervalId = setInterval(() => {
      void this.pingAll();
    }, keepAliveIntervalMs);
  }

  async pingAll(): Promise<void> {
    await Promise.allSettled(
      this.backends.map(async (b) => {
        try {
          const result = await b.health();
          this.entries.set(b.descriptor.backendId, {
            backendId: b.descriptor.backendId,
            lastUsedAt: Date.now(),
            healthy: result.healthy,
            ...(result.latencyMs !== undefined && { latencyMs: result.latencyMs }),
          });
        } catch {
          const existing = this.entries.get(b.descriptor.backendId);
          this.entries.set(b.descriptor.backendId, {
            backendId: b.descriptor.backendId,
            lastUsedAt: existing?.lastUsedAt ?? 0,
            healthy: false,
          });
        }
      }),
    );
  }

  markUsed(backendId: string): void {
    const entry = this.entries.get(backendId);
    if (entry) {
      this.entries.set(backendId, { ...entry, lastUsedAt: Date.now() });
    }
  }

  getStatus(): WarmPoolEntry[] {
    return Array.from(this.entries.values());
  }

  stop(): void {
    if (this.pingIntervalId !== undefined) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = undefined;
    }
  }
}

/**
 * SignalBus — in-process pub/sub for Signal events.
 *
 * Every stage of the pipeline publishes enriched signals back to the bus.
 * Subscribers (UI, API server, connectors) can react in real time.
 */

import type { Signal } from "@workspace/ontology";

export type SignalHandler = (signal: Signal) => void | Promise<void>;

export interface SignalSubscription {
  unsubscribe(): void;
}

export class SignalBus {
  private readonly handlers = new Map<string, Set<SignalHandler>>();
  private readonly wildcardHandlers = new Set<SignalHandler>();
  private readonly buffer: Signal[] = [];
  private readonly MAX_BUFFER = 5_000;

  on(type: Signal["type"] | "*", handler: SignalHandler): SignalSubscription {
    if (type === "*") {
      this.wildcardHandlers.add(handler);
      return { unsubscribe: () => this.wildcardHandlers.delete(handler) };
    }
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
    return { unsubscribe: () => set.delete(handler) };
  }

  publish(signal: Signal): void {
    this.buffer.push(signal);
    if (this.buffer.length > this.MAX_BUFFER) this.buffer.shift();

    const typed = this.handlers.get(signal.type);
    if (typed) {
      for (const h of typed) {
        try {
          const r = h(signal);
          if (r instanceof Promise) r.catch((e: unknown) => console.error("[SignalBus] handler error:", e));
        } catch (e) {
          console.error("[SignalBus] sync handler error:", e);
        }
      }
    }
    for (const h of this.wildcardHandlers) {
      try {
        const r = h(signal);
        if (r instanceof Promise) r.catch((e: unknown) => console.error("[SignalBus] wildcard handler error:", e));
      } catch (e) {
        console.error("[SignalBus] sync wildcard handler error:", e);
      }
    }
  }

  snapshot(filter?: {
    domain?: Signal["domain"];
    type?: Signal["type"];
    tenantId?: string;
    limit?: number;
  }): Signal[] {
    let results = [...this.buffer];
    if (filter?.domain) results = results.filter((s) => s.domain === filter.domain);
    if (filter?.type) results = results.filter((s) => s.type === filter.type);
    if (filter?.tenantId) results = results.filter((s) => s.tenantId === filter.tenantId);
    results = results.slice(-(filter?.limit ?? 200));
    return results.reverse();
  }

  count(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer.length = 0;
  }
}

export const defaultSignalBus = new SignalBus();

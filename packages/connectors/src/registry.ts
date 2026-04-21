/**
 * Connector Registry
 *
 * Manages all active connector adapters.
 * Wires each adapter to the signal pipeline so every connector
 * event automatically flows through the 9-stage mesh.
 */

import type { Signal, SignalInput } from "@workspace/ontology/signal";
import type { ConnectorAdapter, ConnectorCategory } from "./interfaces.js";

export interface ConnectorRegistryEntry {
  adapter: ConnectorAdapter;
  startedAt?: string;
  signalsEmitted: number;
  lastSignalAt?: string;
}

export class ConnectorRegistry {
  private readonly adapters = new Map<string, ConnectorRegistryEntry>();
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  register(adapter: ConnectorAdapter): void {
    this.adapters.set(adapter.metadata.connectorId, {
      adapter,
      signalsEmitted: 0,
    });
  }

  setEmitSignal(fn: (input: SignalInput) => Promise<Signal>): void {
    this._emitSignal = fn;
  }

  async startAll(): Promise<void> {
    if (!this._emitSignal) throw new Error('Call setEmitSignal() before startAll()');
    const emitter = this._emitSignal;

    for (const [id, entry] of this.adapters) {
      const wrapped = async (input: SignalInput): Promise<Signal> => {
        const signal = await emitter(input);
        entry.signalsEmitted++;
        entry.lastSignalAt = new Date().toISOString();
        return signal;
      };

      try {
        await entry.adapter.start(wrapped);
        entry.startedAt = new Date().toISOString();
        console.log(`[connectors] started: ${id}`);
      } catch (err) {
        console.error(`[connectors] failed to start ${id}:`, err);
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const [id, entry] of this.adapters) {
      try {
        await entry.adapter.stop();
      } catch (err) {
        console.error(`[connectors] failed to stop ${id}:`, err);
      }
    }
  }

  async pollAll(): Promise<Signal[]> {
    if (!this._emitSignal) return [];
    const all: Signal[] = [];
    for (const entry of this.adapters.values()) {
      try {
        const signals = await entry.adapter.poll();
        all.push(...signals);
      } catch (err) {
        console.error(`[connectors] poll error on ${entry.adapter.metadata.connectorId}:`, err);
      }
    }
    return all;
  }

  list(): Array<{
    connectorId: string;
    name: string;
    category: ConnectorCategory;
    status: string;
    signalsEmitted: number;
    startedAt?: string;
    lastSignalAt?: string;
  }> {
    return Array.from(this.adapters.entries()).map(([id, entry]) => ({
      connectorId: id,
      name: entry.adapter.metadata.connectorName,
      category: entry.adapter.metadata.category,
      status: entry.adapter.status(),
      signalsEmitted: entry.signalsEmitted,
      ...(entry.startedAt !== undefined ? { startedAt: entry.startedAt } : {}),
      ...(entry.lastSignalAt !== undefined ? { lastSignalAt: entry.lastSignalAt } : {}),
    }));
  }

  get(connectorId: string): ConnectorRegistryEntry | undefined {
    return this.adapters.get(connectorId);
  }
}

export const defaultConnectorRegistry = new ConnectorRegistry();

/**
 * Built-in connector registry. Adding a new connector is a one-liner here.
 */

import { maritimeAisConnector } from './connectors/maritime-ais';
import { realEstateConnector } from './connectors/real-estate';
import { sanctionsConnector } from './connectors/sanctions';
import type { DemoAdapter, DemoAdapterEvent } from './demo-adapters';
import type { Connector } from './types';

export const BUILT_IN_CONNECTORS: ReadonlyArray<Connector<unknown>> = [
  realEstateConnector as unknown as Connector<unknown>,
  maritimeAisConnector as unknown as Connector<unknown>,
  sanctionsConnector as unknown as Connector<unknown>,
];

export function findConnector(id: string): Connector<unknown> | undefined {
  return BUILT_IN_CONNECTORS.find((c) => c.id === id);
}

/**
 * Mutable in-process registry for demo adapters. Consumed by
 * `@szl-holdings/demo-seed` for signal-mesh seeding.
 *
 * API contract (consumed by seed-signal-mesh.ts):
 *   setEmitSignal(cb)  — wire a callback that processes each emitted event
 *   register(adapter)  — add a DemoAdapter instance
 *   startAll()         — emit from every registered adapter, routing through
 *                        the signal callback
 */
export type EmitSignalFn = (input: DemoAdapterEvent) => Promise<unknown>;

class ConnectorRegistry {
  private readonly adapters: DemoAdapter[] = [];
  private emitSignal: EmitSignalFn | null = null;

  setEmitSignal(fn: EmitSignalFn): void {
    this.emitSignal = fn;
  }

  register(adapter: DemoAdapter): void {
    this.adapters.push(adapter);
  }

  async startAll(): Promise<void> {
    for (const adapter of this.adapters) {
      const events = await adapter.emit();
      for (const event of events) {
        if (this.emitSignal) {
          await this.emitSignal(event);
        }
      }
    }
  }

  get(id: string): DemoAdapter | undefined {
    return this.adapters.find((a) => a.id === id);
  }

  list(): ReadonlyArray<DemoAdapter> {
    return this.adapters;
  }

  clear(): void {
    this.adapters.length = 0;
    this.emitSignal = null;
  }
}

export const defaultConnectorRegistry = new ConnectorRegistry();

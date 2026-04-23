/**
 * Built-in connector registry. Adding a new connector is a one-liner here.
 */

import { maritimeAisConnector } from './connectors/maritime-ais';
import { realEstateConnector } from './connectors/real-estate';
import { sanctionsConnector } from './connectors/sanctions';
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
 * Mutable in-process registry for runtime-registered connectors and demo
 * adapters. Consumed by the demo-seed package for signal-mesh seeding.
 */
class ConnectorRegistry {
  private readonly entries = new Map<string, unknown>();

  register(id: string, instance: unknown): void {
    this.entries.set(id, instance);
  }

  get(id: string): unknown {
    return this.entries.get(id);
  }

  list(): ReadonlyArray<{ id: string; instance: unknown }> {
    return Array.from(this.entries.entries()).map(([id, instance]) => ({ id, instance }));
  }

  clear(): void {
    this.entries.clear();
  }
}

export const defaultConnectorRegistry = new ConnectorRegistry();

import type { SourceConnector, DestinationConnector } from './connector-protocol';

const sourceRegistry = new Map<string, SourceConnector>();
const destinationRegistry = new Map<string, DestinationConnector>();

export function registerSource(connector: SourceConnector): void {
  sourceRegistry.set(connector.type, connector);
}

export function registerDestination(connector: DestinationConnector): void {
  destinationRegistry.set(connector.type, connector);
}

export function getSource(type: string): SourceConnector | undefined {
  return sourceRegistry.get(type);
}

export function getDestination(type: string): DestinationConnector | undefined {
  return destinationRegistry.get(type);
}

export function listSources(): string[] {
  return Array.from(sourceRegistry.keys());
}

export function listDestinations(): string[] {
  return Array.from(destinationRegistry.keys());
}

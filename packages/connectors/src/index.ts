/**
 * @szl-holdings/connectors
 *
 * Typed connector interfaces and synthetic demo adapters.
 * Each adapter emits typed Signals into the signal mesh.
 *
 * Usage:
 *   import { defaultConnectorRegistry, AISMaritimeDemoAdapter } from '@szl-holdings/connectors';
 *   import { defaultPipeline } from '@szl-holdings/signal-mesh';
 *
 *   defaultConnectorRegistry.setEmitSignal((input) => defaultPipeline.process(input).then(r => r.signal));
 *   defaultConnectorRegistry.register(new AISMaritimeDemoAdapter());
 *   await defaultConnectorRegistry.startAll();
 */

export * from './adapters/index.js';
export * from './interfaces.js';
export * from './registry.js';

export const CONNECTORS_VERSION = '1.0.0' as const;

export const CONNECTOR_CATEGORIES = [
  'email-calendar',
  'messaging',
  'crm-project',
  'storage-docs',
  'webhooks',
  'ais-maritime',
  'property-ops',
  'security-tools',
  'legal-matter',
] as const;

import type { PluginCapabilityId } from './types.js';

export const REQUIRED_CAPABILITIES: PluginCapabilityId[] = [
  'governance:proof-chain',
  'governance:autonomy',
];

export const RECOMMENDED_CAPABILITIES: PluginCapabilityId[] = [
  'ui:command-card',
  'api:public',
  'webhook:events',
];

export const ALL_CAPABILITIES: Array<{ id: PluginCapabilityId; description: string; required: boolean }> = [
  { id: 'domain:intelligence', description: 'Provides AI-driven domain intelligence', required: false },
  { id: 'domain:alerts', description: 'Emits alerts into the command inbox', required: false },
  { id: 'domain:timeline', description: 'Contributes a timeline of domain events', required: false },
  { id: 'domain:documents', description: 'Manages domain documents with provenance', required: false },
  { id: 'ui:command-card', description: 'Renders a command card in unified command center', required: false },
  { id: 'ui:dashboard', description: 'Renders a full domain dashboard', required: false },
  { id: 'billing:metered', description: 'Usage metered through platform billing', required: false },
  { id: 'governance:proof-chain', description: 'All AI outputs are cryptographically proof-chained', required: true },
  { id: 'governance:autonomy', description: 'Respects platform autonomy mode and governance policies', required: true },
  { id: 'api:public', description: 'Exposes domain data through public API v1', required: false },
  { id: 'webhook:events', description: 'Emits domain events to webhook subscribers', required: false },
];

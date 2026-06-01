/**
 * @szl-holdings/plugin-host
 *
 * Plugin / extension host framework. Defines the contract a new domain
 * module must implement to inherit governance, proof chain, design system,
 * and billing automatically.
 *
 * New domain modules implement PluginDefinition and register themselves
 * with the PluginHost. The host validates the contract, resolves capabilities,
 * and wires the module into platform services.
 *
 * @example
 * ```typescript
 * import { PluginHost, definePlugin } from '@szl-holdings/plugin-host';
 *
 * const myPlugin = definePlugin({
 *   slug: 'my-domain',
 *   name: 'My Domain Module',
 *   version: '1.0.0',
 *   capabilities: ['governance:proof-chain', 'governance:autonomy', 'domain:intelligence'],
 *   async onInstall({ orgId, config }) {
 *     // Initialize org-specific resources
 *   },
 *   async onEvent(event) {
 *     // Handle platform events
 *   },
 * });
 *
 * const host = PluginHost.getInstance();
 * host.register(myPlugin);
 * ```
 */

export * from './types.js';
export * from './host.js';
export * from './define.js';
export * from './capabilities.js';

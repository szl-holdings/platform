import type { PluginCapabilityId, PluginDefinition } from './types.js';
import { REQUIRED_CAPABILITIES } from './capabilities.js';

/**
 * definePlugin — type-safe helper for declaring a plugin with enforced contract.
 *
 * Validates that required capabilities are included at definition time.
 * Returns a strongly-typed PluginDefinition ready for registration.
 */
export function definePlugin(
  definition: Omit<PluginDefinition, 'governanceInherited' | 'proofChainEnabled'> & {
    governanceInherited?: boolean;
    proofChainEnabled?: boolean;
  },
): PluginDefinition {
  const missing = REQUIRED_CAPABILITIES.filter(
    (cap) => !definition.capabilities.includes(cap as PluginCapabilityId),
  );

  if (missing.length > 0) {
    throw new Error(
      `Plugin '${definition.slug}' is missing required capabilities: ${missing.join(', ')}. ` +
      `These ensure all platform governance policies apply. ` +
      `Add them to the capabilities array.`,
    );
  }

  return {
    governanceInherited: true,
    proofChainEnabled: true,
    ...definition,
  };
}
